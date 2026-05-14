"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Flag,
  Image as ImageIcon,
  MapPin,
  Search,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";

import { fetchClaims, getDemoClaims, getRiskLevel, patchClaimStatus } from "../utils/claims";

const riskOptions = ["All", "Low", "Medium", "High"];
const statusOptions = ["All", "Pending", "Verified", "Approved", "Rejected", "Flagged", "High Risk"];

function riskBadgeClass(level) {
  if (level === "High") return "high";
  if (level === "Medium") return "medium";
  return "low";
}

function statusBadgeClass(status) {
  if (status === "Approved" || status === "Verified") return "approved";
  if (status === "Rejected") return "rejected";
  if (status === "Flagged" || status === "High Risk") return "flagged";
  return "pending";
}

function ClaimActions({ claim, onStatusChange }) {
  return (
    <div className="claim-actions">
      <button type="button" className="approve" onClick={() => onStatusChange(claim, "Approved")}>
        <ThumbsUp size={15} aria-hidden="true" />
        Approve
      </button>
      <button type="button" className="reject" onClick={() => onStatusChange(claim, "Rejected")}>
        <ThumbsDown size={15} aria-hidden="true" />
        Reject
      </button>
      <button type="button" className="flag" onClick={() => onStatusChange(claim, "Flagged")}>
        <Flag size={15} aria-hidden="true" />
        Flag
      </button>
    </div>
  );
}

function ClaimDetailsModal({ claim, onClose, onStatusChange }) {
  if (!claim) return null;

  return (
    <div className="claim-modal-backdrop" role="presentation">
      <section className="claim-modal" role="dialog" aria-modal="true" aria-labelledby="claim-modal-title">
        <div className="claim-modal-header">
          <div>
            <span className="gov-kicker">Claim Details</span>
            <h2 id="claim-modal-title">{claim.id}</h2>
            <p>{claim.farmerName} - {claim.village}, {claim.district}</p>
          </div>
          <div className="modal-header-actions">
            <button className="back-button" type="button" onClick={onClose}>← Back</button>
            <button type="button" onClick={onClose} aria-label="Close claim details">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="claim-modal-grid">
          <div className="claim-photo-panel">
            {claim.photoUrl ? (
              // External demo image. Replace with backend-uploaded photo URL in production.
              <img src={claim.photoUrl} alt={`${claim.cropClaimed} claim submitted by ${claim.farmerName}`} />
            ) : (
              <div className="missing-photo">
                <ImageIcon size={38} aria-hidden="true" />
                Missing crop photo
              </div>
            )}
          </div>

          <div className="claim-detail-panel">
            <h3>Farmer Details</h3>
            <div className="detail-list">
              <span>Farmer <strong>{claim.farmerName}</strong></span>
              <span>Phone <strong>{claim.phone}</strong></span>
              <span>Village <strong>{claim.village}</strong></span>
              <span>District <strong>{claim.district}</strong></span>
              <span>Claim Amount <strong>{claim.claimAmount}</strong></span>
              <span>Submitted <strong>{claim.submittedDate}</strong></span>
            </div>
          </div>
        </div>

        <div className="claim-modal-grid">
          <div className="claim-detail-panel">
            <h3>AI Verification</h3>
            <div className="detail-list">
              <span>Crop claimed <strong>{claim.cropClaimed}</strong></span>
              <span>AI predicted crop <strong>{claim.predictedCrop}</strong></span>
              <span>Confidence score <strong>{Math.round(claim.confidenceScore * 100)}%</strong></span>
              <span>Risk score <strong>{claim.riskScore.toFixed(2)}</strong></span>
              <span>Risk level <strong>{claim.riskLevel}</strong></span>
              <span>Status <strong>{claim.status}</strong></span>
            </div>
            <p className="fraud-reason">
              <ShieldAlert size={17} aria-hidden="true" />
              {claim.fraudReason}
            </p>
          </div>

          <div className="claim-detail-panel">
            <h3>GPS & Satellite Verification</h3>
            <div className="mini-map">
              <span className="map-grid-label">
                {claim.gpsLat && claim.gpsLon ? `${claim.gpsLat}, ${claim.gpsLon}` : "GPS missing"}
              </span>
              {claim.gpsLat && claim.gpsLon ? <span className="map-pin verified"><MapPin size={18} aria-hidden="true" /></span> : null}
              <i className="map-field one" />
              <i className="map-field two" />
              <i className="map-field three" />
            </div>
            <p className="satellite-result">{claim.satelliteResult}</p>
          </div>
        </div>

        <div className="modal-action-row">
          <ClaimActions claim={claim} onStatusChange={onStatusChange} />
        </div>
      </section>
    </div>
  );
}

export default function ClaimsWorkspace({ mode = "overview" }) {
  const [claims, setClaims] = useState(() => getDemoClaims());
  const [apiNotice, setApiNotice] = useState("Loading claims...");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [selectedClaim, setSelectedClaim] = useState(null);

  useEffect(() => {
    let active = true;

    fetchClaims()
      .then((result) => {
        if (!active) return;
        if (result.claims.length > 0) {
          setClaims(result.claims);
          setApiNotice(
            result.source === "backend"
              ? "Connected to backend API."
              : "Backend unavailable, showing demo Maharashtra data.",
          );
        } else {
          setApiNotice("Backend returned no claims, showing demo Maharashtra data.");
        }
      })
      .catch((error) => {
        if (!active) return;
        setApiNotice(`Backend unavailable, showing demo data. ${error.message}`);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredClaims = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return claims.filter((claim) => {
      const matchesQuery =
        !normalizedQuery ||
        [claim.id, claim.farmerName, claim.phone, claim.village, claim.district, claim.cropClaimed]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const riskLevel = claim.riskLevel || getRiskLevel(claim.riskScore);
      return (
        matchesQuery &&
        (statusFilter === "All" || claim.status === statusFilter) &&
        (riskFilter === "All" || riskLevel === riskFilter)
      );
    });
  }, [claims, query, riskFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: claims.length,
      verified: claims.filter((claim) => claim.status === "Verified" || claim.status === "Approved").length,
      flagged: claims.filter((claim) => claim.status === "Flagged").length,
      rejected: claims.filter((claim) => claim.status === "Rejected").length,
      highRisk: claims.filter((claim) => (claim.riskLevel || getRiskLevel(claim.riskScore)) === "High").length,
      pending: claims.filter((claim) => claim.status === "Pending").length,
      lowRisk: claims.filter((claim) => (claim.riskLevel || getRiskLevel(claim.riskScore)) === "Low").length,
      mediumRisk: claims.filter((claim) => (claim.riskLevel || getRiskLevel(claim.riskScore)) === "Medium").length,
    };
  }, [claims]);

  async function updateStatus(claim, status) {
    const previousClaims = claims;
    const nextClaims = claims.map((item) => (item.id === claim.id ? { ...item, status } : item));
    setClaims(nextClaims);
    setSelectedClaim((current) => (current?.id === claim.id ? { ...current, status } : current));

    try {
      const updated = await patchClaimStatus(claim, status);
      setClaims((current) => current.map((item) => (item.id === claim.id ? { ...item, ...updated, status } : item)));
      setSelectedClaim((current) => (current?.id === claim.id ? { ...current, ...updated, status } : current));
      setApiNotice(claim.apiId ? "Claim status updated in backend." : "Demo claim status updated locally.");
    } catch (error) {
      setClaims(previousClaims);
      setSelectedClaim(claim);
      setApiNotice(`Status update failed, restored previous value. ${error.message}`);
    }
  }

  const recentClaims = filteredClaims.slice(0, mode === "overview" ? 6 : filteredClaims.length);

  return (
    <section className="gov-page">
      <div className="gov-page-header">
        <div>
          <span className="gov-kicker">{mode === "overview" ? "Overview Page" : "Claims Management"}</span>
          <h1>{mode === "overview" ? "KrishiNetra Dashboard" : "All Farmer Claims"}</h1>
          <p>
            Review crop claims, AI predictions, GPS evidence, risk scores, and officer decisions
            from one clean government agriculture console.
          </p>
        </div>
        <span className="api-notice">{apiNotice}</span>
      </div>

      <div className="gov-stat-grid six">
        <article className="gov-stat-card">
          <span className="gov-stat-icon"><ShieldAlert size={20} aria-hidden="true" /></span>
          <span>Total Claims</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="gov-stat-card">
          <span className="gov-stat-icon"><CheckCircle2 size={20} aria-hidden="true" /></span>
          <span>Verified Claims</span>
          <strong>{stats.verified}</strong>
        </article>
        <article className="gov-stat-card">
          <span className="gov-stat-icon"><Flag size={20} aria-hidden="true" /></span>
          <span>Flagged Claims</span>
          <strong>{stats.flagged}</strong>
        </article>
        <article className="gov-stat-card">
          <span className="gov-stat-icon"><ThumbsDown size={20} aria-hidden="true" /></span>
          <span>Rejected Claims</span>
          <strong>{stats.rejected}</strong>
        </article>
        <article className="gov-stat-card">
          <span className="gov-stat-icon"><AlertTriangle size={20} aria-hidden="true" /></span>
          <span>High Risk Claims</span>
          <strong>{stats.highRisk}</strong>
        </article>
        <article className="gov-stat-card">
          <span className="gov-stat-icon"><Eye size={20} aria-hidden="true" /></span>
          <span>Pending Claims</span>
          <strong>{stats.pending}</strong>
        </article>
      </div>

      <div className="claims-toolbar">
        <label className="claims-search">
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search claim ID, farmer, phone, village, district, crop"
          />
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statusOptions.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label>
          Risk
          <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
            {riskOptions.map((risk) => <option key={risk}>{risk}</option>)}
          </select>
        </label>
      </div>

      {mode === "overview" ? (
        <div className="risk-summary-grid">
          <article className="risk-summary-card low">
            <span>Low Risk</span>
            <strong>{stats.lowRisk}</strong>
            <i style={{ width: `${stats.total ? (stats.lowRisk / stats.total) * 100 : 0}%` }} />
          </article>
          <article className="risk-summary-card medium">
            <span>Medium Risk</span>
            <strong>{stats.mediumRisk}</strong>
            <i style={{ width: `${stats.total ? (stats.mediumRisk / stats.total) * 100 : 0}%` }} />
          </article>
          <article className="risk-summary-card high">
            <span>High Risk</span>
            <strong>{stats.highRisk}</strong>
            <i style={{ width: `${stats.total ? (stats.highRisk / stats.total) * 100 : 0}%` }} />
          </article>
        </div>
      ) : null}

      <section className="gov-card">
        <div className="friendly-card-heading table-heading-row">
          <div>
            <h2>{mode === "overview" ? "Recent Claims" : "Claims Management Table"}</h2>
            <p>{filteredClaims.length} matching claim records</p>
          </div>
        </div>
        <div className="friendly-table-wrap">
          <table className="friendly-table gov-table claims-table">
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Farmer Name</th>
                <th>Phone Number</th>
                <th>Village</th>
                <th>District</th>
                <th>Crop Claimed</th>
                <th>Predicted Crop</th>
                <th>GPS Latitude</th>
                <th>GPS Longitude</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Submitted Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentClaims.map((claim) => {
                const riskLevel = claim.riskLevel || getRiskLevel(claim.riskScore);
                return (
                  <tr key={claim.id}>
                    <td><strong>{claim.id}</strong></td>
                    <td>{claim.farmerName}</td>
                    <td>{claim.phone}</td>
                    <td>{claim.village}</td>
                    <td>{claim.district}</td>
                    <td>{claim.cropClaimed}</td>
                    <td>{claim.predictedCrop}</td>
                    <td>{claim.gpsLat ?? "Missing"}</td>
                    <td>{claim.gpsLon ?? "Missing"}</td>
                    <td>
                      <span className={`risk-badge ${riskBadgeClass(riskLevel)}`}>
                        {riskLevel} {claim.riskScore.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${statusBadgeClass(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td>{claim.submittedDate}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" onClick={() => setSelectedClaim(claim)}>
                          <Eye size={15} aria-hidden="true" />
                          View
                        </button>
                        <ClaimActions claim={claim} onStatusChange={updateStatus} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <ClaimDetailsModal
        claim={selectedClaim}
        onClose={() => setSelectedClaim(null)}
        onStatusChange={updateStatus}
      />
    </section>
  );
}
