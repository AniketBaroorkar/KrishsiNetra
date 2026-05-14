import { demoFarmers } from "../data/farmersData";

export function calculateFarmerRisk(farmer) {
  let score = 0.08;
  const reasons = [];

  if (!farmer.photoUrl) {
    score += 0.42;
    reasons.push("Missing crop photo");
  }
  if (farmer.latitude === null || farmer.longitude === null || farmer.latitude === undefined || farmer.longitude === undefined) {
    score += 0.42;
    reasons.push("Missing GPS location");
  }
  if (
    farmer.cropType &&
    farmer.predictedCrop &&
    farmer.cropType.toLowerCase() !== farmer.predictedCrop.toLowerCase()
  ) {
    score += 0.45;
    reasons.push("Claimed crop differs from AI predicted crop");
  }
  if ((farmer.confidenceScore || 0) < 0.6) {
    score += 0.28;
    reasons.push("Low AI confidence below 60%");
  } else if ((farmer.confidenceScore || 0) < 0.78) {
    score += 0.16;
    reasons.push("Moderate AI confidence");
  }

  const riskScore = Math.min(0.99, Number(score.toFixed(2)));
  return {
    riskScore,
    riskLevel: riskScore >= 0.7 ? "High" : riskScore >= 0.4 ? "Medium" : "Low",
    riskReason: reasons.length ? reasons.join(". ") : "Photo, GPS, crop, and AI confidence checks are consistent.",
  };
}

export function enrichFarmer(farmer) {
  const risk = calculateFarmerRisk(farmer);
  return {
    ...farmer,
    riskScore: farmer.riskScore ?? risk.riskScore,
    riskLevel: farmer.riskLevel || risk.riskLevel,
    riskReason: farmer.riskReason || risk.riskReason,
    satelliteResult:
      farmer.satelliteResult ||
      (risk.riskLevel === "High"
        ? "Satellite verification needs officer review due to missing or mismatched evidence."
        : "Satellite vegetation signal supports the submitted crop area."),
    alertHistory: farmer.alertHistory || [],
  };
}

export function getDemoFarmers() {
  return demoFarmers.map(enrichFarmer);
}

export function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort();
}

export async function fetchFarmers() {
  const response = await fetch("/api/farmers", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Farmers API returned ${response.status}`);
  }
  const data = await response.json();
  return {
    source: data.source || "demo",
    farmers: (data.farmers || []).map(enrichFarmer),
  };
}

export async function submitMobileFarmer(payload) {
  const response = await fetch("/api/farmers/submit", {
    method: "POST",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
    headers: payload instanceof FormData ? undefined : { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Submit API returned ${response.status}`);
  }
  return response.json();
}

const farmerExportColumns = [
  ["Farmer ID", "farmerId"],
  ["Farmer Name", "farmerName"],
  ["Mobile Number", "mobileNumber"],
  ["Village", "village"],
  ["Taluka", "taluka"],
  ["District", "district"],
  ["State", "state"],
  ["Crop Type", "cropType"],
  ["Farm Area", "farmArea"],
  ["Survey Number", "surveyNumber"],
  ["GPS Latitude", "latitude"],
  ["GPS Longitude", "longitude"],
  ["Claim Status", "claimStatus"],
  ["Risk Score", "riskScore"],
  ["Disaster Alert Status", "disasterAlertStatus"],
  ["Submitted Date", "submissionDate"],
];

function triggerDownload(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value) {
  const normalized = value === null || value === undefined ? "" : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
}

export function farmersToCsv(farmers) {
  const headers = farmerExportColumns.map(([label]) => label);
  const rows = farmers.map((farmer) => farmerExportColumns.map(([, key]) => escapeCsvCell(farmer[key])));
  return [headers.map(escapeCsvCell), ...rows].map((row) => row.join(",")).join("\n");
}

export function downloadFarmersCsv(farmers) {
  triggerDownload(farmersToCsv(farmers), "krishinetra_farmer_data.csv", "text/csv;charset=utf-8");
}

export function downloadFarmersJson(farmers) {
  triggerDownload(
    JSON.stringify(farmers, null, 2),
    "krishinetra_farmer_data.json",
    "application/json;charset=utf-8",
  );
}
