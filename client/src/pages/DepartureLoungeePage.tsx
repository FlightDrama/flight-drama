/**
 * Departure Lounge — Flight-themed reading list page
 * Articles saved via localStorage bookmark feature
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface SavedArticle {
  slug: string;
  title: string;
  image: string | null;
  savedAt: number;
}

function getSavedArticles(): SavedArticle[] {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('fd_saved_'));
    return keys
      .map(k => {
        try { return JSON.parse(localStorage.getItem(k) ?? ''); } catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => b.savedAt - a.savedAt);
  } catch { return []; }
}

export default function DepartureLoungeePage() {
  const [saved, setSaved] = useState<SavedArticle[]>([]);
  const [boardingTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 45);
    return now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  });

  useEffect(() => {
    setSaved(getSavedArticles());
  }, []);

  const removeArticle = (slug: string) => {
    localStorage.removeItem(`fd_saved_${slug}`);
    setSaved(prev => prev.filter(a => a.slug !== slug));
    toast.success('✈ Removed from Departure Lounge');
  };

  const clearAll = () => {
    saved.forEach(a => localStorage.removeItem(`fd_saved_${a.slug}`));
    setSaved([]);
    toast.success('Departure Lounge cleared — gate closed');
  };

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-8">

        {/* Departure board header */}
        <div className="mb-8 bg-[oklch(0.08_0_0)] border border-[oklch(0.20_0_0)] rounded-lg overflow-hidden">
          {/* Airport-style header bar */}
          <div className="bg-[oklch(0.85_0.18_95)] px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-black" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
              <span className="font-black text-black text-lg uppercase tracking-widest">DEPARTURE LOUNGE</span>
            </div>
            <div className="text-black font-mono text-sm font-bold">
              BOARDING: {boardingTime}
            </div>
          </div>

          {/* Departure board content */}
          <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-b border-[oklch(0.18_0_0)]">
            <div>
              <div className="text-[10px] text-[oklch(0.40_0_0)] uppercase tracking-widest font-bold mb-1">GATE</div>
              <div className="text-2xl font-black text-[oklch(0.85_0.18_95)] font-mono">FD-{saved.length.toString().padStart(2, '0')}</div>
            </div>
            <div>
              <div className="text-[10px] text-[oklch(0.40_0_0)] uppercase tracking-widest font-bold mb-1">ARTICLES</div>
              <div className="text-2xl font-black text-white font-mono">{saved.length}</div>
            </div>
            <div>
              <div className="text-[10px] text-[oklch(0.40_0_0)] uppercase tracking-widest font-bold mb-1">STATUS</div>
              <div className={`text-sm font-black font-mono ${saved.length > 0 ? 'text-green-400' : 'text-[oklch(0.45_0_0)]'}`}>
                {saved.length > 0 ? '● READY TO READ' : '○ EMPTY'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[oklch(0.40_0_0)] uppercase tracking-widest font-bold mb-1">FLIGHT</div>
              <div className="text-sm font-black text-white font-mono">FD{Math.floor(Math.random() * 900 + 100)}</div>
            </div>
          </div>

          {/* Scrolling destination board */}
          {saved.length > 0 && (
            <div className="px-6 py-3 bg-[oklch(0.06_0_0)] font-mono text-[oklch(0.85_0.18_95)] text-xs overflow-hidden">
              <div className="flex gap-8 animate-ticker whitespace-nowrap">
                {[...saved, ...saved].map((a, i) => (
                  <span key={i} className="shrink-0">✈ {a.title.toUpperCase().slice(0, 40)}{a.title.length > 40 ? '...' : ''}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Articles grid */}
        {saved.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛫</div>
            <h2 className="text-2xl font-black text-white mb-2">Departure Lounge is Empty</h2>
            <p className="text-[oklch(0.50_0_0)] mb-6 max-w-md mx-auto">
              No articles saved for later. Browse Flight Drama and click the bookmark icon on any article to add it to your Departure Lounge.
            </p>
            <div className="flex items-center gap-3 justify-center">
              <div className="h-px flex-1 max-w-24 bg-[oklch(0.22_0_0)]" />
              <span className="text-[oklch(0.85_0.18_95)] text-xs font-black uppercase tracking-widest">AWAITING PASSENGERS</span>
              <div className="h-px flex-1 max-w-24 bg-[oklch(0.22_0_0)]" />
            </div>
            <Link href="/" className="inline-flex items-center gap-2 mt-6 bg-[oklch(0.85_0.18_95)] text-black font-black px-6 py-3 rounded hover:bg-[oklch(0.80_0.18_95)] transition-colors">
              ✈ Browse Articles
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-[oklch(0.85_0.18_95)] font-black text-sm uppercase tracking-widest">
                  {saved.length} article{saved.length !== 1 ? 's' : ''} in your lounge
                </span>
              </div>
              <button
                onClick={clearAll}
                className="text-xs text-[oklch(0.40_0_0)] hover:text-red-400 transition-colors font-bold"
              >
                ✕ Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {saved.map((article, idx) => (
                <div
                  key={article.slug}
                  className="group bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] hover:border-[oklch(0.85_0.18_95)]/40 transition-all duration-300 rounded-lg overflow-hidden"
                  style={{ animation: `fadeSlideIn 0.4s ease-out ${idx * 80}ms both` }}
                >
                  {article.image && (
                    <div className="aspect-[16/9] overflow-hidden relative">
                      <Link href={`/article/${article.slug}`}>
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      {/* Boarding pass style overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.85_0.18_95)] animate-pulse" />
                          <span className="text-[9px] font-black text-[oklch(0.85_0.18_95)] uppercase tracking-widest">
                            SAVED {formatDistanceToNow(new Date(article.savedAt), { addSuffix: true }).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <Link href={`/article/${article.slug}`}>
                      <h3 className="text-sm font-black text-white leading-snug line-clamp-2 group-hover:text-[oklch(0.85_0.18_95)] transition-colors mb-3">
                        {article.title}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/article/${article.slug}`}
                        className="text-xs font-bold text-[oklch(0.85_0.18_95)] hover:underline flex items-center gap-1"
                      >
                        ✈ Read now
                      </Link>
                      <button
                        onClick={() => removeArticle(article.slug)}
                        className="text-[10px] text-[oklch(0.35_0_0)] hover:text-red-400 transition-colors font-bold flex items-center gap-1"
                        title="Remove from Departure Lounge"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-10 text-center border-t border-[oklch(0.18_0_0)] pt-8">
              <p className="text-[oklch(0.45_0_0)] text-sm mb-4">Looking for more stories to add to your lounge?</p>
              <Link href="/" className="inline-flex items-center gap-2 bg-[oklch(0.85_0.18_95)] text-black font-black px-6 py-3 rounded hover:bg-[oklch(0.80_0.18_95)] transition-colors text-sm">
                ✈ Browse Latest Articles
              </Link>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
