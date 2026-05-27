import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, Plus, Send, Eye, Save, Trash2,
  CheckCircle, Clock, Users, Crown, RefreshCw
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

type View = "list" | "compose";

export default function AdminNewsletter() {
  const { user, isAuthenticated, loading } = useAuth();
  const [view, setView] = useState<View>("list");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Compose form state
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [selectedSponsorId, setSelectedSponsorId] = useState<number | null>(null);
  const [selectedArticleIds, setSelectedArticleIds] = useState<number[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState(user?.email ?? "");
  const [sendingTest, setSendingTest] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);

  const { data: editions, isLoading: editionsLoading, refetch: refetchEditions } =
    trpc.newsletter.editions.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });

  const { data: articles } = trpc.articles.list.useQuery({ limit: 50 }, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: sponsors } = trpc.sponsors.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: subCount } = trpc.newsletter.count.useQuery();

  const saveDraft = trpc.newsletter.saveDraft.useMutation({
    onSuccess: (data) => {
      toast.success("Draft saved ✈");
      setEditingId(data.id);
      if (data.previewHtml) setPreviewHtml(data.previewHtml);
      refetchEditions();
    },
    onError: (e) => toast.error(e.message),
  });

  const sendEdition = trpc.newsletter.sendEdition.useMutation({
    onSuccess: (data) => {
      if (data.test) {
        toast.success(`Test email sent to ${testEmail} ✈`);
        setSendingTest(false);
      } else {
        toast.success(`Newsletter sent to ${data.sent} subscribers! ✈`);
        setConfirmSend(false);
        setView("list");
        refetchEditions();
      }
    },
    onError: (e) => { toast.error(e.message); setSendingTest(false); setConfirmSend(false); },
  });

  const handleSaveDraft = () => {
    if (!subject.trim()) { toast.error("Subject is required"); return; }
    saveDraft.mutate({ id: editingId ?? undefined, subject, previewText, sponsorId: selectedSponsorId ?? undefined, articleIds: selectedArticleIds });
  };

  const handleNewEdition = () => {
    setEditingId(null); setSubject(""); setPreviewText(""); setSelectedSponsorId(null);
    setSelectedArticleIds([]); setPreviewHtml(null); setShowPreview(false); setConfirmSend(false);
    setView("compose");
  };

  const handleEditEdition = async (edition: any) => {
    setEditingId(edition.id);
    setSubject(edition.subject);
    setPreviewText(edition.previewText ?? "");
    setSelectedSponsorId(edition.sponsorId ?? null);
    setSelectedArticleIds(JSON.parse(edition.articleIds ?? "[]"));
    setPreviewHtml(edition.htmlContent ?? null);
    setShowPreview(false); setConfirmSend(false);
    setView("compose");
  };

  const toggleArticle = (id: number) => {
    setSelectedArticleIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  if (loading) return null;
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[oklch(0.10_0_0)]"><Navigation />
        <div className="container py-16 text-center"><p className="text-4xl mb-4">🔒</p><h1 className="text-2xl font-black text-white mb-2">Admin Only</h1></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            {view === "compose" ? (
              <button onClick={() => setView("list")} className="text-[oklch(0.55_0_0)] hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <Link href="/admin" className="text-[oklch(0.55_0_0)] hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-black text-white">
                {view === "compose" ? (editingId ? "Edit Edition" : "New Edition") : "Newsletter"}
              </h1>
              <p className="text-xs text-[oklch(0.50_0_0)]">
                {view === "list" ? `${subCount?.toLocaleString() ?? "—"} active subscribers` : "Compose and send your newsletter"}
              </p>
            </div>
          </div>
          {view === "list" && (
            <button onClick={handleNewEdition} className="flex items-center gap-2 bg-[oklch(0.85_0.18_95)] text-black font-black text-sm px-4 py-2 hover:bg-[oklch(0.78_0.18_95)] transition-colors">
              <Plus className="w-4 h-4" /> New Edition
            </button>
          )}
        </div>

        {/* ── List view ─────────────────────────────────────────────────────── */}
        {view === "list" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Active Subscribers", value: subCount?.toLocaleString() ?? "—", icon: Users, colour: "text-[oklch(0.85_0.18_95)]" },
                { label: "Editions Sent", value: editions?.filter((e: any) => e.status === "sent").length ?? "—", icon: Send, colour: "text-green-400" },
                { label: "Drafts", value: editions?.filter((e: any) => e.status === "draft").length ?? "—", icon: Clock, colour: "text-yellow-400" },
                { label: "Active Sponsors", value: sponsors?.filter((s: any) => s.isActive).length ?? "—", icon: Crown, colour: "text-blue-400" },
              ].map(({ label, value, icon: Icon, colour }) => (
                <div key={label} className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${colour}`} />
                    <span className="text-[10px] text-[oklch(0.50_0_0)] font-bold uppercase tracking-wide">{label}</span>
                  </div>
                  <p className={`text-2xl font-black ${colour}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Editions list */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-white">Newsletter Editions</h2>
              <button onClick={() => refetchEditions()} className="flex items-center gap-1.5 text-xs text-[oklch(0.50_0_0)] hover:text-white transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {editionsLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-[oklch(0.15_0_0)] rounded-lg animate-pulse" />)}</div>
            ) : editions && editions.length > 0 ? (
              <div className="space-y-3">
                {editions.map((edition: any) => (
                  <div key={edition.id} className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${edition.status === "sent" ? "bg-green-900/30" : "bg-yellow-900/30"}`}>
                      {edition.status === "sent" ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Clock className="w-5 h-5 text-yellow-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{edition.subject}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 uppercase ${edition.status === "sent" ? "bg-green-900/40 text-green-400" : "bg-yellow-900/40 text-yellow-400"}`}>
                          {edition.status}
                        </span>
                        {edition.status === "sent" && edition.recipientCount > 0 && (
                          <span className="text-[10px] text-[oklch(0.50_0_0)]">{edition.recipientCount.toLocaleString()} recipients</span>
                        )}
                        <span className="text-[10px] text-[oklch(0.40_0_0)]">
                          {edition.status === "sent" && edition.sentAt
                            ? `Sent ${formatDistanceToNow(new Date(edition.sentAt), { addSuffix: true })}`
                            : `Created ${formatDistanceToNow(new Date(edition.createdAt), { addSuffix: true })}`}
                        </span>
                      </div>
                    </div>
                    {edition.status === "draft" && (
                      <button onClick={() => handleEditEdition(edition)} className="text-xs text-[oklch(0.85_0.18_95)] font-bold hover:underline shrink-0">
                        Edit →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-[oklch(0.45_0_0)]">
                <p className="text-3xl mb-2">✉️</p>
                <p className="font-bold text-white mb-1">No editions yet</p>
                <p className="text-sm">Create your first newsletter edition above</p>
              </div>
            )}
          </>
        )}

        {/* ── Compose view ──────────────────────────────────────────────────── */}
        {view === "compose" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: form */}
            <div className="lg:col-span-2 space-y-5">
              {/* Subject + preview text */}
              <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-5">
                <h3 className="font-black text-white mb-4">Email Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[oklch(0.50_0_0)] mb-1.5">Subject Line *</label>
                    <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. This Week in Aviation — Delta Drama, Boeing Updates & More" className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[oklch(0.50_0_0)] mb-1.5">Preview Text <span className="normal-case text-[oklch(0.40_0_0)] font-normal">(shown in inbox preview)</span></label>
                    <input value={previewText} onChange={e => setPreviewText(e.target.value)} placeholder="e.g. Plus: the story behind the A350 wheel loss..." className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors" />
                  </div>
                </div>
              </div>

              {/* Sponsor */}
              <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-5">
                <h3 className="font-black text-white mb-3">Newsletter Sponsor <span className="text-[oklch(0.50_0_0)] font-normal text-sm">(optional)</span></h3>
                {sponsors && sponsors.length > 0 ? (
                  <div className="space-y-2">
                    <div
                      onClick={() => setSelectedSponsorId(null)}
                      className={`flex items-center gap-3 p-3 rounded cursor-pointer border transition-colors ${!selectedSponsorId ? "border-[oklch(0.85_0.18_95)] bg-[oklch(0.85_0.18_95)]/5" : "border-[oklch(0.22_0_0)] hover:border-[oklch(0.35_0_0)]"}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!selectedSponsorId ? "border-[oklch(0.85_0.18_95)]" : "border-[oklch(0.35_0_0)]"}`}>
                        {!selectedSponsorId && <div className="w-2 h-2 rounded-full bg-[oklch(0.85_0.18_95)]" />}
                      </div>
                      <span className="text-sm text-[oklch(0.65_0_0)]">No sponsor this edition</span>
                    </div>
                    {sponsors.map((sponsor: any) => (
                      <div
                        key={sponsor.id}
                        onClick={() => setSelectedSponsorId(sponsor.id)}
                        className={`flex items-center gap-3 p-3 rounded cursor-pointer border transition-colors ${selectedSponsorId === sponsor.id ? "border-[oklch(0.85_0.18_95)] bg-[oklch(0.85_0.18_95)]/5" : "border-[oklch(0.22_0_0)] hover:border-[oklch(0.35_0_0)]"}`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedSponsorId === sponsor.id ? "border-[oklch(0.85_0.18_95)]" : "border-[oklch(0.35_0_0)]"}`}>
                          {selectedSponsorId === sponsor.id && <div className="w-2 h-2 rounded-full bg-[oklch(0.85_0.18_95)]" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{sponsor.brandName}</p>
                          {sponsor.tagline && <p className="text-[11px] text-[oklch(0.50_0_0)]">{sponsor.tagline}</p>}
                        </div>
                        {sponsor.rateGbp && <span className="ml-auto text-xs text-[oklch(0.85_0.18_95)] font-bold">£{Number(sponsor.rateGbp).toFixed(0)}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[oklch(0.50_0_0)]">No sponsors set up yet. <Link href="/admin/media-kit" className="text-[oklch(0.85_0.18_95)] hover:underline">Add a sponsor →</Link></p>
                )}
              </div>

              {/* Article picker */}
              <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-white">Select Articles</h3>
                  <span className="text-xs text-[oklch(0.50_0_0)]">{selectedArticleIds.length} selected</span>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {articles?.map((article: any) => (
                    <div
                      key={article.id}
                      onClick={() => toggleArticle(article.id)}
                      className={`flex items-start gap-3 p-3 rounded cursor-pointer border transition-colors ${selectedArticleIds.includes(article.id) ? "border-[oklch(0.85_0.18_95)] bg-[oklch(0.85_0.18_95)]/5" : "border-[oklch(0.22_0_0)] hover:border-[oklch(0.35_0_0)]"}`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${selectedArticleIds.includes(article.id) ? "border-[oklch(0.85_0.18_95)] bg-[oklch(0.85_0.18_95)]" : "border-[oklch(0.35_0_0)]"}`}>
                        {selectedArticleIds.includes(article.id) && <span className="text-black text-[10px] font-black">✓</span>}
                      </div>
                      {article.featuredImage && <img src={article.featuredImage} alt="" className="w-12 h-10 object-cover rounded shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white leading-tight truncate">{article.title}</p>
                        <p className="text-[10px] text-[oklch(0.50_0_0)] mt-0.5">{article.views} views</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: actions + preview */}
            <div className="space-y-4">
              {/* Save + send actions */}
              <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-5 space-y-3">
                <h3 className="font-black text-white mb-1">Actions</h3>
                <button onClick={handleSaveDraft} disabled={saveDraft.isPending || !subject.trim()} className="w-full flex items-center justify-center gap-2 bg-[oklch(0.20_0_0)] border border-[oklch(0.30_0_0)] text-white font-bold text-sm py-2.5 hover:bg-[oklch(0.25_0_0)] transition-colors disabled:opacity-50">
                  {saveDraft.isPending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Draft
                </button>
                <button onClick={() => { handleSaveDraft(); setShowPreview(true); }} disabled={saveDraft.isPending || !subject.trim()} className="w-full flex items-center justify-center gap-2 bg-[oklch(0.20_0_0)] border border-[oklch(0.30_0_0)] text-white font-bold text-sm py-2.5 hover:bg-[oklch(0.25_0_0)] transition-colors disabled:opacity-50">
                  <Eye className="w-4 h-4" /> Preview Email
                </button>
                <hr className="border-[oklch(0.22_0_0)]" />
                {/* Test send */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[oklch(0.50_0_0)] mb-1.5">Test Email Address</label>
                  <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors mb-2" />
                  <button
                    onClick={async () => {
                      if (!editingId) { toast.error("Save draft first"); return; }
                      setSendingTest(true);
                      sendEdition.mutate({ id: editingId, testEmail });
                    }}
                    disabled={sendEdition.isPending || !editingId || !testEmail}
                    className="w-full flex items-center justify-center gap-2 bg-blue-800 text-white font-bold text-sm py-2.5 hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {sendingTest ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Test Email
                  </button>
                </div>
                <hr className="border-[oklch(0.22_0_0)]" />
                {/* Live send */}
                {!confirmSend ? (
                  <button
                    onClick={() => setConfirmSend(true)}
                    disabled={!editingId || !subject.trim() || selectedArticleIds.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-[oklch(0.85_0.18_95)] text-black font-black text-sm py-3 hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" /> Send to All Subscribers
                  </button>
                ) : (
                  <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3">
                    <p className="text-sm font-bold text-white mb-1">⚠️ Send to {subCount?.toLocaleString() ?? "all"} subscribers?</p>
                    <p className="text-xs text-[oklch(0.55_0_0)] mb-3">This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button onClick={() => { if (editingId) sendEdition.mutate({ id: editingId }); }} disabled={sendEdition.isPending} className="flex-1 bg-red-700 hover:bg-red-600 text-white font-black text-xs py-2 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                        {sendEdition.isPending ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Send Now
                      </button>
                      <button onClick={() => setConfirmSend(false)} className="flex-1 bg-[oklch(0.20_0_0)] text-white font-bold text-xs py-2 hover:bg-[oklch(0.25_0_0)] transition-colors">Cancel</button>
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-[oklch(0.35_0_0)] text-center">Save draft first, then send test before live send</p>
              </div>

              {/* Subscriber count */}
              <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-4 text-center">
                <Users className="w-6 h-6 text-[oklch(0.85_0.18_95)] mx-auto mb-1" />
                <p className="text-2xl font-black text-white">{subCount?.toLocaleString() ?? "—"}</p>
                <p className="text-xs text-[oklch(0.50_0_0)]">active subscribers</p>
              </div>
            </div>
          </div>
        )}

        {/* Preview modal */}
        {showPreview && previewHtml && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
            <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="bg-[oklch(0.13_0_0)] px-4 py-3 flex items-center justify-between border-b border-[oklch(0.22_0_0)]">
                <span className="font-black text-white text-sm">Email Preview</span>
                <button onClick={() => setShowPreview(false)} className="text-[oklch(0.50_0_0)] hover:text-white transition-colors text-lg">✕</button>
              </div>
              <iframe srcDoc={previewHtml} className="w-full" style={{ height: "70vh", border: "none" }} title="Email Preview" />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
