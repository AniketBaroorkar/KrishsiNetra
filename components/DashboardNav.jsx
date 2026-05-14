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
  Map,
  ShieldCheck,
} from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/farmers", label: "Farmer Data", icon: ClipboardList },
  { href: "/dashboard/claims", label: "Claims", icon: ClipboardList },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/disaster", label: "Disaster Impact", icon: CloudRain },
  { href: "/dashboard/fraud", label: "Fraud Alerts", icon: AlertTriangle },
  { href: "/dashboard/map", label: "Live Map", icon: Map },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="gov-sidebar">
      <Link className="gov-sidebar-brand" href="/dashboard">
        <span className="brand-mark">
          <ShieldCheck size={22} aria-hidden="true" />
        </span>
        <span>
          <strong>KrishiNetra</strong>
          <small>Agriculture Monitoring</small>
        </span>
      </Link>
      <nav className="gov-sidebar-links" aria-label="Dashboard navigation">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            className={`gov-sidebar-link ${pathname === href ? "active" : ""}`}
            href={href}
            key={href}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="gov-sidebar-footer">
        <span>Operational Region</span>
        <strong>Maharashtra Pilot</strong>
        <small>Contact: 9579207219</small>
      </div>
    </aside>
  );
}
