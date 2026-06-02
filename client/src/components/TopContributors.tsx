import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { getRankForScore, formatScore } from "../../../shared/reputation";

export default function TopContributors() {
  const { data: leaderboard } = trpc.reputation.leaderboard.useQuery({ limit: 5 });

  if (!leaderboard?.length) return null;

  return (
    <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[oklch(0.18_0_0)] flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">🏆 Top Contributors</span>
        <Link href="/crew-ranks" className="text-[10px] text-[oklch(0.85_0.18_95)] hover:underline">View all →</Link>
      </div>
      <div className="divide-y divide-[oklch(0.16_0_0)]">
        {leaderboard.map((member: any, index: number) => {
          const rank = getRankForScore(member.reputationScore ?? 0);
          const medals = ["🥇", "🥈", "🥉", "4", "5"];
          const isTop3 = index < 3;
          return (
            <div key={member.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-[oklch(0.15_0_0)] transition-colors">
              <div className={`text-sm font-black w-5 text-center ${isTop3 ? "" : "text-[oklch(0.35_0_0)]"}`}>
                {isTop3 ? medals[index] : `#${index + 1}`}
              </div>
              <div className="w-7 h-7 rounded-full overflow-hidden bg-[oklch(0.22_0_0)] flex items-center justify-center text-[oklch(0.85_0.18_95)] font-black text-xs shrink-0">
                {member.avatar
                  ? <img src={member.avatar} alt={member.name ?? "User"} className="w-full h-full object-cover" />
                  : (member.name ?? "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{member.name ?? "Anonymous"}</div>
                <span
                  className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded ${isTop3 && [22, 23, 24].includes(rank.id) ? "rank-badge-glow" : ""}`}
                  style={{ backgroundColor: rank.colour + "20", color: rank.colour, border: `1px solid ${rank.colour}30` }}
                >
                  {rank.icon} {rank.name}
                </span>
              </div>
              <div className="text-xs font-black text-[oklch(0.85_0.18_95)] shrink-0">
                {formatScore(member.reputationScore ?? 0)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
