// Type-only import (erased at runtime) so scripts/check-tour.ts can run this
// file directly under Node's type stripping.
import type { StairwaySpec } from '../types/lesson.types';

/** Horizontal placement of one step line: centre (x, z) and half-width vector. */
export interface StairSlot {
  x: number;
  z: number;
  /** Half of the step line, as a horizontal vector ⟂ to the stair direction. */
  ax: number;
  az: number;
}

/**
 * Where to draw each step line of a stairway (pure, horizontal only).
 *
 * `steps` slots are spaced evenly from the foot to the top; slot i sits at
 * t = (i + 1) / steps, so the last line is the top edge and the foot edge is
 * left to the base outline. Each slot carries the vector from the line's
 * centre to one end (perpendicular to the run, half the stairway width);
 * the line spans centre ± that vector. Heights are not authored — the caller
 * snaps each slot to the model surface. Returns [] for a stairway with no
 * steps or zero length.
 */
export function stairStepSlots(spec: StairwaySpec): StairSlot[] {
  const dx = spec.top[0] - spec.foot[0];
  const dz = spec.top[1] - spec.foot[1];
  const len = Math.hypot(dx, dz);
  if (spec.steps < 1 || len === 0) return [];

  const half = spec.width / 2;
  const ax = (-dz / len) * half;
  const az = (dx / len) * half;

  const slots: StairSlot[] = [];
  for (let i = 0; i < spec.steps; i++) {
    const t = (i + 1) / spec.steps;
    slots.push({ x: spec.foot[0] + dx * t, z: spec.foot[1] + dz * t, ax, az });
  }
  return slots;
}

/**
 * Least-squares line fit y = intercept + slope · x. Used to fit each ramp's
 * plane along its run so step lines lie on one straight, evenly spaced plane
 * rather than following the worn surface's bumps. Fewer than two points (or
 * all-equal x) yields a flat line at the mean (0 for no points).
 */
export function fitLine(xs: number[], ys: number[]): { intercept: number; slope: number } {
  const n = Math.min(xs.length, ys.length);
  if (n === 0) return { intercept: 0, slope: 0 };
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i];
    sy += ys[i];
  }
  const mx = sx / n;
  const my = sy / n;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) * (xs[i] - mx);
    sxy += (xs[i] - mx) * (ys[i] - my);
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  return { intercept: my - slope * mx, slope };
}

/**
 * Is the horizontal point (x, z) inside the stairway's footprint — the band of
 * the given `width` (+ `margin` each side) between foot and top? `tMin`/`tMax`
 * bound the run (0 = foot, 1 = top; the defaults leave the platform's top edge
 * outside). False for a zero-length stairway.
 */
export function stairFootprintContains(
  spec: StairwaySpec,
  x: number,
  z: number,
  margin = 0,
  tMin = -0.03,
  tMax = 0.99
): boolean {
  const dx = spec.top[0] - spec.foot[0];
  const dz = spec.top[1] - spec.foot[1];
  const len = Math.hypot(dx, dz);
  if (len === 0) return false;
  const rx = x - spec.foot[0];
  const rz = z - spec.foot[1];
  const t = (rx * dx + rz * dz) / (len * len);
  const u = (-rx * dz + rz * dx) / len;
  return t >= tMin && t <= tMax && Math.abs(u) <= spec.width / 2 + margin;
}
