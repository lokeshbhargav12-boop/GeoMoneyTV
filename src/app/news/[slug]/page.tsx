import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, ExternalLink, Tag } from "lucide-react";
import NewsImage from "@/components/NewsImage";
import ArticleContent from "@/components/ArticleContent";

interface NewsPageProps {
  params: {
    slug: string;
  };
}

export default async function NewsArticlePage({ params }: NewsPageProps) {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug },
    include: { author: true },
  });

  if (!article) notFound();

  const articleImage =
    article.imageUrl && article.imageUrl.length > 0
      ? article.imageUrl
      : "/globe-placeholder.jpg";

  // Fetch related articles
  let relatedArticles: any[] = [];
  try {
    relatedArticles = await prisma.article.findMany({
      where: {
        published: true,
        category: article.category,
        id: { not: article.id },
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    });
  } catch {}

  return (
    <main className="min-h-screen bg-geo-dark text-white pt-28 pb-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to News
        </Link>

        <article>
          {/* Article Header */}
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-geo-gold text-black text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                <Tag className="w-3 h-3" />
                {article.category}
              </span>
              <div className="flex items-center text-gray-400 text-sm gap-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(article.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                {article.sourceName && (
                  <span className="text-geo-gold font-medium">
                    {article.sourceName}
                  </span>
                )}
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-8">
              {article.title}
            </h1>

            {article.description && (
              <p className="text-xl text-gray-300 leading-relaxed mb-8 border-l-4 border-geo-gold/30 pl-4">
                {article.description}
              </p>
            )}

            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/50">
              <NewsImage
                src={articleImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          </header>

          {/* Article Content — Client component that loads AI summary if truncated */}
          <ArticleContent
            articleId={article.id}
            content={article.content}
            aiSummary={article.aiSummary}
            title={article.title}
          />

          {/* Source Link */}
          {article.sourceUrl && (
            <div className="mb-12 p-6 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-2">
                Read Full Intelligence Briefing
              </h3>
              <p className="text-gray-400 mb-4 text-sm">
                Access the complete report and original data sources from{" "}
                {article.sourceName || "the publisher"}.
              </p>
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-geo-gold hover:bg-yellow-500 text-black font-bold rounded-xl transition-colors gap-2"
              >
                View Source Material <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="border-t border-white/10 pt-12">
              <h3 className="text-xl font-bold text-white mb-6">
                Related Intelligence
              </h3>
              <div className="grid gap-6 sm:grid-cols-3">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/news/${related.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-geo-gold/30 transition-all"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
                      <NewsImage
                        src={related.imageUrl || "/globe-placeholder.jpg"}
                        alt={related.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-geo-gold transition-colors">
                        {related.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(related.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </main>
  );
}
