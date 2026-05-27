import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Mic, Play, Mail, Crown, Headphones } from "lucide-react";

const EPISODE_PREVIEWS = [
  { ep: "EP 01", title: "The Delta Dublin Emergency — What Really Happened?", duration: "38 min", date: "Coming Soon" },
  { ep: "EP 02", title: "Inside the A350 Wheel Loss Incident with an Aviation Safety Expert", duration: "45 min", date: "Coming Soon" },
  { ep: "EP 03", title: "Is Boeing in Crisis? A Deep Dive into the 737 MAX Culture", duration: "52 min", date: "Coming Soon" },
];

export default function PodcastPage() {
  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main>
        {/* Hero */}
        <div className="bg-[oklch(0.08_0_0)] border-b border-[oklch(0.22_0_0)] py-16 px-4">
          <div className="container max-w-4xl text-center">
            <div className="w-20 h-20 bg-[oklch(0.85_0.18_95)] flex items-center justify-center mx-auto mb-6">
              <Mic className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              The Flight Drama Podcast
            </h1>
            <p className="text-[oklch(0.60_0_0)] text-lg max-w-2xl mx-auto mb-6">
              Weekly deep dives into aviation news, incidents, and the stories behind the headlines.
              Hosted by the Flight Drama team with expert guests from across the industry.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/newsletter" className="flex items-center gap-2 bg-[oklch(0.85_0.18_95)] text-black font-black px-6 py-3 hover:bg-[oklch(0.78_0.18_95)] transition-colors">
                <Mail className="w-4 h-4" /> Get Notified at Launch
              </Link>
              <a
                href="mailto:podcast@flightdrama.com?subject=Flight Drama Podcast — Sponsorship Enquiry"
                className="flex items-center gap-2 bg-[oklch(0.18_0_0)] border border-[oklch(0.30_0_0)] text-white font-bold px-6 py-3 hover:border-[oklch(0.85_0.18_95)]/40 transition-colors"
              >
                <Crown className="w-4 h-4" /> Sponsor the Podcast
              </a>
            </div>
          </div>
        </div>

        <div className="container max-w-4xl py-10">
          {/* Coming soon banner */}
          <div className="bg-[oklch(0.85_0.18_95)]/10 border border-[oklch(0.85_0.18_95)]/30 rounded-xl p-5 mb-8 flex items-center gap-4">
            <Headphones className="w-8 h-8 text-[oklch(0.85_0.18_95)] shrink-0" />
            <div>
              <p className="font-black text-white mb-0.5">Launching Q3 2026</p>
              <p className="text-sm text-[oklch(0.60_0_0)]">The Flight Drama Podcast is in production. Subscribe to our newsletter to be the first to know when it drops.</p>
            </div>
          </div>

          {/* Episode previews */}
          <h2 className="text-xl font-black text-white mb-4">Upcoming Episodes</h2>
          <div className="space-y-3 mb-10">
            {EPISODE_PREVIEWS.map((ep) => (
              <div key={ep.ep} className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-[oklch(0.20_0_0)] flex items-center justify-center rounded-lg shrink-0">
                  <Play className="w-5 h-5 text-[oklch(0.85_0.18_95)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] bg-[oklch(0.85_0.18_95)] text-black font-black px-1.5 py-0.5">{ep.ep}</span>
                    <span className="text-[10px] text-[oklch(0.45_0_0)]">{ep.duration}</span>
                  </div>
                  <p className="font-bold text-white text-sm leading-tight">{ep.title}</p>
                </div>
                <span className="text-xs text-[oklch(0.40_0_0)] shrink-0">{ep.date}</span>
              </div>
            ))}
          </div>

          {/* Sponsorship */}
          <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-6">
            <h3 className="font-black text-white text-lg mb-2">Sponsor the Flight Drama Podcast</h3>
            <p className="text-sm text-[oklch(0.60_0_0)] mb-4">
              Aviation podcasts with 5,000+ listeners earn £500–£2,000 per episode from sponsors. Be an early sponsor and lock in the best rates before launch.
              Your brand will be heard by pilots, aviation professionals, and passionate enthusiasts every week.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {[
                { name: "Pre-roll Ad", desc: "30-second spot at the start of each episode", price: "£300/ep" },
                { name: "Mid-roll Ad", desc: "60-second host-read ad in the middle of the episode", price: "£500/ep" },
                { name: "Episode Sponsor", desc: "Full episode sponsorship with multiple mentions", price: "£1,000/ep" },
              ].map(({ name, desc, price }) => (
                <div key={name} className="bg-[oklch(0.18_0_0)] rounded-lg p-3 text-center">
                  <p className="font-black text-white text-sm mb-0.5">{name}</p>
                  <p className="text-[10px] text-[oklch(0.50_0_0)] mb-2">{desc}</p>
                  <p className="text-[oklch(0.85_0.18_95)] font-black">{price}</p>
                </div>
              ))}
            </div>
            <a
              href="mailto:podcast@flightdrama.com?subject=Podcast Sponsorship Enquiry"
              className="inline-flex items-center gap-2 bg-[oklch(0.85_0.18_95)] text-black font-black px-5 py-2.5 hover:bg-[oklch(0.78_0.18_95)] transition-colors text-sm"
            >
              <Mail className="w-4 h-4" /> Get in Touch
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
