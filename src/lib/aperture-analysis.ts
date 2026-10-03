export type ApertureDataMode = "live" | "stale" | "unavailable";

export interface ApertureSourceStatus {
  mode: ApertureDataMode;
  source: string;
  observedAt: string | null;
  notice?: string;
}

export interface ApertureEvidenceEvent {
  id: string;
  title: string;
  description: string;
  source: string;
  sourceDetail: string;
  timestamp: string;
  region: string;
  category: string;
  url: string;
  threatScore: number | null;
}

export interface ApertureBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

const MAX_TEXT_LENGTH = 600;
const VALID_MODES = new Set<ApertureDataMode>([
  "live",
  "stale",
  "unavailable",
]);

export function cleanText(value: unknown, maxLength = MAX_TEXT_LENGTH): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function toIsoTimestamp(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

export function normalizeSourceStatus(
  value: unknown,
  fallbackSource: string,
): ApertureSourceStatus {
  const candidate = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const requestedMode = cleanText(candidate.mode, 20) as ApertureDataMode;

  return {
    mode: VALID_MODES.has(requestedMode) ? requestedMode : "unavailable",
    source: cleanText(candidate.source, 120) || fallbackSource,
    observedAt: toIsoTimestamp(candidate.observedAt),
    notice: cleanText(candidate.notice, 300) || undefined,
  };
}

export function normalizeEvidenceEvents(value: unknown): ApertureEvidenceEvent[] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 25).flatMap((entry, index) => {
    if (typeof entry === "string") {
      const title = cleanText(entry, 300);
      return title
        ? [{
            id: `legacy-${index}`,
            title,
            description: "",
            source: "unspecified",
            sourceDetail: "",
            timestamp: "",
            region: "Global",
            category: "unknown",
            url: "",
            threatScore: null,
          }]
        : [];
    }

    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as Record<string, unknown>;
    const title = cleanText(candidate.title, 300);
    if (!title) return [];

    const rawThreatScore = Number(candidate.threatScore);
    const threatScore = Number.isFinite(rawThreatScore)
      ? Math.max(0, Math.min(100, rawThreatScore))
      : null;

    return [{
      id: cleanText(candidate.id, 120) || `event-${index}`,
      title,
      description: cleanText(candidate.description, 500),
      source: cleanText(candidate.source, 100) || "unspecified",
      sourceDetail: cleanText(candidate.sourceDetail, 150),
      timestamp: toIsoTimestamp(candidate.timestamp) || "",
      region: cleanText(candidate.region, 100) || "Global",
      category: cleanText(candidate.category, 80) || "unknown",
      url: normalizeHttpUrl(candidate.url ?? candidate.link),
      threatScore,
    }];
  });
}

export function normalizeHttpUrl(value: unknown): string {
  const text = cleanText(value, 500);
  if (!text) return "";

  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return text.startsWith("/") ? text : "";
  }
}

export function parseBounds(value: unknown): ApertureBounds | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const bounds = {
    north: Number(candidate.north),
    south: Number(candidate.south),
    east: Number(candidate.east),
    west: Number(candidate.west),
  };

  if (!Object.values(bounds).every(Number.isFinite)) return null;
  if (bounds.north <= bounds.south) return null;
  if (bounds.north > 90 || bounds.south < -90) return null;
  if (bounds.east > 180 || bounds.east < -180 || bounds.west > 180 || bounds.west < -180) {
    return null;
  }
  if (bounds.east <= bounds.west) return null;
  return bounds;
}

export function pointIsInBounds(
  latitude: unknown,
  longitude: unknown,
  bounds: ApertureBounds,
): boolean {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat)
    && Number.isFinite(lng)
    && lat >= bounds.south
    && lat <= bounds.north
    && lng >= bounds.west
    && lng <= bounds.east;
}

export function newestTimestamp(values: Array<unknown>): string | null {
  const newest = values.reduce<number>((current, value) => {
    const iso = toIsoTimestamp(value);
    return iso ? Math.max(current, new Date(iso).getTime()) : current;
  }, 0);
  return newest > 0 ? new Date(newest).toISOString() : null;
}
