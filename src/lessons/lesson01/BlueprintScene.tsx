import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { CameraTour } from '../../core/components/CameraTour';
import { ModelLoader } from '../../core/components/ModelLoader';
import { sampleTour } from '../../core/utils/tour';
import { CameraConfig, ModelAsset, TourStop } from '../../core/types/lesson.types';

interface BlueprintSceneProps {
  tour: TourStop[];
  /** Continuous tour position in [1, N] (the single runtime value, ADR-001). */
  position: number;
  lens: Pick<CameraConfig, 'fov' | 'near' | 'far'>;
  layoutAsset: ModelAsset;
  floorAsset: ModelAsset;
}

/** maya-gold token (tailwind.config.js). */
const BLUEPRINT_GOLD = '#d4af37';

/**
 * Lesson 01 blueprint scene — the Calendar & Architecture view.
 *
 * Everything is drawn with ONE shared wireframe material (plus a fainter
 * variant for the plaza floor) on a black background. Basic materials ignore
 * lights and IBL, so — deliberately — there is no SceneEnvironment and no sun
 * here. The tree canopy is not mounted (a wireframe canopy is only haze).
 * The camera pose is derived from the tour position by `sampleTour`; no
 * useFrame, no state.
 */
export const BlueprintScene: React.FC<BlueprintSceneProps> = ({
  tour,
  position,
  lens,
  layoutAsset,
  floorAsset
}) => {
  const sample = useMemo(() => sampleTour(tour, position), [tour, position]);

  const pyramidMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: BLUEPRINT_GOLD,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        toneMapped: false
      }),
    []
  );
  const floorMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: BLUEPRINT_GOLD,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        toneMapped: false
      }),
    []
  );
  useEffect(
    () => () => {
      pyramidMaterial.dispose();
      floorMaterial.dispose();
    },
    [pyramidMaterial, floorMaterial]
  );

  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraTour sample={sample} lens={lens} />
      <group name="Lesson01_Blueprint">
        <ModelLoader asset={layoutAsset} materialOverride={pyramidMaterial} />
        <ModelLoader asset={floorAsset} materialOverride={floorMaterial} />
      </group>
    </>
  );
};
