import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navigation from "@/components/Navigation";
import { BarChart2, FileText, Users, Mail, Crown, Megaphone, ArrowRight, Settings, MessageSquare, TrendingUp, Zap } from "lucide-react";

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: stats } = trpc.crm.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });

  if (loading) return <div className="min-h-screen bg-[oklch(0.10_0_0)] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[oklch(0.85_0.18_95)] border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)] flex items-center justify-center">
      <div className="text-center"><p className="text-white mb-4">Admin access required</p><button onClick={() => window.location.href = getLoginUrl()} className="bg-[oklch(0.85_0.18_95)] text-black px-4 py-2 rounded font-bold">Sign In</button></div>
    </div>
  );
  if (user?.role !== "admin") return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)] flex items-center justify-center">
      <div className="text-center"><p className="text-white mb-4">You don't have admin access.</p><Link href="/" className="text-[oklch(0.85_0.18_95)] hover:underline">← Back to site</Link></div>
    </div>
  );

  const statCards = [
    { icon: FileText, label: "Total Articles", value: stats?.articles, href: "/admin/articles", colour: "text-blue-400" },
    { icon: Mail, label: "Subscribers", value: stats?.subscribers, href: "/admin/subscribers", colour: "text-green-400" },
    { icon: Crown, label: "Pro Members", value: stats?.members, href: "/admin/subscribers", colour: "text-[oklch(0.85_0.18_95)]" },
    { icon: Users, label: "Registered Users", value: stats?.users, href: "/admin/users", colour: "text-purple-400" },
  ];

  const quickLinks = [
    { icon: FileText, label: "Manage Articles", desc: "Create, edit, and delete articles", href: "/admin/articles" },
    { icon: Mail, label: "Subscribers", desc: "View and manage newsletter subscribers", href: "/admin/subscribers" },
    { icon: Users, label: "Users", desc: "Manage registered users and roles", href: "/admin/users" },
    { icon: Megaphone, label: "Ad Slots", desc: "Manage advertising placements", href: "/admin/ads" },
    { icon: MessageSquare, label: "Comments & Commenters", desc: "Moderate comments · News Commenters CRM", href: "/admin/comments" },
    { icon: Megaphone, label: "Media Kit & Sponsors", desc: "Advertising enquiries · Newsletter sponsors", href: "/admin/media-kit" },
    { icon: Mail, label: "Newsletter Composer", desc: "Write, preview, and send newsletter editions", href: "/admin/newsletter" },
    { icon: TrendingUp, label: "Analytics", desc: "Views, subscribers, top articles, growth charts", href: "/admin/analytics" },
    { icon: Zap, label: "Autopilot Review", desc: "Review AI-generated articles before publishing", href: "/admin/autopilot" },
  ];

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">CRM Dashboard</h1>
            <p className="text-[oklch(0.55_0_0)] mt-1">Flight Drama Admin Panel</p>
          </div>
          <Link href="/" className="text-sm text-[oklch(0.55_0_0)] hover:text-white transition-colors">← View Site</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ icon: Icon, label, value, href, colour }) => (
            <Link key={label} href={href} className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-5 hover:border-[oklch(0.85_0.18_95)]/30 card-hover">
              <Icon className={`w-6 h-6 ${colour} mb-3`} />
              <p className="text-3xl font-black text-white">{value?.toLocaleString() ?? "—"}</p>
              <p className="text-sm text-[oklch(0.50_0_0)] mt-1">{label}</p>
            </Link>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map(({ icon: Icon, label, desc, href }) => (
            <Link key={label} href={href} className="flex items-center gap-4 bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-5 hover:border-[oklch(0.85_0.18_95)]/30 card-hover group">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.85_0.18_95)] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-black" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-white group-hover:text-[oklch(0.85_0.18_95)] transition-colors">{label}</h3>
                <p className="text-sm text-[oklch(0.50_0_0)]">{desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[oklch(0.35_0_0)] group-hover:text-[oklch(0.85_0.18_95)] transition-colors" />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
