"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Crown, Sparkles, CheckCircle2 } from "lucide-react";
import { WAITLIST_LAUNCH_MESSAGE } from "@/lib/waitlist";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultName?: string;
  defaultEmail?: string;
  source?: string;
  onSuccess?: () => void;
}

export default function WaitlistModal({
  isOpen,
  onClose,
  defaultName = "",
  defaultEmail = "",
  source = "waitlist_modal",
  onSuccess,
}: WaitlistModalProps) {
  const { data: session } = useSession();
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (defaultName) {
      setName(defaultName);
    } else if (session?.user?.name && !name) {
      setName(session.user.name);
    }
  }, [defaultName, session?.user?.name]);

  useEffect(() => {
    if (defaultEmail) {
      setEmail(defaultEmail);
    } else if (session?.user?.email && !email) {
      setEmail(session.user.email);
    }
  }, [defaultEmail, session?.user?.email]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, source }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(
          "Successfully joined the GeoMoney Pro Waitlist! Priority access has been reserved."
        );
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
          setStatus("idle");
          setMessage("");
        }, 2500);
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to join waitlist");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#0a0a0a] border border-geo-gold/30 p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-geo-gold/10 border border-geo-gold/30 px-3.5 py-1 text-xs font-semibold text-geo-gold">
            <Crown className="w-3.5 h-3.5" />
            GeoMoney Pro Priority Access
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Join GeoMoney Pro Waitlist
          </h2>
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-left mb-2">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-geo-gold shrink-0 mt-0.5" />
              <p className="text-gray-200 text-xs leading-relaxed">
                {WAITLIST_LAUNCH_MESSAGE}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="waitlist-name"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Full Name
            </label>
            <input
              type="text"
              id="waitlist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label
              htmlFor="waitlist-email"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="waitlist-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="mt-2 w-full rounded-lg bg-gradient-to-r from-geo-gold to-yellow-500 px-6 py-3 font-bold text-black transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === "loading" ? (
              "Joining Waitlist..."
            ) : status === "success" ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Joined Waitlist!
              </>
            ) : (
              "Join the Waitlist"
            )}
          </button>

          {message && (
            <div
              className={`mt-2 rounded-lg p-3 text-center text-sm ${
                status === "success"
                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}
            >
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}