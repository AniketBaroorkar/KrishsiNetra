"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Satellite } from "lucide-react";

import { getDemoFarmers } from "../utils/farmers";

const LocationLeafletMap = dynamic(() => import("./LocationLeafletMap"), {
  ssr: false,
  loading: () => <div className="location-map-loading">Loading map...</div>,
});

function cleanNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function riskClass(riskLevel = "") {
  if (riskLevel.toLowerCase().includes("high")) return "high";
  if (riskLevel.toLowerCase().includes("medium")) return "medium";
  return "low";
}

export default function LocationCheckWorkspace() {
  const searchParams = useSearchParams();
  const farmers = useMemo(() => getDemoFarmers(), []);
  const initial = useMemo(() => {
    const farmerId = searchParams.get("farmerId") || "";
    const hasFarmerFromUrl = Boolean(farmerId);
    return {
      farmerId,
      latitude: searchParams.get("lat") || (hasFarmerFromUrl ? "" : "18.5204"),
      longitude: searchParams.get("lng") || (hasFarmerFromUrl ? "" : "73.8567"),
      cropType: searchParams.get("crop") || (hasFarmerFromUrl ? "" : "Sugarcane"),
      farmerName: searchParams.get("farmer") || "",
      village: searchParams.get("village") || "",
      district: searchParams.get("district") || "",
      surveyNumber: searchParams.get("survey") || "",
    };
  }, [searchParams]);

  const [form, setForm] = useState(initial);
  const [mapLocation, setMapLocation] = useState(initial);
  const [satelliteResult, setSatelliteResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedFarmerId, setSelectedFarmerId] = useState(initial.farmerId);

  const latitude = cleanNumber(mapLocation.latitude);
  const longitude = cleanNumber(mapLocation.longitude);
  const hasValidLocation = latitude !== null && longitude !== null;

  useEffect(() => {
    setForm(initial);
    setMapLocation(initial);
    setSatelliteResult(null);
    setSelectedFarmerId(initial.farmerId);
    if (initial.farmerId && (!searchParams.get("lat") || !searchParams.get("lng"))) {
      setMessage("GPS location not available for this farmer.");
    } else {
      setMessage("");
    }
  }, [initial, searchParams]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectFarmer(farmerId) {
    setSelectedFarmerId(farmerId);
    const farmer = farmers.find((item) => item.farmerId === farmerId);
    if (!farmer) return;

    const next = {
      farmerId: farmer.farmerId,
      latitude: farmer.latitude ? String(farmer.latitude) : "",
      longitude: farmer.longitude ? String(farmer.longitude) : "",
      cropType: farmer.cropType || "",
      farmerName: farmer.farmerName || "",
      village: farmer.village || "",
      district: farmer.district || "",
      surveyNumber: farmer.surveyNumber || "",
    };

    setForm(next);
    setSatelliteResult(null);
    if (!farmer.latitude || !farmer.longitude) {
      setMapLocation(next);
      setMessage("GPS location not available for this farmer.");
      return;
    }
    setMessage("");
    setMapLocation(next);
  }

  function showLocation() {
    const nextLat = cleanNumber(form.latitude);
    const nextLng = cleanNumber(form.longitude);
    if (nextLat === null || nextLng === null) {
      setMessage("Please enter valid latitude and longitude.");
      return;
    }
    setMessage("");
    setMapLocation(form);
  }

  async function runSatelliteVerification() {
    const nextLat = cleanNumber(mapLocation.latitude);
    const nextLng = cleanNumber(mapLocation.longitude);
    if (nextLat === null || nextLng === null) {
      setMessage("Please show a valid map location before running satellite verification.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/satellite/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: nextLat,
          longitude: nextLng,
          cropType: mapLocation.cropType,
          farmerName: mapLocation.farmerName,
        }),
      });
      const result = await response.json();
      setSatelliteResult(result);
    } catch (error) {
      setMessage(error.message || "Satellite verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="gov-page location-check-page">
      <div className="gov-page-header">
        <div>
          <span className="gov-kicker"><MapPin size={16} aria-hidden="true" />Location Check</span>
          <h1>Location & Satellite Area Check</h1>
          <p>Enter GPS coordinates to center the map on the exact farm area and run Sentinel-2 NDVI verification.</p>
        </div>
        <span className="api-notice">Contact: 9579207219</span>
      </div>

      <div className="location-check-layout">
        <form className="gov-card location-check-form">
          <label>
            Select Farmer
            <select value={selectedFarmerId} onChange={(event) => selectFarmer(event.target.value)}>
              <option value="">Choose farmer</option>
              {farmers.map((farmer) => (
                <option value={farmer.farmerId} key={farmer.farmerId}>
                  {farmer.farmerName} - {farmer.cropType} - {farmer.district}
                </option>
              ))}
            </select>
          </label>
          <label>Farmer ID<input value={form.farmerId} onChange={(event) => updateField("farmerId", event.target.value)} placeholder="F001" /></label>
          <label>Latitude<input value={form.latitude} onChange={(event) => updateField("latitude", event.target.value)} placeholder="18.5204" /></label>
          <label>Longitude<input value={form.longitude} onChange={(event) => updateField("longitude", event.target.value)} placeholder="73.8567" /></label>
          <label>Crop Type<input value={form.cropType} onChange={(event) => updateField("cropType", event.target.value)} placeholder="Sugarcane" /></label>
          <label>Farmer Name optional<input value={form.farmerName} onChange={(event) => updateField("farmerName", event.target.value)} placeholder="Ramesh Patil" /></label>
          <label>Village<input value={form.village} onChange={(event) => updateField("village", event.target.value)} placeholder="Malegaon" /></label>
          <label>District<input value={form.district} onChange={(event) => updateField("district", event.target.value)} placeholder="Pune" /></label>
          <label>Survey Number optional<input value={form.surveyNumber} onChange={(event) => updateField("surveyNumber", event.target.value)} placeholder="SN-42/2" /></label>
          <button className="download-csv-btn" type="button" onClick={showLocation}>
            <MapPin size={16} aria-hidden="true" />
            Show Location on Map
          </button>
          {message ? <p className="upload-status error">{message}</p> : null}
        </form>

        <section className="gov-card location-map-card">
          <div className="friendly-card-heading">
            <h2>Map Display</h2>
            <p>{hasValidLocation ? `Centered at ${latitude}, ${longitude}` : "Enter valid coordinates to show marker."}</p>
          </div>
          <LocationLeafletMap
            latitude={latitude}
            longitude={longitude}
            cropType={mapLocation.cropType}
            farmerName={mapLocation.farmerName}
            village={mapLocation.village}
            district={mapLocation.district}
            surveyNumber={mapLocation.surveyNumber}
          />
        </section>
      </div>

      <section className="gov-card location-farmer-card">
        <div className="friendly-card-heading">
          <h2>Farmer Details</h2>
          <p>Loaded from URL query parameters or the manual input form.</p>
        </div>
        <div className="satellite-result-grid compact-result">
          <span>Farmer ID<strong>{mapLocation.farmerId || "Not provided"}</strong></span>
          <span>Farmer Name<strong>{mapLocation.farmerName || "Not provided"}</strong></span>
          <span>Crop Type<strong>{mapLocation.cropType || "Not provided"}</strong></span>
          <span>Village<strong>{mapLocation.village || "Not provided"}</strong></span>
          <span>District<strong>{mapLocation.district || "Not provided"}</strong></span>
          <span>Survey Number<strong>{mapLocation.surveyNumber || "Not provided"}</strong></span>
          <span>Latitude<strong>{mapLocation.latitude || "Missing GPS"}</strong></span>
          <span>Longitude<strong>{mapLocation.longitude || "Missing GPS"}</strong></span>
        </div>
      </section>

      <section className="gov-card location-satellite-card">
        <div className="friendly-card-heading table-heading-row">
          <div>
            <h2>Satellite Verification</h2>
            <p>Run NDVI verification for the currently selected GPS point.</p>
          </div>
          <button className="download-csv-btn" type="button" onClick={runSatelliteVerification} disabled={loading}>
            {loading ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <Satellite size={16} aria-hidden="true" />}
            {loading ? "Running..." : "Run Satellite Verification"}
          </button>
        </div>

        {satelliteResult?.isDemo ? (
          <p className="demo-satellite-note">
            {satelliteResult.demoReason || "Demo satellite result shown because Sentinel API credentials are not configured."}
          </p>
        ) : null}

        {satelliteResult ? (
          <div className="satellite-result-grid">
            <span>NDVI Score<strong>{Number(satelliteResult.ndviScore).toFixed(2)}</strong></span>
            <span>Vegetation Status<strong>{satelliteResult.vegetationStatus}</strong></span>
            <span>Crop Health<strong>{satelliteResult.cropHealth}</strong></span>
            <span>Risk Level<strong className={`risk-badge ${riskClass(satelliteResult.riskLevel)}`}>{satelliteResult.riskLevel}</strong></span>
            <span>Satellite Date<strong>{satelliteResult.satelliteDate}</strong></span>
            <span>Cloud Cover Status<strong>{satelliteResult.cloudCoverStatus}</strong></span>
            <p className="satellite-risk-reason">{satelliteResult.riskReason}</p>
          </div>
        ) : (
          <p className="location-empty-result">No satellite result yet. Click Run Satellite Verification after confirming the map location.</p>
        )}
      </section>
    </section>
  );
}
