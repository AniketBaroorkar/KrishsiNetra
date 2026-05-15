"use client";

import {
  AlertTriangle,
  Bell,
  Camera,
  CheckCircle2,
  Clock,
  Flag,
  ShieldAlert,
  Users,
} from "lucide-react";

import { useLanguage } from "../../../components/LanguageProvider";
import { demoAlerts } from "../../../data/alertsData";
import { getDemoFarmers, uniqueValues } from "../../../utils/farmers";

const requiredCrops = ["Sugarcane", "Onion", "Grapes", "Cotton", "Soybean", "Jowar", "Wheat", "Rice"];
const requiredDistricts = ["Pune", "Baramati", "Nashik", "Ahmednagar", "Satara", "Solapur", "Nagpur"];

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function riskClass(level) {
  if (level === "High") return "high";
  if (level === "Medium") return "medium";
  return "low";
}

function riskLabel(level, t) {
  if (level === "High") return t("highRisk");
  if (level === "Medium") return t("mediumRisk");
  return t("lowRisk");
}

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const farmers = getDemoFarmers();
  const totalFarmers = farmers.length;
  const totalClaims = farmers.length;
  const verifiedClaims = farmers.filter((farmer) => ["Verified", "Approved"].includes(farmer.claimStatus)).length;
  const pendingClaims = farmers.filter((farmer) => farmer.claimStatus === "Pending").length;
  const flaggedClaims = farmers.filter((farmer) => ["Flagged", "High Risk"].includes(farmer.claimStatus)).length;
  const highRiskClaims = farmers.filter((farmer) => farmer.riskLevel === "High").length;
  const geoTaggedPhotos = farmers.filter((farmer) => farmer.photoUrl && farmer.latitude && farmer.longitude).length;

  const riskRows = ["Low", "Medium", "High"].map((level) => ({
    level,
    count: farmers.filter((farmer) => farmer.riskLevel === level).length,
  }));

  const cropRows = requiredCrops.map((crop) => ({
    crop,
    count: farmers.filter((farmer) => farmer.cropType === crop).length,
  }));

  const districtRows = requiredDistricts.map((district) => ({
    district,
    count: farmers.filter((farmer) => farmer.district === district || farmer.taluka === district).length,
  }));

  const recentActivity = [
    {
      title: t("farmerSubmittedPhoto"),
      detail: `${farmers[0].farmerName} submitted ${farmers[0].cropType} evidence from ${farmers[0].district}.`,
      tone: "low",
    },
    {
      title: t("claimFlaggedHighRisk"),
      detail: `${farmers.find((farmer) => farmer.riskLevel === "High")?.farmerName || "A farmer"} requires officer review.`,
      tone: "high",
    },
    {
      title: t("disasterAlertSent"),
      detail: `${demoAlerts[0]?.disasterType || "Weather"} alert sent to selected farmers.`,
      tone: "medium",
    },
    {
      title: t("claimVerifiedByOfficer"),
      detail: `${farmers.find((farmer) => farmer.claimStatus === "Verified")?.farmerName || "A farmer"} claim marked verified.`,
      tone: "low",
    },
  ];

  const summaryCards = [
    { label: t("totalFarmers"), value: totalFarmers, icon: Users },
    { label: t("totalClaims"), value: totalClaims, icon: ShieldAlert },
    { label: t("verifiedClaims"), value: verifiedClaims, icon: CheckCircle2 },
    { label: t("pendingClaims"), value: pendingClaims, icon: Clock },
    { label: t("flaggedClaims"), value: flaggedClaims, icon: Flag },
    { label: t("highRiskClaims"), value: highRiskClaims, icon: AlertTriangle },
    { label: t("alertsSent"), value: demoAlerts.length, icon: Bell },
    { label: t("geoTaggedPhotosReceived"), value: geoTaggedPhotos, icon: Camera },
  ];

  return (
    <section className="gov-page analytics-page">
      <div className="gov-page-header analytics-header">
        <div>
          <span className="gov-kicker">{t("analytics")}</span>
          <h1>{t("analyticsTitle")}</h1>
          <p>{t("analyticsSubtitle")}</p>
        </div>
      </div>

      <div className="analytics-summary-grid">
        {summaryCards.map(({ label, value, icon: Icon }) => (
          <article className="gov-stat-card analytics-stat-card" key={label}>
            <span className="gov-stat-icon">
              <Icon size={20} aria-hidden="true" />
            </span>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="analytics-grid">
        <section className="gov-card analytics-card">
          <div className="friendly-card-heading">
            <h2>{t("riskAnalytics")}</h2>
            <p>{t("riskAnalyticsSubtitle")}</p>
          </div>
          <div className="analytics-bar-list">
            {riskRows.map((row) => (
              <div className="analytics-bar-row" key={row.level}>
                <div>
                  <span className={`risk-badge ${riskClass(row.level)}`}>{riskLabel(row.level, t)}</span>
                  <strong>{row.count}</strong>
                </div>
                <i>
                  <b className={riskClass(row.level)} style={{ width: `${percent(row.count, totalFarmers)}%` }} />
                </i>
              </div>
            ))}
          </div>
        </section>

        <section className="gov-card analytics-card">
          <div className="friendly-card-heading">
            <h2>{t("cropAnalytics")}</h2>
            <p>{t("cropAnalyticsSubtitle")}</p>
          </div>
          <div className="analytics-chip-grid">
            {cropRows.map((row) => (
              <span className="crop-chip analytics-chip" key={row.crop}>
                {row.crop}
                <strong>{row.count}</strong>
              </span>
            ))}
          </div>
        </section>

        <section className="gov-card analytics-card">
          <div className="friendly-card-heading">
            <h2>{t("districtAnalytics")}</h2>
            <p>{t("districtAnalyticsSubtitle")}</p>
          </div>
          <div className="district-bars analytics-district-bars">
            {districtRows.map((row) => (
              <div className="district-row" key={row.district}>
                <span>{row.district}</span>
                <div>
                  <i style={{ width: `${Math.max(8, percent(row.count, totalFarmers))}%` }} />
                </div>
                <strong>{row.count}</strong>
                <em>{t("claims")}</em>
              </div>
            ))}
          </div>
        </section>

        <section className="gov-card analytics-card">
          <div className="friendly-card-heading">
            <h2>{t("recentActivity")}</h2>
            <p>{t("recentActivitySubtitle")}</p>
          </div>
          <div className="recent-activity-list">
            {recentActivity.map((activity) => (
              <article className={`recent-activity-item ${activity.tone}`} key={activity.title}>
                <span>{activity.title}</span>
                <p>{activity.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="gov-card analytics-card">
        <div className="friendly-card-heading">
          <h2>{t("availableDistricts")}</h2>
          <p>{t("districtSummary")}</p>
        </div>
        <div className="chip-grid">
          {uniqueValues(farmers, "district").map((district) => (
            <span className="district-chip" key={district}>{district}</span>
          ))}
        </div>
      </section>
    </section>
  );
}
