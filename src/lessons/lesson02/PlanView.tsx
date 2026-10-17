// Lesson 02 plan view: a north-up SVG mini-map of Group E. SVG x/y are world x/z
// (x-right = east, y-down = south), so an azimuth A (from north through east) points
// along (sin A, −cos A) — the same frame as the 3D scene.
import { useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, ReactElement } from 'react';
import { BUILDINGS, OBSERVER_XZ } from './site.ts';
import type { BuildingId } from './site.ts';
import { PREDICTION_ARC_DEG, clampPredictionDeg } from './sunPath.ts';

export interface PlanViewProps {
  azimuthDeg: number;
  activeId: BuildingId | null;
  prediction: number | null;
  predicting: boolean;
  onPredict: (azimuthDeg: number) => void;
}

const ARC_RADIUS = 110; // metres from the observer, beyond the eastern platform
const REAL_BAND_DEG: [number, number] = [65, 115];
const KEY_STEP_DEG = 2;
const BUILDING_SIZE = 10;
const DEFAULT_CURSOR_DEG = 90;

// Footprints in world x/z (metres) from the site survey.
const SUB_FOOTPRINT = { x: -65.8, z: -13.8, w: 27.8, h: 27.7 };
const PLATFORM_FOOTPRINT = { x: 15.6, z: -41.5, w: 38.1, h: 84.4 };

const [OX, OZ] = OBSERVER_XZ;
const toRad = (deg: number): number => (deg * Math.PI) / 180;

const pointAt = (azDeg: number, radius = ARC_RADIUS): { x: number; y: number } => ({
  x: OX + radius * Math.sin(toRad(azDeg)),
  y: OZ - radius * Math.cos(toRad(azDeg))
});

const arcPath = (fromDeg: number, toDeg: number): string => {
  const a = pointAt(fromDeg);
  const b = pointAt(toDeg);
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${ARC_RADIUS} ${ARC_RADIUS} 0 ${large} 1 ${b.x} ${b.y}`;
};

const buildingAzimuthDeg = (xz: [number, number]): number =>
  (Math.atan2(xz[0] - OX, -(xz[1] - OZ)) * 180) / Math.PI;

export function PlanView({
  azimuthDeg,
  activeId,
  prediction,
  predicting,
  onPredict
}: PlanViewProps): ReactElement {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursorDeg, setCursorDeg] = useState(DEFAULT_CURSOR_DEG);

  const handleArcClick = (event: MouseEvent<SVGPathElement>): void => {
    if (!predicting) return;
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return;
    // getScreenCTM accounts for the overlay's CSS scale (ViewportScaler).
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const local = pt.matrixTransform(ctm.inverse());
    const az = (Math.atan2(local.x - OX, -(local.y - OZ)) * 180) / Math.PI;
    const clamped = clampPredictionDeg(az);
    setCursorDeg(clamped);
    onPredict(clamped);
  };

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>): void => {
    if (!predicting) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const step = event.key === 'ArrowLeft' ? -KEY_STEP_DEG : KEY_STEP_DEG;
      setCursorDeg((d) => clampPredictionDeg(d + step));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      onPredict(clampPredictionDeg(cursorDeg));
    }
  };

  const sun = pointAt(azimuthDeg);
  const guess = prediction === null ? null : pointAt(prediction);
  const cursor = pointAt(cursorDeg);
  const [arcFrom, arcTo] = PREDICTION_ARC_DEG;

  const label =
    `Plan map of Uaxactún Group E, north at the top. The observer stands at the left, ` +
    `looking east toward three buildings. The sun is rising at ${Math.round(azimuthDeg)} degrees ` +
    `from north, measured through east.`;

  return (
    <svg
      ref={svgRef}
      viewBox="-76 -108 170 216"
      className="h-auto w-full select-none text-maya-gold"
      role="group"
      aria-label={label}
    >
      {/* Footprints */}
      <rect
        x={SUB_FOOTPRINT.x}
        y={SUB_FOOTPRINT.z}
        width={SUB_FOOTPRINT.w}
        height={SUB_FOOTPRINT.h}
        className="fill-maya-surfaceHover stroke-maya-textDim"
        strokeWidth={0.6}
      />
      <text
        x={SUB_FOOTPRINT.x + SUB_FOOTPRINT.w / 2}
        y={SUB_FOOTPRINT.z - 2.5}
        textAnchor="middle"
        fontSize={5.5}
        className="fill-maya-textDim"
      >
        E-VII-sub
      </text>
      <rect
        x={PLATFORM_FOOTPRINT.x}
        y={PLATFORM_FOOTPRINT.z}
        width={PLATFORM_FOOTPRINT.w}
        height={PLATFORM_FOOTPRINT.h}
        className="fill-maya-surface stroke-maya-textDim"
        strokeWidth={0.6}
        strokeDasharray="2 1.5"
      />

      {/* Real sunrise band, subtle */}
      <path
        d={arcPath(REAL_BAND_DEG[0], REAL_BAND_DEG[1])}
        fill="none"
        className="stroke-maya-gold/20"
        strokeWidth={8}
      />

      {/* Sightlines: faint, the active one bright */}
      {BUILDINGS.map((b) => {
        const az = buildingAzimuthDeg(b.xz);
        const end = pointAt(az);
        const active = b.id === activeId;
        return (
          <line
            key={`ray-${b.id}`}
            x1={OX}
            y1={OZ}
            x2={end.x}
            y2={end.y}
            className={active ? 'stroke-maya-goldLight' : 'stroke-maya-gold/25'}
            strokeWidth={active ? 1.2 : 0.6}
            strokeDasharray={active ? undefined : '3 2'}
          />
        );
      })}

      {/* Buildings */}
      {BUILDINGS.map((b) => {
        const active = b.id === activeId;
        return (
          <g key={b.id}>
            <rect
              x={b.xz[0] - BUILDING_SIZE / 2}
              y={b.xz[1] - BUILDING_SIZE / 2}
              width={BUILDING_SIZE}
              height={BUILDING_SIZE}
              className={
                active
                  ? 'fill-maya-gold/40 stroke-maya-goldLight'
                  : 'fill-maya-goldDark/30 stroke-maya-goldDark'
              }
              strokeWidth={active ? 1.2 : 0.8}
            />
            <text
              x={b.xz[0]}
              y={b.xz[1] + BUILDING_SIZE / 2 + 6}
              textAnchor="middle"
              fontSize={6}
              className={active ? 'fill-maya-cream' : 'fill-maya-text'}
            >
              {b.id}
            </text>
          </g>
        );
      })}

      {/* Horizon arc (visible line) */}
      <path
        d={arcPath(arcFrom, arcTo)}
        fill="none"
        className="stroke-maya-textDim"
        strokeWidth={0.8}
      />

      {/* Observer */}
      <circle cx={OX} cy={OZ} r={2.4} className="fill-maya-cream" />
      <text x={OX} y={OZ + 8} textAnchor="middle" fontSize={5.5} className="fill-maya-textDim">
        You
      </text>

      {/* Sun */}
      <circle cx={sun.x} cy={sun.y} r={4} className="fill-maya-goldLight stroke-maya-gold" />

      {/* Prediction marker */}
      {guess && (
        <g className="stroke-maya-cream" fill="none" strokeWidth={1.2}>
          <circle cx={guess.x} cy={guess.y} r={5} />
          <line x1={guess.x - 7} y1={guess.y} x2={guess.x + 7} y2={guess.y} />
          <line x1={guess.x} y1={guess.y - 7} x2={guess.x} y2={guess.y + 7} />
        </g>
      )}

      {/* Prediction input: wide hit target on the arc, plus keyboard cursor */}
      {predicting && (
        <g
          tabIndex={0}
          role="slider"
          aria-label="Predict the sunrise direction"
          aria-valuemin={arcFrom}
          aria-valuemax={arcTo}
          aria-valuenow={Math.round(cursorDeg)}
          aria-valuetext={`${Math.round(cursorDeg)} degrees from north`}
          onKeyDown={handleKeyDown}
          className="cursor-crosshair outline-none [&:focus-visible>path.ring]:stroke-maya-cream"
        >
          <path
            className="ring fill-none stroke-transparent"
            d={arcPath(arcFrom, arcTo)}
            strokeWidth={14}
            onClick={handleArcClick}
          />
          <circle
            cx={cursor.x}
            cy={cursor.y}
            r={3}
            className="pointer-events-none fill-maya-cream/70 stroke-maya-cream"
            strokeWidth={0.8}
          />
        </g>
      )}

      {/* North arrow */}
      <g transform="translate(-62 -92)" className="text-maya-text">
        <path d="M 0 -9 L 4 3 L 0 0.5 L -4 3 Z" fill="currentColor" />
        <text y={13} textAnchor="middle" fontSize={6} fill="currentColor">
          N
        </text>
      </g>
    </svg>
  );
}
