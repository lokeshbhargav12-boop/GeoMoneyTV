import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";
import { Play, Film, Clapperboard, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Videos - GeoMoney TV",
    description: "Watch the latest geopolitical and financial analysis videos from GeoMoney TV.",
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
    const regularVideos = allVideos.filter((v) => v.videoType !== "short");
    const shorts = allVideos.filter((v) => v.videoType === "short");

    return (
        <div className="min-h-screen bg-geo-dark text-white pt-28 pb-24">
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

                {/* Navigation Chip Tabs */}
                <div className="flex flex-wrap gap-4 mb-10">
                    <a
                        href="#shorts"
                        className="group flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:border-geo-gold/50 hover:bg-white/10 transition-all cursor-pointer shadow-lg"
                    >
                        <Clapperboard className="w-5 h-5 text-geo-gold group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-white">Quick Briefing</span>
                        <span className="bg-white/10 text-gray-300 group-hover:bg-geo-gold/20 group-hover:text-geo-gold px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors">
                            {shorts.length}
                        </span>
                    </a>
                    <a
                        href="#long-videos"
                        className="group flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:border-geo-gold/50 hover:bg-white/10 transition-all cursor-pointer shadow-lg"
                    >
                        <Film className="w-5 h-5 text-geo-gold group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-white">Global Briefings</span>
                        <span className="bg-white/10 text-gray-300 group-hover:bg-geo-gold/20 group-hover:text-geo-gold px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors">
                            {regularVideos.length}
                        </span>
                    </a>
                </div>

                {/* YouTube Videos Section */}
                <section id="long-videos" className="mb-16 scroll-mt-32">
                    <div className="flex items-center gap-3 mb-8">
                        <Film className="w-6 h-6 text-geo-gold" />
                        <h2 className="text-2xl font-bold text-white">Global Briefings</h2>
                        <span className="ml-auto text-sm text-gray-500">{regularVideos.length} videos</span>
                    </div>

                    {regularVideos.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {regularVideos.map((video) => (
                                <a
                                    key={video.id}
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-geo-gold/30 hover:bg-white/10 transition-all"
                                >
                                    <div className="relative aspect-video overflow-hidden bg-gray-900">
                                        {video.thumbnail ? (
                                            <img
                                                src={video.thumbnail}
                                                alt={video.title}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gray-800">
                                                <span className="text-gray-500">No Thumbnail</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                                                <Play className="w-6 h-6 fill-current" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="mb-2 text-lg font-bold text-white line-clamp-2 group-hover:text-geo-gold transition-colors">
                                            {video.title}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {new Date(video.publishedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-500 rounded-xl bg-white/5 border border-white/10">
                            <Film className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>No videos yet. Add videos from the admin panel.</p>
                        </div>
                    )}
                </section>

                {/* YouTube Shorts Section */}
                <section id="shorts" className="scroll-mt-32">
                    <div className="flex items-center gap-3 mb-8">
                        <Clapperboard className="w-6 h-6 text-geo-gold" />
                        <h2 className="text-2xl font-bold text-white">Quick Briefings</h2>
                        <span className="ml-auto text-sm text-gray-500">{shorts.length} shorts</span>
                    </div>

                    {shorts.length > 0 ? (
                        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {shorts.map((video) => (
                                <a
                                    key={video.id}
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-geo-gold/30 hover:bg-white/10 transition-all"
                                >
                                    <div className="relative aspect-[9/16] overflow-hidden bg-gray-900">
                                        {video.thumbnail ? (
                                            <img
                                                src={video.thumbnail}
                                                alt={video.title}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gray-800">
                                                <span className="text-gray-500 text-xs">No Thumb</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                                                <Play className="w-4 h-4 fill-current" />
                                            </div>
                                        </div>
                                        {/* Shorts badge */}
                                        <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            SHORT
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-geo-gold transition-colors">
                                            {video.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(video.publishedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-500 rounded-xl bg-white/5 border border-white/10">
                            <Clapperboard className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>No shorts yet. Add shorts from the admin panel by setting video type to "Short".</p>
                        </div>
                    )}
                </section>

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
