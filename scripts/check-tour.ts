// Dev-only sanity check for sampleTour — run with: node scripts/check-tour.ts
// (Node 24 executes .ts directly via type stripping; no test runner or new
// dependency is added — see the repo's "no test scripts" rule.)
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { projectToScreen, sampleTour, tourSettle } from '../src/core/utils/tour.ts';
import { stairStepSlots } from '../src/core/utils/stairs.ts';
import type { StairwaySpec, TourStop } from '../src/core/types/lesson.types.ts';

type V3 = [number, number, number];

const stop = (
  id: string,
  azimuth: number,
  elevation = 0,
  radius = 10,
  target: [number, number, number] = [0, 0, 0]
): TourStop => ({
  id,
  label: id,
  camera: { azimuth, elevation, radius, target },
  info: { headline: id, lines: [], status: 'documented' }
});

const near = (actual: number, expected: number, label: string, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < eps, `${label}: ${actual} !≈ ${expected}`);
const deg = (d: number) => (d * Math.PI) / 180;

// 1. Exact stops land exactly on their authored pose.
{
  const stops = [stop('a', 0), stop('b', Math.PI / 2)];
  const s1 = sampleTour(stops, 1);
  near(s1.eye[0], 0, 'stop1 x');
  near(s1.eye[1], 0, 'stop1 y');
  near(s1.eye[2], 10, 'stop1 z');
  const s2 = sampleTour(stops, 2);
  near(s2.eye[0], 10, 'stop2 x');
  near(s2.eye[2], 0, 'stop2 z');
}

// 2. Midpoint interpolates azimuth linearly.
{
  const s = sampleTour([stop('a', 0), stop('b', Math.PI / 2)], 1.5);
  near(s.eye[0], 10 * Math.sin(Math.PI / 4), 'mid x');
  near(s.eye[2], 10 * Math.cos(Math.PI / 4), 'mid z');
}

// 3. Wrap-around: 350° → 10° takes the 20° short arc, passing through 0°
//    (camera on +Z), never the 340° long way (camera on −Z).
{
  const s = sampleTour([stop('a', deg(350)), stop('b', deg(10))], 1.5);
  near(s.eye[0], 0, 'wrap x');
  assert.ok(s.eye[2] > 9.99, `wrap z should be ≈ +10, got ${s.eye[2]}`);
  // and the reverse direction
  const r = sampleTour([stop('a', deg(10)), stop('b', deg(350))], 1.5);
  near(r.eye[0], 0, 'wrap-rev x');
  assert.ok(r.eye[2] > 9.99, `wrap-rev z should be ≈ +10, got ${r.eye[2]}`);
}

// 4. Out-of-range / non-finite positions clamp; never NaN.
{
  const stops = [stop('a', 0), stop('b', Math.PI / 2), stop('c', Math.PI)];
  for (const p of [0, -5, Number.NaN, Number.NEGATIVE_INFINITY]) {
    const s = sampleTour(stops, p);
    near(s.eye[2], 10, `clamp-low(${p}) z`);
    assert.equal(s.activeIndex, 0);
  }
  for (const p of [3, 99]) {
    const s = sampleTour(stops, p);
    near(s.eye[2], -10, `clamp-high(${p}) z`);
    assert.equal(s.activeIndex, 2);
  }
}

// 5. activeIndex is the nearest stop (0-based).
{
  const stops = [stop('a', 0), stop('b', 1)];
  assert.equal(sampleTour(stops, 1.4).activeIndex, 0);
  assert.equal(sampleTour(stops, 1.6).activeIndex, 1);
}

// 6. A single-stop tour is valid at any position.
{
  const s = sampleTour([stop('only', 0)], 3);
  near(s.eye[2], 10, 'single z');
  assert.equal(s.activeIndex, 0);
}

// 7. Empty tour is an invalid config → throws.
assert.throws(() => sampleTour([], 1), /at least one/);

// 8. Target offset, elevation and radius/target interpolation.
{
  const up = sampleTour([stop('a', 0, 1.2, 10, [1, 2, 3])], 1);
  near(up.eye[0], 1, 'elev x');
  near(up.eye[1], 2 + 10 * Math.sin(1.2), 'elev y');
  near(up.eye[2], 3 + 10 * Math.cos(1.2), 'elev z');
  const mid = sampleTour(
    [stop('a', 0, 0, 10, [0, 0, 0]), stop('b', 0, 0, 30, [10, 20, 0])],
    1.5
  );
  near(mid.target[0], 5, 'mid target x');
  near(mid.target[1], 10, 'mid target y');
  near(mid.eye[2], 20, 'mid radius z'); // radius 20 along +Z from target z=0
}

// 8b. A straight-down (zenithal) pose is clamped just short of vertical so the azimuth
//     still decides the on-screen orientation: exactly at π/2 lookAt has no horizontal
//     forward direction and the rotation would silently not apply.
{
  const east = sampleTour([stop('a', Math.PI / 2, Math.PI / 2, 10)], 1);
  assert.ok(east.eye[1] > 9.99 && east.eye[1] < 10, `zenithal y ≈ radius, got ${east.eye[1]}`);
  assert.ok(east.eye[0] > 0.05, `zenithal pose keeps an offset toward +X, got ${east.eye[0]}`);
  near(east.eye[2], 0, 'zenithal east z', 1e-6);
  const west = sampleTour([stop('a', -Math.PI / 2, Math.PI / 2, 10)], 1);
  assert.ok(west.eye[0] < -0.05, `opposite azimuth offsets the other way, got ${west.eye[0]}`);
}

// 9. projectToScreen: pinhole maths on a simple pose (eye on +Z looking at the origin).
{
  const sample = { eye: [0, 0, 10] as V3, target: [0, 0, 0] as V3, activeIndex: 0 };
  const c = projectToScreen(sample, 90, 1, [0, 0, 0]);
  near(c.x, 0.5, 'centre x');
  near(c.y, 0.5, 'centre y');
  assert.equal(c.visible, true);
  const r = projectToScreen(sample, 90, 1, [1, 0, 0]); // depth 10, tan(45°) = 1
  near(r.x, 0.55, 'right x');
  near(r.y, 0.5, 'right y');
  const u = projectToScreen(sample, 90, 1, [0, 1, 0]);
  near(u.y, 0.45, 'up y (screen y grows downward)');
  const wide = projectToScreen(sample, 90, 2, [1, 0, 0]);
  near(wide.x, 0.525, 'aspect 2 x');
  assert.equal(projectToScreen(sample, 90, 1, [0, 0, 20]).visible, false, 'behind camera');
  assert.equal(projectToScreen(sample, 90, 1, [50, 0, 0]).visible, false, 'off-screen right');
}

// 10. projectToScreen agrees with a real THREE.PerspectiveCamera (same lookAt basis),
//     including a steep near-top-down pose.
{
  const poses: { eye: V3; target: V3 }[] = [
    { eye: [-44.4, 1.7, -73.2], target: [-1, 13, 1] },
    { eye: [10, 40, 30], target: [0, 10, 0] },
    { eye: [3, 90, 4], target: [-8.7, 25, -1.3] }
  ];
  const points: V3[] = [
    [0, 0, 0],
    [5, 12, -7],
    [-9, 3, 14]
  ];
  for (const fov of [48.455, 70]) {
    for (const aspect of [16 / 9, 1]) {
      for (const p of poses) {
        for (const pt of points) {
          const cam = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
          cam.position.set(...p.eye);
          cam.lookAt(...p.target);
          cam.updateMatrixWorld(true);
          const ndc = new THREE.Vector3(...pt).project(cam);
          const mine = projectToScreen({ ...p, activeIndex: 0 }, fov, aspect, pt);
          const tag = `fov ${fov} aspect ${aspect.toFixed(2)} eye ${p.eye} pt ${pt}`;
          near(mine.x, (ndc.x + 1) / 2, `three x [${tag}]`, 1e-6);
          near(mine.y, (1 - ndc.y) / 2, `three y [${tag}]`, 1e-6);
        }
      }
    }
  }
}

// 11. tourSettle: 1 on a stop (and a plateau just around it), 0 mid-sweep, linear ramp between.
{
  near(tourSettle(2), 1, 'settle exact');
  near(tourSettle(2.05), 1, 'settle plateau');
  near(tourSettle(2.5), 0, 'settle mid-sweep');
  near(tourSettle(2.18), (0.25 - 0.18) / 0.15, 'settle ramp');
  near(tourSettle(Number.NaN), 1, 'settle NaN falls back to a stop');
}

// 12. stairStepSlots: evenly spaced step lines from foot to top, ⟂ to the stair direction.
{
  const flat: StairwaySpec = { id: 'flat', foot: [0, 0], top: [10, 0], width: 8, steps: 4 };
  const s = stairStepSlots(flat);
  assert.equal(s.length, 4);
  [2.5, 5, 7.5, 10].forEach((x, i) => {
    near(s[i].x, x, `flat slot ${i} x`);
    near(s[i].z, 0, `flat slot ${i} z`);
    near(s[i].ax, 0, `flat slot ${i} across x`);
    near(Math.abs(s[i].az), 4, `flat slot ${i} half width`);
  });

  const diag: StairwaySpec = { id: 'diag', foot: [9, -32.3], top: [1.7, -8.1], width: 9.2, steps: 91 };
  const d = stairStepSlots(diag);
  assert.equal(d.length, 91, 'one slot per step');
  const dir = [diag.top[0] - diag.foot[0], diag.top[1] - diag.foot[1]];
  const len = Math.hypot(dir[0], dir[1]);
  for (const slot of d) {
    near(slot.ax * dir[0] + slot.az * dir[1], 0, 'across ⟂ direction');
    near(Math.hypot(slot.ax, slot.az), 4.6, 'across length = half width');
  }
  near(d[90].x, diag.top[0], 'last slot at top x');
  near(d[90].z, diag.top[1], 'last slot at top z');
  // evenly spaced along the run
  const gap = (i: number) => Math.hypot(d[i + 1].x - d[i].x, d[i + 1].z - d[i].z);
  near(gap(0), len / 91, 'even spacing (first gap)');
  near(gap(80), len / 91, 'even spacing (later gap)');

  assert.deepEqual(stairStepSlots({ ...flat, steps: 0 }), [], 'no steps → no slots');
  assert.deepEqual(stairStepSlots({ ...flat, top: [0, 0] }), [], 'zero-length stair → no slots');
}

console.log('sampleTour: all checks passed');
