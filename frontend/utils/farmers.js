import * as XLSX from "xlsx";

import { demoFarmers } from "../data/farmersData";
import { calculateLocationIntegrity } from "./locationIntegrity";
import { buildDemoSatelliteResult } from "./satelliteVerification";

export function calculateFarmerRisk(farmer) {
  let score = 0.08;
  const reasons = [];
  const locationIntegrity = calculateLocationIntegrity(farmer);

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

  if (locationIntegrity.gpsTrustStatus === "Spoofing Suspected") {
    score = Math.max(score, 0.76);
    reasons.push("Location integrity check marked GPS spoofing suspected");
  } else if (locationIntegrity.locationRiskReason === "GPS coordinates are missing.") {
    score = Math.max(score, 0.76);
    reasons.push(locationIntegrity.locationRiskReason);
  } else if (locationIntegrity.gpsTrustStatus === "Suspicious") {
    score = Math.max(score, 0.48);
    reasons.push(locationIntegrity.locationRiskReason);
  } else if (locationIntegrity.gpsTrustStatus === "Unknown") {
    score = Math.max(score, 0.4);
    reasons.push(locationIntegrity.locationRiskReason);
  }
  if (farmer.photoCaptureType === "Gallery Upload") {
    score = Math.max(score, 0.4);
    reasons.push("Photo was uploaded from gallery. Live capture is preferred.");
  }

  const riskScore = Math.min(0.99, Number(score.toFixed(2)));
  return {
    riskScore,
    riskLevel: riskScore >= 0.7 ? "High" : riskScore >= 0.4 ? "Medium" : "Low",
    riskReason: reasons.length ? reasons.join(". ") : "Photo, GPS, crop, and AI confidence checks are consistent.",
  };
}

export function enrichFarmer(farmer) {
  const fallback = getDemoLocationFields(farmer);
  const baseFarmer = { ...fallback, ...farmer };
  const locationIntegrity = calculateLocationIntegrity(baseFarmer);
  const risk = calculateFarmerRisk(baseFarmer);
  return {
    ...baseFarmer,
    ...locationIntegrity,
    riskScore: baseFarmer.riskScore ?? risk.riskScore,
    riskLevel: baseFarmer.riskLevel || risk.riskLevel,
    riskReason: baseFarmer.riskReason || risk.riskReason,
    satelliteResult:
      baseFarmer.satelliteResult ||
      (risk.riskLevel === "High"
        ? "Satellite verification needs officer review due to missing or mismatched evidence."
        : "Satellite vegetation signal supports the submitted crop area."),
    satelliteVerification: baseFarmer.satelliteVerification || buildDemoSatelliteResult({
      latitude: baseFarmer.latitude,
      longitude: baseFarmer.longitude,
      cropType: baseFarmer.cropType,
      submittedAt: baseFarmer.submittedAt,
    }),
    alertHistory: baseFarmer.alertHistory || [],
  };
}

function getDemoLocationFields(farmer = {}) {
  const index = Number(String(farmer.farmerId || "").replace(/\D/g, "")) || 0;
  const submittedAt = `${farmer.submissionDate || "2026-05-15"}T10:30:00`;
  const defaults = {
    gpsAccuracy: 18,
    gpsTimestamp: submittedAt,
    gpsProvider: "GPS",
    isMockLocation: false,
    photoCaptureType: "Live Camera",
    submittedAt,
  };

  if (index === 2 || index === 4) {
    return { ...defaults, gpsAccuracy: 145 };
  }
  if (index === 3 || index === 5) {
    return { ...defaults, isMockLocation: true, gpsAccuracy: 12 };
  }
  if (index === 8 || index === 12) {
    return { ...defaults, photoCaptureType: "Gallery Upload" };
  }
  if (index === 13) {
    return { ...defaults, gpsAccuracy: "", gpsProvider: "Unknown", isMockLocation: "unknown", photoCaptureType: "Unknown" };
  }
  return defaults;
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
  ["GPS Accuracy", "gpsAccuracy"],
  ["GPS Timestamp", "gpsTimestamp"],
  ["GPS Provider", "gpsProvider"],
  ["Mock Location", "isMockLocation"],
  ["GPS Trust Status", "gpsTrustStatus"],
  ["Location Risk Reason", "locationRiskReason"],
  ["Photo Capture Type", "photoCaptureType"],
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

export function downloadFarmersXlsx(farmers) {
  const rows = farmers.map((farmer) =>
    Object.fromEntries(farmerExportColumns.map(([label, key]) => [label, farmer[key] ?? ""])),
  );
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: farmerExportColumns.map(([label]) => label),
  });
  worksheet["!cols"] = farmerExportColumns.map(([label]) => ({
    wch: Math.max(label.length + 2, 14),
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Farmers");
  XLSX.writeFile(workbook, "krishinetra_farmer_data.xlsx");
}
