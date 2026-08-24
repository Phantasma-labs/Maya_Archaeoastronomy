import React, { useMemo } from 'react';
import * as THREE from 'three';
import { LightingConfig } from '../types/lesson.types';

interface SceneLightingProps {
  config: LightingConfig;
}

/**
 * SceneLighting Component
 *
 * Renders a single directional sun light.
 * The directional light direction is computed from Euler angles so that
 * sliders in the Dev Panel produce intuitive angular rotation of the sun.
 *
 * Shadow camera bounds are generous (±120 units) to cover the full
 * Chichén Itzá plaza footprint visible in the Lesson 01 scene.
 *
 * Note: ambient fill is intentionally omitted — scene fill light comes
 * exclusively from the IBL environment (see SceneEnvironment).
 */
export const SceneLighting: React.FC<SceneLightingProps> = ({ config }) => {
  const { directional } = config;

  // Translate Euler rotation into a world-space position for the directional light.
  // A directional light at position P points toward the origin, so placing it
  // on a rotated unit sphere gives full 3-axis angular control.
  const lightPosition = useMemo<[number, number, number]>(() => {
    const euler = new THREE.Euler(
      directional.rotation[0],
      directional.rotation[1],
      directional.rotation[2],
      'YXZ'
    );
    const vec = new THREE.Vector3(0, 1, 0).applyEuler(euler).multiplyScalar(120);
    return [vec.x, vec.y, vec.z];
  }, [directional.rotation]);

  return (
    <directionalLight
      position={lightPosition}
      intensity={directional.intensity}
      color={directional.color}
      castShadow={directional.castShadow !== false}
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-near={0.5}
      shadow-camera-far={400}
      shadow-camera-left={-120}
      shadow-camera-right={120}
      shadow-camera-top={120}
      shadow-camera-bottom={-120}
      shadow-bias={-0.0005}
      shadow-normalBias={0.02}
    />
  );
};
