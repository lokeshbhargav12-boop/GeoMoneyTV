"use client";

import Link from "next/link";
import { ArrowUpRight, Lock, Sparkles, X } from "lucide-react";
import { AI_TRIAL, buildAiTrialMessage } from "@/lib/entitlements";

interface AiLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Upgrade popup shown when a free account (or guest) has used all of its free
 * AI tries. Rendered by every counted AI surface — the AI Navigation
 * Assistant, the Energy Hub analyzer and the Aperture AI Navigator — when the
 * API answers with `{ code: "AI_TRIAL_LIMIT" }`.
 */
export default function AiLimitModal({ isOpen, onClose }: AiLimitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-geo-gold/30 bg-[#0a0a0a] p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-white"
          aria-label="Close popup"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-geo-gold/30 bg-geo-gold/10 px-3.5 py-1 text-xs font-semibold text-geo-gold">
            <Lock className="h-3.5 w-3.5" />
            {AI_TRIAL.presentation.badge}
          </div>
          <h2 className="mb-3 text-2xl font-bold text-white">
            {AI_TRIAL.presentation.title}
          </h2>
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-left">
            <div className="flex items-start gap-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-geo-gold" />
              <p className="text-xs leading-relaxed text-gray-200">
                {buildAiTrialMessage()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={AI_TRIAL.presentation.primaryCta.href}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-geo-gold to-yellow-500 px-6 py-3 font-bold text-black transition-all hover:brightness-110"
          >
            <Sparkles className="h-4 w-4" />
            {AI_TRIAL.presentation.primaryCta.label}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href={AI_TRIAL.presentation.secondaryCta.href}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-geo-gold/40 hover:text-geo-gold"
          >
            {AI_TRIAL.presentation.secondaryCta.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
