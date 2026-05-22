import { getPilotRank, getStripeDisplay } from "@/lib/pilotRank";

type PilotBadgeProps = {
  postCount: number;
  size?: "sm" | "md";
};

export default function PilotBadge({ postCount, size = "sm" }: PilotBadgeProps) {
  const rank = getPilotRank(postCount);

  if (size === "md") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-base">{rank.icon}</span>
        <div>
          <p className={`text-xs font-black ${rank.colour} leading-tight`}>{rank.title}</p>
          {rank.stripes > 0 && (
            <p className="text-[oklch(0.85_0.18_95)] text-[9px] leading-none tracking-widest">
              {getStripeDisplay(rank.stripes)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold ${rank.colour}`}
      title={`${rank.title} — ${rank.description}`}
    >
      <span>{rank.icon}</span>
      <span>{rank.title}</span>
      {rank.stripes > 0 && (
        <span className="text-[oklch(0.85_0.18_95)] text-[8px] tracking-tight">
          {getStripeDisplay(rank.stripes)}
        </span>
      )}
    </span>
  );
}
