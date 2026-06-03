import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useParams } from "wouter";
import { RANKS, getRankProgress, formatScore } from "../../../shared/reputation";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, MessageSquare } from "lucide-react";

function EpauletteBars({ count, colour }: { count: number; colour: string }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-3 h-2 rounded-sm" style={{ backgroundColor: i < count ? colour : "#1f2937" }} />
      ))}
    </div>
  );
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: me } = useAuth();
  const numericId = parseInt(userId ?? "0", 10);

  const { data: profile, isLoading } = trpc.reputation.getProfile.useQuery({ userId: numericId });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[oklch(0.10_0_0)]">
        <Navigation />
        <main className="container py-12 text-center">
          <div className="text-4xl mb-4 animate-pulse">✈</div>
          <p className="text-[oklch(0.45_0_0)]">Loading crew profile...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[oklch(0.10_0_0)]">
        <Navigation />
        <main className="container py-12 text-center">
          <p className="text-4xl mb-4">🚫</p>
          <p className="text-[oklch(0.55_0_0)]">Crew member not found.</p>
          <Link href="/crew-ranks" className="mt-4 inline-block text-[oklch(0.85_0.18_95)] hover:underline">← Back to Leaderboard</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const { user, recentThreads, recentComments } = profile;
  const score = user.reputationScore ?? 0;
  const progress = getRankProgress(score);
  const isMe = me?.id === user.id;

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-8 max-w-4xl">
        <Link href="/crew-ranks" className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0_0)] hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
        </Link>

        {/* Profile header */}
        <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl overflow-hidden mb-6">
          {/* Rank colour banner */}
          <div className="h-16" style={{ background: `linear-gradient(135deg, ${progress.current.colour}30, ${progress.current.colour}08)`, borderBottom: `1px solid ${progress.current.colour}30` }} />
          <div className="px-6 pb-6 -mt-8">
            <div className="flex items-end gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-4 shrink-0" style={{ borderColor: progress.current.colour }}>
                {user.avatar
                  ? <img src={user.avatar} alt={user.name ?? "User"} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center font-black text-2xl" style={{ backgroundColor: progress.current.colour + "30", color: progress.current.colour }}>{(user.name ?? "U").charAt(0).toUpperCase()}</div>}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-black text-white">{user.name ?? "Anonymous"}</h1>
                  {isMe && <span className="text-[10px] bg-[oklch(0.85_0.18_95)] text-black font-black px-1.5 py-0.5 rounded">YOU</span>}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded"
                    style={{ backgroundColor: progress.current.colour + "20", color: progress.current.colour, border: `1px solid ${progress.current.colour}40` }}
                  >
                    {progress.current.icon} {progress.current.name}
                  </span>
                  <EpauletteBars count={progress.current.stripes} colour={progress.current.colour} />
                </div>
              </div>
              <div className="text-right pb-1">
                <div className="text-2xl font-black" style={{ color: progress.current.colour }}>{formatScore(score)}</div>
                <div className="text-xs text-[oklch(0.45_0_0)]">reputation pts</div>
              </div>
            </div>

            {/* Bio */}
            {(user as any).bio && (
              <p className="text-sm text-[oklch(0.60_0_0)] italic mb-4">{(user as any).bio}</p>
            )}

            {/* Progress bar */}
            {progress.next && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-[oklch(0.45_0_0)] mb-1.5">
                  <span>{progress.current.name}</span>
                  <span>{formatScore(progress.pointsToNext)} pts to {progress.next.icon} {progress.next.name}</span>
                </div>
                <div className="h-2.5 bg-[oklch(0.18_0_0)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress.progress}%`, backgroundColor: progress.current.colour }} />
                </div>
                <div className="text-[10px] text-[oklch(0.35_0_0)] mt-1 text-right">{progress.progress}% to next rank</div>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Reputation", value: formatScore(score), icon: "⭐" },
                { label: "Forum Posts", value: (user as any).postCount ?? 0, icon: "💬" },
                { label: "Member Since", value: formatDistanceToNow(new Date(user.createdAt), { addSuffix: false }), icon: "📅" },
              ].map(s => (
                <div key={s.label} className="bg-[oklch(0.16_0_0)] rounded-lg p-3 text-center">
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="text-sm font-black text-white">{s.value}</div>
                  <div className="text-[10px] text-[oklch(0.40_0_0)]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rank progression ladder */}
        <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-[oklch(0.18_0_0)]">
            <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">Rank Progression</span>
          </div>
          <div className="p-4">
            <div className="flex gap-1 flex-wrap">
              {RANKS.map((rank) => {
                const achieved = score >= rank.minScore;
                const isCurrent = progress.current.id === rank.id;
                return (
                  <div
                    key={rank.id}
                    title={`${rank.name} — ${formatScore(rank.minScore)}+ pts`}
                    className={`w-8 h-8 rounded flex items-center justify-center text-base transition-all ${isCurrent ? "ring-2 scale-110" : ""} ${achieved ? "" : "opacity-25 grayscale"}`}
                    style={{ backgroundColor: achieved ? rank.colour + "20" : "#1f2937", outline: isCurrent ? `2px solid ${rank.colour}` : undefined }}
                  >
                    {rank.icon}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[oklch(0.40_0_0)] mt-3">
              Rank {progress.current.id} of {RANKS.length} — {RANKS.filter(r => score >= r.minScore).length} ranks achieved
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent forum threads */}
          <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[oklch(0.18_0_0)] flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-[oklch(0.45_0_0)]" />
              <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">Recent Forum Posts</span>
            </div>
            {!recentThreads?.length ? (
              <div className="p-6 text-center text-[oklch(0.40_0_0)] text-sm">No forum posts yet.</div>
            ) : (
              <div className="divide-y divide-[oklch(0.16_0_0)]">
                {recentThreads.map((t: any) => (
                  <Link key={t.id} href={`/forum/thread/${t.id}`} className="block px-4 py-3 hover:bg-[oklch(0.15_0_0)] transition-colors">
                    <p className="text-sm text-white font-bold line-clamp-1 hover:text-[oklch(0.85_0.18_95)] transition-colors">{t.title}</p>
                    <p className="text-[10px] text-[oklch(0.40_0_0)] mt-0.5">{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent article comments */}
          <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[oklch(0.18_0_0)] flex items-center gap-2">
              <span className="text-[oklch(0.45_0_0)] text-sm">✍️</span>
              <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)]">Recent Comments</span>
            </div>
            {!recentComments?.length ? (
              <div className="p-6 text-center text-[oklch(0.40_0_0)] text-sm">No comments yet.</div>
            ) : (
              <div className="divide-y divide-[oklch(0.16_0_0)]">
                {recentComments.map((c: any) => (
                  <Link key={c.id} href={`/article/${c.articleSlug}`} className="block px-4 py-3 hover:bg-[oklch(0.15_0_0)] transition-colors">
                    <p className="text-xs text-[oklch(0.85_0.18_95)] font-bold line-clamp-1 mb-0.5">{c.articleTitle}</p>
                    <p className="text-sm text-[oklch(0.60_0_0)] line-clamp-2 italic">"{c.content}"</p>
                    <p className="text-[10px] text-[oklch(0.40_0_0)] mt-0.5">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
