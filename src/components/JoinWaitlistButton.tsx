"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import WaitlistModal from "./WaitlistModal";

interface JoinWaitlistButtonProps {
  label?: string;
  className?: string;
  source?: string;
}

export default function JoinWaitlistButton({
  label = "Join Waitlist",
  className = "",
  source = "pricing_page",
}: JoinWaitlistButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <span>{label}</span>
        <Mail className="w-4 h-4" />
      </button>
      <WaitlistModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        source={source}
      />
    </>
  );
}