import Stripe from "stripe";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { customAuthRouter } from './customAuth';
import {
  createArticle, createForumReply, createForumThread, deleteArticle,
  getAllAdSlots, getAllUsers, getArticleBySlug, getArticleCount, getArticles,
  getAuthors, getCategories, getForumBoards, getForumReplies, getForumThread,
  getForumThreadsByBoard, getNewsletterSubscribers, getProMemberCount,
  getProMembership, getSubscriberCount, getUserCount,
  getUserProfile, getUserForumThreads, getUserForumReplies, getUserPostCount,
  getMostReadArticles,
  incrementArticleViews, incrementThreadViews, subscribeToNewsletter,
  updateAdSlot, updateArticle, deleteArticle as _del,
} from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2026-04-22.dahlia" as any });

const adminGuard = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new Error("FORBIDDEN");
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  customAuth: customAuthRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  // ── Article Reactions (no auth required) ─────────────────────────────────
  reactions: router({
    get: publicProcedure
      .input(z.object({ articleId: z.number() }))
      .query(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const rows = await rawQuery<{reaction:string;count:string}>(
          'SELECT reaction, COUNT(*) as count FROM article_reactions WHERE articleId = ? GROUP BY reaction',
          [input.articleId]
        );
        const counts: Record<string, number> = { love: 0, fire: 0, shocked: 0, interesting: 0 };
        for (const row of rows) counts[row.reaction] = Number(row.count);
        return counts;
      }),
    toggle: publicProcedure
      .input(z.object({ articleId: z.number(), reaction: z.enum(['love','fire','shocked','interesting']), sessionId: z.string().min(8).max(64) }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const existing = await rawQuery<{id:number}>(
          'SELECT id FROM article_reactions WHERE articleId = ? AND sessionId = ? AND reaction = ?',
          [input.articleId, input.sessionId, input.reaction]
        );
        if (existing.length > 0) {
          await rawQuery('DELETE FROM article_reactions WHERE articleId = ? AND sessionId = ? AND reaction = ?', [input.articleId, input.sessionId, input.reaction]);
        } else {
          await rawQuery('INSERT IGNORE INTO article_reactions (articleId, sessionId, reaction) VALUES (?, ?, ?)', [input.articleId, input.sessionId, input.reaction]);
        }
        return { success: true, added: existing.length === 0 };
      }),
  }),

  // ── Article Comments ────────────────────────────────────────────────────────
  comments: router({
    list: publicProcedure
      .input(z.object({ articleId: z.number(), limit: z.number().min(1).max(50).default(20), sort: z.enum(['newest','top']).default('newest') }))
      .query(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const orderBy = input.sort === 'top'
          ? 'c.isPinned DESC, c.upvotes DESC, c.createdAt DESC'
          : 'c.isPinned DESC, c.parentId ASC, c.createdAt ASC';
        return rawQuery<any>(
          `SELECT c.id, c.content, c.createdAt, c.marketingOptIn, c.parentId, c.upvotes, c.isPinned,
                  u.name as userName, u.id as userId, u.avatar as userAvatar,
                  COALESCE(u.reputationScore, 0) as userReputation
           FROM article_comments c JOIN users u ON c.userId = u.id
           WHERE c.articleId = ? AND c.status = 'approved'
           ORDER BY ${orderBy} LIMIT ?`,
          [input.articleId, input.limit]
        );
      }),
    pin: adminGuard
      .input(z.object({ id: z.number(), articleId: z.number(), pin: z.boolean() }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        // Unpin all others for this article first (only one pinned comment per article)
        if (input.pin) await rawQuery('UPDATE article_comments SET isPinned = 0 WHERE articleId = ?', [input.articleId]);
        await rawQuery('UPDATE article_comments SET isPinned = ? WHERE id = ?', [input.pin ? 1 : 0, input.id]);
        return { success: true };
      }),
    downvote: publicProcedure
      .input(z.object({ commentId: z.number(), sessionId: z.string().min(8).max(64) }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const key = `dv_${input.sessionId}`;
        const existing = await rawQuery<{id:number}>(
          'SELECT id FROM comment_upvotes WHERE commentId = ? AND sessionId = ?',
          [input.commentId, key]
        );
        if (existing.length > 0) {
          await rawQuery('DELETE FROM comment_upvotes WHERE commentId = ? AND sessionId = ?', [input.commentId, key]);
          await rawQuery('UPDATE article_comments SET upvotes = upvotes + 1 WHERE id = ?', [input.commentId]);
          return { added: false };
        } else {
          await rawQuery('INSERT IGNORE INTO comment_upvotes (commentId, sessionId) VALUES (?, ?)', [input.commentId, key]);
          await rawQuery('UPDATE article_comments SET upvotes = GREATEST(0, upvotes - 1) WHERE id = ?', [input.commentId]);
          return { added: true };
        }
      }),
    trending: publicProcedure
      .input(z.object({ limit: z.number().default(5) }))
      .query(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const limit = Math.max(1, Math.min(50, Math.floor(Number(input.limit))));
        return rawQuery<any>(
          `SELECT c.id, c.content, c.upvotes, c.createdAt,
                  u.name as userName, u.avatar as userAvatar,
                  a.title as articleTitle, a.slug as articleSlug, a.featuredImage as articleImage
           FROM article_comments c
           JOIN users u ON c.userId = u.id
           JOIN articles a ON c.articleId = a.id
           WHERE c.status = 'approved' AND c.upvotes > 0
           ORDER BY c.upvotes DESC, c.createdAt DESC
           LIMIT ${limit}`,
          []
        );
      }),
    listPaginated: publicProcedure
      .input(z.object({ articleId: z.number(), limit: z.number().min(1).max(50).default(10), offset: z.number().default(0), sort: z.enum(['newest','top']).default('newest') }))
      .query(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const orderBy = input.sort === 'top'
          ? 'c.isPinned DESC, c.upvotes DESC, c.createdAt DESC'
          : 'c.isPinned DESC, c.parentId ASC, c.createdAt ASC';
        const rows = await rawQuery<any>(
          `SELECT c.id, c.content, c.createdAt, c.marketingOptIn, c.parentId, c.upvotes, c.isPinned,
                  u.name as userName, u.id as userId, u.avatar as userAvatar
           FROM article_comments c JOIN users u ON c.userId = u.id
           WHERE c.articleId = ? AND c.status = 'approved'
           ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
          [input.articleId, input.limit, input.offset]
        );
        const [countRow] = await rawQuery<any>(
          'SELECT COUNT(*) as total FROM article_comments WHERE articleId = ? AND status = \'approved\'',
          [input.articleId]
        );
        return { comments: rows, total: countRow?.total ?? 0 };
      }),
    upvote: publicProcedure
      .input(z.object({ commentId: z.number(), sessionId: z.string().min(8).max(64) }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const existing = await rawQuery<{id:number}>(
          'SELECT id FROM comment_upvotes WHERE commentId = ? AND sessionId = ?',
          [input.commentId, input.sessionId]
        );
        if (existing.length > 0) {
          await rawQuery('DELETE FROM comment_upvotes WHERE commentId = ? AND sessionId = ?', [input.commentId, input.sessionId]);
          await rawQuery('UPDATE article_comments SET upvotes = GREATEST(0, upvotes - 1) WHERE id = ?', [input.commentId]);
          return { added: false };
        } else {
          await rawQuery('INSERT IGNORE INTO comment_upvotes (commentId, sessionId) VALUES (?, ?)', [input.commentId, input.sessionId]);
          await rawQuery('UPDATE article_comments SET upvotes = upvotes + 1 WHERE id = ?', [input.commentId]);
          return { added: true };
        }
      }),
    create: protectedProcedure
      .input(z.object({ articleId: z.number(), content: z.string().min(3).max(2000), marketingOptIn: z.boolean().default(false), parentId: z.number().optional(), turnstileToken: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const { rawQuery } = await import('./db');
        // Verify Turnstile CAPTCHA if token provided and secret key is configured
        const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
        if (turnstileSecret && input.turnstileToken) {
          const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret: turnstileSecret, response: input.turnstileToken }),
          });
          const verifyData = await verifyRes.json() as any;
          if (!verifyData.success) {
            throw new Error('CAPTCHA_FAILED');
          }
        }
        await rawQuery(
          `INSERT INTO article_comments (articleId, userId, content, status, marketingOptIn, parentId) VALUES (?, ?, ?, 'pending', ?, ?)`,
          [input.articleId, ctx.user.id, input.content, input.marketingOptIn ? 1 : 0, input.parentId ?? null]
        );
        await rawQuery(
          `INSERT INTO news_commenters (userId, email, name, marketingOptIn, firstCommentAt, commentCount, lastCommentAt)
           VALUES (?, ?, ?, ?, NOW(), 1, NOW())
           ON DUPLICATE KEY UPDATE commentCount = commentCount + 1, lastCommentAt = NOW(),
             marketingOptIn = IF(? = 1, 1, marketingOptIn)`,
          [ctx.user.id, ctx.user.email ?? '', ctx.user.name ?? '', input.marketingOptIn ? 1 : 0, input.marketingOptIn ? 1 : 0]
        );
        return { success: true, message: 'Comment submitted for review' };
      }),
    adminList: adminGuard
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0), status: z.enum(['pending','approved','rejected','all']).default('pending') }))
      .query(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const where = input.status === 'all' ? '' : `WHERE c.status = '${input.status}'`;
        return rawQuery<any>(
          `SELECT c.id, c.content, c.status, c.createdAt, c.marketingOptIn,
                  u.name as userName, u.email as userEmail, a.title as articleTitle, a.slug as articleSlug
           FROM article_comments c JOIN users u ON c.userId = u.id JOIN articles a ON c.articleId = a.id
           ${where} ORDER BY c.createdAt DESC LIMIT ? OFFSET ?`,
          [input.limit, input.offset]
        );
      }),
    moderate: adminGuard
      .input(z.object({ id: z.number(), action: z.enum(['approve','reject']) }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const status = input.action === 'approve' ? 'approved' : 'rejected';
        await rawQuery('UPDATE article_comments SET status = ? WHERE id = ?', [status, input.id]);
        return { success: true };
      }),
    bulkModerate: adminGuard
      .input(z.object({ ids: z.array(z.number()).min(1).max(100), action: z.enum(['approve','reject']) }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const status = input.action === 'approve' ? 'approved' : 'rejected';
        const placeholders = input.ids.map(() => '?').join(',');
        await rawQuery(`UPDATE article_comments SET status = '${status}' WHERE id IN (${placeholders})`, input.ids);
        return { success: true, count: input.ids.length };
      }),
    newsCommenters: adminGuard
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0), marketingOnly: z.boolean().default(false) }))
      .query(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const where = input.marketingOnly ? 'WHERE nc.marketingOptIn = 1' : '';
        return rawQuery<any>(
          `SELECT nc.id, nc.email, nc.name, nc.marketingOptIn, nc.commentCount, nc.firstCommentAt, nc.lastCommentAt
           FROM news_commenters nc ${where} ORDER BY nc.firstCommentAt DESC LIMIT ? OFFSET ?`,
          [input.limit, input.offset]
        );
      }),
  }),

  articles: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(20), offset: z.number().min(0).default(0), categoryId: z.number().optional(), postType: z.string().optional(), featured: z.boolean().optional(), breaking: z.boolean().optional(), search: z.string().optional(), sortBy: z.enum(['recent', 'popular']).optional() }))
      .query(({ input }) => getArticles(input)),
    mostRead: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(10).default(5) }))
      .query(({ input }) => getMostReadArticles(input.limit)),
    mostCommented: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(10).default(5) }))
      .query(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const limit = Math.max(1, Math.min(10, Math.floor(Number(input.limit))));
        const rows = await rawQuery<{ id: number; title: string; slug: string; featuredImage: string | null; views: number | null; publishedAt: Date | null; categoryName: string | null; categorySlug: string | null; commentCount: number }>(
          `SELECT a.id, a.title, a.slug, a.featuredImage, a.views, a.publishedAt,
           c.name AS categoryName, c.slug AS categorySlug,
           COUNT(ac.id) AS commentCount
           FROM articles a
           LEFT JOIN categories c ON a.categoryId = c.id
           LEFT JOIN article_comments ac ON ac.articleId = a.id AND ac.status = 'approved'
           GROUP BY a.id, a.title, a.slug, a.featuredImage, a.views, a.publishedAt, c.name, c.slug
           ORDER BY commentCount DESC
           LIMIT ${limit}`,
          []
        );
        return rows;
      }),
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const article = await getArticleBySlug(input.slug);
        if (article) await incrementArticleViews(article.articles.id);
        return article;
      }),
    create: adminGuard
      .input(z.object({ title: z.string(), slug: z.string(), excerpt: z.string().optional(), content: z.string(), featuredImage: z.string().optional(), videoUrl: z.string().optional(), postType: z.enum(["article","video","social","breaking"]).default("article"), categoryId: z.number().optional(), authorId: z.number().optional(), tags: z.string().optional(), isFeatured: z.boolean().default(false), isBreaking: z.boolean().default(false), isPro: z.boolean().default(false) }))
      .mutation(({ input }) => createArticle({ ...input, publishedAt: new Date() })),
    update: adminGuard
      .input(z.object({ id: z.number(), title: z.string().optional(), excerpt: z.string().optional(), content: z.string().optional(), featuredImage: z.string().optional(), isFeatured: z.boolean().optional(), isBreaking: z.boolean().optional(), isPro: z.boolean().optional(), categoryId: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        const { rawQuery } = await import('./db');
        // Save a revision of the current state before updating
        try {
          const current = await rawQuery<any>('SELECT title, content, excerpt, featuredImage FROM articles WHERE id = ? LIMIT 1', [input.id]);
          if (current[0]) {
            await rawQuery(
              'INSERT INTO article_revisions (articleId, title, content, excerpt, featuredImage, savedBy) VALUES (?, ?, ?, ?, ?, ?)',
              [input.id, current[0].title, current[0].content, current[0].excerpt, current[0].featuredImage, ctx.user?.id ?? null]
            );
            // Keep only the last 10 revisions per article
            await rawQuery(
              'DELETE FROM article_revisions WHERE articleId = ? AND id NOT IN (SELECT id FROM (SELECT id FROM article_revisions WHERE articleId = ? ORDER BY savedAt DESC LIMIT 10) t)',
              [input.id, input.id]
            );
          }
        } catch {}
        const { id, ...data } = input;
        return updateArticle(id, data);
      }),
    delete: adminGuard
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteArticle(input.id)),
    generatePreviewLink: adminGuard
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const crypto = await import('crypto');
        const token = crypto.randomBytes(24).toString('hex');
        await rawQuery('UPDATE articles SET previewToken = ? WHERE id = ?', [token, input.id]);
        return { token, previewUrl: `/preview/${token}` };
      }),
    byPreviewToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const rows = await rawQuery<any>(
          `SELECT a.*, c.name as categoryName, c.slug as categorySlug, c.colour as categoryColour,
           au.name as authorName, au.bio as authorBio, au.avatar as authorAvatar
           FROM articles a
           LEFT JOIN categories c ON a.categoryId = c.id
           LEFT JOIN authors au ON a.authorId = au.id
           WHERE a.previewToken = ? LIMIT 1`,
          [input.token]
        );
        if (!rows[0]) throw new Error('Preview not found or link has expired');
        return rows[0];
      }),
    duplicate: adminGuard
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const [orig] = await rawQuery<any>('SELECT * FROM articles WHERE id = ? LIMIT 1', [input.id]);
        if (!orig) throw new Error('Article not found');
        const newSlug = orig.slug + '-copy-' + Date.now().toString(36);
        await rawQuery(
          `INSERT INTO articles (title, slug, excerpt, content, featuredImage, videoUrl, postType, categoryId, authorId, tags, views, isFeatured, isBreaking, isPro, publishedAt, status, metaTitle, metaDescription, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, NOW(), 'draft', ?, ?, NOW(), NOW())`,
          [
            orig.title + ' (Copy)',
            newSlug,
            orig.excerpt,
            orig.content,
            orig.featuredImage,
            orig.videoUrl,
            orig.postType || 'article',
            orig.categoryId,
            orig.authorId,
            orig.tags,
            orig.metaTitle,
            orig.metaDescription,
          ]
        );
        const [newArticle] = await rawQuery<any>('SELECT id FROM articles WHERE slug = ? LIMIT 1', [newSlug]);
        return { id: newArticle.id, slug: newSlug };
      }),
    bulkUpdate: adminGuard
      .input(z.object({
        ids: z.array(z.number()),
        action: z.enum(['delete', 'setFeatured', 'unsetFeatured', 'setBreaking', 'unsetBreaking', 'setCategory']),
        categoryId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        if (input.ids.length === 0) return { affected: 0 };
        const placeholders = input.ids.map(() => '?').join(',');
        if (input.action === 'delete') {
          await rawQuery(`DELETE FROM articles WHERE id IN (${placeholders})`, input.ids);
        } else if (input.action === 'setFeatured') {
          await rawQuery(`UPDATE articles SET isFeatured = 1 WHERE id IN (${placeholders})`, input.ids);
        } else if (input.action === 'unsetFeatured') {
          await rawQuery(`UPDATE articles SET isFeatured = 0 WHERE id IN (${placeholders})`, input.ids);
        } else if (input.action === 'setBreaking') {
          await rawQuery(`UPDATE articles SET isBreaking = 1 WHERE id IN (${placeholders})`, input.ids);
        } else if (input.action === 'unsetBreaking') {
          await rawQuery(`UPDATE articles SET isBreaking = 0 WHERE id IN (${placeholders})`, input.ids);
        } else if (input.action === 'setCategory' && input.categoryId) {
          await rawQuery(`UPDATE articles SET categoryId = ? WHERE id IN (${placeholders})`, [input.categoryId, ...input.ids]);
        }
        return { affected: input.ids.length };
      }),
    tagSuggestions: adminGuard
      .query(async () => {
        const { rawQuery } = await import('./db');
        const rows = await rawQuery<any>('SELECT tags FROM articles WHERE tags IS NOT NULL AND tags != \'[]\'');
        const allTags = new Set<string>();
        for (const row of rows) {
          try {
            const parsed = JSON.parse(row.tags);
            if (Array.isArray(parsed)) parsed.forEach((t: string) => allTags.add(t.trim()));
          } catch {
            // comma-separated fallback
            row.tags.split(',').forEach((t: string) => { if (t.trim()) allTags.add(t.trim()); });
          }
        }
        return Array.from(allTags).sort();
      }),
    checkSlug: adminGuard
      .input(z.object({ slug: z.string(), excludeId: z.number().optional() }))
      .query(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const rows = await rawQuery<any>(
          `SELECT id FROM articles WHERE slug = ? ${input.excludeId ? 'AND id != ?' : ''} LIMIT 1`,
          input.excludeId ? [input.slug, input.excludeId] : [input.slug]
        );
        return { available: rows.length === 0 };
      }),
    revisions: adminGuard
      .input(z.object({ articleId: z.number() }))
      .query(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const rows = await rawQuery<any>(
          `SELECT r.id, r.title, r.excerpt, r.featuredImage, r.savedAt, u.name as savedByName
           FROM article_revisions r
           LEFT JOIN users u ON r.savedBy = u.id
           WHERE r.articleId = ?
           ORDER BY r.savedAt DESC
           LIMIT 10`,
          [input.articleId]
        );
        return rows;
      }),
    revisionContent: adminGuard
      .input(z.object({ revisionId: z.number() }))
      .query(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const rows = await rawQuery<any>('SELECT * FROM article_revisions WHERE id = ? LIMIT 1', [input.revisionId]);
        if (!rows[0]) throw new Error('Revision not found');
        return rows[0];
      }),
    restoreRevision: adminGuard
      .input(z.object({ articleId: z.number(), revisionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { rawQuery } = await import('./db');
        const [rev] = await rawQuery<any>('SELECT * FROM article_revisions WHERE id = ? AND articleId = ? LIMIT 1', [input.revisionId, input.articleId]);
        if (!rev) throw new Error('Revision not found');
        await rawQuery(
          `UPDATE articles SET title = ?, content = ?, excerpt = ?, featuredImage = ?, updatedAt = NOW() WHERE id = ?`,
          [rev.title, rev.content, rev.excerpt, rev.featuredImage, input.articleId]
        );
        return { success: true };
      }),
  }),
  // ── AI Content Tools ─────────────────────────────────────────────────────────────────────────────
  aiTools: router({
    generateSEO: adminGuard
      .input(z.object({ title: z.string(), content: z.string(), excerpt: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        const textContent = input.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an SEO expert for an aviation news website. Always respond with valid JSON only.' },
            { role: 'user', content: `Generate SEO metadata for this aviation article.\n\nTITLE: ${input.title}\n\nCONTENT EXCERPT: ${textContent}\n\nRequirements:\n- metaTitle: 50-60 chars, include primary keyword, compelling\n- metaDescription: 150-160 chars, include call-to-action, summarise the key news\n- focusKeyword: the single most important search term (2-4 words)\n- suggestedTags: 5-8 relevant aviation tags\n\nReturn JSON: { metaTitle, metaDescription, focusKeyword, suggestedTags }` },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'seo_metadata',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  metaTitle: { type: 'string' },
                  metaDescription: { type: 'string' },
                  focusKeyword: { type: 'string' },
                  suggestedTags: { type: 'array', items: { type: 'string' } },
                },
                required: ['metaTitle', 'metaDescription', 'focusKeyword', 'suggestedTags'],
                additionalProperties: false,
              },
            },
          },
        });
        const raw = response.choices[0].message.content;
        return JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw));
      }),
    autoFormat: adminGuard
      .input(z.object({ content: z.string(), title: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        const prompt = `You are a professional aviation journalist and HTML editor. Reformat the following article HTML to be well-structured and engaging.

ARTICLE TITLE: ${input.title || 'Unknown'}

CURRENT HTML:
${input.content.slice(0, 8000)}

Requirements:
- Keep ALL the original content and facts — do not add, remove, or change any information
- Add proper <h2> subheadings to break up long sections (every 200-300 words)
- Wrap key quotes or important statements in <blockquote> tags
- Convert any lists of items into proper <ul><li> or <ol><li> HTML lists
- Add a <table> if there are any comparative data points (e.g. aircraft specs, airline comparisons)
- Ensure all paragraphs are in <p> tags
- Add a <hr> divider before the concluding paragraph
- Do NOT include a <h1> title
- Do NOT add any new information
- Return ONLY the formatted HTML, nothing else`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an HTML formatter. Return only valid HTML, no markdown, no code blocks, no explanations.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 6000,
        });

        const formatted = response.choices[0].message.content;
        if (typeof formatted !== 'string') throw new Error('Formatting failed');
        // Strip any accidental markdown code fences
        return { content: formatted.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim() };
      }),
    generateArticle: adminGuard
      .input(z.object({
        topic: z.string().min(5).max(500),
        keywords: z.string().optional(),
        urls: z.array(z.string()).optional(),
        tone: z.enum(['news', 'analysis', 'opinion', 'feature']).default('news'),
        length: z.enum(['short', 'medium', 'long']).default('medium'),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');

        // Fetch URL content if provided
        let urlContext = '';
        if (input.urls && input.urls.length > 0) {
          for (const url of input.urls.slice(0, 3)) {
            try {
              const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
              const html = await res.text();
              // Strip HTML tags and get text
              const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
              urlContext += `\n\n--- Content from ${url} ---\n${text}`;
            } catch {}
          }
        }

        const lengthGuide = { short: '400-600 words', medium: '700-1000 words', long: '1200-1800 words' }[input.length];
        const toneGuide = {
          news: 'Breaking news style — factual, urgent, inverted pyramid structure',
          analysis: 'In-depth analysis — expert commentary, context, implications',
          opinion: 'Opinion/editorial — strong point of view, engaging voice',
          feature: 'Feature article — narrative storytelling, human interest angle',
        }[input.tone];

        const prompt = `You are a senior aviation journalist for Flight Drama, a major aviation news website with millions of followers. Write a high-quality, SEO-optimised aviation article.

TOPIC: ${input.topic}
KEYWORDS TO INCLUDE: ${input.keywords || 'none specified'}
STYLE: ${toneGuide}
LENGTH: ${lengthGuide}
${urlContext ? `\nSOURCE MATERIAL (use as reference, do not copy verbatim):${urlContext}` : ''}

Requirements:
- Write in British English
- Use proper HTML formatting: <h2> for section headings, <p> for paragraphs, <blockquote> for key quotes, <ul>/<li> for lists
- Include at least 2-3 <h2> subheadings
- Make it engaging, accurate, and authoritative
- Do NOT include a main <h1> title (that will be added separately)
- Do NOT include any markdown, only HTML tags
- End with a strong concluding paragraph

Return a JSON object with these fields:
- title: A compelling article headline (max 80 chars)
- excerpt: A 1-2 sentence summary for article cards (max 160 chars)
- content: The full article HTML
- metaTitle: SEO title (max 60 chars)
- metaDescription: SEO description (max 160 chars)
- suggestedTags: Array of 3-5 relevant tags`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a professional aviation journalist. Always respond with valid JSON only, no markdown code blocks.' },
            { role: 'user', content: prompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'article_generation',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  excerpt: { type: 'string' },
                  content: { type: 'string' },
                  metaTitle: { type: 'string' },
                  metaDescription: { type: 'string' },
                  suggestedTags: { type: 'array', items: { type: 'string' } },
                },
                required: ['title', 'excerpt', 'content', 'metaTitle', 'metaDescription', 'suggestedTags'],
                additionalProperties: false,
              },
            },
          },
        });

        const raw = response.choices[0].message.content;
        try {
          return JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw));
        } catch {
          throw new Error('AI generation failed — please try again');
        }
      }),

    videoToArticle: adminGuard
      .input(z.object({
        videoUrl: z.string().url(),
        additionalContext: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { transcribeAudio } = await import('./_core/voiceTranscription');
        const { invokeLLM } = await import('./_core/llm');

        // Detect YouTube URLs and use LLM vision analysis instead of audio transcription
        const isYouTube = input.videoUrl.includes('youtube.com') || input.videoUrl.includes('youtu.be');
        let transcript = '';

        // Extract YouTube video ID for thumbnail
        let youtubeThumbnail = '';
        if (isYouTube) {
          const ytIdMatch = input.videoUrl.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
          if (ytIdMatch) {
            youtubeThumbnail = `https://img.youtube.com/vi/${ytIdMatch[1]}/maxresdefault.jpg`;
          }
        }

        if (isYouTube) {
          // Use LLM to analyse the YouTube video directly
          try {
            const response = await invokeLLM({
              messages: [
                { role: 'system', content: 'You are an aviation journalist. Analyse this YouTube video and extract all spoken content, key facts, quotes, and information. Provide a detailed transcript and summary.' },
                { role: 'user', content: [{ type: 'file_url', file_url: { url: input.videoUrl, mime_type: 'video/mp4' } }, { type: 'text', text: 'Please transcribe and summarise all spoken content in this video. Include all key quotes, facts, and information mentioned.' }] },
              ],
            });
            const content = response.choices[0].message.content;
            transcript = typeof content === 'string' ? content : JSON.stringify(content);
          } catch (e: any) {
            throw new Error(`YouTube analysis failed: ${e.message}. Try pasting the YouTube URL into the Article Generator instead and use it as a source URL.`);
          }
        } else {
          // Direct audio/video file — use Whisper transcription
          try {
            const result = await transcribeAudio({ audioUrl: input.videoUrl, language: 'en', prompt: 'Aviation news, ATC communications, pilot announcements' });
            if ('text' in result) { transcript = result.text; } else { throw new Error('Transcription failed: ' + result.error); }
          } catch (e: any) {
            throw new Error(`Transcription failed: ${e.message}. Ensure the URL points to an audio/video file (mp3, mp4, wav, webm).`);
          }
        }

        if (!transcript || transcript.trim().length < 20) {
          throw new Error('Could not extract meaningful content from the video. Please check the URL.');
        }

        const prompt = `You are a senior aviation journalist for Flight Drama. A video/audio recording has been transcribed. Convert this transcript into a polished news article.

TRANSCRIPT:
${transcript.slice(0, 8000)}

${input.additionalContext ? `ADDITIONAL CONTEXT: ${input.additionalContext}` : ''}

Requirements:
- Write in British English
- Use proper HTML: <h2> subheadings, <p> paragraphs, <blockquote> for key quotes from the transcript
- Include the most newsworthy quotes verbatim in blockquotes
- 600-900 words
- Do NOT include a main <h1> title
- Do NOT include markdown, only HTML

Return JSON with: title, excerpt, content, metaTitle, metaDescription, suggestedTags`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a professional aviation journalist. Always respond with valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'article_generation',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  excerpt: { type: 'string' },
                  content: { type: 'string' },
                  metaTitle: { type: 'string' },
                  metaDescription: { type: 'string' },
                  suggestedTags: { type: 'array', items: { type: 'string' } },
                },
                required: ['title', 'excerpt', 'content', 'metaTitle', 'metaDescription', 'suggestedTags'],
                additionalProperties: false,
              },
            },
          },
        });

        const raw = response.choices[0].message.content;
        try {
          const result = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw));
          return { ...result, transcript: transcript.slice(0, 500) + (transcript.length > 500 ? '...' : ''), featuredImage: youtubeThumbnail || undefined };
        } catch {
          throw new Error('AI generation failed — please try again');
        }
      }),
  }),

  errorLog: router({
    list404s: adminGuard
      .input(z.object({ resolved: z.boolean().optional(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const whereClause = input.resolved !== undefined ? `WHERE resolved = ${input.resolved ? 1 : 0}` : '';
        return rawQuery<any>(
          `SELECT * FROM error_404_log ${whereClause} ORDER BY hitCount DESC, lastSeen DESC LIMIT ?`,
          [input.limit]
        );
      }),
    resolve404: adminGuard
      .input(z.object({ id: z.number(), redirectTo: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        if (input.redirectTo) {
          // Add a redirect entry and mark as resolved
          const [row] = await rawQuery<any>('SELECT path FROM error_404_log WHERE id = ? LIMIT 1', [input.id]);
          if (row) {
            await rawQuery(
              'INSERT IGNORE INTO redirects (oldPath, newPath, statusCode) VALUES (?, ?, 301)',
              [row.path, input.redirectTo]
            );
          }
        }
        await rawQuery('UPDATE error_404_log SET resolved = 1, redirectTo = ? WHERE id = ?', [input.redirectTo || null, input.id]);
        return { success: true };
      }),
    delete404: adminGuard
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        await rawQuery('DELETE FROM error_404_log WHERE id = ?', [input.id]);
        return { success: true };
      }),
    clearResolved: adminGuard
      .mutation(async () => {
        const { rawQuery } = await import('./db');
        await rawQuery('DELETE FROM error_404_log WHERE resolved = 1');
        return { success: true };
      }),
    bulkImportRedirects: adminGuard
      .input(z.object({
        rows: z.array(z.object({ oldPath: z.string(), newPath: z.string() }))
      }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        let imported = 0;
        let skipped = 0;
        for (const row of input.rows) {
          if (!row.oldPath || !row.newPath) { skipped++; continue; }
          const oldPath = row.oldPath.startsWith('/') ? row.oldPath : '/' + row.oldPath;
          const newPath = row.newPath.startsWith('/') ? row.newPath : '/' + row.newPath;
          try {
            await rawQuery(
              'INSERT IGNORE INTO redirects (oldPath, newPath, statusCode) VALUES (?, ?, 301)',
              [oldPath.slice(0, 999), newPath.slice(0, 999)]
            );
            // Also mark any matching 404 log entries as resolved
            await rawQuery(
              'UPDATE error_404_log SET resolved = 1, redirectTo = ? WHERE path = ?',
              [newPath, oldPath]
            );
            imported++;
          } catch { skipped++; }
        }
        return { imported, skipped };
      }),
  }),
  categories: router({
    list: publicProcedure.query(() => getCategories()),
  }),
  authors: router({
    list: publicProcedure.query(() => getAuthors()),
  }),
  forum: router({
    boards: publicProcedure.query(() => getForumBoards()),
    threads: publicProcedure
      .input(z.object({ boardId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
      .query(({ input }) => getForumThreadsByBoard(input.boardId, input.limit, input.offset)),
    thread: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => { await incrementThreadViews(input.id); return getForumThread(input.id); }),
    replies: publicProcedure
      .input(z.object({ threadId: z.number() }))
      .query(({ input }) => getForumReplies(input.threadId)),
    createThread: protectedProcedure
      .input(z.object({ boardId: z.number(), title: z.string().min(5).max(500), content: z.string().min(10) }))
      .mutation(({ input, ctx }) => createForumThread({ ...input, userId: ctx.user.id })),
    createReply: protectedProcedure
      .input(z.object({ threadId: z.number(), content: z.string().min(5), parentReplyId: z.number().optional() }))
      .mutation(({ input, ctx }) => createForumReply({ ...input, userId: ctx.user.id })),
  }),
  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({ email: z.string().email(), name: z.string().optional(), source: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        // Check if already subscribed
        const existing = await rawQuery<any>('SELECT id, status, unsubscribeToken FROM newsletter_subscribers WHERE email = ? LIMIT 1', [input.email]);
        if (existing.length > 0 && existing[0].status === 'active') return { success: true, alreadySubscribed: true };
        // Generate unsubscribe token
        const crypto = await import('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        if (existing.length > 0) {
          // Reactivate
          await rawQuery('UPDATE newsletter_subscribers SET status = \'active\', unsubscribeToken = ?, unsubscribedAt = NULL WHERE email = ?', [token, input.email]);
        } else {
          await subscribeToNewsletter(input.email, input.name, input.source);
          await rawQuery('UPDATE newsletter_subscribers SET unsubscribeToken = ? WHERE email = ?', [token, input.email]);
        }
        // Send welcome email (best-effort)
        try {
          const { sendWelcomeEmail } = await import('./emailService');
          await sendWelcomeEmail(input.email, input.name ?? null, token);
          await rawQuery('UPDATE newsletter_subscribers SET welcomeEmailSent = 1 WHERE email = ?', [input.email]);
        } catch (e) { console.error('[Newsletter] Welcome email failed:', e); }
        return { success: true };
      }),
    unsubscribe: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const rows = await rawQuery<any>('SELECT id FROM newsletter_subscribers WHERE unsubscribeToken = ? LIMIT 1', [input.token]);
        if (!rows.length) throw new Error('INVALID_TOKEN');
        await rawQuery('UPDATE newsletter_subscribers SET status = \'unsubscribed\', unsubscribedAt = NOW() WHERE unsubscribeToken = ?', [input.token]);
        return { success: true };
      }),
    list: adminGuard
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0), status: z.string().optional() }))
      .query(({ input }) => getNewsletterSubscribers(input.limit, input.offset, input.status)),
    count: publicProcedure.query(() => getSubscriberCount()),
    // Newsletter editions
    editions: adminGuard.query(async () => {
      const { rawQuery } = await import('./db');
      return rawQuery<any>('SELECT id, subject, previewText, status, sentAt, recipientCount, createdAt FROM newsletter_editions ORDER BY createdAt DESC LIMIT 50');
    }),
    saveDraft: adminGuard
      .input(z.object({ id: z.number().optional(), subject: z.string().min(1), previewText: z.string().optional(), sponsorId: z.number().optional(), articleIds: z.array(z.number()), htmlContent: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const { generateNewsletterPreviewHtml } = await import('./emailService');
        // Fetch article data
        const placeholders = input.articleIds.map(() => '?').join(',');
        const articles = input.articleIds.length > 0
          ? await rawQuery<any>(`SELECT a.id, a.title, a.slug, a.excerpt, a.featuredImage, c.name as categoryName FROM articles a LEFT JOIN categories c ON a.categoryId = c.id WHERE a.id IN (${placeholders})`, input.articleIds)
          : [];
        // Fetch sponsor
        let sponsor = null;
        if (input.sponsorId) {
          const sponsors = await rawQuery<any>('SELECT * FROM newsletter_sponsors WHERE id = ? LIMIT 1', [input.sponsorId]);
          sponsor = sponsors[0] ?? null;
        }
        const html = generateNewsletterPreviewHtml(input.subject, articles, sponsor);
        if (input.id) {
          await rawQuery('UPDATE newsletter_editions SET subject=?, previewText=?, sponsorId=?, articleIds=?, htmlContent=?, updatedAt=NOW() WHERE id=?',
            [input.subject, input.previewText??null, input.sponsorId??null, JSON.stringify(input.articleIds), html, input.id]);
          return { success: true, id: input.id, previewHtml: html };
        } else {
          const result = await rawQuery<any>('INSERT INTO newsletter_editions (subject, previewText, sponsorId, articleIds, htmlContent) VALUES (?,?,?,?,?)',
            [input.subject, input.previewText??null, input.sponsorId??null, JSON.stringify(input.articleIds), html]);
          return { success: true, id: (result as any).insertId, previewHtml: html };
        }
      }),
    sendEdition: adminGuard
      .input(z.object({ id: z.number(), testEmail: z.string().email().optional() }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const { sendNewsletterEdition } = await import('./emailService');
        // Get edition
        const editions = await rawQuery<any>('SELECT * FROM newsletter_editions WHERE id = ? LIMIT 1', [input.id]);
        if (!editions.length) throw new Error('Edition not found');
        const edition = editions[0];
        if (edition.status === 'sent' && !input.testEmail) throw new Error('Already sent');
        // Fetch articles
        const articleIds = JSON.parse(edition.articleIds || '[]') as number[];
        const placeholders = articleIds.length > 0 ? articleIds.map(() => '?').join(',') : '0';
        const articles = articleIds.length > 0
          ? await rawQuery<any>(`SELECT a.id, a.title, a.slug, a.excerpt, a.featuredImage, c.name as categoryName FROM articles a LEFT JOIN categories c ON a.categoryId = c.id WHERE a.id IN (${placeholders})`, articleIds)
          : [];
        // Fetch sponsor
        let sponsor = null;
        if (edition.sponsorId) {
          const sponsors = await rawQuery<any>('SELECT * FROM newsletter_sponsors WHERE id = ? LIMIT 1', [edition.sponsorId]);
          sponsor = sponsors[0] ?? null;
        }
        // Test send
        if (input.testEmail) {
          await sendNewsletterEdition(input.testEmail, 'Test Subscriber', 'test-token', edition.subject, edition.previewText ?? '', articles, sponsor);
          return { success: true, sent: 1, test: true };
        }
        // Get active subscribers
        const subscribers = await rawQuery<any>('SELECT email, name, unsubscribeToken FROM newsletter_subscribers WHERE status = \'active\' AND unsubscribeToken IS NOT NULL');
        let sent = 0;
        for (const sub of subscribers) {
          try {
            await sendNewsletterEdition(sub.email, sub.name, sub.unsubscribeToken, edition.subject, edition.previewText ?? '', articles, sponsor);
            sent++;
            // Small delay to avoid rate limits
            if (sent % 10 === 0) await new Promise(r => setTimeout(r, 500));
          } catch (e) { console.error(`[Newsletter] Failed to send to ${sub.email}:`, e); }
        }
        await rawQuery('UPDATE newsletter_editions SET status = \'sent\', sentAt = NOW(), recipientCount = ? WHERE id = ?', [sent, input.id]);
        return { success: true, sent };
      }),
  }),
  membership: router({
    getMyMembership: protectedProcedure.query(({ ctx }) => getProMembership(ctx.user.id)),
    createCheckout: protectedProcedure
      .input(z.object({ plan: z.enum(["monthly","annual"]), origin: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          customer_email: ctx.user.email ?? undefined,
          line_items: [{ price: input.plan === "annual" ? (process.env.STRIPE_ANNUAL_PRICE_ID ?? "price_annual") : (process.env.STRIPE_MONTHLY_PRICE_ID ?? "price_monthly"), quantity: 1 }],
          allow_promotion_codes: true,
          success_url: `${input.origin}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${input.origin}/pro`,
          client_reference_id: ctx.user.id.toString(),
          metadata: { user_id: ctx.user.id.toString(), customer_email: ctx.user.email ?? "", customer_name: ctx.user.name ?? "", plan: input.plan },
        });
        return { url: session.url };
      }),
  }),
  flightLookup: router({
    // FREE tier — uses ADSB.lol (no API key, no cost)
    // Searches live airspace by callsign, returns position/altitude/speed
    searchFree: publicProcedure
      .input(z.object({ callsign: z.string().min(2).max(10) }))
      .query(async ({ input }) => {
        const clean = input.callsign.trim().toUpperCase().replace(/\s/g, '');
        // ADSB.lol callsign search — query a large bounding box covering the world
        const url = `https://api.adsb.lol/v2/callsign/${encodeURIComponent(clean)}`;
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
          if (!res.ok) throw new Error('ADSB API error');
          const data = await res.json() as any;
          const aircraft = (data.ac ?? []).filter((a: any) => a.flight?.trim());
          return { aircraft, found: aircraft.length > 0 };
        } catch (e: any) {
          // Fallback: return empty rather than crashing
          return { aircraft: [], found: false, error: e.message };
        }
      }),

    // PRO tier — uses AviationStack (costs API credits)
    // DISABLED until Pro members exist — returns PRO_COMING_SOON until enabled
    searchPro: protectedProcedure
      .input(z.object({ flightIata: z.string().min(2).max(10).toUpperCase() }))
      .query(async ({ input, ctx }) => {
        // Check Pro membership
        const membership = await getProMembership(ctx.user.id);
        if (!membership || membership.status !== 'active') {
          throw new Error('PRO_REQUIRED');
        }
        // Feature flag — set PRO_FLIGHT_LOOKUP_ENABLED=true in secrets to activate
        // This prevents burning AviationStack credits before there are paying members
        if (process.env.PRO_FLIGHT_LOOKUP_ENABLED !== 'true') {
          throw new Error('PRO_COMING_SOON');
        }
        const apiKey = process.env.AVIATIONSTACK_API_KEY;
        if (!apiKey) throw new Error('AviationStack API key not configured');
        const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${encodeURIComponent(input.flightIata)}&limit=5`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error('AviationStack API error');
        const data = await res.json() as any;
        if (data.error) throw new Error(data.error.info ?? 'API error');
        return { flights: data.data ?? [], total: data.pagination?.total ?? 0 };
      }),
  }),
  profile: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      const [profile, postCount, threads, replies, membership] = await Promise.all([
        getUserProfile(ctx.user.id),
        getUserPostCount(ctx.user.id),
        getUserForumThreads(ctx.user.id, 5),
        getUserForumReplies(ctx.user.id, 5),
        getProMembership(ctx.user.id),
      ]);
      return { profile, postCount, threads, replies, membership };
    }),
  }),
  // ── Newsletter Sponsors ────────────────────────────────────────────────────
  sponsors: router({
    active: publicProcedure.query(async () => {
      const { rawQuery } = await import('./db');
      return rawQuery<any>('SELECT * FROM newsletter_sponsors WHERE isActive = 1 ORDER BY scheduledDate ASC LIMIT 10');
    }),
    list: adminGuard.query(async () => {
      const { rawQuery } = await import('./db');
      return rawQuery<any>('SELECT * FROM newsletter_sponsors ORDER BY createdAt DESC');
    }),
    create: adminGuard
      .input(z.object({ brandName: z.string(), logoUrl: z.string().optional(), tagline: z.string().optional(), ctaText: z.string().default('Learn More'), ctaUrl: z.string().url(), slotType: z.enum(['top_banner','dedicated','classified']).default('top_banner'), rateGbp: z.number().optional(), scheduledDate: z.string().optional(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        await rawQuery('INSERT INTO newsletter_sponsors (brandName, logoUrl, tagline, ctaText, ctaUrl, slotType, rateGbp, scheduledDate, notes) VALUES (?,?,?,?,?,?,?,?,?)',
          [input.brandName, input.logoUrl??null, input.tagline??null, input.ctaText, input.ctaUrl, input.slotType, input.rateGbp??null, input.scheduledDate??null, input.notes??null]);
        return { success: true };
      }),
    delete: adminGuard
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        await rawQuery('DELETE FROM newsletter_sponsors WHERE id = ?', [input.id]);
        return { success: true };
      }),
  }),

  // ── Media Kit Enquiries ──────────────────────────────────────────────────────
  mediaKit: router({
    enquire: publicProcedure
      .input(z.object({ name: z.string().min(1), email: z.string().email(), company: z.string().optional(), budget: z.string().optional(), message: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        await rawQuery('INSERT INTO media_kit_enquiries (name, email, company, budget, message) VALUES (?,?,?,?,?)',
          [input.name, input.email, input.company??null, input.budget??null, input.message??null]);
        return { success: true };
      }),
    list: adminGuard
      .input(z.object({ limit: z.number().default(50), status: z.enum(['new','contacted','converted','closed','all']).default('all') }))
      .query(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const where = input.status === 'all' ? '' : `WHERE status = '${input.status}'`;
        return rawQuery<any>(`SELECT * FROM media_kit_enquiries ${where} ORDER BY createdAt DESC LIMIT ?`, [input.limit]);
      }),
    updateStatus: adminGuard
      .input(z.object({ id: z.number(), status: z.enum(['new','contacted','converted','closed']) }))
      .mutation(async ({ input }) => {
        const { rawQuery } = await import('./db');
        await rawQuery('UPDATE media_kit_enquiries SET status = ? WHERE id = ?', [input.status, input.id]);
        return { success: true };
      }),
  }),

  // ── Digital Products ─────────────────────────────────────────────────────────
  products: router({
    list: publicProcedure.query(async () => {
      const { rawQuery } = await import('./db');
      return rawQuery<any>('SELECT * FROM digital_products WHERE isActive = 1 ORDER BY priceGbp ASC');
    }),
    get: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const rows = await rawQuery<any>('SELECT * FROM digital_products WHERE slug = ? AND isActive = 1 LIMIT 1', [input.slug]);
        return rows[0] ?? null;
      }),
  }),

  // ── Notifications ────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { rawQuery } = await import('./db');
      return rawQuery<any>(
        'SELECT id, type, title, message, icon, isRead, createdAt FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 30',
        [ctx.user.id]
      );
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const { rawQuery } = await import('./db');
      const [row] = await rawQuery<any>('SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0', [ctx.user.id]);
      return { count: Number(row?.count ?? 0) };
    }),
    markRead: protectedProcedure
      .input(z.object({ id: z.number().optional() })) // omit id to mark all
      .mutation(async ({ ctx, input }) => {
        const { rawQuery } = await import('./db');
        if (input.id) {
          await rawQuery('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?', [input.id, ctx.user.id]);
        } else {
          await rawQuery('UPDATE notifications SET isRead = 1 WHERE userId = ?', [ctx.user.id]);
        }
        return { ok: true };
      }),
  }),

  // ── Reputation System ──────────────────────────────────────────────────
  reputation: router({
    // Award points for an action
    awardPoints: protectedProcedure
      .input(z.object({
        eventType: z.string(),
        referenceId: z.number().optional(),
        referenceType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { rawQuery } = await import('./db');
        const { REPUTATION_POINTS, getRankForScore } = await import('../shared/reputation');
        const points = REPUTATION_POINTS[input.eventType];
        if (!points || points <= 0) return { ok: false, reason: 'unknown event' };

        // Check for duplicate events (prevent spam)
        const dedupeEvents = ['article_reaction', 'article_comment_upvote', 'forum_upvote_given'];
        if (dedupeEvents.includes(input.eventType) && input.referenceId) {
          const existing = await rawQuery<any>(
            'SELECT id FROM reputation_events WHERE userId = ? AND eventType = ? AND referenceId = ? LIMIT 1',
            [ctx.user.id, input.eventType, input.referenceId]
          );
          if (existing.length > 0) return { ok: false, reason: 'already awarded' };
        }

        // Insert event
        await rawQuery(
          'INSERT INTO reputation_events (userId, eventType, points, referenceId, referenceType) VALUES (?, ?, ?, ?, ?)',
          [ctx.user.id, input.eventType, points, input.referenceId ?? null, input.referenceType ?? null]
        );

        // Update user score
        await rawQuery(
          'UPDATE users SET reputationScore = reputationScore + ? WHERE id = ?',
          [points, ctx.user.id]
        );

        // Recalculate rank and detect rank-up
        const [userRow] = await rawQuery<any>('SELECT reputationScore, reputationRank FROM users WHERE id = ? LIMIT 1', [ctx.user.id]);
        const newScore = userRow?.reputationScore ?? 0;
        const oldRankName = userRow?.reputationRank ?? '';
        const newRank = getRankForScore(newScore);
        await rawQuery('UPDATE users SET reputationRank = ? WHERE id = ?', [newRank.name, ctx.user.id]);

        // Create rank-up notification if rank changed
        let rankedUp = false;
        if (newRank.name !== oldRankName && oldRankName !== '') {
          rankedUp = true;
          await rawQuery(
            `INSERT INTO notifications (userId, type, title, message, icon) VALUES (?, 'rank_up', ?, ?, ?)`,
            [
              ctx.user.id,
              `Rank Up! You are now ${newRank.name}`,
              `Congratulations! You've reached ${newRank.name} — ${newRank.description}. Keep engaging to climb higher!`,
              newRank.icon,
            ]
          );
          // Send rank-up email via Resend
          try {
            const [emailRow] = await rawQuery<any>('SELECT email, name FROM users WHERE id = ? LIMIT 1', [ctx.user.id]);
            if (emailRow?.email) {
              const { Resend } = await import('resend');
              const resend = new Resend(process.env.RESEND_API_KEY);
              await resend.emails.send({
                from: 'Flight Drama <noreply@flightdrama.com>',
                to: emailRow.email,
                subject: `${newRank.icon} Rank Up! You are now a ${newRank.name} on Flight Drama`,
                html: `
                  <div style="background:#0a0a0a;color:#fff;font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
                    <div style="text-align:center;margin-bottom:24px">
                      <img src="https://flightdrama.com/manus-storage/FlightDrama_ca641ff4.jpg" alt="Flight Drama" style="height:48px;border-radius:8px">
                    </div>
                    <div style="text-align:center;padding:32px;background:#1a1a1a;border-radius:12px;border:1px solid #333">
                      <div style="font-size:64px;margin-bottom:16px">${newRank.icon}</div>
                      <h1 style="color:#f5c842;font-size:28px;margin:0 0 8px">Rank Up!</h1>
                      <h2 style="color:#fff;font-size:20px;margin:0 0 16px">You are now a <strong>${newRank.name}</strong></h2>
                      <p style="color:#999;margin:0 0 24px">${newRank.description}</p>
                      <p style="color:#666;font-size:14px">Your reputation score: <strong style="color:#f5c842">${newScore.toLocaleString()} points</strong></p>
                    </div>
                    <div style="text-align:center;margin-top:24px">
                      <a href="https://flightdrama.com/leaderboard" style="background:#f5c842;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">View Leaderboard ✈</a>
                    </div>
                    <p style="color:#444;font-size:12px;text-align:center;margin-top:24px">Flight Drama · <a href="https://flightdrama.com" style="color:#666">flightdrama.com</a></p>
                  </div>
                `,
              });
            }
          } catch (e) {
            console.error('[Reputation] Failed to send rank-up email:', e);
          }
        }

        return { ok: true, points, newScore, newRank: newRank.name, rankedUp };
      }),

    // Get user reputation profile
    getProfile: publicProcedure
      .input(z.object({ userId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const { rawQuery } = await import('./db');
        const { getRankProgress } = await import('../shared/reputation');
        const userId = input.userId ?? ctx.user?.id;
        if (!userId) return null;

        const [user] = await rawQuery<any>(
          'SELECT id, name, avatar, reputationScore, reputationRank, createdAt FROM users WHERE id = ? LIMIT 1',
          [userId]
        );
        if (!user) return null;

        const progress = getRankProgress(user.reputationScore ?? 0);
        const events = await rawQuery<any>(
          'SELECT eventType, points, createdAt FROM reputation_events WHERE userId = ? ORDER BY createdAt DESC LIMIT 20',
          [userId]
        );

        const recentThreads = await rawQuery<any>(
          'SELECT id, title, createdAt FROM forum_threads WHERE userId = ? ORDER BY createdAt DESC LIMIT 5',
          [userId]
        );

        const recentComments = await rawQuery<any>(
          `SELECT c.id, c.content, c.createdAt, a.title as articleTitle, a.slug as articleSlug
           FROM article_comments c JOIN articles a ON c.articleId = a.id
           WHERE c.userId = ? AND c.status = 'approved' ORDER BY c.createdAt DESC LIMIT 5`,
          [userId]
        );

        return { user, progress, recentEvents: events, recentThreads, recentComments };
      }),

    // Leaderboard
    leaderboard: publicProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ input }) => {
        const { rawQuery } = await import('./db');
        const { getRankForScore } = await import('../shared/reputation');
        const rows = await rawQuery<any>(
          'SELECT id, name, avatar, reputationScore, reputationRank FROM users WHERE reputationScore > 0 ORDER BY reputationScore DESC LIMIT ?',
          [Math.min(input.limit, 100)]
        );
        return rows.map((r: any) => ({ ...r, rank: getRankForScore(r.reputationScore) }));
      }),

    // Get all ranks (for display)
    getRanks: publicProcedure.query(async () => {
      const { RANKS } = await import('../shared/reputation');
      return RANKS;
    }),
  }),

  crm: router({
    stats: adminGuard.query(async () => {
      const [articleCount, subscriberCount, memberCount, userCount] = await Promise.all([getArticleCount(), getSubscriberCount(), getProMemberCount(), getUserCount()]);
      return { articles: articleCount, subscribers: subscriberCount, members: memberCount, users: userCount };
    }),
    users: adminGuard
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(({ input }) => getAllUsers(input.limit, input.offset)),
    adSlots: adminGuard.query(() => getAllAdSlots()),
    updateAdSlot: adminGuard
      .input(z.object({ id: z.number(), label: z.string().optional(), content: z.string().optional(), linkUrl: z.string().optional(), isActive: z.boolean().optional(), advertiser: z.string().optional() }))
      .mutation(({ input }) => { const { id, ...data } = input; return updateAdSlot(id, data); }),
  }),
});

export type AppRouter = typeof appRouter;
