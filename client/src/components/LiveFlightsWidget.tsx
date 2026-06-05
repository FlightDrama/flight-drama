import { useState, useEffect, useCallback } from "react";
import { MapPin, RefreshCw, Plane, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

type Flight = {
  flight: string;
  t: string;          // aircraft type e.g. B738
  alt_baro: number;   // altitude in feet
  gs: number;         // ground speed in knots
  squawk: string;
  lat: number;
  lon: number;
  track: number;      // heading
  baro_rate: number;  // vertical rate ft/min
  r: string;          // registration
  desc: string;       // aircraft description
};

type GeoState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "granted"; lat: number; lon: number; city?: string }
  | { status: "denied" }
  | { status: "error"; message: string };

// Reverse geocode city name from lat/lon using a free API
async function getCityName(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=5`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const addr = data.address;
    return addr.country || addr.state || "your area";
  } catch {
    return "your area";
  }
}

function getVerticalLabel(rate: number): string {
  if (!rate || Math.abs(rate) < 64) return "→ Level";
  if (rate > 0) return `↑ Climbing`;
  return `↓ Descending`;
}

function getHeadingLabel(track: number): string {
  const dirs = ["N","NE","E","SE","S","SW","W","NW","N"];
  return dirs[Math.round(track / 45) % 8];
}

function metersToFeet(m: number): number {
  return Math.round(m * 3.28084);
}

export default function LiveFlightsWidget() {
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [radius] = useState(250); // nm radius

  const fetchFlights = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.adsb.lol/v2/lat/${lat.toFixed(4)}/lon/${lon.toFixed(4)}/dist/${radius}`
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const ac: Flight[] = (data.ac || [])
        .filter((f: any) => f.flight && f.alt_baro && f.alt_baro > 1000) // airborne only
        .slice(0, 50);
      setFlights(ac);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("ADSB fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [radius]);

  const requestLocation = () => {
    setGeo({ status: "requesting" });
    if (!navigator.geolocation) {
      setGeo({ status: "error", message: "Geolocation not supported by your browser" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const city = await getCityName(latitude, longitude);
        setGeo({ status: "granted", lat: latitude, lon: longitude, city });
        fetchFlights(latitude, longitude);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeo({ status: "denied" });
        } else {
          setGeo({ status: "error", message: err.message });
        }
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  };

  // Auto-refresh every 30 seconds once location is granted
  useEffect(() => {
    if (geo.status !== "granted") return;
    const interval = setInterval(() => {
      fetchFlights(geo.lat, geo.lon);
    }, 30000);
    return () => clearInterval(interval);
  }, [geo, fetchFlights]);

  const displayedFlights = expanded ? flights : flights.slice(0, 5);

  return (
    <div className="bg-[oklch(0.12_0_0)] border border-[oklch(0.22_0_0)] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[oklch(0.18_0_0)] px-4 py-2 flex items-center justify-between border-b border-[oklch(0.22_0_0)]">
        <div className="flex items-center gap-2">
          <Plane className="w-3.5 h-3.5 text-[oklch(0.85_0.18_95)]" />
          <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.65_0_0)]">
            Live Flights Near You
          </span>
        </div>
        <div className="flex items-center gap-2">
          {geo.status === "granted" && (
            <>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-green-500 font-bold">LIVE</span>
              </span>
              <button
                onClick={() => fetchFlights((geo as any).lat, (geo as any).lon)}
                disabled={loading}
                className="text-[oklch(0.45_0_0)] hover:text-white transition-colors"
                aria-label="Refresh"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Idle — ask for location */}
        {geo.status === "idle" && (
          <div className="text-center py-3">
            <div className="text-3xl mb-2">🌍</div>
            <p className="text-xs font-bold text-white mb-1">See flights above you right now</p>
            <p className="text-[10px] text-[oklch(0.50_0_0)] mb-3">
              Real ADS-B data from aircraft in your airspace — updated every 30 seconds
            </p>
            <button
              onClick={requestLocation}
              className="flex items-center gap-2 bg-[oklch(0.85_0.18_95)] text-black px-4 py-2 rounded font-black text-xs mx-auto hover:bg-[oklch(0.78_0.18_95)] transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              Show My Local Flights
            </button>
            <p className="text-[9px] text-[oklch(0.35_0_0)] mt-2">Location used locally only — never stored</p>
          </div>
        )}

        {/* Requesting */}
        {geo.status === "requesting" && (
          <div className="text-center py-4">
            <div className="w-8 h-8 border-2 border-[oklch(0.85_0.18_95)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-[oklch(0.55_0_0)]">Detecting your location...</p>
          </div>
        )}

        {/* Denied */}
        {geo.status === "denied" && (
          <div className="text-center py-3">
            <AlertCircle className="w-6 h-6 text-[oklch(0.55_0_0)] mx-auto mb-2" />
            <p className="text-xs font-bold text-white mb-1">Location access denied</p>
            <p className="text-[10px] text-[oklch(0.50_0_0)] mb-3">
              Enable location in your browser settings to see local flights
            </p>
            <button
              onClick={requestLocation}
              className="text-xs text-[oklch(0.85_0.18_95)] hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Error */}
        {geo.status === "error" && (
          <div className="text-center py-3">
            <p className="text-xs text-red-400 mb-2">{(geo as any).message}</p>
            <button onClick={requestLocation} className="text-xs text-[oklch(0.85_0.18_95)] hover:underline">
              Retry
            </button>
          </div>
        )}

        {/* Granted — loading */}
        {geo.status === "granted" && loading && flights.length === 0 && (
          <div className="text-center py-4">
            <div className="w-8 h-8 border-2 border-[oklch(0.85_0.18_95)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-[oklch(0.55_0_0)]">Scanning airspace...</p>
          </div>
        )}

        {/* Granted — flights loaded */}
        {geo.status === "granted" && flights.length > 0 && (
          <>
            {/* Location + count summary */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-[10px] text-[oklch(0.50_0_0)]">
                <MapPin className="w-3 h-3 text-[oklch(0.85_0.18_95)]" />
                <span>Within {radius}nm of {(geo as any).city ?? "you"}</span>
              </div>
              <span className="text-[10px] font-black text-[oklch(0.85_0.18_95)]">
                {flights.length} aircraft
              </span>
            </div>

            {/* Flight list */}
            <div className="space-y-1.5">
              {displayedFlights.map((f, i) => (
                <div
                  key={`${f.flight}-${i}`}
                  className="bg-[oklch(0.16_0_0)] rounded px-3 py-2 border border-[oklch(0.20_0_0)] hover:border-[oklch(0.30_0_0)] transition-colors"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      {/* Rotation based on heading */}
                      <span
                        className="text-[oklch(0.85_0.18_95)] text-sm leading-none"
                        style={{ display: "inline-block", transform: `rotate(${(f.track || 0) - 45}deg)` }}
                      >
                        ✈
                      </span>
                      <span className="text-xs font-black text-white font-mono">
                        {f.flight?.trim() || "UNKNOWN"}
                      </span>
                      {f.t && (
                        <span className="text-[9px] bg-[oklch(0.22_0_0)] text-[oklch(0.55_0_0)] px-1.5 py-0.5 rounded font-mono">
                          {f.t}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[oklch(0.45_0_0)] font-mono">
                      {getHeadingLabel(f.track || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-[oklch(0.45_0_0)]">
                    <span>FL{Math.round((f.alt_baro || 0) / 100)}</span>
                    <span>{Math.round(f.gs || 0)}kts</span>
                    <span className={f.baro_rate > 64 ? "text-green-500" : f.baro_rate < -64 ? "text-red-400" : "text-[oklch(0.45_0_0)]"}>
                      {getVerticalLabel(f.baro_rate)}
                    </span>
                    {f.squawk && <span className="font-mono ml-auto">SQK {f.squawk}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Show more / less */}
            {flights.length > 5 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full mt-2 flex items-center justify-center gap-1 text-[10px] text-[oklch(0.50_0_0)] hover:text-white transition-colors py-1"
              >
                {expanded ? (
                  <><ChevronUp className="w-3 h-3" /> Show less</>
                ) : (
                  <><ChevronDown className="w-3 h-3" /> Show all {flights.length} aircraft</>
                )}
              </button>
            )}

            {/* Last updated */}
            {lastUpdated && (
              <p className="text-[9px] text-[oklch(0.30_0_0)] text-center mt-2">
                Updated {lastUpdated.toLocaleTimeString()} · Refreshes every 30s · Data: ADSB.lol
              </p>
            )}
          </>
        )}

        {/* Granted but no flights */}
        {geo.status === "granted" && !loading && flights.length === 0 && (
          <div className="text-center py-3">
            <p className="text-2xl mb-1">🌙</p>
            <p className="text-xs font-bold text-white mb-1">Quiet skies right now</p>
            <p className="text-[10px] text-[oklch(0.50_0_0)]">
              No aircraft detected within {radius}nm of your location
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
