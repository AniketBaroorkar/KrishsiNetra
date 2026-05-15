"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Download, Eye, Flag, Image as ImageIcon, MapPin, Search, ThumbsDown, ThumbsUp, X } from "lucide-react";

import { useLanguage } from "./LanguageProvider";
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

function FarmerDetailsModal({ farmer, onBack, onClose, onStatusChange, onSendAlert, t }) {
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
              Back
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
                Missing photo
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
              <span>State <strong>{farmer.state}</strong></span>
              <span>Survey Number <strong>{farmer.surveyNumber}</strong></span>
              <span>Farm Area <strong>{farmer.farmArea} acres</strong></span>
            </div>
          </div>
        </div>

        <div className="claim-modal-grid">
          <div className="claim-detail-panel">
            <h3>AI & Claim Verification</h3>
            <div className="detail-list">
              <span>{t("cropType")} <strong>{farmer.cropType}</strong></span>
              <span>AI Predicted Crop <strong>{farmer.predictedCrop}</strong></span>
              <span>Confidence <strong>{Math.round(farmer.confidenceScore * 100)}%</strong></span>
              <span>{t("riskScore")} <strong>{farmer.riskLevel} {farmer.riskScore.toFixed(2)}</strong></span>
              <span>{t("status")} <strong>{farmer.claimStatus}</strong></span>
            </div>
            <p className="fraud-reason">{farmer.riskReason}</p>
            <p className="satellite-result">{farmer.satelliteResult}</p>
          </div>
          <div className="claim-detail-panel">
            <h3>GPS Location & Alert History</h3>
            <div className="mini-map">
              <span className="map-grid-label">
                {farmer.latitude && farmer.longitude ? `${farmer.latitude}, ${farmer.longitude}` : "GPS missing"}
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
                  {alert.type} - {alert.status} - {alert.sentAt}
                </span>
              )) : <span>No alerts sent yet</span>}
            </div>
          </div>
        </div>

        <div className="modal-action-row">
          <div className="claim-actions">
            <button type="button" className="approve" onClick={() => onStatusChange(farmer, "Approved")}><ThumbsUp size={15} />Approve Claim</button>
            <button type="button" className="reject" onClick={() => onStatusChange(farmer, "Rejected")}><ThumbsDown size={15} />Reject Claim</button>
            <button type="button" className="flag" onClick={() => onStatusChange(farmer, "Flagged")}><Flag size={15} />Flag as Fraud</button>
            <button type="button" onClick={() => onSendAlert(farmer)}><Bell size={15} />Send Alert</button>
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
  const [notice, setNotice] = useState(t("usingDemo"));
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [filters, setFilters] = useState({
    query: "",
    district: "All",
    crop: "All",
    risk: "All",
    status: "All",
  });

  useEffect(() => {
    let active = true;
    fetchFarmers()
      .then((result) => {
        if (!active) return;
        if (result.farmers.length) {
          setFarmers(result.farmers);
          setNotice(result.source === "backend" ? "Connected to backend farmer API." : t("usingDemo"));
        }
      })
      .catch(() => setNotice(t("usingDemo")));
    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    onFarmersChange?.(farmers);
  }, [farmers, onFarmersChange]);

  const districts = ["All", ...uniqueValues(farmers, "district")];
  const crops = ["All", ...uniqueValues(farmers, "cropType")];
  const statuses = ["All", "Pending", "Verified", "Approved", "Rejected", "Flagged", "High Risk"];

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
        (filters.status === "All" || farmer.claimStatus === filters.status)
      );
    });
  }, [farmers, filters]);

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
      title: "Weather advisory",
      message: "Please check your crop field and follow local agriculture office guidance.",
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

  const visibleFarmers = compact ? filtered.slice(0, 5) : filtered;

  return (
    <section className={compact ? "farmer-preview-block" : "gov-page farmer-page"}>
      {!compact ? (
        <div className="gov-page-header">
          <div>
            <span className="gov-kicker">{t("farmerData")}</span>
            <h1>Farmer Data</h1>
            <p>View, search, filter, and export all registered farmer records</p>
          </div>
          <div className="farmer-header-actions">
            <span className="api-notice">{notice}</span>
            <button className="download-csv-btn" type="button" onClick={() => downloadFarmersCsv(farmers)}>
              <Download size={17} aria-hidden="true" />
              Download Farmer Data
            </button>
            <button className="download-json-btn" type="button" onClick={() => downloadFarmersJson(farmers)}>
              <Download size={17} aria-hidden="true" />
              Download JSON
            </button>
          </div>
        </div>
      ) : null}

      {!compact ? (
        <div className="farmer-profile-grid">
          {filtered.slice(0, 4).map((farmer) => (
            <article className="farmer-profile-card" key={farmer.farmerId}>
              <img src={farmer.photoUrl || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80"} alt="" />
              <div>
                <strong>{farmer.farmerName}</strong>
                <span>{farmer.cropType} - {farmer.district}</span>
              </div>
              <span className={`risk-badge ${riskClass(farmer.riskLevel)}`}>{farmer.riskLevel}</span>
            </article>
          ))}
        </div>
      ) : null}

      <div className="claims-toolbar farmer-toolbar">
        <label className="claims-search">
          <Search size={17} aria-hidden="true" />
          <input value={filters.query} onChange={(event) => updateFilter("query", event.target.value)} placeholder={`${t("search")} ${t("farmerName")} / ${t("mobileNumber")}`} />
        </label>
        <label>{t("district")}<select value={filters.district} onChange={(event) => updateFilter("district", event.target.value)}>{districts.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>{t("cropType")}<select value={filters.crop} onChange={(event) => updateFilter("crop", event.target.value)}>{crops.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>{t("riskScore")}<select value={filters.risk} onChange={(event) => updateFilter("risk", event.target.value)}>{["All", "Low", "Medium", "High"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>{t("status")}<select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>

      <section className="gov-card">
        <div className="friendly-card-heading table-heading-row">
          <div>
            <h2>{compact ? "Farmer Table Preview" : "Farmer Records"}</h2>
            <p>{filtered.length} farmer records</p>
          </div>
        </div>
        <div className="friendly-table-wrap">
          <table className="friendly-table gov-table farmer-table">
            <thead>
              <tr>
                <th>Farmer ID</th>
                <th>{t("farmerName")}</th>
                <th>{t("mobileNumber")}</th>
                <th>{t("village")}</th>
                <th>{t("taluka")}</th>
                <th>{t("district")}</th>
                <th>State</th>
                <th>{t("cropType")}</th>
                <th>Farm Area</th>
                <th>Survey Number</th>
                <th>GPS Latitude</th>
                <th>GPS Longitude</th>
                <th>Last Photo</th>
                <th>Submission Date</th>
                <th>Claim Status</th>
                <th>Risk Score</th>
                <th>Disaster Alert</th>
                <th>Action</th>
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
                  <td>{farmer.latitude ?? "Missing"}</td>
                  <td>{farmer.longitude ?? "Missing"}</td>
                  <td>{farmer.photoUrl ? <img className="table-photo" src={farmer.photoUrl} alt="" /> : "Missing"}</td>
                  <td>{farmer.submissionDate}</td>
                  <td><span className={`status-badge ${statusClass(farmer.claimStatus)}`}>{farmer.claimStatus}</span></td>
                  <td><span className={`risk-badge ${riskClass(farmer.riskLevel)}`}>{farmer.riskLevel} {farmer.riskScore.toFixed(2)}</span></td>
                  <td>{farmer.disasterAlertStatus}</td>
                  <td>
                    <button className="view-detail-btn" type="button" onClick={() => setSelectedFarmer(farmer)}>
                      <Eye size={15} aria-hidden="true" />
                      View Details
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
        t={t}
      />
    </section>
  );
}
