import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Camera,
  CheckCircle2,
  Database,
  FileText,
  Gauge,
  LandPlot,
  Map,
  MapPin,
  Radar,
  Satellite,
  ShieldCheck,
  Smartphone,
  Sprout,
} from "lucide-react";

import {
  maharashtraDistricts,
  platformStats,
  supportedCrops,
} from "../data/dashboardData";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/map", label: "Live Crop Map" },
  { href: "/dashboard/fraud", label: "Fraud Alerts" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/disaster", label: "Disaster Impact" },
  { href: "#data-sources", label: "About Data Sources" },
];

const features = [
  {
    title: "Geo-tagged Farmer Photo Upload",
    text: "Farmers submit crop photos with GPS and survey details from the field.",
    icon: Camera,
  },
  {
    title: "AI Crop Classification",
    text: "A crop image model checks whether the photo matches the claimed crop.",
    icon: Radar,
  },
  {
    title: "Sentinel-2 NDVI Verification",
    text: "Satellite Red and NIR bands estimate crop health around the farm area.",
    icon: Satellite,
  },
  {
    title: "Fraud Risk Scoring",
    text: "Officials get a simple score with reasons for approving or reviewing claims.",
    icon: Gauge,
  },
];

const steps = [
  "Farmer submits geo-tagged crop photo",
  "GPS location is matched with registered farm boundary",
  "AI model predicts crop type from photo",
  "Sentinel-2 satellite data is fetched for that location",
  "NDVI is calculated using Red and NIR bands",
  "Fraud risk score is generated for officials",
];

const dataSources = [
  {
    title: "Farmer Mobile App",
    text: "Provides geo-tagged crop photos, farmer details, survey number, and claim information.",
    icon: Smartphone,
  },
  {
    title: "GPS Location",
    text: "Coordinates come from the mobile device and are compared with the registered farm boundary.",
    icon: MapPin,
  },
  {
    title: "Sentinel-2 Satellite",
    text: "Images come from Sentinel-2 through the Copernicus Data Space Ecosystem API.",
    icon: Satellite,
  },
  {
    title: "AI + Maps",
    text: "The demo combines crop image classification, OpenStreetMap views, and officer dashboards.",
    icon: Database,
  },
];

export default function HomePage() {
  return (
    <main className="agri-home">
      <nav className="agri-nav">
        <Link className="agri-brand" href="/">
          <span>
            <ShieldCheck size={21} aria-hidden="true" />
          </span>
          KrishiNetra
        </Link>
        <div className="agri-nav-links">
          {navLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      <section className="agri-hero">
        <div className="agri-hero-copy">
          <div className="agri-kicker">
            <Sprout size={17} aria-hidden="true" />
            Agriculture insurance verification platform
          </div>
          <h1>KrishiNetra</h1>
          <h2>AI + Satellite-Based Agricultural Fraud Detection System</h2>
          <p>
            KrishiNetra verifies crop insurance claims using farmer-submitted geo-tagged photos,
            AI crop classification, GPS validation, and Sentinel-2 satellite NDVI analysis.
          </p>
          <div className="agri-actions">
            <Link className="agri-btn primary" href="/dashboard">
              <BarChart3 size={18} aria-hidden="true" />
              Open Dashboard
            </Link>
            <Link className="agri-btn secondary" href="#submit-claim">
              <FileText size={18} aria-hidden="true" />
              Submit Farmer Claim
            </Link>
            <Link className="agri-btn light" href="/dashboard/fraud">
              <AlertTriangle size={18} aria-hidden="true" />
              View Fraud Alerts
            </Link>
          </div>
        </div>

        <div className="farm-visual-card">
          <div className="farm-sky">
            <span className="sun" />
            <span className="satellite-dot">
              <Satellite size={20} aria-hidden="true" />
            </span>
          </div>
          <div className="farm-fields">
            <span className="field-strip strip-one" />
            <span className="field-strip strip-two" />
            <span className="field-strip strip-three" />
            <span className="claim-pin">
              <MapPin size={18} aria-hidden="true" />
              Claim GPS
            </span>
          </div>
          <div className="farm-visual-footer">
            <strong>NDVI 0.72</strong>
            <span>Healthy vegetation detected</span>
          </div>
        </div>
      </section>

      <section className="agri-section">
        <div className="agri-section-heading">
          <h2>Live Demo Snapshot</h2>
          <p>Mock statistics for presenting the complete monitoring workflow to officials.</p>
        </div>
        <div className="agri-stats-grid">
          {platformStats.map((stat) => (
            <article className="agri-stat-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="agri-section">
        <div className="agri-section-heading">
          <h2>Verification Features</h2>
          <p>Simple, explainable checks that help non-technical reviewers understand each claim.</p>
        </div>
        <div className="agri-feature-grid">
          {features.map(({ title, text, icon: Icon }) => (
            <article className="agri-feature-card" key={title}>
              <div className="agri-icon">
                <Icon size={23} aria-hidden="true" />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="agri-section how-krishi-works">
        <div className="agri-section-heading">
          <h2>How KrishiNetra Works</h2>
          <p>From a farmer photo to an officer-ready fraud risk score.</p>
        </div>
        <div className="agri-steps-grid">
          {steps.map((step, index) => (
            <article className="agri-step-card" key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="agri-section two-column-section" id="data-sources">
        <div>
          <div className="agri-section-heading">
            <h2>About Data Sources</h2>
            <p>
              Sentinel-2 is a European satellite mission that captures Earth observation images.
              KrishiNetra uses the farmer&apos;s GPS location to request satellite imagery for
              that farm area. The system then uses Red and Near-Infrared bands to calculate NDVI,
              which helps estimate crop health.
            </p>
          </div>
          <div className="data-source-grid">
            {dataSources.map(({ title, text, icon: Icon }) => (
              <article className="data-source-card" key={title}>
                <Icon size={20} aria-hidden="true" />
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="ndvi-formula-card">
          <h3>NDVI Formula</h3>
          <strong>NDVI = (NIR - Red) / (NIR + Red)</strong>
          <p>
            High NDVI means healthy vegetation. Low NDVI can indicate bare soil, damaged crops,
            or a crop mismatch.
          </p>
          <div className="ndvi-scale">
            <span>Low</span>
            <div />
            <span>Healthy</span>
          </div>
        </div>
      </section>

      <section className="agri-section two-column-section">
        <div>
          <div className="agri-section-heading">
            <h2>Supported Crops</h2>
            <p>Current model categories for the crop photo classification demo.</p>
          </div>
          <div className="chip-grid">
            {supportedCrops.map((crop) => (
              <span className="crop-chip" key={crop}>{crop}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="agri-section-heading">
            <h2>Maharashtra Coverage</h2>
            <p>District and taluka-wise filtering for insurance verification and disaster review.</p>
          </div>
          <div className="chip-grid">
            {maharashtraDistricts.map((district) => (
              <span className="district-chip" key={district}>{district}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="agri-section claim-demo-section" id="submit-claim">
        <div className="agri-section-heading">
          <h2>Farmer Claim Submission</h2>
          <p>Frontend-only mock form for demonstrating the farmer claim workflow.</p>
        </div>
        <form className="claim-form">
          {[
            "Farmer Name",
            "Aadhaar Number",
            "Phone Number",
            "District",
            "Taluka",
            "Village",
            "Survey Number",
          ].map((label) => (
            <label key={label}>
              <span>{label}</span>
              <input placeholder={label} />
            </label>
          ))}
          <label>
            <span>Crop Type</span>
            <select defaultValue="Sugarcane">
              {supportedCrops.map((crop) => (
                <option key={crop}>{crop}</option>
              ))}
            </select>
          </label>
          <button className="agri-btn light" type="button">Upload Photo</button>
          <button className="agri-btn light" type="button">Capture GPS</button>
          <button className="agri-btn primary" type="button">Submit Claim</button>
        </form>
      </section>

      <section className="agri-section about-demo">
        <CheckCircle2 size={24} aria-hidden="true" />
        <div>
          <h2>About this Demo</h2>
          <p>
            This is a prototype for Pune Agri Hackathon 2026. The current version uses mock data
            for demonstration. In production, it will connect to Django backend, PostgreSQL/PostGIS
            database, PyTorch AI model, and Copernicus Sentinel-2 satellite data.
          </p>
        </div>
      </section>
    </main>
  );
}
