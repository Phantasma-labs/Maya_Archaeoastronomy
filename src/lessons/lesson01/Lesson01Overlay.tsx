import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Sun,
  Calendar,
  Compass,
  Info,
  ChevronRight,
  Sparkles,
  Layers,
  CheckCircle2,
  X,
  Hand
} from 'lucide-react';
import { LessonConfig, SkyKeyframe } from '../../core/types/lesson.types';
import { AtmosphereTimeline } from '../../core/components/AtmosphereTimeline';

interface Lesson01OverlayProps {
  config: LessonConfig;
  /** Continuous Atmosphere Timeline position in [1, N] (ADR-001). */
  sliderPosition: number;
  /** Live scrubbing updates from dragging the timeline. */
  onSliderPositionChange: (position: number) => void;
  /** Step-marker clicks — LessonPage runs the eased sweep. */
  onStepSelect: (step: number) => void;
  /** Controlled selected topic id (lifted to LessonPage for slider reset). */
  selectedTopicId: string;
  /** Topic selection callback — parent resets the timeline position. */
  onSelectTopic: (id: string) => void;
  /** Active skyTimeline: the selected topic's own, or the lesson default. */
  skyTimeline: SkyKeyframe[];
  /** True for topics that own a skyTimeline (Serpent Descent, Zenith).
   *  Used to phrase the right-hand observation log when a step carries no
   *  astro data — the instrument itself renders for every topic. */
  showFocusedUI: boolean;
}

const topicIcons: Record<string, React.ReactNode> = {
  'solar-calendar': <Calendar className="w-4 h-4" />,
  'serpent-descent': <Sun className="w-4 h-4" />,
  'solar-zenith': <Compass className="w-4 h-4" />
};

export const Lesson01Overlay: React.FC<Lesson01OverlayProps> = ({
  config,
  sliderPosition,
  onSliderPositionChange,
  onStepSelect,
  selectedTopicId,
  onSelectTopic,
  skyTimeline,
  showFocusedUI
}) => {
  // Field Guide panel — collapsible, defaults CLOSED so the scene is the
  // subject on entry (V02 design plan §4). The bottom instrument carries
  // the immediate pedagogy; the guide is the on-demand reference.
  const [isFieldGuideOpen, setIsFieldGuideOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'topics' | 'monument'>('topics');
  const selectedTopic =
    config.content.topics.find((t) => t.id === selectedTopicId) || config.content.topics[0];

  // Nearest timeline keyframe — drives the contextual callout and the
  // right-side observation log. Uses the active skyTimeline (topic-owned
  // or lesson default) passed in by LessonPage.
  const activeIndex = Math.min(Math.max(Math.round(sliderPosition) - 1, 0), skyTimeline.length - 1);
  const activeKeyframe = skyTimeline[activeIndex];
  const activeCallout = activeKeyframe?.callout;
  const calloutLines = activeCallout?.lines ?? [];

  // Step 2's serpent-head hotspot popup — user-dismissed, defaults closed.
  // The user opens it explicitly via the "Tap serpent head" link in the
  // callout. No auto-open: the popup used to cover the slider area on
  // landing at Step 2, which is what made the Step 2 click feel broken.
  const [isHotspotOpen, setIsHotspotOpen] = useState<boolean>(false);
  const hotspotDialogRef = useRef<HTMLDivElement>(null);
  const hotspotTriggerRef = useRef<HTMLButtonElement>(null);

  const closeHotspot = useCallback(() => {
    setIsHotspotOpen(false);
    hotspotTriggerRef.current?.focus();
  }, []);

  // Focus management for the hotspot dialog (V02 Phase E): move focus into
  // the dialog when it opens; explicit dismissal (X / Escape) returns focus
  // to the trigger. A keyframe change closes the dialog without restoring
  // focus (the trigger may no longer exist).
  useEffect(() => {
    if (isHotspotOpen) {
      hotspotDialogRef.current?.focus();
    }
  }, [isHotspotOpen]);

  useEffect(() => {
    if (!isHotspotOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeHotspot();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isHotspotOpen, closeHotspot]);

  // Close the popup when the active keyframe changes — its hotspot may no
  // longer apply (e.g. the user dragged to a step without one).
  useEffect(() => {
    setIsHotspotOpen(false);
  }, [activeKeyframe?.id]);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col p-4 md:p-6 z-20">
      {/* Bottom vignette — grounds the instrument against the sky so the
          panel reads as an instrument, not a floating card (V02 design plan
          §4). Earlier sibling of the instrument, so it paints beneath it. */}
      <div className="absolute inset-x-0 bottom-0 h-32 md:h-40 bg-gradient-to-t from-maya-bg/70 via-maya-bg/30 to-transparent pointer-events-none" />

      {/* Skip link — keyboard users jump straight to the observation
          instrument, past the 3D canvas (V02 Phase E). */}
      <a
        href="#lesson-instrument"
        className="sr-only focus:not-sr-only focus:pointer-events-auto focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:bg-maya-gold focus:text-maya-bg focus:text-sm focus:font-medium"
      >
        Skip to the observation instrument
      </a>

      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between gap-4 pointer-events-auto">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-maya-surface/85 backdrop-blur-md border border-maya-gold/25 hover:border-maya-gold/70 text-maya-text hover:text-maya-gold text-xs md:text-sm font-medium transition-all shadow-lg hover:shadow-maya-gold/10 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">All Lessons</span>
          </Link>

          <div className="bg-maya-surface/85 backdrop-blur-md border border-maya-gold/20 rounded-xl px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-maya-gold/20 text-maya-gold border border-maya-gold/30">
                Lesson {config.id}
              </span>
              <h1 className="font-serif text-xs md:text-sm font-bold text-maya-cream tracking-wide truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {config.content.monumentName}
              </h1>
            </div>
            <p className="text-[11px] text-maya-textDim hidden md:block">
              {config.content.location}
            </p>
          </div>
        </div>
      </header>

      {/* Field Guide toggle — sits beneath the header row, below All Lessons. */}
      <div className="pointer-events-auto mt-3 self-start">
        <button
          onClick={() => setIsFieldGuideOpen(!isFieldGuideOpen)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium backdrop-blur-md border transition-all shadow-lg cursor-pointer ${
            isFieldGuideOpen
              ? 'bg-maya-gold/20 border-maya-gold text-maya-cream'
              : 'bg-maya-surface/85 border-maya-gold/20 text-maya-text hover:border-maya-gold/50'
          }`}
          aria-expanded={isFieldGuideOpen}
          aria-controls="field-guide"
        >
          <BookOpen className="w-4 h-4 text-maya-gold" />
          <span>Field Guide</span>
          <ChevronRight
            className={`w-3.5 h-3.5 text-maya-gold transition-transform ${
              isFieldGuideOpen ? 'rotate-90' : ''
            }`}
          />
        </button>
      </div>

      {/* Field Guide panel — the lesson's reference material, on demand. */}
      {isFieldGuideOpen && (
        <aside
          id="field-guide"
          className="pointer-events-auto self-start max-w-lg w-full bg-maya-surface/90 backdrop-blur-xl border border-maya-gold/30 rounded-2xl p-5 shadow-2xl mt-4 max-h-[calc(100vh-140px)] flex flex-col overflow-hidden text-maya-text animate-fadeIn"
        >
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <h2 className="font-serif text-sm font-bold text-maya-cream tracking-wide">
              Field Guide
            </h2>
            <button
              onClick={() => setIsFieldGuideOpen(false)}
              className="text-maya-textDim hover:text-white p-1 -m-1 rounded hover:bg-white/5 cursor-pointer"
              aria-label="Close field guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('topics')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'topics'
                  ? 'bg-maya-gold/20 text-maya-cream border border-maya-gold/40'
                  : 'text-maya-textDim hover:text-maya-text'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-maya-gold" />
              Astronomical Alignments
            </button>
            <button
              onClick={() => setActiveTab('monument')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'monument'
                  ? 'bg-maya-gold/20 text-maya-cream border border-maya-gold/40'
                  : 'text-maya-textDim hover:text-maya-text'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-maya-gold" />
              Architecture
            </button>
          </div>

          {/* Tab 1: Astronomical Topics */}
          {activeTab === 'topics' && (
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
              {/* Topic Selector Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {config.content.topics.map((topic) => {
                  const isSelected = topic.id === selectedTopicId;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => onSelectTopic(topic.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-maya-gold/20 border-maya-gold text-maya-cream font-semibold shadow-md'
                          : 'bg-maya-surfaceHover/60 border-white/5 text-maya-textDim hover:bg-maya-surfaceHover/80 hover:text-maya-text'
                      }`}
                    >
                      <span className={`${isSelected ? 'text-maya-gold' : 'text-maya-textDim'}`}>
                        {topicIcons[topic.id] || <Sparkles className="w-4 h-4" />}
                      </span>
                      <span className="truncate text-[11px]">{topic.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Topic Content */}
              <div className="bg-maya-surfaceHover/70 border border-maya-gold/20 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-serif text-sm font-bold text-maya-cream flex items-center gap-2">
                    <span className="text-maya-gold">{topicIcons[selectedTopic.id]}</span>
                    {selectedTopic.title}
                  </h2>
                </div>

                <p className="text-xs text-maya-textDim leading-relaxed italic border-l-2 border-maya-gold/50 pl-3">
                  "{selectedTopic.summary}"
                </p>

                <ul className="space-y-2 text-xs text-maya-textDim">
                  {selectedTopic.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-maya-gold shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                {selectedTopic.keyFact && (
                  <div className="bg-maya-gold/10 border border-maya-gold/30 rounded-lg p-2.5 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-maya-gold shrink-0 mt-0.5" />
                    <p className="text-[11px] text-maya-cream font-medium font-mono">
                      {selectedTopic.keyFact}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Monument & Architectural Context */}
          {activeTab === 'monument' && (
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
              <div className="bg-maya-surfaceHover/70 border border-white/10 rounded-xl p-4 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-maya-gold">
                  Archaeological Overview
                </span>
                <p className="text-xs text-maya-textDim leading-relaxed">
                  {config.content.overview}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-maya-surfaceHover/50 border border-white/5 p-3 rounded-lg">
                  <span className="text-[11px] text-maya-textDim block mb-1">Culture</span>
                  <span className="text-maya-cream font-medium">{config.content.culture}</span>
                </div>
                <div className="bg-maya-surfaceHover/50 border border-white/5 p-3 rounded-lg">
                  <span className="text-[11px] text-maya-textDim block mb-1">Chronology</span>
                  <span className="text-maya-cream font-medium">{config.content.timePeriod}</span>
                </div>
              </div>

              <div className="bg-maya-surfaceHover/70 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-maya-gold shrink-0 mt-0.5" />
                <p className="text-[11px] text-maya-textDim leading-relaxed">
                  <strong className="text-maya-cream block mb-0.5">Scholarly Caution:</strong>
                  {config.content.archaeologicalNotes}
                </p>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* Bottom instrument — single row: left callout · center Atmosphere
          Timeline · right observation log. Rendered for EVERY topic: focused
          topics (Serpent Descent, Zenith) use their own timeline and astro
          data; the Calendar topic falls back to the lesson default timeline,
          so no topic ever lands on a dead panel (V02 design plan §4). */}
      <div className="pointer-events-auto mt-auto">
        <div
          id="lesson-instrument"
          className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,1fr)] gap-x-6 gap-y-3 items-center bg-maya-surface border border-maya-gold/40 rounded-2xl px-3 py-2.5 md:px-4 md:py-3 shadow-2xl animate-fadeIn"
        >
          {/* Left — contextual callout (1st contact / The descent). On mobile
              the timeline is the primary control, so it stacks first (V02
              Phase E bottom-sheet behavior). */}
          <div
            className="min-w-0 text-left order-2 md:order-1"
            title={activeCallout?.tooltip}
            aria-live="polite"
          >
            {activeCallout && (
              <>
                <h2 className="font-serif text-base md:text-lg font-bold text-maya-cream leading-tight mb-0.5">
                  {activeCallout.label ?? activeKeyframe?.name}
                </h2>
                {activeCallout.sublabel && (
                  <p className="text-[11px] font-mono text-maya-textDim mb-1.5">
                    {activeCallout.sublabel}
                  </p>
                )}
                {calloutLines.length > 0 && (
                  <div className="space-y-1 border-l-2 border-maya-gold/50 pl-2.5 mb-1.5">
                    {calloutLines.map((line, i) => (
                      <p
                        key={i}
                        className={`text-[12px] leading-snug ${
                          i === calloutLines.length - 1
                            ? 'text-maya-cream font-medium'
                            : 'text-maya-textDim'
                        }`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                )}
                {activeCallout.hotspot && (
                  <button
                    ref={hotspotTriggerRef}
                    type="button"
                    onClick={() => setIsHotspotOpen(true)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-maya-gold hover:text-maya-goldLight transition-colors cursor-pointer"
                  >
                    <Hand className="w-3.5 h-3.5" />
                    Tap serpent head — {activeCallout.hotspot.label}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Center — Atmosphere Timeline (single environment control, ADR-001).
              All focused-mode topics (Serpent Descent, Zenith) share the same
              linear slider. The Zenith timeline's three keyframes (May 23,
              Jun 21, Jul 19) sit on a horizontal track; Step 1 / Step 3 are
              both zenith passes (`03.webp`), Step 2 is the solstice
              (`03before.webp`). IBL stays at 0.66 across the three so the
              only thing that changes is the directional sun rotation. */}
          <div className="w-full min-w-0 order-1 md:order-2">
            <AtmosphereTimeline
              keyframes={skyTimeline}
              value={sliderPosition}
              onLiveChange={onSliderPositionChange}
              onStepSelect={onStepSelect}
            />
            {activeCallout?.prompt && (
              <p className="mt-2 text-center text-[11px] text-maya-gold font-medium">
                {activeCallout.prompt}
              </p>
            )}
          </div>

          {/* Right — observation log for the active step */}
          <div className="min-w-0 flex flex-col items-end gap-1.5 text-right order-3">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-sm font-bold text-maya-cream">
                Sun · Astronomical Data
              </h3>
              <Sun className="w-4 h-4 text-maya-gold" />
            </div>
            {activeCallout?.astro ? (
              <dl className="space-y-1 text-[11px] font-mono text-maya-textDim">
                <div className="flex justify-between gap-4">
                  <dt className="text-maya-textDim">Azimuth</dt>
                  <dd className="text-maya-gold">{activeCallout.astro.azimuth}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-maya-textDim">Altitude</dt>
                  <dd className="text-maya-gold">{activeCallout.astro.altitude}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-maya-textDim">Declination</dt>
                  <dd className="text-maya-gold">{activeCallout.astro.declination}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-maya-textDim">Local time</dt>
                  <dd className="text-maya-gold">{activeCallout.astro.time}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-[11px] text-maya-textDim">
                {showFocusedUI
                  ? 'No astronomical data for this step'
                  : 'Select Serpent Descent or Zenith for focused astronomical data'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Step 2 — Serpent-head hotspot popup. Only renders when the active
          keyframe provides hotspot content (currently Step 2). User-opened
          via the "Tap serpent head" link in the callout (no auto-open). */}
      {isHotspotOpen && activeCallout?.hotspot && (
        <div
          ref={hotspotDialogRef}
          tabIndex={-1}
          className="pointer-events-auto absolute right-4 md:right-6 top-32 max-w-xs bg-maya-surface/95 backdrop-blur-xl border-2 border-maya-gold rounded-2xl p-4 shadow-2xl shadow-maya-gold/20 text-maya-text animate-fadeIn z-30"
          role="dialog"
          aria-labelledby="hotspot-title"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              id="hotspot-title"
              className="font-serif text-base font-bold text-maya-cream flex items-center gap-2"
            >
              <Hand className="w-4 h-4 text-maya-gold" />
              {activeCallout.hotspot.label}
            </h3>
            <button
              type="button"
              onClick={closeHotspot}
              className="text-maya-textDim hover:text-white p-1 -m-1 rounded hover:bg-white/5 cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[12px] text-maya-textDim leading-relaxed">
            {activeCallout.hotspot.text}
          </p>
        </div>
      )}
    </div>
  );
};
