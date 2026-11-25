"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { marked } from "marked";
import { sanitizeClientHtml } from "@/lib/sanitize-client";
import { formatDate } from "@/lib/date";
import {
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSave,
  FiEye,
  FiX,
  FiLogOut,
  FiStar,
  FiFileText,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";
import type { Game, NewsArticle } from "@/lib/types";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[300px] rounded-xl border border-border bg-surface animate-pulse" />
  ),
});

type Tab = "articles" | "games";
type Toast = { message: string; type: "success" | "error" };

function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, type });
    timer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  return { toast, showToast };
}

/**
 * RLS doesn't error on UPDATE/DELETE it's not allowed to touch — PostgREST just
 * reports success with zero affected rows. Ask for the touched rows back so a
 * blocked save shows an error instead of a fake "updated" toast.
 */
function assertRowsWritten(rows: { id: string }[] | null, action: string) {
  if (!rows || rows.length === 0) {
    throw new Error(
      `${action} was blocked by row-level security. Your account is not on the admins list (run the insert in harden-rls.sql for your email).`
    );
  }
}

function ToastMessage({ toast }: { toast: Toast | null }) {
  if (!toast) return null;

  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 ${
        toast.type === "error" ? "bg-red-600" : "bg-accent"
      }`}
    >
      {toast.type === "error" ? (
        <FiAlertCircle className="w-4 h-4" />
      ) : (
        <FiCheck className="w-4 h-4" />
      )}
      {toast.message}
    </div>
  );
}

async function revalidateSite() {
  try {
    const {
      data: { session },
    } = await getSupabaseBrowser().auth.getSession();
    if (!session) return;

    await fetch("/api/revalidate", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
  } catch {
    // The page will still refresh on its own within the ISR window.
  }
}

export default function EditorDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("articles");
  const [notAdmin, setNotAdmin] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/editor");
    }
  }, [user, authLoading, router]);

  // harden-rls.sql restricts writes to public.admins. Without this check a
  // non-admin can open the dashboard and get silent no-op saves.
  useEffect(() => {
    if (!user) return;
    let active = true;

    getSupabaseBrowser()
      .rpc("is_admin")
      .then(({ data, error }) => {
        if (active && !error && data === false) setNotAdmin(true);
      });

    return () => {
      active = false;
    };
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Editor Dashboard</h1>
          <p className="text-muted text-sm mt-1">Manage your news and games</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted hidden sm:block">{user.email}</span>
          <button
            onClick={async () => {
              await signOut();
              router.push("/editor");
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-red-500 hover:bg-surface transition-all"
          >
            <FiLogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {notAdmin && (
        <div className="flex gap-3 p-4 mb-8 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-sm">
          <FiAlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">This account can sign in but can&apos;t save.</p>
            <p className="text-muted">
              It isn&apos;t listed in <code className="font-mono">public.admins</code>, so Supabase
              rejects every write. Add it in the SQL editor:
            </p>
            <code className="block mt-1 p-2 rounded-lg bg-surface font-mono text-xs overflow-x-auto">
              {`insert into public.admins (user_id)\nselect id from auth.users where email = '${user.email ?? "you@example.com"}';`}
            </code>
          </div>
        </div>
      )}

      <div className="flex gap-1 p-1 bg-surface rounded-xl mb-8 w-fit">
        <button
          onClick={() => setTab("articles")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "articles" ? "bg-card shadow text-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          <FiFileText className="w-4 h-4" />
          Articles
        </button>
        <button
          onClick={() => setTab("games")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "games" ? "bg-card shadow text-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          <FiStar className="w-4 h-4" />
          Games
        </button>
      </div>

      {tab === "articles" ? <ArticlesTab /> : <GamesTab />}
    </div>
  );
}

function ArticlesTab() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [editing, setEditing] = useState<NewsArticle | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast, showToast } = useToast();

  const loadArticles = useCallback(async () => {
    const { data, error } = await getSupabaseBrowser()
      .from("news_articles")
      .select("*, game:games(id, title, slug)")
      .order("created_at", { ascending: false });

    if (error) {
      showToast("Could not load articles: " + error.message, "error");
      return;
    }
    setArticles(data || []);
  }, [showToast]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const [articlesResult, gamesResult] = await Promise.all([
        getSupabaseBrowser()
          .from("news_articles")
          .select("*, game:games(id, title, slug)")
          .order("created_at", { ascending: false }),
        getSupabaseBrowser().from("games").select("*").order("title"),
      ]);

      if (!active) return;

      if (articlesResult.error) {
        showToast("Could not load articles: " + articlesResult.error.message, "error");
      } else {
        setArticles(articlesResult.data || []);
      }

      if (gamesResult.error) {
        showToast("Could not load games: " + gamesResult.error.message, "error");
      } else {
        setGames(gamesResult.data || []);
      }
    })();

    return () => {
      active = false;
    };
  }, [showToast]);

  const handleSave = async (article: Partial<NewsArticle>) => {
    setSaving(true);
    try {
      // Keep the original publish date when editing; only stamp it on first
      // publish (or when a draft becomes published).
      const publishedAt =
        article.status === "published"
          ? article.published_at || new Date().toISOString()
          : article.published_at || null;

      if (article.id) {
        const { data, error } = await getSupabaseBrowser()
          .from("news_articles")
          .update({
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            content: article.content,
            content_format: article.content_format,
            featured_image: article.featured_image,
            game_id: article.game_id || null,
            status: article.status,
            published_at: publishedAt,
          })
          .eq("id", article.id)
          .select("id");
        if (error) throw error;
        assertRowsWritten(data, "Saving the article");
        showToast("Article updated!");
      } else {
        const {
          data: { user },
        } = await getSupabaseBrowser().auth.getUser();

        const { data, error } = await getSupabaseBrowser()
          .from("news_articles")
          .insert({
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            content: article.content,
            content_format: article.content_format,
            featured_image: article.featured_image,
            game_id: article.game_id || null,
            status: article.status,
            author_id: user?.id,
            published_at: publishedAt,
          })
          .select("id");
        if (error) throw error;
        assertRowsWritten(data, "Creating the article");
        showToast("Article created!");
      }
      setEditing(null);
      setCreating(false);
      await loadArticles();
      await revalidateSite();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showToast("Error: " + message, "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this article?")) return;

    const { data, error } = await getSupabaseBrowser()
      .from("news_articles")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      showToast("Could not delete article: " + error.message, "error");
      return;
    }
    if (!data?.length) {
      showToast("Delete was blocked by row-level security — this account is not on the admins list.", "error");
      return;
    }

    showToast("Article deleted");
    await loadArticles();
    await revalidateSite();
  };

  return (
    <div>
      <ToastMessage toast={toast} />

      {creating || editing ? (
        <ArticleEditor
          article={editing}
          games={games}
          saving={saving}
          onSave={handleSave}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      ) : (
        <>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-all mb-6"
          >
            <FiPlus className="w-4 h-4" />
            New Article
          </button>

          <div className="space-y-3">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-accent/20 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{article.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        article.status === "published"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {article.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted truncate">
                    {article.game && `#${article.game.title} · `}
                    {formatDate(article.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {article.status === "published" && (
                    <a
                      href={`/news/${article.slug}`}
                      target="_blank"
                      className="p-2 rounded-lg text-muted hover:text-accent hover:bg-surface transition-all"
                      title="Preview"
                    >
                      <FiEye className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => setEditing(article)}
                    className="p-2 rounded-lg text-muted hover:text-accent hover:bg-surface transition-all"
                    title="Edit"
                  >
                    <FiEdit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-surface transition-all"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {articles.length === 0 && (
              <div className="text-center py-16 text-muted">
                No articles yet. Click &quot;New Article&quot; to get started.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ArticleEditor({
  article,
  games,
  saving,
  onSave,
  onCancel,
}: {
  article: NewsArticle | null;
  games: Game[];
  saving: boolean;
  onSave: (article: Partial<NewsArticle>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(article?.title || "");
  const [slug, setSlug] = useState(article?.slug || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [content, setContent] = useState(article?.content || "");
  const [contentFormat, setContentFormat] = useState<"html" | "markdown">(
    article?.content_format || "html"
  );
  const [featuredImage, setFeaturedImage] = useState(article?.featured_image || "");
  const [gameId, setGameId] = useState(article?.game_id || "");
  const [status, setStatus] = useState<"draft" | "published">(article?.status || "draft");
  const [showPreview, setShowPreview] = useState(false);
  const [markdownMode, setMarkdownMode] = useState(false);
  const [markdownText, setMarkdownText] = useState(
    contentFormat === "markdown" ? content : ""
  );

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!article) {
      setSlug(generateSlug(val));
    }
  };

  const toggleMarkdown = async () => {
    if (!markdownMode) {
      if (
        content &&
        !confirm(
          "Switching to Markdown converts the rich text. Some formatting (like colours) may be lost. Continue?"
        )
      ) {
        return;
      }

      const md = content
        ? await fetch("/api/convert-html-to-md", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ html: content }),
          })
            .then((r) => r.json())
            .then((d) => d.markdown)
        : "";
      setMarkdownText(md || "");
      setMarkdownMode(true);
      setContentFormat("markdown");
    } else {
      const html = markdownText
        ? await fetch("/api/convert-md-to-html", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markdown: markdownText }),
          })
            .then((r) => r.json())
            .then((d) => d.html)
        : "";
      setContent(sanitizeClientHtml(html || ""));
      setMarkdownMode(false);
      setContentFormat("html");
    }
  };

  const handleSaveArticle = () => {
    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    onSave({
      id: article?.id,
      title,
      slug: cleanSlug,
      excerpt,
      content: markdownMode ? markdownText : sanitizeClientHtml(content),
      content_format: markdownMode ? "markdown" : "html",
      featured_image: featuredImage,
      game_id: gameId || null,
      status,
      published_at: article?.published_at ?? null,
    });
  };

  const previewHtml = sanitizeClientHtml(
    markdownMode
      ? (marked.parse(markdownText, { async: false }) as string)
      : content
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{article ? "Edit Article" : "New Article"}</h2>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-all"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Article title..."
              className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="article-slug"
              className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-mono text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">Content</label>
              <button
                type="button"
                onClick={toggleMarkdown}
                className="text-xs px-3 py-1 rounded-lg bg-surface border border-border hover:border-accent transition-all"
              >
                {markdownMode ? "Switch to Rich Text" : "Switch to Markdown"}
              </button>
            </div>
            {markdownMode ? (
              <textarea
                value={markdownText}
                onChange={(e) => setMarkdownText(e.target.value)}
                placeholder="Write in Markdown..."
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-mono text-sm min-h-[300px] resize-y"
              />
            ) : (
              <RichTextEditor content={content} onChange={setContent} />
            )}
          </div>

          {showPreview && (
            <div className="rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-3">Preview</h3>
              <div
                className="news-content"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-border p-4 space-y-4">
            <h3 className="font-medium text-sm">Publishing</h3>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:border-accent outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted">Game</label>
              <select
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:border-accent outline-none"
              >
                <option value="">No game</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 space-y-4">
            <h3 className="font-medium text-sm">Details</h3>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted">Excerpt</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Short description..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:border-accent outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted">
                Featured Image URL
              </label>
              <input
                type="text"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:border-accent outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-surface transition-all"
            >
              <FiEye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={handleSaveArticle}
              disabled={saving || !title}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-all disabled:opacity-50"
            >
              <FiSave className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GamesTab() {
  const [games, setGames] = useState<Game[]>([]);
  const [editing, setEditing] = useState<Game | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast, showToast } = useToast();

  const loadGames = useCallback(async () => {
    const { data, error } = await getSupabaseBrowser()
      .from("games")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      showToast("Could not load games: " + error.message, "error");
      return;
    }
    setGames(data || []);
  }, [showToast]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const { data, error } = await getSupabaseBrowser()
        .from("games")
        .select("*")
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        showToast("Could not load games: " + error.message, "error");
        return;
      }

      setGames(data || []);
    })();

    return () => {
      active = false;
    };
  }, [showToast]);

  const handleSave = async (game: Partial<Game>) => {
    setSaving(true);
    try {
      if (game.id) {
        const { data, error } = await getSupabaseBrowser()
          .from("games")
          .update({
            title: game.title,
            slug: game.slug,
            description: game.description,
            short_description: game.short_description,
            cover_image: game.cover_image,
            screenshots: game.screenshots,
            download_link: game.download_link,
          })
          .eq("id", game.id)
          .select("id");
        if (error) throw error;
        assertRowsWritten(data, "Saving the game");
        showToast("Game updated!");
      } else {
        const { data, error } = await getSupabaseBrowser()
          .from("games")
          .insert({
            title: game.title,
            slug: game.slug,
            description: game.description,
            short_description: game.short_description,
            cover_image: game.cover_image,
            screenshots: game.screenshots || [],
            download_link: game.download_link,
          })
          .select("id");
        if (error) throw error;
        assertRowsWritten(data, "Creating the game");
        showToast("Game created!");
      }
      setEditing(null);
      setCreating(false);
      await loadGames();
      await revalidateSite();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showToast("Error: " + message, "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Delete this game? Articles linked to it will stay published but no longer be linked to a game."
      )
    ) {
      return;
    }

    const { data, error } = await getSupabaseBrowser()
      .from("games")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      showToast("Could not delete game: " + error.message, "error");
      return;
    }
    if (!data?.length) {
      showToast("Delete was blocked by row-level security — this account is not on the admins list.", "error");
      return;
    }

    showToast("Game deleted");
    await loadGames();
    await revalidateSite();
  };

  return (
    <div>
      <ToastMessage toast={toast} />

      {creating || editing ? (
        <GameEditor
          game={editing}
          saving={saving}
          onSave={handleSave}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      ) : (
        <>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-all mb-6"
          >
            <FiPlus className="w-4 h-4" />
            New Game
          </button>

          <div className="space-y-3">
            {games.map((game) => (
              <div
                key={game.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-accent/20 transition-all"
              >
                <div className="w-16 h-16 rounded-lg bg-surface flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                  {game.cover_image ? (
                    <Image
                      src={game.cover_image}
                      alt={game.title}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "🎮"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{game.title}</h3>
                  <p className="text-sm text-muted truncate">{game.short_description || game.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/games/${game.slug}`}
                    target="_blank"
                    className="p-2 rounded-lg text-muted hover:text-accent hover:bg-surface transition-all"
                    title="View"
                  >
                    <FiEye className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setEditing(game)}
                    className="p-2 rounded-lg text-muted hover:text-accent hover:bg-surface transition-all"
                    title="Edit"
                  >
                    <FiEdit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(game.id)}
                    className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-surface transition-all"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {games.length === 0 && (
              <div className="text-center py-16 text-muted">
                No games yet. Click &quot;New Game&quot; to add one.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function GameEditor({
  game,
  saving,
  onSave,
  onCancel,
}: {
  game: Game | null;
  saving: boolean;
  onSave: (game: Partial<Game>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(game?.title || "");
  const [slug, setSlug] = useState(game?.slug || "");
  const [description, setDescription] = useState(game?.description || "");
  const [shortDesc, setShortDesc] = useState(game?.short_description || "");
  const [coverImage, setCoverImage] = useState(game?.cover_image || "");
  const [downloadLink, setDownloadLink] = useState(game?.download_link || "");
  const [screenshots, setScreenshots] = useState<string[]>(game?.screenshots || []);
  const [newScreenshot, setNewScreenshot] = useState("");

  const generateSlug = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!game) setSlug(generateSlug(val));
  };

  const addScreenshot = () => {
    if (newScreenshot && !screenshots.includes(newScreenshot)) {
      setScreenshots([...screenshots, newScreenshot]);
      setNewScreenshot("");
    }
  };

  const removeScreenshot = (idx: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{game ? "Edit Game" : "New Game"}</h2>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-all"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Game title..."
              className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="game-slug"
              className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Short Description</label>
            <input
              type="text"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Brief description..."
              className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Description (Markdown)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed game description..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-mono text-sm resize-y"
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-border p-4 space-y-4">
            <h3 className="font-medium text-sm">Download</h3>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted">
                Download Link
              </label>
              <input
                type="url"
                value={downloadLink}
                onChange={(e) => setDownloadLink(e.target.value)}
                placeholder="https://example.com/download"
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:border-accent outline-none"
              />
              <p className="text-xs text-muted mt-1">
                Paste the URL where users can download the game
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 space-y-4">
            <h3 className="font-medium text-sm">Media</h3>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted">
                Cover Image URL
              </label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:border-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted">Screenshots</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newScreenshot}
                  onChange={(e) => setNewScreenshot(e.target.value)}
                  placeholder="Add screenshot URL..."
                  className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:border-accent outline-none"
                />
                <button
                  type="button"
                  onClick={addScreenshot}
                  className="px-3 py-2 rounded-lg bg-surface border border-border text-sm hover:border-accent transition-all"
                >
                  <FiPlus className="w-4 h-4" />
                </button>
              </div>
              {screenshots.length > 0 && (
                <div className="mt-2 space-y-1">
                  {screenshots.map((shot, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-muted">
                      <span className="truncate flex-1">{shot}</span>
                      <button
                        onClick={() => removeScreenshot(idx)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
              onSave({
                id: game?.id,
                title,
                slug: cleanSlug,
                description,
                short_description: shortDesc,
                cover_image: coverImage,
                download_link: downloadLink,
                screenshots,
              });
            }}
            disabled={saving || !title}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-all disabled:opacity-50"
          >
            <FiSave className="w-4 h-4" />
            {saving ? "Saving..." : "Save Game"}
          </button>
        </div>
      </div>
    </div>
  );
}
