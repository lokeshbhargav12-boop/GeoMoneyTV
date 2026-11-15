import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fossil Energy Desk",
  description: "Coal, gas, oil and LNG plant operations, corridors and terminal constraints.",
  alternates: { canonical: "/energy/fossil-energy" },
  openGraph: {
    title: "Fossil Energy Desk",
    description: "Coal, gas, oil and LNG plant operations, corridors and terminal constraints.",
    url: "/energy/fossil-energy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fossil Energy Desk",
    description: "Coal, gas, oil and LNG plant operations, corridors and terminal constraints.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
