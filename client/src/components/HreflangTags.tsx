import { useEffect } from "react";
import { useLocation } from "wouter";
import { LOCALE_CONFIG, SUPPORTED_LOCALES } from "@shared/i18n";
import { localise } from "@/hooks/useTranslation";

const SITE_URL = "https://flightdrama.com";

interface Props {
  /** Override the canonical path (default: current location) */
  canonicalPath?: string;
  /** Page title for JSON-LD WebPage schema */
  pageTitle?: string;
  /** Page description for JSON-LD WebPage schema */
  pageDescription?: string;
}

/**
 * Injects hreflang link tags and JSON-LD WebPage schema into <head>.
 * Place this in every page component.
 *
 * Google requirements:
 * - hreflang="en" for English
 * - hreflang="de" / "es" / "fr" / "pt" / "ar" for each translation
 * - hreflang="x-default" pointing to English (canonical)
 * - <html lang="..."> attribute
 */
export default function HreflangTags({ canonicalPath, pageTitle, pageDescription }: Props) {
  const [location] = useLocation();
  const path = canonicalPath ?? location;

  useEffect(() => {
    // Determine current locale from path
    const localeMatch = path.match(/^\/([a-z]{2})(\/|$)/);
    const currentLocale = localeMatch ? localeMatch[1] : "en";

    // Set html lang attribute
    document.documentElement.lang = currentLocale;
    if (LOCALE_CONFIG[currentLocale as keyof typeof LOCALE_CONFIG]?.dir === "rtl") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }

    // Remove existing hreflang tags
    document.querySelectorAll("link[hreflang]").forEach(el => el.remove());
    document.getElementById("webpage-jsonld")?.remove();

    // English canonical (x-default)
    const enPath = localise(path, "en");
    const enUrl = `${SITE_URL}${enPath || "/"}`;

    const addLink = (lang: string, href: string) => {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.setAttribute("hreflang", lang);
      link.href = href;
      document.head.appendChild(link);
    };

    // x-default → English
    addLink("x-default", enUrl);
    // English
    addLink("en", enUrl);
    // All supported locales
    SUPPORTED_LOCALES.forEach(locale => {
      const localePath = localise(path, locale);
      addLink(LOCALE_CONFIG[locale].hreflang, `${SITE_URL}${localePath}`);
    });

    // Set canonical
    let canonicalEl = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.rel = "canonical";
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = `${SITE_URL}${path || "/"}`;

    // JSON-LD WebPage schema
    if (pageTitle) {
      const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "url": `${SITE_URL}${path || "/"}`,
        "name": pageTitle,
        "inLanguage": currentLocale,
        "isPartOf": {
          "@type": "WebSite",
          "name": "Flight Drama",
          "url": SITE_URL,
        },
      };
      if (pageDescription) schema.description = pageDescription;

      // Add translations as sameAs
      const translations = SUPPORTED_LOCALES.map(locale => ({
        "@type": "WebPage",
        "url": `${SITE_URL}${localise(path, locale)}`,
        "inLanguage": LOCALE_CONFIG[locale].hreflang,
      }));
      if (translations.length > 0) schema.translationOfWork = translations;

      const script = document.createElement("script");
      script.id = "webpage-jsonld";
      script.type = "application/ld+json";
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => {
      document.querySelectorAll("link[hreflang]").forEach(el => el.remove());
      document.getElementById("webpage-jsonld")?.remove();
      document.documentElement.lang = "en";
      document.documentElement.dir = "ltr";
    };
  }, [path, pageTitle, pageDescription]);

  return null;
}
// i18n system checkpoint Wed Jun  3 22:51:45 UTC 2026
