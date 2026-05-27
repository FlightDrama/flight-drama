import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Crown, Check, Zap, Shield, MessageSquare, Eye, X, Plane, Star } from "lucide-react";
import { toast } from "sonner";

const PRO_FEATURES = [
  { icon: Eye, label: "Ad-free reading experience" },
  { icon: Crown, label: "Exclusive Pro-only articles and deep dives" },
  { icon: MessageSquare, label: "VIP forum badge and priority posting" },
  { icon: Plane, label: "Full Flight Lookup with airline & delay data" },
  { icon: Zap, label: "Breaking news push notifications" },
  { icon: Shield, label: "Early access to new features" },
];

const FREE_VS_PRO = [
  { feature: "Breaking news feed", free: true, pro: true },
  { feature: "Community forum access", free: true, pro: true },
  { feature: "Newsletter subscription", free: true, pro: true },
  { feature: "Basic flight lookup (live position)", free: true, pro: true },
  { feature: "Ad-free experience", free: false, pro: true },
  { feature: "Exclusive Pro articles", free: false, pro: true },
  { feature: "VIP forum badge", free: false, pro: true },
  { feature: "Full flight lookup (airline data, delays)", free: false, pro: true },
  { feature: "Push notifications", free: false, pro: true },
  { feature: "Early access features", free: false, pro: true },
];

const MONTHLY_PRICE = 4.99;
const ANNUAL_PRICE = 39.99;
const ANNUAL_MONTHLY_EQUIV = (ANNUAL_PRICE / 12).toFixed(2);
const ANNUAL_SAVING = ((MONTHLY_PRICE * 12) - ANNUAL_PRICE).toFixed(2);
const ANNUAL_SAVING_PCT = Math.round(((MONTHLY_PRICE * 12 - ANNUAL_PRICE) / (MONTHLY_PRICE * 12)) * 100);

export default function ProPage() {
  const { isAuthenticated } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const { data: membership } = trpc.membership.getMyMembership.useQuery(undefined, { enabled: isAuthenticated });
  const createCheckout = trpc.membership.createCheckout.useMutation({
    onSuccess: (data) => { if (data.url) window.open(data.url, "_blank"); },
    onError: (e) => toast.error(e.message || "Failed to start checkout. Please try again."),
  });

  const handleSubscribe = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    createCheckout.mutate({ plan: billing, origin: window.location.origin });
    toast.info("Redirecting to secure checkout...");
  };

  if (membership?.status === "active") {
    return (
      <div className="min-h-screen bg-[oklch(0.10_0_0)]">
        <Navigation />
        <main className="container py-12 max-w-2xl mx-auto text-center">
          <Crown className="w-16 h-16 text-[oklch(0.85_0.18_95)] mx-auto mb-4" />
          <h1 className="text-4xl font-black text-white mb-3">You're a Pro Member! ✈</h1>
          <p className="text-[oklch(0.60_0_0)] mb-6">Thank you for supporting Flight Drama. You have full access to all Pro features.</p>
          <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.85_0.18_95)]/30 rounded-lg p-6 text-left mb-4">
            <p className="text-sm text-[oklch(0.55_0_0)] mb-1">Subscription status</p>
            <p className="font-black text-[oklch(0.85_0.18_95)] text-lg capitalize">{membership.status} · {membership.plan}</p>
          </div>
          <Link href="/" className="text-[oklch(0.85_0.18_95)] hover:underline text-sm">← Back to News</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[oklch(0.85_0.18_95)] text-black px-4 py-1.5 text-sm font-black mb-4">
            <Crown className="w-4 h-4" /> FLIGHT DRAMA PRO
          </div>
          <h1 className="text-5xl font-black text-white mb-4 leading-tight">
            Aviation News.<br />
            <span className="text-[oklch(0.85_0.18_95)]">Elevated.</span>
          </h1>
          <p className="text-xl text-[oklch(0.60_0_0)] max-w-xl mx-auto">
            Join the most dedicated aviation community on the internet. No ads, exclusive content, VIP access.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className={`text-sm font-bold transition-colors ${billing === "monthly" ? "text-white" : "text-[oklch(0.45_0_0)]"}`}>Monthly</span>
          <button
            onClick={() => setBilling(billing === "monthly" ? "annual" : "monthly")}
            className={`relative w-14 h-7 rounded-full transition-colors ${billing === "annual" ? "bg-[oklch(0.85_0.18_95)]" : "bg-[oklch(0.25_0_0)]"}`}
          >
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${billing === "annual" ? "translate-x-8" : "translate-x-1"}`} />
          </button>
          <span className={`text-sm font-bold transition-colors ${billing === "annual" ? "text-white" : "text-[oklch(0.45_0_0)]"}`}>
            Annual
          </span>
          {billing === "annual" && (
            <span className="bg-green-700 text-white text-[10px] font-black px-2 py-0.5 animate-pulse">
              SAVE {ANNUAL_SAVING_PCT}%
            </span>
          )}
        </div>

        {/* Single dynamic pricing card */}
        <div className="max-w-md mx-auto mb-10">
          <div className={`rounded-2xl overflow-hidden border-2 transition-all ${billing === "annual" ? "border-[oklch(0.85_0.18_95)] shadow-[0_0_40px_oklch(0.85_0.18_95/0.15)]" : "border-[oklch(0.28_0_0)]"}`}>
            {billing === "annual" && (
              <div className="bg-[oklch(0.85_0.18_95)] text-black text-center py-2 text-xs font-black uppercase tracking-widest">
                ⭐ Best Value — Save £{ANNUAL_SAVING} per year
              </div>
            )}
            <div className={`p-8 ${billing === "annual" ? "bg-gradient-to-br from-[oklch(0.15_0_0)] to-[oklch(0.12_0_0)]" : "bg-[oklch(0.15_0_0)]"}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[oklch(0.85_0.18_95)] flex items-center justify-center">
                  <Crown className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg">Flight Drama Pro</h3>
                  <p className="text-xs text-[oklch(0.50_0_0)]">{billing === "annual" ? "Annual subscription" : "Monthly subscription"}</p>
                </div>
              </div>

              {/* Price display */}
              <div className="mb-2">
                {billing === "annual" ? (
                  <>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-5xl font-black text-white">£{ANNUAL_MONTHLY_EQUIV}</span>
                      <span className="text-[oklch(0.50_0_0)]">/month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[oklch(0.50_0_0)] line-through">£{MONTHLY_PRICE}/mo</span>
                      <span className="text-sm font-black text-[oklch(0.85_0.18_95)]">billed as £{ANNUAL_PRICE}/year</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white">£{MONTHLY_PRICE}</span>
                    <span className="text-[oklch(0.50_0_0)]">/month</span>
                  </div>
                )}
              </div>

              {/* Savings callout for annual */}
              {billing === "annual" && (
                <div className="bg-green-900/30 border border-green-700/40 rounded-lg px-4 py-2.5 mb-5 flex items-center gap-2">
                  <Star className="w-4 h-4 text-green-400 shrink-0" />
                  <p className="text-sm text-green-300 font-bold">You save £{ANNUAL_SAVING} compared to monthly billing</p>
                </div>
              )}

              {/* Features */}
              <ul className="space-y-2.5 mb-6">
                {PRO_FEATURES.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 text-sm text-[oklch(0.75_0_0)]">
                    <div className="w-5 h-5 bg-[oklch(0.85_0.18_95)]/10 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-[oklch(0.85_0.18_95)]" />
                    </div>
                    {label}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleSubscribe}
                disabled={createCheckout.isPending}
                className={`w-full py-3.5 font-black text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                  billing === "annual"
                    ? "bg-[oklch(0.85_0.18_95)] text-black hover:bg-[oklch(0.78_0.18_95)]"
                    : "bg-[oklch(0.85_0.18_95)] text-black hover:bg-[oklch(0.78_0.18_95)]"
                }`}
              >
                {createCheckout.isPending ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Crown className="w-4 h-4" />
                )}
                {billing === "annual" ? `Get Pro — £${ANNUAL_PRICE}/year` : `Get Pro — £${MONTHLY_PRICE}/month`}
              </button>

              <p className="text-center text-[10px] text-[oklch(0.35_0_0)] mt-3">
                Cancel anytime · Secure checkout via Stripe
              </p>
            </div>
          </div>

          {/* Switch plan nudge */}
          <p className="text-center text-sm text-[oklch(0.50_0_0)] mt-3">
            {billing === "annual" ? (
              <button onClick={() => setBilling("monthly")} className="hover:text-white transition-colors underline">
                Switch to monthly (£{MONTHLY_PRICE}/mo)
              </button>
            ) : (
              <button onClick={() => setBilling("annual")} className="hover:text-[oklch(0.85_0.18_95)] transition-colors text-[oklch(0.85_0.18_95)] font-bold">
                ⭐ Save {ANNUAL_SAVING_PCT}% with annual billing →
              </button>
            )}
          </p>
        </div>

        {/* Comparison table */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-white text-center mb-5">Free vs Pro</h2>
          <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 bg-[oklch(0.18_0_0)] px-4 py-3 text-xs font-black uppercase tracking-wider border-b border-[oklch(0.22_0_0)]">
              <span className="text-[oklch(0.55_0_0)]">Feature</span>
              <span className="text-center text-[oklch(0.55_0_0)]">Free</span>
              <span className="text-center text-[oklch(0.85_0.18_95)]">✈ Pro</span>
            </div>
            {FREE_VS_PRO.map(({ feature, free, pro }, i) => (
              <div key={feature} className={`grid grid-cols-3 px-4 py-3 items-center ${i > 0 ? "border-t border-[oklch(0.18_0_0)]" : ""} ${!free && pro ? "bg-[oklch(0.85_0.18_95)]/3" : ""}`}>
                <span className={`text-sm ${!free && pro ? "text-white font-bold" : "text-[oklch(0.65_0_0)]"}`}>{feature}</span>
                <div className="flex justify-center">{free ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-[oklch(0.30_0_0)]" />}</div>
                <div className="flex justify-center">{pro ? <Check className="w-4 h-4 text-[oklch(0.85_0.18_95)]" /> : <X className="w-4 h-4 text-[oklch(0.30_0_0)]" />}</div>
              </div>
            ))}
            <div className="px-4 py-4 border-t border-[oklch(0.22_0_0)] bg-[oklch(0.15_0_0)]">
              <button
                onClick={handleSubscribe}
                disabled={createCheckout.isPending}
                className="w-full bg-[oklch(0.85_0.18_95)] text-black font-black py-3 hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                {billing === "annual" ? `Join Pro — £${ANNUAL_PRICE}/year (save ${ANNUAL_SAVING_PCT}%)` : `Join Pro — £${MONTHLY_PRICE}/month`}
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-[oklch(0.40_0_0)] mt-3">Test with card 4242 4242 4242 4242 · Cancel anytime</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
