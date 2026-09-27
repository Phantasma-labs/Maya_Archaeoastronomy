import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Lock } from 'lucide-react';
import { getAllLessons } from '../lessons/registry';

/**
 * LandingPage — the observatory entrance.
 *
 * Single-viewport layout: the panorama fills the screen behind a compact hero
 * (brand kicker, headline, copy) at the top and the expedition catalog
 * (short card thumbnails, condensed body) centred below it. No top
 * header or footer — the brand is carried by the hero kicker. The landing
 * stays free of the 3D stack — the backdrop is a plain <img> reusing the
 * dedicated landing asset at /assets/landing/hero-panorama.webp (separate
 * from the in-lesson sky panoramas, which the lesson scene owns).
 */
export const LandingPage: React.FC = () => {
  const lessons = getAllLessons();

  return (
    <div className="h-screen bg-maya-bg text-maya-text flex flex-col selection:bg-maya-gold/30 selection:text-maya-cream overflow-hidden">
      {/* Skip link — keyboard users jump straight to the expedition catalog. */}
      <a
        href="#expeditions"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:bg-maya-gold focus:text-maya-bg focus:text-sm focus:font-medium"
      >
        Skip to expeditions
      </a>

      {/* Backdrop — the dedicated Chichén Itzá panorama from /assets/landing/
          fills the viewport at full strength. A light scrim at the top keeps
          the headline legible and one at the bottom seats the catalog cards.
          Decorative (aria-hidden). WebP keeps it ~115 KB at 1280×640 — see
          ImageMagick recipe in the project docs. */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img
          src="/assets/landing/hero-panorama.webp"
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: '55% center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-maya-bg/75 via-transparent to-maya-bg/40" />
        {/* Vignette — darkens the corners and edges, drawing the eye to the pyramid. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 75% 70% at 50% 50%, transparent 45%, rgba(9, 11, 16, 0.9) 100%)'
          }}
        />
      </div>

      {/* Hero — observatory entrance (compact) */}
      <section className="relative z-10 px-6 pt-20 pb-6 md:pt-28 md:pb-8 flex-shrink-0">
        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-3 md:space-y-4">
          <p className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.25em] text-maya-gold">
            A Digital Archaeological Observatory
          </p>

          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-maya-cream leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
            Where Ancient Stone Encodes the Sky
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-maya-text max-w-2xl mx-auto leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
            Step into cinematic, high-fidelity 3D reconstructions of Maya monuments. Investigate how
            the ancient Maya synchronized monumental architecture with equinox solar shadows,
            calendar rounds, and planetary cycles.
          </p>
        </div>
      </section>

      {/* Expedition Catalog (compact) — vertically centred in the space below
          the hero (my-auto; the bottom padding lifts it toward the middle of
          the screen). */}
      <main
        id="expeditions"
        className="relative z-10 my-auto max-w-7xl mx-auto px-6 pb-[clamp(2rem,16vh,10rem)] w-full flex flex-col"
      >
        <div className="flex items-end justify-between mb-2 border-b border-white/15 pb-2 flex-shrink-0 drop-shadow-[0_1px_5px_rgba(0,0,0,0.9)]">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-maya-cream">
              Expeditions
            </h3>
            <p className="text-[11px] text-maya-text mt-0.5 hidden sm:block">
              Select an archaeological module to begin the interactive 3D investigation
            </p>
          </div>
          <span className="text-[11px] font-mono text-maya-gold">{lessons.length} Modules</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
          {lessons.map((lesson) => {
            const isAvailable = lesson.status === 'available';

            const dossier = (
              <div
                className={`group relative rounded-xl border transition-all duration-300 flex flex-row overflow-hidden ${
                  isAvailable
                    ? 'bg-maya-surface/80 backdrop-blur-md border-maya-gold/25 hover:border-maya-gold/60'
                    : 'bg-maya-bg/70 backdrop-blur-md border-white/10 opacity-75'
                }`}
              >
                {/* Thumbnail — compact side-by-side thumbnail */}
                <div className="relative w-32 sm:w-40 md:w-48 h-28 sm:h-32 md:h-36 flex-shrink-0 bg-maya-surfaceHover overflow-hidden">
                  <img
                    src={lesson.thumbnail}
                    alt={lesson.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-maya-surface/60 via-maya-surface/20 to-transparent" />

                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-maya-bg/90 border border-maya-gold/40 text-maya-gold">
                      {lesson.id}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2">
                    {isAvailable ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Live
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-900/80 border border-white/10 text-stone-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Soon
                      </span>
                    )}
                  </div>
                </div>

                {/* Dossier body — compact, side of thumbnail */}
                <div className="p-4 flex-1 flex flex-col justify-between min-w-0 space-y-2">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-maya-gold font-semibold tracking-wider uppercase truncate">
                      {lesson.subtitle}
                    </div>
                    <h4 className="font-serif text-sm sm:text-base font-bold text-maya-cream leading-snug group-hover:text-maya-gold transition-colors line-clamp-2">
                      {lesson.title}
                    </h4>
                    <p className="text-[11px] text-maya-textDim line-clamp-2 leading-relaxed">
                      {lesson.tagline}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-maya-textDim font-mono">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-maya-gold" />
                      {lesson.content.topics.length} Alignments
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
                className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maya-gold/60 min-h-0"
              >
                {dossier}
              </Link>
            ) : (
              <div key={lesson.id} className="min-h-0">
                {dossier}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
