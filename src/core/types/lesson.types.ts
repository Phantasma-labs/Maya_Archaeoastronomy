import { ReactNode } from 'react';

/**
 * Lighting Configuration for a 3D Lesson Scene
 */
export interface DirectionalLightConfig {
  intensity: number;
  rotation: [number, number, number]; // [Euler X, Euler Y, Euler Z] in radians or degrees
  color: string;
  castShadow?: boolean;
}

export interface LightingConfig {
  directional: DirectionalLightConfig;
}

/**
 * Environment Texture Configuration
 */
export interface EnvironmentPreset {
  id: string;
  name: string;
  url: string;
  description?: string;
  /**
   * Optional directional light X-rotation (radians) to apply when this
   * preset is selected. When omitted, the directional light's X
   * rotation is left untouched.
   */
  directionalLightRotationX?: number;
  /**
   * Optional directional light Y-rotation (radians) to apply when this
   * preset is selected. When omitted, the directional light's Y
   * rotation is left untouched.
   */
  directionalLightRotationY?: number;
  /**
   * Optional directional light Z-rotation (radians) to apply when this
   * preset is selected. When omitted, the directional light's Z
   * rotation is left untouched.
   */
  directionalLightRotationZ?: number;
  /**
   * Optional IBL contribution (0–1+) to apply when this preset is
   * selected. Drives scene.environmentIntensity in SceneEnvironment.
   * When omitted, the lesson's default `environment.iblIntensity` is
   * left untouched, allowing per-sky IBL tuning without touching the
   * directional light.
   */
  iblIntensity?: number;
}

export interface EnvironmentConfig {
  url: string;
  /**
   * [X, Y, Z] Euler angles in radians, shared between the IBL
   * environment and the skydome mesh. Optional — when omitted,
   * SceneEnvironment treats the rotation as [0, 0, 0]. The Dev
   * Panel's IBL_DEFAULTS supply a value when both the lesson and
   * the user have not set one.
   */
  rotation?: [number, number, number];
  /**
   * UV-space zoom factor for the equirectangular panorama on the
   * skydome. 1.0 = panorama fills the dome once (no transform);
   * values <1 zoom in (tighter view of a smaller portion of the
   * panorama); values >1 zoom out (more of the panorama compressed
   * into view). The texture never tiles — wrap modes are clamped.
   * Applied via `texture.matrix` in SceneEnvironment.
   *
   * Optional — when omitted, SceneEnvironment falls back to 1.0
   * (panorama fills the dome once, no transform).
   */
  scale?: number;
  /**
   * Vertical UV offset (pan) for the sky-dome panorama, in fractions
   * of the panorama height. Positive = shift the panorama upward
   * (so the visible dome shows lower-V content, i.e. the horizon
   * moves down); negative = shift it downward. Combined with `scale`
   * via `texture.matrix` so zooming and panning coexist without
   * tiling. Optional for backward compatibility — when undefined,
   * SceneEnvironment treats it as 0.
   */
  panY?: number;
  /**
   * Sky-dome visual brightness multiplier.
   * 0 = pure black sky, 1 = original HDR pixel values, >1 = boosted.
   * Drives the skydome mesh's material.color tint (the visible sky is
   * rendered as an inverted sphere in SceneEnvironment, not as
   * scene.background — see SceneEnvironment.tsx for the rationale).
   * Independent from IBL so the visible sky can be darkened without
   * killing PBR reflections on the models.
   */
  intensity: number;
  /**
   * IBL (image-based lighting) contribution to PBR materials.
   * Drives scene.environmentIntensity. 0 = no IBL contribution.
   * Independent from `intensity` so reflections can be tuned without
   * changing the visible sky.
   *
   * Optional for backward compatibility with existing lesson configs —
   * when undefined, SceneEnvironment falls back to `intensity` so the
   * historical one-knob behaviour is preserved.
   */
  iblIntensity?: number;
  /**
   * Toggle the visible sky-dome background on/off without unloading the
   * environment texture (IBL can still sample the same texture). Drives
   * scene.background = null when false.
   */
  backgroundEnabled?: boolean;
  presets?: EnvironmentPreset[];
}

/**
 * Camera Configuration
 */
export interface CameraConfig {
  source: 'glb-camera' | 'manual';
  position: [number, number, number];
  quaternion?: [number, number, number, number]; // [x, y, z, w]
  rotation?: [number, number, number]; // [Euler X, Euler Y, Euler Z]
  fov: number;
  near: number;
  far: number;
}

/**
 * 3D Model Asset Definition
 */
export interface ModelAsset {
  id: string;
  name: string;
  url: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

/**
 * Educational / Pedagogical Topics in the Lesson
 */
export interface LearningTopic {
  id: string;
  title: string;
  icon?: string;
  summary: string;
  details: string[];
  keyFact?: string;
  recommendedLightPreset?: {
    intensity?: number;
    rotation?: [number, number, number];
    color?: string;
  };
}

export interface LessonContent {
  monumentName: string;
  location: string;
  timePeriod: string;
  culture: string;
  overview: string;
  topics: LearningTopic[];
  archaeologicalNotes: string;
}

/**
 * Complete Lesson Specification
 */
export interface LessonConfig {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  tagline: string;
  thumbnail: string;
  status: 'available' | 'coming-soon';
  difficulty: 'Introductory' | 'Intermediate' | 'Advanced';
  duration: string;
  
  assets: {
    models: ModelAsset[];
    environment: EnvironmentConfig;
  };
  
  camera: CameraConfig;
  lighting: LightingConfig;
  content: LessonContent;
  
  // Custom scene renderer or component hook if needed
  customSceneRenderer?: () => ReactNode;
}

/**
 * Realtime Scene Runtime State (controlled by Dev Panel or presets)
 */
export interface SceneRuntimeState {
  directionalLight: DirectionalLightConfig;
  environment: EnvironmentConfig;
}
