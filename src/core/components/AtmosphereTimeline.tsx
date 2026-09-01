import React, { useRef } from 'react';

interface AtmosphereTimelineProps {
  /** Ordered timeline keyframes (step i+1 ↔ keyframes[i]). */
  keyframes: {
    id: string;
    name: string;
    /** Calendar date label (e.g. "May 23") — preferred over callout.label
     *  when present (V02 design plan §4: dates read as the primary label). */
    meta?: { dateLabel?: string };
    /** Optional pedagogical label — preferred over `name` when present. */
    callout?: { label?: string; sublabel?: string; tooltip?: string };
  }[];
  /** Continuous position in [1, N]. Integer = exactly on a keyframe. */
  value: number;
  /** Live scrubbing (drag / track click). */
  onLiveChange: (position: number) => void;
  /** Step-marker / keyboard step navigation — parent runs the eased sweep. */
  onStepSelect: (step: number) => void;
}

/** Display label prefers the calendar date, then the callout label, then the keyframe name. */
const displayLabel = (kf: AtmosphereTimelineProps['keyframes'][number]) =>
  kf.meta?.dateLabel ?? kf.callout?.label ?? kf.name;

/**
 * AtmosphereTimeline — the lesson's single environment control (ADR-001).
 *
 * Continuous horizontal slider over the hardcoded sky keyframes:
 *   - Drag / click the track  → live scrub; value stays where dropped
 *     (no snap-back); in-between positions crossfade sky A↔B + lerp
 *     sun rotation and IBL intensity.
 *   - Click a step marker or use arrow keys → parent eases the value to
 *     that step (~0.6 s) so the in-between sweep stays visible.
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
    // Step markers handle their own clicks — skip them here so a marker
    // click sweeps (via onStepSelect) instead of hard-jumping.
    if ((e.target as HTMLElement).closest('[data-step-marker]')) return;
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    onLiveChange(positionFromClientX(e.clientX));
  };

  // Thumb press — the draggable knob. Unlike the track, grabbing the thumb
  // never skips on step markers, so it stays grabbable even when it sits
  // exactly on top of a marker at the track extremes (Step 1 / Step N).
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

  // Display state: nearest keyframe is "active"; mid-segment shows the blend.
  const mix = Math.min(Math.max(value - Math.floor(value), 0), 1);
  const blending = mix > 0.001;
  const activeIndex = Math.min(Math.max(Math.round(value) - 1, 0), N - 1);
  // Edge-inset position (0..1) for the thumb/fill — keeps the thumb (16px,
  // half 8px) fully inside the track at both extremes. For N=2 this fixes
  // the overflow where the percentage-based centering pushed the step-2
  // marker and the thumb past the track boundary.
  const trackInsetRatio = N > 1 ? (value - 1) / (N - 1) : 0;
  // 0.75rem = 12px — half of the 24px thumb hit area (V02 Phase E: touch
  // targets ≥ 24px). The visual knob inside is 16px; the inset keeps the
  // full hit area inside the track at both extremes.
  const thumbInsetRem = 0.75;
  const trackInsetStyle = (axis: 'left' | 'width') => ({
    [axis]: `calc(${thumbInsetRem}rem + (100% - ${thumbInsetRem * 2}rem) * ${trackInsetRatio})`
  });

  return (
    <div className="pointer-events-auto w-full bg-maya-surface/85 backdrop-blur-md border border-maya-gold/25 rounded-2xl px-4 pt-2.5 pb-3 shadow-lg">
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
        {/* Step markers — flex justify-between so the first/last markers sit
            at the track edges fully inside, regardless of N. The previous
            percentage-based centering caused both markers to clip the track
            boundary on a 2-step timeline (the "Step 2 button doesn't respond"
            bug). `pointer-events-none` on the wrapper lets the track own
            pointer events; each marker re-enables them. */}
        <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
          {keyframes.map((keyframe, i) => {
            const step = i + 1;
            const isActive = i === activeIndex && !blending;
            const titleText = keyframe.callout?.tooltip
              ? `${step}. ${displayLabel(keyframe)} — ${keyframe.callout.tooltip}`
              : `${step}. ${displayLabel(keyframe)}`;
            return (
              <button
                key={keyframe.id}
                data-step-marker
                type="button"
                title={titleText}
                aria-label={`Sweep to ${displayLabel(keyframe)}`}
                onClick={() => onStepSelect(step)}
                className="pointer-events-auto w-6 h-6 flex items-center justify-center cursor-pointer"
              >
                {/* 12px visual diamond inside a 24px hit area (V02 Phase E). */}
                <span
                  className={`w-3 h-3 rotate-45 border transition-all ${
                    isActive
                      ? 'bg-maya-gold border-maya-goldLight scale-110'
                      : 'bg-maya-surface border-maya-gold/50 hover:border-maya-gold hover:bg-maya-goldDark/50'
                  }`}
                />
              </button>
            );
          })}
        </div>
        {/* Thumb (draggable handle — captures its own pointer so it stays
            grabbable even when it overlaps a step marker at the extremes) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing touch-none"
          style={trackInsetStyle('left')}
          onPointerDown={handleThumbPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* 16px visual knob inside a 24px hit area (V02 Phase E). */}
          <div className="w-4 h-4 rounded-full bg-maya-goldLight border-2 border-maya-gold shadow-[0_0_10px_rgba(212,175,55,0.45)]" />
        </div>
      </div>

      {/* Step labels — flex justify-between with edge-aligned text so labels
          stay inside the track at any N (no left/right half overflow on N=2). */}
      <div className="flex justify-between items-center h-4 mt-1 text-[11px] font-mono uppercase tracking-wider gap-2">
        {keyframes.map((keyframe, i) => {
          const step = i + 1;
          const isFirst = i === 0;
          const isLast = i === N - 1;
          const align = isFirst ? 'text-left' : isLast ? 'text-right' : 'text-center';
          const isActive = i === activeIndex && !blending;
          return (
            <button
              key={keyframe.id}
              data-step-marker
              type="button"
              onClick={() => onStepSelect(step)}
              title={
                keyframe.callout?.sublabel ?? keyframe.callout?.tooltip ?? displayLabel(keyframe)
              }
              className={`truncate max-w-[34%] transition-colors cursor-pointer ${align} ${
                isActive ? 'text-maya-goldLight' : 'text-maya-textDim hover:text-maya-gold'
              }`}
            >
              {displayLabel(keyframe)}
            </button>
          );
        })}
      </div>
    </div>
  );
};
