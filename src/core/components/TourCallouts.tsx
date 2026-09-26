import React from 'react';
import { TourCallout, TourSample } from '../types/lesson.types';
import { projectToScreen } from '../utils/tour';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './ViewportScaler';

interface TourCalloutsProps {
  callouts: TourCallout[];
  /** Derived camera pose for the current tour position (see `sampleTour`). */
  sample: Pick<TourSample, 'eye' | 'target'>;
  /** Vertical field of view in degrees (CameraConfig.fov). */
  fov: number;
  /** 0..1 — see `tourSettle`. Arrows fade out while the camera is sweeping. */
  opacity: number;
}

/**
 * TourCallouts — 2D arrows + labels pointing at 3D features (ADR-001: purely
 * derived, no state). Each callout's world-space anchor is projected through
 * the tour camera by the pure `projectToScreen` and drawn in the overlay's
 * 1280×720 design space. That space has the same 16:9 aspect as the canvas
 * frame and ViewportScaler fills the frame exactly, so no access to the R3F
 * camera is needed and the arrows scale with the rest of the overlay.
 *
 * Decorative: the step panel carries the meaning, so the layer is aria-hidden
 * and pointer-transparent. Callouts whose anchor is off-screen or behind the
 * camera are simply not drawn.
 */
export const TourCallouts: React.FC<TourCalloutsProps> = ({ callouts, sample, fov, opacity }) => {
  if (opacity <= 0.01 || callouts.length === 0) return null;
  const aspect = DESIGN_WIDTH / DESIGN_HEIGHT;

  const placed = callouts.flatMap((callout) => {
    const p = projectToScreen(sample, fov, aspect, callout.anchor);
    if (!p.visible) return [];
    const ax = p.x * DESIGN_WIDTH;
    const ay = p.y * DESIGN_HEIGHT;
    return [{ callout, ax, ay, lx: ax + callout.offset[0], ly: ay + callout.offset[1] }];
  });
  if (placed.length === 0) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ opacity }}>
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${DESIGN_WIDTH} ${DESIGN_HEIGHT}`}
      >
        <defs>
          <marker
            id="tour-arrowhead"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="9"
            markerHeight="9"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 Z" fill="#f3e5ab" />
          </marker>
        </defs>
        {placed.map(({ callout, ax, ay, lx, ly }) => (
          <line
            key={callout.id}
            x1={lx}
            y1={ly}
            x2={ax}
            y2={ay}
            stroke="#f3e5ab"
            strokeWidth="1.5"
            markerEnd="url(#tour-arrowhead)"
          />
        ))}
      </svg>
      {placed.map(({ callout, lx, ly }) => (
        <span
          key={callout.id}
          className="absolute whitespace-nowrap rounded-full border border-maya-gold/60 bg-maya-surface/95 px-2.5 py-1 font-mono text-[11px] text-maya-cream"
          style={{ left: lx, top: ly, transform: 'translate(-50%, -50%)' }}
        >
          {callout.label}
        </span>
      ))}
    </div>
  );
};
