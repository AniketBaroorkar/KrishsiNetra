from django.db.models import Avg
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .fraud import calculate_fraud_score
from .models import CropSubmission, Farm, Farmer
from .satellite_service import SatelliteServiceError, fetch_satellite_ndvi
from .serializers import (
    CropClassificationResultSerializer,
    CropClassificationSerializer,
    CropSubmissionSerializer,
    DashboardStatsSerializer,
    FarmSerializer,
    FarmerSerializer,
    FraudCheckResultSerializer,
    FraudCheckSerializer,
    SatelliteFetchResultSerializer,
    SatelliteFetchSerializer,
)


class FarmerCreateView(generics.CreateAPIView):
    queryset = Farmer.objects.all()
    serializer_class = FarmerSerializer


class FarmCreateView(generics.CreateAPIView):
    queryset = Farm.objects.select_related("farmer").all()
    serializer_class = FarmSerializer


class CropSubmissionListCreateView(generics.ListCreateAPIView):
    queryset = CropSubmission.objects.select_related("farm", "farm__farmer").all()
    serializer_class = CropSubmissionSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = super().get_queryset()
        is_fraud = self.request.query_params.get("is_fraud")

        if is_fraud is None:
            return queryset

        normalized = is_fraud.strip().lower()
        if normalized in {"true", "1", "yes"}:
            return queryset.filter(is_fraud=True)
        if normalized in {"false", "0", "no"}:
            return queryset.filter(is_fraud=False)
        return queryset.none()

    def perform_create(self, serializer):
        submission = serializer.save()

        try:
            from api_integration import classify_crop

            prediction = classify_crop(submission.submission_photo.path)
        except Exception as exc:
            submission.delete()
            raise ValidationError(
                {
                    "submission_photo": (
                        "Crop classification failed. Train the model with "
                        "`python train.py` and ensure crop_model.pth exists."
                    ),
                    "detail": str(exc),
                }
            ) from exc

        predicted_crop = prediction["predicted_crop"]
        confidence_score = round(float(prediction["confidence"]) / 100.0, 4)
        claimed_matches_prediction = predicted_crop == submission.claimed_crop

        if claimed_matches_prediction:
            risk_score = round(1.0 - confidence_score, 2)
            is_fraud = False
            fraud_reason = "claimed crop matches AI prediction"
            status = CropSubmission.StatusChoices.VERIFIED
        else:
            risk_score = round(confidence_score, 2)
            is_fraud = confidence_score >= 0.7
            fraud_reason = "claimed crop does not match AI prediction"
            status = (
                CropSubmission.StatusChoices.FLAGGED
                if is_fraud
                else CropSubmission.StatusChoices.PENDING
            )

        submission.predicted_crop = predicted_crop
        submission.confidence_score = confidence_score
        submission.risk_score = risk_score
        submission.is_fraud = is_fraud
        submission.fraud_reason = fraud_reason
        submission.status = status
        submission.save(
            update_fields=[
                "predicted_crop",
                "confidence_score",
                "risk_score",
                "is_fraud",
                "fraud_reason",
                "status",
            ]
        )


class DashboardStatsView(APIView):
    def get(self, request):
        avg_risk = CropSubmission.objects.aggregate(avg=Avg("risk_score"))["avg"] or 0.0
        data = {
            "total_farms": Farm.objects.count(),
            "total_fraud": CropSubmission.objects.filter(is_fraud=True).count(),
            "avg_risk_score": round(float(avg_risk), 2),
        }
        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)


class CropClassificationView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = CropClassificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_image = serializer.validated_data["image"]
        temporary_path = None

        try:
            import tempfile
            from api_integration import classify_crop

            suffix = uploaded_image.name.rsplit(".", 1)[-1] if "." in uploaded_image.name else "jpg"
            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{suffix}") as temp_file:
                for chunk in uploaded_image.chunks():
                    temp_file.write(chunk)
                temporary_path = temp_file.name

            prediction = classify_crop(temporary_path)
        except Exception as exc:
            raise ValidationError(
                {
                    "image": (
                        "Crop classification failed. Train the ResNet18 model with "
                        "`python train.py` and ensure crop_model.pth exists."
                    ),
                    "detail": str(exc),
                }
            ) from exc
        finally:
            if temporary_path:
                from pathlib import Path

                Path(temporary_path).unlink(missing_ok=True)

        result = {
            "predicted_crop": prediction["predicted_crop"],
            "confidence_score": round(float(prediction["confidence"]) / 100.0, 4),
        }
        result_serializer = CropClassificationResultSerializer(result)
        return Response(result_serializer.data)


class SatelliteFetchView(APIView):
    def post(self, request):
        serializer = SatelliteFetchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = fetch_satellite_ndvi(
                gps_lat=serializer.validated_data["gps_lat"],
                gps_lon=serializer.validated_data["gps_lon"],
            )
        except SatelliteServiceError as exc:
            raise ValidationError({"satellite": str(exc)}) from exc

        result_serializer = SatelliteFetchResultSerializer(result)
        return Response(result_serializer.data)


class FraudCheckView(APIView):
    def post(self, request):
        serializer = FraudCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = calculate_fraud_score(
            claimed_crop=serializer.validated_data["claimed_crop"],
            predicted_crop=serializer.validated_data["predicted_crop"],
            confidence=serializer.validated_data["confidence"],
            gps_distance_km=serializer.validated_data["gps_distance_km"],
            ndvi=serializer.validated_data.get("ndvi"),
        )
        result_serializer = FraudCheckResultSerializer(result)
        return Response(result_serializer.data)
