"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { languages, translations } from "../utils/i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("krishinetra-language");
    if (stored && translations[stored]) {
      setLanguage(stored);
    }
  }, []);

  function updateLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    window.localStorage.setItem("krishinetra-language", nextLanguage);
  }

  const value = useMemo(() => {
    const dictionary = translations[language] || translations.en;
    return {
      language,
      languages,
      setLanguage: updateLanguage,
      t(key) {
        return dictionary[key] || translations.en[key] || key;
      },
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: "en",
      languages,
      setLanguage() {},
      t(key) {
        return translations.en[key] || key;
      },
    };
  }
  return context;
}

export function LanguageSelector({ className = "" }) {
  const { language, languages: options, setLanguage, t } = useLanguage();

  return (
    <label className={`language-selector ${className}`}>
      <span>{t("language")}</span>
      <select value={language} onChange={(event) => setLanguage(event.target.value)}>
        {options.map((option) => (
          <option value={option.code} key={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
