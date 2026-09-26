// Dev-only sanity check for sampleTour — run with: node scripts/check-tour.ts
// (Node 24 executes .ts directly via type stripping; no test runner or new
// dependency is added — see the repo's "no test scripts" rule.)
import assert from 'node:assert/strict';
import { sampleTour } from '../src/core/utils/tour.ts';
import type { TourStop } from '../src/core/types/lesson.types.ts';

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
  const up = sampleTour([stop('a', 0, Math.PI / 2, 10, [1, 2, 3])], 1);
  near(up.eye[0], 1, 'elev x');
  near(up.eye[1], 12, 'elev y');
  near(up.eye[2], 3, 'elev z');
  const mid = sampleTour(
    [stop('a', 0, 0, 10, [0, 0, 0]), stop('b', 0, 0, 30, [10, 20, 0])],
    1.5
  );
  near(mid.target[0], 5, 'mid target x');
  near(mid.target[1], 10, 'mid target y');
  near(mid.eye[2], 20, 'mid radius z'); // radius 20 along +Z from target z=0
}

console.log('sampleTour: all checks passed');
