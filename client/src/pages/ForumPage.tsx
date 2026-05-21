import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { MessageSquare, Users, Plane, Shield, GraduationCap, AlertTriangle, Camera, MessageCircle } from "lucide-react";

const ICONS: Record<string, any> = { Plane, Shield, GraduationCap, AlertTriangle, Camera, MessageCircle, MessageSquare };

export default function ForumPage() {
  const { data: boards } = trpc.forum.boards.useQuery();
  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6">
        <div className="mb-6 accent-bar">
          <h1 className="text-3xl font-black text-white">Flight Drama Community Forum</h1>
          <p className="text-[oklch(0.55_0_0)] mt-1">Join thousands of aviation enthusiasts discussing the latest news, incidents, and more.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boards?.map(board => {
            const Icon = ICONS[board.icon ?? "MessageSquare"] ?? MessageSquare;
            return (
              <Link key={board.id} href={`/forum/${board.slug}`} className="block bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-5 hover:border-[oklch(0.85_0.18_95)]/40 card-hover group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[oklch(0.85_0.18_95)] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-black text-white group-hover:text-[oklch(0.85_0.18_95)] transition-colors">{board.name}</h3>
                    <p className="text-sm text-[oklch(0.50_0_0)] mt-0.5">{board.description}</p>
                  </div>
                  <MessageSquare className="w-4 h-4 text-[oklch(0.35_0_0)] ml-auto shrink-0 mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-8 bg-gradient-to-br from-[oklch(0.85_0.18_95)] to-[oklch(0.75_0.18_95)] rounded-lg p-6 text-black">
          <h2 className="font-black text-2xl mb-2">Join the Discussion</h2>
          <p className="opacity-80 mb-4">Sign in with your Manus account to post threads, reply to discussions, and become part of the Flight Drama community.</p>
          <Link href="/pro" className="inline-block bg-black text-[oklch(0.85_0.18_95)] px-5 py-2.5 rounded font-black text-sm hover:bg-[oklch(0.15_0_0)] transition-colors">Get Flight Drama Pro for VIP Access →</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
