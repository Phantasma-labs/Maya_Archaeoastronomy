import { LessonConfig } from '../../core/types/lesson.types';

export const lesson02Config: LessonConfig = {
  id: '02',
  slug: '02',
  title: 'The Caracol Observatory: Venus Extremes and Horizon Sightlines',
  subtitle: 'The Cylindrical Tower of Chichén Itzá',
  tagline:
    'Investigate the asymmetric observation slits and horizon sightlines used by Maya astronomers to track extreme northern and southern Venus risings.',
  thumbnail: '/assets/landing/lesson-02-thumb.webp',
  status: 'coming-soon',
  difficulty: 'Intermediate',
  duration: '20 min interactive study',

  assets: {
    models: [],
    environment: {
      // Single-keyframe timeline (placeholder until Lesson 02 assets land) —
      // a 1-step timeline renders a fixed sky and the slider is hidden.
      skyTimeline: [
        {
          id: 'sky-02',
          name: 'Equinoctial Horizon',
          url: '/assets/lesson_01/02.webp',
          description: 'Shared Chichén Itzá horizon sky pending dedicated observatory captures.',
          lightRotation: [0.8, 1.5, 0],
          iblIntensity: 0.33
        }
      ],
      // Shared skydome framing — authored defaults (ex-DevPanel IBL_DEFAULTS).
      scale: 0.52,
      panY: -0.029,
      rotation: [0.09, -1.7, 0.05],
      // Sky-dome visual brightness.
      intensity: 1.0,
      backgroundEnabled: true
    }
  },

  camera: {
    position: [0, 5, 20],
    rotation: [0, 0, 0],
    fov: 45,
    near: 0.1,
    far: 1000
  },

  lighting: {
    directional: {
      intensity: 3.0,
      color: '#fff0dd',
      castShadow: true
    }
  },

  content: {
    monumentName: 'El Caracol (The Snail Observatory)',
    timePeriod: 'Late Classic (~900–1050 CE)',
    culture: 'Maya civilization',
    overview:
      'El Caracol is a rare cylindrical structure named for the interior spiral staircase leading to its upper observation chamber. Archaeologists and astronomers have documented deliberate sightline alignments pointing toward key Venus extremes.',
    topics: [
      {
        id: 'venus-extremes',
        title: 'Venus Horizon Extremes',
        summary:
          'Observation slits align with extreme azimuths of Venus risings and settings on the horizon.',
        details: [
          'The upper observation chamber contains narrow horizontal windows aligned with precise celestial angles.',
          'Alignments correspond to the maximum northern and southern declinations of Venus, which occur over an 8-year cycle.'
        ],
        keyFact:
          'Sightlines point to Venus extreme rise/set positions occurring once every 8 solar years.'
      }
    ],
    archaeologicalNotes:
      'The alignments at El Caracol provide strong physical evidence of intentional astronomical observation architecture in the northern Maya lowlands.'
  }
};
