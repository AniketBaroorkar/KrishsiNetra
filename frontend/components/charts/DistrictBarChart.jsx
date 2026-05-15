"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function DistrictBarChart({ data, height }) {
  const computedHeight = height || Math.max(200, data.length * 36 + 40);
  return (
    <div className="dash-chart" style={{ width: "100%", height: computedHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 20, top: 4, bottom: 4 }}
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
            dataKey="district"
            axisLine={false}
            tickLine={false}
            width={100}
            tick={{ fontSize: 12, fontWeight: 500, fill: "#102018" }}
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
          <Bar dataKey="count" fill="#166534" radius={[0, 6, 6, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
