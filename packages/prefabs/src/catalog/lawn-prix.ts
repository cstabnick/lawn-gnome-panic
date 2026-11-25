// New prefabs for lawn-prix. One owner (the lawn-prix adoption issue): add entries here and nowhere else.
import type { PrefabDef } from '../types';
import { PUSH_BIKE_DAMAGE, RIDE_ON_DAMAGE } from './damage-stages';

const DARK = 0x222222;
const METAL = 0x8a8f96;
const SEAT = 0x333333;

/** A knobbly tyre for the dirt-mower bike: a fat tread cylinder with a ring of small knobs round it, all in one wheel group. */
function knobbyTyre(group: string, z: number): PrefabDef['parts'][number][] {
  const r = 0.14;
  const y = 0.14;
  const parts: PrefabDef['parts'][number][] = [
    { s: 'cyl', d: [r, r, 0.08], rot: [0, 0, 90], at: [0, y, z], c: DARK, seg: 12, group },
    { s: 'cyl', d: [0.05, 0.05, 0.1], rot: [0, 0, 90], at: [0, y, z], c: METAL, seg: 8, group },
  ];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    parts.push({ s: 'box', d: [0.09, 0.035, 0.03], rot: [(-a * 180) / Math.PI, 0, 0], at: [0, y + Math.cos(a) * (r + 0.01), z + Math.sin(a) * (r + 0.01)], c: DARK, group });
  }
  return parts;
}

const DIRT_BARS: readonly [number, number, number] = [0, 0.62, 0.05];

export const LAWN_PRIX: readonly PrefabDef[] = [
  {
    id: 'ride-on-mower', name: 'Ride-On Mower', category: 'prop', uses: ['place'],
    damage: RIDE_ON_DAMAGE,
    tags: ['mower', 'machine', 'ride-on', 'cart', 'racer', 'wheel', 'steering', 'seat', 'lawn'], emoji: [],
    tint: 0xd8342c,
    pivots: {
      'wheel-0': [-0.6, 0.275, -0.55], 'wheel-1': [0.6, 0.275, -0.55],
      'wheel-2': [-0.55, 0.175, 0.6], 'wheel-3': [0.55, 0.175, 0.6],
      steer: [0, 1.1388, 0.0103],
    },
    about: 'A ride-on lawn mower for Lawn Prix: a tinted deck and hood, a bench seat and a leaning steering column. Rear wheels spin (wheel-0, wheel-1), front wheels spin and yaw (wheel-2, wheel-3), and the steer pivot tilts the column and turns the wheel. Tint sets the body.',
    examine: [
      'A low red deck on four black tyres, with a grass chute out of one side and a steering wheel that leans back at the driver.',
      'Gnomes call it a chariot that has forgotten its horses. The mower does not mind, and neither does the grass.',
      'Tip: the front wheels turn and the back wheels do the work. Lean into the bend and trust the grass.',
      'Joke: a seat with no roof is a seat with a firm opinion about the weather.',
      'The steering column is the only part of the mower that anyone has ever polished.',
    ],
    parts: [
      { s: 'box', d: [1.2, 0.2, 1.7], at: [0, 0.35, 0], c: 'tint' },                       // deck
      { s: 'box', d: [1.0, 0.25, 0.5], at: [0, 0.5, 0.95], c: 'tint', name: 'hood' },                  // hood
      { s: 'box', d: [0.7, 0.12, 0.05], at: [0, 0.45, 1.2], c: METAL, name: 'grille' },                  // grille
      { s: 'box', d: [0.12, 0.2, 0.4], at: [0.66, 0.45, -0.2], c: 'tint' },                // grass chute
      { s: 'box', d: [0.5, 0.12, 0.5], at: [0, 0.42, -0.35], c: SEAT },                    // seat
      { s: 'box', d: [0.5, 0.55, 0.1], at: [0, 0.7, -0.62], c: SEAT },                     // backrest
      { s: 'cyl', d: [0.02, 0.02, 0.5], rot: [-28.65, 0, 0], at: [0, 0.9194, 0.1301], c: METAL, seg: 6 }, // column
      { s: 'ring', d: [0.22, 0.02], rot: [90, 0, 0], at: [0, 1.1388, 0.0103], c: SEAT, group: 'steer' }, // wheel
      { s: 'cyl', d: [0.275, 0.275, 0.2], rot: [0, 0, 90], at: [-0.6, 0.275, -0.55], c: DARK, seg: 14, group: 'wheel-0' },
      { s: 'cyl', d: [0.275, 0.275, 0.2], rot: [0, 0, 90], at: [0.6, 0.275, -0.55], c: DARK, seg: 14, group: 'wheel-1' },
      { s: 'cyl', d: [0.175, 0.175, 0.16], rot: [0, 0, 90], at: [-0.55, 0.175, 0.6], c: DARK, seg: 14, group: 'wheel-2' },
      { s: 'cyl', d: [0.175, 0.175, 0.16], rot: [0, 0, 90], at: [0.55, 0.175, 0.6], c: DARK, seg: 14, group: 'wheel-3' },
    ],
  },
  {
    id: 'push-mower-bike', name: 'Push-Mower Bike', category: 'prop', uses: ['place'],
    damage: PUSH_BIKE_DAMAGE,
    tags: ['mower', 'machine', 'bike', 'push', 'racer', 'blade', 'handle', 'wheel', 'lawn'], emoji: [],
    tint: 0xd8342c,
    pivots: {
      'wheel-0': [-0.28, 0.1, 0.3], 'wheel-1': [0.28, 0.1, 0.3],
      'wheel-2': [-0.28, 0.1, -0.3], 'wheel-3': [0.28, 0.1, -0.3],
      blade: [0, 0.09, 0], handle: [0, 0.3, -0.1],
    },
    about: 'A push-mower bike for Lawn Prix: a round tinted deck on four small wheels, an engine block, a blade that spins under the deck (blade) and a U-handle that yaws with the steering (handle). Tint sets the deck.',
    examine: [
      'A round deck on four small wheels, with a pull cord on top and a blade spinning underneath like a dinner plate.',
      'Gnome saying: a push mower goes where it is pushed, and it is pushed by whichever gnome is nearest.',
      'Tip: the handle turns with the steering, so look where it points before you pull the cord.',
      'Joke: the bike has no brakes, but it does have a loud opinion about hedges.',
      'The blade is only sharp on one side, and that is the side you are standing on.',
    ],
    parts: [
      { s: 'cyl', d: [0.45, 0.45, 0.12], at: [0, 0.2, 0], c: 'tint', seg: 20 },              // round deck
      { s: 'box', d: [0.4, 0.03, 0.3], at: [0, 0.27, -0.4], c: SEAT },                       // footplate
      { s: 'box', d: [0.3, 0.25, 0.3], at: [0, 0.4, 0], c: METAL },                         // engine block
      { s: 'box', d: [0.12, 0.04, 0.04], at: [0, 0.56, -0.1], c: SEAT },                    // pull cord grip
      { s: 'cyl', d: [0.1, 0.1, 0.06], rot: [0, 0, 90], at: [-0.28, 0.1, 0.3], c: DARK, seg: 12, group: 'wheel-0' },
      { s: 'cyl', d: [0.1, 0.1, 0.06], rot: [0, 0, 90], at: [0.28, 0.1, 0.3], c: DARK, seg: 12, group: 'wheel-1' },
      { s: 'cyl', d: [0.1, 0.1, 0.06], rot: [0, 0, 90], at: [-0.28, 0.1, -0.3], c: DARK, seg: 12, group: 'wheel-2' },
      { s: 'cyl', d: [0.1, 0.1, 0.06], rot: [0, 0, 90], at: [0.28, 0.1, -0.3], c: DARK, seg: 12, group: 'wheel-3' },
      { s: 'cyl', d: [0.3, 0.3, 0.02], at: [0, 0.09, 0], c: METAL, seg: 16, group: 'blade' },   // blade disc
      { s: 'cyl', d: [0.02, 0.02, 0.7616], rot: [23.2, 0, 0], at: [-0.25, 0.65, 0.05], c: METAL, seg: 6, group: 'handle' },
      { s: 'cyl', d: [0.02, 0.02, 0.7616], rot: [23.2, 0, 0], at: [0.25, 0.65, 0.05], c: METAL, seg: 6, group: 'handle' },
      { s: 'cyl', d: [0.025, 0.025, 0.5], rot: [0, 0, 90], at: [0, 1.0, 0.2], c: SEAT, seg: 6, group: 'handle' },
    ],
  },
  {
    id: 'dirt-mower-bike', name: 'Knobbly Dirt-Mower', category: 'prop', uses: ['place', 'sit'],
    tags: ['mower', 'machine', 'bike', 'dirt', 'motocross', 'knobbly', 'racer', 'seat', 'wheel', 'lawn', 'vehicle', 'ride'], emoji: [],
    tint: 0x3f8f3a,
    seat: [0, 0.36, -0.12],
    pivots: { 'wheel-0': [0, 0.14, -0.4], 'wheel-1': [0, 0.14, 0.42], steer: [0, 0.62, 0.05] },
    about: 'Gnome Theft Auto: the Knobbly Dirt-Mower. A push-mower bike rebuilt for the dirt: a tinted frame and tank, knobbly fat tyres (wheel-0 rear, wheel-1 front), long telescopic forks, a high front mudguard, a raised exhaust and a white number plate with a black 7. The steer group holds the bar, grips, forks and plate. Nose +z.',
    examine: [
      'A green two-wheeler on fat knobbly tyres, with forks as long as a gnome and a number plate that says 7.',
      'Saying: a dirt bike is a push mower that has been told it can have a personality.',
      'Tip: it floats over the bumps and lands the jumps, so do not slow down for the part you came for.',
      'Joke: the high mudguard keeps the mud off the front wheel and puts it on the rider, which is fairer.',
      'The exhaust points at the sky, which is the only direction nobody has ever complained from.',
    ],
    parts: [
      { s: 'box', d: [0.14, 0.12, 0.5], at: [0, 0.3, -0.05], c: 'tint', name: 'frame' },
      { s: 'ball', d: [0.1], at: [0, 0.42, 0.12], scale: [1, 0.8, 1.4], c: 'tint', seg: 8, name: 'tank' },
      { s: 'box', d: [0.16, 0.06, 0.4], at: [0, 0.4, -0.2], c: SEAT, name: 'saddle' },
      { s: 'box', d: [0.2, 0.02, 0.2], at: [0, 0.34, -0.42], c: 'tint', name: 'rear-fender' },
      { s: 'box', d: [0.16, 0.14, 0.14], at: [0, 0.2, 0.0], c: METAL, name: 'engine' },
      { s: 'cyl', d: [0.02, 0.02, 0.5], rot: [-80, 0, 0], at: [0.1, 0.38, -0.25], c: METAL, seg: 6, name: 'exhaust' },
      { s: 'cyl', d: [0.03, 0.03, 0.12], rot: [-80, 0, 0], at: [0.1, 0.5, -0.5], c: 'silver', seg: 6, name: 'muffler' },
      { s: 'cyl', d: [0.015, 0.015, 0.5], rot: [-10, 0, 0], at: [0, 0.3, -0.4], c: METAL, seg: 6, name: 'swingarm' },
      { s: 'box', d: [0.12, 0.015, 0.2], at: [0, 0.34, 0.42], rot: [-15, 0, 0], c: 'tint', name: 'mudguard' },
      ...knobbyTyre('wheel-0', -0.4),
      ...knobbyTyre('wheel-1', 0.42),
      { s: 'cyl', d: [0.02, 0.02, 0.44], rot: [0, 0, 90], at: DIRT_BARS, c: 'steel', seg: 6, group: 'steer', name: 'bar' },
      { s: 'cyl', d: [0.026, 0.026, 0.08], rot: [0, 0, 90], at: [0.2, 0.62, 0.05], c: 'black', seg: 6, mirror: true, group: 'steer', name: 'grip' },
      { s: 'pill', d: [0.016, 0.52], at: [0.05, 0.36, 0.2], rot: [-18, 0, 0], c: 'silver', seg: 6, mirror: true, group: 'steer', name: 'fork' },
      { s: 'box', d: [0.16, 0.11, 0.012], at: [0, 0.55, 0.22], rot: [-18, 0, 0], c: 'white', group: 'steer', name: 'plate' },
      { s: 'box', d: [0.07, 0.015, 0.006], at: [0, 0.585, 0.229], rot: [-18, 0, 0], c: 'black', group: 'steer', name: 'seven-top' },
      { s: 'box', d: [0.015, 0.075, 0.006], at: [0.012, 0.545, 0.229], rot: [-18, 0, 12], c: 'black', group: 'steer', name: 'seven-stem' },
    ],
  },
];
