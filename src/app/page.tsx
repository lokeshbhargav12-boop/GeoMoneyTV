import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Newsletter from "@/components/Newsletter";
import WaitlistSection from "@/components/WaitlistSection";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Clock, Play, ArrowRight } from "lucide-react";
import NewsImage from "@/components/NewsImage";
import EnergySection from "@/components/EnergySection";
import BriefingsSection from "@/components/BriefingsSection";

// Revalidate page cache every 60 seconds (ISR) — avoids DB hit on every request
export const revalidate = 60;

async function getRecentArticles() {
  try {
    return await prisma.article.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        imageUrl: true,
        sourceName: true,
        category: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    });
  } catch {
    return [];
  }
}

async function getGlobalBriefings() {
  try {
    return await prisma.video.findMany({
      where: { videoType: { not: "short" } },
      orderBy: { publishedAt: "desc" },
      take: 12,
    });
  } catch {
    return [];
  }
}

async function getQuickBriefings() {
  try {
    return await prisma.video.findMany({
      where: { videoType: "short" },
      orderBy: { publishedAt: "desc" },
      take: 12,
    });
  } catch {
    return [];
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const [articles, globalBriefings, quickBriefings] = await Promise.all([
    getRecentArticles(),
    getGlobalBriefings(),
    getQuickBriefings(),
  ]);

  return (
    <main className="min-h-screen text-white selection:bg-geo-gold selection:text-black relative">
      {/* Add top padding for fixed ticker + navbar */}
      <div className="pt-0">
        <Hero />
      </div>

      <Features />

      {/* News Preview Section */}
      <section className="bg-geo-dark px-4 py-20 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Latest Intelligence
                </span>
              </h2>
              <p className="mt-2 text-gray-500 text-sm">
                Real-time geopolitical and market intelligence
              </p>
            </div>
            <Link
              href="/news"
              className="text-sm font-semibold text-geo-gold hover:text-yellow-400 flex items-center gap-2 transition-colors group"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {articles.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {articles.map((article) => (
                <Link
                  href={`/news/${article.slug}`}
                  key={article.id}
                  className="group flex flex-col overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-geo-gold/30 hover:bg-white/10 transition-all h-full"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-900">
                    <NewsImage
                      src={article.imageUrl || "/globe-placeholder.jpg"}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 rounded-full bg-geo-gold px-2.5 py-0.5 text-[10px] font-bold text-black uppercase tracking-wider">
                      {article.category}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(article.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2 line-clamp-2 group-hover:text-geo-gold transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2 mb-3 flex-1">
                      {article.description ||
                        "Read the full article for details."}
                      ...
                    </p>
                    <span className="text-xs font-semibold text-geo-gold mt-auto flex items-center gap-1">
                      Read Analysis →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 rounded-xl bg-white/5 border border-white/10">
              <p>
                Latest Intelligence not yet synchronized. Please check back
                later.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Video Preview Section */}
      <BriefingsSection
        globalBriefings={globalBriefings}
        quickBriefings={quickBriefings}
      />

      <EnergySection />

      <Newsletter />

      {/* Pro Waitlist CTA */}
      <WaitlistSection />

      {/* Bottom Quick Links Bar */}
      <div className="fixed bottom-0 z-50 w-full bg-black/90 backdrop-blur-md border-t border-white/10">
        <div className="flex justify-start sm:justify-center gap-6 sm:gap-8 py-3 text-xs font-bold tracking-widest text-white px-4 overflow-x-auto no-scrollbar whitespace-nowrap">
          <Link
            href="/features/newsletter"
            className="cursor-pointer hover:text-geo-gold transition-colors flex flex-col items-center min-w-max"
          >
            <span>THE GEOMONEY BRIEF</span>
            <span className="text-[9px] text-gray-500 mt-0.5">COMING SOON</span>
          </Link>
          <Link
            href="/features/analytics"
            className="cursor-pointer hover:text-geo-gold transition-colors flex flex-col items-center min-w-max"
          >
            <span>ANALYTICS</span>
            <span className="text-[9px] text-gray-500 mt-0.5">COMING SOON</span>
          </Link>
          <Link
            href="/features/weekly-brief"
            className="cursor-pointer hover:text-geo-gold transition-colors flex flex-col items-center min-w-max"
          >
            <span>INTELLIGENCE REPORT</span>
            <span className="text-[9px] text-gray-500 mt-0.5">COMING SOON</span>
          </Link>
          <Link
            href="/features/app"
            className="cursor-pointer hover:text-geo-gold transition-colors flex flex-col items-center min-w-max"
          >
            <span>GEOMONEY TV APP</span>
            <span className="text-[9px] text-gray-500 mt-0.5">COMING SOON</span>
          </Link>
        </div>
      </div>

      <footer className="border-t border-white/10 bg-black py-16 text-sm text-gray-400 pb-28 relative z-10 w-full overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Contact Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">Contact</h3>
              <p>
                For any queries or feedback, please contact us at{" "}
                <a
                  href="mailto:support@geomoneytv.com"
                  className="text-geo-gold hover:text-yellow-400 transition-colors"
                >
                  support@geomoneytv.com
                </a>
              </p>
            </div>

            {/* Corporate Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">Corporate</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-geo-gold transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about/ai-guidelines"
                    className="hover:text-geo-gold transition-colors"
                  >
                    Research Methodology
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about/privacy"
                    className="hover:text-geo-gold transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about/terms"
                    className="hover:text-geo-gold transition-colors"
                  >
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Follow Us Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">Follow Us</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://www.linkedin.com/company/geomoneytv/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-geo-gold transition-colors flex items-center gap-2"
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/geomoneytv?igsh=cDM3OTU2bGtudHM5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-geo-gold transition-colors flex items-center gap-2"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/share/1DbFEu8R25/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-geo-gold transition-colors flex items-center gap-2"
                  >
                    Facebook
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.tiktok.com/@geomoney.tv?_r=1&_t=ZS-95AJeP0IvtF"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-geo-gold transition-colors flex items-center gap-2"
                  >
                    TikTok
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 text-center text-xs">
            <p>© 2026 GeoMoney TV. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
