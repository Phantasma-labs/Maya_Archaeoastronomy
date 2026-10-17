import { LessonConfig, SkyKeyframe } from '../../core/types/lesson.types';
import { sunLightRotation } from '../../core/utils/sunrise';
import { OBSERVER_XZ, OBSERVER_Y } from './site';
import { KEY_DATES, SUN_ELEVATION_DEG, positionToAzimuthDeg } from './sunPath';

// Kid-level copy per key sunrise, simplified from LearningMaterial/lesson_02.md.
// Index i <-> KEY_DATES[i]. Each line is one short idea.
const STEP_COPY: { headline: string; lines: string[] }[] = [
  {
    headline: 'December solstice: shortest day',
    lines: [
      'The Sun rises farthest to the south-east.',
      'It comes up over E-III, the southern building.'
    ]
  },
  {
    headline: 'Equinox: day and night equal',
    lines: ['The Sun rises straight east.', 'It comes up over E-II, the middle building.']
  },
  {
    headline: 'June solstice: longest day',
    lines: [
      'The Sun rises farthest to the north-east.',
      'It comes up over E-I, the northern building.'
    ]
  },
  {
    headline: 'Equinox again',
    lines: ['The Sun rises straight east again.', 'It comes up over E-II, the middle building.']
  },
  {
    headline: 'Back to the shortest day',
    lines: [
      'The Sun has moved back to the south-east.',
      'It comes up over E-III again.',
      'One whole year has gone by!'
    ]
  }
];

// One keyframe per key date. Sun direction is derived from the slider position
// in the scene (not from lightRotation interpolation), but each keyframe still
// carries its true light rotation so the data stays self-consistent.
// Temporary sky texture (branch only) until the dawn skies land in Task 8.
const SUNRISE_KEYFRAMES: SkyKeyframe[] = KEY_DATES.map((key, i) => {
  const copy = STEP_COPY[i];
  return {
    id: `sunrise-${i + 1}`,
    name: `Step ${i + 1} · ${copy.headline}`,
    url: '/assets/lesson_01/01.webp',
    lightRotation: sunLightRotation(positionToAzimuthDeg(i + 1), SUN_ELEVATION_DEG),
    iblIntensity: 0.5,
    meta: { dateLabel: key.label },
    callout: {
      label: copy.headline,
      sublabel: `${key.label}  ·  Sunrise over ${key.building}`,
      tooltip: copy.lines.join(' '),
      lines: copy.lines
    }
  };
});

export const lesson02Config: LessonConfig = {
  id: '02',
  slug: '02',
  title: 'Group E at Uaxactún: Watching the Sunrise',
  subtitle: 'Parque Arqueológico Uaxactún, Petén, Guatemala',
  tagline:
    'Stand on the western pyramid and watch the Sun rise over three buildings as the year turns from solstice to equinox to solstice.',
  thumbnail: '/assets/landing/lesson-02-thumb.webp',
  status: 'available',
  difficulty: 'Introductory',
  duration: '10 min interactive study',

  assets: {
    models: [
      {
        id: 'site',
        name: 'Group E, Uaxactún',
        url: '/assets/lesson_02/Uaxactun_v003.glb',
        castShadow: true,
        receiveShadow: true
      }
    ],
    environment: {
      skyTimeline: SUNRISE_KEYFRAMES,
      scale: 0.52,
      panY: -0.029,
      rotation: [0.09, -1.7, 0.05],
      intensity: 1.0,
      backgroundEnabled: true
    }
  },

  // Looks due east (−π/2 about Y) from the observer point west of the plaza.
  camera: {
    position: [OBSERVER_XZ[0], OBSERVER_Y, OBSERVER_XZ[1]],
    rotation: [0, -Math.PI / 2, 0],
    fov: 50,
    near: 0.1,
    far: 1000
  },

  lighting: {
    directional: {
      intensity: 3.2,
      color: '#ffe2bd',
      castShadow: true
    }
  },

  content: {
    monumentName: 'Group E (E-VII-sub and E-I, E-II, E-III)',
    timePeriod:
      'Late Preclassic origins (Aveni: ~0–200 CE); platform buildings reached final form in the Early Classic',
    culture: 'Maya civilization',
    overview:
      'Group E at Uaxactún, in the Petén lowlands of northern Guatemala (about 17.4° N, roughly 19 km north of Tikal), is one of the most famous architectural complexes in the study of Maya astronomy. On its western side stands Structure E-VII-sub, a radial pyramid with stairways on all four sides. Facing it across an open plaza, a long north–south platform carries three smaller buildings: E-I to the north, E-II in the centre and E-III to the south. Because Uaxactún was the first such complex to be described, every building group with this layout is now called an "E Group", and dozens are known across the Maya lowlands.',
    topics: [
      {
        id: 'watch-sunrise',
        title: 'Watch the Sunrise',
        summary:
          'The classic interpretation is that an observer on E-VII-sub would see the Sun rise over E-I at the June solstice, over E-II at the equinoxes and over E-III at the December solstice.',
        details: [
          'The astronomy is well established and can be calculated: on a flat horizon at this latitude the Sun rises at an azimuth of about 65° around the June solstice, due east (90°) around the equinoxes, and about 115° around the December solstice, so the sunrise point travels along an arc of roughly 50° of the eastern horizon and pauses briefly at each end.',
          'Field measurements by Anthony Aveni and Horst Hartung (1989) supported the alignment as seen from a point just above the middle stairway of E-VII-sub. Aveni also notes that Group E as a whole is aligned to the cardinal directions.',
          'How the group was used is still debated: Aveni suggests a performative role, more like a planetarium than an observatory, while Ivan Šprajc (2021) is more sceptical that E Groups were specialised observatories.'
        ],
        keyFact:
          'Over a year the sunrise point travels back and forth along roughly 50° of the eastern horizon, and the three buildings can mark the two ends and the middle of that journey.',
        skyTimeline: SUNRISE_KEYFRAMES
      }
    ],
    archaeologicalNotes:
      'E-VII-sub is an archaeological discovery: excavation of the ruined later pyramid, E-VII, revealed this earlier, well-preserved building inside it. It dates to the Late Preclassic (Aveni gives roughly 0–200 CE), was covered in white lime plaster and was decorated with sixteen large stucco masks flanking its four stairways; Michael Coe has suggested the masks may represent the jaguar god of the underworld and sky serpents, an iconographic reading rather than a certainty. Šprajc argues that the classic sightlines connect buildings from different periods, and other scholars, including James Aimers and Prudence Rice, interpret E Groups primarily as ritual and public spaces whose layout referred symbolically to the solar cycle. The summary best supported by the evidence is that Group E is an architectural complex built around the Sun’s movement along the horizon; whether it was a working observatory, a ceremonial stage or both remains a subject of scholarly discussion. This lesson separates archaeological evidence, astronomical calculation and scholarly interpretation.'
  }
};
