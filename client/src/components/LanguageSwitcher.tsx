import { Link, useLocation } from "wouter";
import { LOCALE_CONFIG, SUPPORTED_LOCALES } from "@shared/i18n";
import { localise, useTranslation } from "@/hooks/useTranslation";
import { Globe, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Props {
  /** Compact mode for nav bar (icon + chevron only) */
  compact?: boolean;
}

export default function LanguageSwitcher({ compact = false }: Props) {
  const [location] = useLocation();
  const { locale, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentConfig = locale !== "en" ? LOCALE_CONFIG[locale as keyof typeof LOCALE_CONFIG] : null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm transition-colors hover:bg-[oklch(0.18_0_0)]"
        style={{ color: "oklch(0.55 0 0)" }}
        title={t.nav.language}
        aria-label={t.nav.language}
        aria-expanded={open}
      >
        {currentConfig ? (
          <span className="text-base leading-none">{currentConfig.flag}</span>
        ) : (
          <Globe className="w-4 h-4" />
        )}
        {!compact && (
          <span className="hidden lg:block text-xs font-bold">
            {currentConfig ? currentConfig.nativeName : "EN"}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-lg border overflow-hidden shadow-xl z-50 min-w-[180px]"
          style={{ backgroundColor: "oklch(0.15 0 0)", borderColor: "oklch(0.25 0 0)" }}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: "oklch(0.22 0 0)" }}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[oklch(0.40_0_0)]">
              {t.nav.readIn}
            </p>
          </div>

          {/* English */}
          <Link
            href={localise(location, "en")}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-[oklch(0.20_0_0)]"
            style={{ color: locale === "en" ? "oklch(0.85 0.18 95)" : "oklch(0.65 0 0)" }}
          >
            <span className="text-base">🇬🇧</span>
            <span className="flex-1">English</span>
            {locale === "en" && <span className="text-[10px] font-black text-[oklch(0.85_0.18_95)]">✓</span>}
          </Link>

          <div className="h-px mx-3" style={{ backgroundColor: "oklch(0.22 0 0)" }} />

          {/* All supported locales */}
          {SUPPORTED_LOCALES.map(loc => {
            const cfg = LOCALE_CONFIG[loc];
            const isActive = locale === loc;
            return (
              <Link
                key={loc}
                href={localise(location, loc)}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-[oklch(0.20_0_0)]"
                style={{ color: isActive ? "oklch(0.85 0.18 95)" : "oklch(0.65 0 0)" }}
                dir={cfg.dir}
              >
                <span className="text-base">{cfg.flag}</span>
                <span className="flex-1">{cfg.nativeName}</span>
                {isActive && <span className="text-[10px] font-black text-[oklch(0.85_0.18_95)]">✓</span>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
// force publish Wed Jun  3 23:52:43 UTC 2026
