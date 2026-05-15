"use client";

import { AlertTriangle, CheckCircle2, Clock, Flag } from "lucide-react";

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

export default function FraudAlertsPage() {
  const { t } = useLanguage();
  const farmers = getDemoFarmers();
  const highRisk = farmers.filter((farmer) => farmer.riskLevel === "High");
  const mediumRisk = farmers.filter((farmer) => farmer.riskLevel === "Medium");
  const flagged = farmers.filter((farmer) => ["Flagged", "High Risk"].includes(farmer.claimStatus));
  const verified = farmers.filter((farmer) => ["Verified", "Approved"].includes(farmer.claimStatus));

  return (
    <section className="gov-page">
      <div className="gov-page-header">
        <div>
          <span className="gov-kicker">{t("fraudAlerts")}</span>
          <h1>{t("fraudTitle")}</h1>
          <p>{t("fraudSubtitle")}</p>
        </div>
        <span className="api-notice">{t("usingDemo")}</span>
      </div>

      <div className="analytics-summary-grid">
        <article className="gov-stat-card analytics-stat-card"><span className="gov-stat-icon"><AlertTriangle size={20} /></span><span>{t("highRisk")}</span><strong>{highRisk.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span className="gov-stat-icon"><Clock size={20} /></span><span>{t("mediumRisk")}</span><strong>{mediumRisk.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span className="gov-stat-icon"><Flag size={20} /></span><span>{t("flaggedClaims")}</span><strong>{flagged.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span className="gov-stat-icon"><CheckCircle2 size={20} /></span><span>{t("verifiedClaims")}</span><strong>{verified.length}</strong></article>
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
