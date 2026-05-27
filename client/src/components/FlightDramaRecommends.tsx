import { ExternalLink, Star } from "lucide-react";

const RECOMMENDATIONS = [
  {
    category: "Flight Tracking",
    name: "FlightRadar24 Premium",
    tagline: "Track any flight live, worldwide",
    badge: "Most Popular",
    badgeColour: "bg-[oklch(0.85_0.18_95)] text-black",
    url: "https://www.flightradar24.com/premium?ref=flightdrama",
    icon: "📡",
  },
  {
    category: "Cheap Flights",
    name: "Skyscanner",
    tagline: "Find the best flight deals instantly",
    badge: "Best Value",
    badgeColour: "bg-green-700 text-white",
    url: "https://www.skyscanner.net/?ref=flightdrama",
    icon: "✈️",
  },
  {
    category: "Airport Lounges",
    name: "Priority Pass",
    tagline: "Access 1,400+ airport lounges worldwide",
    badge: "Editor's Pick",
    badgeColour: "bg-blue-700 text-white",
    url: "https://www.prioritypass.com/?ref=flightdrama",
    icon: "🛋️",
  },
  {
    category: "Aviation Books",
    name: "Amazon Aviation",
    tagline: "Pilot manuals, aviation history & more",
    badge: "Bestseller",
    badgeColour: "bg-orange-700 text-white",
    url: "https://www.amazon.co.uk/s?k=aviation+books&tag=flightdrama-21",
    icon: "📚",
  },
];

export default function FlightDramaRecommends() {
  return (
    <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-[oklch(0.18_0_0)] px-4 py-3 border-b border-[oklch(0.22_0_0)] flex items-center gap-2">
        <Star className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
        <h3 className="font-black text-white text-sm uppercase tracking-wide">✈ FD Recommends</h3>
      </div>

      <div className="divide-y divide-[oklch(0.18_0_0)]">
        {RECOMMENDATIONS.map((rec) => (
          <a
            key={rec.name}
            href={rec.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-start gap-3 p-3.5 hover:bg-[oklch(0.16_0_0)] transition-colors group"
          >
            <span className="text-xl shrink-0 mt-0.5">{rec.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span className={`text-[9px] font-black px-1.5 py-0.5 ${rec.badgeColour}`}>{rec.badge}</span>
                <span className="text-[10px] text-[oklch(0.45_0_0)] uppercase tracking-wide">{rec.category}</span>
              </div>
              <p className="text-sm font-bold text-white group-hover:text-[oklch(0.85_0.18_95)] transition-colors leading-tight">{rec.name}</p>
              <p className="text-[11px] text-[oklch(0.55_0_0)] mt-0.5 leading-tight">{rec.tagline}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[oklch(0.35_0_0)] group-hover:text-[oklch(0.85_0.18_95)] transition-colors shrink-0 mt-1" />
          </a>
        ))}
      </div>

      <div className="px-4 py-2.5 border-t border-[oklch(0.18_0_0)]">
        <p className="text-[9px] text-[oklch(0.30_0_0)]">✈ Flight Drama may earn a commission from these links. We only recommend products we trust.</p>
      </div>
    </div>
  );
}
