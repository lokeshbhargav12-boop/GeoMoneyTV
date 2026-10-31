import Link from "next/link";
import { ArrowLeft, RefreshCcw } from "lucide-react";

export const metadata = {
  title: "Refund Policy | GeoMoney",
  description: "GeoMoney Intelligence Platform refund policy.",
};

const SECTIONS = [
  {
    title: "1. Scope",
    body: `This Policy applies to subscriptions purchased directly from Vidyata Hub Inc. for access to GeoMoney Intelligence Platform through geomoneytv.com. It should be read together with our Terms & Conditions and the price, currency, billing interval and plan description disclosed at checkout.

Creating a free account, joining a waitlist or subscribing to an optional newsletter does not, by itself, create a paid subscription or authorize a subscription charge. This Policy does not govern purchases made from unrelated third-party sellers.`,
  },
  {
    title: "2. Digital Subscriptions and General Refund Approach",
    body: `GeoMoney provides ongoing access to digital research, intelligence content, analytical tools and other features included in the customer’s purchased subscription plan. Once paid digital access has been provided, subscription charges are generally not refundable solely because a customer changes their mind, stops using the Platform or does not use all of the purchased billing period.

Exceptions may apply for verified billing errors, duplicate charges, material access or delivery problems, applicable law, or any more favourable refund commitment expressly provided at checkout. Nothing in this Policy removes or limits consumer rights or remedies that cannot lawfully be excluded.`,
  },
  {
    title: "3. Cancellation and Automatic Renewal",
    body: `Paid subscriptions renew automatically at the monthly, annual or other billing interval disclosed when the subscription is purchased, unless cancelled. You can request cancellation at any time through an available subscription-management feature in your account or by emailing info@geomoneytv.com. We will process verified requests without unreasonable delay and confirm the cancellation through the account or an available email channel.

Unless otherwise stated at purchase or required by applicable law, cancellation stops future renewals and paid access continues through the end of the current paid billing period. Cancellation alone does not ordinarily trigger a prorated refund of fees already paid for that period. To avoid a future renewal charge, submit the cancellation request before the next scheduled renewal date.

Stopping use of the Platform, logging out or deleting an app or browser bookmark does not automatically cancel an active paid subscription.`,
  },
  {
    title: "4. Circumstances in Which Refunds May Be Available",
    body: `We review refund requests in light of the circumstances, the purchased plan, our contractual commitments and applicable law. Situations that may qualify include:

• Duplicate charges for the same subscription or billing period, where confirmed after review.
• A verified billing error, including a charge that was not authorized under the applicable subscription terms.
• Failure to provide the purchased digital access, or a material access problem attributable to the Platform that we cannot remedy within a reasonable period.
• A material failure to deliver the service as expressly represented at the time of purchase, where a refund or other remedy is appropriate.
• Any cancellation, refund or other remedy required by applicable consumer protection law.

Depending on the circumstances and applicable law, we may offer a full or partial refund, another appropriate adjustment or a lawful remedy. Any credit or alternative resolution will not replace a mandatory legal right to a refund.`,
  },
  {
    title: "5. Access or Service Delivery Issues",
    body: `If paid access does not activate after a successful payment, or you cannot use material features that your subscription expressly includes, contact us using the details below. We may ask for the registered account email, transaction details, relevant error messages and reasonable steps taken to access the service.

We will investigate and seek to restore access or otherwise resolve the issue. Where access or delivery cannot be restored within a reasonable time, we will assess an appropriate refund or other remedy, taking into account the impact and duration of the issue and any mandatory legal rights. Brief maintenance periods, a customer’s connectivity problems or a temporary third-party data interruption do not automatically qualify for a refund, although each request will be considered on its facts.`,
  },
  {
    title: "6. Duplicate, Incorrect or Unrecognized Charges",
    body: `If you believe you were charged twice, charged an incorrect amount or charged without authorization, contact info@geomoneytv.com promptly. Provide the subscription account email, the charge date, amount and currency, and a brief description of the problem. Do not send your full card number, security code or banking credentials.

We will investigate relevant payment and subscription records and correct confirmed errors. You may also contact your bank or card issuer about an unrecognized charge or exercise any lawful dispute rights. Contacting GeoMoney first is encouraged where practical but is not a condition of exercising those rights.`,
  },
  {
    title: "7. How to Request a Refund",
    body: `Email info@geomoneytv.com with the subject “Refund Request.” Include the email associated with your GeoMoney account, the approximate transaction date, charge amount and currency, the relevant plan and the reason for the request. You may attach relevant screenshots or supporting details that do not expose sensitive payment credentials.

We may ask for additional information reasonably necessary to verify the transaction or assess the request. We aim to acknowledge and evaluate requests as promptly as reasonably practicable and will communicate the outcome through the available contact channel. Any legally required response or refund deadlines continue to apply.`,
  },
  {
    title: "8. Refund Method, Currency and Processing Time",
    body: `Approved refunds are ordinarily initiated to the original payment method used for the transaction, where supported, and are generally processed in the original charge currency. The time for a refund to appear depends on Stripe, the card network or payment method, and the customer’s financial institution; posting times can vary. We will provide information about the refund status when available.

If your bank converted a USD charge into another currency, any difference in the amount ultimately received after a refund may result from exchange rates or bank charges outside our control. Where the original payment method cannot receive a refund, we will communicate any lawful, supported alternative.`,
  },
  {
    title: "9. Payment Processing and Merchant Responsibility",
    body: `Vidyata Hub Inc. is responsible for the GeoMoney subscription service, refund decisions and applicable tax and legal obligations. Stripe provides third-party payment processing. Depending on your bank’s display practices, a GeoMoney subscription charge may appear with the statement descriptor “GEOMONEY” or a similar identifier. For questions about a GeoMoney purchase, contact Vidyata Hub Inc. using the details below.`,
  },
  {
    title: "10. Updates to This Policy",
    body: `We may update this Policy to reflect changes to the Platform, payment procedures or applicable legal requirements. The current version and its revision date will be published on this page. Changes will apply in accordance with applicable law and will not retrospectively remove rights that arose under an earlier purchase or mandatory legal protection.`,
  },
  {
    title: "11. Contact",
    body: `For cancellation, refund, billing or subscription-access enquiries, contact Vidyata Hub Inc. at info@geomoneytv.com.

Website: https://geomoneytv.com`,
  },
];

export default function RefundPolicyPage() {
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
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <RefreshCcw className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Refund Policy</h1>
            <p className="text-gray-400 text-sm mt-1">Last updated: 30 October 2026</p>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <p className="text-sm text-gray-300 leading-relaxed">
            GeoMoney Intelligence Platform is owned and operated by Vidyata Hub Inc., a
            corporation incorporated under the laws of Canada. Vidyata Hub Inc. is the seller
            of GeoMoney subscriptions. Payments are processed through Stripe, our third-party
            payment service provider. This Policy explains cancellations, refund requests and
            the treatment of billing errors for paid digital subscriptions.
          </p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <section
              key={section.title}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
            >
              <h2 className="text-lg font-semibold text-emerald-300 mb-3">
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