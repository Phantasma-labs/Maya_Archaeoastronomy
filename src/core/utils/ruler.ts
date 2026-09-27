// Type-only import (erased at runtime) so scripts/check-tour.ts can run this
// file directly under Node's type stripping.
import type { TourRuler } from '../types/lesson.types';

/** Major ticks (every `majorEvery`-th and the two ends) are this much taller. */
const MAJOR_SCALE = 1.6;

/**
 * Line segments of a schematic count ruler as a flat
 * [x1, y1, z1, x2, y2, z2, …] list: the baseline first, then one vertical tick
 * per count, evenly spaced from `from` to `to`. Ticks are numbered from 1; the
 * first and last are always major, and so is every `majorEvery`-th one, so a
 * long ruler (52 ticks) can be counted by eye. `count` 0 gives the baseline
 * only, 1 a single tick at the midpoint; a zero-length ruler gives nothing.
 */
export function rulerSegments(ruler: TourRuler): number[] {
  const [x0, z0] = ruler.from;
  const [x1, z1] = ruler.to;
  if (x0 === x1 && z0 === z1) return [];

  const out: number[] = [x0, ruler.y, z0, x1, ruler.y, z1];
  const n = Math.max(0, Math.floor(ruler.count));
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = x0 + (x1 - x0) * t;
    const z = z0 + (z1 - z0) * t;
    const major =
      n > 1 &&
      (i === 0 || i === n - 1 || (ruler.majorEvery ? (i + 1) % ruler.majorEvery === 0 : false));
    const height = ruler.tickHeight * (major ? MAJOR_SCALE : 1);
    out.push(x, ruler.y, z, x, ruler.y + height, z);
  }
  return out;
}
