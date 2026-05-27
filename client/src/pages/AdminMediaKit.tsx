import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { ArrowLeft, Mail, Megaphone, Plus, Trash2, RefreshCw, Download, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Tab = "enquiries" | "sponsors";

function exportCSV(data: any[], filename: string) {
  if (!data.length) { toast.error("No data to export"); return; }
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => { const v = row[h]; if (v == null) return ""; const s = String(v); return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s; }).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${data.length} rows`);
}

export default function AdminMediaKit() {
  const { user, isAuthenticated, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("enquiries");
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState<"all"|"new"|"contacted"|"converted"|"closed">("all");

  // Sponsor form state
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [ctaText, setCtaText] = useState("Learn More");
  const [slotType, setSlotType] = useState<"top_banner"|"dedicated"|"classified">("top_banner");
  const [rateGbp, setRateGbp] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  const { data: enquiries, isLoading: enquiriesLoading, refetch: refetchEnquiries } =
    trpc.mediaKit.list.useQuery({ limit: 100, status: enquiryStatusFilter }, { enabled: isAuthenticated && user?.role === "admin" });

  const { data: sponsors, isLoading: sponsorsLoading, refetch: refetchSponsors } =
    trpc.sponsors.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });

  const updateStatus = trpc.mediaKit.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetchEnquiries(); },
    onError: (e) => toast.error(e.message),
  });

  const createSponsor = trpc.sponsors.create.useMutation({
    onSuccess: () => { toast.success("Sponsor added ✈"); refetchSponsors(); setShowSponsorForm(false); setBrandName(""); setCtaUrl(""); setTagline(""); setRateGbp(""); setScheduledDate(""); },
    onError: (e) => toast.error(e.message),
  });

  const deleteSponsor = trpc.sponsors.delete.useMutation({
    onSuccess: () => { toast.success("Sponsor removed"); refetchSponsors(); },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return null;
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[oklch(0.10_0_0)]"><Navigation />
        <div className="container py-16 text-center"><p className="text-4xl mb-4">🔒</p><h1 className="text-2xl font-black text-white mb-2">Admin Only</h1><Link href="/" className="text-[oklch(0.85_0.18_95)] hover:underline">← Back</Link></div>
      </div>
    );
  }

  const newCount = enquiries?.filter((e: any) => e.status === "new").length ?? 0;

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-[oklch(0.55_0_0)] hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="text-2xl font-black text-white">Media Kit & Sponsors</h1>
            <p className="text-xs text-[oklch(0.50_0_0)]">Manage advertising enquiries and newsletter sponsors</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "New Enquiries", value: newCount, colour: "text-yellow-400" },
            { label: "Total Enquiries", value: enquiries?.length ?? "—", colour: "text-white" },
            { label: "Active Sponsors", value: sponsors?.filter((s: any) => s.isActive).length ?? "—", colour: "text-[oklch(0.85_0.18_95)]" },
            { label: "Total Sponsors", value: sponsors?.length ?? "—", colour: "text-white" },
          ].map(({ label, value, colour }) => (
            <div key={label} className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-4">
              <p className={`text-2xl font-black ${colour}`}>{value}</p>
              <p className="text-xs text-[oklch(0.50_0_0)] font-bold uppercase tracking-wide mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[oklch(0.22_0_0)]">
          {([
            { key: "enquiries", label: "Advertising Enquiries", icon: Mail },
            { key: "sponsors", label: "Newsletter Sponsors", icon: Megaphone },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${tab === key ? "border-[oklch(0.85_0.18_95)] text-[oklch(0.85_0.18_95)]" : "border-transparent text-[oklch(0.50_0_0)] hover:text-white"}`}>
              <Icon className="w-4 h-4" />{label}
              {key === "enquiries" && newCount > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{newCount}</span>}
            </button>
          ))}
        </div>

        {/* Enquiries tab */}
        {tab === "enquiries" && (
          <>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {(["all","new","contacted","converted","closed"] as const).map(s => (
                <button key={s} onClick={() => setEnquiryStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${enquiryStatusFilter === s ? "bg-[oklch(0.85_0.18_95)] text-black" : "bg-[oklch(0.15_0_0)] border border-[oklch(0.25_0_0)] text-[oklch(0.60_0_0)] hover:text-white"}`}>
                  {s}
                </button>
              ))}
              <button onClick={() => refetchEnquiries()} className="ml-auto flex items-center gap-1.5 text-xs text-[oklch(0.50_0_0)] hover:text-white transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              {enquiries && enquiries.length > 0 && (
                <button onClick={() => exportCSV(enquiries.map((e: any) => ({ name: e.name, email: e.email, company: e.company, budget: e.budget, message: e.message, status: e.status, date: e.createdAt })), `media-kit-enquiries-${Date.now()}.csv`)}
                  className="flex items-center gap-1.5 text-xs text-[oklch(0.85_0.18_95)] hover:underline font-bold">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              )}
            </div>
            {enquiriesLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-[oklch(0.15_0_0)] rounded-lg animate-pulse" />)}</div>
            ) : enquiries && enquiries.length > 0 ? (
              <div className="space-y-3">
                {enquiries.map((enq: any) => (
                  <div key={enq.id} className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-white">{enq.name}</span>
                          {enq.company && <span className="text-xs text-[oklch(0.50_0_0)]">@ {enq.company}</span>}
                          {enq.budget && <span className="text-xs bg-[oklch(0.85_0.18_95)]/10 text-[oklch(0.85_0.18_95)] px-2 py-0.5 font-bold">{enq.budget}</span>}
                          <span className={`text-[10px] font-black px-2 py-0.5 uppercase ${enq.status === "new" ? "bg-yellow-900/40 text-yellow-400" : enq.status === "converted" ? "bg-green-900/40 text-green-400" : "bg-[oklch(0.20_0_0)] text-[oklch(0.50_0_0)]"}`}>{enq.status}</span>
                        </div>
                        <p className="text-xs text-[oklch(0.85_0.18_95)]">{enq.email}</p>
                        {enq.message && <p className="text-sm text-[oklch(0.60_0_0)] mt-1">{enq.message}</p>}
                        <p className="text-[10px] text-[oklch(0.40_0_0)] mt-1">{formatDistanceToNow(new Date(enq.createdAt), { addSuffix: true })}</p>
                      </div>
                      <select value={enq.status} onChange={e => updateStatus.mutate({ id: enq.id, status: e.target.value as any })}
                        className="text-xs bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] text-white px-2 py-1.5 focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors">
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-[oklch(0.45_0_0)]">
                <p className="text-3xl mb-2">📬</p>
                <p className="font-bold text-white mb-1">No enquiries yet</p>
                <p className="text-sm">Share your /advertise page with aviation brands to start getting enquiries</p>
              </div>
            )}
          </>
        )}

        {/* Sponsors tab */}
        {tab === "sponsors" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[oklch(0.55_0_0)]">Manage newsletter sponsors. Active sponsors appear in newsletter sends.</p>
              <button onClick={() => setShowSponsorForm(!showSponsorForm)}
                className="flex items-center gap-1.5 bg-[oklch(0.85_0.18_95)] text-black font-black text-xs px-3 py-2 hover:bg-[oklch(0.78_0.18_95)] transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Sponsor
              </button>
            </div>

            {showSponsorForm && (
              <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.85_0.18_95)]/30 rounded-xl p-5 mb-4">
                <h3 className="font-black text-white mb-4">Add Newsletter Sponsor</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[oklch(0.50_0_0)] mb-1">Brand Name *</label>
                    <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. Bose Aviation" className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[oklch(0.50_0_0)] mb-1">CTA URL *</label>
                    <input value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} placeholder="https://brand.com/offer" className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[oklch(0.50_0_0)] mb-1">Tagline</label>
                    <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. The world's best aviation headsets" className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[oklch(0.50_0_0)] mb-1">CTA Button Text</label>
                    <input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="Learn More" className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[oklch(0.50_0_0)] mb-1">Slot Type</label>
                    <select value={slotType} onChange={e => setSlotType(e.target.value as any)} className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors">
                      <option value="top_banner">Top Banner (£350)</option>
                      <option value="dedicated">Dedicated Send (£1,500)</option>
                      <option value="classified">Classified (£150)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[oklch(0.50_0_0)] mb-1">Rate Paid (£)</label>
                    <input type="number" value={rateGbp} onChange={e => setRateGbp(e.target.value)} placeholder="350" className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[oklch(0.50_0_0)] mb-1">Scheduled Date</label>
                    <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { if (!brandName || !ctaUrl) { toast.error("Brand name and URL required"); return; } createSponsor.mutate({ brandName, ctaUrl, tagline, ctaText, slotType, rateGbp: rateGbp ? Number(rateGbp) : undefined, scheduledDate: scheduledDate || undefined }); }}
                    disabled={createSponsor.isPending}
                    className="flex items-center gap-1.5 bg-[oklch(0.85_0.18_95)] text-black font-black text-xs px-4 py-2 hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-50">
                    {createSponsor.isPending ? <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Save Sponsor
                  </button>
                  <button onClick={() => setShowSponsorForm(false)} className="text-xs text-[oklch(0.50_0_0)] hover:text-white px-3 py-2 transition-colors">Cancel</button>
                </div>
              </div>
            )}

            {sponsorsLoading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-[oklch(0.15_0_0)] rounded-lg animate-pulse" />)}</div>
            ) : sponsors && sponsors.length > 0 ? (
              <div className="space-y-3">
                {sponsors.map((sponsor: any) => (
                  <div key={sponsor.id} className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-white">{sponsor.brandName}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 uppercase ${sponsor.isActive ? "bg-green-900/40 text-green-400" : "bg-[oklch(0.20_0_0)] text-[oklch(0.45_0_0)]"}`}>{sponsor.isActive ? "Active" : "Inactive"}</span>
                        <span className="text-[10px] bg-[oklch(0.20_0_0)] text-[oklch(0.55_0_0)] px-2 py-0.5">{sponsor.slotType.replace("_", " ")}</span>
                        {sponsor.rateGbp && <span className="text-[10px] text-[oklch(0.85_0.18_95)] font-bold">£{Number(sponsor.rateGbp).toFixed(0)}</span>}
                      </div>
                      {sponsor.tagline && <p className="text-xs text-[oklch(0.55_0_0)]">{sponsor.tagline}</p>}
                      <p className="text-[10px] text-[oklch(0.85_0.18_95)] mt-0.5">{sponsor.ctaUrl}</p>
                      {sponsor.scheduledDate && <p className="text-[10px] text-[oklch(0.40_0_0)]">Scheduled: {new Date(sponsor.scheduledDate).toLocaleDateString()}</p>}
                    </div>
                    <button onClick={() => { if (confirm(`Remove ${sponsor.brandName}?`)) deleteSponsor.mutate({ id: sponsor.id }); }}
                      className="text-[oklch(0.40_0_0)] hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-[oklch(0.45_0_0)]">
                <p className="text-3xl mb-2">📢</p>
                <p className="font-bold text-white mb-1">No sponsors yet</p>
                <p className="text-sm">Add your first newsletter sponsor above</p>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
