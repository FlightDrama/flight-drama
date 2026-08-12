import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { mockCreateArticle, mockGetArticles, mockRawQuery } = vi.hoisted(() => ({ mockCreateArticle: vi.fn(), mockGetArticles: vi.fn(), mockRawQuery: vi.fn() }));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, createArticle: mockCreateArticle, getArticles: mockGetArticles, rawQuery: mockRawQuery };
});

import { appRouter, articleMatchesSavedTopic } from "./routers";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createAuthenticatedContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "topic-reader",
      email: "reader@example.com",
      name: "Topic Reader",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    ...createAuthenticatedContext(),
    user: {
      ...createAuthenticatedContext().user!,
      id: 1,
      role: "admin",
    },
  };
}

describe("articles.list discovery contract", () => {
  beforeEach(() => {
    mockGetArticles.mockReset();
    mockGetArticles.mockResolvedValue([]);
    mockRawQuery.mockReset();
    mockRawQuery.mockResolvedValue([]);
    mockCreateArticle.mockReset();
    mockCreateArticle.mockResolvedValue(undefined);
  });

  it("requests recent stories when no ordering preference is supplied", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await caller.articles.list({ limit: 12 });

    expect(mockGetArticles).toHaveBeenCalledWith(expect.objectContaining({ limit: 12, sortBy: "recent" }));
  });

  it("preserves a reader discovery query while retaining the latest-first default", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await caller.articles.list({ limit: 12, search: "Ryanair" });

    expect(mockGetArticles).toHaveBeenCalledWith(expect.objectContaining({ search: "Ryanair", sortBy: "recent" }));
  });
});

describe("saved-topic alert matching", () => {
  beforeEach(() => {
    mockRawQuery.mockReset();
    mockRawQuery.mockResolvedValue([]);
    mockCreateArticle.mockReset();
    mockCreateArticle.mockResolvedValue(undefined);
  });

  it("matches a saved topic across titles, excerpts, and tags without case sensitivity", () => {
    expect(articleMatchesSavedTopic({ title: "Ryanair launches a route" }, "ryanair")).toBe(true);
    expect(articleMatchesSavedTopic({ excerpt: "A new RYANAIR timetable is live" }, "Ryanair")).toBe(true);
    expect(articleMatchesSavedTopic({ tags: '["British Airways", "Aviation"]' }, "british airways")).toBe(true);
    expect(articleMatchesSavedTopic({ title: "Airbus A350 update" }, "Ryanair")).toBe(false);
  });

  it("stores an authenticated reader's curated topic with alerts enabled", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    await expect(caller.savedTopics.save({ topicSlug: "ryanair" })).resolves.toMatchObject({
      success: true,
      topicSlug: "ryanair",
      alertEnabled: true,
    });
    expect(mockRawQuery).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO saved_topics"), [42, "ryanair", "Ryanair"]);
  });

  it("does not expose saved-topic preferences to unauthenticated visitors", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.savedTopics.list()).rejects.toThrow();
  });

  it("creates a saved-topic notification with an article destination when a matching story is published", async () => {
    mockRawQuery
      .mockResolvedValueOnce([{ id: 501, title: "Ryanair adds a new route", slug: "ryanair-new-route", excerpt: "New Ryanair flights", tags: "[\"Ryanair\"]" }])
      .mockResolvedValueOnce([{ userId: 42, topicSlug: "ryanair" }])
      .mockResolvedValueOnce([]);
    const caller = appRouter.createCaller(createAdminContext());

    await expect(caller.articles.create({
      title: "Ryanair adds a new route",
      slug: "ryanair-new-route",
      content: "Story body",
      tags: "[\"Ryanair\"]",
    })).resolves.toMatchObject({ success: true, savedTopicAlerts: 1 });

    expect(mockRawQuery).toHaveBeenLastCalledWith(
      expect.stringContaining("INSERT INTO notifications"),
      [42, "New Ryanair story", "Ryanair adds a new route", "/article/ryanair-new-route"],
    );
  });

  it("does not create saved-topic alerts when a draft is edited or rejected", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await caller.autopilot.updateDraft({ id: 501, title: "Ryanair draft update" });
    await caller.autopilot.reject({ id: 501 });

    expect(mockRawQuery.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO notifications"))).toBe(false);
  });
});
