import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import NewsletterSignup from "@/components/NewsletterSignup";
import { Eye, Clock, ArrowLeft, Crown } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import RunwayDivider from "@/components/RunwayDivider";
import AdSlot from "@/components/AdSlot";
import ReadingProgressBar from "@/components/ReadingProgressBar";
import MostReadWidget from "@/components/MostReadWidget";
import FlightDramaRecommends from "@/components/FlightDramaRecommends";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import ArticleReactions from "@/components/ArticleReactions";
import ArticleComments from "@/components/ArticleComments";
import TableOfContents from "@/components/TableOfContents";
import AuthorBioCard from "@/components/AuthorBioCard";
import ProContentGate from "@/components/ProContentGate";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState, useMemo } from "react";
import { AVIATION_EVENTS, CATEGORY_COLOURS, CATEGORY_LABELS } from "@/components/OnThisDayWidget";
import TikTokWidget from "@/components/TikTokWidget";
import ArticleAudioPlayer from "@/components/ArticleAudioPlayer";

// Bookmark button for saving to Departure Lounge
function BookmarkButton({ slug, title, image }: { slug: string; title: string; image: string | null }) {
  const [saved, setSaved] = useState(() => {
    try { return !!localStorage.getItem(`fd_saved_${slug}`); } catch { return false; }
  });

  const toggle = () => {
    const key = `fd_saved_${slug}`;
    if (saved) {
      localStorage.removeItem(key);
      setSaved(false);
      toast.success('\uD83D\uDEEB Removed from Departure Lounge');
    } else {
      localStorage.setItem(key, JSON.stringify({ slug, title, image, savedAt: Date.now() }));
      setSaved(true);
      toast.success('\uD83D\uDEEB Added to Departure Lounge', {
        action: { label: 'View Lounge', onClick: () => window.location.href = '/departure-lounge' }
      });
    }
  };

  return (
    <button
      onClick={toggle}
      title={saved ? 'Remove from Departure Lounge' : 'Save to Departure Lounge'}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded transition-all duration-150 hover:scale-105 active:scale-95 ${
        saved
          ? 'bg-[oklch(0.85_0.18_95)]/10 border-[oklch(0.85_0.18_95)]/40 text-[oklch(0.85_0.18_95)]'
          : 'bg-transparent border-[oklch(0.30_0_0)] text-[oklch(0.55_0_0)] hover:border-[oklch(0.85_0.18_95)]/40 hover:text-[oklch(0.85_0.18_95)]'
      }`}
    >
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}

// Related On This Day sidebar widget
function RelatedOnThisDay() {
  const today = useMemo(() => new Date(), []);
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const events = AVIATION_EVENTS[`${month}-${day}`] ?? [];
  const dateLabel = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  if (events.length === 0) return null;
  return (
    <div className="bg-[oklch(0.12_0_0)] border border-[oklch(0.22_0_0)] rounded-lg overflow-hidden">
      <div className="bg-[oklch(0.18_0_0)] px-4 py-2.5 flex items-center gap-2 border-b border-[oklch(0.22_0_0)]">
        <span className="text-[oklch(0.85_0.18_95)] text-sm">📅</span>
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.65_0_0)]">On This Day</span>
          <span className="text-xs text-[oklch(0.45_0_0)] ml-2">{dateLabel}</span>
        </div>
      </div>
      <div className="divide-y divide-[oklch(0.18_0_0)]">
        {events.map((ev, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ backgroundColor: CATEGORY_COLOURS[ev.category] + '20', color: CATEGORY_COLOURS[ev.category] }}>
                {CATEGORY_LABELS[ev.category]}
              </span>
              <span className="text-[10px] font-black text-[oklch(0.85_0.18_95)]">{ev.year}</span>
            </div>
            <p className="text-xs text-[oklch(0.72_0_0)] leading-relaxed">{ev.event}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Calculate estimated reading time from HTML content
function getReadingTime(html: string): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200)); // 200 wpm average
  return `${minutes} min read`;
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = trpc.articles.bySlug.useQuery({ slug: slug! }, { enabled: !!slug });
  const { data: related } = trpc.articles.list.useQuery({ limit: 4, categoryId: data?.articles?.categoryId ?? undefined }, { enabled: !!data?.articles?.categoryId });
  const { data: membership } = trpc.profile.me.useQuery(undefined, { enabled: isAuthenticated });

  const article = data?.articles;
  const author = data?.authors;
  const category = data?.categories;
  const isPro = membership?.membership?.status === 'active';
  const isProGated = article?.isPro && !isPro;

  // ── SEO Meta Tags — inject into document head ──────────────────────────────
  useEffect(() => {
    if (!article) return;
    const siteTitle = 'Flight Drama';
    const title = (article as any).metaTitle || article.title;
    const description = (article as any).metaDescription || article.excerpt || '';
    const keywords = (article as any).metaKeywords || '';
    const image = article.featuredImage || '';
    const url = window.location.href;

    // Page title
    document.title = title ? `${title} | ${siteTitle}` : siteTitle;

    // Helper to set/create meta tags
    const setMeta = (name: string, content: string, prop = false) => {
      const attr = prop ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.content = content;
    };

    setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:url', url, true);
    setMeta('og:type', 'article', true);
    setMeta('og:site_name', siteTitle, true);
    if (image) setMeta('og:image', image, true);
    setMeta('twitter:card', 'summary_large_image', true);
    setMeta('twitter:title', title, true);
    setMeta('twitter:description', description, true);
    if (image) setMeta('twitter:image', image, true);
    setMeta('twitter:site', '@FlightDrama', true);

    // BreadcrumbList JSON-LD for SEO
    const existingBreadcrumb = document.getElementById('breadcrumb-jsonld');
    if (existingBreadcrumb) existingBreadcrumb.remove();
    const breadcrumbItems: any[] = [
      { '@type': 'ListItem', position: 1, name: 'Home', item: window.location.origin },
      { '@type': 'ListItem', position: 2, name: 'News', item: `${window.location.origin}/news` },
    ];
    if (category) {
      breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: category.name, item: `${window.location.origin}/category/${category.slug}` });
      breadcrumbItems.push({ '@type': 'ListItem', position: 4, name: title, item: url });
    } else {
      breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: title, item: url });
    }
    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.id = 'breadcrumb-jsonld';
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.text = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: breadcrumbItems });
    document.head.appendChild(breadcrumbScript);

    // Cleanup on unmount
    return () => {
      document.title = siteTitle;
      document.getElementById('breadcrumb-jsonld')?.remove();
    };
  }, [article, category]);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = article?.title ?? "";
    if (platform === "twitter") window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, "_blank");
    if (platform === "facebook") window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    if (platform === "copy") { navigator.clipboard.writeText(url); toast.success("Link copied!"); }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <div className="container py-8 animate-pulse">
        <div className="h-8 bg-[oklch(0.18_0_0)] rounded w-3/4 mb-4" />
        <div className="aspect-[16/9] bg-[oklch(0.18_0_0)] rounded-lg mb-6" />
        <div className="space-y-3">{Array.from({length:8}).map((_,i)=><div key={i} className="h-4 bg-[oklch(0.18_0_0)] rounded" />)}</div>
      </div>
    </div>
  );

  if (!article) return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <div className="container py-16 text-center"><p className="text-4xl mb-4">✈</p><h1 className="text-2xl font-black text-white mb-2">Article Not Found</h1><Link href="/" className="text-[oklch(0.85_0.18_95)] hover:underline">← Back to News</Link></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <ReadingProgressBar />
      <Navigation />
      {/* Sticky breadcrumb bar */}
      <div
        className="sticky top-0 z-30 border-b"
        style={{ backgroundColor: "oklch(0.10 0 0 / 0.95)", borderColor: "oklch(0.18 0 0)", backdropFilter: "blur(8px)" }}
      >
        <div className="container">
          <nav className="flex items-center gap-1.5 text-xs text-[oklch(0.45_0_0)] py-2.5 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="text-[oklch(0.30_0_0)]">/</span>
            <Link href="/news" className="hover:text-white transition-colors">News</Link>
            {category && (
              <>
                <span className="text-[oklch(0.30_0_0)]">/</span>
                <Link href={`/category/${category.slug}`} className="hover:text-white transition-colors" style={{ color: (category as any).colour ?? 'oklch(0.85 0.18 95)' }}>
                  {category.name}
                </Link>
              </>
            )}
            <span className="text-[oklch(0.30_0_0)]">/</span>
            <span className="text-[oklch(0.65_0_0)] truncate max-w-[200px] sm:max-w-xs">{article.title}</span>
          </nav>
        </div>
      </div>
      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <article className="lg:col-span-3">
            {/* Category + Breaking */}
            <div className="flex items-center gap-2 mb-3">
              {article.isBreaking && <span className="breaking-badge">Breaking</span>}
              {category && <Link href={`/category/${category.slug}`} className="category-badge">{category.name}</Link>}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">{article.title}</h1>
            {article.excerpt && <p className="text-lg text-[oklch(0.65_0_0)] mb-5 leading-relaxed border-l-4 border-[oklch(0.85_0.18_95)] pl-4">{article.excerpt}</p>}
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-[oklch(0.22_0_0)]">
              {author && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center text-black font-black text-sm">{author.name.charAt(0)}</div>
                  <div><p className="text-sm font-bold text-white">{author.name}</p><p className="text-xs text-[oklch(0.45_0_0)]">Aviation Journalist</p></div>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-[oklch(0.45_0_0)]"><Clock className="w-3 h-3" />{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</div>
              <div className="flex items-center gap-1 text-xs text-[oklch(0.85_0.18_95)] font-bold bg-[oklch(0.85_0.18_95)]/10 px-2 py-0.5">
                <Clock className="w-3 h-3" />
                {getReadingTime(article.content)}
              </div>
              <div className="flex items-center gap-1 text-xs text-[oklch(0.45_0_0)]"><Eye className="w-3 h-3" />{article.views.toLocaleString()} views</div>
              {/* Bookmark + Share */}
              <div className="ml-auto flex items-center gap-2">
                {/* Save to Departure Lounge */}
                <BookmarkButton slug={article.slug} title={article.title} image={article.featuredImage} />
                <ShareButtons title={article.title} compact />
              </div>
            </div>
            {/* Featured image */}
            {article.featuredImage && (
              <div className="rounded-lg overflow-hidden mb-6">
                <img src={article.featuredImage} alt={article.title} className="w-full object-cover max-h-[500px]" />
              </div>
            )}
            {/* Video embed — YouTube/generic */}
            {article.videoUrl && !article.videoUrl.includes('instagram.com') && (
              <div className="rounded-lg overflow-hidden mb-6 aspect-video">
                <iframe src={article.videoUrl} className="w-full h-full" allowFullScreen title={article.title} />
              </div>
            )}
            {/* Instagram Reel embed */}
            {article.videoUrl && article.videoUrl.includes('instagram.com') && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)]">✈ Watch the Original Reel</span>
                </div>
                <div className="flex justify-center bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-4">
                  <iframe
                    src={`${article.videoUrl}embed/`}
                    className="rounded-xl"
                    style={{ width: '320px', height: '568px', border: 'none' }}
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    title={article.title}
                  />
                </div>
              </div>
            )}
            {/* Pro badge on article header */}
            {article.isPro && (
              <div className="flex items-center gap-2 mb-4 bg-[oklch(0.85_0.18_95)]/10 border border-[oklch(0.85_0.18_95)]/30 px-4 py-2.5 rounded-lg">
                <Crown className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
                <span className="text-sm font-black text-[oklch(0.85_0.18_95)]">Flight Drama Pro Exclusive</span>
                {!isPro && <Link href="/pro" className="ml-auto text-xs text-black bg-[oklch(0.85_0.18_95)] px-3 py-1 font-black hover:bg-[oklch(0.78_0.18_95)] transition-colors">Upgrade to Read →</Link>}
              </div>
            )}
            {/* Audio Player */}
            <ArticleAudioPlayer
              articleId={article.id}
              articleTitle={article.title}
              cachedAudioUrl={(article as any).audioUrl ?? null}
            />
            {/* Table of Contents */}
            {!isProGated && <TableOfContents content={article.content} />}
            {/* Content — show gate for Pro articles */}
            {isProGated ? (
              <ProContentGate articleTitle={article.title} previewContent={article.content} />
            ) : (
              <div className="article-prose max-w-none"
                dangerouslySetInnerHTML={{ __html: article.content }} />
            )}
            {/* Tags */}
            {article.tags && (
              <div className="mt-8 pt-6 border-t border-[oklch(0.22_0_0)]">
                <p className="text-xs font-bold uppercase tracking-widest text-[oklch(0.45_0_0)] mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {JSON.parse(article.tags).map((tag: string) => {
                    const tagSlug = tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    return (
                      <Link
                        key={tag}
                        href={`/tag/${tagSlug}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[oklch(0.18_0_0)] hover:bg-[oklch(0.22_0_0)] rounded text-xs text-[oklch(0.60_0_0)] hover:text-white transition-colors border border-[oklch(0.22_0_0)] hover:border-[oklch(0.85_0.18_95)/0.3]"
                      >
                        <span className="text-[oklch(0.85_0.18_95)] text-[10px]">#</span>{tag}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Reactions */}
            <ArticleReactions articleId={article.id} />
            {/* Bottom share section */}
            <div className="mt-6 pt-6 border-t border-[oklch(0.22_0_0)]">
              <p className="text-xs font-bold uppercase tracking-widest text-[oklch(0.45_0_0)] mb-3">Enjoyed this story? Share it</p>
              <ShareButtons title={article.title} />
            </div>
            {/* Author bio */}
            {author && <AuthorBioCard author={author} />}
            {/* Comments */}
            <ArticleComments articleId={article.id} />
          </article>
          <aside className="space-y-6">
            <MostReadWidget />
            <RelatedOnThisDay />
            <TikTokWidget />
            <FlightDramaRecommends />
            <AdSlot slot="sidebar" />
            <NewsletterSignup source="article-sidebar" />
            <div className="bg-gradient-to-br from-[oklch(0.85_0.18_95)] to-[oklch(0.75_0.18_95)] rounded-lg p-4 text-black">
              <Crown className="w-5 h-5 mb-2" />
              <h3 className="font-black mb-1">Flight Drama Pro</h3>
              <p className="text-xs opacity-80 mb-3">Ad-free reading, exclusive content & VIP forum access.</p>
              <Link href="/pro" className="block bg-black text-[oklch(0.85_0.18_95)] text-center py-2 rounded font-black text-sm">Join Pro →</Link>
            </div>
          </aside>
        </div>
        {/* Related articles */}
        {related && related.length > 1 && (() => {
          const filtered = related.filter(r => r.slug !== slug).slice(0, 3);
          if (filtered.length === 0) return null;
          return (
            <section className="mt-10">
              <RunwayDivider label="You Might Also Like" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-4">
                {filtered.map((a, idx) => {
                  const wordCount = (a.excerpt ?? '').split(' ').length * 8;
                  const readTime = Math.max(1, Math.round(wordCount / 200));
                  const savedKey = `fd_saved_${a.slug}`;
                  const isSaved = typeof window !== 'undefined' && !!localStorage.getItem(savedKey);
                  return (
                    <div
                      key={a.id}
                      className="group cursor-pointer bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] hover:border-[oklch(0.85_0.18_95)]/40 transition-all duration-500 rounded-lg overflow-hidden opacity-0 translate-y-4"
                      style={{
                        animation: `fadeSlideIn 0.5s ease-out ${idx * 120}ms forwards`,
                      }}
                    >
                      {a.featuredImage && (
                        <div className="aspect-[16/9] overflow-hidden relative">
                          <img
                            src={a.featuredImage}
                            alt={a.title}
                            onClick={() => window.location.href = `/article/${a.slug}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Save for later bookmark */}
                          {/* Bookmark button with toast */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const key = `fd_saved_${a.slug}`;
                              const currently = !!localStorage.getItem(key);
                              if (currently) {
                                localStorage.removeItem(key);
                                (e.currentTarget as HTMLButtonElement).setAttribute('data-saved', 'false');
                                (e.currentTarget.querySelector('svg') as SVGElement).setAttribute('fill', 'none');
                                (e.currentTarget.querySelector('svg') as SVGElement).setAttribute('stroke', 'white');
                                toast.success('🛫 Removed from Departure Lounge');
                              } else {
                                localStorage.setItem(key, JSON.stringify({ slug: a.slug, title: a.title, image: a.featuredImage, savedAt: Date.now() }));
                                (e.currentTarget as HTMLButtonElement).setAttribute('data-saved', 'true');
                                (e.currentTarget.querySelector('svg') as SVGElement).setAttribute('fill', 'oklch(0.85 0.18 95)');
                                (e.currentTarget.querySelector('svg') as SVGElement).setAttribute('stroke', 'oklch(0.85 0.18 95)');
                                toast.success('🛫 Added to Departure Lounge', { action: { label: 'View Lounge', onClick: () => window.location.href = '/departure-lounge' } });
                              }
                            }}
                            title={isSaved ? 'Remove from Departure Lounge' : 'Save to Departure Lounge'}
                            data-saved={isSaved ? 'true' : 'false'}
                            className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-90"
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill={isSaved ? 'oklch(0.85 0.18 95)' : 'none'} stroke={isSaved ? 'oklch(0.85 0.18 95)' : 'white'} strokeWidth="2">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                            </svg>
                          </button>
                          {/* Share button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = `${window.location.origin}/article/${a.slug}`;
                              if (navigator.share) {
                                navigator.share({ title: a.title, url }).catch(() => {});
                              } else {
                                navigator.clipboard.writeText(url).then(() => toast.success('✈ Link copied to clipboard'));
                              }
                            }}
                            title="Share this article"
                            className="absolute top-2 left-2 w-8 h-8 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-90"
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
                          </button>
                        </div>
                      )}
                      <div className="p-4" onClick={() => window.location.href = `/article/${a.slug}`}>
                        {a.categoryName && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)] mb-2 block">
                            {a.categoryName}
                          </span>
                        )}
                        <h3 className="text-sm font-black text-white leading-snug line-clamp-2 group-hover:text-[oklch(0.85_0.18_95)] transition-colors mb-2">
                          {a.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-[oklch(0.40_0_0)]">
                          <span>{readTime} min read</span>
                          <span>·</span>
                          <span>{(a.views ?? 0).toLocaleString()} views</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {filtered[0]?.categoryName && (
                <div className="text-center">
                  <a
                    href={`/?tab=${filtered[0].categoryName?.toLowerCase().replace(/\s+/g, '-') ?? 'news'}`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[oklch(0.85_0.18_95)] hover:underline"
                  >
                    More {filtered[0].categoryName} stories →
                  </a>
                </div>
              )}
            </section>
          );
        })()}
      </main>
      <Footer />
    </div>
  );
}
