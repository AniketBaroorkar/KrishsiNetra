"use client";

import { useEffect, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  Valid: "#166534",
  Suspicious: "#f59e0b",
  "Spoofing Suspected": "#ef4444",
  Unknown: "#94a3b8",
};

export default function GpsTrustDonut({ data, height = 220 }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="dash-chart dash-chart-loading" style={{ width: "100%", height }} />;
  return (
    <div className="dash-chart" style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={52}
            outerRadius={84}
            paddingAngle={3}
            stroke="#ffffff"
            strokeWidth={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] || "#9ca3af"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #d9e9d9",
              fontSize: 13,
              padding: "8px 12px",
            }}
          />
          <Legend
            iconType="circle"
            iconSize={9}
            wrapperStyle={{ fontSize: 12, paddingTop: 8, fontWeight: 500 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
