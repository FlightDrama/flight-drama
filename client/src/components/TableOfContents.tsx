import { useState, useEffect } from "react";
import { List } from "lucide-react";

interface Heading { id: string; text: string; level: number; }

function extractHeadings(html: string): Heading[] {
  const div = document.createElement("div");
  div.innerHTML = html;
  const headings: Heading[] = [];
  div.querySelectorAll("h2, h3").forEach((el, i) => {
    const text = el.textContent?.trim() ?? "";
    if (!text || text.length < 4) return;
    const id = `toc-${i}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}`;
    el.id = id;
    headings.push({ id, text, level: parseInt(el.tagName[1]) });
  });
  return headings;
}

export default function TableOfContents({ content }: { content: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // Extract headings and inject IDs into the DOM
    const extracted = extractHeadings(content);
    setHeadings(extracted);
  }, [content]);

  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) { setActiveId(entry.target.id); break; }
        }
      },
      { rootMargin: "-20% 0% -70% 0%" }
    );
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-lg overflow-hidden mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[oklch(0.18_0_0)] border-b border-[oklch(0.22_0_0)] hover:bg-[oklch(0.20_0_0)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
          <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.65_0_0)]">
            In This Article
          </span>
        </div>
        <span className="text-[oklch(0.45_0_0)] text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <nav className="p-4">
          <ol className="space-y-1.5">
            {headings.map(({ id, text, level }) => (
              <li key={id} style={{ paddingLeft: level === 3 ? "1rem" : "0" }}>
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`text-xs leading-snug transition-colors block py-0.5 ${
                    activeId === id
                      ? "text-[oklch(0.85_0.18_95)] font-bold"
                      : "text-[oklch(0.55_0_0)] hover:text-[oklch(0.80_0_0)]"
                  }`}
                >
                  {activeId === id && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[oklch(0.85_0.18_95)] mr-1.5 mb-0.5" />}
                  {text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </div>
  );
}
