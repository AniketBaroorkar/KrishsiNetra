import { demoClaims } from "../data/claimsData";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export function calculateRiskScore(claim) {
  let score = 0.08;
  const reasons = [];

  if (!claim.hasPhoto && !claim.photoUrl) {
    score += 0.42;
    reasons.push("Missing crop photo");
  }

  if (claim.gpsLat === null || claim.gpsLon === null || claim.gpsLat === undefined || claim.gpsLon === undefined) {
    score += 0.42;
    reasons.push("Missing GPS location");
  }

  if (
    claim.cropClaimed &&
    claim.predictedCrop &&
    claim.cropClaimed.toLowerCase() !== claim.predictedCrop.toLowerCase()
  ) {
    score += 0.45;
    reasons.push("Claimed crop is different from AI predicted crop");
  }

  if ((claim.confidenceScore ?? 0) < 0.6) {
    score += 0.28;
    reasons.push("Low AI confidence");
  } else if ((claim.confidenceScore ?? 0) < 0.78) {
    score += 0.16;
    reasons.push("Moderate AI confidence");
  }

  const riskScore = Math.min(0.99, Number(score.toFixed(2)));
  if (reasons.length === 0) {
    reasons.push("Crop, photo, GPS, and confidence checks are consistent");
  }

  return {
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    fraudReason: reasons.join(". "),
  };
}

export function enrichClaim(claim) {
  const risk = calculateRiskScore(claim);
  return {
    ...claim,
    hasPhoto: Boolean(claim.hasPhoto || claim.photoUrl),
    riskScore: claim.riskScore ?? risk.riskScore,
    riskLevel: risk.riskLevel,
    fraudReason: claim.fraudReason || risk.fraudReason,
  };
}

export function getRiskLevel(score) {
  if (score >= 0.7) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
}

export function normalizeStatus(status) {
  const normalized = String(status || "Pending").toLowerCase();
  if (normalized === "verified") return "Verified";
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "flagged") return "Flagged";
  if (normalized === "high risk" || normalized === "high_risk") return "High Risk";
  return "Pending";
}

function normalizeApiClaim(item) {
  const farmer = item.farmer || item.farmer_detail || item.farm_detail?.farmer_detail || {};
  const farm = item.farm || item.farm_detail || {};
  return enrichClaim({
    id: item.id ? `API-${item.id}` : item.claim_id,
    apiId: item.id,
    farmerName: item.farmerName || farmer.name || "Unknown Farmer",
    phone: item.phone || farmer.phone || "Not available",
    village: item.village || farmer.village || "Not available",
    taluka: item.taluka || farmer.taluka || "Not available",
    district: item.district || farmer.district || "Not available",
    cropClaimed: item.cropClaimed || item.claimed_crop || item.claimedCrop || "Unknown",
    predictedCrop: item.predictedCrop || item.predicted_crop || "Pending",
    gpsLat: Number(item.gpsLat ?? item.gps_lat) || null,
    gpsLon: Number(item.gpsLon ?? item.gps_lon) || null,
    hasPhoto: Boolean(item.hasPhoto || item.submission_photo || item.photoUrl),
    photoUrl: item.photoUrl || item.submission_photo || "",
    confidenceScore: Number(item.confidenceScore ?? item.confidence_score ?? 0),
    riskScore: item.riskScore ?? item.risk_score,
    fraudReason: item.fraudReason || item.fraud_reason,
    status: normalizeStatus(item.status),
    submittedDate: String(item.submittedDate || item.submitted_at || "").slice(0, 10),
    claimAmount: item.claimAmount || "Rs. 30,000",
    satelliteResult: item.satelliteResult || item.satellite_result || "Satellite verification result pending.",
    surveyNo: item.surveyNo || farm.survey_number || "Not available",
  });
}

export function getDemoClaims() {
  return demoClaims.map(enrichClaim);
}

export async function fetchClaims() {
  const response = await fetch(`${API_BASE_URL}/api/claims/`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Claims API returned ${response.status}`);
  }
  const data = await response.json();
  const rows = Array.isArray(data) ? data : data.claims || data.results || [];
  return {
    source: data.source || "backend",
    claims: rows.map(normalizeApiClaim),
  };
}

export async function patchClaimStatus(claim, status) {
  if (!claim.apiId) {
    return { ...claim, status };
  }

  const response = await fetch(`${API_BASE_URL}/api/claims/${claim.apiId}/status/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(`Status API returned ${response.status}`);
  }

  return normalizeApiClaim(await response.json());
}
