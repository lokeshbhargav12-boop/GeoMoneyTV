const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CANONICAL_ALIASES = {
  GOLD: ['GOLD', 'XAUUSD', 'XAU/USD', 'GC=F'],
  SILVER: ['SILVER', 'XAGUSD', 'XAG/USD', 'SI=F', 'CAPITALCOM:SILVER'],
  COPPER: ['COPPER', 'HG=F', 'CAPITALCOM:COPPER'],
  ZINC: ['ZINC', 'ZINC.L'],
  LEAD: ['LEAD', 'LEAD.L'],
  NICKEL: ['NICKEL', 'NICKEL.L'],
  CRUDE: ['CRUDE', 'CRUDE OIL', 'WTI', 'USOIL', 'TVC:USOIL', 'CL=F'],
  NATGAS: ['NATGAS', 'NAT GAS', 'NATURALGAS', 'CAPITALCOM:NATURALGAS', 'NG=F'],
  ASX200: ['ASX200', '^AXJO'],
  URANIUM: ['URANIUM', 'URNM'],
  LITHIUM: ['LITHIUM', 'LIT'],
  NEWCASTLE: ['NEWCASTLE', 'NEWCASTLE COAL', 'COAL', 'MTF=F'],
  API2: ['API2', 'API2 COAL', 'ROTTERDAM', 'ATW=F'],
  ILLINOIS: ['ILLINOIS', 'ILLINOIS BASIN', 'ILB=F'],
  METCOAL: ['METCOAL', 'MET COAL', 'COKING', 'MCC=F'],
  DXY: ['DXY', 'USD INDEX', 'DX-Y.NYB', 'CAPITALCOM:DXY'],
};

const DEFAULT_SOURCE_SYMBOLS = {
  GOLD: 'XAUUSD',
  SILVER: 'XAGUSD',
  COPPER: 'CAPITALCOM:COPPER',
  ZINC: 'ZINC.L',
  LEAD: 'LEAD.L',
  NICKEL: 'NICKEL.L',
  CRUDE: 'TVC:USOIL',
  NATGAS: 'CAPITALCOM:NATURALGAS',
  ASX200: '^AXJO',
  URANIUM: 'URNM',
  LITHIUM: 'LIT',
  NEWCASTLE: 'MTF=F',
  API2: 'ATW=F',
  ILLINOIS: 'ILB=F',
  METCOAL: 'MCC=F',
  DXY: 'CAPITALCOM:DXY',
};

function normalizeTickerKey(value) {
  return String(value || '').trim().toUpperCase();
}

const ALIAS_TO_CANONICAL = Object.entries(CANONICAL_ALIASES).reduce((acc, [canonicalSymbol, aliases]) => {
  for (const alias of aliases) {
    acc[normalizeTickerKey(alias)] = canonicalSymbol;
  }
  return acc;
}, {});

function canonicalizeTickerSymbol(rawSymbol) {
  const normalized = normalizeTickerKey(rawSymbol);
  return ALIAS_TO_CANONICAL[normalized] || normalized;
}

function normalizeTickerSymbolConfig(item) {
  const rawSymbol = String(item.symbol || '').trim();
  const canonicalSymbol = canonicalizeTickerSymbol(rawSymbol);
  const explicitSource =
    typeof item.sourceSymbol === 'string' && item.sourceSymbol.trim().length > 0
      ? item.sourceSymbol.trim()
      : undefined;

  const sourceSymbol =
    explicitSource ||
    (canonicalSymbol !== normalizeTickerKey(rawSymbol)
      ? rawSymbol
      : DEFAULT_SOURCE_SYMBOLS[canonicalSymbol]);

  return {
    ...item,
    label: String(item.label || '').trim() || canonicalSymbol,
    symbol: canonicalSymbol,
    ...(sourceSymbol ? { sourceSymbol } : {}),
  };
}

function pickRow(existing, incoming) {
  if (!existing) return incoming;

  const existingTime = new Date(existing.updatedAt || 0).getTime();
  const incomingTime = new Date(incoming.updatedAt || 0).getTime();

  if (incomingTime > existingTime) {
    return {
      ...existing,
      ...incoming,
      symbol: existing.symbol,
    };
  }

  return existing;
}

async function normalizeCommodityPrices() {
  const allRows = await prisma.commodityPrice.findMany({
    orderBy: { updatedAt: 'desc' },
  });

  if (!allRows.length) {
    console.log('No commodityPrice rows found.');
    return;
  }

  const grouped = new Map();
  for (const row of allRows) {
    const canonicalSymbol = canonicalizeTickerSymbol(row.symbol);
    const current = grouped.get(canonicalSymbol);
    const normalized = {
      ...row,
      symbol: canonicalSymbol,
      label: row.label || canonicalSymbol,
    };

    grouped.set(canonicalSymbol, pickRow(current, normalized));
  }

  let upserted = 0;
  const preserveUpdatedAt = process.env.PRESERVE_UPDATED_AT === '1';

  for (const row of grouped.values()) {
    await prisma.commodityPrice.upsert({
      where: { symbol: row.symbol },
      update: {
        label: row.label,
        type: row.type,
        price: row.price,
        change: row.change,
        previousClose: row.previousClose,
        marketStatus: row.marketStatus,
        lastTradingTimestamp: row.lastTradingTimestamp,
        ...(preserveUpdatedAt ? { updatedAt: row.updatedAt } : {}),
      },
      create: {
        label: row.label,
        symbol: row.symbol,
        type: row.type,
        price: row.price,
        change: row.change,
        previousClose: row.previousClose,
        marketStatus: row.marketStatus,
        lastTradingTimestamp: row.lastTradingTimestamp,
      },
    });
    upserted += 1;
  }

  const keepSymbols = Array.from(grouped.keys());
  const deleted = await prisma.commodityPrice.deleteMany({
    where: {
      symbol: {
        notIn: keepSymbols,
      },
    },
  });

  console.log(`commodityPrice normalized: upserted=${upserted}, deleted=${deleted.count}`);
}

async function normalizeTickerSettings() {
  const row = await prisma.siteSettings.findUnique({
    where: { key: 'ticker_symbols' },
  });

  if (!row) {
    console.log('No ticker_symbols setting found.');
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(row.value);
  } catch {
    console.log('ticker_symbols is not valid JSON. Skipping settings normalization.');
    return;
  }

  if (!Array.isArray(parsed)) {
    console.log('ticker_symbols is not an array. Skipping settings normalization.');
    return;
  }

  const normalized = [];
  const seen = new Set();
  for (const item of parsed) {
    if (
      typeof item?.label !== 'string' ||
      typeof item?.symbol !== 'string' ||
      typeof item?.type !== 'string'
    ) {
      continue;
    }

    const next = normalizeTickerSymbolConfig(item);
    const key = normalizeTickerKey(next.symbol);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(next);
  }

  await prisma.siteSettings.update({
    where: { key: 'ticker_symbols' },
    data: { value: JSON.stringify(normalized) },
  });

  console.log(`ticker_symbols normalized: ${normalized.length} symbols`);
}

async function normalizeMarketPriceHistory() {
  const rows = await prisma.marketPriceHistory.findMany({
    orderBy: { recordedAt: 'desc' },
  });

  if (!rows.length) {
    console.log('No marketPriceHistory rows found.');
    return;
  }

  const merged = new Map();
  const legacyIds = [];

  for (const row of rows) {
    const canonicalSymbol = canonicalizeTickerSymbol(row.symbol);
    const isLegacySymbol = canonicalSymbol !== normalizeTickerKey(row.symbol);
    const mergeKey = `${canonicalSymbol}|${row.interval}|${new Date(row.recordedAt).toISOString()}`;

    const normalizedRow = {
      ...row,
      symbol: canonicalSymbol,
      label: row.label || canonicalSymbol,
    };

    const existing = merged.get(mergeKey);
    if (!existing) {
      merged.set(mergeKey, normalizedRow);
    } else {
      const existingIsCanonical = normalizeTickerKey(existing.symbol) === canonicalSymbol;
      if (!existingIsCanonical && !isLegacySymbol) {
        merged.set(mergeKey, normalizedRow);
      }
    }

    if (isLegacySymbol) {
      legacyIds.push(row.id);
    }
  }

  let upserted = 0;
  for (const row of merged.values()) {
    await prisma.marketPriceHistory.upsert({
      where: {
        symbol_interval_recordedAt: {
          symbol: row.symbol,
          interval: row.interval,
          recordedAt: row.recordedAt,
        },
      },
      update: {
        label: row.label,
        source: row.source,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
      },
      create: {
        label: row.label,
        symbol: row.symbol,
        source: row.source,
        interval: row.interval,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
        recordedAt: row.recordedAt,
      },
    });

    upserted += 1;
  }

  let deleted = 0;
  if (legacyIds.length > 0) {
    const CHUNK_SIZE = 500;
    for (let index = 0; index < legacyIds.length; index += CHUNK_SIZE) {
      const batch = legacyIds.slice(index, index + CHUNK_SIZE);
      const result = await prisma.marketPriceHistory.deleteMany({
        where: { id: { in: batch } },
      });
      deleted += result.count;
    }
  }

  console.log(`marketPriceHistory normalized: upserted=${upserted}, deletedLegacy=${deleted}`);
}

async function run() {
  try {
    console.log('Starting ticker symbol cleanup...');
    await normalizeCommodityPrices();
    await normalizeMarketPriceHistory();
    await normalizeTickerSettings();
    console.log('Ticker cleanup complete.');
  } catch (error) {
    console.error('Ticker cleanup failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();