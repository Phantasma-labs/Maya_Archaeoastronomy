import React, { useRef } from 'react';
import { SkyKeyframe } from '../types/lesson.types';
import { displayLabel } from '../utils/atmosphere';

interface AtmosphereTimelineProps {
  /** Ordered timeline keyframes (step i+1 ↔ keyframes[i]). */
  keyframes: Pick<SkyKeyframe, 'id' | 'name' | 'meta' | 'callout'>[];
  /** Continuous position in [1, N]. Integer = exactly on a keyframe. */
  value: number;
  /** Live scrubbing (drag / track click). */
  onLiveChange: (position: number) => void;
  /** Step-marker / keyboard step navigation — parent runs the eased sweep. */
  onStepSelect: (step: number) => void;
}

/**
 * AtmosphereTimeline — the lesson's single environment control (ADR-001).
 *
 * Bare full-width slider over the hardcoded sky keyframes (track, fill, and
 * thumb only — no step labels):
 *   - Drag the track / thumb → live scrub; value stays where dropped
 *     (no snap-back); in-between positions crossfade sky A↔B + lerp
 *     sun rotation and IBL intensity.
 *   - Arrow keys → parent eases the value step to step (~0.6 s) so the
 *     in-between sweep stays visible.
 *
 * Pure controlled input: every value write flows up through the callbacks
 * to the page-level single writer.
 */
export const AtmosphereTimeline: React.FC<AtmosphereTimelineProps> = ({
  keyframes,
  value,
  onLiveChange,
  onStepSelect
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const N = keyframes.length;

  if (N < 2) return null; // single-keyframe timeline → nothing to slide

  const clamp01 = (p: number) => Math.min(Math.max(p, 1), N);

  // Translate a pointer X coordinate into a timeline position.
  const positionFromClientX = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return clamp01(1 + ratio * (N - 1));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    onLiveChange(positionFromClientX(e.clientX));
  };

  // Thumb press — the draggable knob. It captures its own pointer so it
  // stays grabbable even at the track extremes (Step 1 / Step N).
  const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    onLiveChange(positionFromClientX(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    onLiveChange(positionFromClientX(e.clientX));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Mid-blend: Right sweeps to the next step up; on an exact step it
    // sweeps one further. Mirrors for Left. Home/End hit the extremes.
    const exact = Math.abs(value - Math.round(value)) < 0.001;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onStepSelect(exact ? Math.min(N, value + 1) : Math.ceil(value));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onStepSelect(exact ? Math.max(1, value - 1) : Math.floor(value));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onStepSelect(1);
    } else if (e.key === 'End') {
      e.preventDefault();
      onStepSelect(N);
    }
  };

  // Display state: nearest keyframe is "active" — drives the slider's
  // accessible value text.
  const activeIndex = Math.min(Math.max(Math.round(value) - 1, 0), N - 1);
  // Edge-inset position (0..1) for the thumb/fill — keeps the thumb (16px,
  // half 8px) fully inside the track at both extremes. For N=2 this fixes
  // the overflow where the percentage-based centering pushed the step-2
  // marker and the thumb past the track boundary.
  const trackInsetRatio = N > 1 ? (value - 1) / (N - 1) : 0;
  // 0.75rem = 12px — half of the 24px thumb hit area (touch targets ≥ 24px).
  // The visual knob inside is 16px; the inset keeps the full hit area inside
  // the track at both extremes.
  const thumbInsetRem = 0.75;
  const trackInsetStyle = (axis: 'left' | 'width') => ({
    [axis]: `calc(${thumbInsetRem}rem + (100% - ${thumbInsetRem * 2}rem) * ${trackInsetRatio})`
  });

  return (
    <div className="pointer-events-auto w-full">
      {/* Slider track */}
      <div
        ref={trackRef}
        role="slider"
        aria-label="Atmosphere timeline"
        aria-valuemin={1}
        aria-valuemax={N}
        aria-valuenow={Math.round(value * 100) / 100}
        aria-valuetext={displayLabel(keyframes[activeIndex])}
        tabIndex={0}
        className="relative h-8 cursor-pointer touch-none select-none outline-none focus-visible:ring-1 focus-visible:ring-maya-gold/60 rounded"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
      >
        {/* Rail */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-maya-surfaceHover border border-maya-gold/20" />
        {/* Fill up to the thumb — inset so it ends at the thumb's center. */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full bg-gradient-to-r from-maya-goldDark via-maya-gold to-maya-goldLight"
          style={trackInsetStyle('width')}
        />
        {/* Thumb (draggable handle — captures its own pointer so it stays
            grabbable at the track extremes) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing touch-none"
          style={trackInsetStyle('left')}
          onPointerDown={handleThumbPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* 16px visual knob inside a 24px hit area. */}
          <div className="w-4 h-4 rounded-full bg-maya-goldLight border-2 border-maya-gold shadow-[0_0_10px_rgba(212,175,55,0.45)]" />
        </div>
      </div>

      {/* Step context reaches assistive tech via aria-valuetext; navigation
          is drag + arrow keys / Home / End. */}
    </div>
  );
};
