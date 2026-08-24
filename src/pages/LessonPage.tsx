import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLessonEntry } from '../lessons/registry';
import { SceneCanvas } from '../core/components/SceneCanvas';
import { sampleAtmosphere } from '../core/utils/atmosphere';
import { ArrowLeft, AlertCircle, Clock } from 'lucide-react';

/** Eased sweep duration for step-marker clicks (ADR-001), in ms. */
const SWEEP_MS = 600;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const LessonPage: React.FC = () => {
  const { lessonId = '01' } = useParams<{ lessonId: string }>();
  const lessonEntry = useMemo(() => getLessonEntry(lessonId), [lessonId]);

  /**
   * ADR-001 — single runtime writer for the whole scene: the Atmosphere
   * Timeline position (continuous, 1..N). Everything else — sky crossfade,
   * sun rotation, IBL intensity — is DERIVED from it via sampleAtmosphere.
   * There is deliberately no env/light React state to get out of sync.
   */
  const [sliderPosition, setSliderPosition] = useState<number>(1);

  // Mirror of the latest position for the sweep driver — lets the rAF
  // callback read the current value without stale closures, and keeps
  // updater functions pure (StrictMode double-invokes updaters, so the
  // tween must NOT be scheduled from inside a setState updater).
  const positionRef = useRef(sliderPosition);

  const atmosphere = useMemo(() => {
    if (!lessonEntry) return null;
    return sampleAtmosphere(
      lessonEntry.config.assets.environment.skyTimeline,
      sliderPosition
    );
  }, [lessonEntry, sliderPosition]);

  // Eased sweep tween toward a clicked step marker (~0.6 s). The sweep visibly
  // passes through the in-between states — that transition IS the feature.
  const sweepRef = useRef<{ frame: number } | null>(null);

  const cancelSweep = useCallback(() => {
    if (sweepRef.current) {
      cancelAnimationFrame(sweepRef.current.frame);
      sweepRef.current = null;
    }
  }, []);

  const handleStepSelect = useCallback(
    (step: number) => {
      cancelSweep();
      const from = positionRef.current;
      if (Math.abs(step - from) < 0.0001) return;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / SWEEP_MS, 1);
        const next = t >= 1 ? step : from + (step - from) * easeInOutCubic(t);
        positionRef.current = next;
        setSliderPosition(next);
        sweepRef.current = t >= 1 ? null : { frame: requestAnimationFrame(tick) };
      };
      sweepRef.current = { frame: requestAnimationFrame(tick) };
    },
    [cancelSweep]
  );

  // Dragging cancels any running sweep — live input always wins.
  const handleLiveChange = useCallback(
    (position: number) => {
      cancelSweep();
      positionRef.current = position;
      setSliderPosition(position);
    },
    [cancelSweep]
  );

  // Cancel an in-flight sweep on unmount.
  useEffect(() => cancelSweep, [cancelSweep]);

  if (!lessonEntry || !atmosphere) {
    return (
      <div className="min-h-screen bg-[#090b10] text-[#e6dfd3] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-950/40 border border-[#d4af37]/30 flex items-center justify-center mb-6 text-[#d4af37]">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#f5ecd7] mb-2">Lesson Not Found</h1>
        <p className="text-sm text-[#a39e93] max-w-md mb-6">
          Lesson "{lessonId}" is not registered in the lesson catalog.
        </p>
        <Link
          to="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d4af37] text-black font-semibold text-xs tracking-wider uppercase hover:brightness-110 transition-all shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Lesson Catalog
        </Link>
      </div>
    );
  }

  // Coming-soon lessons never reach the placeholder scene — Lesson01Scene
  // assumes its own model ids and would crash on an empty models array.
  if (lessonEntry.config.status === 'coming-soon') {
    return (
      <div className="min-h-screen bg-[#090b10] text-[#e6dfd3] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-950/40 border border-[#d4af37]/30 flex items-center justify-center mb-6 text-[#d4af37]">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#f5ecd7] mb-2">
          {lessonEntry.config.title}
        </h1>
        <p className="text-sm text-[#a39e93] max-w-md mb-6">
          This module is still in production — assets and curriculum are being authored.
        </p>
        <Link
          to="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d4af37] text-black font-semibold text-xs tracking-wider uppercase hover:brightness-110 transition-all shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Lesson Catalog
        </Link>
      </div>
    );
  }

  const { config, SceneComponent, OverlayComponent } = lessonEntry;

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#090b10] relative select-none">
      {/* 3D Scene Viewport — fills entire viewport */}
      <SceneCanvas cameraConfig={config.camera}>
        <SceneComponent config={config} atmosphere={atmosphere} />
      </SceneCanvas>

      {/* Educational UI Overlay — sits above the canvas */}
      {OverlayComponent && (
        <OverlayComponent
          config={config}
          sliderPosition={sliderPosition}
          onSliderPositionChange={handleLiveChange}
          onStepSelect={handleStepSelect}
        />
      )}
    </div>
  );
};