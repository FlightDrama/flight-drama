/**
 * FlightSearchBar — Flight-themed search bar for the homepage
 * Features: ATC-style design, animated plane icon, live search suggestions
 */

import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function FlightSearchBar() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Live suggestions — search articles as user types
  const { data: suggestions } = trpc.articles.list.useQuery(
    { limit: 5, search: query },
    { enabled: query.length >= 3 }
  );

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      navigate(`/?search=${encodeURIComponent(query.trim())}`);
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (slug: string) => {
    navigate(`/article/${slug}`);
    setQuery("");
    setFocused(false);
  };

  const showSuggestions = focused && query.length >= 3 && suggestions && suggestions.length > 0;

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
            ? "border-[oklch(0.85_0.18_95)] bg-[oklch(0.13_0_0)]"
            : "border-[oklch(0.22_0_0)] bg-[oklch(0.12_0_0)]"
        }`}>
          {/* Animated plane icon */}
          <div className={`pl-4 pr-2 transition-transform duration-300 ${focused ? "translate-x-1" : ""}`}>
            <svg
              viewBox="0 0 24 24"
              className={`w-5 h-5 transition-colors duration-200 ${focused ? "text-[oklch(0.85_0.18_95)]" : "text-[oklch(0.40_0_0)]"}`}
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
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search flights, incidents, airlines, aircraft..."
            className="flex-1 bg-transparent text-white text-sm py-3.5 pr-4 focus:outline-none placeholder:text-[oklch(0.35_0_0)] font-mono"
          />

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="px-3 text-[oklch(0.40_0_0)] hover:text-white transition-colors text-lg leading-none"
            >
              ×
            </button>
          )}

          {/* Search button */}
          <button
            type="submit"
            className={`px-5 py-3.5 font-black text-sm uppercase tracking-wide transition-all duration-200 ${
              query.trim()
                ? "bg-[oklch(0.85_0.18_95)] text-black hover:bg-[oklch(0.80_0.18_95)]"
                : "bg-[oklch(0.18_0_0)] text-[oklch(0.40_0_0)] cursor-not-allowed"
            }`}
            disabled={!query.trim()}
          >
            SEARCH
          </button>
        </div>

        {/* Runway-style bottom border */}
        <div className={`h-0.5 transition-all duration-300 ${
          focused
            ? "bg-gradient-to-r from-transparent via-[oklch(0.85_0.18_95)] to-transparent opacity-100"
            : "opacity-0"
        }`} />

        {/* Live suggestions dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 z-50 bg-[oklch(0.12_0_0)] border border-[oklch(0.85_0.18_95)]/30 shadow-2xl shadow-black/50 mt-1">
            <div className="px-4 py-2 border-b border-[oklch(0.18_0_0)] flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)]">✈ TRANSMISSION RECEIVED</span>
            </div>
            {suggestions.map((article) => (
              <button
                key={article.id}
                onMouseDown={() => handleSuggestionClick(article.slug)}
                className="w-full text-left px-4 py-3 hover:bg-[oklch(0.85_0.18_95)]/10 transition-colors border-b border-[oklch(0.15_0_0)] last:border-0 flex items-start gap-3"
              >
                {article.featuredImage && (
                  <img
                    src={article.featuredImage}
                    alt=""
                    className="w-12 h-8 object-cover rounded shrink-0 mt-0.5"
                  />
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
              <button
                onMouseDown={handleSearch}
                className="text-[10px] text-[oklch(0.85_0.18_95)] font-bold hover:underline"
              >
                See all results for "{query}" →
              </button>
            </div>
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
