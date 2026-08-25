/**
 * Lighting Configuration for a 3D Lesson Scene
 *
 * ADR-001: rotation is NOT here — it lives on the Atmosphere Timeline
 * keyframes (SkyKeyframe.lightRotation) and is interpolated at runtime.
 */
export interface DirectionalLightConfig {
  intensity: number;
  color: string;
  castShadow?: boolean;
}

export interface LightingConfig {
  directional: DirectionalLightConfig;
}

/**
 * Pedagogical content attached to an Atmosphere Timeline keyframe.
 * All fields are optional so legacy sky-only keyframes still type-check;
 * a keyframe without a callout falls back to its `SkyKeyframe.name` for
 * the slider label and shows no extra panel content.
 *
 * `lines` is the on-screen text callout body (rendered as a stacked
 * multi-line block). `prompt` is the "drag to next step" line shown
 * below the callout. `hotspot` is the optional tap-to-open card
 * (e.g. Step 2's Kukulcán serpent-head popup). `completion` is the
 * optional end-of-lesson reveal panel.
 */
export interface StepCallout {
  /** Big headline (e.g. "First contact"). Falls back to keyframe.name. */
  label?: string;
  /** Smaller secondary line under the label (e.g. "Feb 12 · 52 days…"). */
  sublabel?: string;
  /** Hover/title tooltip (e.g. "The first shadow triangle pierces…"). */
  tooltip?: string;
  /** Multi-line on-screen text block, one entry per rendered line. */
  lines?: string[];
  /** Interaction prompt shown beneath the callout (e.g. "→ Drag to Step 2…"). */
  prompt?: string;
  /** Optional tap-to-open hotspot card (Step 2's Kukulcán popup). */
  hotspot?: {
    label: string;
    /** Body text shown inside the popup card. */
    text: string;
    /** Optional anchor direction toward the in-scene feature. */
    anchor?: 'serpent-head' | 'temple-summit' | 'staircase-base';
  };
  /** Per-keyframe astronomical data (sun azimuth/altitude/declination/time). */
  astro?: {
    /** Solar azimuth, e.g. "≈ 240°". */
    azimuth: string;
    /** Solar altitude above the horizon, e.g. "≈ 29–30°". */
    altitude: string;
    /** Solar declination, e.g. "≈ −13.5°". */
    declination: string;
    /** Local clock time of the event, e.g. "~15:32". */
    time: string;
  };
  /** Optional completion reveal (Step 3's "Decoded" panel). */
  completion?: {
    heading: string;
    /** Rendered as preformatted lines to preserve alignment. */
    body: string[];
  };
}

/**
 * A single authored sky/light state on the Atmosphere Timeline (ADR-001).
 * Keyframes are COMPLETE states — no partial-axis overrides, no fallback
 * chains. Every keyframe defines all of its values so any adjacent pair
 * can be linearly interpolated.
 */
export interface SkyKeyframe {
  id: string;
  name: string;
  description?: string;
  /** Equirectangular sky texture URL (2048×1024 LDR WebP today). */
  url: string;
  /** Directional-light Euler rotation [X, Y, Z] radians at this keyframe. */
  lightRotation: [number, number, number];
  /** IBL contribution (scene.environmentIntensity) at this keyframe. */
  iblIntensity: number;
  /** Optional pedagogical content shown when this keyframe is active. */
  callout?: StepCallout;
}

/**
 * Environment Configuration
 *
 * `skyTimeline` is the ordered list of hardcoded keyframes; the slider
 * position 1..N maps onto it. `scale`/`panY`/`rotation` frame the skydome
 * (shared by all keyframes); `intensity` is the skydome brightness tint,
 * independent from IBL.
 */
export interface EnvironmentConfig {
  skyTimeline: SkyKeyframe[];
  /**
   * UV-space zoom for the equirect panorama on the skydome, applied via
   * texture.matrix: 1 = fills the dome once; <1 zooms in; >1 zooms out.
   * Clamp-wrapped — never tiles.
   */
  scale: number;
  /** Vertical UV pan in fractions of panorama height (positive = pan up). */
  panY: number;
  /**
   * [X, Y, Z] Euler radians, shared between the skydome mesh rotation and
   * scene.environmentRotation (IBL reflections).
   */
  rotation: [number, number, number];
  /** Skydome visual brightness multiplier (0 = black, 1 = original pixels). */
  intensity: number;
  /**
   * Hide the visible skydome while keeping IBL bound to the same textures.
   * Default: visible.
   */
  backgroundEnabled?: boolean;
}

/**
 * Camera Configuration
 */
export interface CameraConfig {
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
  summary: string;
  details: string[];
  keyFact?: string;
  /**
   * Optional focused-view skyTimeline. When present, this topic owns its
   * own Atmosphere Timeline (overrides the lesson's default) and the
   * overlay renders the focused UI (slider, callout, sun blueprint).
   * Used by Snake Descent to scope the timeline to the two
   * serpent-shadow keyframes (1st contact → The descent).
   */
  skyTimeline?: SkyKeyframe[];
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
}

/**
 * Sampled atmosphere state for a continuous Atmosphere Timeline position
 * (1..N), derived from EnvironmentConfig.skyTimeline by
 * sampleAtmosphere(). Pure derivation — never React state (ADR-001).
 */
export interface AtmosphereSample {
  /** Lower keyframe index (0-based). */
  indexA: number;
  /** Upper keyframe index (equals indexA on an exact step). */
  indexB: number;
  /** Blend factor 0..<1 from keyframe A to B. */
  mix: number;
  /** Interpolated directional-light Euler rotation [X, Y, Z] radians. */
  lightRotation: [number, number, number];
  /** Interpolated IBL contribution → scene.environmentIntensity. */
  iblIntensity: number;
  /** Nearest keyframe index (0-based) for UI "active" badges. */
  activeIndex: number;
}
