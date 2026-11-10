export type BillingPlanId = "free" | "basic" | "advanced" | "pro";

export interface BillingPlan {
  id: BillingPlanId;
  name: string;
  description: string;
  price: number | null;
  priceLabel: string;
  available: boolean;
  features: string[];
}

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Explore GeoMoney's public research and media.",
    price: 0,
    priceLabel: "US$0",
    available: true,
    features: [
      "Public articles and research previews",
      "Open-access energy and materials content",
      "GeoMoney TV videos and editorial updates",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    description: "Subscriber research and intelligence, billed monthly.",
    price: 39,
    priceLabel: "US$39 / month",
    available: true,
    features: [
      "Subscriber-only geopolitical and economic briefings",
      "Energy systems, critical materials and supply-chain research",
      "Member reports and analysis included in Basic",
      "Secure billing management and cancellation anytime",
    ],
  },
  {
    id: "advanced",
    name: "Advanced",
    description: "Expanded analytical capabilities.",
    price: null,
    priceLabel: "Coming soon",
    available: false,
    features: ["Advanced analytics and comparative tools planned"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "A future professional intelligence tier.",
    price: null,
    priceLabel: "Coming soon",
    available: false,
    features: ["Additional research, monitoring and professional tools planned"],
  },
];

export const BASIC_PLAN = BILLING_PLANS.find((plan) => plan.id === "basic")!;
