import React, { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLessonEntry } from '../lessons/registry';
import { SceneCanvas } from '../core/components/SceneCanvas';
import { DevPanel, IBL_DEFAULTS } from '../dev/DevPanel';
import { SceneRuntimeState } from '../core/types/lesson.types';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const LessonPage: React.FC = () => {
  const { lessonId = '01' } = useParams<{ lessonId: string }>();
  const lessonEntry = useMemo(() => getLessonEntry(lessonId), [lessonId]);

  const [isDevPanelVisible, setIsDevPanelVisible] = useState<boolean>(false);

  // Initialize runtime state from lesson config defaults
  const [runtimeState, setRuntimeState] = useState<SceneRuntimeState | null>(() => {
    if (!lessonEntry) return null;
    const envConfig = lessonEntry.config.assets.environment;
    return {
      directionalLight: { ...lessonEntry.config.lighting.directional },
      // Spread the lesson's environment config (url, intensity,
      // backgroundEnabled, presets), then layer IBL_DEFAULTS on top
      // for everything else. Lesson configs no longer override the
      // baked IBL/scale/panY/rotation values, so the skydome boots
      // at the user's intended framing on the very first frame —
      // no flash while we wait for the DevPanel's first onChange.
      environment: {
        ...envConfig,
        iblIntensity: envConfig.iblIntensity ?? IBL_DEFAULTS.iblIntensity,
        scale: envConfig.scale ?? IBL_DEFAULTS.scale,
        panY: envConfig.panY ?? IBL_DEFAULTS.panY,
        rotation: envConfig.rotation ?? IBL_DEFAULTS.rotation,
        backgroundEnabled: envConfig.backgroundEnabled !== false
      }
    };
  });

  // Stable callback — DevPanel calls this on every slider change
  const handleRuntimeStateChange = useCallback((newState: SceneRuntimeState) => {
    setRuntimeState(newState);
  }, []);

  const handleToggleDevPanel = useCallback(() => {
    setIsDevPanelVisible((prev) => !prev);
  }, []);

  const handleEnvironmentPresetSelect = useCallback((url: string) => {
    setRuntimeState((prev) => {
      if (!prev) return prev;

      // Look up the matching preset in the lesson config to see if it
      // carries optional directional-light X/Y/Z rotations and/or a
      // per-preset IBL intensity. Each axis is applied independently —
      // a preset that only defines Z (e.g. sky-02 / sky-03) leaves X and Y
      // untouched, so existing manual overrides persist.
      const presets = lessonEntry?.config.assets.environment.presets;
      const matchedPreset = presets?.find((p) => p.url === url);
      const newX = matchedPreset?.directionalLightRotationX;
      const newY = matchedPreset?.directionalLightRotationY;
      const newZ = matchedPreset?.directionalLightRotationZ;
      const newIbl = matchedPreset?.iblIntensity;

      const nextEnvironment: typeof prev.environment = {
        ...prev.environment,
        url,
        // Per-preset IBL override — when defined on the preset, drives
        // scene.environmentIntensity. When omitted, leave the current
        // IBL value untouched so existing manual overrides persist.
        ...(typeof newIbl === 'number' ? { iblIntensity: newIbl } : {})
      };

      // Apply any rotation axes the preset declares. Each axis is
      // independent: only axes explicitly set on the preset are
      // overridden; the others keep their current value.
      const hasAnyRotation =
        typeof newX === 'number' ||
        typeof newY === 'number' ||
        typeof newZ === 'number';

      const nextDirectionalLight = hasAnyRotation
        ? {
            ...prev.directionalLight,
            rotation: [
              typeof newX === 'number' ? newX : prev.directionalLight.rotation[0],
              typeof newY === 'number' ? newY : prev.directionalLight.rotation[1],
              typeof newZ === 'number' ? newZ : prev.directionalLight.rotation[2]
            ] as [number, number, number]
          }
        : prev.directionalLight;

      return {
        ...prev,
        environment: nextEnvironment,
        directionalLight: nextDirectionalLight
      };
    });
  }, [lessonEntry]);

  if (!lessonEntry || !runtimeState) {
    return (
      <div className="min-h-screen bg-[#090b10] text-[#e6dfd3] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-950/40 border border-[#d4af37]/30 flex items-center justify-center mb-6 text-[#d4af37]">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#f5ecd7] mb-2">Lesson Not Found</h1>
        <p className="text-sm text-[#a39e93] max-w-md mb-6">
          Lesson "{lessonId}" is not registered in the lesson catalog.
        </p>
        <Link
          to="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d4af37] text-black font-semibold text-xs tracking-wider uppercase hover:brightness-110 transition-all shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Lesson Catalog
        </Link>
      </div>
    );
  }

  const { config, SceneComponent, OverlayComponent } = lessonEntry;

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#090b10] relative select-none">
      {/* 3D Scene Viewport — fills entire viewport */}
      <SceneCanvas cameraConfig={config.camera}>
        <SceneComponent config={config} runtimeState={runtimeState} />
      </SceneCanvas>

      {/* Educational UI Overlay — sits above the canvas */}
      {OverlayComponent && (
        <OverlayComponent
          config={config}
          isDevPanelVisible={isDevPanelVisible}
          onToggleDevPanel={handleToggleDevPanel}
          onSelectEnvironmentPreset={handleEnvironmentPresetSelect}
          currentEnvUrl={runtimeState.environment.url}
        />
      )}

      {/* Leva Developer Panel — toggle with button or Alt+D */}
      <DevPanel
        lessonConfig={config}
        isVisible={isDevPanelVisible}
        onToggleVisibility={handleToggleDevPanel}
        onChange={handleRuntimeStateChange}
      />
    </div>
  );
};
