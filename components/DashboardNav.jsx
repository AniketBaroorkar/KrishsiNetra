"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, BarChart3, CloudRain, Home, LayoutDashboard, Map, ShieldCheck } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/map", label: "Live Map", icon: Map },
  { href: "/dashboard/fraud", label: "Fraud Alerts", icon: AlertTriangle },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/disaster", label: "Disaster Impact", icon: CloudRain },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <header className="top-nav">
      <Link className="brand" href="/dashboard">
        <span className="brand-mark">
          <ShieldCheck size={19} aria-hidden="true" />
        </span>
        <span>KrishiNetra Command</span>
      </Link>
      <nav className="nav-links" aria-label="Dashboard navigation">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            className={`nav-link ${pathname === href ? "active" : ""}`}
            href={href}
            key={href}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
