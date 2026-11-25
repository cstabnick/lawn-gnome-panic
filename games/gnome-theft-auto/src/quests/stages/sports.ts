// Founders' Green sports (E19): where Swish Trowelly and Fennel Gripwax give their side quests (sportsQuests.ts).
// The places are built by court/ and skate/. Conventions and types: ../stages.ts and ./kit.ts.
import { COURT_QUEST } from '../../court/types';
import { SKATE_QUEST } from '../../skate/types';
import { cam, mark, type Stage } from './kit';

export const SPORTS_STAGES: readonly Stage[] = [
  {
    id: 'cardoon',
    name: 'Drainpipe Court, by the east hoop',
    region: 'turfton',
    center: [-84.5, 31.5],
    radius: 10,
    facing: Math.PI / 2,
    time: 'day',
    built: 'existing',
    givers: ['cardoon'],
    usedBy: [COURT_QUEST],
    look: 'A chalked court with a drainpipe for a hoop post, a ball cage by the east end, a chalk scoreboard on an easel, and Swish in a net for a scarf.',
    sounds: 'A ball bouncing off a wall, a clang off the rim, Lintel talking, Old Burdock keeping score out loud.',
    marks: [
      mark('cardoon', [-84.5, 31.5], [-86.5, 31.5], 'stand', 'spinning a ball on one finger, slightly out of practice'),
      mark('player', [-82.5, 31.5], [-84.5, 31.5], 'stand', 'steps onto the court from the park side'),
    ],
    cameras: [
      cam('court', [-80, 1.6, 35], [-84.5, 1.2, 31.5], 'from the park edge onto Swish with the court behind him'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'fennel',
    name: "The Gutter Bowls, Fennel's deck",
    region: 'turfton',
    center: [-47, 93.5],
    radius: 10,
    facing: Math.PI / 2,
    time: 'day',
    built: 'existing',
    givers: ['fennel'],
    usedBy: [SKATE_QUEST],
    look: 'A railing round a concrete bowl, a rack of spare boards, chalk marks across the ground and a battered deck propped against a bin.',
    sounds: 'Urethane wheels on concrete, the clack of a pop, Moss squeegeeing, a Gnomlet being held up to film.',
    marks: [
      mark('fennel', [-47, 93.5], [-45, 93.5], 'stand', 'leaning on his deck, cap tipped back'),
      mark('player', [-45, 93.5], [-47, 93.5], 'stand', 'rolls up from the bowls'),
    ],
    cameras: [
      cam('deck', [-42, 1.6, 97], [-47, 1.2, 93.5], 'from inside the park onto Fennel with the railing behind him'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];
