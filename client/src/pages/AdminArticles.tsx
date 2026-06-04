import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { ArrowLeft, Trash2, Eye, Search, BarChart2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import ArticleStatsModal from "@/components/ArticleStatsModal";

export default function AdminArticles() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [statsArticle, setStatsArticle] = useState<any | null>(null);
  const LIMIT = 25;
  const utils = trpc.useUtils();
  const { data: articles, isLoading } = trpc.articles.list.useQuery({ limit: LIMIT, offset: page * LIMIT, search: search || undefined });
  const deleteArticle = trpc.articles.delete.useMutation({
    onSuccess: () => { utils.articles.list.invalidate(); toast.success("Article deleted"); },
    onError: (e) => toast.error(e.message),
  });

  if (user?.role !== "admin") return <div className="min-h-screen bg-[oklch(0.10_0_0)] flex items-center justify-center"><p className="text-white">Admin access required</p></div>;

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="text-[oklch(0.55_0_0)] hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /></Link>
          <nav className="text-xs text-[oklch(0.45_0_0)]"><Link href="/admin" className="hover:text-white">Dashboard</Link> / Articles</nav>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white">Article Management</h1>
          <span className="text-sm text-[oklch(0.45_0_0)]">{articles?.length ?? 0} articles</span>
        </div>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.45_0_0)]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search articles..." className="w-full bg-[oklch(0.15_0_0)] border border-[oklch(0.25_0_0)] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-[oklch(0.45_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)]" />
        </div>
        {/* Table */}
        <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[oklch(0.17_0_0)] text-xs font-black uppercase tracking-wider text-[oklch(0.45_0_0)]">
            <span className="col-span-5">Title</span>
            <span className="col-span-2">Category</span>
            <span className="col-span-2">Views</span>
            <span className="col-span-3">Actions</span>
          </div>
          {isLoading ? (
            Array.from({length:8}).map((_,i) => <div key={i} className="h-12 border-t border-[oklch(0.18_0_0)] animate-pulse bg-[oklch(0.14_0_0)]" />)
          ) : articles?.map(a => (
            <div key={a.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-[oklch(0.18_0_0)] items-center hover:bg-[oklch(0.15_0_0)] transition-colors">
              <div className="col-span-5">
                <p className="text-sm font-semibold text-white line-clamp-1">{a.title}</p>
                <p className="text-xs text-[oklch(0.40_0_0)]">{a.publishedAt ? formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true }) : ""}</p>
              </div>
              <div className="col-span-2"><span className="text-xs bg-[oklch(0.22_0_0)] px-2 py-0.5 rounded text-[oklch(0.65_0_0)]">{(a as any).categoryName ?? "—"}</span></div>
              <div className="col-span-2 text-sm text-[oklch(0.55_0_0)]">{a.views?.toLocaleString()}</div>
              <div className="col-span-3 flex items-center gap-1.5">
                {/* View Stats */}
                <button
                  onClick={() => setStatsArticle(a)}
                  className="p-1.5 rounded transition-colors hover:text-white"
                  style={{ backgroundColor: "oklch(0.20 0 0)", color: "oklch(0.85 0.18 95)" }}
                  title="View stats"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                </button>
                {/* View article */}
                <Link href={`/article/${a.slug}`} className="p-1.5 rounded bg-[oklch(0.20_0_0)] hover:bg-[oklch(0.25_0_0)] text-[oklch(0.55_0_0)] hover:text-white transition-colors" title="View article">
                  <Eye className="w-3.5 h-3.5" />
                </Link>
                {/* Delete */}
                <button
                  onClick={() => { if (confirm("Delete this article?")) deleteArticle.mutate({ id: a.id }); }}
                  className="p-1.5 rounded bg-[oklch(0.20_0_0)] hover:bg-red-500/20 text-[oklch(0.55_0_0)] hover:text-red-400 transition-colors"
                  title="Delete article"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage(p=>Math.max(0,p-1))} disabled={page===0} className="px-4 py-2 bg-[oklch(0.18_0_0)] text-sm font-bold rounded disabled:opacity-30 hover:bg-[oklch(0.22_0_0)]">← Previous</button>
          <span className="text-sm text-[oklch(0.50_0_0)]">Page {page+1}</span>
          <button onClick={() => setPage(p=>p+1)} disabled={(articles?.length??0)<LIMIT} className="px-4 py-2 bg-[oklch(0.18_0_0)] text-sm font-bold rounded disabled:opacity-30 hover:bg-[oklch(0.22_0_0)]">Next →</button>
        </div>
      </main>

      {/* Stats Modal */}
      {statsArticle && (
        <ArticleStatsModal
          article={{
            id: statsArticle.id,
            title: statsArticle.title,
            slug: statsArticle.slug,
            views: statsArticle.views ?? 0,
            publishedAt: statsArticle.publishedAt,
            categoryName: (statsArticle as any).categoryName,
            categoryColour: (statsArticle as any).categoryColour,
          }}
          onClose={() => setStatsArticle(null)}
        />
      )}
    </div>
  );
}
