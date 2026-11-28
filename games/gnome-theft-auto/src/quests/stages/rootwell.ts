// Rootwell (E13, docs/roadmaps/gta-batch-3/E13): the Dean's lodge on the quad, where Dean Lovage Inkwell gives 'The Lost
// Essay', and the Anthill's summit, where Professor Betony Sextant gives 'Rent for the Landlords'.
// Conventions and types: ../stages.ts and ./kit.ts. The places are built by campus/ (buildings.ts, observatory.ts).
import { cam, mark, type Stage } from './kit';

export const ROOTWELL_STAGES: readonly Stage[] = [
  {
    id: 'lovage',
    name: "Rootwell University, outside the Dean's lodge",
    region: 'east-campus',
    center: [1068, -250],
    radius: 10,
    facing: Math.PI / 2,
    time: 'day',
    built: 'existing',
    givers: ['lovage'],
    usedBy: ['sq-rootwell-lost-essay'],
    look: "A tidy clay villa with red window boxes facing the quad, a garden table with a giant cardboard cheque from the HOA, a banner thanking Mrs Thorne.",
    sounds: 'The university bell, students on the gravel, a mower somewhere on the quad.',
    marks: [
      mark('lovage', [1068, -250], [1071, -250], 'stand', 'in his gown with a ledger under one arm'),
      mark('player', [1071, -250], [1068, -250], 'stand', 'walks over from the quad'),
    ],
    cameras: [
      cam('lodge', [1075, 1.6, -253], [1068, 1.2, -250], "from the quad side onto the Dean and his lodge door"),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'betony',
    name: 'The Anthill summit, outside the observatory door',
    region: 'east-campus',
    center: [1246, 167],
    radius: 10,
    facing: 0,
    time: 'day',
    built: 'existing',
    givers: ['betony'],
    usedBy: ['sq-anthill-rent'],
    look: 'A white dome on a gravel forecourt at the top of a giant ant mound, star charts weighed down with stones, the whole campus laid out flat below.',
    sounds: 'Wind over the summit, the dome motor whirring, tiny feet below.',
    marks: [
      mark('betony', [1246, 167], [1246, 170], 'stand', 'with a sextant in one of too many pockets'),
      mark('player', [1246, 170], [1246, 167], 'stand', 'climbs the last of the anthill road'),
    ],
    cameras: [
      cam('summit', [1251, 1.6, 173], [1246, 1.2, 167], 'from the forecourt onto Sextant and the dome behind her'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];
