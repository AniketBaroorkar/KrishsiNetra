"use client";

import Link from "next/link";
import { Bell, Camera, Satellite, ShieldCheck, Sprout } from "lucide-react";

import { useLanguage } from "../../components/LanguageProvider";

export default function AboutPage() {
  const { t } = useLanguage();
  return (
    <main className="krishi-site">
      <section className="about-page-hero">
        <Link className="krishi-brand-lockup" href="/">
          <span className="krishi-logo-mark"><Sprout size={24} aria-hidden="true" /></span>
          <span><strong>{t("appName")}</strong><small>{t("subtitle")}</small></span>
        </Link>
        <h1>{t("aboutUs")}</h1>
        <p>{t("heroSubheading")}</p>
      </section>

      <section className="krishi-section about-story-grid">
        {[
          {
            icon: ShieldCheck,
            title: t("fraudAlerts"),
            text: t("fraudSubtitle"),
          },
          {
            icon: Camera,
            title: t("geoTaggedPhoto"),
            text: t("farmerDataSubtitle"),
          },
          {
            icon: Satellite,
            title: t("satelliteResult"),
            text: t("dashboardSubtitle"),
          },
          {
            icon: Bell,
            title: t("disasterAlerts"),
            text: t("disasterSubtitle"),
          },
        ].map(({ icon: Icon, title, text }) => (
          <article className="premium-feature-card" key={title}>
            <span><Icon size={24} aria-hidden="true" /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
