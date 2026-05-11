import { farmSubmissions } from "../data/dashboardData";

export function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]))].sort();
}

export function riskLevel(score) {
  if (score > 0.7) return "high";
  if (score >= 0.4) return "medium";
  return "clean";
}

export function riskLabel(score) {
  const level = riskLevel(score);
  if (level === "high") return "High";
  if (level === "medium") return "Medium";
  return "Clean";
}

export function toCsv(rows) {
  const headers = [
    "Farmer",
    "Survey No",
    "Claimed Crop",
    "AI Detected",
    "Risk Score",
    "GPS Distance",
    "Date",
  ];
  const values = rows.map((row) => [
    row.farmer,
    row.surveyNo,
    row.claimedCrop,
    row.predictedCrop,
    row.riskScore,
    row.gpsDistanceKm,
    row.date,
  ]);
  return [headers, ...values]
    .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

export function downloadCsv(rows, filename) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function cropDistributionByDistrict() {
  const grouped = new Map();
  for (const item of farmSubmissions) {
    if (!grouped.has(item.district)) {
      grouped.set(item.district, {
        district: item.district,
        wheat: 0,
        rice: 0,
        sugarcane: 0,
        cotton: 0,
        soybean: 0,
        jowar: 0,
      });
    }
    grouped.get(item.district)[item.claimedCrop] += 1;
  }
  return [...grouped.values()];
}

export function fraudCleanThisMonth() {
  const fraud = farmSubmissions.filter((item) => item.riskScore > 0.4).length;
  return [
    { name: "Fraud", value: fraud },
    { name: "Clean", value: farmSubmissions.length - fraud },
  ];
}

export function calculateImpact(eventDate) {
  const impacted = farmSubmissions.filter((item) => item.ndviBefore - item.ndviAfter > 0.16);
  const affectedAcres = impacted.reduce((total, item) => total + item.acres, 0);
  const cropTypesDamaged = [...new Set(impacted.map((item) => item.claimedCrop))].sort();
  const estimatedLoss = impacted.reduce((total, item) => {
    const lossFactor = Math.min(0.8, Math.max(0.12, item.ndviBefore - item.ndviAfter));
    return total + item.acres * lossFactor * 62000;
  }, 0);

  return {
    eventDate,
    affectedAcres: Number(affectedAcres.toFixed(2)),
    cropTypesDamaged,
    estimatedLoss: Math.round(estimatedLoss),
    fields: impacted,
  };
}
