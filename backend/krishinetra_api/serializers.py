import json

from rest_framework import serializers

from .models import CropSubmission, Farm, Farmer


class GeometrySerializerField(serializers.Field):
    def to_representation(self, value):
        return value

    def to_internal_value(self, data):
        try:
            return json.loads(data) if isinstance(data, str) else data
        except Exception as exc:
            raise serializers.ValidationError("Enter a valid GeoJSON geometry.") from exc


class FarmerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farmer
        fields = [
            "id",
            "name",
            "aadhaar_number",
            "phone",
            "village",
            "taluka",
            "district",
        ]
        read_only_fields = ["id"]


class FarmSerializer(serializers.ModelSerializer):
    farmer_detail = FarmerSerializer(source="farmer", read_only=True)
    location = GeometrySerializerField()
    boundary = GeometrySerializerField()

    class Meta:
        model = Farm
        fields = [
            "id",
            "farmer",
            "farmer_detail",
            "survey_number",
            "area_acres",
            "location",
            "boundary",
        ]
        read_only_fields = ["id", "farmer_detail"]


class CropSubmissionSerializer(serializers.ModelSerializer):
    farm_detail = FarmSerializer(source="farm", read_only=True)

    class Meta:
        model = CropSubmission
        fields = [
            "id",
            "farm",
            "farm_detail",
            "claimed_crop",
            "submission_photo",
            "gps_lat",
            "gps_lon",
            "submitted_at",
            "predicted_crop",
            "confidence_score",
            "ndvi_value",
            "satellite_image_url",
            "risk_score",
            "is_fraud",
            "fraud_reason",
            "status",
        ]
        read_only_fields = [
            "id",
            "farm_detail",
            "submitted_at",
            "predicted_crop",
            "confidence_score",
            "ndvi_value",
            "satellite_image_url",
            "risk_score",
            "is_fraud",
            "fraud_reason",
            "status",
        ]


class DashboardStatsSerializer(serializers.Serializer):
    total_farms = serializers.IntegerField()
    total_fraud = serializers.IntegerField()
    avg_risk_score = serializers.FloatField()


class CropClassificationSerializer(serializers.Serializer):
    image = serializers.ImageField()
    gps_lat = serializers.FloatField()
    gps_lon = serializers.FloatField()


class CropClassificationResultSerializer(serializers.Serializer):
    predicted_crop = serializers.CharField()
    confidence_score = serializers.FloatField()


class SatelliteFetchSerializer(serializers.Serializer):
    gps_lat = serializers.FloatField()
    gps_lon = serializers.FloatField()


class SatelliteFetchResultSerializer(serializers.Serializer):
    ndvi = serializers.FloatField()
    satellite_image_url = serializers.URLField()


class FraudCheckSerializer(serializers.Serializer):
    claimed_crop = serializers.ChoiceField(choices=CropSubmission.CropChoices.choices)
    predicted_crop = serializers.ChoiceField(choices=CropSubmission.CropChoices.choices)
    confidence = serializers.FloatField(min_value=0.0, max_value=1.0)
    gps_distance_km = serializers.FloatField(min_value=0.0)
    ndvi = serializers.FloatField(required=False, min_value=-1.0, max_value=1.0)


class FraudCheckResultSerializer(serializers.Serializer):
    risk_score = serializers.FloatField()
    is_fraud = serializers.BooleanField()
    reason = serializers.CharField()
