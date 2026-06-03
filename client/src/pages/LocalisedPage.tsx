/**
 * LocalisedPage — wraps English pages with locale context.
 * For pages where content is mostly static UI strings (not DB-driven),
 * this renders the English page but with:
 * - Correct html lang attribute
 * - hreflang tags for all locales
 * - Language switcher aware of current locale
 * - Translated UI strings via useTranslation hook
 *
 * Used for: /:locale/ (homepage), /:locale/tags, /:locale/tag/:slug,
 * /:locale/on-this-day, /:locale/videos, /:locale/newsletter, etc.
 */
import { useParams } from "wouter";
import { isValidLocale } from "@shared/i18n";
import HreflangTags from "@/components/HreflangTags";
import NotFound from "./NotFound";

// Re-export pages with locale context
export { default as LocalisedHome } from "./Home";
export { default as LocalisedNewsArchive } from "./NewsArchivePage";
export { default as LocalisedOnThisDay } from "./OnThisDayPage";
export { default as LocalisedTagsIndex } from "./TagsIndexPage";
export { default as LocalisedVideos } from "./VideoPage";
export { default as LocalisedNewsletter } from "./NewsletterPage";

/**
 * Locale guard — renders NotFound if locale is not supported.
 * Wrap page components with this when adding /:locale/* routes.
 */
export function withLocaleGuard<T extends object>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return function LocaleGuarded(props: T) {
    const { locale } = useParams<{ locale: string }>();
    if (!locale || !isValidLocale(locale)) return <NotFound />;
    return <Component {...props} />;
  };
}
