from django.urls import path

from .views import (
    CropClassificationView,
    CropSubmissionListCreateView,
    DashboardStatsView,
    FarmerCreateView,
    FarmCreateView,
    FraudCheckView,
    SatelliteFetchView,
)


urlpatterns = [
    path("farmers/", FarmerCreateView.as_view(), name="farmer-create"),
    path("farms/", FarmCreateView.as_view(), name="farm-create"),
    path("submissions/", CropSubmissionListCreateView.as_view(), name="submission-list-create"),
    path("classify-crop/", CropClassificationView.as_view(), name="classify-crop"),
    path("satellite/fetch/", SatelliteFetchView.as_view(), name="satellite-fetch"),
    path("check-fraud/", FraudCheckView.as_view(), name="check-fraud"),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
]
