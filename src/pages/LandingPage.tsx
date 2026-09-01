import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Lock } from 'lucide-react';
import { getAllLessons } from '../lessons/registry';

/**
 * LandingPage — the observatory entrance (V02 design plan §3).
 *
 * Single-viewport layout: compressed hero with the brand kicker, headline,
 * copy and CTA, followed by a compact expedition catalog (short card
 * thumbnails, condensed body) and a thin footer. No top header — the brand
 * is carried by the hero kicker and the wordmark glyph is omitted by
 * design so the full landing reads above the fold on a standard 1080p
 * desktop. The landing stays free of the 3D stack — the hero backdrop is a
 * plain <img> reusing the dedicated landing asset at
 * /assets/landing/hero-panorama.webp (separate from the in-lesson sky
 * panoramas, which the lesson scene owns).
 */
export const LandingPage: React.FC = () => {
  const lessons = getAllLessons();

  return (
    <div className="h-screen bg-maya-bg text-maya-text flex flex-col selection:bg-maya-gold/30 selection:text-maya-cream overflow-hidden">
      {/* Skip link — keyboard users jump straight to the expedition catalog
          (V02 Phase E). */}
      <a
        href="#expeditions"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:bg-maya-gold focus:text-maya-bg focus:text-sm focus:font-medium"
      >
        Skip to expeditions
      </a>

      {/* Hero — observatory entrance (compact) */}
      <section className="relative px-6 pt-8 pb-6 md:pt-10 md:pb-8 overflow-hidden flex-shrink-0">
        {/* Quiet sky backdrop — the dedicated Chichén Itzá panorama from
            /assets/landing/, dimmed to a horizon and faded into the page
            ground. Decorative (aria-hidden). WebP keeps it ~115 KB at
            1280×640 — see ImageMagick recipe in the project docs. */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/assets/landing/hero-panorama.webp"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-maya-bg/70 via-maya-bg/40 to-maya-bg" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-3 md:space-y-4">
          <p className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.25em] text-maya-gold">
            A Digital Archaeological Observatory
          </p>

          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-maya-cream leading-tight">
            Where Ancient Stone Encodes the Sky
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-maya-textDim max-w-2xl mx-auto leading-relaxed">
            Step into cinematic, high-fidelity 3D reconstructions of Maya monuments. Investigate how
            the ancient Maya synchronized monumental architecture with equinox solar shadows,
            calendar rounds, and planetary cycles.
          </p>
        </div>
      </section>

      {/* Expedition Catalog (compact) */}
      <main
        id="expeditions"
        className="flex-1 min-h-0 max-w-7xl mx-auto px-6 pb-2 w-full flex flex-col"
      >
        <div className="flex items-end justify-between mb-2 border-b border-white/10 pb-2 flex-shrink-0">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-maya-cream">
              Expeditions
            </h3>
            <p className="text-[11px] text-maya-textDim mt-0.5 hidden sm:block">
              Select an archaeological module to begin the interactive 3D investigation
            </p>
          </div>
          <span className="text-[11px] font-mono text-maya-gold">
            {lessons.length} Modules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
          {lessons.map((lesson) => {
            const isAvailable = lesson.status === 'available';

            const dossier = (
              <div
                className={`group relative rounded-xl border transition-all duration-300 flex flex-row overflow-hidden ${
                  isAvailable
                    ? 'bg-maya-surface border-maya-gold/25 hover:border-maya-gold/60'
                    : 'bg-maya-bg/60 border-white/10 opacity-75'
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

      {/* Footer — thin one-liner */}
      <footer className="flex-shrink-0 border-t border-white/10 bg-maya-bg py-2 px-6 text-center text-[10px] sm:text-[11px] text-maya-textDim font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>Maya Archaeoastronomy Learning Platform · React Three Fiber Architecture</p>
          <p>Content vetted for scholarly caution — evidence and interpretation kept distinct</p>
        </div>
      </footer>
    </div>
  );
};
