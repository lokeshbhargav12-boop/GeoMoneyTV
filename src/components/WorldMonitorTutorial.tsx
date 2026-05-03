"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe2,
  MousePointer2,
  Ship,
  Plane,
  Layers,
  Radar,
  ZoomIn,
  Move,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Map,
  MessageSquare,
} from "lucide-react";

const STORAGE_KEY = "geomoney_wm_tutorial_seen";

interface TutorialStep {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  tips: string[];
  visual: "globe" | "layers" | "click" | "zoom" | "aperture" | "ai";
}

const STEPS: TutorialStep[] = [
  {
    icon: <Globe2 className="w-7 h-7" />,
    title: "Welcome to World Monitor",
    subtitle: "Global Intelligence at Your Fingertips",
    description:
      "The 3D globe displays real-time intelligence across geopolitics, energy, military movements, and global trade. Drag to explore any region of the world.",
    tips: [
      "Left-click + drag to rotate the globe",
      "Scroll wheel to zoom in/out",
      "The globe auto-rotates when idle",
    ],
    visual: "globe",
  },
  {
    icon: <ZoomIn className="w-7 h-7" />,
    title: "Zoom & Navigate",
    subtitle: "From Global to Street Level",
    description:
      "Zoom deep into any region for detailed intelligence. You can get close enough to see individual vessels and aircraft positions with high precision.",
    tips: [
      "Scroll to zoom — go from global view to regional detail",
      "Pinch to zoom on touch devices",
      "Use the Legend/Filters panel to toggle data layers",
    ],
    visual: "zoom",
  },
  {
    icon: <Ship className="w-7 h-7" />,
    title: "Ships & Aircraft",
    subtitle: "Click to Inspect Assets",
    description:
      "Colored dots on the globe represent real-time ships and aircraft. Click any dot to see detailed information including speed, heading, destination, and classification.",
    tips: [
      "🟠 Orange = Tankers  •  🟢 Green = Containers",
      "🔴 Red = Military  •  🔵 Blue = Commercial flights",
      "Click a vessel or aircraft to open its intel card",
    ],
    visual: "click",
  },
  {
    icon: <Layers className="w-7 h-7" />,
    title: "Intelligence Layers",
    subtitle: "Toggle What You See",
    description:
      "Use the Legend/Filters panel at the bottom of the globe to control which layers are visible — vessels, aircraft, chokepoints, climate hotspots, shipping routes, and more.",
    tips: [
      "Toggle layers on/off for cleaner analysis",
      "Filter ships by type: tankers, LNG, military, etc.",
      "Filter events by category: energy, cyber, military",
    ],
    visual: "layers",
  },
  {
    icon: <Map className="w-7 h-7" />,
    title: "GeoMoney Aperture (2D Map)",
    subtitle: "Flat Map with Street View",
    description:
      "Switch to the 2D Aperture map for a familiar flat view with satellite imagery, live webcam feeds, and Google Street View integration for on-the-ground intelligence.",
    tips: [
      "Click the 'APERTURE' button in the top bar",
      "Drop into Street View anywhere on the map",
      "Watch live webcam feeds from strategic locations",
    ],
    visual: "aperture",
  },
  {
    icon: <MessageSquare className="w-7 h-7" />,
    title: "AI Navigator",
    subtitle: "Ask Questions About the Globe",
    description:
      "Use the AI Navigator to ask natural-language questions about the current intelligence picture. It can analyze vessel densities, chokepoint status, and threat assessments.",
    tips: [
      "Expand the AI Navigator panel on the left",
      "Try: \"How many ships near Strait of Hormuz?\"",
      "The HUD panels show detailed intel for each domain",
    ],
    visual: "ai",
  },
];

function StepVisual({ visual }: { visual: TutorialStep["visual"] }) {
  const baseClass =
    "w-full h-full flex items-center justify-center select-none";

  switch (visual) {
    case "globe":
      return (
        <div className={baseClass}>
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-600/30 via-blue-800/40 to-emerald-700/30 border border-cyan-500/20 shadow-[0_0_60px_rgba(6,182,212,0.15)] animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Globe2 className="w-12 h-12 text-cyan-400/60" />
            </div>
            {/* Orbit ring */}
            <div className="absolute -inset-4 rounded-full border border-dashed border-cyan-500/15 animate-[spin_12s_linear_infinite_reverse]" />
            {/* Cursor */}
            <motion.div
              className="absolute bottom-2 right-2"
              animate={{ x: [0, -20, 10, 0], y: [0, -15, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Move className="w-5 h-5 text-geo-gold" />
            </motion.div>
          </div>
        </div>
      );
    case "zoom":
      return (
        <div className={baseClass}>
          <div className="relative">
            <motion.div
              className="w-28 h-28 rounded-full bg-gradient-to-br from-cyan-700/30 to-blue-900/40 border border-cyan-500/20"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-cyan-400/70" />
            </div>
            {/* Zoom lines */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-geo-gold/30"
              animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>
      );
    case "click":
      return (
        <div className={baseClass}>
          <div className="relative flex items-center gap-6">
            {/* Ship dot */}
            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]" />
              <motion.div
                className="absolute -inset-2 rounded-full border border-orange-400/40"
                animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <div className="mt-2 text-[9px] text-orange-400 font-mono text-center">
                SHIP
              </div>
            </div>
            {/* Cursor clicking */}
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <MousePointer2 className="w-6 h-6 text-white/70" />
            </motion.div>
            {/* Aircraft dot */}
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]" />
              <motion.div
                className="absolute -inset-2 rounded-full border border-cyan-400/40"
                animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
              <div className="mt-2 text-[9px] text-cyan-400 font-mono text-center">
                FLIGHT
              </div>
            </div>
          </div>
        </div>
      );
    case "layers":
      return (
        <div className={baseClass}>
          <div className="space-y-2">
            {[
              { label: "VESSELS", color: "bg-orange-500", on: true },
              { label: "AIRCRAFT", color: "bg-cyan-500", on: true },
              { label: "CLIMATE", color: "bg-emerald-500", on: false },
              { label: "ROUTES", color: "bg-purple-500", on: true },
            ].map((layer, i) => (
              <motion.div
                key={layer.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-[10px] font-mono ${
                  layer.on
                    ? "border-white/15 bg-white/5 text-white/80"
                    : "border-white/5 bg-white/[0.02] text-white/30"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${layer.color} ${layer.on ? "" : "opacity-30"}`}
                />
                {layer.label}
                <span className="ml-auto text-[8px] text-gray-500">
                  {layer.on ? "ON" : "OFF"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      );
    case "aperture":
      return (
        <div className={baseClass}>
          <div className="relative">
            <div className="w-36 h-24 rounded-lg border border-cyan-500/20 bg-gradient-to-br from-gray-900 to-gray-950 overflow-hidden">
              {/* Fake map grid */}
              <div className="absolute inset-0 opacity-20">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={`h-${i}`}
                    className="absolute left-0 right-0 border-t border-cyan-500/30"
                    style={{ top: `${(i + 1) * 20}%` }}
                  />
                ))}
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={`v-${i}`}
                    className="absolute top-0 bottom-0 border-l border-cyan-500/30"
                    style={{ left: `${(i + 1) * 14.28}%` }}
                  />
                ))}
              </div>
              {/* Map label */}
              <div className="absolute top-1 left-1.5 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[7px] font-mono text-cyan-400">
                  APERTURE
                </span>
              </div>
              {/* Pegman */}
              <motion.div
                className="absolute bottom-2 right-3 text-sm"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🚶
              </motion.div>
            </div>
          </div>
        </div>
      );
    case "ai":
      return (
        <div className={baseClass}>
          <div className="space-y-2 w-44">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-geo-gold/20 bg-geo-gold/5">
              <Sparkles className="w-3 h-3 text-geo-gold" />
              <span className="text-[9px] font-mono text-geo-gold">
                AI NAVIGATOR
              </span>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="px-2.5 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-[9px] font-mono text-gray-400"
            >
              "How many tankers near Hormuz?"
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="px-2.5 py-2 rounded-lg border border-cyan-500/15 bg-cyan-500/5 text-[9px] font-mono text-cyan-300"
            >
              Analyzing 12 tankers in the Strait of Hormuz region…
            </motion.div>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default function WorldMonitorTutorial({
  onClose,
}: {
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const total = STEPS.length;
  const current = STEPS[step];

  const handleNext = useCallback(() => {
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      localStorage.setItem(STORAGE_KEY, "1");
      onClose();
    }
  }, [step, total, onClose]);

  const handlePrev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    onClose();
  }, [onClose]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") handleSkip();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNext, handlePrev, handleSkip]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={handleSkip}
        />

        {/* Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.97 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 w-[min(480px,92vw)] rounded-3xl border border-white/[0.08] bg-[#0c1220]/95 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden"
        >
          {/* Top accent line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-geo-gold/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors z-10"
            aria-label="Close tutorial"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Step indicator */}
          <div className="px-6 pt-5 flex items-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                  i === step
                    ? "bg-geo-gold"
                    : i < step
                      ? "bg-geo-gold/30"
                      : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <div className="px-6 pt-1.5">
            <span className="text-[10px] font-mono text-gray-600 tracking-wider">
              STEP {step + 1} OF {total}
            </span>
          </div>

          {/* Visual area */}
          <div className="px-6 pt-4">
            <div className="h-36 rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <StepVisual visual={current.visual} />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pt-5 pb-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-geo-gold/10 border border-geo-gold/20 flex items-center justify-center text-geo-gold">
                {current.icon}
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">
                  {current.title}
                </h2>
                <p className="text-[11px] font-mono text-geo-gold/80 tracking-wide">
                  {current.subtitle}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed mt-3">
              {current.description}
            </p>

            {/* Tips */}
            <div className="mt-4 space-y-1.5">
              {current.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-geo-gold/50 mt-1.5 shrink-0" />
                  <span className="text-[12px] text-gray-500 font-mono leading-snug">
                    {tip}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 mt-2 border-t border-white/[0.06] flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-[11px] font-mono text-gray-600 hover:text-white transition-colors"
            >
              Skip tutorial
            </button>

            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-white/10 text-[11px] font-mono text-gray-400 hover:text-white hover:border-white/20 transition-all"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-5 py-2 rounded-xl bg-geo-gold/15 border border-geo-gold/30 text-[11px] font-mono text-geo-gold hover:bg-geo-gold/25 transition-all"
              >
                {step === total - 1 ? "Start Exploring" : "Next"}
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook to check if tutorial should show. Returns [showTutorial, dismissTutorial].
 */
export function useWorldMonitorTutorial(): [boolean, () => void] {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setShow(true);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }, []);

  return [show, dismiss];
}
