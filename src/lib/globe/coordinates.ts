// ─── Single lat/lon→sphere helper for every globe layer (spec §17) ──────────
// Convention: right-handed, y-up.
//   phi   = (90 − lat)·π/180   (polar angle from +Y)
//   theta = (lng + 180)·π/180  (phase constant chosen so +X ≈ Greenwich,
//                               +Z ≈ lon −90 → Americas face the default camera)
//   x = −r·sinφ·cosθ   y = r·cosφ   z = r·sinφ·sinθ
// Every layer (sphere texture, borders, markers, arcs) MUST use this module.
import * as THREE from "three";
import {
  GLOBE_ARC_BASE_LIFT,
  GLOBE_ARC_LIFT_PER_RAD,
  GLOBE_BOUNDARY_ALTITUDE,
  GLOBE_POINT_ALTITUDE,
  GLOBE_RADIUS,
} from "@/config/energyLayers";

export {
  GLOBE_ARC_BASE_LIFT,
  GLOBE_ARC_LIFT_PER_RAD,
  GLOBE_BOUNDARY_ALTITUDE,
  GLOBE_POINT_ALTITUDE,
  GLOBE_RADIUS,
};

export function latLngToVector3(
  lat: number,
  lng: number,
  radius: number = GLOBE_RADIUS,
): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export function latLngToTuple(
  lat: number,
  lng: number,
  radius: number = GLOBE_RADIUS,
): [number, number, number] {
  const v = latLngToVector3(lat, lng, radius);
  return [v.x, v.y, v.z];
}

// ── Spec §17 golden-path reference cities ───────────────────────────────────
// Expected vectors computed externally at radius 2 with the formula above.
export const COORD_TEST_CITIES: Array<{
  name: string;
  lat: number;
  lng: number;
  expected: [number, number, number];
}> = [
  { name: "New York", lat: 40.7128, lng: -74.006, expected: [0.4177, 1.3045, 1.4573] },
  { name: "London", lat: 51.5074, lng: -0.1278, expected: [1.2448, 1.5654, 0.0028] },
  { name: "Delhi", lat: 28.6138, lng: 77.2086, expected: [0.3887, 0.9578, -1.7122] },
  { name: "Tokyo", lat: 35.6895, lng: 139.6913, expected: [-1.2387, 1.1668, -1.0508] },
  { name: "Sydney", lat: -33.8688, lng: 151.2093, expected: [-1.4554, -1.1146, -0.7998] },
];

export function verifyCoordinateMath(): boolean {
  let ok = true;
  for (const c of COORD_TEST_CITIES) {
    const v = latLngToVector3(c.lat, c.lng, GLOBE_RADIUS);
    const err = Math.max(
      Math.abs(v.x - c.expected[0]),
      Math.abs(v.y - c.expected[1]),
      Math.abs(v.z - c.expected[2]),
    );
    if (err > 5e-4) {
      ok = false;
      console.error(
        `[coords] ${c.name}: got (${v.x.toFixed(4)}, ${v.y.toFixed(4)}, ${v.z.toFixed(4)}), expected (${c.expected.join(", ")})`,
      );
    }
  }
  if (ok) console.info("[coords] 5-city reference check passed (spec §17)");
  return ok;
}

// Great-circle interpolation between two surface points, lifted by `lift`
// at the midpoint (arcs). t ∈ [0,1].
export function arcPoint(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  t: number,
  lift: number,
  radius: number = GLOBE_RADIUS,
): THREE.Vector3 {
  const a = latLngToVector3(fromLat, fromLng, radius).normalize();
  const b = latLngToVector3(toLat, toLng, radius).normalize();
  const angle = a.angleTo(b);
  if (angle < 1e-6) return a.multiplyScalar(radius);
  const sinTotal = Math.sin(angle);
  const va = a.multiplyScalar(Math.sin((1 - t) * angle) / sinTotal);
  const vb = b.multiplyScalar(Math.sin(t * angle) / sinTotal);
  const v = va.add(vb).normalize();
  const h = radius + lift * Math.sin(Math.PI * t);
  return v.multiplyScalar(h);
}
