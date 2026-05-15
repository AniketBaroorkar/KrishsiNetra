export const GPS_TRUST_STATUSES = ["All", "Valid", "Suspicious", "Spoofing Suspected", "Unknown"];

function hasCoordinate(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

function minutesBetween(first, second) {
  const firstDate = new Date(first);
  const secondDate = new Date(second);
  if (Number.isNaN(firstDate.getTime()) || Number.isNaN(secondDate.getTime())) return null;
  return Math.abs(secondDate.getTime() - firstDate.getTime()) / 60000;
}

export function calculateLocationIntegrity(record = {}) {
  const latitude = record.latitude ?? record.gpsLat;
  const longitude = record.longitude ?? record.gpsLon;
  const submittedAt = record.submittedAt || record.submissionDate || record.submittedDate;
  const warnings = [];

  if (!hasCoordinate(latitude) || !hasCoordinate(longitude)) {
    return {
      gpsTrustStatus: "Suspicious",
      locationRiskReason: "GPS coordinates are missing.",
      locationWarnings: warnings,
    };
  }

  if (record.isMockLocation === true) {
    return {
      gpsTrustStatus: "Spoofing Suspected",
      locationRiskReason: "Mock location signal detected from device.",
      locationWarnings: warnings,
    };
  }

  if (record.photoCaptureType === "Gallery Upload") {
    warnings.push("Photo was uploaded from gallery. Live capture is preferred.");
  }

  if (record.gpsAccuracy === null || record.gpsAccuracy === undefined || record.gpsAccuracy === "") {
    return {
      gpsTrustStatus: "Unknown",
      locationRiskReason: "GPS accuracy data is not available.",
      locationWarnings: warnings,
    };
  }

  if (Number(record.gpsAccuracy) > 100) {
    return {
      gpsTrustStatus: "Suspicious",
      locationRiskReason: "GPS accuracy is too low for reliable farm verification.",
      locationWarnings: warnings,
    };
  }

  if (record.gpsTimestamp && submittedAt) {
    const gap = minutesBetween(record.gpsTimestamp, submittedAt);
    if (gap !== null && gap > 30) {
      return {
        gpsTrustStatus: "Suspicious",
        locationRiskReason: "GPS timestamp does not match claim submission time.",
        locationWarnings: warnings,
      };
    }
  }

  return {
    gpsTrustStatus: "Valid",
    locationRiskReason: warnings.length ? warnings.join(" ") : "GPS location appears reliable.",
    locationWarnings: warnings,
  };
}

export function locationRiskLevel(status) {
  if (status === "Spoofing Suspected" || status === "Suspicious") return "High";
  if (status === "Unknown") return "Medium";
  return "Low";
}
