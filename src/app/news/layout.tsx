import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intelligence",
  description: "Geopolitical, energy, commodity and macro briefings with source, category and date filters.",
  alternates: { canonical: "/news" },
  openGraph: {
    title: "Intelligence",
    description: "Geopolitical, energy, commodity and macro briefings with source, category and date filters.",
    url: "/news",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intelligence",
    description: "Geopolitical, energy, commodity and macro briefings with source, category and date filters.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
