import { useState, useMemo } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import RunwayDivider from "@/components/RunwayDivider";
import { ArrowLeft, Filter, Search, X, ChevronDown } from "lucide-react";

const LIMIT = 100; // Fetch all, filter/sort client-side for instant UX

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [activeSlug, setActiveSlug] = useState<string | undefined>(slug);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { data: categories } = trpc.categories.list.useQuery();
  const activeCategory = categories?.find(c => c.slug === activeSlug);

  // Fetch articles for the selected category (or all)
  const { data: articles, isLoading } = trpc.articles.list.useQuery(
    { limit: LIMIT, offset: 0, categoryId: activeCategory?.id },
    { enabled: !activeSlug || !!activeCategory?.id }
  );

  const { data: allArticles, isLoading: allLoading } = trpc.articles.list.useQuery(
    { limit: LIMIT, offset: 0 },
    { enabled: !activeSlug }
  );

  const rawArticles = activeSlug ? (articles ?? []) : (allArticles ?? []);
  const displayLoading = activeSlug ? isLoading : allLoading;

  // Client-side search + sort
  const displayArticles = useMemo(() => {
    let result = [...rawArticles];
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.excerpt ?? "").toLowerCase().includes(q)
      );
    }
    // Sort
    if (sortBy === "popular") {
      result.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    } else {
      result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }
    return result;
  }, [rawArticles, searchQuery, sortBy]);

  const handleCategoryChange = (newSlug: string | undefined) => {
    setActiveSlug(newSlug);
    setSearchQuery("");
  };

  const SORT_LABELS = { newest: "Newest First", popular: "Most Popular" };

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0_0)] hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to News
        </Link>

        {/* Page header */}
        <div className="mb-6 accent-bar">
          <h1 className="text-3xl font-black text-white">
            {activeCategory?.name ?? (activeSlug ? slug : "All Aviation News")}
          </h1>
          {activeCategory?.description && (
            <p className="text-[oklch(0.55_0_0)] mt-1">{activeCategory.description}</p>
          )}
        </div>

        {/* Category filter bar */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-3.5 h-3.5 text-[oklch(0.50_0_0)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[oklch(0.50_0_0)]">Browse by Category</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange(undefined)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                !activeSlug
                  ? "bg-[oklch(0.85_0.18_95)] text-black"
                  : "bg-[oklch(0.15_0_0)] border border-[oklch(0.25_0_0)] text-[oklch(0.65_0_0)] hover:border-[oklch(0.85_0.18_95)]/40 hover:text-white"
              }`}
            >
              All
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.slug)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                  activeSlug === cat.slug
                    ? "bg-[oklch(0.85_0.18_95)] text-black"
                    : "bg-[oklch(0.15_0_0)] border border-[oklch(0.25_0_0)] text-[oklch(0.65_0_0)] hover:border-[oklch(0.85_0.18_95)]/40 hover:text-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search + Sort bar */}
        <div className="flex gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.45_0_0)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full bg-[oklch(0.15_0_0)] border border-[oklch(0.25_0_0)] rounded pl-9 pr-8 py-2 text-sm text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[oklch(0.45_0_0)] hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 bg-[oklch(0.15_0_0)] border border-[oklch(0.25_0_0)] px-3 py-2 text-sm text-[oklch(0.65_0_0)] hover:border-[oklch(0.85_0.18_95)]/40 hover:text-white transition-colors whitespace-nowrap"
            >
              {SORT_LABELS[sortBy]}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] z-20 min-w-[160px] shadow-xl">
                {(["newest", "popular"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSortBy(opt); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      sortBy === opt
                        ? "bg-[oklch(0.85_0.18_95)] text-black font-bold"
                        : "text-[oklch(0.65_0_0)] hover:bg-[oklch(0.22_0_0)] hover:text-white"
                    }`}
                  >
                    {SORT_LABELS[opt]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <RunwayDivider label={
          searchQuery
            ? `${displayArticles.length} result${displayArticles.length !== 1 ? "s" : ""} for "${searchQuery}"`
            : `${displayArticles.length} ${activeCategory?.name ?? "Aviation"} Stories`
        } />

        {/* Articles grid */}
        {displayLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[oklch(0.15_0_0)] rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-[16/9] bg-[oklch(0.20_0_0)]" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-[oklch(0.20_0_0)] rounded" />
                  <div className="h-4 bg-[oklch(0.20_0_0)] rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : displayArticles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayArticles.map((a) => (
              <ArticleCard key={a.id} {...a} publishedAt={a.publishedAt} size="medium" />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[oklch(0.45_0_0)]">
            <p className="text-4xl mb-3">✈</p>
            <p className="font-bold text-white mb-1">
              {searchQuery ? `No articles matching "${searchQuery}"` : "No articles in this category yet"}
            </p>
            <p className="text-sm">
              {searchQuery ? "Try a different search term" : "Check back soon — new stories are added regularly"}
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
