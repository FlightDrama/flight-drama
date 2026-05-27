import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Plane, Users, BarChart2, Mail, CheckCircle, Send, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";

const AUDIENCE_STATS = [
  { label: "Monthly Visitors", value: "50K+", icon: Users, note: "Growing 20% MoM" },
  { label: "Newsletter Subscribers", value: "2K+", icon: Mail, note: "40% open rate" },
  { label: "Forum Members", value: "500+", icon: Users, note: "Highly engaged" },
  { label: "Avg. Time on Site", value: "4:30", icon: BarChart2, note: "Per session" },
];

const AUDIENCE_PROFILE = [
  { label: "Pilots & Student Pilots", pct: 28 },
  { label: "Aviation Enthusiasts / Spotters", pct: 35 },
  { label: "Frequent Business Travellers", pct: 18 },
  { label: "Aerospace Professionals", pct: 12 },
  { label: "Aviation Students", pct: 7 },
];

const AD_PACKAGES = [
  {
    name: "Classified Listing",
    price: "£150",
    per: "per newsletter send",
    description: "30-word brand mention in our newsletter classified section. Reaches the full subscriber list.",
    features: ["30-word brand message", "Link to your site", "Logo included", "1 newsletter edition"],
    highlight: false,
  },
  {
    name: "Newsletter Top Banner",
    price: "£350",
    per: "per newsletter send",
    description: "Premium banner position at the top of our weekly newsletter. Maximum visibility.",
    features: ["Full-width banner image", "50-word brand message", "Prominent CTA button", "1 newsletter edition", "Performance report"],
    highlight: true,
  },
  {
    name: "Sponsored Article",
    price: "£1,200",
    per: "per article",
    description: "A full branded content article written by our team and published to our audience. Highest engagement.",
    features: ["500–800 word article", "Written by Flight Drama team", "Promoted on social media", "Permanent on-site placement", "SEO-optimised", "Performance report"],
    highlight: false,
  },
  {
    name: "Dedicated Newsletter",
    price: "£1,500",
    per: "per send",
    description: "Your brand sponsors an entire newsletter edition. Maximum brand immersion.",
    features: ["Full newsletter takeover", "Brand logo throughout", "Multiple CTAs", "Exclusive send — no other brands", "Social media mention", "Full analytics report"],
    highlight: false,
  },
];

const BUDGET_OPTIONS = ["Under £500", "£500–£1,000", "£1,000–£3,000", "£3,000–£10,000", "£10,000+", "Not sure yet"];

export default function AdvertisePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const enquire = trpc.mediaKit.enquire.useMutation({
    onSuccess: () => { setSubmitted(true); toast.success("Enquiry sent! We'll be in touch within 24 hours. ✈"); },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main>
        {/* Hero */}
        <div className="bg-[oklch(0.85_0.18_95)] py-14 px-4">
          <div className="container max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 bg-black/20 px-4 py-1.5 rounded-full mb-4">
              <Plane className="w-4 h-4 text-black" />
              <span className="text-black text-xs font-black uppercase tracking-widest">Advertise with Flight Drama</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-black mb-4 leading-tight">
              Reach the Most Passionate<br />Aviation Audience Online
            </h1>
            <p className="text-black/70 text-lg max-w-2xl mx-auto mb-6">
              Flight Drama connects aviation brands with pilots, spotters, frequent flyers, and aviation professionals.
              Our audience is highly engaged, high-income, and actively seeking aviation products and experiences.
            </p>
            <a href="#contact" className="inline-block bg-black text-[oklch(0.85_0.18_95)] font-black px-8 py-3.5 hover:bg-[oklch(0.15_0_0)] transition-colors">
              Get in Touch →
            </a>
          </div>
        </div>

        {/* Audience stats */}
        <div className="container max-w-5xl py-12">
          <h2 className="text-2xl font-black text-white text-center mb-8">Our Audience</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {AUDIENCE_STATS.map(({ label, value, icon: Icon, note }) => (
              <div key={label} className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-5 text-center">
                <Icon className="w-6 h-6 text-[oklch(0.85_0.18_95)] mx-auto mb-2" />
                <p className="text-3xl font-black text-white mb-0.5">{value}</p>
                <p className="text-xs font-bold text-[oklch(0.60_0_0)] mb-1">{label}</p>
                <p className="text-[10px] text-[oklch(0.85_0.18_95)]">{note}</p>
              </div>
            ))}
          </div>

          {/* Audience profile */}
          <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-6 mb-12">
            <h3 className="font-black text-white mb-4">Who Reads Flight Drama?</h3>
            <div className="space-y-3">
              {AUDIENCE_PROFILE.map(({ label, pct }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[oklch(0.70_0_0)]">{label}</span>
                    <span className="font-bold text-white">{pct}%</span>
                  </div>
                  <div className="h-2 bg-[oklch(0.20_0_0)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[oklch(0.85_0.18_95)] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[oklch(0.45_0_0)] mt-4">
              Aviation CPMs are 3–5× higher than general lifestyle content. Our audience has high disposable income and strong purchase intent for aviation products, travel, and experiences.
            </p>
          </div>

          {/* Packages */}
          <h2 className="text-2xl font-black text-white text-center mb-8">Advertising Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {AD_PACKAGES.map((pkg) => (
              <div key={pkg.name} className={`rounded-xl overflow-hidden border ${pkg.highlight ? "border-[oklch(0.85_0.18_95)]" : "border-[oklch(0.22_0_0)]"} bg-[oklch(0.13_0_0)]`}>
                {pkg.highlight && (
                  <div className="bg-[oklch(0.85_0.18_95)] text-black text-[10px] font-black text-center py-1.5 uppercase tracking-widest">
                    ⭐ Most Popular
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-black text-white text-lg mb-0.5">{pkg.name}</h3>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl font-black text-[oklch(0.85_0.18_95)]">{pkg.price}</span>
                    <span className="text-xs text-[oklch(0.50_0_0)]">{pkg.per}</span>
                  </div>
                  <p className="text-sm text-[oklch(0.60_0_0)] mb-4 leading-relaxed">{pkg.description}</p>
                  <ul className="space-y-1.5 mb-5">
                    {pkg.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-[oklch(0.65_0_0)]">
                        <CheckCircle className="w-3.5 h-3.5 text-[oklch(0.85_0.18_95)] shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href="#contact" className={`block text-center py-2.5 font-black text-sm transition-colors ${
                    pkg.highlight
                      ? "bg-[oklch(0.85_0.18_95)] text-black hover:bg-[oklch(0.78_0.18_95)]"
                      : "bg-[oklch(0.20_0_0)] text-white hover:bg-[oklch(0.25_0_0)]"
                  }`}>
                    Enquire →
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Why Flight Drama */}
          <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-6 mb-12">
            <h3 className="font-black text-white text-lg mb-4">Why Advertise with Flight Drama?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: "🎯", title: "Precision Targeting", desc: "Reach pilots, spotters, and aviation professionals — not a general audience. Every impression counts." },
                { icon: "💰", title: "Premium CPMs", desc: "Aviation audiences command 3–5× higher CPMs than lifestyle content. Your budget goes further." },
                { icon: "✈️", title: "Trusted Editorial Voice", desc: "Flight Drama is a trusted source for the aviation community. Your brand benefits from that association." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="text-center p-4">
                  <p className="text-3xl mb-2">{icon}</p>
                  <h4 className="font-black text-white mb-1">{title}</h4>
                  <p className="text-xs text-[oklch(0.55_0_0)] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact form */}
          <div id="contact" className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden">
            <div className="bg-[oklch(0.85_0.18_95)] px-6 py-4">
              <h2 className="text-xl font-black text-black">Get in Touch</h2>
              <p className="text-black/70 text-sm">We'll respond within 24 hours with a tailored proposal.</p>
            </div>

            {submitted ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-black text-white mb-2">Enquiry Received! ✈</h3>
                <p className="text-[oklch(0.60_0_0)]">We'll be in touch within 24 hours with a tailored proposal and media kit.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setError(""); if (!name || !email) { setError("Please enter your name and email."); return; } enquire.mutate({ name, email, company, budget, message }); }} className="p-6 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 bg-red-900/20 border border-red-700 rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[oklch(0.55_0_0)] mb-1.5">Your Name *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Josh Fagan" className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded-lg px-4 py-2.5 text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[oklch(0.55_0_0)] mb-1.5">Email *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@brand.com" className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded-lg px-4 py-2.5 text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[oklch(0.55_0_0)] mb-1.5">Company / Brand</label>
                    <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Bose Aviation" className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded-lg px-4 py-2.5 text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[oklch(0.55_0_0)] mb-1.5">Monthly Budget</label>
                    <select value={budget} onChange={e => setBudget(e.target.value)} className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors text-sm">
                      <option value="">Select budget range</option>
                      {BUDGET_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[oklch(0.55_0_0)] mb-1.5">Tell us about your campaign</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="What are you looking to promote? Any specific goals or requirements?" className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded-lg px-4 py-2.5 text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors text-sm resize-none" />
                </div>
                <button type="submit" disabled={enquire.isPending} className="flex items-center gap-2 bg-[oklch(0.85_0.18_95)] text-black font-black px-6 py-3 hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-50">
                  {enquire.isPending ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Enquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
