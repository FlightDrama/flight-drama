import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { MessageSquare, Send, User, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function ArticleComments({ articleId }: { articleId: number }) {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: comments, isLoading, refetch } = trpc.comments.list.useQuery({ articleId, limit: 20 });
  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      setContent("");
      setSubmitted(true);
      toast.success("Comment submitted for review ✈");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 3) return;
    createComment.mutate({ articleId, content: content.trim(), marketingOptIn });
  };

  return (
    <section className="mt-10 pt-8 border-t border-[oklch(0.22_0_0)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-5 h-5 text-[oklch(0.85_0.18_95)]" />
        <h2 className="text-lg font-black text-white">
          Comments {comments && comments.length > 0 && <span className="text-[oklch(0.50_0_0)] font-normal text-sm">({comments.length})</span>}
        </h2>
      </div>

      {/* Comment form */}
      {isAuthenticated ? (
        submitted ? (
          <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.85_0.18_95)]/20 rounded-lg p-5 mb-6 text-center">
            <p className="text-2xl mb-2">✈</p>
            <p className="font-bold text-white mb-1">Comment submitted for review</p>
            <p className="text-sm text-[oklch(0.55_0_0)]">Your comment will appear once approved by our team. Thanks for joining the conversation!</p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-3 text-xs text-[oklch(0.85_0.18_95)] hover:underline"
            >
              Post another comment
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center text-black font-black text-sm shrink-0 mt-0.5">
                {user?.name?.charAt(0) ?? "U"}
              </div>
              <div className="flex-1">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts on this story... (minimum 3 characters)"
                  rows={3}
                  maxLength={2000}
                  className="w-full bg-[oklch(0.15_0_0)] border border-[oklch(0.25_0_0)] rounded-lg px-4 py-3 text-sm text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={(e) => setMarketingOptIn(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[oklch(0.85_0.18_95)]"
                    />
                    <span className="text-xs text-[oklch(0.50_0_0)] group-hover:text-[oklch(0.65_0_0)] transition-colors">
                      Keep me updated with Flight Drama news and offers by email
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[oklch(0.35_0_0)]">{content.length}/2000</span>
                    <button
                      type="submit"
                      disabled={content.trim().length < 3 || createComment.isPending}
                      className="flex items-center gap-1.5 bg-[oklch(0.85_0.18_95)] text-black px-4 py-2 text-xs font-black hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-50"
                    >
                      {createComment.isPending ? (
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Post Comment
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-[oklch(0.30_0_0)] mt-1.5">
                  Comments are reviewed before publishing. Be respectful and on-topic.
                </p>
              </div>
            </div>
          </form>
        )
      ) : (
        /* Not signed in — auth gate */
        <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-6 mb-8 flex items-center gap-5">
          <div className="w-12 h-12 bg-[oklch(0.85_0.18_95)] flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6 text-black" />
          </div>
          <div className="flex-1">
            <p className="font-black text-white mb-0.5">Sign in to join the conversation</p>
            <p className="text-xs text-[oklch(0.55_0_0)]">Create a free account to comment on articles, earn pilot rank badges, and join the Flight Drama community.</p>
          </div>
          <button
            onClick={() => window.location.href = getLoginUrl()}
            className="shrink-0 bg-[oklch(0.85_0.18_95)] text-black px-5 py-2.5 font-black text-sm hover:bg-[oklch(0.78_0.18_95)] transition-colors flex items-center gap-2"
          >
            <User className="w-4 h-4" /> Sign In ✈
          </button>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-[oklch(0.18_0_0)] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[oklch(0.18_0_0)] rounded w-1/4" />
                <div className="h-3 bg-[oklch(0.15_0_0)] rounded" />
                <div className="h-3 bg-[oklch(0.15_0_0)] rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-5">
          {comments.map((comment: any) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-[oklch(0.22_0_0)] flex items-center justify-center text-[oklch(0.85_0.18_95)] font-black text-sm shrink-0">
                {(comment.userName ?? "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-white">{comment.userName ?? "Anonymous"}</span>
                  <span className="text-[10px] text-[oklch(0.40_0_0)]">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-[oklch(0.70_0_0)] leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-[oklch(0.40_0_0)]">
          <p className="text-3xl mb-2">💬</p>
          <p className="font-bold text-[oklch(0.60_0_0)] mb-1">No comments yet</p>
          <p className="text-sm">Be the first to share your thoughts on this story</p>
        </div>
      )}
    </section>
  );
}
