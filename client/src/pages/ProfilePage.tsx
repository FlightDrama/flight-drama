import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RunwayDivider from "@/components/RunwayDivider";
import { getPilotRank, PILOT_RANKS, getStripeDisplay } from "@/lib/pilotRank";
import { formatDistanceToNow, format } from "date-fns";
import { Crown, MessageSquare, Eye, Calendar, ArrowRight, Shield, Camera, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import AvatarCropModal from "@/components/AvatarCropModal";

function RankProgressBar({ postCount }: { postCount: number }) {
  const currentRank = getPilotRank(postCount);
  const currentIndex = PILOT_RANKS.findIndex((r) => r.title === currentRank.title);
  const nextRank = PILOT_RANKS[currentIndex + 1];

  if (!nextRank) {
    // Max rank
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className={`font-black ${currentRank.colour}`}>{currentRank.icon} {currentRank.title}</span>
          <span className="text-[oklch(0.85_0.18_95)] font-black">MAX RANK ✈</span>
        </div>
        <div className="h-2 rounded-full bg-[oklch(0.85_0.18_95)]" />
        <p className="text-[10px] text-[oklch(0.45_0_0)]">{postCount} posts — Aviation Legend status achieved</p>
      </div>
    );
  }

  const postsInCurrentTier = postCount - currentRank.minPosts;
  const postsNeededForTier = nextRank.minPosts - currentRank.minPosts;
  const progress = Math.min((postsInCurrentTier / postsNeededForTier) * 100, 100);
  const postsToNext = nextRank.minPosts - postCount;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-black ${currentRank.colour}`}>{currentRank.icon} {currentRank.title}</span>
        <span className="text-[oklch(0.50_0_0)]">{nextRank.icon} {nextRank.title}</span>
      </div>
      {/* Progress bar */}
      <div className="h-2.5 rounded-full bg-[oklch(0.20_0_0)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[oklch(0.85_0.18_95)] to-[oklch(0.75_0.18_95)] transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-[oklch(0.45_0_0)]">
        <span>{postsInCurrentTier} / {postsNeededForTier} posts in this tier</span>
        <span className="text-[oklch(0.85_0.18_95)] font-bold">{postsToNext} more to {nextRank.title}</span>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data, isLoading } = trpc.profile.me.useQuery(undefined, { enabled: isAuthenticated });

  // Not logged in
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[oklch(0.10_0_0)]">
        <Navigation />
        <main className="container py-16 text-center max-w-md mx-auto">
          <p className="text-5xl mb-4">👨‍✈️</p>
          <h1 className="text-2xl font-black text-white mb-2">Pilot Profile</h1>
          <p className="text-[oklch(0.55_0_0)] mb-6">Sign in to view your rank, post count, and forum activity</p>
          <button
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-[oklch(0.85_0.18_95)] text-black px-6 py-3 rounded-lg font-black hover:bg-[oklch(0.78_0.18_95)] transition-colors"
          >
            Sign In to View Profile ✈
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const postCount = data?.postCount ?? 0;
  const rank = getPilotRank(postCount);
  const isPro = data?.membership?.status === "active";
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: File selected → show crop modal
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  // Step 2: Crop confirmed → upload the cropped blob
  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg');
      const res = await fetch('/api/avatar/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setAvatarUrl(data.avatarUrl);
        setCropImageSrc(null);
        toast.success('Profile photo updated! ✈');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const currentAvatar = avatarUrl || (user as any)?.avatar || null;

  // Profile edit state
  const { data: myProfile, refetch: refetchProfile } = trpc.customAuth.myProfile.useQuery(undefined, { enabled: isAuthenticated });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  const updateProfile = trpc.customAuth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('Profile updated! ✈');
      setEditingProfile(false);
      refetchProfile();
      setTimeout(() => window.location.reload(), 800);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleEditProfile = () => {
    setEditName(myProfile?.name || user?.name || '');
    setEditBio(myProfile?.bio || '');
    setEditingProfile(true);
  };

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)]">
      {/* Crop modal */}
      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          uploading={uploadingAvatar}
          onCancel={() => { setCropImageSrc(null); }}
          onCropComplete={handleCropComplete}
        />
      )}
      <Navigation />
      <main className="container py-6 max-w-4xl">

        {/* Profile header — boarding pass style */}
        <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden mb-6">
          {/* Top bar */}
          <div className="bg-[oklch(0.85_0.18_95)] px-5 py-2 flex items-center justify-between">
            <span className="text-black text-xs font-black uppercase tracking-widest">✈ FLIGHT DRAMA · CREW CARD</span>
            <span className="text-black text-xs font-mono">{user?.id ? `FD-${String(user.id).padStart(5, "0")}` : ""}</span>
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar with upload */}
              <div className="relative shrink-0">
                <div
                  className="w-20 h-20 rounded-full overflow-hidden bg-[oklch(0.85_0.18_95)] flex items-center justify-center text-black font-black text-3xl shadow-lg cursor-pointer group relative"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to change profile photo"
                >
                  {currentAvatar ? (
                    <img src={currentAvatar} alt={user?.name ?? 'Avatar'} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() ?? "?"
                  )}
                  {/* Hover/upload overlay */}
                  <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity ${
                    uploadingAvatar ? 'bg-black/70 opacity-100' : 'bg-black/50 opacity-0 group-hover:opacity-100'
                  }`}>
                    {uploadingAvatar ? (
                      <>
                        <Loader2 className="w-6 h-6 text-[oklch(0.85_0.18_95)] animate-spin mb-1" />
                        <span className="text-[8px] text-white font-bold">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-white mb-0.5" />
                        <span className="text-[8px] text-white font-bold">Change</span>
                      </>
                    )}
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileSelected} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="mt-1.5 text-[10px] text-[oklch(0.45_0_0)] hover:text-[oklch(0.85_0.18_95)] transition-colors font-bold flex items-center gap-1 disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</>
                  ) : (
                    <><Camera className="w-3 h-3" /> Change photo</>
                  )}
                </button>
                {isPro && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[oklch(0.85_0.18_95)] border-2 border-[oklch(0.15_0_0)] flex items-center justify-center">
                    <Crown className="w-3.5 h-3.5 text-black" />
                  </div>
                )}
              </div>

              {/* Name + rank */}
              <div className="flex-1">
                {editingProfile ? (
                  <div className="space-y-3 mb-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[oklch(0.50_0_0)] mb-1">Display Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={100}
                        className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[oklch(0.50_0_0)] mb-1">Short Bio <span className="normal-case text-[oklch(0.40_0_0)] font-normal">({editBio.length}/500)</span></label>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        maxLength={500}
                        rows={2}
                        placeholder="Tell the community about yourself..."
                        className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors resize-none placeholder-[oklch(0.40_0_0)]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateProfile.mutate({ name: editName, bio: editBio })}
                        disabled={!editName.trim() || updateProfile.isPending}
                        className="flex items-center gap-1.5 bg-[oklch(0.85_0.18_95)] text-black font-black text-xs px-4 py-2 hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-50"
                      >
                        {updateProfile.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Save Changes
                      </button>
                      <button onClick={() => setEditingProfile(false)} className="text-xs text-[oklch(0.50_0_0)] hover:text-white px-3 py-2 transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h1 className="text-2xl font-black text-white">{myProfile?.name || user?.name || 'Pilot'}</h1>
                      {isPro && (
                        <span className="flex items-center gap-1 bg-[oklch(0.85_0.18_95)] text-black text-[10px] font-black px-2 py-0.5 rounded">
                          <Crown className="w-2.5 h-2.5" /> PRO
                        </span>
                      )}
                      <button
                        onClick={handleEditProfile}
                        className="text-[10px] text-[oklch(0.45_0_0)] hover:text-[oklch(0.85_0.18_95)] transition-colors border border-[oklch(0.28_0_0)] hover:border-[oklch(0.85_0.18_95)]/40 px-2 py-0.5 font-bold"
                      >
                        ✏ Edit Profile
                      </button>
                    </div>
                    {myProfile?.bio && (
                      <p className="text-sm text-[oklch(0.60_0_0)] mb-2 leading-relaxed italic">"{myProfile.bio}"</p>
                    )}
                  </>
                )}
                {!editingProfile && (<>{/* Rank badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{rank.icon}</span>
                  <div>
                    <p className={`font-black text-base ${rank.colour}`}>{rank.title}</p>
                    {rank.stripes > 0 && (
                      <p className="text-[oklch(0.85_0.18_95)] text-xs tracking-widest">{getStripeDisplay(rank.stripes)}</p>
                    )}
                  </div>
                </div>
                {/* Stats row */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-[oklch(0.60_0_0)]">
                    <MessageSquare className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
                    <span className="font-black text-white">{postCount}</span>
                    <span>posts</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[oklch(0.60_0_0)]">
                    <Calendar className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
                    <span>Joined {data?.profile?.createdAt ? format(new Date(data.profile.createdAt), "MMM yyyy") : "—"}</span>
                  </div>
                  {user?.email && (
                    <div className="flex items-center gap-1.5 text-[oklch(0.60_0_0)]">
                      <Shield className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
                      <span className="truncate max-w-[180px]">{user.email}</span>
                    </div>
                  )}
                </div>
                </>
                )}
              </div>
            </div>

            {/* Rank progress */}
            <div className="mt-5 pt-5 border-t border-[oklch(0.22_0_0)]">
              <p className="text-xs font-black uppercase tracking-widest text-[oklch(0.45_0_0)] mb-3">Rank Progress</p>
              {isLoading ? (
                <div className="h-2.5 rounded-full bg-[oklch(0.20_0_0)] animate-pulse" />
              ) : (
                <RankProgressBar postCount={postCount} />
              )}
            </div>
          </div>
        </div>

        {/* All ranks ladder */}
        <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden mb-6">
          <div className="bg-[oklch(0.18_0_0)] px-5 py-3 border-b border-[oklch(0.22_0_0)]">
            <h2 className="font-black text-white text-sm uppercase tracking-wide">✈ Rank Ladder</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9">
            {PILOT_RANKS.map((r, i) => {
              const isCurrentRank = r.title === rank.title;
              const isAchieved = postCount >= r.minPosts;
              return (
                <div
                  key={r.title}
                  className={`p-3 text-center border-r border-b border-[oklch(0.18_0_0)] last:border-r-0 transition-colors ${
                    isCurrentRank
                      ? "bg-[oklch(0.85_0.18_95)]/10 border-[oklch(0.85_0.18_95)]/20"
                      : ""
                  }`}
                >
                  <div className={`text-xl mb-1 ${!isAchieved ? "opacity-30 grayscale" : ""}`}>{r.icon}</div>
                  <p className={`text-[9px] font-black leading-tight ${isCurrentRank ? r.colour : isAchieved ? "text-[oklch(0.65_0_0)]" : "text-[oklch(0.30_0_0)]"}`}>
                    {r.title}
                  </p>
                  <p className={`text-[8px] mt-0.5 ${isAchieved ? "text-[oklch(0.45_0_0)]" : "text-[oklch(0.25_0_0)]"}`}>
                    {r.minPosts}+
                  </p>
                  {isCurrentRank && (
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[oklch(0.85_0.18_95)] mx-auto" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent threads */}
          <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden">
            <div className="bg-[oklch(0.18_0_0)] px-4 py-3 border-b border-[oklch(0.22_0_0)] flex items-center justify-between">
              <h2 className="font-black text-white text-sm uppercase tracking-wide">My Threads</h2>
              <Link href="/forum" className="text-[10px] text-[oklch(0.85_0.18_95)] hover:underline flex items-center gap-1">
                View Forum <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-[oklch(0.18_0_0)]">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse">
                    <div className="h-3 bg-[oklch(0.20_0_0)] rounded w-3/4 mb-2" />
                    <div className="h-2 bg-[oklch(0.18_0_0)] rounded w-1/2" />
                  </div>
                ))
              ) : data?.threads && data.threads.length > 0 ? (
                data.threads.map((t) => (
                  <Link key={t.id} href={`/forum/thread/${t.id}`} className="block p-4 hover:bg-[oklch(0.18_0_0)] transition-colors">
                    <p className="text-sm font-bold text-white line-clamp-1 mb-1">{t.title}</p>
                    <div className="flex items-center gap-3 text-[10px] text-[oklch(0.45_0_0)]">
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{t.replyCount}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{t.views}</span>
                      <span>{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-6 text-center text-[oklch(0.45_0_0)]">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No threads yet</p>
                  <Link href="/forum" className="text-xs text-[oklch(0.85_0.18_95)] hover:underline mt-1 block">Start a discussion →</Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent replies */}
          <div className="bg-[oklch(0.15_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden">
            <div className="bg-[oklch(0.18_0_0)] px-4 py-3 border-b border-[oklch(0.22_0_0)]">
              <h2 className="font-black text-white text-sm uppercase tracking-wide">Recent Replies</h2>
            </div>
            <div className="divide-y divide-[oklch(0.18_0_0)]">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse">
                    <div className="h-3 bg-[oklch(0.20_0_0)] rounded w-3/4 mb-2" />
                    <div className="h-2 bg-[oklch(0.18_0_0)] rounded w-1/2" />
                  </div>
                ))
              ) : data?.replies && data.replies.length > 0 ? (
                data.replies.map((r) => (
                  <Link key={r.id} href={`/forum/thread/${r.threadId}`} className="block p-4 hover:bg-[oklch(0.18_0_0)] transition-colors">
                    <p className="text-[10px] text-[oklch(0.85_0.18_95)] font-bold mb-0.5 line-clamp-1">↩ {r.threadTitle ?? "Thread"}</p>
                    <p className="text-sm text-[oklch(0.65_0_0)] line-clamp-2">{r.content}</p>
                    <p className="text-[10px] text-[oklch(0.40_0_0)] mt-1">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</p>
                  </Link>
                ))
              ) : (
                <div className="p-6 text-center text-[oklch(0.45_0_0)]">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No replies yet</p>
                  <Link href="/forum" className="text-xs text-[oklch(0.85_0.18_95)] hover:underline mt-1 block">Join a discussion →</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pro membership CTA if not Pro */}
        {!isPro && !isLoading && (
          <>
            <RunwayDivider />
            <div className="bg-gradient-to-br from-[oklch(0.85_0.18_95)] to-[oklch(0.75_0.18_95)] rounded-xl p-6 text-black">
              <div className="flex items-start gap-4">
                <Crown className="w-8 h-8 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-black text-xl mb-1">Upgrade to Flight Drama Pro</h3>
                  <p className="opacity-80 text-sm mb-4">Ad-free reading, exclusive Pro articles, VIP forum badge, and access to the Flight Lookup tool.</p>
                  <Link href="/pro" className="inline-block bg-black text-[oklch(0.85_0.18_95)] px-5 py-2.5 rounded-lg font-black text-sm hover:bg-[oklch(0.10_0_0)] transition-colors">
                    ✈ Get Flight Drama Pro
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
