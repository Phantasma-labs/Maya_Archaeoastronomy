import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TourStop } from '../../core/types/lesson.types';

interface TourStepperProps {
  stops: TourStop[];
  /** Continuous tour position in [1, N]. */
  value: number;
  /** Step navigation — the parent runs the eased camera sweep. */
  onStepSelect: (step: number) => void;
}

/**
 * TourStepper — prev/next + one dot per stop. Stateless: the active step is
 * derived from `value`, navigation goes through `onStepSelect` (the same
 * eased sweep the sky slider uses), so the camera glides between viewpoints.
 */
export const TourStepper: React.FC<TourStepperProps> = ({ stops, value, onStepSelect }) => {
  const n = stops.length;
  if (n === 0) return null;
  const active = Math.min(n, Math.max(1, Math.round(value)));
  const go = (step: number) => onStepSelect(Math.min(n, Math.max(1, step)));

  const navButton =
    'flex h-7 w-7 items-center justify-center rounded-full text-maya-textDim transition-colors ' +
    'hover:text-maya-gold disabled:opacity-30 disabled:hover:text-maya-textDim cursor-pointer disabled:cursor-default';

  return (
    <nav
      aria-label="Architecture tour"
      className="mx-auto flex w-full max-w-[640px] items-center justify-center gap-3 rounded-full border border-maya-gold/30 bg-maya-surface/90 px-3 py-1.5 backdrop-blur-xl"
    >
      <button
        type="button"
        aria-label="Previous step"
        disabled={active === 1}
        onClick={() => go(active - 1)}
        className={navButton}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <ol className="flex items-center">
        {stops.map((stop, i) => (
          <li key={stop.id}>
            <button
              type="button"
              aria-label={`Step ${i + 1}: ${stop.label}`}
              aria-current={active === i + 1 ? 'step' : undefined}
              title={stop.label}
              onClick={() => go(i + 1)}
              className="flex h-6 w-6 items-center justify-center cursor-pointer"
            >
              <span
                className={`block rounded-full transition-all ${
                  active === i + 1
                    ? 'h-3 w-3 bg-maya-gold'
                    : 'h-2 w-2 bg-maya-textDim/50 hover:bg-maya-textDim'
                }`}
              />
            </button>
          </li>
        ))}
      </ol>

      <span className="min-w-[8.5rem] text-center font-mono text-[11px] text-maya-textDim">
        {active} / {n} · {stops[active - 1].label}
      </span>

      <button
        type="button"
        aria-label="Next step"
        disabled={active === n}
        onClick={() => go(active + 1)}
        className={navButton}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
};
