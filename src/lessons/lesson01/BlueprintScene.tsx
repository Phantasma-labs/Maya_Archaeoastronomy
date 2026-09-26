import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { CameraTour } from '../../core/components/CameraTour';
import { sampleTour } from '../../core/utils/tour';
import { CameraConfig, ModelAsset, StairwaySpec, TourStop } from '../../core/types/lesson.types';
import { BlueprintEdges } from './BlueprintEdges';
import { BlueprintStairs } from './BlueprintStairs';

interface BlueprintSceneProps {
  tour: TourStop[];
  /** Continuous tour position in [1, N] (the single runtime value, ADR-001). */
  position: number;
  lens: Pick<CameraConfig, 'fov' | 'near' | 'far'>;
  layoutAsset: ModelAsset;
  /** Stairways to draw step lines on (the model's stairs are flat ramps). */
  stairways: StairwaySpec[];
}

/** maya-gold token (tailwind.config.js). */
const BLUEPRINT_GOLD = '#d4af37';

/** Ground reference grid: 240 m square, 10 m cells, centred on the plaza. */
const GRID_SIZE = 240;
const GRID_DIVISIONS = 24;
const GRID_CENTER: [number, number, number] = [9, 0.5, 20];

/**
 * Lesson 01 blueprint scene — the Calendar & Architecture view.
 *
 * The pyramid is drawn as a clean outline (hard edges over a black occluder),
 * with procedurally drawn step lines on its stairways and a faint ground grid
 * on a black background. Basic materials ignore lights and IBL, so —
 * deliberately — there is no SceneEnvironment and no sun here; the tree
 * canopy and the plaza floor mesh are not mounted. The camera pose is derived
 * from the tour position by `sampleTour`; no useFrame, no state.
 */
export const BlueprintScene: React.FC<BlueprintSceneProps> = ({
  tour,
  position,
  lens,
  layoutAsset,
  stairways
}) => {
  const sample = useMemo(() => sampleTour(tour, position), [tour, position]);

  const grid = useMemo(() => {
    const g = new THREE.GridHelper(GRID_SIZE, GRID_DIVISIONS, BLUEPRINT_GOLD, BLUEPRINT_GOLD);
    const material = g.material as THREE.LineBasicMaterial;
    material.transparent = true;
    material.opacity = 0.2;
    material.depthWrite = false;
    material.toneMapped = false;
    g.position.set(...GRID_CENTER);
    return g;
  }, []);
  useEffect(
    () => () => {
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
    },
    [grid]
  );

  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraTour sample={sample} lens={lens} />
      <group name="Lesson01_Blueprint">
        <BlueprintEdges asset={layoutAsset} color={BLUEPRINT_GOLD} opacity={0.9} />
        <BlueprintStairs
          asset={layoutAsset}
          stairways={stairways}
          color={BLUEPRINT_GOLD}
          opacity={0.6}
        />
        <primitive object={grid} />
      </group>
    </>
  );
};
