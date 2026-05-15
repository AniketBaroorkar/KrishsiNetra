"use client";

import { AlertTriangle, Flag, MapPinOff, Radar, ShieldAlert } from "lucide-react";

import { useLanguage } from "../../../components/LanguageProvider";
import { getDemoFarmers } from "../../../utils/farmers";

function riskLabel(level, t) {
  if (level === "High") return t("highRisk");
  if (level === "Medium") return t("mediumRisk");
  return t("lowRisk");
}

function statusLabel(status, t) {
  const normalized = String(status || "").toLowerCase();
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

export default function FraudAlertsPage() {
  const { t } = useLanguage();
  const farmers = getDemoFarmers();
  const highRisk = farmers.filter((farmer) => farmer.riskLevel === "High");
  const spoofingSuspected = farmers.filter((farmer) => farmer.gpsTrustStatus === "Spoofing Suspected");
  const missingGps = farmers.filter((farmer) => !farmer.latitude || !farmer.longitude);
  const lowNdvi = farmers.filter((farmer) => Number(farmer.satelliteVerification?.ndviScore || 1) < 0.2);
  const cropMismatch = farmers.filter((farmer) => farmer.cropType !== farmer.predictedCrop);

  return (
    <section className="gov-page">
      <div className="gov-page-header">
        <div>
          <span className="gov-kicker">{t("fraudAlerts")}</span>
          <h1>{t("fraudTitle")}</h1>
          <p>{t("fraudSubtitle")}</p>
        </div>
        <span className="api-notice">{t("contact")}: 9579207219</span>
      </div>

      <div className="analytics-summary-grid fraud-summary-grid">
        <article className="gov-stat-card analytics-stat-card"><span className="gov-stat-icon"><AlertTriangle size={20} /></span><span>{t("highRiskClaims")}</span><strong>{highRisk.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span className="gov-stat-icon"><ShieldAlert size={20} /></span><span>GPS Spoofing Suspected</span><strong>{spoofingSuspected.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span className="gov-stat-icon"><MapPinOff size={20} /></span><span>{t("missingGps")}</span><strong>{missingGps.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span className="gov-stat-icon"><Radar size={20} /></span><span>Low NDVI</span><strong>{lowNdvi.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span className="gov-stat-icon"><Flag size={20} /></span><span>Crop Mismatch</span><strong>{cropMismatch.length}</strong></article>
      </div>

      <div className="fraud-reason-grid">
        <article className="gov-card">
          <span className="risk-badge high">High Priority</span>
          <h2>Location Integrity Review</h2>
          <p>GPS spoofing signals, missing coordinates, or poor GPS accuracy move the claim into officer review.</p>
        </article>
        <article className="gov-card">
          <span className="risk-badge medium">Satellite Review</span>
          <h2>NDVI and SAR Signals</h2>
          <p>Low vegetation score or uncertain Sentinel evidence is highlighted without automatically rejecting the claim.</p>
        </article>
        <article className="gov-card">
          <span className="risk-badge low">Crop Evidence</span>
          <h2>AI Crop Match</h2>
          <p>Claimed crop and predicted crop are compared with farmer photo and satellite evidence for final risk scoring.</p>
        </article>
      </div>

      <section className="gov-card">
        <div className="friendly-card-heading">
          <h2>{t("riskReviewQueue")}</h2>
          <p>{t("fraudSubtitle")}</p>
        </div>
        <div className="friendly-table-wrap">
          <table className="friendly-table gov-table">
            <thead>
              <tr>
                <th>{t("farmerName")}</th>
                <th>{t("district")}</th>
                <th>{t("cropClaimed")}</th>
                <th>{t("predictedCrop")}</th>
                <th>{t("riskScore")}</th>
                <th>{t("status")}</th>
                <th>GPS Trust Status</th>
                <th>{t("reason")}</th>
              </tr>
            </thead>
            <tbody>
              {farmers
                .slice()
                .sort((a, b) => b.riskScore - a.riskScore)
                .map((farmer) => (
                  <tr key={farmer.farmerId}>
                    <td><strong>{farmer.farmerName}</strong><small>{farmer.farmerId}</small></td>
                    <td>{farmer.district}</td>
                    <td>{farmer.cropType}</td>
                    <td>{farmer.predictedCrop}</td>
                    <td><span className={`risk-badge ${farmer.riskLevel.toLowerCase()}`}>{riskLabel(farmer.riskLevel, t)} {farmer.riskScore.toFixed(2)}</span></td>
                    <td><span className="status-badge flagged">{statusLabel(farmer.claimStatus, t)}</span></td>
                    <td><span className={`gps-trust-badge ${gpsTrustClass(farmer.gpsTrustStatus)}`}>{farmer.gpsTrustStatus}</span></td>
                    <td>{farmer.riskReason}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
