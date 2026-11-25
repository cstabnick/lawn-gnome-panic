// Gnome Theft Auto: European kit (E29, docs/roadmaps/gta-batch-3/E29/). Four terrace buildings, life-size metres.
// Front on +z. Walls take `tint`, roofs take `trim`. Nothing goes past x = +-width/2 (the row packs them 0.12 apart),
// except the corner cafe, which is a street corner and may reach out on +x.
import type { PrefabDef } from '../types';

export const GTA_EURO_BUILDINGS_A: readonly PrefabDef[] = [
  {
    id: 'euro-townhouse-mansard', name: 'Mansard Townhouse', category: 'prop', uses: ['place'],
    tags: ['townhouse', 'house', 'terrace', 'mansard', 'building', 'render', 'slate', 'dormer', 'balcony', 'shutters', 'gta', 'euro'], emoji: [],
    tint: 0xf1e3c6, trim: 0x5a6470,
    footprint: { r: 2, h: 9.6 },
    about: 'Gnome Theft Auto: the Mansard Townhouse, 4 wide and 9.6 tall. Cream rendered walls take the tint, the steep mansard roof takes the trim (slate). Zinc cornice, two dormers, shuttered windows, iron balcony, door with a stone step, chimney pots.',
    examine: [
      'Three storeys of cream wall under a steep slate roof, with two dormer windows peering out like eyebrows and a little iron balcony.',
      'Saying: a tall house is a long argument with the stairs, and the stairs always win.',
      'Tip: knock at the door, not the shutters. The shutters are closed for lunch and will stay closed until further notice.',
      'Joke: the roof is so steep that the pigeons have formed a union and demanded handrails.',
      'Two chimney pots on top smoke at different times. Locals say they are not speaking to each other.',
    ],
    parts: [
      { s: 'box', d: [3.94, 7, 6], at: [0, 3.5, 0], c: 'tint' },                                       // walls
      { s: 'box', d: [4.0, 0.24, 6.06], at: [0, 6.85, 0], c: 'iron' },                                 // zinc cornice
      { s: 'wedge', d: [4.0, 2.62, 3.0], at: [0, 8.29, 1.5], rot: [0, 180, 0], c: 'trim' },            // mansard, front slope
      { s: 'wedge', d: [4.0, 2.62, 3.0], at: [0, 8.29, -1.5], c: 'trim' },                             // mansard, back slope
      { s: 'box', d: [0.8, 1.0, 0.6], at: [0.95, 8.35, 1.6], c: 'tint', mirror: true },                // dormers
      { s: 'box', d: [0.5, 0.6, 0.06], at: [0.95, 8.4, 1.94], c: 'glass', mirror: true },              // dormer glass
      { s: 'box', d: [0.96, 0.12, 0.8], at: [0.95, 8.9, 1.6], c: 'trim', mirror: true },               // dormer caps
      { s: 'box', d: [0.9, 1.6, 0.06], at: [0, 0.8, 3.04], c: 'wood-dark' },                           // front door
      { s: 'box', d: [1.4, 0.15, 0.5], at: [0, 0.075, 3.22], c: 'stone' },                             // stone step
      { s: 'box', d: [0.6, 1.3, 0.06], at: [1.1, 1.3, 3.04], c: 'glass', mirror: true },               // ground windows
      { s: 'box', d: [0.24, 1.3, 0.07], at: [1.55, 1.3, 3.05], c: 'leaf-dark', mirror: true },         // ground shutters
      { s: 'box', d: [0.6, 1.4, 0.06], at: [1.1, 3.6, 3.04], c: 'glass', mirror: true },               // second floor windows
      { s: 'box', d: [0.24, 1.4, 0.07], at: [1.55, 3.6, 3.05], c: 'leaf-dark', mirror: true },         // second floor shutters
      { s: 'box', d: [0.7, 1.4, 0.06], at: [0, 3.6, 3.04], c: 'glass' },                               // second floor centre window
      { s: 'box', d: [0.6, 1.4, 0.06], at: [1.1, 5.9, 3.04], c: 'glass', mirror: true },               // third floor windows
      { s: 'box', d: [0.24, 1.4, 0.07], at: [1.55, 5.9, 3.05], c: 'leaf-dark', mirror: true },         // third floor shutters
      { s: 'box', d: [0.7, 1.4, 0.06], at: [0, 5.9, 3.04], c: 'glass' },                               // third floor centre window
      { s: 'box', d: [1.6, 0.08, 0.45], at: [0, 2.82, 3.2], c: 'iron-dark' },                          // balcony slab
      { s: 'box', d: [1.6, 0.05, 0.05], at: [0, 3.4, 3.4], c: 'iron-dark' },                           // balcony top rail
      { s: 'box', d: [1.5, 0.5, 0.03], at: [0, 3.15, 3.4], c: 'iron-dark', alpha: 0.55 },              // balcony railings
      { s: 'box', d: [0.05, 0.05, 0.45], at: [0.78, 3.4, 3.2], c: 'iron-dark', mirror: true },          // balcony side rails
      { s: 'box', d: [0.5, 1.0, 0.5], at: [1.0, 9.1, -1.0], c: 'stone' },                              // chimney
      { s: 'cyl', d: [0.1, 0.12, 0.25], at: [0.88, 9.725, -1.0], c: 'clay', seg: 6 },                  // chimney pots
      { s: 'cyl', d: [0.1, 0.12, 0.25], at: [1.12, 9.725, -1.0], c: 'clay', seg: 6 },
    ],
  },
  {
    id: 'euro-townhouse-tall', name: 'Tall Townhouse', category: 'prop', uses: ['place'],
    tags: ['townhouse', 'house', 'terrace', 'tall', 'gable', 'building', 'render', 'chimney', 'shutters', 'narrow', 'gta', 'euro'], emoji: [],
    tint: 0xe8c9a8, trim: 0x7b8691,
    footprint: { r: 1.7, h: 11.8 },
    about: 'Gnome Theft Auto: the Tall Townhouse, 3.4 wide and 11.8 tall. Peach rendered walls take the tint, the pointed gable roof takes the trim. Four storeys, zinc cornice, attic window, shutters (one hangs crooked), a crooked chimney with a pot.',
    examine: [
      'Four narrow storeys of peach wall topped by a pointed gable, with a chimney that leans as though it is listening to the street.',
      'Saying: a thin house stands up straight so that its neighbours cannot lean on it.',
      'Tip: the front door sticks in damp weather. Lean on it politely and say good morning first.',
      'Joke: it is so tall and narrow that the top floor gets its post a day later than the ground floor.',
      'One shutter on the third floor hangs by a single hinge. It has been like that since a very good party, and no one will say which one.',
    ],
    parts: [
      { s: 'box', d: [3.34, 9.2, 6], at: [0, 4.6, 0], c: 'tint' },                                       // walls
      { s: 'box', d: [3.4, 0.22, 6.06], at: [0, 9.05, 0], c: 'iron' },                                 // zinc cornice
      { s: 'wedge', d: [5.96, 2.62, 1.7], at: [-0.85, 10.49, 0], rot: [0, 90, 0], c: 'trim' },         // gable roof, left slope
      { s: 'wedge', d: [5.96, 2.62, 1.7], at: [0.85, 10.49, 0], rot: [0, -90, 0], c: 'trim' },         // gable roof, right slope
      { s: 'box', d: [0.5, 0.5, 0.08], at: [0, 10.0, 3.0], c: 'glass' },                               // attic window
      { s: 'box', d: [0.9, 1.6, 0.06], at: [0, 0.8, 3.04], c: 'wood-dark' },                           // front door
      { s: 'box', d: [1.2, 0.15, 0.5], at: [0, 0.075, 3.22], c: 'stone' },                             // stone step
      { s: 'box', d: [0.5, 1.2, 0.06], at: [0.95, 1.3, 3.04], c: 'glass', mirror: true },              // ground windows
      { s: 'box', d: [0.22, 1.2, 0.07], at: [1.4, 1.3, 3.05], c: 'leaf-dark', mirror: true },          // ground shutters
      { s: 'box', d: [0.5, 1.2, 0.06], at: [0.95, 3.6, 3.04], c: 'glass', mirror: true },              // second floor windows
      { s: 'box', d: [0.22, 1.2, 0.07], at: [1.4, 3.6, 3.05], c: 'leaf-dark', mirror: true },          // second floor shutters
      { s: 'box', d: [0.6, 1.2, 0.06], at: [0, 3.6, 3.04], c: 'glass' },                               // second floor centre window
      { s: 'box', d: [0.5, 1.2, 0.06], at: [0.95, 5.9, 3.04], c: 'glass', mirror: true },              // third floor windows
      { s: 'box', d: [0.22, 1.2, 0.07], at: [1.4, 5.9, 3.05], c: 'leaf-dark' },                        // third floor shutter, right
      { s: 'box', d: [0.22, 1.2, 0.07], at: [-1.25, 5.9, 3.08], rot: [0, 0, 25], c: 'leaf-dark' },     // third floor shutter, left, hanging crooked
      { s: 'box', d: [0.6, 1.2, 0.06], at: [0, 5.9, 3.04], c: 'glass' },                               // third floor centre window
      { s: 'box', d: [0.5, 1.2, 0.06], at: [0.95, 8.15, 3.04], c: 'glass', mirror: true },             // fourth floor windows
      { s: 'box', d: [0.22, 1.2, 0.07], at: [1.4, 8.15, 3.05], c: 'leaf-dark', mirror: true },         // fourth floor shutters
      { s: 'box', d: [0.6, 1.2, 0.06], at: [0, 8.15, 3.04], c: 'glass' },                              // fourth floor centre window
      { s: 'box', d: [0.5, 1.4, 0.5], at: [-0.9, 10.8, -1.5], rot: [0, 0, 8], c: 'stone' },            // crooked chimney
      { s: 'cyl', d: [0.12, 0.14, 0.3], at: [-1.0, 11.6, -1.5], c: 'clay', seg: 6 },                   // chimney pot
    ],
  },
  {
    id: 'euro-half-timbered', name: 'Half-Timbered House', category: 'prop', uses: ['place'],
    tags: ['house', 'timber', 'half-timbered', 'beams', 'tudor', 'building', 'terrace', 'steep', 'flowers', 'window', 'gta', 'euro'], emoji: [],
    tint: 0xf5efe4, trim: 0x9a5a3c,
    footprint: { r: 2.5, h: 8.4 },
    about: 'Gnome Theft Auto: the Half-Timbered House, 5 wide and 8.4 tall. White infill walls take the tint, the steep roof takes the trim (red-brown tile). Dark timber beams, upper floor jutting 0.4 over the front, leaded windows, red flower boxes.',
    examine: [
      'White walls crossed with dark beams, an upper floor that leans out over the street, and window boxes full of red flowers.',
      'Saying: a house with its beams on the outside has nothing to hide, except the cheese in the cellar.',
      'Tip: the upper floor drips when it rains. Walk on the far side of the street, or bring a very large hat.',
      'Joke: the beams are decorative, the inspector says. The beams, quietly, disagree.',
      'A small brass plate by the door reads: please do not tell the neighbours how crooked this really is.',
    ],
    parts: [
      { s: 'box', d: [4.84, 3.05, 6], at: [0, 1.525, 0], c: 'tint' },                                   // ground floor wall
      { s: 'box', d: [4.94, 2.8, 6.4], at: [0, 4.4, 0.2], c: 'tint' },                                 // upper floor wall, jutting 0.4
      { s: 'wedge', d: [5.0, 2.62, 3.4], at: [0, 7.09, 1.7], rot: [0, 180, 0], c: 'trim' },            // roof, front slope
      { s: 'wedge', d: [5.0, 2.62, 3.0], at: [0, 7.09, -1.5], c: 'trim' },                             // roof, back slope
      { s: 'box', d: [0.9, 1.6, 0.06], at: [0, 0.8, 3.04], c: 'wood' },                                // front door
      { s: 'box', d: [0.7, 0.7, 0.06], at: [1.5, 1.6, 3.04], c: 'glass', mirror: true },               // ground windows
      { s: 'box', d: [0.8, 0.2, 0.3], at: [1.5, 1.1, 3.14], c: 'wood', mirror: true },                 // window boxes
      { s: 'ball', d: [0.09], at: [1.25, 1.27, 3.2], c: 'red', seg: 6, mirror: true },                 // red flowers
      { s: 'ball', d: [0.09], at: [1.5, 1.27, 3.2], c: 'red', seg: 6, mirror: true },
      { s: 'ball', d: [0.09], at: [1.75, 1.27, 3.2], c: 'red', seg: 6, mirror: true },
      { s: 'box', d: [0.2, 3.05, 0.08], at: [2.3, 1.525, 3.05], c: 'wood-dark', mirror: true },        // ground corner posts
      { s: 'box', d: [4.9, 0.2, 0.12], at: [0, 3.0, 3.07], c: 'wood-dark' },                           // bressummer beam
      { s: 'box', d: [0.6, 0.9, 0.06], at: [0.75, 4.6, 3.44], c: 'glass', mirror: true },              // upper windows
      { s: 'box', d: [0.64, 0.04, 0.08], at: [0.75, 4.6, 3.47], c: 'iron-dark', mirror: true },        // leaded bars, across
      { s: 'box', d: [0.04, 0.94, 0.08], at: [0.75, 4.6, 3.47], c: 'iron-dark', mirror: true },        // leaded bars, up
      { s: 'box', d: [0.16, 2.8, 0.08], at: [2.38, 4.4, 3.45], c: 'wood-dark', mirror: true },         // upper corner posts
      { s: 'box', d: [0.14, 2.8, 0.08], at: [0, 4.4, 3.45], c: 'wood-dark' },                          // upper centre post
      { s: 'box', d: [4.9, 0.16, 0.12], at: [0, 5.7, 3.47], c: 'wood-dark' },                          // upper top beam
      { s: 'box', d: [4.9, 0.16, 0.12], at: [0, 3.3, 3.47], c: 'wood-dark' },                          // upper bottom beam
      { s: 'box', d: [0.14, 2.2, 0.1], at: [1.75, 4.4, 3.46], rot: [0, 0, 35], c: 'wood-dark', mirror: true },  // diagonals
      { s: 'box', d: [0.14, 2.2, 0.14], at: [1.75, 4.4, 3.48], rot: [0, 0, -35], c: 'wood-dark', mirror: true }, // crossing diagonals
      { s: 'box', d: [0.5, 1.4, 0.5], at: [1.6, 7.9, -1.0], c: 'stone' },                              // chimney
    ],
  },
  {
    id: 'euro-corner-cafe', name: 'Corner Cafe', category: 'prop', uses: ['place'],
    tags: ['cafe', 'shop', 'corner', 'awning', 'building', 'terrace', 'tables', 'chairs', 'sign', 'shopfront', 'gta', 'euro'], emoji: [],
    tint: 0xf3d6cf, trim: 0x4a4f57,
    footprint: { r: 3, h: 7.6 },
    about: 'Gnome Theft Auto: the Corner Cafe, 6 wide and 7.6 tall. Pink walls take the tint, the roof takes the trim (dark slate). Shopfronts on the front and the +x side, red and white striped awnings, two pavement tables with chairs, a hanging sign.',
    examine: [
      'A pink corner building with glass shopfronts on two sides, a striped awning over each, and two small round tables on the pavement.',
      'Saying: a coffee is only as good as the argument you have about it, and the argument here has run for years.',
      'Tip: sit under the awning. It does not keep out the rain, but it keeps the rain from hearing your order.',
      'Joke: open from ten until lunch, and lunch is until tomorrow.',
      'Each chair is turned to face a different direction. The waiter says this is on purpose, and refuses to say why.',
    ],
    parts: [
      { s: 'box', d: [5.94, 5.2, 6], at: [0, 2.6, 0], c: 'tint' },                                     // walls
      { s: 'box', d: [6.0, 0.2, 6.06], at: [0, 5.05, 0], c: 'iron' },                                  // band under the roof
      { s: 'wedge', d: [6.0, 2.42, 3.0], at: [0, 6.39, 1.5], rot: [0, 180, 0], c: 'trim' },            // roof, front slope
      { s: 'wedge', d: [6.0, 2.42, 3.0], at: [0, 6.39, -1.5], c: 'trim' },                             // roof, back slope
      { s: 'box', d: [0.5, 1.0, 0.5], at: [-1.5, 7.1, -1.0], c: 'stone' },                             // chimney
      { s: 'box', d: [5.0, 0.5, 0.06], at: [0, 2.35, 3.04], c: 'wood-dark' },                          // front fascia
      { s: 'box', d: [1.8, 1.5, 0.06], at: [-1.6, 1.2, 3.04], c: 'glass' },                            // front shop windows
      { s: 'box', d: [1.4, 1.5, 0.06], at: [0.1, 1.2, 3.04], c: 'glass' },
      { s: 'box', d: [0.9, 1.7, 0.06], at: [1.7, 0.85, 3.04], c: 'wood-dark' },                        // front door
      { s: 'box', d: [0.8, 1.0, 0.06], at: [1.8, 3.9, 3.04], c: 'glass', mirror: true },               // front upper windows
      { s: 'box', d: [0.8, 1.0, 0.06], at: [0, 3.9, 3.04], c: 'glass' },
      { s: 'box', d: [0.06, 0.5, 5.0], at: [3.01, 2.35, 0], c: 'wood-dark' },                          // side fascia
      { s: 'box', d: [0.06, 1.5, 1.6], at: [3.01, 1.2, -1.4], c: 'glass' },                            // side shop windows
      { s: 'box', d: [0.06, 1.5, 1.6], at: [3.01, 1.2, 0.4], c: 'glass' },
      { s: 'box', d: [0.06, 1.0, 0.8], at: [3.01, 3.9, -1.6], c: 'glass' },                            // side upper windows
      { s: 'box', d: [0.06, 1.0, 0.8], at: [3.01, 3.9, 0.2], c: 'glass' },
      { s: 'box', d: [0.06, 1.0, 0.8], at: [3.01, 3.9, 1.9], c: 'glass' },
      { s: 'wedge', d: [0.7, 0.5, 1.6], at: [0.35, 2.7, 3.78], rot: [0, 180, 0], c: 'red', mirror: true },    // front awning stripes
      { s: 'wedge', d: [0.7, 0.5, 1.6], at: [1.05, 2.7, 3.78], rot: [0, 180, 0], c: 'white', mirror: true },
      { s: 'wedge', d: [0.7, 0.5, 1.6], at: [1.75, 2.7, 3.78], rot: [0, 180, 0], c: 'red', mirror: true },
      { s: 'wedge', d: [0.7, 0.5, 1.6], at: [2.45, 2.7, 3.78], rot: [0, 180, 0], c: 'white', mirror: true },
      { s: 'wedge', d: [1.4, 0.5, 1.4], at: [3.65, 2.7, -2.1], rot: [0, -90, 0], c: 'red' },           // side awning stripes
      { s: 'wedge', d: [1.4, 0.5, 1.4], at: [3.65, 2.7, -0.7], rot: [0, -90, 0], c: 'white' },
      { s: 'wedge', d: [1.4, 0.5, 1.4], at: [3.65, 2.7, 0.7], rot: [0, -90, 0], c: 'red' },
      { s: 'wedge', d: [1.4, 0.5, 1.4], at: [3.65, 2.7, 2.1], rot: [0, -90, 0], c: 'white' },
      { s: 'cyl', d: [0.45, 0.45, 0.05], at: [1.0, 0.745, 4.6], c: 'wood-light', seg: 10, mirror: true }, // round tables
      { s: 'cyl', d: [0.06, 0.06, 0.72], at: [1.0, 0.36, 4.6], c: 'iron-dark', seg: 6, mirror: true },
      { s: 'box', d: [0.4, 0.45, 0.4], at: [1.0, 0.225, 5.3], c: 'wood', mirror: true },               // chairs
      { s: 'box', d: [0.4, 0.5, 0.05], at: [1.0, 0.7, 5.5], c: 'wood', mirror: true },
      { s: 'box', d: [0.4, 0.45, 0.4], at: [1.0, 0.225, 3.9], c: 'wood', mirror: true },
      { s: 'box', d: [0.4, 0.5, 0.05], at: [1.0, 0.7, 3.7], c: 'wood', mirror: true },
      { s: 'box', d: [0.06, 0.06, 0.9], at: [-2.5, 4.6, 3.45], c: 'iron-dark' },                        // hanging sign arm
      { s: 'box', d: [0.08, 0.5, 0.7], at: [-2.5, 4.2, 3.55], c: 'honey' },                            // hanging sign board
    ],
  },
];
