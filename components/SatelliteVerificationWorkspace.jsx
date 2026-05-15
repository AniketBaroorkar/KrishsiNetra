"use client";

import { useMemo, useState } from "react";
import { Search, Satellite } from "lucide-react";

import SatelliteVerificationPanel from "./SatelliteVerificationPanel";
import { getDemoFarmers, uniqueValues } from "../utils/farmers";

export default function SatelliteVerificationWorkspace() {
  const farmers = useMemo(() => getDemoFarmers(), []);
  const [query, setQuery] = useState("");
  const [selectedFarmerId, setSelectedFarmerId] = useState(farmers[0]?.farmerId || "");

  const filteredFarmers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return farmers;
    return farmers.filter((farmer) => (
      `${farmer.farmerId} ${farmer.farmerName} ${farmer.mobileNumber} ${farmer.village} ${farmer.district} ${farmer.cropType}`
        .toLowerCase()
        .includes(normalized)
    ));
  }, [farmers, query]);

  const selectedFarmer = farmers.find((farmer) => farmer.farmerId === selectedFarmerId) || filteredFarmers[0] || farmers[0];
  const districts = uniqueValues(farmers, "district").slice(0, 6);

  return (
    <section className="gov-page satellite-page">
      <div className="gov-page-header">
        <div>
          <span className="gov-kicker"><Satellite size={16} aria-hidden="true" />Satellite Verification</span>
          <h1>Satellite Verification</h1>
          <p>Run Sentinel-2 NDVI checks only when an officer selects a farmer, keeping the dashboard fast and credentials server-side.</p>
        </div>
        <span className="api-notice">Server route: POST /api/satellite/verify</span>
      </div>

      <div className="claims-toolbar satellite-toolbar">
        <label className="claims-search">
          <Search size={17} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search farmer, phone, village, district, crop" />
        </label>
        <label>
          Select Farmer
          <select value={selectedFarmer?.farmerId || ""} onChange={(event) => setSelectedFarmerId(event.target.value)}>
            {filteredFarmers.map((farmer) => (
              <option key={farmer.farmerId} value={farmer.farmerId}>
                {farmer.farmerName} - {farmer.cropType}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="satellite-overview-grid">
        <section className="gov-card">
          <div className="friendly-card-heading">
            <h2>Farmer GPS Coordinates</h2>
            <p>{selectedFarmer?.farmerName} from {selectedFarmer?.village}, {selectedFarmer?.district}</p>
          </div>
          <div className="satellite-result-grid compact-result">
            <span>Latitude<strong>{selectedFarmer?.latitude ?? "Missing GPS"}</strong></span>
            <span>Longitude<strong>{selectedFarmer?.longitude ?? "Missing GPS"}</strong></span>
            <span>Crop Type<strong>{selectedFarmer?.cropType}</strong></span>
            <span>Submitted Date<strong>{selectedFarmer?.submissionDate}</strong></span>
          </div>
        </section>

        <section className="gov-card ndvi-explanation-card">
          <div className="friendly-card-heading">
            <h2>NDVI Explanation</h2>
            <p>NDVI compares Sentinel-2 B08 Near Infrared with B04 Red reflectance to estimate vegetation health.</p>
          </div>
          <strong>NDVI = (B08 - B04) / (B08 + B04)</strong>
          <div className="ndvi-scale"><span>High risk</span><div /><span>Low risk</span></div>
        </section>
      </div>

      {selectedFarmer ? (
        <SatelliteVerificationPanel
          record={selectedFarmer}
          uploadedPhotoUrl={selectedFarmer.photoUrl}
          title={`${selectedFarmer.farmerName} Satellite Verification`}
        />
      ) : null}

      <section className="gov-card">
        <div className="friendly-card-heading">
          <h2>Recent Verification History</h2>
          <p>Session results are cached per farmer after clicking Run Satellite Verification.</p>
        </div>
        <div className="chip-grid">
          {districts.map((district) => <span className="district-chip" key={district}>{district}</span>)}
        </div>
      </section>
    </section>
  );
}
