import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Eye, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function MostReadWidget() {
  const { data: articles, isLoading } = trpc.articles.mostRead.useQuery({ limit: 5 });

  return (
    <div className="bg-[oklch(0.12_0_0)] border border-[oklch(0.22_0_0)] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[oklch(0.18_0_0)] px-4 py-2.5 flex items-center gap-2 border-b border-[oklch(0.22_0_0)]">
        <Flame className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
        <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.65_0_0)]">
          Most Read
        </span>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-6 h-6 bg-[oklch(0.20_0_0)] rounded shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-[oklch(0.20_0_0)] rounded" />
                <div className="h-3 bg-[oklch(0.18_0_0)] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-[oklch(0.18_0_0)]">
          {articles?.map((article, i) => (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              className="flex items-start gap-3 px-4 py-3 hover:bg-[oklch(0.15_0_0)] transition-colors group"
            >
              {/* Rank number */}
              <div
                className={`shrink-0 w-6 h-6 flex items-center justify-center text-xs font-black ${
                  i === 0
                    ? "bg-[oklch(0.85_0.18_95)] text-black"
                    : "bg-[oklch(0.20_0_0)] text-[oklch(0.50_0_0)]"
                }`}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[oklch(0.80_0_0)] group-hover:text-white transition-colors line-clamp-2 leading-snug mb-1">
                  {article.title}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-[oklch(0.40_0_0)]">
                  {article.categoryName && (
                    <span className="text-[oklch(0.85_0.18_95)] font-bold uppercase tracking-wide">
                      {article.categoryName}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5">
                    <Eye className="w-2.5 h-2.5" />
                    {(article.views ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Footer link */}
      <div className="px-4 py-2.5 border-t border-[oklch(0.18_0_0)]">
        <Link
          href="/category/aviation-incidents"
          className="text-[10px] font-bold text-[oklch(0.85_0.18_95)] hover:underline flex items-center gap-1"
        >
          <TrendingUp className="w-3 h-3" /> View all trending stories →
        </Link>
      </div>
    </div>
  );
}
