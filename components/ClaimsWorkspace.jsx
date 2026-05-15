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

import { useLanguage } from "./LanguageProvider";
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
              // External demo image. Replace with backend-uploaded photo URL in production.
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
        <span className="api-notice">{t(apiNoticeKey)}</span>
      </div>

      <div className="gov-stat-grid six">
        <article className="gov-stat-card">
          <span className="gov-stat-icon"><ShieldAlert size={20} aria-hidden="true" /></span>
          <span>{t("totalClaims")}</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="gov-stat-card">
          <span className="gov-stat-icon"><CheckCircle2 size={20} aria-hidden="true" /></span>
          <span>{t("verifiedClaims")}</span>
          <strong>{stats.verified}</strong>
        </article>
        <article className="gov-stat-card">
          <span className="gov-stat-icon"><Flag size={20} aria-hidden="true" /></span>
          <span>{t("flaggedClaims")}</span>
          <strong>{stats.flagged}</strong>
        </article>
        <article className="gov-stat-card">
          <span className="gov-stat-icon"><ThumbsDown size={20} aria-hidden="true" /></span>
          <span>{t("rejectedClaims")}</span>
          <strong>{stats.rejected}</strong>
        </article>
        <article className="gov-stat-card">
          <span className="gov-stat-icon"><AlertTriangle size={20} aria-hidden="true" /></span>
          <span>{t("highRiskClaims")}</span>
          <strong>{stats.highRisk}</strong>
        </article>
        <article className="gov-stat-card">
          <span className="gov-stat-icon"><Eye size={20} aria-hidden="true" /></span>
          <span>{t("pendingClaims")}</span>
          <strong>{stats.pending}</strong>
        </article>
      </div>

      <div className="claims-toolbar">
        <label className="claims-search">
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`${t("search")} ${t("claimId")}, ${t("farmerName")}, ${t("phoneNumber")}, ${t("village")}, ${t("district")}, ${t("cropType")}`}
          />
        </label>
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
