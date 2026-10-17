// Pure sunrise geometry (no imports, so scripts/check-sunrise.ts runs it under
// Node's type stripping). World frame: east +X, up +Y, north −Z.

const DEG = Math.PI / 180;

/**
 * Azimuth of the rising sun, in degrees measured from north through east.
 * Flat horizon, no atmospheric refraction: cos A = sin δ / cos φ.
 *
 * @param declinationDeg solar declination δ in degrees (±23.44° at the solstices)
 * @param latitudeDeg observer latitude φ in degrees (north positive)
 * @returns azimuth in degrees (90° = due east); the arccos argument is clamped
 *          to [−1, 1] so polar-day latitudes never yield NaN
 */
export function sunriseAzimuthDeg(declinationDeg: number, latitudeDeg: number): number {
  const c = Math.sin(declinationDeg * DEG) / Math.cos(latitudeDeg * DEG);
  return Math.acos(Math.min(1, Math.max(-1, c))) / DEG;
}

/**
 * Unit vector pointing at the sun, in the world frame (east +X, up +Y, north −Z).
 *
 * @param azimuthDeg azimuth in degrees from north through east
 * @param elevationDeg elevation above the horizon in degrees
 */
export function sunDirection(azimuthDeg: number, elevationDeg: number): [number, number, number] {
  const a = azimuthDeg * DEG;
  const e = elevationDeg * DEG;
  return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)];
}

/**
 * Euler angles (radians, order 'YXZ') for `SceneLighting` that rotate the
 * reference direction (0, 1, 0) onto `sunDirection(azimuthDeg, elevationDeg)`.
 * Rx(θ) then Ry(φ) of (0,1,0) gives (sinθ·sinφ, cosθ, sinθ·cosφ), hence
 * θ = π/2 − e and φ = π − A.
 *
 * @param azimuthDeg azimuth in degrees from north through east
 * @param elevationDeg elevation above the horizon in degrees
 */
export function sunLightRotation(azimuthDeg: number, elevationDeg: number): [number, number, number] {
  return [Math.PI / 2 - elevationDeg * DEG, Math.PI - azimuthDeg * DEG, 0];
}
