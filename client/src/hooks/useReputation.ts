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
      if ((result as any).rankedUp && result.newRank) {
        const rank = getRankForScore((result as any).newScore ?? 0);
        toast.success(`${rank.icon} Rank Up! You are now a ${result.newRank}`, {
          description: `Keep engaging to climb higher! ✈`,
          duration: 6000,
        });
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
