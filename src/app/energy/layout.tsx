import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Energy Hub",
  description: "Energy systems, storage, policy tracking and the critical commodities powering the transition.",
  alternates: { canonical: "/energy" },
  openGraph: {
    title: "Energy Hub",
    description: "Energy systems, storage, policy tracking and the critical commodities powering the transition.",
    url: "/energy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Energy Hub",
    description: "Energy systems, storage, policy tracking and the critical commodities powering the transition.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
