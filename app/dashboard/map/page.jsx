"use client";

import { MapPin } from "lucide-react";

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

export default function MapPage() {
  const { t } = useLanguage();
  const farmers = getDemoFarmers();
  const mappedFarmers = farmers.filter((farmer) => farmer.latitude && farmer.longitude);
  const highRisk = farmers.filter((farmer) => farmer.riskLevel === "High").length;

  return (
    <section className="gov-page">
      <div className="gov-page-header">
        <div>
          <span className="gov-kicker">{t("liveMap")}</span>
          <h1>{t("mapTitle")}</h1>
          <p>{t("mapSubtitle")}</p>
        </div>
        <span className="api-notice">{t("contact")}: 9579207219</span>
      </div>

      <div className="analytics-summary-grid">
        <article className="gov-stat-card analytics-stat-card"><span>{t("totalFarmers")}</span><strong>{farmers.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span>{t("mappedLocations")}</span><strong>{mappedFarmers.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span>{t("missingGps")}</span><strong>{farmers.length - mappedFarmers.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span>{t("highRisk")}</span><strong>{highRisk}</strong></article>
      </div>

      <section className="gov-card map-overview-card">
        <div className="friendly-card-heading">
          <h2>{t("liveMap")}</h2>
          <p>{t("mapSubtitle")}</p>
        </div>
        <div className="mini-map dashboard-map-preview">
          <span className="map-grid-label">Maharashtra Farmer GPS Overview</span>
          <i className="map-field one" />
          <i className="map-field two" />
          <i className="map-field three" />
          <i className="map-field four" />
          {mappedFarmers.slice(0, 7).map((farmer, index) => (
            <span
              className={`map-preview-pin ${farmer.riskLevel.toLowerCase()}`}
              key={farmer.farmerId}
              style={{
                left: `${18 + ((index * 11) % 62)}%`,
                top: `${24 + ((index * 9) % 46)}%`,
              }}
              title={`${farmer.farmerName} - ${farmer.cropType}`}
            >
              <MapPin size={15} aria-hidden="true" />
            </span>
          ))}
        </div>
      </section>

      <section className="gov-card">
        <div className="friendly-card-heading">
          <h2>{t("farmerLocationCards")}</h2>
          <p>{t("mapSubtitle")}</p>
        </div>
        <div className="location-card-grid">
          {farmers.map((farmer) => (
            <article className="location-card" key={farmer.farmerId}>
              <span className={`risk-badge ${farmer.riskLevel.toLowerCase()}`}>{riskLabel(farmer.riskLevel, t)}</span>
              <h3>{farmer.farmerName}</h3>
              <p>{farmer.cropType} - {farmer.village}, {farmer.district}</p>
              <strong>
                <MapPin size={16} aria-hidden="true" />
                {farmer.latitude && farmer.longitude ? `${farmer.latitude}, ${farmer.longitude}` : t("missingGps")}
              </strong>
              <small>{statusLabel(farmer.claimStatus, t)}</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
