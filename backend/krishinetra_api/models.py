from django.contrib.gis.db import models as gis_models
from django.db import models


class Farmer(models.Model):
    name = models.CharField(max_length=150)
    aadhaar_number = models.CharField(max_length=12, unique=True)
    phone = models.CharField(max_length=15)
    village = models.CharField(max_length=120)
    taluka = models.CharField(max_length=120)
    district = models.CharField(max_length=120)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.aadhaar_number})"


class Farm(models.Model):
    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE, related_name="farms")
    survey_number = models.CharField(max_length=80)
    area_acres = models.DecimalField(max_digits=10, decimal_places=2)
    location = gis_models.PointField(srid=4326, geography=True)
    boundary = gis_models.PolygonField(srid=4326, geography=True)

    class Meta:
        ordering = ["survey_number"]
        unique_together = ("farmer", "survey_number")

    def __str__(self):
        return f"Survey {self.survey_number} - {self.farmer.name}"


class CropSubmission(models.Model):
    class CropChoices(models.TextChoices):
        WHEAT = "wheat", "Wheat"
        RICE = "rice", "Rice"
        SUGARCANE = "sugarcane", "Sugarcane"
        COTTON = "cotton", "Cotton"
        SOYBEAN = "soybean", "Soybean"
        JOWAR = "jowar", "Jowar"

    class StatusChoices(models.TextChoices):
        PENDING = "PENDING", "Pending"
        VERIFIED = "VERIFIED", "Verified"
        FLAGGED = "FLAGGED", "Flagged"

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name="submissions")
    claimed_crop = models.CharField(max_length=20, choices=CropChoices.choices)
    submission_photo = models.ImageField(upload_to="crop_submissions/")
    gps_lat = models.DecimalField(max_digits=9, decimal_places=6)
    gps_lon = models.DecimalField(max_digits=9, decimal_places=6)
    submitted_at = models.DateTimeField(auto_now_add=True)
    predicted_crop = models.CharField(
        max_length=20,
        choices=CropChoices.choices,
        blank=True,
        null=True,
    )
    confidence_score = models.FloatField(default=0.0)
    ndvi_value = models.FloatField(blank=True, null=True)
    satellite_image_url = models.URLField(blank=True)
    risk_score = models.FloatField(default=0.0)
    is_fraud = models.BooleanField(default=False)
    fraud_reason = models.TextField(blank=True)
    status = models.CharField(
        max_length=10,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING,
    )

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.claimed_crop} submission for {self.farm}"
