import { useEffect, useState } from "react";

/**
 * FlightStats — a flight-themed stats widget for the sidebar.
 * Shows simulated "live" aviation data with gentle updates to feel dynamic.
 */

function useAnimatedNumber(base: number, variance: number, interval = 4000) {
  const [value, setValue] = useState(base);
  useEffect(() => {
    const timer = setInterval(() => {
      setValue(base + Math.floor(Math.random() * variance * 2) - variance);
    }, interval);
    return () => clearInterval(timer);
  }, [base, variance, interval]);
  return value;
}

export default function FlightStats() {
  const flightsNow = useAnimatedNumber(102450, 800, 5000);
  const altitude = useAnimatedNumber(36000, 500, 3000);
  const airspeed = useAnimatedNumber(487, 12, 3500);

  return (
    <div className="bg-[oklch(0.12_0_0)] border border-[oklch(0.22_0_0)] rounded-lg overflow-hidden">
      {/* Header — like a cockpit instrument panel label */}
      <div className="bg-[oklch(0.18_0_0)] px-4 py-2 flex items-center gap-2 border-b border-[oklch(0.22_0_0)]">
        <span className="text-[oklch(0.85_0.18_95)] text-xs">✈</span>
        <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.65_0_0)]">
          Live Aviation Data
        </span>
        <span className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-green-500 font-bold">LIVE</span>
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Flights in the air right now */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[oklch(0.45_0_0)] uppercase tracking-wider">Flights Airborne</p>
            <p className="text-xl font-black text-white tabular-nums">
              {flightsNow.toLocaleString()}
            </p>
          </div>
          <span className="text-2xl opacity-60">🌍</span>
        </div>

        <div className="border-t border-[oklch(0.20_0_0)]" />

        {/* Typical cruising altitude */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-[oklch(0.45_0_0)] uppercase tracking-wider">Cruise Alt.</p>
            <p className="text-base font-black text-[oklch(0.85_0.18_95)] tabular-nums">
              FL{Math.round(altitude / 100)}
            </p>
            <p className="text-[9px] text-[oklch(0.40_0_0)]">{altitude.toLocaleString()} ft</p>
          </div>
          <div>
            <p className="text-[10px] text-[oklch(0.45_0_0)] uppercase tracking-wider">Airspeed</p>
            <p className="text-base font-black text-[oklch(0.85_0.18_95)] tabular-nums">
              {airspeed} kts
            </p>
            <p className="text-[9px] text-[oklch(0.40_0_0)]">~{Math.round(airspeed * 1.852)} km/h</p>
          </div>
        </div>

        <div className="border-t border-[oklch(0.20_0_0)]" />

        {/* Squawk code of the day */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[oklch(0.45_0_0)] uppercase tracking-wider">Squawk of the Day</p>
            <p className="text-base font-black text-white font-mono">7{Math.floor(Math.random() * 8)}{Math.floor(Math.random() * 8)}{Math.floor(Math.random() * 8)}</p>
          </div>
          <span className="text-[10px] text-[oklch(0.40_0_0)] text-right leading-tight">
            Track flights<br />on FR24 →
          </span>
        </div>
      </div>
    </div>
  );
}
