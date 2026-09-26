// Type-only import (erased at runtime) so scripts/check-tour.ts can run this
// file directly under Node's type stripping.
import type { TourSample, TourStop } from '../types/lesson.types';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const TWO_PI = Math.PI * 2;

/**
 * Highest elevation a tour camera may reach: just short of straight down.
 * At exactly π/2 `lookAt` has no horizontal forward direction, so the azimuth
 * would stop deciding the on-screen orientation. A zenithal pose (π/2) is
 * clamped to this — visually straight down (0.57° off) — keeping the rotation.
 */
const MAX_ELEVATION = Math.PI / 2 - 0.01;

/** Signed angular difference from `from` to `to`, wrapped into (−π, π]. */
const shortestArc = (from: number, to: number): number => {
  const d = (to - from) % TWO_PI;
  if (d > Math.PI) return d - TWO_PI;
  if (d <= -Math.PI) return d + TWO_PI;
  return d;
};

/**
 * Sample a guided tour at a continuous position in [1, N] (ADR-001: pure
 * derivation of the single `sliderPosition`, never stored).
 *
 * Integer positions land exactly on a stop; in-between positions interpolate
 * stop A → B: azimuth along the SHORTEST arc (so a 350° → 10° step swings 20°,
 * not 340°), elevation / radius / target linearly. Out-of-range positions
 * clamp to the nearest stop; non-finite input falls back to step 1. Throws on
 * an empty tour — a tour topic without a stop is an invalid config.
 *
 * Because the eased step sweep in LessonPage already animates the position
 * between integers, the camera glides around the monument with no per-frame
 * loop (frameloop="demand" is untouched).
 */
export function sampleTour(stops: TourStop[], position: number): TourSample {
  const n = stops.length;
  if (n === 0) {
    throw new Error('sampleTour: a tour must contain at least one stop.');
  }

  const p = Number.isFinite(position) ? Math.min(Math.max(position, 1), n) : 1;

  let indexA = Math.floor(p) - 1;
  let t = p - Math.floor(p);
  if (indexA >= n - 1) {
    // On or above the final stop — pin to it (no outgoing blend).
    indexA = n - 1;
    t = 0;
  }
  const indexB = Math.min(indexA + 1, n - 1);

  const a = stops[indexA].camera;
  const b = stops[indexB].camera;

  const azimuth = a.azimuth + shortestArc(a.azimuth, b.azimuth) * t;
  const elevation = Math.min(lerp(a.elevation, b.elevation, t), MAX_ELEVATION);
  const radius = lerp(a.radius, b.radius, t);
  const target: [number, number, number] = [
    lerp(a.target[0], b.target[0], t),
    lerp(a.target[1], b.target[1], t),
    lerp(a.target[2], b.target[2], t)
  ];

  const cosEl = Math.cos(elevation);
  const eye: [number, number, number] = [
    target[0] + radius * Math.sin(azimuth) * cosEl,
    target[1] + radius * Math.sin(elevation),
    target[2] + radius * Math.cos(azimuth) * cosEl
  ];

  const activeIndex = Math.min(n - 1, Math.max(0, Math.round(p) - 1));

  return { eye, target, activeIndex };
}

/** Distance from a stop (in steps) within which callouts are fully shown… */
const SETTLE_NEAR = 0.1;
/** …and beyond which they are fully hidden (linear ramp in between). */
const SETTLE_FAR = 0.25;

/**
 * How "settled" the camera is on a stop, in [0, 1]: 1 on (and just around) an
 * integer position, 0 mid-sweep. Pure derivation of `sliderPosition` — callouts
 * use it as their opacity so arrows only show while the camera is at rest on
 * the step they describe. Non-finite positions fall back to a stop (1).
 */
export function tourSettle(position: number): number {
  if (!Number.isFinite(position)) return 1;
  const d = Math.abs(position - Math.round(position));
  return Math.min(1, Math.max(0, (SETTLE_FAR - d) / (SETTLE_FAR - SETTLE_NEAR)));
}

const sub = (a: readonly number[], b: readonly number[]): [number, number, number] => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2]
];
const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: readonly number[], b: readonly number[]): [number, number, number] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
const normalize = (a: readonly number[]): [number, number, number] => {
  const len = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / len, a[1] / len, a[2] / len];
};

/**
 * Project a world-space point through the tour camera onto the screen.
 *
 * Pure pinhole maths using the same basis as `THREE.Camera.lookAt` with a +Y
 * up vector (scripts/check-tour.ts compares it against a real
 * PerspectiveCamera), so 2D callouts can be laid over the canvas without any
 * access to the R3F camera. Returns normalised screen coordinates — x right,
 * y DOWN, both in [0, 1] across the frame — and `visible`: the point is in
 * front of the camera and inside the frame.
 *
 * @param fovDeg vertical field of view in degrees (CameraConfig.fov)
 * @param aspect frame width / height
 */
export function projectToScreen(
  sample: Pick<TourSample, 'eye' | 'target'>,
  fovDeg: number,
  aspect: number,
  point: readonly [number, number, number]
): { x: number; y: number; visible: boolean } {
  const f = normalize(sub(sample.target, sample.eye));
  // Looking (almost) straight along ±Y makes `up × forward` degenerate;
  // nudge exactly like THREE.Camera.lookAt does.
  if (Math.abs(f[1]) === 1) f[0] -= 0.0001;
  const forward = normalize(f);
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);

  const v = sub(point, sample.eye);
  const depth = dot(v, forward);
  if (depth <= 0) return { x: 0, y: 0, visible: false };

  const tanHalf = Math.tan((fovDeg * Math.PI) / 360);
  const ndcX = dot(v, right) / (depth * tanHalf * aspect);
  const ndcY = dot(v, up) / (depth * tanHalf);
  const x = (ndcX + 1) / 2;
  const y = (1 - ndcY) / 2;
  return { x, y, visible: x >= 0 && x <= 1 && y >= 0 && y <= 1 };
}
