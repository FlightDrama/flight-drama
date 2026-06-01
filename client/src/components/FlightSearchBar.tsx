/**
 * FlightSearchBar — Flight-themed search bar for the homepage
 * Features: ATC-style design, animated plane icon, live search suggestions,
 *           flight-themed no-results state with popular article suggestions
 */

import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function FlightSearchBar() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [isSearching, setIsSearching] = useState(false);

  // Live suggestions — search articles as user types
  const { data: suggestions, isLoading: suggestionsLoading } = trpc.articles.list.useQuery(
    { limit: 5, search: query },
    { enabled: query.length >= 3 }
  );

  // Popular articles for no-results fallback
  const { data: popularArticles } = trpc.articles.list.useQuery(
    { limit: 4, sortBy: 'popular' },
    { enabled: true }
  );

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      setIsSearching(true);
      setTimeout(() => {
        navigate(`/?search=${encodeURIComponent(query.trim())}`);
        setFocused(false);
        setIsSearching(false);
        inputRef.current?.blur();
      }, 800);
    }
  };

  const handleSuggestionClick = (slug: string) => {
    navigate(`/article/${slug}`);
    setQuery("");
    setFocused(false);
  };

  const hasResults = suggestions && suggestions.length > 0;
  const noResults = focused && query.length >= 3 && !suggestionsLoading && suggestions && suggestions.length === 0;
  const showSuggestions = focused && query.length >= 3 && hasResults;
  const showDropdown = showSuggestions || noResults;

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* ATC-style label */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[oklch(0.85_0.18_95)] animate-pulse inline-block" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[oklch(0.85_0.18_95)]">
            FLIGHT DRAMA SEARCH
          </span>
        </div>
        <div className="flex-1 h-px bg-[oklch(0.22_0_0)]" />
        <span className="text-[10px] text-[oklch(0.40_0_0)] font-mono">SQUAWK 7700</span>
      </div>

      {/* Search input */}
      <form onSubmit={handleSearch} className="relative">
        <div className={`relative flex items-center border-2 transition-all duration-200 ${
          focused
            ? noResults
              ? "border-red-500/50 bg-[oklch(0.13_0_0)]"
              : "border-[oklch(0.85_0.18_95)] bg-[oklch(0.13_0_0)]"
            : "border-[oklch(0.22_0_0)] bg-[oklch(0.12_0_0)]"
        }`}>
          {/* Animated plane icon */}
          <div className={`pl-4 pr-2 transition-transform duration-300 ${focused ? "translate-x-1" : ""}`}>
            <svg
              viewBox="0 0 24 24"
              className={`w-5 h-5 transition-colors duration-200 ${
                noResults ? "text-red-400" : focused ? "text-[oklch(0.85_0.18_95)]" : "text-[oklch(0.40_0_0)]"
              }`}
              fill="currentColor"
            >
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>

          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            placeholder="Search flights, incidents, airlines, aircraft..."
            className="flex-1 bg-transparent text-white text-sm py-3.5 pr-4 focus:outline-none placeholder:text-[oklch(0.35_0_0)] font-mono"
          />

          {/* Radar sweep loading overlay */}
          {isSearching && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, oklch(0.85 0.18 95) 30deg, transparent 60deg)',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[oklch(0.85_0.18_95)] text-xs font-black font-mono tracking-widest animate-pulse">
                  SCANNING...
                </span>
              </div>
            </div>
          )}

          {/* Eject-themed clear button */}
          {query && !isSearching && (
            <button
              type="button"
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="px-3 text-[oklch(0.40_0_0)] hover:text-[oklch(0.85_0.18_95)] transition-colors group flex flex-col items-center gap-0"
              title="EJECT — Clear search"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 20h14v-2H5v2zm7-18L5.33 13h13.34L12 2z"/>
              </svg>
              <span className="text-[7px] font-black tracking-widest leading-none">EJECT</span>
            </button>
          )}

          {/* Search button */}
          <button
            type="submit"
            className={`px-5 py-3.5 font-black text-sm uppercase tracking-wide transition-all duration-200 ${
              query.trim()
                ? noResults
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-[oklch(0.85_0.18_95)] text-black hover:bg-[oklch(0.80_0.18_95)]"
                : "bg-[oklch(0.18_0_0)] text-[oklch(0.40_0_0)] cursor-not-allowed"
            }`}
            disabled={!query.trim()}
          >
            {noResults ? "MAYDAY" : "SEARCH"}
          </button>
        </div>

        {/* Runway-style bottom border */}
        <div className={`h-0.5 transition-all duration-300 ${
          focused
            ? noResults
              ? "bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-100"
              : "bg-gradient-to-r from-transparent via-[oklch(0.85_0.18_95)] to-transparent opacity-100"
            : "opacity-0"
        }`} />

        {/* Dropdown — results or no-results state */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-50 bg-[oklch(0.12_0_0)] border shadow-2xl shadow-black/50 mt-1"
            style={{ borderColor: noResults ? 'rgba(239,68,68,0.3)' : 'rgba(var(--color-yellow-400),0.3)' }}
          >
            {/* Results state */}
            {showSuggestions && (
              <>
                <div className="px-4 py-2 border-b border-[oklch(0.18_0_0)] flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)]">✈ TRANSMISSION RECEIVED</span>
                </div>
                {suggestions!.map((article) => (
                  <button
                    key={article.id}
                    onMouseDown={() => handleSuggestionClick(article.slug)}
                    className="w-full text-left px-4 py-3 hover:bg-[oklch(0.85_0.18_95)]/10 transition-colors border-b border-[oklch(0.15_0_0)] last:border-0 flex items-start gap-3"
                  >
                    {article.featuredImage && (
                      <img src={article.featuredImage} alt="" className="w-12 h-8 object-cover rounded shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{article.title}</div>
                      <div className="text-[10px] text-[oklch(0.45_0_0)] mt-0.5 flex items-center gap-2">
                        {article.categoryName && (
                          <span className="text-[oklch(0.85_0.18_95)] font-bold uppercase tracking-wide">{article.categoryName}</span>
                        )}
                        <span>·</span>
                        <span>{article.views} views</span>
                      </div>
                    </div>
                    <span className="text-[oklch(0.85_0.18_95)] text-xs shrink-0 mt-1">→</span>
                  </button>
                ))}
                <div className="px-4 py-2 border-t border-[oklch(0.18_0_0)]">
                  <button onMouseDown={handleSearch} className="text-[10px] text-[oklch(0.85_0.18_95)] font-bold hover:underline">
                    See all results for "{query}" →
                  </button>
                </div>
              </>
            )}

            {/* No-results state */}
            {noResults && (
              <>
                {/* ATC-style emergency header */}
                <div className="px-4 py-3 border-b border-red-500/20 bg-red-500/5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                      <span className="w-2 h-2 rounded-full bg-red-500 absolute" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-red-400">
                        ⚠ SQUAWK 7700 — NO SIGNAL DETECTED
                      </div>
                      <div className="text-[9px] text-red-400/60 font-mono mt-0.5">
                        SEARCH "{query.toUpperCase()}" RETURNED NO RESULTS · DIVERTING TO POPULAR STORIES
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diverted to popular articles */}
                <div className="px-4 py-2 border-b border-[oklch(0.18_0_0)] flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)]">
                    ✈ DIVERTING — POPULAR STORIES IN YOUR AREA
                  </span>
                </div>

                {popularArticles?.map((article) => (
                  <button
                    key={article.id}
                    onMouseDown={() => handleSuggestionClick(article.slug)}
                    className="w-full text-left px-4 py-3 hover:bg-[oklch(0.85_0.18_95)]/10 transition-colors border-b border-[oklch(0.15_0_0)] last:border-0 flex items-start gap-3"
                  >
                    {article.featuredImage && (
                      <img src={article.featuredImage} alt="" className="w-12 h-8 object-cover rounded shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{article.title}</div>
                      <div className="text-[10px] text-[oklch(0.45_0_0)] mt-0.5 flex items-center gap-2">
                        {article.categoryName && (
                          <span className="text-[oklch(0.85_0.18_95)] font-bold uppercase tracking-wide">{article.categoryName}</span>
                        )}
                        <span>·</span>
                        <span className="text-[oklch(0.85_0.18_95)]">🔥 {article.views} views</span>
                      </div>
                    </div>
                    <span className="text-[oklch(0.85_0.18_95)] text-xs shrink-0 mt-1">→</span>
                  </button>
                ))}

                {/* Try different search suggestions */}
                <div className="px-4 py-3 border-t border-[oklch(0.18_0_0)] bg-[oklch(0.11_0_0)]">
                  <div className="text-[9px] text-[oklch(0.40_0_0)] font-mono mb-2 uppercase tracking-widest">
                    ATC SUGGESTS — TRY THESE FREQUENCIES:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Boeing", "Airbus", "Emergency", "Ryanair", "British Airways", "Incident"].map(term => (
                      <button
                        key={term}
                        onMouseDown={() => {
                          setQuery(term);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        className="text-[10px] bg-[oklch(0.18_0_0)] border border-[oklch(0.25_0_0)] text-[oklch(0.60_0_0)] hover:border-[oklch(0.85_0.18_95)] hover:text-[oklch(0.85_0.18_95)] px-2 py-1 rounded transition-colors font-mono"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </form>

      {/* ATC-style hint text */}
      {!focused && (
        <div className="flex items-center gap-4 mt-2">
          <span className="text-[10px] text-[oklch(0.30_0_0)] font-mono">
            FREQ: 121.5 MHz · ATIS: SEARCH ACTIVE · {new Date().toUTCString().slice(17, 22)}Z
          </span>
        </div>
      )}
    </div>
  );
}
