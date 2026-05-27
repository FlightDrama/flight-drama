import Stripe from "stripe";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
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
      .input(z.object({ articleId: z.number(), limit: z.number().min(1).max(50).default(20) }))
      .query(async ({ input }) => {
        const { rawQuery } = await import('./db');
        return rawQuery<any>(
          `SELECT c.id, c.content, c.createdAt, c.marketingOptIn, c.parentId, c.upvotes,
                  u.name as userName, u.id as userId
           FROM article_comments c JOIN users u ON c.userId = u.id
           WHERE c.articleId = ? AND c.status = 'approved'
           ORDER BY c.parentId ASC, c.createdAt ASC LIMIT ?`,
          [input.articleId, input.limit]
        );
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
      .input(z.object({ articleId: z.number(), content: z.string().min(3).max(2000), marketingOptIn: z.boolean().default(false), parentId: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        const { rawQuery } = await import('./db');
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
      .input(z.object({ limit: z.number().min(1).max(100).default(20), offset: z.number().min(0).default(0), categoryId: z.number().optional(), postType: z.string().optional(), featured: z.boolean().optional(), breaking: z.boolean().optional(), search: z.string().optional() }))
      .query(({ input }) => getArticles(input)),
    mostRead: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(10).default(5) }))
      .query(({ input }) => getMostReadArticles(input.limit)),
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
      .mutation(({ input }) => { const { id, ...data } = input; return updateArticle(id, data); }),
    delete: adminGuard
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteArticle(input.id)),
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
      .mutation(async ({ input }) => { await subscribeToNewsletter(input.email, input.name, input.source); return { success: true }; }),
    list: adminGuard
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0), status: z.string().optional() }))
      .query(({ input }) => getNewsletterSubscribers(input.limit, input.offset, input.status)),
    count: publicProcedure.query(() => getSubscriberCount()),
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
