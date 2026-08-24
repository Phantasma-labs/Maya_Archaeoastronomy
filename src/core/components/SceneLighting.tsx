import React, { useMemo } from 'react';
import * as THREE from 'three';

interface SceneLightingProps {
  /**
   * Sun Euler rotation [X, Y, Z] radians — interpolated from the
   * Atmosphere Timeline keyframes (ADR-001).
   */
  rotation: [number, number, number];
  intensity: number;
  color: string;
  castShadow?: boolean;
}

/**
 * SceneLighting Component
 *
 * Renders a single directional sun light (fill comes exclusively from the
 * IBL environment — see SceneEnvironment; no ambient by design).
 *
 * Its rotation arrives already interpolated from the Atmosphere Timeline
 * keyframes, so dragging the slider visibly swings the sun. Direction is
 * derived from Euler angles: a directional light positioned at P points
 * toward the origin, so placing it on a rotated unit sphere gives full
 * 3-axis angular control.
 *
 * Shadow camera bounds are generous (±120 units) to cover the full
 * Chichén Itzá plaza footprint visible in the Lesson 01 scene.
 */
export const SceneLighting: React.FC<SceneLightingProps> = ({
  rotation,
  intensity,
  color,
  castShadow = true
}) => {
  const lightPosition = useMemo<[number, number, number]>(() => {
    const euler = new THREE.Euler(rotation[0], rotation[1], rotation[2], 'YXZ');
    const vec = new THREE.Vector3(0, 1, 0).applyEuler(euler).multiplyScalar(120);
    return [vec.x, vec.y, vec.z];
  }, [rotation]);

  return (
    <directionalLight
      position={lightPosition}
      intensity={intensity}
      color={color}
      castShadow={castShadow}
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
