// Dev-only sanity check for the sunrise helpers — run with: node scripts/check-sunrise.ts
// (Node 24 executes .ts directly via type stripping; no test runner or new
// dependency is added — see the repo's "no test scripts" rule.)
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  KEY_DATES,
  activeKeyDate,
  clampPredictionDeg,
  dateLabel,
  judgePrediction,
  positionToAzimuthDeg,
  positionToDay
} from '../src/lessons/lesson02/sunPath.ts';
import { BUILDINGS, OBSERVER_XZ } from '../src/lessons/lesson02/site.ts';
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

// ---- Lesson 02 ----
assert.equal(KEY_DATES.length, 5);
[1, 2, 3, 4, 5].forEach((p, i) =>
  near(positionToAzimuthDeg(p), [114.64, 90, 65.36, 90, 114.64][i])
);
near(positionToDay(1), -11);
near(positionToDay(3), 171);
near(positionToDay(2.5), 78 + 46.5);
// range safety
near(positionToDay(0), -11);
near(positionToDay(6), 354);
near(positionToDay(NaN), -11);
assert.ok(Number.isFinite(positionToAzimuthDeg(4.999)));
// monotone swing: Dec->Jun northward (azimuth falls), Jun->Dec southward
assert.ok(
  positionToAzimuthDeg(2.5) < positionToAzimuthDeg(2) &&
    positionToAzimuthDeg(3.5) > positionToAzimuthDeg(3)
);
assert.equal(dateLabel(171), 'Jun 21');
assert.equal(dateLabel(-11), 'Dec 21');
assert.equal(dateLabel(264), 'Sep 22');
assert.equal(activeKeyDate(3), 2);
assert.equal(activeKeyDate(2.5), null);
assert.equal(activeKeyDate(3 + 3 / 93), 2);
assert.equal(activeKeyDate(3 + 4 / 93), null);
// prediction
assert.equal(clampPredictionDeg(10), 30);
assert.equal(clampPredictionDeg(170), 150);
assert.equal(clampPredictionDeg(NaN), 90);
assert.equal(judgePrediction(68), 'right-on');
assert.equal(judgePrediction(78), 'close');
assert.equal(judgePrediction(100), 'too-south');
assert.equal(judgePrediction(40), 'too-north');
// buildings sit exactly on the key bearings from the observer
for (const [id, az] of [
  ['E-I', 65.36],
  ['E-II', 90],
  ['E-III', 114.64]
] as const) {
  const b = BUILDINGS.find((x) => x.id === id);
  assert.ok(b);
  const dx = b.xz[0] - OBSERVER_XZ[0];
  const dz = b.xz[1] - OBSERVER_XZ[1];
  near((Math.atan2(dx, -dz) * 180) / Math.PI, az, 0.1);
}
console.log('check-sunrise: lesson02 OK');
