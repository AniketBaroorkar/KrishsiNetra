"use client";

import { useLanguage } from "./LanguageProvider";
import { siteContact } from "../data/site";

export default function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="krishi-footer">
      KrishiNetra | {t("contact")}: {siteContact.phone} | {siteContact.email}
    </footer>
  );
}
