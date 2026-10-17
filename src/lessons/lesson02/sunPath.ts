// Lesson 02 sun path: slider position (1–5) → date, declination, sunrise azimuth,
// plus the "predict the sunrise" judging logic. Pure functions, no three.js.
import { sunriseAzimuthDeg } from '../../core/utils/sunrise.ts';
import { LATITUDE_DEG } from './site.ts';
import type { BuildingId } from './site.ts';

const MAX_DECLINATION_DEG = 23.44;
const DATE_EPSILON_DAYS = 1e-6;
const SEGMENTS = 4;

/** Day 0 = Jan 1 of a non-leap reference year; step i + 1 ↔ index i. */
export const KEY_DATES: { dayOfYear: number; label: string; building: BuildingId }[] = [
  { dayOfYear: -11, label: 'Dec 21', building: 'E-III' },
  { dayOfYear: 78, label: 'Mar 20', building: 'E-II' },
  { dayOfYear: 171, label: 'Jun 21', building: 'E-I' },
  { dayOfYear: 264, label: 'Sep 22', building: 'E-II' },
  { dayOfYear: 354, label: 'Dec 21', building: 'E-III' }
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const clampPosition = (position: number): number =>
  Number.isNaN(position) ? 1 : Math.min(KEY_DATES.length, Math.max(1, position));

/** Segment index k (0–3) and fraction t (0–1) within it, for a clamped position. */
const segmentOf = (position: number): { k: number; t: number } => {
  const p = clampPosition(position);
  const k = Math.min(Math.floor(p) - 1, SEGMENTS - 1);
  return { k, t: p - (k + 1) };
};

export function positionToDay(position: number): number {
  const { k, t } = segmentOf(position);
  const a = KEY_DATES[k].dayOfYear;
  const b = KEY_DATES[k + 1].dayOfYear;
  return a + (b - a) * t;
}

export function positionToDeclinationDeg(position: number): number {
  const { k, t } = segmentOf(position);
  const phase = ((-90 + 90 * (k + t)) * Math.PI) / 180;
  return MAX_DECLINATION_DEG * Math.sin(phase);
}

export function positionToAzimuthDeg(position: number): number {
  return sunriseAzimuthDeg(positionToDeclinationDeg(position), LATITUDE_DEG);
}

/** English "Mon D" label for a day of year (negative days wrap into the previous year). */
export function dateLabel(dayOfYear: number): string {
  const d = new Date(Date.UTC(2026, 0, 1 + Math.round(dayOfYear)));
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** Index into KEY_DATES whose day is within ±toleranceDays of the slider's day, else null. */
export function activeKeyDate(position: number, toleranceDays = 3): number | null {
  const day = positionToDay(position);
  const i = KEY_DATES.findIndex(
    (k) => Math.abs(k.dayOfYear - day) <= toleranceDays + DATE_EPSILON_DAYS
  );
  return i === -1 ? null : i;
}

export const PREDICTION_ARC_DEG: [number, number] = [30, 150];

export function clampPredictionDeg(az: number): number {
  if (Number.isNaN(az)) return 90;
  return Math.min(PREDICTION_ARC_DEG[1], Math.max(PREDICTION_ARC_DEG[0], az));
}

export type PredictionResult = 'right-on' | 'close' | 'too-south' | 'too-north';

const PREDICTION_TARGET_DEG = 65.36;

export function judgePrediction(guessDeg: number): PredictionResult {
  const delta = guessDeg - PREDICTION_TARGET_DEG;
  if (Math.abs(delta) <= 5) return 'right-on';
  if (Math.abs(delta) <= 15) return 'close';
  return delta > 0 ? 'too-south' : 'too-north';
}

/** Sun elevation (degrees) shown at every sunrise step; shared by the disc and the light. */
export const SUN_ELEVATION_DEG = 4;
