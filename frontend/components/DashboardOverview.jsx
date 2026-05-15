"use client";

import { Bell, ShieldAlert, Users } from "lucide-react";

import { useLanguage } from "./LanguageProvider";
import FarmerDataWorkspace from "./FarmerDataWorkspace";
import RiskBarChart from "./charts/RiskBarChart";
import GpsTrustDonut from "./charts/GpsTrustDonut";
import CategoryBarChart from "./charts/CategoryBarChart";
import { demoAlerts } from "../data/alertsData";
import { getDemoFarmers, uniqueValues } from "../utils/farmers";

const STATUS_TONES = [
  { key: "verified", label: "Verified", color: "#166534" },
  { key: "pending", label: "Pending", color: "#0369a1" },
  { key: "flagged", label: "Flagged", color: "#b45309" },
  { key: "highRisk", label: "High Risk", color: "#991b1b" },
];

export default function DashboardOverview() {
  const { t } = useLanguage();
  const farmers = getDemoFarmers();
  const stats = {
    totalFarmers: farmers.length,
    totalClaims: farmers.length,
    verified: farmers.filter((farmer) => ["Verified", "Approved"].includes(farmer.claimStatus)).length,
    pending: farmers.filter((farmer) => farmer.claimStatus === "Pending").length,
    flagged: farmers.filter((farmer) => ["Flagged", "High Risk"].includes(farmer.claimStatus)).length,
    highRisk: farmers.filter((farmer) => farmer.riskLevel === "High").length,
    alerts: demoAlerts.length,
    validGps: farmers.filter((farmer) => farmer.gpsTrustStatus === "Valid").length,
    suspiciousGps: farmers.filter((farmer) => farmer.gpsTrustStatus === "Suspicious").length,
    spoofingGps: farmers.filter((farmer) => farmer.gpsTrustStatus === "Spoofing Suspected").length,
    unknownGps: farmers.filter((farmer) => farmer.gpsTrustStatus === "Unknown").length,
  };

  const riskData = [
    { name: "Low", value: farmers.filter((f) => f.riskLevel === "Low").length },
    { name: "Medium", value: farmers.filter((f) => f.riskLevel === "Medium").length },
    { name: "High", value: farmers.filter((f) => f.riskLevel === "High").length },
  ];

  const gpsData = [
    { name: "Valid", value: stats.validGps },
    { name: "Suspicious", value: stats.suspiciousGps },
    { name: "Spoofing Suspected", value: stats.spoofingGps },
    { name: "Unknown", value: stats.unknownGps },
  ].filter((entry) => entry.value > 0);

  const cropSummary = uniqueValues(farmers, "cropType").map((crop) => ({
    crop,
    count: farmers.filter((farmer) => farmer.cropType === crop).length,
  }));
  const districtSummary = uniqueValues(farmers, "district").map((district) => ({
    district,
    count: farmers.filter((farmer) => farmer.district === district).length,
  }));

  const claimStatusBreakdown = STATUS_TONES.map((tone) => ({
    ...tone,
    count: stats[tone.key],
    pct: stats.totalClaims ? (stats[tone.key] / stats.totalClaims) * 100 : 0,
  }));

  const districtCount = districtSummary.length;
  const cropCount = cropSummary.length;

  return (
    <section className="gov-page">
      <div className="gov-page-header">
        <div>
          <span className="gov-kicker">{t("dashboard")}</span>
          <h1>{t("dashboardTitle")}</h1>
          <p>{t("dashboardSubtitle")}</p>
        </div>
        <span className="api-notice">{t("contact")}: 9579207219</span>
      </div>

      <div className="hero-kpi-grid">
        <article className="hero-kpi-card">
          <span className="hero-kpi-icon"><Users size={22} aria-hidden="true" /></span>
          <div className="hero-kpi-body">
            <span className="hero-kpi-label">{t("totalFarmers")}</span>
            <strong>{stats.totalFarmers}</strong>
            <small>Across {districtCount} districts &middot; {cropCount} crops</small>
          </div>
        </article>
        <article className="hero-kpi-card">
          <span className="hero-kpi-icon"><ShieldAlert size={22} aria-hidden="true" /></span>
          <div className="hero-kpi-body">
            <span className="hero-kpi-label">{t("totalClaims")}</span>
            <strong>{stats.totalClaims}</strong>
            <small>{stats.verified} verified &middot; {stats.pending + stats.flagged + stats.highRisk} awaiting review</small>
          </div>
        </article>
        <article className="hero-kpi-card">
          <span className="hero-kpi-icon"><Bell size={22} aria-hidden="true" /></span>
          <div className="hero-kpi-body">
            <span className="hero-kpi-label">{t("alertsSent")}</span>
            <strong>{stats.alerts}</strong>
            <small>Disaster advisories dispatched</small>
          </div>
        </article>
      </div>

      <section className="gov-card claim-status-card">
        <div className="friendly-card-heading">
          <h2>Claim Status Overview</h2>
          <p>Where the {stats.totalClaims} claims sit in the review pipeline.</p>
        </div>
        <div className="status-bar-row" role="img" aria-label="Claim status distribution">
          {claimStatusBreakdown.map(({ key, label, color, count, pct }) => (
            count ? (
              <span
                className="status-bar-segment"
                key={key}
                style={{ flex: count, background: color }}
                title={`${label}: ${count} (${pct.toFixed(0)}%)`}
              />
            ) : null
          ))}
        </div>
        <div className="status-chip-grid">
          {claimStatusBreakdown.map(({ key, label, color, count, pct }) => (
            <div className="status-chip" key={key}>
              <span className="status-chip-dot" style={{ background: color }} />
              <div>
                <strong>{count}</strong>
                <small>{label} &middot; {pct.toFixed(0)}%</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="dashboard-insight-grid">
        <section className="gov-card">
          <div className="friendly-card-heading">
            <h2>{t("riskDistribution")}</h2>
            <p>Total claims grouped by risk level</p>
          </div>
          <RiskBarChart data={riskData} />
        </section>
        <section className="gov-card">
          <div className="friendly-card-heading">
            <h2>GPS Trust Breakdown</h2>
            <p>How submitted locations score on integrity checks</p>
          </div>
          <GpsTrustDonut data={gpsData} />
        </section>
        <section className="gov-card">
          <div className="friendly-card-heading">
            <h2>{t("cropDistribution")}</h2>
            <p>Claims grouped by crop, ranked by volume</p>
          </div>
          <CategoryBarChart data={cropSummary} labelKey="crop" valueKey="count" color="#166534" />
        </section>
        <section className="gov-card">
          <div className="friendly-card-heading">
            <h2>{t("districtSummary")}</h2>
            <p>Claims grouped by district, ranked by volume</p>
          </div>
          <CategoryBarChart data={districtSummary} labelKey="district" valueKey="count" color="#0369a1" />
        </section>
      </div>

      <FarmerDataWorkspace compact />
    </section>
  );
}
