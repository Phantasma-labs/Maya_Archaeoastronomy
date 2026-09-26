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
