import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Plane,
  Radio,
  Ship,
  Shield,
  Clock,
  ArrowUp,
  MessageSquare,
  Camera,
  Map,
  Globe2,
  Activity,
} from "lucide-react";
import type {
  GlobeEvent,
  AircraftData,
  ShipData,
} from "@/components/WorldGlobe";
import {
  getNearbyWebcams,
  getStreetViewDirectUrl,
  getStreetViewEmbedUrl,
} from "@/lib/world-monitor-geo";

type ReportKind = "event" | "aircraft" | "ship";

interface ReportSearchParams {
  kind?: string;
  id?: string;
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(path, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function getBaseUrl(): Promise<string> {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") || headerStore.get("host") || null;
  const protocol = headerStore.get("x-forwarded-proto") || "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

async function findEvent(
  id: string,
  baseUrl: string,
): Promise<GlobeEvent | null> {
  const [osintResponse, articleResponse] = await Promise.all([
    getJson<{ events: GlobeEvent[] }>(`${baseUrl}/api/world-monitor/osint`),
    getJson<{ events: GlobeEvent[] }>(`${baseUrl}/api/world-monitor/events`),
  ]);

  const events = [
    ...(osintResponse?.events || []),
    ...(articleResponse?.events || []),
  ];

  return events.find((event) => event.id === id) || null;
}

async function findAircraft(
  id: string,
  baseUrl: string,
): Promise<AircraftData | null> {
  const response = await getJson<{ aircraft: AircraftData[] }>(
    `${baseUrl}/api/world-monitor/aircraft`,
  );

  return response?.aircraft.find((aircraft) => aircraft.icao24 === id) || null;
}

async function findShip(id: string, baseUrl: string): Promise<ShipData | null> {
  const response = await getJson<{ ships: ShipData[] }>(
    `${baseUrl}/api/world-monitor/ships`,
  );

  return response?.ships.find((ship) => ship.mmsi === id) || null;
}

function threatClasses(score?: number) {
  if (!score) {
    return {
      text: "text-gray-400",
      bg: "bg-gray-500/10",
      border: "border-gray-500/20",
      bar: "bg-gray-500",
    };
  }

  if (score >= 70) {
    return {
      text: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      bar: "bg-gradient-to-r from-red-600 to-red-400",
    };
  }

  if (score >= 50) {
    return {
      text: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      bar: "bg-gradient-to-r from-orange-600 to-orange-400",
    };
  }

  return {
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    bar: "bg-gradient-to-r from-yellow-600 to-yellow-400",
  };
}

function sectionCard(children: React.ReactNode) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-xl">
      {children}
    </div>
  );
}

function infoTile(label: string, value: React.ReactNode) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-1 text-[10px] font-mono uppercase tracking-[0.18em] text-gray-500">
        {label}
      </div>
      <div className="text-sm text-white">{value}</div>
    </div>
  );
}

export default async function WorldMonitorReportPage({
  searchParams,
}: {
  searchParams: Promise<ReportSearchParams>;
}) {
  const resolved = await searchParams;
  const kind = (resolved.kind || "event") as ReportKind;
  const id = resolved.id || "";
  const baseUrl = await getBaseUrl();

  const [event, aircraft, ship] = await Promise.all([
    kind === "event" ? findEvent(id, baseUrl) : Promise.resolve(null),
    kind === "aircraft" ? findAircraft(id, baseUrl) : Promise.resolve(null),
    kind === "ship" ? findShip(id, baseUrl) : Promise.resolve(null),
  ]);

  const activeLat =
    event?.locations[0]?.lat ?? aircraft?.latitude ?? ship?.latitude ?? null;
  const activeLng =
    event?.locations[0]?.lng ?? aircraft?.longitude ?? ship?.longitude ?? null;
  const nearbyWebcams =
    activeLat !== null && activeLng !== null
      ? getNearbyWebcams(activeLat, activeLng)
      : [];
  const streetViewUrl =
    activeLat !== null && activeLng !== null
      ? getStreetViewDirectUrl(activeLat, activeLng)
      : null;
  const streetViewEmbed =
    activeLat !== null && activeLng !== null
      ? getStreetViewEmbedUrl(activeLat, activeLng)
      : null;

  if (!event && !aircraft && !ship) {
    return (
      <main className="min-h-screen bg-[#030812] px-6 pb-16 pt-[148px] text-white">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-black/40 p-10 text-center backdrop-blur-xl">
          <div className="mb-3 text-sm font-mono uppercase tracking-[0.3em] text-gray-500">
            Report Unavailable
          </div>
          <h1 className="mb-3 text-3xl font-semibold">
            This tracked item is no longer in the live feed.
          </h1>
          <p className="mb-6 text-sm text-gray-400">
            The report link points to live world-monitor data. If the item has
            dropped out of the current refresh window, it cannot be
            reconstructed from the current snapshot.
          </p>
          <Link
            href="/world-monitor"
            className="inline-flex items-center gap-2 rounded-full border border-geo-gold/30 bg-geo-gold/10 px-5 py-2 text-sm text-geo-gold transition hover:bg-geo-gold/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to World Monitor
          </Link>
        </div>
      </main>
    );
  }

  const eventThreat = threatClasses(event?.threatScore);

  return (
    <main className="min-h-screen bg-[#030812] px-6 pb-16 pt-[148px] text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/world-monitor"
              className="mb-3 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-geo-gold"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to World Monitor
            </Link>
            <div className="mb-2 text-[11px] font-mono uppercase tracking-[0.24em] text-geo-gold">
              {kind === "event"
                ? "Event Report"
                : kind === "aircraft"
                  ? "Aircraft Report"
                  : "Ship Report"}
            </div>
            <h1 className="max-w-4xl text-3xl font-semibold leading-tight">
              {event?.title ||
                aircraft?.callsign ||
                aircraft?.icao24 ||
                ship?.name}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {event?.source && (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-mono uppercase text-gray-300">
                {event.source}
              </span>
            )}
            {event?.threatScore && (
              <span
                className={`rounded-full border px-3 py-1 text-xs font-mono uppercase ${eventThreat.text} ${eventThreat.bg} ${eventThreat.border}`}
              >
                Threat {event.threatScore}
              </span>
            )}
            {aircraft?.category && (
              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-mono uppercase text-cyan-300">
                {aircraft.category}
              </span>
            )}
            {ship?.type && (
              <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-mono uppercase text-orange-300">
                {ship.type}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            {sectionCard(
              <>
                <div className="mb-4 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-gray-400">
                  <FileSectionIcon kind={kind} />
                  Core Report
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {event && (
                    <>
                      {infoTile("Region", event.region)}
                      {infoTile(
                        "Timestamp",
                        <span className="inline-flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          {new Date(event.timestamp).toLocaleString()}
                        </span>,
                      )}
                      {infoTile(
                        "Locations",
                        event.locations
                          .map((location) => location.name)
                          .join(", ") || "Global",
                      )}
                      {infoTile(
                        "Source Detail",
                        event.sourceDetail || event.source,
                      )}
                    </>
                  )}
                  {aircraft && (
                    <>
                      {infoTile("Origin", aircraft.origin_country)}
                      {infoTile(
                        "Altitude",
                        `${Math.round(aircraft.altitude).toLocaleString()} m`,
                      )}
                      {infoTile(
                        "Velocity",
                        `${Math.round(aircraft.velocity).toLocaleString()} m/s`,
                      )}
                      {infoTile("Heading", `${Math.round(aircraft.heading)}°`)}
                    </>
                  )}
                  {ship && (
                    <>
                      {infoTile("Flag", `${ship.flagEmoji} ${ship.flag}`)}
                      {infoTile("Destination", ship.destination)}
                      {infoTile("Speed", `${ship.speed.toFixed(1)} kn`)}
                      {infoTile("Length", `${ship.length} m`)}
                    </>
                  )}
                </div>

                {event?.description && (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-relaxed text-gray-300">
                    {event.description}
                  </div>
                )}

                {event?.engagement && (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {infoTile(
                      "Upvotes",
                      <span className="inline-flex items-center gap-2">
                        <ArrowUp className="h-4 w-4 text-orange-400" />
                        {event.engagement.upvotes.toLocaleString()}
                      </span>,
                    )}
                    {infoTile(
                      "Comments",
                      <span className="inline-flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-400" />
                        {event.engagement.comments.toLocaleString()}
                      </span>,
                    )}
                  </div>
                )}

                {event?.threatScore && (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="mb-2 text-[11px] font-mono uppercase tracking-[0.22em] text-gray-400">
                      Threat Assessment
                    </div>
                    <div className="mb-2 h-3 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full ${eventThreat.bar}`}
                        style={{ width: `${event.threatScore}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-500">
                      <span>Low</span>
                      <span>Moderate</span>
                      <span>Critical</span>
                    </div>
                  </div>
                )}
              </>,
            )}

            {streetViewEmbed &&
              sectionCard(
                <>
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-gray-400">
                      <Map className="h-4 w-4 text-cyan-400" />
                      Street View Recon
                    </div>
                    <a
                      href={streetViewUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300 transition hover:bg-cyan-500/20"
                    >
                      Open Full Maps
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    <iframe
                      src={streetViewEmbed}
                      title="Street View Recon"
                      className="h-[420px] w-full"
                      loading="lazy"
                      allowFullScreen
                    />
                  </div>
                </>,
              )}
          </div>

          <div className="space-y-6">
            {sectionCard(
              <>
                <div className="mb-4 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-gray-400">
                  <Camera className="h-4 w-4 text-emerald-400" />
                  Nearby Cameras
                </div>
                <div className="space-y-3">
                  {nearbyWebcams.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-gray-400">
                      No nearby live cameras are mapped for this location yet.
                    </div>
                  )}
                  {nearbyWebcams.map((camera) => (
                    <div
                      key={camera.id}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {camera.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {camera.country}
                          </div>
                        </div>
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono uppercase text-emerald-300">
                          {Math.round(camera.distanceKm)} km
                        </span>
                      </div>
                      <div className="mb-3 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                        <iframe
                          src={camera.embedUrl}
                          title={camera.title}
                          className="h-40 w-full"
                          allow="autoplay; encrypted-media; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {camera.lat.toFixed(3)}, {camera.lng.toFixed(3)}
                        </span>
                        <a
                          href={getStreetViewDirectUrl(camera.lat, camera.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-cyan-300 transition hover:text-cyan-200"
                        >
                          Street View
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </>,
            )}

            {sectionCard(
              <>
                <div className="mb-4 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-gray-400">
                  <Activity className="h-4 w-4 text-geo-gold" />
                  Action Center
                </div>
                <div className="space-y-3 text-sm text-gray-300">
                  {event?.link && (
                    <Link
                      href={event.link}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 transition hover:border-geo-gold/20 hover:bg-geo-gold/5"
                    >
                      <span>Open internal GeoMoney coverage</span>
                      <ExternalLink className="h-4 w-4 text-geo-gold" />
                    </Link>
                  )}
                  {event?.url && (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 transition hover:border-cyan-500/20 hover:bg-cyan-500/5"
                    >
                      <span>Open source link</span>
                      <ExternalLink className="h-4 w-4 text-cyan-300" />
                    </a>
                  )}
                  {streetViewUrl && (
                    <a
                      href={streetViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 transition hover:border-emerald-500/20 hover:bg-emerald-500/5"
                    >
                      <span>Inspect exact coordinates in Street View</span>
                      <ExternalLink className="h-4 w-4 text-emerald-300" />
                    </a>
                  )}
                </div>
              </>,
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function FileSectionIcon({ kind }: { kind: ReportKind }) {
  if (kind === "aircraft") {
    return <Plane className="h-4 w-4 text-cyan-400" />;
  }

  if (kind === "ship") {
    return <Ship className="h-4 w-4 text-orange-400" />;
  }

  return <Shield className="h-4 w-4 text-geo-gold" />;
}
