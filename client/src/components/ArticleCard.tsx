import { Link } from "wouter";
import { Eye, Clock, Play, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ArticleCardProps = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  videoUrl?: string | null;
  postType: string;
  views: number;
  isFeatured?: boolean;
  isBreaking?: boolean;
  publishedAt: Date | string;
  authorName?: string | null;
  authorAvatar?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  categoryColour?: string | null;
  size?: "small" | "medium" | "large" | "hero";
};

export default function ArticleCard({
  title,
  slug,
  excerpt,
  featuredImage,
  videoUrl,
  postType,
  views,
  isFeatured,
  isBreaking,
  publishedAt,
  authorName,
  authorAvatar,
  categoryName,
  categorySlug,
  categoryColour,
  size = "medium",
}: ArticleCardProps) {
  const timeAgo = formatDistanceToNow(new Date(publishedAt), { addSuffix: true });
  const isVideo = postType === "video" || !!videoUrl;

  if (size === "hero") {
    return (
      <Link href={`/article/${slug}`} className="block group relative overflow-hidden rounded-lg card-hover">
        <div className="relative aspect-[16/9] overflow-hidden">
          {featuredImage ? (
            <img src={featuredImage} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-[oklch(0.18_0_0)] flex items-center justify-center">
              <span className="text-6xl">✈</span>
            </div>
          )}
          <div className="absolute inset-0 img-overlay" />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                <Play className="w-7 h-7 text-black ml-1" fill="black" />
              </div>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-3">
              {isBreaking && <span className="breaking-badge">Breaking</span>}
              {categoryName && (
                <Link href={`/category/${categorySlug}`} onClick={(e) => e.stopPropagation()} className="category-badge">
                  {categoryName}
                </Link>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 group-hover:text-[oklch(0.85_0.18_95)] transition-colors">
              {title}
            </h2>
            {excerpt && <p className="text-sm text-[oklch(0.75_0_0)] line-clamp-2 mb-3">{excerpt}</p>}
            <div className="flex items-center gap-3 text-xs text-[oklch(0.55_0_0)]">
              {authorName && <span className="font-semibold text-[oklch(0.70_0_0)]">By {authorName}</span>}
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{views.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (size === "large") {
    return (
      <Link href={`/article/${slug}`} className="block group bg-[oklch(0.15_0_0)] rounded-lg overflow-hidden card-hover border border-[oklch(0.22_0_0)] hover:border-[oklch(0.85_0.18_95)]/30">
        <div className="relative aspect-[16/9] overflow-hidden">
          {featuredImage ? (
            <img src={featuredImage} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-[oklch(0.18_0_0)] flex items-center justify-center text-4xl">✈</div>
          )}
          <div className="absolute inset-0 img-overlay" />
          {isVideo && (
            <div className="absolute top-3 right-3 bg-[oklch(0.85_0.18_95)] rounded px-2 py-0.5 flex items-center gap-1">
              <Play className="w-3 h-3 text-black" fill="black" />
              <span className="text-black text-xs font-bold">VIDEO</span>
            </div>
          )}
          <div className="absolute bottom-3 left-3 flex gap-2">
            {isBreaking && <span className="breaking-badge">Breaking</span>}
            {categoryName && (
              <Link href={`/category/${categorySlug}`} onClick={(e) => e.stopPropagation()} className="category-badge">
                {categoryName}
              </Link>
            )}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-black text-white text-lg leading-snug mb-2 group-hover:text-[oklch(0.85_0.18_95)] transition-colors line-clamp-2">
            {title}
          </h3>
          {excerpt && <p className="text-sm text-[oklch(0.55_0_0)] line-clamp-2 mb-3">{excerpt}</p>}
          <div className="flex items-center justify-between text-xs text-[oklch(0.45_0_0)]">
            <span>{authorName && `By ${authorName}`}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{views.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (size === "small") {
    return (
      <Link href={`/article/${slug}`} className="flex gap-3 group items-start py-3 border-b border-[oklch(0.18_0_0)] last:border-0 hover:bg-[oklch(0.13_0_0)] px-2 rounded transition-colors">
        {featuredImage && (
          <div className="shrink-0 w-16 h-16 rounded overflow-hidden">
            <img src={featuredImage} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {categoryName && <span className="text-[oklch(0.85_0.18_95)] text-[10px] font-bold uppercase tracking-wider">{categoryName}</span>}
          <h4 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-[oklch(0.85_0.18_95)] transition-colors">{title}</h4>
          <span className="text-[10px] text-[oklch(0.45_0_0)]">{timeAgo}</span>
        </div>
      </Link>
    );
  }

  // Default: medium card
  return (
    <Link href={`/article/${slug}`} className="block group bg-[oklch(0.15_0_0)] rounded-lg overflow-hidden card-hover border border-[oklch(0.22_0_0)] hover:border-[oklch(0.85_0.18_95)]/30">
      <div className="relative aspect-[16/9] overflow-hidden">
        {featuredImage ? (
          <img src={featuredImage} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-[oklch(0.18_0_0)] flex items-center justify-center text-3xl">✈</div>
        )}
        <div className="absolute inset-0 img-overlay" />
        {isVideo && (
          <div className="absolute top-2 right-2 bg-[oklch(0.85_0.18_95)] rounded px-1.5 py-0.5 flex items-center gap-1">
            <Play className="w-2.5 h-2.5 text-black" fill="black" />
            <span className="text-black text-[10px] font-bold">VIDEO</span>
          </div>
        )}
        {isBreaking && (
          <div className="absolute top-2 left-2">
            <span className="breaking-badge">Breaking</span>
          </div>
        )}
      </div>
      <div className="p-3">
        {categoryName && (
          <Link href={`/category/${categorySlug}`} onClick={(e) => e.stopPropagation()} className="text-[oklch(0.85_0.18_95)] text-[10px] font-bold uppercase tracking-wider hover:underline">
            {categoryName}
          </Link>
        )}
        <h3 className="font-black text-white text-sm leading-snug mt-1 mb-2 group-hover:text-[oklch(0.85_0.18_95)] transition-colors line-clamp-3">
          {title}
        </h3>
        <div className="flex items-center justify-between text-[10px] text-[oklch(0.45_0_0)]">
          <span>{authorName && `By ${authorName}`}</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{views.toLocaleString()}</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
