import { Link, useParams } from "wouter";
import { ArrowLeft, Clock, Compass, TrendingUp } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { trpc } from "@/lib/trpc";
import { getTopic, TOPICS } from "@/lib/topics";

function fallbackLabel(slug: string) {
  return slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export default function TopicPage() {
  const { slug } = useParams<{ slug: string }>();
  const topic = getTopic(slug);
  const label = topic?.label ?? fallbackLabel(slug ?? "topic");
  const search = topic?.search ?? label;
  const { data: latest, isLoading } = trpc.articles.list.useQuery({ limit: 24, search, sortBy: "recent" });
  const { data: popular } = trpc.articles.list.useQuery({ limit: 4, search, sortBy: "popular" });
  const suggestions = TOPICS.filter((item) => item.slug !== slug).slice(0, 5);

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6 sm:py-8">
        <Link href="/topics" className="mb-6 inline-flex items-center gap-2 text-sm text-[oklch(0.55_0_0)] transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All topic hubs
        </Link>

        <header className="border-b border-[oklch(0.22_0_0)] pb-6">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[oklch(0.85_0.18_95)]"><Compass className="h-3.5 w-3.5" /> Topic hub</div>
          <h1 className="text-3xl font-black text-white sm:text-4xl">{label} news</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[oklch(0.60_0_0)]">{topic?.description ?? `The latest Flight Drama coverage relating to ${label}.`}</p>
          <div className="mt-5 flex items-center gap-2 text-xs text-[oklch(0.55_0_0)]"><Clock className="h-3.5 w-3.5 text-[oklch(0.85_0.18_95)]" /> Latest stories first</div>
        </header>

        {popular && popular.length > 0 && (
          <section className="my-7" aria-labelledby="top-coverage">
            <div className="mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[oklch(0.85_0.18_95)]" /><h2 id="top-coverage" className="text-sm font-black uppercase tracking-[0.16em] text-white">Top coverage</h2></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{popular.map((article) => <ArticleCard key={article.id} {...article} publishedAt={article.publishedAt} size="medium" />)}</div>
          </section>
        )}

        <section className="mt-8" aria-labelledby="latest-coverage">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 id="latest-coverage" className="text-xl font-black text-white">Latest coverage</h2><span className="text-xs text-[oklch(0.45_0_0)]">{latest?.length ?? 0} stories</span></div>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[4/3] animate-pulse rounded-lg bg-[oklch(0.16_0_0)]" />)}</div>
          ) : latest && latest.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{latest.map((article) => <ArticleCard key={article.id} {...article} publishedAt={article.publishedAt} size="medium" />)}</div>
          ) : (
            <div className="rounded-lg border border-[oklch(0.22_0_0)] bg-[oklch(0.13_0_0)] px-5 py-10 text-center"><p className="text-lg font-black text-white">No coverage has landed here yet.</p><p className="mt-2 text-sm text-[oklch(0.55_0_0)]">Try one of the related topic hubs below or return to the latest aviation news.</p></div>
          )}
        </section>

        <section className="mt-10 border-t border-[oklch(0.22_0_0)] pt-6" aria-labelledby="related-topics">
          <h2 id="related-topics" className="text-sm font-black uppercase tracking-[0.16em] text-white">Explore another route</h2>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{suggestions.map((item) => <Link key={item.slug} href={`/topic/${item.slug}`} className="shrink-0 rounded-full border border-[oklch(0.25_0_0)] px-3 py-1.5 text-xs font-bold text-[oklch(0.65_0_0)] transition-colors hover:border-[oklch(0.85_0.18_95)] hover:text-[oklch(0.85_0.18_95)]">{item.label}</Link>)}</div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
