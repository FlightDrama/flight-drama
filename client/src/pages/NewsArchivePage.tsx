import { useState, useMemo, useRef, useEffect } from "react";
import { useSearch } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, Flame, Clock, TrendingUp, Search, X } from "lucide-react";

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

const SORT_OPTIONS = [
  { label: "Most Recent", value: "recent", icon: Clock },
  { label: "Most Viewed", value: "popular", icon: TrendingUp },
];

const LIMIT = 24;

function ArticleSkeleton() {
  return (
    <div className="bg-[oklch(0.15_0_0)] rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-[oklch(0.20_0_0)]" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[oklch(0.20_0_0)] rounded w-1/3" />
        <div className="h-4 bg-[oklch(0.20_0_0)] rounded" />
        <div className="h-4 bg-[oklch(0.20_0_0)] rounded w-3/4" />
        <div className="h-3 bg-[oklch(0.18_0_0)] rounded w-1/2 mt-1" />
      </div>
    </div>
  );
}

export default function NewsArchivePage() {
  const searchStr = useSearch();
  const searchParams = new URLSearchParams(searchStr);
  const initialSort = (searchParams.get("sort") === "popular" ? "popular" : "recent") as "recent" | "popular";

  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  const [showProOnly, setShowProOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "popular">(initialSort);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  // Track when user changes filter/sort to show immediate skeleton
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = trpc.categories.list.useQuery();
  const categoryId = useMemo(() => {
    if (!activeFilter || !categories) return undefined;
    const cat = categories.find((c) => c.slug === activeFilter);
    return cat?.id;
  }, [activeFilter, categories]);

  const { data: articles, isLoading, isFetching } = trpc.articles.list.useQuery({
    limit: LIMIT,
    offset: page * LIMIT,
    categoryId,
    sortBy,
    search: searchQuery,
    isPro: showProOnly ? true : undefined,
  });

  // Show skeleton immediately on filter/sort change, clear once data arrives
  useEffect(() => {
    if (!isFetching) {
      setTransitioning(false);
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    }
  }, [isFetching]);

  const triggerTransition = () => {
    setTransitioning(true);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    // Safety fallback — clear after 3s even if fetch hangs
    transitionTimer.current = setTimeout(() => setTransitioning(false), 3000);
  };

  const handleFilterChange = (value: string | undefined) => {
    triggerTransition();
    setActiveFilter(value);
    setPage(0);
  };

  const handleSortChange = (value: "recent" | "popular") => {
    triggerTransition();
    setSortBy(value);
    setPage(0);
  };

  const handlePageChange = (newPage: number) => {
    triggerTransition();
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim() || undefined;
    triggerTransition();
    setSearchQuery(q);
    setPage(0);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery(undefined);
    triggerTransition();
    setPage(0);
    searchInputRef.current?.focus();
  };

  const activeCategoryLabel = CATEGORY_FILTERS.find((f) => f.value === activeFilter)?.label ?? "All";
  const showSkeleton = isLoading || transitioning;
  const hasNext = !showSkeleton && (articles?.length ?? 0) >= LIMIT;
  const hasPrev = page > 0;

  const pageTitle = searchQuery
    ? `Search: "${searchQuery}"`
    : showProOnly
    ? '🏆 Exclusive Pro Articles'
    : activeFilter
    ? `${activeCategoryLabel} News`
    : "All Aviation News";

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-8">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">Flight Drama</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-[oklch(0.45_0_0)] mt-1">
            {showSkeleton ? "Loading…" : `${articles?.length ?? 0} stories${page > 0 ? ` · Page ${page + 1}` : ""}`}
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-5">
          <div className="flex items-center gap-2 bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg px-4 py-2.5 focus-within:border-[oklch(0.85_0.18_95)] transition-colors">
            <Search className="w-4 h-4 text-[oklch(0.45_0_0)] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search aviation news, incidents, airlines…"
              className="flex-1 bg-transparent text-sm text-white placeholder-[oklch(0.40_0_0)] outline-none"
            />
            {searchInput && (
              <button type="button" onClick={clearSearch} className="text-[oklch(0.40_0_0)] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="shrink-0 px-3 py-1 bg-[oklch(0.85_0.18_95)] text-black text-xs font-black rounded uppercase tracking-wide hover:bg-[oklch(0.78_0.18_95)] transition-colors"
            >
              Search
            </button>
          </div>
          {searchQuery && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-[oklch(0.50_0_0)]">Showing results for</span>
              <span className="text-xs font-bold text-[oklch(0.85_0.18_95)]">"{searchQuery}"</span>
              <button type="button" onClick={clearSearch} className="text-xs text-[oklch(0.45_0_0)] hover:text-white underline transition-colors">
                Clear
              </button>
            </div>
          )}
        </form>

        {/* Filters + sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Category pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => { handleFilterChange(f.value); setShowProOnly(false); }}
                className={`shrink-0 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors rounded ${
                  activeFilter === f.value && !showProOnly
                    ? "bg-[oklch(0.85_0.18_95)] text-black"
                    : "bg-[oklch(0.18_0_0)] text-[oklch(0.55_0_0)] hover:text-white hover:bg-[oklch(0.22_0_0)]"
                }`}
              >
                {f.label}
              </button>
            ))}
            {/* Pro Exclusive filter */}
            <button
              onClick={() => { triggerTransition(); setShowProOnly(p => !p); setActiveFilter(undefined); setPage(0); }}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors rounded border ${
                showProOnly
                  ? "text-[#a78bfa] border-[#a78bfa] bg-[#a78bfa]/10"
                  : "bg-[oklch(0.18_0_0)] text-[oklch(0.55_0_0)] border-transparent hover:text-[#a78bfa] hover:border-[#a78bfa]/40 hover:bg-[#a78bfa]/05"
              }`}
            >
              🏆 Exclusive
            </button>
          </div>
          {/* Sort buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {SORT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSortChange(opt.value as "recent" | "popular")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                    sortBy === opt.value
                      ? "bg-[oklch(0.85_0.18_95)] text-black"
                      : "bg-[oklch(0.18_0_0)] text-[oklch(0.55_0_0)] hover:text-white"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Article grid — skeleton or real */}
        {showSkeleton ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <ArticleSkeleton key={i} />
            ))}
          </div>
        ) : articles && articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {articles.map((a) => (
              <ArticleCard key={a.id} {...a} publishedAt={a.publishedAt} size="medium" />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            {/* Flight-themed no-results illustration */}
            <div className="relative inline-block mb-6">
              <div className="text-7xl opacity-20 select-none">✈</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-0.5 bg-[oklch(0.85_0.18_95)] opacity-60" style={{ transform: 'rotate(-30deg)' }} />
              </div>
            </div>
            <div className="inline-block mb-4 px-3 py-1 rounded font-mono text-[10px] border" style={{ backgroundColor: 'oklch(0.13 0 0)', borderColor: 'oklch(0.85 0.18 95 / 0.3)', color: 'oklch(0.85 0.18 95)' }}>
              SQUAWK 7600 · COMMS LOST · NO SIGNAL
            </div>
            <p className="font-black text-white text-xl mb-2">
              {searchQuery ? `No results for "${searchQuery}"` : 'No articles found'}
            </p>
            <p className="text-sm text-[oklch(0.45_0_0)] mb-6 max-w-sm mx-auto">
              {searchQuery
                ? 'ATC couldn\'t locate that flight. Try a different search term or browse by category.'
                : 'This airspace is clear. Try a different category or sort order.'}
            </p>
            {/* Suggested keywords */}
            {searchQuery && (
              <div className="mb-6">
                <p className="text-xs text-[oklch(0.40_0_0)] mb-3 uppercase tracking-widest font-bold">Try searching for</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Boeing 737', 'Ryanair', 'Emirates', 'Turbulence', 'Emergency landing', 'Pilot shortage', 'Air France', 'Delta Airlines'].map(kw => (
                    <button
                      key={kw}
                      onClick={() => { setSearchInput(kw); setSearchQuery(kw); triggerTransition(); setPage(0); }}
                      className="px-3 py-1.5 text-xs font-bold rounded border transition-colors hover:bg-[oklch(0.18_0_0)] hover:text-white"
                      style={{ borderColor: 'oklch(0.25 0 0)', color: 'oklch(0.55 0 0)' }}
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => { handleFilterChange(undefined); clearSearch(); }}
              className="text-sm font-bold text-[oklch(0.85_0.18_95)] hover:underline"
            >
              ← Clear all filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!showSkeleton && (hasPrev || hasNext) && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => handlePageChange(Math.max(0, page - 1))}
              disabled={!hasPrev}
              className="flex items-center gap-2 px-4 py-2 bg-[oklch(0.18_0_0)] text-sm font-bold rounded disabled:opacity-30 hover:bg-[oklch(0.22_0_0)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm text-[oklch(0.45_0_0)] font-bold">Page {page + 1}</span>
            <button
              onClick={() => handlePageChange(page + 1)}
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
