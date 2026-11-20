// New prefabs for lawn-prix. One owner (the lawn-prix adoption issue): add entries here and nowhere else.
import type { PrefabDef } from '../types';
import { PUSH_BIKE_DAMAGE, RIDE_ON_DAMAGE } from './damage-stages';

const DARK = 0x222222;
const METAL = 0x8a8f96;
const SEAT = 0x333333;

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
];
