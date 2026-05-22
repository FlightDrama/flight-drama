import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RunwayDivider from "@/components/RunwayDivider";
import { PILOT_RANKS, getStripeDisplay } from "@/lib/pilotRank";
import { MessageSquare, Plane, Shield, GraduationCap, AlertTriangle, Camera, MessageCircle, Radio } from "lucide-react";

const ICONS: Record<string, any> = { Plane, Shield, GraduationCap, AlertTriangle, Camera, MessageCircle, MessageSquare };

// ATC-style board codes
const BOARD_CODES: Record<string, string> = {
  "commercial-aviation": "COMM",
  "military-tech": "MILTK",
  "flight-training": "TRNG",
  "aviation-incidents": "INCDT",
  "spotting-photography": "SPOT",
  "general-chat": "GEN",
};

export default function ForumPage() {
  const { data: boards } = trpc.forum.boards.useQuery();
  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6">
        {/* ATC-style header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Radio className="w-5 h-5 text-[oklch(0.85_0.18_95)]" />
            <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)]">
              FD-COMM · OPEN CHANNEL
            </span>
            <span className="flex items-center gap-1 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-green-500 font-bold">LIVE</span>
            </span>
          </div>
          <h1 className="text-3xl font-black text-white">Flight Drama Community Forum</h1>
          <p className="text-[oklch(0.55_0_0)] mt-1">Join thousands of aviation enthusiasts. Select your board and request clearance to transmit.</p>
        </div>

        {/* Forum boards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {boards?.map(board => {
            const Icon = ICONS[board.icon ?? "MessageSquare"] ?? MessageSquare;
            const code = BOARD_CODES[board.slug] ?? "FD";
            return (
              <Link key={board.id} href={`/forum/${board.slug}`} className="block bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg overflow-hidden hover:border-[oklch(0.85_0.18_95)]/40 card-hover group">
                {/* Board code header */}
                <div className="bg-[oklch(0.18_0_0)] px-4 py-1.5 border-b border-[oklch(0.22_0_0)] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[oklch(0.45_0_0)] tracking-widest">BOARD · {code}</span>
                  <span className="text-[10px] text-[oklch(0.35_0_0)]">✈</span>
                </div>
                <div className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[oklch(0.85_0.18_95)] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-white group-hover:text-[oklch(0.85_0.18_95)] transition-colors">{board.name}</h3>
                    <p className="text-sm text-[oklch(0.50_0_0)] mt-0.5">{board.description}</p>
                  </div>
                  <MessageSquare className="w-4 h-4 text-[oklch(0.35_0_0)] group-hover:text-[oklch(0.85_0.18_95)] transition-colors shrink-0 mt-1" />
                </div>
              </Link>
            );
          })}
        </div>

        <RunwayDivider label="Pilot Rank System" />

        {/* Pilot rank ladder */}
        <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-lg overflow-hidden mb-8">
          <div className="bg-[oklch(0.18_0_0)] px-5 py-3 border-b border-[oklch(0.22_0_0)]">
            <h2 className="font-black text-white text-sm uppercase tracking-wide">✈ Earn Your Wings — Forum Rank System</h2>
            <p className="text-xs text-[oklch(0.50_0_0)] mt-0.5">Your rank increases as you post. Start as a Student Pilot and work your way up to Aviation Legend.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0">
            {PILOT_RANKS.map((rank, i) => (
              <div key={rank.title} className={`p-3 border-r border-b border-[oklch(0.18_0_0)] last:border-r-0 ${i >= 5 ? "border-b-0" : ""}`}>
                <div className="text-xl mb-1">{rank.icon}</div>
                <p className={`text-xs font-black ${rank.colour} leading-tight`}>{rank.title}</p>
                {rank.stripes > 0 && (
                  <p className="text-[oklch(0.85_0.18_95)] text-[8px] tracking-widest my-0.5">{getStripeDisplay(rank.stripes)}</p>
                )}
                <p className="text-[10px] text-[oklch(0.40_0_0)]">{rank.minPosts}+ posts</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-[oklch(0.85_0.18_95)] to-[oklch(0.75_0.18_95)] rounded-lg p-6 text-black">
          <div className="flex items-start gap-4">
            <span className="text-3xl">👨‍✈️</span>
            <div>
              <h2 className="font-black text-xl mb-1">Request Clearance to Transmit</h2>
              <p className="opacity-80 mb-4 text-sm">Sign in to post threads, reply to discussions, earn your pilot rank, and become part of the Flight Drama community.</p>
              <Link href="/pro" className="inline-block bg-black text-[oklch(0.85_0.18_95)] px-5 py-2.5 rounded font-black text-sm hover:bg-[oklch(0.10_0_0)] transition-colors">
                ✈ Get Flight Drama Pro for VIP Access
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
