# GeoMoney ETL loop (spec: Every dataset → Extract → Transform → Geocode → Visualize → Persist)

Minimum-first pipeline used by the shared energy globe components under
`src/app/components/energy/GlobeLayers/` + `src/components/EnergyInfrastructureGlobe.tsx`.

## Datasets

1. **Boundaries** — `node scripts/etl/download-natural-earth.js [--scale=50m] [--tolerance=0.04]`
   Natural Earth cultural admin-0 countries → `src/data/map/countries.geojson`.
   Douglas-Peucker simplification, rings closed, coords rounded to 4 decimals.
   License: **Public Domain** (Natural Earth via nvkelso/natural-earth-vector).

2. **Power plants** — `node scripts/etl/parse-gppd.js [--minMW=0]`
   WRI Global Power Plant Database v1.3.0 (aggregated CSV, ~35k plants) →
   `src/data/map/power-plants.geojson`. Properties: `id, name, fuel, fuelRaw,
   status, statusRaw, capacityMW, owner, country, year, source`.
   **WRI GPPD has no status column → all rows are `operating`.**
   License: **CC BY 4.0** (WRI; see registry in `src/config/energyLayers.ts`).

## Canonical vocabulary

Fuel (13): Coal, Gas, Oil, Nuclear, Hydro, Wind, Solar, Geothermal, Biomass,
Waste, Tidal, Hydrogen, Other. Status: operating, construction, announced,
pre-construction, mothballed, retired, cancelled. Raw→canonical tables live in
`src/config/energyLayers.ts`; the scripts carry a JS mirror — keep in sync.

## Keeping both `ets` (extract/transform/geocode) and **validate-coordinate** steps safe

`src/lib/globe/coordinates.ts` is the ONLY lat/lon→sphere helper; it ships with
reference numbers computed externally for NYC, London, Delhi, Tokyo, Sydney
(golden path before any backend work, per spec §17).

## Roadmap (spec §33 steps)

1. Boundaries ✔ (this script)
2. GEM ingest → `power_plants` (GEM>EIA>WRI dedup) — **manual URL required; GEM GPPD is behind
   a download form; pass `--url=…` or `--file=…` to the parser after approval.**
3. Filters (done API-side)
4. OSM power lines/substations (Overpass) → voltage-class line renderer
5. HIFLD (US) cross-check
6. DataCenterMap IX endpoints + PeeringDB
7. Detail panels/hover
8. Electricity Maps live carbon (server-side key)
9. Caching/tiles
10. 120fps perf pass

PostGIS/Neon replaces the in-memory filters in `src/lib/map/powerPlantsSource.ts`
later behind the same API contract.
