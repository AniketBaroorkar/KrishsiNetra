"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Flag,
  MapPin,
  MapPinOff,
  Radar,
  Satellite,
  ShieldAlert,
  Sprout,
} from "lucide-react";

import { useLanguage } from "../../../components/LanguageProvider";
import { fetchFarmers, getDemoFarmers } from "../../../utils/farmers";

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
  const [farmers, setFarmers] = useState(() => getDemoFarmers());

  useEffect(() => {
    let active = true;
    fetchFarmers()
      .then((result) => {
        if (active && result.farmers.length) setFarmers(result.farmers);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const highRisk = farmers.filter((farmer) => farmer.riskLevel === "High");
  const spoofingSuspected = farmers.filter((farmer) => farmer.gpsTrustStatus === "Spoofing Suspected");
  const missingGps = farmers.filter((farmer) => !farmer.latitude || !farmer.longitude);
  const lowNdvi = farmers.filter((farmer) => Number(farmer.satelliteVerification?.ndviScore || 1) < 0.2);
  const cropMismatch = farmers.filter((farmer) => farmer.cropType !== farmer.predictedCrop);

  const signals = [
    { tone: "high", icon: AlertTriangle, label: t("highRiskClaims"), value: highRisk.length },
    { tone: "high", icon: ShieldAlert, label: "GPS Spoofing", value: spoofingSuspected.length },
    { tone: "medium", icon: MapPinOff, label: "GPS Missing", value: missingGps.length },
    { tone: "medium", icon: Radar, label: "Low NDVI", value: lowNdvi.length },
    { tone: "medium", icon: Flag, label: "Crop Mismatch", value: cropMismatch.length },
  ];

  const reasons = [
    {
      tone: "high",
      icon: MapPin,
      badge: "High Priority",
      title: "Location Integrity",
      copy: "GPS spoofing or missing coordinates flag claims for review.",
    },
    {
      tone: "medium",
      icon: Satellite,
      badge: "Satellite",
      title: "NDVI & SAR Signals",
      copy: "Low vegetation or cloudy Sentinel data triggers verification.",
    },
    {
      tone: "low",
      icon: Sprout,
      badge: "Crop Evidence",
      title: "AI Crop Match",
      copy: "Claimed crop vs AI prediction, weighed against the photo.",
    },
  ];

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

      <div className="fraud-signal-grid">
        {signals.map(({ tone, icon: Icon, label, value }) => (
          <article className={`fraud-signal-card fraud-signal-${tone}`} key={label}>
            <span className="fraud-signal-icon"><Icon size={20} aria-hidden="true" /></span>
            <span className="fraud-signal-label">{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="fraud-reason-grid">
        {reasons.map(({ tone, icon: Icon, badge, title, copy }) => (
          <article className={`fraud-reason-card fraud-reason-${tone}`} key={title}>
            <div className="fraud-reason-icon"><Icon size={22} aria-hidden="true" /></div>
            <span className={`risk-badge ${tone}`}>{badge}</span>
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
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
