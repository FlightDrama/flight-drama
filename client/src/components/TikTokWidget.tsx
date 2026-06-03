import { Play } from "lucide-react";

// Top 5 most viral @flightdrama TikTok videos for the sidebar widget
const TOP_TIKTOK_VIDEOS = [
  { id: "7640361206892580118", views: "239.4K", title: "Most F-16 pilots say the G800 are the same jet — a pilot says they're not" },
  { id: "7643724364344593686", views: "225.6K", title: "Air traffic control snaps at pilot" },
  { id: "7643729978374376726", views: "197.1K", title: "Pilots approaching Washington Dulles — severe turbulence" },
  { id: "7643720621129731330", views: "183.5K", title: "A pilot at Charlotte Douglas asked ATC a question most pilots never ask" },
  { id: "7645962212921593110", views: "106.2K", title: "American Airlines pilot draws attention on ATC frequencies" },
];

// TikTok logo SVG path
const TIKTOK_PATH = "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z";

export default function TikTokWidget() {
  return (
    <div className="bg-[oklch(0.12_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-[oklch(0.18_0_0)] px-4 py-3 flex items-center justify-between border-b border-[oklch(0.22_0_0)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="white">
              <path d={TIKTOK_PATH} />
            </svg>
          </div>
          <div>
            <span className="text-xs font-black text-white">@flightdrama</span>
            <span className="text-[10px] text-[oklch(0.45_0_0)] ml-1.5">TikTok</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black text-[oklch(0.85_0.18_95)]">99K</div>
          <div className="text-[9px] text-[oklch(0.40_0_0)]">followers</div>
        </div>
      </div>

      {/* Video list */}
      <div className="divide-y divide-[oklch(0.16_0_0)]">
        {TOP_TIKTOK_VIDEOS.map((video, i) => (
          <a
            key={video.id}
            href={`https://www.tiktok.com/@flightdrama/video/${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-[oklch(0.16_0_0)] transition-colors group"
          >
            {/* Thumbnail */}
            <div className="relative w-10 h-14 rounded overflow-hidden shrink-0 bg-black">
              <img
                src={`/api/tiktok-thumb/${video.id}`}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                <Play className="w-3 h-3 text-white" fill="white" />
              </div>
              {/* Rank badge */}
              <div
                className="absolute bottom-0.5 right-0.5 text-[8px] font-black px-1 rounded"
                style={{
                  backgroundColor: i === 0 ? "oklch(0.85 0.18 95)" : "oklch(0.25 0 0)",
                  color: i === 0 ? "black" : "oklch(0.55 0 0)",
                }}
              >
                #{i + 1}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[oklch(0.72_0_0)] leading-tight line-clamp-2 group-hover:text-white transition-colors">
                {video.title}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[9px] text-[oklch(0.85_0.18_95)] font-black">▶ {video.views}</span>
                <span className="text-[9px] text-[oklch(0.35_0_0)]">views</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Follow CTA */}
      <div className="px-3 py-3 border-t border-[oklch(0.18_0_0)]">
        <a
          href="https://www.tiktok.com/@flightdrama"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 rounded font-black text-xs transition-colors bg-black hover:bg-[oklch(0.18_0_0)] border border-[oklch(0.30_0_0)] text-white"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="white">
            <path d={TIKTOK_PATH} />
          </svg>
          Follow @flightdrama · 2M likes
        </a>
      </div>
    </div>
  );
}
