"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, Satellite } from "lucide-react";

import SatelliteVerificationPanel from "./SatelliteVerificationPanel";
import { getDemoFarmers, uniqueValues } from "../utils/farmers";

function buildLocationUrl(farmer) {
  const params = new URLSearchParams();
  params.set("farmerId", farmer.farmerId);
  if (farmer.latitude) params.set("lat", farmer.latitude);
  if (farmer.longitude) params.set("lng", farmer.longitude);
  if (farmer.cropType) params.set("crop", farmer.cropType);
  if (farmer.farmerName) params.set("farmer", farmer.farmerName);
  if (farmer.village) params.set("village", farmer.village);
  if (farmer.district) params.set("district", farmer.district);
  if (farmer.surveyNumber) params.set("survey", farmer.surveyNumber);
  return `/dashboard/location-check?${params.toString()}`;
}

export default function SatelliteVerificationWorkspace() {
  const router = useRouter();
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

  function openLocationCheck(farmer = selectedFarmer) {
    if (!farmer?.latitude || !farmer?.longitude) {
      router.push(`/dashboard/location-check?farmerId=${encodeURIComponent(farmer?.farmerId || "")}&farmer=${encodeURIComponent(farmer?.farmerName || "")}`);
      return;
    }
    router.push(buildLocationUrl(farmer));
  }

  return (
    <section className="gov-page satellite-page">
      <div className="gov-page-header">
        <div>
          <span className="gov-kicker"><Satellite size={16} aria-hidden="true" />Satellite Verification</span>
          <h1>Satellite Verification</h1>
          <p>Run Sentinel-2 NDVI checks only when an officer selects a farmer, keeping the dashboard fast and credentials server-side.</p>
        </div>
        <span className="api-notice">Contact: 9579207219</span>
      </div>

      <section className="gov-card sentinel-explainer-card">
        <h3>How Sentinel-2 freshness works</h3>
        <p>
          Sentinel-2 does not provide live video. It captures satellite images during satellite
          pass dates. Recent images may be unavailable because of cloud cover. KrishiNetra
          searches the last 7 days first, then expands to 15, 30, and 60 days if needed, and
          recommends Sentinel-1 SAR fallback when optical imagery is cloudy or outdated.
        </p>
        <div className="freshness-legend">
          <span className="freshness-pill fresh">0&ndash;7 days &middot; Fresh</span>
          <span className="freshness-pill recent">8&ndash;15 days &middot; Recent</span>
          <span className="freshness-pill stale">16&ndash;30 days &middot; Usable but older</span>
          <span className="freshness-pill old">&gt;30 days &middot; Old image warning</span>
        </div>
      </section>

      <div className="claims-toolbar satellite-toolbar">
        <label className="claims-search">
          <Search size={17} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search farmer, phone, village, district, crop" />
        </label>
        <div className="claims-toolbar-filters">
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
            <span>Mobile Number<strong>{selectedFarmer?.mobileNumber}</strong></span>
            <span>District<strong>{selectedFarmer?.district}</strong></span>
            <span>Submitted Date<strong>{selectedFarmer?.submissionDate}</strong></span>
          </div>
          <div className="satellite-action-row">
            <button className="btn-primary" type="button" onClick={() => openLocationCheck(selectedFarmer)}>
              <MapPin size={16} aria-hidden="true" />
              Open in Location Check
            </button>
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
          <h2>Farmer Location List</h2>
          <p>Select a farmer or open the exact GPS point in Location Check.</p>
        </div>
        <div className="friendly-table-wrap">
          <table className="friendly-table gov-table satellite-farmer-table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Mobile</th>
                <th>Crop</th>
                <th>Village</th>
                <th>District</th>
                <th>GPS</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.map((farmer) => (
                <tr key={farmer.farmerId}>
                  <td><strong>{farmer.farmerName}</strong><small>{farmer.farmerId}</small></td>
                  <td>{farmer.mobileNumber}</td>
                  <td>{farmer.cropType}</td>
                  <td>{farmer.village}</td>
                  <td>{farmer.district}</td>
                  <td>{farmer.latitude && farmer.longitude ? `${farmer.latitude}, ${farmer.longitude}` : "Missing GPS"}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" onClick={() => setSelectedFarmerId(farmer.farmerId)}>
                        <Satellite size={15} aria-hidden="true" />
                        Select
                      </button>
                      <button type="button" onClick={() => openLocationCheck(farmer)}>
                        <MapPin size={15} aria-hidden="true" />
                        Verify Location
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
