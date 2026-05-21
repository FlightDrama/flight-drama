import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { ArrowLeft, Megaphone, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

export default function AdminAdSlots() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: slots, isLoading } = trpc.crm.adSlots.useQuery(undefined, { enabled: user?.role === "admin" });
  const updateSlot = trpc.crm.updateAdSlot.useMutation({
    onSuccess: () => { utils.crm.adSlots.invalidate(); toast.success("Ad slot updated"); },
    onError: (e) => toast.error(e.message),
  });
  if (user?.role !== "admin") return <div className="min-h-screen bg-[oklch(0.10_0_0)] flex items-center justify-center"><p className="text-white">Admin access required</p></div>;
  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="text-[oklch(0.55_0_0)] hover:text-white"><ArrowLeft className="w-4 h-4" /></Link>
          <nav className="text-xs text-[oklch(0.45_0_0)]"><Link href="/admin" className="hover:text-white">Dashboard</Link> / Ad Slots</nav>
        </div>
        <h1 className="text-2xl font-black text-white mb-6">Ad Slot Management</h1>
        <div className="space-y-4">
          {isLoading ? Array.from({length:3}).map((_,i)=><div key={i} className="h-24 bg-[oklch(0.15_0_0)] rounded-lg animate-pulse" />) :
            slots?.map(slot => (
              <div key={slot.id} className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-5 h-5 text-[oklch(0.85_0.18_95)]" />
                    <div>
                      <h3 className="font-black text-white">{slot.label}</h3>
                      <p className="text-xs text-[oklch(0.45_0_0)]">Position: {slot.position} · Advertiser: {slot.advertiser ?? "—"}</p>
                    </div>
                  </div>
                  <button onClick={() => updateSlot.mutate({ id: slot.id, isActive: !slot.isActive })} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-bold transition-colors ${slot.isActive ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-[oklch(0.22_0_0)] text-[oklch(0.50_0_0)] hover:bg-[oklch(0.28_0_0)]"}`}>
                    {slot.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {slot.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
                {slot.content && <div className="mt-3 p-3 bg-[oklch(0.20_0_0)] rounded text-xs text-[oklch(0.55_0_0)] font-mono line-clamp-2">{slot.content}</div>}
              </div>
            ))
          }
        </div>
      </main>
    </div>
  );
}
