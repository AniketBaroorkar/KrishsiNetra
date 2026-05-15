"use client";

import Link from "next/link";
import { Bell, Camera, Satellite, ShieldCheck, Sprout } from "lucide-react";

import BackButton from "../../components/BackButton";
import { useLanguage } from "../../components/LanguageProvider";

export default function AboutPage() {
  const { t } = useLanguage();
  return (
    <main className="krishi-site about-platform-page">
      <section className="gov-page about-gov-page">
        <Link className="krishi-brand-lockup" href="/">
          <span className="krishi-logo-mark"><Sprout size={24} aria-hidden="true" /></span>
          <span><strong>{t("appName")}</strong></span>
        </Link>
        <BackButton fallbackPath="/dashboard" />

        <div className="gov-page-header about-gov-header">
          <div>
            <span className="gov-kicker">{t("aboutUs")}</span>
            <h1>{t("aboutUs")}</h1>
            <p>{t("heroSubheading")}</p>
          </div>
          <span className="api-notice">{t("contact")}: 9579207219</span>
        </div>

        <div className="analytics-summary-grid about-story-grid">
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
            <article className="gov-card about-info-card" key={title}>
              <span className="gov-stat-icon"><Icon size={22} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <section className="gov-card integrity-explainer-section">
          <div className="friendly-card-heading about-section-heading">
            <span className="gov-kicker">Location Risk Analysis</span>
            <h2>How KrishiNetra Detects Location Fraud and Verifies Crop Claims</h2>
            <p>
              KrishiNetra does not depend only on GPS location. Since GPS spoofing or mock location apps can create
              false location data, the system uses a Location Integrity Check. This check analyses GPS accuracy,
              GPS timestamp, mock-location signals, photo capture type, and satellite verification before deciding
              the risk level of a claim.
            </p>
          </div>

          <div className="integrity-explainer-grid">
            {[
              {
                title: "GPS Location Check",
                text: "The mobile app captures latitude, longitude, GPS accuracy, timestamp, and device location signals when a farmer submits a crop photo. Missing, inaccurate, old, or suspicious GPS data is marked for review.",
              },
              {
                title: "Mock Location / GPS Spoofing Detection",
                text: "If the device indicates mock location usage, the claim is marked as Spoofing Suspected. It is not automatically rejected; it becomes High Risk for government officer review.",
              },
              {
                title: "Live Photo Verification",
                text: "KrishiNetra prefers live camera capture. If a photo is uploaded from gallery, the system adds a warning because old photos can be reused.",
              },
              {
                title: "Sentinel-2 Optical Verification",
                text: "Sentinel-2 optical imagery helps calculate NDVI using Near Infrared and Red bands. High NDVI usually indicates healthy vegetation; very low NDVI can make an active crop claim suspicious.",
              },
              {
                title: "Cloud Handling with Sentinel-1 SAR",
                text: "Sentinel-2 is affected by clouds. When clouds block optical imagery, Sentinel-1 SAR radar is used as fallback. SAR works through clouds and at night, supporting field condition, moisture, flood impact, and crop structure checks. Sentinel-1 does not calculate NDVI.",
              },
              {
                title: "Final Risk Score",
                text: "The final Low, Medium, or High Risk score combines farmer photo, GPS data, accuracy, mock location detection, photo capture type, Sentinel-2 NDVI, Sentinel-1 SAR fallback, crop claim details, and farmer history.",
              },
            ].map((item) => (
              <article className="integrity-explainer-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>

          <div className="integrity-example-card">
            <strong>Example</strong>
            <p>
              If a farmer claims a healthy sugarcane crop, but GPS is suspicious and Sentinel-2 NDVI shows very low
              vegetation, the system marks the claim as High Risk. If Sentinel-2 is cloudy, Sentinel-1 SAR is used
              to check field condition before making the final decision.
            </p>
          </div>

          <div className="verification-flow">
            {[
              "Farmer submits geo-tagged photo",
              "App captures GPS + accuracy + timestamp",
              "Location Integrity Check",
              "Sentinel-2 NDVI verification",
              "If cloudy, Sentinel-1 SAR fallback",
              "Final fraud risk score",
              "Government officer review",
            ].map((step, index) => (
              <div className="verification-flow-step" key={step}>
                <span>{index + 1}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
