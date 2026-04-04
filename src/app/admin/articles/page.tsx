"use client";

import { useEffect, useState } from "react";
import { Trash2, Edit, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  published: boolean;
  featured: boolean;
  createdAt: string;
  author: {
    name: string;
  };
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch("/api/admin/articles");
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/admin/news/sync", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message || "News synced successfully");
        fetchArticles();
      } else {
        alert(data.error || "Failed to sync news");
      }
    } catch (error) {
      console.error("Error syncing news:", error);
      alert("Error syncing news");
    } finally {
      setSyncing(false);
    }
  };

  const handlePublishAll = async () => {
    setPublishing(true);
    try {
      const response = await fetch("/api/admin/articles/publish-all", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message || "All articles published");
        fetchArticles();
      } else {
        alert(data.error || "Failed to publish articles");
      }
    } catch (error) {
      console.error("Error publishing articles:", error);
      alert("Error publishing articles");
    } finally {
      setPublishing(false);
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      const response = await fetch(`/api/admin/articles/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setArticles(articles.filter((article) => article.id !== id));
      } else {
        alert("Failed to delete article");
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("Error deleting article");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Articles
            <span className="text-sm font-normal bg-white/10 px-2 py-1 rounded max-w-fit">
              Admin Mode
            </span>
          </h1>
          <p className="mt-2 text-gray-400">
            Manage your content and sync settings
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-white hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync News"}
          </button>
          <button
            onClick={handlePublishAll}
            disabled={publishing}
            className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-4 py-2 text-green-400 hover:bg-green-500/20 disabled:opacity-50"
          >
            {publishing ? "Publishing..." : "Publish All"}
          </button>
          <a
            href="/admin/articles/new"
            className="rounded-md bg-geo-gold px-4 py-2 text-black hover:bg-yellow-500"
          >
            Create Article
          </a>
        </div>
      </div>

      {articles.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-white/5">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-white/10">
                  <td className="px-6 py-4 max-w-sm sm:max-w-md">
                    <div className="flex items-center">
                      <div>
                        <div
                          className="font-medium text-white truncate text-base"
                          title={article.title}
                        >
                          {article.title}
                        </div>
                        <div
                          className="text-xs text-gray-500 truncate"
                          title={article.slug}
                        >
                          {article.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className="rounded-full bg-geo-gold/20 px-2 py-1 text-xs text-geo-gold">
                      {article.category}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                    {article.author.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      {article.published && (
                        <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-500">
                          Published
                        </span>
                      )}
                      {article.featured && (
                        <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-500">
                          Featured
                        </span>
                      )}
                      {!article.published && (
                        <span className="rounded-full bg-gray-500/20 px-2 py-1 text-xs text-gray-500">
                          Draft
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                    {new Date(article.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="text-geo-gold hover:text-yellow-400"
                        title="Edit Article"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => deleteArticle(article.id)}
                        className="text-red-500 hover:text-red-400"
                        title="Delete Article"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
          <p className="text-gray-400">
            No articles yet. Create your first article!
          </p>
        </div>
      )}
    </div>
  );
}
