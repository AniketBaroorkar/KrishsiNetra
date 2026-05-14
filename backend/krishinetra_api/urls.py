from django.urls import path

from .views import (
    CropClassificationView,
    CropSubmissionListCreateView,
    DashboardStatsView,
    FarmerCreateView,
    FarmCreateView,
    FraudCheckView,
    ClaimDetailView,
    ClaimListCreateView,
    ClaimStatusUpdateView,
    AlertSendView,
    FarmerMobileSubmitView,
    FarmerCsvExportView,
    FarmerRecordsView,
    SatelliteFetchView,
)


urlpatterns = [
    path("farmers/", FarmerCreateView.as_view(), name="farmer-create"),
    path("farmers/records/", FarmerRecordsView.as_view(), name="farmer-records"),
    path("farmers/export/csv", FarmerCsvExportView.as_view(), name="farmer-export-csv"),
    path("farmers/submit", FarmerMobileSubmitView.as_view(), name="farmer-mobile-submit"),
    path("alerts/send", AlertSendView.as_view(), name="alert-send"),
    path("farms/", FarmCreateView.as_view(), name="farm-create"),
    path("claims/", ClaimListCreateView.as_view(), name="claim-list"),
    path("claims/<int:pk>/", ClaimDetailView.as_view(), name="claim-detail"),
    path("claims/<int:pk>/status/", ClaimStatusUpdateView.as_view(), name="claim-status-update"),
    path("submissions/", CropSubmissionListCreateView.as_view(), name="submission-list-create"),
    path("classify-crop/", CropClassificationView.as_view(), name="classify-crop"),
    path("satellite/fetch/", SatelliteFetchView.as_view(), name="satellite-fetch"),
    path("check-fraud/", FraudCheckView.as_view(), name="check-fraud"),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
]
