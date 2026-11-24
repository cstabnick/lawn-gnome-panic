// Pebblewick, the town at the end of Route East (outskirts/town.ts, roadmap docs/roadmaps/gta-outskirts-town.md): the
// dry plots where Purslane Furrow gives 'The Weeping Line', and the water tower where Mallow Bucket gives 'The Hum at
// Three'. Conventions and types: ../stages.ts and ./kit.ts. The town itself is built by outskirts/build.ts.
import { cam, mark, type Stage } from './kit';

export const PEBBLEWICK_STAGES: readonly Stage[] = [
  {
    id: 'pebblewick-plots',
    name: 'Pebblewick, the dry plots on Weeping Lane',
    region: 'dust-flats',
    center: [612, 140],
    radius: 16,
    facing: Math.PI,
    time: 'day',
    built: 'existing',
    givers: ['pebblewick-plots'],
    usedBy: ['sq-weeping-line'],
    look: 'Furrowed pepper plots behind wattle fences, a dark tube weeping along each bed, a scarecrow and a windmill turning over adobe roofs.',
    sounds: 'Windmill creak, a rake in dry soil, a hen somewhere, the drip of the Weeping Line.',
    marks: [
      mark('purslane', [612, 147], [612, 140], 'stand', 'leaning on her rake at the edge of the plots'),
      mark('player', [612, 141], [612, 147], 'stand', 'walks down the gap between the houses from Weeping Lane'),
    ],
    cameras: [
      cam('plots', [612, 1.6, 133], [612, 1.2, 147], 'from Weeping Lane down the gap onto Purslane and the plots'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'pebblewick-tower',
    name: 'Pebblewick, the foot of the water tower',
    region: 'dust-flats',
    center: [708, 170],
    radius: 10,
    facing: Math.PI / 2,
    time: 'day',
    built: 'existing',
    givers: ['pebblewick-tower'],
    usedBy: ['sq-hum-at-three'],
    look: 'A tin water tower on four legs over the hen pen, Mallow\'s map of arrows pinned to a leg, the dunes beyond the fence to the east.',
    sounds: 'Hens, the tank ticking in the heat, wind over the dunes.',
    marks: [
      mark('mallow', [712, 171], [706, 170], 'stand', 'at the foot of the tower with her map of arrows'),
      mark('player', [706, 170], [712, 171], 'stand', 'comes round the Green to the tower'),
    ],
    cameras: [
      cam('tower', [700, 1.6, 169], [712, 1.6, 171], 'from the edge of the Green onto Mallow under the tower'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];
