import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Pen } from "lucide-react";

interface AuthorBioCardProps {
  author: { id: number; name: string; bio?: string | null; slug?: string | null; };
}

export default function AuthorBioCard({ author }: AuthorBioCardProps) {
  // Get article count by this author
  const { data: articles } = trpc.articles.list.useQuery(
    { limit: 3, offset: 0 },
    { enabled: !!author.id }
  );

  const bio = author.bio || "Aviation journalist and enthusiast covering the latest news, incidents, and developments in commercial and military aviation.";

  return (
    <div className="mt-8 bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden">
      <div className="bg-[oklch(0.18_0_0)] px-5 py-2.5 border-b border-[oklch(0.22_0_0)] flex items-center gap-2">
        <Pen className="w-3.5 h-3.5 text-[oklch(0.85_0.18_95)]" />
        <span className="text-xs font-black uppercase tracking-widest text-[oklch(0.55_0_0)]">About the Author</span>
      </div>
      <div className="p-5 flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center text-black font-black text-xl shrink-0">
          {author.name.charAt(0).toUpperCase()}
        </div>
        {/* Info */}
        <div className="flex-1">
          <p className="font-black text-white text-base mb-0.5">{author.name}</p>
          <p className="text-xs text-[oklch(0.85_0.18_95)] font-bold uppercase tracking-wide mb-2">Aviation Journalist</p>
          <p className="text-sm text-[oklch(0.60_0_0)] leading-relaxed">{bio}</p>
          <div className="mt-3 flex items-center gap-3">
            <Link
              href={`/category/aviation-incidents`}
              className="text-xs text-[oklch(0.85_0.18_95)] hover:underline font-bold"
            >
              More from {author.name.split(" ")[0]} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
