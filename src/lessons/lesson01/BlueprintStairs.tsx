import React, { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ModelAsset, StairwaySpec } from '../../core/types/lesson.types';
import { fitLine, stairStepSlots } from '../../core/utils/stairs';

/** The pyramid's body mesh in Lesson01_Layout — the surface the step lines sit on.
 *  (Authored as node "Pyramid.Base"; three's GLTFLoader strips the dot.) */
const PYRAMID_BODY_MESH = 'PyramidBase';
/** Rays start well above the pyramid and shoot straight down. */
const RAY_START_Y = 80;
/** Minimum lift above the ramp so lines win the depth test against the black occluder. */
const LIFT = 0.08;
/** Samples along the run used to fit the ramp plane. */
const RUN_SAMPLES = 24;
/** Along-run steps (every 5%) and across-width samples used to find the ramp's highest bump. */
const BUMP_RUN_STEPS = 19;
const BUMP_ACROSS = [-1, -0.5, 0, 0.5, 1];
/** Extra distance beyond the ramp edge for the outer balustrade line of a worn stairway. */
const BALUSTRADE = 1.2;

interface BlueprintStairsProps {
  asset: ModelAsset;
  stairways: StairwaySpec[];
  color: string;
  opacity: number;
}

/**
 * The Lesson 01 stairways are flat ramps (their 91 steps exist only in the
 * photoreal textures), so the blueprint draws the step lines procedurally.
 *
 * Per stairway: rays against the pyramid body sample the ramp along its
 * centre line, `fitLine` fits its plane, and every step line is laid on that
 * plane — straight and evenly spaced. The plane is lifted just above the
 * highest bump found across the ramp, so eroded (uneven) ramps can't poke
 * through and hide parts of the lines. Stairways flagged `worn` also get a
 * clean outline (ramp edges + balustrade lines) because their mesh edges are
 * hidden by BlueprintEdges. All lines go into one LineSegments; the cached
 * GLTF is only read.
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
    const surfaceY = (x: number, z: number): number | null => {
      origin.set(x, RAY_START_Y, z);
      raycaster.set(origin, down);
      const hit = raycaster.intersectObjects(bodies, false)[0];
      return hit ? hit.point.y : null;
    };

    const positions: number[] = [];
    const segment = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) =>
      positions.push(x1, y1, z1, x2, y2, z2);

    for (const spec of stairways) {
      const slots = stairStepSlots(spec);
      if (slots.length === 0) continue;
      const { ax, az } = slots[0];
      const dx = spec.top[0] - spec.foot[0];
      const dz = spec.top[1] - spec.foot[1];
      // Horizontal point at run fraction t, k half-widths across (k = ±1 → ramp edges).
      const at = (t: number, k = 0) => ({
        x: spec.foot[0] + dx * t + ax * k,
        z: spec.foot[1] + dz * t + az * k
      });

      // 1. Fit the ramp plane from the centre line.
      const ts: number[] = [];
      const ys: number[] = [];
      for (let i = 0; i <= RUN_SAMPLES; i++) {
        const t = i / RUN_SAMPLES;
        const p = at(t);
        const y = surfaceY(p.x, p.z);
        if (y !== null) {
          ts.push(t);
          ys.push(y);
        }
      }
      if (ts.length < 2) continue;
      const plane = fitLine(ts, ys);
      const tFoot = ts[0]; // where the ramp surface begins

      // 2. Lift the plane above the highest bump anywhere on the ramp.
      let maxBump = 0;
      for (let i = 1; i <= BUMP_RUN_STEPS; i++) {
        const t = i / (BUMP_RUN_STEPS + 1);
        if (t < tFoot) continue;
        for (const k of BUMP_ACROSS) {
          const p = at(t, k);
          const y = surfaceY(p.x, p.z);
          if (y !== null) maxBump = Math.max(maxBump, y - (plane.intercept + plane.slope * t));
        }
      }
      const planeY = (t: number) => plane.intercept + plane.slope * t + maxBump + LIFT;

      // 3. Step lines on the plane (skip the stretch before the ramp starts).
      slots.forEach((s, i) => {
        const t = (i + 1) / spec.steps;
        if (t < tFoot) return;
        const y = planeY(t);
        segment(s.x - s.ax, y, s.z - s.az, s.x + s.ax, y, s.z + s.az);
      });

      // 4. Worn stairways: clean ramp edges + balustrade lines.
      if (spec.worn) {
        const outer = 1 + (2 * BALUSTRADE) / spec.width;
        for (const k of [-1, 1, -outer, outer]) {
          const a = at(tFoot, k);
          const b = at(1, k);
          segment(a.x, planeY(tFoot), a.z, b.x, planeY(1), b.z);
        }
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
