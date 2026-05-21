import { useParams, Link } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { ArrowLeft } from "lucide-react";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(0);
  const LIMIT = 18;
  const { data: categories } = trpc.categories.list.useQuery();
  const category = categories?.find(c => c.slug === slug);
  const { data: articles, isLoading } = trpc.articles.list.useQuery({ limit: LIMIT, offset: page * LIMIT, categoryId: category?.id }, { enabled: !!category?.id });

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0_0)] hover:text-white mb-6 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to News</Link>
        <div className="mb-6 accent-bar">
          <h1 className="text-3xl font-black text-white">{category?.name ?? slug}</h1>
          {category?.description && <p className="text-[oklch(0.55_0_0)] mt-1">{category.description}</p>}
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="bg-[oklch(0.15_0_0)] rounded-lg overflow-hidden animate-pulse"><div className="aspect-[16/9] bg-[oklch(0.20_0_0)]"/><div className="p-3 space-y-2"><div className="h-4 bg-[oklch(0.20_0_0)] rounded"/><div className="h-4 bg-[oklch(0.20_0_0)] rounded w-3/4"/></div></div>)}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles?.map(a => <ArticleCard key={a.id} {...a} publishedAt={a.publishedAt} size="medium" />)}
            </div>
            {!articles?.length && <div className="text-center py-16 text-[oklch(0.45_0_0)]"><p className="text-4xl mb-3">✈</p><p className="font-bold">No articles in this category yet</p></div>}
            <div className="flex items-center justify-center gap-3 mt-8">
              <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0} className="px-4 py-2 bg-[oklch(0.18_0_0)] text-sm font-bold rounded disabled:opacity-30 hover:bg-[oklch(0.22_0_0)] transition-colors">← Previous</button>
              <span className="text-sm text-[oklch(0.50_0_0)]">Page {page+1}</span>
              <button onClick={() => setPage(p=>p+1)} disabled={(articles?.length??0)<LIMIT} className="px-4 py-2 bg-[oklch(0.18_0_0)] text-sm font-bold rounded disabled:opacity-30 hover:bg-[oklch(0.22_0_0)] transition-colors">Next →</button>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
