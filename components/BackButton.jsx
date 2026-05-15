"use client";

import { useRouter } from "next/navigation";

import { useLanguage } from "./LanguageProvider";

export default function BackButton({ label, fallbackPath = "/dashboard", className = "" }) {
  const router = useRouter();
  const { t } = useLanguage();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackPath);
  }

  return (
    <button className={`back-button ${className}`} type="button" onClick={handleBack}>
      <span aria-hidden="true">&larr;</span>
      {label || t("back")}
    </button>
  );
}
