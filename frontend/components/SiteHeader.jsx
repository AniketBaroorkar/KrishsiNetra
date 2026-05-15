"use client";

import Link from "next/link";
import { Mail, Phone, Sprout } from "lucide-react";

import { LanguageSelector, useLanguage } from "./LanguageProvider";
import { siteContact } from "../data/site";

export default function SiteHeader() {
  const { t } = useLanguage();
  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/about", label: t("aboutUs") },
    { href: "/#features", label: t("features") },
    { href: "/dashboard", label: t("dashboard") },
    { href: "/disaster-alerts", label: t("disasterAlerts") },
    { href: "/#contact", label: t("contact") },
  ];

  return (
    <header className="krishi-header">
      <div className="krishi-header-top">
        <Link className="krishi-brand-lockup" href="/">
          <span className="krishi-logo-mark"><Sprout size={24} aria-hidden="true" /></span>
          <span>
            <strong>{t("appName")}</strong>
          </span>
        </Link>
        <div className="krishi-contact-strip" aria-label="Contact details">
          <LanguageSelector />
          <a href={`mailto:${siteContact.email}`}><Mail size={16} aria-hidden="true" />{siteContact.email}</a>
          <a href={siteContact.tel}><Phone size={16} aria-hidden="true" />{siteContact.phone}</a>
        </div>
      </div>
      <nav className="krishi-nav-bar" aria-label="Main navigation">
        {navLinks.map((link) => <Link href={link.href} key={link.label}>{link.label}</Link>)}
      </nav>
    </header>
  );
}
