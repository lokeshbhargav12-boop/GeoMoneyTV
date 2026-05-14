"use client";

import { useState } from "react";
import WaitlistModal from "./WaitlistModal";

export default function WaitlistSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section
        id="waitlist"
        className="bg-gradient-to-b from-geo-dark to-black py-20 px-4 text-center border-t border-white/10 relative z-10 w-full overflow-hidden"
      >
        <h2 className="text-3xl font-bold text-white mb-4">
          Join GeoMoney Pro
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-8">
          Enroll for early access to our premium analytics, exclusive
          intelligence reports, and professional tools.
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
      />
    </>
  );
}
