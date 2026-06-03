import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ReadingProgressBar from "@/components/ReadingProgressBar";
import ShareButtons from "@/components/ShareButtons";
import { Clock, ArrowLeft, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LOCALE_CONFIG, isValidLocale } from "@shared/i18n";

export default function TranslatedArticlePage() {
  const { locale, slug } = useParams<{ locale: string; slug: string }>();

  const { data: article, isLoading } = trpc.articles.translationBySlug.useQuery(
    { locale: locale ?? "", slug: slug ?? "" },
    { enabled: !!locale && !!slug && isValidLocale(locale ?? "") }
  );

  const localeConfig = locale && isValidLocale(locale) ? LOCALE_CONFIG[locale] : null;

  // SEO meta + hreflang
  useEffect(() => {
    if (!article) return;
    const siteTitle = "Flight Drama";
    const title = article.metaTitle || article.title;
    const description = article.metaDescription || article.excerpt || "";
    const url = window.location.href;

    document.title = `${title} | ${siteTitle}`;
    document.documentElement.lang = locale ?? "en";
    if (localeConfig?.dir === "rtl") {
      document.documentElement.dir = "rtl";
    }

    const setMeta = (name: string, content: string, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.content = content;
    };

    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:url", url, true);
    setMeta("og:type", "article", true);
    if (article.featuredImage) setMeta("og:image", article.featuredImage, true);

    // hreflang — link back to English original
    const enSlug = url.replace(`/${locale}/article/`, "/article/");
    const addHreflang = (lang: string, href: string) => {
      const existing = document.querySelector(`link[hreflang="${lang}"]`);
      if (existing) existing.remove();
      const link = document.createElement("link");
      link.rel = "alternate";
      link.setAttribute("hreflang", lang);
      link.href = href;
      document.head.appendChild(link);
    };
    addHreflang("en", enSlug);
    if (localeConfig) addHreflang(localeConfig.hreflang, url);
    addHreflang("x-default", enSlug);

    return () => {
      document.title = siteTitle;
      document.documentElement.lang = "en";
      document.documentElement.dir = "ltr";
      document.querySelectorAll("link[hreflang]").forEach(el => el.remove());
    };
  }, [article, locale, localeConfig]);

  if (!locale || !isValidLocale(locale)) {
    return (
      <div className="min-h-screen bg-[oklch(0.10_0_0)]">
        <Navigation />
        <div className="container py-16 text-center">
          <p className="text-4xl mb-4">✈</p>
          <h1 className="text-2xl font-black text-white mb-2">Language Not Supported</h1>
          <Link href="/" className="text-[oklch(0.85_0.18_95)] hover:underline">← Back to Flight Drama</Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <div className="container py-8 animate-pulse">
        <div className="h-4 bg-[oklch(0.18_0_0)] rounded w-1/3 mb-6" />
        <div className="h-8 bg-[oklch(0.18_0_0)] rounded w-3/4 mb-4" />
        <div className="aspect-[16/9] bg-[oklch(0.18_0_0)] rounded-lg mb-6" />
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-4 bg-[oklch(0.18_0_0)] rounded" />)}</div>
      </div>
    </div>
  );

  if (!article) return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <div className="container py-16 text-center">
        <p className="text-4xl mb-4">✈</p>
        <h1 className="text-2xl font-black text-white mb-2">Article Not Found</h1>
        <p className="text-sm text-[oklch(0.50_0_0)] mb-4">This article may not be translated into {localeConfig?.name ?? locale} yet.</p>
        <Link href={`/article/${slug}`} className="text-[oklch(0.85_0.18_95)] hover:underline">Read in English →</Link>
      </div>
      <Footer />
    </div>
  );

  const isRTL = localeConfig?.dir === "rtl";

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]" dir={isRTL ? "rtl" : "ltr"}>
      <ReadingProgressBar />
      <Navigation />

      {/* Sticky breadcrumb */}
      <div
        className="sticky top-0 z-30 border-b"
        style={{ backgroundColor: "oklch(0.10 0 0 / 0.95)", borderColor: "oklch(0.18 0 0)", backdropFilter: "blur(8px)" }}
      >
        <div className="container">
          <nav className="flex items-center gap-1.5 text-xs text-[oklch(0.45_0_0)] py-2.5 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="text-[oklch(0.30_0_0)]">/</span>
            <Link href={`/${locale}/news`} className="hover:text-white transition-colors">
              {localeConfig?.flag} {localeConfig?.nativeName ?? locale.toUpperCase()}
            </Link>
            {article.categoryName && (
              <>
                <span className="text-[oklch(0.30_0_0)]">/</span>
                <span style={{ color: article.categoryColour ?? "oklch(0.85 0.18 95)" }}>{article.categoryName}</span>
              </>
            )}
            <span className="text-[oklch(0.30_0_0)]">/</span>
            <span className="text-[oklch(0.65_0_0)] truncate max-w-[200px] sm:max-w-xs">{article.title}</span>
          </nav>
        </div>
      </div>

      <main className="container py-6">
        {/* Language notice + switch to English */}
        <div
          className="flex items-center gap-3 mb-5 px-4 py-2.5 rounded-lg border text-sm"
          style={{ backgroundColor: "oklch(0.15 0 0)", borderColor: "oklch(0.22 0 0)" }}
        >
          <span className="text-lg">{localeConfig?.flag}</span>
          <span className="text-[oklch(0.55_0_0)] flex-1">
            {localeConfig?.nativeName ?? locale.toUpperCase()} — Automatically translated
          </span>
          <Link
            href={`/article/${slug}`}
            className="text-xs font-bold text-[oklch(0.85_0.18_95)] hover:underline shrink-0"
          >
            🇬🇧 Read in English
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <article className="lg:col-span-3">
            {/* Category */}
            {article.categoryName && (
              <div className="mb-3">
                <span
                  className="category-badge"
                  style={{ backgroundColor: article.categoryColour ? `${article.categoryColour}20` : undefined, color: article.categoryColour ?? undefined }}
                >
                  {article.categoryName}
                </span>
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">{article.title}</h1>
            {article.excerpt && (
              <p className="text-lg text-[oklch(0.65_0_0)] mb-5 leading-relaxed border-l-4 border-[oklch(0.85_0.18_95)] pl-4">{article.excerpt}</p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-[oklch(0.22_0_0)]">
              {article.authorName && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center text-black font-black text-sm">
                    {article.authorName.charAt(0)}
                  </div>
                  <p className="text-sm font-bold text-white">{article.authorName}</p>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-[oklch(0.45_0_0)]">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
              </div>
              {article.views > 0 && (
                <div className="flex items-center gap-1 text-xs text-[oklch(0.45_0_0)]">
                  <Eye className="w-3 h-3" />
                  {article.views.toLocaleString()}
                </div>
              )}
              <ShareButtons title={article.title} compact />
            </div>

            {/* Featured image */}
            {article.featuredImage && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img src={article.featuredImage} alt={article.title} className="w-full object-cover max-h-[500px]" />
              </div>
            )}

            {/* Translated content */}
            <div
              className="article-prose max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Bottom share */}
            <div className="mt-8 pt-6 border-t border-[oklch(0.22_0_0)]">
              <p className="text-xs font-bold uppercase tracking-widest text-[oklch(0.45_0_0)] mb-3">Share this article</p>
              <ShareButtons title={article.title} />
            </div>
          </article>

          {/* Sidebar placeholder — same widgets as English */}
          <aside className="space-y-6">
            <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-4 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)] mb-2">Read in English</p>
              <Link
                href={`/article/${slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded font-black text-sm transition-colors"
                style={{ backgroundColor: "oklch(0.85 0.18 95)", color: "black" }}
              >
                🇬🇧 English Version
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
