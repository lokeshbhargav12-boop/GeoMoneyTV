import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Script from "next/script";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import fs from "fs";
import path from "path";

async function resolveLogoUrl(rawValue?: string | null): Promise<string | null> {
  const value = rawValue?.trim();
  if (!value) return null;

  if (value.startsWith("/api/media/")) {
    const assetId = value.replace("/api/media/", "").split("?")[0].split("#")[0];
    if (!assetId) return null;

    const asset = await prisma.mediaAsset.findUnique({
      where: { id: assetId },
      select: { id: true },
    });

    return asset ? value : null;
  }

  if (value.startsWith("/uploads/")) {
    const relativePath = value.replace(/^\/uploads\//, "");
    const localFilePath = path.join(process.cwd(), "public", "uploads", relativePath);
    return fs.existsSync(localFilePath) ? value : null;
  }

  return value;
}

const inter = Inter({ subsets: ["latin"] });

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://geomoneytv.com";

// Site-wide metadata defaults (QA P0-3): the site is shared on LinkedIn,
// Instagram, Facebook and TikTok, so link previews must not be blank.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GeoMoney — Geopolitical, Energy & Market Intelligence",
    template: "%s | GeoMoney",
  },
  description:
    "Strategic intelligence for decision makers worldwide: geopolitics, energy systems, critical materials and the markets they move.",
  applicationName: "GeoMoney",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "GeoMoney",
    url: SITE_URL,
    title: "GeoMoney — Geopolitical, Energy & Market Intelligence",
    description:
      "Strategic intelligence for decision makers worldwide: geopolitics, energy systems, critical materials and the markets they move.",
    images: [{ url: "/globe-placeholder.jpg", width: 1200, height: 630, alt: "GeoMoney" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GeoMoney — Geopolitical, Energy & Market Intelligence",
    description:
      "Strategic intelligence for decision makers worldwide: geopolitics, energy systems, critical materials and the markets they move.",
    images: ["/globe-placeholder.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const getLogoUrl = unstable_cache(
  async () => {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return null;
    }
    try {
      const logoSetting = await prisma.siteSettings.findUnique({
        where: { key: "logo_url" },
      });
      return await resolveLogoUrl(logoSetting?.value);
    } catch {
      return null;
    }
  },
  ["logo_url"],
  { revalidate: 300 }, // cache for 5 minutes
);

/**
 * Server-render the last stored ticker snapshot (QA P3): without this the
 * server HTML says "Loading market ticker…" and the strip pops in after
 * hydration. Short revalidate keeps it near-live without a query per request.
 */
const getTickerSnapshot = unstable_cache(
  async () => {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return [];
    }
    try {
      const { getStoredTickerData } = await import("@/lib/ticker-service");
      const data = await getStoredTickerData();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
  ["ticker_snapshot"],
  { revalidate: 30 },
);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [logoUrl, tickerSnapshot] = await Promise.all([
    getLogoUrl(),
    getTickerSnapshot(),
  ]);

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          {/* Google Translate Integration */}
          <div id="google_translate_element" className="hidden"></div>
          <Script id="google-translate-config" strategy="afterInteractive">
            {`
              function googleTranslateElementInit() {
                new window.google.translate.TranslateElement({
                  pageLanguage: 'en',
                  includedLanguages: 'en,fr,es,pt',
                  autoDisplay: false
                }, 'google_translate_element');
              }
            `}
          </Script>
          <Script
            src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
            strategy="afterInteractive"
          />

          {/* Fixed Ticker */}
          <div className="fixed top-0 z-50 w-full">
            <Ticker initialItems={tickerSnapshot} />
          </div>
          {/* Persistent Navbar */}
          <Navbar logoUrl={logoUrl} />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
