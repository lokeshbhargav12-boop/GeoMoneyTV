export type RecommendationCategory =
  | "News"
  | "Tool"
  | "Energy"
  | "Materials"
  | "Monitor";

export interface NavigationRecommendation {
  title: string;
  description: string;
  path: string;
  category: RecommendationCategory;
}

interface ToolDefinition extends NavigationRecommendation {
  keywords: string[];
}

const COMMAND_WORDS = new Set([
  "show", "me", "news", "about", "articles", "on", "find", "search", "for",
  "the", "latest", "get", "go", "to", "open", "please", "give", "any", "all",
  "some", "a", "an", "of", "in", "and", "with", "tell", "what", "is", "happening",
  "happened", "intelligence", "intel", "information", "prices", "price", "market",
  "markets", "updates", "update", "current",
]);

const DIRECT_DESTINATION_WORDS = [
  "admin", "dashboard", "settings", "news", "article", "headline", "video",
  "youtube", "watch", "short", "tool", "calculator", "convert", "grade", "npv",
  "newsletter", "subscribe", "analytics", "tracker", "mobile", "weekly", "brief",
  "report", "login", "sign in", "register", "sign up", "pricing", "membership",
];

const TOOLS: ToolDefinition[] = [
  {
    title: "Equivalent Grade Calculator",
    description: "Compare gold, silver and base-metal grades on an equivalent basis.",
    path: "/tools#equivalent-grade",
    category: "Tool",
    keywords: [
      "gold", "silver", "copper", "zinc", "nickel", "lead", "precious metal",
      "base metal", "metal", "metals", "mining", "mineral", "ore", "grade", "assay",
    ],
  },
  {
    title: "Commodity Threshold Notifications",
    description: "Set a custom above-or-below threshold for a commodity price.",
    path: "/tools#price-alerts",
    category: "Tool",
    keywords: [
      "gold", "silver", "copper", "oil", "crude", "lithium", "neodymium", "commodity",
      "commodities", "metal", "metals", "price", "prices", "alert", "threshold",
    ],
  },
  {
    title: "Resource Estimation Calculator",
    description: "Estimate contained metal, recoverable metal and scenario value.",
    path: "/tools#resource-estimation",
    category: "Tool",
    keywords: [
      "gold", "silver", "copper", "zinc", "nickel", "lead", "iron", "mining", "mine",
      "mineral", "ore", "resource", "deposit", "tonnage", "recovery", "grade",
    ],
  },
  {
    title: "Commodity Grade Guide",
    description: "Review low, medium, high and discovery-grade benchmarks by deposit.",
    path: "/tools#grade-guide",
    category: "Tool",
    keywords: [
      "gold", "silver", "copper", "zinc", "nickel", "lead", "iron", "mining", "mineral",
      "ore", "deposit", "grade", "assay", "exploration",
    ],
  },
  {
    title: "Project Economics Calculator",
    description: "Model mining-project cash flows and net present value scenarios.",
    path: "/tools#project-economics",
    category: "Tool",
    keywords: [
      "mining", "mine", "project", "investment", "npv", "cash flow", "economics",
      "gold", "silver", "copper", "zinc", "nickel", "lithium", "coal",
    ],
  },
  {
    title: "Critical Materials Intelligence",
    description: "Explore material supply chains, benchmark movers and geopolitical risk.",
    path: "/materials",
    category: "Materials",
    keywords: [
      "rare earth", "rare earths", "critical material", "critical materials", "mineral",
      "minerals", "lithium", "cobalt", "graphite", "manganese", "tungsten", "uranium",
      "neodymium", "praseodymium", "dysprosium", "terbium", "lanthanum", "cerium",
      "yttrium", "samarium", "gadolinium", "europium", "battery", "semiconductor",
    ],
  },
  {
    title: "Energy Storage Intelligence",
    description: "Inspect storage systems and the infrastructure behind battery supply chains.",
    path: "/energy#storage",
    category: "Energy",
    keywords: [
      "lithium", "battery", "batteries", "energy storage", "storage", "electric vehicle",
      "ev", "cobalt", "nickel", "graphite", "manganese",
    ],
  },
  {
    title: "Oil & Gas Intelligence",
    description: "Track crude and gas markets, refining, storage and corridor exposure.",
    path: "/energy/oil-and-gas",
    category: "Energy",
    keywords: [
      "oil", "crude", "wti", "brent", "gas", "natural gas", "lng", "refinery",
      "refining", "petroleum", "diesel", "gasoline", "opec", "shale",
    ],
  },
  {
    title: "Energy Infrastructure Command Desk",
    description: "View energy assets, market trends and infrastructure interdependencies.",
    path: "/energy/infrastructure",
    category: "Energy",
    keywords: [
      "oil", "gas", "lng", "pipeline", "pipelines", "refinery", "terminal", "power plant",
      "electricity", "grid", "infrastructure", "energy", "coal", "nuclear", "uranium",
    ],
  },
  {
    title: "Coal Benchmarks",
    description: "Follow coal benchmarks and market fundamentals in one operations desk.",
    path: "/energy/coal#benchmarks",
    category: "Energy",
    keywords: ["coal", "thermal coal", "met coal", "coking coal", "newcastle", "api2"],
  },
  {
    title: "Coal Route Monitor",
    description: "Inspect coal shipping routes, plants and supply-chain disruptions.",
    path: "/energy/coal#routes",
    category: "Energy",
    keywords: ["coal", "shipping", "freight", "route", "routes", "port", "supply chain"],
  },
  {
    title: "Coal Planning Calculators",
    description: "Run coal-specific conversion, transport and planning calculations.",
    path: "/energy/coal#calculators",
    category: "Energy",
    keywords: ["coal", "thermal coal", "met coal", "coking coal", "calculator", "freight"],
  },
  {
    title: "Renewable Energy Calculators",
    description: "Model solar, wind and other clean-energy project scenarios.",
    path: "/energy#calculators",
    category: "Energy",
    keywords: [
      "solar", "wind", "renewable", "renewables", "clean energy", "hydrogen", "geothermal",
      "hydro", "energy transition", "decarbonization", "carbon",
    ],
  },
  {
    title: "Global Energy Hub",
    description: "Explore energy commodities, infrastructure, policy and geopolitical analysis.",
    path: "/energy",
    category: "Energy",
    keywords: [
      "energy", "electricity", "power", "oil", "gas", "coal", "solar", "wind", "nuclear",
      "hydrogen", "renewable", "carbon", "climate", "pipeline",
    ],
  },
  {
    title: "GeoMoney Aperture",
    description: "Monitor global events, shipping, aviation and geopolitical developments.",
    path: "/world-monitor",
    category: "Monitor",
    keywords: [
      "geopolitics", "geopolitical", "war", "conflict", "sanctions", "shipping", "vessel",
      "aviation", "flight", "military", "security", "trade", "tariff", "election", "china",
      "russia", "ukraine", "iran", "israel", "taiwan", "hormuz", "red sea", "panama canal",
    ],
  },
];

const MATERIAL_DETAILS: Array<{
  names: string[];
  symbol: string;
  title: string;
}> = [
  { names: ["lithium"], symbol: "Li", title: "Lithium" },
  { names: ["cobalt"], symbol: "Co", title: "Cobalt" },
  { names: ["graphite"], symbol: "C", title: "Graphite" },
  { names: ["manganese"], symbol: "Mn", title: "Manganese" },
  { names: ["tungsten"], symbol: "W", title: "Tungsten" },
  { names: ["uranium"], symbol: "U", title: "Uranium" },
  { names: ["neodymium"], symbol: "Nd", title: "Neodymium" },
  { names: ["praseodymium"], symbol: "Pr", title: "Praseodymium" },
  { names: ["dysprosium"], symbol: "Dy", title: "Dysprosium" },
  { names: ["terbium"], symbol: "Tb", title: "Terbium" },
  { names: ["lanthanum"], symbol: "La", title: "Lanthanum" },
  { names: ["cerium"], symbol: "Ce", title: "Cerium" },
  { names: ["yttrium"], symbol: "Y", title: "Yttrium" },
  { names: ["samarium"], symbol: "Sm", title: "Samarium" },
  { names: ["gadolinium"], symbol: "Gd", title: "Gadolinium" },
  { names: ["europium"], symbol: "Eu", title: "Europium" },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[?!.,;:"'()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesKeyword(prompt: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "i").test(prompt);
}

export function extractSearchTerm(prompt: string): string {
  return normalize(prompt)
    .split(" ")
    .filter((word) => word && !COMMAND_WORDS.has(word))
    .join(" ")
    .trim();
}

/** Explicit destination commands keep their original navigation behaviour. */
export function isExploratoryQuery(prompt: string): boolean {
  const normalized = normalize(prompt);
  if (!normalized) return false;
  if (/^(open|go to|take me to|navigate to)\b/.test(normalized)) return false;
  return !DIRECT_DESTINATION_WORDS.some((word) => includesKeyword(normalized, word));
}

export function getToolRecommendations(prompt: string): NavigationRecommendation[] {
  const normalized = normalize(prompt);
  const topic = extractSearchTerm(prompt) || normalized;
  const encodedTopic = encodeURIComponent(topic);
  const recommendations: NavigationRecommendation[] = [
    {
      title: `${topic.charAt(0).toUpperCase()}${topic.slice(1)} News & Analysis`,
      description: `Search the latest GeoMoney coverage and intelligence about ${topic}.`,
      path: `/news?search=${encodedTopic}`,
      category: "News",
    },
  ];

  const material = MATERIAL_DETAILS.find(({ names }) =>
    names.some((name) => includesKeyword(normalized, name)),
  );
  if (material) {
    recommendations.push({
      title: `${material.title} Material Intelligence`,
      description: `Open ${material.title.toLowerCase()} prices, supply-demand analysis, risk signals and shock scenarios.`,
      path: `/materials/${material.symbol}`,
      category: "Materials",
    });
  }

  const matches = TOOLS.map((tool, index) => ({
    tool,
    index,
    score: tool.keywords.reduce(
      (total, keyword) => total + (includesKeyword(normalized, keyword) ? (keyword.includes(" ") ? 8 : 4) : 0),
      0,
    ),
  }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, material ? 3 : 4)
    .map(({ tool }) => ({
      title: tool.title,
      description: tool.description,
      path: tool.path,
      category: tool.category,
    }));

  recommendations.push(...matches);

  if (matches.length === 0) {
    recommendations.push(
      {
        title: "GeoMoney Aperture",
        description: `Check the global monitor for events and developments connected to ${topic}.`,
        path: "/world-monitor",
        category: "Monitor",
      },
      {
        title: "Market Analysis Tools",
        description: "Browse converters, commodity calculators, notifications and grade guides.",
        path: "/tools",
        category: "Tool",
      },
      {
        title: "Critical Materials Intelligence",
        description: "Explore supply chains and market intelligence across critical materials.",
        path: "/materials",
        category: "Materials",
      },
    );
  }

  return recommendations;
}
