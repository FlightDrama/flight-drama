import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ShoppingBag, Download, Crown, Star, Plane } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function ShopPage() {
  const { isAuthenticated } = useAuth();
  const { data: products, isLoading } = trpc.products.list.useQuery();

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-6 h-6 text-[oklch(0.85_0.18_95)]" />
            <h1 className="text-3xl font-black text-white">Flight Drama Shop</h1>
          </div>
          <p className="text-[oklch(0.55_0_0)]">Exclusive guides, reports, and digital resources from the Flight Drama team</p>
        </div>

        {/* Products grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1,2].map(i => <div key={i} className="h-64 bg-[oklch(0.15_0_0)] rounded-xl animate-pulse" />)}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {products.map((product: any) => (
              <div key={product.id} className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden hover:border-[oklch(0.85_0.18_95)]/40 transition-colors group">
                {/* Cover image placeholder */}
                <div className="bg-gradient-to-br from-[oklch(0.18_0_0)] to-[oklch(0.12_0_0)] h-40 flex items-center justify-center border-b border-[oklch(0.20_0_0)]">
                  {product.coverImage ? (
                    <img src={product.coverImage} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Plane className="w-12 h-12 text-[oklch(0.85_0.18_95)] mx-auto mb-2" />
                      <span className="text-xs text-[oklch(0.45_0_0)] font-bold uppercase tracking-widest">Digital Download</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] bg-[oklch(0.85_0.18_95)] text-black font-black px-2 py-0.5">PDF GUIDE</span>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-[oklch(0.85_0.18_95)] text-[oklch(0.85_0.18_95)]" />)}
                    </div>
                  </div>
                  <h2 className="font-black text-white text-lg mb-2 leading-tight group-hover:text-[oklch(0.85_0.18_95)] transition-colors">{product.title}</h2>
                  <p className="text-sm text-[oklch(0.55_0_0)] mb-4 leading-relaxed line-clamp-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-black text-[oklch(0.85_0.18_95)]">£{Number(product.priceGbp).toFixed(2)}</span>
                      <span className="text-xs text-[oklch(0.45_0_0)] ml-1">one-time</span>
                    </div>
                    <button
                      onClick={() => {
                        if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
                        // TODO: Stripe checkout for digital products
                        alert("Coming soon — digital product checkout will be activated shortly!");
                      }}
                      className="flex items-center gap-2 bg-[oklch(0.85_0.18_95)] text-black font-black px-4 py-2 text-sm hover:bg-[oklch(0.78_0.18_95)] transition-colors"
                    >
                      <Download className="w-4 h-4" /> Buy Now
                    </button>
                  </div>
                  {product.salesCount > 0 && (
                    <p className="text-[10px] text-[oklch(0.40_0_0)] mt-2">{product.salesCount} copies sold</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Plane className="w-12 h-12 text-[oklch(0.30_0_0)] mx-auto mb-3" />
            <p className="text-[oklch(0.50_0_0)]">Products coming soon</p>
          </div>
        )}

        {/* Pro upsell */}
        <div className="bg-gradient-to-br from-[oklch(0.85_0.18_95)] to-[oklch(0.75_0.18_95)] rounded-xl p-6 flex flex-col sm:flex-row items-center gap-5">
          <Crown className="w-10 h-10 text-black shrink-0" />
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-black text-black mb-1">Get more with Flight Drama Pro</h3>
            <p className="text-black/70 text-sm">Pro members get exclusive content, ad-free reading, VIP forum access, and early access to new products — all for £4.99/month.</p>
          </div>
          <Link href="/pro" className="shrink-0 bg-black text-[oklch(0.85_0.18_95)] font-black px-6 py-3 hover:bg-[oklch(0.15_0_0)] transition-colors whitespace-nowrap">
            Join Pro →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
