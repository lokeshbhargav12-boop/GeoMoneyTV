#!/usr/bin/env node
/**
 * ET: parse WRI Global Power Plant Database → filtered GeoJSON.
 * output: src/data/map/power-plants.geojson
 * NOTE: WRI GPPD has no status column → all rows "operating".
 * Run: node scripts/etl/parse-gppd.js [--minMW=0]
 */
const fs = require("fs");
const path = require("path");

const FALLBACK_URLS = [
  "https://wri-public-data.s3.amazonaws.com/WRI_GPPD/WRI_GPPD.csv",
  "https://raw.githubusercontent.com/wri/global-power-plant-database/master/output_database/global_power_plant_database.csv",
];
const VERSION_URL =
  "https://raw.githubusercontent.com/wri/global-power-plant-database/master/output_database/DATABASE_VERSION";
const OUT_DIR = path.join(__dirname, "..", "..", "src", "data", "map");
const OUT_FILE = path.join(OUT_DIR, "power-plants.geojson");
const MIN_MW = parseFloat(
  (process.argv.find((a) => a.startsWith("--minMW=")) || "").split("=")[1] || "0",
);

// Mirror of src/config/energyLayers.ts
const FUEL_RAW_MAP = {
  coal: "Coal", petcoke: "Oil", gas: "Gas", oil: "Oil", nuclear: "Nuclear",
  hydro: "Hydro", wind: "Wind", solar: "Solar", biomass: "Biomass",
  waste: "Waste", geothermal: "Geothermal", cogeneration: "Biomass",
  "wave and tidal": "Tidal", "wave tidal": "Tidal", tidal: "Tidal",
  storage: "Other", other: "Other", "": "Other",
};
const canonicalFuel = (raw) =>
  FUEL_RAW_MAP[(raw || "").toLowerCase().trim()] || "Other";

// CSV row iterator (quote-aware; yields field values, null = row end)
function* csvFields(text) {
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else { field += c; }
    } else if (c === '"') { inQuotes = true; }
    else if (c === ",") { yield field; field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      yield field; field = "";
      yield null;
    } else { field += c; }
  }
  if (field) yield field;
}

async function fetchFirstOk(urls) {
  let lastErr = null;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      lastErr = `HTTP ${res.status}`;
    } catch (e) { lastErr = e.message; }
  }
  throw new Error(`All GPPD URLs failed: ${lastErr}`);
}

async function fetchVersionNote() {
  try {
    const res = await fetch(VERSION_URL);
    return res.ok ? (await res.text()).trim() : "version-unavailable";
  } catch { return "version-unavailable"; }
}

async function main() {
  const versionNote = await fetchVersionNote();
  console.log(`[ETL gppd] WRI version note: ${versionNote}`);
  const res = await fetchFirstOk(FALLBACK_URLS);
  const text = await res.text();

  // NOTE: a `break` inside for..of CLOSES the generator — so the header and
  // body are consumed in ONE pass, with the first row acting as the header.
  const gen = csvFields(text);
  const need = [
    "country", "country_long", "name", "gppd_idnr", "capacity_mw",
    "latitude", "longitude", "primary_fuel", "owner", "source", "commissioning_year",
  ];
  let idx = null;
  const features = [];
  const fuelCounts = {};
  const idCounts = {};
  let total = 0;
  let skipped = 0;
  let row = [];

  for (const f of gen) {
    if (f === null) {
      if (idx === null) {
        idx = {};
        for (const n of need) {
          idx[n] = row.indexOf(n);
          if (idx[n] < 0) throw new Error(`Missing column ${n} in GPPD CSV header`);
        }
        console.log(`[ETL gppd] header ok → ${row.length} columns`);
      } else {
        processRow(row);
      }
      row = [];
    } else {
      row.push(f);
    }
  }

  function processRow(fields) {
    if (fields.length < 12) { skipped++; return; }
    total++;
    const lat = parseFloat(fields[idx.latitude]);
    let lng = parseFloat(fields[idx.longitude]);
    if (Number.isNaN(lat) || Number.isNaN(lng) || Math.abs(lat) > 90) { skipped++; return; }
    // normalize out-of-range longitudes (e.g. 183 → -177)
    if (Math.abs(lng) > 180) lng = ((((lng + 180) % 360) + 360) % 360) - 180;
    const mwRaw = parseFloat(fields[idx.capacity_mw]);
    const cap = Number.isNaN(mwRaw) ? null : mwRaw;
    if (MIN_MW > 0 && (cap === null || cap < MIN_MW)) { skipped++; return; }

    const fuelRaw = fields[idx.primary_fuel] || "";
    const fuel = canonicalFuel(fuelRaw);
    fuelCounts[fuel] = (fuelCounts[fuel] || 0) + 1;
    const idRaw = fields[idx.gppd_idnr] || "";
    let id = idRaw || `row-${total}`;
    if (idCounts[id]) id = `${id}#${idCounts[id]}`;
    idCounts[id] = (idCounts[id] || 0) + 1;

    features.push({
      type: "Feature",
      properties: {
        id,
        name: fields[idx.name] || "Unknown plant",
        fuel,
        fuelRaw,
        status: "operating",
        statusRaw: "operating",
        capacityMW: cap,
        owner: fields[idx.owner] || null,
        country: fields[idx.country_long] || fields[idx.country] || "",
        year: fields[idx.commissioning_year] ? Number(fields[idx.commissioning_year]) : null,
        source: "WRI GPPD",
      },
      geometry: {
        type: "Point",
        coordinates: [Number(lng.toFixed(5)), Number(lat.toFixed(5))],
      },
    });
  }

  const fc = {
    type: "FeatureCollection",
    name: "power-plants-wri-gppd",
    metadata: {
      source: "WRI Global Power Plant Database v1.3.0",
      license: "CC BY 4.0",
      url: "http://datasets.wri.org/dataset/globalpowerplantdatabase",
      note: "WRI GPPD has no status column — all rows operating; GEM dedup (GEM>EIA>WRI) arrives with the GEM ingest.",
      generatedAt: new Date().toISOString(),
      total,
      kept: features.length,
      skipped,
      fuelCounts,
    },
    features,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(fc));
  const kb = (fs.statSync(OUT_FILE).size / 1024).toFixed(0);
  console.log(`[ETL gppd] total=${total} kept=${features.length} skipped=${skipped}`);
  console.log(`[ETL gppd] fuel counts: ${JSON.stringify(fuelCounts)}`);
  console.log(`[ETL gppd] → ${path.relative(process.cwd(), OUT_FILE)} (${kb} KB)`);
}

main().catch((e) => {
  console.error("[ETL gppd] FAILED:", e.message);
  process.exit(1);
});
