import { Link } from "wouter";
import { Plane, Twitter, Facebook, Instagram, Youtube, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[oklch(0.08_0_0)] border-t border-[oklch(0.20_0_0)] mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/manus-storage/FlightDrama_ca641ff4.jpg" alt="Flight Drama" className="h-10 w-10 rounded" />
              <div>
                <div className="font-display text-2xl text-white leading-none">
                  FLIGHT<span className="text-[oklch(0.85_0.18_95)]">DRAMA</span>
                </div>
                <div className="text-[10px] text-[oklch(0.45_0_0)] uppercase tracking-widest">Aviation News</div>
              </div>
            </Link>
            <p className="text-sm text-[oklch(0.50_0_0)] leading-relaxed mb-4">
              The internet's home for aviation enthusiasts. Breaking news, deep dives, community, and more.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Facebook, href: "https://www.facebook.com/groups/2881397465357025", label: "Facebook" },
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Youtube, href: "#", label: "YouTube" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded bg-[oklch(0.18_0_0)] flex items-center justify-center text-[oklch(0.55_0_0)] hover:text-[oklch(0.85_0.18_95)] hover:bg-[oklch(0.22_0_0)] transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)] mb-4">Categories</h4>
            <ul className="space-y-2">
              {[
                { label: "Commercial Aviation", slug: "commercial-aviation" },
                { label: "Military Aviation", slug: "military-aviation" },
                { label: "Aircraft Tech", slug: "aircraft-tech" },
                { label: "Aviation Incidents", slug: "aviation-incidents" },
                { label: "Flight Training", slug: "flight-training" },
                { label: "Space & Future", slug: "space-future" },
              ].map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/category/${cat.slug}`} className="text-sm text-[oklch(0.55_0_0)] hover:text-white transition-colors">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)] mb-4">Community</h4>
            <ul className="space-y-2">
              {[
                { label: "Forum", href: "/forum" },
                { label: "Newsletter", href: "/newsletter" },
                { label: "Flight Drama Pro", href: "/pro" },
                { label: "Videos", href: "/videos" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-[oklch(0.55_0_0)] hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter CTA */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)] mb-4">Stay Updated</h4>
            <p className="text-sm text-[oklch(0.50_0_0)] mb-4">
              Get the latest aviation news delivered to your inbox every week.
            </p>
            <Link
              href="/newsletter"
              className="flex items-center gap-2 bg-[oklch(0.85_0.18_95)] text-black px-4 py-2.5 rounded font-bold text-sm hover:bg-[oklch(0.78_0.18_95)] transition-colors w-full justify-center"
            >
              <Mail className="w-4 h-4" />
              Subscribe Free
            </Link>
          </div>
        </div>

        {/* Runway-style divider */}
        <div className="mt-10 mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-[oklch(0.18_0_0)]" />
          <span className="text-[oklch(0.25_0_0)] text-xs font-mono tracking-widest">— — ✈ — —</span>
          <div className="h-px flex-1 bg-[oklch(0.18_0_0)]" />
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <p className="text-xs text-[oklch(0.40_0_0)]">
              © {new Date().getFullYear()} Flight Drama. All rights reserved.
            </p>
            <span className="hidden sm:inline text-[oklch(0.25_0_0)] text-xs font-mono">|</span>
            <span className="hidden sm:inline text-[10px] font-mono text-[oklch(0.30_0_0)]">FL350 · M0.85 · EGLL–KLAX</span>
          </div>
          <div className="flex gap-4 text-xs text-[oklch(0.40_0_0)]">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="mailto:flightdrama@outlook.com" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
