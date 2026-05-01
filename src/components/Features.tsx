'use client'

import Link from "next/link";
import { FileText, TrendingUp, Zap } from "lucide-react";

const features = [
  {
    title: "GeoMoney App",
    subtitle: "Coming Soon",
    icon: "mobile",
    href: "/features/app",
  },
  {
    title: "Analytics",
    subtitle: "Real-Time Global Macro Monitor",
    icon: "chart",
    href: "/features/analytics",
  },
  {
    title: "The GeoMoney Brief",
    subtitle: "3x Weekly Intelligence",
    icon: "mail",
    href: "/features/newsletter",
  },
  {
    title: "The GeoMoney Intelligence Report",
    subtitle: "Intelligence for Decision-Makers",
    icon: "file",
    href: "/features/weekly-brief",
  },
  {
    title: "Energy Hub",
    subtitle: "Renewables & Energy Transition",
    icon: "energy",
    href: "/energy",
  },
];

export default function Features() {
  return (
    <section className="bg-geo-dark px-4 py-8 border-b border-white/10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((feature, i) => (
            <Link
              key={i}
              href={feature.href}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-geo-gold/50 hover:bg-white/10 cursor-pointer"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg transition-all ${feature.icon === 'energy' ? 'bg-emerald-600/20 text-emerald-400 group-hover:text-emerald-300 group-hover:bg-emerald-600/30' : 'bg-blue-600/20 text-blue-400 group-hover:text-blue-300 group-hover:bg-blue-600/30'}`}>
                {feature.icon === "mobile" && <div className="h-6 w-4 rounded border-2 border-current" />}
                {feature.icon === "chart" && <TrendingUp className="h-6 w-6" />}
                {feature.icon === "mail" && <div className="h-6 w-6 rounded-full border-2 border-current" />}
                {feature.icon === "file" && <FileText className="h-6 w-6" />}
                {feature.icon === "energy" && <Zap className="h-6 w-6" />}
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-geo-gold transition-colors">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.subtitle}</p>

              {/* Arrow indicator */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-geo-gold">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
