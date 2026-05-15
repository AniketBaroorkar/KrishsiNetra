"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
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

import { useLanguage } from "./LanguageProvider";
import SatelliteVerificationPanel from "./SatelliteVerificationPanel";
import { fetchClaims, getDemoClaims, getRiskLevel, patchClaimStatus } from "../utils/claims";

const riskOptions = ["All", "Low", "Medium", "High"];
const statusOptions = ["All", "Pending", "Verified", "Approved", "Rejected", "Flagged", "High Risk"];

const CLAIM_STATUS_TONES = [
  { key: "pending", label: "Pending", color: "#0369a1" },
  { key: "approved", label: "Approved", color: "#166534" },
  { key: "rejected", label: "Rejected", color: "#991b1b" },
  { key: "flagged", label: "Flagged", color: "#b45309" },
];

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

function riskLabel(level, t) {
  if (level === "High") return t("highRisk");
  if (level === "Medium") return t("mediumRisk");
  if (level === "Low") return t("lowRisk");
  return t("all");
}

function statusLabel(status, t) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "all") return t("all");
  if (normalized === "approved") return t("approved");
  if (normalized === "verified") return t("verified");
  if (normalized === "rejected") return t("rejected");
  if (normalized === "flagged") return t("flagged");
  if (normalized === "high risk") return t("highRisk");
  if (normalized === "pending") return t("pending");
  return status || "";
}

function gpsTrustClass(status) {
  if (status === "Valid") return "valid";
  if (status === "Spoofing Suspected") return "spoofing";
  if (status === "Suspicious") return "suspicious";
  return "unknown";
}

function mockLocationLabel(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Unknown";
}

function ClaimActions({ claim, onStatusChange, t }) {
  return (
    <div className="claim-actions">
      <button type="button" className="approve" onClick={() => onStatusChange(claim, "Approved")}>
        <ThumbsUp size={15} aria-hidden="true" />
        {t("approveClaim")}
      </button>
      <button type="button" className="reject" onClick={() => onStatusChange(claim, "Rejected")}>
        <ThumbsDown size={15} aria-hidden="true" />
        {t("rejectClaim")}
      </button>
      <button type="button" className="flag" onClick={() => onStatusChange(claim, "Flagged")}>
        <Flag size={15} aria-hidden="true" />
        {t("flagAsFraud")}
      </button>
    </div>
  );
}

function ClaimDetailsModal({ claim, onClose, onStatusChange, t }) {
  if (!claim) return null;

  return (
    <div className="claim-modal-backdrop" role="presentation">
      <section className="claim-modal" role="dialog" aria-modal="true" aria-labelledby="claim-modal-title">
        <div className="claim-modal-header">
          <div>
            <span className="gov-kicker">{t("claimDetails")}</span>
            <h2 id="claim-modal-title">{claim.id}</h2>
            <p>{claim.farmerName} - {claim.village}, {claim.district}</p>
          </div>
          <div className="modal-header-actions">
            <button className="back-button" type="button" onClick={onClose}>
              <span aria-hidden="true">&larr;</span>
              {t("back")}
            </button>
            <button type="button" onClick={onClose} aria-label="Close claim details">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="claim-modal-grid">
          <div className="claim-photo-panel">
            {claim.photoUrl ? (
              <img src={claim.photoUrl} alt={`${claim.cropClaimed} claim submitted by ${claim.farmerName}`} />
            ) : (
              <div className="missing-photo">
                <ImageIcon size={38} aria-hidden="true" />
                {t("missingPhoto")}
              </div>
            )}
          </div>

          <div className="claim-detail-panel">
            <h3>{t("farmerDetails")}</h3>
            <div className="detail-list">
              <span>{t("farmerName")} <strong>{claim.farmerName}</strong></span>
              <span>{t("phoneNumber")} <strong>{claim.phone}</strong></span>
              <span>{t("village")} <strong>{claim.village}</strong></span>
              <span>{t("district")} <strong>{claim.district}</strong></span>
              <span>Claim Amount <strong>{claim.claimAmount}</strong></span>
              <span>{t("submittedDate")} <strong>{claim.submittedDate}</strong></span>
            </div>
          </div>
        </div>

        <div className="claim-modal-grid">
          <div className="claim-detail-panel">
            <h3>{t("aiClaimVerification")}</h3>
            <div className="detail-list">
              <span>{t("cropClaimed")} <strong>{claim.cropClaimed}</strong></span>
              <span>{t("aiPredictedCrop")} <strong>{claim.predictedCrop}</strong></span>
              <span>{t("confidence")} <strong>{Math.round(claim.confidenceScore * 100)}%</strong></span>
              <span>{t("riskScore")} <strong>{claim.riskScore.toFixed(2)}</strong></span>
              <span>{t("riskScore")} <strong>{riskLabel(claim.riskLevel, t)}</strong></span>
              <span>{t("status")} <strong>{statusLabel(claim.status, t)}</strong></span>
            </div>
            <p className="fraud-reason">
              <ShieldAlert size={17} aria-hidden="true" />
              {claim.fraudReason}
            </p>
          </div>

          <div className="claim-detail-panel">
            <h3>{t("gpsLocationAlertHistory")}</h3>
            <div className="mini-map">
              <span className="map-grid-label">
                {claim.gpsLat && claim.gpsLon ? `${claim.gpsLat}, ${claim.gpsLon}` : t("missingGps")}
              </span>
              {claim.gpsLat && claim.gpsLon ? <span className="map-pin verified"><MapPin size={18} aria-hidden="true" /></span> : null}
              <i className="map-field one" />
              <i className="map-field two" />
              <i className="map-field three" />
            </div>
            <p className="satellite-result">{claim.satelliteResult}</p>
          </div>
        </div>

        <div className="claim-modal-section">
          <section className="location-integrity-card">
            <div className="friendly-card-heading">
              <h3>Location Integrity Check</h3>
              <p>GPS Trust Status, Mock Location Detection, and photo capture evidence.</p>
            </div>
            <div className="location-integrity-grid">
              <span>GPS Coordinates<strong>{claim.gpsLat && claim.gpsLon ? `${claim.gpsLat}, ${claim.gpsLon}` : t("missingGps")}</strong></span>
              <span>GPS Accuracy<strong>{claim.gpsAccuracy ? `${claim.gpsAccuracy} meters` : "Unknown"}</strong></span>
              <span>GPS Timestamp<strong>{claim.gpsTimestamp || "Unknown"}</strong></span>
              <span>GPS Provider<strong>{claim.gpsProvider || "Unknown"}</strong></span>
              <span>Mock Location Detected<strong>{mockLocationLabel(claim.isMockLocation)}</strong></span>
              <span>Photo Capture Type<strong>{claim.photoCaptureType || "Unknown"}</strong></span>
              <span>GPS Trust Status<strong className={`gps-trust-badge ${gpsTrustClass(claim.gpsTrustStatus)}`}>{claim.gpsTrustStatus}</strong></span>
              <span className="wide">Location Risk Reason<strong>{claim.locationRiskReason}</strong></span>
            </div>
          </section>
        </div>

        <div className="claim-modal-section">
          <SatelliteVerificationPanel
            record={claim}
            uploadedPhotoUrl={claim.photoUrl}
            title={t("satelliteVerification")}
          />
        </div>

        <div className="modal-action-row">
          <ClaimActions claim={claim} onStatusChange={onStatusChange} t={t} />
        </div>
      </section>
    </div>
  );
}

export default function ClaimsWorkspace({ mode = "overview" }) {
  const { t } = useLanguage();
  const [claims, setClaims] = useState(() => getDemoClaims());
  const [apiNoticeKey, setApiNoticeKey] = useState("usingDemo");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [gpsTrustFilter, setGpsTrustFilter] = useState("All");
  const [selectedClaim, setSelectedClaim] = useState(null);

  useEffect(() => {
    let active = true;

    fetchClaims()
      .then((result) => {
        if (!active) return;
        if (result.claims.length > 0) {
          setClaims(result.claims);
          setApiNoticeKey(result.source === "backend" ? "connectedBackend" : "usingDemo");
        } else {
          setApiNoticeKey("usingDemo");
        }
      })
      .catch(() => {
        if (!active) return;
        setApiNoticeKey("usingDemo");
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
        (riskFilter === "All" || riskLevel === riskFilter) &&
        (gpsTrustFilter === "All" || claim.gpsTrustStatus === gpsTrustFilter)
      );
    });
  }, [claims, gpsTrustFilter, query, riskFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: claims.length,
      verified: claims.filter((claim) => claim.status === "Verified" || claim.status === "Approved").length,
      approved: claims.filter((claim) => claim.status === "Approved").length,
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
      setApiNoticeKey(claim.apiId ? "connectedBackend" : "usingDemo");
    } catch (error) {
      setClaims(previousClaims);
      setSelectedClaim(claim);
      setApiNoticeKey("usingDemo");
    }
  }

  const recentClaims = filteredClaims.slice(0, mode === "overview" ? 6 : filteredClaims.length);

  return (
    <section className="gov-page">
      <div className="gov-page-header">
        <div>
          <span className="gov-kicker">{mode === "overview" ? t("dashboard") : t("claimsManagement")}</span>
          <h1>{mode === "overview" ? t("dashboardTitle") : t("claimsTitle")}</h1>
          <p>{t("claimsSubtitle")}</p>
        </div>
        <span className="api-notice">{t("contact")}: 9579207219</span>
      </div>

      {(() => {
        const breakdown = CLAIM_STATUS_TONES.map((tone) => ({
          ...tone,
          count: stats[tone.key] || 0,
        }));
        const breakdownTotal = breakdown.reduce((sum, item) => sum + item.count, 0);
        const awaitingReview = stats.pending + stats.flagged;
        return (
          <>
            <div className="hero-kpi-grid">
              <article className="hero-kpi-card">
                <span className="hero-kpi-icon"><ShieldAlert size={22} aria-hidden="true" /></span>
                <div className="hero-kpi-body">
                  <span className="hero-kpi-label">{t("totalClaims")}</span>
                  <strong>{stats.total}</strong>
                  <small>All farmer submissions</small>
                </div>
              </article>
              <article className="hero-kpi-card">
                <span className="hero-kpi-icon hero-kpi-icon-amber"><Eye size={22} aria-hidden="true" /></span>
                <div className="hero-kpi-body">
                  <span className="hero-kpi-label">Awaiting Review</span>
                  <strong>{awaitingReview}</strong>
                  <small>{stats.pending} pending &middot; {stats.flagged} flagged</small>
                </div>
              </article>
              <article className="hero-kpi-card">
                <span className="hero-kpi-icon hero-kpi-icon-red"><AlertTriangle size={22} aria-hidden="true" /></span>
                <div className="hero-kpi-body">
                  <span className="hero-kpi-label">{t("highRiskClaims")}</span>
                  <strong>{stats.highRisk}</strong>
                  <small>Need immediate officer attention</small>
                </div>
              </article>
            </div>

            <section className="gov-card claim-status-card">
              <div className="friendly-card-heading">
                <h2>Status Breakdown</h2>
                <p>Where the {stats.total} claims sit by review state.</p>
              </div>
              <div className="status-bar-row" role="img" aria-label="Claim status distribution">
                {breakdown.map(({ key, label, color, count }) => (
                  count ? (
                    <span
                      className="status-bar-segment"
                      key={key}
                      style={{ flex: count, background: color }}
                      title={`${label}: ${count}`}
                    />
                  ) : null
                ))}
              </div>
              <div className="status-chip-grid">
                {breakdown.map(({ key, label, color, count }) => {
                  const pct = breakdownTotal ? (count / breakdownTotal) * 100 : 0;
                  return (
                    <div className="status-chip" key={key}>
                      <span className="status-chip-dot" style={{ background: color }} />
                      <div>
                        <strong>{count}</strong>
                        <small>{label} &middot; {pct.toFixed(0)}%</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        );
      })()}

      <div className="claims-toolbar">
        <label className="claims-search">
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`${t("search")} ${t("claimId")}, ${t("farmerName")}, ${t("phoneNumber")}, ${t("village")}, ${t("district")}, ${t("cropType")}`}
          />
        </label>
        <div className="claims-toolbar-filters">
          <label>
            {t("status")}
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((status) => <option key={status} value={status}>{statusLabel(status, t)}</option>)}
            </select>
          </label>
          <label>
            {t("riskScore")}
            <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
              {riskOptions.map((risk) => <option key={risk} value={risk}>{riskLabel(risk, t)}</option>)}
            </select>
          </label>
          <label>
            GPS Trust Status
            <select value={gpsTrustFilter} onChange={(event) => setGpsTrustFilter(event.target.value)}>
              {["All", "Valid", "Suspicious", "Spoofing Suspected", "Unknown"].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
        </div>
      </div>

      {mode === "overview" ? (
        <div className="risk-summary-grid">
          <article className="risk-summary-card low">
            <span>{t("lowRisk")}</span>
            <strong>{stats.lowRisk}</strong>
            <i style={{ width: `${stats.total ? (stats.lowRisk / stats.total) * 100 : 0}%` }} />
          </article>
          <article className="risk-summary-card medium">
            <span>{t("mediumRisk")}</span>
            <strong>{stats.mediumRisk}</strong>
            <i style={{ width: `${stats.total ? (stats.mediumRisk / stats.total) * 100 : 0}%` }} />
          </article>
          <article className="risk-summary-card high">
            <span>{t("highRisk")}</span>
            <strong>{stats.highRisk}</strong>
            <i style={{ width: `${stats.total ? (stats.highRisk / stats.total) * 100 : 0}%` }} />
          </article>
        </div>
      ) : null}

      <section className="gov-card">
        <div className="friendly-card-heading table-heading-row">
          <div>
            <h2>{mode === "overview" ? t("recentClaims") : t("claimsTable")}</h2>
            <p>{filteredClaims.length} {t("matchingClaimRecords")}</p>
          </div>
        </div>
        <div className="friendly-table-wrap">
          <table className="friendly-table gov-table claims-table">
            <thead>
              <tr>
                <th>{t("claimId")}</th>
                <th>{t("farmerName")}</th>
                <th>{t("phoneNumber")}</th>
                <th>{t("village")}</th>
                <th>{t("district")}</th>
                <th>{t("cropClaimed")}</th>
                <th>{t("predictedCrop")}</th>
                <th>{t("gpsLatitude")}</th>
                <th>{t("gpsLongitude")}</th>
                <th>{t("riskScore")}</th>
                <th>{t("status")}</th>
                <th>GPS Trust Status</th>
                <th>Mock Location</th>
                <th>GPS Accuracy</th>
                <th>Location Risk</th>
                <th>{t("submittedDate")}</th>
                <th>{t("action")}</th>
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
                    <td>{claim.gpsLat ?? t("missingGps")}</td>
                    <td>{claim.gpsLon ?? t("missingGps")}</td>
                    <td>
                      <span className={`risk-badge ${riskBadgeClass(riskLevel)}`}>
                        {riskLabel(riskLevel, t)} {claim.riskScore.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${statusBadgeClass(claim.status)}`}>
                        {statusLabel(claim.status, t)}
                      </span>
                    </td>
                    <td><span className={`gps-trust-badge ${gpsTrustClass(claim.gpsTrustStatus)}`}>{claim.gpsTrustStatus}</span></td>
                    <td>{mockLocationLabel(claim.isMockLocation)}</td>
                    <td>{claim.gpsAccuracy ? `${claim.gpsAccuracy} m` : "Unknown"}</td>
                    <td>{claim.locationRiskReason}</td>
                    <td>{claim.submittedDate}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" onClick={() => setSelectedClaim(claim)}>
                          <Eye size={15} aria-hidden="true" />
                          {t("viewDetails")}
                        </button>
                        <ClaimActions claim={claim} onStatusChange={updateStatus} t={t} />
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
        t={t}
      />
    </section>
  );
}
