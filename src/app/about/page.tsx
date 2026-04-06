import Link from "next/link";
import {
  FileText,
  Shield,
  BrainCircuit,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

export const metadata = {
  title: "About Us | GeoMoney",
  description:
    "Learn about GeoMoney — terms, privacy, research methodology, and how to contact us.",
};

const ABOUT_LINKS = [
  {
    href: "/about/terms",
    icon: FileText,
    title: "Terms & Conditions",
    description:
      "Our terms of service, liability limitations, and usage guidelines.",
    color: "text-geo-gold",
    bg: "bg-geo-gold/10",
    border: "border-geo-gold/20",
  },
  {
    href: "/about/privacy",
    icon: Shield,
    title: "Privacy Policy",
    description: "How we collect, use, and protect your personal information.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    href: "/about/ai-guidelines",
    icon: BrainCircuit,
    title: "Research Methodology",
    description:
      "Our research methodology, AI transparency, and how we use AI in our analysis.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    href: "/about/contact",
    icon: MessageSquare,
    title: "Contact Us",
    description:
      "Get in touch with the GeoMoney team for inquiries and support.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            About{" "}
            <span className="bg-gradient-to-r from-geo-gold to-yellow-600 bg-clip-text text-transparent">
              GeoMoney
            </span>
          </h1>
          <div className="space-y-4">
            <p className="text-lg text-gray-300 leading-relaxed">
              GeoMoney is a geopolitical analysis and market intelligence
              platform focused on the intersection of energy systems, resources,
              and global power.
            </p>
            <p className="text-base text-gray-400 leading-relaxed">
              We analyze how shifts in energy flows, commodity supply chains,
              financial systems, and policy decisions shape markets, economies,
              and geopolitical outcomes. Our work focuses on structured analysis
              across complex global dynamics.
            </p>
            <p className="text-base text-gray-400 leading-relaxed">
              The platform brings together multiple layers of analysis,
              including The GeoMoney Brief, the GeoMoney Intelligence Report,
              analytical tools, and AI-assisted research systems. Each component
              is designed to provide analytical perspectives on underlying
              global systems.
            </p>
            <p className="text-base text-gray-400 leading-relaxed">
              GeoMoney is the video and media arm of the GeoMoney platform. It
              delivers visual briefings and analysis across geopolitics,
              markets, and energy systems.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed italic mt-6 border-l-2 border-geo-gold/30 pl-4">
              All content is provided for informational and analytical purposes
              only and does not constitute financial, investment, legal, or
              other professional advice.
            </p>
          </div>
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
                  <div
                    className={`p-3 rounded-xl ${item.bg} border ${item.border}`}
                  >
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <h2 className="text-xl font-bold text-white group-hover:text-geo-gold transition-colors">
                    {item.title}
                  </h2>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-geo-gold group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-gray-400 leading-relaxed">
                {item.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Compliance Footer */}
        <div className="mt-16 border-t border-white/10 pt-8">
          <p className="text-gray-500 text-sm leading-relaxed max-w-3xl">
            GeoMoney provides geopolitical and market analysis for informational
            purposes only. This content does not constitute financial,
            investment, legal, or other professional advice and is not intended
            to guide decision-making. The content is based on publicly available
            information and analytical interpretation and may not be complete or
            accurate. Any actions taken based on this information are solely at
            your own risk. Some content may incorporate AI-assisted analysis as
            part of the research process.
          </p>
        </div>
      </div>
    </main>
  );
}
