import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { ArrowLeft, Mail, Search, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminSubscribers() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const LIMIT = 50;
  const { data: subscribers, isLoading } = trpc.newsletter.list.useQuery({ limit: LIMIT, offset: page * LIMIT, status: statusFilter }, { enabled: user?.role === "admin" });
  const { data: count } = trpc.newsletter.count.useQuery();

  if (user?.role !== "admin") return <div className="min-h-screen bg-[oklch(0.10_0_0)] flex items-center justify-center"><p className="text-white">Admin access required</p></div>;

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="text-[oklch(0.55_0_0)] hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /></Link>
          <nav className="text-xs text-[oklch(0.45_0_0)]"><Link href="/admin" className="hover:text-white">Dashboard</Link> / Subscribers</nav>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Newsletter Subscribers</h1>
            <p className="text-sm text-[oklch(0.50_0_0)] mt-0.5">{count?.toLocaleString()} active subscribers</p>
          </div>
          <button className="flex items-center gap-2 bg-[oklch(0.18_0_0)] text-white px-3 py-2 rounded text-sm font-bold hover:bg-[oklch(0.22_0_0)] transition-colors"><Download className="w-4 h-4" /> Export CSV</button>
        </div>
        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {[undefined, "active", "unsubscribed", "bounced"].map(s => (
            <button key={s ?? "all"} onClick={() => { setStatusFilter(s); setPage(0); }} className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors ${statusFilter === s ? "bg-[oklch(0.85_0.18_95)] text-black" : "bg-[oklch(0.18_0_0)] text-[oklch(0.60_0_0)] hover:text-white"}`}>
              {s ?? "All"}
            </button>
          ))}
        </div>
        {/* Table */}
        <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[oklch(0.17_0_0)] text-xs font-black uppercase tracking-wider text-[oklch(0.45_0_0)]">
            <span className="col-span-4">Email</span>
            <span className="col-span-3">Name</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-2">Source</span>
            <span className="col-span-1">Joined</span>
          </div>
          {isLoading ? Array.from({length:10}).map((_,i)=><div key={i} className="h-12 border-t border-[oklch(0.18_0_0)] animate-pulse bg-[oklch(0.14_0_0)]" />) :
            subscribers?.map(s => (
              <div key={s.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-[oklch(0.18_0_0)] items-center hover:bg-[oklch(0.15_0_0)] transition-colors text-sm">
                <div className="col-span-4 flex items-center gap-2"><Mail className="w-3 h-3 text-[oklch(0.45_0_0)] shrink-0" /><span className="text-white truncate">{s.email}</span></div>
                <div className="col-span-3 text-[oklch(0.60_0_0)] truncate">{s.name ?? "—"}</div>
                <div className="col-span-2"><span className={`text-xs px-2 py-0.5 rounded font-bold ${s.status === "active" ? "bg-green-500/20 text-green-400" : s.status === "bounced" ? "bg-red-500/20 text-red-400" : "bg-[oklch(0.22_0_0)] text-[oklch(0.50_0_0)]"}`}>{s.status}</span></div>
                <div className="col-span-2 text-[oklch(0.50_0_0)] text-xs">{s.source}</div>
                <div className="col-span-1 text-[oklch(0.40_0_0)] text-xs">{formatDistanceToNow(new Date(s.subscribedAt), { addSuffix: false }).replace("about ", "")}</div>
              </div>
            ))
          }
        </div>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage(p=>Math.max(0,p-1))} disabled={page===0} className="px-4 py-2 bg-[oklch(0.18_0_0)] text-sm font-bold rounded disabled:opacity-30 hover:bg-[oklch(0.22_0_0)]">← Previous</button>
          <span className="text-sm text-[oklch(0.50_0_0)]">Page {page+1}</span>
          <button onClick={() => setPage(p=>p+1)} disabled={(subscribers?.length??0)<LIMIT} className="px-4 py-2 bg-[oklch(0.18_0_0)] text-sm font-bold rounded disabled:opacity-30 hover:bg-[oklch(0.22_0_0)]">Next →</button>
        </div>
      </main>
    </div>
  );
}
