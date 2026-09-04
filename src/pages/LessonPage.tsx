import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { getLessonEntry } from '../lessons/registry';
import { SceneCanvas } from '../core/components/SceneCanvas';
import { ViewportScaler } from '../core/components/ViewportScaler';
import { sampleAtmosphere } from '../core/utils/atmosphere';
import { useLessonAssetCleanup } from '../core/utils/useLessonAssetCleanup';
import { ArrowLeft, AlertCircle, Clock } from 'lucide-react';

/** Eased sweep duration for step-marker clicks (ADR-001), in ms. */
const SWEEP_MS = 600;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const LessonPage: React.FC = () => {
  const { lessonId = '01' } = useParams<{ lessonId: string }>();
  const lessonEntry = useMemo(() => getLessonEntry(lessonId), [lessonId]);

  // Evict this lesson's GLBs + equirect skies from drei's caches on unmount
  // (TECH_DEBT L6). Without this, each visited lesson leaves ~8.4 MB of
  // decoded panorama + ~8 MB of PMREM result resident in GPU memory. The
  // hook's cleanup fires on unmount OR when the url set reference changes.
  // We collect EVERY sky url (lesson default + any topic-owned timeline) so
  // a topic switch can't strand a topic-only keyframe in cache.
  const gltfUrls = useMemo(
    () => lessonEntry?.config.assets.models.map((m) => m.url) ?? [],
    [lessonEntry]
  );
  const equirectUrls = useMemo(() => {
    if (!lessonEntry) return [];
    const lessonUrls = lessonEntry.config.assets.environment.skyTimeline.map((k) => k.url);
    const topicUrls = lessonEntry.config.content.topics
      .flatMap((t) => t.skyTimeline ?? [])
      .map((k) => k.url);
    return Array.from(new Set([...lessonUrls, ...topicUrls]));
  }, [lessonEntry]);
  useLessonAssetCleanup(gltfUrls, equirectUrls);

  /**
   * ADR-001 — single runtime writer for the whole scene: the Atmosphere
   * Timeline position (continuous, 1..N). Everything else — sky crossfade,
   * sun rotation, IBL intensity — is DERIVED from it via sampleAtmosphere.
   * There is deliberately no env/light React state to get out of sync.
   *
   * URL state seed — ?topic=<id>&step=<n> drive the opening overlay state,
   * so lesson states are linkable/shareable. Unset params fall back to the
   * focused serpent-descent opening (position 1).
   */
  const [searchParams] = useSearchParams();
  const urlTopicId = searchParams.get('topic');
  const initialTopic = useMemo(() => {
    if (!lessonEntry) return undefined;
    const byId = lessonEntry.config.content.topics.find((t) => t.id === urlTopicId);
    if (byId) return byId;
    return (
      lessonEntry.config.content.topics.find((t) => t.id === 'serpent-descent') ??
      lessonEntry.config.content.topics[0]
    );
  }, [lessonEntry, urlTopicId]);

  const [sliderPosition, setSliderPosition] = useState<number>(() => {
    if (!lessonEntry || !initialTopic) return 1;
    const n = (initialTopic.skyTimeline ?? lessonEntry.config.assets.environment.skyTimeline)
      .length;
    const step = Number(searchParams.get('step'));
    if (Number.isFinite(step) && step >= 1) return Math.min(Math.round(step), n);
    return initialTopic.skyTimeline ? 1 : 3;
  });

  // Mirror of the latest position for the sweep driver — lets the rAF
  // callback read the current value without stale closures, and keeps
  // updater functions pure (StrictMode double-invokes updaters, so the
  // tween must NOT be scheduled from inside a setState updater).
  const positionRef = useRef(sliderPosition);

  /**
   * The selected topic id is lifted here so the page can swap the active
   * skyTimeline and reset the slider position when the user navigates
   * between topics. Defaults to Serpent Descent (the focused opening view),
   * or the URL ?topic= seed when one is provided.
   */
  const [selectedTopicId, setSelectedTopicId] = useState<string>(() => initialTopic?.id ?? '');

  // The active skyTimeline is the selected topic's own (if it owns one)
  // or the lesson's default 3-step timeline. Serpent Descent owns a
  // 2-step focused timeline; the Calendar & Architecture topic falls
  // back to the lesson default.
  const activeSkyTimeline = useMemo(() => {
    if (!lessonEntry) return [];
    const topic =
      lessonEntry.config.content.topics.find((t) => t.id === selectedTopicId) ??
      lessonEntry.config.content.topics[0];
    return topic?.skyTimeline ?? lessonEntry.config.assets.environment.skyTimeline;
  }, [lessonEntry, selectedTopicId]);

  // Reset the slider position when the selected topic changes. Topics that
  // own a skyTimeline start at step 1; topics using the lesson default
  // default to step 3 (the zenith keyframe). The lesson default's
  // skyTimeline always has N=3, so step 3 is always a valid position. The
  // initial mount does NOT reset — the ?step= URL seed (or the topic
  // default) already set the opening position.
  const previousTopicRef = useRef(selectedTopicId);
  useEffect(() => {
    if (!lessonEntry) return;
    if (previousTopicRef.current === selectedTopicId) return;
    previousTopicRef.current = selectedTopicId;
    const topic =
      lessonEntry.config.content.topics.find((t) => t.id === selectedTopicId) ??
      lessonEntry.config.content.topics[0];
    setSliderPosition(topic?.skyTimeline ? 1 : 3);
  }, [selectedTopicId, lessonEntry]);

  const atmosphere = useMemo(() => {
    if (!lessonEntry || activeSkyTimeline.length === 0) return null;
    return sampleAtmosphere(activeSkyTimeline, sliderPosition);
  }, [activeSkyTimeline, sliderPosition, lessonEntry]);

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
      // Respect prefers-reduced-motion: jump straight to the step instead of
      // the ~0.6s eased sweep.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        positionRef.current = step;
        setSliderPosition(step);
        return;
      }
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

  const handleSelectTopic = useCallback((id: string) => {
    setSelectedTopicId(id);
  }, []);

  // Cancel an in-flight sweep on unmount.
  useEffect(() => () => cancelSweep(), [cancelSweep]);

  if (!lessonEntry || !atmosphere) {
    return (
      <div className="min-h-screen bg-maya-bg text-maya-text flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-950/40 border border-maya-gold/30 flex items-center justify-center mb-6 text-maya-gold">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-maya-cream mb-2">Lesson Not Found</h1>
        <p className="text-sm text-maya-textDim max-w-md mb-6">
          Lesson "{lessonId}" is not registered in the lesson catalog.
        </p>
        <Link
          to="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-maya-gold text-black font-semibold text-xs tracking-wider uppercase hover:brightness-110 transition-all shadow-lg"
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
      <div className="min-h-screen bg-maya-bg text-maya-text flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-950/40 border border-maya-gold/30 flex items-center justify-center mb-6 text-maya-gold">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-maya-cream mb-2">
          {lessonEntry.config.title}
        </h1>
        <p className="text-sm text-maya-textDim max-w-md mb-6">
          This module is still in production — assets and curriculum are being authored.
        </p>
        <Link
          to="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-maya-gold text-black font-semibold text-xs tracking-wider uppercase hover:brightness-110 transition-all shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Lesson Catalog
        </Link>
      </div>
    );
  }

  const { config, SceneComponent, OverlayComponent } = lessonEntry;

  return (
    <div className="w-screen h-screen overflow-hidden bg-maya-bg relative flex items-center justify-center">
      {/* Cinematic 16:9 frame — on horizontal/widescreen viewports the scene
          and overlay are letterboxed to a 16:9 frame (centered) instead of
          stretching across the full width. On narrow/tall viewports the
          frame fills the width and its height follows from the ratio.
          overflow-hidden clips the ViewportScaler box's min-scale overhang. */}
      <div
        className="relative overflow-hidden"
        style={{
          width: 'min(100%, calc(100vh * 16 / 9))',
          aspectRatio: '16 / 9'
        }}
      >
        {/* 3D Scene Viewport — fills the 16:9 frame */}
        <SceneCanvas cameraConfig={config.camera} gltfUrls={gltfUrls}>
          <SceneComponent config={config} atmosphere={atmosphere} />
        </SceneCanvas>

        {/* Educational UI Overlay — sits above the canvas, over the frame.
            Wrapped in Suspense because the registry lazy-loads the overlay
            module (route-level code splitting, TECH_DEBT H3). The overlay
            layer is wrapped in ViewportScaler (core): a 1280×720 design
            space uniformly scaled to the frame, so the authored composition
            is preserved at every viewport. Only the DOM overlay scales —
            the R3F canvas stays full-frame (CSS-scaling it would render it
            blurry). */}
        {OverlayComponent && (
          <Suspense fallback={null}>
            <ViewportScaler>
              <OverlayComponent
                config={config}
                sliderPosition={sliderPosition}
                onSliderPositionChange={handleLiveChange}
                onStepSelect={handleStepSelect}
                selectedTopicId={selectedTopicId}
                onSelectTopic={handleSelectTopic}
                skyTimeline={activeSkyTimeline}
              />
            </ViewportScaler>
          </Suspense>
        )}
      </div>
    </div>
  );
};
