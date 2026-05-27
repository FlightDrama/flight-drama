import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { MessageSquare, Send, User, Lock, ThumbsUp, Reply, ChevronDown, ChevronUp, Pin, ArrowUpDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

// Session ID for upvotes (no auth required)
function getSessionId(): string {
  const key = "fd-session-id";
  try {
    let id = localStorage.getItem(key);
    if (!id) { id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); localStorage.setItem(key, id); }
    return id;
  } catch { return "anon-" + Math.random().toString(36).slice(2); }
}

interface CommentItemProps {
  comment: any;
  replies: any[];
  sessionId: string;
  isAuthenticated: boolean;
  isAdmin?: boolean;
  onReply: (parentId: number, parentName: string) => void;
  upvotedIds: Set<number>;
  onUpvote: (commentId: number) => void;
  onPin?: (id: number, pin: boolean) => void;
}

function CommentItem({ comment, replies, sessionId, isAuthenticated, isAdmin, onReply, upvotedIds, onUpvote, onPin }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);
  const isUpvoted = upvotedIds.has(comment.id);

  return (
    <div className={`flex gap-3 ${comment.isPinned ? 'bg-[oklch(0.85_0.18_95)]/5 border border-[oklch(0.85_0.18_95)]/20 rounded-lg p-3 -mx-3' : ''}`}>
      <div className="w-9 h-9 rounded-full bg-[oklch(0.22_0_0)] flex items-center justify-center text-[oklch(0.85_0.18_95)] font-black text-sm shrink-0">
        {(comment.userName ?? "U").charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {comment.isPinned && (
            <span className="flex items-center gap-1 text-[10px] bg-[oklch(0.85_0.18_95)] text-black font-black px-1.5 py-0.5">
              <Pin className="w-2.5 h-2.5" /> Comment of the Week
            </span>
          )}
          <span className="text-sm font-bold text-white">{comment.userName ?? "Anonymous"}</span>
          <span className="text-[10px] text-[oklch(0.40_0_0)]">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-[oklch(0.70_0_0)] leading-relaxed mb-2">{comment.content}</p>
        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onUpvote(comment.id)}
            className={`flex items-center gap-1 text-xs transition-colors ${
              isUpvoted ? "text-[oklch(0.85_0.18_95)] font-bold" : "text-[oklch(0.45_0_0)] hover:text-[oklch(0.65_0_0)]"
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? "fill-[oklch(0.85_0.18_95)]" : ""}`} />
            {comment.upvotes > 0 && <span>{comment.upvotes}</span>}
          </button>
          {isAuthenticated && (
            <button
              onClick={() => onReply(comment.id, comment.userName ?? "Anonymous")}
              className="flex items-center gap-1 text-xs text-[oklch(0.45_0_0)] hover:text-[oklch(0.65_0_0)] transition-colors"
            >
              <Reply className="w-3.5 h-3.5" /> Reply
            </button>
          )}
          {isAdmin && onPin && (
            <button
              onClick={() => onPin(comment.id, !comment.isPinned)}
              className={`flex items-center gap-1 text-xs transition-colors ${
                comment.isPinned ? 'text-[oklch(0.85_0.18_95)] font-bold' : 'text-[oklch(0.35_0_0)] hover:text-[oklch(0.85_0.18_95)]'
              }`}
              title={comment.isPinned ? 'Unpin comment' : 'Pin as Comment of the Week'}
            >
              <Pin className="w-3.5 h-3.5" /> {comment.isPinned ? 'Unpin' : 'Pin'}
            </button>
          )}
          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-xs text-[oklch(0.45_0_0)] hover:text-[oklch(0.65_0_0)] transition-colors ml-1"
            >
              {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>
        {/* Replies */}
        {showReplies && replies.length > 0 && (
          <div className="mt-3 space-y-3 pl-4 border-l-2 border-[oklch(0.20_0_0)]">
            {replies.map(reply => (
              <div key={reply.id} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[oklch(0.20_0_0)] flex items-center justify-center text-[oklch(0.85_0.18_95)] font-black text-xs shrink-0">
                  {(reply.userName ?? "U").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-bold text-white">{reply.userName ?? "Anonymous"}</span>
                    <span className="text-[10px] text-[oklch(0.40_0_0)]">
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-[oklch(0.65_0_0)] leading-relaxed mb-1.5">{reply.content}</p>
                  <button
                    onClick={() => onUpvote(reply.id)}
                    className={`flex items-center gap-1 text-[10px] transition-colors ${
                      upvotedIds.has(reply.id) ? "text-[oklch(0.85_0.18_95)] font-bold" : "text-[oklch(0.40_0_0)] hover:text-[oklch(0.60_0_0)]"
                    }`}
                  >
                    <ThumbsUp className={`w-3 h-3 ${upvotedIds.has(reply.id) ? "fill-[oklch(0.85_0.18_95)]" : ""}`} />
                    {reply.upvotes > 0 && <span>{reply.upvotes}</span>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ArticleComments({ articleId }: { articleId: number }) {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [upvotedIds, setUpvotedIds] = useState<Set<number>>(new Set());
  const [sessionId] = useState(getSessionId);
  const [sort, setSort] = useState<'newest'|'top'>('newest');

  const { data: comments, isLoading, refetch } = trpc.comments.list.useQuery({ articleId, limit: 50, sort });

  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => { setContent(""); setReplyTo(null); setSubmitted(true); toast.success("Comment submitted for review ✈"); },
    onError: (e) => toast.error(e.message),
  });

  const upvoteMutation = trpc.comments.upvote.useMutation({
    onMutate: ({ commentId }) => {
      setUpvotedIds(prev => {
        const next = new Set(prev);
        prev.has(commentId) ? next.delete(commentId) : next.add(commentId);
        return next;
      });
    },
    onSettled: () => refetch(),
  });

  const handleUpvote = useCallback((commentId: number) => {
    upvoteMutation.mutate({ commentId, sessionId });
  }, [sessionId, upvoteMutation]);

  const pinMutation = trpc.comments.pin.useMutation({
    onSuccess: () => { toast.success('Comment pinned ✈'); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 3) return;
    createComment.mutate({
      articleId,
      content: content.trim(),
      marketingOptIn,
      parentId: replyTo?.id,
    });
  };

  // Organise into threads (top-level + replies)
  const topLevel = comments?.filter((c: any) => !c.parentId) ?? [];
  const repliesMap = new Map<number, any[]>();
  comments?.forEach((c: any) => {
    if (c.parentId) {
      const arr = repliesMap.get(c.parentId) ?? [];
      arr.push(c);
      repliesMap.set(c.parentId, arr);
    }
  });

  const totalCount = comments?.length ?? 0;

  return (
    <section className="mt-10 pt-8 border-t border-[oklch(0.22_0_0)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-[oklch(0.85_0.18_95)]" />
          <h2 className="text-lg font-black text-white">
            Comments {totalCount > 0 && <span className="text-[oklch(0.50_0_0)] font-normal text-sm">({totalCount})</span>}
          </h2>
        </div>
        {totalCount > 1 && (
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[oklch(0.45_0_0)]" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'newest'|'top')}
              className="text-xs bg-[oklch(0.15_0_0)] border border-[oklch(0.25_0_0)] text-[oklch(0.65_0_0)] px-2 py-1 focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors"
            >
              <option value="newest">Newest first</option>
              <option value="top">Most upvoted</option>
            </select>
          </div>
        )}
      </div>

      {/* Comment form */}
      {isAuthenticated ? (
        submitted && !replyTo ? (
          <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.85_0.18_95)]/20 rounded-lg p-5 mb-6 text-center">
            <p className="text-2xl mb-2">✈</p>
            <p className="font-bold text-white mb-1">Comment submitted for review</p>
            <p className="text-sm text-[oklch(0.55_0_0)]">Your comment will appear once approved. Thanks for joining the conversation!</p>
            <button onClick={() => setSubmitted(false)} className="mt-3 text-xs text-[oklch(0.85_0.18_95)] hover:underline">Post another comment</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mb-8">
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 text-xs text-[oklch(0.55_0_0)] bg-[oklch(0.15_0_0)] px-3 py-2 rounded">
                <Reply className="w-3.5 h-3.5 text-[oklch(0.85_0.18_95)]" />
                Replying to <span className="font-bold text-white">{replyTo.name}</span>
                <button type="button" onClick={() => setReplyTo(null)} className="ml-auto text-[oklch(0.45_0_0)] hover:text-white">✕</button>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center text-black font-black text-sm shrink-0 mt-0.5">
                {user?.name?.charAt(0) ?? "U"}
              </div>
              <div className="flex-1">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={replyTo ? `Reply to ${replyTo.name}...` : "Share your thoughts on this story..."}
                  rows={3}
                  maxLength={2000}
                  className="w-full bg-[oklch(0.15_0_0)] border border-[oklch(0.25_0_0)] rounded-lg px-4 py-3 text-sm text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className="w-3.5 h-3.5 accent-[oklch(0.85_0.18_95)]" />
                    <span className="text-xs text-[oklch(0.50_0_0)] group-hover:text-[oklch(0.65_0_0)] transition-colors">Keep me updated with Flight Drama news by email</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[oklch(0.35_0_0)]">{content.length}/2000</span>
                    <button
                      type="submit"
                      disabled={content.trim().length < 3 || createComment.isPending}
                      className="flex items-center gap-1.5 bg-[oklch(0.85_0.18_95)] text-black px-4 py-2 text-xs font-black hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-50"
                    >
                      {createComment.isPending ? <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      {replyTo ? "Post Reply" : "Post Comment"}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-[oklch(0.30_0_0)] mt-1.5">Comments are reviewed before publishing. Be respectful and on-topic.</p>
              </div>
            </div>
          </form>
        )
      ) : (
        <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-6 mb-8 flex items-center gap-5">
          <div className="w-12 h-12 bg-[oklch(0.85_0.18_95)] flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6 text-black" />
          </div>
          <div className="flex-1">
            <p className="font-black text-white mb-0.5">Sign in to join the conversation</p>
            <p className="text-xs text-[oklch(0.55_0_0)]">Create a free account to comment, reply, upvote, and earn pilot rank badges.</p>
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
      ) : topLevel.length > 0 ? (
        <div className="space-y-6">
          {topLevel.map((comment: any) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={repliesMap.get(comment.id) ?? []}
              sessionId={sessionId}
              isAuthenticated={isAuthenticated}
              isAdmin={user?.role === 'admin'}
              onReply={(id, name) => { setReplyTo({ id, name }); setSubmitted(false); window.scrollTo({ top: document.querySelector("textarea")?.getBoundingClientRect().top! + window.scrollY - 100, behavior: "smooth" }); }}
              upvotedIds={upvotedIds}
              onUpvote={handleUpvote}
              onPin={(id, pin) => pinMutation.mutate({ id, articleId, pin })}
            />
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
