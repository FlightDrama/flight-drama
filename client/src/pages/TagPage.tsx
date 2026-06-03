import { useState } from "react";
import { useParams, Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { trpc } from "@/lib/trpc";
import { Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const LIMIT = 20;

// Convert slug back to a display tag (best-effort)
function slugToTag(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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

export default function TagPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(0);

  // Try to find the exact tag name from the allTags list
  const { data: allTags } = trpc.articles.allTags.useQuery();
  const matchedTag = allTags?.find((t) => t.slug === slug);
  const tagName = matchedTag?.tag ?? slugToTag(slug ?? "");

  const { data: articles, isLoading } = trpc.articles.byTag.useQuery(
    { tag: tagName, limit: LIMIT, offset: page * LIMIT },
    { enabled: !!tagName }
  );

  const hasNext = (articles?.length ?? 0) >= LIMIT;
  const hasPrev = page > 0;
  const articleCount = matchedTag?.count ?? articles?.length ?? 0;

  // noindex for thin tags (< 3 articles)
  const shouldNoIndex = articleCount < 3;

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      {shouldNoIndex && (
        <meta name="robots" content="noindex, follow" />
      )}
      <Navigation />
      <main className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[oklch(0.45_0_0)] mb-6">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/tags" className="hover:text-white transition-colors">Tags</Link>
          <span>/</span>
          <span className="text-[oklch(0.65_0_0)]">{tagName}</span>
        </div>

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">Tag</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">{tagName}</h1>
          <p className="text-sm text-[oklch(0.50_0_0)]">
            {isLoading ? "Loading…" : `${articleCount} article${articleCount !== 1 ? "s" : ""} tagged with "${tagName}"`}
          </p>
        </div>

        {/* Article grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ArticleSkeleton key={i} />)}
          </div>
        ) : articles && articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {articles.map((a: any) => (
              <ArticleCard key={a.id} {...a} publishedAt={a.publishedAt} size="medium" />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl opacity-20 mb-4">✈</div>
            <p className="font-black text-white text-xl mb-2">No articles found</p>
            <p className="text-sm text-[oklch(0.45_0_0)] mb-6">No articles are tagged with "{tagName}" yet.</p>
            <Link href="/tags" className="text-sm font-bold text-[oklch(0.85_0.18_95)] hover:underline">
              ← Browse all tags
            </Link>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && (hasPrev || hasNext) && (
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

        {/* Related tags */}
        {allTags && allTags.length > 1 && (
          <div className="mt-12 pt-8 border-t border-[oklch(0.18_0_0)]">
            <h2 className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)] mb-4">More Tags</h2>
            <div className="flex flex-wrap gap-2">
              {allTags
                .filter((t) => t.slug !== slug && t.count >= 2)
                .slice(0, 20)
                .map((t) => (
                  <Link
                    key={t.slug}
                    href={`/tag/${t.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded border transition-colors hover:bg-[oklch(0.18_0_0)] hover:text-white"
                    style={{ borderColor: "oklch(0.25 0 0)", color: "oklch(0.55 0 0)" }}
                  >
                    <Tag className="w-3 h-3" />
                    {t.tag}
                    <span className="text-[oklch(0.35_0_0)]">({t.count})</span>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
