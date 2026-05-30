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
import { useEffect } from "react";

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

    // Cleanup on unmount
    return () => {
      document.title = siteTitle;
    };
  }, [article]);

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
      <main className="container py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0_0)] hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to News
        </Link>
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
              {/* Share */}
              <div className="ml-auto"><ShareButtons title={article.title} compact /></div>
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
                  {JSON.parse(article.tags).map((tag: string) => (
                    <span key={tag} className="px-2 py-1 bg-[oklch(0.18_0_0)] rounded text-xs text-[oklch(0.60_0_0)]">#{tag}</span>
                  ))}
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
        {related && related.length > 0 && (
          <section className="mt-8">
            <RunwayDivider label="Related Stories" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.filter(r => r.slug !== slug).slice(0, 4).map(a => <ArticleCard key={a.id} {...a} publishedAt={a.publishedAt} size="medium" />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
