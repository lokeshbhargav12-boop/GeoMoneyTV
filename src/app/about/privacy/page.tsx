import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | GeoMoney",
  description: "GeoMoney Intelligence Platform privacy policy.",
};

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: `We collect personal information that is reasonably necessary for the purposes described in this Policy. Depending on how you interact with the Platform, this may include:

• Account and contact information: your name, email address, account credentials or authentication identifiers, organization name where supplied, and communication preferences.
• Subscription and billing information: selected plan, transaction and invoice records, billing name and address, payment status, applicable tax information, and limited payment-method details made available by our payment processor.
• Newsletter and support information: email subscriptions, messages you send, support requests, feedback, and information you voluntarily provide in correspondence.
• Usage and device information: pages visited, features used, approximate location inferred from network data, IP address, device or browser information, diagnostic logs, and interactions relevant to service operation, security and analytics.
• Content you submit to interactive features, if any: information entered or uploaded when using a feature, to the extent that feature is offered and you choose to use it.`,
  },
  {
    title: "2. How We Collect and Use Information",
    body: `We collect information directly when you register, subscribe, contact us or use a feature; automatically through your interaction with the Platform; and, where relevant, from service providers such as Stripe that help deliver and administer our services.

We use personal information to operate and secure the Platform; establish and manage accounts and subscription permissions; process payments, invoices, refunds and billing enquiries; deliver requested newsletters and service communications; provide support; understand and improve usability and reliability; prevent fraud or misuse; and comply with legal, accounting, tax and regulatory obligations.

We may use aggregated or de-identified usage statistics for product analysis and research, provided they do not reasonably identify an individual.`,
  },
  {
    title: "3. Subscription Payments and Stripe",
    body: `Vidyata Hub Inc. is the seller of GeoMoney Intelligence Platform subscriptions. Stripe is our third-party payment processing provider.

When you purchase a subscription, Stripe may process payment method details, billing and contact information, transaction details, fraud-prevention signals and other information required to authorize and administer your payment. We receive the information needed to manage your purchase and subscription, such as payment status, amounts, customer identifiers, billing details, and limited payment-method metadata. We do not seek to collect or store complete payment card numbers or card security codes in our own systems.

Stripe processes information under its applicable contractual obligations and privacy practices, including for certain independent legal, compliance and fraud-prevention purposes. Please review Stripe’s Privacy Policy at https://stripe.com/privacy for further details.`,
  },
  {
    title: "4. Service Providers and Disclosure",
    body: `We do not sell or rent your personal information to third parties for their own marketing purposes. We may disclose information to service providers acting on our behalf where necessary to operate the Platform, including providers of payment processing, website hosting, cloud infrastructure, authentication, email delivery, customer support, security and usage analytics.

We may also disclose information to professional advisers, regulators, law-enforcement authorities or other parties where required or permitted by law, or where reasonably necessary to protect rights, users, or the security of the Platform. If the business undergoes a merger, financing, reorganization or transfer of assets, relevant information may be disclosed or transferred as permitted by law and subject to appropriate safeguards.

We seek to limit disclosures to what is needed for their stated purpose and use reasonable contractual, organizational or technical safeguards when providers handle information for us.`,
  },
  {
    title: "5. Cookies, Analytics and Tracking",
    body: `The Platform may use cookies and similar technologies for essential functions such as account sessions, security and remembering preferences. We may also use analytics technologies to understand website performance and feature usage.

Where applicable law requires consent for non-essential cookies or similar tracking, we will seek that consent before using them. You can restrict or delete cookies through your browser settings, although doing so may affect certain Platform functions. If additional cookie controls are made available on the Platform, you may use those controls to manage the relevant preferences.`,
  },
  {
    title: "6. Newsletter and Communications",
    body: `If you opt in to The GeoMoney Brief or another optional newsletter, we use your contact details to send the requested communications. You may unsubscribe from marketing or newsletter emails through the unsubscribe mechanism provided in those messages or by contacting us.

You may still receive non-marketing messages that are necessary to administer your account, process payments, notify you of material service changes or address security issues. Newsletter registration does not itself create a paid subscription.`,
  },
  {
    title: "7. International Processing and Transfers",
    body: `We are based in Canada, but some service providers may store, access or process personal information in the United States or other jurisdictions. Information processed abroad may be subject to the laws and lawful-access requirements of those jurisdictions.

Where personal information is transferred for processing, we remain responsible for meeting applicable privacy obligations and seek to use appropriate contractual, organizational and technical protections. If particular laws confer additional rights concerning international transfers, we will address those rights as required.`,
  },
  {
    title: "8. Data Security",
    body: `We use reasonable administrative, technical and organizational safeguards appropriate to the sensitivity of the information involved. Measures may include access restrictions, secure communications, controlled service-provider access and monitoring for unauthorized activity.

No online service or transmission method is completely secure. We cannot guarantee absolute security. If you believe your account or personal information has been compromised, contact us promptly using the address below.`,
  },
  {
    title: "9. Data Retention",
    body: `We retain personal information only for as long as reasonably necessary to provide the Platform and accomplish the purposes described in this Policy, or for periods required by law. Retention depends on the nature of the record: for example, account data may remain while an account is active; financial and transaction records may be retained for applicable tax, accounting and legal obligations; and support records may be kept to resolve enquiries or disputes.

If you unsubscribe from a newsletter, we will stop sending the relevant marketing communications, while retaining minimal suppression information where necessary to honour your choice. When information is no longer needed, we take reasonable steps to delete, anonymize or securely dispose of it, subject to lawful retention requirements.`,
  },
  {
    title: "10. Your Privacy Rights and Choices",
    body: `Subject to applicable law and any lawful exceptions, you may request access to personal information held about you, ask us to correct inaccurate information, withdraw consent where consent is the applicable basis for processing, or request deletion of personal information that we are no longer required to retain.

You may also ask questions about our handling of personal information or complain about our privacy practices. We may need to confirm your identity before responding to certain requests. Some information must be retained or processed for contractual, security, tax or legal reasons, even after a request for deletion or consent withdrawal.

Depending on your location, you may have additional rights under applicable privacy legislation, including rights to object to certain processing, request restriction or portability, or make a complaint to a competent privacy regulator.`,
  },
  {
    title: "11. Children’s Privacy",
    body: `The Platform is intended for a general audience of adults and professional or educational users. We do not knowingly solicit personal information from children in circumstances that would require parental consent without obtaining the consent required by applicable law. If you believe a child has provided personal information inappropriately, please contact us.`,
  },
  {
    title: "12. Changes to This Policy",
    body: `We may update this Privacy Policy to reflect changes to our services, data practices, technologies or legal obligations. We will publish the updated version and its revision date on this page. When required by law, we will provide additional notice or seek consent for material changes. Any change will apply in accordance with applicable law.`,
  },
  {
    title: "13. Privacy Contact",
    body: `Vidyata Hub Inc. is responsible for handling privacy enquiries relating to the GeoMoney Intelligence Platform. For requests, corrections, complaints or questions about this Policy, contact us at info@geomoneytv.com.

Website: https://geomoneytv.com`,
  },
];

export default function PrivacyPolicyPage() {
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
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
            <p className="text-gray-400 text-sm mt-1">Last updated: 30 October 2026</p>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <p className="text-sm text-gray-300 leading-relaxed">
            This Privacy Policy explains how Vidyata Hub Inc. ("Vidyata Hub", "we",
            "us" or "our"), a corporation incorporated under the laws of Canada,
            collects, uses, discloses and protects personal information in connection with
            the GeoMoney Intelligence Platform, available at geomoneytv.com (the
            "Platform"). It covers visits to the website, account registration,
            subscriptions, newsletters, support requests and use of Platform features.
            GeoMoney TV is an associated media and publishing brand operated by Vidyata Hub
            Inc. When you follow links to independent third-party services, their own
            privacy policies may apply.
          </p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <section
              key={section.title}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
            >
              <h2 className="text-lg font-semibold text-blue-300 mb-3">
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