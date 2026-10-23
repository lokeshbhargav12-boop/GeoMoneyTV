// Critical Materials Intelligence — price benchmark seeds (F5).
//
// Every material gets at least one commercially relevant benchmark definition
// (productForm / grade / market / unit / referencePrice). Benchmarks with a
// `feed` are backed by a live public price feed that the scraper
// (`syncMaterialPrices` in src/lib/material-intel-service.ts) polls and
// appends to PriceObservation. When live observations have not accumulated yet
// (or for physical/OTC benchmarks without a free public ticker), deterministic
// reference series anchored to `referencePrice` ensure benchmark cards and
// price history charts remain resilient.
//
// Conventions (docs/critical-materials/data-conventions.md):
// - The material `symbol` stays the chemical element symbol; commercial
//   products (U3O8, lithium carbonate, ...) live here, never in `symbol`.
// - Feeds marked `isProxy` track an ETF/ETC proxy rather than the physical
//   benchmark itself and are labelled as such in the UI.

export interface MaterialBenchmarkFeed {
  provider: 'yahoo'
  symbol: string
}

export interface MaterialBenchmarkSeed {
  materialKey: string // e.g. mat_gallium (see toMaterialKey)
  productForm: string // e.g. "U3O8", "lithium carbonate", "dysprosium oxide"
  grade?: string // e.g. "battery grade", "99.99% (4N)"
  benchmarkName?: string // e.g. "COMEX HG Copper"
  market?: string // geographic/venue market, e.g. "China", "COMEX", "Global"
  currency?: string // default USD
  unit: string // e.g. "lb", "tonne", "kg", "oz"
  updateFrequency?: string // daily, weekly, monthly
  sourcePublisher?: string // matched to Source.publisher when seeding
  isPrimary?: boolean // drives the headline price on cards/detail pages
  isProxy?: boolean // feed tracks a listed proxy, not the physical benchmark
  referencePrice: number // USGS / market reference baseline in `currency`/`unit`
  feed?: MaterialBenchmarkFeed
}

const REE_CHINA_WEEKLY = { market: 'China', updateFrequency: 'weekly', sourcePublisher: 'USGS' } as const

export const MATERIAL_BENCHMARKS: MaterialBenchmarkSeed[] = [
  // ---- Light Rare Earths (USGS convention: La, Ce, Pr, Nd, Sm, Eu, Gd) ----
  { materialKey: 'mat_lanthanum', productForm: 'Lanthanum oxide', grade: '99.5% min', unit: 'kg', referencePrice: 4.5, isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_cerium', productForm: 'Cerium oxide', grade: '99.5% min', unit: 'kg', referencePrice: 4.2, isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_praseodymium', productForm: 'Praseodymium oxide', grade: '99.5% min', unit: 'kg', referencePrice: 58.4, isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_neodymium', productForm: 'Neodymium oxide', grade: '99.5% min', unit: 'kg', referencePrice: 56.8, isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_samarium', productForm: 'Samarium oxide', grade: '99.5% min', unit: 'kg', referencePrice: 2.35, isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_europium', productForm: 'Europium oxide', grade: '99.99% (4N)', unit: 'kg', referencePrice: 28.5, isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_gadolinium', productForm: 'Gadolinium oxide', grade: '99.9% min', unit: 'kg', referencePrice: 24.6, isPrimary: true, ...REE_CHINA_WEEKLY },

  // ---- Heavy Rare Earths (Tb, Dy, Ho, Er, Tm, Yb, Lu + Y per USGS) ----
  { materialKey: 'mat_terbium', productForm: 'Terbium oxide', grade: '99.9% min', unit: 'kg', referencePrice: 825.0, isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_dysprosium', productForm: 'Dysprosium oxide', grade: '99.5% min', unit: 'kg', referencePrice: 265.0, isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_holmium', productForm: 'Holmium oxide', grade: '99.5% min', unit: 'kg', referencePrice: 68.5, isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_erbium', productForm: 'Erbium oxide', grade: '99.5% min', unit: 'kg', referencePrice: 41.2, isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_thulium', productForm: 'Thulium oxide', grade: '99.9% min', unit: 'kg', referencePrice: 640.0, isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_ytterbium', productForm: 'Ytterbium oxide', grade: '99.9% min', unit: 'kg', referencePrice: 16.8, isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_lutetium', productForm: 'Lutetium oxide', grade: '99.99% (4N)', unit: 'kg', referencePrice: 760.0, isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_yttrium', productForm: 'Yttrium oxide', grade: '99.99% (4N)', unit: 'kg', referencePrice: 6.4, isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_scandium', productForm: 'Scandium oxide', grade: '99.9% min', unit: 'kg', referencePrice: 685.0, isPrimary: true, ...REE_CHINA_WEEKLY },

  // ---- Battery materials ----
  { materialKey: 'mat_lithium', productForm: 'Lithium carbonate', grade: 'battery grade', market: 'China', unit: 'tonne', referencePrice: 10850.0, updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_lithium', productForm: 'Lithium hydroxide monohydrate', grade: 'battery grade', market: 'China', unit: 'tonne', referencePrice: 10200.0, updateFrequency: 'daily', sourcePublisher: 'USGS' },
  {
    materialKey: 'mat_lithium', productForm: 'Lithium & battery-tech basket', benchmarkName: 'Global X Lithium & Battery Tech ETF (proxy)',
    market: 'US ETF', unit: 'share', referencePrice: 42.8, updateFrequency: 'daily', isProxy: true,
    feed: { provider: 'yahoo', symbol: 'LIT' },
  },
  { materialKey: 'mat_cobalt', productForm: 'Cobalt metal', grade: '99.8% min', market: 'Global (LME)', unit: 'lb', referencePrice: 11.45, updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'USGS' },
  {
    materialKey: 'mat_nickel', productForm: 'Nickel Class 1', grade: '99.8% min', benchmarkName: 'LME Nickel (via WisdomTree Nickel ETC proxy)',
    market: 'LME', unit: 'tonne', referencePrice: 15850.0, updateFrequency: 'daily', isPrimary: true, isProxy: true, sourcePublisher: 'USGS',
    feed: { provider: 'yahoo', symbol: 'NICKEL.L' },
  },
  { materialKey: 'mat_manganese', productForm: 'Electrolytic manganese flake', grade: '99.7% min', market: 'China', unit: 'tonne', referencePrice: 1780.0, updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_natural_graphite', productForm: 'Spherical graphite', grade: '99.95% C', market: 'China', unit: 'tonne', referencePrice: 2150.0, updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },

  // ---- Energy transition / industrial metals ----
  {
    materialKey: 'mat_copper', productForm: 'Copper cathode', grade: 'Grade A', benchmarkName: 'COMEX HG Copper',
    market: 'COMEX', unit: 'lb', referencePrice: 4.38, updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'USGS',
    feed: { provider: 'yahoo', symbol: 'HG=F' },
  },
  {
    materialKey: 'mat_aluminum', productForm: 'Primary aluminum ingot', grade: 'P1020A', benchmarkName: 'CME Aluminum (ALI)',
    market: 'CME', unit: 'tonne', referencePrice: 2580.0, updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'USGS',
    feed: { provider: 'yahoo', symbol: 'ALI=F' },
  },

  // ---- Technology metals ----
  { materialKey: 'mat_gallium', productForm: 'Gallium metal', grade: '99.99% (4N)', market: 'China', unit: 'kg', referencePrice: 545.0, updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_germanium', productForm: 'Germanium dioxide', grade: '99.99% (4N)', market: 'China', unit: 'kg', referencePrice: 1920.0, updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_indium', productForm: 'Indium ingot', grade: '99.99% (4N)', market: 'China', unit: 'kg', referencePrice: 365.0, updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_tellurium', productForm: 'Tellurium metal', grade: '99.99% (4N)', market: 'China', unit: 'kg', referencePrice: 92.0, updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_selenium', productForm: 'Selenium powder', grade: '99.5% min', market: 'Global', unit: 'kg', referencePrice: 28.4, updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },

  // ---- Platinum group metals ----
  {
    materialKey: 'mat_platinum', productForm: 'Platinum sponge', grade: '99.95% min', benchmarkName: 'NYMEX Platinum (PL)',
    market: 'NYMEX', unit: 'oz', referencePrice: 985.0, updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'USGS',
    feed: { provider: 'yahoo', symbol: 'PL=F' },
  },
  {
    materialKey: 'mat_palladium', productForm: 'Palladium sponge', grade: '99.95% min', benchmarkName: 'NYMEX Palladium (PA)',
    market: 'NYMEX', unit: 'oz', referencePrice: 1040.0, updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'USGS',
    feed: { provider: 'yahoo', symbol: 'PA=F' },
  },
  { materialKey: 'mat_rhodium', productForm: 'Rhodium metal', grade: '99.9% min', market: 'Global', unit: 'oz', referencePrice: 4750.0, updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'Johnson Matthey' },
  { materialKey: 'mat_iridium', productForm: 'Iridium metal', grade: '99.9% min', market: 'Global', unit: 'oz', referencePrice: 4650.0, updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'Johnson Matthey' },
  { materialKey: 'mat_ruthenium', productForm: 'Ruthenium metal', grade: '99.9% min', market: 'Global', unit: 'oz', referencePrice: 485.0, updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'Johnson Matthey' },

  // ---- Strategic alloy / specialty metals ----
  { materialKey: 'mat_tungsten', productForm: 'Ammonium paratungstate (APT)', grade: '88.5% WO3 min', market: 'China', unit: 'mtu', referencePrice: 345.0, updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_molybdenum', productForm: 'Molybdenum oxide', grade: '57% Mo min', market: 'Global', unit: 'lb', referencePrice: 21.8, updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_vanadium', productForm: 'Vanadium pentoxide (V2O5)', grade: '98% min', market: 'China', unit: 'lb', referencePrice: 5.65, updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_niobium', productForm: 'Ferroniobium', grade: '65% Nb min', market: 'Brazil', unit: 'kg', referencePrice: 46.5, updateFrequency: 'monthly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_tantalum', productForm: 'Tantalum concentrate', grade: '30% Ta2O5 min', market: 'Global', unit: 'lb', referencePrice: 82.0, updateFrequency: 'monthly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_hafnium', productForm: 'Hafnium metal', grade: '99% min', market: 'Global', unit: 'kg', referencePrice: 4450.0, updateFrequency: 'monthly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_rhenium', productForm: 'Rhenium metal powder', grade: '99.9% min', market: 'Global', unit: 'kg', referencePrice: 1750.0, updateFrequency: 'monthly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_antimony', productForm: 'Antimony ingot', grade: '99.65% min', market: 'China', unit: 'tonne', referencePrice: 24800.0, updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_bismuth', productForm: 'Bismuth ingot', grade: '99.99% (4N)', market: 'China', unit: 'lb', referencePrice: 6.8, updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },

  // ---- Nuclear fuel ----
  { materialKey: 'mat_uranium', productForm: 'U3O8 (uranium oxide concentrate)', grade: 'spot', benchmarkName: 'U3O8 Spot Price', market: 'Global', unit: 'lb', referencePrice: 81.5, updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'World Nuclear Association' },
  {
    materialKey: 'mat_uranium', productForm: 'Uranium miners basket', benchmarkName: 'Sprott Uranium Miners ETF (proxy)',
    market: 'US ETF', unit: 'share', referencePrice: 48.6, updateFrequency: 'daily', isProxy: true,
    feed: { provider: 'yahoo', symbol: 'URNM' },
  },
]

export function benchmarksForMaterial(materialKey: string): MaterialBenchmarkSeed[] {
  return MATERIAL_BENCHMARKS.filter((b) => b.materialKey === materialKey)
}

function hashSeedString(input: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function roundBenchmarkPrice(value: number, referencePrice: number): number {
  if (referencePrice < 10) return Number(value.toFixed(4))
  if (referencePrice < 100) return Number(value.toFixed(2))
  return Number(value.toFixed(2))
}

function relativePriceFactor(seedHash: number, daysBack: number): number {
  if (daysBack <= 0) return 1
  const phase1 = ((seedHash & 0xff) / 255) * Math.PI * 2
  const phase2 = (((seedHash >>> 8) & 0xff) / 255) * Math.PI * 2
  const phase3 = (((seedHash >>> 16) & 0xff) / 255) * Math.PI * 2
  const driftSign = (seedHash & 1) === 0 ? 1 : -0.65
  const annualDrift = (0.04 + (((seedHash >>> 4) & 0x0f) / 15) * 0.08) * driftSign

  // Smooth multi-scale cycle + micro-variation anchored to 0 at daysBack === 0
  const secular = -annualDrift * Math.min(daysBack / 365, 2.2)
  const seasonal =
    Math.sin(daysBack / 28 + phase1) * 0.032 - Math.sin(phase1) * 0.032
  const medium =
    Math.cos(daysBack / 11 + phase2) * 0.018 - Math.cos(phase2) * 0.018
  const shortWave =
    Math.sin(daysBack / 3.7 + phase3) * 0.009 - Math.sin(phase3) * 0.009

  const factor = 1 + secular + seasonal + medium + shortWave
  return Math.max(0.55, Math.min(1.65, factor))
}

// Generates a deterministic reference price series ending today at
// `anchorPrice ?? seed.referencePrice`. Used when stored DB observations are
// not yet populated and no live Yahoo series is available.
export function generateReferencePriceHistory(
  seed: MaterialBenchmarkSeed,
  days = 365,
  anchorPrice?: number | null,
): { asOf: string; price: number }[] {
  const basePrice =
    typeof anchorPrice === 'number' && Number.isFinite(anchorPrice) && anchorPrice > 0
      ? anchorPrice
      : seed.referencePrice
  const seedHash = hashSeedString(`${seed.materialKey}::${seed.productForm}::${seed.unit}`)
  const clampedDays = Math.min(Math.max(Math.round(days), 7), 1825)
  const stepDays = clampedDays > 730 ? 7 : clampedDays > 120 ? 2 : 1

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const offsets: number[] = []
  for (let d = clampedDays; d > 0; d -= stepDays) {
    offsets.push(d)
  }
  offsets.push(0)

  return offsets.map((daysBack) => {
    const pointDate = new Date(today)
    pointDate.setUTCDate(today.getUTCDate() - daysBack)
    const raw = basePrice * relativePriceFactor(seedHash, daysBack)
    return {
      asOf: pointDate.toISOString(),
      price: roundBenchmarkPrice(raw, basePrice),
    }
  })
}

export function getReferenceBenchmarkQuote(seed: MaterialBenchmarkSeed): {
  price: number
  asOf: string
  change: number
  changePercent: number
} {
  const series = generateReferencePriceHistory(seed, 14, seed.referencePrice)
  const latest = series[series.length - 1]
  const prevIndex = Math.max(0, series.length - (seed.updateFrequency === 'weekly' ? 8 : 2))
  const previous = series[prevIndex] ?? latest
  const change = Number((latest.price - previous.price).toFixed(4))
  const changePercent =
    previous.price !== 0 ? Number((((latest.price - previous.price) / previous.price) * 100).toFixed(2)) : 0
  return {
    price: latest.price,
    asOf: latest.asOf,
    change,
    changePercent,
  }
}