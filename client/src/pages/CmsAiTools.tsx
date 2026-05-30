/**
 * Flight Drama CMS — AI Content Tools
 * =====================================
 * Two AI-powered article creation tools:
 * 1. AI Article Generator — keywords, URLs, topic → full article
 * 2. Video/Audio to Article — transcribe video → full article
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";

// ── Shared types ───────────────────────────────────────────────────────────
interface GeneratedArticle {
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  suggestedTags: string[];
  transcript?: string;
}

// ── Tab switcher ───────────────────────────────────────────────────────────
type Tab = "generator" | "video";

export default function CmsAiTools({ onUseArticle }: { onUseArticle?: (article: GeneratedArticle) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("generator");

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-2xl font-black text-white">✨ AI Content Tools</div>
        <span className="text-xs bg-[#F5C518]/15 text-[#F5C518] px-2 py-0.5 rounded font-bold uppercase tracking-wide">Powered by AI</span>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6 bg-[#111] border border-[#222] rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("generator")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === "generator" ? "bg-[#F5C518] text-black" : "text-gray-500 hover:text-white"}`}
        >
          ✍️ Article Generator
        </button>
        <button
          onClick={() => setActiveTab("video")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === "video" ? "bg-[#F5C518] text-black" : "text-gray-500 hover:text-white"}`}
        >
          🎬 Video to Article
        </button>
      </div>

      {activeTab === "generator" && <ArticleGenerator onUseArticle={onUseArticle} />}
      {activeTab === "video" && <VideoToArticle onUseArticle={onUseArticle} />}
    </div>
  );
}

// ── Article Generator ──────────────────────────────────────────────────────
function ArticleGenerator({ onUseArticle }: { onUseArticle?: (article: GeneratedArticle) => void }) {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [urls, setUrls] = useState("");
  const [tone, setTone] = useState<"news" | "analysis" | "opinion" | "feature">("news");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [result, setResult] = useState<GeneratedArticle | null>(null);
  const [editedContent, setEditedContent] = useState("");

  const generateMutation = trpc.aiTools.generateArticle.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setEditedContent(data.content);
      toast.success("Article generated successfully ✈");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleGenerate = () => {
    if (!topic.trim()) { toast.error("Please enter a topic"); return; }
    const urlList = urls.split("\n").map(u => u.trim()).filter(u => u.startsWith("http"));
    generateMutation.mutate({ topic, keywords: keywords || undefined, urls: urlList.length > 0 ? urlList : undefined, tone, length });
  };

  return (
    <div className="space-y-6">
      {/* Input form */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-4">Generate an Article from Topic & Sources</div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1">Topic / Headline Idea *</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              className="w-full bg-[#0d0d0d] border border-[#333] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-[#F5C518] resize-none"
              placeholder="e.g. Boeing 737 MAX 7 receives FAA certification after years of delays — what it means for Southwest Airlines and passengers"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1">Keywords to Include</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#333] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-[#F5C518]"
                placeholder="Boeing 737, FAA, Southwest Airlines"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full bg-[#0d0d0d] border border-[#333] text-white px-2 py-2 rounded text-sm focus:outline-none focus:border-[#F5C518]"
                >
                  <option value="news">📰 News</option>
                  <option value="analysis">🔍 Analysis</option>
                  <option value="opinion">💬 Opinion</option>
                  <option value="feature">✨ Feature</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1">Length</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as any)}
                  className="w-full bg-[#0d0d0d] border border-[#333] text-white px-2 py-2 rounded text-sm focus:outline-none focus:border-[#F5C518]"
                >
                  <option value="short">Short (400-600w)</option>
                  <option value="medium">Medium (700-1000w)</option>
                  <option value="long">Long (1200-1800w)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1">
              Source URLs <span className="text-gray-600 normal-case font-normal">(optional — paste up to 3 URLs, one per line)</span>
            </label>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={3}
              className="w-full bg-[#0d0d0d] border border-[#333] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-[#F5C518] resize-none font-mono"
              placeholder={"https://www.bbc.co.uk/news/aviation-story\nhttps://www.avherald.com/...\nhttps://simpleflying.com/..."}
            />
            <p className="text-xs text-gray-600 mt-1">The AI will read these pages and use them as source material for the article.</p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !topic.trim()}
            className="w-full bg-[#F5C518] text-black font-black py-3 rounded-lg hover:bg-[#e0b015] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generateMutation.isPending ? (
              <>
                <span className="animate-spin">✈</span>
                Generating article... (this takes 15-30 seconds)
              </>
            ) : (
              "✨ Generate Article"
            )}
          </button>
        </div>
      </div>

      {/* Generated result */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-white">Generated Article — Review and Edit Before Publishing</div>
            <button
              onClick={() => onUseArticle?.({ ...result, content: editedContent })}
              className="bg-[#F5C518] text-black font-black px-4 py-2 rounded text-sm hover:bg-[#e0b015] transition-colors"
            >
              Use This Article →
            </button>
          </div>

          {/* Title */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2">Generated Title</div>
            <div className="text-xl font-black text-white">{result.title}</div>
          </div>

          {/* Excerpt */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2">Excerpt</div>
            <div className="text-gray-300 text-sm">{result.excerpt}</div>
          </div>

          {/* SEO */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-3">SEO Preview</div>
            <div className="bg-white rounded p-3">
              <div className="text-[13px] text-blue-700 font-medium truncate">{result.metaTitle}</div>
              <div className="text-[11px] text-green-700">flightdrama.com/article/...</div>
              <div className="text-[12px] text-gray-600 mt-0.5">{result.metaDescription}</div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {result.suggestedTags.map(tag => (
                <span key={tag} className="text-xs bg-[#F5C518]/15 text-[#F5C518] px-2 py-0.5 rounded">#{tag}</span>
              ))}
            </div>
          </div>

          {/* Editable content */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-3">Article Content — Edit Before Publishing</div>
            <RichTextEditor
              value={editedContent}
              onChange={setEditedContent}
              placeholder="Generated content will appear here..."
              minHeight={400}
            />
          </div>

          <button
            onClick={() => onUseArticle?.({ ...result, content: editedContent })}
            className="w-full bg-[#F5C518] text-black font-black py-3 rounded-lg hover:bg-[#e0b015] transition-colors"
          >
            Use This Article in Editor →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Video to Article ───────────────────────────────────────────────────────
function VideoToArticle({ onUseArticle }: { onUseArticle?: (article: GeneratedArticle) => void }) {
  const [videoUrl, setVideoUrl] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState<GeneratedArticle | null>(null);
  const [editedContent, setEditedContent] = useState("");

  const videoMutation = trpc.aiTools.videoToArticle.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setEditedContent(data.content);
      toast.success("Video transcribed and article generated ✈");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleGenerate = () => {
    if (!videoUrl.trim()) { toast.error("Please enter a video URL"); return; }
    videoMutation.mutate({ videoUrl, additionalContext: context || undefined });
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111] border border-[#222] rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-2">Convert Video or Audio to Article</div>
        <p className="text-xs text-gray-500 mb-4">Paste a direct link to an audio or video file (MP3, MP4, WAV, WebM). The AI will transcribe it and write a full article from the content.</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1">Video / Audio URL *</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#333] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-[#F5C518] font-mono"
              placeholder="https://example.com/atc-audio.mp3"
            />
            <div className="mt-2 p-3 bg-[#0d0d0d] border border-[#222] rounded-lg">
              <div className="text-xs text-gray-500 font-bold mb-1">Supported formats:</div>
              <div className="text-xs text-gray-600">MP3, MP4, WAV, WebM, OGG, M4A — Direct file links only (not YouTube/Instagram pages)</div>
              <div className="text-xs text-gray-600 mt-1">For YouTube videos, use the Article Generator above with the YouTube URL as a source.</div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wide block mb-1">
              Additional Context <span className="text-gray-600 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={2}
              className="w-full bg-[#0d0d0d] border border-[#333] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-[#F5C518] resize-none"
              placeholder="e.g. This is ATC audio from the Dublin emergency landing on 2 Feb 2026. The aircraft is a Delta 767."
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={videoMutation.isPending || !videoUrl.trim()}
            className="w-full bg-[#F5C518] text-black font-black py-3 rounded-lg hover:bg-[#e0b015] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {videoMutation.isPending ? (
              <>
                <span className="animate-spin">✈</span>
                Transcribing and generating... (30-60 seconds)
              </>
            ) : (
              "🎬 Transcribe & Generate Article"
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-white">Generated Article from Video</div>
            <button
              onClick={() => onUseArticle?.({ ...result, content: editedContent })}
              className="bg-[#F5C518] text-black font-black px-4 py-2 rounded text-sm hover:bg-[#e0b015] transition-colors"
            >
              Use This Article →
            </button>
          </div>

          {result.transcript && (
            <div className="bg-[#111] border border-[#222] rounded-xl p-4">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2">Transcript Preview</div>
              <div className="text-gray-400 text-xs font-mono leading-relaxed">{result.transcript}</div>
            </div>
          )}

          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2">Generated Title</div>
            <div className="text-xl font-black text-white">{result.title}</div>
          </div>

          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-3">SEO Preview</div>
            <div className="bg-white rounded p-3">
              <div className="text-[13px] text-blue-700 font-medium truncate">{result.metaTitle}</div>
              <div className="text-[11px] text-green-700">flightdrama.com/article/...</div>
              <div className="text-[12px] text-gray-600 mt-0.5">{result.metaDescription}</div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {result.suggestedTags.map(tag => (
                <span key={tag} className="text-xs bg-[#F5C518]/15 text-[#F5C518] px-2 py-0.5 rounded">#{tag}</span>
              ))}
            </div>
          </div>

          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-3">Article Content — Edit Before Publishing</div>
            <RichTextEditor
              value={editedContent}
              onChange={setEditedContent}
              placeholder="Generated content will appear here..."
              minHeight={400}
            />
          </div>

          <button
            onClick={() => onUseArticle?.({ ...result, content: editedContent })}
            className="w-full bg-[#F5C518] text-black font-black py-3 rounded-lg hover:bg-[#e0b015] transition-colors"
          >
            Use This Article in Editor →
          </button>
        </div>
      )}
    </div>
  );
}
