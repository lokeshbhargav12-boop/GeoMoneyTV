import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The GeoMoney Intelligence Report",
  description: "Subscriber-only weekly intelligence briefings and member analysis.",
  alternates: { canonical: "/features/weekly-brief" },
  openGraph: {
    title: "The GeoMoney Intelligence Report",
    description: "Subscriber-only weekly intelligence briefings and member analysis.",
    url: "/features/weekly-brief",
  },
  twitter: {
    card: "summary_large_image",
    title: "The GeoMoney Intelligence Report",
    description: "Subscriber-only weekly intelligence briefings and member analysis.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
