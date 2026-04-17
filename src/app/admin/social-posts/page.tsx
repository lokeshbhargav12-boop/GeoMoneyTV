"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Send,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Trash2,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Linkedin,
  Instagram,
} from "lucide-react";

interface SocialPost {
  id: string;
  text: string;
  imageUrl: string | null;
  imagePrompt: string | null;
  status: string;
  platforms: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  emailSent: boolean;
  retryCount: number;
  publishLog: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ParsedText {
  shortText: string;
  longText: string;
}

function parsePostText(text: string): ParsedText {
  try {
    const parsed = JSON.parse(text);
    return {
      shortText: parsed.shortText || "",
      longText: parsed.longText || "",
    };
  } catch {
    return { shortText: text.slice(0, 280), longText: text };
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    published: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-3 h-3" />,
    approved: <CheckCircle className="w-3 h-3" />,
    published: <Send className="w-3 h-3" />,
    rejected: <XCircle className="w-3 h-3" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${styles[status] || styles.pending}`}
    >
      {icons[status] || icons.pending}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function PlatformIcon({ platform }: { platform: string }) {
  switch (platform) {
    case "linkedin":
      return <Linkedin className="w-4 h-4 text-blue-400" />;
    case "x":
      return <span className="text-white font-bold text-xs">𝕏</span>;
    case "instagram":
      return <Instagram className="w-4 h-4 text-pink-400" />;
    default:
      return <span className="text-xs text-gray-400">{platform}</span>;
  }
}

export default function SocialPostsAdmin() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editShort, setEditShort] = useState("");
  const [editLong, setEditLong] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/admin/social-posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const doAction = async (
    action: string,
    postId?: string,
    extra?: Record<string, any>,
  ) => {
    setActionLoading(postId || action);
    try {
      const res = await fetch("/api/admin/social-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, postId, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Action failed");
        return;
      }
      fetchPosts();
    } catch (err) {
      alert(
        "Action failed: " + (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const doDelete = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/admin/social-posts?id=${postId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchPosts();
    } catch (err) {
      alert("Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (post: SocialPost) => {
    const { shortText, longText } = parsePostText(post.text);
    setEditingPost(post.id);
    setEditShort(shortText);
    setEditLong(longText);
  };

  const saveEdit = async (postId: string) => {
    await doAction("update-text", postId, {
      text: JSON.stringify({ shortText: editShort, longText: editLong }),
    });
    setEditingPost(null);
  };

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-geo-gold" />
            Social Media Posts
          </h1>
          <p className="mt-1 text-gray-400">
            AI-generated social posts for LinkedIn, X, and Instagram
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPosts}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => doAction("generate")}
            disabled={actionLoading === "generate"}
            className="flex items-center gap-2 rounded-lg bg-geo-gold/90 hover:bg-geo-gold text-black font-semibold px-5 py-2 transition-all disabled:opacity-50"
          >
            {actionLoading === "generate" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate Post
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-2">
        {["", "pending", "approved", "published", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setFilterStatus(s);
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all border ${
              filterStatus === s
                ? "bg-geo-gold/20 text-geo-gold border-geo-gold/40"
                : "bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10"
            }`}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500">{total} total</span>
      </div>

      {/* Posts List */}
      {loading && posts.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-geo-gold" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No social posts yet</p>
          <p className="text-sm mt-1">
            Click &quot;Generate Post&quot; to create your first AI-powered
            social media post.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const { shortText, longText } = parsePostText(post.text);
            const platforms: string[] = post.platforms
              ? JSON.parse(post.platforms)
              : [];
            const isEditing = editingPost === post.id;
            const isLoading = actionLoading === post.id;

            return (
              <div
                key={post.id}
                className="rounded-xl bg-black/40 border border-white/10 overflow-hidden"
              >
                <div className="p-6">
                  {/* Post Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={post.status} />
                      <div className="flex items-center gap-1.5">
                        {platforms.map((p) => (
                          <PlatformIcon key={p} platform={p} />
                        ))}
                      </div>
                      {post.retryCount > 0 && (
                        <span className="text-xs text-gray-500">
                          Retry #{post.retryCount}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Text Content */}
                    <div className="lg:col-span-2 space-y-4">
                      {isEditing ? (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              X/Twitter (max 280 chars)
                            </label>
                            <textarea
                              value={editShort}
                              onChange={(e) => setEditShort(e.target.value)}
                              maxLength={280}
                              rows={3}
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white resize-none focus:border-geo-gold/50 focus:outline-none"
                            />
                            <span className="text-xs text-gray-500">
                              {editShort.length}/280
                            </span>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              LinkedIn/Instagram
                            </label>
                            <textarea
                              value={editLong}
                              onChange={(e) => setEditLong(e.target.value)}
                              rows={5}
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white resize-none focus:border-geo-gold/50 focus:outline-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(post.id)}
                              className="px-3 py-1.5 bg-geo-gold/20 text-geo-gold border border-geo-gold/30 rounded-lg text-sm hover:bg-geo-gold/30"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPost(null)}
                              className="px-3 py-1.5 bg-white/5 text-gray-400 border border-white/10 rounded-lg text-sm hover:bg-white/10"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <h4 className="text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                              <span className="font-bold text-white">𝕏</span>{" "}
                              X/Twitter
                            </h4>
                            <p className="text-sm text-gray-200 bg-white/5 rounded-lg p-3 border border-white/5">
                              {shortText || (
                                <em className="text-gray-500">No short text</em>
                              )}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                              <Linkedin className="w-3 h-3" /> LinkedIn /{" "}
                              <Instagram className="w-3 h-3" /> Instagram
                            </h4>
                            <p className="text-sm text-gray-200 bg-white/5 rounded-lg p-3 border border-white/5 whitespace-pre-wrap">
                              {longText || (
                                <em className="text-gray-500">No long text</em>
                              )}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Image */}
                    <div>
                      {post.imageUrl ? (
                        <div className="rounded-lg overflow-hidden border border-white/10">
                          <img
                            src={post.imageUrl}
                            alt="Post image"
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      ) : (
                        <div className="rounded-lg border border-white/10 bg-white/5 h-48 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No image generated</p>
                          </div>
                        </div>
                      )}
                      {post.imagePrompt && (
                        <p
                          className="mt-2 text-xs text-gray-500 line-clamp-2"
                          title={post.imagePrompt}
                        >
                          Prompt: {post.imagePrompt}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Publish Log */}
                  {post.publishLog && (
                    <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
                      <h4 className="text-xs font-medium text-gray-400 mb-2">
                        Publish Results
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(post.publishLog).map(
                          (r: any, i: number) => (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                                r.success
                                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                                  : "bg-red-500/10 text-red-400 border-red-500/30"
                              }`}
                            >
                              <PlatformIcon platform={r.platform} />
                              {r.success
                                ? "Sent"
                                : r.error?.slice(0, 40) || "Failed"}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                    {post.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            doAction("approve-and-publish", post.id)
                          }
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/30 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ThumbsUp className="w-3 h-3" />
                          )}
                          Approve & Publish
                        </button>
                        <button
                          onClick={() => doAction("approve", post.id)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-500/30 disabled:opacity-50"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          Approve Only
                        </button>
                        <button
                          onClick={() => doAction("reject", post.id)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/30 disabled:opacity-50"
                        >
                          <ThumbsDown className="w-3 h-3" />
                          Reject
                        </button>
                        <button
                          onClick={() => doAction("retry", post.id)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm hover:bg-yellow-500/30 disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Regenerate
                        </button>
                        <button
                          onClick={() => startEdit(post)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-gray-400 border border-white/10 rounded-lg text-sm hover:bg-white/10"
                        >
                          Edit Text
                        </button>
                      </>
                    )}
                    {post.status === "approved" && (
                      <button
                        onClick={() => doAction("publish", post.id)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/30 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        Publish Now
                      </button>
                    )}
                    <button
                      onClick={() => doDelete(post.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-gray-500 border border-white/10 rounded-lg text-sm hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 ml-auto disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}

      {/* n8n Integration Info */}
      <div className="mt-10 rounded-xl bg-black/40 border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-geo-gold" />
          n8n Workflow Integration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white/5 rounded-lg p-4 border border-white/5">
            <h4 className="font-medium text-geo-gold mb-2">
              Daily Generation (Cron)
            </h4>
            <p className="text-gray-400 mb-2">
              n8n calls this endpoint daily at 12:00 AM IST:
            </p>
            <code className="text-xs bg-black/60 text-green-400 px-2 py-1 rounded block break-all">
              POST /api/cron/social-post
            </code>
            <p className="text-xs text-gray-500 mt-2">
              Auth: Bearer token via{" "}
              <code className="text-gray-400">N8N_WEBHOOK_SECRET</code>
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/5">
            <h4 className="font-medium text-geo-gold mb-2">
              Email Approval (Reply YES)
            </h4>
            <p className="text-gray-400 mb-2">
              n8n monitors inbox and calls this on &quot;YES&quot; reply:
            </p>
            <code className="text-xs bg-black/60 text-green-400 px-2 py-1 rounded block break-all">
              POST /api/cron/social-post/approve
            </code>
            <p className="text-xs text-gray-500 mt-2">
              Publishing via:{" "}
              <code className="text-gray-400">N8N_SOCIAL_PUBLISH_WEBHOOK</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
