import { useState } from "react";
import { getRankForScore, getRankProgress, formatScore } from "../../../shared/reputation";

interface RankBadgeProps {
  reputationScore: number;
  size?: "xs" | "sm" | "md";
  showTooltip?: boolean;
}

// Top 3 rank IDs get a glow animation
const GLOW_RANKS = [18, 19, 20]; // Chief Pilot, Aviation Legend, Hall of Fame

export default function RankBadge({ reputationScore, size = "sm", showTooltip = true }: RankBadgeProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const rank = getRankForScore(reputationScore);
  const progress = getRankProgress(reputationScore);
  const hasGlow = GLOW_RANKS.includes(rank.id);

  const sizes = {
    xs: "text-[9px] px-1.5 py-0.5 gap-0.5",
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1",
  };

  return (
    <div className="relative inline-flex">
      <span
        className={`inline-flex items-center font-bold rounded cursor-default ${sizes[size]} ${hasGlow ? "rank-badge-glow" : ""}`}
        style={{
          backgroundColor: rank.colour + "20",
          color: rank.colour,
          border: `1px solid ${rank.colour}40`,
          boxShadow: hasGlow ? `0 0 8px ${rank.colour}60, 0 0 16px ${rank.colour}30` : undefined,
        }}
        onMouseEnter={() => showTooltip && setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
      >
        <span className="leading-none">{rank.icon}</span>
        <span>{rank.name}</span>
      </span>

      {/* Tooltip */}
      {showTooltip && tooltipVisible && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
          style={{ minWidth: "180px" }}
        >
          <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.25_0_0)] rounded-lg p-3 shadow-2xl text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{rank.icon}</span>
              <div>
                <div className="text-xs font-black text-white">{rank.name}</div>
                <div className="text-[10px] text-[oklch(0.45_0_0)]">{rank.description}</div>
              </div>
            </div>
            <div className="text-[10px] text-[oklch(0.55_0_0)] mb-1.5">
              <span className="font-bold" style={{ color: rank.colour }}>{formatScore(reputationScore)}</span> reputation points
            </div>
            {progress.next ? (
              <>
                <div className="h-1.5 bg-[oklch(0.20_0_0)] rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${progress.progress}%`, backgroundColor: rank.colour }}
                  />
                </div>
                <div className="text-[9px] text-[oklch(0.40_0_0)]">
                  {formatScore(progress.pointsToNext)} pts to <span className="font-bold text-white">{progress.next.icon} {progress.next.name}</span>
                </div>
              </>
            ) : (
              <div className="text-[10px] text-[oklch(0.85_0.18_95)] font-bold">🌠 Maximum rank achieved!</div>
            )}
          </div>
          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-[oklch(0.13_0_0)] border-r border-b border-[oklch(0.25_0_0)] rotate-45 -mt-1" />
          </div>
        </div>
      )}
    </div>
  );
}
