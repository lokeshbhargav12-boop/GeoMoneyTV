// ============================================================================
// GeoMoney TV — Market Trading Sessions Engine
// Determines whether a given instrument is currently trading based on its
// exchange, timezone, and holiday calendar.
// ============================================================================

export type MarketStatus = "OPEN" | "CLOSED" | "PRE_MARKET" | "POST_MARKET";

export interface TradingSession {
  exchange: string;
  timezone: string;           // IANA timezone identifier
  weekdayOpen: string;        // HH:mm in exchange local time
  weekdayClose: string;       // HH:mm in exchange local time
  /** Optional extended-hours open (e.g. electronic session start) */
  extendedOpen?: string;
  /** Optional extended-hours close */
  extendedClose?: string;
  /** CME-style: session spans two calendar days (e.g. 18:00 Mon → 17:00 Tue) */
  overnight?: boolean;
  /** 24/7 markets (crypto) */
  alwaysOpen?: boolean;
}

// ---------------------------------------------------------------------------
// Exchange Session Definitions
// ---------------------------------------------------------------------------

const EXCHANGE_SESSIONS: Record<string, TradingSession> = {
  // ---- COMEX / NYMEX (CME Group) ----
  // Electronic trading: Sun 6PM ET – Fri 5PM ET (23h/day with 1h break 5-6PM)
  COMEX: {
    exchange: "COMEX (CME Globex)",
    timezone: "America/New_York",
    weekdayOpen: "18:00",
    weekdayClose: "17:00",
    extendedOpen: "18:00",    // Sunday open
    extendedClose: "17:00",   // Friday close
    overnight: true,
  },

  // ---- LME (London Metal Exchange) ----
  // Ring & electronic: 01:00 – 19:00 GMT
  LME: {
    exchange: "LME",
    timezone: "Europe/London",
    weekdayOpen: "01:00",
    weekdayClose: "19:00",
  },

  // ---- ICE (Intercontinental Exchange) ----
  // Brent crude, gas oil, etc. Electronic: Sun 8PM ET – Fri 6PM ET
  ICE: {
    exchange: "ICE",
    timezone: "America/New_York",
    weekdayOpen: "20:00",
    weekdayClose: "18:00",
    overnight: true,
  },

  // ---- ASX (Australian Securities Exchange) ----
  // Equity trading: 10:00 – 16:00 AEDT/AEST
  ASX: {
    exchange: "ASX",
    timezone: "Australia/Sydney",
    weekdayOpen: "10:00",
    weekdayClose: "16:00",
  },

  // ---- NYSE / NASDAQ (US Equities & ETFs) ----
  // Core session: 09:30 – 16:00 ET
  NYSE: {
    exchange: "NYSE / NASDAQ",
    timezone: "America/New_York",
    weekdayOpen: "09:30",
    weekdayClose: "16:00",
    extendedOpen: "04:00",    // Pre-market
    extendedClose: "20:00",   // After-hours
  },

  // ---- OTC Spot Precious Metals (XAUUSD, XAGUSD) ----
  // Traded nearly 24h Sun 6PM ET – Fri 5PM ET with 1h break
  OTC_METALS: {
    exchange: "OTC Spot (Global)",
    timezone: "America/New_York",
    weekdayOpen: "18:00",
    weekdayClose: "17:00",
    overnight: true,
  },

  // ---- Crypto (24/7) ----
  CRYPTO: {
    exchange: "Global (24/7)",
    timezone: "UTC",
    weekdayOpen: "00:00",
    weekdayClose: "23:59",
    alwaysOpen: true,
  },
};

// ---------------------------------------------------------------------------
// Symbol → Exchange Mapping
// ---------------------------------------------------------------------------

const SYMBOL_EXCHANGE_MAP: Record<string, string> = {
  // Precious metals — OTC spot
  GOLD: "OTC_METALS",
  XAUUSD: "OTC_METALS",
  SILVER: "OTC_METALS",
  XAGUSD: "OTC_METALS",

  // Base metals — LME
  COPPER: "COMEX",
  ZINC: "LME",
  LEAD: "LME",
  NICKEL: "LME",
  ALUMINIUM: "LME",
  ALUMINUM: "LME",

  // Energy — NYMEX
  CRUDE: "COMEX",
  WTI: "COMEX",
  USOIL: "COMEX",
  NATGAS: "COMEX",
  NATURALGAS: "COMEX",
  BRENT: "ICE",

  // Indices
  ASX200: "ASX",
  SP500: "NYSE",
  NASDAQ: "NYSE",
  DOW: "NYSE",

  // ETFs (rare earth / lithium / uranium)
  URNM: "NYSE",
  LIT: "NYSE",
  REMX: "NYSE",

  // Crypto
  BTC: "CRYPTO",
  ETH: "CRYPTO",
  BTCUSD: "CRYPTO",
  ETHUSD: "CRYPTO",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeKey(value: string): string {
  return value.trim().toUpperCase();
}

/**
 * Returns a Date object representing the current time in the given IANA
 * timezone. Uses Intl.DateTimeFormat for robust DST handling.
 */
function nowInTimezone(tz: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // en-CA produces "2026-05-25, 10:30:45"
  const parts = formatter.format(now).split(", ");
  const [year, month, day] = parts[0].split("-").map(Number);
  const [hour, minute, second] = parts[1].split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Parse "HH:mm" into total minutes from midnight.
 */
function parseTimeMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Determine the trading status for a given session at the current moment.
 */
function computeStatus(session: TradingSession): MarketStatus {
  if (session.alwaysOpen) return "OPEN";

  const tz = session.timezone;
  const local = nowInTimezone(tz);
  const dayOfWeek = local.getDay(); // 0=Sun, 6=Sat
  const currentMinutes = local.getHours() * 60 + local.getMinutes();

  const openMin = parseTimeMinutes(session.weekdayOpen);
  const closeMin = parseTimeMinutes(session.weekdayClose);

  // Weekend check — for overnight sessions that span Sun-Fri
  if (session.overnight) {
    // CME-style: Trading from Sunday 18:00 to Friday 17:00
    // Saturday is always closed. Sunday before 18:00 is closed.
    if (dayOfWeek === 6) return "CLOSED";
    if (dayOfWeek === 0 && currentMinutes < openMin) return "CLOSED";
    // Friday after close
    if (dayOfWeek === 5 && currentMinutes >= closeMin) return "CLOSED";
    // Mon-Thu & Sun after open & Fri before close → check the break window
    // 1-hour maintenance break 17:00–18:00 Mon-Thu
    if (dayOfWeek >= 1 && dayOfWeek <= 4) {
      if (currentMinutes >= closeMin && currentMinutes < openMin) {
        return "CLOSED"; // maintenance break
      }
    }
    return "OPEN";
  }

  // Standard same-day session
  if (dayOfWeek === 0 || dayOfWeek === 6) return "CLOSED";

  // Extended hours (pre-market / post-market)
  if (session.extendedOpen && session.extendedClose) {
    const extOpenMin = parseTimeMinutes(session.extendedOpen);
    const extCloseMin = parseTimeMinutes(session.extendedClose);

    if (currentMinutes >= extOpenMin && currentMinutes < openMin) {
      return "PRE_MARKET";
    }
    if (currentMinutes >= closeMin && currentMinutes < extCloseMin) {
      return "POST_MARKET";
    }
  }

  // Core session
  if (currentMinutes >= openMin && currentMinutes < closeMin) {
    return "OPEN";
  }

  return "CLOSED";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface MarketStatusResult {
  status: MarketStatus;
  exchange: string;
  /** Human-readable label for the current session */
  sessionLabel: string;
  /** ISO timestamp of the next session transition (approx) */
  nextTransition: string | null;
}

const STATUS_LABELS: Record<MarketStatus, string> = {
  OPEN: "Live",
  CLOSED: "Closed",
  PRE_MARKET: "Pre-Market",
  POST_MARKET: "After-Hours",
};

/**
 * Resolve the market status for a given ticker symbol.
 *
 * @param symbol - The internal ticker symbol (e.g. "GOLD", "CRUDE", "ASX200")
 * @param type   - Asset type ("commodity", "index", "crypto", etc.)
 */
export function getMarketStatus(
  symbol: string,
  type?: string,
): MarketStatusResult {
  const normalizedSymbol = normalizeKey(symbol);
  const normalizedType = type ? normalizeKey(type) : "";

  // Crypto is always open
  if (normalizedType === "CRYPTO" || normalizedType === "CRYPTOCURRENCY") {
    return {
      status: "OPEN",
      exchange: "Global (24/7)",
      sessionLabel: "24/7",
      nextTransition: null,
    };
  }

  const exchangeKey =
    SYMBOL_EXCHANGE_MAP[normalizedSymbol] ??
    SYMBOL_EXCHANGE_MAP[normalizedSymbol.replace(/[^A-Z0-9]/g, "")] ??
    "OTC_METALS"; // sensible default for commodities

  const session = EXCHANGE_SESSIONS[exchangeKey];
  if (!session) {
    // Unknown symbol — assume open
    return {
      status: "OPEN",
      exchange: "Unknown",
      sessionLabel: "Live",
      nextTransition: null,
    };
  }

  const status = computeStatus(session);

  return {
    status,
    exchange: session.exchange,
    sessionLabel: STATUS_LABELS[status],
    nextTransition: null, // can be enhanced later
  };
}

/**
 * Batch-resolve market status for multiple ticker items.
 */
export function getMarketStatuses(
  items: Array<{ symbol: string; type?: string }>,
): Map<string, MarketStatusResult> {
  const results = new Map<string, MarketStatusResult>();
  for (const item of items) {
    results.set(item.symbol, getMarketStatus(item.symbol, item.type));
  }
  return results;
}

/**
 * Check whether a market is currently in a trading session (OPEN or extended hours).
 */
export function isMarketActive(status: MarketStatus): boolean {
  return status === "OPEN" || status === "PRE_MARKET" || status === "POST_MARKET";
}