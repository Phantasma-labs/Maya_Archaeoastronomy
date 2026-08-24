import React, { useRef } from 'react';

interface AtmosphereTimelineProps {
  /** Ordered timeline keyframes (step i+1 ↔ keyframes[i]). */
  keyframes: { id: string; name: string }[];
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
  const lowerIndex = Math.min(Math.floor(value) - 1, N - 1);
  const upperIndex = Math.min(lowerIndex + 1, N - 1);
  const mix = Math.min(Math.max(value - Math.floor(value), 0), 1);
  const blending = mix > 0.001 && lowerIndex !== upperIndex;
  const activeIndex = Math.min(Math.max(Math.round(value) - 1, 0), N - 1);
  const thumbPercent = ((value - 1) / (N - 1)) * 100;

  return (
    <div className="pointer-events-auto w-full bg-[#12151e]/85 backdrop-blur-md border border-[#d4af37]/25 rounded-2xl px-4 pt-2.5 pb-3 shadow-lg">
      {/* Readout: current atmosphere state */}
      <div className="flex items-center justify-between text-[10px] font-mono mb-2">
        <span className="uppercase tracking-wider text-[#8e897e]">Atmosphere</span>
        <span className="text-[#d4af37] truncate">
          {blending
            ? `${keyframes[lowerIndex].name} ↔ ${keyframes[upperIndex].name} ${Math.round(mix * 100)}%`
            : keyframes[activeIndex].name}
        </span>
      </div>

      {/* Slider track */}
      <div
        ref={trackRef}
        role="slider"
        aria-label="Atmosphere timeline"
        aria-valuemin={1}
        aria-valuemax={N}
        aria-valuenow={Math.round(value * 100) / 100}
        aria-valuetext={keyframes[activeIndex].name}
        tabIndex={0}
        className="relative h-8 flex items-center cursor-pointer touch-none select-none outline-none focus-visible:ring-1 focus-visible:ring-[#d4af37]/60 rounded"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
      >
        {/* Rail */}
        <div className="absolute left-0 right-0 h-1 rounded-full bg-[#1c202a] border border-[#d4af37]/20" />
        {/* Fill up to the thumb */}
        <div
          className="absolute left-0 h-1 rounded-full bg-gradient-to-r from-[#8b6b23] via-[#d4af37] to-[#f3e5ab]"
          style={{ width: `${thumbPercent}%` }}
        />
        {/* Step markers (click → eased sweep via parent) */}
        {keyframes.map((keyframe, i) => {
          const step = i + 1;
          const left = ((step - 1) / (N - 1)) * 100;
          const isActive = i === activeIndex && !blending;
          return (
            <button
              key={keyframe.id}
              data-step-marker
              type="button"
              title={`${step}. ${keyframe.name}`}
              aria-label={`Sweep to ${keyframe.name}`}
              onClick={() => onStepSelect(step)}
              className={`absolute w-3 h-3 -translate-x-1/2 rotate-45 border transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#d4af37] border-[#f3e5ab] scale-110'
                  : 'bg-[#12151e] border-[#d4af37]/50 hover:border-[#d4af37] hover:bg-[#8b6b23]/50'
              }`}
              style={{ left: `${left}%` }}
            />
          );
        })}
        {/* Thumb (visual only — the track handles all input) */}
        <div
          className="absolute w-4 h-4 -translate-x-1/2 rounded-full bg-[#f3e5ab] border-2 border-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.45)] pointer-events-none"
          style={{ left: `${thumbPercent}%` }}
        />
      </div>

      {/* Step labels */}
      <div className="relative h-4 mt-1 text-[9px] font-mono uppercase tracking-wider">
        {keyframes.map((keyframe, i) => {
          const step = i + 1;
          const left = ((step - 1) / (N - 1)) * 100;
          const isActive = i === activeIndex && !blending;
          return (
            <button
              key={keyframe.id}
              data-step-marker
              type="button"
              onClick={() => onStepSelect(step)}
              className={`absolute -translate-x-1/2 truncate max-w-[33%] transition-colors cursor-pointer ${
                isActive ? 'text-[#f3e5ab]' : 'text-[#8e897e] hover:text-[#d4af37]'
              }`}
              style={{ left: `${left}%` }}
            >
              {keyframe.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};