import React, { useLayoutEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { sunDirection } from '../../core/utils/sunrise';
import { OBSERVER_XZ } from './site';

interface SunDiscProps {
  azimuthDeg: number;
  elevationDeg: number;
}

/** Eye height of the fixed camera (m) — the disc is placed relative to it. */
const OBSERVER_Y = 11.5;
/** Distance from the observer to the disc (m); inside the 500 m skydome. */
const DISC_DISTANCE = 300;
/** Exaggerated angular size (~2 deg across) so the sun reads clearly. */
const DISC_RADIUS = 5;
const GLOW_RADIUS = 14;

/**
 * Emissive sun disc with a soft glow, placed on the line of sight toward the
 * sunrise point and turned to face the observer. Position is mutated via ref
 * in a dependency-guarded layout effect (ADR-001: no useFrame, demand loop).
 */
export const SunDisc: React.FC<SunDiscProps> = ({ azimuthDeg, elevationDeg }) => {
  const groupRef = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const [dx, dy, dz] = sunDirection(azimuthDeg, elevationDeg);
    const observer = new THREE.Vector3(OBSERVER_XZ[0], OBSERVER_Y, OBSERVER_XZ[1]);
    group.position.set(
      observer.x + DISC_DISTANCE * dx,
      observer.y + DISC_DISTANCE * dy,
      observer.z + DISC_DISTANCE * dz
    );
    group.lookAt(observer);
    invalidate();
  }, [azimuthDeg, elevationDeg, invalidate]);

  return (
    <group ref={groupRef} name="SunDisc">
      <mesh renderOrder={1}>
        <circleGeometry args={[GLOW_RADIUS, 48]} />
        <meshBasicMaterial
          color="#ffb347"
          transparent
          opacity={0.22}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh renderOrder={2} position={[0, 0, 0.1]}>
        <circleGeometry args={[DISC_RADIUS, 48]} />
        <meshBasicMaterial color="#fff2c4" toneMapped={false} />
      </mesh>
    </group>
  );
};
