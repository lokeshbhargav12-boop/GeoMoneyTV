import Link from "next/link";
import {
  FileText,
  Shield,
  BrainCircuit,
  MessageSquare,
  ChevronRight,
  RefreshCcw,
} from "lucide-react";

export const metadata = {
  title: "About GeoMoney",
  description:
    "Learn about GeoMoney Intelligence Platform, our policies, and research methodology.",
};

const ABOUT_LINKS = [
  {
    href: "/about/terms",
    icon: FileText,
    title: "Terms & Conditions",
    description:
      "The terms governing account access, subscriptions, use of the platform, and applicable limitations.",
    color: "text-geo-gold",
    bg: "bg-geo-gold/10",
    border: "border-geo-gold/20",
  },
  {
    href: "/about/privacy",
    icon: Shield,
    title: "Privacy Policy",
    description:
      "How we collect, use, disclose, and protect personal information.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    href: "/about/ai-guidelines",
    icon: BrainCircuit,
    title: "Research Methodology & AI Transparency",
    description:
      "Our research practices, data limitations, and approach to AI-assisted analysis.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    href: "/about/refund-policy",
    icon: RefreshCcw,
    title: "Refund Policy",
    description:
      "Subscription cancellation, refund eligibility, and how to request assistance.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    href: "/about/contact",
    icon: MessageSquare,
    title: "Contact Us",
    description:
      "How to reach GeoMoney for general inquiries, partnerships, and customer support.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mb-16 space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            About{" "}
            <span className="bg-gradient-to-r from-geo-gold to-yellow-600 bg-clip-text text-transparent">
              GeoMoney
            </span>
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            GeoMoney Intelligence Platform is a subscription-based digital research and
            analytics service focused on the intersection of geopolitics, energy systems,
            critical materials, industry, trade, and global markets. The platform is
            accessible at geomoneytv.com and is owned and operated by Vidyata Hub Inc., a
            corporation incorporated under the laws of Canada.
          </p>
          <p className="text-base text-gray-400 leading-relaxed">
            Energy infrastructure, commodity supply chains, technological dependencies, and
            policy decisions can shape markets and geopolitical outcomes. GeoMoney examines
            these connections through structured research, analytical tools, and data
            visualization, with attention to the evidence and uncertainty behind each
            assessment.
          </p>
          <p className="text-base text-gray-400 leading-relaxed">
            GeoMoney brings together intelligence briefings, research reports, and topic-
            specific analytical tools, including coverage of energy systems and critical
            materials. Modules, datasets, reporting formats, and advanced capabilities are
            introduced in phases. Their availability and access conditions depend on the
            published status of each feature and the subscription plan selected.
          </p>
          <p className="text-base text-gray-400 leading-relaxed">
            GeoMoney TV is the associated media and publishing brand operated by Vidyata Hub
            Inc. It produces visual briefings and documentary-style explanations covering
            geopolitics, markets, energy systems, and the global economic forces influencing
            them.
          </p>
          <p className="text-base text-gray-400 leading-relaxed">
            Our research draws on publicly available information, permitted third-party
            sources, and analytical interpretation. Some research workflows may use AI-
            assisted tools. Our Research Methodology & AI Transparency page explains the
            principles, limitations, and oversight practices relevant to our work.
          </p>
          <p className="text-base text-gray-400 leading-relaxed">
            GeoMoney Intelligence Platform and GeoMoney TV are owned and operated by Vidyata
            Hub Inc., a corporation incorporated under the laws of Canada.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed italic border-l-2 border-geo-gold/30 pl-4">
            All content and tools are provided for informational, educational, and analytical
            purposes only. GeoMoney does not provide personalized investment, financial,
            legal, tax, or other professional advice.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Explore our policies and information:
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {ABOUT_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative overflow-hidden rounded-2xl border ${item.border} ${item.bg} p-8 transition-all hover:scale-[1.02] hover:shadow-xl`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${item.bg} border ${item.border}`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <h2 className="text-xl font-bold text-white group-hover:text-geo-gold transition-colors">
                    {item.title}
                  </h2>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-geo-gold group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-gray-400 leading-relaxed">{item.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-16 border-t border-white/10 pt-8">
          <p className="text-gray-500 text-sm leading-relaxed max-w-4xl">
            GeoMoney provides geopolitical, energy, commodity, industrial, and macroeconomic
            intelligence for informational and research purposes only. It does not provide
            financial, investment, legal, or tax advice. The content is based on publicly
            available information and analytical interpretation and may not be complete or
            accurate. Users should independently verify material information before relying
            on it. Some content may incorporate AI-assisted analysis as part of the research
            process.
          </p>
        </div>
      </div>
    </main>
  );
}