"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLanguage } from "./LanguageProvider";

const links = [
  { href: "/dashboard", labelKey: "dashboard" },
  { href: "/dashboard/farmers", labelKey: "farmerData" },
  { href: "/dashboard/claims", labelKey: "claims" },
  { href: "/dashboard/analytics", labelKey: "analytics" },
  { href: "/dashboard/satellite", labelKey: "satelliteVerification" },
  { href: "/dashboard/location-check", labelKey: "locationCheck" },
  { href: "/dashboard/disaster", labelKey: "disasterImpact" },
  { href: "/dashboard/fraud", labelKey: "fraudAlerts" },
  { href: "/dashboard/map", labelKey: "liveMap" },
];

function isActive(pathname, href) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function DashboardSubNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <div className="dashboard-subnav-wrap">
      <nav className="dashboard-subnav" aria-label="Dashboard sections">
        {links.map(({ href, labelKey }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              href={href}
              key={href}
              aria-current={active ? "page" : undefined}
            >
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
