// ─────────────────────────────────────────────────────────────
// Leaflet-free default datasets for the Energy Infrastructure desk.
//
// This module is intentionally side-effect free and MUST NOT import
// `leaflet`, `react-leaflet`, or any other browser-only library. The
// `/energy/infrastructure` page imports these values directly so they can
// be rendered during static prerendering (SSR) without pulling Leaflet
// (which references `window` at module-evaluation time) into the server
// bundle. The actual `<EnergyInfrastructureMap>` component is loaded
// separately via `next/dynamic` with `ssr: false`.
// ─────────────────────────────────────────────────────────────

export type InfraLayer =
  | "all"
  | "resource-input"
  | "extraction"
  | "processing"
  | "transport"
  | "storage"
  | "import-export"
  | "distribution"
  | "control";

export interface MapAsset {
  id: string;
  name: string;
  layer: InfraLayer;
  tech: string;
  lat: number;
  lng: number;
  capacity?: string;
  status?: string;
  pressure?: string;
  region: string;
  operator?: string;
  primaryFuel?: string;
  nameplateCapacityNumeric?: number;
  capacityUnit?: string;
  baseOutputNumeric?: number;
  currentOutputStr?: string;
  utilizationPercent?: number;
  connectedCorridorIds?: string[];
  macroExposure?: {
    benchmarkSymbol: string;
    globalSharePct: number;
    priceSensitivityPerOutagePct: number;
    inflationRisk: "Low" | "Moderate" | "High" | "Critical";
  };
  outputHistory7d?: number[];
}

export interface MapCorridor {
  id: string;
  name: string;
  kind: "pipeline" | "transmission" | "shipping" | "rail";
  path: [number, number][];
  throughput: string;
  status: string;
}

export interface FlowRoute {
  id: string;
  origin: [number, number];
  destination: [number, number];
  label: string;
  volume: string;
  commodity: string;
  color?: string;
}

export interface GridStressNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  loadPercent: number | null;
  capacityGW: number;
  alert: "normal" | "elevated" | "critical";
}


export const DEFAULT_ASSETS: MapAsset[] = [
  // Extraction / Generation
  { id: "ghawar", name: "Ghawar Field", layer: "extraction", tech: "Oil", lat: 25.9, lng: 49.6, capacity: "3.8 MMBPD", status: "Operating", pressure: "Mature giant field", region: "Saudi Arabia" },
  { id: "permian", name: "Permian Basin", layer: "extraction", tech: "Oil & Gas", lat: 31.8, lng: -102.5, capacity: "5.4 MMBPD eq", status: "Operating", pressure: "Takeaway constraints", region: "USA" },
  { id: "marcellus", name: "Marcellus Shale", layer: "extraction", tech: "Gas", lat: 41.2, lng: -77.2, capacity: "32 BCFD", status: "Operating", pressure: "Pipeline takeaway", region: "USA" },
  { id: "gudrun", name: "Gudrun Platform", layer: "extraction", tech: "Oil & Gas", lat: 61.3, lng: 2.0, capacity: "110 kbpd", status: "Operating", pressure: "Maintenance windows", region: "North Sea" },
  { id: "powder-river", name: "Powder River Basin", layer: "extraction", tech: "Coal", lat: 43.6, lng: -105.9, capacity: "4200 MW eq", status: "Declining", pressure: "Rail throughput", region: "USA" },
  { id: "hambach", name: "Hambach Lignite", layer: "extraction", tech: "Coal", lat: 50.9, lng: 6.5, capacity: "2900 MW", status: "Phasing", pressure: "Retirement schedule", region: "Germany" },
  { id: "goliat", name: "Goliat FPSO", layer: "extraction", tech: "Oil", lat: 71.5, lng: 22.3, capacity: "100 kbpd", status: "Operating", pressure: "Arctic logistics", region: "Norway" },
  // Renewables
  { id: "tengger", name: "Tengger Desert Solar", layer: "extraction", tech: "Solar", lat: 37.5, lng: 105.0, capacity: "1.5 GW", status: "Operating", pressure: "Grid curtailment", region: "China" },
  { id: "hornsea", name: "Hornsea Wind", layer: "extraction", tech: "Wind", lat: 53.9, lng: 1.5, capacity: "2.4 GW", status: "Operating", pressure: "Cable maintenance", region: "UK" },
  { id: "itaipu", name: "Itaipu Dam", layer: "extraction", tech: "Hydro", lat: -25.4, lng: -54.6, capacity: "14 GW", status: "Operating", pressure: "Drought cycles", region: "Brazil/Paraguay" },
  { id: "geysers", name: "The Geysers", layer: "extraction", tech: "Geothermal", lat: 38.8, lng: -122.8, capacity: "1.5 GW", status: "Operating", pressure: "Steam decline", region: "USA" },
  // Processing
  { id: "ras-tanura", name: "Ras Tanura Refinery", layer: "processing", tech: "Oil", lat: 26.65, lng: 50.0, capacity: "550 kbpd", status: "Operating", pressure: "Export loading", region: "Saudi Arabia" },
  { id: "jamnagar", name: "Jamnagar Refinery", layer: "processing", tech: "Oil", lat: 22.4, lng: 69.8, capacity: "1.24 MMBPD", status: "Operating", pressure: "Feedstock sourcing", region: "India" },
  { id: "rotterdam-ref", name: "Rotterdam Refining Hub", layer: "processing", tech: "Oil", lat: 51.9, lng: 4.1, capacity: "800 kbpd", status: "Operating", pressure: "Carbon border rules", region: "Netherlands" },
  { id: "qatar-lng", name: "Qatar North Field LNG", layer: "processing", tech: "LNG", lat: 25.9, lng: 51.5, capacity: "110 mtpa", status: "Expanding", pressure: "Train construction", region: "Qatar" },
  { id: "cheniere", name: "Cheniere Sabine Pass", layer: "processing", tech: "LNG", lat: 29.9, lng: -93.9, capacity: "45 mtpa", status: "Operating", pressure: "Feedgas demand", region: "USA" },
  { id: "neom-green", name: "NEOM Green Hydrogen", layer: "processing", tech: "Hydrogen", lat: 28.0, lng: 35.0, capacity: "600 t/d", status: "Construction", pressure: "Electrolyzer supply", region: "Saudi Arabia" },
  // Transport / Transmission
  { id: "hormuz", name: "Strait of Hormuz Chokepoint", layer: "transport", tech: "Shipping", lat: 26.5, lng: 56.2, capacity: "21 MMBPD", status: "Open", pressure: "Geopolitical risk", region: "Persian Gulf" },
  { id: "malacca", name: "Strait of Malacca", layer: "transport", tech: "Shipping", lat: 3.2, lng: 101.0, capacity: "16 MMBPD", status: "Open", pressure: "Piracy / congestion", region: "Malaysia" },
  { id: "suez", name: "Suez Canal", layer: "transport", tech: "Shipping", lat: 30.0, lng: 32.5, capacity: "10% seaborne trade", status: "Open", pressure: "Drought / blockage risk", region: "Egypt" },
  { id: "panama", name: "Panama Canal", layer: "transport", tech: "Shipping", lat: 9.0, lng: -79.5, capacity: "3% global trade", status: "Restricted", pressure: "Water levels", region: "Panama" },
  { id: "transwest", name: "TransWest Express HVDC", layer: "transport", tech: "Grid", lat: 41.5, lng: -107.0, capacity: "3 GW", status: "Permitting", pressure: "Permitting delays", region: "USA" },
  { id: "nordlink", name: "NordLink HVDC", layer: "transport", tech: "Grid", lat: 58.0, lng: 7.0, capacity: "1.4 GW", status: "Operating", pressure: "Price arbitrage", region: "Norway/Germany" },
  // Storage
  { id: "cushing", name: "Cushing Storage Hub", layer: "storage", tech: "Oil", lat: 35.9, lng: -96.7, capacity: "80 MMBBL", status: "Cycling", pressure: "Inventory draws", region: "USA" },
  { id: "spr", name: "US Strategic Petroleum Reserve", layer: "storage", tech: "Oil", lat: 30.0, lng: -91.0, capacity: "~400 MMBBL", status: "Reserve", pressure: "Political releases", region: "USA" },
  { id: "rehden", name: "Rehden Gas Storage", layer: "storage", tech: "Gas", lat: 52.6, lng: 8.5, capacity: "4.2 BCM", status: "Operating", pressure: "Fill rate", region: "Germany" },
  { id: "hornsdale", name: "Hornsdale Power Reserve", layer: "storage", tech: "Batteries", lat: -33.8, lng: 138.1, capacity: "194 MWh", status: "Operating", pressure: "FCAS market", region: "Australia" },
  { id: "bath-county", name: "Bath County Pumped Hydro", layer: "storage", tech: "Pumped Hydro", lat: 38.2, lng: -79.8, capacity: "24 GWh", status: "Operating", pressure: "Drought exposure", region: "USA" },
  // Import / Export
  { id: "newcastle", name: "Newcastle Coal Terminal", layer: "import-export", tech: "Coal", lat: -32.9, lng: 151.8, capacity: "211 mtpa", status: "Operating", pressure: "Channel queues", region: "Australia" },
  { id: "richards-bay", name: "Richards Bay Coal Terminal", layer: "import-export", tech: "Coal", lat: -28.7, lng: 32.1, capacity: "91 mtpa", status: "Operating", pressure: "Rail theft", region: "South Africa" },
  { id: "singapore-lng", name: "Singapore LNG Terminal", layer: "import-export", tech: "LNG", lat: 1.3, lng: 103.9, capacity: "11 mtpa", status: "Operating", pressure: "Spot demand", region: "Singapore" },
  { id: "zeebrugge", name: "Zeebrugge LNG", layer: "import-export", tech: "LNG", lat: 51.3, lng: 3.2, capacity: "9.2 mtpa", status: "Operating", pressure: "Northeast Asian competition", region: "Belgium" },
  // Distribution
  { id: "texas-ercot", name: "ERCOT Distribution Zone", layer: "distribution", tech: "Grid", lat: 31.0, lng: -99.0, capacity: "78 GW peak", status: "Operating", pressure: "Heatwave stress", region: "USA" },
  { id: "california-iso", name: "California ISO", layer: "distribution", tech: "Grid", lat: 37.5, lng: -121.5, capacity: "52 GW peak", status: "Operating", pressure: "Duck curve", region: "USA" },
  { id: "national-grid", name: "National Grid UK", layer: "distribution", tech: "Grid", lat: 52.5, lng: -1.5, capacity: "60 GW peak", status: "Operating", pressure: "Interconnector flows", region: "UK" },
  // Control
  { id: "pjm", name: "PJM Interconnection", layer: "control", tech: "Grid Ops", lat: 39.9, lng: -77.6, capacity: "185 GW", status: "Operating", pressure: "Capacity auctions", region: "USA" },
  { id: "national-grid-ops", name: "National Grid ESO", layer: "control", tech: "Grid Ops", lat: 51.5, lng: -0.1, capacity: "60 GW", status: "Operating", pressure: "Balancing costs", region: "UK" },
];


// ─── MOCK DATASETS ────────────────────────────────────────────

export const DEFAULT_CORRIDORS: MapCorridor[] = [
  { id: "hormuz-route", name: "Hormuz Exit Lane", kind: "shipping", path: [[26.5, 56.2], [24.0, 58.0], [20.0, 60.0]], throughput: "21 MMBPD", status: "Open" },
  { id: "malacca-route", name: "Malacca Passage", kind: "shipping", path: [[5.5, 98.0], [1.2, 103.5], [-5.0, 106.0]], throughput: "16 MMBPD", status: "Open" },
  { id: "suez-route", name: "Suez Canal", kind: "shipping", path: [[29.9, 32.5], [27.7, 34.0], [25.0, 35.0]], throughput: "10% trade", status: "Open" },
  { id: "panama-route", name: "Panama Canal", kind: "shipping", path: [[9.0, -79.5], [8.5, -80.0], [8.0, -79.0]], throughput: "3% trade", status: "Restricted" },
  { id: "transwest-route", name: "TransWest Express", kind: "transmission", path: [[41.5, -107.0], [39.0, -110.0], [36.0, -115.0]], throughput: "3 GW", status: "Permitting" },
  { id: "nordlink-route", name: "NordLink", kind: "transmission", path: [[58.0, 7.0], [56.0, 8.0], [54.0, 9.0]], throughput: "1.4 GW", status: "Operating" },
  { id: "druzhba-route", name: "Druzhba Pipeline", kind: "pipeline", path: [[54.0, 37.0], [52.0, 20.0], [50.0, 14.0]], throughput: "1 MMBPD", status: "Disrupted" },
  { id: "magistral-route", name: "Central Asia Gas", kind: "pipeline", path: [[41.0, 65.0], [45.0, 60.0], [50.0, 40.0]], throughput: "55 BCM", status: "Operating" },
];

export const DEFAULT_FLOWS: FlowRoute[] = [
  { id: "saudi-china", origin: [25.9, 49.6], destination: [37.5, 105.0], label: "Crude to NE Asia", volume: "5.2 MMBPD", commodity: "Oil", color: "#ef4444" },
  { id: "qatar-eu", origin: [25.9, 51.5], destination: [51.3, 3.2], label: "LNG to Europe", volume: "2.1 mtpa", commodity: "LNG", color: "#8b5cf6" },
  { id: "us-gulf-eu", origin: [29.9, -93.9], destination: [51.3, 3.2], label: "LNG trans-Atlantic", volume: "8.4 mtpa", commodity: "LNG", color: "#8b5cf6" },
  { id: "aus-china", origin: [-32.9, 151.8], destination: [37.5, 105.0], label: "Coal to China", volume: "210 mtpa", commodity: "Coal", color: "#f59e0b" },
  { id: "sa-us", origin: [43.6, -105.9], destination: [35.9, -96.7], label: "Coal to Cushing", volume: "45 mtpa", commodity: "Coal", color: "#f59e0b" },
  { id: "norway-uk", origin: [61.3, 2.0], destination: [52.5, -1.5], label: "Gas to UK", volume: "35 BCM", commodity: "Gas", color: "#06b6d4" },
  { id: "uk-germany", origin: [58.0, 7.0], destination: [52.6, 8.5], label: "NordLink HVDC", volume: "1.4 GW", commodity: "Electricity", color: "#10b981" },
];

export const DEFAULT_GRID_STRESS: GridStressNode[] = [
  { id: "ercot", name: "ERCOT", lat: 31.0, lng: -99.0, loadPercent: 88, capacityGW: 78, alert: "elevated" },
  { id: "caiso", name: "CAISO", lat: 37.5, lng: -121.5, loadPercent: 72, capacityGW: 52, alert: "normal" },
  { id: "pjm", name: "PJM", lat: 39.9, lng: -77.6, loadPercent: 81, capacityGW: 185, alert: "elevated" },
  { id: "texas-south", name: "South Texas", lat: 29.0, lng: -96.0, loadPercent: 94, capacityGW: 42, alert: "critical" },
  { id: "uk-grid", name: "National Grid UK", lat: 52.5, lng: -1.5, loadPercent: 65, capacityGW: 60, alert: "normal" },
  { id: "germany-north", name: "DE North", lat: 53.0, lng: 9.0, loadPercent: 78, capacityGW: 55, alert: "elevated" },
];

export function enrichAssetWithTelemetry(asset: MapAsset): MapAsset {
  const techLower = (asset.tech || "").toLowerCase();
  const nameLower = (asset.name || "").toLowerCase();

  let primaryFuel = "Electric Grid";
  let unit = "GW";
  let numCap = 1.0;
  let operator = "Regional Operator";
  let benchmarkSymbol = "POWER";
  let globalSharePct = 0.5;
  let priceSensitivity = 0.4;
  let inflationRisk: "Low" | "Moderate" | "High" | "Critical" = "Moderate";

  if (techLower.includes("oil") || nameLower.includes("crude") || nameLower.includes("ghawar") || nameLower.includes("permian")) {
    primaryFuel = "Crude Oil";
    unit = "MMBPD";
    benchmarkSymbol = "CRUDE";
    if (asset.id === "ghawar") {
      operator = "Saudi Aramco";
      numCap = 3.8;
      globalSharePct = 3.7;
      priceSensitivity = 1.4;
      inflationRisk = "Critical";
    } else if (asset.id === "permian") {
      operator = "Permian Basin Producers";
      numCap = 5.4;
      globalSharePct = 5.2;
      priceSensitivity = 1.8;
      inflationRisk = "Critical";
    } else if (nameLower.includes("refinery") || techLower.includes("processing")) {
      operator = asset.region === "Saudi Arabia" ? "Saudi Aramco" : asset.region === "India" ? "Reliance Industries" : "Shell / TotalEnergies";
      numCap = parseFloat(asset.capacity || "0.8") || 0.8;
      unit = (asset.capacity || "").includes("kbpd") ? "kbpd" : "MMBPD";
      priceSensitivity = 0.9;
      inflationRisk = "High";
    } else {
      operator = "National Oil Company";
      numCap = 0.5;
    }
  } else if (techLower.includes("gas") || techLower.includes("lng") || nameLower.includes("marcellus") || nameLower.includes("qatar")) {
    primaryFuel = techLower.includes("lng") ? "LNG" : "Natural Gas";
    unit = techLower.includes("lng") ? "mtpa" : "BCFD";
    benchmarkSymbol = "NATGAS";
    if (asset.id === "marcellus") {
      operator = "EQT / Appalachian Gas Consortium";
      numCap = 32.0;
      globalSharePct = 7.5;
      priceSensitivity = 1.6;
      inflationRisk = "High";
    } else if (asset.id === "qatar-lng") {
      operator = "QatarEnergy";
      numCap = 110.0;
      globalSharePct = 21.0;
      priceSensitivity = 2.4;
      inflationRisk = "Critical";
    } else if (asset.id === "cheniere") {
      operator = "Cheniere Energy";
      numCap = 45.0;
      globalSharePct = 10.5;
      priceSensitivity = 1.9;
      inflationRisk = "Critical";
    } else {
      operator = "Export Terminal Operator";
      numCap = 10.0;
    }
  } else if (techLower.includes("coal") || nameLower.includes("coal")) {
    primaryFuel = "Thermal Coal";
    unit = "mtpa";
    benchmarkSymbol = "COAL";
    operator = asset.region === "Australia" ? "Glencore / Whitehaven" : "Peabody Energy";
    numCap = parseFloat(asset.capacity || "50") || 50;
    priceSensitivity = 0.6;
    inflationRisk = "Moderate";
  } else if (techLower.includes("hydro") || techLower.includes("wind") || techLower.includes("solar") || techLower.includes("geothermal")) {
    primaryFuel = techLower.includes("hydro") ? "Hydro" : techLower.includes("wind") ? "Wind" : techLower.includes("solar") ? "Solar" : "Geothermal";
    unit = "GW";
    benchmarkSymbol = "POWER";
    operator = asset.id === "itaipu" ? "Itaipu Binacional" : asset.id === "hornsea" ? "Ørsted" : "Clean Energy Operator";
    numCap = parseFloat(asset.capacity || "2.0") || 2.0;
    priceSensitivity = 0.5;
    inflationRisk = "Low";
  } else if (techLower.includes("shipping") || nameLower.includes("chokepoint") || nameLower.includes("canal") || nameLower.includes("strait")) {
    primaryFuel = "Shipping Transit";
    unit = "MMBPD eq";
    benchmarkSymbol = "CRUDE";
    operator = "Maritime Authority / Port Control";
    numCap = parseFloat(asset.capacity || "15") || 15;
    priceSensitivity = 3.2;
    inflationRisk = "Critical";
  } else if (techLower.includes("grid") || techLower.includes("ops")) {
    primaryFuel = "Electric Grid";
    unit = "GW";
    benchmarkSymbol = "POWER";
    operator = asset.name;
    numCap = parseFloat(asset.capacity || "60") || 60;
    priceSensitivity = 1.2;
    inflationRisk = "High";
  }

  const baseOutput = Number((numCap * 0.91).toFixed(2));
  const utilization = 88 + Math.round(Math.abs((asset.lat * 3) % 9));

  const history = [
    Number((baseOutput * 0.96).toFixed(2)),
    Number((baseOutput * 0.98).toFixed(2)),
    Number((baseOutput * 0.95).toFixed(2)),
    Number((baseOutput * 0.99).toFixed(2)),
    Number((baseOutput * 0.97).toFixed(2)),
    Number((baseOutput * 1.01).toFixed(2)),
    baseOutput,
  ];

  return {
    ...asset,
    operator: asset.operator || operator,
    primaryFuel: asset.primaryFuel || primaryFuel,
    nameplateCapacityNumeric: asset.nameplateCapacityNumeric || numCap,
    capacityUnit: asset.capacityUnit || unit,
    baseOutputNumeric: asset.baseOutputNumeric || baseOutput,
    currentOutputStr: asset.currentOutputStr || `${baseOutput} ${unit} (${utilization}%)`,
    utilizationPercent: asset.utilizationPercent || utilization,
    connectedCorridorIds: asset.connectedCorridorIds || (asset.region.includes("Saudi") ? ["hormuz-route"] : asset.region.includes("USA") ? ["transwest-route", "us-gulf-eu"] : ["nordlink-route"]),
    macroExposure: asset.macroExposure || {
      benchmarkSymbol,
      globalSharePct,
      priceSensitivityPerOutagePct: priceSensitivity,
      inflationRisk,
    },
    outputHistory7d: asset.outputHistory7d || history,
  };
}

export function getEnrichedAssets(): MapAsset[] {
  return DEFAULT_ASSETS.map(enrichAssetWithTelemetry);
}


