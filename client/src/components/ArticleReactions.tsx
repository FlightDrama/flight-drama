import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

const REACTIONS = [
  { key: "love" as const,        emoji: "✈️",  label: "Love it" },
  { key: "fire" as const,        emoji: "🔥",  label: "Hot take" },
  { key: "shocked" as const,     emoji: "😮",  label: "Shocking" },
  { key: "interesting" as const, emoji: "🤔",  label: "Interesting" },
];

// Stable session ID per browser (no auth required)
function getSessionId(): string {
  const key = "fd-session-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    localStorage.setItem(key, id);
  }
  return id;
}

export default function ArticleReactions({ articleId }: { articleId: number }) {
  const [sessionId] = useState(() => {
    try { return getSessionId(); } catch { return "anon-" + Math.random().toString(36).slice(2); }
  });
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set());
  const [localCounts, setLocalCounts] = useState<Record<string, number>>({});

  const { data: counts, refetch } = trpc.reactions.get.useQuery({ articleId });
  const toggle = trpc.reactions.toggle.useMutation({
    onMutate: ({ reaction }) => {
      const isActive = myReactions.has(reaction);
      setMyReactions(prev => {
        const next = new Set(prev);
        isActive ? next.delete(reaction) : next.add(reaction);
        return next;
      });
      setLocalCounts(prev => ({
        ...prev,
        [reaction]: Math.max(0, (prev[reaction] ?? counts?.[reaction] ?? 0) + (isActive ? -1 : 1)),
      }));
    },
    onSettled: () => refetch(),
  });

  useEffect(() => {
    if (counts) setLocalCounts({ ...counts });
  }, [counts]);

  const displayCounts = { ...counts, ...localCounts };

  return (
    <div className="my-6 py-5 border-t border-b border-[oklch(0.20_0_0)]">
      <p className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)] mb-3 text-center">
        What do you think?
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {REACTIONS.map(({ key, emoji, label }) => {
          const count = displayCounts[key] ?? 0;
          const active = myReactions.has(key);
          return (
            <button
              key={key}
              onClick={() => toggle.mutate({ articleId, reaction: key, sessionId })}
              className={`flex items-center gap-2 px-4 py-2.5 border transition-all text-sm font-bold ${
                active
                  ? "bg-[oklch(0.85_0.18_95)] border-[oklch(0.85_0.18_95)] text-black scale-105"
                  : "bg-[oklch(0.15_0_0)] border-[oklch(0.25_0_0)] text-[oklch(0.65_0_0)] hover:border-[oklch(0.85_0.18_95)]/40 hover:text-white"
              }`}
              style={{ transform: active ? "scale(1.05)" : undefined, transition: "all 0.15s cubic-bezier(0.23,1,0.32,1)" }}
            >
              <span className="text-lg leading-none">{emoji}</span>
              <span>{label}</span>
              {count > 0 && (
                <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${active ? "bg-black/20" : "bg-[oklch(0.22_0_0)]"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
