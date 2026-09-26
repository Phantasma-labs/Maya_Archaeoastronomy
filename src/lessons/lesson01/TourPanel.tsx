import React from 'react';
import { TourEvidence, TourStop } from '../../core/types/lesson.types';

interface TourPanelProps {
  stops: TourStop[];
  /** Continuous tour position in [1, N]; the nearest stop is shown. */
  value: number;
}

const STATUS_LABEL: Record<TourEvidence, string> = {
  documented: 'Documented',
  interpretation: 'Interpretation',
  mixed: 'Documented · interpreted link'
};

// Documented = solid gold chip; interpretation = dashed, dimmer chip, so the
// evidence/interpretation distinction reads at a glance, not only by label.
const STATUS_STYLE: Record<TourEvidence, string> = {
  documented: 'border-maya-gold/60 bg-maya-gold/15 text-maya-goldLight',
  interpretation: 'border-dashed border-white/30 bg-white/5 text-maya-textDim',
  mixed: 'border-dashed border-maya-gold/50 bg-maya-gold/10 text-maya-goldLight'
};

/**
 * TourPanel — the current tour step's explanation. Pure view of the derived
 * step (nearest stop to `value`); holds no state (ADR-001).
 */
export const TourPanel: React.FC<TourPanelProps> = ({ stops, value }) => {
  const n = stops.length;
  if (n === 0) return null;
  const index = Math.min(n - 1, Math.max(0, Math.round(value) - 1));
  const { info } = stops[index];

  return (
    <section
      aria-live="polite"
      aria-label="Tour step"
      className="bg-maya-surfaceHover/70 border border-maya-gold/30 rounded-xl p-4 space-y-2.5"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
        <span className="whitespace-nowrap text-[11px] font-mono uppercase tracking-wider text-maya-gold">
          Step {index + 1} of {n}
        </span>
        <span
          className={`whitespace-nowrap text-[11px] font-mono px-2 py-0.5 rounded-full border ${STATUS_STYLE[info.status]}`}
        >
          {STATUS_LABEL[info.status]}
        </span>
      </div>

      {info.figure && (
        <p className="font-serif text-3xl font-bold text-maya-cream leading-none">{info.figure}</p>
      )}
      <h3 className="font-serif text-[15px] font-bold text-maya-cream">{info.headline}</h3>

      <ul className="space-y-2 text-[13.5px] text-maya-textDim leading-relaxed">
        {info.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
};
