/**
 * Flight Drama CMS — Content Management System
 * =============================================
 * Accessible at /cms-admin
 * Uses the existing custom email/password auth (customAuth.login)
 * and admin tRPC procedures already in the app.
 * Role check: user.role === 'admin'
 */

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";
import CmsAiTools from "./CmsAiTools";

// ── Types ─────────────────────────────────────────────────────────────────────────────
type View = "dashboard" | "articles" | "new-article" | "edit-article" | "categories" | "ai-tools" | "settings" | "error-log";

// ── Helpers ────────────────────────────────────────────────────────────────
function Badge({ children, colour = "yellow" }: { children: React.ReactNode; colour?: "yellow" | "green" | "red" | "blue" }) {
  const colours = {
    yellow: "bg-yellow-400/15 text-yellow-400",
    green: "bg-green-400/15 text-green-400",
    red: "bg-red-400/15 text-red-400",
    blue: "bg-blue-400/15 text-blue-400",
  };
  return <span className={`text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded ${colours[colour]}`}>{children}</span>;
}

// ── Login Screen ───────────────────────────────────────────────────────────
function CmsLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const loginMutation = trpc.customAuth.login.useMutation({
    onSuccess: () => { onLogin(); },
    onError: (e) => setError(e.message),
  });

  const handleLogin = () => {
    setError("");
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-black mb-1">
            <span className="text-[#F5C518]">FLIGHT</span>DRAMA
          </div>
          <div className="text-sm text-gray-500">Content Management System</div>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Sign In</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full bg-[#0d0d0d] border border-[#333] text-white px-3 py-2 rounded focus:outline-none focus:border-[#F5C518] transition-colors"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full bg-[#0d0d0d] border border-[#333] text-white px-3 py-2 rounded focus:outline-none focus:border-[#F5C518] transition-colors"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loginMutation.isPending}
              className="w-full bg-[#F5C518] text-black font-black py-2.5 rounded hover:bg-[#e0b015] transition-colors disabled:opacity-50"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function CmsDashboard({ onNavigate }: { onNavigate: (v: View, id?: number) => void }) {
  const { data: articles } = trpc.articles.list.useQuery({ limit: 5, sortBy: 'recent' });
  const { data: allArticles } = trpc.articles.list.useQuery({ limit: 100 });

  const quickLinks = [
    { label: "✍ New Article", view: "new-article" as View, colour: "bg-[#F5C518] text-black" },
    { label: "📋 All Articles", view: "articles" as View, colour: "bg-[#1a1a1a] text-white border border-[#333]" },
    { label: "✨ AI Tools", view: "ai-tools" as View, colour: "bg-[#1a1a1a] text-white border border-[#333]" },
    { label: "🏷 Categories", view: "categories" as View, colour: "bg-[#1a1a1a] text-white border border-[#333]" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-black text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {quickLinks.map(({ label, view, colour }) => (
          <button key={view} onClick={() => onNavigate(view)} className={`${colour} font-bold py-3 rounded-lg text-sm transition-colors hover:opacity-90`}>
            {label}
          </button>
        ))}
      </div>
      <div className="bg-[#111] border border-[#222] rounded-xl p-4 mb-6">
        <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-3">Stats</div>
        <div className="grid grid-cols-2 gap-4">
          <div><div className="text-2xl font-black text-white">{allArticles?.length ?? 0}</div><div className="text-xs text-gray-500">Articles</div></div>
          <div><div className="text-2xl font-black text-[#F5C518]">{allArticles?.reduce((s, a) => s + (a.views ?? 0), 0)?.toLocaleString() ?? 0}</div><div className="text-xs text-gray-500">Total Views</div></div>
        </div>
      </div>
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="text-xs text-gray-500 font-bold uppercase tracking-wide px-4 py-3 border-b border-[#222]">Recent Articles</div>
        {articles?.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] hover:bg-[#161616] cursor-pointer" onClick={() => onNavigate("edit-article", a.id)}>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">{a.title}</div>
              <div className="text-xs text-gray-600">{formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true })}</div>
            </div>
            <div className="text-xs text-gray-500 mx-4">{a.views} views</div>
            <button onClick={() => onNavigate("edit-article", a.id)} className="text-xs text-[#F5C518] hover:underline">Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Articles List ──────────────────────────────────────────────────────────
function CmsArticlesList({ onEdit, onNew }: { onEdit: (id: number) => void; onNew: () => void }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [showBulkCategory, setShowBulkCategory] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState<number | "">("");
  const LIMIT = 20;
  const { data, refetch } = trpc.articles.list.useQuery({ limit: LIMIT, offset: page * LIMIT, search: search || undefined });
  const { data: categories } = trpc.categories.list.useQuery();
  const deleteMutation = trpc.articles.delete.useMutation({ onSuccess: () => refetch() });
  const duplicateMutation = trpc.articles.duplicate.useMutation({
    onSuccess: (data) => {
      toast.success(`Article duplicated as draft ✈ — click Edit to open it`);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const bulkMutation = trpc.articles.bulkUpdate.useMutation({
    onSuccess: (res) => {
      toast.success(`✈ ${res.affected} article${res.affected !== 1 ? 's' : ''} updated`);
      setSelected(new Set());
      setBulkAction("");
      setShowBulkCategory(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const previewMutation = trpc.articles.generatePreviewLink.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}${data.previewUrl}`;
      navigator.clipboard.writeText(url).then(() => toast.success('Preview link copied! 🔗'));
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === (data?.length ?? 0)) setSelected(new Set());
    else setSelected(new Set(data?.map(a => a.id) ?? []));
  };

  const applyBulkAction = () => {
    if (!bulkAction || selected.size === 0) return;
    const ids = Array.from(selected);
    if (bulkAction === 'delete') {
      if (!confirm(`Delete ${ids.length} article${ids.length !== 1 ? 's' : ''}? This cannot be undone.`)) return;
      bulkMutation.mutate({ ids, action: 'delete' });
      return;
    }
    if (bulkAction === 'setCategory') {
      setShowBulkCategory(true);
      return;
    }
    bulkMutation.mutate({ ids, action: bulkAction as any });
  };

  const statusBadge = (a: any) => {
    if (a.status === 'scheduled') return <span className="text-[10px] font-bold bg-blue-400/15 text-blue-400 px-1.5 py-0.5 rounded">🗓 Scheduled</span>;
    if (a.status === 'draft') return <span className="text-[10px] font-bold bg-gray-400/15 text-gray-400 px-1.5 py-0.5 rounded">Draft</span>;
    return <span className="text-[10px] font-bold bg-green-400/15 text-green-400 px-1.5 py-0.5 rounded">✓ Live</span>;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Articles</h1>
        <button onClick={onNew} className="bg-[#F5C518] text-black font-black px-4 py-2 rounded text-sm hover:bg-[#e0b015] transition-colors">
          + New Article
        </button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="w-full bg-[#111] border border-[#333] text-white px-3 py-2 rounded focus:outline-none focus:border-[#F5C518] transition-colors"
        />
      </div>

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-[#F5C518]/10 border border-[#F5C518]/30 rounded-lg px-4 py-2 flex-wrap">
          <span className="text-sm text-[#F5C518] font-bold">{selected.size} selected</span>
          <select
            value={bulkAction}
            onChange={(e) => { setBulkAction(e.target.value); setShowBulkCategory(false); }}
            className="bg-[#111] border border-[#333] text-white px-2 py-1 rounded text-sm focus:outline-none focus:border-[#F5C518]"
          >
            <option value="">Choose action...</option>
            <option value="setFeatured">⭐ Set as Featured</option>
            <option value="unsetFeatured">Remove Featured</option>
            <option value="setBreaking">🔴 Set as Breaking</option>
            <option value="unsetBreaking">Remove Breaking</option>
            <option value="setCategory">🏷 Change Category</option>
            <option value="delete">🗑 Delete selected</option>
          </select>
          {bulkAction === 'setCategory' && showBulkCategory && (
            <select
              value={bulkCategoryId}
              onChange={(e) => setBulkCategoryId(e.target.value ? Number(e.target.value) : "")}
              className="bg-[#111] border border-[#333] text-white px-2 py-1 rounded text-sm focus:outline-none focus:border-[#F5C518]"
            >
              <option value="">Select category...</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <button
            onClick={() => {
              if (bulkAction === 'setCategory' && showBulkCategory && bulkCategoryId) {
                bulkMutation.mutate({ ids: Array.from(selected), action: 'setCategory', categoryId: Number(bulkCategoryId) });
              } else {
                applyBulkAction();
              }
            }}
            disabled={!bulkAction || bulkMutation.isPending}
            className="bg-[#F5C518] text-black font-bold px-3 py-1 rounded text-sm hover:bg-[#e0b015] disabled:opacity-50 transition-colors"
          >
            {bulkMutation.isPending ? 'Working...' : 'Apply'}
          </button>
          <button onClick={() => { setSelected(new Set()); setBulkAction(""); setShowBulkCategory(false); }} className="text-gray-500 text-xs hover:text-white ml-auto">✕ Clear</button>
        </div>
      )}

      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#222] text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={selected.size === (data?.length ?? 0) && (data?.length ?? 0) > 0}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 accent-yellow-400"
                />
              </th>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Published</th>
              <th className="text-left px-4 py-3">Views</th>
              <th className="text-left px-4 py-3">Flags</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((a) => (
              <tr key={a.id} className={`border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors ${selected.has(a.id) ? 'bg-[#F5C518]/5' : ''}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} className="w-3.5 h-3.5 accent-yellow-400" />
                </td>
                <td className="px-4 py-3">
                  <div className="font-bold text-white truncate max-w-xs">{a.title}</div>
                  <div className="text-xs text-gray-600 truncate max-w-xs">{a.slug}</div>
                </td>
                <td className="px-4 py-3">{statusBadge(a)}</td>
                <td className="px-4 py-3">
                  {a.categoryName && <Badge colour="yellow">{a.categoryName}</Badge>}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true })}
                </td>
                <td className="px-4 py-3 text-gray-400">{a.views}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {a.isBreaking && <Badge colour="red">Breaking</Badge>}
                    {a.isFeatured && <Badge colour="green">Featured</Badge>}
                    {a.isPro && <Badge colour="yellow">Pro</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => onEdit(a.id)} className="text-[#F5C518] text-xs hover:underline mr-3">Edit</button>
                  <button
                    onClick={() => previewMutation.mutate({ id: a.id })}
                    disabled={previewMutation.isPending}
                    className="text-blue-400 text-xs hover:underline mr-3"
                    title="Generate a secret preview link to share this article for review"
                  >
                    {previewMutation.isPending ? '...' : '🔗 Preview'}
                  </button>
                  <button
                    onClick={() => duplicateMutation.mutate({ id: a.id })}
                    disabled={duplicateMutation.isPending}
                    className="text-purple-400 text-xs hover:underline mr-3"
                    title="Duplicate as draft"
                  >
                    {duplicateMutation.isPending ? '...' : '📄 Dupe'}
                  </button>
                  <button onClick={() => { if (confirm(`Delete "${a.title}"? This cannot be undone.`)) deleteMutation.mutate({ id: a.id }); }} className="text-red-400 text-xs hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#222]">
          <span className="text-xs text-gray-500">{data?.length ?? 0} articles{selected.size > 0 ? ` — ${selected.size} selected` : ''}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="text-xs text-gray-500 hover:text-white disabled:opacity-30">← Prev</button>
            <span className="text-xs text-gray-500">Page {page + 1}</span>
            <button onClick={() => setPage(page + 1)} disabled={(data?.length ?? 0) < LIMIT} className="text-xs text-gray-500 hover:text-white disabled:opacity-30">Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Revision History Panel ───────────────────────────────────────────────
type RevisionItem = { id: number; title: string; content?: string; excerpt?: string; featuredImage?: string; savedAt: string; savedByName?: string };

function RevisionHistoryPanel({ articleId, onRestore, onClose }: {
  articleId: number;
  onRestore: (rev: RevisionItem) => void;
  onClose: () => void;
}) {
  const { data: revisions, isLoading } = trpc.articles.revisions.useQuery({ articleId });
  const utils = trpc.useUtils();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleRestore = async (rev: RevisionItem) => {
    setLoadingId(rev.id);
    try {
      const full = await utils.articles.revisionContent.fetch({ revisionId: rev.id });
      onRestore(full as RevisionItem);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="mt-6 bg-[#111] border border-[#F5C518]/30 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
        <div className="text-sm font-bold text-white">📜 Revision History</div>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-xs">✕ Close</button>
      </div>
      <div className="p-4">
        {isLoading && <p className="text-gray-500 text-sm">Loading revisions...</p>}
        {!isLoading && (!revisions || revisions.length === 0) && (
          <p className="text-gray-500 text-sm">No revisions saved yet. Revisions are created automatically each time you save.</p>
        )}
        {revisions && revisions.length > 0 && (
          <div className="space-y-2">
            {revisions.map((rev: RevisionItem) => (
              <div key={rev.id} className="flex items-center justify-between bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{rev.title}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(rev.savedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {rev.savedByName && <span className="ml-2 text-gray-600">by {rev.savedByName}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(rev)}
                  disabled={loadingId === rev.id}
                  className="ml-3 text-xs bg-[#F5C518] text-black font-bold px-2 py-1 rounded hover:bg-[#e0b015] transition-colors disabled:opacity-50 shrink-0"
                >
                  {loadingId === rev.id ? '...' : 'Restore'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI SEO Button ──────────────────────────────────────────────────────────
type SeoResult = { metaTitle: string; metaDescription: string; focusKeyword: string; suggestedTags: string[] };

function AiSeoButton({ title, content, excerpt, onGenerated }: {
  title: string;
  content: string;
  excerpt: string;
  onGenerated: (seo: SeoResult) => void;
}) {
  const generateSEO = trpc.aiTools.generateSEO.useMutation({
    onSuccess: (data) => onGenerated(data as SeoResult),
    onError: (e: any) => toast.error("SEO generation failed: " + e.message),
  });

  return (
    <button
      type="button"
      onClick={() => {
        if (!title && !content) { toast.error("Add a title and some content first"); return; }
        generateSEO.mutate({ title, content, excerpt });
      }}
      disabled={generateSEO.isPending}
      className="ml-auto text-[10px] bg-[#F5C518]/10 text-[#F5C518] hover:bg-[#F5C518]/20 font-bold px-2 py-0.5 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
      title="Auto-generate SEO meta title, description, and focus keyword using AI"
    >
      {generateSEO.isPending ? <><span className="animate-spin">✈</span> Generating...</> : "✨ AI Generate"}
    </button>
  );
}

// ── Tags Autocomplete ──────────────────────────────────────────────────────
function TagsInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: allTags } = trpc.articles.tagSuggestions.useQuery();
  const [inputVal, setInputVal] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const currentTags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];

  const suggestions = allTags?.filter(t =>
    inputVal.length > 0 &&
    t.toLowerCase().includes(inputVal.toLowerCase()) &&
    !currentTags.map(ct => ct.toLowerCase()).includes(t.toLowerCase())
  ).slice(0, 8) ?? [];

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (currentTags.map(t => t.toLowerCase()).includes(trimmed.toLowerCase())) return;
    const newTags = [...currentTags, trimmed];
    onChange(newTags.join(', '));
    setInputVal("");
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(currentTags.filter(t => t !== tag).join(', '));
  };

  return (
    <div className="relative">
      {/* Tag chips */}
      {currentTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {currentTags.map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-[#F5C518]/15 text-[#F5C518] text-xs px-2 py-0.5 rounded font-bold">
              #{tag}
              <button onClick={() => removeTag(tag)} className="text-[#F5C518]/60 hover:text-[#F5C518] ml-0.5">×</button>
            </span>
          ))}
        </div>
      )}
      {/* Input */}
      <input
        type="text"
        value={inputVal}
        onChange={(e) => { setInputVal(e.target.value); setShowSuggestions(true); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(inputVal); }
          if (e.key === 'Backspace' && !inputVal && currentTags.length > 0) removeTag(currentTags[currentTags.length - 1]);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        className="w-full bg-[#0d0d0d] border border-[#333] text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:border-[#F5C518]"
        placeholder={currentTags.length > 0 ? "Add more tags..." : "Type a tag and press Enter..."}
      />
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl overflow-hidden">
          {suggestions.map(tag => (
            <button
              key={tag}
              onMouseDown={(e) => { e.preventDefault(); addTag(tag); }}
              className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-[#F5C518]/10 hover:text-[#F5C518] transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
      <p className="text-[10px] text-gray-600 mt-1">Press Enter or comma to add a tag. Click × to remove.</p>
    </div>
  );
}

// ── Article Editor ─────────────────────────────────────────────────────────
function CmsArticleEditor({ articleId, onSaved, onBack }: { articleId: number | null; onSaved: () => void; onBack: () => void }) {
  const isNew = articleId === null;
  const { data: article } = trpc.articles.bySlug.useQuery(
    { slug: "__cms_id_" + articleId },
    { enabled: false } // We'll use a different approach
  );
  const { data: articleData } = trpc.articles.list.useQuery(
    { limit: 1, offset: 0 },
    { enabled: false }
  );
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: authors } = trpc.authors.list.useQuery();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [authorId, setAuthorId] = useState<number | "">("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [isBreaking, setIsBreaking] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [tags, setTags] = useState("");
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().slice(0, 16));
  const [isDraft, setIsDraft] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const AUTOSAVE_KEY = `fd_cms_autosave_${articleId ?? 'new'}`;
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [featuredImageUploading, setFeaturedImageUploading] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);
  const [featuredImageDragging, setFeaturedImageDragging] = useState(false);

  // ── Auto-save to localStorage every 30 seconds ────────────────────────────────
  useEffect(() => {
    if (!title && !content) return; // Don't save empty drafts
    const timer = setInterval(() => {
      try {
        const draft = { title, slug, excerpt, content, categoryId, authorId, featuredImage, isBreaking, isFeatured, isPro, tags, publishedAt, metaTitle, metaDescription, metaKeywords, savedAt: new Date().toISOString() };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch {}
    }, 30000);
    return () => clearInterval(timer);
  }, [title, slug, excerpt, content, categoryId, authorId, featuredImage, isBreaking, isFeatured, isPro, tags, publishedAt, metaTitle, metaDescription, metaKeywords, AUTOSAVE_KEY]);

  // Restore auto-saved draft on mount (new articles only)
  useEffect(() => {
    if (isNew && !loaded) {
      const savedDraft = localStorage.getItem(AUTOSAVE_KEY);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          const savedTime = new Date(draft.savedAt);
          const minutesAgo = Math.round((Date.now() - savedTime.getTime()) / 60000);
          // Only restore if saved within the last 24 hours
          if (minutesAgo < 1440) {
            const restore = window.confirm(`A draft was auto-saved ${minutesAgo < 1 ? 'just now' : minutesAgo + ' minutes ago'}. Restore it?`);
            if (restore) {
              setTitle(draft.title || '');
              setSlug(draft.slug || '');
              setExcerpt(draft.excerpt || '');
              setContent(draft.content || '');
              setCategoryId(draft.categoryId || '');
              setAuthorId(draft.authorId || '');
              setFeaturedImage(draft.featuredImage || '');
              setIsBreaking(draft.isBreaking || false);
              setIsFeatured(draft.isFeatured || false);
              setIsPro(draft.isPro || false);
              setTags(draft.tags || '');
              setPublishedAt(draft.publishedAt || new Date().toISOString().slice(0, 16));
              setMetaTitle(draft.metaTitle || '');
              setMetaDescription(draft.metaDescription || '');
              setMetaKeywords(draft.metaKeywords || '');
              toast.success('Draft restored ✈');
            }
          }
        } catch {}
      }
    }
  }, [isNew, loaded, AUTOSAVE_KEY]);

  // Clear auto-save on successful publish
  const clearAutoSave = () => {
    try { localStorage.removeItem(AUTOSAVE_KEY); } catch {}
  };

  // ── Slug availability checker (debounced 600ms) ───────────────────────────
  const slugCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!slug || slug.length < 3) { setSlugStatus('idle'); return; }
    setSlugStatus('checking');
    if (slugCheckRef.current) clearTimeout(slugCheckRef.current);
    slugCheckRef.current = setTimeout(async () => {
      try {
        const result = await utils.articles.checkSlug.fetch({ slug, excludeId: articleId ?? undefined });
        setSlugStatus(result.available ? 'available' : 'taken');
      } catch { setSlugStatus('idle'); }
    }, 600);
    return () => { if (slugCheckRef.current) clearTimeout(slugCheckRef.current); };
  }, [slug, articleId]);

  // ── Featured image upload handler ────────────────────────────────────────
  const handleFeaturedImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    setFeaturedImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/cms/upload-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setFeaturedImage(data.url);
        toast.success('Featured image uploaded ✈');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setFeaturedImageUploading(false);
    }
  };

  // Load AI-generated article from sessionStorage (when coming from AI Tools)
  useEffect(() => {
    if (isNew && !loaded) {
      const stored = sessionStorage.getItem('fd_cms_generated_article');
      if (stored) {
        try {
          const gen = JSON.parse(stored);
          setTitle(gen.title || '');
          setExcerpt(gen.excerpt || '');
          setContent(gen.content || '');
          setMetaTitle(gen.metaTitle || '');
          setMetaDescription(gen.metaDescription || '');
          if (gen.suggestedTags) setTags(gen.suggestedTags.join(', '));
          if (gen.featuredImage) setFeaturedImage(gen.featuredImage);
          // Auto-generate slug from title
          if (gen.title) setSlug(gen.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80));
          sessionStorage.removeItem('fd_cms_generated_article');
          toast.success('AI-generated article loaded into editor ✈');
        } catch {}
      }
    }
  }, [isNew, loaded]);

  // Load existing article data
  const { data: existingArticles } = trpc.articles.list.useQuery({ limit: 100 });
  useEffect(() => {
    if (!isNew && existingArticles && !loaded) {
      const a = existingArticles.find(x => x.id === articleId);
      if (a) {
        setTitle(a.title);
        setSlug(a.slug);
        setExcerpt(a.excerpt ?? "");
        setFeaturedImage(a.featuredImage ?? "");
        setIsBreaking(!!a.isBreaking);
        setIsFeatured(!!a.isFeatured);
        setIsPro(!!a.isPro);
        setCategoryId(a.categoryId ?? "");
        setAuthorId(a.authorId ?? "");
        setPublishedAt(new Date(a.publishedAt).toISOString().slice(0, 16));
        setLoaded(true);
      }
    }
  }, [existingArticles, articleId, isNew, loaded]);

  // Load full article content separately
  const { data: fullArticle } = trpc.articles.bySlug.useQuery(
    { slug: existingArticles?.find(x => x.id === articleId)?.slug ?? "" },
    { enabled: !isNew && !!existingArticles?.find(x => x.id === articleId)?.slug && !content }
  );
  useEffect(() => {
    if (fullArticle?.articles?.content && !content) {
      setContent(fullArticle.articles.content);
    }
  }, [fullArticle, content]);

  const createMutation = trpc.articles.create.useMutation({
    onSuccess: () => { clearAutoSave(); toast.success("Article published ✈"); onSaved(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => { clearAutoSave(); toast.success('Article saved ✈'); onSaved(); },
    onError: (e) => toast.error(e.message),
  });

  const autoSlug = (t: string) => {
    if (isNew) setSlug(t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80));
  };

  const handleSave = (asDraft = false, asScheduled = false) => {
    if (!title || !slug || !content) { toast.error("Title, slug, and content are required"); return; }
    const payload = {
      title, slug, excerpt: excerpt || undefined,
      content, categoryId: categoryId || undefined,
      authorId: authorId || undefined,
      featuredImage: featuredImage || undefined,
      isBreaking: asDraft ? false : isBreaking,
      isFeatured: asDraft ? false : isFeatured,
      isPro,
      tags: tags ? JSON.stringify(tags.split(",").map(t => t.trim()).filter(Boolean)) : undefined,
      publishedAt: publishedAt.replace("T", " "),
    };
    if (isNew) {
      createMutation.mutate(payload, {
        onSuccess: () => { clearAutoSave(); toast.success(asDraft ? "Saved as draft ✈" : "Article published ✈"); onSaved(); }
      });
    } else {
      updateMutation.mutate({ id: articleId!, ...payload }, {
        onSuccess: () => { clearAutoSave(); toast.success(asDraft ? "Saved as draft ✈" : "Article saved ✈"); onSaved(); }
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in inputs/textareas (except the TipTap editor)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT') return;
      if (target.tagName === 'TEXTAREA' && !target.closest('.cms-editor-content')) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlOrCmd && e.key === 's') {
        e.preventDefault();
        if (!isPending && title && slug && content) {
          toast.info('⌨ Ctrl+S — Saving...');
          // Trigger save via button click to avoid stale closure
          document.querySelector<HTMLButtonElement>('[data-cms-save]')?.click();
        }
      } else if (ctrlOrCmd && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowPreview(p => !p);
        toast.info('⌨ Ctrl+Shift+P — Preview toggled');
      } else if (ctrlOrCmd && e.key === 'd') {
        e.preventDefault();
        if (!isPending && title && slug && content) {
          toast.info('⌨ Ctrl+D — Saved as draft');
          document.querySelector<HTMLButtonElement>('[data-cms-draft]')?.click();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPending, title, slug, content]);

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-white text-sm transition-colors">← Articles</button>
        <h1 className="text-2xl font-black text-white">{isNew ? "New Article" : "Edit Article"}</h1>
        <div className="hidden md:flex items-center gap-1 text-[10px] text-gray-600 ml-2">
          <span className="bg-[#1a1a1a] border border-[#2a2a2a] px-1.5 py-0.5 rounded font-mono">Ctrl+S</span>
          <span>save</span>
          <span className="bg-[#1a1a1a] border border-[#2a2a2a] px-1.5 py-0.5 rounded font-mono ml-2">Ctrl+D</span>
          <span>draft</span>
          <span className="bg-[#1a1a1a] border border-[#2a2a2a] px-1.5 py-0.5 rounded font-mono ml-2">Ctrl+⇧+P</span>
          <span>preview</span>
        </div>
        {content && (() => {
          const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          const words = text.split(' ').filter(Boolean).length;
          const readTime = Math.max(1, Math.round(words / 200));
          return (
            <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
              <span className="bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-1 rounded">{words.toLocaleString()} words</span>
              <span className="bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-1 rounded">{readTime} min read</span>
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main */}
        <div className="col-span-2 space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); autoSlug(e.target.value); }}
              className="w-full bg-[#111] border border-[#333] text-white text-lg font-bold px-3 py-2.5 rounded focus:outline-none focus:border-[#F5C518] transition-colors"
              placeholder="Article title..."
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1">Slug *</label>
            <div className="relative">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-'))}
                className={`w-full bg-[#111] border text-white px-3 py-2 pr-8 rounded focus:outline-none transition-colors font-mono text-sm ${
                  slugStatus === 'taken' ? 'border-red-500 focus:border-red-500' :
                  slugStatus === 'available' ? 'border-green-500 focus:border-green-500' :
                  'border-[#333] focus:border-[#F5C518]'
                }`}
                placeholder="article-slug"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">
                {slugStatus === 'checking' && <span className="text-gray-500 animate-pulse">...</span>}
                {slugStatus === 'available' && <span className="text-green-400" title="Slug is available">✓</span>}
                {slugStatus === 'taken' && <span className="text-red-400" title="Slug already in use">✗</span>}
              </div>
            </div>
            {slugStatus === 'taken' && (
              <p className="text-xs text-red-400 mt-1">⚠ This slug is already used by another article. Please choose a different one.</p>
            )}
            {slugStatus === 'available' && (
              <p className="text-xs text-green-400 mt-1">✓ Slug is available</p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full bg-[#111] border border-[#333] text-white px-3 py-2 rounded focus:outline-none focus:border-[#F5C518] transition-colors resize-none"
              placeholder="Brief summary..."
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1">Content *</label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Start writing your article... (drag & drop images, use the toolbar for formatting)"
              minHeight={500}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Publish */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">Publish</div>
              {autoSaveStatus === 'saved' && (
                <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                  Draft saved
                </span>
              )}
              {autoSaveStatus === 'idle' && title && (
                <span className="text-[10px] text-gray-600">Auto-saves every 30s</span>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Published Date</label>
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-[#333] text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:border-[#F5C518]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  data-cms-save
                  onClick={() => handleSave(false)}
                  disabled={isPending}
                  className="flex-1 bg-[#F5C518] text-black font-black py-2 rounded hover:bg-[#e0b015] transition-colors disabled:opacity-50 text-sm"
                  title="Save (Ctrl+S)"
                >
                  {isPending ? "Saving..." : isNew ? "Publish ✈" : "Save"}
                </button>
                <button
                  data-cms-draft
                  onClick={() => handleSave(true)}
                  disabled={isPending}
                  className="flex-1 bg-[#1a1a1a] border border-[#333] text-gray-400 font-bold py-2 rounded hover:text-white hover:border-[#555] transition-colors disabled:opacity-50 text-sm"
                  title="Save as Draft (Ctrl+D)"
                >
                  Save Draft
                </button>
              </div>
              <button
                onClick={() => setShowSchedule(!showSchedule)}
                className={`w-full border font-bold py-2 rounded transition-colors text-sm ${
                  showSchedule ? 'bg-[#F5C518]/10 border-[#F5C518]/30 text-[#F5C518]' : 'bg-[#0d0d0d] border-[#333] text-gray-400 hover:text-white hover:border-[#555]'
                }`}
              >
                🗓 {scheduledAt ? `Scheduled: ${new Date(scheduledAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}` : 'Schedule for Later'}
              </button>
              {showSchedule && (
                <div className="bg-[#0d0d0d] border border-[#F5C518]/20 rounded-lg p-3 space-y-2">
                  <label className="text-xs text-gray-500 font-bold block">Publish automatically at:</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full bg-[#111] border border-[#333] text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:border-[#F5C518]"
                  />
                  {scheduledAt && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { handleSave(false, true); setShowSchedule(false); }}
                        disabled={isPending}
                        className="flex-1 bg-blue-600 text-white font-bold py-1.5 rounded text-xs hover:bg-blue-500 transition-colors disabled:opacity-50"
                      >
                        {isPending ? 'Scheduling...' : '🗓 Schedule'}
                      </button>
                      <button onClick={() => { setScheduledAt(''); setShowSchedule(false); }} className="text-gray-500 text-xs hover:text-white px-2">✕ Clear</button>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-600">The article will publish automatically at the set time. The site must be published for scheduling to work.</p>
                </div>
              )}
              {!isNew && (
                <button
                  onClick={() => setShowRevisions(!showRevisions)}
                  className={`w-full border font-bold py-2 rounded transition-colors text-sm ${
                    showRevisions ? 'bg-[#F5C518]/10 border-[#F5C518]/30 text-[#F5C518]' : 'bg-[#0d0d0d] border-[#333] text-gray-400 hover:text-white hover:border-[#555]'
                  }`}
                >
                  📜 Revision History
                </button>
              )}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full bg-[#0d0d0d] border border-[#333] text-gray-400 font-bold py-2 rounded hover:text-white hover:border-[#555] transition-colors text-sm"
              >
                {showPreview ? "Hide Preview" : "👁 Live Preview"}
              </button>
            </div>
          </div>

          {/* Category & Author */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-3">Category & Author</div>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-[#0d0d0d] border border-[#333] text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:border-[#F5C518]"
                >
                  <option value="">— Select —</option>
                  {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Author</label>
                <select
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-[#0d0d0d] border border-[#333] text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:border-[#F5C518]"
                >
                  <option value="">— Select —</option>
                  {authors?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">Featured Image</div>
              {featuredImage && (
                <button onClick={() => setFeaturedImage('')} className="text-[10px] text-red-400 hover:text-red-300">✕ Remove</button>
              )}
            </div>
            {/* Drag-and-drop zone */}
            <div
              className={`relative border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                featuredImageDragging ? 'border-[#F5C518] bg-[#F5C518]/5' : 'border-[#333] hover:border-[#555]'
              }`}
              style={{ minHeight: featuredImage ? 0 : 80 }}
              onClick={() => featuredImageInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setFeaturedImageDragging(true); }}
              onDragLeave={() => setFeaturedImageDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setFeaturedImageDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFeaturedImageUpload(file);
              }}
            >
              {featuredImage ? (
                <div className="relative">
                  <img src={featuredImage} alt="" className="w-full rounded-lg object-cover" style={{ maxHeight: 140 }} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🗂 Click or drag to replace</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-5 text-center">
                  {featuredImageUploading ? (
                    <><span className="text-[#F5C518] text-xl animate-spin">✈</span><span className="text-xs text-gray-500 mt-2">Uploading...</span></>
                  ) : (
                    <><span className="text-2xl">🖼</span><span className="text-xs text-gray-500 mt-1">Drag & drop or click to upload</span><span className="text-[10px] text-gray-600">JPG, PNG, WebP — max 10MB</span></>
                  )}
                </div>
              )}
            </div>
            <input
              ref={featuredImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFeaturedImageUpload(f); e.target.value = ''; }}
            />
            {/* URL input as fallback */}
            <input
              type="text"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#222] text-gray-600 px-2 py-1.5 rounded text-xs focus:outline-none focus:border-[#F5C518] font-mono mt-2"
              placeholder="Or paste image URL directly..."
            />
          </div>

          {/* Options */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-3">Options</div>
            <div className="space-y-2">
              {[
                { label: "Breaking News", value: isBreaking, set: setIsBreaking },
                { label: "Featured Article", value: isFeatured, set: setIsFeatured },
                { label: "Pro Only", value: isPro, set: setIsPro },
              ].map(({ label, value, set }) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => set(e.target.checked)}
                    className="w-4 h-4 accent-yellow-400"
                  />
                  <span className="text-sm text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2">Tags</div>
            <TagsInput value={tags} onChange={setTags} />
          </div>

          {/* SEO Metadata */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">SEO</div>
              <span className="text-[10px] bg-green-400/15 text-green-400 px-1.5 py-0.5 rounded font-bold">Search Rankings</span>
              <AiSeoButton
                title={title}
                content={content}
                excerpt={excerpt}
                onGenerated={(seo) => {
                  setMetaTitle(seo.metaTitle);
                  setMetaDescription(seo.metaDescription);
                  setMetaKeywords(seo.focusKeyword);
                  if (seo.suggestedTags?.length > 0) {
                    setTags(prev => {
                      const existing = prev ? prev.split(',').map(t => t.trim()).filter(Boolean) : [];
                      const newTags = seo.suggestedTags.filter((t: string) => !existing.includes(t));
                      return [...existing, ...newTags].join(', ');
                    });
                  }
                  toast.success('✨ SEO metadata generated ✈');
                }}
              />
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Meta Title <span className="text-gray-600">({metaTitle.length}/60)</span></label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value.slice(0, 160))}
                  className={`w-full bg-[#0d0d0d] border text-white px-2 py-1.5 rounded text-sm focus:outline-none transition-colors ${metaTitle.length > 60 ? 'border-red-500' : 'border-[#333] focus:border-[#F5C518]'}`}
                  placeholder={title || "Article title for search engines"}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Meta Description <span className="text-gray-600">({metaDescription.length}/160)</span></label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value.slice(0, 320))}
                  rows={2}
                  className={`w-full bg-[#0d0d0d] border text-white px-2 py-1.5 rounded text-sm focus:outline-none transition-colors resize-none ${metaDescription.length > 160 ? 'border-orange-500' : 'border-[#333] focus:border-[#F5C518]'}`}
                  placeholder={excerpt || "Description for search results"}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Focus Keywords</label>
                <input
                  type="text"
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-[#333] text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:border-[#F5C518]"
                  placeholder="aviation, Boeing, safety"
                />
              </div>
              {/* Google preview */}
              {(metaTitle || title) && (
                <div className="mt-2 p-2 bg-white rounded text-left">
                  <div className="text-[13px] text-blue-700 font-medium truncate">{metaTitle || title}</div>
                  <div className="text-[11px] text-green-700 truncate">flightdrama.com/article/{slug}</div>
                  <div className="text-[12px] text-gray-600 line-clamp-2 mt-0.5">{metaDescription || excerpt || "No description set"}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revision History Panel */}
      {!isNew && showRevisions && (
        <RevisionHistoryPanel
          articleId={articleId!}
          onRestore={(rev) => {
            setTitle(rev.title);
            setContent(rev.content || '');
            setExcerpt(rev.excerpt || '');
            setFeaturedImage(rev.featuredImage || '');
            setShowRevisions(false);
            toast.success('Revision restored ✈ — remember to save to keep these changes');
          }}
          onClose={() => setShowRevisions(false)}
        />
      )}

      {/* Live Preview Panel */}
      {showPreview && (
        <div className="mt-6 bg-[#111] border border-[#222] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
            <div className="text-sm font-bold text-white">Live Preview — How this article will look on flightdrama.com</div>
            <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-white text-xs">✕ Close</button>
          </div>
          <div className="p-6 bg-[#0a0a0a]">
            {featuredImage && (
              <img src={featuredImage} alt={title} className="w-full max-h-80 object-cover rounded-lg mb-6" />
            )}
            <h1 className="text-3xl font-black text-white mb-3 leading-tight">{title || "Article Title"}</h1>
            {excerpt && <p className="text-lg text-gray-400 mb-5 border-l-4 border-[#F5C518] pl-4">{excerpt}</p>}
            <div
              className="article-prose max-w-none"
              dangerouslySetInnerHTML={{ __html: content || "<p class='text-gray-500'>Start writing to see a preview...</p>" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Categories ─────────────────────────────────────────────────────────────
function CmsCategories() {
  const { data: categories } = trpc.categories.list.useQuery();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-black text-white mb-6">Categories</h1>
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#222] text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Slug</th>
              <th className="text-left px-4 py-3">Colour</th>
            </tr>
          </thead>
          <tbody>
            {categories?.map((c) => (
              <tr key={c.id} className="border-b border-[#1a1a1a]">
                <td className="px-4 py-3 font-bold text-white">{c.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3">
                  <span style={{ background: c.colour ?? "#F5C518", color: "#000", padding: "2px 8px", borderRadius: 3, fontSize: 11, fontWeight: 700 }}>
                    {c.colour ?? "#F5C518"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────────────────
function CmsSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const updateProfileMutation = trpc.customAuth.updateProfile.useMutation({
    onSuccess: () => { toast.success("Profile updated ✈"); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleChangePassword = () => {
    if (!newPassword) { toast.error("Please enter a new password"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    // Password change requires the reset flow — for now show a message
    toast.info('To change your password, use the Forgot Password flow on the login page.');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-black text-white mb-6">Settings</h1>
      <div className="bg-[#111] border border-[#222] rounded-xl p-6 max-w-md">
        <div className="text-sm font-bold text-white mb-4">Change Password</div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-[#0d0d0d] border border-[#333] text-white px-3 py-2 rounded focus:outline-none focus:border-[#F5C518]" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-[#0d0d0d] border border-[#333] text-white px-3 py-2 rounded focus:outline-none focus:border-[#F5C518]" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-[#0d0d0d] border border-[#333] text-white px-3 py-2 rounded focus:outline-none focus:border-[#F5C518]" />
          </div>
          <button onClick={handleChangePassword} className="w-full bg-[#F5C518] text-black font-black py-2 rounded hover:bg-[#e0b015] transition-colors">
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 404 Error Log ─────────────────────────────────────────────────────────
function Cms404Log() {
  const [showResolved, setShowResolved] = useState(false);
  const [redirectInput, setRedirectInput] = useState<Record<number, string>>({});
  const { data: errors, refetch, isLoading } = trpc.errorLog.list404s.useQuery({ resolved: showResolved ? true : false });
  const resolveMutation = trpc.errorLog.resolve404.useMutation({ onSuccess: () => { toast.success('Redirect created ✈'); refetch(); } });
  const deleteMutation = trpc.errorLog.delete404.useMutation({ onSuccess: () => refetch() });
  const clearMutation = trpc.errorLog.clearResolved.useMutation({ onSuccess: () => { toast.success('Cleared ✈'); refetch(); } });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">404 Error Log</h1>
          <p className="text-xs text-gray-500 mt-1">URLs that visitors tried to access but weren't found. Create redirects to fix them.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowResolved(!showResolved)}
            className={`text-xs px-3 py-1.5 rounded border font-bold transition-colors ${
              showResolved ? 'bg-green-400/10 border-green-400/30 text-green-400' : 'bg-[#111] border-[#333] text-gray-400 hover:text-white'
            }`}
          >
            {showResolved ? '✓ Showing Resolved' : 'Show Unresolved'}
          </button>
          {showResolved && (
            <button onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending} className="text-xs px-3 py-1.5 rounded border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors">
              Clear All Resolved
            </button>
          )}
        </div>
      </div>

      {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}
      {!isLoading && (!errors || errors.length === 0) && (
        <div className="bg-[#111] border border-[#222] rounded-xl p-8 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-gray-400 font-bold">No {showResolved ? 'resolved' : 'unresolved'} 404 errors</p>
          <p className="text-gray-600 text-sm mt-1">{showResolved ? 'No resolved errors to show.' : 'All URLs are resolving correctly.'}</p>
        </div>
      )}

      {errors && errors.length > 0 && (
        <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">URL Path</th>
                <th className="text-left px-4 py-3">Hits</th>
                <th className="text-left px-4 py-3">Last Seen</th>
                <th className="text-left px-4 py-3">Referrer</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((err: any) => (
                <tr key={err.id} className="border-b border-[#1a1a1a] hover:bg-[#161616]">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-white truncate max-w-xs" title={err.path}>{err.path}</div>
                    {err.redirectTo && <div className="text-[10px] text-green-400 mt-0.5">→ {err.redirectTo}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${
                      err.hitCount >= 10 ? 'text-red-400' : err.hitCount >= 3 ? 'text-yellow-400' : 'text-gray-400'
                    }`}>{err.hitCount}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(err.lastSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-xs" title={err.referrer}>
                    {err.referrer ? new URL(err.referrer.startsWith('http') ? err.referrer : 'https://' + err.referrer).hostname : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {!err.resolved ? (
                      <div className="flex items-center gap-1 justify-end">
                        <input
                          type="text"
                          value={redirectInput[err.id] ?? ''}
                          onChange={(e) => setRedirectInput(prev => ({ ...prev, [err.id]: e.target.value }))}
                          placeholder="/article/slug"
                          className="bg-[#0d0d0d] border border-[#333] text-white text-xs px-2 py-1 rounded w-36 focus:outline-none focus:border-[#F5C518]"
                        />
                        <button
                          onClick={() => resolveMutation.mutate({ id: err.id, redirectTo: redirectInput[err.id] || undefined })}
                          disabled={resolveMutation.isPending}
                          className="text-xs bg-green-600 text-white font-bold px-2 py-1 rounded hover:bg-green-500 disabled:opacity-50"
                        >
                          Fix
                        </button>
                        <button onClick={() => deleteMutation.mutate({ id: err.id })} className="text-red-400 text-xs hover:text-red-300">✕</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-[10px] text-green-400 font-bold">✓ Fixed</span>
                        <button onClick={() => deleteMutation.mutate({ id: err.id })} className="text-gray-500 text-xs hover:text-red-400">✕</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main CMS Shell ─────────────────────────────────────────────────────────
export default function CmsAdmin() {
  const { user, loading } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);

  useEffect(() => {
    if (user && user.role === 'admin') setIsLoggedIn(true);
  }, [user]);

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="text-[#F5C518] text-2xl animate-pulse">✈</div></div>;
  if (!isLoggedIn) return <CmsLogin onLogin={() => setIsLoggedIn(true)} />;

  const navItems = [
    { id: "dashboard" as View, label: "📊 Dashboard" },
    { id: "articles" as View, label: "📋 Articles" },
    { id: "ai-tools" as View, label: "✨ AI Tools", badge: "NEW" },
    { id: "categories" as View, label: "🏷 Categories" },
    { id: "settings" as View, label: "⚙ Settings" },
    { id: "error-log" as View, label: "🚨 404 Errors" },
  ];

  const navigate = (v: View, id?: number) => {
    setView(v);
    if (id !== undefined) setEditingArticleId(id);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <div className="w-52 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-[#1a1a1a]">
          <div className="text-lg font-black"><span className="text-[#F5C518]">FLIGHT</span>DRAMA</div>
          <div className="text-[10px] text-gray-600 uppercase tracking-widest">CMS</div>
        </div>
        <nav className="flex-1 py-3">
          {navItems.map(({ id, label, badge }) => (
            <button
              key={id}
              onClick={() => { setView(id); setEditingArticleId(null); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                view === id || (view === 'new-article' && id === 'articles') || (view === 'edit-article' && id === 'articles')
                  ? 'bg-[#F5C518]/10 text-[#F5C518] font-bold border-r-2 border-[#F5C518]'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              {label}
              {badge && <span className="ml-auto text-[9px] bg-[#F5C518] text-black font-black px-1 rounded">{badge}</span>}
            </button>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-[#1a1a1a]">
          <div className="text-xs text-gray-600 truncate">{user?.email}</div>
          <a href="/" className="text-xs text-[#F5C518] hover:underline">← View site</a>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {view === "dashboard" && <CmsDashboard onNavigate={navigate} />}
        {view === "articles" && (
          <CmsArticlesList
            onEdit={(id) => { setEditingArticleId(id); setView("edit-article"); }}
            onNew={() => { setEditingArticleId(null); setView("new-article"); }}
          />
        )}
        {(view === "new-article" || view === "edit-article") && (
          <CmsArticleEditor
            articleId={view === "new-article" ? null : editingArticleId}
            onSaved={() => setView("articles")}
            onBack={() => setView("articles")}
          />
        )}
        {view === "categories" && <CmsCategories />}
        {view === "ai-tools" && (
          <CmsAiTools
            onUseArticle={(article) => {
              sessionStorage.setItem('fd_cms_generated_article', JSON.stringify(article));
              setEditingArticleId(null);
              setView("new-article");
            }}
          />
        )}
        {view === "settings" && <CmsSettings />}
        {view === "error-log" && <Cms404Log />}
      </div>
    </div>
  );
}
