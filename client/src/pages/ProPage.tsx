import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Crown, Check, Zap, Shield, MessageSquare, Eye, X, Plane, Star, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

// ─── Tier Definitions ─────────────────────────────────────────────────────────
const TIERS = [
  {
    id: "crew" as const,
    name: "Crew",
    emoji: "✈️",
    tagline: "Get started — no commitment",
    monthlyPrice: 0.99,
    annualPrice: 9.99,
    annualMonthlyEquiv: 0.83,
    color: "#6b7280",
    highlight: false,
    badge: null,
  },
  {
    id: "captain" as const,
    name: "Captain",
    emoji: "🛫",
    tagline: "Most popular — the full experience",
    monthlyPrice: 2.99,
    annualPrice: 24.99,
    annualMonthlyEquiv: 2.08,
    color: "#f5c518",
    highlight: true,
    badge: "MOST POPULAR",
  },
  {
    id: "firstclass" as const,
    name: "First Class",
    emoji: "🏆",
    tagline: "Everything — for true aviation obsessives",
    monthlyPrice: 4.99,
    annualPrice: 39.99,
    annualMonthlyEquiv: 3.33,
    color: "#a78bfa",
    highlight: false,
    badge: "BEST VALUE",
  },
];

// ─── Feature Comparison Table ─────────────────────────────────────────────────
const FEATURES = [
  {
    category: "Reading",
    items: [
      {
        label: "Breaking news feed",
        description: "All the latest aviation incidents, airline drama and flight emergencies as they happen.",
        free: true, crew: true, captain: true, firstclass: true,
      },
      {
        label: "Ad-free reading",
        description: "No banner ads, no pop-ups. Just the stories, nothing else.",
        free: false, crew: true, captain: true, firstclass: true,
      },
      {
        label: "Exclusive Pro articles",
        description: "Deep-dive investigations, crash analyses and insider stories that free readers never see.",
        free: false, crew: false, captain: true, firstclass: true,
      },
      {
        label: "Early access to new stories",
        description: "You read it before it's published publicly. Be the first to know.",
        free: false, crew: false, captain: true, firstclass: true,
      },
    ],
  },
  {
    category: "Notifications",
    items: [
      {
        label: "Newsletter",
        description: "Weekly roundup of the biggest aviation stories, delivered to your inbox.",
        free: true, crew: true, captain: true, firstclass: true,
      },
      {
        label: "Breaking news push notifications",
        description: "Your phone buzzes the moment something major happens in the skies. Before the news sites even know about it.",
        free: false, crew: true, captain: true, firstclass: true,
      },
      {
        label: "Live incident alerts",
        description: "Squawk 7700 emergencies, diversions and runway incidents pinged directly to you in real time.",
        free: false, crew: false, captain: true, firstclass: true,
      },
    ],
  },
  {
    category: "Community",
    items: [
      {
        label: "Forum access",
        description: "Join the Flight Drama community — discuss incidents, share spotting photos, debate the drama.",
        free: true, crew: true, captain: true, firstclass: true,
      },
      {
        label: "VIP forum badge",
        description: "A gold badge next to your name so everyone knows you're a proper aviation head.",
        free: false, crew: false, captain: true, firstclass: true,
      },
      {
        label: "Priority posting",
        description: "Your forum posts appear at the top. Your voice gets heard first.",
        free: false, crew: false, captain: false, firstclass: true,
      },
    ],
  },
  {
    category: "Flight Lookup",
    items: [
      {
        label: "Live flight position",
        description: "See any aircraft's live position, altitude and speed on a map.",
        free: true, crew: true, captain: true, firstclass: true,
      },
      {
        label: "Full flight data (delays, airline info)",
        description: "Gate info, delay reasons, airline contact details, historical on-time performance — the full picture.",
        free: false, crew: false, captain: false, firstclass: true,
      },
    ],
  },
  {
    category: "Perks",
    items: [
      {
        label: "Crew rank progression",
        description: "Earn XP and climb the ranks from Student Pilot to Captain. Pro members earn 2× XP.",
        free: true, crew: true, captain: true, firstclass: true,
      },
      {
        label: "2× XP boost",
        description: "Every comment, article read and forum post earns double reputation points.",
        free: false, crew: false, captain: true, firstclass: true,
      },
      {
        label: "Early access to new features",
        description: "You get new tools and features before anyone else. Beta tester status.",
        free: false, crew: false, captain: false, firstclass: true,
      },
    ],
  },
];

// ─── Feature Row Component ────────────────────────────────────────────────────
function FeatureRow({ item }: { item: typeof FEATURES[0]["items"][0] }) {
  const [open, setOpen] = useState(false);
  const tick = <Check className="w-4 h-4 text-[oklch(0.85_0.18_95)] mx-auto" />;
  const cross = <X className="w-4 h-4 text-[oklch(0.35_0_0)] mx-auto" />;
  return (
    <>
      <tr
        className="border-b border-[oklch(0.18_0_0)] cursor-pointer hover:bg-[oklch(0.14_0_0)] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <td className="py-3 px-4 text-sm text-white font-medium">
          <div className="flex items-center gap-2">
            <span>{item.label}</span>
            {open ? <ChevronUp className="w-3 h-3 text-[oklch(0.45_0_0)]" /> : <ChevronDown className="w-3 h-3 text-[oklch(0.45_0_0)]" />}
          </div>
        </td>
        <td className="py-3 px-4 text-center">{item.free ? tick : cross}</td>
        <td className="py-3 px-4 text-center">{item.crew ? tick : cross}</td>
        <td className="py-3 px-4 text-center">{item.captain ? tick : cross}</td>
        <td className="py-3 px-4 text-center">{item.firstclass ? tick : cross}</td>
      </tr>
      {open && (
        <tr className="bg-[oklch(0.12_0_0)]">
          <td colSpan={5} className="px-4 py-2 text-xs text-[oklch(0.55_0_0)] italic">
            {item.description}
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProPage() {
  const { isAuthenticated } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const { data: membership } = trpc.membership.getMyMembership.useQuery(undefined, { enabled: isAuthenticated });
  const createCheckout = trpc.membership.createCheckout.useMutation({
    onSuccess: (data) => { if (data.url) window.open(data.url, "_blank"); },
    onError: (e) => toast.error(e.message || "Failed to start checkout. Please try again."),
  });

  const handleSubscribe = (tierId: "crew" | "captain" | "firstclass") => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    createCheckout.mutate({ tier: tierId, billing, origin: window.location.origin });
    toast.info("Redirecting to secure checkout...");
  };

  // Already subscribed
  if (membership?.status === "active") {
    const currentTier = TIERS.find(t => t.id === (membership as any).tier) ?? TIERS[2];
    return (
      <div className="min-h-screen bg-[oklch(0.10_0_0)]">
        <Navigation />
        <main className="container py-12 max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-4">{currentTier.emoji}</div>
          <h1 className="text-4xl font-black text-white mb-3">You're a {currentTier.name} member! ✈</h1>
          <p className="text-[oklch(0.60_0_0)] mb-6">Thank you for supporting Flight Drama. You have full access to all {currentTier.name} features.</p>
          <div className="bg-[oklch(0.15_0_0)] border rounded-lg p-6 text-left mb-6" style={{ borderColor: currentTier.color + "50" }}>
            <p className="text-sm text-[oklch(0.55_0_0)] mb-1">Subscription status</p>
            <p className="font-black text-lg capitalize" style={{ color: currentTier.color }}>
              {currentTier.name} · {membership.plan} · {membership.status}
            </p>
          </div>
          <p className="text-xs text-[oklch(0.40_0_0)] mb-6">To upgrade or cancel your subscription, visit your <Link href="/profile" className="underline">profile page</Link>.</p>
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
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[oklch(0.85_0.18_95)]/10 border border-[oklch(0.85_0.18_95)]/30 rounded-full px-4 py-1.5 text-[oklch(0.85_0.18_95)] text-xs font-bold uppercase tracking-widest mb-4">
            <Crown className="w-3.5 h-3.5" /> Flight Drama Pro
          </div>
          <h1 className="text-5xl font-black text-white mb-4 leading-tight">
            Start at £1.<br />
            <span className="text-[oklch(0.85_0.18_95)]">Upgrade when you want more.</span>
          </h1>
          <p className="text-[oklch(0.60_0_0)] text-lg max-w-xl mx-auto">
            No long-term commitment. Start with Crew for a quid a month and upgrade whenever you're ready for more.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-4 py-2 rounded text-sm font-bold transition-colors ${billing === "monthly" ? "bg-[oklch(0.85_0.18_95)] text-black" : "bg-[oklch(0.18_0_0)] text-[oklch(0.55_0_0)] hover:text-white"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`px-4 py-2 rounded text-sm font-bold transition-colors flex items-center gap-2 ${billing === "annual" ? "bg-[oklch(0.85_0.18_95)] text-black" : "bg-[oklch(0.18_0_0)] text-[oklch(0.55_0_0)] hover:text-white"}`}
          >
            Annual
            <span className="text-[10px] font-black uppercase bg-green-500 text-white px-1.5 py-0.5 rounded">Save up to 33%</span>
          </button>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
          {TIERS.map((tier) => {
            const price = billing === "annual" ? tier.annualMonthlyEquiv : tier.monthlyPrice;
            const isCurrentTier = (membership as any)?.tier === tier.id && membership?.status === "active";
            return (
              <div
                key={tier.id}
                className={`relative rounded-xl border p-6 flex flex-col transition-all ${tier.highlight ? "scale-105 shadow-2xl" : ""}`}
                style={{
                  backgroundColor: tier.highlight ? "oklch(0.15 0 0)" : "oklch(0.13 0 0)",
                  borderColor: tier.highlight ? tier.color : "oklch(0.22 0 0)",
                  boxShadow: tier.highlight ? `0 0 40px ${tier.color}20` : "none",
                }}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-black"
                    style={{ backgroundColor: tier.color }}>
                    {tier.badge}
                  </div>
                )}

                <div className="text-3xl mb-2">{tier.emoji}</div>
                <h2 className="text-xl font-black text-white mb-1">{tier.name}</h2>
                <p className="text-xs text-[oklch(0.50_0_0)] mb-4">{tier.tagline}</p>

                <div className="mb-4">
                  <span className="text-4xl font-black text-white">£{price.toFixed(2)}</span>
                  <span className="text-[oklch(0.50_0_0)] text-sm">/month</span>
                  {billing === "annual" && (
                    <p className="text-xs text-green-400 mt-1">Billed £{tier.annualPrice}/year · Save £{((tier.monthlyPrice * 12) - tier.annualPrice).toFixed(2)}</p>
                  )}
                </div>

                <button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={createCheckout.isPending || isCurrentTier}
                  className="w-full py-3 rounded font-black text-sm uppercase tracking-wide transition-all active:scale-[0.97] mb-6 disabled:opacity-50"
                  style={{
                    backgroundColor: isCurrentTier ? "oklch(0.25 0 0)" : tier.highlight ? tier.color : "oklch(0.20 0 0)",
                    color: isCurrentTier ? "oklch(0.50 0 0)" : tier.highlight ? "#000" : "#fff",
                    border: tier.highlight ? "none" : `1px solid ${tier.color}50`,
                  }}
                >
                  {isCurrentTier ? "Current Plan" : createCheckout.isPending ? "Loading..." : `Get ${tier.name}`}
                </button>

                {/* Key features for this tier */}
                <ul className="space-y-2 flex-1">
                  {FEATURES.flatMap(f => f.items)
                    .filter(item => item[tier.id as keyof typeof item] === true)
                    .filter(item => tier.id === "crew" ? true : !FEATURES.flatMap(f => f.items).find(i => i.label === item.label)?.[
                      tier.id === "captain" ? "crew" : "captain"
                    ])
                    .slice(0, 5)
                    .map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[oklch(0.65_0_0)]">
                        <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: tier.color }} />
                        {item.label}
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Free tier note */}
        <div className="text-center mb-16">
          <p className="text-[oklch(0.45_0_0)] text-sm">
            Not ready to commit? <Link href="/" className="text-[oklch(0.85_0.18_95)] hover:underline">Stay on the free plan</Link> — breaking news, forum access and the newsletter are always free.
          </p>
        </div>

        {/* Full comparison table */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-white mb-2 text-center">Full feature comparison</h2>
          <p className="text-center text-[oklch(0.50_0_0)] text-sm mb-8">Click any feature to see what it means in plain English.</p>

          <div className="overflow-x-auto rounded-xl border border-[oklch(0.20_0_0)]">
            <table className="w-full">
              <thead>
                <tr className="bg-[oklch(0.15_0_0)] border-b border-[oklch(0.22_0_0)]">
                  <th className="py-4 px-4 text-left text-xs font-black uppercase tracking-widest text-[oklch(0.50_0_0)] w-2/5">Feature</th>
                  <th className="py-4 px-4 text-center text-xs font-black uppercase tracking-widest text-[oklch(0.50_0_0)]">Free</th>
                  <th className="py-4 px-4 text-center text-xs font-black uppercase tracking-widest" style={{ color: "#6b7280" }}>✈️ Crew</th>
                  <th className="py-4 px-4 text-center text-xs font-black uppercase tracking-widest" style={{ color: "#f5c518" }}>🛫 Captain</th>
                  <th className="py-4 px-4 text-center text-xs font-black uppercase tracking-widest" style={{ color: "#a78bfa" }}>🏆 First Class</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((section) => (
                  <>
                    <tr key={section.category} className="bg-[oklch(0.12_0_0)]">
                      <td colSpan={5} className="py-2 px-4 text-[10px] font-black uppercase tracking-widest text-[oklch(0.40_0_0)]">
                        {section.category}
                      </td>
                    </tr>
                    {section.items.map((item, i) => (
                      <FeatureRow key={i} item={item} />
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-[oklch(0.50_0_0)] text-sm mb-2">Cancel anytime. No questions asked.</p>
          <p className="text-[oklch(0.35_0_0)] text-xs">
            By subscribing you agree to our <Link href="/terms" className="underline hover:text-white">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-white">Privacy Policy</Link>.
          </p>
        </div>

      </main>
      <Footer />
    </div>
  );
}
