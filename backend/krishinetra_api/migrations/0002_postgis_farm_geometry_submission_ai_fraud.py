from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("krishinetra_api", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="farmer",
            name="created_at",
        ),
        migrations.RemoveField(
            model_name="farm",
            name="gps_lat",
        ),
        migrations.RemoveField(
            model_name="farm",
            name="gps_lon",
        ),
        migrations.RenameField(
            model_name="cropsubmission",
            old_name="photo",
            new_name="submission_photo",
        ),
        migrations.AddField(
            model_name="farm",
            name="location",
            field=models.JSONField(default=dict),
        ),
        migrations.AddField(
            model_name="farm",
            name="boundary",
            field=models.JSONField(default=dict),
        ),
        migrations.AddField(
            model_name="cropsubmission",
            name="ndvi_value",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="cropsubmission",
            name="satellite_image_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="cropsubmission",
            name="fraud_reason",
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name="farm",
            name="farmer",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="farms",
                to="krishinetra_api.farmer",
            ),
        ),
        migrations.AlterField(
            model_name="farmer",
            name="aadhaar_number",
            field=models.CharField(max_length=12, unique=True),
        ),
        migrations.AlterModelOptions(
            name="farmer",
            options={"ordering": ["name"]},
        ),
    ]
