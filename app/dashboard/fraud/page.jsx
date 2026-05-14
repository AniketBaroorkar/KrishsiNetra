import { AlertTriangle, CheckCircle2, Clock, Flag } from "lucide-react";

import { getDemoFarmers } from "../../../utils/farmers";

export default function FraudAlertsPage() {
  const farmers = getDemoFarmers();
  const highRisk = farmers.filter((farmer) => farmer.riskLevel === "High");
  const mediumRisk = farmers.filter((farmer) => farmer.riskLevel === "Medium");
  const flagged = farmers.filter((farmer) => ["Flagged", "High Risk"].includes(farmer.claimStatus));
  const verified = farmers.filter((farmer) => ["Verified", "Approved"].includes(farmer.claimStatus));

  return (
    <section className="gov-page">
      <div className="gov-page-header">
        <div>
          <span className="gov-kicker">Fraud Alerts</span>
          <h1>Fraud Alerts</h1>
          <p>Review high-risk crop claims and farmer records that need officer verification.</p>
        </div>
        <span className="api-notice">Using demo data because backend is not connected.</span>
      </div>

      <div className="analytics-summary-grid">
        <article className="gov-stat-card analytics-stat-card"><span className="gov-stat-icon"><AlertTriangle size={20} /></span><span>High Risk</span><strong>{highRisk.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span className="gov-stat-icon"><Clock size={20} /></span><span>Medium Risk</span><strong>{mediumRisk.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span className="gov-stat-icon"><Flag size={20} /></span><span>Flagged Claims</span><strong>{flagged.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span className="gov-stat-icon"><CheckCircle2 size={20} /></span><span>Verified/Approved</span><strong>{verified.length}</strong></article>
      </div>

      <section className="gov-card">
        <div className="friendly-card-heading">
          <h2>Risk Review Queue</h2>
          <p>Crop mismatch, missing GPS, missing photo, and low confidence records are shown first.</p>
        </div>
        <div className="friendly-table-wrap">
          <table className="friendly-table gov-table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>District</th>
                <th>Crop Claimed</th>
                <th>AI Predicted</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Reason</th>
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
                    <td><span className={`risk-badge ${farmer.riskLevel.toLowerCase()}`}>{farmer.riskLevel} {farmer.riskScore.toFixed(2)}</span></td>
                    <td><span className="status-badge flagged">{farmer.claimStatus}</span></td>
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
