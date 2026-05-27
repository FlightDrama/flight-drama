import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import {
  MessageSquare, Users, Check, X, Clock, Download,
  ArrowLeft, Mail, Filter, Eye, RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Tab = "moderation" | "commenters";
type StatusFilter = "pending" | "approved" | "rejected" | "all";

function exportCSV(data: any[], filename: string) {
  if (!data.length) { toast.error("No data to export"); return; }
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const v = row[h];
      if (v === null || v === undefined) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${data.length} rows`);
}

export default function AdminComments() {
  const { user, isAuthenticated, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("moderation");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [marketingOnly, setMarketingOnly] = useState(false);

  const { data: comments, isLoading: commentsLoading, refetch: refetchComments } =
    trpc.comments.adminList.useQuery(
      { limit: 100, offset: 0, status: statusFilter },
      { enabled: isAuthenticated && user?.role === "admin" }
    );

  const { data: commenters, isLoading: commentersLoading, refetch: refetchCommenters } =
    trpc.comments.newsCommenters.useQuery(
      { limit: 200, offset: 0, marketingOnly },
      { enabled: isAuthenticated && user?.role === "admin" }
    );

  const moderate = trpc.comments.moderate.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.action === "approve" ? "Comment approved ✓" : "Comment rejected");
      refetchComments();
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return null;
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[oklch(0.10_0_0)]">
        <Navigation />
        <div className="container py-16 text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="text-2xl font-black text-white mb-2">Admin Only</h1>
          <Link href="/" className="text-[oklch(0.85_0.18_95)] hover:underline">← Back to News</Link>
        </div>
      </div>
    );
  }

  const pendingCount = comments?.filter(c => c.status === "pending").length ?? 0;

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-[oklch(0.55_0_0)] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Comments & Commenters</h1>
            <p className="text-xs text-[oklch(0.50_0_0)]">Moderate comments · Manage News Commenters CRM segment</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Pending Review", value: comments?.filter(c => c.status === "pending").length ?? "—", icon: Clock, colour: "text-yellow-400" },
            { label: "Approved", value: comments?.filter(c => c.status === "approved").length ?? "—", icon: Check, colour: "text-green-400" },
            { label: "Total Commenters", value: commenters?.length ?? "—", icon: Users, colour: "text-[oklch(0.85_0.18_95)]" },
            { label: "Marketing Opt-in", value: commenters?.filter((c: any) => c.marketingOptIn).length ?? "—", icon: Mail, colour: "text-blue-400" },
          ].map(({ label, value, icon: Icon, colour }) => (
            <div key={label} className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${colour}`} />
                <span className="text-xs text-[oklch(0.50_0_0)] font-bold uppercase tracking-wide">{label}</span>
              </div>
              <p className={`text-2xl font-black ${colour}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[oklch(0.22_0_0)]">
          {([
            { key: "moderation", label: "Moderation Queue", icon: MessageSquare },
            { key: "commenters", label: "News Commenters CRM", icon: Users },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
                tab === key
                  ? "border-[oklch(0.85_0.18_95)] text-[oklch(0.85_0.18_95)]"
                  : "border-transparent text-[oklch(0.50_0_0)] hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {key === "moderation" && pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Moderation Queue ─────────────────────────────────────────────── */}
        {tab === "moderation" && (
          <>
            {/* Filters */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <Filter className="w-4 h-4 text-[oklch(0.45_0_0)]" />
              {(["pending", "approved", "rejected", "all"] as StatusFilter[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                    statusFilter === s
                      ? "bg-[oklch(0.85_0.18_95)] text-black"
                      : "bg-[oklch(0.15_0_0)] border border-[oklch(0.25_0_0)] text-[oklch(0.60_0_0)] hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
              <button
                onClick={() => refetchComments()}
                className="ml-auto flex items-center gap-1.5 text-xs text-[oklch(0.50_0_0)] hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              {comments && comments.length > 0 && (
                <button
                  onClick={() => exportCSV(comments.map((c: any) => ({
                    id: c.id, status: c.status, author: c.userName, email: c.userEmail,
                    article: c.articleTitle, comment: c.content, date: c.createdAt,
                  })), `comments-${statusFilter}-${Date.now()}.csv`)}
                  className="flex items-center gap-1.5 text-xs text-[oklch(0.85_0.18_95)] hover:underline font-bold"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              )}
            </div>

            {commentsLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-[oklch(0.15_0_0)] rounded-lg animate-pulse" />)}
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment: any) => (
                  <div
                    key={comment.id}
                    className={`bg-[oklch(0.13_0_0)] border rounded-xl overflow-hidden ${
                      comment.status === "pending"
                        ? "border-yellow-700/40"
                        : comment.status === "approved"
                        ? "border-green-700/30"
                        : "border-red-700/30"
                    }`}
                  >
                    <div className="bg-[oklch(0.18_0_0)] px-4 py-2.5 flex items-center justify-between border-b border-[oklch(0.22_0_0)]">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center text-black font-black text-xs">
                          {(comment.userName ?? "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white">{comment.userName}</span>
                          <span className="text-xs text-[oklch(0.45_0_0)] ml-2">{comment.userEmail}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 uppercase ${
                          comment.status === "pending" ? "bg-yellow-900/40 text-yellow-400" :
                          comment.status === "approved" ? "bg-green-900/40 text-green-400" :
                          "bg-red-900/40 text-red-400"
                        }`}>
                          {comment.status}
                        </span>
                        <span className="text-[10px] text-[oklch(0.40_0_0)]">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs text-[oklch(0.85_0.18_95)] mb-1.5 font-bold">
                        On: <Link href={`/article/${comment.articleSlug}`} className="hover:underline">{comment.articleTitle}</Link>
                      </p>
                      <p className="text-sm text-[oklch(0.70_0_0)] leading-relaxed">{comment.content}</p>
                    </div>
                    {comment.status === "pending" && (
                      <div className="px-4 py-2.5 bg-[oklch(0.10_0_0)] border-t border-[oklch(0.18_0_0)] flex gap-2">
                        <button
                          onClick={() => moderate.mutate({ id: comment.id, action: "approve" })}
                          disabled={moderate.isPending}
                          className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 transition-colors disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => moderate.mutate({ id: comment.id, action: "reject" })}
                          disabled={moderate.isPending}
                          className="flex items-center gap-1.5 bg-red-900/50 hover:bg-red-800/50 text-red-400 text-xs font-bold px-3 py-1.5 transition-colors disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[oklch(0.45_0_0)]">
                <p className="text-3xl mb-2">💬</p>
                <p className="font-bold text-white mb-1">No {statusFilter === "all" ? "" : statusFilter} comments</p>
                <p className="text-sm">Comments will appear here once users start engaging with articles</p>
              </div>
            )}
          </>
        )}

        {/* ── News Commenters CRM ──────────────────────────────────────────── */}
        {tab === "commenters" && (
          <>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingOnly}
                  onChange={(e) => setMarketingOnly(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[oklch(0.85_0.18_95)]"
                />
                <span className="text-xs font-bold text-[oklch(0.65_0_0)]">Marketing opt-in only</span>
              </label>
              <button
                onClick={() => refetchCommenters()}
                className="flex items-center gap-1.5 text-xs text-[oklch(0.50_0_0)] hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              {commenters && commenters.length > 0 && (
                <button
                  onClick={() => exportCSV(
                    (commenters as any[]).map((c: any) => ({
                      name: c.name, email: c.email,
                      marketing_opt_in: c.marketingOptIn ? "Yes" : "No",
                      comment_count: c.commentCount,
                      first_comment: c.firstCommentAt,
                      last_comment: c.lastCommentAt,
                    })),
                    `news-commenters${marketingOnly ? "-marketing-opted-in" : ""}-${Date.now()}.csv`
                  )}
                  className="ml-auto flex items-center gap-1.5 text-xs text-[oklch(0.85_0.18_95)] hover:underline font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export {marketingOnly ? "Opted-in" : "All"} CSV
                </button>
              )}
            </div>

            <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden">
              <div className="grid grid-cols-5 bg-[oklch(0.18_0_0)] px-4 py-2.5 border-b border-[oklch(0.22_0_0)]">
                {["Name", "Email", "Comments", "Marketing Opt-in", "First Comment"].map(h => (
                  <p key={h} className="text-[10px] font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">{h}</p>
                ))}
              </div>
              {commentersLoading ? (
                <div className="p-4 space-y-2">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-[oklch(0.18_0_0)] rounded animate-pulse" />)}
                </div>
              ) : commenters && commenters.length > 0 ? (
                <div className="divide-y divide-[oklch(0.18_0_0)]">
                  {(commenters as any[]).map((c: any) => (
                    <div key={c.id} className="grid grid-cols-5 px-4 py-3 hover:bg-[oklch(0.15_0_0)] transition-colors">
                      <p className="text-sm font-bold text-white truncate">{c.name || "—"}</p>
                      <p className="text-xs text-[oklch(0.60_0_0)] truncate">{c.email || "—"}</p>
                      <p className="text-sm font-bold text-[oklch(0.85_0.18_95)]">{c.commentCount}</p>
                      <div>
                        {c.marketingOptIn ? (
                          <span className="text-[10px] bg-green-900/40 text-green-400 font-black px-2 py-0.5">✓ Opted In</span>
                        ) : (
                          <span className="text-[10px] text-[oklch(0.35_0_0)]">No</span>
                        )}
                      </div>
                      <p className="text-xs text-[oklch(0.45_0_0)]">
                        {formatDistanceToNow(new Date(c.firstCommentAt), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-[oklch(0.45_0_0)]">
                  <p className="text-3xl mb-2">👥</p>
                  <p className="font-bold text-white mb-1">No commenters yet</p>
                  <p className="text-sm">
                    {marketingOnly ? "No commenters have opted in to marketing yet" : "Commenters will appear here once users start commenting on articles"}
                  </p>
                </div>
              )}
            </div>

            {commenters && commenters.length > 0 && (
              <p className="text-xs text-[oklch(0.40_0_0)] mt-3">
                {(commenters as any[]).filter((c: any) => c.marketingOptIn).length} of {commenters.length} commenters have opted in to marketing communications.
                These can be exported and imported into your email marketing platform.
              </p>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
