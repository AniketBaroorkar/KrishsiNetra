from django.db.models import Avg
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.http import HttpResponse

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

DEMO_MOBILE_SUBMISSIONS = []
DEMO_ALERTS = []


def farmer_records_payload():
    submissions = CropSubmission.objects.select_related("farm", "farm__farmer").all()
    records = []
    for submission in submissions:
        claim = serialize_claim(submission)
        records.append(
            {
                "farmerId": f"API-FRM-{submission.farm.farmer_id}",
                "farmerName": claim["farmerName"],
                "mobileNumber": claim["phone"],
                "village": claim["village"],
                "taluka": claim["taluka"],
                "district": claim["district"],
                "state": "Maharashtra",
                "cropType": claim["cropClaimed"],
                "predictedCrop": claim["predictedCrop"],
                "farmArea": float(submission.farm.area_acres),
                "surveyNumber": claim["surveyNo"],
                "latitude": claim["gpsLat"],
                "longitude": claim["gpsLon"],
                "photoUrl": claim["photoUrl"],
                "submissionDate": claim["submittedDate"],
                "claimStatus": claim["status"],
                "riskScore": claim["riskScore"],
                "confidenceScore": claim["confidenceScore"],
                "disasterAlertStatus": "Not Sent",
                "alertHistory": [],
            }
        )
    records.extend(DEMO_MOBILE_SUBMISSIONS)
    return records


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


def serialize_claim(submission):
    farmer = submission.farm.farmer
    return {
        "id": submission.id,
        "farmerName": farmer.name,
        "phone": farmer.phone,
        "village": farmer.village,
        "taluka": farmer.taluka,
        "district": farmer.district,
        "cropClaimed": submission.get_claimed_crop_display(),
        "predictedCrop": submission.predicted_crop or "Pending",
        "gpsLat": float(submission.gps_lat) if submission.gps_lat is not None else None,
        "gpsLon": float(submission.gps_lon) if submission.gps_lon is not None else None,
        "hasPhoto": bool(submission.submission_photo),
        "photoUrl": submission.submission_photo.url if submission.submission_photo else "",
        "confidenceScore": submission.confidence_score,
        "riskScore": submission.risk_score,
        "status": submission.get_status_display(),
        "submittedDate": submission.submitted_at.date().isoformat(),
        "fraudReason": submission.fraud_reason,
        "satelliteResult": (
            f"NDVI value {submission.ndvi_value:.2f} from satellite verification."
            if submission.ndvi_value is not None
            else "Satellite verification result pending."
        ),
        "claimAmount": "Rs. 30,000",
        "surveyNo": submission.farm.survey_number,
    }


class ClaimListCreateView(APIView):
    def get(self, request):
        submissions = CropSubmission.objects.select_related("farm", "farm__farmer").all()
        return Response([serialize_claim(submission) for submission in submissions])

    def post(self, request):
        return Response(
            {
                "detail": (
                    "Use /api/submissions/ for multipart crop photo submissions. "
                    "The dashboard reads /api/claims/ for officer review."
                )
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class ClaimDetailView(APIView):
    def get(self, request, pk):
        submission = generics.get_object_or_404(
            CropSubmission.objects.select_related("farm", "farm__farmer"),
            pk=pk,
        )
        return Response(serialize_claim(submission))


class ClaimStatusUpdateView(APIView):
    allowed_statuses = {
        "Pending": CropSubmission.StatusChoices.PENDING,
        "Verified": CropSubmission.StatusChoices.VERIFIED,
        "Approved": CropSubmission.StatusChoices.APPROVED,
        "Rejected": CropSubmission.StatusChoices.REJECTED,
        "Flagged": CropSubmission.StatusChoices.FLAGGED,
        "High Risk": CropSubmission.StatusChoices.FLAGGED,
    }

    def patch(self, request, pk):
        submission = generics.get_object_or_404(
            CropSubmission.objects.select_related("farm", "farm__farmer"),
            pk=pk,
        )
        requested_status = request.data.get("status")
        if requested_status not in self.allowed_statuses:
            raise ValidationError({"status": "Use Approved, Rejected, Flagged, Pending, or Verified."})

        submission.status = self.allowed_statuses[requested_status]
        submission.is_fraud = requested_status in {"Flagged", "High Risk"}
        if requested_status == "Rejected" and not submission.fraud_reason:
            submission.fraud_reason = "Rejected by officer during manual review."
        submission.save(update_fields=["status", "is_fraud", "fraud_reason"])
        return Response(serialize_claim(submission))


class FarmerRecordsView(APIView):
    def get(self, request):
        return Response(farmer_records_payload())


class FarmerCsvExportView(APIView):
    def get(self, request):
        columns = [
            ("Farmer ID", "farmerId"),
            ("Farmer Name", "farmerName"),
            ("Mobile Number", "mobileNumber"),
            ("Village", "village"),
            ("Taluka", "taluka"),
            ("District", "district"),
            ("State", "state"),
            ("Crop Type", "cropType"),
            ("Farm Area", "farmArea"),
            ("Survey Number", "surveyNumber"),
            ("GPS Latitude", "latitude"),
            ("GPS Longitude", "longitude"),
            ("Claim Status", "claimStatus"),
            ("Risk Score", "riskScore"),
            ("Disaster Alert Status", "disasterAlertStatus"),
            ("Submitted Date", "submissionDate"),
        ]

        def cell(value):
            return '"' + str("" if value is None else value).replace('"', '""') + '"'

        lines = [",".join(cell(label) for label, _ in columns)]
        for farmer in farmer_records_payload():
            lines.append(",".join(cell(farmer.get(key, "")) for _, key in columns))

        response = HttpResponse("\n".join(lines), content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="krishinetra_farmer_data.csv"'
        return response


class FarmerMobileSubmitView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        # GPS comes from the mobile app request body. Do not depend on image EXIF metadata.
        data = request.data
        photo = data.get("photo")
        record = {
            "farmerId": f"MOB-{len(DEMO_MOBILE_SUBMISSIONS) + 1:03d}",
            "farmerName": data.get("farmerName", "Mobile Farmer"),
            "mobileNumber": data.get("mobileNumber", ""),
            "village": data.get("village", ""),
            "taluka": data.get("taluka", ""),
            "district": data.get("district", ""),
            "state": data.get("state", "Maharashtra"),
            "cropType": data.get("cropType", ""),
            "predictedCrop": data.get("cropType", "Pending"),
            "farmArea": data.get("farmArea", ""),
            "surveyNumber": data.get("surveyNumber", ""),
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "photoUrl": getattr(photo, "name", "") if photo else data.get("photoUrl", ""),
            "submissionDate": data.get("submittedAt", ""),
            "claimStatus": "Pending",
            "riskScore": 0.22 if photo and data.get("latitude") and data.get("longitude") else 0.86,
            "confidenceScore": 0.0,
            "disasterAlertStatus": "Not Sent",
            "alertHistory": [],
        }
        DEMO_MOBILE_SUBMISSIONS.append(record)
        return Response(
            {
                "message": "Mobile farmer submission received for demo review.",
                "farmer": record,
            },
            status=status.HTTP_201_CREATED,
        )


class AlertSendView(APIView):
    def post(self, request):
        # This can later be connected to Firebase Cloud Messaging for real mobile app notifications.
        alert = {
            "id": f"ALT-{len(DEMO_ALERTS) + 1:03d}",
            "farmerIds": request.data.get("farmerIds", []),
            "disasterType": request.data.get("disasterType", ""),
            "title": request.data.get("title", ""),
            "message": request.data.get("message", ""),
            "language": request.data.get("language", "English"),
            "sentAt": request.data.get("sentAt", ""),
            "status": "Sent",
        }
        DEMO_ALERTS.append(alert)
        return Response({"message": "Alert simulated successfully.", "alert": alert}, status=status.HTTP_201_CREATED)


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
