/**
 * Flight Drama CMS — Content Management System
 * =============================================
 * Accessible at /cms-admin
 * Uses the existing custom email/password auth (customAuth.login)
 * and admin tRPC procedures already in the app.
 * Role check: user.role === 'admin'
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";

// ── Types ──────────────────────────────────────────────────────────────────
type View = "dashboard" | "articles" | "new-article" | "edit-article" | "categories" | "settings";

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
              {loginMutation.isPending ? "Signing in..." : "Sign In ✈"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main CMS Shell ─────────────────────────────────────────────────────────
export default function CmsAdmin() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [view, setView] = useState<View>("dashboard");
  const [editingId, setEditingId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  // Refresh auth after login
  const handleLogin = () => {
    utils.auth.me.invalidate();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#F5C518] text-2xl animate-pulse">✈</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <CmsLogin onLogin={handleLogin} />;
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-center p-4">
        <div>
          <div className="text-4xl mb-4">🚫</div>
          <h1 className="text-xl font-black text-white mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-4">You need admin access to use the CMS.</p>
          <a href="/" className="text-[#F5C518] hover:underline">← Back to Flight Drama</a>
        </div>
      </div>
    );
  }

  const navItems: { id: View; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "articles", label: "Articles", icon: "📰" },
    { id: "new-article", label: "New Article", icon: "✏️" },
    { id: "categories", label: "Categories", icon: "🏷️" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  const showView = (v: View, id?: number) => {
    setView(v);
    if (id !== undefined) setEditingId(id);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <aside className="w-52 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="text-lg font-black text-white">
            <span className="text-[#F5C518]">FLIGHT</span>DRAMA
          </div>
          <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mt-0.5">CMS</div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => showView(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                view === item.id || (view === "edit-article" && item.id === "articles")
                  ? "bg-[#F5C518]/10 text-[#F5C518]"
                  : "text-gray-500 hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-[#1a1a1a]">
          <div className="text-xs text-gray-600 mb-2 truncate">{user.name || user.email}</div>
          <div className="flex gap-2">
            <a href="/" target="_blank" className="flex-1 text-center text-xs text-gray-500 hover:text-white bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-1.5 rounded transition-colors">
              View Site
            </a>
            <button
              onClick={() => logout()}
              className="flex-1 text-center text-xs text-gray-500 hover:text-white bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-1.5 rounded transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {view === "dashboard" && <CmsDashboard onEdit={(id) => showView("edit-article", id)} />}
        {view === "articles" && <CmsArticlesList onEdit={(id) => showView("edit-article", id)} onNew={() => showView("new-article")} />}
        {view === "new-article" && <CmsArticleEditor articleId={null} onSaved={() => showView("articles")} onBack={() => showView("articles")} />}
        {view === "edit-article" && <CmsArticleEditor articleId={editingId} onSaved={() => showView("articles")} onBack={() => showView("articles")} />}
        {view === "categories" && <CmsCategories />}
        {view === "settings" && <CmsSettings />}
      </main>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function CmsDashboard({ onEdit }: { onEdit: (id: number) => void }) {
  const { data: articles } = trpc.articles.list.useQuery({ limit: 5 });
  const { data: subCount } = trpc.newsletter.count.useQuery();
  const { data: articlesList } = trpc.articles.list.useQuery({ limit: 100 });
  const articleCount = articlesList?.length;

  const stats = [
    { label: "Total Articles", value: articleCount ?? "—", colour: "text-[#F5C518]" },
    { label: "Subscribers", value: subCount ?? "—", colour: "text-green-400" },
    { label: "Recent Views", value: articles?.reduce((a, b) => a + b.views, 0).toLocaleString() ?? "—", colour: "text-white" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-black text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#111] border border-[#222] rounded-xl p-5">
            <div className={`text-3xl font-black ${s.colour}`}>{s.value}</div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-[#111] border border-[#222] rounded-xl p-5">
        <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-4">Recent Articles</div>
        {articles?.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-3 border-b border-[#1a1a1a] last:border-0">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">{a.title}</div>
              <div className="text-xs text-gray-600">{formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true })}</div>
            </div>
            <div className="text-xs text-gray-500 mx-4">{a.views} views</div>
            <button onClick={() => onEdit(a.id)} className="text-xs text-[#F5C518] hover:underline">Edit</button>
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
  const LIMIT = 20;
  const { data, refetch } = trpc.articles.list.useQuery({ limit: LIMIT, offset: page * LIMIT, search: search || undefined });
  const deleteMutation = trpc.articles.delete.useMutation({ onSuccess: () => refetch() });

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteMutation.mutate({ id });
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
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#222] text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Published</th>
              <th className="text-left px-4 py-3">Views</th>
              <th className="text-left px-4 py-3">Flags</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((a) => (
              <tr key={a.id} className="border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors">
                <td className="px-4 py-3">
                  <div className="font-bold text-white truncate max-w-xs">{a.title}</div>
                  <div className="text-xs text-gray-600 truncate max-w-xs">{a.slug}</div>
                </td>
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
                  <button onClick={() => handleDelete(a.id, a.title)} className="text-red-400 text-xs hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#222]">
          <span className="text-xs text-gray-500">{data?.length ?? 0} articles</span>
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
  const [loaded, setLoaded] = useState(false);

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
    onSuccess: () => { toast.success("Article published ✈"); onSaved(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => { toast.success("Article saved ✈"); onSaved(); },
    onError: (e) => toast.error(e.message),
  });

  const autoSlug = (t: string) => {
    if (isNew) setSlug(t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80));
  };

  const handleSave = () => {
    if (!title || !slug || !content) { toast.error("Title, slug, and content are required"); return; }
    const payload = {
      title, slug, excerpt: excerpt || undefined,
      content, categoryId: categoryId || undefined,
      authorId: authorId || undefined,
      featuredImage: featuredImage || undefined,
      isBreaking, isFeatured, isPro,
      tags: tags ? JSON.stringify(tags.split(",").map(t => t.trim()).filter(Boolean)) : undefined,
      publishedAt: publishedAt.replace("T", " "),
    };
    if (isNew) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: articleId!, ...payload });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-white text-sm transition-colors">← Articles</button>
        <h1 className="text-2xl font-black text-white">{isNew ? "New Article" : "Edit Article"}</h1>
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
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-[#111] border border-[#333] text-white px-3 py-2 rounded focus:outline-none focus:border-[#F5C518] transition-colors font-mono text-sm"
              placeholder="article-slug"
            />
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
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-3">Publish</div>
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
              <button
                onClick={handleSave}
                disabled={isPending}
                className="w-full bg-[#F5C518] text-black font-black py-2.5 rounded hover:bg-[#e0b015] transition-colors disabled:opacity-50"
              >
                {isPending ? "Saving..." : isNew ? "Publish ✈" : "Save Changes"}
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
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-3">Featured Image</div>
            <input
              type="text"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#333] text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:border-[#F5C518] font-mono"
              placeholder="/manus-storage/..."
            />
            {featuredImage && (
              <img src={featuredImage} alt="" className="w-full rounded mt-2 object-cover" style={{ maxHeight: 100 }} />
            )}
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
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#333] text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:border-[#F5C518]"
              placeholder="Boeing, Safety (comma separated)"
            />
          </div>
        </div>
      </div>
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
  const { user } = useAuth();
  const [cur, setCur] = useState("");
  const [newP, setNewP] = useState("");
  const [newP2, setNewP2] = useState("");
  const resetMutation = trpc.customAuth.resetPassword.useMutation({
    onSuccess: () => { toast.success("Password updated"); setCur(""); setNewP(""); setNewP2(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleChange = () => {
    if (newP !== newP2) { toast.error("Passwords do not match"); return; }
    if (newP.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    // Use the forgot password flow — first get a token, then reset
    toast.info("To change your password, use the Forgot Password flow on the login page.");
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-black text-white mb-6">Settings</h1>
      <div className="bg-[#111] border border-[#222] rounded-xl p-5 mb-4">
        <div className="text-sm font-bold text-white mb-1">{user?.name}</div>
        <div className="text-sm text-gray-500">{user?.email}</div>
        <div className="mt-2"><Badge colour="yellow">{user?.role}</Badge></div>
      </div>
      <div className="bg-[#111] border border-[#222] rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-4">Change Password</div>
        <div className="space-y-3">
          <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="Current password" className="w-full bg-[#0d0d0d] border border-[#333] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-[#F5C518]" />
          <input type="password" value={newP} onChange={(e) => setNewP(e.target.value)} placeholder="New password (min 8 chars)" className="w-full bg-[#0d0d0d] border border-[#333] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-[#F5C518]" />
          <input type="password" value={newP2} onChange={(e) => setNewP2(e.target.value)} placeholder="Confirm new password" className="w-full bg-[#0d0d0d] border border-[#333] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-[#F5C518]" />
          <button onClick={handleChange} className="bg-[#F5C518] text-black font-black px-4 py-2 rounded text-sm hover:bg-[#e0b015] transition-colors">
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
