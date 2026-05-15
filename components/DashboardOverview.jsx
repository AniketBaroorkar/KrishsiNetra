"use client";

import { AlertTriangle, Bell, CheckCircle2, Clock, Flag, ShieldAlert, Users } from "lucide-react";

import { useLanguage } from "./LanguageProvider";
import FarmerDataWorkspace from "./FarmerDataWorkspace";
import { demoAlerts } from "../data/alertsData";
import { getDemoFarmers, uniqueValues } from "../utils/farmers";

function riskLabel(risk, t) {
  if (risk === "High") return t("highRisk");
  if (risk === "Medium") return t("mediumRisk");
  return t("lowRisk");
}

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
  };

  const cropSummary = uniqueValues(farmers, "cropType").map((crop) => ({
    crop,
    count: farmers.filter((farmer) => farmer.cropType === crop).length,
  }));
  const districtSummary = uniqueValues(farmers, "district").map((district) => ({
    district,
    count: farmers.filter((farmer) => farmer.district === district).length,
  }));

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

      <div className="gov-stat-grid dashboard-seven">
        {[
          { label: t("totalFarmers"), value: stats.totalFarmers, icon: Users },
          { label: t("totalClaims"), value: stats.totalClaims, icon: ShieldAlert },
          { label: t("verifiedClaims"), value: stats.verified, icon: CheckCircle2 },
          { label: t("pendingClaims"), value: stats.pending, icon: Clock },
          { label: t("flaggedClaims"), value: stats.flagged, icon: Flag },
          { label: t("highRiskClaims"), value: stats.highRisk, icon: AlertTriangle },
          { label: t("alertsSent"), value: stats.alerts, icon: Bell },
        ].map(({ label, value, icon: Icon }) => (
          <article className="gov-stat-card" key={label}>
            <span className="gov-stat-icon"><Icon size={20} aria-hidden="true" /></span>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="dashboard-insight-grid">
        <section className="gov-card">
          <div className="friendly-card-heading"><h2>{t("riskDistribution")}</h2></div>
          {["Low", "Medium", "High"].map((risk) => {
            const count = farmers.filter((farmer) => farmer.riskLevel === risk).length;
            return (
              <div className="district-row" key={risk}>
                <span>{riskLabel(risk, t)}</span>
                <div><i style={{ width: `${(count / farmers.length) * 100}%` }} /></div>
                <strong>{count}</strong>
                <em>{riskLabel(risk, t)}</em>
              </div>
            );
          })}
        </section>
        <section className="gov-card">
          <div className="friendly-card-heading"><h2>{t("cropDistribution")}</h2></div>
          <div className="chip-grid">{cropSummary.map((item) => <span className="crop-chip" key={item.crop}>{item.crop}: {item.count}</span>)}</div>
        </section>
        <section className="gov-card">
          <div className="friendly-card-heading"><h2>{t("districtSummary")}</h2></div>
          <div className="chip-grid">{districtSummary.map((item) => <span className="district-chip" key={item.district}>{item.district}: {item.count}</span>)}</div>
        </section>
      </div>

      <FarmerDataWorkspace compact />
    </section>
  );
}
