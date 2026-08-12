export type NewsSort = "recent" | "popular";
export const HOMEPAGE_FRESHNESS_THRESHOLD_HOURS = 72;

export function getNewsSort(value: string | null | undefined): NewsSort {
  return value === "popular" ? "popular" : "recent";
}

export function buildNewsSearchPath(query: string): string {
  const trimmed = query.trim();
  return trimmed ? `/news?search=${encodeURIComponent(trimmed)}` : "/news";
}

export function estimateReadingTime(html: string, wordsPerMinute = 200): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  const minutes = Math.max(1, Math.round(words / wordsPerMinute));
  return `${minutes} min read`;
}

export function getHomepageFreshnessNotice(
  publishedAt: Date | string | null | undefined,
  now = new Date(),
  thresholdHours = HOMEPAGE_FRESHNESS_THRESHOLD_HOURS,
): { ageLabel: string; thresholdHours: number } | null {
  if (!publishedAt) return null;
  const published = new Date(publishedAt);
  if (Number.isNaN(published.getTime())) return null;

  const ageHours = Math.max(0, Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60)));
  if (ageHours < thresholdHours) return null;

  const ageLabel = ageHours >= 48
    ? `${Math.floor(ageHours / 24)} days`
    : `${ageHours} hours`;
  return { ageLabel, thresholdHours };
}
