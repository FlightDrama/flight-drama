import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RunwayDivider from "@/components/RunwayDivider";
import { Play, Youtube, ExternalLink } from "lucide-react";

// All 48 real Flight Drama YouTube Shorts — scraped May 2026
const SHORTS = [
  { id: "zhGwoZw7nTg" },
  { id: "-czd-uq0d5g" },
  { id: "GooAWh5NMxs" },
  { id: "9sDuJCAru2Y" },
  { id: "Ryye6bEmSNo" },
  { id: "thgo1G9iKzA" },
  { id: "0TCODCrsW8E" },
  { id: "iJldKcafn7E" },
  { id: "u3QEQ01qXDI" },
  { id: "42rn-psoB0E" },
  { id: "mdlDHah8Msw" },
  { id: "-3V7nOmZcvo" },
  { id: "duxq4P1NCDQ" },
  { id: "97O2lr0-tO8" },
  { id: "EiqBQGOtJsA" },
  { id: "LNyYzsrBuxI" },
  { id: "qLeb3kzA_EU" },
  { id: "nNoPRD454OQ" },
  { id: "KmeyAkVmehM" },
  { id: "6BvyXP6rM4I" },
  { id: "Ql0TQ9fhlBw" },
  { id: "1_7MqeRdmcs" },
  { id: "7yD3pzJcscs" },
  { id: "x6Vpsg1KnqA" },
  { id: "N0_F3xDrZIw" },
  { id: "hVV3RyWj830" },
  { id: "F7LQrCy2RBQ" },
  { id: "O4lQ8N4dMkY" },
  { id: "cHpzgr5J81U" },
  { id: "UBluY00E1CA" },
  { id: "uLmzu1qrMQI" },
  { id: "IHZJ_NyQk1U" },
  { id: "9cXsCev97ds" },
  { id: "aFQ2dp0xqjw" },
  { id: "oHHr4fnisAA" },
  { id: "X86zHA_5SE4" },
  { id: "86d31btBwtk" },
  { id: "zQ0FDkbzVGk" },
  { id: "pJAe6Lvmjwk" },
  { id: "iTgzVkTtRqk" },
  { id: "QgOWx6Qi-M4" },
  { id: "ubbDYen-FYA" },
  { id: "Rp5vJbDr_NI" },
  { id: "csSljGzoGtw" },
  { id: "GFcFaf_P8jY" },
  { id: "DpyyfVQnA70" },
  { id: "Os6NxN-_1Qw" },
  { id: "Y69bgRu27Dg" },
];

function ShortCard({ id, onClick }: { id: string; onClick: () => void }) {
  return (
    <div
      className="relative rounded-lg overflow-hidden cursor-pointer group bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] hover:border-[oklch(0.85_0.18_95)]/40 transition-colors"
      onClick={onClick}
    >
      {/* YouTube thumbnail — hqdefault works for all videos */}
      <div className="aspect-[9/16] relative overflow-hidden">
        <img
          src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
          alt="Flight Drama Short"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-lg">
            <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
          </div>
        </div>
        {/* Shorts badge */}
        <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
          <Youtube className="w-2.5 h-2.5" />
          SHORT
        </div>
      </div>
    </div>
  );
}

function VideoModal({ id, onClose }: { id: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-sm font-bold hover:text-[oklch(0.85_0.18_95)] transition-colors"
        >
          ✕ Close
        </button>
        {/* Shorts player — 9:16 aspect ratio */}
        <div className="aspect-[9/16] rounded-xl overflow-hidden shadow-2xl">
          <iframe
            src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media"
            title="Flight Drama Short"
          />
        </div>
        {/* Open on YouTube link */}
        <a
          href={`https://www.youtube.com/shorts/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 text-xs text-[oklch(0.55_0_0)] hover:text-white transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Open on YouTube
        </a>
      </div>
    </div>
  );
}

export default function VideoPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const visibleShorts = showAll ? SHORTS : SHORTS.slice(0, 24);

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6">
        {/* Header */}
        <div className="mb-6 accent-bar">
          <div className="flex items-center gap-3 mb-1">
            <Youtube className="w-5 h-5 text-red-500" />
            <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)]">
              @FlightDrama · YouTube Shorts
            </span>
          </div>
          <h1 className="text-3xl font-black text-white">Aviation Videos</h1>
          <p className="text-[oklch(0.55_0_0)] mt-1">
            {SHORTS.length} aviation shorts — cockpit recordings, incident replays, and breaking aviation drama
          </p>
        </div>

        {/* Channel CTA */}
        <div className="mb-8 bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shrink-0">
            <Youtube className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-black text-white">Flight Drama on YouTube</p>
            <p className="text-sm text-[oklch(0.55_0_0)]">Subscribe for daily aviation shorts, breaking incident coverage, and cockpit drama</p>
          </div>
          <a
            href="https://www.youtube.com/@FlightDrama"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-black text-sm transition-colors"
          >
            <Youtube className="w-4 h-4" />
            Subscribe
          </a>
        </div>

        <RunwayDivider label={`${SHORTS.length} Shorts`} />

        {/* Shorts grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {visibleShorts.map((s) => (
            <ShortCard key={s.id} id={s.id} onClick={() => setActiveId(s.id)} />
          ))}
        </div>

        {/* Show more / less */}
        {SHORTS.length > 24 && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowAll(!showAll)}
              className="bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:border-[oklch(0.85_0.18_95)]/40 hover:bg-[oklch(0.22_0_0)] transition-colors"
            >
              {showAll
                ? `Show fewer videos`
                : `Show all ${SHORTS.length} videos ✈`}
            </button>
          </div>
        )}

        {/* Shorts tab link */}
        <div className="text-center pb-4">
          <a
            href="https://www.youtube.com/@FlightDrama/shorts"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[oklch(0.50_0_0)] hover:text-[oklch(0.85_0.18_95)] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View all shorts on YouTube →
          </a>
        </div>
      </main>

      <Footer />

      {/* Video modal */}
      {activeId && (
        <VideoModal id={activeId} onClose={() => setActiveId(null)} />
      )}
    </div>
  );
}
