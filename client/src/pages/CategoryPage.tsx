import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import RunwayDivider from "@/components/RunwayDivider";
import { ArrowLeft, Filter } from "lucide-react";

const LIMIT = 18;

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(0);
  const [activeSlug, setActiveSlug] = useState<string | undefined>(slug);

  const { data: categories } = trpc.categories.list.useQuery();
  const activeCategory = categories?.find(c => c.slug === activeSlug);

  const { data: articles, isLoading } = trpc.articles.list.useQuery(
    { limit: LIMIT, offset: page * LIMIT, categoryId: activeCategory?.id },
    { enabled: !!activeCategory?.id }
  );

  // All articles (no category filter) for "All" tab
  const { data: allArticles, isLoading: allLoading } = trpc.articles.list.useQuery(
    { limit: LIMIT, offset: page * LIMIT },
    { enabled: !activeSlug }
  );

  const displayArticles = activeSlug ? articles : allArticles;
  const displayLoading = activeSlug ? isLoading : allLoading;

  const handleCategoryChange = (newSlug: string | undefined) => {
    setActiveSlug(newSlug);
    setPage(0);
  };

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
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-3.5 h-3.5 text-[oklch(0.50_0_0)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[oklch(0.50_0_0)]">Browse by Category</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* All button */}
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
            {/* Category buttons */}
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

        <RunwayDivider label={activeCategory?.name ?? "All Stories"} />

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
        ) : (
          <>
            {displayArticles && displayArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayArticles.map((a) => (
                  <ArticleCard key={a.id} {...a} publishedAt={a.publishedAt} size="medium" />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-[oklch(0.45_0_0)]">
                <p className="text-4xl mb-3">✈</p>
                <p className="font-bold text-white mb-1">No articles in this category yet</p>
                <p className="text-sm">Check back soon — new stories are added regularly</p>
              </div>
            )}

            {/* Pagination */}
            {displayArticles && displayArticles.length === LIMIT && (
              <div className="flex justify-center gap-3 mt-8">
                {page > 0 && (
                  <button
                    onClick={() => setPage(p => p - 1)}
                    className="px-5 py-2 bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] text-white font-bold text-sm hover:border-[oklch(0.85_0.18_95)]/40 transition-colors"
                  >
                    ← Previous
                  </button>
                )}
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="px-5 py-2 bg-[oklch(0.85_0.18_95)] text-black font-bold text-sm hover:bg-[oklch(0.78_0.18_95)] transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
