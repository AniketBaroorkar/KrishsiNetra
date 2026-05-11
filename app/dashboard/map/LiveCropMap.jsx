"use client";

import { useMemo, useState } from "react";
import { Circle, Filter } from "lucide-react";
import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { cropColors, farmSubmissions } from "../../../data/dashboardData";
import { riskLabel, riskLevel, uniqueValues } from "../../../utils/dashboard";

function markerIcon(crop) {
  return divIcon({
    className: "",
    html: `<span class="crop-marker" style="background:${cropColors[crop] || "#9ca3af"}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

export default function LiveCropMap() {
  const [filters, setFilters] = useState({
    district: "all",
    taluka: "all",
    crop: "all",
    fraud: "all",
  });

  const districts = uniqueValues(farmSubmissions, "district");
  const talukas = uniqueValues(farmSubmissions, "taluka");
  const crops = uniqueValues(farmSubmissions, "claimedCrop");

  const filtered = useMemo(() => {
    return farmSubmissions.filter((item) => {
      const fraudStatus = item.riskScore > 0.4 ? "fraud" : "clean";
      return (
        (filters.district === "all" || item.district === filters.district) &&
        (filters.taluka === "all" || item.taluka === filters.taluka) &&
        (filters.crop === "all" || item.claimedCrop === filters.crop) &&
        (filters.fraud === "all" || fraudStatus === filters.fraud)
      );
    });
  }, [filters]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="map-layout">
      <aside className="map-sidebar">
        <div className="page-header" style={{ marginBottom: 18 }}>
          <div>
            <h1 className="page-title">Live Crop Map</h1>
            <p className="page-subtitle">{filtered.length} farms visible</p>
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
            <label htmlFor="taluka">Taluka</label>
            <select
              id="taluka"
              value={filters.taluka}
              onChange={(event) => updateFilter("taluka", event.target.value)}
            >
              <option value="all">All talukas</option>
              {talukas.map((taluka) => (
                <option value={taluka} key={taluka}>
                  {taluka}
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
            <label htmlFor="fraud">Fraud Status</label>
            <select
              id="fraud"
              value={filters.fraud}
              onChange={(event) => updateFilter("fraud", event.target.value)}
            >
              <option value="all">All submissions</option>
              <option value="fraud">Fraud alerts</option>
              <option value="clean">Clean</option>
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
      </aside>

      <section className="map-canvas">
        <MapContainer center={[19.2, 75.4]} zoom={7} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {filtered.map((item) => (
            <Marker
              icon={markerIcon(item.claimedCrop)}
              key={item.id}
              position={[item.lat, item.lon]}
            >
              <Popup>
                <p className="popup-title">{item.farmer}</p>
                <div className="popup-grid">
                  <span>Claimed: {item.claimedCrop}</span>
                  <span>AI Prediction: {item.predictedCrop}</span>
                  <span>Risk: {item.riskScore.toFixed(2)} ({riskLabel(item.riskScore)})</span>
                  <span>Survey: {item.surveyNo}</span>
                  <span>Location: {item.taluka}, {item.district}</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </section>
    </div>
  );
}
