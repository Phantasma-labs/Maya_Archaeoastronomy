import React, { useEffect } from 'react';
import { Leva, folder, useControls, button } from 'leva';
import { LessonConfig, SceneRuntimeState } from '../core/types/lesson.types';

interface DevPanelProps {
  lessonConfig: LessonConfig;
  onChange: (state: SceneRuntimeState) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

/**
 * Baked runtime defaults for the IBL (Environment) sliders.
 *
 * These are the values every Dev Panel session opens with, the values
 * the "Reset Defaults" preset button restores, AND — because lesson
 * configs no longer override them — the values the runtime state is
 * seeded with on first paint so the skydome boots at the correct
 * framing without a flash from the lesson's own (now absent) defaults.
 *
 * Exported so LessonPage can seed the initial runtime state from the
 * same source of truth.
 */
export const IBL_DEFAULTS = {
  iblIntensity: 0.33,
  scale: 0.52,
  panY: -0.029,
  rotation: [0.09, -1.7, 0.05] as [number, number, number]
} as const;

/**
 * DevPanel — Collapsible developer/debug control panel
 *
 * Organized into:
 *   DEVELOPER
 *   ├── Directional Light
 *   │   ├── Intensity
 *   │   ├── Rotation X / Y / Z
 *   │   └── Color
 *   ├── IBL (Environment)
 *   │   ├── IBL Intensity
 *   │   ├── Scale
 *   │   ├── Pan Y
 *   │   └── Rotation X / Y / Z (shared with background)
 *   └── Presets (collapsed by default)
 *
 * Notes:
 *   - Ambient light has been removed entirely; scene fill is provided
 *     exclusively by the IBL environment.
 *   - The Background (Sky) section has been removed from this panel —
 *     the sky-dome is always on and uses the lesson defaults
 *     (`environment.intensity` / `environment.backgroundEnabled`).
 *     Per-preset IBL overrides are applied by the learner overlay.
 *
 * All changes propagate to the 3D scene in real time via the `onChange` callback.
 * The panel is fully decoupled from the learner UI — it can be hidden or
 * tree-shaken in production without touching the scene components.
 */
export const DevPanel: React.FC<DevPanelProps> = ({
  lessonConfig,
  onChange,
  isVisible,
  onToggleVisibility
}) => {
  const L = lessonConfig.lighting.directional;
  // IBL (environment) defaults — sourced from the lesson's environment asset.
  // These drive scene.environmentIntensity / scene.environmentRotation in SceneEnvironment.
  const E = lessonConfig.assets.environment;

  const [controls, set] = useControls(() => ({
    'Directional Light': folder(
      {
        // Step = 0.0001 → 4 fractional digits shown in the number input
        // box (leva formats numeric readouts to match the step precision)
        // and 100× finer slider sensitivity than the original 0.01 step.
        // This satisfies both the "10× more sensitivity" and "4-digit
        // precision on the boxes" requirements in one change.
        lightIntensity: { value: L.intensity, min: 0, max: 10, step: 0.0001, label: 'Intensity' },
        lightRotX: { value: L.rotation[0], min: -Math.PI, max: Math.PI, step: 0.0001, label: 'Rotation X' },
        lightRotY: { value: L.rotation[1], min: -Math.PI, max: Math.PI, step: 0.0001, label: 'Rotation Y' },
        lightRotZ: { value: L.rotation[2], min: -Math.PI, max: Math.PI, step: 0.0001, label: 'Rotation Z' },
        lightColor: { value: L.color, label: 'Color' }
      },
      { collapsed: false }
    ),
    'IBL (Environment)': folder(
      {
        // Step = 0.0001 → 4 fractional digits in the number input box
        // (leva formats numeric readouts to match the step precision)
        // and 100× finer slider sensitivity than the original 0.01 / 0.05
        // step values. Satisfies both the "10× more sensitivity" and
        // "4-digit precision on the boxes" requirements in one change.
        // Initial values fall back to IBL_DEFAULTS if the lesson config
        // does not override them — see the IBL_DEFAULTS constant above.
        iblIntensity: { value: E.iblIntensity ?? IBL_DEFAULTS.iblIntensity, min: 0, max: 3, step: 0.0001, label: 'IBL Intensity' },
        // Panorama / IBL scale — smooth UV-space zoom (no tiling).
        // 1 = panorama fills the dome once; <1 zooms in (tighter view);
        // >1 zooms out (more of the panorama compressed into view).
        // Driven by SceneEnvironment via texture.matrix.
        envScale: { value: E.scale ?? IBL_DEFAULTS.scale, min: 0.1, max: 4, step: 0.0001, label: 'Scale' },
        // Vertical pan of the panorama on the skydome, in fractions of
        // panorama height. Positive = shift the panorama up (the horizon
        // drops in the visible dome); negative = shift it down.
        // Combined with Scale via texture.matrix in SceneEnvironment.
        envPanY: { value: E.panY ?? IBL_DEFAULTS.panY, min: -1, max: 1, step: 0.0001, label: 'Pan Y' },
        iblRotX: { value: E.rotation?.[0] ?? IBL_DEFAULTS.rotation[0], min: -Math.PI, max: Math.PI, step: 0.0001, label: 'Rotation X' },
        iblRotY: { value: E.rotation?.[1] ?? IBL_DEFAULTS.rotation[1], min: -Math.PI, max: Math.PI, step: 0.0001, label: 'Rotation Y' },
        iblRotZ: { value: E.rotation?.[2] ?? IBL_DEFAULTS.rotation[2], min: -Math.PI, max: Math.PI, step: 0.0001, label: 'Rotation Z' }
      },
      { collapsed: false }
    ),
    Presets: folder(
      {
        'Equinox Shadow': button(() => set({
          lightIntensity: 3.8, lightRotX: 0.52, lightRotY: 2.18, lightRotZ: 0.12, lightColor: '#ffeedd',
          iblIntensity: 0.9, iblRotX: 0.0, iblRotY: 2.18, iblRotZ: 0.12
        })),
        'Zenith Noon': button(() => set({
          lightIntensity: 4.5, lightRotX: 1.57, lightRotY: 0.0, lightRotZ: 0.0, lightColor: '#ffffff',
          iblIntensity: 1.2, iblRotX: 0.0, iblRotY: 0.0, iblRotZ: 0.0
        })),
        'Golden Sunset': button(() => set({
          lightIntensity: 3.2, lightRotX: 0.15, lightRotY: 2.85, lightRotZ: -0.3, lightColor: '#ff9843',
          iblIntensity: 0.6, iblRotX: 0.0, iblRotY: 2.85, iblRotZ: -0.3
        })),
        'Reset Defaults': button(() => set({
          lightIntensity: L.intensity,
          lightRotX: L.rotation[0], lightRotY: L.rotation[1], lightRotZ: L.rotation[2],
          lightColor: L.color,
          iblIntensity: E.iblIntensity ?? IBL_DEFAULTS.iblIntensity,
          envScale: E.scale ?? IBL_DEFAULTS.scale,
          envPanY: E.panY ?? IBL_DEFAULTS.panY,
          iblRotX: E.rotation?.[0] ?? IBL_DEFAULTS.rotation[0],
          iblRotY: E.rotation?.[1] ?? IBL_DEFAULTS.rotation[1],
          iblRotZ: E.rotation?.[2] ?? IBL_DEFAULTS.rotation[2]
        }))
      },
      { collapsed: true }
    )
  }));

  // Push all control changes to the scene state
  useEffect(() => {
    onChange({
      directionalLight: {
        intensity: controls.lightIntensity,
        rotation: [controls.lightRotX, controls.lightRotY, controls.lightRotZ],
        color: controls.lightColor,
        castShadow: true
      },
      // IBL (image-based lighting) — intensity drives scene.environmentIntensity,
      // rotation drives scene.environmentRotation, and scale + panY drive
      // texture.matrix (smooth UV zoom + vertical pan) in SceneEnvironment.
      // URL/presets/backgroundEnabled/backgroundIntensity come from the
      // lesson config and are not exposed in the Dev Panel (the sky-dome is
      // always on; the learner overlay handles per-preset IBL overrides).
      environment: {
        url: lessonConfig.assets.environment.url,
        rotation: [controls.iblRotX, controls.iblRotY, controls.iblRotZ],
        // Panorama / IBL scale — driven by the Scale slider in the IBL folder.
        scale: controls.envScale,
        // Vertical pan — driven by the Pan Y slider in the IBL folder.
        panY: controls.envPanY,
        // IBL contribution to PBR — driven by the IBL Intensity slider.
        iblIntensity: controls.iblIntensity,
        // Sky-dome visual brightness — taken from the lesson default.
        intensity: lessonConfig.assets.environment.intensity,
        // Sky-dome is always on.
        backgroundEnabled: lessonConfig.assets.environment.backgroundEnabled !== false,
        presets: lessonConfig.assets.environment.presets
      }
    });
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    controls.lightIntensity, controls.lightRotX, controls.lightRotY, controls.lightRotZ,
    controls.lightColor,
    controls.iblIntensity, controls.envScale, controls.envPanY,
    controls.iblRotX, controls.iblRotY, controls.iblRotZ,
    // onChange is stable (useCallback in LessonPage) so not listed to avoid loops
  ]);

  // Alt+D keyboard shortcut to toggle visibility
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        onToggleVisibility();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onToggleVisibility]);

  return (
    <Leva
      hidden={!isVisible}
      collapsed={false}
      theme={{
        colors: {
          elevation1: '#12151e',
          elevation2: '#1a1e2b',
          elevation3: '#252b3d',
          accent1: '#d4af37',
          accent2: '#e5c158',
          accent3: '#f3e5ab',
          highlight1: '#ffffff',
          highlight2: '#d4af37',
          highlight3: '#9e978e',
          vivid1: '#d4af37'
        },
        fonts: {
          mono: 'JetBrains Mono, monospace',
          sans: 'Plus Jakarta Sans, sans-serif'
        }
      }}
      titleBar={{
        title: '⚙ DEVELOPER PANEL',
        drag: true,
        filter: false
      }}
    />
  );
};
