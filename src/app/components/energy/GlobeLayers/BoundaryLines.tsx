"use client";

// Country borders: Natural Earth polygons → one merged LineSegments geometry
// with great-circle subdivision so lines hug the sphere (spec §33 step 1).
import { useEffect, useState } from "react";
import * as THREE from "three";
import {
  GLOBE_BOUNDARY_ALTITUDE,
  GLOBE_RADIUS,
  latLngToVector3,
} from "@/lib/globe/coordinates";

type Ring = number[][];
type Poly = Ring[];
interface BoundaryFC {
  features: Array<{
    geometry: { type: "Polygon" | "MultiPolygon"; coordinates: Poly | Poly[] };
  }>;
}

const RADIUS = GLOBE_RADIUS + GLOBE_BOUNDARY_ALTITUDE;
const MAX_STEP_DEG = 2.5;

function buildGeometry(fc: BoundaryFC): THREE.BufferGeometry {
  const positions: number[] = [];
  const pushRing = (ring: Ring) => {
    for (let i = 0; i < ring.length - 1; i++) {
      const [lng1, lat1] = ring[i];
      const [lng2, lat2] = ring[i + 1];
      const a = latLngToVector3(lat1, lng1, RADIUS);
      const b = latLngToVector3(lat2, lng2, RADIUS);
      const angle = a.angleTo(b);
      const steps = Math.max(1, Math.ceil((angle * 180) / Math.PI / MAX_STEP_DEG));
      let prev = a;
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        // slerp between a and b
        const sinTotal = Math.sin(angle) || 1;
        const va = a.clone().multiplyScalar(Math.sin((1 - t) * angle) / sinTotal);
        const vb = b.clone().multiplyScalar(Math.sin(t * angle) / sinTotal);
        const v = va.add(vb).normalize().multiplyScalar(RADIUS);
        positions.push(prev.x, prev.y, prev.z, v.x, v.y, v.z);
        prev = v;
      }
    }
  };
  for (const f of fc.features) {
    if (f.geometry.type === "Polygon") {
      (f.geometry.coordinates as Poly).forEach(pushRing);
    } else if (f.geometry.type === "MultiPolygon") {
      (f.geometry.coordinates as Poly[]).forEach((poly) => poly.forEach(pushRing));
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geo;
}

export default function BoundaryLines() {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    let geo: THREE.BufferGeometry | null = null;
    fetch("/api/map/boundaries", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((fc: BoundaryFC) => {
        geo = buildGeometry(fc);
        setGeometry(geo);
      })
      .catch((e) => {
        if (e?.name !== "AbortError")
          console.error("[Globe] boundaries load failed:", e);
      });
    return () => {
      ctrl.abort();
      geo?.dispose();
    };
  }, []);

  if (!geometry) return null;
  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial
        color="#e2e8f0"
        transparent
        opacity={0.35}
        depthWrite={false}
      />
    </lineSegments>
  );
}
