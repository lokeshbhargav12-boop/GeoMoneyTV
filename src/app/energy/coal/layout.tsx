import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coal Intelligence",
  description: "Coal benchmarks, arbitrage tools, route mapping and coal-specific monitoring.",
  alternates: { canonical: "/energy/coal" },
  openGraph: {
    title: "Coal Intelligence",
    description: "Coal benchmarks, arbitrage tools, route mapping and coal-specific monitoring.",
    url: "/energy/coal",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coal Intelligence",
    description: "Coal benchmarks, arbitrage tools, route mapping and coal-specific monitoring.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
