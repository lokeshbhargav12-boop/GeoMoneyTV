"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import SignOutButton from "./SignOutButton";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
];

const NAV_LINKS = [
  { href: "/news", label: "Intelligence" },
  { href: "/videos", label: "Videos" },
  {
    href: "/energy",
    label: "Energy",
    subLinks: [
      { href: "/energy", label: "Energy Hub" },
      { href: "/energy", label: "Oil & Gas (Coming Soon)" },
      { href: "/energy", label: "Coal (Coming Soon)" },
      { href: "/energy", label: "Energy Infrastructure (Coming Soon)" },
    ],
  },
  { href: "/materials", label: "Critical Materials" },
  { href: "/tools", label: "Tools" },
  {
    href: "/about",
    label: "About Us",
    subLinks: [
      { href: "/about/terms", label: "Terms & Conditions" },
      { href: "/about/privacy", label: "Privacy Policy" },
      { href: "/about/ai-guidelines", label: "Research Methodology" },
      { href: "/about/contact", label: "Contact Us" },
    ],
  },
];

interface NavbarProps {
  logoUrl?: string | null;
}

export default function Navbar({ logoUrl }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const [lang, setLang] = useState("en");

  useEffect(() => {
    // Determine initial language from googtrans cookie
    const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/);
    if (match && match[1]) {
      setLang(match[1]);
    }
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setLang(code);
    if (code === "en") {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    } else {
      document.cookie = `googtrans=/en/${code}; path=/;`;
    }
    window.location.reload();
  };

  // Don't show navbar on admin pages (they have their own)
  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav className="fixed top-16 z-40 w-full bg-black/60 backdrop-blur-xl border-b border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="GeoMoney TV"
                className="h-10 w-10 object-contain rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-geo-gold to-yellow-600" />
            )}
            <span className="text-lg font-bold tracking-widest text-white hidden sm:block">
              GeoMoney
            </span>
            <span className="hidden sm:inline-block text-[10px] font-bold tracking-widest text-yellow-400 border border-yellow-400/50 rounded px-1.5 py-0.5 bg-yellow-400/10">
              BETA
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <div key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium tracking-wide transition-all duration-200 block ${
                      isActive
                        ? "text-geo-gold bg-geo-gold/10"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                  {link.subLinks && (
                    <div className="absolute top-full left-0 pt-2 w-56 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
                      <div className="bg-black/95 border border-white/10 rounded-xl overflow-hidden py-2 shadow-xl backdrop-blur-xl">
                        {link.subLinks.map((sub) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-geo-gold/10 hover:text-geo-gold transition-colors"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <select
              value={lang}
              onChange={handleLanguageChange}
              className="bg-transparent text-sm text-gray-300 font-medium p-1 cursor-pointer focus:outline-none hover:text-white transition-colors"
            >
              {LANGUAGES.map((langOpt) => (
                <option
                  key={langOpt.code}
                  value={langOpt.code}
                  className="bg-geo-dark text-white"
                >
                  {langOpt.label}
                </option>
              ))}
            </select>

            {session?.user ? (
              <SignOutButton />
            ) : (
              <Link
                href="/auth/signin"
                className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium hover:bg-white/10 text-white transition-colors"
              >
                Account
              </Link>
            )}

            <Link
              href="#waitlist"
              className="hidden lg:flex rounded-full bg-blue-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors items-center whitespace-nowrap"
            >
              Get Pro Access
            </Link>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-black/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium tracking-wide transition-all ${
                    isActive
                      ? "text-geo-gold bg-geo-gold/10"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
