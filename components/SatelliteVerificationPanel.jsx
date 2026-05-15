"use client";

import { useState } from "react";
import { Loader2, Satellite } from "lucide-react";

const satelliteCache = new Map();

function riskClass(riskLevel = "") {
  if (riskLevel.toLowerCase().includes("high")) return "high";
  if (riskLevel.toLowerCase().includes("medium")) return "medium";
  return "low";
}

function getPayload(record) {
  return {
    farmerId: record.farmerId || record.id,
    latitude: record.latitude ?? record.gpsLat,
    longitude: record.longitude ?? record.gpsLon,
    cropType: record.cropType || record.cropClaimed,
    submittedAt: record.submittedAt || record.submissionDate || record.submittedDate,
  };
}

export async function runSatelliteVerification(record) {
  const payload = getPayload(record);
  const cacheKey = `${payload.farmerId || "unknown"}:${payload.latitude}:${payload.longitude}`;

  if (satelliteCache.has(cacheKey)) {
    return satelliteCache.get(cacheKey);
  }

  const response = await fetch("/api/satellite/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Satellite API returned ${response.status}`);
  }

  const result = await response.json();
  satelliteCache.set(cacheKey, result);
  return result;
}

export default function SatelliteVerificationPanel({ record, uploadedPhotoUrl, title = "Satellite Verification" }) {
  const [result, setResult] = useState(record?.satelliteVerification || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRun() {
    setLoading(true);
    setError("");
    try {
      const verification = await runSatelliteVerification(record);
      setResult(verification);
    } catch (err) {
      setError(err.message || "Satellite verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="satellite-verification-panel">
      <div className="satellite-panel-heading">
        <div>
          <span className="gov-kicker">
            <Satellite size={16} aria-hidden="true" />
            Sentinel-2 NDVI
          </span>
          <h3>{title}</h3>
          <p>NDVI = (B08 - B04) / (B08 + B04), using Near Infrared and Red bands.</p>
        </div>
        <button className="download-csv-btn satellite-run-button" type="button" onClick={handleRun} disabled={loading}>
          {loading ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <Satellite size={16} aria-hidden="true" />}
          {loading ? "Running..." : "Run Satellite Verification"}
        </button>
      </div>

      <div className="satellite-media-grid">
        <div className="satellite-image-card">
          <span>Farmer uploaded crop photo</span>
          {uploadedPhotoUrl ? <img src={uploadedPhotoUrl} alt="Farmer uploaded crop" /> : <div className="satellite-empty">No crop photo</div>}
        </div>
        <div className="satellite-image-card">
          <span>Satellite image preview</span>
          {result?.satelliteImageUrl ? <img src={result.satelliteImageUrl} alt="Satellite NDVI preview" /> : <div className="satellite-ndvi-placeholder"><Satellite size={34} />Run verification</div>}
        </div>
      </div>

      {error ? <p className="upload-status error">{error}</p> : null}
      {result?.isDemo ? (
        <p className="demo-satellite-note">
          {result.demoReason || "Demo satellite result shown because Sentinel API credentials are not configured."}
        </p>
      ) : null}

      {result ? (
        <div className="satellite-result-grid">
          <span>NDVI Score<strong>{Number(result.ndviScore).toFixed(2)}</strong></span>
          <span>Vegetation Status<strong>{result.vegetationStatus}</strong></span>
          <span>Crop Health<strong>{result.cropHealth}</strong></span>
          <span>Satellite Date<strong>{result.satelliteDate}</strong></span>
          <span>Cloud Cover<strong>{result.cloudCoverStatus}</strong></span>
          <span>Risk Level<strong className={`risk-badge ${riskClass(result.riskLevel)}`}>{result.riskLevel}</strong></span>
          <p className="satellite-risk-reason">{result.riskReason}</p>
        </div>
      ) : null}
    </section>
  );
}
