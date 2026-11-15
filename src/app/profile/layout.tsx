import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Manage your GeoMoney account, subscription and contact details.",
  alternates: { canonical: "/profile" },
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
