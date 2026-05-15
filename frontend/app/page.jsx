"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Bell, Satellite, Sprout, Users } from "lucide-react";

import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import FloatingSocials from "../components/FloatingSocials";
import { useLanguage } from "../components/LanguageProvider";

const heroImage = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=80";

export default function HomePage() {
  const { t } = useLanguage();

  const features = [
    t("geoTaggedPhoto"),
    t("aiPredictedCrop"),
    t("satelliteResult"),
    t("riskScore"),
    t("districtSummary"),
    t("alertsSent"),
  ];

  return (
    <main className="krishi-site" id="home">
      <SiteHeader />
      <FloatingSocials />

      <section className="krishi-hero single-hero" style={{ backgroundImage: `url("${heroImage}")` }}>
        <div className="hero-green-overlay" />
        <div className="krishi-hero-content">
          <span className="hero-kicker"><Satellite size={18} aria-hidden="true" />{t("subtitle")}</span>
          <h1>{t("heroHeading")}</h1>
          <p>{t("heroSubheading")}</p>
          <div className="hero-cta-row">
            <Link className="krishi-cta primary" href="/dashboard">{t("viewDashboard")}<ArrowRight size={18} /></Link>
            <Link className="krishi-cta secondary" href="/farmers">{t("viewFarmerRecords")}<Users size={18} /></Link>
            <Link className="krishi-cta secondary" href="/disaster-alerts">{t("sendDisasterAlert")}<Bell size={18} /></Link>
          </div>
        </div>
        <svg className="hero-wave" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,100 C360,10 1080,10 1440,100 L1440,100 L0,100 Z" fill="#f6fbf3" />
        </svg>
      </section>

      <section className="krishi-section about-band" id="about">
        <div className="section-copy">
          <span className="section-eyebrow">{t("aboutUs")}</span>
          <h2>{t("heroHeading")}</h2>
          <p>{t("heroSubheading")}</p>
        </div>
        <div className="about-proof-card">
          <BarChart3 size={30} aria-hidden="true" />
          <strong>{t("dashboardTitle")}</strong>
          <span>{t("dashboardSubtitle")}</span>
        </div>
      </section>

      <section className="krishi-section" id="features">
        <div className="section-heading">
          <span className="section-eyebrow">{t("features")}</span>
          <h2>{t("subtitle")}</h2>
        </div>
        <div className="premium-feature-grid">
          {features.map((feature) => (
            <article className="premium-feature-card" key={feature}>
              <span><Sprout size={24} aria-hidden="true" /></span>
              <h3>{feature}</h3>
              <p>{t("dashboardSubtitle")}</p>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
