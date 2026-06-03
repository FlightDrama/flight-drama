// Supported locales for Flight Drama international translation system
export const SUPPORTED_LOCALES = ['de', 'es', 'fr', 'pt', 'ar'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export const LOCALE_CONFIG: Record<SupportedLocale, {
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  hreflang: string;
}> = {
  de: { name: 'German',     nativeName: 'Deutsch',    flag: '🇩🇪', dir: 'ltr', hreflang: 'de' },
  es: { name: 'Spanish',    nativeName: 'Español',    flag: '🇪🇸', dir: 'ltr', hreflang: 'es' },
  fr: { name: 'French',     nativeName: 'Français',   flag: '🇫🇷', dir: 'ltr', hreflang: 'fr' },
  pt: { name: 'Portuguese', nativeName: 'Português',  flag: '🇧🇷', dir: 'ltr', hreflang: 'pt' },
  ar: { name: 'Arabic',     nativeName: 'العربية',    flag: '🇦🇪', dir: 'rtl', hreflang: 'ar' },
};

export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}
