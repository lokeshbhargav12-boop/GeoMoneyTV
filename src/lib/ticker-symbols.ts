export interface TickerSymbolShape {
  label: string;
  symbol: string;
  type: string;
  sourceSymbol?: string;
}

const CANONICAL_ALIASES: Record<string, string[]> = {
  GOLD: ["GOLD", "XAUUSD", "XAU/USD", "GC=F"],
  SILVER: ["SILVER", "XAGUSD", "XAG/USD", "SI=F", "CAPITALCOM:SILVER"],
  COPPER: ["COPPER", "HG=F", "CAPITALCOM:COPPER"],
  ZINC: ["ZINC", "ZINC.L"],
  LEAD: ["LEAD", "LEAD.L"],
  NICKEL: ["NICKEL", "NICKEL.L"],
  CRUDE: ["CRUDE", "CRUDE OIL", "WTI", "USOIL", "TVC:USOIL", "CL=F"],
  NATGAS: [
    "NATGAS",
    "NAT GAS",
    "NATURALGAS",
    "CAPITALCOM:NATURALGAS",
    "NG=F",
  ],
  ASX200: ["ASX200", "^AXJO"],
  URANIUM: ["URANIUM", "URNM"],
  LITHIUM: ["LITHIUM", "LIT"],
  NEWCASTLE: ["NEWCASTLE", "NEWCASTLE COAL", "COAL", "MTF=F"],
  API2: ["API2", "API2 COAL", "ROTTERDAM", "ATW=F"],
  ILLINOIS: ["ILLINOIS", "ILLINOIS BASIN", "ILB=F"],
  METCOAL: ["METCOAL", "MET COAL", "COKING", "MCC=F"],
  DXY: ["DXY", "USD INDEX", "DX-Y.NYB", "CAPITALCOM:DXY"],
};

const DEFAULT_SOURCE_SYMBOLS: Record<string, string> = {
  GOLD: "XAUUSD",
  SILVER: "XAGUSD",
  COPPER: "CAPITALCOM:COPPER",
  ZINC: "ZINC.L",
  LEAD: "LEAD.L",
  NICKEL: "NICKEL.L",
  CRUDE: "TVC:USOIL",
  NATGAS: "CAPITALCOM:NATURALGAS",
  ASX200: "^AXJO",
  URANIUM: "URNM",
  LITHIUM: "LIT",
  NEWCASTLE: "MTF=F",
  API2: "ATW=F",
  ILLINOIS: "ILB=F",
  METCOAL: "MCC=F",
  DXY: "CAPITALCOM:DXY",
};

const ALIAS_TO_CANONICAL = Object.entries(CANONICAL_ALIASES).reduce<Record<string, string>>(
  (acc, [canonicalSymbol, aliases]) => {
    for (const alias of aliases) {
      acc[normalizeTickerKey(alias)] = canonicalSymbol;
    }
    return acc;
  },
  {},
);

export function normalizeTickerKey(value: string) {
  return value.trim().toUpperCase();
}

export function canonicalizeTickerSymbol(rawSymbol: string) {
  const normalized = normalizeTickerKey(rawSymbol);
  return ALIAS_TO_CANONICAL[normalized] || normalized;
}

export function getDefaultSourceSymbol(canonicalSymbol: string) {
  return DEFAULT_SOURCE_SYMBOLS[normalizeTickerKey(canonicalSymbol)];
}

export function normalizeTickerSymbolConfig<T extends TickerSymbolShape>(item: T): T {
  const rawSymbol = item.symbol.trim();
  const canonicalSymbol = canonicalizeTickerSymbol(rawSymbol);
  const explicitSource =
    typeof item.sourceSymbol === "string" && item.sourceSymbol.trim().length > 0
      ? item.sourceSymbol.trim()
      : undefined;

  const sourceSymbol =
    explicitSource ||
    (canonicalSymbol !== normalizeTickerKey(rawSymbol)
      ? rawSymbol
      : getDefaultSourceSymbol(canonicalSymbol));

  const normalizedItem = {
    ...item,
    label: item.label.trim() || canonicalSymbol,
    symbol: canonicalSymbol,
    ...(sourceSymbol ? { sourceSymbol } : {}),
  };

  return normalizedItem as T;
}

export function dedupeTickerSymbolConfigs<T extends TickerSymbolShape>(items: T[]) {
  const deduped: T[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const key = normalizeTickerKey(item.symbol);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}