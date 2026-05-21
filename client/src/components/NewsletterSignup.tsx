import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function NewsletterSignup({ source = "sidebar" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);

  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setDone(true);
      toast.success("You're in! Welcome to the Flight Drama community.");
    },
    onError: (e) => toast.error(e.message || "Something went wrong. Please try again."),
  });

  if (done) {
    return (
      <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.85_0.18_95)]/30 rounded-lg p-5 text-center">
        <CheckCircle className="w-10 h-10 text-[oklch(0.85_0.18_95)] mx-auto mb-2" />
        <p className="font-bold text-white">You're subscribed!</p>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">Check your inbox for a welcome email.</p>
      </div>
    );
  }

  return (
    <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.85_0.18_95)]/20 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-5 h-5 text-[oklch(0.85_0.18_95)]" />
        <h3 className="font-black text-white text-sm uppercase tracking-wide">Flight Drama Newsletter</h3>
      </div>
      <p className="text-xs text-[oklch(0.55_0_0)] mb-4">
        Breaking aviation news, weekly deep dives, and community highlights — straight to your inbox.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          subscribe.mutate({ email, name: name || undefined, source });
        }}
        className="space-y-2"
      >
        <input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[oklch(0.20_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-sm text-white placeholder-[oklch(0.45_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors"
        />
        <input
          type="email"
          required
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[oklch(0.20_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-sm text-white placeholder-[oklch(0.45_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors"
        />
        <button
          type="submit"
          disabled={subscribe.isPending}
          className="w-full bg-[oklch(0.85_0.18_95)] text-black font-bold text-sm py-2.5 rounded hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-60"
        >
          {subscribe.isPending ? "Subscribing..." : "Subscribe Free →"}
        </button>
      </form>
      <p className="text-[10px] text-[oklch(0.40_0_0)] mt-2 text-center">No spam. Unsubscribe anytime.</p>
    </div>
  );
}
