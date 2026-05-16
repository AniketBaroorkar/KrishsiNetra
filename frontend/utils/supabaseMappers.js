// Field mappings between Supabase tables and the existing dashboard shapes.
// Centralised here so /api routes and helpers stay consistent.

export function supabaseClaimRowToFarmer(row) {
  if (!row) return null;
  const submittedAt = row.submission_date || row.created_at || null;
  return {
    farmerId: row.farmer_id || (row.claim_id ? `MOB-${row.claim_id}` : null),
    farmerName: row.farmer_name || "Unknown farmer",
    mobileNumber: row.mobile_number || "",
    village: row.village || "",
    taluka: row.taluka || "",
    district: row.district || "",
    state: row.state || "",
    cropType: row.crop_type || "",
    predictedCrop: row.ai_predicted_crop || "",
    farmArea: row.farm_area ?? null,
    surveyNumber: row.survey_number || "",
    latitude: row.gps_latitude ?? null,
    longitude: row.gps_longitude ?? null,
    gpsAccuracy: row.gps_accuracy ?? null,
    gpsTrustStatus: row.gps_trust_status || "",
    locationRiskReason: row.location_risk || "",
    photoUrl: row.photo_url || "",
    photoCaptureType: row.photo_source || "",
    claimStatus: row.claim_status || "Pending",
    riskScore: row.risk_score ?? null,
    confidenceScore: row.ai_confidence ?? null,
    ndviScore: row.ndvi_value ?? null,
    submittedAt,
    submissionDate: submittedAt ? String(submittedAt).slice(0, 10) : "",
    syncStatus: row.sync_status || "Supabase",
  };
}

export function supabaseClaimRowToClaim(row) {
  if (!row) return null;
  const submittedAt = row.submission_date || row.created_at || null;
  return {
    id: row.claim_id || `SB-${row.id}`,
    apiId: row.id,
    farmerName: row.farmer_name || "Unknown farmer",
    phone: row.mobile_number || "",
    village: row.village || "",
    taluka: row.taluka || "",
    district: row.district || "",
    cropClaimed: row.crop_type || "",
    predictedCrop: row.ai_predicted_crop || "",
    gpsLat: row.gps_latitude ?? null,
    gpsLon: row.gps_longitude ?? null,
    hasPhoto: Boolean(row.photo_url),
    photoUrl: row.photo_url || "",
    confidenceScore: row.ai_confidence ?? null,
    riskScore: row.risk_score ?? null,
    submittedDate: submittedAt ? String(submittedAt).slice(0, 10) : "",
    submittedAt,
    status: row.claim_status || "Pending",
    claimAmount: row.claim_amount || "Rs. 30,000",
    satelliteResult: row.ndvi_value != null
      ? `Sentinel-2 NDVI reported as ${row.ndvi_value}.`
      : "Satellite verification pending.",
    surveyNo: row.survey_number || "",
    gpsAccuracy: row.gps_accuracy ?? null,
    photoCaptureType: row.photo_source || "",
    gpsTrustStatus: row.gps_trust_status || "",
    locationRiskReason: row.location_risk || "",
    ndviScore: row.ndvi_value ?? null,
  };
}

export function legacySubmitPayloadToClaimInsert(payload = {}) {
  const now = new Date().toISOString();
  return {
    claim_id: payload.claimId || payload.claim_id || `CLAIM-${Date.now()}`,
    farmer_id: payload.farmerId || payload.farmer_id || `FARMER-${Date.now()}`,
    farmer_name: payload.farmerName ?? payload.farmer_name ?? null,
    mobile_number: payload.mobileNumber ?? payload.mobile_number ?? null,
    village: payload.village ?? null,
    taluka: payload.taluka ?? null,
    district: payload.district ?? null,
    crop_type: payload.cropType ?? payload.crop_type ?? null,
    farm_area: toNumberOrNull(payload.farmArea ?? payload.farm_area),
    survey_number: payload.surveyNumber ?? payload.survey_number ?? null,
    gps_latitude: toNumberOrNull(payload.latitude ?? payload.gps_latitude),
    gps_longitude: toNumberOrNull(payload.longitude ?? payload.gps_longitude),
    gps_accuracy: toNumberOrNull(payload.gpsAccuracy ?? payload.gps_accuracy),
    gps_trust_status: payload.gpsTrustStatus ?? payload.gps_trust_status ?? null,
    location_risk: payload.locationRiskReason ?? payload.location_risk ?? null,
    photo_url: payload.photo ?? payload.photo_url ?? null,
    photo_source: payload.photoCaptureType ?? payload.photo_source ?? null,
    submission_date: payload.submittedAt || payload.submission_date || now,
    claim_status: payload.claimStatus || payload.claim_status || "Pending",
    risk_score: toNumberOrNull(payload.riskScore ?? payload.risk_score) ?? 0,
    ai_predicted_crop: payload.predictedCrop ?? payload.ai_predicted_crop ?? null,
    ai_confidence: toNumberOrNull(payload.confidenceScore ?? payload.ai_confidence),
    ndvi_value: toNumberOrNull(payload.ndviScore ?? payload.ndvi_value),
    sync_status: payload.syncStatus || payload.sync_status || "Mobile App",
  };
}

export function newClaimPayloadToInsert(payload = {}) {
  const now = new Date().toISOString();
  return {
    claim_id: payload.claim_id || `CLAIM-${Date.now()}`,
    farmer_id: payload.farmer_id || `FARMER-${Date.now()}`,
    farmer_name: payload.farmer_name ?? null,
    mobile_number: payload.mobile_number ?? null,
    village: payload.village ?? null,
    taluka: payload.taluka ?? null,
    district: payload.district ?? null,
    crop_type: payload.crop_type ?? null,
    farm_area: toNumberOrNull(payload.farm_area),
    survey_number: payload.survey_number ?? null,
    gps_latitude: toNumberOrNull(payload.gps_latitude),
    gps_longitude: toNumberOrNull(payload.gps_longitude),
    gps_accuracy: toNumberOrNull(payload.gps_accuracy),
    gps_trust_status: payload.gps_trust_status ?? null,
    location_risk: payload.location_risk ?? null,
    photo_url: payload.photo_url ?? null,
    photo_source: payload.photo_source ?? null,
    submission_date: payload.submission_date || now,
    claim_status: payload.claim_status || "Pending",
    risk_score: toNumberOrNull(payload.risk_score) ?? 0,
    ai_predicted_crop: payload.ai_predicted_crop ?? null,
    ai_confidence: toNumberOrNull(payload.ai_confidence),
    ndvi_value: toNumberOrNull(payload.ndvi_value),
    sync_status: payload.sync_status || "Mobile App",
  };
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
