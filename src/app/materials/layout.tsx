import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Critical Materials",
  description: "Rare earth and critical material supply, processing concentration and policy exposure.",
  alternates: { canonical: "/materials" },
  openGraph: {
    title: "Critical Materials",
    description: "Rare earth and critical material supply, processing concentration and policy exposure.",
    url: "/materials",
  },
  twitter: {
    card: "summary_large_image",
    title: "Critical Materials",
    description: "Rare earth and critical material supply, processing concentration and policy exposure.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
