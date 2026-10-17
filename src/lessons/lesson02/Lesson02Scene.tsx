import React, { useMemo } from 'react';
import { ModelLoader, preloadLessonModels } from '../../core/components/ModelLoader';
import { FixedGlbCamera } from '../../core/components/FixedGlbCamera';
import { SceneEnvironment } from '../../core/components/SceneEnvironment';
import { SceneLighting } from '../../core/components/SceneLighting';
import { AtmosphereSample, LessonConfig, ModelAsset } from '../../core/types/lesson.types';
import { sunLightRotation } from '../../core/utils/sunrise';
import { KEY_DATES, SUN_ELEVATION_DEG, activeKeyDate, positionToAzimuthDeg } from './sunPath';
import { lesson02Config } from './config';
import { StandInBuildings } from './StandInBuildings';
import { SunDisc } from './SunDisc';

interface Lesson02SceneProps {
  config: LessonConfig;
  /** Derived sample of the Atmosphere Timeline (sky + IBL only here). */
  atmosphere: AtmosphereSample;
  topicId: string;
  /** Continuous `sliderPosition` (1..5) over the five key sunrises. */
  position: number;
}

// Warm the GLB cache at module init; useGLTF caches by URL.
preloadLessonModels(lesson02Config.assets.models.map((m) => m.url));

/**
 * Lesson 02 3D scene: Group E at Uaxactun looking due east from E-VII-sub.
 * The sun azimuth is derived from `position` (ADR-001) — the sun disc and the
 * directional light both follow it; the timeline's own lightRotation is unused.
 */
export const Lesson02Scene: React.FC<Lesson02SceneProps> = ({ config, atmosphere, position }) => {
  const siteAsset: ModelAsset | undefined = config.assets.models.find((m) => m.id === 'site');
  if (!siteAsset) {
    throw new Error(
      'Lesson02Scene: required model "site" is missing from config.assets.models. ' +
        'The lesson config and scene assembly are out of sync.'
    );
  }

  const azimuthDeg = positionToAzimuthDeg(position);
  const lightRotation = useMemo(
    () => sunLightRotation(azimuthDeg, SUN_ELEVATION_DEG),
    [azimuthDeg]
  );
  const activeIndex = activeKeyDate(position);
  const activeId = activeIndex === null ? null : (KEY_DATES[activeIndex]?.building ?? null);

  return (
    <>
      <FixedGlbCamera config={config.camera} />
      <SceneEnvironment config={config.assets.environment} sample={atmosphere} />
      <SceneLighting
        rotation={lightRotation}
        intensity={config.lighting.directional.intensity}
        color={config.lighting.directional.color}
        castShadow={config.lighting.directional.castShadow}
      />
      <group name="Lesson02_Root">
        <ModelLoader asset={siteAsset} />
        <StandInBuildings activeId={activeId} />
        <SunDisc azimuthDeg={azimuthDeg} elevationDeg={SUN_ELEVATION_DEG} />
      </group>
    </>
  );
};
