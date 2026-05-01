import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Clock } from "lucide-react";
import NewsImage from "./NewsImage";

async function getArticles(query?: string) {
  try {
    const where: any = {
      published: true,
    };

    if (query) {
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
      ];
    }

    const articles = await prisma.article.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        imageUrl: true,
        sourceName: true,
        category: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    });
    return articles;
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return [];
  }
}

export default async function NewsGrid({
  searchQuery,
}: {
  searchQuery?: string;
}) {
  const articles = await getArticles(searchQuery);

  if (articles.length === 0) {
    return (
      <section
        id="news-grid"
        className="bg-geo-dark px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {searchQuery ? `No results for "${searchQuery}"` : "Latest News"}
          </h2>
          <p className="mt-4 text-gray-400">
            {searchQuery
              ? "Try searching for something else."
              : "No news articles found. Sync them from the admin panel."}
          </p>
          {searchQuery && (
            <Link
              href="/"
              className="mt-4 inline-block text-geo-gold hover:underline"
            >
              Clear Search
            </Link>
          )}
        </div>
      </section>
    );
  }

  // First article is featured
  const featuredArticle = articles[0];
  const remainingArticles = articles.slice(1);

  return (
    <section
      id="news-grid"
      className="bg-geo-dark px-4 py-20 sm:px-6 lg:px-8 relative"
    >
      {/* Background gradient/glow effect */}
      <div className="absolute top-0 left-1/2 -px-64 h-96 w-96 -translate-x-1/2 rounded-full bg-geo-gold/10 blur-[128px]" />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="mb-12 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl group cursor-pointer">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent group-hover:from-geo-gold group-hover:to-yellow-500 transition-all duration-300">
                {searchQuery ? `Intel on "${searchQuery}"` : "Latest Intel"}
              </span>
            </h2>
            {searchQuery && (
              <Link
                href="/"
                scroll={false}
                className="text-sm text-gray-500 hover:text-geo-gold mt-1"
              >
                ← Clear Search
              </Link>
            )}
          </div>
          <Link
            href="/news"
            className="text-sm font-semibold text-geo-gold hover:text-yellow-400 flex items-center gap-1 transition-colors"
          >
            View All Notes
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Featured Article (Large, Left side on large screens) */}
          <div className="lg:col-span-2">
            <Link
              href={`/news/${featuredArticle.slug}`}
              className="group relative block h-full overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-geo-gold/50 transition-colors"
            >
              <div className="h-[400px] w-full overflow-hidden bg-gray-900 relative">
                {/* Image with fallback */}
                <NewsImage
                  src={featuredArticle.imageUrl || "/globe-placeholder.jpg"}
                  alt={featuredArticle.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-8">
                <div className="mb-4 flex items-center gap-4">
                  <span className="rounded-full bg-geo-gold px-3 py-1 text-xs font-bold text-black uppercase tracking-wider">
                    {featuredArticle.category}
                  </span>
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(featuredArticle.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-geo-gold transition-colors block">
                  {featuredArticle.title}
                </h3>
                <p className="line-clamp-2 text-gray-300">
                  {featuredArticle.description ||
                    "Read the full article for details."}
                  ...
                </p>
              </div>
            </Link>
          </div>

          {/* Side Articles */}
          <div className="flex flex-col gap-6">
            {remainingArticles.map((article) => (
              <Link
                href={`/news/${article.slug}`}
                key={article.id}
                className="group relative flex gap-4 overflow-hidden rounded-xl bg-white/5 p-4 border border-white/10 hover:border-geo-gold/30 hover:bg-white/10 transition-all"
              >
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-900">
                  <NewsImage
                    src={article.imageUrl || "/globe-placeholder.jpg"}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-between py-1">
                  <div>
                    <span className="mb-2 block text-xs font-bold text-geo-gold uppercase tracking-wider">
                      {article.category}
                    </span>
                    <h4 className="line-clamp-2 text-sm font-bold text-white group-hover:text-geo-gold transition-colors">
                      {article.title}
                    </h4>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(article.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
