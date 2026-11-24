import Link from "next/link";
import Image from "next/image";
import type { NewsSummary } from "@/lib/types";
import { formatDate } from "@/lib/date";

export default function NewsCard({ article }: { article: NewsSummary }) {
  const date = formatDate(article.published_at || article.created_at);

  return (
    <div className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
      {article.featured_image && (
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={article.featured_image}
            alt={article.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          {article.game && (
            <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-xs font-medium">
              {article.game.title}
            </span>
          )}
          <time dateTime={article.published_at || article.created_at} className="text-xs text-muted">
            {date}
          </time>
        </div>
        <h3 className="font-semibold text-lg mb-2 group-hover:text-accent transition-colors">
          <Link href={`/news/${article.slug}`}>{article.title}</Link>
        </h3>
        {article.excerpt && (
          <p className="text-muted text-sm line-clamp-3">{article.excerpt}</p>
        )}
        <Link
          href={`/news/${article.slug}`}
          className="inline-flex items-center mt-3 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
        >
          Read more →
        </Link>
      </div>
    </div>
  );
}
