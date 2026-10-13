// Critical Materials Intelligence — price benchmark seeds (F5).
//
// Every material gets at least one commercially relevant benchmark definition
// (productForm / grade / market / unit). Benchmarks with a `feed` are backed by
// a live public price feed that the scraper (`syncMaterialPrices` in
// src/lib/material-intel-service.ts) polls and appends to PriceObservation.
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
  feed?: MaterialBenchmarkFeed
}

const REE_CHINA_WEEKLY = { market: 'China', updateFrequency: 'weekly', sourcePublisher: 'USGS' } as const

export const MATERIAL_BENCHMARKS: MaterialBenchmarkSeed[] = [
  // ---- Light Rare Earths (USGS convention: La, Ce, Pr, Nd, Sm, Eu, Gd) ----
  { materialKey: 'mat_lanthanum', productForm: 'Lanthanum oxide', grade: '99.5% min', unit: 'kg', isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_cerium', productForm: 'Cerium oxide', grade: '99.5% min', unit: 'kg', isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_praseodymium', productForm: 'Praseodymium oxide', grade: '99.5% min', unit: 'kg', isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_neodymium', productForm: 'Neodymium oxide', grade: '99.5% min', unit: 'kg', isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_samarium', productForm: 'Samarium oxide', grade: '99.5% min', unit: 'kg', isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_europium', productForm: 'Europium oxide', grade: '99.99% (4N)', unit: 'kg', isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_gadolinium', productForm: 'Gadolinium oxide', grade: '99.9% min', unit: 'kg', isPrimary: true, ...REE_CHINA_WEEKLY },

  // ---- Heavy Rare Earths (Tb, Dy, Ho, Er, Tm, Yb, Lu + Y per USGS) ----
  { materialKey: 'mat_terbium', productForm: 'Terbium oxide', grade: '99.9% min', unit: 'kg', isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_dysprosium', productForm: 'Dysprosium oxide', grade: '99.5% min', unit: 'kg', isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_holmium', productForm: 'Holmium oxide', grade: '99.5% min', unit: 'kg', isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_erbium', productForm: 'Erbium oxide', grade: '99.5% min', unit: 'kg', isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_thulium', productForm: 'Thulium oxide', grade: '99.9% min', unit: 'kg', isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_ytterbium', productForm: 'Ytterbium oxide', grade: '99.9% min', unit: 'kg', isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_lutetium', productForm: 'Lutetium oxide', grade: '99.99% (4N)', unit: 'kg', isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_yttrium', productForm: 'Yttrium oxide', grade: '99.99% (4N)', unit: 'kg', isPrimary: true, ...REE_CHINA_WEEKLY },
  { materialKey: 'mat_scandium', productForm: 'Scandium oxide', grade: '99.9% min', unit: 'kg', isPrimary: true, ...REE_CHINA_WEEKLY },

  // ---- Battery materials ----
  { materialKey: 'mat_lithium', productForm: 'Lithium carbonate', grade: 'battery grade', market: 'China', unit: 'tonne', updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_lithium', productForm: 'Lithium hydroxide monohydrate', grade: 'battery grade', market: 'China', unit: 'tonne', updateFrequency: 'daily', sourcePublisher: 'USGS' },
  {
    materialKey: 'mat_lithium', productForm: 'Lithium & battery-tech basket', benchmarkName: 'Global X Lithium & Battery Tech ETF (proxy)',
    market: 'US ETF', unit: 'share', updateFrequency: 'daily', isProxy: true,
    feed: { provider: 'yahoo', symbol: 'LIT' },
  },
  { materialKey: 'mat_cobalt', productForm: 'Cobalt metal', grade: '99.8% min', market: 'Global (LME)', unit: 'lb', updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'USGS' },
  {
    materialKey: 'mat_nickel', productForm: 'Nickel Class 1', grade: '99.8% min', benchmarkName: 'LME Nickel (via WisdomTree Nickel ETC proxy)',
    market: 'LME', unit: 'tonne', updateFrequency: 'daily', isPrimary: true, isProxy: true, sourcePublisher: 'USGS',
    feed: { provider: 'yahoo', symbol: 'NICKEL.L' },
  },
  { materialKey: 'mat_manganese', productForm: 'Electrolytic manganese flake', grade: '99.7% min', market: 'China', unit: 'tonne', updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_natural_graphite', productForm: 'Spherical graphite', grade: '99.95% C', market: 'China', unit: 'tonne', updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },

  // ---- Energy transition / industrial metals ----
  {
    materialKey: 'mat_copper', productForm: 'Copper cathode', grade: 'Grade A', benchmarkName: 'COMEX HG Copper',
    market: 'COMEX', unit: 'lb', updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'USGS',
    feed: { provider: 'yahoo', symbol: 'HG=F' },
  },
  {
    materialKey: 'mat_aluminum', productForm: 'Primary aluminum ingot', grade: 'P1020A', benchmarkName: 'CME Aluminum (ALI)',
    market: 'CME', unit: 'tonne', updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'USGS',
    feed: { provider: 'yahoo', symbol: 'ALI=F' },
  },

  // ---- Technology metals ----
  { materialKey: 'mat_gallium', productForm: 'Gallium metal', grade: '99.99% (4N)', market: 'China', unit: 'kg', updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_germanium', productForm: 'Germanium dioxide', grade: '99.99% (4N)', market: 'China', unit: 'kg', updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_indium', productForm: 'Indium ingot', grade: '99.99% (4N)', market: 'China', unit: 'kg', updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_tellurium', productForm: 'Tellurium metal', grade: '99.99% (4N)', market: 'China', unit: 'kg', updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_selenium', productForm: 'Selenium powder', grade: '99.5% min', market: 'Global', unit: 'kg', updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },

  // ---- Platinum group metals ----
  {
    materialKey: 'mat_platinum', productForm: 'Platinum sponge', grade: '99.95% min', benchmarkName: 'NYMEX Platinum (PL)',
    market: 'NYMEX', unit: 'oz', updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'USGS',
    feed: { provider: 'yahoo', symbol: 'PL=F' },
  },
  {
    materialKey: 'mat_palladium', productForm: 'Palladium sponge', grade: '99.95% min', benchmarkName: 'NYMEX Palladium (PA)',
    market: 'NYMEX', unit: 'oz', updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'USGS',
    feed: { provider: 'yahoo', symbol: 'PA=F' },
  },
  { materialKey: 'mat_rhodium', productForm: 'Rhodium metal', grade: '99.9% min', market: 'Global', unit: 'oz', updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'Johnson Matthey' },
  { materialKey: 'mat_iridium', productForm: 'Iridium metal', grade: '99.9% min', market: 'Global', unit: 'oz', updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'Johnson Matthey' },
  { materialKey: 'mat_ruthenium', productForm: 'Ruthenium metal', grade: '99.9% min', market: 'Global', unit: 'oz', updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'Johnson Matthey' },

  // ---- Strategic alloy / specialty metals ----
  { materialKey: 'mat_tungsten', productForm: 'Ammonium paratungstate (APT)', grade: '88.5% WO3 min', market: 'China', unit: 'mtu', updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_molybdenum', productForm: 'Molybdenum oxide', grade: '57% Mo min', market: 'Global', unit: 'lb', updateFrequency: 'daily', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_vanadium', productForm: 'Vanadium pentoxide (V2O5)', grade: '98% min', market: 'China', unit: 'lb', updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_niobium', productForm: 'Ferroniobium', grade: '65% Nb min', market: 'Brazil', unit: 'kg', updateFrequency: 'monthly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_tantalum', productForm: 'Tantalum concentrate', grade: '30% Ta2O5 min', market: 'Global', unit: 'lb', updateFrequency: 'monthly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_hafnium', productForm: 'Hafnium metal', grade: '99% min', market: 'Global', unit: 'kg', updateFrequency: 'monthly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_rhenium', productForm: 'Rhenium metal powder', grade: '99.9% min', market: 'Global', unit: 'kg', updateFrequency: 'monthly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_antimony', productForm: 'Antimony ingot', grade: '99.65% min', market: 'China', unit: 'tonne', updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },
  { materialKey: 'mat_bismuth', productForm: 'Bismuth ingot', grade: '99.99% (4N)', market: 'China', unit: 'lb', updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'USGS' },

  // ---- Nuclear fuel ----
  { materialKey: 'mat_uranium', productForm: 'U3O8 (uranium oxide concentrate)', grade: 'spot', benchmarkName: 'U3O8 Spot Price', market: 'Global', unit: 'lb', updateFrequency: 'weekly', isPrimary: true, sourcePublisher: 'World Nuclear Association' },
  {
    materialKey: 'mat_uranium', productForm: 'Uranium miners basket', benchmarkName: 'Sprott Uranium Miners ETF (proxy)',
    market: 'US ETF', unit: 'share', updateFrequency: 'daily', isProxy: true,
    feed: { provider: 'yahoo', symbol: 'URNM' },
  },
]

export function benchmarksForMaterial(materialKey: string): MaterialBenchmarkSeed[] {
  return MATERIAL_BENCHMARKS.filter((b) => b.materialKey === materialKey)
}
