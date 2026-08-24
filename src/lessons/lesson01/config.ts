import { LessonConfig } from '../../core/types/lesson.types';

export const lesson01Config: LessonConfig = {
  id: '01',
  slug: '01',
  title: 'The Temple of Kukulkán: Calendars, Shadows, and Solar Alignments',
  subtitle: 'El Castillo at Chichén Itzá, Yucatán',
  tagline: 'Explore how Maya monumental architecture encodes the 365-day solar year, the 52-year Calendar Round, Venus synodic cycles, and equinox shadow phenomena.',
  thumbnail: '/assets/lesson_01/01.webp',
  status: 'available',
  difficulty: 'Introductory',
  duration: '15 min interactive study',

  assets: {
    models: [
      {
        id: 'floor',
        name: 'Plaza Ground Floor',
        url: '/assets/lesson_01/Lesson01_Floor_v003.glb',
        castShadow: false,
        receiveShadow: true,
        position: [0, 0, 0]
      },
      {
        id: 'layout',
        name: 'Temple of Kukulkán & Serpent Balustrade',
        url: '/assets/lesson_01/Lesson01_Layout_v003.glb',
        castShadow: true,
        receiveShadow: true,
        position: [0, 0, 0]
      },
      {
        id: 'trees',
        name: 'Surrounding Forest Canopy',
        url: '/assets/lesson_01/Lesson01_Trees_v003.glb',
        // Trees no longer cast shadows — keeps the plaza cleaner around
        // El Castillo and avoids self-shadowing noise from the dense
        // canopy. They still receive shadows (so light hitting them
        // still darkens them correctly from the sun).
        castShadow: false,
        receiveShadow: true,
        position: [0, 0, 0]
      }
    ],
    environment: {
      // ADR-001 — hardcoded Atmosphere Timeline keyframes (complete states;
      // interpolation happens between them). K2's light X/Y were carried
      // over from the lesson default so every keyframe is fully specified.
      skyTimeline: [
        {
          id: 'sky-01',
          name: 'Atmospheric Daylight',
          url: '/assets/lesson_01/01.webp',
          description: 'Clear tropical sky over the Yucatán peninsula.',
          lightRotation: [1.6564, 0, 1.5],
          iblIntensity: 0.5
        },
        {
          id: 'sky-02',
          name: 'Equinoctial Horizon',
          url: '/assets/lesson_01/02.webp',
          description: 'Sunlight conditions highlighting solar azimuths.',
          lightRotation: [1.6564, 0, 1.66],
          iblIntensity: 0.82
        },
        {
          id: 'sky-03',
          name: 'Dusk Celestial View',
          url: '/assets/lesson_01/03.webp',
          description: 'Evening atmosphere suitable for observing Venus and planetary transitions.',
          lightRotation: [-0.2, 0, 0],
          iblIntensity: 0.66
        }
      ],
      // Shared skydome framing — authored values (these were previously the
      // Dev Panel's IBL_DEFAULTS; ADR-001 bakes them into the lesson config).
      scale: 0.52,
      panY: -0.029,
      rotation: [0.09, -1.7, 0.05],
      // Sky-dome visual brightness — independent from IBL contribution.
      intensity: 1.0,
      backgroundEnabled: true
    }
  },

  // Authoring camera extracted from Lesson01_Layout_v003.glb
  camera: {
    source: 'glb-camera',
    position: [-44.413162, 1.700000, -73.157776],
    quaternion: [0.032250, -0.956887, 0.116925, 0.263923],
    fov: 48.455, // yfov 0.845708 rad
    near: 0.1,
    far: 1000
  },

  lighting: {
    directional: {
      // Intensity/color are lesson-level constants; rotation lives on the
      // Atmosphere Timeline keyframes and interpolates between them.
      intensity: 3.6,
      color: '#fff6ea',
      castShadow: true
    }
  },

  content: {
    monumentName: 'Temple of Kukulkán (El Castillo)',
    location: 'Chichén Itzá, Yucatán, Mexico (20.6843° N, 88.5678° W)',
    timePeriod: 'Terminal Classic to Early Postclassic (~800–1200 CE)',
    culture: 'Maya-Toltec civilization',
    overview:
      'The Temple of Kukulkán at Chichén Itzá is a monumental stepped pyramid strongly associated with calendrical, astronomical, and agricultural symbolism. Rising 30 meters above the northern plaza, the structure harmonizes solar mechanics, geometrical orientation, and sacred number sequences into stone.',
    topics: [
      {
        id: 'solar-calendar',
        title: '365-Day Solar Calendar Architecture',
        icon: 'Calendar',
        summary:
          'The pyramid embodies the 365-day Haab solar year through its four staircases and summit platform.',
        details: [
          'The architecture consists of 9 stepped terraces divided by staircases on four faces.',
          'Each of the 4 stairways contains 91 steps, producing 364 steps in total.',
          'Counting the upper platform as the final step yields exactly 365 steps—corresponding to the days of the Haab solar year.',
          'This provides an architectural tally of the annual solar cycle.'
        ],
        keyFact: '4 stairways × 91 steps + 1 upper platform = 365 steps (Haab solar year).'
      },
      {
        id: 'equinox-shadow',
        title: 'Kukulkán Serpent Shadow Phenomenon',
        icon: 'Sun',
        summary:
          'Around the spring and autumn equinoxes, the setting sun projects undulating triangular shadows along the northern balustrade.',
        details: [
          'As the sun descends in the late afternoon around the equinoxes, the edges of the nine stepped terraces cast a series of 7 isosceles triangles of light onto the northwest balustrade.',
          'These illuminated triangles visually merge with the colossal stone-carved serpent head of Kukulkán (the Feathered Serpent) at the base of the staircase.',
          'Scholars emphasize this as a sophisticated architectural and astronomical alignment, though debate continues on whether every detail was intentionally engineered for specific modern dates.'
        ],
        keyFact: '7 triangular diamonds of light connect the terrace stepped edges to the Kukulkán serpent head at the staircase base.'
      },
      {
        id: 'calendar-round',
        title: 'The 52-Year Calendar Round (Tzolk\'in & Haab)',
        icon: 'Clock',
        summary:
          'The 52 panels on each side of the structure mirror the 52-year synchronization cycle of the sacred and solar calendars.',
        details: [
          'Each facade of the pyramid contains 52 sculptured panels across the nine terrace tiers.',
          'In Maya chronology, the 260-day sacred Tzolk\'in calendar and the 365-day civil Haab calendar realign to the exact same starting date every 18,980 days (52 Haab years).',
          'This 52-year epoch was celebrated as a momentous rejuvenation cycle across Mesoamerica.'
        ],
        keyFact: '52 panels reflect the 52-year Calendar Round cycle (18,980 days = 73 Tzolk\'in cycles = 52 Haab years).'
      },
      {
        id: 'venus-cycle',
        title: 'Venus Synodic Observations (584 Days)',
        icon: 'Orbit',
        summary:
          'The Maya meticulously tracked Venus as Chak Ek\' (the Great Morning Star), observing its 584-day synodic period.',
        details: [
          'The Maya recorded the complex visible movements of Venus, calculating its apparent synodic period as ~584 days (the time between successive inferior or superior conjunctions).',
          'The mathematical harmonic 5 Venus synodic cycles = 8 Haab solar years (5 × 584 = 8 × 365 = 2,920 days) was fundamental to Maya astronomical tables (such as the Dresden Codex).',
          'Note: 584 days is the apparent synodic period observed from Earth, distinct from Venus\'s 224.7-day orbital period around the Sun.'
        ],
        keyFact: '5 Venus synodic cycles (584 days) match exactly 8 Solar Haab years (365 days) = 2,920 days.'
      },
      {
        id: 'solar-zenith',
        title: 'Solar Zenith Passages (Zero Shadow)',
        icon: 'Compass',
        summary:
          'At the tropical latitude of Chichén Itzá (~20.68° N), the Sun passes directly overhead at local noon twice annually.',
        details: [
          'During subsolar zenith passage (occurring in late May and mid-July at Chichén Itzá), vertical objects cast zero shadow at local solar noon.',
          'These zenith events served as sacred solar markers closely correlated with agricultural planting and rain ceremonies (Chak rituals).',
          'Academic consensus treats these as significant cultural markers while maintaining careful separation between astronomical calculations and archaeological interpretations.'
        ],
        keyFact: 'At 20.68° N latitude, the Sun passes through the absolute zenith point at local solar noon twice per year.'
      }
    ],
    archaeologicalNotes:
      'The academically strongest interpretation treats El Castillo as a monument in which architectural geometry, calendrical mathematics, and Maya sky-watching traditions were harmoniously integrated, without attributing modern astronomical concepts to ancient builders.'
  }
};
