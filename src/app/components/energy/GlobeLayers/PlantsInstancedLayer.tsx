"use client";

// Power plants: ONE THREE.InstancedMesh (never one Mesh per plant — spec §35),
// per-instance fuel color + logarithmic size, camera-distance LOD (spec §33/2).
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  FUEL_COLORS,
  LOD,
  MAP_API,
  plantRadiusMW,
  type FuelType,
} from "@/config/energyLayers";
import {
  GLOBE_POINT_ALTITUDE,
  GLOBE_RADIUS,
  latLngToVector3,
} from "@/lib/globe/coordinates";
import type { PlantClickInfo, PlantLayerQuery } from "./types";

const CAPACITY = MAP_API.plantsMaxLimit;

interface PlantFeature {
  properties: PlantClickInfo;
  geometry: { coordinates: [number, number] };
}

interface Props {
  query: PlantLayerQuery;
  onPlantClick?: (p: PlantClickInfo) => void;
  sizeScale?: number;
}

export default function PlantsInstancedLayer({ query, onPlantClick, sizeScale = 1 }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const plantsRef = useRef<PlantClickInfo[]>([]);
  const [features, setFeatures] = useState<PlantFeature[]>([]);
  const [lodGlobal, setLodGlobal] = useState(true);
  const queryKey = JSON.stringify(query ?? {});

  // Fetch on query change (abortable)
  useEffect(() => {
    const q: PlantLayerQuery = query ?? {};
    const params = new URLSearchParams();
    if (q.fuels?.length) params.set("fuels", q.fuels.join(","));
    if (q.statuses?.length) params.set("status", q.statuses.join(","));
    if (q.minMW != null) params.set("minMW", String(q.minMW));
    if (q.bbox) params.set("bbox", q.bbox.join(","));
    if (q.limit != null) params.set("limit", String(q.limit));
    const ctrl = new AbortController();
    fetch(`/api/map/power-plants?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((fc) => setFeatures(fc.features ?? []))
      .catch((e) => {
        if (e?.name !== "AbortError")
          console.error("[Globe] plants load failed:", e);
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  // LOD bucket from camera distance — state flips only when the bucket changes
  const { camera } = useThree();
  const bucketRef = useRef(true);
  useFrame(() => {
    const isGlobal = camera.position.length() >= LOD.globalCameraDistance;
    if (isGlobal !== bucketRef.current) {
      bucketRef.current = isGlobal;
      setLodGlobal(isGlobal);
    }
  });

  const visible = useMemo(() => {
    if (!lodGlobal) return features;
    return features.filter(
      (f) => (f.properties.capacityMW ?? 0) >= LOD.globalMinCapacityMW,
    );
  }, [features, lodGlobal]);

  // Write instance matrices + colors (typed-array path only)
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const n = Math.min(visible.length, CAPACITY);
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    const mat = new THREE.Matrix4();
    const zAxis = new THREE.Vector3(0, 0, 1);
    const color = new THREE.Color();
    const plants: PlantClickInfo[] = [];
    for (let i = 0; i < n; i++) {
      const f = visible[i];
      const [lng, lat] = f.geometry.coordinates;
      const p = latLngToVector3(lat, lng, GLOBE_RADIUS + GLOBE_POINT_ALTITUDE);
      quat.setFromUnitVectors(zAxis, p.clone().normalize());
      const r = plantRadiusMW(f.properties.capacityMW, sizeScale);
      scl.set(r, r, r);
      mat.compose(p, quat, scl);
      mesh.setMatrixAt(i, mat);
      color.set(FUEL_COLORS[f.properties.fuel as FuelType] ?? FUEL_COLORS.Other);
      mesh.setColorAt(i, color);
      plants.push(f.properties);
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    plantsRef.current = plants;
  }, [visible, sizeScale]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const i = e.instanceId;
    if (i == null || !onPlantClick) return;
    const plant = plantsRef.current[i];
    if (plant) onPlantClick(plant);
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, CAPACITY]}
      frustumCulled={false}
      onClick={handleClick}
    >
      <circleGeometry args={[1, 16]} />
      <meshBasicMaterial
        transparent
        opacity={0.92}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
