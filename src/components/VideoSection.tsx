import { prisma } from "@/lib/prisma";

export default async function VideoSection() {
  const videos = await prisma.video.findMany({
    orderBy: { publishedAt: "desc" },
    take: 6,
  });

  if (videos.length === 0) return null;

  return (
    <section className="border-t border-white/10 bg-black py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tighter text-white">Latest Videos</h2>
          <a
            href="https://www.youtube.com/channel/UCGb6oaBpGLmLYnxUHmLXFAQ"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-geo-gold hover:text-white"
          >
            View All on YouTube →
          </a>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <a
              key={video.id}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block overflow-hidden rounded-lg bg-white/5 transition-colors hover:bg-white/10"
            >
              <div className="relative aspect-video overflow-hidden">
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
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                    <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="mb-2 text-lg font-bold text-white line-clamp-2 group-hover:text-geo-gold">
                  {video.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {new Date(video.publishedAt).toLocaleDateString()}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
