import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import BreakingTicker from "@/components/BreakingTicker";
import { Menu, X, Search, Plane, ChevronDown, User, LogOut, Settings, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import NotificationBell from "@/components/NotificationBell";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "News", href: "/?tab=news" },
  { label: "Shorts", href: "/videos" },
  { label: "Flight Lookup", href: "/flight-lookup", isNew: true },
  { label: "Forum", href: "/forum" },
  { label: "Newsletter", href: "/newsletter" },
  { label: "Ranks", href: "/crew-ranks", isRanks: true },
  { label: "Pro", href: "/pro", isPro: true },
];

export default function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  // Live saved article count from localStorage
  const [savedCount, setSavedCount] = useState(0);
  useEffect(() => {
    const count = () => Object.keys(localStorage).filter(k => k.startsWith('fd_saved_')).length;
    setSavedCount(count());
    const onStorage = () => setSavedCount(count());
    window.addEventListener('storage', onStorage);
    // Also poll every 2s to catch same-tab changes
    const interval = setInterval(() => setSavedCount(count()), 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(interval); };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      {/* Breaking news ticker — dynamic, left-to-right */}
      <BreakingTicker />

      {/* Main navbar */}
      <nav className="sticky top-0 z-50 bg-[oklch(0.10_0_0)] border-b border-[oklch(0.22_0_0)]">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <img
                src="/manus-storage/FlightDrama_ca641ff4.jpg"
                alt="Flight Drama"
                className="h-10 w-10 rounded object-cover"
              />
              <div className="hidden sm:block">
                <div className="font-display text-2xl text-white leading-none tracking-wider">
                  FLIGHT<span className="text-[oklch(0.85_0.18_95)]">DRAMA</span>
                </div>
                <div className="text-[10px] text-[oklch(0.55_0_0)] uppercase tracking-widest">
                  Aviation News
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-semibold uppercase tracking-wide rounded transition-colors flex items-center gap-1 ${
                    link.isPro
                      ? "bg-[oklch(0.85_0.18_95)] text-black hover:bg-[oklch(0.78_0.18_95)]"
                      : (link.href === '/' && location === '/') || (link.href !== '/' && link.href !== '/?tab=news' && location.startsWith(link.href.split('?')[0])) || (link.href === '/?tab=news' && location === '/')
                      ? "text-[oklch(0.85_0.18_95)]"
                      : "text-[oklch(0.75_0_0)] hover:text-white"
                  }`}
                >
                  {link.isPro && <Crown className="w-3 h-3" />}
                  {(link as any).isNew && <Plane className="w-3 h-3" />}
                  {(link as any).isRanks && <span className="text-sm leading-none">🎖️</span>}
                  {link.label}
                  {(link as any).isNew && (
                    <span className="text-[8px] bg-[oklch(0.85_0.18_95)] text-black font-black px-1 py-0.5 leading-none ml-0.5">FREE</span>
                  )}
                </Link>
              ))}
            </div>

            {/* Departure Lounge icon with badge */}
            <Link
              href="/departure-lounge"
              className={`relative hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-semibold uppercase tracking-wide rounded transition-colors ${
                location === '/departure-lounge' ? 'text-[oklch(0.85_0.18_95)]' : 'text-[oklch(0.75_0_0)] hover:text-white'
              }`}
              title="Departure Lounge — Saved Articles"
            >
              <span className="text-base leading-none">🛫</span>
              <span className="hidden lg:inline">Lounge</span>
              {savedCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[oklch(0.85_0.18_95)] text-black text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                  {savedCount > 9 ? '9+' : savedCount}
                </span>
              )}
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Search */}
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <Input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search aviation news..."
                    className="w-48 h-8 text-sm bg-[oklch(0.18_0_0)] border-[oklch(0.30_0_0)] text-white"
                  />
                  <button type="button" onClick={() => setSearchOpen(false)} className="text-[oklch(0.55_0_0)] hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-[oklch(0.55_0_0)] hover:text-[oklch(0.85_0.18_95)] transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}

              {/* Auth */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-[oklch(0.18_0_0)] hover:bg-[oklch(0.22_0_0)] transition-colors">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-[oklch(0.85_0.18_95)] flex items-center justify-center">
                        {(user as any)?.avatar ? (
                          <img src={(user as any).avatar} alt={user?.name ?? 'User'} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-black text-xs font-bold">{user?.name?.charAt(0)?.toUpperCase() ?? "U"}</span>
                        )}
                      </div>
                      <span className="hidden sm:block text-sm text-white max-w-24 truncate">{user?.name}</span>
                      <ChevronDown className="w-3 h-3 text-[oklch(0.55_0_0)]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[oklch(0.15_0_0)] border-[oklch(0.25_0_0)]">
                    <DropdownMenuItem asChild>
                      <Link href="/pro" className="flex items-center gap-2 text-[oklch(0.85_0.18_95)]">
                        <Crown className="w-4 h-4" /> Flight Drama Pro
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/flight-lookup" className="flex items-center gap-2 text-[oklch(0.85_0.18_95)]">
                        <Plane className="w-4 h-4" /> Flight Lookup
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="w-4 h-4" /> My Pilot Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/departure-lounge" className="flex items-center gap-2">
                        <span className="text-base leading-none">🛫</span> Departure Lounge
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/leaderboard" className="flex items-center gap-2">
                        <span className="text-base leading-none">🏆</span> Crew Leaderboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/ranks" className="flex items-center gap-2">
                        <span className="text-base leading-none">📊</span> Points & Ranks
                      </Link>
                    </DropdownMenuItem>
                    {user?.role === "admin" && (
                      <>
                        <DropdownMenuSeparator className="bg-[oklch(0.25_0_0)]" />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center gap-2">
                            <Settings className="w-4 h-4" /> Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator className="bg-[oklch(0.25_0_0)]" />
                    <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-red-400">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/register">
                    <Button size="sm" variant="outline" className="border-[oklch(0.30_0_0)] text-[oklch(0.70_0_0)] hover:text-white text-xs uppercase tracking-wide hidden sm:flex">
                      Register
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="sm" className="bg-[oklch(0.85_0.18_95)] text-black hover:bg-[oklch(0.78_0.18_95)] font-bold text-xs uppercase tracking-wide">
                      <User className="w-3 h-3 mr-1" />
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2 text-[oklch(0.55_0_0)] hover:text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[oklch(0.22_0_0)] bg-[oklch(0.12_0_0)]">
            <div className="container py-3 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-2.5 text-sm font-semibold uppercase tracking-wide rounded ${
                    link.isPro
                      ? "bg-[oklch(0.85_0.18_95)] text-black"
                      : "text-[oklch(0.75_0_0)] hover:text-white hover:bg-[oklch(0.18_0_0)]"
                  }`}
                >
                  {link.isPro && <Crown className="inline w-3 h-3 mr-1" />}
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
