/**
 * TrendingCommentsWidget — Shows the most upvoted comments across all articles
 * Displayed in the homepage sidebar
 */

import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { MessageSquare, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function TrendingCommentsWidget() {
  const { data: comments, isLoading } = trpc.comments.trending.useQuery({ limit: 5 });

  if (isLoading) {
    return (
      <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
          <h3 className="text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)]">Trending Comments</h3>
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-[oklch(0.20_0_0)] rounded w-3/4 mb-1" />
              <div className="h-3 bg-[oklch(0.20_0_0)] rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!comments || comments.length === 0) return null;

  return (
    <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
        <h3 className="text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)]">Trending Comments</h3>
      </div>
      <div className="space-y-3">
        {comments.map((comment: any) => (
          <Link key={comment.id} href={`/article/${comment.articleSlug}`}>
            <div className="group cursor-pointer">
              {/* Article context */}
              <div className="text-[10px] text-[oklch(0.45_0_0)] uppercase tracking-wide font-bold mb-1 truncate group-hover:text-[oklch(0.85_0.18_95)] transition-colors">
                ✈ {comment.articleTitle}
              </div>
              {/* Comment text */}
              <p className="text-xs text-[oklch(0.70_0_0)] leading-relaxed line-clamp-2 group-hover:text-white transition-colors">
                "{comment.content}"
              </p>
              {/* Meta */}
              <div className="flex items-center gap-2 mt-1.5">
                {comment.userAvatar ? (
                  <img src={comment.userAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center text-[8px] font-black text-black">
                    {comment.userName?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-[10px] text-[oklch(0.40_0_0)] font-bold">{comment.userName}</span>
                <span className="text-[oklch(0.30_0_0)] text-[10px]">·</span>
                <div className="flex items-center gap-0.5 text-[10px] text-[oklch(0.85_0.18_95)] font-bold">
                  <ThumbsUp className="w-2.5 h-2.5" />
                  {comment.upvotes}
                </div>
                <span className="text-[oklch(0.30_0_0)] text-[10px]">·</span>
                <span className="text-[10px] text-[oklch(0.35_0_0)]">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
