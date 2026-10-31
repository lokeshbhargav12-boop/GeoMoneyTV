import Link from "next/link";
import { ArrowLeft, BrainCircuit } from "lucide-react";

export const metadata = {
  title: "Research Methodology & AI Transparency | GeoMoney",
  description:
    "GeoMoney research methodology, AI transparency, and editorial standards.",
};

const SECTIONS = [
  {
    title: "Important Disclaimer",
    body: `GeoMoney provides geopolitical, energy, commodity, industrial, critical-materials and macroeconomic research for informational, educational and analytical purposes only. The Platform does not provide personalized financial, investment, legal, tax or other professional advice. It does not act as an investment adviser, broker or trading platform.

Analysis, scenario illustrations, indicators and other material are not trade instructions, investment recommendations, offers to buy or sell an asset, or guarantees of future outcomes. Users should independently verify material information and consult appropriately qualified professionals where decisions require specialist advice.`,
  },
  {
    title: "1. Research Approach and Evidence",
    body: `GeoMoney examines the relationships among political developments, energy systems, supply chains, infrastructure, technology, trade and markets. Its analysis may draw on public records, government and intergovernmental publications, company disclosures, published research, reputable reporting, authorized third-party datasets and analytical interpretation.

We aim to distinguish reported facts from estimates, assumptions, interpretations and hypothetical scenarios. Where practicable, substantive assessments are supported by identifiable sources and contextual information such as dates, geography, units and methodological qualifications. The presence of a source does not, by itself, guarantee its accuracy or completeness.

GeoMoney may use structured analytical frameworks to compare developments across regions or sectors. Such frameworks are tools for interpretation, not independent proof of a conclusion.`,
  },
  {
    title: "2. Data Coverage, Timing and Limitations",
    body: `Information can differ in quality, completeness and reporting frequency. Public releases may lag events; third-party feeds may be delayed, revised, interrupted or subject to licensing restrictions. Dashboard figures, mapped assets and other displayed metrics can reflect coverage boundaries rather than a complete view of a sector or market.

The time of publication, the observation period and the time a dataset was last refreshed are not necessarily the same. Where available, users should consult source labels, timestamps, units, methodology notes and feature-specific explanations before drawing conclusions. No information on the Platform should be assumed to be real-time unless it is expressly identified as such.`,
  },
  {
    title: "3. AI-Assisted Research and Analysis",
    body: `GeoMoney may use AI-assisted tools for tasks such as organizing source material, summarizing information, identifying possible patterns, developing scenario questions, supporting data exploration and drafting or editing content. The extent of AI involvement can vary by article, report, dataset and feature.

AI systems can produce inaccurate summaries, invented references, unsupported inferences or misleading levels of confidence. AI output is therefore not treated as independent evidence or as proof that a claim has been verified. Users should read AI-assisted material in conjunction with cited sources, assumptions and the limitations of the relevant tool.`,
  },
  {
    title: "4. Human Oversight and Editorial Judgment",
    body: `Human editorial judgment informs the selection, interpretation and presentation of GeoMoney research and published analysis. We seek to review consequential claims and communicate uncertainty responsibly. The extent and type of review may vary by publication and workflow.

Automated indicators, visualizations, data feeds and interactive tools may generate or update outputs without individual human review of every displayed value or response. Users should not assume that every metric, automated response or generated scenario has been manually checked. AI-assisted tools support research; they do not replace independent evaluation.`,
  },
  {
    title: "5. Analytical Language and Standards",
    body: `We favour wording that identifies the evidence and the degree of uncertainty. For example, “available evidence suggests,” “under these assumptions,” “reported data indicate,” or “GeoMoney assessment” distinguishes analysis from established fact.

We avoid presenting speculative outcomes as certainties and do not use editorial research to issue personalized buy, sell or hold instructions. Where a conclusion depends materially on a disputed source, modeling assumption or incomplete dataset, that limitation should be made clear.`,
  },
  {
    title: "6. Confidence, Indicators and Scenario Labels",
    body: `Some GeoMoney content or tools may use qualitative descriptors such as limited, moderate or elevated confidence; signal strength; or system state. Their meaning depends on the context and underlying methodology, and should be explained where they appear.

Unless expressly defined otherwise for a specific tool, these descriptors express an analytical assessment of evidence, coverage or conditions. They are not statistically calibrated probabilities, market-trading signals, investment ratings or assurances that an outcome will occur.`,
  },
  {
    title: "7. Scenarios and Forward-Looking Assessments",
    body: `Scenarios explore plausible developments under stated assumptions; they are not predictions of what will necessarily happen. Actual outcomes may differ because of policy changes, new evidence, infrastructure disruptions, market responses, technological developments or other factors.

Assessments may become outdated quickly. GeoMoney does not warrant the continuing accuracy, completeness, timeliness or suitability of its analysis for any particular decision.`,
  },
  {
    title: "8. Corrections and Updates",
    body: `Sources can be corrected and datasets can be revised. Where GeoMoney becomes aware of a material error in content it controls, we may correct, clarify or update that material as appropriate. Not every editorial adjustment or automated data refresh will receive a separate public correction notice.

Readers may report suspected factual errors, broken references or misleading representations using the contact address below. Include the page or report link and supporting information where possible.`,
  },
  {
    title: "9. AI Content and Editorial Safeguards",
    body: `GeoMoney does not knowingly publish fabricated sourcing, invented quotations, misleading impersonations, undisclosed paid promotions or AI-generated material presented as independently verified when it is not. Our content policies do not authorize AI tools to provide personalized investment recommendations or trade-execution instructions on GeoMoney’s behalf.

These are editorial standards and intended safeguards, not a claim that automated systems are infallible. Content or system behaviour that appears inconsistent with these standards should be reported for review.`,
  },
  {
    title: "10. Responsible Use and Transparency",
    body: `GeoMoney research should be considered one input among others, especially when decisions carry financial, operational, legal or safety consequences. Maps, dashboards, models and AI-assisted outputs can simplify complex conditions and should not substitute for primary-source verification or professional judgment.

Content and tools may incorporate AI-assisted processes. We seek to communicate their relevant limitations without treating automation as a substitute for accountability. Related information is available in our Terms & Conditions and Privacy Policy.`,
  },
  {
    title: "11. Contact",
    body: `For research-methodology questions, transparency enquiries or correction requests, contact info@geomoneytv.com.

Website: https://geomoneytv.com`,
  },
];

export default function AiGuidelinesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-geo-dark via-black to-geo-dark text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <Link
          href="/about"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-geo-gold transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to About
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <BrainCircuit className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              Research Methodology & AI Transparency
            </h1>
            <p className="text-gray-400 text-sm mt-1">Last updated: 30 October 2026</p>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <p className="text-sm text-gray-300 leading-relaxed">
            The GeoMoney Intelligence Platform is a digital research and analytics service
            operated by Vidyata Hub Inc., a corporation incorporated under the laws of
            Canada. This page explains how GeoMoney approaches research, sources, analytical
            uncertainty, AI-assisted work, and editorial responsibility. The methods
            relevant to individual tools or datasets may differ and should be read alongside
            any module-specific notes.
          </p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <section
              key={section.title}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
            >
              <h2 className="text-lg font-semibold text-purple-300 mb-3">
                {section.title}
              </h2>
              {section.body.split("\n\n").map((paragraph) => (
                <p key={paragraph} className="text-sm text-gray-300 leading-relaxed mb-3">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}