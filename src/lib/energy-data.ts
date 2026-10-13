export type EnergyDataStatus = "delayed" | "stale" | "reference" | "estimated" | "simulated" | "unavailable";

export function finiteEnergyValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function quoteStatus(observedAt: string | null, now = Date.now()): EnergyDataStatus {
  const time = observedAt ? Date.parse(observedAt) : NaN;
  if (!Number.isFinite(time) || time > now + 60_000) return "unavailable";
  return now - time > 72 * 3600_000 ? "stale" : "delayed";
}

// Use the request origin for local API composition; no fixed development port.
export function energyApiUrl(path: string, origin?: string): string {
  const base = origin || process.env.INTERNAL_APP_URL || `http://127.0.0.1:${process.env.PORT || "3000"}`;
  return new URL(path, base).toString();
}