// Story row 2 (A Roof on Credit): the stages its scenes play on, and extra quest ids for existing stages' usedBy.
// The intro stands on side-valve-bay (turfton.ts); the mid scene at the First Kiln Bank counter and the outro at the
// Saucer Court stairwell are new here. Both are outdoors, so the scenes are checked against the real world colliders
// (the Saucer Court wings are built by the game, not by the test world: keep every spot inside the courtyard).
import { cam, car, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'first-kiln-bank-front',
    name: 'First Kiln Bank, the Counter',
    region: 'turfton',
    center: [101, 111.5],
    radius: 7,
    facing: Math.PI,
    time: 'day',
    built: 'existing',
    usedBy: ['m02-roof-on-credit'],
    look: 'The pavement in front of the bank tower in block (90, 90): a loan counter wheeled out under the awning, a ledger, a rubber stamp and a queue of one.',
    sounds: 'A stamp, a pen scratching, a cab idling at the kerb, a distant adding machine.',
    marks: [
      mark('parsley', [101, 109.4], [101, 112.2], 'stand', 'behind the loan counter, stamping before he speaks'),
      mark('player', [101, 112.4], [101, 109.4], 'stand', 'stands at the counter with a pen in hand'),
      mark('mabel', [108.2, 117.2], [101, 112.4], 'sit', 'in her cab at the kerb, engine idling, meter running'),
    ],
    cameras: [
      cam('wide', [90, 4, 121], [101, 1.2, 110.6], 'establishing: the counter against the tower, the cab at the kerb'),
      cam('counter', [96.5, 1.5, 114.5], [101, 1.3, 110.6], 'the loan counter from the player side'),
    ],
    walks: [],
    vehicles: [
      car('bank-kerb-taxi', 'parked', 'taxi', [108.2, 117.2], Math.PI / 2, 'mabel', 'Mabel Kerbstone\'s Turfton Taxi, engine idling at the kerb'),
    ],
    paths: [],
    set: [],
  },
  {
    id: 'saucer-court-stairs',
    name: 'Saucer Court, the Stairwell Door',
    region: 'turfton',
    center: [30, 84],
    radius: 8,
    facing: Math.PI,
    time: 'dusk',
    built: 'existing',
    usedBy: ['m02-roof-on-credit'],
    look: 'The north wing of the courtyard at dusk: the stairwell door, the buzzer panel with a name plate, Hyssop\'s chair and leaning stop sign, the moving-day crates and the dry saucer behind.',
    sounds: 'A courtyard hush, a washing line creaking, a door chain, a very watchful silence.',
    marks: [
      mark('hyssop', [30, 79.9], 0, 'stand', 'in the stairwell doorway with her stop paddle, head turning before the body'),
      mark('player', [30, 85.5], Math.PI, 'stand', 'steps in from the street with the keys in hand'),
    ],
    cameras: [
      cam('saucer-down', [30, 26, 100], [30, 0.4, 94], 'the signature shot: straight down on the saucer and the courtyard'),
      cam('door', [30, 1.6, 87], [30, 1.4, 79.9], 'the stairwell door from the courtyard'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {};
