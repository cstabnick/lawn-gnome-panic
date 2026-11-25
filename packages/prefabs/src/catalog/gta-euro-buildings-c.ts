// Gnome Theft Auto: European kit (E29, docs/roadmaps/gta-batch-3/E29/). Landmarks: a steeple church, a balcony
// apartment block and a covered market hall. Life-size metres, front on +z, nothing past x = +-width/2.
import type { Part, PrefabDef } from '../types';
import type { Swatch } from '../palette';

/** One apartment storey: a pair of tall windows twice over, plus a continuous iron balcony reaching 0.8 out front. */
const apartmentFloor = (y0: number): Part[] => [
  { s: 'box', d: [1.0, 1.6, 0.1], at: [1.4, y0 + 1.3, 4.04], c: 'glass', mirror: true },       // inner windows
  { s: 'box', d: [1.0, 1.6, 0.1], at: [3.5, y0 + 1.3, 4.04], c: 'glass', mirror: true },       // outer windows
  { s: 'box', d: [9.4, 0.12, 0.84], at: [0, y0 + 0.06, 4.38], c: 'iron-dark' },                 // balcony slab
  { s: 'box', d: [9.4, 0.64, 0.05], at: [0, y0 + 0.43, 4.78], c: 'iron-dark' },                 // balcony rail
];

/** One market stall: counter, painted backboard, a crate and two bits of produce. */
const marketStall = (x: number, board: Swatch, fruitA: Swatch, fruitB: Swatch): Part[] => [
  { s: 'box', d: [2.4, 0.9, 0.9], at: [x, 0.54, -1.5], c: 'wood' },                            // counter
  { s: 'box', d: [2.4, 1.6, 0.1], at: [x, 0.9, -2.1], c: board },                              // backboard
  { s: 'box', d: [0.9, 0.3, 0.6], at: [x - 0.5, 1.13, -1.5], c: 'wood-light' },                // crate
  { s: 'ball', d: [0.17], at: [x - 0.65, 1.38, -1.5], c: fruitA, seg: 6 },                     // produce
  { s: 'ball', d: [0.17], at: [x - 0.3, 1.38, -1.45], c: fruitB, seg: 6 },
];

export const GTA_EURO_BUILDINGS_C: readonly PrefabDef[] = [
  {
    id: 'euro-steeple-church', name: 'Steeple Church', category: 'prop', uses: ['place'],
    tags: ['church', 'steeple', 'spire', 'tower', 'bell', 'chapel', 'stone', 'landmark', 'building', 'gta', 'euro'], emoji: [],
    tint: 0xcfc6b4, trim: 0x5a6470,
    footprint: { r: 4, h: 22 },
    about: 'Gnome Theft Auto European kit: a stone nave with a steep slate roof, a front tower with clock, rose window, open belfry and bell, and a tall pointed spire. Tint is the stone, trim is the roof and spire.',
    examine: [
      'A stone church with a steep roof, a round window over the doors and a spire so tall it has its own weather.',
      'Saying: the bell tells the time, and the time is always a little after it is useful.',
      'Tip: the doors are open all day. The queue outside is for the tower stairs, and nobody knows why anyone climbs them.',
      'Joke: the clock on the tower is right twice a day, which is a better record than the town hall.',
      'A small brass bell hangs in the belfry. Someone has tied a string to the clapper, and the string goes down into the wall.',
    ],
    parts: [
      { s: 'box', d: [7.6, 8, 10], at: [0, 4, -2], c: 'tint' },                                            // nave
      { s: 'wedge', d: [10, 3.5, 3.9], at: [-1.95, 9.78, -2], rot: [0, 90, 0], c: 'trim', mirror: true },  // nave roof, both slopes
      { s: 'box', d: [7, 10.05, 4.4], at: [0, 5.025, 4.8], c: 'tint' },                                    // tower
      { s: 'box', d: [0.6, 4.05, 0.6], at: [3.15, 12.025, 6.65], c: 'tint', mirror: true },                // belfry pillars, front
      { s: 'box', d: [0.6, 4.05, 0.6], at: [3.15, 12.025, 2.95], c: 'tint', mirror: true },                // belfry pillars, back
      { s: 'cyl', d: [0.15, 0.35, 0.7], at: [0, 12.4, 4.8], c: 'brass', seg: 8 },                          // bell
      { s: 'box', d: [7.4, 0.3, 4.8], at: [0, 14.15, 4.8], c: 'trim' },                                    // belfry roof slab
      { s: 'cone', d: [3.1, 7.7], at: [0, 18.15, 4.8], c: 'trim', seg: 4 },                                // spire
      { s: 'box', d: [0.95, 3.2, 0.1], at: [0.5, 1.6, 7.04], c: 'wood-dark', mirror: true },               // double doors
      { s: 'cyl', d: [1.1, 1.1, 0.08], at: [0, 6.5, 7.03], rot: [90, 0, 0], c: 'glass', seg: 12 },         // rose window glass
      { s: 'ring', d: [1.2, 0.15], at: [0, 6.5, 7.1], c: 'spark', glow: true, seg: 12 },                   // rose window ring
      { s: 'cyl', d: [0.9, 0.9, 0.1], at: [0, 8.8, 7.03], rot: [90, 0, 0], c: 'white', seg: 12 },          // clock face
      { s: 'box', d: [0.08, 0.6, 0.04], at: [0, 9.0, 7.1], c: 'black' },                                   // minute hand
      { s: 'box', d: [0.45, 0.08, 0.04], at: [0.15, 8.8, 7.1], c: 'black' },                               // hour hand
      { s: 'box', d: [3.2, 0.3, 1.0], at: [0, 0.15, 7.45], c: 'stone' },                                   // steps
      { s: 'box', d: [0.25, 5, 0.5], at: [3.875, 2.5, -5.5], c: 'tint', mirror: true },                    // buttresses
      { s: 'box', d: [0.25, 5, 0.5], at: [3.875, 2.5, -2.5], c: 'tint', mirror: true },
      { s: 'box', d: [0.25, 5, 0.5], at: [3.875, 2.5, 0.5], c: 'tint', mirror: true },
      { s: 'box', d: [0.1, 3, 0.8], at: [3.83, 4.2, -4], c: 'glaze-blue', mirror: true },                  // nave windows
      { s: 'box', d: [0.1, 3, 0.8], at: [3.83, 4.2, -1], c: 'glaze-blue', mirror: true },
    ],
  },
  {
    id: 'euro-apartment-block', name: 'Balcony Apartments', category: 'prop', uses: ['place'],
    tags: ['apartment', 'flats', 'block', 'balcony', 'shop', 'housing', 'mansard', 'render', 'building', 'gta', 'euro'], emoji: [],
    tint: 0xf1e3c6, trim: 0x7b8691,
    footprint: { r: 4, h: 14 },
    about: 'Gnome Theft Auto European kit: five storeys of pale render, shopfronts below, four iron balconies, a zinc mansard roof and chimney stacks. Tint is the render, trim is the zinc roof.',
    examine: [
      'Five floors of pale plaster, a row of shops below and an iron balcony on every storey, one with washing and one with pots.',
      'Saying: a good neighbour is one you can hear, never see, and who never owns a drum.',
      'Tip: the shops open at ten and close for lunch at eleven. Buy your bread in the gap.',
      'Joke: the lift has been out of order since before the building had stairs.',
      'The washing on the second balcony never dries and never moves. Somebody has been hanging the same three shirts for years.',
    ],
    parts: [
      { s: 'box', d: [9.94, 12.6, 7.94], at: [0, 6.3, 0], c: 'tint' },                                     // walls
      { s: 'box', d: [10, 0.2, 8], at: [0, 12.7, 0], c: 'trim' },                                         // cornice
      { s: 'wedge', d: [9.9, 1.17, 4.06], at: [0, 13.415, 2.0], rot: [0, 180, 0], c: 'trim' },            // mansard, front slope
      { s: 'wedge', d: [9.9, 1.17, 4.06], at: [0, 13.415, -2.0], c: 'trim' },                             // mansard, back slope
      { s: 'box', d: [0.7, 1.6, 0.7], at: [2.5, 13.2, -1.5], c: 'clay-dark', mirror: true },              // chimney stacks
      { s: 'box', d: [9.2, 2.6, 0.1], at: [0, 1.5, 4.04], c: 'iron-dark' },                               // shopfront frame
      { s: 'box', d: [2.6, 2.0, 0.08], at: [3.1, 1.5, 4.11], c: 'glass', mirror: true },                  // shop windows
      { s: 'box', d: [2.6, 2.0, 0.08], at: [0, 1.5, 4.11], c: 'glass' },
      ...apartmentFloor(3.0),
      ...apartmentFloor(5.4),
      ...apartmentFloor(7.8),
      ...apartmentFloor(10.2),
      { s: 'box', d: [2.4, 0.03, 0.03], at: [-2.5, 6.7, 4.6], c: 'iron' },                                // washing line, floor 2
      { s: 'box', d: [0.4, 0.5, 0.04], at: [-3.2, 6.43, 4.6], c: 'red' },                                 // shirts
      { s: 'box', d: [0.4, 0.5, 0.04], at: [-2.5, 6.43, 4.6], c: 'white' },
      { s: 'box', d: [0.4, 0.5, 0.04], at: [-1.8, 6.43, 4.6], c: 'blue' },
      { s: 'cyl', d: [0.15, 0.11, 0.3], at: [3.2, 8.07, 4.5], c: 'terracotta', seg: 6 },                  // potted plants, floor 3
      { s: 'ball', d: [0.2], at: [3.2, 8.4, 4.5], c: 'leaf', seg: 6 },
      { s: 'cyl', d: [0.15, 0.11, 0.3], at: [2.6, 8.07, 4.5], c: 'terracotta', seg: 6 },
      { s: 'ball', d: [0.18], at: [2.6, 8.38, 4.5], c: 'petal', seg: 6 },
    ],
  },
  {
    id: 'euro-market-hall', name: 'Covered Market Hall', category: 'prop', uses: ['place'],
    tags: ['market', 'hall', 'glass', 'iron', 'stalls', 'shop', 'produce', 'building', 'gta', 'euro'], emoji: [],
    tint: 0x8a8f94, trim: 0x4f6f5a,
    footprint: { r: 5, h: 8 },
    about: 'Gnome Theft Auto European kit: an open-sided hall of slim green iron columns under a pitched glass roof with a clerestory, a stone plinth, a clock over the front entrance and three coloured stalls. Tint is the plinth, trim is the green ironwork.',
    examine: [
      'An open hall of green iron columns under a glass roof, with three stalls piled with fruit nobody has priced.',
      'Saying: the best bargain in the market is the one the stallholder is too busy arguing to sell.',
      'Tip: come early, before the glass roof turns the hall into a greenhouse, and the cheese into a different cheese.',
      'Joke: the clock over the entrance has been fast for a decade. The stalls simply open when they feel like it.',
      'One stall sells only a single, very large turnip. It has a queue, and nobody will say why.',
    ],
    parts: [
      { s: 'box', d: [12, 0.1, 10], at: [0, 0.05, 0], c: 'tint' },                                         // plinth floor
      { s: 'cyl', d: [0.18, 0.18, 5.32], at: [5.7, 2.74, 4.8], c: 'trim', seg: 8, mirror: true },         // columns, front corners
      { s: 'cyl', d: [0.18, 0.18, 5.32], at: [3.2, 2.74, 4.8], c: 'trim', seg: 8, mirror: true },         // columns, entrance
      { s: 'cyl', d: [0.18, 0.18, 5.32], at: [5.7, 2.74, -4.8], c: 'trim', seg: 8, mirror: true },        // columns, back
      { s: 'cyl', d: [0.18, 0.18, 5.32], at: [3.0, 2.74, -4.8], c: 'trim', seg: 8, mirror: true },
      { s: 'cyl', d: [0.18, 0.18, 5.32], at: [0, 2.74, -4.8], c: 'trim', seg: 8 },
      { s: 'cyl', d: [0.18, 0.18, 5.32], at: [5.7, 2.74, 1.6], c: 'trim', seg: 8, mirror: true },         // columns, ends
      { s: 'cyl', d: [0.18, 0.18, 5.32], at: [5.7, 2.74, -1.6], c: 'trim', seg: 8, mirror: true },
      { s: 'box', d: [11.94, 0.3, 0.2], at: [0, 5.45, 4.97], c: 'trim' },                                 // eaves beam, front
      { s: 'box', d: [11.94, 0.3, 0.2], at: [0, 5.45, -4.97], c: 'trim' },                                // eaves beam, back
      { s: 'wedge', d: [11.9, 1.9, 5.0], at: [0, 6.58, 2.5], rot: [0, 180, 0], c: 'glass', alpha: 0.4 }, // glass roof, front slope
      { s: 'wedge', d: [11.9, 1.9, 5.0], at: [0, 6.58, -2.5], c: 'glass', alpha: 0.4 },                  // glass roof, back slope
      { s: 'box', d: [11.5, 0.65, 1.4], at: [0, 7.575, 0], c: 'glass', alpha: 0.4 },                      // clerestory
      { s: 'box', d: [11.9, 0.1, 1.6], at: [0, 7.95, 0], c: 'trim' },                                     // ridge cap
      { s: 'cyl', d: [0.9, 0.9, 0.12], at: [0, 4.35, 5.0], rot: [90, 0, 0], c: 'white', seg: 12 },        // entrance clock
      { s: 'box', d: [0.08, 0.5, 0.04], at: [0, 4.5, 5.09], c: 'black' },                                 // minute hand
      { s: 'box', d: [0.4, 0.08, 0.04], at: [0.15, 4.35, 5.09], c: 'black' },                             // hour hand
      ...marketStall(-3.5, 'red', 'red', 'yellow'),
      ...marketStall(0, 'blue', 'green', 'orange'),
      ...marketStall(3.5, 'yellow', 'purple', 'red'),
    ],
  },
];
