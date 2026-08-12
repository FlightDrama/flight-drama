import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { mockGetArticles } = vi.hoisted(() => ({ mockGetArticles: vi.fn() }));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, getArticles: mockGetArticles };
});

import { appRouter } from "./routers";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("articles.list discovery contract", () => {
  beforeEach(() => {
    mockGetArticles.mockReset();
    mockGetArticles.mockResolvedValue([]);
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
