"use client";

// Generic camera-facing point cloud (vessels, events, grid-stress nodes).
// One THREE.Points per set = one draw call. Points are interactive: hover
// resolves the hit index → tooltip, click bubbles to the page.
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  GLOBE_POINT_ALTITUDE,
  GLOBE_RADIUS,
  latLngToVector3,
} from "@/lib/globe/coordinates";
import type { GlobePoint, GlobePointSet } from "./types";

export interface PointSetCallbacks {
  onPointHover?: (
    point: GlobePoint | null,
    set?: GlobePointSet,
    pos?: { x: number; y: number },
  ) => void;
  onPointClick?: (point: GlobePoint, set: GlobePointSet) => void;
}

function PointSet({
  set,
  onPointHover,
  onPointClick,
}: { set: GlobePointSet } & PointSetCallbacks) {
  const pulseMatRef = useRef<THREE.PointsMaterial>(null);

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

  useFrame(({ clock }) => {
    const mat = pulseMatRef.current;
    if (!mat) return;
    const t = clock.getElapsedTime();
    const wave = 0.5 + 0.5 * Math.sin(t * 2.2);
    mat.opacity = 0.08 + 0.45 * wave;
    mat.size = (set.size ?? 0.035) * (1.5 + 0.7 * wave);
  });

  if (set.points.length === 0) return null;

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const i = e.index ?? null;
    const point = i != null ? (set.points[i] ?? null) : null;
    document.documentElement.style.cursor = point ? "pointer" : "";
    onPointHover?.(point, set, { x: e.clientX, y: e.clientY });
  };
  const handleOut = () => {
    document.documentElement.style.cursor = "";
    onPointHover?.(null);
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    const i = e.index ?? null;
    const point = i != null ? set.points[i] : null;
    if (!point || !onPointClick) return;
    e.stopPropagation();
    onPointClick(point, set);
  };

  return (
    <group>
      <points
        geometry={geometry}
        frustumCulled={false}
        onPointerMove={handleMove}
        onPointerOut={handleOut}
        onClick={handleClick}
      >
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
      {set.pulse && (
        <points geometry={geometry} frustumCulled={false}>
          <pointsMaterial
            ref={pulseMatRef}
            color={set.color}
            size={(set.size ?? 0.035) * 1.6}
            sizeAttenuation
            transparent
            opacity={0.2}
            depthWrite={false}
            toneMapped={false}
          />
        </points>
      )}
    </group>
  );
}

export default function PointsLayer({
  sets = [],
  onPointHover,
  onPointClick,
}: { sets?: GlobePointSet[] } & PointSetCallbacks) {
  return (
    <group>
      {sets.map((s) => (
        <PointSet
          key={s.id}
          set={s}
          onPointHover={onPointHover}
          onPointClick={onPointClick}
        />
      ))}
    </group>
  );
}
