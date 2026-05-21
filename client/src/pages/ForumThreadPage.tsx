import { useParams, Link } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ArrowLeft, MessageSquare, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function ForumThreadPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [replyContent, setReplyContent] = useState("");
  const { data: thread } = trpc.forum.thread.useQuery({ id: Number(id) }, { enabled: !!id });
  const { data: replies, refetch } = trpc.forum.replies.useQuery({ threadId: Number(id) }, { enabled: !!id });
  const createReply = trpc.forum.createReply.useMutation({
    onSuccess: () => { setReplyContent(""); refetch(); toast.success("Reply posted!"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6 max-w-4xl">
        <Link href="/forum" className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0_0)] hover:text-white mb-6 transition-colors"><ArrowLeft className="w-4 h-4" /> Forum</Link>
        {thread && (
          <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-6 mb-6">
            <h1 className="text-2xl font-black text-white mb-3">{thread.title}</h1>
            <div className="flex items-center gap-3 mb-4 text-xs text-[oklch(0.45_0_0)]">
              <span>By <strong className="text-white">{thread.userName ?? "Anonymous"}</strong></span>
              <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{thread.views}</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{thread.replyCount} replies</span>
            </div>
            <p className="text-[oklch(0.75_0_0)] leading-relaxed">{thread.content}</p>
          </div>
        )}
        {/* Replies */}
        <div className="space-y-3 mb-6">
          {replies?.map((reply, i) => (
            <div key={reply.id} className="bg-[oklch(0.13_0_0)] border border-[oklch(0.20_0_0)] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center text-black font-black text-xs">{reply.userName?.charAt(0)?.toUpperCase() ?? "?"}</div>
                <span className="text-sm font-bold text-white">{reply.userName ?? "Anonymous"}</span>
                <span className="text-xs text-[oklch(0.40_0_0)]">{formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
                <span className="text-xs text-[oklch(0.35_0_0)] ml-auto">#{i + 1}</span>
              </div>
              <p className="text-sm text-[oklch(0.70_0_0)] leading-relaxed">{reply.content}</p>
            </div>
          ))}
        </div>
        {/* Reply form */}
        {isAuthenticated ? (
          <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-5">
            <h3 className="font-black text-white mb-3">Post a Reply</h3>
            <textarea value={replyContent} onChange={e=>setReplyContent(e.target.value)} placeholder="Share your thoughts..." rows={4} className="w-full bg-[oklch(0.20_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-sm text-white placeholder-[oklch(0.45_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] mb-3 resize-none" />
            <button onClick={() => createReply.mutate({ threadId: Number(id), content: replyContent })} disabled={createReply.isPending || !replyContent.trim()} className="bg-[oklch(0.85_0.18_95)] text-black px-5 py-2 rounded font-bold text-sm disabled:opacity-50 hover:bg-[oklch(0.78_0.18_95)] transition-colors">Post Reply</button>
          </div>
        ) : (
          <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-5 text-center">
            <p className="text-[oklch(0.55_0_0)] mb-3">Sign in to join the discussion</p>
            <button onClick={() => window.location.href = getLoginUrl()} className="bg-[oklch(0.85_0.18_95)] text-black px-5 py-2 rounded font-bold text-sm hover:bg-[oklch(0.78_0.18_95)] transition-colors">Sign In to Reply</button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
