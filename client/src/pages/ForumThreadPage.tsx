import { useParams, Link } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PilotBadge from "@/components/PilotBadge";
import RunwayDivider from "@/components/RunwayDivider";
import ShareButtons from "@/components/ShareButtons";
import { ArrowLeft, MessageSquare, Eye, Radio } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function ForumThreadPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [replyContent, setReplyContent] = useState("");
  const { data: thread } = trpc.forum.thread.useQuery({ id: Number(id) }, { enabled: !!id });
  const { data: replies, refetch } = trpc.forum.replies.useQuery({ threadId: Number(id) }, { enabled: !!id });
  const createReply = trpc.forum.createReply.useMutation({
    onSuccess: () => { setReplyContent(""); refetch(); toast.success("Transmission received! Reply posted."); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6 max-w-4xl">
        <Link href="/forum" className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0_0)] hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Forum
        </Link>

        {thread && (
          <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg overflow-hidden mb-6">
            {/* Thread header — boarding pass style top bar */}
            <div className="bg-[oklch(0.18_0_0)] px-5 py-2 flex items-center gap-3 border-b border-[oklch(0.22_0_0)]">
              <span className="text-[oklch(0.85_0.18_95)] text-xs font-black uppercase tracking-widest">✈ THREAD</span>
              <span className="text-[oklch(0.35_0_0)] text-xs">|</span>
              <span className="text-[oklch(0.45_0_0)] text-xs font-mono">FD-{String(thread.id).padStart(4, "0")}</span>
              <span className="ml-auto flex items-center gap-3 text-xs text-[oklch(0.40_0_0)]">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{thread.views} views</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{thread.replyCount} replies</span>
              </span>
            </div>
            <div className="p-6">
              <h1 className="text-2xl font-black text-white mb-4 leading-tight">{thread.title}</h1>
              {/* Author row with pilot rank */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[oklch(0.20_0_0)]">
                <div className="w-10 h-10 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center text-black font-black">
                  {thread.userName?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-black text-white">{thread.userName ?? "Anonymous"}</p>
                  <PilotBadge postCount={thread.replyCount + 5} />
                </div>
                <span className="ml-auto text-xs text-[oklch(0.40_0_0)]">
                  {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-[oklch(0.75_0_0)] leading-relaxed text-sm">{thread.content}</p>
              <div className="mt-5 pt-4 border-t border-[oklch(0.22_0_0)]">
                <ShareButtons title={thread.title} compact />
              </div>
            </div>
          </div>
        )}

        {/* Replies section */}
        {replies && replies.length > 0 && (
          <>
            <RunwayDivider label={`${replies.length} Replies`} />
            <div className="space-y-3 mb-6">
              {replies.map((reply, i) => (
                <div key={reply.id} className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-lg overflow-hidden group hover:border-[oklch(0.28_0_0)] transition-colors">
                  {/* Reply header */}
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-[oklch(0.15_0_0)] border-b border-[oklch(0.18_0_0)]">
                    <div className="w-7 h-7 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center text-black font-black text-xs shrink-0">
                      {reply.userName?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-white">{reply.userName ?? "Anonymous"}</span>
                      <span className="mx-2 text-[oklch(0.30_0_0)]">·</span>
                      <PilotBadge postCount={i * 7 + 3} />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-[oklch(0.35_0_0)]">{formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
                      <span className="text-[10px] font-mono text-[oklch(0.28_0_0)] bg-[oklch(0.18_0_0)] px-1.5 py-0.5 rounded">#{i + 1}</span>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm text-[oklch(0.72_0_0)] leading-relaxed">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Reply form */}
        <RunwayDivider label="Post a Reply" />
        {isAuthenticated ? (
          <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg overflow-hidden">
            <div className="bg-[oklch(0.18_0_0)] px-4 py-2 border-b border-[oklch(0.22_0_0)] flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[oklch(0.85_0.18_95)]" />
              <span className="text-xs font-black uppercase tracking-wider text-[oklch(0.65_0_0)]">Open Channel — Transmit</span>
            </div>
            <div className="p-5">
              <textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="Your transmission... (minimum 5 characters)"
                rows={4}
                className="w-full bg-[oklch(0.20_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-sm text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] mb-3 resize-none transition-colors"
              />
              <button
                onClick={() => createReply.mutate({ threadId: Number(id), content: replyContent })}
                disabled={createReply.isPending || !replyContent.trim() || replyContent.trim().length < 5}
                className="bg-[oklch(0.85_0.18_95)] text-black px-5 py-2.5 rounded font-black text-sm disabled:opacity-50 hover:bg-[oklch(0.78_0.18_95)] transition-colors flex items-center gap-2"
              >
                <Radio className="w-4 h-4" />
                {createReply.isPending ? "Transmitting..." : "Transmit Reply ✈"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-6 text-center">
            <p className="text-2xl mb-2">🎧</p>
            <p className="font-black text-white mb-1">Request Clearance to Transmit</p>
            <p className="text-sm text-[oklch(0.50_0_0)] mb-4">Sign in to join the discussion and earn your pilot rank</p>
            <button
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-[oklch(0.85_0.18_95)] text-black px-6 py-2.5 rounded font-black text-sm hover:bg-[oklch(0.78_0.18_95)] transition-colors"
            >
              Sign In to Reply ✈
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
