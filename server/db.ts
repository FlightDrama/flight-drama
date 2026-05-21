import { and, desc, eq, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  adSlots, articles, authors, categories, forumBoards, forumReplies,
  forumThreads, newsletterSubscribers, proMemberships, redirects, users,
  type InsertArticle, type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (e) { _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    const v = user[field]; if (v === undefined) continue;
    values[field] = v ?? null; updateSet[field] = v ?? null;
  }
  if (user.lastSignedIn) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return r[0];
}
export async function getAllUsers(limit = 100, offset = 0) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
}
export async function getUserCount() {
  const db = await getDb(); if (!db) return 0;
  const r = await db.select({ count: sql<number>`count(*)` }).from(users);
  return Number(r[0]?.count ?? 0);
}

export async function getArticles(opts: { limit?: number; offset?: number; categoryId?: number; postType?: string; featured?: boolean; breaking?: boolean; search?: string; }) {
  const db = await getDb(); if (!db) return [];
  const conds: any[] = [];
  if (opts.categoryId) conds.push(eq(articles.categoryId, opts.categoryId));
  if (opts.postType) conds.push(eq(articles.postType, opts.postType as any));
  if (opts.featured) conds.push(eq(articles.isFeatured, true));
  if (opts.breaking) conds.push(eq(articles.isBreaking, true));
  if (opts.search) conds.push(like(articles.title, `%${opts.search}%`));
  const base = db.select({ id: articles.id, title: articles.title, slug: articles.slug, excerpt: articles.excerpt, featuredImage: articles.featuredImage, videoUrl: articles.videoUrl, postType: articles.postType, categoryId: articles.categoryId, authorId: articles.authorId, tags: articles.tags, views: articles.views, isFeatured: articles.isFeatured, isBreaking: articles.isBreaking, isPro: articles.isPro, publishedAt: articles.publishedAt, authorName: authors.name, authorSlug: authors.slug, authorAvatar: authors.avatar, categoryName: categories.name, categorySlug: categories.slug, categoryColour: categories.colour }).from(articles).leftJoin(authors, eq(articles.authorId, authors.id)).leftJoin(categories, eq(articles.categoryId, categories.id)).orderBy(desc(articles.publishedAt)).limit(opts.limit ?? 20).offset(opts.offset ?? 0);
  return conds.length ? base.where(and(...conds)) : base;
}
export async function getArticleBySlug(slug: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(articles).leftJoin(authors, eq(articles.authorId, authors.id)).leftJoin(categories, eq(articles.categoryId, categories.id)).where(eq(articles.slug, slug)).limit(1);
  return r[0];
}
export async function incrementArticleViews(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(articles).set({ views: sql`${articles.views} + 1` }).where(eq(articles.id, id));
}
export async function getArticleCount() {
  const db = await getDb(); if (!db) return 0;
  const r = await db.select({ count: sql<number>`count(*)` }).from(articles);
  return Number(r[0]?.count ?? 0);
}
export async function createArticle(data: InsertArticle) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.insert(articles).values(data);
}
export async function updateArticle(id: number, data: Partial<InsertArticle>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(articles).set(data).where(eq(articles.id, id));
}
export async function deleteArticle(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(articles).where(eq(articles.id, id));
}

export async function getCategories() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}
export async function getCategoryBySlug(slug: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return r[0];
}
export async function getAuthors() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(authors).orderBy(authors.name);
}
export async function getAuthorBySlug(slug: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(authors).where(eq(authors.slug, slug)).limit(1);
  return r[0];
}

export async function getForumBoards() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(forumBoards).orderBy(forumBoards.sortOrder);
}
export async function getForumThreadsByBoard(boardId: number, limit = 20, offset = 0) {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: forumThreads.id, boardId: forumThreads.boardId, userId: forumThreads.userId, title: forumThreads.title, content: forumThreads.content, views: forumThreads.views, replyCount: forumThreads.replyCount, isPinned: forumThreads.isPinned, isLocked: forumThreads.isLocked, lastReplyAt: forumThreads.lastReplyAt, createdAt: forumThreads.createdAt, userName: users.name }).from(forumThreads).leftJoin(users, eq(forumThreads.userId, users.id)).where(eq(forumThreads.boardId, boardId)).orderBy(desc(forumThreads.isPinned), desc(forumThreads.lastReplyAt)).limit(limit).offset(offset);
}
export async function getForumThread(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select({ id: forumThreads.id, boardId: forumThreads.boardId, userId: forumThreads.userId, title: forumThreads.title, content: forumThreads.content, views: forumThreads.views, replyCount: forumThreads.replyCount, isPinned: forumThreads.isPinned, isLocked: forumThreads.isLocked, lastReplyAt: forumThreads.lastReplyAt, createdAt: forumThreads.createdAt, userName: users.name }).from(forumThreads).leftJoin(users, eq(forumThreads.userId, users.id)).where(eq(forumThreads.id, id)).limit(1);
  return r[0];
}
export async function getForumReplies(threadId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: forumReplies.id, threadId: forumReplies.threadId, userId: forumReplies.userId, content: forumReplies.content, parentReplyId: forumReplies.parentReplyId, isDeleted: forumReplies.isDeleted, createdAt: forumReplies.createdAt, userName: users.name }).from(forumReplies).leftJoin(users, eq(forumReplies.userId, users.id)).where(and(eq(forumReplies.threadId, threadId), eq(forumReplies.isDeleted, false))).orderBy(forumReplies.createdAt);
}
export async function createForumThread(data: { boardId: number; userId: number; title: string; content: string; }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.insert(forumThreads).values({ ...data, lastReplyAt: new Date() });
}
export async function createForumReply(data: { threadId: number; userId: number; content: string; parentReplyId?: number; }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.insert(forumReplies).values(data);
  await db.update(forumThreads).set({ replyCount: sql`${forumThreads.replyCount} + 1`, lastReplyAt: new Date() }).where(eq(forumThreads.id, data.threadId));
}
export async function incrementThreadViews(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(forumThreads).set({ views: sql`${forumThreads.views} + 1` }).where(eq(forumThreads.id, id));
}

export async function subscribeToNewsletter(email: string, name?: string, source?: string) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.insert(newsletterSubscribers).values({ email, name, source: source ?? "website", welcomeEmailSent: false }).onDuplicateKeyUpdate({ set: { status: "active" } });
}
export async function getNewsletterSubscribers(limit = 100, offset = 0, status?: string) {
  const db = await getDb(); if (!db) return [];
  const q = db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt)).limit(limit).offset(offset);
  return status ? q.where(eq(newsletterSubscribers.status, status as any)) : q;
}
export async function getSubscriberCount() {
  const db = await getDb(); if (!db) return 0;
  const r = await db.select({ count: sql<number>`count(*)` }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, "active"));
  return Number(r[0]?.count ?? 0);
}

export async function getProMembership(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(proMemberships).where(and(eq(proMemberships.userId, userId), eq(proMemberships.status, "active"))).limit(1);
  return r[0];
}
export async function upsertProMembership(data: { userId: number; stripeCustomerId?: string; stripeSubscriptionId?: string; status: "active" | "cancelled" | "past_due" | "trialing"; plan: "monthly" | "annual"; expiresAt?: Date; }) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.insert(proMemberships).values(data).onDuplicateKeyUpdate({ set: { ...data } });
}
export async function getProMemberCount() {
  const db = await getDb(); if (!db) return 0;
  const r = await db.select({ count: sql<number>`count(*)` }).from(proMemberships).where(eq(proMemberships.status, "active"));
  return Number(r[0]?.count ?? 0);
}

export async function getAdSlotByPosition(position: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(adSlots).where(and(eq(adSlots.position, position), eq(adSlots.isActive, true))).limit(1);
  return r[0];
}
export async function getAllAdSlots() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(adSlots).orderBy(adSlots.position);
}
export async function updateAdSlot(id: number, data: Partial<{ position: string; label: string; content: string; linkUrl: string; isActive: boolean; advertiser: string; }>) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(adSlots).set(data).where(eq(adSlots.id, id));
}

export async function getRedirect(oldPath: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(redirects).where(eq(redirects.oldPath, oldPath)).limit(1);
  return r[0];
}
