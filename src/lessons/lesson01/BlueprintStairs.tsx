import React, { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ModelAsset, StairwaySpec } from '../../core/types/lesson.types';
import { stairStepSlots } from '../../core/utils/stairs';

/** The pyramid's body mesh in Lesson01_Layout — the surface the step lines sit on.
 *  (Authored as node "Pyramid.Base"; three's GLTFLoader strips the dot.) */
const PYRAMID_BODY_MESH = 'PyramidBase';
/** Rays start well above the pyramid and shoot straight down. */
const RAY_START_Y = 80;
/** Lift above the ramp so the lines win the depth test against the black occluder. */
const LIFT = 0.08;

interface BlueprintStairsProps {
  asset: ModelAsset;
  stairways: StairwaySpec[];
  color: string;
  opacity: number;
}

/**
 * The Lesson 01 stairways are flat ramps (their 91 steps exist only in the
 * photoreal textures), so the blueprint draws the step lines procedurally:
 * `stairStepSlots` gives each line's horizontal placement, and a downward ray
 * against the pyramid body snaps it to the real surface height. All lines of
 * all stairways go into one LineSegments. The cached GLTF is only read.
 */
export const BlueprintStairs: React.FC<BlueprintStairsProps> = ({
  asset,
  stairways,
  color,
  opacity
}) => {
  const gltf = useGLTF(asset.url);

  const lines = useMemo(() => {
    gltf.scene.updateMatrixWorld(true);
    const bodies: THREE.Object3D[] = [];
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.name === PYRAMID_BODY_MESH) bodies.push(child);
    });
    if (bodies.length === 0) {
      // Config/model desync — fail loudly (the error boundary surfaces it).
      throw new Error(
        `BlueprintStairs: mesh "${PYRAMID_BODY_MESH}" not found in ${asset.url}. ` +
          'The blueprint stairways and the model are out of sync.'
      );
    }

    const raycaster = new THREE.Raycaster();
    const down = new THREE.Vector3(0, -1, 0);
    const origin = new THREE.Vector3();
    const positions: number[] = [];
    for (const spec of stairways) {
      for (const s of stairStepSlots(spec)) {
        origin.set(s.x, RAY_START_Y, s.z);
        raycaster.set(origin, down);
        const hit = raycaster.intersectObjects(bodies, false)[0];
        if (!hit) continue;
        const y = hit.point.y + LIFT;
        positions.push(s.x - s.ax, y, s.z - s.az, s.x + s.ax, y, s.z + s.az);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      toneMapped: false
    });
    return new THREE.LineSegments(geometry, material);
  }, [gltf.scene, asset.url, stairways, color, opacity]);

  useEffect(
    () => () => {
      lines.geometry.dispose();
      (lines.material as THREE.Material).dispose();
    },
    [lines]
  );

  return <primitive object={lines} />;
};
