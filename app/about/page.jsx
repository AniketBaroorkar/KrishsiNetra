"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Cloud,
  Database,
  Lock,
  MapPin,
  Radar,
  Satellite,
  ShieldCheck,
  Smartphone,
  Sprout,
} from "lucide-react";

import BackButton from "../../components/BackButton";
import { useLanguage } from "../../components/LanguageProvider";

const farmerAppFeatures = [
  "Farmer registration",
  "Farm and crop details",
  "Geo-tagged crop photo upload",
  "GPS location capture",
  "Claim submission and status tracking",
  "Disaster alerts and support/chat",
];

const dashboardFeatures = [
  "View all farmer records",
  "Review geo-tagged crop photos",
  "Check GPS location and integrity",
  "Run Sentinel satellite verification",
  "See NDVI and SAR results",
  "Approve, reject, flag, and export data",
];

const impactPoints = [
  "Reduces false agricultural claims",
  "Helps genuine farmers faster",
  "Reduces manual survey workload",
  "Improves disaster response",
  "Makes governance more transparent and data-driven",
];

const gpsChecks = [
  ["Missing GPS Check", "If latitude or longitude is missing, the claim becomes suspicious."],
  ["Mock Location Detection", "If the device reports mock location usage, the claim is marked as Spoofing Suspected."],
  ["GPS Accuracy Check", "If GPS accuracy is very poor, for example more than 100 meters, the claim is marked suspicious."],
  ["GPS Timestamp Check", "If the GPS timestamp is old or does not match the claim submission time, the claim is marked suspicious."],
  ["Photo Capture Type Check", "Live camera capture is preferred. Gallery upload adds a warning because old photos can be reused."],
  ["Satellite Cross-Verification", "Even valid-looking GPS is cross-checked using Sentinel-2 NDVI and Sentinel-1 SAR fallback."],
];

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <main className="krishi-site about-platform-page">
      <div className="gov-page about-gov-page">
        <div className="about-topbar">
          <Link className="krishi-brand-lockup" href="/">
            <span className="krishi-logo-mark"><Sprout size={24} aria-hidden="true" /></span>
            <span><strong>{t("appName")}</strong></span>
          </Link>
          <BackButton fallbackPath="/dashboard" />
        </div>

        <section className="about-major-section">
          <div className="gov-page-header about-gov-header">
            <div>
              <span className="gov-kicker">{t("aboutKrishiNetraSection")}</span>
              <h1>AI & Satellite-Based Agricultural Fraud Detection and Farmer Monitoring System</h1>
              <p>
                KrishiNetra helps government officers, agriculture departments, and administrators verify crop
                insurance claims with farmer-submitted geo-tagged photos, GPS evidence, satellite data, AI crop
                verification, location integrity checks, and clear risk scoring.
              </p>
            </div>
            <span className="api-notice">{t("contact")}: 9579207219</span>
          </div>

          <div className="about-system-flow gov-card">
            {[
              [Smartphone, "Mobile App"],
              [Database, "Backend"],
              [Satellite, "Satellite Verification"],
              [ShieldCheck, "Government Dashboard"],
            ].map(([Icon, label], index) => (
              <div className="about-flow-step" key={label}>
                <span><Icon size={24} aria-hidden="true" /></span>
                <strong>{label}</strong>
                {index < 3 ? <i aria-hidden="true">→</i> : null}
              </div>
            ))}
          </div>

          <div className="about-card-grid two">
            <article className="gov-card about-detail-card">
              <span className="gov-stat-icon"><Smartphone size={22} aria-hidden="true" /></span>
              <h2>Farmer Mobile App</h2>
              <ul>{farmerAppFeatures.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
            <article className="gov-card about-detail-card">
              <span className="gov-stat-icon"><ShieldCheck size={22} aria-hidden="true" /></span>
              <h2>Government Web Dashboard</h2>
              <ul>{dashboardFeatures.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          </div>

          <div className="about-impact-grid">
            {impactPoints.map((point) => (
              <article className="gov-card about-impact-card" key={point}>
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>{point}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="about-major-section gov-card satellite-about-section">
          <div className="friendly-card-heading about-section-heading">
            <span className="gov-kicker">{t("satelliteVerification")}</span>
            <h2>How KrishiNetra Uses Sentinel-1 and Sentinel-2 Satellite Data</h2>
            <p>
              KrishiNetra uses Sentinel-2 optical satellite imagery for crop vegetation analysis and Sentinel-1 SAR
              radar data as a fallback when clouds block optical images.
            </p>
          </div>

          <div className="about-card-grid two">
            <article className="satellite-about-card sentinel-two">
              <div className="about-visual-map ndvi-map"><Satellite size={28} aria-hidden="true" /></div>
              <h3>{t("sentinel2OpticalVerification")}</h3>
              <p>
                Sentinel-2 is an optical/multispectral satellite. It captures reflected sunlight from farms in
                different spectral bands and helps verify crop greenness, vegetation health, and active crop presence.
              </p>
              <div className="about-formula-card">
                <strong>NDVI = (NIR - Red) / (NIR + Red)</strong>
                <span>Sentinel-2: NDVI = (B8 - B4) / (B8 + B4)</span>
              </div>
              <div className="about-mini-list">
                <span><b>Below 0.2</b> Very low vegetation / bare soil / suspicious</span>
                <span><b>0.2 to 0.5</b> Medium vegetation</span>
                <span><b>Above 0.5</b> Healthy vegetation</span>
              </div>
              <p className="about-info-box">Example: healthy sugarcane claim + NDVI 0.12 + low cloud cover = High Risk for officer review.</p>
            </article>

            <article className="satellite-about-card sentinel-one">
              <div className="about-visual-map sar-map"><Radar size={28} aria-hidden="true" /></div>
              <h3>{t("sentinel1SarFallback")}</h3>
              <p>
                Sentinel-1 uses Synthetic Aperture Radar. It sends radar signals toward Earth and measures the return
                signal, so it can work during cloudy weather, rain, and night.
              </p>
              <div className="about-mini-list">
                <span>Used when Sentinel-2 images are blocked by clouds.</span>
                <span>Does not calculate NDVI.</span>
                <span>Helps check moisture, flood impact, crop structure, and surface changes.</span>
              </div>
              <p className="about-info-box">If cloud cover is high, KrishiNetra marks Sentinel-2 as uncertain and uses Sentinel-1 SAR fallback.</p>
            </article>
          </div>

          <div className="gov-card satellite-comparison-card">
            <div className="friendly-card-heading">
              <h3>Sentinel-1 vs Sentinel-2 Comparison</h3>
              <p>NDVI comes from Sentinel-2 only. Sentinel-1 SAR supports verification during cloudy conditions.</p>
            </div>
            <div className="friendly-table-wrap">
              <table className="friendly-table gov-table">
                <thead>
                  <tr><th>Satellite</th><th>Type</th><th>Best For</th><th>Limitation</th><th>Works At Night</th><th>KrishiNetra Use</th></tr>
                </thead>
                <tbody>
                  <tr><td><strong>Sentinel-2</strong></td><td>Optical / Multispectral</td><td>NDVI, vegetation health, crop greenness</td><td>Clouds can block view</td><td>No</td><td>First choice for crop verification</td></tr>
                  <tr><td><strong>Sentinel-1</strong></td><td>SAR Radar</td><td>Cloudy weather, flood, moisture, field structure</td><td>Cannot directly show crop color</td><td>Yes</td><td>Fallback when Sentinel-2 is cloudy</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="about-major-section gov-card">
          <div className="friendly-card-heading about-section-heading">
              <span className="gov-kicker">{t("locationIntegrityCheck")}</span>
            <h2>How KrishiNetra Detects GPS Spoofing and Suspicious Location Data</h2>
            <p>
              KrishiNetra does not blindly trust GPS. Location can be manipulated using mock location or GPS spoofing
              apps, so every submitted location passes through a Location Integrity Check before the claim is trusted.
            </p>
          </div>

          <div className="about-card-grid two">
            <article className="gov-card about-detail-card">
              <span className="gov-stat-icon"><MapPin size={22} aria-hidden="true" /></span>
              <h3>Data Collected From Mobile App</h3>
              <ul>
                {["Latitude", "Longitude", "GPS accuracy", "GPS timestamp", "GPS provider", "Mock location signal", "Photo capture type", "Submitted time"].map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
            <article className="gov-card about-detail-card">
              <span className="gov-stat-icon"><Lock size={22} aria-hidden="true" /></span>
              <h3>{t("gpsTrustStatus")}</h3>
              <div className="gps-status-grid">
                <span className="gps-trust-badge valid">Valid</span>
                <span className="gps-trust-badge suspicious">Suspicious</span>
                <span className="gps-trust-badge spoofing">Spoofing Suspected</span>
                <span className="gps-trust-badge unknown">Unknown</span>
              </div>
              <p>KrishiNetra does not automatically reject claims. It marks suspicious claims for officer review.</p>
            </article>
          </div>

          <div className="integrity-explainer-grid">
            {gpsChecks.map(([title, text]) => (
              <article className="integrity-explainer-card" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>

          <div className="about-risk-grid">
            {[
              [AlertTriangle, "Missing GPS = High Risk"],
              [AlertTriangle, "Mock location detected = High Risk"],
              [Cloud, "Poor GPS accuracy = Medium/High Risk"],
              [Camera, "Gallery upload = Warning"],
              [CheckCircle2, "Valid GPS + live photo + satellite support = Low Risk"],
            ].map(([Icon, item]) => (
              <span key={item}><Icon size={16} aria-hidden="true" />{item}</span>
            ))}
          </div>

          <div className="integrity-example-card">
            <strong>Example</strong>
            <p>
              If a farmer submits a claim with mock location detected, GPS accuracy of 500 meters, and Sentinel-2
              NDVI shows low vegetation, KrishiNetra marks the claim as High Risk and shows the reason to the
              government officer.
            </p>
          </div>

          <div className="verification-flow">
            {[
              "Farmer submits crop photo",
              "App captures GPS + accuracy + timestamp",
              "Location Integrity Check",
              "Mock Location Detection",
              "Sentinel-2 NDVI Verification",
              "Sentinel-1 SAR Fallback if cloudy",
              t("finalRiskScore"),
              t("governmentOfficerReview"),
            ].map((step, index) => (
              <div className="verification-flow-step" key={step}>
                <span>{index + 1}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
