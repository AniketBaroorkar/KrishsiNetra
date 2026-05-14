from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("krishinetra_api", "0002_postgis_farm_geometry_submission_ai_fraud"),
    ]

    operations = [
        migrations.AlterField(
            model_name="cropsubmission",
            name="status",
            field=models.CharField(
                choices=[
                    ("PENDING", "Pending"),
                    ("VERIFIED", "Verified"),
                    ("FLAGGED", "Flagged"),
                    ("APPROVED", "Approved"),
                    ("REJECTED", "Rejected"),
                ],
                default="PENDING",
                max_length=10,
            ),
        ),
    ]
