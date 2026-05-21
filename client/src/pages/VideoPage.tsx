import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { Play } from "lucide-react";

const FEATURED_VIDEOS = [
  { id: "v1", title: "Delta Emergency Landing in Dublin — Cockpit Audio", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumb: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80" },
  { id: "v2", title: "SR-71 Blackbird — The Fastest Plane Ever Built", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumb: "https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=800&q=80" },
  { id: "v3", title: "Inside the Boeing 777X Factory", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumb: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800&q=80" },
];

export default function VideoPage() {
  const { data: videoArticles } = trpc.articles.list.useQuery({ limit: 12, postType: "video" });

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6">
        <div className="mb-6 accent-bar">
          <h1 className="text-3xl font-black text-white">Aviation Videos</h1>
          <p className="text-[oklch(0.55_0_0)] mt-1">The best aviation footage, cockpit recordings, and incident replays</p>
        </div>
        {/* Featured video player */}
        <div className="mb-8">
          <div className="aspect-video rounded-lg overflow-hidden bg-[oklch(0.15_0_0)] mb-4">
            <iframe src={FEATURED_VIDEOS[0].url} className="w-full h-full" allowFullScreen title="Featured Video" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FEATURED_VIDEOS.slice(1).map(v => (
              <div key={v.id} className="relative rounded-lg overflow-hidden cursor-pointer group card-hover">
                <img src={v.thumb} alt={v.title} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 img-overlay flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                    <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2"><p className="text-xs font-bold text-white line-clamp-1">{v.title}</p></div>
              </div>
            ))}
          </div>
        </div>
        {/* Social video embeds */}
        <section className="mb-8">
          <h2 className="font-display text-2xl text-white mb-4 tracking-wider">TikTok & Social Clips</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg overflow-hidden">
                <div className="aspect-[9/16] bg-[oklch(0.20_0_0)] flex items-center justify-center">
                  <div className="text-center text-[oklch(0.45_0_0)]"><Play className="w-12 h-12 mx-auto mb-2 opacity-30" /><p className="text-sm">Social video embed</p><p className="text-xs mt-1">TikTok / Instagram Reel</p></div>
                </div>
                <div className="p-3"><p className="text-sm font-bold text-white">183 Souls On Board... Only 25 Minutes of Battery Left</p><p className="text-xs text-[oklch(0.45_0_0)] mt-1">2.4M views on TikTok</p></div>
              </div>
            ))}
          </div>
        </section>
        {/* Video articles */}
        {videoArticles && videoArticles.length > 0 && (
          <section>
            <h2 className="font-display text-2xl text-white mb-4 tracking-wider">More Videos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videoArticles.map(a => <ArticleCard key={a.id} {...a} publishedAt={a.publishedAt} size="medium" />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
