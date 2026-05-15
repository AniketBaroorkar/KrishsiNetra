"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CloudRain,
  ClipboardList,
  Home,
  LayoutDashboard,
  LocateFixed,
  Map,
  Menu,
  Satellite,
  ShieldCheck,
  X,
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
  { href: "/about", labelKey: "aboutUs", icon: ShieldCheck },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        className="dashboard-menu-toggle"
        type="button"
        aria-label={isOpen ? "Close dashboard navigation" : "Open dashboard navigation"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        <span>Menu</span>
      </button>
      <button
        className={`dashboard-menu-backdrop ${isOpen ? "open" : ""}`}
        type="button"
        aria-label="Close dashboard navigation"
        onClick={closeMenu}
      />
      <aside className={`gov-sidebar ${isOpen ? "open" : ""}`}>
        <Link className="gov-sidebar-brand" href="/dashboard" onClick={closeMenu}>
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
              onClick={closeMenu}
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
    </>
  );
}
