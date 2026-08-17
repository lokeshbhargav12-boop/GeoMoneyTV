"use client";

// Route/flow arcs (great-circle, lifted) + corridor polylines (surface-hugging).
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  GLOBE_ARC_BASE_LIFT,
  GLOBE_ARC_LIFT_PER_RAD,
  GLOBE_RADIUS,
  latLngToVector3,
} from "@/lib/globe/coordinates";
import type { GlobeArc, GlobePolyline } from "./types";

const ARC_SEGMENTS = 48;

function Arc({ arc }: { arc: GlobeArc }) {
  // Build a THREE.Line imperatively (avoids `<line>` colliding with the SVG
  // intrinsic JSX type) and dispose on change/unmount.
  const lineObj = useMemo(() => {
    const [fLat, fLng] = arc.from;
    const [tLat, tLng] = arc.to;
    const a = latLngToVector3(fLat, fLng);
    const b = latLngToVector3(tLat, tLng);
    const angle = a.angleTo(b);
    const lift = GLOBE_ARC_BASE_LIFT + GLOBE_ARC_LIFT_PER_RAD * angle;
    const positions: number[] = [];
    for (let i = 0; i <= ARC_SEGMENTS; i++) {
      const t = i / ARC_SEGMENTS;
      const sinTotal = Math.sin(angle) || 1;
      const va = a.clone().multiplyScalar(Math.sin((1 - t) * angle) / sinTotal);
      const vb = b.clone().multiplyScalar(Math.sin(t * angle) / sinTotal);
      const v = va
        .add(vb)
        .normalize()
        .multiplyScalar(GLOBE_RADIUS + lift * Math.sin(Math.PI * t));
      positions.push(v.x, v.y, v.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const mat = arc.dashed
      ? new THREE.LineDashedMaterial({
          color: arc.color ?? "#f59e0b",
          dashSize: 0.08,
          gapSize: 0.05,
          transparent: true,
          opacity: arc.highlight ? 1 : 0.75,
          depthWrite: false,
          toneMapped: false,
        })
      : new THREE.LineBasicMaterial({
          color: arc.color ?? "#f59e0b",
          transparent: true,
          opacity: arc.highlight ? 1 : 0.65,
          depthWrite: false,
          toneMapped: false,
        });
    const l = new THREE.Line(geo, mat);
    if (arc.dashed) l.computeLineDistances();
    return l;
  }, [arc.from, arc.to, arc.color, arc.dashed, arc.highlight]);

  useEffect(() => {
    return () => {
      lineObj.geometry.dispose();
      (lineObj.material as THREE.Material).dispose();
    };
  }, [lineObj]);

  return <primitive object={lineObj} />;
}

function Polylines({ lines }: { lines: GlobePolyline[] }) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const c = new THREE.Color();
    const r = GLOBE_RADIUS + 0.008;
    for (const line of lines) {
      c.set(line.color);
      const dim = line.subdued ? 0.55 : 1;
      for (let i = 0; i < line.path.length - 1; i++) {
        const [lat1, lng1] = line.path[i];
        const [lat2, lng2] = line.path[i + 1];
        const a = latLngToVector3(lat1, lng1, r);
        const b = latLngToVector3(lat2, lng2, r);
        const angle = a.angleTo(b);
        const steps = Math.max(1, Math.ceil(((angle * 180) / Math.PI) / 2.5));
        let prev = a;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const sinTotal = Math.sin(angle) || 1;
          const va = a.clone().multiplyScalar(Math.sin((1 - t) * angle) / sinTotal);
          const vb = b.clone().multiplyScalar(Math.sin(t * angle) / sinTotal);
          const v = va.add(vb).normalize().multiplyScalar(r);
          positions.push(prev.x, prev.y, prev.z, v.x, v.y, v.z);
          colors.push(c.r * dim, c.g * dim, c.b * dim, c.r * dim, c.g * dim, c.b * dim);
          prev = v;
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [lines]);

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.8}
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
  );
}

export default function ArcsLayer({
  arcs = [],
  polylines = [],
}: {
  arcs?: GlobeArc[];
  polylines?: GlobePolyline[];
}) {
  return (
    <group>
      {arcs.map((a) => (
        <Arc key={a.id} arc={a} />
      ))}
      {polylines.length > 0 && <Polylines lines={polylines} />}
    </group>
  );
}
