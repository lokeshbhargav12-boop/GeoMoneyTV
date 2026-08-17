"use client";

// Route/flow arcs (great-circle, lifted) + corridor polylines (surface-hugging).
// Arcs are interactive: hover raises opacity + reports tooltip position, click
// bubbles to the page (route/flow selection).
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  GLOBE_ARC_BASE_LIFT,
  GLOBE_ARC_LIFT_PER_RAD,
  GLOBE_RADIUS,
  latLngToVector3,
} from "@/lib/globe/coordinates";
import type { GlobeArc, GlobePolyline } from "./types";

const ARC_SEGMENTS = 48;

interface ArcCallbacks {
  onArcHover?: (arc: GlobeArc | null, pos?: { x: number; y: number }) => void;
  onArcClick?: (arc: GlobeArc) => void;
}

function Arc({ arc, onArcHover, onArcClick }: { arc: GlobeArc } & ArcCallbacks) {
  const [hovered, setHovered] = useState(false);
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

  // Hover emphasis without rebuilding geometry/material
  useEffect(() => {
    const mat = lineObj.material as THREE.LineBasicMaterial;
    mat.opacity = arc.highlight || hovered ? 1 : arc.dashed ? 0.75 : 0.65;
  }, [hovered, arc.highlight, arc.dashed, lineObj]);

  return (
    <primitive
      object={lineObj}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!onArcClick) return;
        e.stopPropagation();
        onArcClick(arc);
      }}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (!hovered) {
          setHovered(true);
          document.documentElement.style.cursor = "pointer";
        }
        onArcHover?.(arc, { x: e.clientX, y: e.clientY });
      }}
      onPointerOut={() => {
        setHovered(false);
        document.documentElement.style.cursor = "";
        onArcHover?.(null);
      }}
    />
  );
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

// Gliding glow particles along every arc — makes flows feel alive.
function FlowParticles({ arcs }: { arcs: GlobeArc[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(
    () =>
      arcs.map((a) => {
        const a3 = latLngToVector3(a.from[0], a.from[1]);
        const b3 = latLngToVector3(a.to[0], a.to[1]);
        const angle = a3.angleTo(b3);
        const lift = GLOBE_ARC_BASE_LIFT + GLOBE_ARC_LIFT_PER_RAD * angle;
        const phase = (a.id.length * 0.137) % 1;
        return { a3, b3, angle, lift, phase, color: a.color ?? "#f59e0b" };
      }),
    [arcs],
  );

  const tmp = useMemo(
    () => ({
      mat: new THREE.Matrix4(),
      pos: new THREE.Vector3(),
      va: new THREE.Vector3(),
      vb: new THREE.Vector3(),
    }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.count = data.length;
    const c = new THREE.Color();
    data.forEach((d, i) => {
      c.set(d.color);
      mesh.setColorAt(i, c);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [data]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || data.length === 0) return;
    const t0 = clock.getElapsedTime();
    data.forEach((d, i) => {
      const t = (t0 * 0.18 + d.phase) % 1;
      const sinTotal = Math.sin(d.angle) || 1;
      tmp.pos
        .copy(d.a3)
        .multiplyScalar(Math.sin((1 - t) * d.angle) / sinTotal)
        .add(
          tmp.vb.copy(d.b3).multiplyScalar(Math.sin(t * d.angle) / sinTotal),
        )
        .normalize()
        .multiplyScalar(GLOBE_RADIUS + d.lift * Math.sin(Math.PI * t));
      tmp.mat.setPosition(tmp.pos.x, tmp.pos.y, tmp.pos.z);
      mesh.setMatrixAt(i, tmp.mat);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (data.length === 0) return null;
  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, Math.max(1, data.length)]}
      frustumCulled={false}
    >
      <sphereGeometry args={[0.02, 10, 10]} />
      <meshBasicMaterial
        transparent
        opacity={0.95}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

export default function ArcsLayer({
  arcs = [],
  polylines = [],
  onArcHover,
  onArcClick,
}: {
  arcs?: GlobeArc[];
  polylines?: GlobePolyline[];
} & ArcCallbacks) {
  return (
    <group>
      {arcs.map((a) => (
        <Arc key={a.id} arc={a} onArcHover={onArcHover} onArcClick={onArcClick} />
      ))}
      {polylines.length > 0 && <Polylines lines={polylines} />}
      {arcs.length > 0 && <FlowParticles arcs={arcs} />}
    </group>
  );
}
