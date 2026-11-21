"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";
import { getPlanTier, WAITLIST_SOURCES } from "@/lib/entitlements";
import WaitlistModal from "@/components/WaitlistModal";

interface TierInterestButtonProps {
  /** Future tier whose interest list this button feeds. */
  tier: "advanced" | "pro";
  /** Override the button label; defaults to the tier CTA ("Notify Me" / "Request Early Access"). */
  label?: string;
  className?: string;
  icon?: boolean;
}

/**
 * Opens the source-aware interest modal for a future tier:
 * Advanced -> "Notify Me" (advanced_notify), Pro -> "Request Early Access"
 * (pro_early_access). Never triggers checkout.
 */
export default function TierInterestButton({
  tier,
  label,
  className = "",
  icon = true,
}: TierInterestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tierConfig = getPlanTier(tier);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={className}>
        {icon && <BellRing className="h-4 w-4" />}
        {label || tierConfig.cta.label}
      </button>
      <WaitlistModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        source={WAITLIST_SOURCES[tier]}
      />
    </>
  );
}
