import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://geomoneytv.com";

// Refresh the sitemap hourly (QA P0-3).
export const revalidate = 3600;

/** Static marketing/utility routes that should always be indexed. */
const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "hourly", priority: 1 },
  { path: "/news", changeFrequency: "hourly", priority: 0.9 },
  { path: "/world-monitor", changeFrequency: "daily", priority: 0.8 },
  { path: "/energy", changeFrequency: "daily", priority: 0.8 },
  { path: "/energy/coal", changeFrequency: "daily", priority: 0.6 },
  { path: "/energy/oil-and-gas", changeFrequency: "daily", priority: 0.6 },
  { path: "/energy/infrastructure", changeFrequency: "daily", priority: 0.6 },
  { path: "/energy/fossil-energy", changeFrequency: "daily", priority: 0.6 },
  { path: "/materials", changeFrequency: "daily", priority: 0.7 },
  { path: "/tools", changeFrequency: "weekly", priority: 0.6 },
  { path: "/videos", changeFrequency: "daily", priority: 0.6 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.4 },
  { path: "/about/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/about/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/about/ai-guidelines", changeFrequency: "monthly", priority: 0.3 },
  { path: "/about/refund-policy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/about/contact", changeFrequency: "monthly", priority: 0.3 },
  { path: "/features/newsletter", changeFrequency: "weekly", priority: 0.5 },
  { path: "/features/weekly-brief", changeFrequency: "weekly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let articleEntries: MetadataRoute.Sitemap = [];
  try {
    // Cap the per-file URL count at 5,000 as recommended; paginate further via
    // additional sitemap files if the archive grows past this window.
    const articles = await prisma.article.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    articleEntries = articles.map((article) => ({
      url: `${BASE_URL}/news/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // A database failure must not break robots/sitemap discovery entirely.
    articleEntries = [];
  }

  return [...staticEntries, ...articleEntries];
}
