import React, { lazy } from 'react';
import { AtmosphereSample, LessonConfig, SkyKeyframe } from '../core/types/lesson.types';
import { lesson01Config } from './lesson01/config';
import { lesson02Config } from './lesson02/config';

// Route-level code splitting (TECH_DEBT H3): the scene/overlay modules pull in
// the whole three/drei/R3F stack and preload the lesson GLBs at module scope.
// Lazy-loading them keeps the landing page free of the 3D stack — importing
// this registry (as LandingPage does) only loads the small config modules.
// The scene/overlay chunks load on first visit to a lesson route.
const Lesson01Scene = lazy(() =>
  import('./lesson01/Lesson01Scene').then((m) => ({ default: m.Lesson01Scene }))
);
const Lesson01Overlay = lazy(() =>
  import('./lesson01/Lesson01Overlay').then((m) => ({ default: m.Lesson01Overlay }))
);

export interface LessonEntry {
  config: LessonConfig;
  SceneComponent: React.ComponentType<{
    config: LessonConfig;
    /** Derived sample of the Atmosphere Timeline at the current slider position. */
    atmosphere: AtmosphereSample;
  }>;
  OverlayComponent?: React.ComponentType<{
    config: LessonConfig;
    /** Continuous slider position in [1, N] over environment.skyTimeline. */
    sliderPosition: number;
    /** Live scrubbing updates (drag / keyboard nudges). */
    onSliderPositionChange: (position: number) => void;
    /** Step-marker clicks — the overlay animates the ~0.6 s sweep. */
    onStepSelect: (step: number) => void;
    /** Controlled selected topic id (lifted to LessonPage for slider reset). */
    selectedTopicId: string;
    /** Topic selection callback — parent resets the timeline position. */
    onSelectTopic: (id: string) => void;
    /** Active skyTimeline: the selected topic's own, or the lesson default. */
    skyTimeline: SkyKeyframe[];
  }>;
}

/**
 * Global Lesson Registry
 * Adding a new lesson (e.g. Lesson 02) requires only registering its entry here.
 */
export const LESSON_REGISTRY: Record<string, LessonEntry> = {
  '01': {
    config: lesson01Config,
    SceneComponent: Lesson01Scene,
    OverlayComponent: Lesson01Overlay
  },
  '02': {
    config: lesson02Config,
    SceneComponent: Lesson01Scene // Placeholder scene component until custom assets are added
  }
};

/**
 * Fetch all registered lessons for the catalog/landing page
 */
export function getAllLessons(): LessonConfig[] {
  return Object.values(LESSON_REGISTRY).map((entry) => entry.config);
}

/**
 * Find a lesson entry by ID or slug (e.g., '01' or '1')
 */
export function getLessonEntry(idOrSlug: string): LessonEntry | undefined {
  const normalized = idOrSlug.padStart(2, '0');
  return LESSON_REGISTRY[normalized] || LESSON_REGISTRY[idOrSlug];
}
