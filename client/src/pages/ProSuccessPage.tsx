import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Crown, CheckCircle } from "lucide-react";

export default function ProSuccessPage() {
  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-16 text-center max-w-xl mx-auto">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <Crown className="w-10 h-10 text-[oklch(0.85_0.18_95)] mx-auto mb-4" />
        <h1 className="text-4xl font-black text-white mb-3">Welcome to Flight Drama Pro!</h1>
        <p className="text-[oklch(0.60_0_0)] mb-8">Your subscription is now active. Enjoy ad-free reading, exclusive articles, and VIP forum access.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="bg-[oklch(0.85_0.18_95)] text-black px-6 py-3 rounded-lg font-black hover:bg-[oklch(0.78_0.18_95)] transition-colors">Read Latest News →</Link>
          <Link href="/forum" className="bg-[oklch(0.18_0_0)] text-white px-6 py-3 rounded-lg font-black hover:bg-[oklch(0.22_0_0)] transition-colors">Visit Forum</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
