import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Sun,
  Calendar,
  Clock,
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
  /** Show the focused UI (slider, callout, sun blueprint) — only true
   *  for topics that own a skyTimeline (Snake Descent). */
  showFocusedUI: boolean;
}

const topicIcons: Record<string, React.ReactNode> = {
  'solar-calendar': <Calendar className="w-4 h-4" />,
  'snake-descent': <Sun className="w-4 h-4" />,
  'calendar-round': <Clock className="w-4 h-4" />,
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
  const [isStudyPanelOpen, setIsStudyPanelOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'topics' | 'monument'>('topics');
  // Step 2's serpent-head hotspot popup — user-dismissed, defaults closed.
  // The user opens it explicitly via the "Tap serpent head" link in the
  // callout. No auto-open: the popup used to cover the slider area on
  // landing at Step 2, which is what made the Step 2 click feel broken.
  const [isHotspotOpen, setIsHotspotOpen] = useState<boolean>(false);

  const selectedTopic = config.content.topics.find((t) => t.id === selectedTopicId) || config.content.topics[0];

  // Nearest timeline keyframe — drives the contextual callout and the
  // right-side sun blueprint. Uses the active skyTimeline (topic-owned
  // or lesson default) passed in by LessonPage.
  const activeIndex = Math.min(Math.max(Math.round(sliderPosition) - 1, 0), skyTimeline.length - 1);
  const activeKeyframe = skyTimeline[activeIndex];
  const activeCallout = activeKeyframe?.callout;
  const calloutLines = activeCallout?.lines ?? [];

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col p-4 md:p-6 select-none z-20">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between gap-4 pointer-events-auto">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#12151e]/85 backdrop-blur-md border border-[#d4af37]/25 hover:border-[#d4af37]/70 text-[#e6dfd3] hover:text-[#d4af37] text-xs md:text-sm font-medium transition-all shadow-lg hover:shadow-[#d4af37]/10 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">All Lessons</span>
          </Link>

          <div className="bg-[#12151e]/85 backdrop-blur-md border border-[#d4af37]/20 rounded-xl px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30">
                Lesson {config.id}
              </span>
              <h1 className="font-serif text-xs md:text-sm font-bold text-[#f5ecd7] tracking-wide truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {config.content.monumentName}
              </h1>
            </div>
            <p className="text-[11px] text-[#a59f93] hidden md:block">{config.content.location}</p>
          </div>
        </div>
      </header>

      {/* Curriculum toggle — sits beneath the header row, below All Lessons. */}
      <div className="pointer-events-auto mt-3 self-start">
        <button
          onClick={() => setIsStudyPanelOpen(!isStudyPanelOpen)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium backdrop-blur-md border transition-all shadow-lg cursor-pointer ${
            isStudyPanelOpen
              ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f5ecd7]'
              : 'bg-[#12151e]/85 border-[#d4af37]/20 text-[#e6dfd3] hover:border-[#d4af37]/50'
          }`}
          aria-expanded={isStudyPanelOpen}
          aria-controls="curriculum-drawer"
        >
          <BookOpen className="w-4 h-4 text-[#d4af37]" />
          <span>Curriculum</span>
          <ChevronRight
            className={`w-3.5 h-3.5 text-[#d4af37] transition-transform ${
              isStudyPanelOpen ? 'rotate-90' : ''
            }`}
          />
        </button>
      </div>

      {/* Main Interactive Pedagogical Drawer / Overlay */}
      {isStudyPanelOpen && (
        <aside
          id="curriculum-drawer"
          className="pointer-events-auto self-start max-w-lg w-full bg-[#12151e]/90 backdrop-blur-xl border border-[#d4af37]/30 rounded-2xl p-5 shadow-2xl mt-4 max-h-[calc(100vh-140px)] flex flex-col overflow-hidden text-[#e6dfd3] animate-fadeIn"
        >
          {/* Tab Navigation */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('topics')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'topics'
                    ? 'bg-[#d4af37]/20 text-[#f5ecd7] border border-[#d4af37]/40'
                    : 'text-[#a39e93] hover:text-[#e6dfd3]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                Astronomical Alignments
              </button>
              <button
                onClick={() => setActiveTab('monument')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'monument'
                    ? 'bg-[#d4af37]/20 text-[#f5ecd7] border border-[#d4af37]/40'
                    : 'text-[#a39e93] hover:text-[#e6dfd3]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
                Architecture
              </button>
            </div>

            <button
              onClick={() => setIsStudyPanelOpen(false)}
              className="text-[#a39e93] hover:text-white text-xs px-2 py-1 rounded hover:bg-white/5 cursor-pointer"
            >
              Minimize
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
                          ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f5ecd7] font-semibold shadow-md'
                          : 'bg-[#181c28]/60 border-white/5 text-[#a39e93] hover:bg-[#1f2536]/80 hover:text-[#e6dfd3]'
                      }`}
                    >
                      <span className={`${isSelected ? 'text-[#d4af37]' : 'text-[#8e897e]'}`}>
                        {topicIcons[topic.id] || <Sparkles className="w-4 h-4" />}
                      </span>
                      <span className="truncate text-[11px]">{topic.title.split(' ')[0]}...</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Topic Content */}
              <div className="bg-[#181c28]/70 border border-[#d4af37]/20 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-serif text-sm font-bold text-[#f5ecd7] flex items-center gap-2">
                    <span className="text-[#d4af37]">{topicIcons[selectedTopic.id]}</span>
                    {selectedTopic.title}
                  </h2>
                </div>

                <p className="text-xs text-[#d8d2c4] leading-relaxed italic border-l-2 border-[#d4af37]/50 pl-3">
                  "{selectedTopic.summary}"
                </p>

                <ul className="space-y-2 text-xs text-[#b8b2a5]">
                  {selectedTopic.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                {selectedTopic.keyFact && (
                  <div className="bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-lg p-2.5 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#f5ecd7] font-medium font-mono">
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
              <div className="bg-[#181c28]/70 border border-white/10 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#d4af37]">Archaeological Overview</span>
                <p className="text-xs text-[#c9c4b7] leading-relaxed">
                  {config.content.overview}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#181c28]/50 border border-white/5 p-3 rounded-lg">
                  <span className="text-[10px] text-[#8e897e] block mb-1">Culture</span>
                  <span className="text-[#f5ecd7] font-medium">{config.content.culture}</span>
                </div>
                <div className="bg-[#181c28]/50 border border-white/5 p-3 rounded-lg">
                  <span className="text-[10px] text-[#8e897e] block mb-1">Chronology</span>
                  <span className="text-[#f5ecd7] font-medium">{config.content.timePeriod}</span>
                </div>
              </div>

              <div className="bg-[#181c28]/70 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#b8b2a5] leading-relaxed">
                  <strong className="text-[#f5ecd7] block mb-0.5">Scholarly Caution:</strong>
                  {config.content.archaeologicalNotes}
                </p>
              </div>
            </div>
          )}

        </aside>
      )}

      {/* Footer Dashboard — single row: left callout · center Atmosphere Timeline · right Sun astronomical data.
          Only rendered for focused-mode topics (Snake Descent). Anchored to the bottom of the 16:9 frame. */}
      {showFocusedUI && (
        <div className="pointer-events-auto mt-auto">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,1fr)] gap-x-6 gap-y-3 items-center bg-[#12151e] border border-[#d4af37]/40 rounded-2xl px-4 py-3 shadow-2xl animate-fadeIn">
            {/* Left — contextual callout (1st contact / The descent) */}
            <div className="min-w-0 text-left" title={activeCallout?.tooltip} aria-live="polite">
              {activeCallout && (
                <>
                  <h2 className="font-serif text-base md:text-lg font-bold text-[#f5ecd7] leading-tight mb-0.5">
                    {activeCallout.label ?? activeKeyframe?.name}
                  </h2>
                  {activeCallout.sublabel && (
                    <p className="text-[11px] font-mono text-[#a59f93] mb-1.5">{activeCallout.sublabel}</p>
                  )}
                  {calloutLines.length > 0 && (
                    <div className="space-y-1 border-l-2 border-[#d4af37]/50 pl-2.5 mb-1.5">
                      {calloutLines.map((line, i) => (
                        <p
                          key={i}
                          className={`text-[12px] leading-snug ${
                            i === calloutLines.length - 1 ? 'text-[#f5ecd7] font-medium' : 'text-[#d8d2c4]'
                          }`}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                  {activeCallout.hotspot && (
                    <button
                      type="button"
                      onClick={() => setIsHotspotOpen(true)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#d4af37] hover:text-[#f3e5ab] transition-colors cursor-pointer"
                    >
                      <Hand className="w-3.5 h-3.5" />
                      Tap serpent head — {activeCallout.hotspot.label}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Center — Atmosphere Timeline (single environment control, ADR-001) */}
            <div className="w-full min-w-0">
              <AtmosphereTimeline
                keyframes={skyTimeline}
                value={sliderPosition}
                onLiveChange={onSliderPositionChange}
                onStepSelect={onStepSelect}
              />
              {activeCallout?.prompt && (
                <p className="mt-2 text-center text-[11px] text-[#d4af37] font-medium">
                  {activeCallout.prompt}
                </p>
              )}
            </div>

            {/* Right — Sun astronomical data for the active step */}
            <div className="min-w-0 flex flex-col items-end gap-1.5 text-right">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-sm font-bold text-[#f5ecd7]">Sun · Astronomical Data</h3>
                <Sun className="w-4 h-4 text-[#d4af37]" />
              </div>
              {activeCallout?.astro ? (
                <dl className="space-y-1 text-[11px] font-mono text-[#d8d2c4]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#8e897e]">Azimuth</dt>
                    <dd className="text-[#d4af37]">{activeCallout.astro.azimuth}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#8e897e]">Altitude</dt>
                    <dd className="text-[#d4af37]">{activeCallout.astro.altitude}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#8e897e]">Declination</dt>
                    <dd className="text-[#d4af37]">{activeCallout.astro.declination}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#8e897e]">Local time</dt>
                    <dd className="text-[#d4af37]">{activeCallout.astro.time}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-[11px] text-[#8e897e]">No astronomical data</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Serpent-head hotspot popup. Only renders when the active
          keyframe provides hotspot content (currently Step 2). User-opened
          via the "Tap serpent head" link in the callout (no auto-open). */}
      {showFocusedUI && isHotspotOpen && activeCallout?.hotspot && (
        <div
          className="pointer-events-auto absolute right-4 md:right-6 top-32 max-w-xs bg-[#12151e]/95 backdrop-blur-xl border-2 border-[#d4af37] rounded-2xl p-4 shadow-2xl shadow-[#d4af37]/20 text-[#e6dfd3] animate-fadeIn z-30"
          role="dialog"
          aria-labelledby="hotspot-title"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              id="hotspot-title"
              className="font-serif text-base font-bold text-[#f5ecd7] flex items-center gap-2"
            >
              <Hand className="w-4 h-4 text-[#d4af37]" />
              {activeCallout.hotspot.label}
            </h3>
            <button
              type="button"
              onClick={() => setIsHotspotOpen(false)}
              className="text-[#a39e93] hover:text-white p-1 -m-1 rounded hover:bg-white/5 cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[12px] text-[#d8d2c4] leading-relaxed">
            {activeCallout.hotspot.text}
          </p>
        </div>
      )}
    </div>
  );
};
