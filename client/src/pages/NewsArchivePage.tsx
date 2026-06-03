import { useState, useMemo } from "react";
import { Link, useSearch } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, Flame, Clock, TrendingUp } from "lucide-react";

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

export default function NewsArchivePage() {
  const searchStr = useSearch();
  const searchParams = new URLSearchParams(searchStr);
  const initialSort = (searchParams.get("sort") === "popular" ? "popular" : "recent") as "recent" | "popular";

  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"recent" | "popular">(initialSort);
  const [page, setPage] = useState(0);

  const { data: categories } = trpc.categories.list.useQuery();
  const categoryId = useMemo(() => {
    if (!activeFilter || !categories) return undefined;
    const cat = categories.find((c) => c.slug === activeFilter);
    return cat?.id;
  }, [activeFilter, categories]);

  const { data: articles, isLoading } = trpc.articles.list.useQuery({
    limit: LIMIT,
    offset: page * LIMIT,
    categoryId,
    sortBy,
  });

  const activeCategoryLabel = CATEGORY_FILTERS.find((f) => f.value === activeFilter)?.label ?? "All";
  const hasNext = (articles?.length ?? 0) >= LIMIT;
  const hasPrev = page > 0;

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
          <h1 className="text-3xl font-black text-white tracking-tight">
            {activeFilter ? `${activeCategoryLabel} News` : "All Aviation News"}
          </h1>
          <p className="text-sm text-[oklch(0.45_0_0)] mt-1">
            {articles?.length ?? 0} stories{page > 0 ? ` · Page ${page + 1}` : ""}
          </p>
        </div>

        {/* Filters + sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Category pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => { setActiveFilter(f.value); setPage(0); }}
                className={`shrink-0 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors rounded ${
                  activeFilter === f.value
                    ? "bg-[oklch(0.85_0.18_95)] text-black"
                    : "bg-[oklch(0.18_0_0)] text-[oklch(0.55_0_0)] hover:text-white hover:bg-[oklch(0.22_0_0)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* Sort buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {SORT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value as "recent" | "popular"); setPage(0); }}
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

        {/* Article grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-[oklch(0.15_0_0)] rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-[16/9] bg-[oklch(0.20_0_0)]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-[oklch(0.20_0_0)] rounded w-1/3" />
                  <div className="h-4 bg-[oklch(0.20_0_0)] rounded" />
                  <div className="h-4 bg-[oklch(0.20_0_0)] rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : articles && articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {articles.map((a) => (
              <ArticleCard key={a.id} {...a} publishedAt={a.publishedAt} size="medium" />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-[oklch(0.45_0_0)]">
            <p className="text-4xl mb-3">✈</p>
            <p className="font-bold">No articles found</p>
            <button onClick={() => { setActiveFilter(undefined); setPage(0); }} className="mt-3 text-sm text-[oklch(0.85_0.18_95)] hover:underline">
              Clear filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {(hasPrev || hasNext) && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => { setPage((p) => Math.max(0, p - 1)); window.scrollTo(0, 0); }}
              disabled={!hasPrev}
              className="flex items-center gap-2 px-4 py-2 bg-[oklch(0.18_0_0)] text-sm font-bold rounded disabled:opacity-30 hover:bg-[oklch(0.22_0_0)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm text-[oklch(0.45_0_0)] font-bold">Page {page + 1}</span>
            <button
              onClick={() => { setPage((p) => p + 1); window.scrollTo(0, 0); }}
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
