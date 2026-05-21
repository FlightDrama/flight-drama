import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Mail, CheckCircle, Loader2, Plane } from "lucide-react";
import { toast } from "sonner";

export default function NewsletterSignup({ source = "sidebar" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);

  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setDone(true);
    },
    onError: (e) => toast.error(e.message || "Something went wrong. Please try again."),
  });

  if (done) {
    return (
      <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.85_0.18_95)]/40 rounded-lg p-5 text-center">
        {/* Success animation */}
        <div className="relative w-14 h-14 mx-auto mb-3">
          <div className="absolute inset-0 rounded-full bg-[oklch(0.85_0.18_95)]/20 animate-ping" />
          <div className="relative w-14 h-14 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-black" />
          </div>
        </div>
        <p className="font-black text-white text-base mb-1">You're in! ✈</p>
        <p className="text-sm text-[oklch(0.60_0_0)]">
          Welcome to the Flight Drama community. Check your inbox for a welcome email.
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[oklch(0.45_0_0)]">
          <Plane className="w-3 h-3 text-[oklch(0.85_0.18_95)]" />
          <span>Breaking aviation news incoming</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.85_0.18_95)]/20 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-5 h-5 text-[oklch(0.85_0.18_95)]" />
        <h3 className="font-black text-white text-sm uppercase tracking-wide">Flight Drama Newsletter</h3>
      </div>
      <p className="text-xs text-[oklch(0.55_0_0)] mb-4">
        Breaking aviation news, weekly deep dives, and community highlights — straight to your inbox.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.trim()) return;
          subscribe.mutate({ email: email.trim(), name: name.trim() || undefined, source });
        }}
        className="space-y-2"
      >
        <input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={subscribe.isPending}
          className="w-full bg-[oklch(0.20_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-sm text-white placeholder-[oklch(0.45_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors disabled:opacity-50"
        />
        <input
          type="email"
          required
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={subscribe.isPending}
          className="w-full bg-[oklch(0.20_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-sm text-white placeholder-[oklch(0.45_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={subscribe.isPending || !email.trim()}
          className="w-full bg-[oklch(0.85_0.18_95)] text-black font-bold text-sm py-2.5 rounded hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {subscribe.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Subscribing...</span>
            </>
          ) : (
            <>
              <Plane className="w-4 h-4" />
              <span>Subscribe Free →</span>
            </>
          )}
        </button>
      </form>
      <p className="text-[10px] text-[oklch(0.40_0_0)] mt-2 text-center">No spam. Unsubscribe anytime.</p>
    </div>
  );
}
