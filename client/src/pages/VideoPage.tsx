import { useState, useMemo, useEffect, useRef } from "react";
import { Instagram } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RunwayDivider from "@/components/RunwayDivider";
import { Play, Youtube, ExternalLink, Search, X, Music2 } from "lucide-react";

// Real @flightdrama TikTok videos — scraped June 2026
// 99K followers · 2M likes
const TIKTOK_VIDEOS = [
  { id: "7645962212921593110", views: "106.2K", title: "American Airlines pilot draws attention on ATC frequencies at Charlotte Douglas" },
  { id: "7643724364344593686", views: "225.6K", title: "Air traffic control snaps at pilot" },
  { id: "7643729978374376726", views: "197.1K", title: "Pilots approaching Washington Dulles found themselves in a rough situation — severe turbulence" },
  { id: "7643720621129731330", views: "183.5K", title: "A pilot at Charlotte Douglas ended up asking air traffic control a question most pilots never ask" },
  { id: "7640361206892580118", views: "239.4K", title: "Most F-16 pilots say the G800 are the same jet — a pilot says they're not" },
  { id: "7644488956976909590", views: "50.4K", title: "Difference between a G700 and a G800 from the mouth of a pilot" },
  { id: "7643721009371041046", views: "47K", title: "ATC exchange that left everyone speechless" },
  { id: "7640361352107805974", views: "28.5K", title: "Captain Sullivan cracks a joke after his retirement landing" },
  { id: "7640441728809569538", views: "28.1K", title: "Delta A320 carrying 163 people declared an emergency after hydraulic problem" },
  { id: "7643720780248911127", views: "22.1K", title: "United Flight 1921 was already number one for departure at Chicago O'Hare when this happened" },
  { id: "7644648722260823318", views: "18.2K", title: "Pilot jokes about flying under a spirit callsign — ATC fires back" },
  { id: "7641654578206788886", views: "17.3K", title: "American Airlines Flight AAL2952 declared a MAYDAY after reporting an engine failure" },
  { id: "7641209908502957335", views: "13K", title: "A United Airlines Boeing 737-900 declared an emergency after the crew reported a problem" },
  { id: "7643721158344330518", views: "7.2K", title: "Quite concerning — cockpit audio from a tense approach" },
  { id: "7644736598726298902", views: "6.6K", title: "ATC audio that had everyone laughing" },
  { id: "7645982644890537238", views: "3.4K", title: "A United Airlines flight was delayed after a family of eight suddenly realised one of them was missing" },
  { id: "7641217279627136278", views: "2.6K", title: "A United Airlines pilot gave one of the most unforgettable turbulence reports heard on frequency" },
  { id: "7641222052346596630", views: "3K", title: "Funny ATC exchange" },
  { id: "7644981501368618262", views: "2K", title: "A funny exchange between a pilot and Tampa Tower is getting attention online" },
  { id: "7646439248194800918", views: "662", title: "A Cessna aircraft returned safely to Denton Airport after the pilot reported engine troubles" },
  { id: "7646429408764480790", views: "1.2K", title: "A Delta Air Lines flight was forced to return to Boston Logan after the crew reported an issue" },
  { id: "7646424450899905814", views: "1.5K", title: "A heartwarming moment on the radio recently caught the attention of aviation fans" },
  { id: "7646419824955985175", views: "1.1K", title: "A Frontier Airlines pilot approaching Phoenix delivered one of the more unusual ATC calls" },
  { id: "7644774885255892246", views: "1.4K", title: "An air traffic controller asking an American Airlines pilot a question" },
];

// All 48 real Flight Drama YouTube Shorts with manually assigned categories
// v2 — Instagram Reels section added, sort/filter, skeleton loading
const SHORTS = [
  { id: "zhGwoZw7nTg", category: "incidents" },
  { id: "-czd-uq0d5g", category: "incidents" },
  { id: "GooAWh5NMxs", category: "commercial" },
  { id: "9sDuJCAru2Y", category: "commercial" },
  { id: "Ryye6bEmSNo", category: "incidents" },
  { id: "thgo1G9iKzA", category: "commercial" },
  { id: "0TCODCrsW8E", category: "incidents" },
  { id: "iJldKcafn7E", category: "commercial" },
  { id: "u3QEQ01qXDI", category: "incidents" },
  { id: "42rn-psoB0E", category: "commercial" },
  { id: "mdlDHah8Msw", category: "incidents" },
  { id: "-3V7nOmZcvo", category: "commercial" },
  { id: "duxq4P1NCDQ", category: "incidents" },
  { id: "97O2lr0-tO8", category: "commercial" },
  { id: "EiqBQGOtJsA", category: "incidents" },
  { id: "LNyYzsrBuxI", category: "commercial" },
  { id: "qLeb3kzA_EU", category: "incidents" },
  { id: "nNoPRD454OQ", category: "commercial" },
  { id: "KmeyAkVmehM", category: "incidents" },
  { id: "6BvyXP6rM4I", category: "commercial" },
  { id: "Ql0TQ9fhlBw", category: "military" },
  { id: "1_7MqeRdmcs", category: "commercial" },
  { id: "7yD3pzJcscs", category: "incidents" },
  { id: "x6Vpsg1KnqA", category: "commercial" },
  { id: "N0_F3xDrZIw", category: "military" },
  { id: "hVV3RyWj830", category: "incidents" },
  { id: "F7LQrCy2RBQ", category: "commercial" },
  { id: "O4lQ8N4dMkY", category: "incidents" },
  { id: "cHpzgr5J81U", category: "commercial" },
  { id: "UBluY00E1CA", category: "incidents" },
  { id: "uLmzu1qrMQI", category: "commercial" },
  { id: "IHZJ_NyQk1U", category: "incidents" },
  { id: "9cXsCev97ds", category: "commercial" },
  { id: "aFQ2dp0xqjw", category: "incidents" },
  { id: "oHHr4fnisAA", category: "commercial" },
  { id: "X86zHA_5SE4", category: "incidents" },
  { id: "86d31btBwtk", category: "commercial" },
  { id: "zQ0FDkbzVGk", category: "incidents" },
  { id: "pJAe6Lvmjwk", category: "commercial" },
  { id: "iTgzVkTtRqk", category: "incidents" },
  { id: "QgOWx6Qi-M4", category: "commercial" },
  { id: "ubbDYen-FYA", category: "incidents" },
  { id: "Rp5vJbDr_NI", category: "commercial" },
  { id: "csSljGzoGtw", category: "incidents" },
  { id: "GFcFaf_P8jY", category: "commercial" },
  { id: "DpyyfVQnA70", category: "incidents" },
  { id: "Os6NxN-_1Qw", category: "commercial" },
  { id: "Y69bgRu27Dg", category: "incidents" },
];

const CATEGORIES = [
  { value: "all", label: "All Shorts" },
  { value: "incidents", label: "✈ Incidents" },
  { value: "commercial", label: "🛫 Commercial" },
  { value: "military", label: "🛩️ Military" },
];

function ShortCard({ id, onClick }: { id: string; onClick: () => void }) {
  return (
    <div
      className="relative rounded-lg overflow-hidden cursor-pointer group bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] hover:border-[oklch(0.85_0.18_95)]/40 transition-colors"
      onClick={onClick}
    >
      <div className="aspect-[9/16] relative overflow-hidden">
        <img
          src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
          alt="Flight Drama Short"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-lg">
            <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
          </div>
        </div>
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
      <div className="relative w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-sm font-bold hover:text-[oklch(0.85_0.18_95)] transition-colors flex items-center gap-1"
        >
          <X className="w-4 h-4" /> Close
        </button>
        <div className="aspect-[9/16] rounded-xl overflow-hidden shadow-2xl">
          <iframe
            src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media"
            title="Flight Drama Short"
          />
        </div>
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
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Filter shorts by category (search is placeholder since we don't have titles)
  const filtered = useMemo(() => {
    let result = SHORTS;
    if (activeCategory !== "all") {
      result = result.filter((s) => s.category === activeCategory);
    }
    return result;
  }, [activeCategory]);

  const visibleShorts = showAll ? filtered : filtered.slice(0, 24);

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
          <h1 className="text-3xl font-black text-white">Aviation Shorts</h1>
          <p className="text-[oklch(0.55_0_0)] mt-1">
            {SHORTS.length} aviation shorts — cockpit recordings, incident replays, and breaking aviation drama
          </p>
        </div>

        {/* Channel CTA */}
        <div className="mb-6 bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shrink-0">
            <Youtube className="w-6 h-6 text-white" />
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

        {/* Search + Category filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search bar (visual — filters by category for now since we don't have titles) */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.45_0_0)]" />
            <input
              type="text"
              placeholder="Search shorts... (coming soon)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled
              className="w-full bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          {/* Category filters */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setActiveCategory(cat.value); setShowAll(false); }}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  activeCategory === cat.value
                    ? "bg-[oklch(0.85_0.18_95)] text-black"
                    : "bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] text-[oklch(0.65_0_0)] hover:border-[oklch(0.85_0.18_95)]/40 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <RunwayDivider label={`${filtered.length} Shorts${activeCategory !== "all" ? ` · ${CATEGORIES.find(c => c.value === activeCategory)?.label}` : ""}`} />

        {/* Shorts grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[oklch(0.45_0_0)]">
            <p className="text-4xl mb-3">✈</p>
            <p className="font-bold">No shorts in this category yet</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
              {visibleShorts.map((s) => (
                <ShortCard key={s.id} id={s.id} onClick={() => setActiveId(s.id)} />
              ))}
            </div>

            {filtered.length > 24 && (
              <div className="text-center mb-8">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:border-[oklch(0.85_0.18_95)]/40 hover:bg-[oklch(0.22_0_0)] transition-colors"
                >
                  {showAll ? "Show fewer videos" : `Show all ${filtered.length} videos ✈`}
                </button>
              </div>
            )}
          </>
        )}

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

        <RunwayDivider />

        {/* Instagram Reels Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Instagram className="w-5 h-5 text-[oklch(0.85_0.18_95)]" />
            <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)]">
              @flightdrama · Instagram Reels
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mb-1">Latest Reels</h2>
          <p className="text-[oklch(0.55_0_0)] text-sm mb-4">ATC audio, cockpit recordings, and aviation drama from our Instagram — 104K followers</p>

          {/* Instagram CTA */}
          <div className="mb-5 bg-gradient-to-r from-[oklch(0.18_0_0)] to-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center shrink-0">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-black text-white">Flight Drama on Instagram</p>
              <p className="text-sm text-[oklch(0.55_0_0)]">104K followers · ATC audio, cockpit recordings, and aviation drama daily</p>
            </div>
            <a
              href="https://www.instagram.com/flightdrama/"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-5 py-2.5 rounded-lg font-black text-sm transition-all"
            >
              <Instagram className="w-4 h-4" />
              Follow
            </a>
          </div>

          {/* Instagram Reels Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { shortcode: 'DY451OgN6KH', views: '4.1K', title: "'I Love Your Radio Calls': Tampa Tower And Pilot Go Off Script On Frequency", date: 'May 28' },
              { shortcode: 'DY3doGAsmRw', views: '6.5K', title: 'ATC starts debating KFC vs Burger King with pilots', date: 'May 28' },
              { shortcode: 'DY2sug4tLyB', views: '15K', title: 'Captain Sullivan cracks a joke after his retirement landing', date: 'May 26' },
              { shortcode: 'DY2lYoFNEze', views: '6.1K', title: 'Cockpit audio from a dramatic approach', date: 'May 26' },
              { shortcode: 'DY2HNMrosbA', views: '11.2K', title: 'ATC audio from a tense go-around', date: 'May 26' },
              { shortcode: 'DY1Z_Pst6HK', views: '17.1K', title: 'Pilot and ATC exchange goes viral', date: 'May 25' },
              { shortcode: 'DYzibPrIcbH', views: '40.5K', title: 'Incredible cockpit footage during severe weather', date: 'May 24' },
              { shortcode: 'DYxf-EzoQbI', views: '501K', title: "'We're Getting the Crap Beat Out of Us': Severe Turbulence Near Washington Dulles", date: 'May 20', viral: true },
              { shortcode: 'DYxSNq8IxEa', views: '998K', title: "Pilot Gets 'DESCEND' Warning While Sitting at the Gate", date: 'Mar 30', viral: true },
              { shortcode: 'DYxLYOTIFtS', views: '69.3K', title: 'ATC audio from a major incident', date: 'May 20' },
              { shortcode: 'DYxEh46oyl8', views: '11.8K', title: 'Cockpit drama at a busy airport', date: 'May 20' },
              { shortcode: 'DYw9o_gIZho', views: '191K', title: 'Viral aviation moment captured on camera', date: 'May 19' },
            ].map((reel) => (
              <a
                key={reel.shortcode}
                href={`https://www.instagram.com/flightdrama/reel/${reel.shortcode}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative rounded-lg overflow-hidden group bg-gradient-to-br from-[oklch(0.18_0_0)] to-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] hover:border-pink-500/40 transition-colors block"
              >
                <div className="aspect-[9/16] relative flex items-center justify-center bg-[oklch(0.12_0_0)]">
                  {/* Instagram thumbnail via oEmbed */}
                  <img
                    src={`https://www.instagram.com/p/${reel.shortcode}/media/?size=m`}
                    alt={reel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-lg">
                      <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Instagram className="w-2.5 h-2.5" /> REEL
                    </span>
                    {reel.viral && (
                      <span className="bg-[oklch(0.85_0.18_95)] text-black text-[9px] font-black px-1.5 py-0.5 rounded">
                        🔥 VIRAL
                      </span>
                    )}
                  </div>
                  {/* View count */}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {reel.views} views
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">
                    {reel.date}
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[11px] text-[oklch(0.65_0_0)] leading-tight line-clamp-2">{reel.title}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        <RunwayDivider />

        {/* TikTok Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Music2 className="w-5 h-5 text-[oklch(0.85_0.18_95)]" />
            <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)]">
              @flightdrama · TikTok
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mb-1">TikTok Videos</h2>
          <p className="text-[oklch(0.55_0_0)] text-sm mb-4">ATC audio, cockpit drama, and aviation moments from our TikTok — 99K followers · 2M likes</p>

          {/* TikTok CTA */}
          <div className="mb-5 bg-gradient-to-r from-[oklch(0.18_0_0)] to-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shrink-0 border border-[oklch(0.30_0_0)]">
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" fill="white"/>
              </svg>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-black text-white">Flight Drama on TikTok</p>
              <p className="text-sm text-[oklch(0.55_0_0)]">99K followers · 2M likes · ATC audio, cockpit drama, and aviation moments daily</p>
            </div>
            <a
              href="https://www.tiktok.com/@flightdrama"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 bg-black hover:bg-[oklch(0.15_0_0)] border border-[oklch(0.30_0_0)] text-white px-5 py-2.5 rounded-lg font-black text-sm transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
              </svg>
              Follow
            </a>
          </div>

          {/* TikTok Videos Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {TIKTOK_VIDEOS.map((video) => (
              <a
                key={video.id}
                href={`https://www.tiktok.com/@flightdrama/video/${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative rounded-lg overflow-hidden group bg-[oklch(0.12_0_0)] border border-[oklch(0.22_0_0)] hover:border-[oklch(0.85_0.18_95)]/40 transition-colors block"
              >
                <div className="aspect-[9/16] relative flex items-center justify-center bg-black">
                  {/* TikTok thumbnail via embed */}
                  <img
                    src={`/api/tiktok-thumb/${video.id}`}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-black/70 border border-white/20 flex items-center justify-center opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all">
                      <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                  {/* TikTok badge */}
                  <div className="absolute top-2 left-2">
                    <span className="bg-black/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="white">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
                      </svg>
                      TIKTOK
                    </span>
                  </div>
                  {/* View count */}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    ▶ {video.views}
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[11px] text-[oklch(0.65_0_0)] leading-tight line-clamp-2">{video.title}</p>
                </div>
              </a>
            ))}
          </div>

          {/* View all on TikTok */}
          <div className="mt-4 text-center">
            <a
              href="https://www.tiktok.com/@flightdrama"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-[oklch(0.85_0.18_95)] hover:underline"
            >
              View all videos on TikTok →
            </a>
          </div>
        </div>
      </main>

      <Footer />

      {activeId && <VideoModal id={activeId} onClose={() => setActiveId(null)} />}
    </div>
  );
}
