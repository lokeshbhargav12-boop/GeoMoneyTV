"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Stars } from "@react-three/drei";
import * as THREE from "three";

function RotatingGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 6]}>
      <Sphere ref={meshRef} args={[2.5, 64, 64]}>
        <meshStandardMaterial
          color="#4287f5"
          emissive="#1E3A8A"
          emissiveIntensity={0.5}
          wireframe={true}
          transparent
          opacity={0.5}
        />
      </Sphere>
      <Sphere args={[2.4, 64, 64]}>
         <meshStandardMaterial
          color="#0a192f"
          emissive="#000000"
        />
      </Sphere>
       {/* Gold accent points or lines could be added here */}
    </group>
  );
}

export default function Globe() {
  return (
    <div className="absolute inset-0 h-full w-full">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#D4AF37" />
        <RotatingGlobe />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
