import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { FiArrowLeft } from "react-icons/fi";
import { marked } from "marked";
import { getContentSlugs, getNewsBySlug } from "@/lib/queries";
import { sanitizeContent } from "@/lib/sanitize";
import { formatDate } from "@/lib/date";

export const revalidate = 60;

export async function generateStaticParams() {
  const { news } = await getContentSlugs();
  return news.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);

  if (!article) return { title: "News" };

  return {
    title: article.title,
    description: article.excerpt || undefined,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt || undefined,
      images: article.featured_image ? [{ url: article.featured_image }] : undefined,
      publishedTime: article.published_at || undefined,
    },
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);

  if (!article) notFound();

  const rawHtml =
    article.content_format === "markdown"
      ? await marked.parse(article.content)
      : article.content;
  const contentHtml = sanitizeContent(rawHtml);
  const publishedAt = article.published_at || article.created_at;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/news"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to News
      </Link>

      <article>
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {article.game && (
              <Link
                href={`/games/${article.game.slug}`}
                className="px-3 py-1 rounded-md bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
              >
                {article.game.title}
              </Link>
            )}
            <time dateTime={publishedAt} className="text-sm text-muted">
              {formatDate(publishedAt)}
            </time>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
          {article.excerpt && (
            <p className="text-lg text-muted">{article.excerpt}</p>
          )}
        </header>

        {article.featured_image && (
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-8 border border-border">
            <Image
              src={article.featured_image}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        )}

        <div
          className="news-content prose max-w-none"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>
    </div>
  );
}
