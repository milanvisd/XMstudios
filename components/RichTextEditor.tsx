"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { common, createLowlight } from "lowlight";
import { useEffect, useRef, useState, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiCode,
  FiLink,
  FiImage,
  FiList,
  FiGrid,
  FiMinus,
  FiMessageSquare,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiStar,
  FiX,
  FiCheck,
  FiChevronDown,
} from "react-icons/fi";

const lowlight = createLowlight(common);

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#f43f5e", "#14b8a6", "#6366f1", "#a855f7",
  "#ffffff", "#94a3b8", "#64748b", "#1e293b",
];

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active === undefined ? undefined : active}
      className={`p-1.5 rounded-md transition-all ${
        active
          ? "bg-accent text-white"
          : "text-muted hover:text-foreground hover:bg-surface"
      }`}
    >
      {children}
    </button>
  );
}

function LinkPopup({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [url, setUrl] = useState("");
  const [showInput, setShowInput] = useState(false);

  if (!editor) return null;

  const isActive = editor.isActive("link");

  const handleApply = () => {
    const safeUrl = url.trim();
    if (safeUrl && /^(https?:\/\/|mailto:|\/)/i.test(safeUrl)) {
      editor.chain().focus().setLink({ href: safeUrl }).run();
    }
    setShowInput(false);
  };

  const handleRemove = () => {
    editor.chain().focus().unsetLink().run();
    setUrl("");
    setShowInput(false);
  };

  const handleOpen = () => {
    if (isActive) {
      setUrl(editor.getAttributes("link").href || "");
    } else {
      setUrl("");
    }
    setShowInput(true);
  };

  return (
    <>
      <ToolbarButton onClick={handleOpen} active={isActive} title="Add Link">
        <FiLink className="w-4 h-4" />
      </ToolbarButton>
      {showInput && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-3 w-80">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApply();
                if (e.key === "Escape") setShowInput(false);
              }}
              className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleApply}
              disabled={!url}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-all disabled:opacity-40"
            >
              <FiCheck className="w-3 h-3" />
              Apply
            </button>
            {isActive && (
              <button
                onClick={handleRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium hover:bg-red-500/20 transition-all"
              >
                <FiX className="w-3 h-3" />
                Remove
              </button>
            )}
            <button
              onClick={() => setShowInput(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-muted hover:bg-surface transition-all ml-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ColorPicker({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false);
  const [customColor, setCustomColor] = useState("#3b82f6");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor) return null;

  const currentColor = editor.getAttributes("textStyle")?.color || "#e2e8f0";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        title="Text Color"
        className="flex items-center gap-1 p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-all"
      >
        <FiStar className="w-4 h-4" />
        <div
          className="w-3 h-3 rounded-sm border border-border"
          style={{ backgroundColor: currentColor }}
        />
        <FiChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-3 w-56">
          <p className="text-xs text-muted mb-2 font-medium">Preset Colors</p>
          <div className="grid grid-cols-8 gap-1.5 mb-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => {
                  editor.chain().focus().setColor(color).run();
                  setOpen(false);
                }}
                className="w-6 h-6 rounded-md border border-border hover:scale-125 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted">Custom:</label>
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"
            />
            <button
              onClick={() => {
                editor.chain().focus().setColor(customColor).run();
                setOpen(false);
              }}
              className="px-2 py-1 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-all"
            >
              Apply
            </button>
          </div>
          <button
            onClick={() => {
              editor.chain().focus().unsetColor().run();
              setOpen(false);
            }}
            className="w-full mt-2 px-2 py-1.5 rounded-lg text-xs text-muted hover:bg-surface transition-all"
          >
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}

function ImageMenu({ editor, fileInputRef, uploading }: {
  editor: ReturnType<typeof useEditor>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setUrlMode(false);
        setImageUrl("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor) return null;

  const handleUrlInsert = () => {
    const safeUrl = imageUrl.trim();
    if (safeUrl && /^https?:\/\//i.test(safeUrl)) {
      editor.chain().focus().setImage({ src: safeUrl }).run();
    }
    setImageUrl("");
    setUrlMode(false);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <ToolbarButton
        onClick={() => setOpen(!open)}
        title="Add Image"
      >
        {uploading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <FiImage className="w-4 h-4" />
        )}
      </ToolbarButton>
      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-2 w-48">
          {!urlMode ? (
            <>
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-surface transition-all"
              >
                <FiImage className="w-4 h-4 text-muted" />
                Upload File
              </button>
              <button
                onClick={() => setUrlMode(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-surface transition-all"
              >
                <FiLink className="w-4 h-4 text-muted" />
                Paste URL
              </button>
            </>
          ) : (
            <div className="p-1">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUrlInsert();
                  if (e.key === "Escape") {
                    setUrlMode(false);
                    setImageUrl("");
                  }
                }}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:border-accent outline-none mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUrlInsert}
                  disabled={!imageUrl}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover disabled:opacity-40"
                >
                  <FiCheck className="w-3 h-3" />
                  Insert
                </button>
                <button
                  onClick={() => { setUrlMode(false); setImageUrl(""); }}
                  className="px-2 py-1.5 rounded-lg text-xs text-muted hover:bg-surface"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const {
        data: { session },
      } = await getSupabaseBrowser().auth.getSession();

      if (!session) {
        throw new Error("Please sign in again to upload images.");
      }

      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        return data.url;
      }
      throw new Error(data.error || "Upload failed");
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
        underline: false,
      }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-accent underline cursor-pointer" },
      }),
      Image.configure({
        HTMLAttributes: { class: "rounded-lg max-w-full" },
      }),
      Placeholder.configure({
        placeholder: "Start writing your article...",
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content,
    shouldRerenderOnTransaction: true,
    editorProps: {
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        const imageFiles = Array.from(files).filter((f) =>
          f.type.startsWith("image/")
        );
        if (imageFiles.length === 0) return false;

        event.preventDefault();

        const dropPosition = view.state.selection.from;
        void (async () => {
          const urls = (
            await Promise.all(imageFiles.map((file) => uploadFile(file)))
          ).filter((url): url is string => Boolean(url));

          if (!editor || urls.length === 0) return;

          editor
            .chain()
            .focus()
            .insertContentAt(
              dropPosition,
              urls.map((src) => ({ type: "image", attrs: { src } }))
            )
            .run();
        })();

        return true;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!editor) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const url = await uploadFile(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="tiptap-editor rounded-xl border border-border bg-card">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.gif"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-surface/50 relative">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <FiBold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <FiItalic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline"
        >
          <FiUnderline className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive("highlight")}
          title="Highlight"
        >
          <FiStar className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <span className="text-xs font-bold px-0.5">H1</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <span className="text-xs font-bold px-0.5">H2</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <span className="text-xs font-bold px-0.5">H3</span>
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <FiList className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered List"
        >
          <FiGrid className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          <FiMessageSquare className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <FiMinus className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Code Block"
        >
          <FiCode className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Align Left"
        >
          <FiAlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Align Center"
        >
          <FiAlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Align Right"
        >
          <FiAlignRight className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <LinkPopup editor={editor} />

        <ImageMenu
          editor={editor}
          fileInputRef={fileInputRef}
          uploading={uploading}
        />

        <div className="w-px h-5 bg-border mx-1" />

        <ColorPicker editor={editor} />
      </div>

      {editor.isActive("link") && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/5 border-b border-border text-xs">
          <FiLink className="w-3 h-3 text-accent" />
          <span className="text-muted truncate max-w-[200px]">
            {editor.getAttributes("link").href}
          </span>
          <button
            onClick={() => {
              const href = editor.getAttributes("link").href;
              window.open(href, "_blank");
            }}
            className="text-accent hover:underline ml-auto"
          >
            Open
          </button>
          <button
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="text-red-400 hover:text-red-500"
          >
            <FiX className="w-3 h-3" />
          </button>
        </div>
      )}

      <EditorContent editor={editor} className="min-h-[300px] p-4" />

      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-surface/30 text-xs text-muted">
        <span>
          Drag & drop images here, or use the toolbar button
        </span>
        <span>
          {editor.getText().length} characters
        </span>
      </div>
    </div>
  );
}
