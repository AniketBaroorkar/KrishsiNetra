"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sprout } from "lucide-react";

import { LanguageSelector, useLanguage } from "./LanguageProvider";

function isActive(pathname, href) {
  if (href.includes("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function SiteHeader() {
  const { t } = useLanguage();
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/about", label: t("aboutUs") },
    { href: "/dashboard", label: t("dashboard") },
    { href: "/disaster-alerts", label: t("disasterAlerts") },
    { href: "/#contact", label: t("contact") },
  ];

  return (
    <header className="krishi-header">
      <div className="krishi-header-row">
        <Link className="krishi-brand-lockup" href="/">
          <span className="krishi-logo-mark"><Sprout size={22} aria-hidden="true" /></span>
          <strong>{t("appName")}</strong>
        </Link>

        <nav className="krishi-nav-bar" aria-label="Main navigation">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                href={link.href}
                key={link.label}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="krishi-header-aux">
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
}
