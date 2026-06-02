/**
 * useReputation hook
 * Provides a simple awardPoints function that can be called from any component
 * when a user performs a reputation-earning action.
 */
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getRankForScore } from "../../../shared/reputation";

export function useReputation() {
  const awardMutation = trpc.reputation.awardPoints.useMutation({
    onSuccess: (result) => {
      if (!result || !result.ok) return;
      // Show rank-up toast if user crossed a rank threshold
      if (result.newRank) {
        const rank = getRankForScore(result.newScore ?? 0);
        // Only show toast for rank changes — check if rank name matches
        if (result.newRank !== rank.name) {
          toast.success(`🎖️ Rank Up! You are now a ${result.newRank}`, {
            description: `+${result.points} reputation points`,
            duration: 5000,
          });
        }
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

  return { awardPoints };
}
