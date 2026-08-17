"use client";

// Generic camera-facing point cloud (vessels, events, grid-stress nodes).
// One THREE.Points per set = one draw call.
import { useMemo } from "react";
import * as THREE from "three";
import {
  GLOBE_POINT_ALTITUDE,
  GLOBE_RADIUS,
  latLngToVector3,
} from "@/lib/globe/coordinates";
import type { GlobePointSet } from "./types";

function PointSet({ set }: { set: GlobePointSet }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(set.points.length * 3);
    set.points.forEach((p, i) => {
      const v = latLngToVector3(p.lat, p.lng, GLOBE_RADIUS + GLOBE_POINT_ALTITUDE);
      positions[i * 3] = v.x;
      positions[i * 3 + 1] = v.y;
      positions[i * 3 + 2] = v.z;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [set.points]);

  if (set.points.length === 0) return null;
  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        color={set.color}
        size={set.size ?? 0.035}
        sizeAttenuation
        transparent
        opacity={set.opacity ?? 0.9}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

export default function PointsLayer({ sets = [] }: { sets?: GlobePointSet[] }) {
  return (
    <group>
      {sets.map((s) => (
        <PointSet key={s.id} set={s} />
      ))}
    </group>
  );
}
