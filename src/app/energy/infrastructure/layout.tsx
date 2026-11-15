import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Energy Infrastructure Command Desk",
  description: "Reference infrastructure inventory, provider observations and clearly labelled planning simulations.",
  alternates: { canonical: "/energy/infrastructure" },
  openGraph: {
    title: "Energy Infrastructure Command Desk",
    description: "Reference infrastructure inventory, provider observations and clearly labelled planning simulations.",
    url: "/energy/infrastructure",
  },
  twitter: {
    card: "summary_large_image",
    title: "Energy Infrastructure Command Desk",
    description: "Reference infrastructure inventory, provider observations and clearly labelled planning simulations.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
