// Gnome Theft Auto: the waterwheel sawmill and the quiet Tall-One hints along the water (Wild World Epic 4, issue 4J).
import type { PrefabDef } from '../types';

export const GTA_WATER_HINTS: readonly PrefabDef[] = [
  {
    id: 'waterwheel-mill', name: 'Waterwheel Sawmill', category: 'prop', uses: ['place'],
    tags: ['mill', 'sawmill', 'waterwheel', 'wheel', 'river', 'wood', 'paddle', 'saw', 'shed', 'water'], emoji: [],
    footprint: { r: 2.4, h: 5 },
    pivots: { wheel: [3.6, 2.6, 0] },
    about: 'Gnome Theft Auto: the Waterwheel Sawmill. A timber sawmill shed 4.5 wide on stilt posts, floor at 1.2, with a pitched roof, a saw blade on its -x wall and a 2.6-radius waterwheel on its +x side (group wheel, axle along x, spins about its pivot "wheel"). Front toward +z.',
    examine: [
      'A timber shed on stilts with a great wooden wheel on one side, turning slowly, paddle after paddle, as if it has somewhere to be.',
      'Gnome saying: the river that turns the wheel is the same river that the wheel never once thanks.',
      'Tip: a paddle that catches you lifts you clean off the bank, and the shed will not stop to apologise.',
      'Joke: the saw inside has cut three logs, two stools and a very surprised bridge-keeper, but never once a plank of its own.',
      'A row of notches is cut into the shed post, each one a little deeper than the last, and none of them quite the same length.',
    ],
    parts: [
      { s: 'box', d: [4.5, 0.15, 4], at: [0, 1.125, 0], c: 'wood' },                                        // floor
      { s: 'cyl', d: [0.1, 0.1, 1.2], at: [-2, 0.6, -1.7], c: 'wood-dark', seg: 6 },                       // stilt post
      { s: 'cyl', d: [0.1, 0.1, 1.2], at: [-2, 0.6, 1.7], c: 'wood-dark', seg: 6 },                        // stilt post
      { s: 'cyl', d: [0.1, 0.1, 1.2], at: [2, 0.6, -1.7], c: 'wood-dark', seg: 6 },                        // stilt post
      { s: 'cyl', d: [0.1, 0.1, 1.2], at: [2, 0.6, 1.7], c: 'wood-dark', seg: 6 },                         // stilt post
      { s: 'box', d: [4.4, 2.46, 3.9], at: [0, 2.37, 0], c: 'wood' },                                     // walls
      { s: 'box', d: [2.5, 0.12, 4.3], at: [-1.1, 4.12, 0], rot: [0, 0, 25], c: 'slate' },                 // roof, left slope
      { s: 'box', d: [2.5, 0.12, 4.3], at: [1.1, 4.12, 0], rot: [0, 0, -25], c: 'slate' },                 // roof, right slope
      { s: 'box', d: [1.0, 1.7, 0.06], at: [0, 2.05, 1.99], c: 'black' },                                  // doorway
      { s: 'cyl', d: [0.45, 0.45, 0.04], rot: [0, 0, 90], at: [-2.27, 2.5, 0], c: 'steel', seg: 12 },      // saw blade
      { s: 'ring', d: [2.52, 0.08], rot: [0, 90, 0], at: [3.6, 2.6, 0], c: 'wood', group: 'wheel', seg: 12 }, // wheel rim
      { s: 'cyl', d: [0.12, 0.12, 1.4], rot: [0, 0, 90], at: [3.6, 2.6, 0], c: 'iron-dark', group: 'wheel', seg: 8 }, // axle
      { s: 'box', d: [0.9, 0.5, 0.4], rot: [0, 0, 0], at: [3.6, 4.95, 0], c: 'wood', group: 'wheel' },       // paddle, 0 degrees
      { s: 'box', d: [0.9, 0.5, 0.4], rot: [45, 0, 0], at: [3.6, 4.2617, 1.6617], c: 'wood', group: 'wheel' }, // paddle, 45
      { s: 'box', d: [0.9, 0.5, 0.4], rot: [90, 0, 0], at: [3.6, 2.6, 2.35], c: 'wood', group: 'wheel' },   // paddle, 90
      { s: 'box', d: [0.9, 0.5, 0.4], rot: [135, 0, 0], at: [3.6, 0.9383, 1.6617], c: 'wood', group: 'wheel' }, // paddle, 135
      { s: 'box', d: [0.9, 0.5, 0.4], rot: [180, 0, 0], at: [3.6, 0.25, 0], c: 'wood', group: 'wheel' },    // paddle, 180 (lowest, touches y 0)
      { s: 'box', d: [0.9, 0.5, 0.4], rot: [225, 0, 0], at: [3.6, 0.9383, -1.6617], c: 'wood', group: 'wheel' }, // paddle, 225
      { s: 'box', d: [0.9, 0.5, 0.4], rot: [270, 0, 0], at: [3.6, 2.6, -2.35], c: 'wood', group: 'wheel' },  // paddle, 270
      { s: 'box', d: [0.9, 0.5, 0.4], rot: [315, 0, 0], at: [3.6, 4.2617, -1.6617], c: 'wood', group: 'wheel' }, // paddle, 315
    ],
  },
  {
    id: 'hose-nozzle', name: 'Brass Horn', category: 'prop', uses: ['place'],
    tags: ['horn', 'brass', 'river', 'pipe', 'water', 'nozzle', 'sleeve', 'green', 'trigger'], emoji: [],
    footprint: { r: 1.5, h: 2 },
    about: 'Gnome Theft Auto: the Brass Horn. A giant brass garden-hose nozzle half buried in a hillside: a tapering brass barrel about 4 long tilted 25 degrees up toward +z, a copper collar, a trigger lever, a green rubber sleeve running back into the mound, and a dark mouth at the front. Front toward +z.',
    examine: [
      'A long brass horn sticks out of the hillside, wider at the back where it sinks into the earth and narrowing to a small dark mouth.',
      'Old saying: a horn that points at the sky is calling for rain, and the Rain-school has never managed to tell the horn it is wrong.',
      'Tip: do not put your ear to the mouth. It breathes out a cold wind that smells of puddles and old polish.',
      'Joke: the gnome who blew it first got a faceful of Rain and a very wet beard, and has still not been allowed to finish his sentence.',
      'Someone has wound a green sleeve round the back of the horn in neat loops. Nobody remembers doing it, and nobody will untie it.',
    ],
    parts: [
      { s: 'ball', d: [1], at: [0, 1.0, -0.8], scale: [1.5, 1.0, 1.4], c: 'dirt', seg: 8 },                // mound
      { s: 'cyl', d: [0.5, 0.9, 4], rot: [65, 0, 0], at: [0, 1.7, 0.8], c: 'brass', seg: 10 },           // barrel, tapering
      { s: 'cyl', d: [0.62, 0.62, 0.22], rot: [65, 0, 0], at: [0, 2.08, 1.616], c: 'copper', seg: 10 }, // ridged collar
      { s: 'cyl', d: [0.45, 0.45, 1.0], rot: [65, 0, 0], at: [0, 0.728, -1.285], c: 'green', seg: 8 },  // rubber sleeve
      { s: 'box', d: [0.12, 0.5, 0.14], rot: [155, 0, 0], at: [0, 1.04, 1.44], c: 'copper' },           // trigger lever
      { s: 'cyl', d: [0.2, 0.2, 0.04], rot: [65, 0, 0], at: [0, 2.5535, 2.631], c: 'black', seg: 8 },   // mouth
    ],
  },
  {
    id: 'pond-liner-rim', name: 'Black Rubber Rim', category: 'prop', uses: ['place'],
    tags: ['rubber', 'liner', 'rim', 'black', 'lip', 'river', 'moss', 'wavy', 'fold'], emoji: [],
    footprint: { r: 0.6, h: 0.35 },
    about: 'Gnome Theft Auto: the Black Rubber Rim. A length of black pond-liner lip 8 long (x), 0.35 tall and 0.6 deep: seven wavy segments, a crease along the front, a ramped torn end and three moss tufts. Front toward +z.',
    examine: [
      'A long black rubbery lip folded along the edge of the river, wavy as a sleeping sea and cool to the touch.',
      'Old saying: black rock that bends is not rock, and the gnome who says so has not yet been asked to prove it.',
      'Tip: walk on the crease, never the fold. The fold gives way without warning, like a bad bridge.',
      'Joke: moss grows on it in neat green stripes, which the Mossbottom folk insist is decoration and not an accident.',
      'One end is torn open, and something pale is folded inside it. The gnomes have agreed not to look any closer.',
    ],
    parts: [
      { s: 'box', d: [0.98, 0.35, 0.6], at: [-3.5, 0.175, 0.1], rot: [0, -4, 0], c: 'black' },    // segment
      { s: 'box', d: [0.98, 0.35, 0.6], at: [-2.5, 0.175, -0.05], rot: [0, 3, 0], c: 'black' },   // segment
      { s: 'box', d: [0.98, 0.35, 0.6], at: [-1.5, 0.175, 0.12], rot: [0, -2, 0], c: 'black' },   // segment
      { s: 'box', d: [0.98, 0.35, 0.6], at: [-0.5, 0.175, -0.1], rot: [0, 5, 0], c: 'black' },    // segment
      { s: 'box', d: [0.98, 0.35, 0.6], at: [0.5, 0.175, 0.05], rot: [0, -3, 0], c: 'black' },    // segment
      { s: 'box', d: [0.98, 0.35, 0.6], at: [1.5, 0.175, -0.12], rot: [0, 2, 0], c: 'black' },    // segment
      { s: 'box', d: [0.98, 0.35, 0.6], at: [2.5, 0.175, 0.08], rot: [0, -4, 0], c: 'black' },    // segment
      { s: 'wedge', d: [0.98, 0.35, 0.6], at: [3.5, 0.175, -0.04], rot: [0, 3, 0], c: 'black' },  // torn, ramped end
      { s: 'box', d: [7.6, 0.08, 0.03], at: [0, 0.2, 0.47], c: 'ink' },                           // crease
      { s: 'ball', d: [0.2], at: [-2.5, 0.36, -0.05], scale: [1.2, 0.4, 0.8], c: 'moss', seg: 6 }, // moss tuft
      { s: 'ball', d: [0.2], at: [0.5, 0.36, 0.05], scale: [1.2, 0.4, 0.8], c: 'moss', seg: 6 },   // moss tuft
      { s: 'ball', d: [0.2], at: [2.5, 0.36, 0.08], scale: [1.2, 0.4, 0.8], c: 'moss', seg: 6 },   // moss tuft
    ],
  },
  {
    id: 'gutter-lip', name: 'Concrete Lip', category: 'prop', uses: ['place'],
    tags: ['concrete', 'kerb', 'lip', 'gutter', 'stone', 'crack', 'weeds', 'grey', 'channel'], emoji: [],
    footprint: { r: 0.6, h: 0.4 },
    about: 'Gnome Theft Auto: the Concrete Lip. A straight grey kerb of a giant storm gutter, 10 long (x), 0.4 tall and 0.8 deep, with an aggregate stripe down its front, a crack across the top and three clumps of weeds. Front toward +z.',
    examine: [
      'A long grey kerb with a speckled stripe along its face, dusty on top and cracked across the middle like old porridge.',
      'Saying: a stone lip that runs straight for ten strides was laid by someone who never once had to turn a corner.',
      'Tip: the weeds grow out of the cracks, and the cracks are older than the weeds. Pull the weeds and the cracks stay.',
      'Joke: it is the only stone in Mossbottom that has never been sat on, mostly because it is too wide to get round.',
      'A small rusted ring is set into one end of the kerb, polished smooth by generations of hands that were not gnome-sized.',
    ],
    parts: [
      { s: 'box', d: [10, 0.4, 0.8], at: [0, 0.2, 0], c: 'stone' },                             // kerb
      { s: 'box', d: [10, 0.1, 0.02], at: [0, 0.2, 0.42], c: 'stone-dark' },                     // aggregate stripe
      { s: 'box', d: [0.04, 0.07, 0.5], at: [1.6, 0.4, 0], rot: [0, 12, 0], c: 'stone-dark' },   // crack
      { s: 'cone', d: [0.05, 0.3], at: [-3, 0.52, 0.15], c: 'leaf' },                             // weed clump
      { s: 'cone', d: [0.05, 0.3], at: [2.4, 0.52, -0.1], c: 'leaf' },                            // weed clump
      { s: 'cone', d: [0.05, 0.3], at: [4.1, 0.5, 0.2], c: 'leaf-dark' },                         // weed clump
    ],
  },
  {
    id: 'stone-heron', name: 'Toppled Stone Heron', category: 'prop', uses: ['place'],
    tags: ['heron', 'bird', 'stone', 'statue', 'plinth', 'fallen', 'moss', 'river', 'legs'], emoji: [],
    about: 'Gnome Theft Auto: the Toppled Stone Heron. A stone heron statue lying on its side, long legs out sideways, neck and beak pointing +z, chipped and mossy, with its square plinth tipped over beside it. About 2.6 long. Nothing above 1.2.',
    examine: [
      'A long stone bird lies on its side, legs stretched out flat, neck laid along the ground and a beak pointing at nothing.',
      'Old rhyme: the heron stands on one leg and waits. This one has finally lain down, which is more than the rest of us manage.',
      'Tip: the beak is sharp enough to open a sack. Carry your lunch on the far side of it.',
      'Joke: the square block beside it was its plinth, and the heron has never forgiven the block for being the one that stayed upright.',
      'Moss grows in the chipped hollows of its back, and someone has scratched a small arrow into its neck, pointing at the water.',
    ],
    parts: [
      { s: 'ball', d: [0.45], at: [0, 0.315, -0.5], scale: [0.8, 0.7, 1.2], c: 'stone', seg: 8 },    // body, on its side
      { s: 'cyl', d: [0.1, 0.16, 1.1], rot: [90, 0, 0], at: [0, 0.3, 0.55], c: 'stone', seg: 8 },    // neck
      { s: 'ball', d: [0.14], at: [0, 0.3, 1.2], c: 'stone', seg: 8 },                              // head
      { s: 'cone', d: [0.07, 0.4], rot: [90, 0, 0], at: [0, 0.3, 1.4], c: 'stone-dark', seg: 6 },   // beak
      { s: 'cyl', d: [0.035, 0.035, 1.1], rot: [0, 0, 90], at: [0.55, 0.1, -0.9], c: 'stone', seg: 6, mirror: true }, // long leg
      { s: 'box', d: [0.9, 0.8, 0.9], rot: [0, 0, 80], at: [-0.9, 0.512, 0.4], c: 'stone-dark' },  // tipped plinth
      { s: 'ball', d: [0.12], at: [0, 0.6, -0.6], scale: [1.4, 0.4, 1.0], c: 'moss', seg: 6 },     // moss on the back
      { s: 'ball', d: [0.03], at: [0.14, 0.3, 0.6], c: 'stone-dark', seg: 6 },                      // chip in the neck
    ],
  },
];
