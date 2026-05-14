import Link from "next/link";
import { Bell, Camera, Satellite, ShieldCheck, Sprout } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="krishi-site">
      <section className="about-page-hero">
        <Link className="krishi-brand-lockup" href="/">
          <span className="krishi-logo-mark"><Sprout size={24} aria-hidden="true" /></span>
          <span><strong>KrishiNetra</strong><small>AI & Satellite-Based Agricultural Fraud Detection System</small></span>
        </Link>
        <h1>About KrishiNetra</h1>
        <p>
          KrishiNetra is an AI and satellite-based agricultural fraud detection and farmer support
          system for government officers, administrators, and agriculture departments.
        </p>
      </section>

      <section className="krishi-section about-story-grid">
        {[
          {
            icon: ShieldCheck,
            title: "Why fraud detection matters",
            text: "False crop insurance claims can delay genuine farmer support and misuse public funds. KrishiNetra gives officers evidence-backed verification.",
          },
          {
            icon: Camera,
            title: "Geo-tagged field photos",
            text: "Farmers submit crop photos with GPS coordinates from the mobile app, giving officers real field evidence instead of only paper records.",
          },
          {
            icon: Satellite,
            title: "Satellite crop monitoring",
            text: "Satellite imagery and NDVI-style crop-health checks help validate whether the submitted farm area shows expected vegetation patterns.",
          },
          {
            icon: Bell,
            title: "Disaster impact alerts",
            text: "Before or after heavy rain, flood, drought, pest attack, crop disease, heat wave, or unseasonal rain, officers can send app alerts to farmers.",
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
