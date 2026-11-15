import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Compass, Globe2, Newspaper, Radio, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found | GeoMoney",
  description:
    "The page you were looking for is not available. Continue to GeoMoney Intelligence, Geomoney Aperture, Energy or Pricing.",
  robots: { index: false, follow: true },
};

const DESTINATIONS = [
  {
    href: "/news",
    label: "Intelligence",
    description: "Geopolitical, energy and market briefings from the newsroom.",
    icon: Newspaper,
  },
  {
    href: "/world-monitor",
    label: "Geomoney Aperture",
    description: "Live global monitor for events, aircraft, vessels and chokepoints.",
    icon: Globe2,
  },
  {
    href: "/energy",
    label: "Energy",
    description: "Energy hub, infrastructure, fossil assets and critical materials.",
    icon: Zap,
  },
  {
    href: "/pricing",
    label: "Pricing",
    description: "Compare free access with the Basic membership.",
    icon: Compass,
  },
];

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white pt-32 pb-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-geo-gold/30 bg-geo-gold/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-geo-gold">
            <Radio className="h-3.5 w-3.5" />
            Signal lost
          </div>
          <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-6xl">
            404 &mdash; this page is off the map
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-400">
            The link you followed does not point to a live GeoMoney page. It may have been
            moved, renamed or retired. Pick a destination below and keep reading.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {DESTINATIONS.map((destination) => {
            const Icon = destination.icon;
            return (
              <Link
                key={destination.href}
                href={destination.href}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors hover:border-geo-gold/40 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-geo-gold/25 bg-geo-gold/10">
                      <Icon className="h-5 w-5 text-geo-gold" />
                    </span>
                    <span className="text-lg font-semibold text-white">{destination.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-500 transition-transform group-hover:translate-x-1 group-hover:text-geo-gold" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">
                  {destination.description}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-geo-gold px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-yellow-400"
          >
            Back to the homepage
          </Link>
          <p className="text-xs text-gray-500">
            Still stuck? Email{" "}
            <a href="mailto:info@geomoneytv.com" className="text-gray-400 underline">
              info@geomoneytv.com
            </a>{" "}
            and we will point you to the right place.
          </p>
        </div>
      </div>
    </main>
  );
}
