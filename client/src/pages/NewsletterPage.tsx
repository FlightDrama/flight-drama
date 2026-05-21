import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import NewsletterSignup from "@/components/NewsletterSignup";
import { trpc } from "@/lib/trpc";
import { Mail, Bell, Zap, Users } from "lucide-react";

export default function NewsletterPage() {
  const { data: count } = trpc.newsletter.count.useQuery();
  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-4xl font-black text-white mb-3">Flight Drama Newsletter</h1>
            <p className="text-lg text-[oklch(0.60_0_0)]">Join {count?.toLocaleString() ?? "thousands of"} aviation enthusiasts getting the best stories delivered to their inbox.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Zap, title: "Breaking News", desc: "Be first to know about major aviation incidents and announcements" },
              { icon: Bell, title: "Weekly Digest", desc: "The top 10 aviation stories of the week, curated by our editors" },
              { icon: Users, title: "Community Highlights", desc: "The best forum discussions and community content" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-4 text-center">
                <Icon className="w-6 h-6 text-[oklch(0.85_0.18_95)] mx-auto mb-2" />
                <h3 className="font-black text-white text-sm mb-1">{title}</h3>
                <p className="text-xs text-[oklch(0.50_0_0)]">{desc}</p>
              </div>
            ))}
          </div>
          <NewsletterSignup source="newsletter-page" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
