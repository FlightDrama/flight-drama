import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Trophy, Star, ThumbsDown, Plane, Crown, Mail } from "lucide-react";

const AWARD_CATEGORIES = [
  {
    icon: "🏆",
    type: "best",
    title: "Best Airline of the Year",
    description: "Which airline delivered the best passenger experience in 2026?",
    nominees: ["British Airways", "Emirates", "Singapore Airlines", "Ryanair", "easyJet"],
  },
  {
    icon: "😬",
    type: "worst",
    title: "Worst Airline of the Year",
    description: "Which airline let passengers down the most in 2026?",
    nominees: ["Wizz Air", "Spirit Airlines", "Frontier Airlines", "Air India", "Flybe"],
  },
  {
    icon: "🛫",
    type: "best",
    title: "Best Airport of the Year",
    description: "The airport that made travel a pleasure in 2026.",
    nominees: ["Heathrow T5", "Singapore Changi", "Dubai DXB", "Hamad Doha", "Amsterdam Schiphol"],
  },
  {
    icon: "📰",
    type: "best",
    title: "Aviation Story of the Year",
    description: "The aviation news story that had the community talking most in 2026.",
    nominees: ["Delta Dublin Emergency", "A350 Wheel Loss", "Boeing 737 MAX Updates", "Concorde Revival Plans", "Wizz Air Intercept"],
  },
  {
    icon: "✈️",
    type: "best",
    title: "Aircraft of the Year",
    description: "The aircraft that captured the community's imagination in 2026.",
    nominees: ["Airbus A350-1000", "Boeing 777X", "Embraer E195-E2", "ATR 72-600", "Airbus A220"],
  },
  {
    icon: "😤",
    type: "worst",
    title: "Worst Aviation Moment of the Year",
    description: "The incident, decision, or moment that made aviation fans cringe most.",
    nominees: ["Boeing Safety Culture", "Heathrow Delays", "Airline Baggage Fee Hikes", "SAS Taxiway Incident", "Air India Fuel Diversion"],
  },
];

export default function AwardsPage() {
  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main>
        {/* Hero */}
        <div className="relative bg-[oklch(0.08_0_0)] border-b border-[oklch(0.22_0_0)] py-16 px-4 overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg, oklch(0.85 0.18 95) 0, oklch(0.85 0.18 95) 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />
          <div className="container max-w-4xl text-center relative">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-8 h-8 text-[oklch(0.85_0.18_95)]" />
              <span className="text-[oklch(0.85_0.18_95)] font-black text-sm uppercase tracking-widest">Annual Awards</span>
              <Trophy className="w-8 h-8 text-[oklch(0.85_0.18_95)]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              Flight Drama Awards<br /><span className="text-[oklch(0.85_0.18_95)]">2026</span>
            </h1>
            <p className="text-[oklch(0.60_0_0)] text-lg max-w-2xl mx-auto mb-6">
              The aviation community votes for the best and worst of 2026. Voting opens in December — register your interest below to be notified when polls go live.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:awards@flightdrama.com?subject=Flight Drama Awards 2026 — Sponsorship Enquiry"
                className="flex items-center gap-2 bg-[oklch(0.85_0.18_95)] text-black font-black px-6 py-3 hover:bg-[oklch(0.78_0.18_95)] transition-colors"
              >
                <Crown className="w-4 h-4" /> Sponsor the Awards
              </a>
              <Link href="/newsletter" className="flex items-center gap-2 bg-[oklch(0.18_0_0)] border border-[oklch(0.30_0_0)] text-white font-bold px-6 py-3 hover:border-[oklch(0.85_0.18_95)]/40 transition-colors">
                <Mail className="w-4 h-4" /> Get Notified
              </Link>
            </div>
          </div>
        </div>

        <div className="container max-w-5xl py-10">
          {/* Sponsorship CTA */}
          <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.85_0.18_95)]/30 rounded-xl p-6 mb-10 flex flex-col sm:flex-row items-center gap-5">
            <Crown className="w-10 h-10 text-[oklch(0.85_0.18_95)] shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-black text-white text-lg mb-1">Become the Official Awards Sponsor</h3>
              <p className="text-sm text-[oklch(0.60_0_0)]">
                Naming rights sponsorship available for the Flight Drama Awards 2026. Estimated value: £5,000–£20,000.
                Includes logo on all award materials, newsletter features, social media coverage, and a winner announcement post.
              </p>
            </div>
            <a
              href="mailto:awards@flightdrama.com?subject=Flight Drama Awards 2026 — Sponsorship Enquiry"
              className="shrink-0 bg-[oklch(0.85_0.18_95)] text-black font-black px-5 py-2.5 hover:bg-[oklch(0.78_0.18_95)] transition-colors text-sm whitespace-nowrap"
            >
              Enquire Now →
            </a>
          </div>

          {/* Categories */}
          <h2 className="text-2xl font-black text-white mb-6">2026 Award Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {AWARD_CATEGORIES.map((cat) => (
              <div key={cat.title} className={`bg-[oklch(0.13_0_0)] border rounded-xl p-5 ${cat.type === 'best' ? 'border-[oklch(0.22_0_0)]' : 'border-red-900/30'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 ${cat.type === 'best' ? 'bg-[oklch(0.85_0.18_95)] text-black' : 'bg-red-900/50 text-red-400'}`}>
                      {cat.type === 'best' ? '⭐ Best' : '😬 Worst'}
                    </span>
                  </div>
                </div>
                <h3 className="font-black text-white mb-1">{cat.title}</h3>
                <p className="text-xs text-[oklch(0.55_0_0)] mb-3">{cat.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.nominees.map(n => (
                    <span key={n} className="text-[10px] bg-[oklch(0.18_0_0)] text-[oklch(0.60_0_0)] px-2 py-0.5 rounded">{n}</span>
                  ))}
                </div>
                <p className="text-[10px] text-[oklch(0.35_0_0)] mt-3">Voting opens December 2026</p>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-6">
            <h3 className="font-black text-white mb-4">Awards Timeline</h3>
            <div className="space-y-3">
              {[
                { date: "November 2026", event: "Nominations open — community submits nominees", done: false },
                { date: "1 December 2026", event: "Voting opens — 4 weeks of community voting", done: false },
                { date: "31 December 2026", event: "Voting closes", done: false },
                { date: "January 2027", event: "Winners announced — live stream + newsletter special edition", done: false },
              ].map(({ date, event, done }) => (
                <div key={date} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${done ? 'bg-[oklch(0.85_0.18_95)]' : 'bg-[oklch(0.30_0_0)]'}`} />
                  <div>
                    <span className="text-xs font-bold text-[oklch(0.85_0.18_95)]">{date}</span>
                    <p className="text-sm text-[oklch(0.65_0_0)]">{event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
