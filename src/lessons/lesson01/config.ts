import { LessonConfig } from '../../core/types/lesson.types';

export const lesson01Config: LessonConfig = {
  id: '01',
  slug: '01',
  title: 'The Temple of Kukulkán: Calendars, Shadows, and Solar Alignments',
  subtitle: 'El Castillo at Chichén Itzá, Yucatán',
  tagline:
    'Explore how Maya monumental architecture encodes the 365-day solar year, the 52-year Calendar Round, Venus synodic cycles, and equinox shadow phenomena.',
  thumbnail: '/assets/landing/lesson-01-thumb.webp',
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
      // interpolation happens between them). Every keyframe defines all of
      // its values so any adjacent pair can be linearly interpolated.
      //
      // The three keyframes are the lesson's narrative spine:
      //   1. First contact   — Feb 12, 52 days past winter solstice
      //   2. The descent     — Apr 9 / Sep 2, 73 days from summer solstice
      //   3. Zenith gate     — May 24, sun directly overhead
      // Pedagogical copy lives in each keyframe's `callout`; the slider
      // reads `callout.label` for its accessible value text.
      skyTimeline: [
        {
          id: 'sky-01',
          name: 'Step 1 · 1st contact',
          url: '/assets/lesson_01/01.webp',
          description: 'Warm amber pre-sunset light over the Yucatán peninsula.',
          lightRotation: [1.6564, 0, 1.5],
          iblIntensity: 0.5,
          callout: {
            label: '1st contact',
            sublabel: 'Feb 12  ·  52 days from winter solstice',
            tooltip: 'The first shadow triangle pierces the staircase. The calendar has awakened.',
            lines: [
              '52 days after winter solstice.',
              '52: The Calendar Round in years.',
              'The count has begun.'
            ]
          }
        },
        {
          id: 'sky-02',
          name: 'Step 2 · The descent',
          url: '/assets/lesson_01/02.webp',
          description:
            'Equinoctial light locking in the nine shadow triangles along the north alfarda.',
          lightRotation: [1.6564, 0, 1.66],
          iblIntensity: 0.82,
          callout: {
            label: 'The descent',
            sublabel: 'Apr 9 / Sep 2  ·  73 days from summer solstice',
            tooltip:
              'All 9 triangles lock in. Kukulcán’s body is complete. 73 × 8 = 584 — the Venus synodic period.',
            lines: [
              '9 triangles = 9 terraces.',
              '73 days × 8 = 584 days.',
              '584 days = 1 Venus synodic cycle.',
              'The serpent descends. Venus is encoded.'
            ]
          }
        },
        {
          id: 'sky-03',
          name: 'Step 3 · Zenith gate',
          url: '/assets/lesson_01/03.webp',
          description: 'Sun near vertical over Chichén Itzá (20.68° N) — the zenith passage.',
          lightRotation: [-0.2, 0, 0],
          iblIntensity: 0.66,
          callout: {
            label: 'Zenith gate',
            sublabel: 'May 24  ·  Sun passes directly overhead',
            tooltip: 'Full staircase ablaze. The sun stands at the zenith. The portal opens.',
            lines: [
              'Zenith passage: the sun stands at 90°.',
              'No shadow at noon.',
              'First rains approaching.',
              'The agricultural year begins.'
            ]
          }
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
    position: [-44.413162, 1.7, -73.157776],
    quaternion: [0.03225, -0.956887, 0.116925, 0.263923],
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
    timePeriod: 'Terminal Classic to Early Postclassic (~800–1200 CE)',
    culture: 'Maya-Toltec civilization',
    overview:
      'The Temple of Kukulkán at Chichén Itzá is a monumental stepped pyramid strongly associated with calendrical, astronomical, and agricultural symbolism. Rising 30 meters above the northern plaza, the structure harmonizes solar mechanics, geometrical orientation, and sacred number sequences into stone.',
    topics: [
      {
        id: 'serpent-descent',
        title: 'Serpent Descent',
        summary:
          'Around March 20 and September 22, near the spring and autumn equinoxes, the setting Sun creates seven triangles of light on the northern staircase of Kukulkán.',
        details: [
          'Around 3:00–5:00 PM, the triangles appear to join the stone serpent head, creating the famous "descent of Kukulkán."'
        ],
        // Topic-owned skyTimeline: scopes the Atmosphere Timeline to the
        // two serpent-shadow keyframes (1st contact → The descent). The
        // slider's accessible value text comes from each keyframe's
        // callout label / name.
        skyTimeline: [
          {
            id: 'sd-01',
            name: 'Step 1 · 1st contact',
            url: '/assets/lesson_01/01.webp',
            lightRotation: [1.6564, 0, 1.5],
            iblIntensity: 0.5,
            meta: { dateLabel: '3:00 PM' },
            callout: {
              label: '1st contact',
              sublabel: 'Feb 12  ·  52 days from winter solstice',
              tooltip: 'The first shadow triangle pierces the staircase. ',
              lines: ['The first shadow triangle pierces the staircase. ']
            }
          },
          {
            id: 'sd-02',
            name: 'Step 2 · The descent',
            url: '/assets/lesson_01/02.webp',
            lightRotation: [1.6564, 0, 1.66],
            iblIntensity: 0.82,
            meta: { dateLabel: '5:00 PM' },
            callout: {
              label: 'The descent',
              sublabel: 'Apr 9 / Sep 2  ·  73 days from summer solstice',
              tooltip: 'All 9 triangles lock in. The serpent body is complete.',
              lines: ['All 9 triangles lock in. The serpent body is complete.']
            }
          }
        ]
      },
      {
        id: 'solar-calendar',
        title: 'Calendar & Architecture',
        summary:
          'The pyramid of Kukulkán is connected to the Maya calendars through its architecture.',
        details: [
          'Its four stairways have 91 steps each, and counting the top platform gives 365 steps—matching the days of the solar year.',
          'Its 52 panels are also linked to the 52-year Calendar Round.'
        ],
        // Guided blueprint tour (wireframe on black). Copy is drawn only from
        // LearningMaterial/lesson_01.md — `status` marks what is documented
        // versus interpretation. Camera poses are orbits around the pyramid:
        // azimuth 0 = camera on +Z, increasing toward +X; north (−Z) = π.
        tour: [
          {
            id: 'tour-outline',
            label: 'El Castillo',
            camera: { azimuth: 3.68, elevation: 0.32, radius: 105, target: [-1, 13, 1] },
            info: {
              headline: 'El Castillo in outline',
              lines: [
                'A monumental stepped pyramid at Chichén Itzá, strongly associated with calendrical and astronomical symbolism.',
                'Drawn here as a blueprint: only the geometry remains.'
              ],
              status: 'documented'
            }
          },
          {
            id: 'tour-terraces',
            label: 'Nine terraces',
            camera: { azimuth: 4.712, elevation: 0.05, radius: 95, target: [-1, 13, 1] },
            info: {
              headline: 'Nine stepped terraces',
              figure: '9',
              lines: ['The body of the pyramid is built from nine stepped terraces.'],
              status: 'documented'
            }
          },
          {
            id: 'tour-stairways',
            label: 'Four stairways',
            camera: { azimuth: 3.1416, elevation: 0.12, radius: 80, target: [-1, 12, 1] },
            info: {
              headline: 'Four stairways',
              figure: '4 × 91',
              lines: [
                'Four stairways climb the pyramid.',
                'Each is traditionally counted as 91 steps: 4 × 91 = 364.'
              ],
              status: 'documented'
            }
          },
          {
            id: 'tour-365',
            label: '364 + 1',
            camera: { azimuth: 3.1416, elevation: 1.35, radius: 90, target: [-1, 25, 1] },
            info: {
              headline: '364 steps + the platform',
              figure: '365',
              lines: [
                'Together with the upper platform, the 364 steps make 365.',
                'This has been interpreted as a symbolic representation of the 365-day solar year (the Haab).'
              ],
              status: 'interpretation'
            }
          },
          {
            id: 'tour-panels',
            label: '52 panels',
            camera: { azimuth: 1.5708, elevation: 0.1, radius: 70, target: [-1, 10, 1] },
            info: {
              headline: '52 panels on each side',
              figure: '52',
              lines: [
                'The structure contains 52 architectural panels or elements on each side.',
                'The number can be related to the 52-year Calendar Round.'
              ],
              status: 'interpretation'
            }
          },
          {
            id: 'tour-calendar-round',
            label: 'Calendar Round',
            camera: { azimuth: 4.2, elevation: 0.45, radius: 130, target: [-1, 13, 1] },
            info: {
              headline: 'The Calendar Round',
              figure: '18,980 days',
              lines: [
                'The Calendar Round repeats approximately every 18,980 days — 52 Haab years.',
                'It is the point at which the 260-day Tzolk’in and the 365-day Haab once again produce the same combination of dates.',
                'Whether El Castillo’s numbers were meant to echo it cannot always be demonstrated archaeologically.'
              ],
              status: 'mixed'
            }
          }
        ]
      }
    ],
    archaeologicalNotes:
      'The academically strongest interpretation treats El Castillo as a monument in which architectural geometry, calendrical mathematics, and Maya sky-watching traditions were harmoniously integrated, without attributing modern astronomical concepts to ancient builders.'
  }
};
