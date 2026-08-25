import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  Sparkles,
  Sun,
  Calendar,
  Clock,
  Lock,
  Layers,
  Globe
} from 'lucide-react';
import { getAllLessons } from '../lessons/registry';

export const LandingPage: React.FC = () => {
  const lessons = getAllLessons();

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

          <div className="flex items-center gap-4 text-xs font-mono text-maya-textDim">
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-maya-surface border border-white/5">
              <Globe className="w-3.5 h-3.5 text-maya-gold" />
              Mesoamerican Horizons
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-maya-gold/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-maya-surfaceHover border border-maya-gold/30 text-maya-gold text-xs font-mono font-medium shadow-lg">
            <Sparkles className="w-3.5 h-3.5" />
            3D Spatial Learning Platform
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-maya-cream leading-tight">
            Where Ancient Stone Encodes the Sky
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-maya-textDim max-w-2xl mx-auto leading-relaxed">
            Step into cinematic, high-fidelity 3D reconstructions of Maya monuments. Investigate how
            the ancient Maya synchronized monumental architecture with equinox solar shadows,
            calendar rounds, and planetary cycles.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-maya-textDim">
            <span className="flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-maya-gold" /> Solar Alignments
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-maya-gold" /> 365-Day Haab Cycle
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-maya-gold" /> 52-Year Calendar Round
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-maya-gold" /> Serpent Shadow Phenomenon
            </span>
          </div>
        </div>
      </section>

      {/* Lesson Catalog Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 pb-24 w-full">
        <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-maya-cream">
              Curriculum Lessons
            </h3>
            <p className="text-xs sm:text-sm text-maya-textDim mt-1">
              Select an archaeological module to begin the interactive 3D investigation
            </p>
          </div>
          <span className="text-xs font-mono text-maya-gold">
            {lessons.length} Modules Available
          </span>
        </div>

        {/* Lesson Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => {
            const isAvailable = lesson.status === 'available';

            return (
              <div
                key={lesson.id}
                className={`group relative rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden ${
                  isAvailable
                    ? 'bg-maya-surface/90 border-maya-gold/30 hover:border-maya-gold shadow-xl hover:shadow-maya-gold/10 hover:-translate-y-1'
                    : 'bg-maya-bg/60 border-white/10 opacity-75'
                }`}
              >
                {/* Card Banner / Thumbnail */}
                <div className="relative h-48 w-full bg-maya-surfaceHover overflow-hidden">
                  <img
                    src={lesson.thumbnail}
                    alt={lesson.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-maya-surface via-maya-surface/40 to-transparent" />

                  {/* Status Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase bg-maya-bg/90 backdrop-blur-md border border-maya-gold/40 text-maya-gold">
                      Lesson {lesson.id}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-maya-bg/80 backdrop-blur-md text-maya-textDim">
                      {lesson.difficulty}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    {isAvailable ? (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 backdrop-blur-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Available Now
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-stone-900/80 border border-white/10 text-stone-400 backdrop-blur-md flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
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

                  {/* Feature Pills */}
                  <div className="pt-2 border-t border-white/5 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-maya-textDim font-mono">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-maya-gold" />
                        {lesson.content.topics.length} Core Alignments
                      </span>
                      <span>{lesson.duration}</span>
                    </div>

                    {/* Action Button */}
                    {isAvailable ? (
                      <Link
                        to={`/lesson/${lesson.slug}`}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-maya-goldDark via-maya-gold to-maya-goldLight text-maya-bg font-serif font-bold text-xs tracking-wider uppercase hover:brightness-110 transition-all shadow-lg shadow-maya-gold/15 cursor-pointer"
                      >
                        <span>Launch 3D Experience</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-maya-surfaceHover border border-white/10 text-maya-textDim font-mono text-xs cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Curriculum in Development</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-maya-bg py-8 px-6 text-center text-xs text-maya-textDim font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>Maya Archaeoastronomy Learning Platform • React Three Fiber Architecture</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-maya-gold transition-colors">Documentation</span>
            <span className="hover:text-maya-gold transition-colors">Archaeological Sources</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
