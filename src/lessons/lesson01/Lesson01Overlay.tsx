import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Sun,
  Calendar,
  Clock,
  Orbit,
  Compass,
  Info,
  ChevronRight,
  Sparkles,
  Layers,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { LessonConfig } from '../../core/types/lesson.types';
import { AtmosphereTimeline } from '../../core/components/AtmosphereTimeline';

interface Lesson01OverlayProps {
  config: LessonConfig;
  /** Continuous Atmosphere Timeline position in [1, N] (ADR-001). */
  sliderPosition: number;
  /** Live scrubbing updates from dragging the timeline. */
  onSliderPositionChange: (position: number) => void;
  /** Step-marker clicks — LessonPage runs the eased sweep. */
  onStepSelect: (step: number) => void;
}

const topicIcons: Record<string, React.ReactNode> = {
  'solar-calendar': <Calendar className="w-4 h-4" />,
  'equinox-shadow': <Sun className="w-4 h-4" />,
  'calendar-round': <Clock className="w-4 h-4" />,
  'venus-cycle': <Orbit className="w-4 h-4" />,
  'solar-zenith': <Compass className="w-4 h-4" />
};

export const Lesson01Overlay: React.FC<Lesson01OverlayProps> = ({
  config,
  sliderPosition,
  onSliderPositionChange,
  onStepSelect
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(config.content.topics[0].id);
  const [isStudyPanelOpen, setIsStudyPanelOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'topics' | 'monument' | 'environment'>('topics');

  const selectedTopic = config.content.topics.find((t) => t.id === selectedTopicId) || config.content.topics[0];

  // Nearest timeline keyframe — drives the "Active" badge in the Atmosphere tab.
  const skyTimeline = config.assets.environment.skyTimeline;
  const activeIndex = Math.min(Math.max(Math.round(sliderPosition) - 1, 0), skyTimeline.length - 1);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 md:p-6 select-none z-20">
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

        {/* View status & Study toggle */}
        <div className="flex items-center gap-2">
          {/* Fixed Camera Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12151e]/70 backdrop-blur-md border border-white/10 text-[11px] text-[#a39e93] font-mono">
            <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Cinematic Fixed Viewpoint</span>
          </div>

          {/* Study Drawer Toggle */}
          <button
            onClick={() => setIsStudyPanelOpen(!isStudyPanelOpen)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium backdrop-blur-md border transition-all shadow-lg cursor-pointer ${
              isStudyPanelOpen
                ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f5ecd7]'
                : 'bg-[#12151e]/85 border-[#d4af37]/20 text-[#e6dfd3] hover:border-[#d4af37]/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#d4af37]" />
            <span className="hidden sm:inline">Curriculum</span>
          </button>
        </div>
      </header>

      {/* Main Interactive Pedagogical Drawer / Overlay */}
      {isStudyPanelOpen && (
        <aside className="pointer-events-auto self-start max-w-lg w-full bg-[#12151e]/90 backdrop-blur-xl border border-[#d4af37]/30 rounded-2xl p-5 shadow-2xl mt-4 max-h-[calc(100vh-140px)] flex flex-col overflow-hidden text-[#e6dfd3] animate-fadeIn">
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
              <button
                onClick={() => setActiveTab('environment')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'environment'
                    ? 'bg-[#d4af37]/20 text-[#f5ecd7] border border-[#d4af37]/40'
                    : 'text-[#a39e93] hover:text-[#e6dfd3]'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-[#d4af37]" />
                Sky Presets
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
                      onClick={() => setSelectedTopicId(topic.id)}
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

          {/* Tab 3: Atmosphere Timeline keyframes (ADR-001) */}
          {activeTab === 'environment' && (
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#d4af37] block">
                Atmosphere Timeline Keyframes
              </span>
              <p className="text-[11px] text-[#8e897e] leading-relaxed">
                Drag the Atmosphere slider below to blend continuously between these authored
                sky states — the sun and reflections follow the in-between values.
              </p>
              <div className="space-y-2">
                {skyTimeline.map((keyframe, i) => {
                  const step = i + 1;
                  const isActive = i === activeIndex;
                  return (
                    <button
                      key={keyframe.id}
                      onClick={() => onStepSelect(step)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f5ecd7]'
                          : 'bg-[#181c28]/60 border-white/10 text-[#a39e93] hover:bg-[#1f2536] hover:text-[#e6dfd3]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs flex items-center gap-2">
                          <span className="font-mono text-[#d4af37]/70">{step}.</span>
                          <span>{keyframe.name}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#d4af37] text-black font-bold">
                              Active
                            </span>
                          )}
                        </div>
                        {keyframe.description && (
                          <div className="text-[11px] text-[#8e897e] mt-0.5">{keyframe.description}</div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#d4af37]" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      )}

      {/* Atmosphere Timeline — the lesson's single environment control (ADR-001) */}
      <div className="pointer-events-auto w-full max-w-xl mx-auto mt-auto mb-2">
        <AtmosphereTimeline
          keyframes={skyTimeline}
          value={sliderPosition}
          onLiveChange={onSliderPositionChange}
          onStepSelect={onStepSelect}
        />
      </div>

      {/* Bottom Footer Info Bar */}
      <footer className="flex items-center justify-between gap-4 pointer-events-auto text-[11px] text-[#8e897e] font-mono bg-[#12151e]/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-4">
          <span>Maya Archaeoastronomy v1.0</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Fixed Observer Camera: 20.6843° N, 88.5678° W</span>
        </div>
        <div className="flex items-center gap-3 text-[#a39e93]">
          <span className="hidden md:inline">3D Assets: Floor, Layout, Trees GLB</span>
          <span className="text-[#d4af37]">Equirectangular Panorama Sky + IBL</span>
        </div>
      </footer>
    </div>
  );
};
