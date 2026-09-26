import React, { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraConfig, TourSample } from '../types/lesson.types';

interface CameraTourProps {
  /** Derived camera pose for the current tour position (see `sampleTour`). */
  sample: TourSample;
  /** Lens settings, shared across all stops. */
  lens: Pick<CameraConfig, 'fov' | 'near' | 'far'>;
}

/**
 * CameraTour — applies a derived tour pose to the R3F camera.
 *
 * The pose is a pure function of `sliderPosition` (ADR-001), so this
 * component holds no state and never runs per frame: a dependency-guarded
 * layout effect mutates the camera whenever the sample (or viewport) changes,
 * then invalidates because the canvas uses frameloop="demand". Sibling of
 * `FixedGlbCamera`, which locks a single authored pose instead.
 */
export const CameraTour: React.FC<CameraTourProps> = ({ sample, lens }) => {
  const { camera, size, invalidate } = useThree();

  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;

    cam.position.set(...sample.eye);
    cam.fov = lens.fov;
    cam.near = lens.near;
    cam.far = lens.far;
    cam.aspect = size.width / size.height;
    cam.updateProjectionMatrix();
    cam.lookAt(...sample.target);
    cam.updateMatrixWorld(true);
    invalidate();
  }, [camera, size.width, size.height, sample, lens.fov, lens.near, lens.far, invalidate]);

  return null;
};
