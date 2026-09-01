import { LessonConfig } from '../../core/types/lesson.types';

export const lesson01Config: LessonConfig = {
  id: '01',
  slug: '01',
  title: 'The Temple of Kukulkán: Calendars, Shadows, and Solar Alignments',
  subtitle: 'El Castillo at Chichén Itzá, Yucatán',
  tagline: 'Explore how Maya monumental architecture encodes the 365-day solar year, the 52-year Calendar Round, Venus synodic cycles, and equinox shadow phenomena.',
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
      // interpolation happens between them). K2's light X/Y were carried
      // over from the lesson default so every keyframe is fully specified.
      //
      // The three keyframes are the lesson's narrative spine:
      //   1. First contact   — Feb 12, 52 days past winter solstice
      //   2. The descent     — Apr 9 / Sep 2, 73 days from summer solstice
      //   3. Zenith gate     — May 24, sun directly overhead
      // Pedagogical copy lives in each keyframe's `callout` so it stays
      // config-driven (no special-casing in Lesson01Overlay).
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
            ],
            prompt: '→ Drag to Step 2 to advance the sun'
          }
        },
        {
          id: 'sky-02',
          name: 'Step 2 · The descent',
          url: '/assets/lesson_01/02.webp',
          description: 'Equinoctial light locking in the nine shadow triangles along the north alfarda.',
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
            ],
            prompt: '→ Drag to Step 3 to open the zenith gate'
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
            tooltip:
              'Full staircase ablaze. The sun stands at the zenith. The portal opens.',
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
        id: 'serpent-descent',
        title: 'Serpent Descent',
        summary:
          'Around the equinoxes, the setting sun projects undulating triangular shadows along the northern balustrade that merge with the Kukulkán serpent head at the staircase base.',
        details: [
          'As the sun descends in the late afternoon around the equinoxes, the edges of the nine stepped terraces cast a series of 7 isosceles triangles of light onto the northwest balustrade.',
          'These illuminated triangles visually merge with the colossal stone-carved serpent head of Kukulkán (the Feathered Serpent) at the base of the staircase.',
          'Scholars emphasize this as a sophisticated architectural and astronomical alignment, though debate continues on whether every detail was intentionally engineered for specific modern dates.'
        ],
        // Focused-view skyTimeline: scopes the Atmosphere Timeline to the
        // two serpent-shadow keyframes (1st contact → The descent). When this
        // topic is active the overlay shows the slider, the contextual
        // callout, and the right-side sun blueprint info box.
        skyTimeline: [
          {
            id: 'sd-01',
            name: 'Step 1 · 1st contact',
            url: '/assets/lesson_01/01.webp',
            lightRotation: [1.6564, 0, 1.5],
            iblIntensity: 0.5,
            callout: {
              label: '1st contact',
              sublabel: 'Feb 12  ·  52 days from winter solstice',
              tooltip: 'The first shadow triangle pierces the staircase. ',
              lines: ['The first shadow triangle pierces the staircase. '],
              astro: {
                azimuth: '≈ 240°',
                altitude: '≈ 29–30°',
                declination: '≈ −13.5°',
                time: '~15:32'
              }
            }
          },
          {
            id: 'sd-02',
            name: 'Step 2 · The descent',
            url: '/assets/lesson_01/02.webp',
            lightRotation: [1.6564, 0, 1.66],
            iblIntensity: 0.82,
            callout: {
              label: 'The descent',
              sublabel: 'Apr 9 / Sep 2  ·  73 days from summer solstice',
              tooltip: 'All 9 triangles lock in. The serpent body is complete.',
              lines: ['All 9 triangles lock in. The serpent body is complete.'],
              astro: {
                azimuth: '≈ 276°',
                altitude: '≈ 7°',
                declination: '≈ +8°',
                time: '~18:37'
              }
            }
          }
        ]
      },
      {
        id: 'solar-zenith',
        title: 'Zenith',
        summary:
          'At the tropical latitude of Chichén Itzá (~20.68° N), the Sun passes directly overhead at local noon twice annually.',
        details: [
          'May 23 or 24: The first zenith passage coincides with planting preparations and marks the beginning of the rainy season in the Maya worldview.',
          'July 19 or 20: The second zenith passage occurs approximately 28 days after the summer solstice (and roughly 56 days after the first zenith passage).',
          'During subsolar zenith passage (occurring in late May and mid-July at Chichén Itzá), vertical objects cast zero shadow at local solar noon.',
          'These zenith events served as sacred solar markers closely correlated with agricultural planting and rain ceremonies (Chak rituals).',
          'Academic consensus treats these as significant cultural markers while maintaining careful separation between astronomical calculations and archaeological interpretations.'
        ],
        // Focused-view skyTimeline (mirrors the Serpent Descent pattern): a
        // 3-keyframe May 23 / Jun 21 / Jul 19 arc scoped to the Zenith topic.
        // All three keyframes share the same sky and the same IBL contribution
        // (0.66) — only the directional sun's position changes. The sun's
        // altitude at the zeniths is 90° (no shadow at noon); at the solstice
        // it's exaggerated to ~80° so the south-side shadow is clearly visible
        // in the camera frame. In reality, Chichén Itzá's latitude makes the
        // solstice-to-zenith altitude delta only ~0.7°; we exaggerate it for
        // teaching visibility. The SkyKeyframe.meta.days / meta.dateLabel
        // fields drive the AtmosphereTimeline's step labels (May 23 / Jun 21
        // / Jul 19). IBL stays at 0.66 across all three — the lesson is about
        // the sun's position, not the sky; only Step 2's panorama changes
        // (03before.webp vs. 03.webp).
        skyTimeline: [
          {
            id: 'sz-01',
            name: 'Zenith 1',
            url: '/assets/lesson_01/03.webp',
            description: 'Sun directly overhead at Chichén Itzá (20.68° N) — the first zenith passage.',
            lightRotation: [-0.2, 0, 0],
            iblIntensity: 0.66,
            meta: { dateLabel: 'May 23', days: 0 },
            callout: {
              label: 'Zenith 1',
              sublabel: 'May 23  ·  First zenith passage  ·  0 days from start',
              tooltip: 'The Sun stands directly overhead. Vertical objects cast no shadow at local solar noon.',
              lines: [
                'Subsolar point over Chichén Itzá.',
                'No shadow at local solar noon.',
                'First rains approaching.'
              ],
              astro: {
                azimuth: '≈ 180°',
                altitude: '≈ 90°',
                declination: '≈ +20.68°',
                time: '~12:00 local'
              }
            }
          },
          {
            id: 'sz-02',
            name: 'Solstice',
            url: '/assets/lesson_01/03before.webp',
            description: 'Summer solstice — the Sun at its northernmost declination.',
            // Sky switches to 03before.webp for the solstice — a slightly
            // different sun position in the panorama. The sun has tilted
            // ~0.15 rad (~8.6°) further from zenith, exaggerated from the real
            // ~0.7° delta so the south-side shadow is visible in the camera
            // frame. IBL stays at 0.66 (matches the two zenith keyframes).
            lightRotation: [-0.35, 0, 0],
            iblIntensity: 0.66,
            meta: { dateLabel: 'Jun 21', days: 29 },
            callout: {
              label: 'Summer Solstice',
              sublabel: 'Jun 21  ·  ~29 days from first zenith  ·  Sun at its northernmost',
              tooltip: 'The Sun has tilted slightly north of zenith. A short south-side shadow appears at noon.',
              lines: [
                'Sun’s declination peaks at +23.4°.',
                'Still very high — the south-side shadow is short.',
                '29 days since the first zenith passage.'
              ],
              astro: {
                azimuth: '≈ 180°',
                altitude: '≈ 80° (exaggerated; real ≈ 89.3°)',
                declination: '≈ +23.4°',
                time: '~12:00 local'
              }
            }
          },
          {
            id: 'sz-03',
            name: 'Zenith 2',
            url: '/assets/lesson_01/03.webp',
            description: 'Sun directly overhead again — the second zenith passage.',
            lightRotation: [-0.2, 0, 0],
            iblIntensity: 0.66,
            meta: { dateLabel: 'Jul 19', days: 57 },
            callout: {
              label: 'Zenith 2',
              sublabel: 'Jul 19  ·  Second zenith passage  ·  57 days from start',
              tooltip: 'The Sun returns to the zenith. The shadow shrinks back to zero.',
              lines: [
                'The mirror image of May 23.',
                'No shadow at local solar noon.',
                'The ritual year closes.'
              ],
              astro: {
                azimuth: '≈ 180°',
                altitude: '≈ 90°',
                declination: '≈ +20.68°',
                time: '~12:00 local'
              }
            }
          }
        ]
      },
      {
        id: 'solar-calendar',
        title: 'Calendar',
        summary:
          'The pyramid embodies the 365-day Haab solar year through its four staircases and summit platform, while its 52 panels mirror the 52-year Calendar Round that synchronizes the sacred and solar calendars.',
        details: [
          'The architecture consists of 9 stepped terraces divided by staircases on four faces.',
          'Each of the 4 stairways contains 91 steps, producing 364 steps in total.',
          'Counting the upper platform as the final step yields exactly 365 steps—corresponding to the days of the Haab solar year.',
          'Each facade of the pyramid contains 52 sculptured panels across the nine terrace tiers.',
          'In Maya chronology, the 260-day sacred Tzolk\'in calendar and the 365-day civil Haab calendar realign to the exact same starting date every 18,980 days (52 Haab years).',
          'This 52-year epoch was celebrated as a momentous rejuvenation cycle across Mesoamerica.'
        ]
      }
    ],
    archaeologicalNotes:
      'The academically strongest interpretation treats El Castillo as a monument in which architectural geometry, calendrical mathematics, and Maya sky-watching traditions were harmoniously integrated, without attributing modern astronomical concepts to ancient builders.'
  }
};
