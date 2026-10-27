export interface CoalReferenceQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  observedAt: string;
}

export const COAL_REFERENCE_BENCHMARKS: Record<string, CoalReferenceQuote> = {
  NEWCASTLE: {
    symbol: "NEWCASTLE",
    price: 104.75,
    change: 8.05,
    changePercent: 8.32,
    unit: "$/t",
    observedAt: "2026-10-26T16:00:00.000Z",
  },
  API2: {
    symbol: "API2",
    price: 112.4,
    change: 1.85,
    changePercent: 1.67,
    unit: "$/t",
    observedAt: "2026-10-26T16:00:00.000Z",
  },
  ILLINOIS: {
    symbol: "ILLINOIS",
    price: 51.25,
    change: -0.45,
    changePercent: -0.87,
    unit: "$/t",
    observedAt: "2026-10-26T16:00:00.000Z",
  },
  METCOAL: {
    symbol: "METCOAL",
    price: 206.5,
    change: 3.2,
    changePercent: 1.57,
    unit: "$/t",
    observedAt: "2026-10-26T16:00:00.000Z",
  },
  CAPP: {
    symbol: "CAPP",
    price: 73.6,
    change: 0.65,
    changePercent: 0.89,
    unit: "$/st",
    observedAt: "2026-10-26T16:00:00.000Z",
  },
  PRB: {
    symbol: "PRB",
    price: 14.15,
    change: 0.1,
    changePercent: 0.71,
    unit: "$/st",
    observedAt: "2026-10-26T16:00:00.000Z",
  },
  UINTA: {
    symbol: "UINTA",
    price: 40.8,
    change: -0.2,
    changePercent: -0.49,
    unit: "$/st",
    observedAt: "2026-10-26T16:00:00.000Z",
  },
};

export const COAL_REFERENCE_EIA = {
  coalGeneration: 54820, // GWh (monthly US coal-fired electricity generation)
  coalStocks: 128450, // ktons (US electric power sector coal stocks)
  coalProduction: 36910, // ktons (US monthly coal receipts at power plants)
  coalExports: 8420, // ktons (US monthly seaborne thermal + met coal exports)
};

export const COAL_REFERENCE_ROUTE_TRAFFIC: Record<
  string,
  {
    vesselCount: number;
    congestion: "low" | "moderate" | "high";
    vessels: {
      mmsi: string;
      name: string;
      lat: number;
      lon: number;
      speed: number;
      heading: number;
      destination: string;
      zone: string;
    }[];
  }
> = {
  "newcastle-asia": {
    vesselCount: 9,
    congestion: "moderate",
    vessels: [
      {
        mmsi: "503118400",
        name: "PACIFIC HUNTER",
        lat: -32.88,
        lon: 151.84,
        speed: 11.4,
        heading: 22,
        destination: "KASHIMA JP",
        zone: "Newcastle Seaborne Arc",
      },
      {
        mmsi: "431602910",
        name: "CORAL BULKER",
        lat: -18.4,
        lon: 148.9,
        speed: 12.1,
        heading: 350,
        destination: "KAOHSIUNG TW",
        zone: "Newcastle Seaborne Arc",
      },
      {
        mmsi: "352891000",
        name: "SOUTHERN CROSS CAPE",
        lat: 12.6,
        lon: 134.2,
        speed: 11.8,
        heading: 342,
        destination: "YOKOHAMA JP",
        zone: "Newcastle Seaborne Arc",
      },
    ],
  },
  "richards-bay-eu": {
    vesselCount: 6,
    congestion: "low",
    vessels: [
      {
        mmsi: "636019482",
        name: "ZULULAND TRADER",
        lat: -28.82,
        lon: 32.12,
        speed: 10.6,
        heading: 215,
        destination: "ROTTERDAM NL",
        zone: "Richards Bay Export Loop",
      },
      {
        mmsi: "538008114",
        name: "ATLANTIC KMAX",
        lat: 14.2,
        lon: -18.4,
        speed: 12.3,
        heading: 8,
        destination: "ARA ANCHORAGE",
        zone: "Richards Bay Export Loop",
      },
    ],
  },
  "us-gulf-asia": {
    vesselCount: 5,
    congestion: "low",
    vessels: [
      {
        mmsi: "367512890",
        name: "MISSISSIPPI BULK",
        lat: 28.95,
        lon: -89.38,
        speed: 11.1,
        heading: 168,
        destination: "BALBOA PA",
        zone: "US Gulf to Asia",
      },
      {
        mmsi: "371449200",
        name: "PANAMA HORIZON",
        lat: 22.4,
        lon: 120.1,
        speed: 11.9,
        heading: 315,
        destination: "POHANG KR",
        zone: "US Gulf to Asia",
      },
    ],
  },
  "indonesia-india": {
    vesselCount: 14,
    congestion: "high",
    vessels: [
      {
        mmsi: "525019340",
        name: "KALIMANTAN PRIMA",
        lat: -1.18,
        lon: 117.12,
        speed: 9.2,
        heading: 245,
        destination: "MUNDRA IN",
        zone: "Indonesian Barge Network",
      },
      {
        mmsi: "525024810",
        name: "MAHAKAM EXPRESS",
        lat: 3.45,
        lon: 108.6,
        speed: 10.4,
        heading: 290,
        destination: "KRISHNAPATNAM IN",
        zone: "Indonesian Barge Network",
      },
      {
        mmsi: "563114900",
        name: "BORNEO CENTURY",
        lat: 6.12,
        lon: 96.4,
        speed: 11.0,
        heading: 282,
        destination: "PARADIP IN",
        zone: "Indonesian Barge Network",
      },
    ],
  },
};

const SERIES_PATTERNS: Record<
  string,
  { base: number; end: number; waveAmp: number; secondaryAmp: number; phase: number }
> = {
  NEWCASTLE: { base: 94.2, end: 104.75, waveAmp: 3.1, secondaryAmp: 1.4, phase: 0.4 },
  API2: { base: 103.5, end: 112.4, waveAmp: 3.6, secondaryAmp: 1.6, phase: 1.1 },
  ILLINOIS: { base: 53.1, end: 51.25, waveAmp: 1.25, secondaryAmp: 0.55, phase: 2.3 },
  METCOAL: { base: 194.0, end: 206.5, waveAmp: 5.8, secondaryAmp: 2.4, phase: 0.85 },
  CAPP: { base: 70.8, end: 73.6, waveAmp: 1.8, secondaryAmp: 0.7, phase: 1.6 },
  PRB: { base: 13.7, end: 14.15, waveAmp: 0.28, secondaryAmp: 0.12, phase: 0.9 },
  UINTA: { base: 41.5, end: 40.8, waveAmp: 0.65, secondaryAmp: 0.25, phase: 1.9 },
};

export function getReferenceCoalHistory(
  symbol: string,
  interval: "D" | "W" | "M" = "D",
): { date: string; close: number }[] {
  const key = symbol.toUpperCase();
  const pattern = SERIES_PATTERNS[key];
  if (!pattern) return [];

  const pointsCount = interval === "D" ? 45 : interval === "W" ? 52 : 24;
  const stepDays = interval === "D" ? 2 : interval === "W" ? 7 : 30;
  const anchor = new Date("2026-10-26T00:00:00.000Z").getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  return Array.from({ length: pointsCount }, (_, idx) => {
    const progress = idx / Math.max(1, pointsCount - 1);
    const daysBack = (pointsCount - 1 - idx) * stepDays;
    const date = new Date(anchor - daysBack * dayMs).toISOString().slice(0, 10);

    if (idx === pointsCount - 1) {
      return { date, close: Number(pattern.end.toFixed(2)) };
    }

    const trend = pattern.base + (pattern.end - pattern.base) * progress;
    const primaryWave = Math.sin(progress * Math.PI * 3.5 + pattern.phase) * pattern.waveAmp;
    const secondaryWave =
      Math.cos(progress * Math.PI * 7.2 + pattern.phase * 1.7) * pattern.secondaryAmp;
    const close = Number(Math.max(1, trend + primaryWave + secondaryWave).toFixed(2));
    return { date, close };
  });
}