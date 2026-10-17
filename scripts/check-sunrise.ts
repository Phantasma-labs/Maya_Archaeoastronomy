// Dev-only sanity check for the sunrise helpers — run with: node scripts/check-sunrise.ts
// (Node 24 executes .ts directly via type stripping; no test runner or new
// dependency is added — see the repo's "no test scripts" rule.)
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { sunDirection, sunLightRotation, sunriseAzimuthDeg } from '../src/core/utils/sunrise.ts';

const near = (a: number, b: number, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

// Sunrise azimuth at Uaxactún (17.394° N): solstices and equinox.
near(sunriseAzimuthDeg(23.44, 17.394), 65.36);
near(sunriseAzimuthDeg(0, 17.394), 90);
near(sunriseAzimuthDeg(-23.44, 17.394), 114.64);

// direction: due east on the horizon → +X
const d = sunDirection(90, 0);
near(d[0], 1);
near(d[1], 0);
near(d[2], 0);
// north-east at 65.36° → x>0, z<0 (north is −Z)
const ne = sunDirection(65.36, 0);
assert.ok(ne[0] > 0 && ne[2] < 0);

// sunLightRotation agrees with sunDirection when applied YXZ to (0,1,0)
for (const [a, e] of [
  [65.36, 5],
  [90, 5],
  [114.64, 5]
]) {
  const v = new THREE.Vector3(0, 1, 0).applyEuler(
    new THREE.Euler(...sunLightRotation(a, e), 'YXZ')
  );
  const s = sunDirection(a, e);
  near(v.x, s[0]);
  near(v.y, s[1]);
  near(v.z, s[2]);
}

console.log('check-sunrise: core OK');
