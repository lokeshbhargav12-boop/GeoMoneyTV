"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRing, Loader2, Lock, Sparkles, UserPlus } from "lucide-react";
import { buildGateState, type GateCta, type ModuleKey } from "@/lib/entitlements";
import { useEntitlements } from "@/components/EntitlementProvider";
import WaitlistModal from "@/components/WaitlistModal";

interface TierGateProps {
  /** Module key from the central MODULES registry in src/lib/entitlements.ts. */
  module: ModuleKey;
  /** Feature content; required for overlay mode, unused in replace mode. */
  children?: React.ReactNode;
  /**
   * overlay: children stay visible as a blurred, non-interactive preview
   * behind the locked panel (selected previews for Free/Basic).
   * replace: the locked panel replaces the feature entirely.
   */
  mode?: "overlay" | "replace";
  /** Heading shown inside the locked panel; defaults to the module label. */
  heading?: string;
  /**
   * Optional background image for the locked panel (replace mode only).
   * Rendered blurred and dimmed behind the panel so locked visitors get a
   * teaser of the module — e.g. the Aperture globe backdrop.
   */
  previewImage?: string;
  /**
   * Basic-tier gates only: when the viewer is a guest (not signed in), ask
   * them to register first — the primary CTA becomes "Register"
   * (-> /auth/register) instead of the checkout CTA.
   */
  guestRegisterPrompt?: boolean;
  className?: string;
}

function PrimaryCta({ cta, onOpenModal }: { cta: GateCta; onOpenModal: (source: string) => void }) {
  if ((cta.action === "checkout" || cta.action === "register") && cta.href) {
    return (
      <Link
        href={cta.href}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-geo-gold px-5 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-500"
      >
        {cta.action === "register" ? <UserPlus className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        {cta.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpenModal(cta.waitlistSource || "waitlist")}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-geo-gold px-5 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-500"
    >
      <BellRing className="h-4 w-4" />
      {cta.label}
    </button>
  );
}

/**
 * Renders `children` only when the viewer's tier (from EntitlementProvider)
 * includes the module's required tier. Otherwise shows the tier-appropriate
 * locked/preview state defined centrally in src/lib/entitlements.ts:
 *  - Basic required  -> "Included with GeoMoney Basic" + Get Basic CTA
 *    (guests instead get a Register CTA when `guestRegisterPrompt` is set)
 *  - Advanced        -> "Advanced — Coming Soon" + Notify Me
 *  - Pro             -> "Pro — Coming Soon / Early Access" + Request Early Access
 */
export default function TierGate({
  module,
  children,
  mode = "overlay",
  heading,
  previewImage,
  guestRegisterPrompt = false,
  className = "",
}: TierGateProps) {
  const { tier, signedIn, loading } = useEntitlements();
  const [modalSource, setModalSource] = useState<string | null>(null);

  const gate = buildGateState(module, tier, guestRegisterPrompt ? { signedIn } : undefined);

  if (loading) {
    // Neutral placeholder: never flash a locked state at viewers who own the
    // feature, and never flash premium content to viewers who do not.
    return (
      <div className={`flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] py-14 text-sm text-gray-500 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
      </div>
    );
  }

  if (gate.allowed) {
    return <>{children}</>;
  }

  const panel = (
    <div className="mx-auto max-w-2xl rounded-xl border border-geo-gold/25 bg-gradient-to-br from-[#0f0d06] to-black p-6 text-center shadow-2xl">
      <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-geo-gold/30 bg-geo-gold/10 px-3.5 py-1 text-xs font-semibold text-geo-gold">
        <Lock className="h-3.5 w-3.5" />
        {gate.badgeLabel}
      </div>
      <h3 className="text-lg font-bold text-white">{heading || gate.module.label}</h3>
      <p className="mt-1 text-sm font-semibold text-geo-gold">{gate.title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-300">{gate.message}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <PrimaryCta cta={gate.primaryCta} onOpenModal={setModalSource} />
        <Link
          href={gate.secondaryCta.href}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-geo-gold/40 hover:text-geo-gold"
        >
          {gate.secondaryCta.label}
        </Link>
      </div>
      {gate.requiredTier.id !== "basic" && (
        <p className="mt-4 text-[11px] text-gray-500">
          Checkout is not enabled for {gate.requiredTier.name} while it remains{" "}
          {gate.requiredTier.statusLabel.toLowerCase()}.
        </p>
      )}
    </div>
  );

  return (
    <div className={className}>
      {mode === "replace" ? (
        previewImage ? (
          <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10">
            <img
              src={previewImage}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover object-top opacity-60 blur-[5px] saturate-75"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/75" />
            <div className="relative z-10 px-3 py-10 sm:px-8">{panel}</div>
          </div>
        ) : (
          panel
        )
      ) : (
        <div className="relative min-h-[20rem] overflow-hidden rounded-xl">
          <div className="pointer-events-none select-none opacity-40 blur-[2px] saturate-50" aria-hidden="true">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/55 p-3 sm:p-4">
            {panel}
          </div>
        </div>
      )}

      <WaitlistModal
        isOpen={modalSource !== null}
        onClose={() => setModalSource(null)}
        source={modalSource || undefined}
      />
    </div>
  );
}
