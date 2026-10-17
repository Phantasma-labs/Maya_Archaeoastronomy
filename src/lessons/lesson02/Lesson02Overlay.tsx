import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Home } from 'lucide-react';
import { LessonConfig, SkyKeyframe } from '../../core/types/lesson.types';
import { AtmosphereTimeline } from '../../core/components/AtmosphereTimeline';
import { PlanView } from './PlanView';
import type { PredictionResult } from './sunPath';
import {
  KEY_DATES,
  activeKeyDate,
  dateLabel,
  judgePrediction,
  positionToAzimuthDeg,
  positionToDay
} from './sunPath';

interface Lesson02OverlayProps {
  config: LessonConfig;
  /** Continuous Atmosphere Timeline position in [1, N] (ADR-001). */
  sliderPosition: number;
  onSliderPositionChange: (position: number) => void;
  onStepSelect: (step: number) => void;
  selectedTopicId: string;
  onSelectTopic: (id: string) => void;
  skyTimeline: SkyKeyframe[];
}

type Phase = 'predicting' | 'exploring';

// Kid-level copy (from LearningMaterial/lesson_02.md). Everything the child reads that is not in config.ts.
const COPY = {
  intro: 'Stand on the pyramid in the west and look east. Watch the Sun rise over three buildings.',
  prompt: 'On the longest day of the year, where will the Sun rise? Tap the horizon.',
  skip: 'Skip',
  evidence:
    'Scientists still discuss whether Group E was used to watch the sky or as a stage for ceremonies.',
  verdicts: {
    'right-on': 'Right on!',
    close: 'Close!',
    'too-south': 'The Sun went further north than you thought!',
    'too-north': "The Sun didn't go quite that far north!"
  } satisfies Record<PredictionResult, string>
};

const JUNE_INDEX = 2;

export const Lesson02Overlay: React.FC<Lesson02OverlayProps> = ({
  config,
  sliderPosition,
  onSliderPositionChange,
  onStepSelect,
  skyTimeline
}) => {
  const [searchParams] = useSearchParams();
  const [phase, setPhase] = useState<Phase>(() =>
    searchParams.has('step') ? 'exploring' : 'predicting'
  );
  const [prediction, setPrediction] = useState<number | null>(null);

  const predicting = phase === 'predicting';

  // Hand keyboard focus to the instrument when the prompt gives way to the
  // slider (the arc / Skip button unmount). Not on first mount, so a ?step=
  // deep link never steals focus.
  const instrumentRef = useRef<HTMLDivElement>(null);
  const prevPhaseRef = useRef<Phase>(phase);
  useEffect(() => {
    if (prevPhaseRef.current === phase) return;
    prevPhaseRef.current = phase;
    if (phase !== 'exploring') return;
    const slider = instrumentRef.current?.querySelector<HTMLElement>('[role="slider"]');
    (slider ?? instrumentRef.current)?.focus();
  }, [phase]);
  const activeIndex = activeKeyDate(sliderPosition);
  const activeCallout = activeIndex === null ? null : skyTimeline[activeIndex]?.callout;
  const activeBuilding = activeIndex === null ? null : KEY_DATES[activeIndex].building;
  const verdict =
    activeIndex === JUNE_INDEX && prediction !== null ? judgePrediction(prediction) : null;

  const handlePredict = (azimuthDeg: number) => {
    setPrediction(azimuthDeg);
    setPhase('exploring');
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col p-6 z-20">
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-maya-bg/70 via-maya-bg/30 to-transparent pointer-events-none" />

      {/* Header — Home link and lesson id, same flat bar as Lesson 01. */}
      <header className="pointer-events-auto -mx-6 -mt-6 bg-maya-surface border-b border-maya-gold/20">
        <div className="flex items-center gap-x-3 px-6 py-2">
          <Link
            to="/"
            aria-label="Back to all lessons"
            title="Back to all lessons"
            className="flex items-center justify-center w-7 h-7 rounded-md text-maya-textDim hover:text-maya-gold transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
          </Link>
          <span className="text-[10px] font-mono font-bold uppercase text-maya-gold">
            Lesson {config.id}
          </span>
          <h1 className="font-serif text-xs font-bold text-maya-cream tracking-wide truncate">
            {config.title}
          </h1>
        </div>
      </header>

      {/* Info panel (left) */}
      <aside className="pointer-events-auto mt-4 w-[21rem] p-4 space-y-3 bg-maya-surface/90 backdrop-blur-xl border border-maya-gold/30 rounded-lg shadow-xl">
        <h2 className="font-serif text-[15.75px] font-bold text-maya-cream">
          {config.content.topics[0].title}
        </h2>
        <p className="text-[13.5px] text-maya-text leading-relaxed">{COPY.intro}</p>
        <p className="text-[12.5px] text-maya-textDim leading-relaxed italic border-l-2 border-maya-gold/50 pl-3">
          {COPY.evidence}
        </p>
      </aside>

      {/* Plan view: one instance. Large while predicting (the arc is the tap
          target), mini-map in the corner while exploring. */}
      <div
        className={`pointer-events-auto absolute right-6 bottom-28 p-2 bg-maya-surface/85 backdrop-blur-xl border border-maya-gold/30 rounded-lg shadow-xl ${
          predicting ? 'w-[296px] h-[388px]' : 'w-[150px] h-[190px]'
        }`}
      >
        <PlanView
          azimuthDeg={positionToAzimuthDeg(sliderPosition)}
          activeId={activeBuilding}
          prediction={prediction}
          predicting={predicting}
          onPredict={handlePredict}
        />
      </div>

      {/* Callout (above the bar, left of the plan view). The live region is
          always mounted; only its content comes and goes. */}
      <div aria-live="polite" className="pointer-events-none absolute left-6 bottom-32 w-[30rem]">
        {!predicting && activeCallout && (
          <div className="pointer-events-auto p-4 space-y-1.5 bg-maya-surface/95 backdrop-blur-xl border border-maya-gold/40 rounded-lg shadow-xl">
            <h3 className="font-serif text-[15px] font-bold text-maya-gold">
              {activeCallout.label}
            </h3>
            {(activeCallout.lines ?? []).map((line) => (
              <p key={line} className="text-[13.5px] text-maya-text">
                {line}
              </p>
            ))}
            {verdict && (
              <p className="text-[14px] font-bold text-maya-cream pt-1">{COPY.verdicts[verdict]}</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        className={`pointer-events-auto mt-auto relative ${
          predicting ? 'mr-[calc(296px+1.5rem)]' : 'mr-[calc(150px+1.5rem)]'
        }`}
      >
        <div id="lesson-instrument" ref={instrumentRef} tabIndex={-1} className="outline-none">
          {predicting ? (
            <div className="flex items-center justify-between gap-4 px-4 py-3 bg-maya-surface/90 border border-maya-gold/30 rounded-lg">
              <p className="text-[14px] text-maya-cream font-medium">{COPY.prompt}</p>
              <button
                type="button"
                onClick={() => setPhase('exploring')}
                className="shrink-0 px-2 py-1 rounded-md text-xs text-maya-textDim hover:text-maya-text underline cursor-pointer"
              >
                {COPY.skip}
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <AtmosphereTimeline
                keyframes={skyTimeline}
                value={sliderPosition}
                onLiveChange={onSliderPositionChange}
                onStepSelect={onStepSelect}
              />
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {KEY_DATES.map((key, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onStepSelect(i + 1)}
                      aria-pressed={activeIndex === i}
                      className={`px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                        activeIndex === i
                          ? 'bg-maya-gold/20 text-maya-cream'
                          : 'text-maya-textDim hover:text-maya-text'
                      }`}
                    >
                      {key.label}
                    </button>
                  ))}
                </div>
                <span className="ml-auto text-xs font-mono text-maya-gold">
                  {dateLabel(positionToDay(sliderPosition))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
