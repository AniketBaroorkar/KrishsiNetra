"use client";

import { useMemo, useState } from "react";
import { Calculator, Download, FileDown, RotateCcw, Upload } from "lucide-react";

const demoGeoJson = {
  type: "FeatureCollection",
  event: {
    event_type: "Flood",
    event_date: "2026-05-05",
    district: "Pune",
    taluka: "Haveli",
    satellite_source: "Sentinel-2",
    bands_used: "Band 4 Red + Band 8 NIR",
    method: "NDVI before/after comparison",
  },
  features: [
    {
      type: "Feature",
      properties: { feature_type: "affected_area" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [73.78, 18.45],
            [73.98, 18.45],
            [73.98, 18.62],
            [73.78, 18.62],
            [73.78, 18.45],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        feature_type: "farm",
        farmer: "Asha Jadhav",
        survey_no: "18/3",
        crop: "Rice",
        acres: 2.1,
        ndvi_before: 0.68,
        ndvi_after: 0.31,
        value_per_acre_rs: 42000,
      },
      geometry: { type: "Point", coordinates: [74.1814, 17.2865] },
    },
    {
      type: "Feature",
      properties: {
        feature_type: "farm",
        farmer: "Nitin Pawar",
        survey_no: "63/4C",
        crop: "Soybean",
        acres: 6.3,
        ndvi_before: 0.64,
        ndvi_after: 0.29,
        value_per_acre_rs: 38000,
      },
      geometry: { type: "Point", coordinates: [79.0882, 21.1458] },
    },
    {
      type: "Feature",
      properties: {
        feature_type: "farm",
        farmer: "Lata Deshmukh",
        survey_no: "5/5A",
        crop: "Sugarcane",
        acres: 7.1,
        ndvi_before: 0.7,
        ndvi_after: 0.22,
        value_per_acre_rs: 52000,
      },
      geometry: { type: "Point", coordinates: [73.9986, 19.8458] },
    },
    {
      type: "Feature",
      properties: {
        feature_type: "farm",
        farmer: "Prakash Gaikwad",
        survey_no: "77/8",
        crop: "Wheat",
        acres: 2.9,
        ndvi_before: 0.55,
        ndvi_after: 0.39,
        value_per_acre_rs: 31000,
      },
      geometry: { type: "Point", coordinates: [75.694, 18.234] },
    },
  ],
};

const initialGeoJsonText = JSON.stringify(demoGeoJson, null, 2);
const emptySummary = buildEmptySummary();

function formatCurrency(value) {
  return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getSeverity(damagePercent) {
  if (damagePercent >= 65) return "Severe";
  if (damagePercent >= 45) return "High";
  if (damagePercent >= 25) return "Medium";
  return "Low";
}

function severityClass(severity) {
  return severity.toLowerCase().replace(" ", "-");
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildEmptySummary() {
  return {
    affectedAcres: 0,
    farmsImpacted: 0,
    cropTypesDamaged: 0,
    averageNdviBefore: 0,
    averageNdviAfter: 0,
    averageNdviDrop: 0,
    averageDamage: 0,
    estimatedLoss: 0,
    damageSeverity: "Low",
  };
}

function defaultEvent(eventDate) {
  return {
    event_type: "Flood",
    event_date: eventDate,
    district: "Pune",
    taluka: "Haveli",
    satellite_source: "Sentinel-2",
    bands_used: "Band 4 Red + Band 8 NIR",
    method: "NDVI before/after comparison",
  };
}

function normalizeEvent(geoJson, eventDate) {
  const event = geoJson.event || geoJson.properties?.event || geoJson.properties || {};
  return {
    ...defaultEvent(eventDate),
    ...event,
  };
}

function calculateFarmRows(farmFeatures) {
  return farmFeatures.map((feature, index) => {
    const props = feature.properties || {};
    const acres = toNumber(props.acres);
    const ndviBefore = toNumber(props.ndvi_before);
    const ndviAfter = toNumber(props.ndvi_after);
    const valuePerAcre = toNumber(props.value_per_acre_rs);
    const ndviDrop = Math.max(0, ndviBefore - ndviAfter);
    const damagePercent = ndviBefore > 0 ? Math.round((ndviDrop / ndviBefore) * 100) : 0;
    const damageFactor = damagePercent / 100;
    const estimatedLoss = acres * valuePerAcre * damageFactor;

    return {
      id: `${props.survey_no || "farm"}-${index}`,
      farmer: props.farmer || "Unknown Farmer",
      surveyNo: props.survey_no || "Not provided",
      crop: props.crop || "Unknown Crop",
      acres,
      ndviBefore,
      ndviAfter,
      ndviDrop,
      damagePercent,
      valuePerAcre,
      estimatedLoss,
      severity: getSeverity(damagePercent),
    };
  });
}

function calculateSummary(rows) {
  if (!rows.length) return buildEmptySummary();

  const affectedAcres = rows.reduce((total, row) => total + row.acres, 0);
  const cropTypesDamaged = new Set(rows.map((row) => row.crop)).size;
  const averageNdviBefore = average(rows.map((row) => row.ndviBefore));
  const averageNdviAfter = average(rows.map((row) => row.ndviAfter));
  const averageDamage = average(rows.map((row) => row.damagePercent));
  const estimatedLoss = rows.reduce((total, row) => total + row.estimatedLoss, 0);

  return {
    affectedAcres,
    farmsImpacted: rows.length,
    cropTypesDamaged,
    averageNdviBefore,
    averageNdviAfter,
    averageNdviDrop: averageNdviBefore - averageNdviAfter,
    averageDamage,
    estimatedLoss,
    damageSeverity: getSeverity(averageDamage),
  };
}

function parseGeoJson(text, eventDate) {
  let geoJson;
  try {
    geoJson = JSON.parse(text);
  } catch {
    throw new Error("Invalid GeoJSON file.");
  }

  if (geoJson.type !== "FeatureCollection" || !Array.isArray(geoJson.features)) {
    throw new Error("No features found in GeoJSON.");
  }

  if (geoJson.features.length === 0) {
    throw new Error("No features found in GeoJSON.");
  }

  const affectedArea = geoJson.features.find(
    (feature) => feature.properties?.feature_type === "affected_area",
  );
  const farmFeatures = geoJson.features.filter(
    (feature) => feature.properties?.feature_type === "farm",
  );
  const rows = calculateFarmRows(farmFeatures);

  return {
    rows,
    summary: calculateSummary(rows),
    event: normalizeEvent(geoJson, eventDate),
    featureCount: geoJson.features.length,
    farmCount: farmFeatures.length,
    hasAffectedArea: Boolean(affectedArea),
  };
}

function downloadTextFile(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildCsv(rows) {
  const headers = [
    "Farmer",
    "Survey No",
    "Crop",
    "Acres",
    "NDVI Before",
    "NDVI After",
    "NDVI Drop",
    "Damage %",
    "Value/Acre",
    "Estimated Loss",
    "Severity",
  ];
  return [headers, ...rows.map((row) => [
    row.farmer,
    row.surveyNo,
    row.crop,
    row.acres,
    row.ndviBefore,
    row.ndviAfter,
    row.ndviDrop,
    row.damagePercent,
    row.valuePerAcre,
    Math.round(row.estimatedLoss),
    row.severity,
  ])]
    .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

function buildReport({ summary, event, rows, fileName }) {
  return [
    "KrishiNetra Disaster Impact Report",
    `File: ${fileName}`,
    `Event Type: ${event.event_type}`,
    `Event Date: ${event.event_date}`,
    `District: ${event.district}`,
    `Taluka: ${event.taluka}`,
    `Satellite Source: ${event.satellite_source}`,
    `Bands Used: ${event.bands_used}`,
    `Method: ${event.method}`,
    "",
    `Affected Acres: ${summary.affectedAcres.toFixed(1)}`,
    `Farms Impacted: ${summary.farmsImpacted}`,
    `Crop Types Damaged: ${summary.cropTypesDamaged}`,
    `Average NDVI Before: ${summary.averageNdviBefore.toFixed(2)}`,
    `Average NDVI After: ${summary.averageNdviAfter.toFixed(2)}`,
    `Average NDVI Drop: ${summary.averageNdviDrop.toFixed(2)}`,
    `Average Damage: ${Math.round(summary.averageDamage)}%`,
    `Estimated Loss: ${formatCurrency(summary.estimatedLoss)}`,
    `Damage Severity: ${summary.damageSeverity}`,
    "",
    "Farm Rows:",
    ...rows.map(
      (row) =>
        `${row.farmer} | ${row.surveyNo} | ${row.crop} | ${row.acres} acres | ` +
        `NDVI ${row.ndviBefore.toFixed(2)} -> ${row.ndviAfter.toFixed(2)} | ` +
        `${row.damagePercent}% damage | ${formatCurrency(row.estimatedLoss)} | ${row.severity}`,
    ),
  ].join("\n");
}

export default function DisasterImpactPage() {
  const [eventDate, setEventDate] = useState("2026-05-05");
  const [polygonText, setPolygonText] = useState(initialGeoJsonText);
  const [fileName, setFileName] = useState("demo-disaster-impact.geojson");
  const [uploadStatus, setUploadStatus] = useState("No file uploaded");
  const [message, setMessage] = useState("Upload a GeoJSON file, then click Calculate Impact.");
  const [error, setError] = useState("");
  const [calculation, setCalculation] = useState(() => parseGeoJson(initialGeoJsonText, "2026-05-05"));

  const summaryCards = useMemo(
    () => [
      { label: "Affected Acres", value: calculation.summary.affectedAcres.toFixed(1) },
      { label: "Farms Impacted", value: String(calculation.summary.farmsImpacted) },
      { label: "Crop Types Damaged", value: String(calculation.summary.cropTypesDamaged) },
      { label: "Average NDVI Drop", value: calculation.summary.averageNdviDrop.toFixed(2) },
      { label: "Estimated Loss", value: formatCurrency(calculation.summary.estimatedLoss) },
      {
        label: "Damage Severity",
        value: calculation.summary.damageSeverity,
        severity: calculation.summary.damageSeverity,
      },
    ],
    [calculation],
  );

  const reportDetails = [
    ["Event Type", calculation.event.event_type],
    ["Event Date", calculation.event.event_date],
    ["District", calculation.event.district],
    ["Taluka", calculation.event.taluka],
    ["Satellite Source", calculation.event.satellite_source],
    ["Bands Used", calculation.event.bands_used],
    ["Method", calculation.event.method],
    ["Report Status", calculation.rows.length ? "Ready for officer review" : "Affected area only"],
  ];

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setPolygonText(text);
      setFileName(file.name);
      setError("");

      // Parse once on upload so the UI can confirm that the GeoJSON is readable.
      try {
        parseGeoJson(text, eventDate);
        setUploadStatus("File loaded successfully");
        setMessage("File loaded successfully. Click Calculate Impact to update the report.");
      } catch (parseError) {
        setUploadStatus("Invalid file");
        setMessage("Please upload a valid KrishiNetra GeoJSON file.");
        setError(parseError.message);
      }
    };
    reader.readAsText(file);
  }

  function runImpact(event) {
    event.preventDefault();
    setError("");

    if (!polygonText.trim()) {
      setUploadStatus("No file uploaded");
      setMessage("Please upload a GeoJSON file first.");
      return;
    }

    try {
      // File parsing and calculations happen here on the frontend for the demo.
      const result = parseGeoJson(polygonText, eventDate);
      setCalculation(result);
      setUploadStatus("Impact calculated successfully");
      setMessage(
        result.farmCount
          ? "Impact calculated successfully from uploaded GeoJSON."
          : "No farm-level damage records found. Showing affected area only.",
      );
    } catch (parseError) {
      setUploadStatus("Invalid file");
      setMessage("Please fix the GeoJSON and try again.");
      setError(parseError.message);
      setCalculation({
        rows: [],
        summary: emptySummary,
        event: defaultEvent(eventDate),
        featureCount: 0,
        farmCount: 0,
        hasAffectedArea: false,
      });
    }
  }

  function resetDemo() {
    const result = parseGeoJson(initialGeoJsonText, "2026-05-05");
    setEventDate("2026-05-05");
    setPolygonText(initialGeoJsonText);
    setFileName("demo-disaster-impact.geojson");
    setUploadStatus("No file uploaded");
    setMessage("Upload a GeoJSON file, then click Calculate Impact.");
    setError("");
    setCalculation(result);
  }

  function downloadCsv() {
    if (!calculation.rows.length) {
      setMessage("No farm-level damage records found. CSV has no farm rows to export.");
      return;
    }
    downloadTextFile("krishinetra-disaster-impact.csv", buildCsv(calculation.rows), "text/csv;charset=utf-8");
  }

  function exportReport() {
    downloadTextFile(
      "krishinetra-disaster-report.txt",
      buildReport({
        summary: calculation.summary,
        event: calculation.event,
        rows: calculation.rows,
        fileName,
      }),
    );
  }

  return (
    <section className="disaster-page">
      <div className="disaster-hero">
        <div>
          <span className="disaster-kicker">Interactive GeoJSON disaster assessment</span>
          <h1>Disaster Impact</h1>
          <p>
            Upload affected-area and farm-level GeoJSON records to calculate NDVI drop, damage
            percentage, crop-wise loss, and an officer-ready disaster report.
          </p>
        </div>
        <div className="disaster-report-mini">
          <strong>Total Estimated Loss</strong>
          <span>{formatCurrency(calculation.summary.estimatedLoss)}</span>
          <p>{uploadStatus}</p>
        </div>
      </div>

      <div className="disaster-layout">
        <form className="disaster-card disaster-form" onSubmit={runImpact}>
          <div className="disaster-card-heading">
            <h2>Affected Area Input</h2>
            <p>Upload GeoJSON polygon to define the affected area.</p>
          </div>

          <label>
            Flood Event Date
            <input
              type="date"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
            />
          </label>

          <label>
            Affected Area Polygon / Farm GeoJSON
            <input type="file" accept=".json,.geojson" onChange={handleFile} />
          </label>

          <label>
            GeoJSON Preview
            <textarea value={polygonText} onChange={(event) => setPolygonText(event.target.value)} />
          </label>

          <div className={`upload-status ${error ? "error" : "success"}`}>
            <strong>{uploadStatus}</strong>
            <span>{error || message}</span>
          </div>

          <p className="demo-note">
            In production, this page will fetch Sentinel-2 imagery from Copernicus API. Current
            calculations run in the browser for Pune Agri Hackathon 2026 demo.
          </p>

          <div className="disaster-actions">
            <button className="btn" type="submit">
              <Calculator size={16} aria-hidden="true" />
              Calculate Impact
            </button>
            <button className="btn secondary" type="button" onClick={resetDemo}>
              <RotateCcw size={16} aria-hidden="true" />
              Reset
            </button>
            <button className="btn secondary" type="button" onClick={downloadCsv}>
              <Download size={16} aria-hidden="true" />
              Download CSV
            </button>
            <button className="btn secondary" type="button" onClick={exportReport}>
              <FileDown size={16} aria-hidden="true" />
              Export Disaster Report
            </button>
          </div>
        </form>

        <section className="disaster-card">
          <div className="disaster-card-heading">
            <h2>File Information</h2>
            <p>{message}</p>
          </div>
          <div className="report-grid">
            <div>
              <span>File Name</span>
              <strong>{fileName}</strong>
            </div>
            <div>
              <span>Number of Features</span>
              <strong>{calculation.featureCount}</strong>
            </div>
            <div>
              <span>Number of Farms</span>
              <strong>{calculation.farmCount}</strong>
            </div>
            <div>
              <span>Affected Area Feature</span>
              <strong>{calculation.hasAffectedArea ? "Found" : "Not found"}</strong>
            </div>
            <div>
              <span>Event Type</span>
              <strong>{calculation.event.event_type}</strong>
            </div>
            <div>
              <span>District</span>
              <strong>{calculation.event.district}</strong>
            </div>
            <div>
              <span>Taluka</span>
              <strong>{calculation.event.taluka}</strong>
            </div>
          </div>
        </section>
      </div>

      <div className="disaster-summary-grid">
        {summaryCards.map((card) => (
          <article className="disaster-summary-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            {card.severity ? (
              <em className={`severity-badge ${severityClass(card.severity)}`}>{card.severity}</em>
            ) : null}
          </article>
        ))}
      </div>

      <section className="disaster-card">
        <div className="disaster-card-heading">
          <h2>NDVI Before/After Comparison</h2>
          <p>Average values update from the uploaded farm records.</p>
        </div>
        <div className="ndvi-comparison-grid">
          <article className="ndvi-scene-card">
            <div className="ndvi-scene before">
              <span className="field-block healthy-one" />
              <span className="field-block healthy-two" />
              <span className="field-block moderate-one" />
            </div>
            <h3>Before Flood/Drought NDVI</h3>
            <strong>Average NDVI: {calculation.summary.averageNdviBefore.toFixed(2)}</strong>
            <p>Higher values indicate healthier vegetation before the event.</p>
          </article>
          <article className="ndvi-scene-card">
            <div className="ndvi-scene after">
              <span className="field-block damaged-one" />
              <span className="field-block damaged-two" />
              <span className="field-block moderate-two" />
            </div>
            <h3>After Flood/Drought NDVI</h3>
            <strong>Average NDVI: {calculation.summary.averageNdviAfter.toFixed(2)}</strong>
            <p>Lower values indicate vegetation stress, bare soil, or damaged crop area.</p>
          </article>
        </div>
        <div className="damage-legend">
          <span><i className="legend-green" /> Green: Healthy crop</span>
          <span><i className="legend-yellow" /> Yellow: Moderate stress</span>
          <span><i className="legend-red" /> Red: Severe damage / low NDVI</span>
        </div>
      </section>

      <section className="disaster-card calculation-card">
        <div className="disaster-card-heading">
          <h2>How Loss is Calculated</h2>
          <p>
            KrishiNetra compares NDVI before and after the disaster event. A higher NDVI drop means
            more crop damage. The system estimates financial loss using crop-wise value per acre
            and damage severity.
          </p>
        </div>
        <div className="formula-stack">
          <div>NDVI Drop = NDVI Before - NDVI After</div>
          <div>Damage % = NDVI Drop / NDVI Before x 100</div>
          <div>Estimated Loss = Acres x Crop Value per Acre x Damage Factor</div>
        </div>
      </section>

      <section className="disaster-card">
        <div className="disaster-card-heading">
          <h2>Disaster Report Details</h2>
          <p>Event metadata is read from the root GeoJSON event object when available.</p>
        </div>
        <div className="report-grid">
          {reportDetails.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="disaster-card">
        <div className="disaster-card-heading">
          <h2>Crop-wise Impact Table</h2>
          <p>
            Farm rows are calculated from GeoJSON features where properties.feature_type is "farm".
          </p>
        </div>
        <div className="table-wrap disaster-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Survey No</th>
                <th>Crop</th>
                <th>Acres</th>
                <th>NDVI Before</th>
                <th>NDVI After</th>
                <th>NDVI Drop</th>
                <th>Damage %</th>
                <th>Value/Acre</th>
                <th>Estimated Loss</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {calculation.rows.length ? (
                calculation.rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.farmer}</td>
                    <td>{row.surveyNo}</td>
                    <td>{row.crop}</td>
                    <td>{row.acres.toFixed(1)}</td>
                    <td>{row.ndviBefore.toFixed(2)}</td>
                    <td>{row.ndviAfter.toFixed(2)}</td>
                    <td>{row.ndviDrop.toFixed(2)}</td>
                    <td>{row.damagePercent}%</td>
                    <td>{formatCurrency(row.valuePerAcre)}</td>
                    <td>{formatCurrency(row.estimatedLoss)}</td>
                    <td>
                      <span className={`severity-badge ${severityClass(row.severity)}`}>
                        {row.severity}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11}>No farm-level damage records found. Showing affected area only.</td>
                </tr>
              )}
              <tr className="loss-total-row">
                <td colSpan={9}>Total Estimated Loss</td>
                <td>{formatCurrency(calculation.summary.estimatedLoss)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
