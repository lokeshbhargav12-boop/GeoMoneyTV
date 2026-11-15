import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Geomoney Aperture",
  description: "Live global monitor: events, aircraft, vessels, chokepoints and risk signals.",
  alternates: { canonical: "/world-monitor" },
  openGraph: {
    title: "Geomoney Aperture",
    description: "Live global monitor: events, aircraft, vessels, chokepoints and risk signals.",
    url: "/world-monitor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Geomoney Aperture",
    description: "Live global monitor: events, aircraft, vessels, chokepoints and risk signals.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
