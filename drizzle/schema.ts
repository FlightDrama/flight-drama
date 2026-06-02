import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  postCount: int("postCount").default(0).notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  reputationScore: int("reputationScore").default(0).notNull(),
  reputationRank: varchar("reputationRank", { length: 100 }),
  passwordHash: text("passwordHash"),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Authors ──────────────────────────────────────────────────────────────────
export const authors = mysqlTable("authors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  bio: text("bio"),
  avatar: text("avatar"),
  twitterHandle: varchar("twitterHandle", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Author = typeof authors.$inferSelect;

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  colour: varchar("colour", { length: 20 }).default("#f5c518"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;

// ─── Articles ─────────────────────────────────────────────────────────────────
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: text("featuredImage"),
  videoUrl: text("videoUrl"),
  postType: mysqlEnum("postType", ["article", "video", "social", "breaking"]).default("article").notNull(),
  categoryId: int("categoryId"),
  authorId: int("authorId"),
  tags: text("tags"),
  views: int("views").default(0).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isBreaking: boolean("isBreaking").default(false).notNull(),
  isPro: boolean("isPro").default(false).notNull(),
  wpSlug: varchar("wpSlug", { length: 500 }),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

// ─── Forum Boards ─────────────────────────────────────────────────────────────
export const forumBoards = mysqlTable("forum_boards", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }).default("MessageSquare"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ForumBoard = typeof forumBoards.$inferSelect;

// ─── Forum Threads ────────────────────────────────────────────────────────────
export const forumThreads = mysqlTable("forum_threads", {
  id: int("id").autoincrement().primaryKey(),
  boardId: int("boardId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  views: int("views").default(0).notNull(),
  replyCount: int("replyCount").default(0).notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  isLocked: boolean("isLocked").default(false).notNull(),
  lastReplyAt: timestamp("lastReplyAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ForumThread = typeof forumThreads.$inferSelect;

// ─── Forum Replies ────────────────────────────────────────────────────────────
export const forumReplies = mysqlTable("forum_replies", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  parentReplyId: int("parentReplyId"),
  isDeleted: boolean("isDeleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ForumReply = typeof forumReplies.$inferSelect;

// ─── Newsletter Subscribers ───────────────────────────────────────────────────
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  status: mysqlEnum("status", ["active", "unsubscribed", "bounced"]).default("active").notNull(),
  source: varchar("source", { length: 100 }).default("website"),
  welcomeEmailSent: boolean("welcomeEmailSent").default(false).notNull(),
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribedAt"),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

// ─── Pro Memberships ──────────────────────────────────────────────────────────
export const proMemberships = mysqlTable("pro_memberships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  status: mysqlEnum("status", ["active", "cancelled", "past_due", "trialing"]).default("active").notNull(),
  plan: mysqlEnum("plan", ["monthly", "annual"]).default("monthly").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProMembership = typeof proMemberships.$inferSelect;

// ─── Ad Slots ─────────────────────────────────────────────────────────────────
export const adSlots = mysqlTable("ad_slots", {
  id: int("id").autoincrement().primaryKey(),
  position: varchar("position", { length: 100 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  content: text("content"),
  linkUrl: text("linkUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  advertiser: varchar("advertiser", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdSlot = typeof adSlots.$inferSelect;

// ─── Redirects ────────────────────────────────────────────────────────────────
export const redirects = mysqlTable("redirects", {
  id: int("id").autoincrement().primaryKey(),
  oldPath: varchar("oldPath", { length: 1000 }).notNull().unique(),
  newPath: varchar("newPath", { length: 1000 }).notNull(),
  statusCode: int("statusCode").default(301).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});