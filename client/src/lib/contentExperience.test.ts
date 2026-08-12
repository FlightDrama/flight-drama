import { describe, expect, it } from "vitest";
import { buildNewsSearchPath, estimateReadingTime, getHomepageFreshnessNotice, getNewsSort, HOMEPAGE_FRESHNESS_THRESHOLD_HOURS } from "./contentExperience";
import { getTopic } from "./topics";

describe("content experience utilities", () => {
  it("keeps latest stories as the default ordering", () => {
    expect(getNewsSort(undefined)).toBe("recent");
    expect(getNewsSort(null)).toBe("recent");
    expect(getNewsSort("popular")).toBe("popular");
  });

  it("creates a safe discovery route from a reader search", () => {
    expect(buildNewsSearchPath("  Ryanair  ")).toBe("/news?search=Ryanair");
    expect(buildNewsSearchPath("Boeing 737 MAX")).toBe("/news?search=Boeing%20737%20MAX");
    expect(buildNewsSearchPath("   ")).toBe("/news");
  });

  it("resolves curated airline and aircraft topic hubs", () => {
    expect(getTopic("ryanair")?.search).toBe("Ryanair");
    expect(getTopic("boeing-737")?.group).toBe("Aircraft");
    expect(getTopic("not-a-topic")).toBeUndefined();
  });

  it("calculates a reader-friendly estimate from article HTML", () => {
    expect(estimateReadingTime("<p>Short update.</p>")).toBe("1 min read");
    expect(estimateReadingTime(`<p>${Array.from({ length: 401 }, () => "word").join(" ")}</p>`)).toBe("2 min read");
  });

  it("only presents a freshness notice after the documented homepage threshold", () => {
    const now = new Date("2026-08-12T12:00:00.000Z");
    expect(getHomepageFreshnessNotice("2026-08-10T12:01:00.000Z", now)).toBeNull();
    expect(getHomepageFreshnessNotice("2026-08-09T11:00:00.000Z", now)).toEqual({
      ageLabel: "3 days",
      thresholdHours: HOMEPAGE_FRESHNESS_THRESHOLD_HOURS,
    });
  });
});
