"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  FileText,
  Video,
  Gem,
  Mail,
  Home,
  Zap,
  Users,
  Settings,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/articles", label: "Articles", icon: FileText },
  { href: "/admin/videos", label: "Videos", icon: Video },
  { href: "/admin/rare-earth", label: "Rare Earth", icon: Gem },
  { href: "/admin/newsletters", label: "Newsletters", icon: Mail },
  { href: "/admin/homepage", label: "Homepage", icon: Home },
  { href: "/admin/energy", label: "Energy", icon: Zap },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
    if (session && session.user.role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-geo-dark">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-geo-dark text-white flex">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/90 border-r border-white/10 flex flex-col transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10 shrink-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-geo-gold to-yellow-600 shrink-0" />
          <span className="text-lg font-bold tracking-wide">Admin Panel</span>
          <span className="text-[9px] font-bold tracking-widest text-yellow-400 border border-yellow-400/50 rounded px-1 py-0.5 bg-yellow-400/10 shrink-0">
            BETA
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact
              ? pathname === href
              : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-geo-gold bg-geo-gold/10 border-r-2 border-geo-gold"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + Sign out */}
        <div className="border-t border-white/10 px-6 py-4 shrink-0">
          <p className="text-xs text-gray-500 truncate mb-3">
            {session.user.email}
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 w-full rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile only) */}
        <header className="lg:hidden flex items-center gap-4 px-4 h-14 border-b border-white/10 bg-black/50 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold">Admin Panel</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20"
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
