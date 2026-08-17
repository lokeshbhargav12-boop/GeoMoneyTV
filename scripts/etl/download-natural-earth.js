#!/usr/bin/env node
/**
 * ET: download Natural Earth admin-0 country boundaries → simplified GeoJSON.
 *
 * E extract : fetch nvkelso/natural-earth-vector geojson (50m default, 110m fallback)
 * T transform: keep {name, adm0_a3, iso_a2, continent} + Douglas-Peucker simplify
 *              + close rings + round coordinates to 4 decimals
 * output    : src/data/map/countries.geojson
 *
 * Run: node scripts/etl/download-natural-earth.js [--scale=110m|50m] [--tolerance=0.04]
 */
const fs = require("fs");
const path = require("path");

const SCALE = (process.argv.find((a) => a.startsWith("--scale=")) || "")
  .split("=")[1] || "50m";
const TOLERANCE = parseFloat(
  (process.argv.find((a) => a.startsWith("--tolerance=")) || "")
    .split("=")[1] || "0.04",
);
const SRC_URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_${SCALE}_admin_0_countries.geojson`;
const OUT_DIR = path.join(__dirname, "..", "..", "src", "data", "map");
const OUT_FILE = path.join(OUT_DIR, "countries.geojson");

// ─── Douglas–Peucker line simplification ────────────────────────
function perpendicularDistance(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq;
  const proj = [a[0] + t * dx, a[1] + t * dy];
  return Math.hypot(p[0] - proj[0], p[1] - proj[1]);
}

function douglasPeucker(points, tolerance) {
  if (points.length <= 2) return points;
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxDist = 0;
    let index = first;
    for (let i = first + 1; i < last; i++) {
      const dist = perpendicularDistance(points[i], points[first], points[last]);
      if (dist > maxDist) {
        index = i;
        maxDist = dist;
      }
    }
    if (maxDist > tolerance) {
      keep[index] = true;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function roundCoord(c) {
  return [Number(c[0].toFixed(4)), Number(c[1].toFixed(4))];
}

function closeRing(ring) {
  if (!ring.length) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([first[0], first[1]]);
  return ring;
}

function simplifyRing(ring) {
  // DP then re-close (simplification treats ring as an open line)
  const simplified = douglasPeucker(ring, TOLERANCE);
  const closed = closeRing(simplified.map(roundCoord));
  return closed.length >= 4 ? closed : null;
}

function simplifyGeometry(geometry) {
  if (geometry.type === "Polygon") {
    const rings = geometry.coordinates.map(simplifyRing).filter(Boolean);
    if (!rings.length) return null;
    return { type: "Polygon", coordinates: rings };
  }
  if (geometry.type === "MultiPolygon") {
    const polys = geometry.coordinates
      .map((poly) => poly.map(simplifyRing).filter(Boolean))
      .filter((poly) => poly.length);
    if (!polys.length) return null;
    return { type: "MultiPolygon", coordinates: polys };
  }
  return null;
}

async function main() {
  console.log(`[ETL natural-earth] fetch ${SRC_URL}`);
  const res = await fetch(SRC_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${SRC_URL}`);
  const json = await res.json();
  console.log(`[ETL natural-earth] ${json.features.length} raw countries fetched`);

  const outFeatures = [];
  let dropped = 0;
  for (const f of json.features) {
    const geometry = simplifyGeometry(f.geometry);
    if (!geometry) {
      dropped++;
      continue;
    }
    outFeatures.push({
      type: "Feature",
      properties: {
        name: f.properties.NAME ?? f.properties.name ?? "Unknown",
        adm0_a3: f.properties.ADM0_A3 ?? f.properties.adm0_a3 ?? "",
        iso_a2: f.properties.ISO_A2 ?? f.properties.iso_a2 ?? "",
        continent: f.properties.CONTINENT ?? f.properties.continent ?? "",
      },
      geometry,
    });
  }

  const fc = {
    type: "FeatureCollection",
    name: `countries-ne-${SCALE}`,
    metadata: {
      source: "Natural Earth via nvkelso/natural-earth-vector",
      license: "Public Domain",
      scale: SCALE,
      simplifyToleranceDeg: TOLERANCE,
      generatedAt: new Date().toISOString(),
      count: outFeatures.length,
    },
    features: outFeatures,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(fc));
  const kb = (fs.statSync(OUT_FILE).size / 1024).toFixed(0);
  console.log(
    `[ETL natural-earth] wrote ${outFeatures.length} countries (${dropped} dropped) → ${path.relative(process.cwd(), OUT_FILE)} (${kb} KB)`,
  );
}

main().catch((e) => {
  console.error("[ETL natural-earth] FAILED:", e.message);
  process.exit(1);
});
