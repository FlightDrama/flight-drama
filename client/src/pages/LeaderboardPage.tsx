import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { RANKS, getRankProgress, formatScore } from "../../../shared/reputation";
import { formatDistanceToNow } from "date-fns";

function RankBadge({ rank, size = "md" }: { rank: any; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-xs px-1.5 py-0.5", md: "text-sm px-2 py-1", lg: "text-base px-3 py-1.5" };
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded ${sizes[size]}`}
      style={{ backgroundColor: rank.colour + "20", color: rank.colour, border: `1px solid ${rank.colour}40` }}
    >
      <span>{rank.icon}</span>
      <span>{rank.name}</span>
    </span>
  );
}

function EpauletteBars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="w-2 h-1 rounded-sm"
          style={{ backgroundColor: i < count ? "#f59e0b" : "#374151" }}
        />
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const { user, isAuthenticated } = useAuth();
  const { data: leaderboard, isLoading } = trpc.reputation.leaderboard.useQuery({ limit: 50 });
  const { data: myProfile } = trpc.reputation.getProfile.useQuery(
    { userId: undefined },
    { enabled: isAuthenticated }
  );

  const myProgress = myProfile ? getRankProgress(myProfile.user.reputationScore ?? 0) : null;

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🏆</span>
            <h1 className="text-3xl font-black text-white tracking-tight">CREW LEADERBOARD</h1>
          </div>
          <p className="text-[oklch(0.55_0_0)] text-sm">
            Earn reputation by engaging with articles, posting in the forum, and sharing content.
            Rise through 15 aviation ranks from Ground Crew to Hall of Fame.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Leaderboard */}
          <div className="lg:col-span-2 space-y-4">
            {/* My rank card (if logged in) */}
            {isAuthenticated && myProfile && myProgress && (
              <div className="bg-[oklch(0.85_0.18_95)]/5 border border-[oklch(0.85_0.18_95)]/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[oklch(0.22_0_0)] flex items-center justify-center text-[oklch(0.85_0.18_95)] font-black">
                    {myProfile.user.avatar ? (
                      <img src={myProfile.user.avatar} alt="You" className="w-full h-full object-cover" />
                    ) : (
                      (myProfile.user.name ?? "U").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">You</span>
                      <RankBadge rank={myProgress.current} size="sm" />
                    </div>
                    <div className="text-xs text-[oklch(0.55_0_0)]">
                      {formatScore(myProfile.user.reputationScore ?? 0)} reputation points
                    </div>
                  </div>
                  <Link href="/profile" className="text-xs text-[oklch(0.85_0.18_95)] hover:underline">
                    View Profile →
                  </Link>
                </div>
                {/* Progress bar */}
                {myProgress.next && (
                  <div>
                    <div className="flex justify-between text-xs text-[oklch(0.45_0_0)] mb-1">
                      <span>{myProgress.current.name}</span>
                      <span>{myProgress.pointsToNext} pts to {myProgress.next.name}</span>
                    </div>
                    <div className="h-2 bg-[oklch(0.18_0_0)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${myProgress.progress}%`,
                          backgroundColor: myProgress.current.colour,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Leaderboard table */}
            <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[oklch(0.18_0_0)] flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">Top Crew Members</span>
              </div>
              {isLoading ? (
                <div className="p-8 text-center text-[oklch(0.45_0_0)]">Loading...</div>
              ) : !leaderboard?.length ? (
                <div className="p-8 text-center">
                  <p className="text-4xl mb-3">✈</p>
                  <p className="text-[oklch(0.55_0_0)]">No crew members yet. Be the first to earn reputation!</p>
                </div>
              ) : (
                <div className="divide-y divide-[oklch(0.16_0_0)]">
                  {leaderboard.map((member: any, index: number) => {
                    const progress = getRankProgress(member.reputationScore ?? 0);
                    const isMe = user?.id === member.id;
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-[oklch(0.85_0.18_95)]/5" : "hover:bg-[oklch(0.15_0_0)]"} transition-colors`}
                      >
                        {/* Rank number */}
                        <div className={`w-8 text-center font-black text-sm ${
                          index === 0 ? "text-yellow-400" :
                          index === 1 ? "text-gray-300" :
                          index === 2 ? "text-amber-600" :
                          "text-[oklch(0.40_0_0)]"
                        }`}>
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                        </div>
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-[oklch(0.22_0_0)] flex items-center justify-center text-[oklch(0.85_0.18_95)] font-black text-sm shrink-0">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name ?? "User"} className="w-full h-full object-cover" />
                          ) : (
                            (member.name ?? "U").charAt(0).toUpperCase()
                          )}
                        </div>
                        {/* Name + rank */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white truncate">
                              {member.name ?? "Anonymous"}
                              {isMe && <span className="text-[oklch(0.85_0.18_95)] ml-1">(You)</span>}
                            </span>
                            <RankBadge rank={progress.current} size="sm" />
                          </div>
                          <EpauletteBars count={progress.current.stripes} />
                        </div>
                        {/* Score */}
                        <div className="text-right">
                          <div className="text-sm font-black text-white">{formatScore(member.reputationScore ?? 0)}</div>
                          <div className="text-xs text-[oklch(0.40_0_0)]">pts</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Rank ladder + how to earn */}
          <div className="space-y-6">
            {/* How to earn points */}
            <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-lg p-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)] mb-4">How to Earn Points</h3>
              <div className="space-y-2">
                {[
                  { action: "Post in the forum", pts: 10, icon: "💬" },
                  { action: "Reply in the forum", pts: 5, icon: "↩️" },
                  { action: "Comment on an article", pts: 5, icon: "✍️" },
                  { action: "Share an article", pts: 4, icon: "📤" },
                  { action: "React to an article", pts: 2, icon: "✈️" },
                  { action: "Upvote a comment", pts: 1, icon: "👍" },
                  { action: "Save an article", pts: 1, icon: "🔖" },
                  { action: "First forum post", pts: 15, icon: "🎉" },
                  { action: "First comment", pts: 10, icon: "🎉" },
                  { action: "Complete profile", pts: 10, icon: "👤" },
                ].map(({ action, pts, icon }) => (
                  <div key={action} className="flex items-center justify-between text-sm">
                    <span className="text-[oklch(0.65_0_0)] flex items-center gap-2">
                      <span>{icon}</span> {action}
                    </span>
                    <span className="font-black text-[oklch(0.85_0.18_95)]">+{pts}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* All 15 ranks */}
            <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-lg p-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)] mb-4">All 15 Ranks</h3>
              <div className="space-y-2">
                {RANKS.map((rank) => {
                  const myScore = myProfile?.user.reputationScore ?? 0;
                  const achieved = myScore >= rank.minScore;
                  return (
                    <div
                      key={rank.id}
                      className={`flex items-center gap-2 p-2 rounded ${achieved ? "bg-[oklch(0.16_0_0)]" : "opacity-50"}`}
                    >
                      <span className="text-lg leading-none w-6 text-center">{rank.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold" style={{ color: achieved ? rank.colour : "#6b7280" }}>
                          {rank.name}
                        </div>
                        <div className="text-[10px] text-[oklch(0.35_0_0)]">
                          {rank.minScore === 0 ? "Start" : formatScore(rank.minScore) + "+ pts"}
                        </div>
                      </div>
                      <EpauletteBars count={rank.stripes} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
