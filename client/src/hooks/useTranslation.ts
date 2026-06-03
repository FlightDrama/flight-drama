import { useMemo } from "react";
import { useLocation } from "wouter";
import { getStrings } from "@shared/i18n/strings";
import { isValidLocale } from "@shared/i18n";

/**
 * Returns UI strings for the current locale based on the URL path.
 * /de/... → German strings
 * /es/... → Spanish strings
 * /... → English strings (default)
 */
export function useTranslation() {
  const [location] = useLocation();

  const locale = useMemo(() => {
    const match = location.match(/^\/([a-z]{2})(\/|$)/);
    if (match && isValidLocale(match[1])) return match[1];
    return "en";
  }, [location]);

  const t = useMemo(() => getStrings(locale), [locale]);

  return { t, locale, isLocale: locale !== "en" };
}

/**
 * Get the locale from a URL path string (for server-side or non-hook use)
 */
export function getLocaleFromPath(path: string): string {
  const match = path.match(/^\/([a-z]{2})(\/|$)/);
  if (match && isValidLocale(match[1])) return match[1];
  return "en";
}

/**
 * Convert a path to a localised version
 * e.g. localise("/news", "de") → "/de/news"
 * e.g. localise("/de/news", "es") → "/es/news"
 */
export function localise(path: string, locale: string): string {
  if (locale === "en") {
    // Strip any existing locale prefix
    return path.replace(/^\/[a-z]{2}(\/|$)/, "/");
  }
  // Remove existing locale prefix if present
  const stripped = path.replace(/^\/[a-z]{2}(\/|$)/, "/");
  return `/${locale}${stripped === "/" ? "" : stripped}`;
}
