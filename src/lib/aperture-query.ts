import { getDistanceKm } from './world-monitor-geo';

export interface QueryRegion { name: string; latitude: number; longitude: number; radiusKm: number; terms: string[] }
const REGIONS: QueryRegion[] = [
  { name: 'Strait of Hormuz', latitude: 26.5, longitude: 56.2, radiusKm: 450, terms: ['hormuz', 'oman', 'persian gulf'] },
  { name: 'Strait of Malacca', latitude: 2.5, longitude: 101.5, radiusKm: 450, terms: ['malacca', 'singapore'] },
  { name: 'Suez Canal', latitude: 30.4, longitude: 32.3, radiusKm: 400, terms: ['suez'] },
  { name: 'Bab el-Mandeb', latitude: 12.5, longitude: 43.3, radiusKm: 400, terms: ['bab el-mandeb', 'bab al-mandab', 'red sea'] },
  { name: 'Panama Canal', latitude: 9, longitude: -79.6, radiusKm: 350, terms: ['panama'] },
  { name: 'Taiwan Strait', latitude: 24, longitude: 119.5, radiusKm: 500, terms: ['taiwan'] },
  { name: 'GIUK Gap', latitude: 63, longitude: -15, radiusKm: 600, terms: ['giuk'] },
  { name: 'Bosporus Strait', latitude: 41.1, longitude: 29, radiusKm: 300, terms: ['bosporus', 'bosphorus'] },
  { name: 'Middle East', latitude: 28, longitude: 46, radiusKm: 2200, terms: ['middle east', 'iran', 'gulf'] },
];

export function resolveQueryRegion(query: string): QueryRegion | null {
  const normalized = query.toLowerCase();
  return REGIONS.find((region) => region.terms.some((term) => normalized.includes(term))) || null;
}

interface Positioned { latitude: number; longitude: number }
interface QueryEvent { title: string; description?: string; locations: Array<{ lat: number; lng: number; name: string }> }

/** Select from the complete provider snapshot BEFORE sampling, preserving regional totals. */
export function selectQueryEvidence<E extends QueryEvent, A extends Positioned, S extends Positioned>(
  query: string, events: E[], aircraft: A[], ships: S[],
) {
  const region = resolveQueryRegion(query);
  const inside = (asset: Positioned) => !region || getDistanceKm(region.latitude, region.longitude, asset.latitude, asset.longitude) <= region.radiusKm;
  return {
    region,
    events: region ? events.filter((event) =>
      event.locations.some((location) => inside({ latitude: location.lat, longitude: location.lng }))
      || region.terms.some((term) => `${event.title} ${event.description || ''}`.toLowerCase().includes(term)),
    ) : events,
    aircraft: aircraft.filter(inside),
    ships: ships.filter(inside),
  };
}

export function isSlowOrStopped(ship: { speed: number; status?: string }): boolean {
  return (Number.isFinite(ship.speed) && ship.speed <= 1) || ['anchored', 'moored', 'stopped'].includes(ship.status || '');
}