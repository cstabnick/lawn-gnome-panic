// Story row 51 stages: The Flock Stands. Two places, the same row of six on one leg in both, in the same order:
// - waders-dawn: Wader's Rest at first light. The Flock stand in a row before the Standing Lady's mound (the ritual circle's one-leg
//   stones are the existing `waders-circle`; nothing here stands on its ring of radius 8 round (-1130, -645)), with Mother Saxifrage
//   in front of them and the roller that will draw the flatbed parked at the mound's foot, nose to the east gate.
// - hedgeworth-shed-flock: outside Thrift's shed at Hedgeworth Links (golf/types.ts SHED, door facing west to the green) at dusk,
//   where the flatbed with the Lady stops beside the shed and the Flock fall into the same row, the same spacing, the same order.
// The row's marks are `flock` roles, in order left to right facing the Lady (west to east in the intro, the same in the outro).
import { cam, car, mark, type Stage } from '../kit';

const ROW = ['m51-the-flock-stands'];

export const STAGES: readonly Stage[] = [
  {
    id: 'waders-dawn',
    name: "Wader's Rest, the Flock before the Standing Lady at first light",
    region: 'west-estates',
    center: [-1129, -655],
    radius: 12,
    facing: 0,
    time: 'dawn',
    built: 'existing',
    usedBy: ROW,
    look: 'Mist on the loch reeds and the sun not yet over the camp: six grey gnomes in a row on one leg, a pink flamingo the size of a barn door on her sand mound beyond them, and a lawn roller parked at the mound with a flatbed behind it.',
    sounds: 'Reeds, the loch lapping, one far bird starting up, a kettle somewhere, and no footsteps from anyone who is standing.',
    marks: [
      mark('saxifrage', [-1130.6, -657.2], [-1130.6, -670], 'stand', 'in front of the row on one leg, hooked staff planted, facing the Lady'),
      mark('player', [-1127.4, -652.4], [-1130.6, -657.2], 'stand', 'walks in from the east gate, on two legs'),
      mark('flock', [-1140.5, -660.6], [-1140.5, -670], 'stand', 'first of the row, left of the Lady: Brother Godwit, on one leg, an empty reed-tea cup held very still'),
      mark('flock', [-1137.2, -660.6], [-1137.2, -670], 'stand', 'second: Sister Sedge'),
      mark('flock', [-1133.9, -660.6], [-1133.9, -670], 'stand', 'third: the tallest, with a beard to the belt'),
      mark('flock', [-1127.3, -660.6], [-1127.3, -670], 'stand', 'fourth: the smallest of the Flock'),
      mark('flock', [-1124, -660.6], [-1124, -670], 'stand', 'fifth: a broad grey cloak'),
      mark('flock', [-1120.7, -660.6], [-1120.7, -670], 'stand', 'sixth: the last, who leans a little'),
    ],
    cameras: [
      cam('dawn', [-1130, 2.2, -636], [-1130, 3.4, -668], 'low over the camp from the south: the row of backs and the Lady against the pale sky', 44),
      cam('row', [-1111, 0.8, -656.6], [-1136, 1.3, -660.6], 'ground level along the row: six grey figures, six single legs', 46),
      cam('lady-up', [-1124.4, 0.8, -655.8], [-1131, 5.4, -668], 'low from the row looking up the Lady\'s neck to the sky', 42),
    ],
    walks: [],
    vehicles: [
      car('flock-roller-mound', 'parked', 'lawn-roller', [-1114.4, -660], Math.PI / 2, undefined, 'the lawn roller at the mound, nose to the east gate, a flatbed rope slack behind it'),
    ],
    paths: [],
    set: [],
  },
  {
    id: 'hedgeworth-shed-flock',
    name: "Hedgeworth Links, outside Thrift's shed at dusk",
    region: 'west-estates',
    center: [-1063, 603],
    radius: 14,
    facing: -Math.PI / 2,
    time: 'dusk',
    built: 'existing',
    usedBy: ROW,
    look: 'The tin shed with its door to the west, a flatbed beside it carrying a giant pink flamingo in low gold light, and six grey gnomes in a row on one leg on the ninth fairway, in the same order they left.',
    sounds: 'A sprinkler that has stopped, a mower very far off, the roller ticking as it cools, and Thrift saying nothing for once.',
    marks: [
      mark('saxifrage', [-1062.9, 606.2], [-1054.8, 608.6], 'stand', 'in front of the row on one leg, staff planted, turned to talk to the groundskeeper'),
      mark('player', [-1063.7, 611.8], [-1062.9, 606.2], 'stand', 'steps down from the roller at the back of the row'),
      mark('thrift', [-1054.8, 608.6], [-1062.9, 602.4], 'stand', 'at his shed door with the watering can held like a shield'),
      mark('flock', [-1072.8, 602.4], [-1072.8, 590], 'stand', 'first of the row: Brother Godwit, on one leg, the cup still empty'),
      mark('flock', [-1069.5, 602.4], [-1069.5, 590], 'stand', 'second: Sister Sedge'),
      mark('flock', [-1066.2, 602.4], [-1066.2, 590], 'stand', 'third: the tallest, with a beard to the belt'),
      mark('flock', [-1059.6, 602.4], [-1059.6, 590], 'stand', 'fourth: the smallest of the Flock'),
      mark('flock', [-1056.3, 602.4], [-1056.3, 590], 'stand', 'fifth: a broad grey cloak'),
      mark('flock', [-1053, 602.4], [-1053, 590], 'stand', 'sixth: the last, who leans a little'),
    ],
    cameras: [
      cam('wide', [-1088, 3.6, 620], [-1064, 2.2, 600], 'establishing from the fairway: the shed, the flatbed with the Lady, the Flock in their row', 52),
      cam('row-low', [-1081, 0.8, 603], [-1054, 1.3, 602.4], 'ground level along the row, six single legs against the gold light', 46),
      cam('lady-low', [-1063, 0.9, 614], [-1062.9, 3.4, 597.6], 'low from behind the row up at the Lady on her flatbed', 46),
    ],
    walks: [],
    vehicles: [
      car('flock-roller-shed', 'parked', 'lawn-roller', [-1069.1, 597.6], -Math.PI / 2, undefined, 'the lawn roller at the flatbed\'s tow bar, engine ticking as it cools'),
    ],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {};
