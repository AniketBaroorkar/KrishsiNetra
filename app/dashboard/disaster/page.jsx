"use client";

import { useMemo, useState } from "react";
import { Calculator, Upload } from "lucide-react";

import { calculateImpact } from "../../../utils/dashboard";

const samplePolygon = JSON.stringify(
  {
    type: "Polygon",
    coordinates: [
      [
        [73.6, 17.1],
        [79.2, 17.1],
        [79.2, 21.4],
        [73.6, 21.4],
        [73.6, 17.1],
      ],
    ],
  },
  null,
  2,
);

export default function DisasterImpactPage() {
  const [eventDate, setEventDate] = useState("2026-05-05");
  const [polygonText, setPolygonText] = useState(samplePolygon);
  const [fileName, setFileName] = useState("manual GeoJSON polygon");
  const [submitted, setSubmitted] = useState(true);

  const impact = useMemo(() => calculateImpact(eventDate), [eventDate, submitted]);

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPolygonText(String(reader.result || ""));
      setFileName(file.name);
    };
    reader.readAsText(file);
  }

  function runImpact(event) {
    event.preventDefault();
    JSON.parse(polygonText);
    setSubmitted((value) => !value);
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Disaster Impact</h1>
          <p className="page-subtitle">
            Compare Sentinel-2 NDVI before and after a flood event to estimate crop loss.
          </p>
        </div>
      </div>

      <div className="grid impact-grid">
        <form className="panel panel-pad grid" onSubmit={runImpact}>
          <div className="field">
            <label htmlFor="event-date">Flood Event Date</label>
            <input
              id="event-date"
              type="date"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="polygon-file">Affected Area Polygon</label>
            <input id="polygon-file" type="file" accept=".json,.geojson" onChange={handleFile} />
          </div>

          <div className="field">
            <label htmlFor="polygon-text">GeoJSON Polygon</label>
            <textarea
              id="polygon-text"
              value={polygonText}
              onChange={(event) => setPolygonText(event.target.value)}
            />
          </div>

          <button className="btn" type="submit">
            <Calculator size={16} aria-hidden="true" />
            Calculate Impact
          </button>
        </form>

        <section className="panel panel-pad">
          <div className="page-header" style={{ marginBottom: 16 }}>
            <div>
              <h2 className="page-title" style={{ fontSize: 20 }}>Impact Estimate</h2>
              <p className="page-subtitle">Source: {fileName}</p>
            </div>
            <Upload size={20} aria-hidden="true" />
          </div>

          <div className="metric-list">
            <div className="metric">
              <span>Affected Acres</span>
              <strong>{impact.affectedAcres}</strong>
            </div>
            <div className="metric">
              <span>Crop Types Damaged</span>
              <strong>{impact.cropTypesDamaged.length}</strong>
            </div>
            <div className="metric">
              <span>Estimated Loss</span>
              <strong>Rs {impact.estimatedLoss.toLocaleString("en-IN")}</strong>
            </div>
          </div>

          <div className="table-wrap" style={{ marginTop: 18 }}>
            <table>
              <thead>
                <tr>
                  <th>Farmer</th>
                  <th>Crop</th>
                  <th>Acres</th>
                  <th>NDVI Before</th>
                  <th>NDVI After</th>
                  <th>Drop</th>
                </tr>
              </thead>
              <tbody>
                {impact.fields.map((item) => (
                  <tr className="risk-medium" key={item.id}>
                    <td>{item.farmer}</td>
                    <td>{item.claimedCrop}</td>
                    <td>{item.acres.toFixed(1)}</td>
                    <td>{item.ndviBefore.toFixed(2)}</td>
                    <td>{item.ndviAfter.toFixed(2)}</td>
                    <td>{(item.ndviBefore - item.ndviAfter).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
