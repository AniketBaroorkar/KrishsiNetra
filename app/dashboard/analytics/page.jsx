"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cropColors, dailySubmissions, farmSubmissions } from "../../../data/dashboardData";
import { cropDistributionByDistrict, fraudCleanThisMonth } from "../../../utils/dashboard";

const pieColors = ["#ef4444", "#31c48d"];

export default function AnalyticsPage() {
  const totalFarms = farmSubmissions.length;
  const fraudToday = farmSubmissions.filter(
    (item) => item.date === "2026-05-11" && item.riskScore > 0.4,
  ).length;
  const avgRisk =
    farmSubmissions.reduce((total, item) => total + item.riskScore, 0) / farmSubmissions.length;

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Crop distribution, fraud status, and submission trends.</p>
        </div>
      </div>

      <div className="grid cards" style={{ marginBottom: 16 }}>
        <article className="summary-card">
          <div className="summary-label">Total Farms</div>
          <div className="summary-value">{totalFarms}</div>
        </article>
        <article className="summary-card">
          <div className="summary-label">Fraud Alerts Today</div>
          <div className="summary-value">{fraudToday}</div>
        </article>
        <article className="summary-card">
          <div className="summary-label">Avg Risk Score</div>
          <div className="summary-value">{avgRisk.toFixed(2)}</div>
        </article>
        <article className="summary-card">
          <div className="summary-label">Districts Covered</div>
          <div className="summary-value">5</div>
        </article>
      </div>

      <div className="grid chart-grid">
        <article className="panel chart-panel">
          <h2 className="page-title" style={{ fontSize: 18 }}>Crop Distribution Across District</h2>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={cropDistributionByDistrict()}>
              <CartesianGrid stroke="#26323b" vertical={false} />
              <XAxis dataKey="district" stroke="#98a8a0" />
              <YAxis stroke="#98a8a0" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#111a21", border: "1px solid #26323b" }} />
              <Legend />
              {Object.entries(cropColors).map(([crop, color]) => (
                <Bar dataKey={crop} stackId="crops" fill={color} key={crop} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="panel chart-panel">
          <h2 className="page-title" style={{ fontSize: 18 }}>Fraud vs Clean This Month</h2>
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie
                data={fraudCleanThisMonth()}
                dataKey="value"
                nameKey="name"
                outerRadius={96}
                label
              >
                {fraudCleanThisMonth().map((entry, index) => (
                  <Cell fill={pieColors[index]} key={entry.name} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#111a21", border: "1px solid #26323b" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </article>

        <article className="panel chart-panel wide">
          <h2 className="page-title" style={{ fontSize: 18 }}>Daily Submission Volume</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailySubmissions}>
              <CartesianGrid stroke="#26323b" vertical={false} />
              <XAxis dataKey="date" stroke="#98a8a0" />
              <YAxis stroke="#98a8a0" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#111a21", border: "1px solid #26323b" }} />
              <Line
                type="monotone"
                dataKey="submissions"
                stroke="#5dade2"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </article>
      </div>
    </section>
  );
}
