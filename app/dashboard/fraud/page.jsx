"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";

import { farmSubmissions } from "../../../data/dashboardData";
import { downloadCsv, riskLabel, riskLevel, uniqueValues } from "../../../utils/dashboard";

export default function FraudAlertsPage() {
  const [filters, setFilters] = useState({
    from: "2026-05-01",
    to: "2026-05-11",
    taluka: "all",
    risk: "all",
  });

  const talukas = uniqueValues(farmSubmissions, "taluka");
  const filtered = useMemo(() => {
    return farmSubmissions.filter((item) => {
      const inDateRange = item.date >= filters.from && item.date <= filters.to;
      return (
        inDateRange &&
        (filters.taluka === "all" || item.taluka === filters.taluka) &&
        (filters.risk === "all" || riskLevel(item.riskScore) === filters.risk)
      );
    });
  }, [filters]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fraud Alerts</h1>
          <p className="page-subtitle">Review high-risk crop claims and export the current view.</p>
        </div>
        <button className="btn" onClick={() => downloadCsv(filtered, "krishinetra-fraud-alerts.csv")}>
          <Download size={16} aria-hidden="true" />
          Export CSV
        </button>
      </div>

      <div className="panel panel-pad" style={{ marginBottom: 16 }}>
        <div className="control-grid">
          <div className="field">
            <label htmlFor="from">From</label>
            <input
              id="from"
              type="date"
              value={filters.from}
              onChange={(event) => updateFilter("from", event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="to">To</label>
            <input
              id="to"
              type="date"
              value={filters.to}
              onChange={(event) => updateFilter("to", event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="taluka">Taluka</label>
            <select
              id="taluka"
              value={filters.taluka}
              onChange={(event) => updateFilter("taluka", event.target.value)}
            >
              <option value="all">All talukas</option>
              {talukas.map((taluka) => (
                <option value={taluka} key={taluka}>
                  {taluka}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="risk">Risk Level</label>
            <select
              id="risk"
              value={filters.risk}
              onChange={(event) => updateFilter("risk", event.target.value)}
            >
              <option value="all">All levels</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="clean">Clean</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Farmer</th>
              <th>Survey No</th>
              <th>Claimed Crop</th>
              <th>AI Detected</th>
              <th>Risk Score</th>
              <th>GPS Distance</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const level = riskLevel(item.riskScore);
              return (
                <tr className={`risk-${level}`} key={item.id}>
                  <td>{item.farmer}</td>
                  <td>{item.surveyNo}</td>
                  <td>{item.claimedCrop}</td>
                  <td>{item.predictedCrop}</td>
                  <td>
                    <span className={`badge ${level}`}>
                      {item.riskScore.toFixed(2)} {riskLabel(item.riskScore)}
                    </span>
                  </td>
                  <td>{item.gpsDistanceKm.toFixed(1)} km</td>
                  <td>{item.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
