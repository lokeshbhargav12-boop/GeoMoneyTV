import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GeoMoney Mobile App",
  description: "The GeoMoney mobile app: early access to the intelligence platform on iOS and Android.",
  alternates: { canonical: "/features/app" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
