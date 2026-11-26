// Story row 17 (The Dew Buyer): the stages its scenes stand on. The map table in Granny's yard (the barn stage's own table),
// and the gate and frost-pots of Trellisdown Vineyard (E16: country/vineyard.ts, country/trellisLife.ts; the Countess's
// terrace is country/manor.ts). The tanker's route out of Cloverfield and down the west highway is the quest's chase.
import { cam, car, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'granny-map-table',
    name: "Granny's yard, the map table",
    region: 'cloverfield-farms',
    center: [-46.5, 327],
    radius: 12,
    facing: 0,
    time: 'day',
    built: 'existing',
    usedBy: ['m17-the-dew-buyer'],
    look: 'The seed-tray table in the gravel yard, an acorn cake on one corner, the clay oven behind it, the south highway a few metres off past the haystacks.',
    sounds: 'Wind in the wheat, the oven ticking, a hen somewhere, a heavy engine on the highway that is not a combine.',
    marks: [
      mark('granny', [-48.2, 327.6], [-48, 324], 'stand', 'at the near side of the table, a pie tin held over a map like a cloche'),
      mark('player', [-48.4, 321.2], [-48, 324], 'stand', 'across the table, reading the map upside down'),
    ],
    cameras: [
      cam('table', [-44.6, 1.7, 321.4], [-48.3, 1.0, 326.4], 'across the table onto Granny and the map under her pie tin'),
    ],
    walks: [],
    vehicles: [],
    paths: [
      { id: 'tanker-pass', role: 'getaway', kind: 'hoa-van', points: [[10, 390], [-8, 360], [-33, 328], [-40, 320], [-120, 305], [-200, 290]], note: 'an unmarked tanker down the south highway and west on the ring road, past the barn' },
    ],
    set: [],
  },
  {
    id: 'trellisdown-gate',
    name: 'Trellisdown Vineyard, the gate and the frost-pots',
    region: 'west-estates',
    center: [-1140, -72],
    radius: 30,
    facing: 0,
    time: 'dusk',
    built: 'existing',
    usedBy: ['m17-the-dew-buyer'],
    givers: [],
    look: 'A brick-and-iron arch at the south edge of the vines, a lodge with a sign that says to knock and then wait, six black frost-pots in two lines by the path and the vine rows climbing the hill behind; across the lane the pale manor with its terrace.',
    sounds: 'Crickets, a snip of shears far up a row, a heavy engine idling at the gate, the pots hissing once they are fed.',
    marks: [
      mark('chicory', [-1140, -66], [-1140, -50], 'stand', 'inside the gate with his shears on their lanyard, waiting for the engine he can already hear'),
      mark('player', [-1122, -46], [-1140, -60], 'kneel', 'down behind the verge across the lane, hat low, watching the gate'),
      mark('chicory', [-1135.5, -86], [-1131.5, -80], 'work', 'pours a can of something black into the second frost-pot'),
      mark('player', [-1124, -92], [-1131.5, -80], 'kneel', 'among the first vines, the camera held low'),
      mark('wisteria', [-1138, 19.5], 0, 'stand', 'on the raised terrace, opera glasses on a stick, an HOA clipboard under her arm', 1.2),
    ],
    cameras: [
      cam('gate', [-1118, 1.4, -48], [-1140, 1.4, -62], 'from the verge across the lane onto the arch and Chicory under it'),
      cam('pots', [-1119, 1.3, -96], [-1131.5, 0.8, -82], 'from the first vines onto the frost-pots and Chicory feeding them'),
    ],
    walks: [],
    vehicles: [
      car('dew-tanker', 'pull-up', 'hoa-van', [-1140, -47], [-1140, -62], undefined, 'the unmarked tanker idling on the verge below the arch, lights on'),
    ],
    paths: [
      { id: 'tanker-in', role: 'arrival', kind: 'hoa-van', points: [[-1140, -47], [-1140, -62], [-1140, -90], [-1120, -86], [-1106, -84]], offRoad: true, note: 'through the arch, between the two lines of pots and round to the press-house apron' },
    ],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'granny-barn': ['m17-the-dew-buyer'],
};
