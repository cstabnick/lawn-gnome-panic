// Gnome Theft Auto (E16): Windfall Croft buildings and farm props.
import type { PrefabDef } from '../types';

export const GTA_COUNTRY_CROFT: readonly PrefabDef[] = [
  {
    id: 'croft-farmhouse', name: 'Windfall Croft Farmhouse', category: 'prop', uses: ['place'],
    tags: ['croft', 'farm', 'cloverfield', 'gta', 'farmhouse', 'house', 'cottage', 'timber', 'porch', 'chimney'], emoji: [],
    footprint: { r: 7, h: 7 },
    about: 'Gnome Theft Auto: the Windfall Croft farmhouse. Life-size metres, 14 x 10 in plan, walls 3.5 high, front door on +z. Weathered timber walls, a mossy slate roof, a sagging porch, a crooked chimney and one window boarded over. Standing on the ground at y = 0.',
    examine: [
      'A low timber croft under a slate roof gone soft with moss, one window boarded over with crossed planks.',
      'Saying: a house with a sagging porch is only resting its roof, and the gnomes respect a roof that needs a rest.',
      'Tip: the porch step is sound. The step after it is more of a suggestion.',
      'Joke: the agent called it characterful, which is the word for a house that has opinions about you.',
      'The flower box under the boarded window is empty, but someone still waters it every Tuesday, out of habit.',
    ],
    parts: [
      { s: 'box', d: [14, 3.5, 10], at: [0, 1.75, 0], c: 0x8a6f4e },                                   // walls
      { s: 'box', d: [14.2, 0.2, 6.2], at: [0, 5.25, 2.5], rot: [35, 0, 0], c: 'slate' },                // roof, front slope
      { s: 'box', d: [14.2, 0.2, 6.2], at: [0, 5.25, -2.5], rot: [-35, 0, 0], c: 'slate' },             // roof, back slope
      { s: 'box', d: [14.3, 0.12, 0.2], at: [0, 7.06, 0], c: 'bark' },                                  // ridge cap
      { s: 'box', d: [1.1, 2.1, 0.04], at: [0, 1.05, 5.02], c: 'wood-dark' },                           // front door
      { s: 'box', d: [1.4, 1.1, 0.04], at: [-4, 1.9, 5.02], c: 'glass' },                               // window, left
      { s: 'box', d: [1.4, 1.1, 0.04], at: [4, 1.9, 5.02], c: 'glass' },                                // window, right (boarded)
      { s: 'box', d: [1.9, 0.12, 0.05], at: [4, 1.9, 5.07], rot: [0, 0, 30], c: 'wood' },               // board, crossed
      { s: 'box', d: [1.9, 0.12, 0.05], at: [4, 1.9, 5.07], rot: [0, 0, -30], c: 'wood' },              // board, crossed
      { s: 'box', d: [3.4, 0.15, 1.6], at: [0, 0.08, 5.8], c: 'wood-light' },                           // porch deck
      { s: 'cyl', d: [0.07, 0.07, 2.6], at: [1.5, 1.3, 6.4], c: 'wood-dark', seg: 6, mirror: true },    // porch posts
      { s: 'box', d: [3.6, 0.12, 1.9], at: [0, 2.7, 5.9], rot: [4, 0, 0], c: 'slate' },                 // porch roof, sagging
      { s: 'box', d: [0.8, 3.0, 0.8], at: [4, 6.0, -1.8], rot: [0, 0, 4], c: 'clay-dark' },             // chimney, crooked
      { s: 'box', d: [0.95, 0.12, 0.95], at: [4, 7.56, -1.8], c: 'stone-dark' },                         // chimney cap
      { s: 'box', d: [2.4, 0.12, 0.12], at: [6.7, 3.3, 5.25], rot: [0, 0, 28], c: 'iron-dark' },        // gutter, hanging loose
      { s: 'box', d: [1.2, 0.25, 0.3], at: [4, 1.2, 5.15], c: 'wood-dark' },                            // flower box, empty
      { s: 'ball', d: [0.14], at: [-6.85, 0.07, 4.4], scale: [1, 0.5, 1], c: 'leaf-dark', seg: 6 },      // weeds at the wall foot
      { s: 'ball', d: [0.14], at: [6.9, 0.07, 4.6], scale: [1, 0.5, 1], c: 'leaf-dark', seg: 6 },
      { s: 'ball', d: [0.14], at: [-6.8, 0.07, -4.5], scale: [1, 0.5, 1], c: 'moss', seg: 6 },
    ],
  },
  {
    id: 'croft-barn', name: 'Windfall Croft Barn', category: 'prop', uses: ['place'],
    tags: ['barn', 'croft', 'farm', 'cloverfield', 'gta', 'red', 'hayloft', 'doors', 'gambrel', 'tin'], emoji: [],
    footprint: { r: 7, h: 8 },
    about: 'Gnome Theft Auto: the Windfall Croft barn. Life-size metres, 14 x 12 in plan, walls 4 high, gambrel roof to about 8, double doors on +z (one ajar). Faded red paint, white corner trim, tin roof with two missing planks, a hayloft door under a hoist beam.',
    examine: [
      'A faded red barn with a tin gambrel roof, big double doors (one ajar) and a hayloft door under a rusty hoist beam.',
      'Saying: a barn with a hole in the roof has a view of the sky, and the hay has never once complained about it.',
      'Tip: go in by the ajar door. Mind the second step, which is the first one that was there.',
      'Joke: the two missing roof planks were taken for a chicken coop. The chickens have not been consulted.',
      'A hay bale is wedged high in the loft, waiting so long it has started to look like part of the roof.',
    ],
    parts: [
      { s: 'box', d: [14, 4, 12], at: [0, 2, 0], c: 0x9a3b2e },                                       // walls, faded red
      { s: 'box', d: [14.2, 0.2, 3.9], at: [0, 5.1, 4.5], rot: [36, 0, 0], c: 'iron' },                // roof, lower front
      { s: 'box', d: [14.2, 0.2, 3.9], at: [0, 5.1, -4.5], rot: [-36, 0, 0], c: 'iron' },              // roof, lower back
      { s: 'box', d: [14.2, 0.2, 3.5], at: [0, 7.1, 1.5], rot: [31, 0, 0], c: 'iron' },                // roof, upper front
      { s: 'box', d: [14.2, 0.2, 3.5], at: [0, 7.1, -1.5], rot: [-31, 0, 0], c: 'iron' },             // roof, upper back
      { s: 'box', d: [14.3, 0.12, 0.2], at: [0, 8.06, 0], c: 'iron-dark' },                             // ridge
      { s: 'box', d: [1.4, 0.02, 0.7], at: [3.2, 6.72, 2.4], rot: [31, 0, 0], c: 'black' },            // missing plank, front
      { s: 'box', d: [1.4, 0.02, 0.7], at: [-3, 6.72, -2.4], rot: [-31, 0, 0], c: 'black' },            // missing plank, back
      { s: 'box', d: [14, 1.6, 0.2], at: [0, 4.8, 5.9], c: 0x9a3b2e },                                  // gable infill, front
      { s: 'box', d: [1.9, 3.4, 0.04], at: [-1, 1.7, 6.02], c: 'wood-dark' },                           // double door, closed
      { s: 'box', d: [1.9, 3.4, 0.04], at: [1.2, 1.7, 6.2], rot: [0, 20, 0], c: 'wood-dark' },          // double door, ajar
      { s: 'box', d: [1.6, 1.2, 0.04], at: [0, 4.8, 6.02], c: 'wood-dark' },                            // hayloft door
      { s: 'box', d: [2.4, 0.1, 0.12], at: [0, 5.7, 6.1], c: 'wood' },                                  // hoist beam
      { s: 'box', d: [0.5, 0.2, 0.2], at: [0.3, 5.45, 6.12], c: 'straw' },                              // hay in the loft
      { s: 'box', d: [0.15, 4.0, 0.15], at: [6.97, 2, 5.97], mirror: true, c: 'white' },                // corner trim, front
      { s: 'box', d: [0.15, 4.0, 0.15], at: [6.97, 2, -5.97], mirror: true, c: 'white' },               // corner trim, back
      { s: 'ball', d: [0.14], at: [-6.85, 0.07, 5.4], scale: [1, 0.5, 1], c: 'leaf-dark', seg: 6 },     // weeds at the wall foot
      { s: 'ball', d: [0.14], at: [6.9, 0.07, -5.2], scale: [1, 0.5, 1], c: 'moss', seg: 6 },
    ],
  },
  {
    id: 'croft-bed', name: 'Croft Bed', category: 'prop', uses: ['place'],
    tags: ['bed', 'soil', 'garden', 'farm', 'croft', 'planter', 'crop', 'plot', 'raised'], emoji: [],
    footprint: { r: 1.5, h: 0.25 },
    about: 'Gnome Theft Auto: the Croft Bed. A raised soil bed, exactly 3 x 8 x 0.25 m, with a dark soil top at y = 0.22 inside a plank edging. The game plants crops on the soil.',
    examine: [
      'A raised bed of dark soil inside a plank edging, three gnome-widths across and eight long, ready for anything.',
      'Saying: the soil remembers every seed it has been given, and sometimes it remembers them in the wrong order.',
      'Tip: plant the tall things at the back, or the short ones at the front will never see the sun again.',
      'Joke: the bed has been dug so many times that it is now mostly a hole with a plan.',
      'A small wooden marker stands at one end with a name scratched out and no new one written yet.',
    ],
    parts: [
      { s: 'box', d: [2.84, 0.22, 7.84], at: [0, 0.11, 0], c: 0x4a3424 },                             // soil top
      { s: 'box', d: [0.08, 0.25, 7.84], at: [1.46, 0.125, 0], c: 'wood', mirror: true },               // edging, long sides
      { s: 'box', d: [3.0, 0.25, 0.08], at: [0, 0.125, 3.96], c: 'wood' },                              // edging, end
      { s: 'box', d: [3.0, 0.25, 0.08], at: [0, 0.125, -3.96], c: 'wood' },                             // edging, end
      { s: 'box', d: [0.04, 0.3, 0.04], at: [1.1, 0.4, 3.2], rot: [0, 0, 0], c: 'wood-dark' },         // marker post
      { s: 'box', d: [0.3, 0.12, 0.01], at: [1.1, 0.7, 3.2], c: 'paper' },                             // marker card
    ],
  },
  {
    id: 'croft-stall', name: 'Croft Stall', category: 'prop', uses: ['place'],
    tags: ['stall', 'market', 'produce', 'radish', 'carrot', 'awning', 'honesty', 'croft', 'farm', 'shop'], emoji: [],
    footprint: { r: 1.4, h: 2.4 },
    about: 'Gnome Theft Auto: the Croft Stall. A trestle produce stall about 3 m wide with three crates (radishes, carrots, one empty), a green-and-cream striped awning on two posts, a leaning chalkboard and an honesty tin. Front on +z.',
    examine: [
      'A trestle stall under a striped green-and-cream awning, with crates of radishes and carrots and one crate that is empty.',
      'Saying: a radish sold at dawn is worth two sold at noon, and the stall keeps very early hours.',
      'Tip: put your coin in the honesty tin. The tin is very honest, and very patient.',
      'Joke: the chalkboard says Fresh, which the carrots have been asked not to dispute.',
      'The empty crate has a note pinned to it that says Sold Out. Nobody remembers selling anything.',
    ],
    parts: [
      { s: 'box', d: [2.6, 0.08, 0.7], at: [0, 0.9, 0], c: 'wood-light' },                              // counter top
      { s: 'box', d: [0.08, 0.9, 0.6], at: [1.2, 0.45, 0], c: 'wood-dark', mirror: true },               // trestle legs
      { s: 'box', d: [0.6, 0.25, 0.5], at: [-0.9, 1.065, 0], c: 'wood' },                               // radish crate
      { s: 'box', d: [0.5, 0.08, 0.4], at: [-0.9, 1.2, 0], c: 'red' },                                  // radishes
      { s: 'box', d: [0.6, 0.25, 0.5], at: [0, 1.065, 0], c: 'wood' },                                  // carrot crate
      { s: 'box', d: [0.5, 0.08, 0.4], at: [0, 1.2, 0], c: 'orange' },                                  // carrots
      { s: 'box', d: [0.6, 0.25, 0.5], at: [0.9, 1.065, 0], c: 'wood' },                                // empty crate
      { s: 'cyl', d: [0.04, 0.04, 2.4], at: [1.35, 1.2, -0.45], c: 'wood-dark', seg: 6, mirror: true }, // awning posts
      { s: 'box', d: [0.9, 0.05, 1.3], at: [-0.9, 2.45, 0.2], rot: [-8, 0, 0], c: 'green' },            // awning stripe
      { s: 'box', d: [0.9, 0.05, 1.3], at: [0, 2.45, 0.2], rot: [-8, 0, 0], c: 'wool' },                // awning stripe
      { s: 'box', d: [0.9, 0.05, 1.3], at: [0.9, 2.45, 0.2], rot: [-8, 0, 0], c: 'green' },             // awning stripe
      { s: 'box', d: [0.6, 0.8, 0.04], at: [1.2, 0.42, 0.55], rot: [-12, 0, 0], c: 'slate' },          // chalkboard, leaning
      { s: 'cyl', d: [0.05, 0.05, 0.12], at: [0, 1.0, 0.31], c: 'brass', seg: 8 },                      // honesty tin
    ],
  },
  {
    id: 'croft-seed-rack', name: 'Seed Rack', category: 'prop', uses: ['place'],
    tags: ['seed', 'seeds', 'rack', 'packet', 'packets', 'garden', 'shop', 'trowel', 'croft', 'wood'], emoji: [],
    footprint: { r: 0.6, h: 1.4 },
    about: 'Gnome Theft Auto: the Seed Rack. A little wooden rack about 1.4 m tall with three shelves of seed packets in red, orange, pale green and pumpkin, and a hanging trowel. Front on +z.',
    examine: [
      'A little wooden rack of seed packets in red, orange, pale green and pumpkin, with a trowel hung on a nail at the side.',
      'Saying: a seed is a promise written very small, and the packet is where the promise is kept.',
      'Tip: read the packet before you plant. The picture on the front is always more hopeful than the soil.',
      'Joke: a packet with a carrot on it has never once been eaten by the carrot.',
      'Two packets have been moved to the wrong shelf, as if the seeds had decided to go somewhere else.',
    ],
    parts: [
      { s: 'box', d: [0.05, 1.4, 0.3], at: [-0.6, 0.7, 0], c: 'wood-dark', mirror: true },               // side panels
      { s: 'box', d: [1.2, 1.4, 0.03], at: [0, 0.7, -0.14], c: 'wood-dark' },                           // back board
      { s: 'box', d: [1.15, 0.04, 0.3], at: [0, 0.35, 0], c: 'wood-light' },                            // shelf, bottom
      { s: 'box', d: [1.15, 0.04, 0.3], at: [0, 0.75, 0], c: 'wood-light' },                            // shelf, middle
      { s: 'box', d: [1.15, 0.04, 0.3], at: [0, 1.15, 0], c: 'wood-light' },                            // shelf, top
      { s: 'box', d: [0.18, 0.22, 0.02], at: [-0.4, 0.48, 0.1], c: 'red' },                             // packets, bottom shelf
      { s: 'box', d: [0.18, 0.22, 0.02], at: [-0.13, 0.48, 0.1], c: 'orange' },
      { s: 'box', d: [0.18, 0.22, 0.02], at: [0.13, 0.48, 0.1], c: 0xb8dca0 },
      { s: 'box', d: [0.18, 0.22, 0.02], at: [0.4, 0.48, 0.1], c: 0xd9701f },
      { s: 'box', d: [0.18, 0.22, 0.02], at: [-0.4, 0.88, 0.1], c: 0xb8dca0 },                           // packets, middle shelf
      { s: 'box', d: [0.18, 0.22, 0.02], at: [-0.13, 0.88, 0.1], c: 0xd9701f },
      { s: 'box', d: [0.18, 0.22, 0.02], at: [0.13, 0.88, 0.1], c: 'red' },
      { s: 'box', d: [0.18, 0.22, 0.02], at: [0.4, 0.88, 0.1], c: 'orange' },
      { s: 'box', d: [0.18, 0.22, 0.02], at: [-0.4, 1.28, 0.1], c: 'orange' },                           // packets, top shelf
      { s: 'box', d: [0.18, 0.22, 0.02], at: [-0.13, 1.28, 0.1], c: 'red' },
      { s: 'box', d: [0.18, 0.22, 0.02], at: [0.13, 1.28, 0.1], c: 0xd9701f },
      { s: 'box', d: [0.18, 0.22, 0.02], at: [0.4, 1.28, 0.1], c: 0xb8dca0 },
      { s: 'cyl', d: [0.02, 0.02, 0.14], at: [-0.45, 1.0, 0.17], c: 'wood', seg: 6 },                       // trowel handle
      { s: 'box', d: [0.06, 0.14, 0.01], at: [-0.45, 0.85, 0.17], c: 'steel' },                            // trowel blade
    ],
  },
  {
    id: 'croft-for-sale', name: 'For Sale Board', category: 'prop', uses: ['place'],
    tags: ['sale', 'sign', 'board', 'estate', 'croft', 'cream', 'post', 'notice', 'for-sale'], emoji: [],
    footprint: { r: 0.8, h: 2.2 },
    about: 'Gnome Theft Auto: the For Sale Board. A cream board 1.6 m wide and 1.0 m tall on two posts (top at 2.2 m), with red border strips. Blank face on +z at z = 0.05; the game adds the words as a text plate in front.',
    examine: [
      'A cream board with red edges on two posts. It has no words on it yet, which is the most honest thing about it.',
      'Saying: a sign that says FOR SALE is a sign that somebody has grown tired of the weeds.',
      'Tip: a board that says nothing will say whatever the buyer wants it to, so write the price first.',
      'Joke: the price is written on the back, and the back is where the price has always been.',
      'The posts have been painted twice, and each coat was chosen by a different gnome who did not speak to the other.',
    ],
    parts: [
      { s: 'box', d: [1.6, 1.0, 0.1], at: [0, 1.7, 0], c: 0xefe6cf },                                   // board face
      { s: 'box', d: [1.62, 0.04, 0.01], at: [0, 2.18, 0.055], c: 'red' },                              // border, top
      { s: 'box', d: [1.62, 0.04, 0.01], at: [0, 1.22, 0.055], c: 'red' },                              // border, bottom
      { s: 'box', d: [0.04, 1.0, 0.01], at: [-0.78, 1.7, 0.055], c: 'red' },                            // border, left
      { s: 'box', d: [0.04, 1.0, 0.01], at: [0.78, 1.7, 0.055], c: 'red' },                             // border, right
      { s: 'box', d: [0.08, 2.2, 0.08], at: [0.55, 1.1, -0.1], c: 'wood-dark', mirror: true },          // posts
      { s: 'box', d: [1.6, 0.08, 0.06], at: [0, 1.1, -0.1], c: 'wood' },                                // rail
    ],
  },
  {
    id: 'croft-water-butt', name: 'Water Butt', category: 'prop', uses: ['place'],
    tags: ['butt', 'barrel', 'water', 'rain', 'tub', 'wooden', 'tap', 'croft', 'watering', 'can'], emoji: [],
    footprint: { r: 0.45, h: 1.2 },
    about: 'Gnome Theft Auto: the Water Butt. A wooden rain barrel about 1.2 m tall with iron hoops, a lid, a tap on the front and a dented watering can leaning against it.',
    examine: [
      'A big wooden water barrel with iron hoops, a lid, a tap on the front and a dented watering can leaning on its side.',
      'Saying: rain given to a barrel is rain saved for a dry day, and the barrel is still waiting for the dry day.',
      'Tip: turn the tap slowly, or the water arrives all at once and the can is left thinking about it.',
      'Joke: nobody has lifted the lid without then saying something about the smell.',
      'The can has a dent in its side, shaped very like the foot of the gnome who last stood on it.',
    ],
    parts: [
      { s: 'cyl', d: [0.42, 0.36, 1.1], at: [0, 0.55, 0], c: 'wood', seg: 10 },                         // barrel
      { s: 'cyl', d: [0.43, 0.43, 0.04], at: [0, 0.2, 0], c: 'iron', seg: 10 },                          // hoop, low
      { s: 'cyl', d: [0.43, 0.43, 0.04], at: [0, 0.9, 0], c: 'iron', seg: 10 },                          // hoop, high
      { s: 'cyl', d: [0.42, 0.42, 0.05], at: [0, 1.125, 0], c: 'wood-dark', seg: 10 },                   // lid
      { s: 'cyl', d: [0.03, 0.03, 0.12], at: [0, 0.25, 0.46], rot: [90, 0, 0], c: 'iron-dark', seg: 6 }, // tap
      { s: 'cyl', d: [0.13, 0.11, 0.25], at: [0.6, 0.125, 0.25], c: 'green', seg: 8 },                  // watering can body
      { s: 'cyl', d: [0.02, 0.02, 0.22], at: [0.82, 0.2, 0.25], rot: [0, 0, -40], c: 'green', seg: 6 }, // watering can spout
      { s: 'ring', d: [0.07, 0.012], at: [0.56, 0.22, 0.25], c: 'green', seg: 6 },                       // watering can handle
    ],
  },
  {
    id: 'croft-apple-tree', name: 'Windfall Apple Tree', category: 'prop', uses: ['place'],
    tags: ['apple', 'tree', 'orchard', 'windfall', 'fruit', 'croft', 'farm', 'leaning', 'red'], emoji: [],
    footprint: { r: 0.3, h: 4.5 },
    about: 'Gnome Theft Auto: the Windfall Apple Tree. An old leaning orchard tree about 4.5 m tall: a round green crown with red apples, and four windfall apples on the grass. Life-size metres, at the origin.',
    examine: [
      'An old leaning apple tree with a round green crown, red apples in its branches and four fallen ones in the grass.',
      'Saying: an apple that falls in the grass is a gift, and the gnomes have been very polite about picking them up.',
      'Tip: pick the apples off the tree, not the ground. The ground apples have been down there some time.',
      'Joke: the tree leans toward the wall, as if it wants to see what is on the other side of the fence.',
      'One apple hangs on the top branch, always red, and nobody has managed to reach it, which is the point.',
    ],
    parts: [
      { s: 'cyl', d: [0.14, 0.2, 2.2], at: [0.2, 1.1, 0], rot: [0, 0, -8], c: 'bark', seg: 6 },    // leaning trunk
      { s: 'ball', d: [1.4], at: [0, 3.1, 0], c: 'leaf', seg: 8 },                                  // crown, centre
      { s: 'ball', d: [1.1], at: [-1.0, 2.9, 0.4], c: 'leaf-dark', seg: 8 },                        // crown, left
      { s: 'ball', d: [1.15], at: [1.0, 2.8, -0.3], c: 'leaf', seg: 8 },                            // crown, right
      { s: 'ball', d: [0.9], at: [0.4, 3.9, 0.2], c: 'leaf', seg: 8 },                              // crown, top
      { s: 'ball', d: [0.09], at: [1.25, 3.4, 0.6], c: 'red', seg: 6 },                             // apples on the crown
      { s: 'ball', d: [0.09], at: [-1.2, 3.6, 0.5], c: 'red', seg: 6 },
      { s: 'ball', d: [0.09], at: [0.3, 4.4, 0.6], c: 'red', seg: 6 },
      { s: 'ball', d: [0.09], at: [-0.6, 2.4, 1.2], c: 'red', seg: 6 },
      { s: 'ball', d: [0.09], at: [0.9, 2.6, 1.0], c: 'red', seg: 6 },
      { s: 'ball', d: [0.09], at: [-1.4, 3.0, -0.2], c: 'red', seg: 6 },
      { s: 'ball', d: [0.09], at: [-0.2, 4.4, -0.7], c: 'red', seg: 6 },
      { s: 'ball', d: [0.09], at: [1.3, 3.1, -0.6], c: 'red', seg: 6 },
      { s: 'ball', d: [0.09], at: [-0.9, 2.2, -0.9], c: 'red', seg: 6 },
      { s: 'ball', d: [0.09], at: [0.6, 4.0, -0.9], c: 'red', seg: 6 },
      { s: 'ball', d: [0.09], at: [1.0, 2.2, -0.2], c: 'red', seg: 6 },
      { s: 'ball', d: [0.09], at: [2.4, 0.09, 1.4], c: 'red', seg: 6 },                              // windfall, on the grass
      { s: 'ball', d: [0.09], at: [2.0, 0.09, -1.0], c: 'red', seg: 6 },
      { s: 'ball', d: [0.09], at: [-2.2, 0.09, 1.2], c: 'red', seg: 6 },
      { s: 'ball', d: [0.09], at: [0.8, 0.09, 2.4], c: 'red', seg: 6 },
    ],
  },
  {
    id: 'croft-fence', name: 'Croft Fence', category: 'prop', uses: ['place'],
    tags: ['fence', 'picket', 'pickets', 'croft', 'farm', 'garden', 'white', 'gate', 'wood', 'run'], emoji: [],
    footprint: { r: 2, h: 1.2 },
    about: 'Gnome Theft Auto: the Croft Fence. A 4 m run of old picket fence along local x, about 1.1 m tall, with two pickets missing and one leaning. Two rails, posts at each end, front on +z.',
    examine: [
      'A four-metre run of old picket fence with two pickets gone and one leaning as if it is listening in.',
      'Saying: a good fence keeps the neighbours out and the gnomes in, and this one has been doing its half of the job.',
      'Tip: climb over at the gap, not the gate. The gate has a sign that says Closed, which is not quite true.',
      'Joke: the fence was painted white once. Now it is the colour of a fence that has given up on paint.',
      'A tiny red ribbon is tied to the leaning picket. Nobody will say whose it is, or what it is for.',
    ],
    parts: [
      { s: 'box', d: [4.0, 0.08, 0.03], at: [0, 0.35, -0.03], c: 'wood' },                          // rail, low
      { s: 'box', d: [4.0, 0.08, 0.03], at: [0, 0.85, -0.03], c: 'wood' },                          // rail, high
      { s: 'box', d: [0.1, 1.2, 0.1], at: [2.0, 0.6, -0.03], c: 'wood-dark', mirror: true },       // end posts
      { s: 'box', d: [0.09, 1.1, 0.025], at: [-1.95, 0.55, 0], c: 'wood-light' },                  // pickets
      { s: 'box', d: [0.09, 1.1, 0.025], at: [-1.65, 0.55, 0], c: 'wood-light' },
      { s: 'box', d: [0.09, 1.1, 0.025], at: [-1.35, 0.55, 0], c: 'wood-light' },
      { s: 'box', d: [0.09, 1.1, 0.025], at: [-1.05, 0.55, 0], c: 'wood-light' },
      { s: 'box', d: [0.09, 1.1, 0.025], at: [-0.75, 0.55, 0], c: 'wood-light' },
      { s: 'box', d: [0.09, 1.1, 0.025], at: [-0.15, 0.55, 0], c: 'wood-light' },
      { s: 'box', d: [0.09, 1.1, 0.025], at: [0.15, 0.55, 0], c: 'wood-light' },
      { s: 'box', d: [0.09, 1.1, 0.025], at: [0.45, 0.55, 0], c: 'wood-light' },
      { s: 'box', d: [0.09, 1.1, 0.025], at: [0.75, 0.55, 0], c: 'wood-light', rot: [0, 0, 8] },    // leaning picket
      { s: 'box', d: [0.09, 1.1, 0.025], at: [1.35, 0.55, 0], c: 'wood-light' },
      { s: 'box', d: [0.09, 1.1, 0.025], at: [1.65, 0.55, 0], c: 'wood-light' },
      { s: 'box', d: [0.09, 1.1, 0.025], at: [1.95, 0.55, 0], c: 'wood-light' },
    ],
  },
  {
    id: 'croft-scarecrow', name: 'Scarecrow', category: 'prop', uses: ['place'],
    tags: ['scarecrow', 'straw', 'crow', 'field', 'post', 'hat', 'coat', 'farm', 'croft', 'sack'], emoji: [],
    about: 'Gnome Theft Auto: the Scarecrow. About 1.9 m tall on a post: a sack head with a stitched face, a beige hard hat, a patched coat on a crossbar and straw tufts at the cuffs. Standing on the ground at y = 0.',
    examine: [
      'A sack-headed scarecrow on a post, in a patched coat and a beige hard hat that was lost from a building site.',
      'Saying: a scarecrow is a gnome who has agreed to stand still, which makes it the most reliable gnome in the yard.',
      'Tip: do not shake hands with the scarecrow. The straw at the cuffs comes off on everything it touches.',
      'Joke: the hat is from Levelright, and the crow who found it has been wearing it sideways ever since.',
      'The stitched face has a smile on one side and a frown on the other, and the crows have voted on which is true.',
    ],
    parts: [
      { s: 'cyl', d: [0.04, 0.04, 1.8], at: [0, 0.9, 0], c: 'bark', seg: 6 },                           // post
      { s: 'box', d: [1.2, 0.06, 0.06], at: [0, 1.35, 0], c: 'wood-dark' },                              // crossbar
      { s: 'box', d: [0.56, 0.75, 0.26], at: [0, 1.1, 0], c: 'burlap' },                                 // coat
      { s: 'box', d: [0.12, 0.12, 0.01], at: [0.12, 1.2, 0.135], c: 'blue' },                            // coat patch
      { s: 'box', d: [0.1, 0.1, 0.01], at: [-0.14, 0.95, 0.135], c: 'green' },                           // coat patch
      { s: 'ball', d: [0.05], at: [0.62, 1.3, 0], c: 'straw', seg: 6, mirror: true },                    // straw tufts at the cuffs
      { s: 'ball', d: [0.16], at: [0, 1.6, 0], c: 'burlap', seg: 8 },                                    // sack head
      { s: 'box', d: [0.04, 0.02, 0.01], at: [0.05, 1.64, 0.17], c: 'black', mirror: true },              // stitched eyes
      { s: 'box', d: [0.1, 0.02, 0.01], at: [0, 1.55, 0.17], c: 'black' },                               // stitched mouth
      { s: 'cyl', d: [0.22, 0.22, 0.02], at: [0, 1.76, 0], c: 'sand', seg: 10 },                         // hard hat brim
      { s: 'cyl', d: [0.14, 0.16, 0.12], at: [0, 1.83, 0], c: 'sand', seg: 10 },                         // hard hat dome
    ],
  },
];
