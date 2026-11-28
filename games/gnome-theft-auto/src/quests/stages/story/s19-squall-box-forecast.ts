// Story row 19: the stages its scenes play on (new ones), and extra quest ids for existing stages' usedBy.
// The Squall-Box windmill is built by `rooster-windmill` (cloverfield.ts); these two stages add the giver, the marks and the
// cameras for the forecast quest: the yard at the windmill's foot (intro) and the home field to the south (outro).
import { cam, car, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'squall-box-yard',
    name: "The Squall-Box windmill, Rooster's barometer yard",
    region: 'cloverfield-farms',
    center: [-2, 398],
    radius: 22,
    facing: Math.PI / 2,
    time: 'day',
    built: 'existing',
    givers: ['squall-box'],
    usedBy: ['m19-squall-box-forecast'],
    look: 'The foot of the tin windmill in an open field under a hard blue noon sky: a water trough, hay bales, two sprinklers ticking, and three brass barometers standing in a row on the stubble with their needles all on FAIR.',
    sounds: 'Windmill blades creaking, sprinklers chattering, a tin funnel shrieking, and no cloud in the sky to explain any of it.',
    marks: [
      mark('rooster', [4, 398.5], Math.PI, 'stand', 'stands at the foot of the lookout ladder in the windmill shadow, tin funnel to his mouth, flapping his arms for wind'),
      mark('bramble', [-4.5, 400.5], [4, 398.5], 'lean', 'leans on a hay bale with a wet finger held up to the wind, unimpressed'),
      mark('player', [-9, 395], [4, 398.5], 'stand', 'steps up to the barometer row, squinting at a cloudless sky'),
    ],
    cameras: [
      cam('wide', [-17, 6, 386], [4, 5, 402], 'establishing: the windmill over the field, a clean blue sky behind it'),
      cam('barometers', [-1.5, 1.2, 398], [-3, 0.55, 392], 'a row of three brass barometers on the stubble, all needles on FAIR'),
      cam('sky', [-9, 1.4, 392], [2, 12, 420], 'looking up past the windmill at a sky with nothing in it'),
    ],
    walks: [],
    vehicles: [
      car('squall-box-buggy', 'parked', 'barrow-buggy', [10, 394], -Math.PI / 2, undefined, "Rooster's barrow buggy, loaded at the windmill foot for the barometer run"),
    ],
    paths: [],
    set: [],
  },
  {
    id: 'squall-box-field',
    name: 'The Squall-Box windmill, the home field',
    region: 'cloverfield-farms',
    center: [-22, 408],
    radius: 20,
    facing: Math.PI,
    time: 'dusk',
    built: 'existing',
    usedBy: ['m19-squall-box-forecast'],
    look: 'The stubble field west of the windmill at dusk: the last barometer on its stand, the windmill black against a low red sky, the highway a pale line far to the east.',
    sounds: 'Wind dropping, the windmill creaking slower, a single far engine on the highway, and Rooster very pleased with himself.',
    marks: [
      mark('player', [-19.8, 411.6], [-22, 408], 'stand', 'stands over the last barometer, reading the needle'),
      mark('bramble', [-24.4, 411.4], [-22, 408], 'stand', 'bends to read the dial, a hand on his hat'),
      mark('rooster', [4, 398.5], [-22, 408], 'stand', 'shouts across the field from the foot of the windmill, arms wide, delighted'),
    ],
    cameras: [
      cam('wide', [-40, 1.3, 416], [0, 6, 404], 'low wide from the west: the field, the windmill and the red sky'),
      cam('dial', [-21.2, 0.9, 410], [-22, 0.55, 408], 'insert on the barometer dial from the north side, the red needle settling'),
      cam('highway', [-30, 1.4, 404], [26, 1.2, 418], 'looking east over the field and the windmill to the highway, dusk haze'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'rooster-windmill': ['m19-squall-box-forecast'],
};
