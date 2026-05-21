import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { ArrowLeft, Shield, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminUsers() {
  const { user } = useAuth();
  const { data: users, isLoading } = trpc.crm.users.useQuery({ limit: 100, offset: 0 }, { enabled: user?.role === "admin" });
  if (user?.role !== "admin") return <div className="min-h-screen bg-[oklch(0.10_0_0)] flex items-center justify-center"><p className="text-white">Admin access required</p></div>;
  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="text-[oklch(0.55_0_0)] hover:text-white"><ArrowLeft className="w-4 h-4" /></Link>
          <nav className="text-xs text-[oklch(0.45_0_0)]"><Link href="/admin" className="hover:text-white">Dashboard</Link> / Users</nav>
        </div>
        <h1 className="text-2xl font-black text-white mb-6">User Management</h1>
        <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[oklch(0.17_0_0)] text-xs font-black uppercase tracking-wider text-[oklch(0.45_0_0)]">
            <span className="col-span-4">Name</span>
            <span className="col-span-4">Email</span>
            <span className="col-span-2">Role</span>
            <span className="col-span-2">Joined</span>
          </div>
          {isLoading ? Array.from({length:8}).map((_,i)=><div key={i} className="h-12 border-t border-[oklch(0.18_0_0)] animate-pulse bg-[oklch(0.14_0_0)]" />) :
            users?.map(u => (
              <div key={u.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-[oklch(0.18_0_0)] items-center hover:bg-[oklch(0.15_0_0)] transition-colors text-sm">
                <div className="col-span-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center text-black font-black text-xs shrink-0">{u.name?.charAt(0)?.toUpperCase() ?? "?"}</div>
                  <span className="text-white truncate">{u.name ?? "—"}</span>
                </div>
                <div className="col-span-4 text-[oklch(0.55_0_0)] truncate">{u.email ?? "—"}</div>
                <div className="col-span-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1 w-fit ${u.role === "admin" ? "bg-[oklch(0.85_0.18_95)]/20 text-[oklch(0.85_0.18_95)]" : "bg-[oklch(0.22_0_0)] text-[oklch(0.55_0_0)]"}`}>
                    {u.role === "admin" ? <Shield className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}{u.role}
                  </span>
                </div>
                <div className="col-span-2 text-[oklch(0.40_0_0)] text-xs">{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</div>
              </div>
            ))
          }
        </div>
      </main>
    </div>
  );
}
