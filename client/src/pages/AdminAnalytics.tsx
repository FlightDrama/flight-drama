import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import {
  Eye, Users, FileText, MessageSquare, TrendingUp, Globe,
  ArrowLeft, RefreshCw, Crown, Mail, Clock, ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const LOCALE_NAMES: Record<string, string> = {
  de: "🇩🇪 German", es: "🇪🇸 Spanish", fr: "🇫🇷 French", pt: "🇧🇷 Portuguese", ar: "🇦🇪 Arabic",
};

const CHART_COLORS = ["#f5c518", "#3b82f6", "#f97316", "#10b981", "#8b5cf6", "#ec4899", "#14b8a6"];

function StatCard({ icon: Icon, label, value, sub, colour }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; colour?: string;
}) {
  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: (colour ?? "oklch(0.85 0.18 95)") + "20" }}>
          <Icon className="w-5 h-5" style={{ color: colour ?? "oklch(0.85 0.18 95)" }} />
        </div>
      </div>
      <p className="text-2xl font-black text-white mb-0.5">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-xs font-bold uppercase tracking-widest text-[oklch(0.45_0_0)]">{label}</p>
      {sub && <p className="text-xs text-[oklch(0.40_0_0)] mt-1">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-black uppercase tracking-widest text-[oklch(0.45_0_0)] mb-4 flex items-center gap-2">
      <span className="w-4 h-0.5 bg-[oklch(0.85_0.18_95)]" />
      {children}
    </h2>
  );
}

export default function AdminAnalytics() {
  const { user, isAuthenticated } = useAuth();
  const [topPeriod, setTopPeriod] = useState<"all" | "7d" | "30d">("30d");
  const [activeTab, setActiveTab] = useState<"overview" | "traffic" | "content" | "growth">("overview");

  const { data: overview, isLoading: overviewLoading, refetch } = trpc.analytics.overview.useQuery();
  const { data: topArticles, isLoading: topLoading } = trpc.analytics.topArticles.useQuery({ limit: 20, period: topPeriod });
  const { data: categoryData } = trpc.analytics.categoryBreakdown.useQuery();
  const { data: subscriberGrowth } = trpc.analytics.subscriberGrowth.useQuery();
  const { data: viewsTrend } = trpc.analytics.viewsTrend.useQuery();
  const { data: translationStats } = trpc.analytics.translationStats.useQuery();
  const { data: recentActivity } = trpc.analytics.recentActivity.useQuery();

  if (!isAuthenticated || (user as any)?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[oklch(0.10_0_0)]">
        <Navigation />
        <div className="container py-16 text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="text-2xl font-black text-white mb-2">Admin Access Required</h1>
          <Link href="/" className="text-[oklch(0.85_0.18_95)] hover:underline">← Back to Flight Drama</Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "content", label: "Content" },
    { id: "growth", label: "Growth" },
    { id: "traffic", label: "Live Traffic" },
  ] as const;

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-[oklch(0.45_0_0)] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white">Analytics</h1>
              <p className="text-xs text-[oklch(0.45_0_0)]">Flight Drama performance dashboard</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 rounded text-sm font-bold transition-colors hover:bg-[oklch(0.18_0_0)] text-[oklch(0.55_0_0)]"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[oklch(0.18_0_0)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2.5 text-sm font-bold transition-colors border-b-2 -mb-px"
              style={{
                borderColor: activeTab === tab.id ? "oklch(0.85 0.18 95)" : "transparent",
                color: activeTab === tab.id ? "oklch(0.85 0.18 95)" : "oklch(0.50 0 0)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* KPI Cards */}
            {overviewLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-xl border p-5 animate-pulse h-28" style={{ backgroundColor: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }} />
                ))}
              </div>
            ) : overview && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={FileText} label="Total Articles" value={overview.articles} colour="oklch(0.85 0.18 95)" />
                <StatCard icon={Eye} label="Total Views" value={overview.totalViews} colour="#3b82f6" />
                <StatCard icon={Mail} label="Subscribers" value={overview.subscribers} colour="#10b981" />
                <StatCard icon={Crown} label="Pro Members" value={overview.members} colour="#f97316" />
                <StatCard icon={Users} label="Registered Users" value={overview.users} colour="#8b5cf6" />
                <StatCard icon={MessageSquare} label="Comments" value={overview.comments} colour="#ec4899" />
                <StatCard icon={Globe} label="Translations" value={overview.translations} sub="Across 5 languages" colour="#14b8a6" />
                <StatCard icon={TrendingUp} label="Today's Views" value={overview.todayViews} colour="oklch(0.85 0.18 95)" />
              </div>
            )}

            {/* Recent Activity */}
            {recentActivity && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Articles */}
                <div className="rounded-xl border p-4" style={{ backgroundColor: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }}>
                  <SectionTitle>Recent Articles</SectionTitle>
                  <div className="space-y-3">
                    {recentActivity.recentArticles?.map((a: any) => (
                      <div key={a.id} className="flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[oklch(0.85_0.18_95)]" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{a.title}</p>
                          <p className="text-[10px] text-[oklch(0.40_0_0)]">{a.views} views · {formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Comments */}
                <div className="rounded-xl border p-4" style={{ backgroundColor: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }}>
                  <SectionTitle>Recent Comments</SectionTitle>
                  <div className="space-y-3">
                    {recentActivity.recentComments?.map((c: any, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[oklch(0.45_0_0)]" />
                        <div className="min-w-0">
                          <p className="text-xs text-[oklch(0.65_0_0)] truncate">"{c.content?.slice(0, 60)}..."</p>
                          <p className="text-[10px] text-[oklch(0.40_0_0)] truncate">on {c.articleTitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Subscribers */}
                <div className="rounded-xl border p-4" style={{ backgroundColor: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }}>
                  <SectionTitle>Recent Subscribers</SectionTitle>
                  <div className="space-y-3">
                    {recentActivity.recentSubscribers?.map((s: any, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#10b981]" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{s.email}</p>
                          <p className="text-[10px] text-[oklch(0.40_0_0)]">{formatDistanceToNow(new Date(s.subscribedAt), { addSuffix: true })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTENT TAB */}
        {activeTab === "content" && (
          <div className="space-y-8">
            {/* Top Articles */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <SectionTitle>Top Articles by Views</SectionTitle>
                <div className="flex gap-1">
                  {(["all", "30d", "7d"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setTopPeriod(p)}
                      className="px-3 py-1 text-xs font-bold rounded transition-colors"
                      style={{
                        backgroundColor: topPeriod === p ? "oklch(0.85 0.18 95)" : "oklch(0.18 0 0)",
                        color: topPeriod === p ? "black" : "oklch(0.55 0 0)",
                      }}
                    >
                      {p === "all" ? "All Time" : p === "30d" ? "30 Days" : "7 Days"}
                    </button>
                  ))}
                </div>
              </div>

              {topLoading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 rounded animate-pulse" style={{ backgroundColor: "oklch(0.15 0 0)" }} />)}</div>
              ) : (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.22 0 0)" }}>
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[oklch(0.35_0_0)] border-b" style={{ borderColor: "oklch(0.18 0 0)" }}>
                    <div className="col-span-1">#</div>
                    <div className="col-span-6">Article</div>
                    <div className="col-span-2 text-right">Views</div>
                    <div className="col-span-2 text-right">Comments</div>
                    <div className="col-span-1" />
                  </div>
                  {topArticles?.map((a: any, i: number) => (
                    <div key={a.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b items-center hover:bg-[oklch(0.15_0_0)] transition-colors" style={{ borderColor: "oklch(0.16 0 0)" }}>
                      <div className="col-span-1 text-sm font-black text-[oklch(0.40_0_0)]">{i + 1}</div>
                      <div className="col-span-6 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{a.title}</p>
                        {a.categoryName && (
                          <span className="text-[10px] font-black" style={{ color: a.categoryColour ?? "oklch(0.85 0.18 95)" }}>{a.categoryName}</span>
                        )}
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-sm font-black text-white">{Number(a.views).toLocaleString()}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-sm text-[oklch(0.50_0_0)]">{Number(a.commentCount)}</span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <a href={`/article/${a.slug}`} target="_blank" rel="noopener noreferrer" className="text-[oklch(0.40_0_0)] hover:text-[oklch(0.85_0.18_95)] transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            {categoryData && categoryData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl border p-4" style={{ backgroundColor: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }}>
                  <SectionTitle>Views by Category</SectionTitle>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0 0)" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "oklch(0.45 0 0)" }} />
                        <YAxis tick={{ fontSize: 10, fill: "oklch(0.45 0 0)" }} />
                        <Tooltip contentStyle={{ backgroundColor: "oklch(0.15 0 0)", border: "1px solid oklch(0.25 0 0)", borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="totalViews" radius={[4, 4, 0, 0]}>
                          {categoryData.map((entry: any, index: number) => (
                            <Cell key={index} fill={entry.colour ?? CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border p-4" style={{ backgroundColor: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }}>
                  <SectionTitle>Articles by Category</SectionTitle>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} dataKey="articleCount" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                          {categoryData.map((entry: any, index: number) => (
                            <Cell key={index} fill={entry.colour ?? CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "oklch(0.15 0 0)", border: "1px solid oklch(0.25 0 0)", borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Translation Stats */}
            {translationStats && translationStats.length > 0 && (
              <div className="rounded-xl border p-4" style={{ backgroundColor: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }}>
                <SectionTitle>Translations Published</SectionTitle>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {translationStats.map((t: any) => (
                    <div key={t.locale} className="text-center p-3 rounded-lg" style={{ backgroundColor: "oklch(0.18 0 0)" }}>
                      <p className="text-2xl mb-1">{LOCALE_NAMES[t.locale]?.split(" ")[0]}</p>
                      <p className="text-xl font-black text-white">{t.count}</p>
                      <p className="text-[10px] text-[oklch(0.45_0_0)]">{LOCALE_NAMES[t.locale]?.split(" ").slice(1).join(" ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* GROWTH TAB */}
        {activeTab === "growth" && (
          <div className="space-y-8">
            {/* Subscriber Growth Chart */}
            {subscriberGrowth && (
              <div className="rounded-xl border p-4" style={{ backgroundColor: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }}>
                <SectionTitle>Newsletter Subscriber Growth (Last 30 Days)</SectionTitle>
                {subscriberGrowth.length === 0 ? (
                  <p className="text-sm text-[oklch(0.45_0_0)] text-center py-8">No new subscribers in the last 30 days</p>
                ) : (
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={subscriberGrowth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0 0)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.45 0 0)" }} tickFormatter={d => d.slice(5)} />
                        <YAxis tick={{ fontSize: 10, fill: "oklch(0.45 0 0)" }} />
                        <Tooltip contentStyle={{ backgroundColor: "oklch(0.15 0 0)", border: "1px solid oklch(0.25 0 0)", borderRadius: 8, fontSize: 12 }} />
                        <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} name="New Subscribers" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Views Trend */}
            {viewsTrend && viewsTrend.length > 0 && (
              <div className="rounded-xl border p-4" style={{ backgroundColor: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }}>
                <SectionTitle>Article Publishing & Views (Last 30 Days)</SectionTitle>
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={viewsTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0 0)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.45 0 0)" }} tickFormatter={d => d.slice(5)} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "oklch(0.45 0 0)" }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "oklch(0.45 0 0)" }} />
                      <Tooltip contentStyle={{ backgroundColor: "oklch(0.15 0 0)", border: "1px solid oklch(0.25 0 0)", borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11, color: "oklch(0.55 0 0)" }} />
                      <Bar yAxisId="left" dataKey="articlesPublished" fill="oklch(0.85 0.18 95)" radius={[4, 4, 0, 0]} name="Articles Published" />
                      <Bar yAxisId="right" dataKey="totalViews" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Views" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LIVE TRAFFIC TAB — Umami embed */}
        {activeTab === "traffic" && (
          <div className="space-y-4">
            <div className="rounded-xl border p-4" style={{ backgroundColor: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }}>
              <SectionTitle>Live Traffic — Powered by Umami</SectionTitle>
              <p className="text-xs text-[oklch(0.45_0_0)] mb-4">
                Full traffic analytics including page views, unique visitors, referrers, countries, and devices.
              </p>
              <a
                href="https://manus-analytics.com/websites/2b006606-9186-4c14-8070-a1cb41dfc1ef"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded font-black text-sm transition-colors"
                style={{ backgroundColor: "oklch(0.85 0.18 95)", color: "black" }}
              >
                <ExternalLink className="w-4 h-4" />
                Open Umami Analytics Dashboard
              </a>
              <p className="text-xs text-[oklch(0.35_0_0)] mt-3">
                Website ID: 2b006606-9186-4c14-8070-a1cb41dfc1ef
              </p>
            </div>

            {/* Quick stats summary */}
            {overview && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Eye} label="Total Article Views" value={overview.totalViews} colour="#3b82f6" />
                <StatCard icon={FileText} label="Articles Published" value={overview.articles} colour="oklch(0.85 0.18 95)" />
                <StatCard icon={Eye} label="Today's Views" value={overview.todayViews} colour="#f97316" />
                <StatCard icon={Globe} label="Translated Articles" value={overview.translations} colour="#14b8a6" />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
