import { useState, useMemo } from "react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import NewsletterSignup from "@/components/NewsletterSignup";
import { TrendingUp, Flame, Users, Crown, ExternalLink, Eye, Clock, MessageCircle, X, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/_core/hooks/useAuth";

type StoryTab = 'latest' | 'top' | 'commented';

function HeroStoriesPanel({ latestArticles, topArticles }: { latestArticles: any[]; topArticles: any[] }) {
  const [tab, setTab] = useState<StoryTab>('latest');
  const { data: mostRead } = trpc.articles.mostRead.useQuery({ limit: 5 });
  const { data: mostCommented } = trpc.articles.mostCommented.useQuery({ limit: 5 });

  const latest = latestArticles.slice(0, 5);
  const top = mostRead ?? topArticles.slice(0, 5);
  const commented = mostCommented ?? [];

  const items = tab === 'latest' ? latest : tab === 'top' ? top : commented;

  const viewAllHref = tab === 'top' ? '/news?sort=popular' : '/news';

  const tabs: { key: StoryTab; label: string }[] = [
    { key: 'latest', label: 'Latest' },
    { key: 'top', label: 'Top' },
    { key: 'commented', label: 'Hot' },
  ];

  return (
    <div className="flex flex-col bg-[oklch(0.12_0_0)] border border-[oklch(0.22_0_0)] rounded-lg overflow-hidden">
      {/* Tab header */}
      <div className="flex border-b border-[oklch(0.22_0_0)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest transition-colors ${
              tab === t.key
                ? 'bg-[oklch(0.85_0.18_95)] text-black'
                : 'bg-[oklch(0.18_0_0)] text-[oklch(0.50_0_0)] hover:text-white hover:bg-[oklch(0.20_0_0)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Story list */}
      <div className="divide-y divide-[oklch(0.18_0_0)] flex-1">
        {items.map((a, i) => (
          <Link
            key={a.id}
            href={`/article/${a.slug}`}
            className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-[oklch(0.16_0_0)] transition-colors group"
          >
            {/* Thumbnail — bigger and bolder per Josh's feedback */}
            <div className="shrink-0 w-20 h-20 rounded overflow-hidden bg-[oklch(0.20_0_0)] relative">
              {a.featuredImage ? (
                <img
                  src={a.featuredImage}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[oklch(0.35_0_0)] text-2xl">✈</div>
              )}
              {/* Rank badge overlay */}
              <div
                className={`absolute bottom-0 left-0 w-5 h-5 flex items-center justify-center text-[10px] font-black ${
                  i === 0 ? 'bg-[oklch(0.85_0.18_95)] text-black' : 'bg-[oklch(0.10_0_0)/80] text-[oklch(0.55_0_0)]'
                }`}
              >
                {i + 1}
              </div>
            </div>
            {/* Text */}
            <div className="flex-1 min-w-0">
              {a.categoryName && (
                <p className="text-[10px] font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)] mb-0.5 truncate">{a.categoryName}</p>
              )}
              <p className="text-[13px] font-bold text-[oklch(0.88_0_0)] group-hover:text-white transition-colors line-clamp-2 leading-snug">
                {a.title}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[oklch(0.40_0_0)]">
                {tab === 'latest' && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {a.publishedAt ? formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true }) : ''}
                  </span>
                )}
                {tab === 'top' && (
                  <span className="flex items-center gap-0.5">
                    <Eye className="w-2.5 h-2.5" />
                    {(a.views ?? 0).toLocaleString()}
                  </span>
                )}
                {tab === 'commented' && (
                  <span className="flex items-center gap-0.5">
                    <MessageCircle className="w-2.5 h-2.5" />
                    {(a.commentCount ?? 0).toLocaleString()} comments
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {/* View All footer */}
      <div className="border-t border-[oklch(0.22_0_0)] px-3 py-2.5">
        <Link
          href={viewAllHref}
          className="text-[10px] font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)] hover:underline flex items-center gap-1"
        >
          View all stories →
        </Link>
      </div>
    </div>
  );
}
import FlightStats from "@/components/FlightStats";
import LiveFlightsWidget from "@/components/LiveFlightsWidget";
import AdSlot from "@/components/AdSlot";
import MostReadWidget from "@/components/MostReadWidget";
import FlightSearchBar from "@/components/FlightSearchBar";
import TrendingCommentsWidget from "@/components/TrendingCommentsWidget";
import OnThisDayWidget from "@/components/OnThisDayWidget";

const CATEGORY_FILTERS = [
  { label: "All", value: undefined },
  { label: "Breaking", value: "breaking" },
  { label: "Commercial", value: "commercial-aviation" },
  { label: "Military", value: "military-aviation" },
  { label: "Tech", value: "aircraft-tech" },
  { label: "Incidents", value: "aviation-incidents" },
  { label: "Training", value: "flight-training" },
  { label: "Future", value: "space-future" },
];

// Airline quick-filters for the homepage
const AIRLINE_FILTERS = [
  { label: "Ryanair", value: "ryanair" },
  { label: "easyJet", value: "easyjet" },
  { label: "British Airways", value: "british airways" },
  { label: "Emirates", value: "emirates" },
  { label: "Delta", value: "delta" },
  { label: "United", value: "united airlines" },
  { label: "Lufthansa", value: "lufthansa" },
  { label: "Qatar", value: "qatar airways" },
];

// Aircraft type quick-filters
const AIRCRAFT_FILTERS = [
  { label: "Boeing 737", value: "737" },
  { label: "Airbus A320", value: "a320" },
  { label: "A380", value: "a380" },
  { label: "787 Dreamliner", value: "787" },
  { label: "Concorde", value: "concorde" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [bannerDismissed, setBannerDismissed] = useState(() => sessionStorage.getItem('upgradeBannerDismissed') === '1');
  const { data: membership } = trpc.membership.getMyMembership.useQuery(undefined, { enabled: isAuthenticated });
  const showUpgradeBanner = !bannerDismissed && (!isAuthenticated || !membership || membership.status !== 'active');
  const searchStr = useSearch();
  const searchParams = new URLSearchParams(searchStr);
  const urlSearch = searchParams.get("search") || undefined;
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  const [activeSearch, setActiveSearch] = useState<string | undefined>(undefined);
  const [filterMode, setFilterMode] = useState<'category' | 'airline' | 'aircraft'>('category');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [page, setPage] = useState(0);
  const LIMIT = 24;
  const { data: categories } = trpc.categories.list.useQuery();
  const categoryId = useMemo(() => {
    if (filterMode !== 'category' || !activeFilter || !categories) return undefined;
    const cat = categories.find((c) => c.slug === activeFilter);
    return cat?.id;
  }, [activeFilter, categories, filterMode]);
  // For airline/aircraft filters, use search
  const effectiveSearch = filterMode !== 'category' ? activeSearch : urlSearch;
  // Hero: always the most recently published article
  const { data: latestHeroArticles } = trpc.articles.list.useQuery({ limit: 1, sortBy: 'recent' });
  const { data: featuredArticles } = trpc.articles.list.useQuery({ limit: 4, featured: true });
  const { data: articles, isLoading } = trpc.articles.list.useQuery({ limit: LIMIT, offset: page * LIMIT, categoryId, search: effectiveSearch, sortBy });
  const { data: trendingArticles } = trpc.articles.list.useQuery({ limit: 6, offset: 0 });
  const { data: subscriberCount } = trpc.newsletter.count.useQuery();
  const hero = latestHeroArticles?.[0];

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />

      {/* Sticky upgrade banner — shown to non-Pro users */}
      {showUpgradeBanner && (
        <div className="sticky top-0 z-40 bg-[oklch(0.85_0.18_95)] text-black py-2 px-4">
          <div className="container flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Zap className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Start at just <strong>£1/month</strong> — ad-free reading, push notifications &amp; more.</span>
              <span className="sm:hidden">Go Pro from <strong>£1/month</strong></span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/pro"
                className="bg-black text-[oklch(0.85_0.18_95)] text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded hover:bg-[oklch(0.15_0_0)] transition-colors"
              >
                See Plans →
              </Link>
              <button
                onClick={() => { setBannerDismissed(true); sessionStorage.setItem('upgradeBannerDismissed', '1'); }}
                className="text-black/60 hover:text-black transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="container py-6">
        {!urlSearch && !activeFilter && (
          <section className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                {hero && <ArticleCard {...hero} publishedAt={hero.publishedAt} size="hero" />}
              </div>
              <HeroStoriesPanel latestArticles={articles ?? []} topArticles={featuredArticles ?? []} />
            </div>
          </section>
        )}
        {urlSearch && (
          <div className="mb-6 accent-bar">
            <h1 className="text-xl font-black text-white">Search: <span className="text-[oklch(0.85_0.18_95)]">"{urlSearch}"</span></h1>
          </div>
        )}
        {/* Flight-themed search bar */}
        <div className="mb-6">
          <FlightSearchBar />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* Filter tab switcher */}
            <div className="flex items-center gap-1 mb-3">
              {(['category', 'airline', 'aircraft'] as const).map((mode) => (
                <button key={mode} onClick={() => { setFilterMode(mode); setActiveFilter(undefined); setActiveSearch(undefined); setPage(0); }}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors border-b-2 ${
                    filterMode === mode
                      ? 'text-[oklch(0.85_0.18_95)] border-[oklch(0.85_0.18_95)]'
                      : 'text-[oklch(0.45_0_0)] border-transparent hover:text-white'
                  }`}>
                  {mode === 'category' ? 'Categories' : mode === 'airline' ? 'Airlines' : 'Aircraft'}
                </button>
              ))}
            </div>
            {/* Filter pills */}
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-2">
              {filterMode === 'category' && CATEGORY_FILTERS.map((f) => (
                <button key={f.label} onClick={() => { setActiveFilter(f.value); setFilterMode('category'); setActiveSearch(undefined); setPage(0); }}
                  className={`shrink-0 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors ${
                    filterMode === 'category' && activeFilter === f.value
                      ? 'bg-[oklch(0.85_0.18_95)] text-black'
                      : 'bg-[oklch(0.18_0_0)] text-[oklch(0.60_0_0)] hover:text-white hover:bg-[oklch(0.22_0_0)]'
                  }`}>
                  {f.label}
                </button>
              ))}
              {filterMode === 'airline' && AIRLINE_FILTERS.map((f) => (
                <button key={f.label} onClick={() => { setActiveSearch(f.value); setActiveFilter(undefined); setPage(0); }}
                  className={`shrink-0 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors ${
                    activeSearch === f.value
                      ? 'bg-[oklch(0.85_0.18_95)] text-black'
                      : 'bg-[oklch(0.18_0_0)] text-[oklch(0.60_0_0)] hover:text-white hover:bg-[oklch(0.22_0_0)]'
                  }`}>
                  {f.label}
                </button>
              ))}
              {filterMode === 'aircraft' && AIRCRAFT_FILTERS.map((f) => (
                <button key={f.label} onClick={() => { setActiveSearch(f.value); setActiveFilter(undefined); setPage(0); }}
                  className={`shrink-0 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors ${
                    activeSearch === f.value
                      ? 'bg-[oklch(0.85_0.18_95)] text-black'
                      : 'bg-[oklch(0.18_0_0)] text-[oklch(0.60_0_0)] hover:text-white hover:bg-[oklch(0.22_0_0)]'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between mb-4 gap-3">
              <h2 className="font-display text-xl text-white tracking-wider">
                {filterMode === 'airline' && activeSearch
                  ? `${AIRLINE_FILTERS.find(f => f.value === activeSearch)?.label} News`
                  : filterMode === 'aircraft' && activeSearch
                  ? `${AIRCRAFT_FILTERS.find(f => f.value === activeSearch)?.label} News`
                  : activeFilter
                  ? CATEGORY_FILTERS.find((f) => f.value === activeFilter)?.label + " News"
                  : urlSearch ? "Search Results" : "Latest Aviation News"}
              </h2>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[oklch(0.45_0_0)] hidden sm:block">{articles?.length ?? 0} stories</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as 'recent' | 'popular'); setPage(0); }}
                  className="text-xs bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] text-white px-2 py-1.5 focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors cursor-pointer"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Viewed</option>
                </select>
              </div>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-[oklch(0.15_0_0)] rounded-lg overflow-hidden animate-pulse">
                    <div className="aspect-[16/9] bg-[oklch(0.20_0_0)]" />
                    <div className="p-3 space-y-2"><div className="h-3 bg-[oklch(0.20_0_0)] rounded w-1/3" /><div className="h-4 bg-[oklch(0.20_0_0)] rounded" /><div className="h-4 bg-[oklch(0.20_0_0)] rounded w-3/4" /></div>
                  </div>
                ))}
              </div>
            ) : articles && articles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
                  {articles.slice(0, 3).map((a) => <ArticleCard key={a.id} {...a} publishedAt={a.publishedAt} size="large" />)}
                </div>
                <div className="mb-4 rounded-lg overflow-hidden border border-[oklch(0.22_0_0)]">
                  <div className="bg-[oklch(0.85_0.18_95)] px-4 py-3 text-center">
                    <p className="font-black text-black text-sm">✈ Book Your Flight Training Today — From £99 | SkyHigh Flight Academy</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {articles.slice(3).map((a) => <ArticleCard key={a.id} {...a} publishedAt={a.publishedAt} size="medium" />)}
                </div>
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-4 py-2 bg-[oklch(0.18_0_0)] text-sm font-bold rounded disabled:opacity-30 hover:bg-[oklch(0.22_0_0)] transition-colors">← Previous</button>
                  <span className="text-sm text-[oklch(0.50_0_0)]">Page {page + 1}</span>
                  <button onClick={() => setPage((p) => p + 1)} disabled={(articles?.length ?? 0) < LIMIT} className="px-4 py-2 bg-[oklch(0.18_0_0)] text-sm font-bold rounded disabled:opacity-30 hover:bg-[oklch(0.22_0_0)] transition-colors">Next →</button>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-[oklch(0.45_0_0)]"><p className="text-4xl mb-3">✈</p><p className="font-bold">No articles found</p></div>
            )}
          </div>
          <aside className="space-y-6">
            <NewsletterSignup source="homepage-sidebar" />
            <OnThisDayWidget />
            <MostReadWidget />
            <TrendingCommentsWidget />
            <LiveFlightsWidget />
            <AdSlot slot="sidebar" />
            <FlightStats />
            <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)] mb-3">Community</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[oklch(0.65_0_0)]"><Users className="w-4 h-4" /><span>Subscribers</span></div>
                  <span className="font-black text-white">{subscriberCount?.toLocaleString() ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[oklch(0.65_0_0)]"><ExternalLink className="w-4 h-4" /><span>Facebook Group</span></div>
                  <a href="https://www.facebook.com/groups/2881397465357025" target="_blank" rel="noopener noreferrer" className="font-black text-[oklch(0.85_0.18_95)] text-sm hover:underline">7K+</a>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[oklch(0.85_0.18_95)] to-[oklch(0.75_0.18_95)] rounded-lg p-4 text-black">
              <Crown className="w-6 h-6 mb-2" />
              <h3 className="font-black text-lg leading-tight mb-1">Flight Drama Pro</h3>
              <p className="text-xs font-medium opacity-80 mb-3">Ad-free reading, exclusive articles, VIP forum access and more.</p>
              <Link href="/pro" className="block bg-black text-[oklch(0.85_0.18_95)] text-center py-2 rounded font-black text-sm hover:bg-[oklch(0.15_0_0)] transition-colors">Join Pro →</Link>
            </div>
            <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-[oklch(0.85_0.18_95)]" /><h3 className="text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)]">Trending</h3></div>
              <div className="space-y-1">
                {trendingArticles?.slice(0, 6).map((a, i) => (
                  <Link key={a.id} href={`/article/${a.slug}`} className="flex gap-3 items-start py-2 border-b border-[oklch(0.18_0_0)] last:border-0 hover:bg-[oklch(0.18_0_0)] px-1 rounded transition-colors group">
                    <span className="text-2xl font-black text-[oklch(0.28_0_0)] leading-none mt-0.5 w-6 shrink-0">{i + 1}</span>
                    <div><p className="text-xs font-bold text-white leading-snug line-clamp-2 group-hover:text-[oklch(0.85_0.18_95)] transition-colors">{a.title}</p><p className="text-[10px] text-[oklch(0.45_0_0)] mt-0.5">{a.views?.toLocaleString()} views</p></div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)] mb-3">Follow Us</h3>
              <div className="space-y-2">
                <a href="https://www.facebook.com/groups/2881397465357025" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded bg-[oklch(0.20_0_0)] hover:bg-[oklch(0.25_0_0)] transition-colors text-sm font-semibold text-white"><span className="text-blue-500 font-black">f</span> Facebook · 7K members</a>
                <a href="#" className="flex items-center gap-3 p-2 rounded bg-[oklch(0.20_0_0)] hover:bg-[oklch(0.25_0_0)] transition-colors text-sm font-semibold text-white"><span className="text-sky-400 font-black">𝕏</span> Twitter / X</a>
                <a href="https://www.tiktok.com/@flightdrama" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded bg-[oklch(0.20_0_0)] hover:bg-[oklch(0.25_0_0)] transition-colors text-sm font-semibold text-white"><span className="text-white font-black">♪</span> TikTok · 99K followers · 2M likes</a>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
// checkpoint trigger Wed Jun  3 08:31:37 UTC 2026
