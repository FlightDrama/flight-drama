/**
 * useReputation hook
 * Provides a simple awardPoints function that can be called from any component
 * when a user performs a reputation-earning action.
 * Also manages the rank-up celebration modal state.
 */
import { useState, createElement } from "react";
import { trpc } from "@/lib/trpc";
import { getRankForScore } from "../../../shared/reputation";
import type { Rank } from "../../../shared/reputation";
import RankUpCelebration from "@/components/RankUpCelebration";

export function useReputation() {
  const [celebrationRank, setCelebrationRank] = useState<Rank | null>(null);

  const awardMutation = trpc.reputation.awardPoints.useMutation({
    onSuccess: (result) => {
      if (!result || !result.ok) return;
      // Show rank-up celebration if user crossed a rank threshold
      if ((result as any).rankedUp && result.newRank) {
        const rank = getRankForScore((result as any).newScore ?? 0);
        setCelebrationRank(rank);
      }
    },
  });

  const awardPoints = (
    eventType: string,
    referenceId?: number,
    referenceType?: string
  ) => {
    awardMutation.mutate({ eventType, referenceId, referenceType });
  };

  // Returns a React element to render in the component tree, or null
  const CelebrationModal = celebrationRank
    ? createElement(RankUpCelebration, {
        rank: celebrationRank,
        onClose: () => setCelebrationRank(null),
      })
    : null;

  return { awardPoints, CelebrationModal };
}
