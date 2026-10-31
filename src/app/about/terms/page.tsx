import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata = {
  title: "Terms & Conditions | GeoMoney",
  description: "GeoMoney Intelligence Platform terms and conditions.",
};

const SECTIONS = [
  {
    title: "1. Acceptance of Terms and Eligibility",
    body: `By accessing or using GeoMoney, creating an account, or purchasing a subscription, you agree to these Terms & Conditions and the policies referenced in them. If you do not agree, do not use the Platform. If you use GeoMoney on behalf of an organization, you represent that you are authorized to accept these Terms on its behalf.

You are responsible for ensuring that your use of the Platform is lawful in your jurisdiction and that you have the legal capacity to enter into these Terms.`,
  },
  {
    title: "2. Description and Scope of the Service",
    body: `GeoMoney Intelligence Platform is a web-based subscription software and information service covering geopolitics, energy systems, commodities, critical materials, infrastructure, global markets and related strategic developments. Depending on the plan and feature availability, the Platform may provide research, briefings, dashboards, visualizations, monitoring tools and AI-assisted analytical features.

Individual features, datasets, update frequencies, usage limits and access rights vary by plan. The plan description and applicable limits presented at the time of purchase form part of the subscription offering. Features labelled “beta,” “preview,” “coming soon,” or similar are not included in a paid subscription unless they are expressly identified as included.`,
  },
  {
    title: "3. Information Only — Not Professional Advice",
    body: `GeoMoney publishes information and analysis for research, education and general decision-support purposes. Platform content is not personalized investment, financial, legal, tax or other regulated professional advice, and is not an offer to buy or sell securities or other financial instruments.

Analytical conclusions, projections, scenarios and risk assessments contain uncertainty. You should independently evaluate material decisions and, where appropriate, seek advice from qualified professionals. You remain responsible for decisions made using Platform content.`,
  },
  {
    title: "4. Accounts and Account Security",
    body: `You must provide accurate information when registering, subscribing or requesting support, and maintain the confidentiality of your login credentials. You are responsible for activity occurring through your account, except to the extent attributable to our acts or omissions or otherwise provided by applicable law.

Notify us promptly at info@geomoneytv.com if you believe your account has been accessed without authorization. Access rights are personal to the account holder or licensed organization and may not be shared, resold or transferred except as expressly permitted by the applicable plan.`,
  },
  {
    title: "5. Subscription Plans, Pricing and Access",
    body: `GeoMoney may offer free access, paid subscriptions and, in the future, custom organizational arrangements. Current prices, currencies, billing intervals, included features and material limits are displayed on the applicable pricing and checkout pages. Only the plan selected and confirmed at checkout is purchased.

Unless the checkout clearly states a different currency, published GeoMoney paid subscription prices are denominated in US dollars (USD). Any conversion or additional charges applied by your card issuer or bank are determined by that financial institution. Applicable taxes, if any, will be disclosed during checkout before payment is confirmed.

Paid access starts once the subscription is successfully established and the associated entitlements have been provisioned. The Platform may update available plans over time; introducing a new plan does not automatically change an existing subscription.`,
  },
  {
    title: "6. Payment Processing",
    body: `Vidyata Hub Inc. is responsible for selling and delivering GeoMoney subscriptions. Stripe processes payments on its behalf as a third-party payment services provider. By purchasing a paid subscription, you authorize the applicable recurring charges described at checkout to the payment method you provide.

Payment processing may involve Stripe and relevant banking or card-network partners. We do not require customers to provide full card numbers through GeoMoney’s own support channels. If a payment fails, access may be limited or suspended in accordance with the billing status and applicable law. You may contact us regarding a billing error or a payment you do not recognize.`,
  },
  {
    title: "7. Automatic Renewal, Price Changes and Notices",
    body: `Unless explicitly stated otherwise at checkout, paid subscriptions renew automatically at the end of each billing period (for example, monthly or annually). The renewal amount and interval are displayed before the initial purchase. The subscription continues until you cancel or it is otherwise terminated under these Terms.

If we change subscription pricing or other material commercial terms, changes will apply only as permitted by your agreement and applicable law. We will provide advance notice and obtain consent when required. Changes to pricing for new customers do not automatically alter existing customer charges.`,
  },
  {
    title: "8. Cancellation and End of Paid Access",
    body: `You may cancel a paid subscription at any time through any subscription-management feature available in your account or by contacting info@geomoneytv.com. We will process cancellation requests in accordance with the subscription terms and applicable law.

Unless a different cancellation outcome is clearly shown or required by law, cancellation stops future renewals and paid access continues until the end of the current paid billing period. Cancelling does not ordinarily create a prorated refund for unused time, subject to the Refund Policy and any statutory rights. Confirmation of cancellation will be provided through the available account or email channel.

Merely deleting an app, logging out or ceasing to use the Platform does not itself cancel a recurring subscription.`,
  },
  {
    title: "9. Refunds, Duplicate Charges and Billing Disputes",
    body: `Our Refund Policy explains when refunds may be available for digital subscription purchases, including errors such as verified duplicate charges and cases where access cannot be delivered or restored. Refund eligibility is assessed under that policy and applicable law; nothing in these Terms limits non-waivable consumer rights.

For billing questions, duplicate charges, or access problems, contact info@geomoneytv.com. Please do not include full payment-card details in email. The current Refund Policy is available at https://geomoneytv.com/about/refund-policy.`,
  },
  {
    title: "10. Permitted Use and Restrictions",
    body: `You may use the Platform and any included research, dashboards or analytical tools only within the rights and limits of your plan. Except where permitted by law or separately licensed, you must not redistribute or resell paid content or datasets; share paid account access beyond authorized users; scrape or systematically extract protected Platform content; interfere with Platform security or availability; or use the service unlawfully.

Commercial or institutional use, redistribution, API access, embedding, automated access and publication of third-party data may require separate permissions or licensing. Where third-party data carries additional usage restrictions, those restrictions apply to the extent communicated through the Platform or relevant licence terms.`,
  },
  {
    title: "11. Intellectual Property and Third-Party Material",
    body: `The Platform’s original software, branding, analysis and other owned content are the property of Vidyata Hub Inc. or its licensors and are protected by applicable intellectual property laws. Use of the Platform does not transfer ownership of that intellectual property.

Certain market data, maps, documents, images, videos, feeds or other materials may be owned by third parties and used under permission, licence or other lawful terms. Attribution and third-party notices remain applicable. Nothing in these Terms purports to transfer ownership of third-party content to Vidyata Hub Inc.`,
  },
  {
    title: "12. Research Quality, Data Limitations and AI-Assisted Features",
    body: `GeoMoney seeks to provide useful, attributable and responsibly presented intelligence, but information may be delayed, incomplete, unavailable, inaccurate, revised or based on estimates. Live or real-time status should not be assumed unless expressly stated for a particular data source or feature.

Some research or analytical features may involve automated or AI-assisted methods. Outputs can contain errors and should be checked against relevant sources before being relied upon. Our separate Research Methodology & AI Transparency page describes our approach and limitations.`,
  },
  {
    title: "13. Newsletter and Service Communications",
    body: `If you subscribe to The GeoMoney Brief or other optional newsletters, we will send the communications you requested and provide an unsubscribe mechanism for marketing or editorial emails. You may also receive essential account, security, payment and service communications connected with your use of the Platform, as permitted by applicable law.

Newsletter subscriptions and paid GeoMoney subscriptions are separate unless explicitly stated otherwise.`,
  },
  {
    title: "14. Availability, Changes and Suspension",
    body: `We may maintain, improve, replace or discontinue features, and may temporarily interrupt access for maintenance, security or technical reasons. We will aim to communicate material changes affecting paid services and address service failures reasonably. Any refund or other remedy for non-delivery is governed by our Refund Policy and applicable law.

We may restrict or suspend access for serious misuse, suspected fraud, security risks or material breaches of these Terms, subject to applicable law and any appropriate opportunity to resolve the issue.`,
  },
  {
    title: "15. Disclaimers and Limitation of Liability",
    body: `To the extent permitted by applicable law, the Platform and its information are provided without warranties of uninterrupted operation, complete accuracy or fitness for a particular investment or commercial decision. We do not guarantee the outcome of decisions based on our content.

To the extent permitted by law, Vidyata Hub Inc. is not responsible for indirect or consequential losses arising from use of the Platform. Any limitation of liability must be interpreted consistently with applicable consumer rights and cannot exclude liabilities that the law does not permit us to exclude. Nothing here limits liability for fraud, wilful misconduct or other liability that cannot lawfully be restricted.`,
  },
  {
    title: "16. Updates to These Terms",
    body: `We may update these Terms to reflect changes in the Platform, its legal requirements or business operations. The revision date will appear at the top of this page. We will provide additional notice, and obtain consent where required, for changes that materially affect existing subscriptions or customer rights. An update does not retrospectively alter a completed transaction except where lawfully permitted.`,
  },
  {
    title: "17. Governing Law and Mandatory Rights",
    body: `These Terms are governed by the laws of Ontario and the applicable federal laws of Canada, except to the extent mandatory consumer protection or other laws of a customer’s jurisdiction require otherwise. Nothing in these Terms deprives consumers of rights that cannot legally be waived.`,
  },
  {
    title: "18. Contact and Related Policies",
    body: `For subscription questions, cancellation requests, billing issues or questions about these Terms, contact Vidyata Hub Inc. at info@geomoneytv.com.

Related public pages: Privacy Policy — https://geomoneytv.com/about/privacy; Refund Policy — https://geomoneytv.com/about/refund-policy; Research Methodology & AI Transparency — accessible from the About page.`,
  },
];

export default function TermsPage() {
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
          <div className="p-3 rounded-xl bg-geo-gold/10 border border-geo-gold/20">
            <FileText className="w-8 h-8 text-geo-gold" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Terms & Conditions</h1>
            <p className="text-gray-400 text-sm mt-1">Last updated: 30 October 2026</p>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <p className="text-sm text-gray-300 leading-relaxed">
            GeoMoney Intelligence Platform (also referred to in these Terms as “GeoMoney,”
            “the Platform,” “we,” “us,” or “our”) is operated by Vidyata Hub Inc., a
            corporation incorporated under the laws of Canada. Vidyata Hub Inc. is the
            seller and service provider for subscriptions offered through the Platform.
            Payments for paid subscriptions are processed securely by Stripe on its behalf.
          </p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <section
              key={section.title}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
            >
              <h2 className="text-lg font-semibold text-geo-gold mb-3">
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