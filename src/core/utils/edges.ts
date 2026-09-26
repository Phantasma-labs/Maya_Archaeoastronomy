/**
 * Horizontal angle, in degrees (0..45), between an edge direction (dx, dz) and
 * the nearest principal axis of a monument whose main axis points along
 * azimuth `axisAzimuth` (radians; same convention as the tour: the axis
 * direction in the x–z plane is (sin a, cos a), the other axis is ⟂ to it).
 */
export function axisMisalignmentDeg(dx: number, dz: number, axisAzimuth: number): number {
  const phi = Math.atan2(dz, dx);
  const phi0 = Math.atan2(Math.cos(axisAzimuth), Math.sin(axisAzimuth));
  const d = Math.abs(((phi - phi0) * 180) / Math.PI) % 90;
  return Math.min(d, 90 - d);
}

/** Edges within this many degrees of an axis are real structure. */
const REAL_EDGE_MAX_DEG = 1.5;
/** Beyond this the edge is a rounded corner / detail, not a stray sliver. */
const STRAY_MAX_DEG = 20;
/** Shorter edges are corner arcs and small detail, never the long slivers. */
const STRAY_MIN_LENGTH = 2;
/** Nearly vertical edges have no meaningful horizontal direction — keep them. */
const STRAY_MIN_HORIZONTAL = 0.3;
/** A long edge tilted this far from level (but not steep) is not real structure. */
const TILT_MIN_DEG = 3;
const TILT_MAX_DEG = 15;
/** Only edges at least this long are judged by their tilt (shorter ones are detail). */
const TILT_MIN_LENGTH = 4;

/**
 * Is this world-space edge a mesh-noise sliver rather than real structure?
 *
 * Every real edge of a stepped monument is vertical, level along one of its
 * axes (terrace rims, step edges), or steep along one (stairway walls, ~45°).
 * The eroded parts of the Lesson 01 mesh also produce long edges that break
 * those patterns, in two ways — both reported as strays:
 *   - running *near* an axis but not on it (1.5°–20° off), e.g. a 50 m sliver
 *     across a base terrace;
 *   - being nearly level but tilted (3°–15° from horizontal, ≥ 4 m long), e.g.
 *     a terrace rim that rises 2 m along 22 m.
 * Short edges (rounded corners), on-axis level edges, steep edges and vertical
 * edges are kept.
 */
export function isStrayEdge(dx: number, dy: number, dz: number, axisAzimuth: number): boolean {
  const length = Math.hypot(dx, dy, dz);
  const horizontal = Math.hypot(dx, dz);
  if (length < STRAY_MIN_LENGTH || horizontal < STRAY_MIN_HORIZONTAL * length) return false;
  const m = axisMisalignmentDeg(dx, dz, axisAzimuth);
  if (m >= REAL_EDGE_MAX_DEG && m <= STRAY_MAX_DEG) return true;
  const tilt = (Math.atan2(Math.abs(dy), horizontal) * 180) / Math.PI;
  return length >= TILT_MIN_LENGTH && tilt >= TILT_MIN_DEG && tilt <= TILT_MAX_DEG;
}
