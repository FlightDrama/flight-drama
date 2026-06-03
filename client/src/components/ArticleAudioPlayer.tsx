import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Play, Pause, RotateCcw, Volume2, Loader2 } from "lucide-react";

interface Props {
  articleId: number;
  articleTitle: string;
  cachedAudioUrl?: string | null;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export default function ArticleAudioPlayer({ articleId, articleTitle, cachedAudioUrl }: Props) {
  const [audioUrl, setAudioUrl] = useState<string | null>(cachedAudioUrl ?? null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(1); // default 1x
  const [hasStarted, setHasStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateAudio = trpc.articles.generateAudio.useMutation({
    onSuccess: (data) => {
      setAudioUrl(data.audioUrl);
      setIsLoading(false);
    },
    onError: (err) => {
      setIsLoading(false);
      console.error("Audio generation failed:", err.message);
    },
  });

  // Set up audio element
  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.playbackRate = SPEEDS[speedIdx];

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    });
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("ended", () => { setIsPlaying(false); setProgress(0); setCurrentTime(0); });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl]);

  // Sync speed changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[speedIdx];
  }, [speedIdx]);

  const handlePlayPause = useCallback(async () => {
    if (!audioUrl && !isLoading) {
      // First play — generate audio
      setIsLoading(true);
      setHasStarted(true);
      generateAudio.mutate({ articleId });
      return;
    }
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setHasStarted(true);
      } catch {}
    }
  }, [audioUrl, isLoading, isPlaying, articleId, generateAudio]);

  // Auto-play once audio URL is ready after generation
  useEffect(() => {
    if (audioUrl && hasStarted && !isPlaying && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [audioUrl]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setProgress(0);
  };

  const cycleSpeed = () => setSpeedIdx((i) => (i + 1) % SPEEDS.length);

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="rounded-xl border overflow-hidden mb-6"
      style={{ backgroundColor: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-b"
        style={{ backgroundColor: "oklch(0.18 0 0)", borderColor: "oklch(0.22 0 0)" }}
      >
        <Volume2 className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.85 0.18 95)" }} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "oklch(0.85 0.18 95)" }}>
            Listen to this article
          </p>
          <p className="text-[10px] text-[oklch(0.45_0_0)] truncate">
            Read by George · ElevenLabs AI
            {!audioUrl && !hasStarted && " · Press play to generate"}
          </p>
        </div>
        {duration > 0 && (
          <span className="text-[10px] text-[oklch(0.40_0_0)] shrink-0">
            {formatTime(duration)}
          </span>
        )}
      </div>

      {/* Loading banner */}
      {isLoading && (
        <div
          className="px-4 py-2 flex items-center gap-2 border-b"
          style={{ backgroundColor: "oklch(0.85 0.18 95 / 0.08)", borderColor: "oklch(0.85 0.18 95 / 0.20)" }}
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: "oklch(0.85 0.18 95)" }} />
          <div className="flex-1">
            <p className="text-[11px] font-bold" style={{ color: "oklch(0.85 0.18 95)" }}>Generating audio with George…</p>
            <p className="text-[10px] text-[oklch(0.45_0_0)]">This takes about 5–10 seconds. Audio is cached after first generation.</p>
          </div>
          {/* Animated loading bar */}
          <div className="w-16 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "oklch(0.22 0 0)" }}>
            <div
              className="h-full rounded-full"
              style={{
                backgroundColor: "oklch(0.85 0.18 95)",
                animation: "loadingBar 1.5s ease-in-out infinite",
                width: "40%",
              }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Play/Pause button */}
        <button
          onClick={handlePlayPause}
          disabled={isLoading}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95"
          style={{ backgroundColor: isLoading ? "oklch(0.85 0.18 95 / 0.4)" : "oklch(0.85 0.18 95)", color: "black" }}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" fill="black" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" fill="black" />
          )}
        </button>

        {/* Progress bar + time */}
        <div className="flex-1 min-w-0">
          {/* Scrubber */}
          <div
            className="relative h-1.5 rounded-full cursor-pointer mb-1.5 overflow-hidden"
            style={{ backgroundColor: "oklch(0.25 0 0)" }}
            onClick={handleSeek}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: "oklch(0.85 0.18 95)" }}
            />
          </div>
          {/* Time */}
          <div className="flex justify-between">
            <span className="text-[10px] text-[oklch(0.40_0_0)]">{formatTime(currentTime)}</span>
            {isLoading && (
              <span className="text-[10px] text-[oklch(0.50_0_0)] animate-pulse">
                Generating audio with George…
              </span>
            )}
          </div>
        </div>

        {/* Restart */}
        <button
          onClick={handleRestart}
          disabled={!audioUrl}
          className="p-1.5 rounded transition-colors hover:bg-[oklch(0.20_0_0)] disabled:opacity-30"
          style={{ color: "oklch(0.50 0 0)" }}
          title="Restart"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Speed */}
        <button
          onClick={cycleSpeed}
          className="px-2 py-1 rounded text-[10px] font-black transition-colors hover:bg-[oklch(0.20_0_0)]"
          style={{ color: "oklch(0.60 0 0)", minWidth: "2.5rem" }}
          title="Playback speed"
        >
          {SPEEDS[speedIdx]}×
        </button>
      </div>
    </div>
  );
}

// Inject loadingBar animation once
if (typeof document !== 'undefined' && !document.getElementById('audio-player-styles')) {
  const style = document.createElement('style');
  style.id = 'audio-player-styles';
  style.textContent = `@keyframes loadingBar { 0% { transform: translateX(-100%); } 50% { transform: translateX(150%); } 100% { transform: translateX(-100%); } }`;
  document.head.appendChild(style);
}
