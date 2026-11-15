import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a GeoMoney account to access intelligence briefings, energy research and member reports.",
  alternates: { canonical: "/auth/register" },
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
