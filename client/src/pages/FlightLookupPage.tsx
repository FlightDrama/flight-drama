import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RunwayDivider from "@/components/RunwayDivider";
import {
  Search, Plane, Crown, Clock, MapPin, AlertCircle,
  ArrowRight, Radio, TrendingUp, TrendingDown, Minus,
  History, X, Lock, Zap, Star
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HISTORY_KEY = "fd-flight-lookup-history";
const FAVOURITES_KEY = "fd-flight-lookup-favourites";
const MAX_HISTORY = 8;
const MAX_FAVOURITES = 12;

function getHeadingLabel(track: number): string {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(track / 45) % 8];
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    active:    { bg: "bg-green-900/40 border-green-700", text: "text-green-400", label: "✈ Airborne" },
    scheduled: { bg: "bg-blue-900/40 border-blue-700",  text: "text-blue-400",  label: "⏰ Scheduled" },
    landed:    { bg: "bg-[oklch(0.20_0_0)] border-[oklch(0.30_0_0)]", text: "text-[oklch(0.65_0_0)]", label: "✅ Landed" },
    cancelled: { bg: "bg-red-900/40 border-red-700",    text: "text-red-400",   label: "❌ Cancelled" },
    diverted:  { bg: "bg-orange-900/40 border-orange-700", text: "text-orange-400", label: "⚠️ Diverted" },
  };
  const s = map[status] ?? { bg: "bg-[oklch(0.18_0_0)] border-[oklch(0.28_0_0)]", text: "text-[oklch(0.60_0_0)]", label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 border text-xs font-black ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function DelayBadge({ delay }: { delay: number | null }) {
  if (!delay) return <span className="text-xs text-green-400 font-bold flex items-center gap-1"><Minus className="w-3 h-3" /> On Time</span>;
  if (delay > 0) return <span className="text-xs text-red-400 font-bold flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +{delay} min</span>;
  return <span className="text-xs text-green-400 font-bold flex items-center gap-1"><TrendingDown className="w-3 h-3" /> {Math.abs(delay)} min early</span>;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  catch { return "—"; }
}

// ─── Radar loading animation ───────────────────────────────────────────────────

function RadarLoader({ flightCode }: { flightCode: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-5">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-[oklch(0.85_0.18_95)]/15 animate-ping" style={{ animationDuration: "2s" }} />
        <div className="absolute inset-2 rounded-full border border-[oklch(0.85_0.18_95)]/25 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.6s" }} />
        <div className="absolute inset-4 rounded-full border border-[oklch(0.85_0.18_95)]/35 animate-ping" style={{ animationDuration: "2s", animationDelay: "1.2s" }} />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent 65%, oklch(0.85 0.18 95 / 0.35) 100%)",
            animation: "spin 1.5s linear infinite",
          }}
        />
        <Plane className="w-5 h-5 text-[oklch(0.85_0.18_95)] z-10" style={{ transform: "rotate(-45deg)" }} />
      </div>
      <div className="text-center">
        <p className="font-black text-white mb-1">Scanning global airspace...</p>
        <p className="text-sm text-[oklch(0.55_0_0)]">
          Looking up <span className="text-[oklch(0.85_0.18_95)] font-mono font-bold">{flightCode}</span>
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {[0,1,2,3,4].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[oklch(0.85_0.18_95)]"
              style={{ animation: `fd-bounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes fd-bounce {
          0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Free result card (ADSB.lol) ──────────────────────────────────────────────

function FreeResultCard({ ac }: { ac: any }) {
  const altFt = ac.alt_baro ?? ac.alt_geom;
  const speed = ac.gs;
  const track = ac.track;
  const squawk = ac.squawk;
  const type = ac.t;
  const reg = ac.r;
  const onGround = ac.on_ground || altFt === "ground";

  return (
    <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden">
      <div className="bg-[oklch(0.18_0_0)] px-5 py-3 flex items-center justify-between border-b border-[oklch(0.22_0_0)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[oklch(0.85_0.18_95)] flex items-center justify-center">
            <Plane className="w-4 h-4 text-black" style={{ transform: track ? `rotate(${(track || 0) - 45}deg)` : undefined }} />
          </div>
          <div>
            <p className="font-black text-white">{ac.flight?.trim() ?? "—"}</p>
            {type && <p className="text-xs text-[oklch(0.50_0_0)] font-mono">{type}{reg ? ` · ${reg}` : ""}</p>}
          </div>
        </div>
        <span className={`text-xs font-black px-2.5 py-1 border ${onGround ? "bg-[oklch(0.18_0_0)] border-[oklch(0.28_0_0)] text-[oklch(0.55_0_0)]" : "bg-green-900/40 border-green-700 text-green-400"}`}>
          {onGround ? "🛬 On Ground" : "✈ Airborne"}
        </span>
      </div>
      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[oklch(0.18_0_0)] px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.45_0_0)] mb-1">Altitude</p>
          {altFt && altFt !== "ground" ? (
            <>
              <p className="text-base font-black text-[oklch(0.85_0.18_95)]">FL{Math.round(Number(altFt) / 100)}</p>
              <p className="text-[10px] text-[oklch(0.40_0_0)]">{Number(altFt).toLocaleString()} ft</p>
            </>
          ) : (
            <p className="text-base font-black text-[oklch(0.50_0_0)]">On Ground</p>
          )}
        </div>
        <div className="bg-[oklch(0.18_0_0)] px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.45_0_0)] mb-1">Speed</p>
          <p className="text-base font-black text-[oklch(0.85_0.18_95)]">{speed ? `${Math.round(speed)} kts` : "—"}</p>
          {speed && <p className="text-[10px] text-[oklch(0.40_0_0)]">{Math.round(speed * 1.852)} km/h</p>}
        </div>
        <div className="bg-[oklch(0.18_0_0)] px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.45_0_0)] mb-1">Heading</p>
          <p className="text-base font-black text-[oklch(0.85_0.18_95)]">{track ? `${Math.round(track)}°` : "—"}</p>
          {track && <p className="text-[10px] text-[oklch(0.40_0_0)]">{getHeadingLabel(track)}</p>}
        </div>
        <div className="bg-[oklch(0.18_0_0)] px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.45_0_0)] mb-1">Squawk</p>
          <p className="text-base font-black text-white font-mono">{squawk ?? "—"}</p>
          <p className="text-[10px] text-[oklch(0.40_0_0)]">Transponder</p>
        </div>
      </div>
      {/* Free tier limitation note */}
      <div className="px-5 py-2.5 bg-[oklch(0.10_0_0)] border-t border-[oklch(0.18_0_0)] flex items-center justify-between">
        <p className="text-[11px] text-[oklch(0.40_0_0)]">Live ADS-B position data · No schedule or airline info on free tier</p>
        <Link href="/pro" className="text-[11px] text-[oklch(0.85_0.18_95)] font-bold hover:underline flex items-center gap-1">
          <Crown className="w-3 h-3" /> Upgrade for full data
        </Link>
      </div>
    </div>
  );
}

// ─── Pro result card (AviationStack) ──────────────────────────────────────────

function ProResultCard({ flight }: { flight: any }) {
  const dep = flight.departure;
  const arr = flight.arrival;
  const airline = flight.airline;
  const ac = flight.aircraft;
  const live = flight.live;

  return (
    <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.85_0.18_95)]/20 rounded-xl overflow-hidden">
      <div className="bg-[oklch(0.18_0_0)] px-5 py-3 flex items-center justify-between border-b border-[oklch(0.22_0_0)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[oklch(0.85_0.18_95)] flex items-center justify-center">
            <Plane className="w-5 h-5 text-black" />
          </div>
          <div>
            <p className="font-black text-white text-lg">{flight.flight?.iata ?? "—"}</p>
            <p className="text-xs text-[oklch(0.50_0_0)]">{airline?.name ?? "Unknown Airline"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={flight.flight_status} />
          <span className="text-[10px] bg-[oklch(0.85_0.18_95)] text-black font-black px-2 py-0.5 flex items-center gap-1">
            <Crown className="w-2.5 h-2.5" /> PRO
          </span>
        </div>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-3xl font-black text-white">{dep?.iata ?? "—"}</p>
            <p className="text-sm text-[oklch(0.60_0_0)] mt-0.5">{dep?.airport ?? "—"}</p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs text-[oklch(0.50_0_0)]">
                <Clock className="w-3 h-3" />
                <span>Sched: <span className="text-white font-bold">{formatTime(dep?.scheduled)}</span></span>
              </div>
              {dep?.actual && <div className="flex items-center gap-2 text-xs text-[oklch(0.50_0_0)]"><Clock className="w-3 h-3" /><span>Actual: <span className="text-white font-bold">{formatTime(dep?.actual)}</span></span></div>}
              {dep?.terminal && <div className="flex items-center gap-2 text-xs text-[oklch(0.50_0_0)]"><MapPin className="w-3 h-3" /><span>T{dep.terminal}{dep.gate ? ` · G${dep.gate}` : ""}</span></div>}
              <DelayBadge delay={dep?.delay ?? null} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 px-2">
            <span className="text-[oklch(0.85_0.18_95)] text-xl">✈</span>
            <div className="w-16 h-px bg-[oklch(0.28_0_0)]" />
          </div>
          <div className="flex-1 text-right">
            <p className="text-3xl font-black text-white">{arr?.iata ?? "—"}</p>
            <p className="text-sm text-[oklch(0.60_0_0)] mt-0.5">{arr?.airport ?? "—"}</p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs text-[oklch(0.50_0_0)] justify-end">
                <span>Sched: <span className="text-white font-bold">{formatTime(arr?.scheduled)}</span></span>
                <Clock className="w-3 h-3" />
              </div>
              {arr?.terminal && <div className="flex items-center gap-2 text-xs text-[oklch(0.50_0_0)] justify-end"><span>T{arr.terminal}{arr.gate ? ` · G${arr.gate}` : ""}</span><MapPin className="w-3 h-3" /></div>}
              <div className="flex justify-end"><DelayBadge delay={arr?.delay ?? null} /></div>
            </div>
          </div>
        </div>
        {(live || ac) && (
          <div className="border-t border-[oklch(0.20_0_0)] mt-4 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {live?.altitude != null && (
              <div className="bg-[oklch(0.18_0_0)] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.45_0_0)] mb-1">Altitude</p>
                <p className="text-base font-black text-[oklch(0.85_0.18_95)]">FL{Math.round(live.altitude / 100)}</p>
                <p className="text-[10px] text-[oklch(0.40_0_0)]">{Math.round(live.altitude).toLocaleString()} ft</p>
              </div>
            )}
            {live?.speed_horizontal != null && (
              <div className="bg-[oklch(0.18_0_0)] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.45_0_0)] mb-1">Speed</p>
                <p className="text-base font-black text-[oklch(0.85_0.18_95)]">{Math.round(live.speed_horizontal)} kts</p>
                <p className="text-[10px] text-[oklch(0.40_0_0)]">{Math.round(live.speed_horizontal * 1.852)} km/h</p>
              </div>
            )}
            {live?.direction != null && (
              <div className="bg-[oklch(0.18_0_0)] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.45_0_0)] mb-1">Heading</p>
                <p className="text-base font-black text-[oklch(0.85_0.18_95)]">{Math.round(live.direction)}°</p>
                <p className="text-[10px] text-[oklch(0.40_0_0)]">{live.is_ground ? "On Ground" : "Airborne"}</p>
              </div>
            )}
            {ac?.registration && (
              <div className="bg-[oklch(0.18_0_0)] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.45_0_0)] mb-1">Aircraft</p>
                <p className="text-base font-black text-white">{ac.iata ?? ac.icao ?? "—"}</p>
                <p className="text-[10px] text-[oklch(0.40_0_0)] font-mono">{ac.registration}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function FlightLookupPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  const [favourites, setFavourites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
      const storedFavs = localStorage.getItem(FAVOURITES_KEY);
      if (storedFavs) setFavourites(JSON.parse(storedFavs));
    } catch {}
  }, []);

  const toggleFavourite = useCallback((code: string) => {
    setFavourites((prev) => {
      const isFav = prev.includes(code);
      const updated = isFav
        ? prev.filter((f) => f !== code)
        : [code, ...prev].slice(0, MAX_FAVOURITES);
      try { localStorage.setItem(FAVOURITES_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const addToHistory = useCallback((code: string) => {
    setHistory((prev) => {
      const updated = [code, ...prev.filter((h) => h !== code)].slice(0, MAX_HISTORY);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
  };

  const { data: membership } = trpc.membership.getMyMembership.useQuery(
    undefined, { enabled: isAuthenticated }
  );
  const isPro = membership?.status === "active";

  // Free search (ADSB.lol — no cost)
  const { data: freeData, isLoading: freeLoading, error: freeError } = trpc.flightLookup.searchFree.useQuery(
    { callsign: submitted },
    { enabled: !!submitted }
  );

  // Pro search (AviationStack — only fires if Pro and enabled)
  const { data: proData, isLoading: proLoading, error: proError } = trpc.flightLookup.searchPro.useQuery(
    { flightIata: submitted },
    { enabled: !!submitted && isAuthenticated && isPro }
  );

  const isLoading = freeLoading || proLoading;
  const isProComingSoon = proError?.message?.includes("PRO_COMING_SOON");
  const isProRequired = proError?.message?.includes("PRO_REQUIRED");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim().toUpperCase().replace(/\s/g, "");
    if (clean.length >= 2) { setSubmitted(clean); addToHistory(clean); }
  };

  const handleQuickSearch = (code: string) => {
    setQuery(code); setSubmitted(code); addToHistory(code);
  };

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6 max-w-4xl">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Radio className="w-5 h-5 text-[oklch(0.85_0.18_95)]" />
            <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)]">
              LIVE FLIGHT DATA
            </span>
            <span className="flex items-center gap-1 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-green-500 font-bold">LIVE</span>
            </span>
          </div>
          <h1 className="text-3xl font-black text-white">Flight Lookup</h1>
          <p className="text-[oklch(0.55_0_0)] mt-1">
            Search any callsign for live position data — free. Upgrade to Pro for full schedule, airline, and gate info.
          </p>
        </div>

        {/* Free vs Pro comparison table */}
        <div className="mb-6 bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-3 border-b border-[oklch(0.22_0_0)]">
            <div className="bg-[oklch(0.18_0_0)] px-4 py-3">
              <p className="text-xs font-black uppercase tracking-widest text-[oklch(0.50_0_0)]">Feature</p>
            </div>
            <div className="bg-[oklch(0.18_0_0)] px-4 py-3 border-l border-[oklch(0.22_0_0)] flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[oklch(0.65_0_0)]" />
              <p className="text-xs font-black text-white">Free</p>
              <span className="text-[9px] bg-[oklch(0.28_0_0)] text-[oklch(0.60_0_0)] px-1.5 py-0.5 font-bold">EVERYONE</span>
            </div>
            <div className="bg-[oklch(0.85_0.18_95)] px-4 py-3 border-l border-[oklch(0.22_0_0)] flex items-center gap-2">
              <Crown className="w-3.5 h-3.5 text-black" />
              <p className="text-xs font-black text-black">Pro</p>
              <span className="text-[9px] bg-black text-[oklch(0.85_0.18_95)] px-1.5 py-0.5 font-black">£4.99/mo</span>
            </div>
          </div>
          {/* Comparison rows */}
          {[
            { feature: "Live ADS-B position",       free: true,  pro: true,  tip: "Real-time aircraft position from ADS-B transponders worldwide via ADSB.lol" },
            { feature: "Altitude (FL notation)",    free: true,  pro: true,  tip: "Barometric altitude shown as Flight Level (FL350 = 35,000ft)" },
            { feature: "Ground speed (knots)",      free: true,  pro: true,  tip: "Speed over ground in knots and km/h" },
            { feature: "Heading & direction",       free: true,  pro: true,  tip: "True track in degrees with compass direction (N, NE, E...)" },
            { feature: "Squawk code",               free: true,  pro: true,  tip: "4-digit transponder code assigned by ATC. 7700=emergency, 7600=comms failure" },
            { feature: "Aircraft type & reg",       free: true,  pro: true,  tip: "ICAO aircraft type code (B738, A320) and tail registration number" },
            { feature: "Saved favourites",          free: true,  pro: true,  tip: "Save up to 12 callsigns for instant one-click access" },
            { feature: "Search history",            free: true,  pro: true,  tip: "Last 8 searches saved in your browser for quick re-access" },
            { feature: "Departure airport & time",  free: false, pro: true,  tip: "Pro: Scheduled and actual departure time with IATA airport code" },
            { feature: "Arrival airport & time",    free: false, pro: true,  tip: "Pro: Scheduled and actual arrival time with IATA airport code" },
            { feature: "Gate & terminal info",      free: false, pro: true,  tip: "Pro: Departure and arrival gate and terminal numbers" },
            { feature: "Delay status",              free: false, pro: true,  tip: "Pro: Minutes early or late vs scheduled time, colour-coded" },
            { feature: "Airline name & IATA code",  free: false, pro: true,  tip: "Pro: Full airline name and 2-letter IATA code (e.g. BA = British Airways)" },
            { feature: "Historical flight data",    free: false, pro: true,  tip: "Pro: Access past flights and route history for any callsign" },
          ].map((row, i) => (
            <div key={row.feature} className={`grid grid-cols-3 border-b border-[oklch(0.18_0_0)] last:border-b-0 ${i % 2 === 0 ? "" : "bg-[oklch(0.11_0_0)]"}`}>
              <div className="px-4 py-2.5">
                <span className="pro-tooltip text-xs text-[oklch(0.65_0_0)] font-medium">
                  {row.feature}
                  <span className="text-[oklch(0.35_0_0)] text-[10px] ml-1">ⓘ</span>
                  <span className="tooltip-content">{row.tip}</span>
                </span>
              </div>
              <div className="px-4 py-2.5 border-l border-[oklch(0.18_0_0)] flex items-center">
                {row.free
                  ? <span className="text-green-400 text-sm font-black">✓</span>
                  : <span className="text-[oklch(0.30_0_0)] text-sm">—</span>}
              </div>
              <div className="px-4 py-2.5 border-l border-[oklch(0.18_0_0)] flex items-center bg-[oklch(0.85_0.18_95)]/5">
                {row.pro
                  ? <span className="text-[oklch(0.85_0.18_95)] text-sm font-black">✓</span>
                  : <span className="text-[oklch(0.30_0_0)] text-sm">—</span>}
              </div>
            </div>
          ))}
          {/* CTA row */}
          {!isPro && (
            <div className="grid grid-cols-3 bg-[oklch(0.15_0_0)] border-t border-[oklch(0.22_0_0)]">
              <div className="px-4 py-3">
                <p className="text-xs text-[oklch(0.45_0_0)]">Cancel anytime</p>
              </div>
              <div className="px-4 py-3 border-l border-[oklch(0.22_0_0)] flex items-center">
                <span className="text-xs text-[oklch(0.45_0_0)]">Always free</span>
              </div>
              <div className="px-3 py-2.5 border-l border-[oklch(0.22_0_0)]">
                <Link
                  href="/pro"
                  className="block text-center text-xs bg-[oklch(0.85_0.18_95)] text-black font-black py-2 hover:bg-[oklch(0.78_0.18_95)] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Crown className="w-3 h-3" /> Upgrade to Pro →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[oklch(0.45_0_0)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                placeholder="Enter callsign e.g. BA123, EZY79GQ, AA2402"
                className="w-full bg-[oklch(0.15_0_0)] border border-[oklch(0.28_0_0)] rounded-lg pl-12 pr-4 py-3.5 text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors text-base font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={query.trim().length < 2 || isLoading}
              className="bg-[oklch(0.85_0.18_95)] text-black px-6 py-3.5 rounded-lg font-black text-sm hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              {isLoading ? (
                <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Searching...</>
              ) : (
                <><Plane className="w-4 h-4" /> Look Up</>
              )}
            </button>
          </div>
        </form>

        {/* Saved Favourites — with individual delete */}
        {favourites.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[10px] text-[oklch(0.85_0.18_95)] font-bold uppercase tracking-widest">
                <Star className="w-3 h-3 fill-[oklch(0.85_0.18_95)]" /> Saved Flights ({favourites.length})
              </div>
              <button
                onClick={() => { setFavourites([]); try { localStorage.removeItem(FAVOURITES_KEY); } catch {} }}
                className="text-[10px] text-[oklch(0.35_0_0)] hover:text-red-400 transition-colors flex items-center gap-0.5"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {favourites.map((f) => (
                <div key={f} className="flex items-center bg-[oklch(0.18_0_0)] border border-[oklch(0.85_0.18_95)]/30 overflow-hidden">
                  <button
                    onClick={() => handleQuickSearch(f)}
                    className="text-xs font-mono font-bold text-[oklch(0.85_0.18_95)] hover:text-white px-2.5 py-1.5 transition-colors flex items-center gap-1"
                  >
                    <Star className="w-2.5 h-2.5 fill-[oklch(0.85_0.18_95)]" />{f}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavourite(f); }}
                    className="px-1.5 py-1.5 text-[oklch(0.40_0_0)] hover:text-red-400 hover:bg-red-900/20 transition-colors border-l border-[oklch(0.85_0.18_95)]/20"
                    title={`Remove ${f} from saved`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent search history — with individual delete */}
        {history.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[10px] text-[oklch(0.45_0_0)] font-bold uppercase tracking-widest">
                <History className="w-3 h-3" /> Recent Searches
              </div>
              <button onClick={clearHistory} className="text-[10px] text-[oklch(0.35_0_0)] hover:text-[oklch(0.55_0_0)] transition-colors flex items-center gap-0.5">
                <X className="w-3 h-3" /> Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((h) => (
                <div key={h} className="flex items-center bg-[oklch(0.18_0_0)] border border-[oklch(0.25_0_0)] overflow-hidden">
                  <button
                    onClick={() => handleQuickSearch(h)}
                    className="text-xs font-mono font-bold text-[oklch(0.70_0_0)] hover:text-white px-2.5 py-1.5 transition-colors"
                  >
                    {h}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setHistory(prev => { const u = prev.filter(x => x !== h); try { localStorage.setItem(HISTORY_KEY, JSON.stringify(u)); } catch {} return u; }); }}
                    className="px-1.5 py-1.5 text-[oklch(0.35_0_0)] hover:text-red-400 hover:bg-red-900/20 transition-colors border-l border-[oklch(0.28_0_0)]"
                    title={`Remove ${h} from history`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {submitted && (
          <>
            <RunwayDivider label={`Results for ${submitted}`} />

            {isLoading && <RadarLoader flightCode={submitted} />}

        {/* Free results */}
        {!freeLoading && freeData && (
          <>
            {freeData.found && freeData.aircraft.length > 0 ? (
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[oklch(0.45_0_0)]">
                    {freeData.aircraft.length} aircraft found · Live ADS-B data
                  </p>
                  <button
                    onClick={() => toggleFavourite(submitted)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 border transition-colors ${
                      favourites.includes(submitted)
                        ? "border-[oklch(0.85_0.18_95)] bg-[oklch(0.85_0.18_95)]/10 text-[oklch(0.85_0.18_95)]"
                        : "border-[oklch(0.28_0_0)] text-[oklch(0.50_0_0)] hover:border-[oklch(0.85_0.18_95)]/40 hover:text-[oklch(0.85_0.18_95)]"
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${favourites.includes(submitted) ? "fill-[oklch(0.85_0.18_95)]" : ""}`} />
                    {favourites.includes(submitted) ? "Saved" : "Save Flight"}
                  </button>
                </div>
                {freeData.aircraft.map((ac: any, i: number) => (
                  <FreeResultCard key={i} ac={ac} />
                ))}
                  </div>
                ) : !freeLoading && (
                  <div className="text-center py-10 text-[oklch(0.45_0_0)] mb-4">
                    <p className="text-3xl mb-2">🔍</p>
                    <p className="font-black text-white mb-1">Not currently airborne</p>
                    <p className="text-sm">"{submitted}" isn't detected in live airspace right now. It may be on the ground or not yet departed.</p>
                  </div>
                )}
              </>
            )}

            {/* Pro results */}
            {!proLoading && isPro && (
              <>
                {isProComingSoon ? (
                  <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.85_0.18_95)]/20 rounded-xl p-6 text-center">
                    <Crown className="w-8 h-8 text-[oklch(0.85_0.18_95)] mx-auto mb-3" />
                    <p className="font-black text-white mb-1">Pro Schedule Data — Coming Soon</p>
                    <p className="text-sm text-[oklch(0.55_0_0)] max-w-md mx-auto">
                      Full departure/arrival times, gate info, delays, and airline data will be activated for Pro members shortly. Your Pro membership is confirmed and ready.
                    </p>
                  </div>
                ) : proData && proData.flights.length > 0 ? (
                  <div className="space-y-4 mt-4">
                    <RunwayDivider label="Pro Schedule Data" />
                    {proData.flights.map((flight: any, i: number) => (
                      <ProResultCard key={i} flight={flight} />
                    ))}
                  </div>
                ) : null}
              </>
            )}

            {/* Not Pro — Pro upsell after free results */}
            {!isPro && !freeLoading && (
              <div className="mt-4 bg-gradient-to-r from-[oklch(0.15_0_0)] to-[oklch(0.12_0_0)] border border-[oklch(0.85_0.18_95)]/20 rounded-xl p-5 flex items-center gap-5">
                <div className="w-10 h-10 bg-[oklch(0.85_0.18_95)] flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-white mb-0.5">Unlock full flight data with Pro</p>
                  <p className="text-xs text-[oklch(0.55_0_0)]">Departure & arrival times, gate, terminal, delay status, and airline info — from £4.99/month</p>
                </div>
                <Link href="/pro" className="shrink-0 bg-[oklch(0.85_0.18_95)] text-black px-4 py-2 font-black text-sm hover:bg-[oklch(0.78_0.18_95)] transition-colors flex items-center gap-2">
                  <Crown className="w-4 h-4" /> Get Pro
                </Link>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!submitted && (
          <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-8 text-center">
            <p className="text-5xl mb-4">✈</p>
            <h2 className="text-xl font-black text-white mb-2">Track Any Flight in Real Time</h2>
            <p className="text-[oklch(0.55_0_0)] mb-6 max-w-md mx-auto text-sm">
              Enter any callsign to see live position, altitude, and speed — free for everyone. Pro members also get full schedule, gate, and delay data.
            </p>
            <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
              {["BA123", "EZY79GQ", "AA2402"].map((ex) => (
                <button
                  key={ex}
                  onClick={() => handleQuickSearch(ex)}
                  className="bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] hover:border-[oklch(0.85_0.18_95)]/40 text-white font-mono font-bold py-2.5 text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-3 h-3 text-[oklch(0.85_0.18_95)]" /> {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
