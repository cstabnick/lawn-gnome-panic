// Gnome Theft Auto: European kit (E29, docs/roadmaps/gta-batch-3/E29/). Filled by its issue.
// European garden plants: clipped topiary, box hedges, geraniums, an espaliered pear and a plane tree.
// Life-size metres, standing on y = 0, centred on x and z. Front faces +z.
import type { PrefabDef } from '../types';

const BOX_GREEN = 0x2f5a2a;

// Five-line examine text per prefab, written to the European yard voice.

export const GTA_EURO_GARDEN: readonly PrefabDef[] = [
  {
    id: 'euro-topiary-spiral', name: 'Spiral Topiary', category: 'prop', uses: ['place'],
    tags: ['topiary', 'spiral', 'clipped', 'tree', 'pot', 'terracotta', 'garden', 'euro', 'gta'], emoji: [],
    footprint: { r: 0.4, h: 2.2 },
    about: 'Gnome Theft Auto: the Spiral Topiary. A terracotta pot with a short trunk and a corkscrew of six shrinking box-green balls, squashed and turned round the trunk, ending in a small point. 2.2 m tall, life-size metres.',
    examine: [
      'A corkscrew of dark green balls, each a little smaller than the last, wound round a short trunk in a terracotta pot until it gives up at a point.',
      'Saying: a tree trained into a spiral will climb to heaven, or at least to the second floor, given enough patience and wire.',
      'Tip: walk round the spiral the way it turns. Going the other way makes the balls wobble, and the trunk looks a little embarrassed.',
      'Joke: the gardener once asked for a spiral staircase, and this is what came back, and it is not even a staircase.',
      'Someone has written a name on the pot in pencil, rubbed it out, and written it again in a different hand.',
    ],
    parts: [
      { s: 'cyl', d: [0.26, 0.2, 0.38], at: [0, 0.19, 0], c: 'terracotta', seg: 10 },           // pot
      { s: 'cyl', d: [0.28, 0.28, 0.05], at: [0, 0.385, 0], c: 'clay', seg: 10 },                // rim
      { s: 'cyl', d: [0.25, 0.25, 0.03], at: [0, 0.4, 0], c: 'dirt', seg: 10 },                  // soil
      { s: 'cyl', d: [0.04, 0.05, 0.5], at: [0, 0.66, 0], c: 'bark', seg: 6 },                   // trunk
      { s: 'ball', d: [0.36], at: [0.08, 0.95, 0], scale: [1, 0.7, 1], c: BOX_GREEN, seg: 8 },   // spiral, bottom to top
      { s: 'ball', d: [0.32], at: [0.04, 1.18, 0.07], scale: [1, 0.7, 1], c: BOX_GREEN, seg: 8 },
      { s: 'ball', d: [0.28], at: [-0.04, 1.4, 0.07], scale: [1, 0.7, 1], c: BOX_GREEN, seg: 8 },
      { s: 'ball', d: [0.24], at: [-0.08, 1.6, 0], scale: [1, 0.7, 1], c: BOX_GREEN, seg: 8 },
      { s: 'ball', d: [0.2], at: [-0.04, 1.78, -0.07], scale: [1, 0.7, 1], c: BOX_GREEN, seg: 8 },
      { s: 'ball', d: [0.16], at: [0.04, 1.92, -0.07], scale: [1, 0.7, 1], c: BOX_GREEN, seg: 8 },
      { s: 'cone', d: [0.1, 0.2], at: [0, 2.05, 0], c: BOX_GREEN, seg: 8 },                       // point
    ],
  },
  {
    id: 'euro-topiary-lollipop', name: 'Lollipop Bay Tree', category: 'prop', uses: ['place'],
    tags: ['topiary', 'bay', 'lollipop', 'ball', 'tree', 'planter', 'white', 'garden', 'euro', 'gta'], emoji: [],
    footprint: { r: 0.3, h: 1.6 },
    about: 'Gnome Theft Auto: the Lollipop Bay Tree. A square white wooden planter with soil, a straight thin trunk and one perfect clipped leaf ball on top. 1.6 m tall, life-size metres.',
    examine: [
      'A square white planter on a straight thin trunk, with one perfect clipped ball on top, like a lollipop someone has left out in the rain.',
      'Saying: a bay tree will stand still for a portrait, provided nobody asks it to smile.',
      'Tip: crush a leaf between your fingers before you make a stew. The smell is for the stew, and the leaf will not mind.',
      'Joke: the ball has been clipped so round that the gardener refuses to let it roll, because a bay tree must set a good example.',
      'A small brass plate is screwed to the planter, reading a name nobody in the street can pronounce, and nobody has tried to scrub it clean.',
    ],
    parts: [
      { s: 'box', d: [0.6, 0.3, 0.6], at: [0, 0.15, 0], c: 'white' },                           // planter
      { s: 'box', d: [0.5, 0.04, 0.5], at: [0, 0.31, 0], c: 'dirt' },                            // soil
      { s: 'cyl', d: [0.03, 0.035, 0.76], at: [0, 0.69, 0], c: 'bark', seg: 6 },                 // trunk
      { s: 'ball', d: [0.29], at: [0, 1.31, 0], c: 'leaf', seg: 10 },                            // clipped ball
    ],
  },
  {
    id: 'euro-box-hedge', name: 'Clipped Box Hedge', category: 'prop', uses: ['place'],
    tags: ['hedge', 'box', 'boxwood', 'clipped', 'low', 'straight', 'garden', 'euro', 'gta'], emoji: [],
    footprint: { r: 0.3, h: 0.8 },
    about: 'Gnome Theft Auto: the Clipped Box Hedge. A dead-straight flat-topped low hedge 1.96 m long, 0.6 deep and 0.8 tall, with four lighter green bumps standing 0.03 proud of the top. Life-size metres.',
    examine: [
      'A dead-straight low hedge of dark box, flat on top, with lighter green bumps standing proud along its crest like a row of cushions.',
      'Saying: a straight hedge is the sign of a straight gardener, and a crooked one is the sign that the gardener has been to the cafe.',
      'Tip: step over the low end rather than round it. The hedge is only knee high, and it is very touchy about being walked round.',
      'Joke: the hedge was clipped to a perfect line so often that it now refuses to grow anywhere else, out of pure principle.',
      'A narrow gap in the middle has been left on purpose, and a small painted door has been put on the back of it for no reason.',
    ],
    parts: [
      { s: 'box', d: [1.96, 0.8, 0.6], at: [0, 0.4, 0], c: BOX_GREEN },                          // flat-topped body
      { s: 'box', d: [0.36, 0.06, 0.4], at: [-0.7, 0.8, 0], c: 'leaf' },                          // lighter bumps, 0.03 proud
      { s: 'box', d: [0.36, 0.06, 0.4], at: [-0.25, 0.8, 0], c: 'leaf' },
      { s: 'box', d: [0.36, 0.06, 0.4], at: [0.2, 0.8, 0], c: 'leaf' },
      { s: 'box', d: [0.36, 0.06, 0.4], at: [0.65, 0.8, 0], c: 'leaf' },
    ],
  },
  {
    id: 'euro-geranium-pot', name: 'Potted Geraniums', category: 'prop', uses: ['place'],
    tags: ['geranium', 'flower', 'pot', 'terracotta', 'red', 'window', 'garden', 'euro', 'gta'], emoji: [],
    tint: 0xd8342c,
    about: 'Gnome Theft Auto: the Potted Geraniums. A terracotta pot with a lip ring, a mound of leaves and red flower heads in the tint colour. 0.6 m tall, life-size metres.',
    examine: [
      'A terracotta pot with a lip ring, a mound of leaves and a crowd of bright red flower heads, pushed up and out as if they have been asked to smile.',
      'Saying: a geranium in a pot is a sunny day that has been carried indoors, and it wants to be carried back out again.',
      'Tip: pinch off the dead heads each week. The plant will not thank you, but it will flower more, which is nearly the same thing.',
      'Joke: the pot has been on the same windowsill for thirty years, and the geranium has never once been allowed a holiday.',
      'A little tag is tied to one stalk, reading only Mildred, and nobody on the street will say who Mildred was.',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.15, 0.26], at: [0, 0.13, 0], c: 'terracotta', seg: 10 },           // pot
      { s: 'cyl', d: [0.22, 0.22, 0.06], at: [0, 0.27, 0], c: 'clay', seg: 10 },                  // lip ring
      { s: 'cyl', d: [0.19, 0.19, 0.03], at: [0, 0.29, 0], c: 'dirt', seg: 10 },                  // soil
      { s: 'ball', d: [0.18], at: [0, 0.38, 0], scale: [1, 0.7, 1], c: 'leaf-dark', seg: 8 },     // leaf mound
      { s: 'ball', d: [0.06], at: [0.12, 0.5, 0.07], c: 'tint', seg: 6 },                        // flower heads
      { s: 'ball', d: [0.06], at: [-0.13, 0.48, 0.03], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.06], at: [0.03, 0.53, -0.1], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.06], at: [-0.05, 0.5, 0.12], c: 'tint', seg: 6 },
    ],
  },
  {
    id: 'euro-geranium-bed', name: 'Geranium Bed', category: 'prop', uses: ['place'],
    tags: ['geranium', 'flower', 'bed', 'brick', 'edging', 'red', 'border', 'garden', 'euro', 'gta'], emoji: [],
    tint: 0xd8342c,
    about: 'Gnome Theft Auto: the Geranium Bed. A low brick-edged bed 1.6 by 0.8 with dirt soil and three rows of four geranium plants in the tint colour. Life-size metres.',
    examine: [
      'A low brick-edged bed of red geraniums in three neat rows, with a little soil showing between the plants where the rows have been argued over.',
      'Saying: the geranium will flower until the frost comes, and then it will complain about the frost until the spring.',
      'Tip: kneel on the edging, not the soil. The bricks are used to it, and the soil has been pressed flat enough already.',
      'Joke: the bed has so many rows that the gardener has lost count of them, and has decided that this counts as a success.',
      'One plant in the back row is white, and it has been there since the bed was laid, and nobody has been brave enough to pull it out.',
    ],
    parts: [
      { s: 'box', d: [1.6, 0.34, 0.06], at: [0, 0.17, 0.37], c: 'clay' },                         // brick edging, long sides
      { s: 'box', d: [1.6, 0.34, 0.06], at: [0, 0.17, -0.37], c: 'clay' },
      { s: 'box', d: [0.06, 0.34, 0.66], at: [0.77, 0.17, 0], c: 'clay' },                        // brick edging, short sides
      { s: 'box', d: [0.06, 0.34, 0.66], at: [-0.77, 0.17, 0], c: 'clay' },
      { s: 'box', d: [1.42, 0.3, 0.62], at: [0, 0.15, 0], c: 'dirt' },                           // soil
      { s: 'ball', d: [0.09], at: [-0.6, 0.31, -0.2], scale: [1, 0.6, 1], c: 'leaf', seg: 6 },   // leaves, row 1
      { s: 'ball', d: [0.09], at: [-0.2, 0.31, -0.2], scale: [1, 0.6, 1], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.09], at: [0.2, 0.31, -0.2], scale: [1, 0.6, 1], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.09], at: [0.6, 0.31, -0.2], scale: [1, 0.6, 1], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.09], at: [-0.6, 0.31, 0], scale: [1, 0.6, 1], c: 'leaf', seg: 6 },     // row 2
      { s: 'ball', d: [0.09], at: [-0.2, 0.31, 0], scale: [1, 0.6, 1], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.09], at: [0.2, 0.31, 0], scale: [1, 0.6, 1], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.09], at: [0.6, 0.31, 0], scale: [1, 0.6, 1], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.09], at: [-0.6, 0.31, 0.2], scale: [1, 0.6, 1], c: 'leaf', seg: 6 },    // row 3
      { s: 'ball', d: [0.09], at: [-0.2, 0.31, 0.2], scale: [1, 0.6, 1], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.09], at: [0.2, 0.31, 0.2], scale: [1, 0.6, 1], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.09], at: [0.6, 0.31, 0.2], scale: [1, 0.6, 1], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.6, 0.38, -0.2], c: 'tint', seg: 6 },                       // flowers
      { s: 'ball', d: [0.05], at: [-0.2, 0.38, -0.2], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.05], at: [0.2, 0.38, -0.2], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.05], at: [0.6, 0.38, -0.2], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.6, 0.38, 0], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.2, 0.38, 0], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.05], at: [0.2, 0.38, 0], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.05], at: [0.6, 0.38, 0], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.6, 0.38, 0.2], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.2, 0.38, 0.2], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.05], at: [0.2, 0.38, 0.2], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.05], at: [0.6, 0.38, 0.2], c: 'tint', seg: 6 },
    ],
  },
  {
    id: 'euro-espalier-pear', name: 'Espaliered Pear', category: 'prop', uses: ['place'],
    tags: ['pear', 'fruit', 'espalier', 'tree', 'flat', 'frame', 'wall', 'garden', 'euro', 'gta'], emoji: [],
    footprint: { r: 0.2, h: 2.2 },
    about: 'Gnome Theft Auto: the Espaliered Pear. A pear tree trained flat on a wooden frame 2.4 m wide and 2.2 m tall: a central trunk, three pairs of arms, leaves and a few pears. Frame posts sit behind it. Life-size metres.',
    examine: [
      'A pear tree trained flat against a wooden frame, with three pairs of horizontal arms, small leaves and a few yellow-green pears hanging off the ends.',
      'Saying: a pear grown flat has no need of a ladder, and a gnome with no ladder has no excuse to climb.',
      'Tip: pick the pears from the bottom arm. The top ones are for the birds, and the birds have been very clear about this.',
      'Joke: the tree has been trained so flat that it can now see itself in the window across the lane, and it does not like what it sees.',
      'A stripe of paint along one post marks the height of the last gardener, and the paint is renewed by someone who was never seen again.',
    ],
    parts: [
      { s: 'box', d: [0.1, 2.2, 0.1], at: [1.15, 1.1, -0.1], c: 'wood-dark', mirror: true },    // frame posts, behind the tree
      { s: 'box', d: [2.3, 0.05, 0.05], at: [0, 0.5, -0.1], c: 'wood' },                        // wires
      { s: 'box', d: [2.3, 0.05, 0.05], at: [0, 1.0, -0.1], c: 'wood' },
      { s: 'box', d: [2.3, 0.05, 0.05], at: [0, 1.5, -0.1], c: 'wood' },
      { s: 'box', d: [2.3, 0.05, 0.05], at: [0, 2.0, -0.1], c: 'wood' },
      { s: 'cyl', d: [0.06, 0.08, 1.8], at: [0, 0.9, 0], c: 'bark', seg: 6 },                   // central trunk
      { s: 'pill', d: [0.04, 1.0], at: [0.6, 0.7, 0], rot: [0, 0, 90], c: 'bark', seg: 6, mirror: true },  // arms
      { s: 'pill', d: [0.04, 1.0], at: [0.6, 1.2, 0], rot: [0, 0, 90], c: 'bark', seg: 6, mirror: true },
      { s: 'pill', d: [0.04, 1.0], at: [0.6, 1.7, 0], rot: [0, 0, 90], c: 'bark', seg: 6, mirror: true },
      { s: 'ball', d: [0.12], at: [0.45, 0.8, 0.06], scale: [1, 0.7, 1], c: 'leaf', seg: 6, mirror: true },   // leaf clusters
      { s: 'ball', d: [0.12], at: [0.9, 0.78, 0.06], scale: [1, 0.7, 1], c: 'leaf', seg: 6, mirror: true },
      { s: 'ball', d: [0.12], at: [0.45, 1.3, 0.06], scale: [1, 0.7, 1], c: 'leaf', seg: 6, mirror: true },
      { s: 'ball', d: [0.12], at: [0.9, 1.28, 0.06], scale: [1, 0.7, 1], c: 'leaf', seg: 6, mirror: true },
      { s: 'ball', d: [0.12], at: [0.45, 1.8, 0.06], scale: [1, 0.7, 1], c: 'leaf', seg: 6, mirror: true },
      { s: 'ball', d: [0.12], at: [0.9, 1.78, 0.06], scale: [1, 0.7, 1], c: 'leaf', seg: 6, mirror: true },
      { s: 'ball', d: [0.06], at: [0.5, 0.58, 0.12], scale: [0.9, 1.2, 0.9], c: 0xb8c94a, seg: 6, mirror: true },  // pears
      { s: 'ball', d: [0.06], at: [0.8, 1.52, 0.12], scale: [0.9, 1.2, 0.9], c: 0xb8c94a, seg: 6, mirror: true },
    ],
  },
  {
    id: 'euro-plane-tree', name: 'Plane Tree', category: 'prop', uses: ['place'],
    tags: ['tree', 'plane', 'square', 'canopy', 'shade', 'mottled', 'trunk', 'garden', 'euro', 'gta'], emoji: [],
    footprint: { r: 0.45, h: 9 },
    about: 'Gnome Theft Auto: the Plane Tree. A tall mottled grey trunk that splits into two thick limbs under a broad lumpy canopy of green balls, about 5 m wide and 9 m tall. Life-size metres.',
    examine: [
      'A tall tree with a mottled grey trunk that splits into two thick limbs, and a broad lumpy canopy of green balls, its bark peeling in pale patches.',
      'Saying: the plane tree has been in the square for so long that the square was built around it, and has never quite forgiven the tree.',
      'Tip: sit under the canopy at noon. The shade is generous, and the pigeons will come to talk about it.',
      'Joke: the tree has been asked to move twice, and both times it was the council that needed a new office.',
      'A single seed ball hangs from a long stalk near the top, and gnomes say whoever catches it will have good coffee for life.',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.25, 4.5], at: [0, 2.25, 0], c: 0x9a9079, seg: 10 },                  // trunk
      { s: 'box', d: [0.16, 0.6, 0.06], at: [0, 1.2, 0.26], c: 'bone' },                           // bark patches, pale
      { s: 'box', d: [0.06, 0.5, 0.14], at: [-0.24, 2.3, 0], c: 'bark' },                        // bark patch, dark
      { s: 'box', d: [0.12, 0.4, 0.06], at: [0.1, 3.1, -0.22], c: 'bone' },                      // bark patch, pale
      { s: 'pill', d: [0.18, 2.4], at: [0.5, 5.55, 0], rot: [0, 0, -22], c: 0x9a9079, seg: 8, mirror: true },  // two limbs
      { s: 'ball', d: [1.5], at: [0, 7.4, 0], c: 'leaf', seg: 8 },                              // canopy
      { s: 'ball', d: [1.25], at: [-1.1, 6.9, 0.3], c: 'leaf-dark', seg: 8 },
      { s: 'ball', d: [1.25], at: [1.2, 6.9, -0.3], c: 'leaf', seg: 8 },
      { s: 'ball', d: [1.1], at: [0.1, 7.7, 0.5], c: 'leaf', seg: 8 },
      { s: 'ball', d: [1.0], at: [-0.6, 6.2, -0.6], c: 'leaf-dark', seg: 8 },
      { s: 'ball', d: [1.0], at: [0.8, 6.3, 1.0], c: 'leaf', seg: 8 },
    ],
  },
];
