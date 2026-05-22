import { useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

// Fallback items shown while loading or if no breaking articles exist
const FALLBACK_ITEMS = [
  "Delta Flight 234 emergency landing in Dublin — full story inside",
  "Airbus A350 wheel loss incident on BA274 — investigation ongoing",
  "FedEx cargo jet drops onto nose after landing gear failure",
  "Air France flight to Beirut declares emergency and diverts",
  "SAS flight begins takeoff on taxiway instead of runway at Brussels",
  "easyJet A320 diverts to Manchester after declaring emergency mid-flight",
];

export default function BreakingTicker() {
  // Fetch breaking + featured articles to populate the ticker dynamically
  const { data: breakingArticles } = trpc.articles.list.useQuery({
    limit: 10,
    breaking: true,
  });
  const { data: featuredArticles } = trpc.articles.list.useQuery({
    limit: 8,
    featured: true,
  });

  // Build ticker items from real articles, fall back to static items
  const tickerItems = useMemo(() => {
    const items: { text: string; slug?: string }[] = [];

    if (breakingArticles?.length) {
      breakingArticles.forEach((a) => items.push({ text: a.title, slug: a.slug }));
    }
    if (featuredArticles?.length) {
      featuredArticles
        .filter((a) => !items.find((i) => i.slug === a.slug))
        .forEach((a) => items.push({ text: a.title, slug: a.slug }));
    }

    if (items.length === 0) {
      FALLBACK_ITEMS.forEach((text) => items.push({ text }));
    }

    return items;
  }, [breakingArticles, featuredArticles]);

  // Build the ticker string — duplicated so the scroll is seamless
  const tickerContent = tickerItems.map((item, i) => (
    <span key={i} className="inline-flex items-center gap-2 mx-6">
      {item.slug ? (
        <Link
          href={`/article/${item.slug}`}
          className="hover:underline font-bold text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {item.text}
        </Link>
      ) : (
        <span className="font-bold text-xs">{item.text}</span>
      )}
      <span className="text-black font-black text-base leading-none">✈</span>
    </span>
  ));

  return (
    <div className="bg-[oklch(0.85_0.18_95)] text-black py-1.5 overflow-hidden">
      <div className="flex items-center">
        {/* Static BREAKING label */}
        <span className="shrink-0 bg-black text-[oklch(0.85_0.18_95)] text-xs font-black uppercase px-3 py-0.5 ml-4 mr-2 z-10">
          BREAKING
        </span>

        {/* Scrolling ticker — right to left (standard news ticker direction) */}
        <div className="overflow-hidden flex-1 relative">
          <div
            className="flex whitespace-nowrap"
            style={{
              animation: "ticker-rtl 60s linear infinite",
              willChange: "transform",
            }}
          >
            {/* Duplicate content for seamless loop */}
            {tickerContent}
            {tickerContent}
          </div>
        </div>
      </div>

      {/* Ticker animation — enters from left, exits to right */}
      <style>{`
        @keyframes ticker-rtl {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
}
