// Story row 45 stages: Rootwell Admissions. Four places, none of them new buildings:
// - queen-rail-letter: the foot of Long Spoon Pier on Saltbucket Shore (the giver `betony-letter`; the Bathtub Queen lies out at the
//   pier's end and the Saltwater behind). The coast's own `coast-pier` stage is Bilge's; this one is the rail beside it.
// - rootwell-registrar: the forecourt of Wicket Lodge (the gate lodge, campus/types.ts CAMPUS_BUILDINGS) on the drive's north edge,
//   where the scene sets a registrar's desk. The lodge faces south; the drive runs along z -200 past it.
// - quad-lecture: the quad's north-west lawn, where Dean Lovage Inkwell lectures twelve empty folding chairs (scene props).
// - long-shelf-steps: the Long Shelf's front steps (the library door faces the quad), where Betony points at the Anthill at dusk.
import { cam, mark, type Stage } from '../kit';

const ROW = ['m45-rootwell-admissions'];

export const STAGES: readonly Stage[] = [
  {
    id: 'queen-rail-letter',
    name: 'Long Spoon Pier, the rail, with the Bathtub Queen behind',
    region: 'south-shore',
    center: [300, 1172],
    radius: 8,
    facing: Math.PI,
    time: 'day',
    built: 'existing',
    givers: ['betony-letter'],
    usedBy: ROW,
    look: 'The head of the pier in full noon: planks, a mooring post with a plump pigeon on it, the chalked tour board, and the Saltwater glittering to a horizon with a toy pirate ship moored out in it.',
    sounds: 'Surf, planks, a rope slapping a post, the ship\'s bell very far off, and a pigeon who has been waiting a long time.',
    marks: [
      mark('player', [300.4, 1171.4], [300, 1160], 'stand', 'at the rail with the sea at their back, a sealed letter in both hands'),
    ],
    cameras: [
      cam('wide', [295, 3.4, 1150], [300, 1.4, 1172], 'establishing from the beach: the pier head, the player small at the rail and the sea beyond', 52),
      cam('post', [301.6, 1.5, 1168.6], [298.6, 1.9, 1172.4], 'low from the pier planks onto the mooring post and its pigeon'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'rootwell-registrar',
    name: "Rootwell University, the registrar's desk outside Wicket Lodge",
    region: 'east-campus',
    center: [1001, -207],
    radius: 9,
    facing: 0,
    time: 'day',
    built: 'dressed',
    usedBy: ROW,
    look: "The gate lodge by the main gate, its door facing the drive, and a registrar's desk set out on the forecourt under a brass bell, with a queue of precisely nobody.",
    sounds: 'The university bell, a mower, a stamp coming down once, hard, and a clipboard being squared.',
    marks: [
      mark('registrar', [1000, -209.2], [1000, -205], 'stand', "behind the desk, spectacles on a chain, a rubber stamp in the other hand"),
      mark('player', [999.6, -204.8], [1000, -209.2], 'stand', 'steps up from the drive, a little out of breath from the walk'),
    ],
    cameras: [
      cam('wide', [1014, 3.2, -193], [1000, 1.2, -208], 'establishing: the lodge, the desk on its forecourt and the gate road beyond', 50),
      cam('desk', [1006.4, 1.5, -203.2], [1000, 1.1, -208.4], 'low across the desk onto the registrar and his stamp'),
      cam('gate', [989, 1.6, -197], [1000.4, 1.2, -207], 'from the main gate along the drive onto the lodge'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'quad-lecture',
    name: "Rootwell University, the Dean's open-air lecture on the quad",
    region: 'east-campus',
    center: [1105, -238],
    radius: 16,
    facing: Math.PI / 2,
    time: 'day',
    built: 'dressed',
    usedBy: ROW,
    look: 'A lectern on the north-west lawn with a Dean in a maroon gown behind it, and twelve folding chairs in neat rows facing him, empty but for one pigeon in the front row; the library across the grass, the founder\'s bronze beyond.',
    sounds: 'A gavel tapped on a lectern, the university bell, a very slight wing flutter, and a mower circling the whole thing with tact.',
    marks: [
      mark('lovage', [1100.8, -240], [1112, -240], 'stand', 'behind the lectern, gown squared, one hand on his pocket watch'),
      mark('player', [1093, -229], [1100.8, -240], 'stand', 'creeps across the lawn with their cap low, behind the Dean\'s back'),
    ],
    cameras: [
      cam('wide', [1132, 3.8, -214], [1106, 1.0, -239], 'establishing from the south-east: the Dean, the lectern, the empty rows and the pigeon', 52),
      cam('back', [1090, 1.9, -246], [1110, 1.0, -238], 'from behind and beside the Dean, over his shoulder down the empty rows', 48),
      cam('sneak', [1106, 1.3, -222], [1094, 1.1, -230], 'a low angle from the lawn onto the player tiptoeing behind the Dean'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'long-shelf-steps',
    name: 'Rootwell University, the steps of the Long Shelf at dusk',
    region: 'east-campus',
    center: [1110, -274],
    radius: 9,
    facing: 0,
    time: 'dusk',
    built: 'existing',
    usedBy: ROW,
    look: "The library's front steps in low gold light, the door open behind them and dust turning in the beam, the quad laid out below in long shadows and, far south-east over the buildings, the white dome on the Anthill.",
    sounds: 'The university bell for the evening, the quad emptying, a page turned a long way inside, and the faint scrape of ants.',
    marks: [
      mark('betony', [1108.6, -276], [1118, -262], 'stand', 'in the open doorway, one hand on the frame, a brass sextant in the other'),
      mark('player', [1111.2, -272.4], [1108.6, -276], 'stand', 'on the step below her, hat brim still low'),
    ],
    cameras: [
      cam('wide', [1128, 3.2, -246], [1110, 3.0, -277], 'establishing from the quad: the Long Shelf at dusk, the door lit gold, two small figures on the steps', 52),
      cam('anthill', [1112, 1.9, -273.6], [1240, 8, 150], 'over the pair\'s shoulders, across the quad and the campus to the dome on the Anthill', 40),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {};
