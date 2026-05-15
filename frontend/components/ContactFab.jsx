"use client";

import { useEffect, useState } from "react";
import { Mail, MessageCircle, Phone, X } from "lucide-react";

import { useLanguage } from "./LanguageProvider";
import { siteContact } from "../data/site";

export default function ContactFab() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="contact-fab"
        aria-label="Open contact form"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <MessageCircle size={28} aria-hidden="true" />
      </button>

      {open ? (
        <div
          className="contact-popup-backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <section
            className="contact-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-popup-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="contact-popup-header">
              <div>
                <span className="gov-kicker">{t("contact")}</span>
                <h3 id="contact-popup-title">{t("contactSupport")}</h3>
                <p>{t("contactSubtitle")}</p>
              </div>
              <button
                type="button"
                className="contact-popup-close"
                aria-label="Close contact form"
                onClick={() => setOpen(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="contact-popup-channels">
              <a href={`mailto:${siteContact.email}`}>
                <Mail size={15} aria-hidden="true" />
                {siteContact.email}
              </a>
              <a href={siteContact.tel}>
                <Phone size={15} aria-hidden="true" />
                {siteContact.phone}
              </a>
              <a href={siteContact.whatsapp}>
                <MessageCircle size={15} aria-hidden="true" />
                WhatsApp
              </a>
            </div>

            <form
              className="contact-form contact-popup-form"
              onSubmit={(event) => {
                event.preventDefault();
                setOpen(false);
              }}
            >
              <label>
                {t("fullName")}
                <input placeholder={t("farmerName")} />
              </label>
              <label>
                {t("phoneNumber")}
                <input placeholder="9579207219" />
              </label>
              <label>
                {t("district")}
                <input placeholder="Pune" />
              </label>
              <label>
                {t("requestType")}
                <select defaultValue="Dashboard">
                  <option>{t("dashboard")}</option>
                  <option>{t("farmerData")}</option>
                  <option>{t("disasterAlerts")}</option>
                </select>
              </label>
              <label className="wide">
                {t("message")}
                <textarea placeholder={t("messageBody")} />
              </label>
              <button className="krishi-cta primary" type="submit">
                {t("submit")}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
