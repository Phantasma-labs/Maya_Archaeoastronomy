import { AtmosphereSample, SkyKeyframe } from '../types/lesson.types';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Sample the Atmosphere Timeline at a continuous position in [1, N]
 * (ADR-001).
 *
 * Integer positions land exactly on keyframes (mix = 0); in-between
 * positions crossfade keyframe A → B with mix = fractional part.
 * Out-of-range positions clamp to the nearest keyframe; non-finite
 * input falls back to step 1. Throws on an empty timeline — a lesson
 * without a sky keyframe is an invalid config.
 */
export function sampleAtmosphere(keyframes: SkyKeyframe[], position: number): AtmosphereSample {
  const n = keyframes.length;
  if (n === 0) {
    throw new Error('sampleAtmosphere: environment.skyTimeline must contain at least one keyframe.');
  }

  const p = Number.isFinite(position) ? Math.min(Math.max(position, 1), n) : 1;

  let indexA = Math.floor(p) - 1;
  let mix = p - Math.floor(p);
  if (indexA >= n - 1) {
    // On or above the final keyframe — pin to it (no outgoing blend).
    indexA = n - 1;
    mix = 0;
  }
  const indexB = Math.min(indexA + 1, n - 1);

  const a = keyframes[indexA];
  const b = keyframes[indexB];

  // directionalIntensity is optional per keyframe. If neither adjacent
  // keyframe sets it, return undefined so the consumer can fall back to the
  // lesson-level constant. If exactly one defines it, hold that value across
  // the blend (no extrapolation from a missing endpoint). If both define it,
  // lerp normally.
  const dirA = a.directionalIntensity;
  const dirB = b.directionalIntensity;
  let directionalIntensity: number | undefined;
  if (dirA !== undefined && dirB !== undefined) {
    directionalIntensity = lerp(dirA, dirB, mix);
  } else if (dirA !== undefined) {
    directionalIntensity = dirA;
  } else if (dirB !== undefined) {
    directionalIntensity = dirB;
  }

  const activeIndex = Math.min(n - 1, Math.max(0, Math.round(p) - 1));

  return {
    indexA,
    indexB,
    mix,
    lightRotation: [
      lerp(a.lightRotation[0], b.lightRotation[0], mix),
      lerp(a.lightRotation[1], b.lightRotation[1], mix),
      lerp(a.lightRotation[2], b.lightRotation[2], mix)
    ],
    iblIntensity: lerp(a.iblIntensity, b.iblIntensity, mix),
    directionalIntensity,
    activeIndex
  };
}
