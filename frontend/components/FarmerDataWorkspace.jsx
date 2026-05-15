"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Download, Eye, Flag, Image as ImageIcon, MapPin, Search, ThumbsDown, ThumbsUp, X } from "lucide-react";

import { useLanguage } from "./LanguageProvider";
import SatelliteVerificationPanel from "./SatelliteVerificationPanel";
import {
  downloadFarmersCsv,
  downloadFarmersJson,
  fetchFarmers,
  getDemoFarmers,
  uniqueValues,
} from "../utils/farmers";

function riskClass(level) {
  if (level === "High") return "high";
  if (level === "Medium") return "medium";
  return "low";
}

function statusClass(status) {
  if (status === "Approved" || status === "Verified") return "approved";
  if (status === "Rejected") return "rejected";
  if (status === "Flagged" || status === "High Risk") return "flagged";
  return "pending";
}

function statusLabel(status, t) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "all") return t("all");
  if (normalized === "approved") return t("approved");
  if (normalized === "verified") return t("verified");
  if (normalized === "rejected") return t("rejected");
  if (normalized === "flagged") return t("flagged");
  if (normalized === "high risk" || normalized === "high") return t("highRisk");
  if (normalized === "sent") return t("sent");
  if (normalized === "delivered") return t("delivered");
  if (normalized === "pending") return t("pending");
  if (normalized === "not sent") return t("notSent");
  return status || "";
}

function riskLabel(level, t) {
  if (level === "High") return t("highRisk");
  if (level === "Medium") return t("mediumRisk");
  if (level === "Low") return t("lowRisk");
  return t("all");
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

function buildLocationUrl(farmer) {
  const params = new URLSearchParams();
  if (farmer.latitude) params.set("lat", farmer.latitude);
  if (farmer.longitude) params.set("lng", farmer.longitude);
  if (farmer.cropType) params.set("crop", farmer.cropType);
  if (farmer.farmerName) params.set("farmer", farmer.farmerName);
  if (farmer.surveyNumber) params.set("survey", farmer.surveyNumber);
  return `/dashboard/location-check?${params.toString()}`;
}

function FarmerDetailsModal({ farmer, onBack, onClose, onStatusChange, onSendAlert, onViewMap, t }) {
  if (!farmer) return null;

  return (
    <div className="claim-modal-backdrop">
      <section className="claim-modal farmer-modal" role="dialog" aria-modal="true">
        <div className="claim-modal-header">
          <div>
            <span className="gov-kicker">{t("farmerData")}</span>
            <h2>{farmer.farmerName}</h2>
            <p>{farmer.farmerId} - {farmer.village}, {farmer.district}</p>
          </div>
          <div className="modal-header-actions">
            <button className="back-button" type="button" onClick={onBack}>
              <span aria-hidden="true">&larr;</span>
              {t("back")}
            </button>
            <button type="button" onClick={onClose} aria-label="Close">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="claim-modal-grid">
          <div className="claim-photo-panel">
            {farmer.photoUrl ? (
              <img src={farmer.photoUrl} alt={`${farmer.cropType} submitted by ${farmer.farmerName}`} />
            ) : (
              <div className="missing-photo">
                <ImageIcon size={38} aria-hidden="true" />
                {t("missingPhoto")}
              </div>
            )}
          </div>
          <div className="claim-detail-panel">
            <h3>{t("farmerName")}</h3>
            <div className="detail-list">
              <span>{t("mobileNumber")} <strong>{farmer.mobileNumber}</strong></span>
              <span>{t("village")} <strong>{farmer.village}</strong></span>
              <span>{t("taluka")} <strong>{farmer.taluka}</strong></span>
              <span>{t("district")} <strong>{farmer.district}</strong></span>
              <span>{t("state")} <strong>{farmer.state}</strong></span>
              <span>{t("surveyNumber")} <strong>{farmer.surveyNumber}</strong></span>
              <span>{t("farmArea")} <strong>{farmer.farmArea} acres</strong></span>
            </div>
          </div>
        </div>

        <div className="claim-modal-grid">
          <div className="claim-detail-panel">
            <h3>{t("aiClaimVerification")}</h3>
            <div className="detail-list">
              <span>{t("cropType")} <strong>{farmer.cropType}</strong></span>
              <span>{t("aiPredictedCrop")} <strong>{farmer.predictedCrop}</strong></span>
              <span>{t("confidence")} <strong>{Math.round(farmer.confidenceScore * 100)}%</strong></span>
              <span>{t("riskScore")} <strong>{riskLabel(farmer.riskLevel, t)} {farmer.riskScore.toFixed(2)}</strong></span>
              <span>{t("status")} <strong>{statusLabel(farmer.claimStatus, t)}</strong></span>
            </div>
            <p className="fraud-reason">{farmer.riskReason}</p>
            <p className="satellite-result">{farmer.satelliteResult}</p>
          </div>
          <div className="claim-detail-panel">
            <h3>{t("gpsLocationAlertHistory")}</h3>
            <div className="mini-map">
              <span className="map-grid-label">
                {farmer.latitude && farmer.longitude ? `${farmer.latitude}, ${farmer.longitude}` : t("missingGps")}
              </span>
              {farmer.latitude && farmer.longitude ? <span className="map-pin verified"><MapPin size={18} aria-hidden="true" /></span> : null}
              <i className="map-field one" />
              <i className="map-field two" />
              <i className="map-field three" />
            </div>
            <div className="alert-mini-list">
              {farmer.alertHistory.length ? farmer.alertHistory.map((alert, index) => (
                <span key={`${alert.title}-${index}`}>
                  <strong>{alert.title}</strong>
                  {alert.type} - {statusLabel(alert.status, t)} - {alert.sentAt}
                </span>
              )) : <span>{t("noAlertsSent")}</span>}
            </div>
          </div>
        </div>

        <div className="claim-modal-section">
          <section className="location-integrity-card">
            <div className="friendly-card-heading">
              <h3>Location Integrity Check</h3>
              <p>GPS Spoofing Detection and Mock Location Detection for officer review.</p>
            </div>
            <div className="location-integrity-grid">
              <span>GPS Coordinates<strong>{farmer.latitude && farmer.longitude ? `${farmer.latitude}, ${farmer.longitude}` : t("missingGps")}</strong></span>
              <span>GPS Accuracy<strong>{farmer.gpsAccuracy ? `${farmer.gpsAccuracy} meters` : "Unknown"}</strong></span>
              <span>GPS Timestamp<strong>{farmer.gpsTimestamp || "Unknown"}</strong></span>
              <span>GPS Provider<strong>{farmer.gpsProvider || "Unknown"}</strong></span>
              <span>Mock Location Detected<strong>{mockLocationLabel(farmer.isMockLocation)}</strong></span>
              <span>Photo Capture Type<strong>{farmer.photoCaptureType || "Unknown"}</strong></span>
              <span>GPS Trust Status<strong className={`gps-trust-badge ${gpsTrustClass(farmer.gpsTrustStatus)}`}>{farmer.gpsTrustStatus}</strong></span>
              <span className="wide">Location Risk Reason<strong>{farmer.locationRiskReason}</strong></span>
            </div>
          </section>
        </div>

        <div className="claim-modal-section">
          <SatelliteVerificationPanel
            record={farmer}
            uploadedPhotoUrl={farmer.photoUrl}
            title={t("satelliteVerification")}
          />
        </div>

        <div className="modal-action-row">
          <div className="claim-actions">
            <button type="button" className="approve" onClick={() => onStatusChange(farmer, "Approved")}><ThumbsUp size={15} />{t("approveClaim")}</button>
            <button type="button" className="reject" onClick={() => onStatusChange(farmer, "Rejected")}><ThumbsDown size={15} />{t("rejectClaim")}</button>
            <button type="button" className="flag" onClick={() => onStatusChange(farmer, "Flagged")}><Flag size={15} />{t("flagAsFraud")}</button>
            <button type="button" onClick={() => onViewMap(farmer)} disabled={!farmer.latitude || !farmer.longitude}><MapPin size={15} />View on Map</button>
            <button type="button" onClick={() => onSendAlert(farmer)}><Bell size={15} />{t("sendAlert")}</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function FarmerDataWorkspace({ compact = false, onFarmersChange }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [farmers, setFarmers] = useState(() => getDemoFarmers());
  const [noticeKey, setNoticeKey] = useState("usingDemo");
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [filters, setFilters] = useState({
    query: "",
    district: "All",
    crop: "All",
    risk: "All",
    status: "All",
    gpsTrust: "All",
  });

  useEffect(() => {
    let active = true;
    fetchFarmers()
      .then((result) => {
        if (!active) return;
        if (result.farmers.length) {
          setFarmers(result.farmers);
          setNoticeKey(result.source === "backend" ? "connectedBackend" : "usingDemo");
        }
      })
      .catch(() => setNoticeKey("usingDemo"));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    onFarmersChange?.(farmers);
  }, [farmers, onFarmersChange]);

  const districts = ["All", ...uniqueValues(farmers, "district")];
  const crops = ["All", ...uniqueValues(farmers, "cropType")];
  const statuses = ["All", "Pending", "Verified", "Approved", "Rejected", "Flagged", "High Risk"];
  const gpsTrustStatuses = ["All", "Valid", "Suspicious", "Spoofing Suspected", "Unknown"];

  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return farmers.filter((farmer) => {
      const matchesQuery =
        !query ||
        `${farmer.farmerName} ${farmer.mobileNumber} ${farmer.farmerId}`.toLowerCase().includes(query);
      return (
        matchesQuery &&
        (filters.district === "All" || farmer.district === filters.district) &&
        (filters.crop === "All" || farmer.cropType === filters.crop) &&
        (filters.risk === "All" || farmer.riskLevel === filters.risk) &&
        (filters.status === "All" || farmer.claimStatus === filters.status) &&
        (filters.gpsTrust === "All" || farmer.gpsTrustStatus === filters.gpsTrust)
      );
    });
  }, [farmers, filters]);

  const pageStats = useMemo(() => ({
    total: farmers.length,
    verified: farmers.filter((farmer) => ["Verified", "Approved"].includes(farmer.claimStatus)).length,
    highRisk: farmers.filter((farmer) => farmer.riskLevel === "High").length,
    spoofing: farmers.filter((farmer) => farmer.gpsTrustStatus === "Spoofing Suspected").length,
  }), [farmers]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function updateStatus(farmer, status) {
    setFarmers((current) => current.map((item) => (
      item.farmerId === farmer.farmerId ? { ...item, claimStatus: status } : item
    )));
    setSelectedFarmer((current) => current?.farmerId === farmer.farmerId ? { ...current, claimStatus: status } : current);
  }

  function sendQuickAlert(farmer) {
    const alert = {
      type: "Heavy Rain",
      title: t("disasterAlertSent"),
      message: t("disasterSubtitle"),
      language: "English",
      status: "Sent",
      sentAt: new Date().toLocaleString(),
    };
    setFarmers((current) => current.map((item) => (
      item.farmerId === farmer.farmerId
        ? { ...item, disasterAlertStatus: "Sent", alertHistory: [alert, ...item.alertHistory] }
        : item
    )));
    setSelectedFarmer((current) => current?.farmerId === farmer.farmerId
      ? { ...current, disasterAlertStatus: "Sent", alertHistory: [alert, ...current.alertHistory] }
      : current);
  }

  function handleBackFromDetails() {
    setSelectedFarmer(null);
    if (pathname !== "/dashboard/farmers" && !compact) {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/dashboard/farmers");
      }
    }
  }

  function viewFarmerOnMap(farmer) {
    router.push(buildLocationUrl(farmer));
  }

  const visibleFarmers = compact ? filtered.slice(0, 5) : filtered;

  return (
    <section className={compact ? "farmer-preview-block" : "gov-page farmer-page"}>
      {!compact ? (
        <div className="gov-page-header">
          <div>
            <span className="gov-kicker">{t("farmerData")}</span>
            <h1>{t("farmerDataTitle")}</h1>
            <p>{t("farmerDataSubtitle")}</p>
          </div>
          <div className="page-actions farmer-header-actions">
            <span className="api-notice">{t("contact")}: 9579207219</span>
            <button className="download-csv-btn" type="button" onClick={() => downloadFarmersCsv(farmers)}>
              <Download size={17} aria-hidden="true" />
              {t("downloadFarmerData")}
            </button>
            <button className="download-json-btn" type="button" onClick={() => downloadFarmersJson(farmers)}>
              <Download size={17} aria-hidden="true" />
              {t("downloadJson")}
            </button>
          </div>
        </div>
      ) : null}

      {!compact ? (
        <div className="analytics-summary-grid">
          <article className="gov-stat-card analytics-stat-card">
            <span>{t("totalFarmers")}</span>
            <strong>{pageStats.total}</strong>
          </article>
          <article className="gov-stat-card analytics-stat-card">
            <span>{t("verifiedClaims")}</span>
            <strong>{pageStats.verified}</strong>
          </article>
          <article className="gov-stat-card analytics-stat-card">
            <span>{t("highRiskFarmers")}</span>
            <strong>{pageStats.highRisk}</strong>
          </article>
          <article className="gov-stat-card analytics-stat-card">
            <span>GPS Spoofing Suspected</span>
            <strong>{pageStats.spoofing}</strong>
          </article>
        </div>
      ) : null}

      <div className="claims-toolbar farmer-toolbar">
        <label className="claims-search">
          <Search size={17} aria-hidden="true" />
          <input value={filters.query} onChange={(event) => updateFilter("query", event.target.value)} placeholder={`${t("search")} ${t("farmerName")} / ${t("mobileNumber")}`} />
        </label>
        <div className="claims-toolbar-filters">
          <label>{t("district")}<select value={filters.district} onChange={(event) => updateFilter("district", event.target.value)}>{districts.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>{t("cropType")}<select value={filters.crop} onChange={(event) => updateFilter("crop", event.target.value)}>{crops.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>{t("riskScore")}<select value={filters.risk} onChange={(event) => updateFilter("risk", event.target.value)}>{["All", "Low", "Medium", "High"].map((item) => <option key={item} value={item}>{riskLabel(item, t)}</option>)}</select></label>
          <label>{t("status")}<select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>{statuses.map((item) => <option key={item} value={item}>{statusLabel(item, t)}</option>)}</select></label>
          <label>GPS Trust Status<select value={filters.gpsTrust} onChange={(event) => updateFilter("gpsTrust", event.target.value)}>{gpsTrustStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>
      </div>

      <section className="gov-card">
        <div className="friendly-card-heading table-heading-row">
          <div>
            <h2>{compact ? t("farmerTablePreview") : t("farmerRecords")}</h2>
            <p>{filtered.length} {t("farmerRecordsCount")}</p>
          </div>
        </div>
        <div className="friendly-table-wrap">
          <table className="friendly-table gov-table farmer-table">
            <thead>
              <tr>
                <th>{t("farmerId")}</th>
                <th>{t("farmerName")}</th>
                <th>{t("mobileNumber")}</th>
                <th>{t("village")}</th>
                <th>{t("taluka")}</th>
                <th>{t("district")}</th>
                <th>{t("state")}</th>
                <th>{t("cropType")}</th>
                <th>{t("farmArea")}</th>
                <th>{t("surveyNumber")}</th>
                <th>{t("gpsLatitude")}</th>
                <th>{t("gpsLongitude")}</th>
                <th>{t("lastPhoto")}</th>
                <th>{t("submissionDate")}</th>
                <th>{t("claimStatus")}</th>
                <th>{t("riskScore")}</th>
                <th>{t("disasterAlertStatus")}</th>
                <th>GPS Trust Status</th>
                <th>Mock Location</th>
                <th>GPS Accuracy</th>
                <th>Location Risk</th>
                <th>{t("action")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleFarmers.map((farmer) => (
                <tr key={farmer.farmerId}>
                  <td><strong>{farmer.farmerId}</strong></td>
                  <td>{farmer.farmerName}</td>
                  <td>{farmer.mobileNumber}</td>
                  <td>{farmer.village}</td>
                  <td>{farmer.taluka}</td>
                  <td>{farmer.district}</td>
                  <td>{farmer.state}</td>
                  <td>{farmer.cropType}</td>
                  <td>{farmer.farmArea} acres</td>
                  <td>{farmer.surveyNumber}</td>
                  <td>{farmer.latitude ?? t("missingGps")}</td>
                  <td>{farmer.longitude ?? t("missingGps")}</td>
                  <td>{farmer.photoUrl ? <img className="table-photo" src={farmer.photoUrl} alt="" /> : t("missingPhoto")}</td>
                  <td>{farmer.submissionDate}</td>
                  <td><span className={`status-badge ${statusClass(farmer.claimStatus)}`}>{statusLabel(farmer.claimStatus, t)}</span></td>
                  <td><span className={`risk-badge ${riskClass(farmer.riskLevel)}`}>{riskLabel(farmer.riskLevel, t)} {farmer.riskScore.toFixed(2)}</span></td>
                  <td>{statusLabel(farmer.disasterAlertStatus, t)}</td>
                  <td><span className={`gps-trust-badge ${gpsTrustClass(farmer.gpsTrustStatus)}`}>{farmer.gpsTrustStatus}</span></td>
                  <td>{mockLocationLabel(farmer.isMockLocation)}</td>
                  <td>{farmer.gpsAccuracy ? `${farmer.gpsAccuracy} m` : "Unknown"}</td>
                  <td>{farmer.locationRiskReason}</td>
                  <td>
                    <button className="view-detail-btn" type="button" onClick={() => setSelectedFarmer(farmer)}>
                      <Eye size={15} aria-hidden="true" />
                      {t("viewDetails")}
                    </button>
                    <button className="view-detail-btn" type="button" onClick={() => viewFarmerOnMap(farmer)} disabled={!farmer.latitude || !farmer.longitude}>
                      <MapPin size={15} aria-hidden="true" />
                      View on Map
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <FarmerDetailsModal
        farmer={selectedFarmer}
        onBack={handleBackFromDetails}
        onClose={() => setSelectedFarmer(null)}
        onStatusChange={updateStatus}
        onSendAlert={sendQuickAlert}
        onViewMap={viewFarmerOnMap}
        t={t}
      />
    </section>
  );
}
