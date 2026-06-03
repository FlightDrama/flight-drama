import { useState, useEffect } from "react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Home, Search, Newspaper } from "lucide-react";

export default function NotFound() {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setDotCount((d) => (d + 1) % 4), 600);
    return () => clearInterval(interval);
  }, []);

  const dots = ".".repeat(dotCount);

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)] flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">
          {/* Animated plane */}
          <div className="relative mb-8 h-24 overflow-hidden">
            <div
              className="absolute text-5xl"
              style={{ animation: "fly404 4s ease-in-out infinite", top: "50%", transform: "translateY(-50%)" }}
            >
              ✈
            </div>
            <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed" style={{ borderColor: "oklch(0.85 0.18 95 / 0.25)" }} />
          </div>

          {/* ATC status */}
          <div className="inline-block mb-5 px-4 py-1.5 rounded font-mono text-xs border" style={{ backgroundColor: "oklch(0.15 0 0)", borderColor: "oklch(0.85 0.18 95 / 0.4)", color: "oklch(0.85 0.18 95)" }}>
            SQUAWK 7700 · MAYDAY MAYDAY · PAGE NOT FOUND
          </div>

          {/* 404 */}
          <div className="font-black mb-2 leading-none" style={{ fontSize: "clamp(5rem, 20vw, 9rem)", color: "oklch(0.85 0.18 95)", textShadow: "0 0 60px oklch(0.85 0.18 95 / 0.25)" }}>
            404
          </div>

          <h1 className="text-2xl font-black text-white mb-3 tracking-tight">This Page Has Left The Gate</h1>
          <p className="text-[oklch(0.55_0_0)] mb-1.5 text-sm">ATC is searching for your destination{dots}</p>
          <p className="text-[oklch(0.40_0_0)] mb-10 text-sm max-w-md mx-auto leading-relaxed">
            The page you requested has been moved, deleted, or never existed. Please check your flight plan and try again.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 font-black text-sm uppercase tracking-wide rounded transition-colors" style={{ backgroundColor: "oklch(0.85 0.18 95)", color: "black" }}>
              <Home className="w-4 h-4" /> Return To Terminal
            </Link>
            <Link href="/news" className="inline-flex items-center justify-center gap-2 px-6 py-3 font-black text-sm uppercase tracking-wide rounded border transition-colors hover:bg-[oklch(0.18_0_0)]" style={{ borderColor: "oklch(0.28 0 0)", color: "oklch(0.60 0 0)" }}>
              <Newspaper className="w-4 h-4" /> Browse Stories
            </Link>
            <Link href="/news" className="inline-flex items-center justify-center gap-2 px-6 py-3 font-black text-sm uppercase tracking-wide rounded border transition-colors hover:bg-[oklch(0.18_0_0)]" style={{ borderColor: "oklch(0.28 0 0)", color: "oklch(0.60 0 0)" }}>
              <Search className="w-4 h-4" /> Search
            </Link>
          </div>

          {/* Did you know */}
          <div className="mt-12 p-4 rounded-lg border text-left max-w-md mx-auto" style={{ backgroundColor: "oklch(0.13 0 0)", borderColor: "oklch(0.20 0 0)" }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "oklch(0.85 0.18 95)" }}>✈ Did You Know?</p>
            <p className="text-xs text-[oklch(0.50_0_0)] leading-relaxed">
              Squawk 7700 is the universal aviation emergency transponder code. When a pilot dials it in, air traffic controllers worldwide are immediately alerted — just like this 404.
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <style>{`@keyframes fly404 { 0% { left: -80px; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { left: calc(100% + 80px); opacity: 0; } }`}</style>
    </div>
  );
}
