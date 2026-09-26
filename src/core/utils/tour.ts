// Type-only import (erased at runtime) so scripts/check-tour.ts can run this
// file directly under Node's type stripping.
import type { TourSample, TourStop } from '../types/lesson.types';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const TWO_PI = Math.PI * 2;

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
  const elevation = lerp(a.elevation, b.elevation, t);
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
