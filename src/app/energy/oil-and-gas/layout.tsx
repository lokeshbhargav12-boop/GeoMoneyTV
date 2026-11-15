import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oil & Gas Intelligence",
  description: "Crude and gas flows, refining, storage and corridor exposure.",
  alternates: { canonical: "/energy/oil-and-gas" },
  openGraph: {
    title: "Oil & Gas Intelligence",
    description: "Crude and gas flows, refining, storage and corridor exposure.",
    url: "/energy/oil-and-gas",
  },
  twitter: {
    card: "summary_large_image",
    title: "Oil & Gas Intelligence",
    description: "Crude and gas flows, refining, storage and corridor exposure.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
