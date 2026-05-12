"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function Tank({
  position,
  radius = 1,
  height = 1.5,
  fillLevel = 0.5,
}: {
  position: [number, number, number];
  radius?: number;
  height?: number;
  fillLevel?: number;
}) {
  const fillRef = useRef<THREE.Mesh>(null);

  // Slight pulsing for the oil level to make it feel "active" scanning
  useFrame(({ clock }) => {
    if (fillRef.current && !Array.isArray(fillRef.current.material)) {
      fillRef.current.material.opacity =
        0.7 + Math.sin(clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Outer Shell (Wireframe/Glassy) */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius, height, 32]} />
        <meshStandardMaterial
          color="#334155"
          transparent
          opacity={0.3}
          metalness={0.8}
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Internal Outline (Scanner style) */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry
          args={[radius * 1.01, radius * 1.01, height * 1.01, 16]}
        />
        <meshBasicMaterial
          color="#06b6d4"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Oil Fill Level */}
      <mesh position={[0, (height * fillLevel) / 2, 0]} ref={fillRef as any}>
        <cylinderGeometry
          args={[radius * 0.95, radius * 0.95, height * fillLevel, 32]}
        />
        <meshStandardMaterial
          color={
            fillLevel > 0.7
              ? "#ef4444"
              : fillLevel > 0.4
                ? "#f59e0b"
                : "#10b981"
          }
          emissive={
            fillLevel > 0.7
              ? "#ef4444"
              : fillLevel > 0.4
                ? "#f59e0b"
                : "#10b981"
          }
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Roof */}
      <mesh position={[0, height, 0]}>
        <cylinderGeometry args={[radius * 1.05, radius * 1.05, 0.05, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.8} />
      </mesh>
    </group>
  );
}

function GroundScanner() {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame(({ clock }) => {
    if (gridRef.current) {
      gridRef.current.position.x = (clock.elapsedTime * 0.2) % 1;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Base plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#020617" metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Scanning grid */}
      <gridHelper
        ref={gridRef as any}
        args={[20, 20, 0x06b6d4, 0x334155]}
        position={[0, 0.01, 0]}
      />
    </group>
  );
}

export function SatelliteTanksScene() {
  // Generating a randomized cluster of tanks for the satellite feed
  const tanks = useMemo(() => {
    const arr = [];
    const positions = [
      [-2, -2],
      [-2, 2],
      [2, -2],
      [2, 2],
      [0, 0],
      [-4, 0],
      [4, 0],
      [0, 4],
    ];

    for (let i = 0; i < positions.length; i++) {
      const [x, z] = positions[i];
      arr.push({
        id: i,
        x: x + (Math.random() - 0.5) * 0.5,
        z: z + (Math.random() - 0.5) * 0.5,
        radius: 0.8 + Math.random() * 0.4,
        height: 1.2 + Math.random() * 0.6,
        fillLevel: Math.random() * 0.9 + 0.1, // 10% to 100% full
      });
    }
    return arr;
  }, []);

  return (
    <Canvas
      camera={{ position: [6, 5, 8], fov: 40 }}
      className="absolute inset-0 bg-[#020617]" // very dark blue/black background matches dashboard
    >
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 15, 10]} intensity={2} color="#06b6d4" />
      <directionalLight
        position={[-10, 5, -10]}
        intensity={0.5}
        color="#ef4444"
      />

      <group position={[0, -0.5, 0]}>
        <GroundScanner />
        {tanks.map((t) => (
          <Tank
            key={t.id}
            position={[t.x, 0, t.z]}
            radius={t.radius}
            height={t.height}
            fillLevel={t.fillLevel}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableRotate={true}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2.5}
        minPolarAngle={Math.PI / 6}
      />
    </Canvas>
  );
}
