import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Crown, Check, Zap, Shield, MessageSquare, Eye, X } from "lucide-react";
import { toast } from "sonner";

const PRO_FEATURES = [
  { icon: Eye, label: "Ad-free reading experience" },
  { icon: Crown, label: "Exclusive Pro-only articles and deep dives" },
  { icon: MessageSquare, label: "VIP forum badge and priority posting" },
  { icon: Zap, label: "Breaking news push notifications" },
  { icon: Shield, label: "Early access to new features" },
];

const FREE_VS_PRO = [
  { feature: "Breaking news feed", free: true, pro: true },
  { feature: "Community forum access", free: true, pro: true },
  { feature: "Newsletter subscription", free: true, pro: true },
  { feature: "Ad-free experience", free: false, pro: true },
  { feature: "Exclusive Pro articles", free: false, pro: true },
  { feature: "VIP forum badge", free: false, pro: true },
  { feature: "Push notifications", free: false, pro: true },
  { feature: "Early access features", free: false, pro: true },
];

export default function ProPage() {
  const { isAuthenticated } = useAuth();
  const { data: membership } = trpc.membership.getMyMembership.useQuery(undefined, { enabled: isAuthenticated });
  const createCheckout = trpc.membership.createCheckout.useMutation({
    onSuccess: (data) => { if (data.url) window.open(data.url, "_blank"); },
    onError: (e) => toast.error(e.message || "Failed to start checkout. Please try again."),
  });

  const handleSubscribe = (plan: "monthly" | "annual") => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    createCheckout.mutate({ plan, origin: window.location.origin });
    toast.info("Redirecting to secure checkout...");
  };

  if (membership?.status === "active") {
    return (
      <div className="min-h-screen bg-[oklch(0.10_0_0)]">
        <Navigation />
        <main className="container py-12 max-w-2xl mx-auto text-center">
          <Crown className="w-16 h-16 text-[oklch(0.85_0.18_95)] mx-auto mb-4" />
          <h1 className="text-4xl font-black text-white mb-3">You're a Pro Member!</h1>
          <p className="text-[oklch(0.60_0_0)] mb-6">Thank you for supporting Flight Drama. You have full access to all Pro features.</p>
          <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.85_0.18_95)]/30 rounded-lg p-6 text-left">
            <p className="text-sm text-[oklch(0.55_0_0)] mb-1">Subscription status</p>
            <p className="font-black text-[oklch(0.85_0.18_95)] text-lg capitalize">{membership.status} · {membership.plan}</p>
          </div>
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
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[oklch(0.85_0.18_95)] text-black px-4 py-1.5 rounded-full text-sm font-black mb-4">
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

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
          {/* Monthly */}
          <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.25_0_0)] rounded-xl p-6">
            <h3 className="font-black text-white text-lg mb-1">Monthly</h3>
            <div className="flex items-end gap-1 mb-4">
              <span className="text-4xl font-black text-white">£4.99</span>
              <span className="text-[oklch(0.50_0_0)] mb-1">/month</span>
            </div>
            <ul className="space-y-2 mb-6">
              {PRO_FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-sm text-[oklch(0.70_0_0)]">
                  <Check className="w-4 h-4 text-[oklch(0.85_0.18_95)] shrink-0" />{label}
                </li>
              ))}
            </ul>
            <button onClick={() => handleSubscribe("monthly")} disabled={createCheckout.isPending} className="w-full bg-[oklch(0.22_0_0)] text-white py-3 rounded-lg font-black hover:bg-[oklch(0.28_0_0)] transition-colors disabled:opacity-50">
              Subscribe Monthly
            </button>
          </div>

          {/* Annual — recommended */}
          <div className="bg-gradient-to-br from-[oklch(0.85_0.18_95)] to-[oklch(0.75_0.18_95)] rounded-xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-[oklch(0.85_0.18_95)] text-xs font-black px-3 py-1 rounded-full">BEST VALUE</div>
            <h3 className="font-black text-black text-lg mb-1">Annual</h3>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-black text-black">£39.99</span>
              <span className="text-black/60 mb-1">/year</span>
            </div>
            <p className="text-sm font-bold text-black/70 mb-4">Save £19.89 vs monthly</p>
            <ul className="space-y-2 mb-6">
              {PRO_FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-sm text-black/80">
                  <Check className="w-4 h-4 text-black shrink-0" />{label}
                </li>
              ))}
            </ul>
            <button onClick={() => handleSubscribe("annual")} disabled={createCheckout.isPending} className="w-full bg-black text-[oklch(0.85_0.18_95)] py-3 rounded-lg font-black hover:bg-[oklch(0.10_0_0)] transition-colors disabled:opacity-50">
              Subscribe Annually
            </button>
          </div>
        </div>

        {/* Comparison table */}
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl text-white text-center mb-5 tracking-wider">Free vs Pro</h2>
          <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 bg-[oklch(0.18_0_0)] px-4 py-3 text-xs font-black uppercase tracking-wider">
              <span className="text-[oklch(0.55_0_0)]">Feature</span>
              <span className="text-center text-[oklch(0.55_0_0)]">Free</span>
              <span className="text-center text-[oklch(0.85_0.18_95)]">Pro</span>
            </div>
            {FREE_VS_PRO.map(({ feature, free, pro }) => (
              <div key={feature} className="grid grid-cols-3 px-4 py-3 border-t border-[oklch(0.20_0_0)] items-center">
                <span className="text-sm text-[oklch(0.70_0_0)]">{feature}</span>
                <div className="flex justify-center">{free ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-[oklch(0.35_0_0)]" />}</div>
                <div className="flex justify-center">{pro ? <Check className="w-4 h-4 text-[oklch(0.85_0.18_95)]" /> : <X className="w-4 h-4 text-[oklch(0.35_0_0)]" />}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[oklch(0.40_0_0)] mt-4">Cancel anytime. Test with card 4242 4242 4242 4242.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
