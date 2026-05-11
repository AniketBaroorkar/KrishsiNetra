"use client";

import { useMemo, useState } from "react";
import { Download, Filter, Satellite } from "lucide-react";

import {
  districtClaimOverview,
  platformStats,
  recentClaims,
  supportedCrops,
} from "../../data/dashboardData";

function statusClass(status) {
  if (status === "Verified") return "verified";
  if (status === "Pending") return "pending";
  if (status === "High Risk") return "high-risk";
  return "flagged";
}

function riskLevel(score) {
  if (score > 0.7) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
}

function exportClaims(rows) {
  const headers = [
    "Farmer Name",
    "District",
    "Taluka",
    "Survey No",
    "Claimed Crop",
    "AI Detected Crop",
    "NDVI",
    "Risk Score",
    "Status",
  ];
  const csv = [headers, ...rows.map((row) => [
    row.farmer,
    row.district,
    row.taluka,
    row.surveyNo,
    row.claimedCrop,
    row.predictedCrop,
    row.ndvi,
    row.riskScore,
    row.status,
  ])]
    .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "krishinetra-dashboard-claims.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const [filters, setFilters] = useState({
    district: "All",
    crop: "All",
    risk: "All",
    status: "All",
  });

  const districts = ["All", ...new Set(recentClaims.map((claim) => claim.district))];
  const statuses = ["All", "Verified", "Pending", "Flagged", "High Risk"];
  const risks = ["All", "Low", "Medium", "High"];

  const filteredClaims = useMemo(() => {
    return recentClaims.filter((claim) => {
      return (
        (filters.district === "All" || claim.district === filters.district) &&
        (filters.crop === "All" || claim.claimedCrop === filters.crop) &&
        (filters.status === "All" || claim.status === filters.status) &&
        (filters.risk === "All" || riskLevel(claim.riskScore) === filters.risk)
      );
    });
  }, [filters]);

  const selectedClaim = filteredClaims[0] || recentClaims[0];

  function setFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="friendly-page">
      <div className="friendly-header">
        <div>
          <h1>KrishiNetra Dashboard</h1>
          <p>Monitor farmer claims, AI predictions, NDVI verification, and fraud risk in one view.</p>
        </div>
        <button className="friendly-btn" onClick={() => exportClaims(filteredClaims)}>
          <Download size={17} aria-hidden="true" />
          Export CSV
        </button>
      </div>

      <div className="friendly-stats-grid">
        {platformStats.map((stat) => (
          <article className="friendly-stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>

      <div className="friendly-filter-card">
        <div className="filter-title">
          <Filter size={18} aria-hidden="true" />
          Filters
        </div>
        <label>
          District
          <select value={filters.district} onChange={(event) => setFilter("district", event.target.value)}>
            {districts.map((district) => <option key={district}>{district}</option>)}
          </select>
        </label>
        <label>
          Crop
          <select value={filters.crop} onChange={(event) => setFilter("crop", event.target.value)}>
            <option>All</option>
            {supportedCrops.map((crop) => <option key={crop}>{crop}</option>)}
          </select>
        </label>
        <label>
          Risk Level
          <select value={filters.risk} onChange={(event) => setFilter("risk", event.target.value)}>
            {risks.map((risk) => <option key={risk}>{risk}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
      </div>

      <div className="dashboard-overview-grid">
        <section className="friendly-card table-card">
          <div className="friendly-card-heading">
            <h2>Recent Farmer Submissions</h2>
            <p>Mock records showing how claims appear after AI and satellite checks.</p>
          </div>
          <div className="friendly-table-wrap">
            <table className="friendly-table">
              <thead>
                <tr>
                  <th>Farmer Name</th>
                  <th>District</th>
                  <th>Taluka</th>
                  <th>Survey No</th>
                  <th>Claimed Crop</th>
                  <th>AI Detected Crop</th>
                  <th>NDVI</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td>{claim.farmer}</td>
                    <td>{claim.district}</td>
                    <td>{claim.taluka}</td>
                    <td>{claim.surveyNo}</td>
                    <td>{claim.claimedCrop}</td>
                    <td>{claim.predictedCrop}</td>
                    <td>{claim.ndvi.toFixed(2)}</td>
                    <td>{claim.riskScore.toFixed(2)}</td>
                    <td>
                      <span className={`status-pill ${statusClass(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="friendly-card fraud-card">
          <h2>Fraud Score Explanation</h2>
          <p>Final score combines simple signals that officials can explain during review.</p>
          <div className="score-list">
            <span>Crop mismatch <strong>0.50</strong></span>
            <span>AI confidence <strong>0.30</strong></span>
            <span>GPS anomaly <strong>0.20</strong></span>
            <span>NDVI anomaly <strong>review flag</strong></span>
          </div>
          <div className="final-score">
            Final risk score: <strong>{selectedClaim.riskScore.toFixed(2)}</strong>
          </div>
        </aside>
      </div>

      <div className="dashboard-overview-grid bottom-grid">
        <section className="friendly-card ndvi-card">
          <div className="friendly-card-heading">
            <h2>NDVI Satellite Verification</h2>
            <p>Farm-style preview for the selected claim location.</p>
          </div>
          <div className="satellite-preview">
            <span className="sat-label tile-label">Satellite Tile</span>
            <span className="sat-label healthy-label">Healthy Crop Zone</span>
            <span className="sat-label low-label">Low NDVI Patch</span>
            <span className="sat-label claim-label">Claim Location</span>
            <div className="farm-plot healthy" />
            <div className="farm-plot moderate" />
            <div className="farm-plot damaged" />
            <div className="farm-plot healthy small" />
            <span className="claim-location-dot" />
          </div>
          <div className="ndvi-legend">
            <span><i className="legend-green" /> Dark Green = Healthy vegetation</span>
            <span><i className="legend-yellow" /> Yellow = Moderate crop health</span>
            <span><i className="legend-red" /> Red = Possible damaged/no crop area</span>
          </div>
          <div className="claim-detail-grid">
            <span>Claimed crop <strong>{selectedClaim.claimedCrop}</strong></span>
            <span>AI detected crop <strong>{selectedClaim.predictedCrop}</strong></span>
            <span>NDVI value <strong>{selectedClaim.ndvi.toFixed(2)}</strong></span>
            <span>Confidence score <strong>{Math.round(selectedClaim.confidence * 100)}%</strong></span>
            <span>GPS distance <strong>{selectedClaim.gpsDistanceKm.toFixed(2)} km</strong></span>
            <span>Risk score <strong>{selectedClaim.riskScore.toFixed(2)}</strong></span>
          </div>
          <p className="ndvi-explainer">
            NDVI = (NIR - Red) / (NIR + Red). High NDVI means healthy vegetation. Low NDVI can
            indicate bare soil, damaged crops, or mismatch.
          </p>
          <p className="fraud-reason">
            <Satellite size={17} aria-hidden="true" />
            {selectedClaim.fraudReason}
          </p>
        </section>

        <section className="friendly-card district-card">
          <div className="friendly-card-heading">
            <h2>District-wise Claim Overview</h2>
            <p>Claim volume and flagged records by district.</p>
          </div>
          <div className="district-bars">
            {districtClaimOverview.map((item) => (
              <div className="district-row" key={item.district}>
                <span>{item.district}</span>
                <div>
                  <i style={{ width: `${Math.min(100, item.claims / 7)}%` }} />
                </div>
                <strong>{item.claims}</strong>
                <em>{item.flagged} flagged</em>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
