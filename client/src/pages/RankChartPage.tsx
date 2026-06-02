import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { RANKS, REPUTATION_POINTS, getRankProgress, formatScore } from "../../../shared/reputation";

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    ground: "bg-gray-800 text-gray-300 border-gray-600",
    cabin: "bg-pink-900/40 text-pink-300 border-pink-700/40",
    flight: "bg-blue-900/40 text-blue-300 border-blue-700/40",
    management: "bg-red-900/40 text-red-300 border-red-700/40",
  };
  const labels: Record<string, string> = {
    ground: "Ground / Maintenance",
    cabin: "Cabin Crew",
    flight: "Flight Crew",
    management: "Management",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${styles[category] ?? styles.ground}`}>
      {labels[category] ?? category}
    </span>
  );
}

const SCORING_ACTIONS = [
  { category: "Forum", actions: [
    { action: "Create a new forum thread", points: 10, icon: "💬", bonus: "First post: +15 bonus" },
    { action: "Reply in a forum thread", points: 5, icon: "↩️", bonus: "" },
    { action: "Upvote a forum post", points: 1, icon: "👍", bonus: "" },
    { action: "Receive an upvote on your post", points: 2, icon: "⬆️", bonus: "" },
  ]},
  { category: "Articles", actions: [
    { action: "Comment on an article", points: 5, icon: "✍️", bonus: "First comment: +10 bonus" },
    { action: "Reply to a comment", points: 3, icon: "💬", bonus: "" },
    { action: "React to an article (✈🔥😮🤔)", points: 2, icon: "✈️", bonus: "" },
    { action: "Share an article", points: 4, icon: "📤", bonus: "First share: +5 bonus" },
    { action: "Upvote a comment", points: 1, icon: "👍", bonus: "" },
    { action: "Save an article to Departure Lounge", points: 1, icon: "🔖", bonus: "" },
  ]},
  { category: "Profile", actions: [
    { action: "Subscribe to the newsletter", points: 5, icon: "📧", bonus: "" },
    { action: "Complete your profile (bio + avatar)", points: 10, icon: "👤", bonus: "" },
    { action: "Upload a profile photo", points: 5, icon: "📷", bonus: "" },
  ]},
  { category: "Milestones", actions: [
    { action: "10th comment milestone", points: 20, icon: "🎉", bonus: "One-time bonus" },
    { action: "50th comment milestone", points: 50, icon: "🎊", bonus: "One-time bonus" },
  ]},
];

export default function RankChartPage() {
  const { isAuthenticated } = useAuth();
  const { data: myProfile } = trpc.reputation.getProfile.useQuery(
    { userId: undefined },
    { enabled: isAuthenticated }
  );

  const myScore = myProfile?.user.reputationScore ?? 0;
  const myProgress = myProfile ? getRankProgress(myScore) : null;

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📊</span>
            <h1 className="text-3xl font-black text-white tracking-tight">POINTS & RANKS</h1>
          </div>
          <p className="text-[oklch(0.55_0_0)] text-sm">
            Earn reputation points by engaging with Flight Drama. Rise through 20 aviation ranks — from Ramp Agent all the way to Hall of Fame.
          </p>
        </div>

        {/* My current rank (if logged in) */}
        {isAuthenticated && myProgress && (
          <div className="mb-8 bg-[oklch(0.85_0.18_95)]/5 border border-[oklch(0.85_0.18_95)]/30 rounded-xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">{myProgress.current.icon}</span>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)] mb-1">Your Current Rank</div>
                <div className="text-2xl font-black text-white">{myProgress.current.name}</div>
                <div className="text-sm text-[oklch(0.55_0_0)]">{myProgress.current.description}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-black text-[oklch(0.85_0.18_95)]">{formatScore(myScore)}</div>
                <div className="text-xs text-[oklch(0.45_0_0)]">reputation points</div>
              </div>
            </div>
            {myProgress.next && (
              <div>
                <div className="flex justify-between text-xs text-[oklch(0.45_0_0)] mb-2">
                  <span>{myProgress.current.name} ({formatScore(myProgress.current.minScore)}+ pts)</span>
                  <span>{myProgress.next.name} ({formatScore(myProgress.next.minScore)}+ pts) — {formatScore(myProgress.pointsToNext)} pts to go</span>
                </div>
                <div className="h-3 bg-[oklch(0.18_0_0)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${myProgress.progress}%`, backgroundColor: myProgress.current.colour }}
                  />
                </div>
                <div className="text-xs text-[oklch(0.40_0_0)] mt-1 text-right">{myProgress.progress}% to next rank</div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: All 20 ranks */}
          <div>
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <span>🏆</span> All 20 Ranks
            </h2>
            <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl overflow-hidden">
              {/* Category headers */}
              {(['ground', 'cabin', 'flight', 'management'] as const).map(cat => {
                const catRanks = RANKS.filter(r => r.category === cat);
                const catLabels = { ground: "Ground / Maintenance", cabin: "Cabin Crew", flight: "Flight Crew", management: "Management" };
                return (
                  <div key={cat}>
                    <div className="px-4 py-2 bg-[oklch(0.16_0_0)] border-b border-[oklch(0.20_0_0)]">
                      <CategoryBadge category={cat} />
                    </div>
                    {catRanks.map((rank) => {
                      const achieved = myScore >= rank.minScore;
                      const isCurrent = myProgress?.current.id === rank.id;
                      return (
                        <div
                          key={rank.id}
                          className={`flex items-center gap-3 px-4 py-2.5 border-b border-[oklch(0.16_0_0)] last:border-0 ${
                            isCurrent ? "bg-[oklch(0.85_0.18_95)]/8" : achieved ? "bg-[oklch(0.14_0_0)]" : "opacity-40"
                          }`}
                        >
                          <span className="text-xl w-7 text-center">{rank.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-sm font-bold"
                                style={{ color: achieved ? rank.colour : "#6b7280" }}
                              >
                                {rank.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] bg-[oklch(0.85_0.18_95)] text-black font-black px-1.5 py-0.5 rounded">YOU</span>
                              )}
                            </div>
                            <div className="text-[10px] text-[oklch(0.35_0_0)]">{rank.description}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-[oklch(0.50_0_0)]">
                              {rank.minScore === 0 ? "Start" : formatScore(rank.minScore) + "+"}
                            </div>
                            <div className="flex gap-0.5 justify-end mt-0.5">
                              {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="w-2 h-1 rounded-sm"
                                  style={{ backgroundColor: i < rank.stripes ? (achieved ? rank.colour : "#374151") : "#1f2937" }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Scoring table */}
          <div>
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <span>⚡</span> How to Earn Points
            </h2>
            <div className="space-y-4">
              {SCORING_ACTIONS.map(({ category, actions }) => (
                <div key={category} className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-[oklch(0.16_0_0)] border-b border-[oklch(0.20_0_0)]">
                    <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.55_0_0)]">{category}</span>
                  </div>
                  <div className="divide-y divide-[oklch(0.16_0_0)]">
                    {actions.map(({ action, points, icon, bonus }) => (
                      <div key={action} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="text-base w-6 text-center">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-[oklch(0.70_0_0)]">{action}</span>
                          {bonus && (
                            <div className="text-[10px] text-[oklch(0.85_0.18_95)] mt-0.5">{bonus}</div>
                          )}
                        </div>
                        <span className="font-black text-[oklch(0.85_0.18_95)] text-sm shrink-0">+{points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick stats */}
            <div className="mt-4 bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl p-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)] mb-3">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[oklch(0.16_0_0)] rounded-lg p-3 text-center">
                  <div className="text-2xl font-black text-[oklch(0.85_0.18_95)]">20</div>
                  <div className="text-xs text-[oklch(0.45_0_0)]">Total Ranks</div>
                </div>
                <div className="bg-[oklch(0.16_0_0)] rounded-lg p-3 text-center">
                  <div className="text-2xl font-black text-[oklch(0.85_0.18_95)]">15</div>
                  <div className="text-xs text-[oklch(0.45_0_0)]">Ways to Earn</div>
                </div>
                <div className="bg-[oklch(0.16_0_0)] rounded-lg p-3 text-center">
                  <div className="text-2xl font-black text-[oklch(0.85_0.18_95)]">500K</div>
                  <div className="text-xs text-[oklch(0.45_0_0)]">Hall of Fame pts</div>
                </div>
                <div className="bg-[oklch(0.16_0_0)] rounded-lg p-3 text-center">
                  <div className="text-2xl font-black text-[oklch(0.85_0.18_95)]">✉️</div>
                  <div className="text-xs text-[oklch(0.45_0_0)]">Email on rank-up</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
