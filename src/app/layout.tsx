import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Script from "next/script";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GeoMoney — Beta",
  description: "Strategic intelligence for decision makers worldwide.",
};

const getLogoUrl = unstable_cache(
  async () => {
    try {
      const logoSetting = await prisma.siteSettings.findUnique({
        where: { key: "logo_url" },
      });
      return logoSetting?.value || null;
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

          {/* Beta Banner */}
          <div className="fixed top-0 z-[60] w-full bg-yellow-500/90 text-black text-xs text-center py-1 font-semibold tracking-wide">
            Beta Version — Features may change.{" "}
            <a href="/about/contact" className="underline hover:text-black/70">
              Share feedback
            </a>
          </div>

          {/* Fixed Ticker */}
          <div className="fixed top-6 z-50 w-full">
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
