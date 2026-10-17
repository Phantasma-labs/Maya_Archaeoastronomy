import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BUILDINGS, BuildingId } from './site';

interface StandInBuildingsProps {
  activeId: BuildingId | null;
}

const SIZE: [number, number, number] = [10, 8, 10];
/** Top of the eastern platform (m); boxes sit on it. */
const PLATFORM_TOP_Y = 4.5;
const GLOW_COLOR = new THREE.Color('#ffc233');
const NO_GLOW = new THREE.Color('#000000');

interface StandInProps {
  xz: [number, number];
  active: boolean;
}

const StandIn: React.FC<StandInProps> = ({ xz, active }) => {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    material.emissive.copy(active ? GLOW_COLOR : NO_GLOW);
    material.emissiveIntensity = active ? 0.9 : 0;
    invalidate();
  }, [active, invalidate]);

  return (
    <mesh position={[xz[0], PLATFORM_TOP_Y + SIZE[1] / 2, xz[1]]} castShadow receiveShadow>
      <boxGeometry args={SIZE} />
      <meshStandardMaterial ref={materialRef} color="#cfc4ad" roughness={0.9} />
    </mesh>
  );
};

/**
 * Temporary 10 x 8 x 10 m stand-ins for E-I, E-II and E-III (branch only,
 * until the real building models land). Each box owns its material so the
 * active one can glow without touching the others.
 */
export const StandInBuildings: React.FC<StandInBuildingsProps> = ({ activeId }) => (
  <group name="StandInBuildings">
    {BUILDINGS.map((b) => (
      <StandIn key={b.id} xz={b.xz} active={b.id === activeId} />
    ))}
  </group>
);
