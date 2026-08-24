import React from 'react';
import { LessonConfig } from '../core/types/lesson.types';
import { lesson01Config } from './lesson01/config';
import { Lesson01Scene } from './lesson01/Lesson01Scene';
import { Lesson01Overlay } from './lesson01/Lesson01Overlay';
import { lesson02Config } from './lesson02/config';

export interface LessonEntry {
  config: LessonConfig;
  SceneComponent: React.ComponentType<{
    config: LessonConfig;
    runtimeState: any;
  }>;
  OverlayComponent?: React.ComponentType<{
    config: LessonConfig;
    isDevPanelVisible: boolean;
    onToggleDevPanel: () => void;
    onSelectEnvironmentPreset?: (url: string) => void;
    currentEnvUrl?: string;
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
