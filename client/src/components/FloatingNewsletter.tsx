import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Mail, X, CheckCircle, Loader2, Plane } from "lucide-react";
import { toast } from "sonner";

export default function FloatingNewsletter() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);

  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => setDone(true),
    onError: (e) => toast.error(e.message || "Something went wrong. Please try again."),
  });

  if (dismissed) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    subscribe.mutate({ email: email.trim(), name: name.trim() || undefined, source: "floating-widget" });
  };

  // ── Collapsed CTA bar ─────────────────────────────────────────────────────
  if (!open) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-auto md:right-0 md:w-auto">
        {/* Mobile: full-width bottom bar */}
        <div className="md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="w-full flex items-center justify-between bg-[oklch(0.85_0.18_95)] text-black px-5 py-3 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 shrink-0" />
              <div className="text-left">
                <p className="font-black text-sm leading-tight">Get Flight Drama in your inbox</p>
                <p className="text-xs opacity-70 leading-tight">Breaking news • Free • No spam</p>
              </div>
            </div>
            <span className="bg-black text-[oklch(0.85_0.18_95)] text-xs font-black px-3 py-1.5 rounded shrink-0 ml-3">
              Subscribe →
            </span>
          </button>
        </div>

        {/* Desktop: vertical tab on right edge */}
        <button
          onClick={() => setOpen(true)}
          className="hidden md:flex flex-col items-center justify-center gap-2 bg-[oklch(0.85_0.18_95)] text-black px-2 py-4 rounded-l-lg shadow-xl hover:bg-[oklch(0.78_0.18_95)] transition-colors"
          aria-label="Open newsletter signup"
        >
          <Mail className="w-4 h-4 shrink-0" />
          <span
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            Newsletter
          </span>
          <span className="text-[9px] font-bold opacity-70 rotate-90">→</span>
        </button>
      </div>
    );
  }

  // ── Expanded panel ─────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop on mobile */}
      <div
        className="fixed inset-0 bg-black/60 z-40 md:hidden"
        onClick={() => setOpen(false)}
      />

      {/* Panel — bottom sheet on mobile, right panel on desktop */}
      <div className="fixed z-50 bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-auto md:right-0 md:w-80">
        <div className="bg-[oklch(0.12_0_0)] border border-[oklch(0.25_0_0)] md:border-r-0 md:rounded-l-xl rounded-t-2xl md:rounded-t-none shadow-2xl p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-black" />
              </div>
              <div>
                <p className="font-black text-white text-sm leading-tight">Flight Drama Newsletter</p>
                <p className="text-[10px] text-[oklch(0.50_0_0)]">Breaking aviation news, free</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-[oklch(0.20_0_0)] flex items-center justify-center text-[oklch(0.55_0_0)] hover:text-white hover:bg-[oklch(0.28_0_0)] transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {done ? (
            <div className="text-center py-4">
              <div className="relative w-14 h-14 mx-auto mb-3">
                <div className="absolute inset-0 rounded-full bg-[oklch(0.85_0.18_95)]/20 animate-ping" />
                <div className="relative w-14 h-14 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-black" />
                </div>
              </div>
              <p className="font-black text-white mb-1">You're in! ✈</p>
              <p className="text-sm text-[oklch(0.55_0_0)] mb-4">
                Welcome to the Flight Drama community. Check your inbox for a welcome email.
              </p>
              <button
                onClick={() => setDismissed(true)}
                className="text-xs text-[oklch(0.45_0_0)] hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-[oklch(0.60_0_0)] mb-4 leading-relaxed">
                Join thousands of aviation enthusiasts getting the best stories, breaking incidents, and community highlights delivered weekly.
              </p>
              <form onSubmit={handleSubmit} className="space-y-2.5">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={subscribe.isPending}
                  className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors disabled:opacity-50"
                />
                <input
                  type="email"
                  required
                  placeholder="Your email address *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={subscribe.isPending}
                  className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={subscribe.isPending || !email.trim()}
                  className="w-full bg-[oklch(0.85_0.18_95)] text-black font-black text-sm py-3 rounded-lg hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {subscribe.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Subscribing...</>
                  ) : (
                    <><Plane className="w-4 h-4" /> Subscribe Free →</>
                  )}
                </button>
              </form>
              <div className="flex items-center justify-between mt-3">
                <p className="text-[10px] text-[oklch(0.35_0_0)]">No spam. Unsubscribe anytime.</p>
                <button
                  onClick={() => setDismissed(true)}
                  className="text-[10px] text-[oklch(0.35_0_0)] hover:text-[oklch(0.55_0_0)] transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
