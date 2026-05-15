"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = {
  Low: "#22c55e",
  Medium: "#f59e0b",
  High: "#ef4444",
};

export default function RiskBarChart({ data, height = 200 }) {
  return (
    <div className="dash-chart" style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 24, top: 4, bottom: 4 }}
        >
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#5f7066" }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            width={80}
            tick={{ fontSize: 13, fontWeight: 600, fill: "#102018" }}
          />
          <Tooltip
            cursor={{ fill: "#f7fbf4" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #d9e9d9",
              fontSize: 13,
              padding: "8px 12px",
            }}
          />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={26}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] || "#166534"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
