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
  articles: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(20), offset: z.number().min(0).default(0), categoryId: z.number().optional(), postType: z.string().optional(), featured: z.boolean().optional(), breaking: z.boolean().optional(), search: z.string().optional() }))
      .query(({ input }) => getArticles(input)),
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
