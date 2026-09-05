import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Sun,
  Calendar,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import { LessonConfig, SkyKeyframe } from '../../core/types/lesson.types';
import { AtmosphereTimeline } from '../../core/components/AtmosphereTimeline';
import { SerpentSlider } from './SerpentSlider';

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
}

const topicIcons: Record<string, React.ReactNode> = {
  'solar-calendar': <Calendar className="w-4 h-4" />,
  'serpent-descent': <Sun className="w-4 h-4" />
};

export const Lesson01Overlay: React.FC<Lesson01OverlayProps> = ({
  config,
  sliderPosition,
  onSliderPositionChange,
  onStepSelect,
  selectedTopicId,
  onSelectTopic,
  skyTimeline
}) => {
  // One caption panel open at a time. Clicking a topic button selects that
  // topic (parent resets the timeline) and opens its caption; clicking the
  // open button again collapses; clicking another switches. The opening panel
  // follows the selected topic (Serpent Descent on a fresh visit).
  const [activePanel, setActivePanel] = useState<string | null>(() => selectedTopicId);

  const handleStepSelect = (step: number) => {
    onStepSelect(step);
  };

  const handleButtonClick = (id: string) => {
    if (activePanel === id) {
      setActivePanel(null);
      return;
    }
    setActivePanel(id);
    onSelectTopic(id);
  };

  const activeTopic = activePanel
    ? config.content.topics.find((t) => t.id === activePanel)
    : undefined;

  // The slider is the environment control for the sky setup (Serpent
  // Descent). Calendar & Architecture is a reference view — no slider.
  const sliderHidden = selectedTopicId === 'solar-calendar';

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col p-6 z-20">
      {/* Bottom vignette — grounds the instrument against the sky so the
          panel reads as an instrument, not a floating card. Earlier sibling
          of the instrument, so it paints beneath it. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-maya-bg/70 via-maya-bg/30 to-transparent pointer-events-none" />

      {/* Skip link — keyboard users jump straight to the observation
          instrument, past the 3D canvas. */}
      <a
        href="#lesson-instrument"
        className="sr-only focus:not-sr-only focus:pointer-events-auto focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:bg-maya-gold focus:text-maya-bg focus:text-sm focus:font-medium"
      >
        Skip to the observation instrument
      </a>

      {/* Minimal header — home, lesson title, and section buttons in one
          flat bar: solid surface background, full-bleed across the top,
          no floating buttons. */}
      <header className="pointer-events-auto -mx-6 -mt-6 bg-maya-surface border-b border-maya-gold/20">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-6 py-2">
          <Link
            to="/"
            aria-label="Back to all lessons"
            title="Back to all lessons"
            className="flex items-center justify-center w-7 h-7 rounded-md text-maya-textDim hover:text-maya-gold transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase text-maya-gold">
              Lesson {config.id}
            </span>
            <h1 className="font-serif text-xs font-bold text-maya-cream tracking-wide truncate max-w-md">
              {config.content.monumentName}
            </h1>
          </div>

          {/* Section buttons — flat text buttons in the bar, pushed to
              the right edge. */}
          <nav className="ml-auto flex flex-wrap gap-1">
            {config.content.topics.map((topic) => {
              const isOpen = activePanel === topic.id;
              const isSelected = selectedTopicId === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => handleButtonClick(topic.id)}
                  aria-expanded={isOpen}
                  aria-controls="field-guide"
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isOpen
                      ? 'bg-maya-gold/20 text-maya-cream'
                      : isSelected
                        ? 'text-maya-cream'
                        : 'text-maya-textDim hover:text-maya-text'
                  }`}
                >
                  <span className={isOpen || isSelected ? 'text-maya-gold' : 'text-maya-textDim'}>
                    {topicIcons[topic.id] || <Sparkles className="w-4 h-4" />}
                  </span>
                  <span>{topic.title}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Field guide — content for the open button. Always mounted so the
          section buttons collapse/uncollapse it: it hangs from the header
          into a vertical rectangle docked to the design space's left edge,
          growing/collapsing via a max-height + opacity transition instead
          of popping in. The max-height is a literal design-space value
          (536px = 720 − 184, the md reference at 1280×720) — a viewport-
          relative calc would not scale with the design.
          Text-only — deliberately no image captions. */}
      <aside
        id="field-guide"
        aria-hidden={activePanel ? undefined : true}
        className={`pointer-events-auto flex flex-col p-5 overflow-hidden text-maya-text text-[14.4px] z-10
          origin-top motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out
          -ml-6 w-[21.16rem]
          bg-maya-surface/95 backdrop-blur-xl border border-t-0 border-maya-gold/30 rounded-b-lg shadow-xl
          ${
            activePanel
              ? 'opacity-100 visible max-h-[536px]'
              : 'opacity-0 invisible max-h-0 pointer-events-none'
          }`}
      >
          {activeTopic ? (
            <>
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h2 className="font-serif text-[15.75px] font-bold text-maya-cream flex items-center gap-2">
                  <span className="text-maya-gold">
                    {topicIcons[activeTopic.id] || <Sparkles className="w-4 h-4" />}
                  </span>
                  {activeTopic.title}
                </h2>
                <button
                  onClick={() => setActivePanel(null)}
                  className="text-maya-textDim hover:text-white p-1 -m-1 rounded hover:bg-white/5 cursor-pointer"
                  aria-label="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                <p className="text-[13.5px] text-maya-textDim leading-relaxed italic border-l-2 border-maya-gold/50 pl-3">
                  "{activeTopic.summary}"
                </p>

                <ul className="space-y-2 text-[13.5px] text-maya-textDim">
                  {activeTopic.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-maya-gold shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                {activeTopic.keyFact && (
                  <div className="bg-maya-gold/10 border border-maya-gold/30 rounded-lg p-2.5 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-maya-gold shrink-0 mt-0.5" />
                    <p className="text-[12.5px] text-maya-cream font-medium font-mono">
                      {activeTopic.keyFact}
                    </p>
                  </div>
                )}

                {/* Calendar & Architecture is the merged reference section:
                    the topic's calendar facts above, then the monument's
                    architecture reference content (previously its own
                    "Architecture" panel). */}
                {activeTopic.id === 'solar-calendar' && (
                  <>
                    <div className="bg-maya-surfaceHover/70 border border-white/10 rounded-xl p-4 space-y-2">
                      <span className="text-[12.5px] font-mono uppercase tracking-wider text-maya-gold">
                        Archaeological Overview
                      </span>
                      <p className="text-[13.5px] text-maya-textDim leading-relaxed">
                        {config.content.overview}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[13.5px]">
                      <div className="bg-maya-surfaceHover/50 border border-white/5 p-3 rounded-lg">
                        <span className="text-[12.5px] text-maya-textDim block mb-1">Culture</span>
                        <span className="text-maya-cream font-medium">{config.content.culture}</span>
                      </div>
                      <div className="bg-maya-surfaceHover/50 border border-white/5 p-3 rounded-lg">
                        <span className="text-[12.5px] text-maya-textDim block mb-1">Chronology</span>
                        <span className="text-maya-cream font-medium">{config.content.timePeriod}</span>
                      </div>
                    </div>

                  </>
                )}
              </div>
            </>
          ) : null}
      </aside>

      {/* Bottom instrument — the Atmosphere Timeline, full width, and
          nothing else: the slider is the single environment control
          (ADR-001). Rendered for the sky setup (Serpent Descent); hidden
          in the Calendar & Architecture reference view. The overlay lives
          in the fixed 1280×720 design space (ViewportScaler), so the
          desktop reference — slider always visible under an open caption
          panel — applies at every viewport; there is no mobile sheet. */}
      <div
        className={`pointer-events-auto mt-auto ${
          sliderHidden ? 'hidden' : activePanel ? 'block' : ''
        }`}
      >
        <div id="lesson-instrument">
          {selectedTopicId === 'serpent-descent' ? (
            <SerpentSlider
              keyframes={skyTimeline}
              value={sliderPosition}
              onLiveChange={onSliderPositionChange}
              onStepSelect={handleStepSelect}
            />
          ) : (
            <AtmosphereTimeline
              keyframes={skyTimeline}
              value={sliderPosition}
              onLiveChange={onSliderPositionChange}
              onStepSelect={handleStepSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
};
