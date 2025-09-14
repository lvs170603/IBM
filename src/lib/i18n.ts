
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ["en", "de", "es", "fr", "it", "ja"],
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
      // Disable saving missing keys, which causes server restarts in dev mode
      saveMissing: false,
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
