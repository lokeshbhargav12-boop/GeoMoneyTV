import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import VideosBrowser, { type VideoItem } from "@/components/VideosBrowser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Watch the latest geopolitical and financial analysis videos from GeoMoney TV.",
  alternates: { canonical: "/videos" },
};

async function getVideos() {
  try {
    return await prisma.video.findMany({
      orderBy: { publishedAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function VideosPage() {
  const allVideos = await getVideos();

  const toItem = (video: (typeof allVideos)[number]): VideoItem => ({
    id: video.id,
    title: video.title,
    url: video.url,
    thumbnail: video.thumbnail,
    publishedAt: video.publishedAt.toISOString(),
  });

  const regularVideos = allVideos.filter((v) => v.videoType !== "short").map(toItem);
  const shorts = allVideos.filter((v) => v.videoType === "short").map(toItem);

  return (
    <div className="min-h-screen bg-geo-dark text-white pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-geo-gold mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              GeoMoney TV
            </span>
          </h1>
          <p className="mt-2 text-gray-400">
            Geopolitical analysis and market intelligence on YouTube
          </p>
        </div>

        {/* Tabbed browser: only the active tab's list is rendered */}
        <VideosBrowser regularVideos={regularVideos} shorts={shorts} />

        {/* YouTube Channel CTA */}
        <div className="mt-16 text-center">
          <a
            href="https://www.youtube.com/channel/UCGb6oaBpGLmLYnxUHmLXFAQ"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Subscribe on YouTube
          </a>
        </div>
      </div>
    </div>
  );
}
