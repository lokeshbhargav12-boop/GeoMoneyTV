"use client";

// Earth sphere: day texture with CDN fallback chain (pattern reused from
// WorldGlobe), procedural dark-ocean fallback, graticule + atmosphere glow.
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Sphere } from "@react-three/drei";
import { GLOBE_RADIUS, latLngToVector3 } from "@/lib/globe/coordinates";

const EARTH_DAY_URLS = [
  "/earth-blue-marble.jpg",
  "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
  "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg",
  "https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-blue-marble.jpg",
];

function loadTextureWithFallback(
  urls: string[],
  onSuccess: (tex: THREE.Texture) => void,
  index = 0,
): void {
  if (index >= urls.length) return;
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = "anonymous";
  loader.load(
    urls[index],
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      onSuccess(texture);
    },
    undefined,
    () => loadTextureWithFallback(urls, onSuccess, index + 1),
  );
}

function useGraticule(): THREE.BufferGeometry {
  return useMemo(() => {
    const positions: number[] = [];
    const r = GLOBE_RADIUS + 0.001;
    const push = (a: THREE.Vector3, b: THREE.Vector3) => {
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    };
    const SEG = 72;
    for (let lat = -75; lat <= 75; lat += 15) {
      for (let i = 0; i < SEG; i++) {
        const lng1 = (i / SEG) * 360 - 180;
        const lng2 = ((i + 1) / SEG) * 360 - 180;
        push(latLngToVector3(lat, lng1, r), latLngToVector3(lat, lng2, r));
      }
    }
    for (let lng = -180; lng < 180; lng += 15) {
      for (let i = 0; i < SEG; i++) {
        const lat1 = (i / SEG) * 180 - 90;
        const lat2 = ((i + 1) / SEG) * 180 - 90;
        push(latLngToVector3(lat1, lng, r), latLngToVector3(lat2, lng, r));
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    return geo;
  }, []);
}

export default function EarthSphere() {
  const [dayMap, setDayMap] = useState<THREE.Texture | null>(null);
  const graticule = useGraticule();

  useEffect(() => {
    let disposed = false;
    let tex: THREE.Texture | null = null;
    loadTextureWithFallback(EARTH_DAY_URLS, (t) => {
      if (!disposed) {
        tex = t;
        setDayMap(t);
      }
    });
    return () => {
      disposed = true;
      tex?.dispose();
    };
  }, []);

  return (
    <group>
      <Sphere args={[GLOBE_RADIUS, 96, 96]}>
        {dayMap ? (
          <meshBasicMaterial map={dayMap} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#0b1f3a" />
        )}
      </Sphere>
      {/* graticule */}
      <lineSegments geometry={graticule}>
        <lineBasicMaterial
          color="#7dd3fc"
          transparent
          opacity={0.05}
          depthWrite={false}
        />
      </lineSegments>
      {/* atmosphere rim */}
      <Sphere args={[GLOBE_RADIUS + 0.18, 48, 48]}>
        <meshBasicMaterial
          color="#1e5aa8"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </Sphere>
    </group>
  );
}
