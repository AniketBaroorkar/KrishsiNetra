"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Bell, BriefcaseBusiness, Camera, Mail, MessageCircle, Phone, Satellite, Sprout, Users } from "lucide-react";

import { LanguageSelector, useLanguage } from "../components/LanguageProvider";

const contact = {
  email: "info@krishinetra.ai",
  phone: "9579207219",
  linkedin: "https://www.linkedin.com/",
  instagram: "https://www.instagram.com/",
  whatsapp: "https://wa.me/919579207219",
  tel: "tel:+919579207219",
};

const heroImage = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=80";

export default function HomePage() {
  const { t } = useLanguage();
  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/about", label: t("aboutUs") },
    { href: "/#features", label: t("features") },
    { href: "/farmers", label: t("farmerData") },
    { href: "/dashboard", label: t("dashboard") },
    { href: "/disaster-alerts", label: t("disasterAlerts") },
    { href: "/#contact", label: t("contact") },
  ];

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
      <header className="krishi-header">
        <div className="krishi-header-top">
          <Link className="krishi-brand-lockup" href="/">
            <span className="krishi-logo-mark"><Sprout size={24} aria-hidden="true" /></span>
            <span>
              <strong>{t("appName")}</strong>
              <small>{t("subtitle")}</small>
            </span>
          </Link>
          <div className="krishi-contact-strip" aria-label="Contact details">
            <LanguageSelector />
            <a href={`mailto:${contact.email}`}><Mail size={16} aria-hidden="true" />{contact.email}</a>
            <a href={contact.tel}><Phone size={16} aria-hidden="true" />{contact.phone}</a>
          </div>
        </div>
        <nav className="krishi-nav-bar" aria-label="Main navigation">
          {navLinks.map((link) => <Link href={link.href} key={link.label}>{link.label}</Link>)}
        </nav>
      </header>

      <div className="floating-socials" aria-label="Social and contact links">
        {[
          { label: "LinkedIn", href: contact.linkedin, icon: BriefcaseBusiness },
          { label: "Instagram", href: contact.instagram, icon: Camera },
          { label: "WhatsApp", href: contact.whatsapp, icon: MessageCircle },
          { label: "Phone", href: contact.tel, icon: Phone },
        ].map(({ label, href, icon: Icon }) => (
          <a href={href} key={label} aria-label={label} title={label}><Icon size={19} aria-hidden="true" /></a>
        ))}
      </div>

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

      <section className="krishi-section contact-section" id="contact">
        <div className="contact-details">
          <span className="section-eyebrow">{t("contact")}</span>
          <h2>{t("contactSupport")}</h2>
          <p>{t("contactSubtitle")}</p>
          <a href={`mailto:${contact.email}`}><Mail size={17} />{contact.email}</a>
          <a href={contact.tel}><Phone size={17} />{contact.phone}</a>
          <a href={contact.whatsapp}><MessageCircle size={17} />WhatsApp</a>
        </div>
        <form className="contact-form">
          <label>{t("fullName")}<input placeholder={t("farmerName")} /></label>
          <label>{t("phoneNumber")}<input placeholder="9579207219" /></label>
          <label>{t("district")}<input placeholder="Pune" /></label>
          <label>{t("requestType")}<select defaultValue="Dashboard demo"><option>{t("dashboard")}</option><option>{t("farmerData")}</option><option>{t("disasterAlerts")}</option></select></label>
          <label className="wide">{t("message")}<textarea placeholder={t("messageBody")} /></label>
          <button className="krishi-cta primary" type="button">{t("submit")}</button>
        </form>
      </section>

      <footer className="krishi-footer">KrishiNetra | {t("contact")}: 9579207219 | info@krishinetra.ai</footer>
    </main>
  );
}
