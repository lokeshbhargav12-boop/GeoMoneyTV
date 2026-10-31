"use client";

import { useState } from "react";
import { Crown } from "lucide-react";
import WaitlistModal from "./WaitlistModal";
import { WAITLIST_LAUNCH_MESSAGE } from "@/lib/waitlist";

export default function WaitlistSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section
        id="waitlist"
        className="bg-gradient-to-b from-geo-dark to-black py-20 px-4 text-center border-t border-white/10 relative z-10 w-full overflow-hidden"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-geo-gold/10 border border-geo-gold/25 px-4 py-1.5 text-xs font-semibold text-geo-gold mb-4">
          <Crown className="w-3.5 h-3.5" />
          GeoMoney Basic Priority Access
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">
          Join GeoMoney Basic
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto mb-3 font-medium">
          {WAITLIST_LAUNCH_MESSAGE}
        </p>
        <p className="text-gray-400 max-w-2xl mx-auto mb-8 text-sm">
          Enroll for early access to subscriber research, intelligence reports
          and member updates.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-block rounded-lg bg-blue-600 px-8 py-4 font-bold text-white hover:bg-blue-700 transition-colors"
        >
          Join the Waitlist
        </button>
      </section>

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        source="homepage_waitlist_section"
      />
    </>
  );
}