import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Script from "next/script";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GeoMoney",
  description: "Strategic intelligence for decision makers worldwide.",
};

async function getLogoUrl() {
  try {
    const logoSetting = await prisma.siteSettings.findUnique({
      where: { key: "logo_url" },
    });
    return logoSetting?.value || null;
  } catch {
    return null;
  }
}

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
