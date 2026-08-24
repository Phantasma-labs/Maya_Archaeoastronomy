import React, { useEffect, useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraConfig } from '../types/lesson.types';

interface FixedGlbCameraProps {
  config: CameraConfig;
}

/**
 * FixedGlbCamera Component
 *
 * Architecture Decision:
 *   The GLB camera node (from Lesson01_Layout_v003.glb) has the following
 *   extracted transform, baked into the lesson config at authoring time:
 *
 *   Position:    [-44.413, 1.700, -73.158]
 *   Quaternion:  [0.03225, -0.95689, 0.11693, 0.26392]
 *   FOV (yfov):  0.845708 rad ≈ 48.455°
 *   Near / Far:  0.1 / 1000
 *
 *   Using the config directly (rather than extracting at runtime from the
 *   cloned scene) avoids a one-frame race condition where the GLB scene
 *   hasn't yet been traversed when FixedGlbCamera first mounts.
 *
 * The camera is set once on mount and locked — no orbit, pan, zoom, or
 * any other user interaction is ever applied.
 */
export const FixedGlbCamera: React.FC<FixedGlbCameraProps> = ({ config }) => {
  const { camera, size } = useThree();

  // Apply camera transform immediately on mount — before first render frame
  useLayoutEffect(() => {
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    if (!perspectiveCamera.isPerspectiveCamera) return;

    perspectiveCamera.position.set(...config.position);

    if (config.quaternion) {
      perspectiveCamera.quaternion.set(...config.quaternion);
    } else if (config.rotation) {
      perspectiveCamera.rotation.set(...config.rotation);
    }

    perspectiveCamera.fov = config.fov;
    perspectiveCamera.near = config.near;
    perspectiveCamera.far = config.far;
    perspectiveCamera.aspect = size.width / size.height;
    perspectiveCamera.updateProjectionMatrix();

    // Force a look-update so the rotation quaternion is properly applied
    perspectiveCamera.updateMatrixWorld(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Intentionally only runs once on mount to lock the camera.

  // Update aspect ratio on viewport resize without touching position/rotation
  useEffect(() => {
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    if (perspectiveCamera.isPerspectiveCamera) {
      perspectiveCamera.aspect = size.width / size.height;
      perspectiveCamera.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height]);

  return null;
};
