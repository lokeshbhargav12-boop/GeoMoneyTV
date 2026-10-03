import { NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";
import {
  cleanText,
  newestTimestamp,
  normalizeSourceStatus,
  parseBounds,
  pointIsInBounds,
} from "@/lib/aperture-analysis";

const MAX_ASSET_SAMPLE = 100;

function sanitizeShip(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const ship = value as Record<string, unknown>;
  const latitude = Number(ship.latitude);
  const longitude = Number(ship.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    mmsi: cleanText(ship.mmsi, 20),
    name: cleanText(ship.name, 100) || "Unknown vessel",
    type: cleanText(ship.type, 40).toLowerCase() || "unknown",
    latitude,
    longitude,
    speed: Number.isFinite(Number(ship.speed)) ? Number(ship.speed) : null,
    heading: Number.isFinite(Number(ship.heading)) ? Number(ship.heading) : null,
    destination: cleanText(ship.destination, 100),
    status: cleanText(ship.status, 40),
    source: cleanText(ship.source, 120),
    lastUpdate: newestTimestamp([ship.lastUpdate]),
    live: ship.live === true,
  };
}

function sanitizeAircraft(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const aircraft = value as Record<string, unknown>;
  const latitude = Number(aircraft.latitude);
  const longitude = Number(aircraft.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    icao24: cleanText(aircraft.icao24, 20),
    callsign: cleanText(aircraft.callsign, 30),
    originCountry: cleanText(aircraft.origin_country, 100),
    category: cleanText(aircraft.category, 40),
    latitude,
    longitude,
    altitude: Number.isFinite(Number(aircraft.altitude)) ? Number(aircraft.altitude) : null,
    velocity: Number.isFinite(Number(aircraft.velocity)) ? Number(aircraft.velocity) : null,
    heading: Number.isFinite(Number(aircraft.heading)) ? Number(aircraft.heading) : null,
    lastContact: newestTimestamp([aircraft.lastContact, aircraft.last_contact]),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "A JSON request body is required." }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const bounds = parseBounds(payload.bounds);
    if (!bounds) {
      return NextResponse.json({ error: "A valid, non-wrapping bounding box is required." }, { status: 400 });
    }

    const sourceStatusValue = payload.sourceStatus && typeof payload.sourceStatus === "object"
      ? payload.sourceStatus as Record<string, unknown>
      : {};
    const vesselStatus = normalizeSourceStatus(sourceStatusValue.vessels, "AIS provider");
    const aircraftStatus = normalizeSourceStatus(sourceStatusValue.aircraft, "OpenSky Network");

    const rawShips = Array.isArray(payload.ships) ? payload.ships : [];
    const rawAircraft = Array.isArray(payload.aircraft) ? payload.aircraft : [];
    const ships = rawShips
      .slice(0, MAX_ASSET_SAMPLE)
      .map(sanitizeShip)
      .filter((ship): ship is NonNullable<ReturnType<typeof sanitizeShip>> => Boolean(ship))
      .filter((ship) => pointIsInBounds(ship.latitude, ship.longitude, bounds))
      .filter((ship) => ship.live);
    const aircraft = rawAircraft
      .slice(0, MAX_ASSET_SAMPLE)
      .map(sanitizeAircraft)
      .filter((asset): asset is NonNullable<ReturnType<typeof sanitizeAircraft>> => Boolean(asset))
      .filter((asset) => pointIsInBounds(asset.latitude, asset.longitude, bounds));

    const suppliedTotals = payload.totals && typeof payload.totals === "object"
      ? payload.totals as Record<string, unknown>
      : {};
    const vesselTotal = Math.max(
      ships.length,
      Math.min(100_000, Number(suppliedTotals.vessels) || ships.length),
    );
    const aircraftTotal = Math.max(
      aircraft.length,
      Math.min(100_000, Number(suppliedTotals.aircraft) || aircraft.length),
    );
    const layers = Array.isArray(payload.layers)
      ? payload.layers.map((layer) => cleanText(layer, 50)).filter(Boolean).slice(0, 10)
      : [];

    const shipTypeBreakdown = ships.reduce<Record<string, number>>((counts, ship) => {
      counts[ship.type] = (counts[ship.type] || 0) + 1;
      return counts;
    }, {});
    const energyShipCount = ships.filter((ship) => ship.type === "tanker" || ship.type === "lng").length;
    const dataAsOf = newestTimestamp([
      vesselStatus.observedAt,
      aircraftStatus.observedAt,
      ...ships.map((ship) => ship.lastUpdate),
      ...aircraft.map((asset) => asset.lastContact),
    ]);

    const prompt = `You are GeoMoney Aperture's strategic intelligence analyst.
Analyze only the supplied, sourced observations for this exact map selection.

BOUNDING BOX:
${JSON.stringify(bounds)}

ACTIVE MAP LAYERS: ${layers.join(", ") || "none specified"}
DATA SOURCES AND FRESHNESS:
${JSON.stringify({ vessels: vesselStatus, aircraft: aircraftStatus, dataAsOf }, null, 2)}

OBSERVATION TOTALS WITHIN THE BOX:
- Live or stale real AIS vessels: ${vesselTotal}
- OpenSky aircraft: ${aircraftTotal}
- Vessel sample size: ${ships.length}; aircraft sample size: ${aircraft.length}
- Sample vessel mix: ${JSON.stringify(shipTypeBreakdown)}
- Energy-linked vessels in sample: ${energyShipCount}

SAMPLED VESSELS:
${JSON.stringify(ships, null, 2)}

SAMPLED AIRCRAFT:
${JSON.stringify(aircraft, null, 2)}

Write a concise 2-3 paragraph situational summary. Distinguish observed facts from geographic context or inference. Never invent an asset, identity, intent, weather condition, military posture, disruption, or trend. A zero count means no asset was observed in current provider coverage; it does not prove the area is clear. If a source is stale or unavailable, state that limitation. Do not claim that an aircraft is military solely from a callsign classification. Mention energy or supply-chain concentration only when the observations support it.`;

    const result = await callOpenRouter(prompt, {
      temperature: 0.2,
      maxTokens: 900,
      caller: "aperture-region-analysis",
    });

    return NextResponse.json({
      summary: result.content.trim(),
      model: result.model,
      generatedAt: new Date().toISOString(),
      dataAsOf,
      sources: { vessels: vesselStatus, aircraft: aircraftStatus },
      evidence: {
        vessels: vesselTotal,
        aircraft: aircraftTotal,
        sampledVessels: ships.length,
        sampledAircraft: aircraft.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown analyzer error";
    console.error("BBox Analysis error:", message);
    return NextResponse.json(
      { error: "The region analyzer is temporarily unavailable. No analysis was generated." },
      { status: 503 },
    );
  }
}