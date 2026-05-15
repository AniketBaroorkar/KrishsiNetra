"use client";

import { useMemo, useState } from "react";
import { Circle, Filter, MapPin } from "lucide-react";
import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { getDemoClaims, getRiskLevel } from "../../../utils/claims";

const cropColors = {
  Wheat: "#eab308",
  Rice: "#38bdf8",
  Sugarcane: "#16a34a",
  Cotton: "#f8fafc",
  Soybean: "#8b5cf6",
  Jowar: "#f97316",
  Onion: "#fb7185",
  Grapes: "#9333ea",
};

function markerIcon(claim) {
  const risk = claim.riskLevel || getRiskLevel(claim.riskScore);
  const border = risk === "High" ? "#dc2626" : risk === "Medium" ? "#f59e0b" : "#16a34a";

  return divIcon({
    className: "",
    html: `<span class="crop-marker" style="background:${cropColors[claim.cropClaimed] || "#9ca3af"}; border-color:${border}"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort();
}

export default function LiveCropMap() {
  const claims = useMemo(() => getDemoClaims(), []);
  const [filters, setFilters] = useState({
    district: "all",
    crop: "all",
    risk: "all",
  });

  const districts = uniqueValues(claims, "district");
  const crops = uniqueValues(claims, "cropClaimed");

  const filtered = useMemo(() => {
    return claims.filter((claim) => {
      const risk = claim.riskLevel || getRiskLevel(claim.riskScore);
      return (
        (filters.district === "all" || claim.district === filters.district) &&
        (filters.crop === "all" || claim.cropClaimed === filters.crop) &&
        (filters.risk === "all" || risk === filters.risk)
      );
    });
  }, [claims, filters]);

  const mappableClaims = filtered.filter((claim) => claim.gpsLat && claim.gpsLon);
  const missingGpsClaims = filtered.filter((claim) => !claim.gpsLat || !claim.gpsLon);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="map-layout">
      <aside className="map-sidebar">
        <div className="page-header" style={{ marginBottom: 18 }}>
          <div>
            <h1 className="page-title">Claim Location Map</h1>
            <p className="page-subtitle">{mappableClaims.length} claim markers visible</p>
          </div>
          <Filter size={20} aria-hidden="true" />
        </div>

        <div className="grid">
          <div className="field">
            <label htmlFor="district">District</label>
            <select
              id="district"
              value={filters.district}
              onChange={(event) => updateFilter("district", event.target.value)}
            >
              <option value="all">All districts</option>
              {districts.map((district) => (
                <option value={district} key={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="crop">Crop Type</label>
            <select
              id="crop"
              value={filters.crop}
              onChange={(event) => updateFilter("crop", event.target.value)}
            >
              <option value="all">All crops</option>
              {crops.map((crop) => (
                <option value={crop} key={crop}>
                  {crop}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="risk">Risk Level</label>
            <select
              id="risk"
              value={filters.risk}
              onChange={(event) => updateFilter("risk", event.target.value)}
            >
              <option value="all">All risk levels</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div className="panel panel-pad" style={{ marginTop: 18 }}>
          <strong>Crop Colors</strong>
          <div className="grid" style={{ marginTop: 12, gap: 9 }}>
            {Object.entries(cropColors).map(([crop, color]) => (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }} key={crop}>
                <Circle size={12} fill={color} color={color} aria-hidden="true" />
                {crop}
              </span>
            ))}
          </div>
        </div>

        {missingGpsClaims.length ? (
          <div className="panel panel-pad missing-gps-list" style={{ marginTop: 18 }}>
            <strong>Claims Missing GPS</strong>
            {missingGpsClaims.map((claim) => (
              <span key={claim.id}>
                <MapPin size={14} aria-hidden="true" />
                {claim.id} - {claim.farmerName}
              </span>
            ))}
          </div>
        ) : null}
      </aside>

      <section className="map-canvas">
        <MapContainer center={[19.2, 75.4]} zoom={7} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mappableClaims.map((claim) => (
            <Marker
              icon={markerIcon(claim)}
              key={claim.id}
              position={[claim.gpsLat, claim.gpsLon]}
            >
              <Popup>
                <p className="popup-title">{claim.farmerName}</p>
                <div className="popup-grid">
                  <span>Claim ID: {claim.id}</span>
                  <span>Crop: {claim.cropClaimed}</span>
                  <span>Risk: {claim.riskScore.toFixed(2)} ({claim.riskLevel})</span>
                  <span>Status: {claim.status}</span>
                  <span>Location: {claim.village}, {claim.district}</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </section>
    </div>
  );
}
