import type {
    GlobeEvent,
    AircraftData,
    ShipData,
} from "@/components/WorldGlobe";

function buildReportHref(
    values: Record<string, string | number | undefined>,
): string {
    const params = new URLSearchParams();

    Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
            params.set(key, String(value));
        }
    });

    return `/world-monitor/report?${params.toString()}`;
}

export function buildEventReportHref(event: GlobeEvent): string {
    const primaryLocation = event.locations[0];

    return buildReportHref({
        kind: "event",
        id: event.id,
        title: event.title,
        category: event.category,
        region: event.region,
        lat: primaryLocation?.lat,
        lng: primaryLocation?.lng,
    });
}

export function buildAircraftReportHref(aircraft: AircraftData): string {
    return buildReportHref({
        kind: "aircraft",
        id: aircraft.icao24,
        title: aircraft.callsign || aircraft.icao24,
        category: aircraft.category,
        lat: aircraft.latitude,
        lng: aircraft.longitude,
    });
}

export function buildShipReportHref(ship: ShipData): string {
    return buildReportHref({
        kind: "ship",
        id: ship.mmsi,
        title: ship.name,
        category: ship.type,
        lat: ship.latitude,
        lng: ship.longitude,
    });
}