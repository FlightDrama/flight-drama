import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import {
  ArrowLeft, CheckCircle, XCircle, Eye, Edit2, Zap, AlertTriangle,
  CheckCheck, X, Clock, BarChart2, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

function ArticleCard({ article, onApprove, onReject, isApproving, isRejecting }: {
  article: any;
  onApprove: (id: number, isBreaking: boolean) => void;
  onReject: (id: number) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isBreaking, setIsBreaking] = useState(article.isBreaking === 1);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{ backgroundColor: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Featured image — click to zoom */}
          {article.featuredImage && (
            <button
              onClick={() => setLightboxOpen(true)}
              className="relative shrink-0 group"
              title="Click to zoom"
            >
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors flex items-center justify-center">
                <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          )}

          {/* Lightbox */}
          {lightboxOpen && article.featuredImage && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
              onClick={() => setLightboxOpen(false)}
            >
              <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
                >
                  <X className="w-4 h-4" /> Close
                </button>
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full rounded-xl"
                />
                <p className="text-center text-white/60 text-xs mt-3 px-2">{article.title}</p>
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {article.categoryName && (
                <span
                  className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: (article.categoryColour ?? "#f5c518") + "20", color: article.categoryColour ?? "#f5c518" }}
                >
                  {article.categoryName}
                </span>
              )}
              <span className="text-[9px] text-[oklch(0.40_0_0)] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
              </span>
            </div>
            <h3 className="text-sm font-black text-white leading-snug mb-1">{article.title}</h3>
            {article.excerpt && (
              <p className="text-xs text-[oklch(0.55_0_0)] line-clamp-2">{article.excerpt}</p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {/* Breaking toggle */}
          <button
            onClick={() => setIsBreaking(b => !b)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition-colors"
            style={{
              backgroundColor: isBreaking ? "#ef444420" : "oklch(0.20 0 0)",
              color: isBreaking ? "#ef4444" : "oklch(0.50 0 0)",
              border: `1px solid ${isBreaking ? "#ef4444" : "oklch(0.28 0 0)"}`,
            }}
          >
            <AlertTriangle className="w-3 h-3" />
            {isBreaking ? "Breaking" : "Mark Breaking"}
          </button>

          {/* Expand/collapse */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-bold transition-colors hover:bg-[oklch(0.20_0_0)] text-[oklch(0.50_0_0)]"
          >
            <Eye className="w-3 h-3" />
            {expanded ? "Hide" : "Preview"}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <div className="flex-1" />

          {/* Reject */}
          <button
            onClick={() => onReject(article.id)}
            disabled={isRejecting || isApproving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-black transition-colors disabled:opacity-40"
            style={{ backgroundColor: "oklch(0.18 0 0)", color: "#ef4444", border: "1px solid #ef444440" }}
          >
            <XCircle className="w-3.5 h-3.5" />
            Reject
          </button>

          {/* Approve */}
          <button
            onClick={() => onApprove(article.id, isBreaking)}
            disabled={isApproving || isRejecting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-black transition-colors disabled:opacity-40"
            style={{ backgroundColor: "oklch(0.85 0.18 95)", color: "black" }}
          >
            {isApproving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            Approve & Publish
          </button>
        </div>
      </div>

      {/* Article preview — full site layout */}
      {expanded && (
        <div
          className="border-t"
          style={{ borderColor: "oklch(0.20 0 0)", backgroundColor: "oklch(0.10 0 0)" }}
        >
          {/* Featured image — full width, as it appears on the main site */}
          {article.featuredImage && (
            <div className="relative w-full" style={{ aspectRatio: '16/9', maxHeight: '480px', overflow: 'hidden' }}>
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              {/* Category badge overlay */}
              {article.categoryName && (
                <div className="absolute bottom-4 left-4">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded" style={{ background: 'oklch(0.85 0.18 95)', color: '#000' }}>
                    {article.categoryName}
                  </span>
                </div>
              )}
            </div>
          )}
          {/* Article headline */}
          <div className="px-6 pt-5 pb-2">
            <h1 className="text-2xl font-black text-white leading-tight mb-2">{article.title}</h1>
            {article.excerpt && (
              <p className="text-[oklch(0.60_0_0)] text-sm mb-3 leading-relaxed">{article.excerpt}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-[oklch(0.45_0_0)] pb-4 border-b" style={{ borderColor: 'oklch(0.18 0 0)' }}>
              <span>By {article.authorName || 'Flight Drama Autopilot'}</span>
              <span>·</span>
              <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-GB') : 'Draft'}</span>
              {article.isBreaking === 1 && <span className="text-red-400 font-bold">🚨 Breaking</span>}
            </div>
          </div>
          {/* Article body */}
          <div className="px-6 pb-6">
            <div
              className="article-prose text-sm max-w-none prose-invert"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAutopilot() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const { data: drafts, isLoading, refetch } = trpc.autopilot.drafts.useQuery();

  const approve = trpc.autopilot.approve.useMutation({
    onSuccess: () => {
      utils.autopilot.drafts.invalidate();
      utils.autopilot.draftCount.invalidate();
      toast.success("Article published!");
      setApprovingId(null);
    },
    onError: (e) => { toast.error(e.message); setApprovingId(null); },
  });

  const reject = trpc.autopilot.reject.useMutation({
    onSuccess: () => {
      utils.autopilot.drafts.invalidate();
      utils.autopilot.draftCount.invalidate();
      toast.success("Article rejected");
      setRejectingId(null);
    },
    onError: (e) => { toast.error(e.message); setRejectingId(null); },
  });

  const approveAll = trpc.autopilot.approveAll.useMutation({
    onSuccess: (data) => {
      utils.autopilot.drafts.invalidate();
      utils.autopilot.draftCount.invalidate();
      toast.success(`Published ${data.count} articles`);
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectAll = trpc.autopilot.rejectAll.useMutation({
    onSuccess: (data) => {
      utils.autopilot.drafts.invalidate();
      utils.autopilot.draftCount.invalidate();
      toast.success(`Rejected ${data.count} articles`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[oklch(0.10_0_0)]">
        <Navigation />
        <div className="container py-16 text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="text-2xl font-black text-white">Admin Access Required</h1>
        </div>
      </div>
    );
  }

  const draftCount = drafts?.length ?? 0;

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="text-[oklch(0.55_0_0)] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <nav className="text-xs text-[oklch(0.45_0_0)]">
            <Link href="/admin" className="hover:text-white">Dashboard</Link> / Autopilot Review
          </nav>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5" style={{ color: "oklch(0.85 0.18 95)" }} />
              <h1 className="text-2xl font-black text-white">Autopilot Review Queue</h1>
              {draftCount > 0 && (
                <span
                  className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "oklch(0.85 0.18 95)", color: "black" }}
                >
                  {draftCount}
                </span>
              )}
            </div>
            <p className="text-xs text-[oklch(0.45_0_0)]">
              Articles generated by the autopilot pipeline — review before publishing
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 rounded text-sm font-bold transition-colors hover:bg-[oklch(0.18_0_0)] text-[oklch(0.55_0_0)]"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Bulk actions */}
        {draftCount > 0 && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl border mb-6"
            style={{ backgroundColor: "oklch(0.15 0 0)", borderColor: "oklch(0.22 0 0)" }}
          >
            <BarChart2 className="w-4 h-4 text-[oklch(0.45_0_0)]" />
            <span className="text-sm text-[oklch(0.55_0_0)] flex-1">
              <strong className="text-white">{draftCount}</strong> article{draftCount !== 1 ? "s" : ""} awaiting review
            </span>
            <button
              onClick={() => {
                if (confirm(`Reject all ${draftCount} draft articles?`)) rejectAll.mutate();
              }}
              disabled={rejectAll.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-black transition-colors"
              style={{ backgroundColor: "oklch(0.18 0 0)", color: "#ef4444", border: "1px solid #ef444440" }}
            >
              <X className="w-3.5 h-3.5" />
              Reject All
            </button>
            <button
              onClick={() => {
                if (confirm(`Publish all ${draftCount} draft articles?`)) approveAll.mutate();
              }}
              disabled={approveAll.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-black transition-colors"
              style={{ backgroundColor: "oklch(0.85 0.18 95)", color: "black" }}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Approve All
            </button>
          </div>
        )}

        {/* Autopilot status info */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl border mb-6"
          style={{ backgroundColor: "oklch(0.13 0 0)", borderColor: "oklch(0.85 0.18 95 / 0.20)" }}
        >
          <Zap className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "oklch(0.85 0.18 95)" }} />
          <div>
            <p className="text-xs font-black text-white mb-1">Autopilot Pipeline — Active</p>
            <p className="text-xs text-[oklch(0.45_0_0)]">
              Running every 5 minutes on the cloud computer. Monitors 10 aviation RSS sources, scores stories, and generates articles using the Soyunci prompts via Claude Opus. All new articles land here for review before going live.
            </p>
          </div>
        </div>

        {/* Draft articles */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl animate-pulse" style={{ backgroundColor: "oklch(0.15 0 0)" }} />
            ))}
          </div>
        ) : draftCount === 0 ? (
          <div className="text-center py-20">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-[oklch(0.30_0_0)]" />
            <p className="text-lg font-black text-white mb-2">Queue is empty</p>
            <p className="text-sm text-[oklch(0.45_0_0)]">
              No articles awaiting review. The autopilot will add new ones every 5 minutes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts?.map((article: any) => (
              <ArticleCard
                key={article.id}
                article={article}
                isApproving={approvingId === article.id}
                isRejecting={rejectingId === article.id}
                onApprove={(id, isBreaking) => {
                  setApprovingId(id);
                  approve.mutate({ id, isBreaking });
                }}
                onReject={(id) => {
                  setRejectingId(id);
                  reject.mutate({ id });
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
