"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Upload, X, ImageIcon, Film } from "lucide-react";

type CarouselMediaType = "image" | "video";
const MIN_VIDEO_DURATION_SECONDS = 1;
const MAX_VIDEO_DURATION_SECONDS = 45;
const DEFAULT_VIDEO_DURATION_SECONDS = 15;

interface CarouselSlide {
  url: string;
  title: string;
  subtitle: string;
  mediaType: CarouselMediaType;
  videoDurationSec: number | null;
}

const createEmptySlide = (): CarouselSlide => ({
  url: "",
  title: "",
  subtitle: "",
  mediaType: "image",
  videoDurationSec: null,
});

const inferMediaTypeFromUrl = (url: string): CarouselMediaType =>
  /\.(mp4|webm|mov)(\?.*)?$/i.test(url) ? "video" : "image";

const inferMediaTypeFromFile = (file: File): CarouselMediaType =>
  file.type.startsWith("video/") ? "video" : "image";

const clampVideoDuration = (value: number): number =>
  Math.min(MAX_VIDEO_DURATION_SECONDS, Math.max(MIN_VIDEO_DURATION_SECONDS, Math.round(value)));

const normalizeVideoDuration = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clampVideoDuration(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return clampVideoDuration(parsed);
    }
  }

  return null;
};

const normalizeSlide = (slide: unknown): CarouselSlide => {
  if (!slide || typeof slide !== "object") {
    return createEmptySlide();
  }

  const rawSlide = slide as Partial<CarouselSlide> & {
    videoDurationSec?: unknown;
  };
  const url = typeof rawSlide.url === "string" ? rawSlide.url : "";
  const title = typeof rawSlide.title === "string" ? rawSlide.title : "";
  const subtitle = typeof rawSlide.subtitle === "string" ? rawSlide.subtitle : "";
  const mediaType =
    rawSlide.mediaType === "video" || rawSlide.mediaType === "image"
      ? rawSlide.mediaType
      : inferMediaTypeFromUrl(url);
  const videoDurationSec =
    mediaType === "video"
      ? normalizeVideoDuration(rawSlide.videoDurationSec) ??
        DEFAULT_VIDEO_DURATION_SECONDS
      : null;

  return { url, title, subtitle, mediaType, videoDurationSec };
};

const defaultSlides = (): CarouselSlide[] =>
  Array(5)
    .fill(null)
    .map(() => createEmptySlide());

export default function HomepageAdminPage() {
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [newsletterTitle, setNewsletterTitle] = useState("");
  const [newsletterSubtitle, setNewsletterSubtitle] = useState("");
  const [partnerLogos, setPartnerLogos] = useState("");
  const [footerText, setFooterText] = useState("");
  const [carouselSlides, setCarouselSlides] =
    useState<CarouselSlide[]>(defaultSlides());
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [homepageRes, carouselRes] = await Promise.all([
        fetch("/api/admin/settings/homepage"),
        fetch("/api/admin/settings/hero-carousel"),
      ]);
      const homepageData = await homepageRes.json();
      const carouselData = await carouselRes.json();

      setHeroTitle(homepageData.heroTitle || "");
      setHeroSubtitle(homepageData.heroSubtitle || "");
      setNewsletterTitle(homepageData.newsletterTitle || "");
      setNewsletterSubtitle(homepageData.newsletterSubtitle || "");
      setPartnerLogos(homepageData.partnerLogos || "");
      setFooterText(homepageData.footerText || "");
      if (Array.isArray(carouselData.slides)) {
        const normalizedSlides = carouselData.slides
          .map((slide: unknown) => normalizeSlide(slide))
          .slice(0, 5);

        while (normalizedSlides.length < 5) {
          normalizedSlides.push(createEmptySlide());
        }

        setCarouselSlides(normalizedSlides);
      }
    } catch (error) {
      console.error("Error fetching homepage settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlideMediaUpload = async (index: number, file: File) => {
    setUploadingSlot(index);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Upload failed");
        return;
      }
      const data = await res.json();
      const mediaType: CarouselMediaType =
        data.mediaType === "video" || data.mediaType === "image"
          ? data.mediaType
          : inferMediaTypeFromFile(file);

      setCarouselSlides((prev) =>
        prev.map((s, i) =>
          i === index
            ? {
                ...s,
                url: data.url || "",
                mediaType,
                videoDurationSec:
                  mediaType === "video"
                    ? s.videoDurationSec ?? DEFAULT_VIDEO_DURATION_SECONDS
                    : null,
              }
            : s,
        ),
      );
    } catch {
      alert("Failed to upload media");
    } finally {
      setUploadingSlot(null);
    }
  };

  const updateSlideText = (
    index: number,
    field: "title" | "subtitle",
    value: string,
  ) => {
    setCarouselSlides((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  const updateSlideVideoDuration = (index: number, value: string) => {
    const parsed = Number(value);
    const normalizedDuration = Number.isFinite(parsed)
      ? clampVideoDuration(parsed)
      : DEFAULT_VIDEO_DURATION_SECONDS;

    setCarouselSlides((prev) =>
      prev.map((s, i) =>
        i === index
          ? {
              ...s,
              videoDurationSec:
                s.mediaType === "video" ? normalizedDuration : null,
            }
          : s,
      ),
    );
  };

  const clearSlide = (index: number) => {
    setCarouselSlides((prev) =>
      prev.map((s, i) => (i === index ? createEmptySlide() : s)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const [homepageRes, carouselRes] = await Promise.all([
        fetch("/api/admin/settings/homepage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            heroTitle,
            heroSubtitle,
            newsletterTitle,
            newsletterSubtitle,
            partnerLogos,
            footerText,
          }),
        }),
        fetch("/api/admin/settings/hero-carousel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slides: carouselSlides }),
        }),
      ]);
      if (!homepageRes.ok || !carouselRes.ok) throw new Error("Failed to save");
      alert("Homepage settings saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to save homepage settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Homepage Configuration
          </h1>
          <p className="mt-2 text-gray-400">
            Configure content displayed on the main homepage
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      {/* Hero Section */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-medium text-white mb-4">Hero Section</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Hero Title
            </label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="e.g., Geopolitical Intelligence for Smart Money"
              className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to use the default title
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Hero Subtitle
            </label>
            <textarea
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder="e.g., Real-time analysis across commodities, currencies, and critical materials"
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Hero Carousel */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-medium text-white mb-1">Hero Carousel</h2>
        <p className="text-sm text-gray-400 mb-6">
          Upload up to 5 hero media slides (image or video) to display as a
          rotating background on the homepage. For videos, set a custom display
          duration up to 45 seconds. Empty slots are skipped.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {carouselSlides.map((slide, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/40 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-geo-gold">
                  Slide {index + 1}
                </span>
                {slide.url && (
                  <button
                    type="button"
                    onClick={() => clearSlide(index)}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {/* Media Preview / Upload Area */}
              <div
                className="relative aspect-video w-full overflow-hidden rounded-md border border-white/10 bg-gray-900 cursor-pointer group"
                onClick={() => fileInputRefs.current[index]?.click()}
              >
                {slide.url ? (
                  <>
                    {slide.mediaType === "video" ? (
                      <video
                        src={slide.url}
                        className="h-full w-full object-cover"
                        muted
                        autoPlay
                        loop
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slide.url}
                          alt={`Slide ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </>
                    )}
                    <div className="absolute left-2 top-2 rounded-full border border-white/20 bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90">
                      {slide.mediaType}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-5 h-5 text-white" />
                      <span className="ml-1 text-xs text-white">Change</span>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-500 group-hover:text-gray-300 transition-colors">
                    {uploadingSlot === index ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-geo-gold border-t-transparent" />
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-5 h-5" />
                          <Film className="w-5 h-5" />
                        </div>
                        <span className="text-xs">Upload image or video</span>
                      </>
                    )}
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
              </div>

              <input
                ref={(el) => {
                  fileInputRefs.current[index] = el;
                }}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSlideMediaUpload(index, file);
                  e.target.value = "";
                }}
              />

              <input
                type="text"
                value={slide.title}
                onChange={(e) =>
                  updateSlideText(index, "title", e.target.value)
                }
                placeholder="Slide title (optional)"
                className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-1.5 text-sm text-white placeholder-gray-600"
              />
              <input
                type="text"
                value={slide.subtitle}
                onChange={(e) =>
                  updateSlideText(index, "subtitle", e.target.value)
                }
                placeholder="Subtitle (optional)"
                className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-1.5 text-sm text-white placeholder-gray-600"
              />

              {slide.mediaType === "video" && slide.url && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-400">
                    Video display duration (seconds)
                  </label>
                  <input
                    type="number"
                    min={MIN_VIDEO_DURATION_SECONDS}
                    max={MAX_VIDEO_DURATION_SECONDS}
                    step={1}
                    value={slide.videoDurationSec ?? DEFAULT_VIDEO_DURATION_SECONDS}
                    onChange={(e) =>
                      updateSlideVideoDuration(index, e.target.value)
                    }
                    className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-1.5 text-sm text-white"
                  />
                  <p className="text-[11px] text-gray-500">
                    Max {MAX_VIDEO_DURATION_SECONDS} seconds
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-medium text-white mb-4">
          Newsletter Section
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Newsletter Title
            </label>
            <input
              type="text"
              value={newsletterTitle}
              onChange={(e) => setNewsletterTitle(e.target.value)}
              placeholder="e.g., Join 120,000+ Professionals Worldwide"
              className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Newsletter Subtitle
            </label>
            <input
              type="text"
              value={newsletterSubtitle}
              onChange={(e) => setNewsletterSubtitle(e.target.value)}
              placeholder="e.g., Get the GeoMoney Weekly Intelligence Brief"
              className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Partner Logos */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-medium text-white mb-4">Partner Logos</h2>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Partner Names (comma-separated)
          </label>
          <input
            type="text"
            value={partnerLogos}
            onChange={(e) => setPartnerLogos(e.target.value)}
            placeholder="e.g., Bloomberg, PwC, ThinkMarkets"
            className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            These appear as text logos on the newsletter section
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-medium text-white mb-4">Footer</h2>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Footer Text
          </label>
          <input
            type="text"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            placeholder="e.g., © 2025 GeoMoney TV. All rights reserved."
            className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500"
          />
        </div>
      </div>
    </div>
  );
}
