"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  Image as ImageIcon,
  Instagram,
  Linkedin,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  XCircle,
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
  provider?: string;
  textModel?: string;
  imageProvider?: string;
  imageModel?: string;
  templateId?: string;
  templateName?: string;
}

interface SocialPostTemplate {
  id: string;
  name: string;
  body: string;
  imageStyle: string;
}

interface SocialPostGeneratorSettings {
  provider: "openrouter" | "huggingface";
  textModel: string;
  imageProvider: "huggingface" | "webhook" | "none";
  imageModel: string;
  activeTemplateId: string;
  templates: SocialPostTemplate[];
}

interface ModelOptions {
  openrouter: string[];
  huggingfaceText: string[];
  huggingfaceImage: string[];
}

function parsePostText(text: string): ParsedText {
  try {
    const parsed = JSON.parse(text);
    return {
      shortText: parsed.shortText || "",
      longText: parsed.longText || "",
      provider: parsed.provider,
      textModel: parsed.textModel,
      imageProvider: parsed.imageProvider,
      imageModel: parsed.imageModel,
      templateId: parsed.templateId,
      templateName: parsed.templateName,
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
  const [settings, setSettings] = useState<SocialPostGeneratorSettings | null>(
    null,
  );
  const [modelOptions, setModelOptions] = useState<ModelOptions | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

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

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/social-posts/settings");
      if (!res.ok) throw new Error("Failed to load generator settings");
      const data = await res.json();
      setSettings(data.settings);
      setModelOptions(data.modelOptions);
      setSelectedTemplateId(data.settings.activeTemplateId);
    } catch (err) {
      console.error("Failed to fetch social post settings:", err);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (nextSettings?: SocialPostGeneratorSettings) => {
    const payload = nextSettings || settings;
    if (!payload) return;

    setSettingsSaving(true);
    try {
      const res = await fetch("/api/admin/social-posts/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to save generator settings");
        return;
      }
      setSettings(data.settings);
      setSelectedTemplateId(data.settings.activeTemplateId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSettingsSaving(false);
    }
  };

  const doAction = async (
    action: string,
    postId?: string,
    extra?: Record<string, unknown>,
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
      await fetchPosts();
    } catch (err) {
      alert(
        "Action failed: " + (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const generateWithCurrentSettings = async () => {
    if (!settings) return;
    const nextSettings = {
      ...settings,
      activeTemplateId: selectedTemplateId || settings.activeTemplateId,
    };
    setSettings(nextSettings);
    await saveSettings(nextSettings);
    await doAction("generate", undefined, {
      generatorSettings: nextSettings,
      templateId: selectedTemplateId || nextSettings.activeTemplateId,
      platforms: ["x", "linkedin", "instagram"],
    });
  };

  const regenerateWithCurrentSettings = async (postId: string) => {
    if (!settings) return;
    await doAction("retry", postId, {
      generatorSettings: settings,
      templateId: selectedTemplateId || settings.activeTemplateId,
    });
  };

  const doDelete = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/admin/social-posts?id=${postId}`, {
        method: "DELETE",
      });
      if (res.ok) await fetchPosts();
    } catch {
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

  const updateSettings = <K extends keyof SocialPostGeneratorSettings>(
    key: K,
    value: SocialPostGeneratorSettings[K],
  ) => {
    setSettings((current) =>
      current ? { ...current, [key]: value } : current,
    );
  };

  const updateTemplate = (
    templateId: string,
    patch: Partial<SocialPostTemplate>,
  ) => {
    setSettings((current) => {
      if (!current) return current;
      return {
        ...current,
        templates: current.templates.map((template) =>
          template.id === templateId ? { ...template, ...patch } : template,
        ),
      };
    });
  };

  const addTemplate = () => {
    const templateId = `template-${Date.now()}`;
    const nextTemplate: SocialPostTemplate = {
      id: templateId,
      name: "New Template",
      body: "Write a concise, market-aware post that fits GeoMoney tone.",
      imageStyle:
        "Professional editorial visual, realistic, polished, data-aware.",
    };
    setSettings((current) => {
      if (!current) return current;
      return {
        ...current,
        templates: [...current.templates, nextTemplate],
        activeTemplateId: templateId,
      };
    });
    setSelectedTemplateId(templateId);
  };

  const removeTemplate = (templateId: string) => {
    setSettings((current) => {
      if (!current || current.templates.length <= 1) return current;
      const templates = current.templates.filter(
        (template) => template.id !== templateId,
      );
      const activeTemplateId =
        current.activeTemplateId === templateId
          ? templates[0].id
          : current.activeTemplateId;
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(templates[0].id);
      }
      return {
        ...current,
        templates,
        activeTemplateId,
      };
    });
  };

  const selectedTemplate = settings?.templates.find(
    (template) => template.id === selectedTemplateId,
  );
  const currentTextModels =
    settings?.provider === "huggingface"
      ? modelOptions?.huggingfaceText || []
      : modelOptions?.openrouter || [];
  const currentImageModels = modelOptions?.huggingfaceImage || [];

  return (
    <div className="mx-auto max-w-7xl p-8 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-geo-gold" />
            Social Media Generator
          </h1>
          <p className="mt-1 text-gray-400">
            Build image-first social posts, switch free AI providers, edit
            templates, and regenerate until the admin approves.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              fetchPosts();
              fetchSettings();
            }}
            disabled={loading || settingsLoading}
            className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading || settingsLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={generateWithCurrentSettings}
            disabled={
              !settings || actionLoading === "generate" || settingsSaving
            }
            className="flex items-center gap-2 rounded-lg bg-geo-gold/90 hover:bg-geo-gold text-black font-semibold px-5 py-2 transition-all disabled:opacity-50"
          >
            {actionLoading === "generate" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate Media Post
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-white/10 bg-black/40 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Generator Controls
              </h2>
              <p className="text-sm text-gray-400">
                Pick a free text model, a free image path, and the template this
                admin panel should use.
              </p>
            </div>
            <button
              onClick={() => saveSettings(settings || undefined)}
              disabled={!settings || settingsSaving}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-50"
            >
              {settingsSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Setup
            </button>
          </div>

          {settingsLoading || !settings ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="text-gray-400">Text Provider</span>
                  <select
                    value={settings.provider}
                    onChange={(e) =>
                      updateSettings(
                        "provider",
                        e.target
                          .value as SocialPostGeneratorSettings["provider"],
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                  >
                    <option value="openrouter">OpenRouter free models</option>
                    <option value="huggingface">
                      Hugging Face free models
                    </option>
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-gray-400">Text Model</span>
                  <select
                    value={settings.textModel}
                    onChange={(e) =>
                      updateSettings("textModel", e.target.value)
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                  >
                    {currentTextModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-gray-400">Image Provider</span>
                  <select
                    value={settings.imageProvider}
                    onChange={(e) =>
                      updateSettings(
                        "imageProvider",
                        e.target
                          .value as SocialPostGeneratorSettings["imageProvider"],
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                  >
                    <option value="huggingface">
                      Hugging Face image generation
                    </option>
                    <option value="webhook">
                      External webhook image generation
                    </option>
                    <option value="none">No image</option>
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-gray-400">Image Model</span>
                  <select
                    value={settings.imageModel}
                    onChange={(e) =>
                      updateSettings("imageModel", e.target.value)
                    }
                    disabled={settings.imageProvider !== "huggingface"}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none disabled:opacity-50"
                  >
                    {currentImageModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-white">Template Library</h3>
                    <p className="text-sm text-gray-400">
                      Each template changes both the text angle and the media
                      direction.
                    </p>
                  </div>
                  <button
                    onClick={addTemplate}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                  >
                    <Plus className="w-4 h-4" />
                    Add Template
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {settings.templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplateId(template.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-all ${selectedTemplateId === template.id ? "border-geo-gold/50 bg-geo-gold/15 text-geo-gold" : "border-white/10 bg-black/20 text-gray-300 hover:bg-white/10"}`}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>

                {selectedTemplate && (
                  <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
                    <div className="space-y-4">
                      <label className="block space-y-2 text-sm">
                        <span className="text-gray-400">Template Name</span>
                        <input
                          value={selectedTemplate.name}
                          onChange={(e) =>
                            updateTemplate(selectedTemplate.id, {
                              name: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
                        />
                      </label>
                      <label className="block space-y-2 text-sm">
                        <span className="text-gray-400">Text Template</span>
                        <textarea
                          value={selectedTemplate.body}
                          onChange={(e) =>
                            updateTemplate(selectedTemplate.id, {
                              body: e.target.value,
                            })
                          }
                          rows={6}
                          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none resize-none"
                        />
                      </label>
                      <label className="block space-y-2 text-sm">
                        <span className="text-gray-400">Media Image Style</span>
                        <textarea
                          value={selectedTemplate.imageStyle}
                          onChange={(e) =>
                            updateTemplate(selectedTemplate.id, {
                              imageStyle: e.target.value,
                            })
                          }
                          rows={4}
                          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none resize-none"
                        />
                      </label>
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      <button
                        onClick={() => {
                          updateSettings(
                            "activeTemplateId",
                            selectedTemplate.id,
                          );
                          setSelectedTemplateId(selectedTemplate.id);
                        }}
                        className="rounded-lg border border-geo-gold/30 bg-geo-gold/10 px-3 py-2 text-sm text-geo-gold hover:bg-geo-gold/20"
                      >
                        Use This Template
                      </button>
                      <button
                        onClick={() => removeTemplate(selectedTemplate.id)}
                        disabled={settings.templates.length <= 1}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20 disabled:opacity-40"
                      >
                        Delete Template
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">
                <div className="font-medium">Free setup notes</div>
                <div className="mt-2 text-emerald-200/90">
                  OpenRouter free models need an OpenRouter API key. Hugging
                  Face free models need a Hugging Face token. Both stay on the
                  free tier if your usage is modest. Hugging Face image
                  generation removes the need for a paid image service.
                </div>
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/40 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              What the generator builds
            </h2>
            <p className="text-sm text-gray-400">
              Each run produces a media image prompt first, then the short and
              long text variants for review.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <ImageIcon className="w-4 h-4 text-geo-gold" />
              Media image
            </div>
            <p className="mt-2 text-sm text-gray-400">
              The selected template’s image style is combined with the day’s
              data to generate a realistic editorial visual.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Sparkles className="w-4 h-4 text-geo-gold" />
              Text package
            </div>
            <p className="mt-2 text-sm text-gray-400">
              The admin panel stores a short X-ready version and a longer
              LinkedIn/Instagram version. If you dislike the output, press
              regenerate as many times as needed.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300 space-y-2">
            <div className="font-medium text-white">Recommended first test</div>
            <div>1. Save your provider, model, and template.</div>
            <div>2. Click Generate Media Post.</div>
            <div>3. Review the image and text below.</div>
            <div>4. Click Regenerate until the admin likes it.</div>
            <div>5. Approve and publish.</div>
          </div>
        </section>
      </div>

      <div className="flex items-center gap-2">
        {["", "pending", "approved", "published", "rejected"].map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilterStatus(status);
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all border ${filterStatus === status ? "bg-geo-gold/20 text-geo-gold border-geo-gold/40" : "bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10"}`}
          >
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : "All"}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500">{total} total</span>
      </div>

      {loading && posts.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-geo-gold" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No social posts yet</p>
          <p className="text-sm mt-1">
            Generate a media post from the studio above to create your first
            image-plus-text campaign.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const parsed = parsePostText(post.text);
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
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <StatusBadge status={post.status} />
                      <div className="flex items-center gap-1.5">
                        {platforms.map((platform) => (
                          <PlatformIcon key={platform} platform={platform} />
                        ))}
                      </div>
                      {post.retryCount > 0 && (
                        <span className="text-xs text-gray-500">
                          Retry #{post.retryCount}
                        </span>
                      )}
                      {parsed.templateName && (
                        <span className="text-xs rounded-full border border-white/10 bg-white/5 px-2 py-1 text-gray-300">
                          {parsed.templateName}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
                    <div className="space-y-3">
                      {post.imageUrl ? (
                        <div className="rounded-lg overflow-hidden border border-white/10 bg-black/30">
                          <img
                            src={post.imageUrl}
                            alt="Post image"
                            className="w-full h-72 object-cover"
                          />
                        </div>
                      ) : (
                        <div className="rounded-lg border border-white/10 bg-white/5 h-72 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No image generated</p>
                          </div>
                        </div>
                      )}

                      {post.imagePrompt && (
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <div className="text-xs font-medium text-gray-400">
                            Media prompt
                          </div>
                          <p className="mt-2 text-xs text-gray-300 whitespace-pre-wrap">
                            {post.imagePrompt}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                        {parsed.provider && (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                            Text: {parsed.provider} / {parsed.textModel}
                          </span>
                        )}
                        {parsed.imageProvider && (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                            Image: {parsed.imageProvider}
                            {parsed.imageModel ? ` / ${parsed.imageModel}` : ""}
                          </span>
                        )}
                      </div>

                      {isEditing ? (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              X/Twitter text
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
                              LinkedIn/Instagram text
                            </label>
                            <textarea
                              value={editLong}
                              onChange={(e) => setEditLong(e.target.value)}
                              rows={6}
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
                            <p className="text-sm text-gray-200 bg-white/5 rounded-lg p-3 border border-white/5 whitespace-pre-wrap">
                              {parsed.shortText || (
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
                              {parsed.longText || (
                                <em className="text-gray-500">No long text</em>
                              )}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {post.publishLog && (
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <h4 className="text-xs font-medium text-gray-400 mb-2">
                        Publish Results
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(post.publishLog).map(
                          (result: any, index: number) => (
                            <span
                              key={index}
                              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${result.success ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}
                            >
                              <PlatformIcon platform={result.platform} />
                              {result.success
                                ? "Sent"
                                : result.error?.slice(0, 40) || "Failed"}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/5 flex flex-wrap gap-2">
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
                          onClick={() => regenerateWithCurrentSettings(post.id)}
                          disabled={isLoading || !settings}
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
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-gray-500 border border-white/10 rounded-lg text-sm hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 disabled:opacity-50"
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

      {total > 20 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage((current) => current + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
