"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string | null;
  source: string;
  videoType: string;
  publishedAt: string;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoType, setNewVideoType] = useState("video");
  const router = useRouter();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/admin/videos");
      const data = await res.json();
      setVideos(data);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/videos/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(`Synced successfully! Added ${data.added} new videos.\nDetected: ${data.videos || 0} regular videos, ${data.shorts || 0} shorts.`);
        fetchVideos();
      } else {
        alert("Sync failed");
      }
    } catch (error) {
      console.error("Error syncing:", error);
      alert("Error syncing videos");
    } finally {
      setSyncing(false);
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl || !newVideoTitle) return;

    // Extract video ID if it's a YouTube URL to generate thumbnail
    let thumbnail = null;
    const ytMatch = newVideoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch) {
      thumbnail = `https://i.ytimg.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }

    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newVideoTitle,
          url: newVideoUrl,
          thumbnail,
          source: "manual",
          videoType: newVideoType,
        }),
      });

      if (res.ok) {
        setNewVideoUrl("");
        setNewVideoTitle("");
        setNewVideoType("video");
        fetchVideos();
      } else {
        alert("Failed to add video");
      }
    } catch (error) {
      console.error("Error adding video:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const res = await fetch(`/api/admin/videos?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchVideos();
      } else {
        alert("Failed to delete video");
      }
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Manage Videos</h1>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="rounded bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "Sync from YouTube Channel"}
        </button>
      </div>

      <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Add Video Manually</h2>
        <form onSubmit={handleAddManual} className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Video Title"
            value={newVideoTitle}
            onChange={(e) => setNewVideoTitle(e.target.value)}
            className="flex-1 min-w-[200px] rounded bg-black/50 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-geo-gold"
            required
          />
          <input
            type="url"
            placeholder="YouTube URL"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            className="flex-1 min-w-[200px] rounded bg-black/50 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-geo-gold"
            required
          />
          <select
            value={newVideoType}
            onChange={(e) => setNewVideoType(e.target.value)}
            className="rounded bg-black/50 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-geo-gold border border-white/10"
          >
            <option value="video">Video</option>
            <option value="short">Short</option>
          </select>
          <button
            type="submit"
            className="rounded bg-geo-gold px-6 py-2 font-bold text-black hover:bg-yellow-500"
          >
            Add
          </button>
        </form>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <div key={video.id} className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
            {video.thumbnail && (
              <img src={video.thumbnail} alt={video.title} className="h-48 w-full object-cover" />
            )}
            <div className="p-4">
              <h3 className="mb-2 text-lg font-bold text-white line-clamp-2">{video.title}</h3>
              <div className="mb-4 flex items-center justify-between text-sm text-gray-400">
                <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${video.videoType === 'short' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>{video.videoType === 'short' ? 'Short' : 'Video'}</span>
                  <span className="capitalize">{video.source.replace("_", " ")}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-geo-gold hover:underline"
                >
                  Watch
                </a>
                <button
                  onClick={() => handleDelete(video.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
