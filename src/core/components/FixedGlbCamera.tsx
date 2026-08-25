import React, { useEffect, useLayoutEffect, useRef } from 'react';
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

  // Capture the config once at mount so the layout effect can read from this
  // ref and stay mount-only (TECH_DEBT M5). Lesson navigations remount this
  // component via the route key, so a mount-only effect is correct here.
  const initialConfigRef = useRef(config);

  // Apply camera transform immediately on mount — before first render frame.
  useLayoutEffect(() => {
    const cfg = initialConfigRef.current;
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    if (!perspectiveCamera.isPerspectiveCamera) return;

    perspectiveCamera.position.set(...cfg.position);

    if (cfg.quaternion) {
      perspectiveCamera.quaternion.set(...cfg.quaternion);
    } else if (cfg.rotation) {
      perspectiveCamera.rotation.set(...cfg.rotation);
    }

    perspectiveCamera.fov = cfg.fov;
    perspectiveCamera.near = cfg.near;
    perspectiveCamera.far = cfg.far;
    perspectiveCamera.aspect = size.width / size.height;
    perspectiveCamera.updateProjectionMatrix();

    // Force a look-update so the rotation quaternion is properly applied
    perspectiveCamera.updateMatrixWorld(true);
  }, [camera, size.width, size.height]);

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
