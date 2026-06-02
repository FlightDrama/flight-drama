import { useParams, Link } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { MessageSquare, Eye, ArrowLeft, Pin, Lock, Plus, Radio } from "lucide-react";
import PilotBadge from "@/components/PilotBadge";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useReputation } from "@/hooks/useReputation";

export default function ForumBoardPage() {
  const { boardSlug } = useParams<{ boardSlug: string }>();
  const { user, isAuthenticated } = useAuth();
  const { awardPoints } = useReputation();
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const { data: boards } = trpc.forum.boards.useQuery();
  const board = boards?.find(b => b.slug === boardSlug);
  const { data: threads, refetch } = trpc.forum.threads.useQuery({ boardId: board?.id ?? 0 }, { enabled: !!board?.id });
  const createThread = trpc.forum.createThread.useMutation({
    onSuccess: (data) => {
      setShowNewThread(false); setNewTitle(""); setNewContent(""); refetch();
      toast.success("Thread created!");
      awardPoints('forum_post', (data as any)?.id, 'forum_thread');
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      <Navigation />
      <main className="container py-6">
        <Link href="/forum" className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0_0)] hover:text-white mb-6 transition-colors"><ArrowLeft className="w-4 h-4" /> Forum</Link>
        <div className="flex items-center justify-between mb-6">
          <div className="accent-bar"><h1 className="text-2xl font-black text-white">{board?.name}</h1><p className="text-[oklch(0.55_0_0)] text-sm mt-0.5">{board?.description}</p></div>
          {isAuthenticated ? (
            <button onClick={() => setShowNewThread(true)} className="flex items-center gap-2 bg-[oklch(0.85_0.18_95)] text-black px-4 py-2 rounded font-bold text-sm hover:bg-[oklch(0.78_0.18_95)] transition-colors">
              <Plus className="w-4 h-4" /> New Thread
            </button>
          ) : (
            <button onClick={() => window.location.href = getLoginUrl()} className="flex items-center gap-2 bg-[oklch(0.18_0_0)] text-white px-4 py-2 rounded font-bold text-sm hover:bg-[oklch(0.22_0_0)] transition-colors">
              Sign in to Post
            </button>
          )}
        </div>
        {showNewThread && (
          <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.85_0.18_95)]/30 rounded-lg p-5 mb-6">
            <h3 className="font-black text-white mb-3">New Thread</h3>
            <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Thread title..." className="w-full bg-[oklch(0.20_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-sm text-white placeholder-[oklch(0.45_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] mb-3" />
            <textarea value={newContent} onChange={e=>setNewContent(e.target.value)} placeholder="What's on your mind?" rows={4} className="w-full bg-[oklch(0.20_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-sm text-white placeholder-[oklch(0.45_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] mb-3 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => board && createThread.mutate({ boardId: board.id, title: newTitle, content: newContent })} disabled={createThread.isPending || !newTitle.trim() || !newContent.trim()} className="bg-[oklch(0.85_0.18_95)] text-black px-4 py-2 rounded font-bold text-sm disabled:opacity-50">Post Thread</button>
              <button onClick={() => setShowNewThread(false)} className="bg-[oklch(0.20_0_0)] text-white px-4 py-2 rounded font-bold text-sm hover:bg-[oklch(0.25_0_0)]">Cancel</button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {threads?.map(thread => (
            <Link key={thread.id} href={`/forum/thread/${thread.id}`} className="block bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-lg p-4 hover:border-[oklch(0.85_0.18_95)]/30 transition-colors group">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[oklch(0.85_0.18_95)] flex items-center justify-center text-black font-black text-sm shrink-0">{thread.userName?.charAt(0)?.toUpperCase() ?? "?"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {thread.isPinned && <Pin className="w-3 h-3 text-[oklch(0.85_0.18_95)]" />}
                    {thread.isLocked && <Lock className="w-3 h-3 text-[oklch(0.55_0_0)]" />}
                    <h3 className="font-bold text-white group-hover:text-[oklch(0.85_0.18_95)] transition-colors line-clamp-1">{thread.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-[oklch(0.50_0_0)]">{thread.userName ?? "Anonymous"}</span>
                    <PilotBadge postCount={thread.replyCount * 3 + 2} />
                    <span className="text-xs text-[oklch(0.35_0_0)]">· {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-xs text-[oklch(0.45_0_0)]">
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{thread.replyCount}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{thread.views}</span>
                </div>
              </div>
            </Link>
          ))}
          {!threads?.length && (
            <div className="text-center py-12 text-[oklch(0.45_0_0)]">
              <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No transmissions yet — request clearance to post!</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
