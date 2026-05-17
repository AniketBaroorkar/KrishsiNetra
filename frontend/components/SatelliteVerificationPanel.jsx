"use client";

import { useState } from "react";
import { Loader2, Satellite } from "lucide-react";

const satelliteCache = new Map();

function riskClass(riskLevel = "") {
  if (riskLevel.toLowerCase().includes("high")) return "high";
  if (riskLevel.toLowerCase().includes("medium")) return "medium";
  return "low";
}

function freshnessClass(status = "") {
  const normalized = status.toLowerCase();
  if (normalized.includes("fresh")) return "fresh";
  if (normalized.includes("recent")) return "recent";
  if (normalized.includes("older") && !normalized.includes("warning")) return "stale";
  if (normalized.includes("old") || normalized.includes("warning")) return "old";
  return "unknown";
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
        <button className="btn-primary satellite-run-button" type="button" onClick={handleRun} disabled={loading}>
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

      {result?.freshnessWarning ? (
        <p className={`freshness-warning freshness-${freshnessClass(result.freshnessStatus)}`}>
          {result.freshnessWarning}
        </p>
      ) : null}

      {result ? (
        <div className="satellite-verification-card-grid">
          <section className="satellite-method-card">
            <h4>Sentinel-2 Optical Verification</h4>
            <p>Sentinel-2 is used for NDVI and vegetation health. NDVI is calculated from the most recent cloud-free Sentinel-2 image. Sentinel-2 is not real-time.</p>
            <div className="satellite-result-grid method-result-grid">
              <span>NDVI Score<strong>{Number(result.ndviScore).toFixed(2)}</strong></span>
              <span>Vegetation Status<strong>{result.vegetationStatus}</strong></span>
              <span>Crop Health<strong>{result.cropHealth}</strong></span>
              <span>Latest Sentinel-2 Image Date<strong>{result.satelliteDate || "Unknown"}</strong></span>
              <span>Image Age (days)<strong>{result.imageAgeDays != null ? `${result.imageAgeDays} days` : "Unknown"}</strong></span>
              <span>
                Freshness Status
                <strong className={`freshness-pill ${freshnessClass(result.freshnessStatus)}`}>
                  {result.freshnessStatus || "Unknown"}
                </strong>
              </span>
              <span>Cloud Cover<strong>{result.cloudCoverPercent != null ? `${result.cloudCoverPercent}% (${result.cloudCover})` : (result.cloudCoverStatus || "Unknown")}</strong></span>
              <span>Optical Result<strong>{result.opticalResult || "Clear"}</strong></span>
            </div>
          </section>

          <section className="satellite-method-card">
            <h4>Sentinel-1 SAR Fallback</h4>
            <p>Sentinel-1 SAR is used when clouds block Sentinel-2 imagery. It helps verify field condition during cloudy weather, rain, or night. Sentinel-1 does not calculate NDVI.</p>
            <div className="satellite-result-grid method-result-grid">
              <span>SAR Used<strong>{result.sentinel1Sar?.sarUsed ? "Yes" : "No"}</strong></span>
              <span>VV / VH Signal<strong>{result.sentinel1Sar?.vvSignal} / {result.sentinel1Sar?.vhSignal}</strong></span>
              <span>Field Moisture Status<strong>{result.sentinel1Sar?.fieldMoistureStatus || "Unknown"}</strong></span>
              <span>Flood/Disaster Indication<strong>{result.sentinel1Sar?.floodDisasterIndication || "Unknown"}</strong></span>
              <span>Crop Structure Signal<strong>{result.sentinel1Sar?.cropStructureSignal || "Unknown"}</strong></span>
              <span>SAR Result<strong>{result.sentinel1Sar?.sarResult || "Uncertain"}</strong></span>
            </div>
          </section>

          <section className="satellite-method-card full-width">
            <h4>Final Satellite Risk</h4>
            <div className="satellite-result-grid method-result-grid">
              <span>Risk Level<strong className={`risk-badge ${riskClass(result.riskLevel)}`}>{result.riskLevel}</strong></span>
            </div>
            <p className="satellite-risk-reason">{result.riskReason}</p>
          </section>
        </div>
      ) : null}
    </section>
  );
}
