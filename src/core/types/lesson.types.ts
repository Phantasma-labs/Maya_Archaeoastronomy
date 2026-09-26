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
 * the slider label.
 *
 * `label` is the only field the UI reads today — it feeds the slider's
 * accessible value text (aria-valuetext). `sublabel`/`tooltip`/`lines`
 * are authored pedagogical copy carried on the keyframe for future
 * callout UI; nothing renders them yet.
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
}

/**
 * Camera pose of a tour stop, as an orbit around a target point. Azimuth is
 * measured in radians around +Y from +Z toward +X, so the camera sits at
 * target + r·(sin az·cos el, sin el, cos az·cos el). For Lesson 01 north is
 * −Z, so a north-face-on view has azimuth π. Interpolation between stops
 * takes the shortest azimuth arc (see `sampleTour`).
 */
export interface TourCameraPose {
  azimuth: number;
  /** Radians above the horizon (π/2 = straight down onto the target). */
  elevation: number;
  /** Metres from the target. */
  radius: number;
  target: [number, number, number];
}

/**
 * How firmly a tour statement is supported. `mixed` = the arithmetic/calendar
 * fact is established but its link to the architecture is an interpretation.
 */
export type TourEvidence = 'documented' | 'interpretation' | 'mixed';

/** On-screen content for a tour stop. */
export interface TourStopInfo {
  headline: string;
  /** Big number/figure shown above the headline ("9", "4 × 91", "365"). */
  figure?: string;
  lines: string[];
  status: TourEvidence;
}

/**
 * A 2D callout pointing at a 3D feature. `anchor` is a world-space point the
 * arrow tip lands on; the screen position is derived (never stored) by
 * projecting it through the tour camera (see `projectToScreen`).
 */
export interface TourCallout {
  id: string;
  /** Short label shown at the tail of the arrow ("Step 91", "+1 platform"). */
  label: string;
  /** World-space point the arrowhead points at. */
  anchor: [number, number, number];
  /** Label centre relative to the anchor's screen position, in design-space
   *  pixels (x right, y down). The arrow runs from the label to the anchor. */
  offset: [number, number];
}

/** One viewpoint + explanation in a topic's guided tour. */
export interface TourStop {
  id: string;
  /** Short name for the step navigator (dot tooltip / aria label). */
  label: string;
  camera: TourCameraPose;
  info: TourStopInfo;
  /** Arrows pointing at the features this step is about (optional). */
  callouts?: TourCallout[];
}

/** Camera state derived from a continuous tour position (pure, never stored). */
export interface TourSample {
  /** Camera position in world space. */
  eye: [number, number, number];
  /** Point the camera looks at. */
  target: [number, number, number];
  /** Nearest stop index (0-based) for the active text / navigator dot. */
  activeIndex: number;
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
  /**
   * Optional directional-light intensity multiplier at this keyframe. When
   * omitted, the consumer falls back to the lesson-level
   * `lighting.directional.intensity` constant. Set to 0 to fade the sun out
   * (e.g. a day→night arc where IBL should stay constant).
   */
  directionalIntensity?: number;
  /**
   * Optional keyframe metadata for topic-specific pedagogical data. The
   * Serpent Descent topic uses this to carry the clock time (`dateLabel`,
   * e.g. "3:00 PM") that the Atmosphere Timeline reads into the slider's
   * accessible value text. Other topics ignore it.
   */
  meta?: {
    /** Display label for the slider's accessible value text (aria-valuetext)
     *  — a calendar date ("May 23") or clock time. Overrides the keyframe
     *  name / callout label. */
    dateLabel?: string;
  };
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
   * Optional topic-owned skyTimeline. When present, this topic owns its
   * own Atmosphere Timeline (overrides the lesson's default) and the
   * slider is shown for it. Used by the sky setup (Serpent Descent) to
   * scope the timeline to that topic's own keyframes; topics without one
   * (Calendar & Architecture) fall back to the lesson default.
   */
  skyTimeline?: SkyKeyframe[];
  /**
   * Optional topic-owned guided tour. When present, the topic renders the
   * lesson's blueprint scene instead of the photoreal one, `sliderPosition`
   * means the tour step (1..N), and the overlay shows a step navigator with
   * each stop's `info`. Used by Calendar & Architecture.
   */
  tour?: TourStop[];
}

export interface LessonContent {
  monumentName: string;
  timePeriod: string;
  culture: string;
  overview: string;
  topics: LearningTopic[];
  archaeologicalNotes: string;
}

/**
 * A stairway drawn procedurally in the blueprint view. Some models (Lesson 01)
 * carry their steps only in the photoreal textures — the stairway is a flat
 * ramp — so the blueprint draws `steps` evenly spaced step lines across it.
 * Only the horizontal footprint is authored; each line's height is snapped to
 * the model surface at build time.
 */
export interface StairwaySpec {
  id: string;
  /** Horizontal [x, z] of the bottom of the stairway (centre line). */
  foot: [number, number];
  /** Horizontal [x, z] of the top of the stairway (centre line). */
  top: [number, number];
  /** Full width of the stairway between its balustrades, in metres. */
  width: number;
  /** Number of step lines to draw (Lesson 01: 91, "traditionally counted"). */
  steps: number;
  /**
   * The model's geometry for this stairway is eroded / uneven. Its noisy mesh
   * edges are hidden inside the footprint and a clean outline (ramp edges +
   * balustrade lines) is drawn in their place.
   */
  worn?: boolean;
}

/** Extra data the blueprint view needs beyond the tour itself. */
export interface BlueprintConfig {
  stairways: StairwaySpec[];
  /**
   * Azimuth (radians, tour convention) of the monument's main axis. Enables
   * hiding long near-but-not-on-axis edges of the body mesh as mesh noise.
   */
  axisAzimuth?: number;
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
  /** Optional data for the blueprint view of topics that own a `tour`. */
  blueprint?: BlueprintConfig;
}

/**
 * Sampled atmosphere state for a continuous Atmosphere Timeline position
 * (1..N), derived from EnvironmentConfig.skyTimeline by
 * sampleAtmosphere(). Pure derivation — never React state (ADR-001).
 */
export interface AtmosphereSample {
  /** The source keyframes this sample was derived from (the active
   *  skyTimeline). Carried on the sample so consumers — SceneEnvironment's
   *  texture array in particular — always index the same timeline the
   *  sample was sampled from, never the lesson default. */
  keyframes: SkyKeyframe[];
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
  /**
   * Interpolated directional-light intensity (resolved at the consumer:
   * undefined when neither adjacent keyframe sets the field, in which case
   * the lesson-level constant applies). Drives the sun's brightness across
   * the timeline.
   */
  directionalIntensity: number | undefined;
  /** Nearest keyframe index (0-based) for UI "active" badges. */
  activeIndex: number;
}
