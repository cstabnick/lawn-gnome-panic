// Gnome Theft Auto wildlife and region props (Epic 6): polar bear, deck chair, bee, bee hive, giant grass blade,
// icicle scarf (sgnowme gear). Built by issue 6B.
import type { PrefabDef } from '../types';

export const GTA_WILD_LIFE: readonly PrefabDef[] = [
  {
    id: 'polar-bear', name: 'Fells Polar Bear', category: 'prop', uses: ['place'],
    tags: ['bear', 'polar', 'animal', 'critter', 'tundra', 'chill', 'gta'], emoji: [],
    tint: 0xf7f7f2,
    about: 'Fells polar bear: a big white bear sitting back, legs stretched forward, black sunglasses on its head. Arms (arm-0, arm-1) and head pivot for shrugs and nods.',
    examine: [
      'A large white bear sprawled upright, belly out and legs stretched long, with a pair of black sunglasses across its eyes.',
      'Fells saying: the bear that lounges is the bear that is not hungry, and the bear in sunglasses is not looking at you.',
      'Tip: approach a resting bear from the front, where it can see you coming and decide you are not worth the effort.',
      'Joke: three Fells hunters have taken aim at one, and it shrugged each time, so the hunters now sell it ice lollies.',
      'Someone has tied a striped cloth round its neck, and the bear has not objected, which the Fells take as a yes.',
    ],
    pivots: {
      body: [0, 0.6, 0],
      head: [0, 1.35, 0.1],
      'arm-0': [-0.45, 1.05, 0.05],
      'arm-1': [0.45, 1.05, 0.05],
    },
    parts: [
      { s: 'ball', d: [0.42], scale: [1, 1.2, 0.95], at: [0, 0.567, -0.05], rot: [-12, 0, 0], c: 'tint', group: 'body' }, // reclined torso (min.y ~ 0)
      { s: 'ball', d: [0.3], scale: [1, 0.8, 0.9], at: [0, 0.42, 0.22], c: 'tint', group: 'body' },                    // round belly
      { s: 'pill', d: [0.14, 0.44], rot: [90, 0, 0], at: [-0.22, 0.14, 0.5], c: 'tint', group: 'body' },              // left hind leg (min.y = 0)
      { s: 'pill', d: [0.14, 0.44], rot: [90, 0, 0], at: [0.22, 0.14, 0.5], c: 'tint', group: 'body' },               // right hind leg (min.y = 0)
      { s: 'pill', d: [0.1, 0.45], rot: [-20, 0, 0], at: [-0.46, 0.9, 0.12], c: 'tint', group: 'arm-0' },           // left arm, resting on the belly
      { s: 'pill', d: [0.1, 0.45], rot: [-20, 0, 0], at: [0.46, 0.9, 0.12], c: 'tint', group: 'arm-1' },            // right arm
      { s: 'ball', d: [0.26], at: [0, 1.42, 0.12], c: 'tint', group: 'head' },                                       // head
      { s: 'ball', d: [0.11], scale: [1, 0.75, 0.8], at: [0, 1.36, 0.36], c: 'tint', group: 'head' },                // muzzle
      { s: 'ball', d: [0.04], at: [0, 1.4, 0.46], c: 'black', group: 'head' },                                       // black nose
      { s: 'ball', d: [0.09], at: [0.18, 1.6, 0.06], c: 'tint', mirror: true, group: 'head' },                       // small round ears
      { s: 'box', d: [0.06, 0.02, 0.02], at: [0, 1.44, 0.36], c: 'black', name: 'shades', group: 'head' },           // sunglasses bridge
      { s: 'cyl', d: [0.05, 0.05, 0.02], rot: [90, 0, 0], at: [0.12, 1.42, 0.36], c: 'black', name: 'shades', mirror: true, group: 'head' }, // sunglasses lenses
    ],
  },
  {
    id: 'deck-chair', name: 'Deck Chair', category: 'furniture', uses: ['place', 'sit'],
    tags: ['deck', 'chair', 'lounger', 'canvas', 'stripes', 'gta'], emoji: [],
    tint: 0x2f64c9, trim: 0xf4f4f0,
    seat: [0, 0.34, 0.42],
    about: 'Deck chair: a wooden folding lounger with a striped canvas sling (tint and trim stripes), reclined about 35 degrees. Front end low at +z, back high at -z.',
    examine: [
      'A wooden folding lounger with a canvas sling, blue and white stripes, reclined as far back as the frame allows.',
      'Saying of the Commons: a chair that tilts back is a chair that is thinking about the sky, and a gnome should join it.',
      'Tip: sit with your back to the high end and your feet to the low end, or the sling will try to fold you in half.',
      'Joke: the frame has been opened and shut so often that its hinge has learned the Planting by heart.',
      'Someone has scratched a tally of naps into the left arm, and the count goes well past what any one gnome could manage.',
    ],
    parts: [
      { s: 'box', d: [0.7, 0.03, 1.17], at: [0, 0.6, 0], rot: [31, 0, 0], c: 'cloth' },                       // canvas sling (sags front-low, back-high)
      { s: 'box', d: [0.7, 0.02, 0.1], at: [0, 0.8107, -0.2931], rot: [31, 0, 0], c: 'tint' },              // stripe 1 (back), lying on the sling
      { s: 'box', d: [0.7, 0.02, 0.1], at: [0, 0.6875, -0.0874], rot: [31, 0, 0], c: 'trim' },              // stripe 2
      { s: 'box', d: [0.7, 0.02, 0.1], at: [0, 0.5639, 0.1182], rot: [31, 0, 0], c: 'tint' },              // stripe 3
      { s: 'box', d: [0.7, 0.02, 0.1], at: [0, 0.4407, 0.3239], rot: [31, 0, 0], c: 'trim' },              // stripe 4 (front)
      { s: 'box', d: [0.04, 0.04, 1.25], at: [-0.37, 0.57, -0.018], rot: [31, 0, 0], c: 'wood' },           // left side rail
      { s: 'box', d: [0.04, 0.04, 1.25], at: [0.37, 0.57, -0.018], rot: [31, 0, 0], c: 'wood' },            // right side rail
      { s: 'box', d: [0.04, 0.29, 0.04], at: [-0.37, 0.145, 0.45], c: 'wood-dark' },                        // front left leg (min.y = 0)
      { s: 'box', d: [0.04, 0.29, 0.04], at: [0.37, 0.145, 0.45], c: 'wood-dark' },                         // front right leg
      { s: 'box', d: [0.04, 0.88, 0.04], at: [-0.37, 0.44, -0.5], c: 'wood-dark' },                         // back left leg (min.y = 0)
      { s: 'box', d: [0.04, 0.88, 0.04], at: [0.37, 0.44, -0.5], c: 'wood-dark' },                          // back right leg
    ],
  },
  {
    id: 'bee', name: 'Commons Bee', category: 'prop', uses: ['place'],
    tags: ['bee', 'insect', 'buzz', 'animal', 'critter', 'parkland', 'gta'], emoji: [],
    about: 'Commons bee: a striped yellow-and-black body, dark head at +z, pale wings. Pivots body, wing-0 and wing-1: the game bobs the body and flaps the wings on z.',
    examine: [
      'A fat striped bee with two pale wings, a dark head and a tiny stinger at the back, buzzing at about the height of your ear.',
      'Saying: a bee in the hand is worth two in the bush, and a bee in the hair is worth a long walk to the Spigot.',
      'Tip: do not swat. Walk away slowly and the bee will fly back to its hive, where its complaints are kept.',
      'Joke: the bee has been told it is a very good dancer, and it has taken this as an instruction to dance at your face.',
      'Commons bees are said to remember a gnome face for a whole summer, which is longer than most gnomes remember their own.',
    ],
    pivots: {
      body: [0, 0.1, 0],
      'wing-0': [-0.03, 0.17, 0],
      'wing-1': [0.03, 0.17, 0],
    },
    parts: [
      { s: 'ball', d: [0.09], scale: [1, 0.85, 1.1], at: [0, 0.13, 0], c: 'honey', seg: 8, group: 'body' },    // fuzzy yellow body
      { s: 'ring', d: [0.091, 0.012], scale: [1, 0.85, 1], at: [0, 0.13, -0.035], c: 'black', seg: 8, group: 'body' }, // stripe band
      { s: 'ring', d: [0.091, 0.012], scale: [1, 0.85, 1], at: [0, 0.13, 0.03], c: 'black', seg: 8, group: 'body' },   // stripe band
      { s: 'ball', d: [0.045], at: [0, 0.13, 0.135], c: 'black', seg: 6, group: 'body' },                       // dark head at +z
      { s: 'cone', d: [0.02, 0.05], rot: [-90, 0, 0], at: [0, 0.13, -0.125], c: 'black', seg: 5, group: 'body' }, // stinger at -z
      { s: 'cyl', d: [0.006, 0.006, 0.07], at: [0.03, 0.035, 0], c: 'black', seg: 5, mirror: true, group: 'body' }, // tiny legs (min.y = 0)
      { s: 'ball', d: [0.035], scale: [1.2, 0.2, 1.6], at: [-0.065, 0.19, 0], c: 'white', seg: 6, name: 'wing-0', group: 'wing-0' }, // left wing
      { s: 'ball', d: [0.035], scale: [1.2, 0.2, 1.6], at: [0.065, 0.19, 0], c: 'white', seg: 6, name: 'wing-1', group: 'wing-1' },   // right wing
    ],
  },
  {
    id: 'bee-hive', name: 'Straw Hive', category: 'prop', uses: ['place'],
    tags: ['hive', 'skep', 'bee', 'straw', 'parkland', 'gta'], emoji: [],
    about: 'Straw skep: a dome-shaped woven straw hive on a small wooden stump, with a dark entrance hole at the front. Static, no pivots.',
    examine: [
      'A dome of woven straw on a wooden stump, with a dark round door near the bottom where the bees come and go.',
      'Gnome saying: keep the hive on a stump and the honey on a shelf, and nobody will argue over which is the sweeter.',
      'Tip: stand well to the side of the door. The bees defend their hive in swarms, and a swarm does not check your coat first.',
      'Joke: the straw is rebuilt every spring, and every spring the bees make sure the new dome is slightly too big for its stump.',
      'Ten rings of straw have been counted from the bottom to the top, and the topmost one is the one nobody will talk about.',
    ],
    parts: [
      { s: 'cyl', d: [0.3, 0.32, 0.12], at: [0, 0.06, 0], c: 'wood-dark', seg: 8 },                  // wooden stump (min.y = 0)
      { s: 'ball', d: [0.4], scale: [1, 0.4, 1], at: [0, 0.28, 0], c: 'straw', seg: 8 },              // dome ring 1
      { s: 'ball', d: [0.33], scale: [1, 0.4, 1], at: [0, 0.552, 0], c: 'straw', seg: 8 },           // dome ring 2
      { s: 'ball', d: [0.26], scale: [1, 0.4, 1], at: [0, 0.784, 0], c: 'straw', seg: 8 },           // dome ring 3
      { s: 'ball', d: [0.19], scale: [1, 0.4, 1], at: [0, 0.956, 0], c: 'straw', seg: 8 },           // dome ring 4
      { s: 'ball', d: [0.12], scale: [1, 0.4, 1], at: [0, 1.068, 0], c: 'straw', seg: 8 },           // dome ring 5
      { s: 'ball', d: [0.05], at: [0, 1.15, 0], c: 'straw', seg: 6 },                                // top knot
      { s: 'box', d: [0.1, 0.08, 0.04], at: [0, 0.22, 0.38], c: 'ink' },                             // dark entrance hole at +z
    ],
  },
  {
    id: 'giant-grass-blade', name: 'Giant Grass Tuft', category: 'prop', uses: ['place'],
    tags: ['grass', 'blade', 'tuft', 'tall', 'parkland', 'gta'], emoji: [],
    tint: 0x5fa83a, trim: 0x3f7a2a,
    about: 'Giant grass tuft: three tall blades from one root, each three flat segments curling outward. No pivots or named parts, so buildPrefabInstances can bake it.',
    examine: [
      'Three grass blades taller than a gnome, rooted together and curling outward at the tips, with a darker shade at the root.',
      'Commons saying: the grass here grows taller than the old Fence ever did, and nobody has yet asked it to stop.',
      'Tip: a gnome lost in the tall grass should look for the tallest tuft and walk away from its shadow.',
      'Joke: a blade this size makes an excellent hiding place, which is exactly why every gnome in the Commons has been found in one.',
      'The tufts are very hard to count, and the Commons gnomes have given up trying, preferring to be lost in them instead.',
    ],
    parts: [
      { s: 'box', d: [0.22, 1.0, 0.03], at: [0.0349, 0.5088, 0], rot: [0, 0, -4], c: 'trim' },
      { s: 'box', d: [0.14, 1.0, 0.03], at: [0.1738, 1.4966, 0], rot: [0, 0, -12], c: 'tint' },
      { s: 'box', d: [0.06, 1.0, 0.03], at: [0.465, 2.4493, 0], rot: [0, 0, -22], c: 'tint' },
      { s: 'box', d: [0.22, 1.0, 0.03], at: [-0.01745, 0.5088, -0.03023], rot: [0, 120, -4], c: 'trim' },
      { s: 'box', d: [0.14, 1.0, 0.03], at: [-0.0869, 1.4966, -0.15052], rot: [0, 120, -12], c: 'tint' },
      { s: 'box', d: [0.06, 1.0, 0.03], at: [-0.2325, 2.4493, -0.40269], rot: [0, 120, -22], c: 'tint' },
      { s: 'box', d: [0.22, 1.0, 0.03], at: [-0.01745, 0.5088, 0.03023], rot: [0, 240, -4], c: 'trim' },
      { s: 'box', d: [0.14, 1.0, 0.03], at: [-0.0869, 1.4966, 0.15052], rot: [0, 240, -12], c: 'tint' },
      { s: 'box', d: [0.06, 1.0, 0.03], at: [-0.2325, 2.4493, 0.40269], rot: [0, 240, -22], c: 'tint' },
    ],
  },
  {
    id: 'icicle-scarf', name: 'Icicle Scarf', category: 'armor', uses: ['wear-neck'],
    tags: ['scarf', 'icicle', 'frost', 'knit', 'sgnowme', 'neck', 'gta'], emoji: [],
    tint: 0xf4f8ff,
    about: 'Sgnowme scarf: a frost-white knitted scarf ring with one end hanging down the chest and four icicles along its front. Neck slot.',
    examine: [
      'A frost-white knitted scarf with one end hanging down the chest and four small icicles frozen along its front edge.',
      'Fells saying: a sgnowme that wears its scarf in summer is either brave, or it has forgotten where it was glazed.',
      'Tip: the icicles do not melt, so this is safe to wear in a heatwave. Do not, however, hug anyone who is wearing it.',
      'Joke: it was knitted to a sgnowme neck, which is why no ordinary gnome has ever managed to close the top button.',
      'Sgnowmes are fired-clay gnomes glazed frost-white, and this scarf is the only thing they will admit to feeling.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.035], at: [0, 0.035, -0.03], rot: [90, 0, 0], c: 'tint', seg: 12 },   // knitted ring (min.y = 0)
      { s: 'box', d: [0.08, 0.14, 0.02], at: [0, 0.09, 0.21], rot: [-10, 0, 0], c: 'tint' },          // hanging end down the chest (min.y ~ 0.02)
      { s: 'cone', d: [0.01, 0.05], at: [-0.14, 0.04, 0.1265], rot: [180, 0, 0], c: 0xcfeefc, seg: 5 }, // icicle
      { s: 'cone', d: [0.01, 0.05], at: [-0.07, 0.04, 0.168], rot: [180, 0, 0], c: 0xcfeefc, seg: 5 },  // icicle
      { s: 'cone', d: [0.01, 0.05], at: [0.07, 0.04, 0.168], rot: [180, 0, 0], c: 0xcfeefc, seg: 5 },   // icicle
      { s: 'cone', d: [0.01, 0.05], at: [0.14, 0.04, 0.1265], rot: [180, 0, 0], c: 0xcfeefc, seg: 5 },  // icicle
    ],
  },
];
