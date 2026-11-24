import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { FiDownload, FiArrowLeft } from "react-icons/fi";
import { marked } from "marked";
import { getContentSlugs, getGameBySlug, getRelatedNews } from "@/lib/queries";
import { sanitizeContent } from "@/lib/sanitize";
import { formatDate } from "@/lib/date";

export const revalidate = 60;

export async function generateStaticParams() {
  const { games } = await getContentSlugs();
  return games.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) return { title: "Game" };

  return {
    title: game.title,
    description: game.short_description || game.description.slice(0, 160),
    openGraph: {
      title: game.title,
      description: game.short_description || undefined,
      images: game.cover_image ? [{ url: game.cover_image }] : undefined,
    },
  };
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) notFound();

  const news = await getRelatedNews(game.id);
  const descriptionHtml = game.description
    ? sanitizeContent(await marked.parse(game.description))
    : "";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/games"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Games
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{game.title}</h1>
            {game.short_description && (
              <p className="text-muted text-lg">{game.short_description}</p>
            )}
          </div>

          {game.cover_image && (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-border">
              <Image
                src={game.cover_image}
                alt={game.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
            </div>
          )}

          {descriptionHtml && (
            <div className="rounded-2xl bg-card border border-border p-6 md:p-8">
              <h2 className="text-xl font-semibold mb-4">About this game</h2>
              <div
                className="news-content text-muted"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </div>
          )}

          {game.screenshots && game.screenshots.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Screenshots</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {game.screenshots.map((shot, i) => (
                  <div
                    key={shot}
                    className="relative aspect-video rounded-xl overflow-hidden border border-border"
                  >
                    <Image
                      src={shot}
                      alt={`${game.title} screenshot ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-card border border-border p-6 sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Download</h2>
            {game.download_link ? (
              <a
                href={game.download_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-all duration-200"
              >
                <FiDownload className="w-5 h-5" />
                Download {game.title}
              </a>
            ) : (
              <p className="text-muted text-sm">Download not available yet.</p>
            )}

            <div className="mt-6 space-y-3 text-sm">
              {game.created_at && (
                <div className="flex justify-between">
                  <span className="text-muted">Added</span>
                  <time dateTime={game.created_at}>{formatDate(game.created_at)}</time>
                </div>
              )}
            </div>
          </div>

          {news.length > 0 && (
            <div className="rounded-2xl bg-card border border-border p-6">
              <h2 className="font-semibold text-lg mb-4">Related News</h2>
              <div className="space-y-3">
                {news.map((article) => (
                  <Link
                    key={article.id}
                    href={`/news/${article.slug}`}
                    className="block p-3 rounded-lg hover:bg-surface transition-colors"
                  >
                    <p className="font-medium text-sm line-clamp-1">{article.title}</p>
                    <p className="text-xs text-muted mt-1">
                      {formatDate(article.published_at || article.created_at)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
