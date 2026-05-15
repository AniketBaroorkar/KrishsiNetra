"use client";

import {
  CheckCircle2,
  Cloud,
  CloudRain,
  Database,
  Gauge,
  Image,
  Lock,
  MapPin,
  Radar,
  Satellite,
  ShieldCheck,
  Smartphone,
  Sprout,
  Target,
  Users,
  Workflow,
} from "lucide-react";

import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import FloatingSocials from "../../components/FloatingSocials";
import { useLanguage } from "../../components/LanguageProvider";

const pipelineNodes = [
  { Icon: Smartphone, label: "Mobile App", role: "Farmer-side capture" },
  { Icon: Database, label: "Backend", role: "Claims + integrity store" },
  { Icon: Satellite, label: "Satellite", role: "Sentinel-1 / Sentinel-2" },
  { Icon: ShieldCheck, label: "Dashboard", role: "Officer review + decision" },
];

const farmerAppFeatures = [
  { Icon: Users, text: "Farmer registration" },
  { Icon: Sprout, text: "Farm and crop details" },
  { Icon: Image, text: "Geo-tagged crop photo upload" },
  { Icon: MapPin, text: "GPS location capture" },
  { Icon: Workflow, text: "Claim submission and status tracking" },
  { Icon: CloudRain, text: "Disaster alerts and support chat" },
];

const dashboardFeatures = [
  { Icon: Users, text: "View all farmer records" },
  { Icon: Image, text: "Review geo-tagged crop photos" },
  { Icon: Target, text: "Check GPS location and integrity" },
  { Icon: Satellite, text: "Run Sentinel satellite verification" },
  { Icon: Gauge, text: "See NDVI and SAR results" },
  { Icon: ShieldCheck, text: "Approve, reject, flag, export" },
];

const verificationSteps = [
  "Farmer submits crop photo",
  "App captures GPS + accuracy + timestamp",
  "Location integrity check",
  "Mock location detection",
  "Sentinel-2 NDVI verification",
  "Sentinel-1 SAR fallback if cloudy",
  "Final risk score computed",
  "Government officer reviews",
];

const gpsChecks = [
  ["Missing GPS", "If latitude or longitude is missing, the claim becomes suspicious."],
  ["Mock Location", "If the device reports mock location usage, the claim is flagged as spoofing suspected."],
  ["GPS Accuracy", "If GPS accuracy is poor (more than 100m), the claim is marked suspicious."],
  ["GPS Timestamp", "If the GPS timestamp is stale or doesn't match the submission time, the claim is suspicious."],
  ["Photo Capture", "Live camera capture is preferred. Gallery uploads add a warning because old photos can be reused."],
  ["Satellite Cross-Check", "Even valid-looking GPS is cross-checked using Sentinel-2 NDVI or Sentinel-1 SAR fallback."],
];

const impactPoints = [
  "Reduces false agricultural claims",
  "Helps genuine farmers faster",
  "Cuts manual survey workload",
  "Improves disaster response",
  "Makes governance more transparent",
];

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <main className="krishi-site about-page">
      <SiteHeader />
      <FloatingSocials />

      <section className="about-hero">
        <div className="about-hero-content">
          <span className="section-eyebrow">About KrishiNetra</span>
          <h1>Catch crop insurance fraud before it pays out.</h1>
          <p>
            One pipeline that combines farmer-submitted geo-tagged photos, GPS integrity checks,
            and satellite imagery — so government officers can verify claims from a single screen.
          </p>
        </div>
      </section>

      <section className="krishi-section about-pipeline-section">
        <div className="section-heading">
          <span className="section-eyebrow">How it fits together</span>
          <h2>One pipeline, four moving parts</h2>
          <p>Data flows left to right. Each stage adds a verification signal.</p>
        </div>
        <ol className="system-pipeline">
          {pipelineNodes.map(({ Icon, label, role }, i) => (
            <li className="pipeline-node" key={label}>
              <span className="pipeline-node-num">{i + 1}</span>
              <span className="pipeline-icon"><Icon size={26} aria-hidden="true" /></span>
              <strong>{label}</strong>
              <small>{role}</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="krishi-section about-surfaces-section">
        <div className="section-heading">
          <span className="section-eyebrow">Two surfaces, one source of truth</span>
          <h2>Farmer app talks. Government dashboard decides.</h2>
        </div>
        <div className="surface-grid">
          <article className="surface-card surface-farmer">
            <header>
              <span className="surface-icon"><Smartphone size={22} aria-hidden="true" /></span>
              <div>
                <small>For farmers</small>
                <h3>Mobile App</h3>
              </div>
            </header>
            <ul>
              {farmerAppFeatures.map(({ Icon, text }) => (
                <li key={text}><Icon size={16} aria-hidden="true" /><span>{text}</span></li>
              ))}
            </ul>
          </article>
          <article className="surface-card surface-officer">
            <header>
              <span className="surface-icon"><ShieldCheck size={22} aria-hidden="true" /></span>
              <div>
                <small>For officers</small>
                <h3>Government Dashboard</h3>
              </div>
            </header>
            <ul>
              {dashboardFeatures.map(({ Icon, text }) => (
                <li key={text}><Icon size={16} aria-hidden="true" /><span>{text}</span></li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="krishi-section about-flow-section">
        <div className="section-heading">
          <span className="section-eyebrow">The verification flow</span>
          <h2>Every claim runs through eight checks</h2>
          <p>No automatic rejection — suspicious claims are surfaced to officers with the reason.</p>
        </div>
        <ol className="verification-pipeline">
          {verificationSteps.map((step, i) => (
            <li className="verification-pipeline-step" key={step}>
              <span className="verification-pipeline-num">{i + 1}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className="krishi-section about-satellite-section">
        <div className="section-heading">
          <span className="section-eyebrow">Satellite verification</span>
          <h2>Sentinel-2 sees what's growing. Sentinel-1 sees through clouds.</h2>
          <p>NDVI comes from Sentinel-2 optical imagery. Sentinel-1 SAR is the radar fallback.</p>
        </div>
        <div className="satellite-grid">
          <article className="satellite-card satellite-optical">
            <div className="satellite-visual ndvi-visual"><Satellite size={28} aria-hidden="true" /></div>
            <div className="satellite-card-body">
              <small>Optical / Multispectral</small>
              <h3>Sentinel-2</h3>
              <p>Captures reflected sunlight in spectral bands to measure crop greenness and vegetation health.</p>
              <div className="formula-card">
                <strong>NDVI = (NIR − Red) / (NIR + Red)</strong>
                <small>Sentinel-2 maps to bands B8 (NIR) and B4 (Red)</small>
              </div>
              <div className="threshold-row">
                <span className="threshold-chip low">&lt; 0.2 &nbsp;Bare soil</span>
                <span className="threshold-chip mid">0.2 – 0.5 &nbsp;Medium</span>
                <span className="threshold-chip high">&gt; 0.5 &nbsp;Healthy</span>
              </div>
              <p className="callout-example">
                <Cloud size={14} aria-hidden="true" />
                Healthy sugarcane claim + NDVI 0.12 + low cloud cover → flagged High Risk.
              </p>
            </div>
          </article>

          <article className="satellite-card satellite-sar">
            <div className="satellite-visual sar-visual"><Radar size={28} aria-hidden="true" /></div>
            <div className="satellite-card-body">
              <small>Synthetic Aperture Radar</small>
              <h3>Sentinel-1</h3>
              <p>Sends radar signals and reads the return — works through clouds, rain, and at night.</p>
              <ul className="sar-points">
                <li>Used when Sentinel-2 imagery is cloudy</li>
                <li>No NDVI (different physics — no color)</li>
                <li>Detects moisture, flooding, field structure</li>
              </ul>
              <p className="callout-example">
                <CloudRain size={14} aria-hidden="true" />
                Heavy cloud cover → switch to SAR fallback automatically.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="krishi-section about-gps-section">
        <div className="section-heading">
          <span className="section-eyebrow">GPS integrity</span>
          <h2>We don't blindly trust the device.</h2>
          <p>Every submitted location passes through six integrity checks before the claim is trusted.</p>
        </div>
        <div className="trust-status-row">
          <span className="trust-chip valid"><CheckCircle2 size={14} />Valid</span>
          <span className="trust-chip suspicious"><Gauge size={14} />Suspicious</span>
          <span className="trust-chip spoofing"><Lock size={14} />Spoofing Suspected</span>
          <span className="trust-chip unknown"><MapPin size={14} />Unknown</span>
        </div>
        <div className="gps-check-grid">
          {gpsChecks.map(([title, body], i) => (
            <article className="gps-check-card" key={title}>
              <span className="gps-check-num">{String(i + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="krishi-section about-impact-section">
        <div className="section-heading">
          <span className="section-eyebrow">Why it matters</span>
          <h2>What KrishiNetra unlocks</h2>
        </div>
        <div className="impact-grid">
          {impactPoints.map((point) => (
            <article className="impact-card" key={point}>
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>{point}</span>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
