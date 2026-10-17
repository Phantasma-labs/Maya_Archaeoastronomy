// Lesson 02 site geometry (Uaxactún Group E). World frame: north = −Z, east = +X.
// Lesson-owned data; the observer sits on the E-II bearing so each building
// lies exactly on a key sunrise azimuth (65.36° / 90° / 114.64°).

export const LATITUDE_DEG = 17.394;

export const OBSERVER_XZ: [number, number] = [-40, 0];

export type BuildingId = 'E-I' | 'E-II' | 'E-III';

export const BUILDINGS: { id: BuildingId; xz: [number, number] }[] = [
  { id: 'E-I', xz: [35, -34.4] },
  { id: 'E-II', xz: [35, 0] },
  { id: 'E-III', xz: [35, 34.4] }
];
