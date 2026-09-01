import React from 'react';
import { ModelLoader, preloadLessonModels } from '../../core/components/ModelLoader';
import { FixedGlbCamera } from '../../core/components/FixedGlbCamera';
import { SceneEnvironment } from '../../core/components/SceneEnvironment';
import { SceneLighting } from '../../core/components/SceneLighting';
import { AtmosphereSample, LessonConfig, ModelAsset } from '../../core/types/lesson.types';

interface Lesson01SceneProps {
  config: LessonConfig;
  /** Derived sample of the Atmosphere Timeline (ADR-001). */
  atmosphere: AtmosphereSample;
}

// Preload all 3 GLBs in parallel at module init time.
// useGLTF caches by URL so these are ready before Suspense fires.
preloadLessonModels([
  '/assets/lesson_01/Lesson01_Floor_v003.glb',
  '/assets/lesson_01/Lesson01_Layout_v003.glb',
  '/assets/lesson_01/Lesson01_Trees_v003.glb'
]);

/**
 * Lesson 01 3D Scene Assembly
 *
 * Composes the scene from independent, reusable infrastructure components:
 *   - FixedGlbCamera  — locks the view to the authored GLB camera
 *   - SceneEnvironment — equirectangular sky dome + IBL
 *   - SceneLighting   — directional sun (ambient fill removed; IBL provides fill)
 *   - ModelLoader × 3 — Floor, Layout (pyramid), Trees (independently cached)
 */
export const Lesson01Scene: React.FC<Lesson01SceneProps> = ({ config, atmosphere }) => {
  // Resolve the three required models by id. These lookups are hard-coded to
  // this scene's assembly, so a missing id is a config/scene desync — fail
  // loudly (the error boundary surfaces it) instead of a silent undefined.
  const requireModel = (id: string): ModelAsset => {
    const asset = config.assets.models.find((m) => m.id === id);
    if (!asset) {
      throw new Error(
        `Lesson01Scene: required model "${id}" is missing from config.assets.models. ` +
          'The lesson config and scene assembly are out of sync.'
      );
    }
    return asset;
  };
  const floorAsset = requireModel('floor');
  const layoutAsset = requireModel('layout');
  const treesAsset = requireModel('trees');

  return (
    <>
      {/* Fixed Cinematic Camera — position/quaternion baked from GLB authoring data */}
      <FixedGlbCamera config={config.camera} />

      {/* Sky crossfade + IBL, driven by the Atmosphere Timeline sample */}
      <SceneEnvironment config={config.assets.environment} sample={atmosphere} />

      {/* Directional Sun Light — rotation + intensity both interpolate between
          timeline keyframes. Intensity falls back to the lesson-level constant
          when neither adjacent keyframe sets it (e.g. the lesson default's
          3-step timeline doesn't override the sun). */}
      <SceneLighting
        rotation={atmosphere.lightRotation}
        intensity={atmosphere.directionalIntensity ?? config.lighting.directional.intensity}
        color={config.lighting.directional.color}
        castShadow={config.lighting.directional.castShadow}
      />

      {/* 3D Scene Geometry — each GLB loaded independently */}
      <group name="Lesson01_Root">
        <ModelLoader asset={floorAsset} />
        <ModelLoader asset={layoutAsset} />
        <ModelLoader asset={treesAsset} />
      </group>
    </>
  );
};
