export type NewsSort = "recent" | "popular";

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
