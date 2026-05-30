/**
 * Flight Drama CMS — Rich Text Editor
 * =====================================
 * Full-featured TipTap editor with:
 * - Full formatting toolbar (headings, bold, italic, underline, strike, highlight)
 * - Text alignment (left, center, right, justify)
 * - Lists (ordered, unordered)
 * - Blockquotes and code blocks
 * - Links with URL input
 * - Image upload (click or drag-and-drop)
 * - Horizontal rule
 * - Undo/Redo
 * - Character count
 */

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";
import Youtube from "@tiptap/extension-youtube";
import { useCallback, useRef, useState, useEffect } from "react";
import { toast } from "sonner";

// ── Toolbar Button ─────────────────────────────────────────────────────────
function ToolBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-colors ${
        active
          ? "bg-[#F5C518] text-black"
          : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
      } ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}

function ToolSep() {
  return <div className="w-px h-5 bg-[#333] mx-0.5" />;
}

// ── Main Editor ────────────────────────────────────────────────────────────
interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing your article...",
  minHeight = 400,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmbedInput, setShowEmbedInput] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        codeBlock: false,
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: "cms-image" },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "cms-link", target: "_blank", rel: "noopener noreferrer" },
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Highlight.configure({ multicolor: false }),
      Typography,
      CharacterCount,
      Youtube.configure({ width: 840, height: 472, HTMLAttributes: { class: 'cms-youtube' } }),
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: "cms-editor-content focus:outline-none",
        style: `min-height: ${minHeight}px; padding: 16px;`,
      },
    },
  });

  // Sync external value changes (e.g. when loading an existing article)
  useEffect(() => {
    if (editor && value !== editor.getHTML() && value !== "") {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // ── Image Upload ─────────────────────────────────────────────────────────
  const uploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("fd_cms_token");
      const res = await fetch("/api/cms/upload-image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      editor?.chain().focus().setImage({ src: data.url, alt: file.name }).run();
      toast.success("Image uploaded ✈");
    } catch (e: any) {
      toast.error("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  }, [editor]);

  // ── Drag and Drop ─────────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    files.forEach(uploadImage);
  }, [uploadImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  // ── Paste images ──────────────────────────────────────────────────────────
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith("image/"));
    if (imageItems.length > 0) {
      e.preventDefault();
      imageItems.forEach(item => {
        const file = item.getAsFile();
        if (file) uploadImage(file);
      });
    }
  }, [uploadImage]);

  // ── Link handling ─────────────────────────────────────────────────────────
  // ── Embed handler (YouTube, Instagram, TikTok, Twitter) ──────────────────
  const handleEmbed = useCallback(() => {
    if (!embedUrl.trim()) return;
    const url = embedUrl.trim();

    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      editor?.commands.setYoutubeVideo({ src: url });
      setShowEmbedInput(false);
      setEmbedUrl('');
      return;
    }

    // Instagram, TikTok, Twitter/X, Facebook — insert as responsive iframe
    let embedHtml = '';
    if (url.includes('instagram.com')) {
      const shortcode = url.match(/\/p\/([^/]+)/)?.[1] || url.match(/\/reel\/([^/]+)/)?.[1];
      if (shortcode) {
        embedHtml = `<div class="cms-embed cms-embed-instagram"><iframe src="https://www.instagram.com/p/${shortcode}/embed/" width="400" height="480" frameborder="0" scrolling="no" allowtransparency="true"></iframe></div>`;
      }
    } else if (url.includes('tiktok.com')) {
      const videoId = url.match(/video\/([0-9]+)/)?.[1];
      if (videoId) {
        embedHtml = `<div class="cms-embed cms-embed-tiktok"><iframe src="https://www.tiktok.com/embed/v2/${videoId}" width="325" height="575" frameborder="0" allowfullscreen></iframe></div>`;
      }
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      embedHtml = `<div class="cms-embed cms-embed-twitter"><blockquote class="twitter-tweet"><a href="${url}"></a></blockquote><script async src="https://platform.twitter.com/widgets.js"></script></div>`;
    } else if (url.includes('facebook.com')) {
      embedHtml = `<div class="cms-embed cms-embed-facebook"><iframe src="https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&width=500" width="500" height="400" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen></iframe></div>`;
    }

    if (embedHtml) {
      editor?.chain().focus().insertContent(embedHtml).run();
    } else {
      // Fallback: insert as generic iframe
      editor?.chain().focus().insertContent(`<div class="cms-embed"><iframe src="${url}" width="100%" height="400" frameborder="0" allowfullscreen></iframe></div>`).run();
    }
    setShowEmbedInput(false);
    setEmbedUrl('');
  }, [editor, embedUrl]);

  const setLink = useCallback(() => {
    if (!linkUrl) {
      editor?.chain().focus().unsetLink().run();
    } else {
      const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      editor?.chain().focus().setLink({ href: url }).run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  if (!editor) return null;

  const charCount = editor.storage.characterCount?.characters() ?? 0;
  const wordCount = editor.storage.characterCount?.words() ?? 0;

  return (
    <div className="cms-rich-editor">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 bg-[#1a1a1a] border border-[#333] border-b-0 rounded-t-lg sticky top-0 z-10">
        {/* Heading */}
        <select
          value={
            editor.isActive("heading", { level: 1 }) ? "h1" :
            editor.isActive("heading", { level: 2 }) ? "h2" :
            editor.isActive("heading", { level: 3 }) ? "h3" :
            editor.isActive("heading", { level: 4 }) ? "h4" : "p"
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().setHeading({ level: parseInt(v[1]) as 1|2|3|4 }).run();
          }}
          className="bg-[#111] border border-[#333] text-white text-xs px-2 py-1 rounded focus:outline-none focus:border-[#F5C518] h-7"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>

        <ToolSep />

        {/* Text formatting */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)">
          <strong>B</strong>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)">
          <em>I</em>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)">
          <span style={{ textDecoration: "underline" }}>U</span>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <span style={{ textDecoration: "line-through" }}>S</span>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight">
          🖊
        </ToolBtn>

        <ToolSep />

        {/* Alignment */}
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
          ≡
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
          ≡
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
          ≡
        </ToolBtn>

        <ToolSep />

        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
          •≡
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
          1≡
        </ToolBtn>

        <ToolSep />

        {/* Blocks */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          "
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline Code">
          {"<>"}
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Horizontal Rule">
          —
        </ToolBtn>

        <ToolSep />

        {/* Link */}
        <div className="relative">
          <ToolBtn
            onClick={() => {
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run();
              } else {
                setShowLinkInput(!showLinkInput);
                setLinkUrl(editor.getAttributes("link").href ?? "");
              }
            }}
            active={editor.isActive("link")}
            title="Link"
          >
            🔗
          </ToolBtn>
          {showLinkInput && (
            <div className="absolute top-9 left-0 z-50 bg-[#1a1a1a] border border-[#333] rounded-lg p-2 flex gap-2 shadow-xl" style={{ minWidth: 280 }}>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setLink()}
                placeholder="https://..."
                className="flex-1 bg-[#111] border border-[#333] text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-[#F5C518]"
                autoFocus
              />
              <button onClick={setLink} className="bg-[#F5C518] text-black text-xs font-bold px-2 py-1 rounded">Set</button>
              <button onClick={() => setShowLinkInput(false)} className="text-gray-500 text-xs px-1">✕</button>
            </div>
          )}
        </div>

        {/* Image upload */}
        <ToolBtn
          onClick={() => fileInputRef.current?.click()}
          active={false}
          title="Insert Image (or drag & drop)"
          disabled={uploading}
        >
          {uploading ? "⏳" : "🖼"}
        </ToolBtn>

        {/* YouTube/Social Embed */}
        <div className="relative">
          <ToolBtn
            onClick={() => { setShowEmbedInput(!showEmbedInput); setEmbedUrl(""); }}
            active={showEmbedInput}
            title="Embed YouTube / Instagram / TikTok / Twitter"
          >
            ▶
          </ToolBtn>
          {showEmbedInput && (
            <div className="absolute top-9 left-0 z-50 bg-[#1a1a1a] border border-[#333] rounded-lg p-3 shadow-xl" style={{ minWidth: 340 }}>
              <div className="text-xs text-gray-400 font-bold mb-2">Embed Video or Social Post</div>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={embedUrl}
                  onChange={(e) => setEmbedUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmbed()}
                  placeholder="YouTube, Instagram, TikTok, Twitter URL..."
                  className="flex-1 bg-[#111] border border-[#333] text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-[#F5C518]"
                  autoFocus
                />
                <button onClick={handleEmbed} className="bg-[#F5C518] text-black text-xs font-bold px-2 py-1 rounded whitespace-nowrap">Embed</button>
                <button onClick={() => setShowEmbedInput(false)} className="text-gray-500 text-xs px-1">✕</button>
              </div>
              <div className="text-[10px] text-gray-600">Supports: YouTube, Instagram Reels, TikTok, Twitter/X, Facebook</div>
            </div>
          )}
        </div>

        <ToolSep />

        {/* Undo/Redo */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} active={false} title="Undo (Ctrl+Z)">
          ↩
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} active={false} title="Redo (Ctrl+Y)">
          ↪
        </ToolBtn>

        {/* Character count */}
        <div className="ml-auto text-[10px] text-gray-600 pr-1">
          {wordCount} words · {charCount} chars
        </div>
      </div>

      {/* Editor area with drag-and-drop */}
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onPaste={handlePaste}
        className={`relative bg-[#111] border border-[#333] rounded-b-lg transition-colors ${
          isDragging ? "border-[#F5C518] bg-[#F5C518]/5" : ""
        }`}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F5C518]/10 border-2 border-dashed border-[#F5C518] rounded-b-lg z-10 pointer-events-none">
            <div className="text-center">
              <div className="text-3xl mb-2">🖼</div>
              <div className="text-[#F5C518] font-bold">Drop image here</div>
            </div>
          </div>
        )}

        {/* Bubble menu — appears when text is selected */}
        <BubbleMenu editor={editor}>
          <div className="flex items-center gap-0.5 bg-[#1a1a1a] border border-[#333] rounded-lg p-1 shadow-xl">
            <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
              <strong>B</strong>
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
              <em>I</em>
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
              <span style={{ textDecoration: "underline" }}>U</span>
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight">
              🖊
            </ToolBtn>
            <ToolSep />
            <ToolBtn
              onClick={() => {
                const url = window.prompt("Enter URL:", editor.getAttributes("link").href ?? "");
                if (url) editor.chain().focus().setLink({ href: url.startsWith("http") ? url : `https://${url}` }).run();
                else editor.chain().focus().unsetLink().run();
              }}
              active={editor.isActive("link")}
              title="Link"
            >
              🔗
            </ToolBtn>
          </div>
        </BubbleMenu>

        {/* Floating menu — appears on empty line */}
        <FloatingMenu editor={editor}>
          <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] rounded-lg p-1 shadow-xl">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-[#2a2a2a] transition-colors"
            >
              🖼 Image
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-[#2a2a2a] transition-colors"
            >
              " Quote
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-[#2a2a2a] transition-colors"
            >
              — Divider
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-[#2a2a2a] transition-colors"
            >
              • List
            </button>
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-[#2a2a2a] transition-colors"
            >
              🖼 Gallery
            </button>
          </div>
        </FloatingMenu>

        <EditorContent editor={editor} />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          Array.from(e.target.files ?? []).forEach(uploadImage);
          e.target.value = "";
        }}
      />

      {/* Hidden gallery file input — inserts multiple images as a grid */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length === 0) return;
          if (files.length === 1) { uploadImage(files[0]); return; }
          // Upload all images then insert as a gallery grid
          const urls: string[] = [];
          for (const file of files) {
            try {
              setUploading(true);
              const formData = new FormData();
              formData.append('image', file);
              const token = localStorage.getItem('fd_cms_token');
              const res = await fetch('/api/cms/upload-image', {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
              });
              const data = await res.json();
              if (data.url) urls.push(data.url);
            } catch {}
          }
          setUploading(false);
          if (urls.length === 0) return;
          // Insert as a responsive gallery grid
          const galleryHtml = `<div class="cms-gallery" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin:1em 0">${urls.map(url => `<img src="${url}" style="width:100%;height:200px;object-fit:cover;border-radius:6px" />`).join('')}</div>`;
          editor?.chain().focus().insertContent(galleryHtml).run();
          toast.success(`Gallery of ${urls.length} images inserted ✈`);
        }}
      />

      {/* Editor styles */}
      <style>{`
        .cms-editor-content h1 { font-size: 2em; font-weight: 900; color: #fff; margin: 1em 0 0.5em; line-height: 1.2; }
        .cms-editor-content h2 { font-size: 1.5em; font-weight: 800; color: #fff; margin: 1em 0 0.5em; border-left: 3px solid #F5C518; padding-left: 12px; }
        .cms-editor-content h3 { font-size: 1.2em; font-weight: 700; color: #F5C518; text-transform: uppercase; letter-spacing: 0.05em; margin: 1em 0 0.5em; }
        .cms-editor-content h4 { font-size: 1em; font-weight: 700; color: #ccc; margin: 0.8em 0 0.4em; }
        .cms-editor-content p { color: #ccc; line-height: 1.8; margin: 0.75em 0; }
        .cms-editor-content strong { color: #fff; font-weight: 700; }
        .cms-editor-content em { color: #ddd; font-style: italic; }
        .cms-editor-content u { text-decoration: underline; }
        .cms-editor-content s { text-decoration: line-through; color: #888; }
        .cms-editor-content mark { background: rgba(245,197,24,0.3); color: #fff; padding: 0 2px; border-radius: 2px; }
        .cms-editor-content a { color: #F5C518; text-decoration: underline; }
        .cms-editor-content blockquote { border-left: 4px solid #F5C518; background: rgba(245,197,24,0.05); padding: 12px 16px; margin: 1em 0; color: #ccc; font-style: italic; border-radius: 0 4px 4px 0; }
        .cms-editor-content ul { list-style: disc; padding-left: 1.5em; color: #ccc; margin: 0.75em 0; }
        .cms-editor-content ol { list-style: decimal; padding-left: 1.5em; color: #ccc; margin: 0.75em 0; }
        .cms-editor-content li { margin: 0.25em 0; line-height: 1.7; }
        .cms-editor-content li::marker { color: #F5C518; }
        .cms-editor-content code { background: #1a1a1a; color: #F5C518; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 0.9em; }
        .cms-editor-content pre { background: #1a1a1a; border: 1px solid #333; padding: 16px; border-radius: 6px; overflow-x: auto; margin: 1em 0; }
        .cms-editor-content pre code { background: none; padding: 0; color: #ccc; }
        .cms-editor-content hr { border: none; border-top: 2px solid #333; margin: 2em 0; }
        .cms-editor-content img { max-width: 100%; height: auto; border-radius: 6px; margin: 1em 0; cursor: pointer; border: 2px solid transparent; transition: border-color 0.15s; }
        .cms-editor-content img.ProseMirror-selectednode { border-color: #F5C518; }
        .cms-editor-content .ProseMirror-placeholder { color: #444; }
        .cms-editor-content:focus { outline: none; }
        .cms-editor-content [data-text-align="center"] { text-align: center; }
        .cms-editor-content [data-text-align="right"] { text-align: right; }
        .cms-editor-content [data-text-align="justify"] { text-align: justify; }
        .cms-editor-content .cms-youtube { max-width: 100%; margin: 1em 0; border-radius: 6px; overflow: hidden; }
        .cms-editor-content .cms-youtube iframe { max-width: 100%; border-radius: 6px; }
        .cms-editor-content .cms-embed { margin: 1em 0; display: flex; justify-content: center; }
        .cms-editor-content .cms-embed iframe { max-width: 100%; border-radius: 6px; }
        .cms-editor-content .twitter-tweet { margin: 0 auto !important; }
      `}</style>
    </div>
  );
}
