import { useState, useMemo } from "react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Tag, Search } from "lucide-react";

export default function TagsIndexPage() {
  const { data: tags, isLoading } = trpc.articles.allTags.useQuery();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!tags) return [];
    const q = search.toLowerCase().trim();
    if (!q) return tags;
    return tags.filter((t) => t.tag.toLowerCase().includes(q));
  }, [tags, search]);

  // Group by first letter
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((t) => {
      const letter = t.tag.charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const totalArticles = useMemo(() => tags?.reduce((sum, t) => sum + t.count, 0) ?? 0, [tags]);
  const indexableTags = useMemo(() => tags?.filter((t) => t.count >= 3).length ?? 0, [tags]);

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-8 max-w-5xl">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">Flight Drama</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">All Aviation Tags</h1>
          <p className="text-sm text-[oklch(0.50_0_0)]">
            {isLoading ? "Loading…" : `${tags?.length ?? 0} tags across ${totalArticles} articles — ${indexableTags} tags with 3+ articles`}
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg px-4 py-2.5 mb-8 focus-within:border-[oklch(0.85_0.18_95)] transition-colors">
          <Search className="w-4 h-4 text-[oklch(0.45_0_0)] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter tags…"
            className="flex-1 bg-transparent text-sm text-white placeholder-[oklch(0.40_0_0)] outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-[oklch(0.40_0_0)] hover:text-white text-xs">✕</button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="h-12 bg-[oklch(0.15_0_0)] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[oklch(0.45_0_0)]">
            <Tag className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-white">No tags found</p>
            <p className="text-sm mt-1">No tags match "{search}"</p>
          </div>
        ) : search ? (
          // Flat list when searching
          <div className="flex flex-wrap gap-2">
            {filtered.map((t) => (
              <TagChip key={t.slug} tag={t.tag} count={t.count} slug={t.slug} />
            ))}
          </div>
        ) : (
          // Grouped by letter when browsing
          <div className="space-y-8">
            {grouped.map(([letter, letterTags]) => (
              <div key={letter}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-sm font-black"
                    style={{ backgroundColor: "oklch(0.85 0.18 95 / 0.15)", color: "oklch(0.85 0.18 95)" }}
                  >
                    {letter}
                  </div>
                  <div className="flex-1 h-px bg-[oklch(0.18_0_0)]" />
                  <span className="text-[10px] text-[oklch(0.35_0_0)]">{letterTags.length} tag{letterTags.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {letterTags.map((t) => (
                    <TagChip key={t.slug} tag={t.tag} count={t.count} slug={t.slug} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SEO note for thin tags */}
        {!search && tags && tags.filter((t) => t.count < 3).length > 0 && (
          <div className="mt-10 p-4 rounded-lg border text-sm" style={{ backgroundColor: "oklch(0.13 0 0)", borderColor: "oklch(0.20 0 0)" }}>
            <p className="text-[oklch(0.45_0_0)]">
              <span className="text-[oklch(0.65_0_0)] font-bold">Note:</span> Tags with fewer than 3 articles are shown here but are marked as{" "}
              <code className="text-[oklch(0.85_0.18_95)] text-xs">noindex</code> for search engines to avoid thin content penalties.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function TagChip({ tag, count, slug }: { tag: string; count: number; slug: string }) {
  const isThin = count < 3;
  return (
    <Link
      href={`/tag/${slug}`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded border transition-colors hover:text-white"
      style={{
        borderColor: isThin ? "oklch(0.22 0 0)" : "oklch(0.28 0 0)",
        color: isThin ? "oklch(0.40 0 0)" : "oklch(0.60 0 0)",
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = "oklch(0.18 0 0)";
        (e.currentTarget as HTMLElement).style.borderColor = isThin ? "oklch(0.28 0 0)" : "oklch(0.85 0.18 95 / 0.4)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
        (e.currentTarget as HTMLElement).style.borderColor = isThin ? "oklch(0.22 0 0)" : "oklch(0.28 0 0)";
      }}
    >
      <Tag className="w-3 h-3 shrink-0" />
      {tag}
      <span
        className="ml-0.5 px-1 py-0.5 rounded text-[9px] font-black"
        style={{
          backgroundColor: count >= 3 ? "oklch(0.85 0.18 95 / 0.15)" : "oklch(0.18 0 0)",
          color: count >= 3 ? "oklch(0.85 0.18 95)" : "oklch(0.40 0 0)",
        }}
      >
        {count}
      </span>
    </Link>
  );
}
