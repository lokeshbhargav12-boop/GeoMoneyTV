import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The GeoMoney Brief",
  description: "The weekly GeoMoney newsletter: market intelligence, energy and geopolitical analysis.",
  alternates: { canonical: "/features/newsletter" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
