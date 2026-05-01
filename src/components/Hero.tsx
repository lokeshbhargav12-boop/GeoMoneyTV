"use client";

import { useState, useEffect } from "react";
import Globe from "./Globe";
import AiAssistant from "./AiAssistant";

interface CarouselSlide {
  url: string;
  title: string;
  subtitle: string;
}

export default function Hero() {
  const [text, setText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
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
        if (data.slides) {
          setSlides(data.slides.filter((s: CarouselSlide) => s.url));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const hasCarousel = slides.length > 0;

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-20 text-center sm:px-6 lg:px-8">
      {hasCarousel ? (
        <>
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-1000 ${i === activeSlide ? "opacity-100" : "opacity-0"}`}
              style={{
                backgroundImage: `url(${slide.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ))}
          <div className="absolute inset-0 bg-black/65" />
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
