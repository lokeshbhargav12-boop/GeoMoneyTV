import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tools & Calculators",
  description: "Grade guides, unit converters and project economics calculators.",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "Tools & Calculators",
    description: "Grade guides, unit converters and project economics calculators.",
    url: "/tools",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tools & Calculators",
    description: "Grade guides, unit converters and project economics calculators.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
