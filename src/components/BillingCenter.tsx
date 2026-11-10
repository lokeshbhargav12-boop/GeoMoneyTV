"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CreditCard,
  Crown,
  ExternalLink,
  FileText,
  LayoutGrid,
  Loader2,
  LockKeyhole,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { BILLING_PLANS } from "@/lib/billing-plans";

type BillingTab = "plans" | "billing" | "payment-methods";

interface SubscriptionDetails {
  id: string;
  status: string;
  planId: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  price: {
    nickname: string;
    amount: number;
    currency: string;
    interval: string;
  } | null;
}

interface PaymentMethod {
  id: string;
  type: string;
  brand: string;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  number: string | null;
  description: string;
  status: string | null;
  amountPaid: number;
  amountDue: number;
  currency: string;
  created: string | null;
  hostedUrl: string | null;
  pdfUrl: string | null;
}

interface BillingData {
  configured: boolean;
  checkoutConfigured: boolean;
  mode: "test" | "live" | "not_configured";
  customerExists: boolean;
  currentPlan: string;
  subscription: SubscriptionDetails | null;
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
}

const TABS: { id: BillingTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "plans", label: "Plans", icon: LayoutGrid },
  { id: "billing", label: "Billing & invoices", icon: ReceiptText },
  { id: "payment-methods", label: "Payment methods", icon: WalletCards },
];

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount / 100);
}

function formatDate(value: string | null): string {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const positive = ["active", "trialing", "paid"].includes(status);
  const warning = ["past_due", "open", "unpaid", "incomplete"].includes(status);
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${
        positive
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : warning
            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
            : "border-white/15 bg-white/5 text-gray-400"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export default function BillingCenter() {
  const [activeTab, setActiveTab] = useState<BillingTab>("plans");
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadBilling = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load billing.");
      setData(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load billing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get("tab");
    if (requestedTab === "billing" || requestedTab === "payment-methods") {
      setActiveTab(requestedTab);
    }
    if (params.get("checkout") === "cancelled") {
      setNotice("Checkout was cancelled. No payment was taken; you can subscribe whenever you're ready.");
    }
    if (params.get("checkout") === "success") {
      setNotice("Checkout complete. Stripe may take a few seconds to synchronize your membership.");
    }
    loadBilling();
  }, [loadBilling]);

  const selectTab = (tab: BillingTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    url.searchParams.delete("checkout");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  };

  const redirectToStripe = async (endpoint: "checkout" | "portal") => {
    setAction(endpoint);
    setError("");
    try {
      const response = await fetch(`/api/billing/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: endpoint === "checkout" ? JSON.stringify({ planId: "basic" }) : undefined,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to contact Stripe.");
      const destination = new URL(result.url);
      if (!destination.hostname.endsWith(".stripe.com")) {
        throw new Error("Stripe returned an invalid redirect.");
      }
      window.location.assign(destination.toString());
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to contact Stripe.");
      setAction(null);
    }
  };

  const hasBasic = data?.currentPlan === "basic";
  const subscription = data?.subscription;

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-geo-gold" />
          <div>
            <h2 className="text-lg font-semibold">Plans & Billing</h2>
            <p className="mt-0.5 text-xs text-gray-500">Subscriptions, invoices and payment methods</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data?.mode !== "not_configured" && (
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                data?.mode === "test"
                  ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              Stripe {data?.mode}
            </span>
          )}
          <button
            type="button"
            onClick={loadBilling}
            disabled={loading}
            className="rounded-lg border border-white/10 p-2 text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            title="Refresh billing details"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="border-b border-white/10 px-4 pt-4">
        <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Billing sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => selectTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "border-geo-gold text-geo-gold"
                  : "border-transparent text-gray-500 hover:text-gray-200"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {notice && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && data && !data.checkoutConfigured && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-amber-200">Stripe sandbox setup required</h3>
              <p className="mt-1 text-xs leading-relaxed text-amber-100/70">
                Add <code>STRIPE_SECRET_KEY</code> and <code>STRIPE_BASIC_PRICE_ID</code> to the server
                environment to enable checkout. Add <code>STRIPE_WEBHOOK_SECRET</code> to synchronize
                subscription events. No payment can be taken until then.
              </p>
            </div>
          </div>
        )}

        {data?.mode === "live" && (
          <div className="mb-6 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
            Live Stripe keys are active. Real payment methods will be charged.
          </div>
        )}

        {loading && !data ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin text-geo-gold" /> Loading billing details...
          </div>
        ) : (
          <>
            {activeTab === "plans" && (
              <div>
                <div className="grid gap-4 md:grid-cols-2">
                  {BILLING_PLANS.map((plan) => {
                    const isCurrent =
                      (plan.id === "basic" && hasBasic) || (plan.id === "free" && !hasBasic);
                    return (
                      <article
                        key={plan.id}
                        className={`rounded-xl border p-5 ${
                          plan.id === "basic"
                            ? "border-geo-gold/35 bg-geo-gold/[0.04]"
                            : "border-white/10 bg-black/20"
                        } ${isCurrent ? "ring-1 ring-geo-gold/50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-white">{plan.name}</h3>
                            <p className="mt-1 text-lg font-bold text-geo-gold">{plan.priceLabel}</p>
                          </div>
                          {isCurrent && (
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                              Current plan
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-gray-400">{plan.description}</p>
                        <ul className="mt-4 space-y-2">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-xs text-gray-300">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-geo-gold" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-5">
                          {plan.id === "basic" ? (
                            hasBasic ? (
                              <button
                                type="button"
                                onClick={() => redirectToStripe("portal")}
                                disabled={action !== null || !data?.configured}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-geo-gold/30 px-4 py-2.5 text-sm font-semibold text-geo-gold transition hover:bg-geo-gold/10 disabled:opacity-50"
                              >
                                {action === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                                Manage subscription
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => redirectToStripe("checkout")}
                                disabled={action !== null || !data?.checkoutConfigured}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-geo-gold px-4 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {action === "checkout" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                                Subscribe with Stripe
                              </button>
                            )
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm text-gray-500"
                            >
                              {!plan.available ? "Coming soon" : isCurrent ? "Your current plan" : "Included with Basic"}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
                <p className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] text-gray-500">
                  <ShieldCheck className="h-3.5 w-3.5" /> Hosted Stripe checkout. GeoMoney never receives your full card details.
                </p>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-6">
                {subscription ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500">Subscription</p>
                        <h3 className="mt-1 text-xl font-semibold text-white">GeoMoney Basic</h3>
                        <div className="mt-2"><StatusBadge status={subscription.status} /></div>
                      </div>
                      <button
                        type="button"
                        onClick={() => redirectToStripe("portal")}
                        disabled={action !== null || !data?.configured}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-geo-gold px-4 py-2.5 text-sm font-semibold text-black hover:bg-yellow-500 disabled:opacity-50"
                      >
                        {action === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                        Manage billing
                      </button>
                    </div>
                    <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="mt-1 text-sm text-gray-200">
                          {subscription.price
                            ? `${formatMoney(subscription.price.amount, subscription.price.currency)} / ${subscription.price.interval}`
                            : "See Stripe invoice"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{subscription.cancelAtPeriodEnd ? "Access ends" : "Next renewal"}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-200">
                          <CalendarDays className="h-3.5 w-3.5 text-gray-500" /> {formatDate(subscription.currentPeriodEnd)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cancellation</p>
                        <p className="mt-1 text-sm text-gray-200">
                          {subscription.cancelAtPeriodEnd ? "Scheduled at period end" : "Renews automatically"}
                        </p>
                      </div>
                    </div>
                    {subscription.status === "past_due" && (
                      <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                        Your latest payment needs attention. Open Manage billing to update your payment method.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/15 py-10 text-center">
                    <Crown className="mx-auto h-8 w-8 text-gray-600" />
                    <h3 className="mt-3 font-semibold text-gray-200">You are on the Free plan</h3>
                    <p className="mt-1 text-sm text-gray-500">Choose Basic when you are ready for subscriber intelligence.</p>
                    <button type="button" onClick={() => selectTab("plans")} className="mt-4 text-sm font-semibold text-geo-gold hover:text-yellow-400">
                      View plans <ArrowRight className="ml-1 inline h-4 w-4" />
                    </button>
                  </div>
                )}

                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <FileText className="h-4 w-4 text-geo-gold" /> Invoice history
                  </h3>
                  {data?.invoices.length ? (
                    <div className="overflow-hidden rounded-xl border border-white/10">
                      {data.invoices.map((invoice) => (
                        <div key={invoice.id} className="flex flex-col gap-3 border-b border-white/10 bg-black/20 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-200">{invoice.number || invoice.description}</p>
                            <p className="mt-1 text-xs text-gray-500">{formatDate(invoice.created)} · {invoice.description}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-semibold text-white">
                              {formatMoney(invoice.amountPaid || invoice.amountDue, invoice.currency)}
                            </span>
                            <StatusBadge status={invoice.status || "unknown"} />
                            {invoice.hostedUrl && (
                              <a href={invoice.hostedUrl} target="_blank" rel="noreferrer" className="text-xs text-geo-gold hover:text-yellow-400">
                                View <ExternalLink className="ml-1 inline h-3 w-3" />
                              </a>
                            )}
                            {invoice.pdfUrl && (
                              <a href={invoice.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-white">PDF</a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-white/10 bg-black/20 p-6 text-center text-sm text-gray-500">No invoices yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "payment-methods" && (
              <div>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Saved payment methods</h3>
                    <p className="mt-1 text-xs text-gray-500">Only limited card metadata is shown here. Changes are made securely with Stripe.</p>
                  </div>
                  {data?.customerExists && (
                    <button
                      type="button"
                      onClick={() => redirectToStripe("portal")}
                      disabled={action !== null || !data.configured}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-geo-gold px-4 py-2.5 text-sm font-semibold text-black hover:bg-yellow-500 disabled:opacity-50"
                    >
                      {action === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                      Add or update
                    </button>
                  )}
                </div>
                {data?.paymentMethods.length ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {data.paymentMethods.map((method) => (
                      <div key={method.id} className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-black/30 p-5">
                        <div className="flex items-start justify-between">
                          <CreditCard className="h-7 w-7 text-geo-gold" />
                          {method.isDefault && <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400">Default</span>}
                        </div>
                        <p className="mt-5 text-sm font-semibold capitalize text-white">{method.brand}</p>
                        <p className="mt-1 font-mono text-sm tracking-widest text-gray-300">{method.last4 ? `•••• •••• •••• ${method.last4}` : method.type.replaceAll("_", " ")}</p>
                        {method.expMonth && method.expYear && (
                          <p className="mt-3 text-xs text-gray-500">Expires {String(method.expMonth).padStart(2, "0")}/{method.expYear}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/15 py-12 text-center">
                    <WalletCards className="mx-auto h-9 w-9 text-gray-600" />
                    <h3 className="mt-3 font-semibold text-gray-200">No saved payment methods</h3>
                    <p className="mt-1 text-sm text-gray-500">A payment method is collected during Basic checkout.</p>
                    {!data?.customerExists && (
                      <button type="button" onClick={() => selectTab("plans")} className="mt-4 text-sm font-semibold text-geo-gold hover:text-yellow-400">View Basic plan</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
