import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { RANKS, getRankProgress, formatScore } from "../../../shared/reputation";
import { formatDistanceToNow } from "date-fns";

// ── Sub-components ──────────────────────────────────────────────────────────

function RankBadge({ rank, size = "md" }: { rank: any; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-[10px] px-1.5 py-0.5", md: "text-xs px-2 py-1", lg: "text-sm px-3 py-1.5" };
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

function EpauletteBars({ count, colour }: { count: number; colour: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-2.5 h-1.5 rounded-sm" style={{ backgroundColor: i < count ? colour : "#1f2937" }} />
      ))}
    </div>
  );
}

const CATEGORY_META: Record<string, { label: string; colour: string; icon: string }> = {
  ground:     { label: "Ground / Maintenance", colour: "#6b7280", icon: "🔧" },
  cabin:      { label: "Cabin Crew",           colour: "#ec4899", icon: "💺" },
  flight:     { label: "Flight Crew",          colour: "#3b82f6", icon: "✈️" },
  management: { label: "Management",           colour: "#ef4444", icon: "🦅" },
};

const SCORING_ACTIONS = [
  { category: "Forum",    icon: "💬", actions: [
    { action: "Create a new forum thread", pts: 10, bonus: "+15 first post" },
    { action: "Reply in a forum thread",   pts: 5,  bonus: "" },
    { action: "Upvote a forum post",       pts: 1,  bonus: "" },
    { action: "Receive an upvote",         pts: 2,  bonus: "" },
  ]},
  { category: "Articles", icon: "✍️", actions: [
    { action: "Comment on an article",     pts: 5,  bonus: "+10 first comment" },
    { action: "Reply to a comment",        pts: 3,  bonus: "" },
    { action: "React to an article",       pts: 2,  bonus: "" },
    { action: "Share an article",          pts: 4,  bonus: "+5 first share" },
    { action: "Upvote a comment",          pts: 1,  bonus: "" },
    { action: "Save to Departure Lounge",  pts: 1,  bonus: "" },
  ]},
  { category: "Profile",  icon: "👤", actions: [
    { action: "Subscribe to newsletter",   pts: 5,  bonus: "" },
    { action: "Complete profile",          pts: 10, bonus: "" },
    { action: "Upload profile photo",      pts: 5,  bonus: "" },
  ]},
  { category: "Milestones", icon: "🎉", actions: [
    { action: "10th comment",              pts: 20, bonus: "One-time" },
    { action: "50th comment",              pts: 50, bonus: "One-time" },
  ]},
];

const RULES = [
  { icon: "🚫", title: "No spam", desc: "Upvoting or reacting to the same item multiple times only counts once. Duplicate actions are ignored." },
  { icon: "✅", title: "Authentic engagement", desc: "Points are awarded for genuine interactions. Creating low-quality posts to farm points may result in score adjustments." },
  { icon: "🔒", title: "Login required for most points", desc: "Reactions, shares, and saves award points only when you are signed in. Anonymous interactions do not count." },
  { icon: "📧", title: "Rank-up notifications", desc: "You will receive an in-app notification and an email whenever you advance to a new rank." },
  { icon: "🏆", title: "Leaderboard updates", desc: "The leaderboard reflects live scores and updates in real time as users earn points." },
  { icon: "⚖️", title: "Fair play", desc: "Accounts found gaming the system will have their scores reset. Flight Drama reserves the right to adjust scores at any time." },
];

// ── Main Page ───────────────────────────────────────────────────────────────

type Tab = 'leaderboard' | 'ranks' | 'scoring' | 'rules';

export default function RanksHubPage() {
  const [tab, setTab] = useState<Tab>('leaderboard');
  const { user, isAuthenticated } = useAuth();
  const { data: leaderboard, isLoading } = trpc.reputation.leaderboard.useQuery({ limit: 50 });
  const { data: myProfile } = trpc.reputation.getProfile.useQuery(
    { userId: undefined },
    { enabled: isAuthenticated }
  );

  const myScore = myProfile?.user.reputationScore ?? 0;
  const myProgress = myProfile ? getRankProgress(myScore) : null;

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'leaderboard', label: 'Leaderboard',  icon: '🏆' },
    { id: 'ranks',       label: 'All Ranks',    icon: '🎖️' },
    { id: 'scoring',     label: 'Scoring',      icon: '⚡' },
    { id: 'rules',       label: 'Rules',        icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-8 max-w-5xl">

        {/* Hero header */}
        <div className="mb-8 text-center">
          <div className="text-5xl mb-3">✈</div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">FLIGHT DRAMA RANKS</h1>
          <p className="text-[oklch(0.55_0_0)] max-w-xl mx-auto">
            Climb the aviation career ladder. Earn reputation by engaging with the community — from Ramp Agent all the way to Hall of Fame.
          </p>
          {!isAuthenticated && (
            <div className="mt-4">
              <Link href="/register" className="inline-flex items-center gap-2 bg-[oklch(0.85_0.18_95)] text-black font-bold px-6 py-2.5 rounded hover:bg-[oklch(0.78_0.18_95)] transition-colors">
                ✈ Join the Crew — Register Free
              </Link>
            </div>
          )}
        </div>

        {/* My rank card */}
        {isAuthenticated && myProgress && (
          <div className="mb-6 bg-[oklch(0.85_0.18_95)]/5 border border-[oklch(0.85_0.18_95)]/30 rounded-xl p-5">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-4xl">{myProgress.current.icon}</span>
              <div className="flex-1">
                <div className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)] mb-0.5">Your Rank</div>
                <div className="text-xl font-black text-white">{myProgress.current.name}</div>
                <div className="text-xs text-[oklch(0.55_0_0)]">{myProgress.current.description}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-[oklch(0.85_0.18_95)]">{formatScore(myScore)}</div>
                <div className="text-xs text-[oklch(0.45_0_0)]">pts</div>
              </div>
            </div>
            {myProgress.next && (
              <>
                <div className="flex justify-between text-xs text-[oklch(0.45_0_0)] mb-1.5">
                  <span>{myProgress.current.name}</span>
                  <span>{myProgress.pointsToNext.toLocaleString()} pts to {myProgress.next.name} {myProgress.next.icon}</span>
                </div>
                <div className="h-2.5 bg-[oklch(0.18_0_0)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${myProgress.progress}%`, backgroundColor: myProgress.current.colour }} />
                </div>
              </>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl p-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-colors ${
                tab === t.id
                  ? "bg-[oklch(0.85_0.18_95)] text-black"
                  : "text-[oklch(0.55_0_0)] hover:text-white"
              }`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── LEADERBOARD TAB ── */}
        {tab === 'leaderboard' && (
          <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[oklch(0.18_0_0)]">
              <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">Top 50 Crew Members</span>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-[oklch(0.45_0_0)]">Loading...</div>
            ) : !leaderboard?.length ? (
              <div className="p-8 text-center">
                <p className="text-4xl mb-3">✈</p>
                <p className="text-[oklch(0.55_0_0)]">No crew members yet. Be the first!</p>
              </div>
            ) : (
              <div className="divide-y divide-[oklch(0.16_0_0)]">
                {leaderboard.map((member: any, index: number) => {
                  const progress = getRankProgress(member.reputationScore ?? 0);
                  const isMe = user?.id === member.id;
                  return (
                    <div key={member.id} className={`flex items-center gap-3 px-5 py-3 ${isMe ? "bg-[oklch(0.85_0.18_95)]/5" : "hover:bg-[oklch(0.15_0_0)]"} transition-colors`}>
                      <div className={`w-8 text-center font-black text-sm ${index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-300" : index === 2 ? "text-amber-600" : "text-[oklch(0.35_0_0)]"}`}>
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                      </div>
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-[oklch(0.22_0_0)] flex items-center justify-center text-[oklch(0.85_0.18_95)] font-black text-sm shrink-0">
                        {member.avatar ? <img src={member.avatar} alt={member.name ?? "User"} className="w-full h-full object-cover" /> : (member.name ?? "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white truncate">
                            {member.name ?? "Anonymous"}{isMe && <span className="text-[oklch(0.85_0.18_95)] ml-1">(You)</span>}
                          </span>
                          <RankBadge rank={progress.current} size="sm" />
                        </div>
                        <EpauletteBars count={progress.current.stripes} colour={progress.current.colour} />
                      </div>
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
        )}

        {/* ── ALL RANKS TAB ── */}
        {tab === 'ranks' && (
          <div className="space-y-4">
            {(['ground', 'cabin', 'flight', 'management'] as const).map(cat => {
              const meta = CATEGORY_META[cat];
              const catRanks = RANKS.filter(r => r.category === cat);
              return (
                <div key={cat} className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-[oklch(0.20_0_0)] flex items-center gap-2" style={{ backgroundColor: meta.colour + "15" }}>
                    <span className="text-lg">{meta.icon}</span>
                    <span className="text-sm font-black uppercase tracking-widest" style={{ color: meta.colour }}>{meta.label}</span>
                  </div>
                  <div className="divide-y divide-[oklch(0.16_0_0)]">
                    {catRanks.map(rank => {
                      const achieved = myScore >= rank.minScore;
                      const isCurrent = myProgress?.current.id === rank.id;
                      return (
                        <div key={rank.id} className={`flex items-center gap-4 px-5 py-3 ${isCurrent ? "bg-[oklch(0.85_0.18_95)]/8" : achieved ? "" : "opacity-40"}`}>
                          <span className="text-2xl w-8 text-center">{rank.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold" style={{ color: achieved ? rank.colour : "#6b7280" }}>{rank.name}</span>
                              {isCurrent && <span className="text-[9px] bg-[oklch(0.85_0.18_95)] text-black font-black px-1.5 py-0.5 rounded">YOUR RANK</span>}
                            </div>
                            <p className="text-xs text-[oklch(0.45_0_0)] mt-0.5">{rank.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-[oklch(0.50_0_0)]">{rank.minScore === 0 ? "Start" : formatScore(rank.minScore) + "+ pts"}</div>
                            <EpauletteBars count={rank.stripes} colour={achieved ? rank.colour : "#374151"} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SCORING TAB ── */}
        {tab === 'scoring' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Total Ranks", value: "20", icon: "🎖️" },
                { label: "Ways to Earn", value: "15+", icon: "⚡" },
                { label: "Max Points/Action", value: "10", icon: "💬" },
                { label: "Hall of Fame", value: "500K", icon: "🌠" },
              ].map(s => (
                <div key={s.label} className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-xl font-black text-[oklch(0.85_0.18_95)]">{s.value}</div>
                  <div className="text-xs text-[oklch(0.45_0_0)]">{s.label}</div>
                </div>
              ))}
            </div>
            {SCORING_ACTIONS.map(({ category, icon, actions }) => (
              <div key={category} className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[oklch(0.18_0_0)] flex items-center gap-2">
                  <span>{icon}</span>
                  <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.55_0_0)]">{category}</span>
                </div>
                <div className="divide-y divide-[oklch(0.16_0_0)]">
                  {actions.map(({ action, pts, bonus }) => (
                    <div key={action} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1">
                        <span className="text-sm text-[oklch(0.70_0_0)]">{action}</span>
                        {bonus && <div className="text-[10px] text-[oklch(0.85_0.18_95)] mt-0.5">✨ {bonus}</div>}
                      </div>
                      <span className="font-black text-[oklch(0.85_0.18_95)] text-base">+{pts}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── RULES TAB ── */}
        {tab === 'rules' && (
          <div className="space-y-3">
            <p className="text-[oklch(0.55_0_0)] text-sm mb-4">
              The Flight Drama rank system is designed to reward genuine community participation. Here are the rules that govern how points are earned and ranks are assigned.
            </p>
            {RULES.map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4 bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl p-4">
                <span className="text-2xl shrink-0">{icon}</span>
                <div>
                  <h3 className="text-sm font-black text-white mb-1">{title}</h3>
                  <p className="text-sm text-[oklch(0.55_0_0)] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
            <div className="bg-[oklch(0.85_0.18_95)]/5 border border-[oklch(0.85_0.18_95)]/30 rounded-xl p-4 mt-4">
              <p className="text-sm text-[oklch(0.70_0_0)]">
                <strong className="text-white">Questions?</strong> Post in the{" "}
                <Link href="/forum" className="text-[oklch(0.85_0.18_95)] hover:underline">Forum</Link>{" "}
                or contact us at{" "}
                <a href="mailto:flightdrama@outlook.com" className="text-[oklch(0.85_0.18_95)] hover:underline">flightdrama@outlook.com</a>.
              </p>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
