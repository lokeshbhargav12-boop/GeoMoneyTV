"use client";

import { useState, useEffect } from "react";
import Globe from "./Globe";
import AiAssistant from "./AiAssistant";

export type CarouselMediaType = "image" | "video";
const IMAGE_SLIDE_DURATION_MS = 5000;
const MIN_VIDEO_DURATION_SECONDS = 1;
const MAX_VIDEO_DURATION_SECONDS = 45;
const DEFAULT_VIDEO_DURATION_SECONDS = 15;

export interface CarouselSlide {
  url: string;
  title: string;
  subtitle: string;
  mediaType: CarouselMediaType;
  videoDurationSec: number | null;
}

const inferMediaTypeFromUrl = (url: string): CarouselMediaType =>
  /\.(mp4|webm|mov)(\?.*)?$/i.test(url) ? "video" : "image";

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

const normalizeSlide = (slide: unknown): CarouselSlide | null => {
  if (!slide || typeof slide !== "object") {
    return null;
  }

  const rawSlide = slide as Partial<CarouselSlide> & {
    videoDurationSec?: unknown;
  };
  const url = typeof rawSlide.url === "string" ? rawSlide.url : "";

  if (!url) {
    return null;
  }

  const mediaType =
    rawSlide.mediaType === "video" || rawSlide.mediaType === "image"
      ? rawSlide.mediaType
      : inferMediaTypeFromUrl(url);

  return {
    url,
    title: typeof rawSlide.title === "string" ? rawSlide.title : "",
    subtitle: typeof rawSlide.subtitle === "string" ? rawSlide.subtitle : "",
    mediaType,
    videoDurationSec:
      mediaType === "video"
        ? normalizeVideoDuration(rawSlide.videoDurationSec) ??
          DEFAULT_VIDEO_DURATION_SECONDS
        : null,
  };
};

interface HeroProps {
  initialSlides?: CarouselSlide[];
}

export default function Hero({ initialSlides = [] }: HeroProps) {
  const [text, setText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [slides, setSlides] = useState<CarouselSlide[]>(
    initialSlides
      .map((slide) => normalizeSlide(slide))
      .filter((slide): slide is CarouselSlide => Boolean(slide)),
  );
  const [activeSlide, setActiveSlide] = useState(0);

  const fullText = "How energy, resources, and markets shape the global order";
  const highlightStart = "How energy, resources, and markets ".length;

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTypingComplete(true);
        setShowCursor(false);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    fetch("/api/admin/settings/hero-carousel")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.slides)) {
          const normalizedSlides = data.slides
            .map((slide: unknown) => normalizeSlide(slide))
            .filter(
              (slide: CarouselSlide | null): slide is CarouselSlide =>
                Boolean(slide),
            );

          setSlides(normalizedSlides);
          setActiveSlide((currentSlide) => {
            return normalizedSlides.length === 0
              ? 0
              : Math.min(currentSlide, normalizedSlides.length - 1);
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;

    const currentSlide = slides[activeSlide];
    if (!currentSlide) return;

    const delayMs =
      currentSlide.mediaType === "video"
        ? (currentSlide.videoDurationSec ?? DEFAULT_VIDEO_DURATION_SECONDS) *
          1000
        : IMAGE_SLIDE_DURATION_MS;

    const interval = setTimeout(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, delayMs);

    return () => clearTimeout(interval);
  }, [slides, activeSlide]);

  const hasCarousel = slides.length > 0;

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-20 text-center sm:px-6 lg:px-8">
      {hasCarousel ? (
        <>
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-1000 ${i === activeSlide ? "opacity-100" : "opacity-0"}`}
              aria-hidden={i !== activeSlide}
            >
              {slide.mediaType === "video" ? (
                <video
                  src={slide.url}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : (
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.url})` }}
                />
              )}
            </div>
          ))}

          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/35 to-[#0b1020]/70" />
        </>
      ) : (
        <Globe />
      )}

      <div className="relative z-10 flex h-full w-full max-w-7xl flex-col justify-between py-12 pb-32">
        {/* Main Content */}
        <div className="mt-10 flex flex-1 flex-col items-center justify-center space-y-6">
          <div className="animate-fade-in-up space-y-4">
            <h1 className="text-6xl font-black tracking-tighter sm:text-8xl uppercase relative z-20">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-yellow-200 via-geo-gold to-yellow-700 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)] filter">
                Global Power & Money
              </span>
            </h1>

            <div className="mx-auto max-w-3xl text-xl text-gray-300 sm:text-2xl font-light tracking-wide drop-shadow-md min-h-[6rem]">
              <p>
                {text.slice(0, highlightStart)}
                <span
                  className={`${text.length > highlightStart ? "bg-geo-gold text-black px-1 font-medium" : ""}`}
                >
                  {text.slice(highlightStart)}
                </span>
                {showCursor && <span className="animate-pulse">|</span>}
              </p>
            </div>

            {/* Active slide title/subtitle overlay */}
            {hasCarousel &&
              slides[activeSlide] &&
              (slides[activeSlide].title || slides[activeSlide].subtitle) && (
                <div className="mt-4 space-y-1">
                  {slides[activeSlide].title && (
                    <p className="text-lg font-semibold text-white/90">
                      {slides[activeSlide].title}
                    </p>
                  )}
                  {slides[activeSlide].subtitle && (
                    <p className="text-sm text-gray-300">
                      {slides[activeSlide].subtitle}
                    </p>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* AI Navigation */}
        <div className="mt-auto w-full z-20">
          <AiAssistant />
        </div>
      </div>

      {/* Carousel Navigation Dots */}
      {hasCarousel && slides.length > 1 && (
        <div className="absolute bottom-36 left-0 right-0 z-20 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeSlide
                  ? "w-6 bg-geo-gold"
                  : "w-2 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-geo-dark to-transparent" />
    </section>
  );
}
