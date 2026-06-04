import { trpc } from "@/lib/trpc";
import { X, Eye, MessageSquare, Globe, Clock, ExternalLink, TrendingUp } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

interface Props {
  article: {
    id: number;
    title: string;
    slug: string;
    views: number;
    publishedAt: string | Date;
    categoryName?: string | null;
    categoryColour?: string | null;
  };
  onClose: () => void;
}

const LOCALE_NAMES: Record<string, { flag: string; name: string }> = {
  de: { flag: "🇩🇪", name: "German" },
  es: { flag: "🇪🇸", name: "Spanish" },
  fr: { flag: "🇫🇷", name: "French" },
  pt: { flag: "🇧🇷", name: "Portuguese" },
  ar: { flag: "🇦🇪", name: "Arabic" },
};

export default function ArticleStatsModal({ article, onClose }: Props) {
  const { data: articleStats, isLoading } = trpc.analytics.articleStats.useQuery({ articleId: article.id });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border overflow-hidden shadow-2xl"
        style={{ backgroundColor: "oklch(0.12 0 0)", borderColor: "oklch(0.22 0 0)", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div
          className="flex items-start gap-3 p-5 border-b sticky top-0 z-10"
          style={{ backgroundColor: "oklch(0.15 0 0)", borderColor: "oklch(0.22 0 0)" }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 shrink-0" style={{ color: "oklch(0.85 0.18 95)" }} />
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "oklch(0.85 0.18 95)" }}>
                Article Stats
              </p>
            </div>
            <h2 className="text-base font-black text-white leading-snug line-clamp-2">{article.title}</h2>
            <p className="text-xs text-[oklch(0.45_0_0)] mt-1">
              Published {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })} ·{" "}
              {format(new Date(article.publishedAt), "d MMM yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/article/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded transition-colors hover:bg-[oklch(0.22_0_0)] text-[oklch(0.45_0_0)] hover:text-white"
              title="View article"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded transition-colors hover:bg-[oklch(0.22_0_0)] text-[oklch(0.45_0_0)] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: "oklch(0.18 0 0)" }} />
              ))}
            </div>
          ) : articleStats ? (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "oklch(0.18 0 0)" }}>
                  <Eye className="w-5 h-5 mx-auto mb-1" style={{ color: "#3b82f6" }} />
                  <p className="text-2xl font-black text-white">{Number(article.views).toLocaleString()}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">Total Views</p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "oklch(0.18 0 0)" }}>
                  <MessageSquare className="w-5 h-5 mx-auto mb-1" style={{ color: "#10b981" }} />
                  <p className="text-2xl font-black text-white">{Number(articleStats.commentCount).toLocaleString()}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">Comments</p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "oklch(0.18 0 0)" }}>
                  <Globe className="w-5 h-5 mx-auto mb-1" style={{ color: "#14b8a6" }} />
                  <p className="text-2xl font-black text-white">{Number(articleStats.translationCount)}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">Translations</p>
                </div>
              </div>

              {/* Reading time + category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: "oklch(0.18 0 0)" }}>
                  <Clock className="w-5 h-5 shrink-0 text-[oklch(0.45_0_0)]" />
                  <div>
                    <p className="text-sm font-black text-white">{articleStats.readingTime} min read</p>
                    <p className="text-[10px] text-[oklch(0.45_0_0)]">Estimated reading time</p>
                  </div>
                </div>
                <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: "oklch(0.18 0 0)" }}>
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: article.categoryColour ?? "oklch(0.85 0.18 95)" }}
                  />
                  <div>
                    <p className="text-sm font-black text-white">{article.categoryName ?? "Uncategorised"}</p>
                    <p className="text-[10px] text-[oklch(0.45_0_0)]">Category</p>
                  </div>
                </div>
              </div>

              {/* View rank among all articles */}
              {articleStats.viewRank && (
                <div className="rounded-xl p-4" style={{ backgroundColor: "oklch(0.18 0 0)" }}>
                  <p className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)] mb-2">Performance Rank</p>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-3xl font-black"
                      style={{ color: articleStats.viewRank <= 10 ? "oklch(0.85 0.18 95)" : "white" }}
                    >
                      #{articleStats.viewRank}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {articleStats.viewRank <= 3 ? "🏆 Top 3 article!" :
                         articleStats.viewRank <= 10 ? "⭐ Top 10 article" :
                         articleStats.viewRank <= 25 ? "📈 Top 25 article" : "Article"}
                      </p>
                      <p className="text-xs text-[oklch(0.45_0_0)]">out of {articleStats.totalArticles} articles by views</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "oklch(0.25 0 0)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(5, 100 - ((articleStats.viewRank - 1) / articleStats.totalArticles) * 100)}%`,
                        backgroundColor: articleStats.viewRank <= 10 ? "oklch(0.85 0.18 95)" : "#3b82f6",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Available translations */}
              {articleStats.translations && articleStats.translations.length > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)] mb-3">Available Translations</p>
                  <div className="flex flex-wrap gap-2">
                    {articleStats.translations.map((t: { locale: string; slug: string }) => {
                      const cfg = LOCALE_NAMES[t.locale];
                      if (!cfg) return null;
                      return (
                        <a
                          key={t.locale}
                          href={`/${t.locale}/article/${t.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors hover:bg-[oklch(0.25_0_0)]"
                          style={{ backgroundColor: "oklch(0.20 0 0)", color: "oklch(0.65 0 0)" }}
                        >
                          {cfg.flag} {cfg.name}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top articles in same category for comparison */}
              {articleStats.categoryPeers && articleStats.categoryPeers.length > 1 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)] mb-3">
                    Views vs. Same Category
                  </p>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={articleStats.categoryPeers.slice(0, 8)}
                        margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0 0)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 9, fill: "oklch(0.45 0 0)" }} />
                        <YAxis
                          type="category"
                          dataKey="title"
                          width={120}
                          tick={{ fontSize: 9, fill: "oklch(0.45 0 0)" }}
                          tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + "…" : v}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: "oklch(0.15 0 0)", border: "1px solid oklch(0.25 0 0)", borderRadius: 8, fontSize: 11 }}
                          formatter={(v: number) => [v.toLocaleString(), "Views"]}
                        />
                        <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                          {articleStats.categoryPeers.slice(0, 8).map((entry: any, index: number) => (
                            <Cell
                              key={index}
                              fill={entry.id === article.id ? "oklch(0.85 0.18 95)" : "#3b82f6"}
                              opacity={entry.id === article.id ? 1 : 0.6}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-[oklch(0.35_0_0)] mt-1">Yellow bar = this article</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-[oklch(0.45_0_0)] text-center py-8">No stats available</p>
          )}
        </div>
      </div>
    </div>
  );
}
