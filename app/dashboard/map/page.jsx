import { MapPin } from "lucide-react";

import { getDemoFarmers } from "../../../utils/farmers";

export default function MapPage() {
  const farmers = getDemoFarmers();
  const mappedFarmers = farmers.filter((farmer) => farmer.latitude && farmer.longitude);
  const highRisk = farmers.filter((farmer) => farmer.riskLevel === "High").length;

  return (
    <section className="gov-page">
      <div className="gov-page-header">
        <div>
          <span className="gov-kicker">Map</span>
          <h1>Claim Location Map</h1>
          <p>Simple location view for demo mode. Leaflet is disabled here to prevent map runtime issues.</p>
        </div>
        <span className="api-notice">Using demo data because backend is not connected.</span>
      </div>

      <div className="analytics-summary-grid">
        <article className="gov-stat-card analytics-stat-card"><span>Total Farmers</span><strong>{farmers.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span>Mapped Locations</span><strong>{mappedFarmers.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span>Missing GPS</span><strong>{farmers.length - mappedFarmers.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span>High Risk</span><strong>{highRisk}</strong></article>
      </div>

      <section className="gov-card">
        <div className="friendly-card-heading">
          <h2>Farmer Location Cards</h2>
          <p>Each card shows farmer, crop, district, GPS coordinates, status, and risk.</p>
        </div>
        <div className="location-card-grid">
          {farmers.map((farmer) => (
            <article className="location-card" key={farmer.farmerId}>
              <span className={`risk-badge ${farmer.riskLevel.toLowerCase()}`}>{farmer.riskLevel} Risk</span>
              <h3>{farmer.farmerName}</h3>
              <p>{farmer.cropType} - {farmer.village}, {farmer.district}</p>
              <strong>
                <MapPin size={16} aria-hidden="true" />
                {farmer.latitude && farmer.longitude ? `${farmer.latitude}, ${farmer.longitude}` : "GPS missing"}
              </strong>
              <small>{farmer.claimStatus}</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
