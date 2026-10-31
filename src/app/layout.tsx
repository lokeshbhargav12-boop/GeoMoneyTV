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

export const metadata: Metadata = {
  title: "GeoMoney — Beta",
  description: "Strategic intelligence for decision makers worldwide.",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const logoUrl = await getLogoUrl();

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
            <Ticker />
          </div>
          {/* Persistent Navbar */}
          <Navbar logoUrl={logoUrl} />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
