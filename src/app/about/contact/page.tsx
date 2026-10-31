import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Contact GeoMoney",
  description:
    "For questions about GeoMoney Intelligence Platform, account access, subscriptions, billing, research, or business inquiries.",
};

export default function ContactPage() {
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

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <MessageSquare className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Contact GeoMoney</h1>
          </div>
        </div>

        <div className="space-y-8">
          <p className="text-lg text-gray-300 leading-relaxed">
            For questions about GeoMoney Intelligence Platform, account access,
            subscriptions, billing, research, or business inquiries, please contact us
            using the email address below.
          </p>

          <div className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-geo-gold/30 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-geo-gold" />
              <h3 className="font-bold text-lg">Contact Email</h3>
            </div>
            <a
              href="mailto:info@geomoneytv.com"
              className="text-geo-gold hover:text-yellow-400 transition-colors text-lg"
            >
              info@geomoneytv.com
            </a>
          </div>

          <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-semibold text-white mb-2">
                Subscription, billing & account assistance
              </h2>
              <p>
                For assistance with subscription access, invoices, renewals, cancellation,
                payment questions, or refund requests, email us and include the email
                address associated with your GeoMoney account and a brief explanation of
                the issue. Please do not send passwords, complete payment-card numbers, or
                card security codes by email.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-semibold text-white mb-2">
                Research, media & business inquiries
              </h2>
              <p>
                For research feedback, corrections, media inquiries, partnerships, or other
                business matters relating to GeoMoney Intelligence Platform or GeoMoney TV,
                use the same contact email.
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-400">
            Terms & Conditions&nbsp; |&nbsp; Privacy Policy&nbsp; |&nbsp; Refund Policy
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
            <p className="text-sm text-gray-300 leading-relaxed">
              GeoMoney Intelligence Platform and GeoMoney TV are owned and operated by{" "}
              <strong className="text-amber-400">Vidyata Hub Inc.</strong>, a corporation
              incorporated under the laws of Canada.
            </p>
          </div>

          <p className="text-xs text-gray-500">
            © 2026 Vidyata Hub Inc. All rights reserved. GeoMoney Intelligence Platform and
            GeoMoney TV are operated by Vidyata Hub Inc.
          </p>
        </div>
      </div>
    </main>
  );
}