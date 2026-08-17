import Link from "next/link";
import { ArrowLeft, Database, ExternalLink, ShieldCheck } from "lucide-react";
import { DATA_ATTRIBUTION } from "@/config/energyLayers";

export const metadata = {
  title: "Data Sources & Licensing | GeoMoney",
  description:
    "Licensing registry for the datasets powering the GeoMoney energy infrastructure globe.",
};

export default function AttributionPage() {
  const active = DATA_ATTRIBUTION.filter((d) => d.status === "active");
  const planned = DATA_ATTRIBUTION.filter((d) => d.status === "planned");

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#05070d] via-[#0a0f18] to-black pb-24 pt-32 text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/energy"
          className="mb-8 inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Energy Hub
        </Link>

        <div className="mb-10">
          <span className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-cyan-300">
            <ShieldCheck className="h-4 w-4" /> Licensing Registry
          </span>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            Data Sources & Attribution
          </h1>
          <p className="mt-3 max-w-2xl text-gray-400">
            The energy infrastructure globe is rendered from the datasets below.
            This page is the single licensing registry (spec §38) — every active
            and planned source is listed with its license before publication.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <Database className="h-5 w-5 text-emerald-400" /> Active datasets
          </h2>
          <div className="space-y-4">
            {active.map((d) => (
              <div
                key={d.key}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="mb-1 flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-white">{d.dataset}</span>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    {d.license}
                  </span>
                </div>
                <div className="text-sm text-gray-400">{d.provider}</div>
                {d.note && <p className="mt-2 text-xs text-gray-500">{d.note}</p>}
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-300 hover:underline"
                >
                  Source <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <Database className="h-5 w-5 text-amber-400" /> Pipeline (planned)
          </h2>
          <div className="space-y-4">
            {planned.map((d) => (
              <div
                key={d.key}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 opacity-80"
              >
                <div className="mb-1 flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-gray-200">{d.dataset}</span>
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    {d.license}
                  </span>
                </div>
                <div className="text-sm text-gray-500">{d.provider}</div>
                {d.note && <p className="mt-2 text-xs text-gray-500">{d.note}</p>}
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-300 hover:underline"
                >
                  Source <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
