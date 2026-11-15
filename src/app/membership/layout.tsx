import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membership",
  description: "Manage your GeoMoney membership and billing.",
  alternates: { canonical: "/membership" },
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
