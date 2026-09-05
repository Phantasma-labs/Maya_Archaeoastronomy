import React, { useCallback, useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { SkyKeyframe } from '../../core/types/lesson.types';
import { displayLabel } from '../../core/utils/atmosphere';

interface SerpentSliderProps {
  /** Ordered timeline keyframes (step i+1 ↔ keyframes[i]). */
  keyframes: Pick<SkyKeyframe, 'id' | 'name' | 'meta' | 'callout'>[];
  /** Continuous position in [1, N]. Integer = exactly on a keyframe. */
  value: number;
  /** Live scrubbing (drag / track click). */
  onLiveChange: (position: number) => void;
  /** Step-marker / keyboard step navigation — parent runs the eased sweep. */
  onStepSelect: (step: number) => void;
}

/** Asset paths (lesson-owned; tracked under public/assets/lesson_01/). The
 *  head filename contains a trailing space — preserved verbatim from disk. */
const RAIL_URL = '/assets/lesson_01/snake_slider/snakeslider.webp';
const GLOW_URL = '/assets/lesson_01/snake_slider/snakesliderglow.webp';
const HEAD_URL = '/assets/lesson_01/snake_slider/snakesliderhead .webp';

/** Natural aspect of the authored rail art (1024×97). The slider track
 *  uses this ratio so the rail art renders at its native shape (no
 *  squash, no letterbox); the mask and head use pixel-precise coordinates
 *  against the measured track width so they stay in sync at any viewport. */
const TRACK_ASPECT = '1024 / 97';
/** Authored dimensions of the snake-head art (153×125). The head is
 *  taller than the rail (97px) and intentionally overflows the track
 *  vertically — it sits on top of the rail with its bottom edge anchored
 *  to the rail's baseline, like a slider knob sticking up out of a slot. */
const HEAD_WIDTH = 153;
const HEAD_HEIGHT = 125;
/** Head inset (px) from the track edges so the head never leaves the rail. */
const INSET = 12;
/** Framer Motion tween for the value→pixel mapping. Short enough to track
 *  the parent's eased step sweep without dragging behind it. */
const VALUE_TWEEN_S = 0.25;

/**
 * SerpentSlider — Lesson 01 "Serpent Descent" environment control.
 *
 * Layered image-based slider:
 *
 *   1. Dark rail (snakeslider.webp) — always visible.
 *   2. Illuminated rail (snakesliderglow.webp) — stacked over the dark
 *      rail. A CSS `clip-path: inset()` reveals the lit body from the
 *      left edge up to the head's center. At rest (head at left) the
 *      clip is fully inset (glow hidden); as the head moves right the
 *      clip un-insets from the right, growing the visible region.
 *      The clip-path produces a hard edge — no opacity ramp — so the
 *      lit boundary reads as a sharp sweep rather than a fade.
 *      `clip-path` on a `<div>` is the most reliably-painted mask
 *      primitive across browsers (motion-driven `mask-image` on
 *      `<motion.img>` historically fails to repaint).
 *   3. Head (snakesliderhead .webp) — sits on top of the rails so its
 *      left half occludes the seam where the lit glow ends; the
 *      boundary sits at the head's center rather than its leading
 *      edge, giving the illusion that the head drags a beam of light
 *      out behind it.
 *
 * The rail art (1024×97) is rendered at 100% of its authored pixel
 * size; the outer wrap caps the track at max-w-[1024px] so it never
 * grows wider than the source art. The head's natural pixel dimensions
 * (153×125) are taller than the rail (97px), so it renders at a fixed
 * authored size (153×125) with its bottom edge anchored to the rail's
 * baseline — it intentionally overflows the track's top edge as the
 * slider knob, so the head and rails stay in lockstep at every viewport
 * width up to the cap.
 *
 * Framer Motion owns the head position and the clip's right boundary
 * via motion values. The parent still owns the single `sliderPosition`
 * runtime value (ADR-001); the slider maps it to pixels and animates
 * the smoothing locally — no per-frame React re-renders.
 *
 * Accessibility contract matches AtmosphereTimeline: the container is
 * the `role="slider"` element; the art layers are aria-hidden.
 */
export const SerpentSlider: React.FC<SerpentSliderProps> = ({
  keyframes,
  value,
  onLiveChange,
  onStepSelect
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const [headWidth, setHeadWidth] = useState(0);

  // First-interaction latch — once the user has touched the slider
  // (pointerdown OR keydown on the track / head) the pre-engagement
  // glow pulse stops and the head settles into the same steady 0.35
  // halo it had before this change. Never resets for the lifetime of
  // the component (re-arm policy: never).
  const [hasInteracted, setHasInteracted] = useState(false);
  const handleEngaged = useCallback(() => setHasInteracted(true), []);
  // Scalar that drives the alpha component of the head's drop-shadow.
  // Pulses 0.15 ↔ 0.60 before interaction; settles to 0.35 after.
  const glowIntensity = useMotionValue(0.35);

  // 0..1 progress across the timeline. Drives the head's `left` and
  // the glow's clip-right boundary via useTransform, so they stay in
  // lockstep without re-rendering.
  const ratio = useMotionValue(0);
  const pxLeft = useTransform(ratio, (r) => {
    if (trackWidth <= 0 || headWidth <= 0) return INSET;
    return INSET + (trackWidth - 2 * INSET - headWidth) * r;
  });
  // Right-boundary of the visible glow region, measured from the left
  // edge of the track in pixels. Identical coordinate space to pxLeft.
  // The clip-path `inset()` reveals everything from the left up to this
  // px (and hides everything past it). The boundary lands at the head's
  // *center* (pxLeft + headWidth/2) so the lit body extends slightly
  // under the head — the head's left half occludes the seam, giving the
  // illusion that the lit glow flows out from behind the head.
  const revealPx = useTransform(ratio, (r) => {
    if (trackWidth <= 0) return 0;
    return INSET + (trackWidth - 2 * INSET - headWidth) * r + headWidth / 2;
  });
  // clip-path expects either percentages or px. We use px for precision.
  // inset(top right bottom left) — we clip from the right only: top=0,
  // right=(trackWidth − revealPx), bottom=0, left=0. Browsers accept
  // mixed units in a single inset() expression.
  const clipPath = useTransform(revealPx, (px) => {
    const rightInset = Math.max(trackWidth - px, 0);
    return `inset(0 ${rightInset}px 0 0)`;
  });
  // Motion-driven drop-shadow on the head. Geometry/blur stay fixed so
  // the halo's shape doesn't pulse — only the gold channel's alpha
  // sweeps. Driven by the pulse / settle effects below.
  const headFilter = useTransform(
    glowIntensity,
    (g) => `drop-shadow(0 0 8px rgba(212,175,55,${g.toFixed(3)}))`
  );

  const N = keyframes.length;

  // Measure the track and the head. ResizeObserver keeps both in sync
  // with viewport changes so the head's travel range never drifts.
  // We use `offsetWidth` (CSS layout box) instead of
  // `getBoundingClientRect().width` because the latter follows CSS
  // transforms and would shrink the head's travel range to whatever
  // the visual (post-transform) width ends up being — we want the
  // untransformed layout size.
  useEffect(() => {
    const track = trackRef.current;
    const head = headRef.current;
    if (!track || !head) return;
    const measure = () => {
      setTrackWidth(track.offsetWidth);
      setHeadWidth(head.offsetWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    ro.observe(head);
    return () => ro.disconnect();
  }, []);

  // Whenever the controlled `value` changes, tween the motion ratio
  // toward the new target. The clip boundary + head position glide
  // together from one tween.
  useEffect(() => {
    if (N < 2) return;
    const target = (value - 1) / (N - 1);
    const controls = animate(ratio, target, {
      duration: VALUE_TWEEN_S,
      ease: 'easeOut'
    });
    return () => controls.stop();
  }, [value, N, ratio]);

  // Pre-engagement pulse — soft 1.6s easeInOut sweep over alpha
  // 0.15 → 0.60 on the head's drop-shadow. The animation owns the
  // motion value while `!hasInteracted`; the cleanup (and the paired
  // settle effect below) releases it on first interaction.
  useEffect(() => {
    if (hasInteracted) return;
    const controls = animate(glowIntensity, [0.15, 0.6], {
      duration: 1.6,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'reverse'
    });
    return () => controls.stop();
  }, [hasInteracted, glowIntensity]);

  // Post-engagement settle — when the latch flips, smoothly glide the
  // motion value to the steady 0.35 alpha instead of freezing wherever
  // the pulse happened to be, so the head never pops on first click.
  useEffect(() => {
    if (!hasInteracted) return;
    const controls = animate(glowIntensity, 0.35, {
      duration: 0.4,
      ease: 'easeOut'
    });
    return () => controls.stop();
  }, [hasInteracted, glowIntensity]);

  if (N < 2) return null; // single-keyframe timeline → nothing to slide

  const clamp01 = (p: number) => Math.min(Math.max(p, 1), N);

  // Translate a pointer X coordinate into a timeline position.
  const positionFromClientX = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const r = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return clamp01(1 + r * (N - 1));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    handleEngaged();
    e.currentTarget.setPointerCapture(e.pointerId);
    onLiveChange(positionFromClientX(e.clientX));
  };

  // Head press — the draggable knob. It captures its own pointer so it stays
  // grabbable even at the track extremes (Step 1 / Step N).
  const handleHeadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    handleEngaged();
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
    if (
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End'
    ) {
      handleEngaged();
    }
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

  return (
    // Centered at the bottom of the screen. The track keeps its native
    // 1024:97 aspect (no squashing) and is capped at a sensible max-width
    // so it never grows wider than the rail art was authored for — the
    // slider renders the assets at 100% of their original pixel size.
    <div className="pointer-events-auto ml-auto w-full max-w-[1024px]">
      {/* Slider track — sized by its natural aspect ratio. The role=slider
          span fills the full width so keyboard / drag input works across
          the whole track, not just over the art. */}
      <div
        ref={trackRef}
        role="slider"
        aria-label="Serpent descent timeline"
        aria-valuemin={1}
        aria-valuemax={N}
        aria-valuenow={Math.round(value * 100) / 100}
        aria-valuetext={displayLabel(keyframes[activeIndex])}
        tabIndex={0}
        className="relative w-full cursor-pointer touch-none select-none outline-none focus-visible:ring-1 focus-visible:ring-maya-gold/60 rounded"
        style={{ aspectRatio: TRACK_ASPECT }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
      >
        {/* (no inline step labels — the art carries the visual narrative;
            step context reaches assistive tech via aria-valuetext) */}

        {/* Layer 1 — dark rail (full width). Stretches to fill the
            aspect-ratio box (which is the same shape as the source art),
            so no squashing. Always visible. */}
        <img
          src={RAIL_URL}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          style={{ objectFit: 'fill' }}
        />

        {/* Layer 2 — illuminated rail stacked over the dark rail. The
            wrapper uses `clip-path: inset(...)` driven by a Framer Motion
            value (`revealPx`) to reveal the lit body from the left edge
            up to the head's center. The clip is a hard edge — no
            opacity ramp — so the lit boundary reads as a sharp sweep
            rather than a fade.
            clip-path on a regular div is well-supported and reliably
            repaints on motion-value updates, unlike mask-image on
            motion.img which can fail to repaint. */}
        <motion.div
          ref={glowRef}
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ clipPath }}
        >
          <img
            src={GLOW_URL}
            alt=""
            draggable={false}
            className="block w-full h-full select-none"
            style={{ objectFit: 'fill' }}
          />
        </motion.div>

        {/* Layer 3 — the snake head (thumb). Drawn last so its opaque
            pixels sit on top of both rails. The clip's right boundary
            lands at the head's center, so the head's left half
            occludes the seam where the lit glow ends — the head
            appears to drag a beam of light out behind it.
            Renders at the head's natural pixel dimensions (153×125):
            anchored to the rail's bottom baseline (`bottom-0`), it sits
            on top of the rail like a slider knob sticking up out of a
            slot (the head is 28px taller than the rail). Width and
            height are fixed so the head keeps its authored aspect at
            every viewport. */}
        <motion.div
          ref={headRef}
          className="absolute pointer-events-auto cursor-grab active:cursor-grabbing touch-none"
          style={{
            left: pxLeft,
            width: HEAD_WIDTH,
            height: HEAD_HEIGHT,
            // Anchor the head's bottom edge 15px below the rail baseline
            // so it reads as a slider knob slightly into the slot.
            bottom: -15,
            filter: headFilter
          }}
          onPointerDown={handleHeadPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <img
            src={HEAD_URL}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="block w-full h-full select-none"
          />
        </motion.div>
      </div>
    </div>
  );
};