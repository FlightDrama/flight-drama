import { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LOCALE_CONFIG, isValidLocale } from "@shared/i18n";

const LIMIT = 20;

function ArticleSkeleton() {
  return (
    <div className="bg-[oklch(0.15_0_0)] rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-[oklch(0.20_0_0)]" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[oklch(0.20_0_0)] rounded w-1/3" />
        <div className="h-4 bg-[oklch(0.20_0_0)] rounded" />
        <div className="h-4 bg-[oklch(0.20_0_0)] rounded w-3/4" />
      </div>
    </div>
  );
}

export default function TranslatedNewsPage() {
  const { locale } = useParams<{ locale: string }>();
  const [page, setPage] = useState(0);

  const localeConfig = locale && isValidLocale(locale) ? LOCALE_CONFIG[locale] : null;

  const { data: articles, isLoading } = trpc.articles.translationsByLocale.useQuery(
    { locale: locale ?? "", limit: LIMIT, offset: page * LIMIT },
    { enabled: !!locale && isValidLocale(locale ?? "") }
  );

  if (!locale || !isValidLocale(locale)) {
    return (
      <div className="min-h-screen bg-[oklch(0.10_0_0)]">
        <Navigation />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-black text-white mb-2">Language Not Supported</h1>
          <Link href="/" className="text-[oklch(0.85_0.18_95)] hover:underline">← Back to Flight Drama</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const hasNext = (articles?.length ?? 0) >= LIMIT;
  const hasPrev = page > 0;

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]" dir={localeConfig?.dir === "rtl" ? "rtl" : "ltr"}>
      <Navigation />
      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{localeConfig?.flag}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">Flight Drama</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            Aviation News in {localeConfig?.nativeName}
          </h1>
          <p className="text-sm text-[oklch(0.50_0_0)]">
            {isLoading ? "Loading…" : `${articles?.length ?? 0} translated articles`}
            {" · "}
            <Link href="/news" className="text-[oklch(0.85_0.18_95)] hover:underline">Read in English</Link>
          </p>
        </div>

        {/* Language switcher */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded border transition-colors"
            style={{ borderColor: "oklch(0.28 0 0)", color: "oklch(0.60 0 0)" }}
          >
            🇬🇧 English
          </Link>
          {Object.entries(LOCALE_CONFIG).map(([loc, cfg]) => (
            <Link
              key={loc}
              href={`/${loc}/news`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded border transition-colors"
              style={{
                borderColor: loc === locale ? "oklch(0.85 0.18 95)" : "oklch(0.28 0 0)",
                color: loc === locale ? "oklch(0.85 0.18 95)" : "oklch(0.60 0 0)",
                backgroundColor: loc === locale ? "oklch(0.85 0.18 95 / 0.10)" : "transparent",
              }}
            >
              {cfg.flag} {cfg.nativeName}
            </Link>
          ))}
        </div>

        {/* Article grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <ArticleSkeleton key={i} />)}
          </div>
        ) : articles && articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {articles.map((a: any) => (
              <Link
                key={a.id}
                href={`/${locale}/article/${a.slug}`}
                className="group bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] hover:border-[oklch(0.85_0.18_95)]/40 rounded-lg overflow-hidden transition-all block"
              >
                {a.featuredImage && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={a.featuredImage}
                      alt={a.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-3">
                  {a.categoryName && (
                    <span
                      className="text-[9px] font-black uppercase tracking-widest mb-1.5 block"
                      style={{ color: a.categoryColour ?? "oklch(0.85 0.18 95)" }}
                    >
                      {a.categoryName}
                    </span>
                  )}
                  <h2 className="text-sm font-black text-white leading-snug line-clamp-3 mb-2 group-hover:text-[oklch(0.85_0.18_95)] transition-colors">
                    {a.title}
                  </h2>
                  <div className="flex items-center gap-1 text-[10px] text-[oklch(0.45_0_0)]">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl opacity-20 mb-4">{localeConfig?.flag}</div>
            <p className="font-black text-white text-xl mb-2">No translated articles yet</p>
            <p className="text-sm text-[oklch(0.45_0_0)] mb-6">
              Articles in {localeConfig?.nativeName} are coming soon. Read all stories in English.
            </p>
            <Link href="/news" className="text-sm font-bold text-[oklch(0.85_0.18_95)] hover:underline">
              🇬🇧 Browse English articles →
            </Link>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && (hasPrev || hasNext) && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo(0, 0); }}
              disabled={!hasPrev}
              className="flex items-center gap-2 px-4 py-2 bg-[oklch(0.18_0_0)] text-sm font-bold rounded disabled:opacity-30 hover:bg-[oklch(0.22_0_0)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm text-[oklch(0.45_0_0)] font-bold">Page {page + 1}</span>
            <button
              onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
              disabled={!hasNext}
              className="flex items-center gap-2 px-4 py-2 bg-[oklch(0.18_0_0)] text-sm font-bold rounded disabled:opacity-30 hover:bg-[oklch(0.22_0_0)] transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
