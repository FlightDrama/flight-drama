import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RunwayDivider from "@/components/RunwayDivider";
import {
  Search, Plane, Crown, Clock, MapPin, AlertCircle,
  ArrowRight, Radio, Gauge, TrendingUp, TrendingDown, Minus
} from "lucide-react";

// Status badge colours
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    active:    { bg: "bg-green-900/40 border-green-700", text: "text-green-400", label: "✈ Airborne" },
    scheduled: { bg: "bg-blue-900/40 border-blue-700",  text: "text-blue-400",  label: "⏰ Scheduled" },
    landed:    { bg: "bg-[oklch(0.20_0_0)] border-[oklch(0.30_0_0)]", text: "text-[oklch(0.65_0_0)]", label: "✅ Landed" },
    cancelled: { bg: "bg-red-900/40 border-red-700",    text: "text-red-400",   label: "❌ Cancelled" },
    diverted:  { bg: "bg-orange-900/40 border-orange-700", text: "text-orange-400", label: "⚠️ Diverted" },
    incident:  { bg: "bg-red-900/40 border-red-700",    text: "text-red-400",   label: "🚨 Incident" },
  };
  const s = map[status] ?? { bg: "bg-[oklch(0.18_0_0)] border-[oklch(0.28_0_0)]", text: "text-[oklch(0.60_0_0)]", label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 border text-xs font-black rounded ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function DelayBadge({ delay }: { delay: number | null }) {
  if (!delay) return <span className="text-xs text-green-400 font-bold flex items-center gap-1"><Minus className="w-3 h-3" /> On Time</span>;
  if (delay > 0) return <span className="text-xs text-red-400 font-bold flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +{delay} min delay</span>;
  return <span className="text-xs text-green-400 font-bold flex items-center gap-1"><TrendingDown className="w-3 h-3" /> {Math.abs(delay)} min early</span>;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return "—"; }
}

function FlightCard({ flight }: { flight: any }) {
  const dep = flight.departure;
  const arr = flight.arrival;
  const airline = flight.airline;
  const ac = flight.aircraft;
  const live = flight.live;

  return (
    <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden hover:border-[oklch(0.85_0.18_95)]/30 transition-colors">
      {/* Header bar */}
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
          {flight.flight_date && (
            <span className="text-xs text-[oklch(0.45_0_0)] font-mono">{flight.flight_date}</span>
          )}
        </div>
      </div>

      {/* Route */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-4">
          {/* Departure */}
          <div className="flex-1">
            <p className="text-3xl font-black text-white">{dep?.iata ?? "—"}</p>
            <p className="text-sm text-[oklch(0.60_0_0)] mt-0.5">{dep?.airport ?? "—"}</p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs text-[oklch(0.50_0_0)]">
                <Clock className="w-3 h-3" />
                <span>Scheduled: <span className="text-white font-bold">{formatTime(dep?.scheduled)}</span></span>
              </div>
              {dep?.actual && (
                <div className="flex items-center gap-2 text-xs text-[oklch(0.50_0_0)]">
                  <Clock className="w-3 h-3" />
                  <span>Actual: <span className="text-white font-bold">{formatTime(dep?.actual)}</span></span>
                </div>
              )}
              {dep?.terminal && (
                <div className="flex items-center gap-2 text-xs text-[oklch(0.50_0_0)]">
                  <MapPin className="w-3 h-3" />
                  <span>Terminal {dep.terminal}{dep.gate ? ` · Gate ${dep.gate}` : ""}</span>
                </div>
              )}
              <DelayBadge delay={dep?.delay ?? null} />
            </div>
          </div>

          {/* Flight path visual */}
          <div className="flex flex-col items-center gap-1 px-4">
            <div className="text-[oklch(0.85_0.18_95)] text-xl">✈</div>
            <div className="w-24 h-px bg-[oklch(0.28_0_0)]" />
            <div className="text-xs text-[oklch(0.40_0_0)] font-mono">
              {flight.flight?.iata ?? ""}
            </div>
          </div>

          {/* Arrival */}
          <div className="flex-1 text-right">
            <p className="text-3xl font-black text-white">{arr?.iata ?? "—"}</p>
            <p className="text-sm text-[oklch(0.60_0_0)] mt-0.5">{arr?.airport ?? "—"}</p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs text-[oklch(0.50_0_0)] justify-end">
                <span>Scheduled: <span className="text-white font-bold">{formatTime(arr?.scheduled)}</span></span>
                <Clock className="w-3 h-3" />
              </div>
              {arr?.actual && (
                <div className="flex items-center gap-2 text-xs text-[oklch(0.50_0_0)] justify-end">
                  <span>Actual: <span className="text-white font-bold">{formatTime(arr?.actual)}</span></span>
                  <Clock className="w-3 h-3" />
                </div>
              )}
              {arr?.terminal && (
                <div className="flex items-center gap-2 text-xs text-[oklch(0.50_0_0)] justify-end">
                  <span>Terminal {arr.terminal}{arr.gate ? ` · Gate ${arr.gate}` : ""}</span>
                  <MapPin className="w-3 h-3" />
                </div>
              )}
              <div className="flex justify-end">
                <DelayBadge delay={arr?.delay ?? null} />
              </div>
            </div>
          </div>
        </div>

        {/* Live data + aircraft info */}
        {(live || ac) && (
          <>
            <div className="border-t border-[oklch(0.20_0_0)] mt-4 pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {live?.altitude != null && (
                  <div className="bg-[oklch(0.18_0_0)] px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.45_0_0)] mb-1">Altitude</p>
                    <p className="text-base font-black text-[oklch(0.85_0.18_95)]">
                      FL{Math.round(live.altitude / 100)}
                    </p>
                    <p className="text-[10px] text-[oklch(0.40_0_0)]">{Math.round(live.altitude).toLocaleString()} ft</p>
                  </div>
                )}
                {live?.speed_horizontal != null && (
                  <div className="bg-[oklch(0.18_0_0)] px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.45_0_0)] mb-1">Speed</p>
                    <p className="text-base font-black text-[oklch(0.85_0.18_95)]">
                      {Math.round(live.speed_horizontal)} kts
                    </p>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function FlightLookupPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data: membership, isLoading: membershipLoading } = trpc.membership.getMyMembership.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data, isLoading, error } = trpc.flightLookup.search.useQuery(
    { flightIata: submitted },
    { enabled: !!submitted && isAuthenticated && membership?.status === "active" }
  );

  const isPro = membership?.status === "active";
  const isProRequired = error?.message?.includes("PRO_REQUIRED");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim().toUpperCase().replace(/\s/g, "");
    if (clean.length >= 2) setSubmitted(clean);
  };

  // Not logged in
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[oklch(0.10_0_0)]">
        <Navigation />
        <main className="container py-16 text-center max-w-md mx-auto">
          <p className="text-5xl mb-4">✈</p>
          <h1 className="text-2xl font-black text-white mb-2">Flight Lookup</h1>
          <p className="text-[oklch(0.55_0_0)] mb-6">Sign in to access the Flight Lookup tool</p>
          <button
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-[oklch(0.85_0.18_95)] text-black px-6 py-3 rounded-lg font-black hover:bg-[oklch(0.78_0.18_95)] transition-colors"
          >
            Sign In ✈
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  // Logged in but not Pro
  if (!membershipLoading && isAuthenticated && !isPro) {
    return (
      <div className="min-h-screen bg-[oklch(0.10_0_0)]">
        <Navigation />
        <main className="container py-16 max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-[oklch(0.85_0.18_95)] to-[oklch(0.75_0.18_95)] rounded-xl p-8 text-black text-center">
            <Crown className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-3xl font-black mb-2">Flight Drama Pro</h1>
            <p className="text-lg opacity-80 mb-2">Flight Lookup is a Pro-exclusive feature</p>
            <p className="opacity-70 mb-6 text-sm">
              Search any flight number in real time — live status, departure and arrival times, gate, terminal, altitude, speed, and aircraft registration. Available exclusively to Flight Drama Pro members.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/pro"
                className="bg-black text-[oklch(0.85_0.18_95)] px-6 py-3 rounded-lg font-black text-sm hover:bg-[oklch(0.10_0_0)] transition-colors inline-flex items-center gap-2"
              >
                <Crown className="w-4 h-4" /> Get Flight Drama Pro →
              </Link>
            </div>
            <p className="text-xs opacity-60 mt-4">From £4.99/month · Cancel anytime</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Radio className="w-5 h-5 text-[oklch(0.85_0.18_95)]" />
            <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)]">
              PRO FEATURE · LIVE FLIGHT DATA
            </span>
            <span className="flex items-center gap-1 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-green-500 font-bold">LIVE</span>
            </span>
          </div>
          <h1 className="text-3xl font-black text-white">Flight Lookup</h1>
          <p className="text-[oklch(0.55_0_0)] mt-1">
            Search any flight number for live status, route, aircraft, and position data
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[oklch(0.45_0_0)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                placeholder="Enter flight number e.g. BA123, EZY79GQ, AA2402"
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
                <><Plane className="w-4 h-4" /> Look Up Flight</>
              )}
            </button>
          </div>
          <p className="text-xs text-[oklch(0.40_0_0)] mt-2">
            Powered by AviationStack · Data updated in real time · 
            <span className="text-[oklch(0.85_0.18_95)]"> Pro feature</span>
          </p>
        </form>

        {/* Results */}
        {submitted && (
          <>
            <RunwayDivider label={`Results for ${submitted}`} />

            {isLoading && (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-2 border-[oklch(0.85_0.18_95)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[oklch(0.55_0_0)]">Scanning global airspace for {submitted}...</p>
              </div>
            )}

            {error && !isProRequired && (
              <div className="flex items-center gap-3 bg-red-900/20 border border-red-700 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{error.message}</p>
              </div>
            )}

            {data && data.flights.length === 0 && (
              <div className="text-center py-12 text-[oklch(0.45_0_0)]">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-black text-white mb-1">No flights found for "{submitted}"</p>
                <p className="text-sm">Try the full IATA code (e.g. BA123, EZY1AB) or check the flight number format</p>
              </div>
            )}

            {data && data.flights.length > 0 && (
              <div className="space-y-4">
                <p className="text-xs text-[oklch(0.45_0_0)]">
                  Found {data.flights.length} result{data.flights.length !== 1 ? "s" : ""} for <span className="text-white font-mono font-bold">{submitted}</span>
                </p>
                {data.flights.map((flight: any, i: number) => (
                  <FlightCard key={i} flight={flight} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty state — no search yet */}
        {!submitted && (
          <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-8 text-center">
            <p className="text-5xl mb-4">✈</p>
            <h2 className="text-xl font-black text-white mb-2">Track Any Flight in Real Time</h2>
            <p className="text-[oklch(0.55_0_0)] mb-6 max-w-md mx-auto">
              Enter any IATA flight number above to see live status, departure and arrival times, gate information, altitude, speed, and aircraft details.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
              {["BA123", "EZY79GQ", "AA2402"].map((ex) => (
                <button
                  key={ex}
                  onClick={() => { setQuery(ex); setSubmitted(ex); }}
                  className="bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] hover:border-[oklch(0.85_0.18_95)]/40 text-white font-mono font-bold py-2.5 px-4 text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[oklch(0.85_0.18_95)]" />
                  {ex}
                </button>
              ))}
            </div>
            <p className="text-xs text-[oklch(0.35_0_0)] mt-4">Click an example to try it</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
