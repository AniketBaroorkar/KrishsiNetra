"use client";

import { useMemo, useState } from "react";
import { Bell, Send } from "lucide-react";

import { useLanguage } from "./LanguageProvider";
import { demoAlerts } from "../data/alertsData";
import { getDemoFarmers, uniqueValues } from "../utils/farmers";

const disasterTypes = ["Heavy Rain", "Flood", "Drought", "Pest Attack", "Crop Disease", "Heat Wave", "Unseasonal Rain"];

function riskLabel(level, t) {
  if (level === "High") return t("highRisk");
  if (level === "Medium") return t("mediumRisk");
  if (level === "Low") return t("lowRisk");
  return t("all");
}

function disasterLabel(type, t) {
  const key = {
    "Heavy Rain": "heavyRain",
    Flood: "flood",
    Drought: "drought",
    "Pest Attack": "pestAttack",
    "Crop Disease": "cropDisease",
    "Heat Wave": "heatWave",
    "Unseasonal Rain": "unseasonalRain",
  }[type];
  return key ? t(key) : type;
}

function statusLabel(status, t) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "sent") return t("sent");
  if (normalized === "delivered") return t("delivered");
  if (normalized === "pending") return t("pending");
  return status || "";
}

function riskClass(level) {
  if (level === "High") return "high";
  if (level === "Medium") return "medium";
  return "low";
}

function gpsTrustClass(status) {
  if (status === "Valid") return "valid";
  if (status === "Spoofing Suspected") return "spoofing";
  if (status === "Suspicious") return "suspicious";
  return "unknown";
}

export default function DisasterAlertsWorkspace() {
  const { t } = useLanguage();
  const [farmers, setFarmers] = useState(() => getDemoFarmers());
  const [alerts, setAlerts] = useState(demoAlerts);
  const [confirmation, setConfirmation] = useState("");
  const [form, setForm] = useState({
    district: "All",
    cropType: "All",
    riskLevel: "All",
    farmerId: "All",
    disasterType: "Heavy Rain",
    title: "Weather advisory",
    message: "Please check your crop field and follow guidance from the agriculture department.",
    language: "English",
  });

  const districts = ["All", ...uniqueValues(farmers, "district")];
  const crops = ["All", ...uniqueValues(farmers, "cropType")];

  const filteredFarmers = useMemo(() => {
    return farmers.filter((farmer) => (
      (form.district === "All" || farmer.district === form.district) &&
      (form.cropType === "All" || farmer.cropType === form.cropType) &&
      (form.riskLevel === "All" || farmer.riskLevel === form.riskLevel) &&
      (form.farmerId === "All" || farmer.farmerId === form.farmerId)
    ));
  }, [farmers, form]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function sendAlert() {
    const farmerIds = filteredFarmers.map((farmer) => farmer.farmerId);
    const payload = {
      farmerIds,
      disasterType: form.disasterType,
      title: form.title,
      message: form.message,
      language: form.language,
      sentAt: new Date().toISOString(),
    };

    const response = await fetch("/api/alerts/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    const alert = result.alert || { ...payload, id: `ALT-${Date.now()}`, status: "Sent" };

    setAlerts((current) => [alert, ...current]);
    setFarmers((current) => current.map((farmer) => (
      farmerIds.includes(farmer.farmerId)
        ? {
            ...farmer,
            disasterAlertStatus: "Sent",
            alertHistory: [
              {
                type: form.disasterType,
                title: form.title,
                message: form.message,
                language: form.language,
                status: "Sent",
                sentAt: new Date().toLocaleString(),
              },
              ...farmer.alertHistory,
            ],
          }
        : farmer
    )));
    setConfirmation(t("alertSentConfirmation").replace("{count}", farmerIds.length));
  }

  return (
    <section className="gov-page disaster-alert-page">
      <div className="gov-page-header">
        <div>
          <span className="gov-kicker">Disaster Impact</span>
          <h1>Disaster Impact & Farmer Alerts</h1>
          <p>Send disaster impact messages to selected farmers based on district, crop, and risk level.</p>
        </div>
        <span className="api-notice">{t("contact")}: 9579207219</span>
      </div>

      <div className="analytics-summary-grid">
        <article className="gov-stat-card analytics-stat-card"><span>{t("totalFarmers")}</span><strong>{farmers.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span>{t("filteredFarmers")}</span><strong>{filteredFarmers.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span>{t("alertsSent")}</span><strong>{alerts.length}</strong></article>
        <article className="gov-stat-card analytics-stat-card"><span>{t("highRiskFarmers")}</span><strong>{farmers.filter((farmer) => farmer.riskLevel === "High").length}</strong></article>
      </div>

      <div className="alert-layout">
        <form className="gov-card alert-form">
          <div className="friendly-card-heading alert-form-heading">
            <h2>Alert Configuration</h2>
            <p>Choose farmer segments and prepare a clear advisory message for the mobile app.</p>
          </div>
          <label>{t("district")}<select value={form.district} onChange={(event) => updateField("district", event.target.value)}>{districts.map((item) => <option key={item} value={item}>{item === "All" ? t("all") : item}</option>)}</select></label>
          <label>{t("cropType")}<select value={form.cropType} onChange={(event) => updateField("cropType", event.target.value)}>{crops.map((item) => <option key={item} value={item}>{item === "All" ? t("all") : item}</option>)}</select></label>
          <label>{t("riskScore")}<select value={form.riskLevel} onChange={(event) => updateField("riskLevel", event.target.value)}>{["All", "Low", "Medium", "High"].map((item) => <option key={item} value={item}>{riskLabel(item, t)}</option>)}</select></label>
          <label>{t("selectFarmer")}<select value={form.farmerId} onChange={(event) => updateField("farmerId", event.target.value)}><option value="All">{t("all")}</option>{filteredFarmers.map((farmer) => <option value={farmer.farmerId} key={farmer.farmerId}>{farmer.farmerName}</option>)}</select></label>
          <label>{t("disasterType")}<select value={form.disasterType} onChange={(event) => updateField("disasterType", event.target.value)}>{disasterTypes.map((item) => <option key={item} value={item}>{disasterLabel(item, t)}</option>)}</select></label>
          <label>{t("language")}<select value={form.language} onChange={(event) => updateField("language", event.target.value)}>{["English", "Marathi", "Hindi"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="wide">{t("messageTitle")}<input value={form.title} onChange={(event) => updateField("title", event.target.value)} /></label>
          <label className="wide">{t("messageBody")}<textarea value={form.message} onChange={(event) => updateField("message", event.target.value)} /></label>
          <button className="download-csv-btn" type="button" onClick={sendAlert}>
            <Send size={17} aria-hidden="true" />
            {t("sendAlert")}
          </button>
          {confirmation ? <p className="alert-confirmation">{confirmation}</p> : null}
        </form>

        <aside className="gov-card targeted-farmers">
          <div className="friendly-card-heading">
            <h2>{t("targetFarmers")}</h2>
            <p>{filteredFarmers.length} {t("farmerRecordsCount")}</p>
          </div>
          <div className="target-list">
            {filteredFarmers.slice(0, 8).map((farmer) => (
              <article className="target-farmer-card" key={farmer.farmerId}>
                <div>
                  <strong>{farmer.farmerName}</strong>
                  <small>{farmer.cropType} - {farmer.district}</small>
                </div>
                <span className={`risk-badge ${riskClass(farmer.riskLevel)}`}>{riskLabel(farmer.riskLevel, t)}</span>
                <span className={`gps-trust-badge ${gpsTrustClass(farmer.gpsTrustStatus)}`}>{farmer.gpsTrustStatus || "Unknown"}</span>
              </article>
            ))}
          </div>
        </aside>
      </div>

      <section className="gov-card">
        <div className="friendly-card-heading">
          <h2>{t("alertHistory")}</h2>
          <p>{t("status")}: {t("sent")} / {t("delivered")} / {t("pending")}</p>
        </div>
        <div className="friendly-table-wrap">
          <table className="friendly-table gov-table">
            <thead>
              <tr>
                <th>{t("alertId")}</th>
                <th>{t("messageTitle")}</th>
                <th>{t("disasterType")}</th>
                <th>{t("messageBody")}</th>
                <th>Target Farmers</th>
                <th>{t("language")}</th>
                <th>Sent Time</th>
                <th>{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td><strong>{alert.id}</strong></td>
                  <td>{alert.title}</td>
                  <td>{disasterLabel(alert.disasterType, t)}</td>
                  <td>{alert.message}</td>
                  <td>{alert.farmerIds?.length || 0}</td>
                  <td>{alert.language}</td>
                  <td>{alert.sentAt}</td>
                  <td><span className="status-badge approved">{statusLabel(alert.status, t)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
