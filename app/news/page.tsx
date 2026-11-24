import { getPublishedNews } from "@/lib/queries";
import NewsCard from "@/components/NewsCard";

export const metadata = {
  title: "News",
  description: "Latest news and updates from SM Studios",
};

export const revalidate = 60;

export default async function NewsPage() {
  const articles = await getPublishedNews();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">News &amp; Updates</h1>
        <p className="text-muted text-lg">
          Stay up to date with the latest from SM Studios.
        </p>
      </div>

      {articles.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📰</div>
          <h2 className="text-xl font-semibold mb-2">No news yet</h2>
          <p className="text-muted">
            We haven&apos;t posted any news yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
