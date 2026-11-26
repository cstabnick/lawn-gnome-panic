// Story row 24: the stages its scenes play on (new ones), and extra quest ids for existing stages' usedBy.
// Two places on the west road: a fallen log in the last pines of Mossy Wood, where Nubbin hides while two gnomes with
// spades work the undergrowth (intro, day), and the round Burrow Door itself at dusk with its lantern lit (outro). The door,
// its mound, post and signs are built by societies/loamdeep/door.ts; nothing here stands inside them.
import { cam, car, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'mole-log',
    name: 'Mossy Wood, the fallen log in the last pines',
    region: 'mossy-wood',
    center: [-830, 270],
    radius: 12,
    facing: 0,
    time: 'day',
    built: 'dressed',
    usedBy: ['m24-the-burrow-door'],
    look: 'A long mossy log in dappled afternoon light at the edge of the last pines, bracken round it and a small pink nose and two bright spectacles poking out from under one end.',
    sounds: 'Pine needles ticking, a spade going into soil twice, a polite squeak that is trying not to be one.',
    marks: [
      mark('nubbin', [-830.2, 271.6], [-825, 274], 'kneel', 'tucked under the log with only his nose and spectacles out, satchel clutched to his chest'),
      mark('digger-a', [-825.5, 265.5], [-830, 270], 'stand', 'a spade on his shoulder, prodding the bracken with the other hand'),
      mark('digger-b', [-822.5, 268.5], [-830, 270], 'lean', 'leaning on his spade, bored, looking at the wrong log'),
      mark('player', [-825, 275], [-830.2, 271.6], 'stand', 'has stopped at the log with the engine off'),
    ],
    cameras: [
      cam('log-low', [-826.4, 0.3, 274.6], [-830.2, 0.35, 271.6], 'ground level, a mole\'s eye line, onto the nose and spectacles under the log'),
      cam('diggers', [-832, 1.0, 274], [-824.5, 1.2, 267], 'from behind the log, low, onto the two spades working the bracken'),
      cam('wide', [-818, 2.2, 277], [-828, 0.8, 269], 'the log, the diggers and the pines from the road side'),
    ],
    walks: [],
    vehicles: [
      car('mole-buggy', 'parked', 'barrow-buggy', [-821, 276.5], -Math.PI / 2, undefined, 'a barrow buggy left at the edge of the pines, the loan for the ride home'),
    ],
    paths: [],
    set: [
      { prefab: 'fallen-log', at: [-830, 270], yaw: 0.15, scale: 2 },
    ],
  },
  {
    id: 'burrow-door-dusk',
    name: 'The Burrow Door at dusk, the lantern lit',
    region: 'west-estates',
    center: [-989, 301],
    radius: 9,
    facing: -Math.PI / 2,
    time: 'dusk',
    built: 'existing',
    usedBy: ['m24-the-burrow-door'],
    look: 'The round stone door a little open in its grassy mound, the lamp post beside it, the light going gold and low across the west road, and an old mole in a shawl with a brass lantern held up.',
    sounds: 'Wind in the pines across the road, a slow bass thump through the ground that rattles the lantern glass, a polite squeak.',
    marks: [
      mark('tumblesoil', [-991.2, 300.4], [-986, 300.4], 'stand', 'a lace shawl pinned with a tiny brass lamp, a root cane, the lantern held up in her other hand'),
      mark('nubbin', [-987.5, 301.6], [-991.2, 300.4], 'stand', 'steps down from the barrow, satchel straight, bowing a little'),
      mark('player', [-984.6, 299.2], [-991.2, 300.4], 'stand', 'beside the barrow buggy, hat in hand'),
    ],
    cameras: [
      cam('door', [-984.4, 0.5, 302.4], [-991.4, 0.7, 300.4], 'a mole\'s height from the road, level on the round door with the old mole in it'),
      cam('lantern', [-989.6, 0.9, 298.8], [-991.4, 0.9, 300.3], 'close on the lantern held up beside the door'),
      cam('wide', [-978, 2.6, 307], [-990, 0.8, 300.5], 'the mound, the door, the three of them and the gold road'),
    ],
    walks: [],
    vehicles: [
      car('door-buggy', 'pull-up', 'barrow-buggy', [-985.4, 301.6], Math.PI, undefined, 'the barrow buggy pulled up facing the door, a small satchel on the seat'),
    ],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {};
