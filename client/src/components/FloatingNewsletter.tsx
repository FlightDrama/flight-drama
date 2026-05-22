import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Mail, X, CheckCircle, Loader2, Plane, ChevronRight } from "lucide-react";
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

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center">
      {/* Expanded panel */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          open ? "w-72 opacity-100" : "w-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-[oklch(0.12_0_0)] border border-[oklch(0.25_0_0)] border-r-0 rounded-l-xl shadow-2xl p-5 w-72">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
              <span className="font-black text-white text-sm uppercase tracking-wide">Newsletter</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[oklch(0.45_0_0)] hover:text-white transition-colors"
              aria-label="Close newsletter panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {done ? (
            <div className="text-center py-3">
              <div className="relative w-12 h-12 mx-auto mb-3">
                <div className="absolute inset-0 rounded-full bg-[oklch(0.85_0.18_95)]/20 animate-ping" />
                <div className="relative w-12 h-12 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-black" />
                </div>
              </div>
              <p className="font-black text-white text-sm mb-1">You're in! ✈</p>
              <p className="text-xs text-[oklch(0.55_0_0)]">Welcome to the Flight Drama community.</p>
              <button
                onClick={() => { setDismissed(true); }}
                className="mt-3 text-xs text-[oklch(0.45_0_0)] hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-[oklch(0.55_0_0)] mb-4 leading-relaxed">
                Breaking aviation news and weekly deep dives — straight to your inbox. Free.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!email.trim()) return;
                  subscribe.mutate({ email: email.trim(), name: name.trim() || undefined, source: "floating-widget" });
                }}
                className="space-y-2"
              >
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={subscribe.isPending}
                  className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-xs text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors disabled:opacity-50"
                />
                <input
                  type="email"
                  required
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={subscribe.isPending}
                  className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-xs text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={subscribe.isPending || !email.trim()}
                  className="w-full bg-[oklch(0.85_0.18_95)] text-black font-bold text-xs py-2.5 rounded hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {subscribe.isPending ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Subscribing...</>
                  ) : (
                    <><Plane className="w-3.5 h-3.5" /> Subscribe Free →</>
                  )}
                </button>
              </form>
              <div className="flex items-center justify-between mt-2">
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

      {/* Tab trigger — always visible on the right edge */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close newsletter signup" : "Open newsletter signup"}
        className="flex flex-col items-center justify-center gap-1.5 bg-[oklch(0.85_0.18_95)] text-black w-8 py-5 rounded-l-lg shadow-xl hover:bg-[oklch(0.78_0.18_95)] transition-colors group"
        style={{ writingMode: "vertical-rl" }}
      >
        <Mail className="w-4 h-4 rotate-90 shrink-0" style={{ writingMode: "horizontal-tb" }} />
        <span
          className="text-[10px] font-black uppercase tracking-widest leading-none"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          Newsletter
        </span>
        <ChevronRight
          className={`w-3 h-3 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          style={{ writingMode: "horizontal-tb" }}
        />
      </button>
    </div>
  );
}
