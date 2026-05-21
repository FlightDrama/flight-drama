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
