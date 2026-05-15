"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CloudRain,
  ClipboardList,
  Home,
  LayoutDashboard,
  LocateFixed,
  Map,
  Satellite,
  ShieldCheck,
} from "lucide-react";

import { useLanguage } from "./LanguageProvider";

const links = [
  { href: "/", labelKey: "home", icon: Home },
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/dashboard/farmers", labelKey: "farmerData", icon: ClipboardList },
  { href: "/dashboard/claims", labelKey: "claims", icon: ClipboardList },
  { href: "/dashboard/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/dashboard/satellite", labelKey: "satelliteVerification", icon: Satellite },
  { href: "/dashboard/location-check", labelKey: "locationCheck", icon: LocateFixed },
  { href: "/dashboard/disaster", labelKey: "disasterImpact", icon: CloudRain },
  { href: "/dashboard/fraud", labelKey: "fraudAlerts", icon: AlertTriangle },
  { href: "/dashboard/map", labelKey: "liveMap", icon: Map },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside className="gov-sidebar">
      <Link className="gov-sidebar-brand" href="/dashboard">
        <span className="brand-mark">
          <ShieldCheck size={22} aria-hidden="true" />
        </span>
        <span>
          <strong>KrishiNetra</strong>
          <small>{t("subtitle")}</small>
        </span>
      </Link>
      <nav className="gov-sidebar-links" aria-label="Dashboard navigation">
        {links.map(({ href, labelKey, icon: Icon }) => (
          <Link
            className={`gov-sidebar-link ${pathname === href ? "active" : ""}`}
            href={href}
            key={href}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{t(labelKey)}</span>
          </Link>
        ))}
      </nav>
      <div className="gov-sidebar-footer">
        <span>{t("operationalRegion")}</span>
        <strong>{t("maharashtraPilot")}</strong>
        <small>{t("contact")}: 9579207219</small>
      </div>
    </aside>
  );
}
