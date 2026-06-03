import { useEffect, useState } from "react";
import { Link } from "wouter";
import type { Rank } from "../../../shared/reputation";

interface RankUpCelebrationProps {
  rank: Rank;
  onClose: () => void;
}

export default function RankUpCelebration({ rank, onClose }: RankUpCelebrationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 50);
    // Auto-close after 6 seconds
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 400);
    }, 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
      style={{ background: visible ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0)", transition: "background 0.4s ease" }}
    >
      {/* Confetti-style background particles */}
      {visible && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full opacity-80"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: i % 3 === 0 ? rank.colour : i % 3 === 1 ? "#f59e0b" : "#ffffff",
                animation: `confettiFall ${1.5 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`,
                transform: `scale(${0.5 + Math.random()})`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main card */}
      <div
        className="pointer-events-auto relative mx-4 max-w-sm w-full"
        style={{
          transform: visible ? "scale(1) translateY(0)" : "scale(0.8) translateY(40px)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.4s cubic-bezier(0.23,1,0.32,1), opacity 0.4s ease",
        }}
      >
        <div
          className="rounded-2xl overflow-hidden shadow-2xl"
          style={{ border: `2px solid ${rank.colour}`, background: "#0a0a0a" }}
        >
          {/* Rank colour header */}
          <div
            className="px-6 pt-8 pb-4 text-center"
            style={{ background: `linear-gradient(135deg, ${rank.colour}30, ${rank.colour}10)` }}
          >
            <div className="text-7xl mb-3 animate-bounce">{rank.icon}</div>
            <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: rank.colour }}>
              🎉 Rank Up!
            </div>
            <h2 className="text-2xl font-black text-white mb-1">You are now a</h2>
            <h1 className="text-3xl font-black mb-2" style={{ color: rank.colour }}>{rank.name}</h1>
            <p className="text-sm text-[oklch(0.55_0_0)]">{rank.description}</p>
          </div>

          {/* Bottom actions */}
          <div className="px-6 py-4 flex gap-3">
            <Link
              href="/crew-ranks"
              className="flex-1 text-center py-2.5 rounded-lg text-sm font-black transition-colors"
              style={{ backgroundColor: rank.colour, color: "#000" }}
              onClick={onClose}
            >
              View Ranks ✈
            </Link>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-black bg-[oklch(0.18_0_0)] text-[oklch(0.65_0_0)] hover:text-white transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
