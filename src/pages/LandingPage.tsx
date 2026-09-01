import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight, Layers, Lock, Globe } from 'lucide-react';
import { getAllLessons } from '../lessons/registry';

/**
 * LandingPage — the observatory entrance (V02 design plan §3).
 *
 * Editorial hero over a dimmed sky panorama, then the expedition catalog:
 * each available lesson is a field dossier whose whole card is the entry
 * point (no separate CTA button). The landing stays free of the 3D stack —
 * the hero backdrop is a plain <img> reusing the lesson-01 thumbnail asset,
 * so it adds no network cost beyond what the catalog already loads.
 */
export const LandingPage: React.FC = () => {
  const lessons = getAllLessons();
  const firstAvailable = lessons.find((l) => l.status === 'available');

  return (
    <div className="min-h-screen bg-maya-bg text-maya-text flex flex-col selection:bg-maya-gold/30 selection:text-maya-cream">
      {/* Top Header */}
      <header className="border-b border-maya-gold/20 bg-maya-bg/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-maya-goldDark via-maya-gold to-maya-goldLight flex items-center justify-center p-[1px] shadow-lg shadow-maya-gold/10">
              <div className="w-full h-full bg-maya-bg rounded-[11px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-maya-gold" />
              </div>
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold tracking-wider text-maya-cream">
                MAYA ARCHAEOASTRONOMY
              </h1>
              <p className="text-[11px] font-mono text-maya-textDim">
                Interactive 3D Celestial Architecture
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-maya-textDim">
            <Globe className="w-3.5 h-3.5 text-maya-gold" />
            <span>Mesoamerican Horizons · 20.68° N</span>
          </div>
        </div>
      </header>

      {/* Hero — observatory entrance */}
      <section className="relative px-6 pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        {/* Quiet sky backdrop — the shared Chichén Itzá panorama, dimmed to a
            horizon and faded into the page ground. Decorative (aria-hidden). */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/assets/lesson_01/01.webp"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-maya-bg/70 via-maya-bg/40 to-maya-bg" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-6">
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-maya-gold">
            A Digital Archaeological Observatory
          </p>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-maya-cream leading-tight">
            Where Ancient Stone Encodes the Sky
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-maya-textDim max-w-2xl mx-auto leading-relaxed">
            Step into cinematic, high-fidelity 3D reconstructions of Maya monuments. Investigate how
            the ancient Maya synchronized monumental architecture with equinox solar shadows,
            calendar rounds, and planetary cycles.
          </p>

          {firstAvailable && (
            <div className="pt-2">
              <Link
                to={`/lesson/${firstAvailable.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-maya-gold text-maya-bg font-serif font-bold text-sm tracking-wider uppercase hover:brightness-110 transition-all cursor-pointer"
              >
                Begin the Investigation
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Expedition Catalog */}
      <main className="flex-1 max-w-7xl mx-auto px-6 pb-24 w-full">
        <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-maya-cream">
              Expeditions
            </h3>
            <p className="text-xs sm:text-sm text-maya-textDim mt-1">
              Select an archaeological module to begin the interactive 3D investigation
            </p>
          </div>
          <span className="text-xs font-mono text-maya-gold">
            {lessons.length} Modules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => {
            const isAvailable = lesson.status === 'available';

            const dossier = (
              <div
                className={`group relative rounded-xl border transition-all duration-300 flex flex-col overflow-hidden ${
                  isAvailable
                    ? 'bg-maya-surface border-maya-gold/25 hover:border-maya-gold/60'
                    : 'bg-maya-bg/60 border-white/10 opacity-75'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative h-44 w-full bg-maya-surfaceHover overflow-hidden">
                  <img
                    src={lesson.thumbnail}
                    alt={lesson.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-maya-surface via-maya-surface/40 to-transparent" />

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase bg-maya-bg/90 border border-maya-gold/40 text-maya-gold">
                      Expedition {lesson.id}
                    </span>
                    <span className="px-2.5 py-1 rounded text-[11px] font-mono bg-maya-bg/80 text-maya-textDim">
                      {lesson.difficulty}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    {isAvailable ? (
                      <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Available
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded text-[11px] font-mono bg-stone-900/80 border border-white/10 text-stone-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>

                {/* Dossier body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono text-maya-gold font-semibold tracking-wider uppercase">
                      {lesson.subtitle}
                    </div>
                    <h4 className="font-serif text-base sm:text-lg font-bold text-maya-cream leading-snug group-hover:text-maya-gold transition-colors">
                      {lesson.title}
                    </h4>
                    <p className="text-xs text-maya-textDim line-clamp-3 leading-relaxed">
                      {lesson.tagline}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-maya-textDim font-mono">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-maya-gold" />
                      {lesson.content.topics.length} Core Alignments
                    </span>
                    <span>{lesson.duration}</span>
                  </div>
                </div>
              </div>
            );

            // Available lessons: the whole card is the entry point.
            return isAvailable ? (
              <Link
                key={lesson.id}
                to={`/lesson/${lesson.slug}`}
                className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maya-gold/60"
              >
                {dossier}
              </Link>
            ) : (
              <div key={lesson.id}>{dossier}</div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-maya-bg py-8 px-6 text-center text-xs text-maya-textDim font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>Maya Archaeoastronomy Learning Platform · React Three Fiber Architecture</p>
          <p>Content vetted for scholarly caution — evidence and interpretation kept distinct</p>
        </div>
      </footer>
    </div>
  );
};
