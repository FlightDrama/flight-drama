import { Link } from "wouter";
import { Crown, Lock, CheckCircle } from "lucide-react";

const PRO_PERKS = [
  "Ad-free reading on all articles",
  "Exclusive Pro-only deep dives and analysis",
  "VIP forum badge and priority posting",
  "Live flight lookup with full airline data",
  "Early access to Flight Drama features",
];

export default function ProContentGate({ articleTitle }: { articleTitle?: string }) {
  return (
    <div className="relative">
      {/* Blurred content preview */}
      <div className="relative overflow-hidden rounded-xl border border-[oklch(0.85_0.18_95)]/30">
        {/* Fake blurred content */}
        <div className="p-6 space-y-3 select-none pointer-events-none" style={{ filter: "blur(4px)" }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`h-4 bg-[oklch(0.25_0_0)] rounded ${i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-5/6" : "w-4/6"}`} />
          ))}
          <div className="h-4 bg-[oklch(0.25_0_0)] rounded w-3/4" />
          <div className="h-4 bg-[oklch(0.25_0_0)] rounded w-full" />
          <div className="h-4 bg-[oklch(0.25_0_0)] rounded w-2/3" />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[oklch(0.10_0_0)]/60 to-[oklch(0.10_0_0)] flex flex-col items-center justify-end pb-6 px-6">
        </div>
      </div>

      {/* Gate card */}
      <div className="mt-4 bg-[oklch(0.13_0_0)] border border-[oklch(0.85_0.18_95)]/30 rounded-xl overflow-hidden">
        {/* Yellow header bar */}
        <div className="bg-[oklch(0.85_0.18_95)] px-5 py-3 flex items-center gap-3">
          <Lock className="w-4 h-4 text-black" />
          <span className="font-black text-black text-sm uppercase tracking-wide">Flight Drama Pro — Exclusive Content</span>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 bg-[oklch(0.85_0.18_95)] flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6 text-black" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white mb-1">
                This article is exclusive to Pro members
              </h3>
              <p className="text-sm text-[oklch(0.60_0_0)] leading-relaxed">
                {articleTitle
                  ? `"${articleTitle}" is a Pro-only deep dive. Upgrade to read the full story plus all exclusive Pro content.`
                  : "Upgrade to Flight Drama Pro to read this article and access all exclusive Pro content."}
              </p>
            </div>
          </div>

          {/* Perks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {PRO_PERKS.map(perk => (
              <div key={perk} className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[oklch(0.85_0.18_95)] shrink-0" />
                <span className="text-xs text-[oklch(0.65_0_0)]">{perk}</span>
              </div>
            ))}
          </div>

          {/* Pricing + CTA */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Link
              href="/pro"
              className="flex-1 sm:flex-none bg-[oklch(0.85_0.18_95)] text-black font-black px-8 py-3 text-center hover:bg-[oklch(0.78_0.18_95)] transition-colors flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Unlock with Pro — from £4.99/month
            </Link>
            <div className="text-center sm:text-left">
              <p className="text-xs text-[oklch(0.50_0_0)]">or</p>
              <p className="text-xs text-[oklch(0.50_0_0)]">£39.99/year — save 33%</p>
            </div>
          </div>

          <p className="text-[10px] text-[oklch(0.35_0_0)] mt-3">Cancel anytime. No commitment.</p>
        </div>
      </div>
    </div>
  );
}
