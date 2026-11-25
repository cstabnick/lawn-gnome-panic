// Gnome Theft Auto: European kit (E29, docs/roadmaps/gta-batch-3/E29/): opera hall, canal boathouse, three shopfronts.
// Life-size metres, front on +z. Walls take `tint`, roofs take `trim`. Nothing goes past x = +-width/2 (terrace rows).
import type { Part, PrefabDef } from '../types';

const WARM = 0xffd070; // lit window colour

// Three-storey shop frame shared by the cheese shop, chemist and antiques shop: plain body in `tint`, a slate mansard
// roof in `trim` with one dormer, string courses and shuttered upper windows. Ground floor (y < 2.8) is left to the shop.
function shopfrontFrame(): Part[] {
  const upper = (y: number): Part[] => [
    { s: 'box', d: [0.9, 1.2, 0.05], at: [0.8, y, 2.98], c: 'white', mirror: true },       // window frames
    { s: 'box', d: [0.7, 1.0, 0.06], at: [0.8, y, 3.0], c: 'glass', mirror: true },        // glass
    { s: 'box', d: [0.28, 1.2, 0.05], at: [1.4, y, 2.98], c: 'leaf-dark', mirror: true },  // shutters
  ];
  return [
    { s: 'box', d: [3.5, 6.4, 5.9], at: [0, 3.2, 0], c: 'tint' },                           // body
    { s: 'box', d: [3.56, 0.15, 5.96], at: [0, 2.85, 0], c: 'white' },                      // string course, ground to first
    { s: 'box', d: [3.56, 0.15, 5.96], at: [0, 4.65, 0], c: 'white' },                      // string course, first to second
    ...upper(3.8),
    ...upper(5.5),
    { s: 'box', d: [3.6, 1.4, 6.0], at: [0, 7.1, 0], c: 'trim' },                            // mansard
    { s: 'wedge', d: [3.5, 1.0, 3.0], at: [0, 8.3, 1.5], rot: [0, 180, 0], c: 'trim' },      // roof top, front slope
    { s: 'wedge', d: [3.5, 1.0, 3.0], at: [0, 8.3, -1.5], c: 'trim' },                       // roof top, back slope
    { s: 'box', d: [1.0, 1.0, 0.5], at: [0, 7.1, 3.15], c: 'white' },                        // dormer
    { s: 'box', d: [0.6, 0.6, 0.06], at: [0, 7.1, 3.43], c: 'glass' },                       // dormer window
    { s: 'wedge', d: [1.2, 0.4, 0.7], at: [0, 7.8, 3.15], rot: [0, 180, 0], c: 'trim' },     // dormer roof
  ];
}

// Ground floor basics: fascia band, door, window frame, glass, sill. Window spans x -0.55..1.45, door at x -1.1.
function shopGround(frame: Part['c'], door: Part['c']): Part[] {
  return [
    { s: 'box', d: [3.4, 0.5, 0.1], at: [0, 2.6, 3.0], c: frame },                // fascia
    { s: 'box', d: [0.8, 1.9, 0.06], at: [-1.1, 0.95, 3.0], c: door },             // door
    { s: 'box', d: [2.2, 1.6, 0.06], at: [0.45, 1.2, 3.0], c: frame },             // window frame
    { s: 'box', d: [2.0, 1.4, 0.06], at: [0.45, 1.2, 3.03], c: 'glass' },          // shop window
    { s: 'box', d: [2.14, 0.1, 0.3], at: [0.45, 0.45, 3.05], c: 'stone' },          // sill
  ];
}

export const GTA_EURO_BUILDINGS_D: readonly PrefabDef[] = [
  {
    id: 'euro-opera-hall', name: 'Opera Hall', category: 'prop', uses: ['place'],
    tags: ['opera', 'hall', 'theatre', 'concert', 'dome', 'portico', 'columns', 'radio', 'stone', 'building', 'gta', 'euro'], emoji: [],
    tint: 0xe8dcc0, trim: 0x4f7a6a,
    footprint: { r: 7, h: 13 },
    about: 'Gnome Theft Auto: Opera Hall, 16 x 14 x 13 with a 3 m portico apron on +z. Cream stone walls take the tint, the green copper dome takes the trim. Six columns, stepped stairs, pediment, gilded statues, glowing arched windows, roof radio mast.',
    examine: [
      'A grand cream hall with six columns, a green copper dome and tall windows that glow like a row of warm pastries.',
      'Saying: the opera is not over until the large gnome sings, and the large gnome is still finding the note.',
      'Tip: the radio mast on the roof belongs to the classical music station. Stand near it and everything feels slightly more important.',
      'Joke: the steps are wide so the audience can leave early in comfort. Most of them use every step.',
      'A tiny gold statue on the pediment holds a tiny gold trumpet. It has been out of tune since it was cast.',
    ],
    parts: [
      { s: 'box', d: [15.9, 8, 13.9], at: [0, 4, 0], c: 'tint' },                                       // hall
      { s: 'box', d: [16, 0.3, 14], at: [0, 8.1, 0], c: 'tint' },                                       // cornice
      { s: 'box', d: [13, 0.3, 3.05], at: [0, 0.15, 8.475], c: 'tint' },                                // steps, lowest
      { s: 'box', d: [12.8, 0.3, 2.45], at: [0, 0.45, 8.175], c: 'tint' },                              // steps, middle
      { s: 'box', d: [12.6, 0.3, 1.85], at: [0, 0.75, 7.875], c: 'tint' },                              // steps, top
      { s: 'cyl', d: [0.4, 0.4, 5.7], at: [5.5, 3.7, 8.4], c: 'tint', seg: 8, mirror: true },           // portico columns
      { s: 'cyl', d: [0.4, 0.4, 5.7], at: [3.3, 3.7, 8.4], c: 'tint', seg: 8, mirror: true },
      { s: 'cyl', d: [0.4, 0.4, 5.7], at: [1.1, 3.7, 8.4], c: 'tint', seg: 8, mirror: true },
      { s: 'box', d: [12.4, 0.6, 2.2], at: [0, 6.8, 8.0], c: 'tint' },                                   // entablature
      { s: 'cyl', d: [7.16, 7.16, 1.6], at: [0, 7.65, 8.0], rot: [-90, 0, 0], scale: [1, 1, 0.149], c: 'trim', seg: 3 }, // pediment
      { s: 'pill', d: [0.2, 0.6], at: [5.9, 7.58, 8.0], c: 'gold', seg: 6, mirror: true },             // statues
      { s: 'ball', d: [0.25], at: [5.9, 8.4, 8.0], c: 'gold', seg: 6, mirror: true },
      { s: 'box', d: [2, 3, 0.06], at: [0, 2.4, 7.0], c: 'wood-dark' },                                 // great door
      { s: 'box', d: [1.0, 3.2, 0.06], at: [2.8, 3.6, 7.0], c: WARM, glow: true, mirror: true },        // arched windows
      { s: 'cyl', d: [0.5, 0.5, 0.06], at: [2.8, 5.2, 7.0], rot: [90, 0, 0], c: WARM, glow: true, seg: 8, mirror: true },
      { s: 'box', d: [1.0, 3.2, 0.06], at: [6.3, 3.6, 7.0], c: WARM, glow: true, mirror: true },
      { s: 'cyl', d: [0.5, 0.5, 0.06], at: [6.3, 5.2, 7.0], rot: [90, 0, 0], c: WARM, glow: true, seg: 8, mirror: true },
      { s: 'cyl', d: [3.5, 3.5, 1.4], at: [0, 8.95, -1], c: 'tint', seg: 10 },                          // drum
      { s: 'ball', d: [3.4], at: [0, 9.65, -1], scale: [1, 0.9, 1], c: 'trim', seg: 10 },               // copper dome
      { s: 'cyl', d: [0.08, 0.08, 4.85], at: [-6, 10.375, -4], c: 'iron', seg: 6 },                     // radio mast
      { s: 'ball', d: [0.15], at: [-6, 12.85, -4], c: 'red', glow: true, seg: 6 },                      // mast light
    ],
  },
  {
    id: 'euro-canal-boathouse', name: 'Canal Boathouse', category: 'prop', uses: ['place'],
    tags: ['boathouse', 'canal', 'boat', 'jetty', 'timber', 'stilts', 'wood', 'slipway', 'water', 'building', 'gta', 'euro'], emoji: [],
    tint: 0x6b4a32, trim: 0x9a5a3c,
    footprint: { r: 3, h: 5.5 },
    about: 'Gnome Theft Auto: Canal Boathouse, 6 x 8 x 5.5 with a 2.5 m jetty on +z. Dark plank walls take the tint, the pitched roof the trim. On stilts, open boat door, slipway, jetty on posts, rowing boat, life ring, rope coils.',
    examine: [
      'A dark timber boathouse on stilts with a wide open door, a plank jetty and a small rowing boat tied up beside it.',
      'Saying: a boat tied up is a boat that is thinking about it.',
      'Tip: the planks on the jetty are slippery after rain. In this city that is every plank, so walk like you mean it.',
      'Joke: the boat has not left since the last strike, and the strike was for better water.',
      'A coil of rope on the deck has been tied in a knot nobody can undo. The boathouse keeps it as a guest book.',
    ],
    parts: [
      { s: 'cyl', d: [0.12, 0.12, 1.0], at: [2.6, 0.5, 3.6], c: 'wood-dark', seg: 6, mirror: true },    // stilts, front
      { s: 'cyl', d: [0.12, 0.12, 1.0], at: [2.6, 0.5, -3.6], c: 'wood-dark', seg: 6, mirror: true },   // stilts, back
      { s: 'box', d: [5.9, 0.2, 7.9], at: [0, 1.0, 0], c: 'wood-dark' },                                 // floor
      { s: 'box', d: [5.8, 2.4, 7.8], at: [0, 2.3, 0], c: 'tint' },                                     // plank walls
      { s: 'box', d: [5.9, 0.08, 7.9], at: [0, 1.9, 0], c: 0x3d2a1a },                                  // plank bands
      { s: 'box', d: [5.9, 0.08, 7.9], at: [0, 2.8, 0], c: 0x3d2a1a },
      { s: 'wedge', d: [8.0, 1.9, 3.0], at: [1.5, 4.45, 0], rot: [0, -90, 0], c: 'trim' },              // roof, right slope
      { s: 'wedge', d: [8.0, 1.9, 3.0], at: [-1.5, 4.45, 0], rot: [0, 90, 0], c: 'trim' },              // roof, left slope
      { s: 'box', d: [0.3, 0.15, 7.9], at: [0, 5.43, 0], c: 'wood-dark' },                              // ridge
      { s: 'box', d: [3.4, 1.95, 0.06], at: [0, 2.075, 3.94], c: 'black' },                             // open boat door
      { s: 'box', d: [3.8, 0.2, 0.1], at: [0, 3.2, 3.95], c: 'wood-dark' },                             // lintel
      { s: 'box', d: [0.15, 2.1, 0.1], at: [1.8, 2.15, 3.95], c: 'wood-dark', mirror: true },           // door posts
      { s: 'box', d: [1.8, 1.0, 2.5], at: [-0.9, 0.5, 5.2], rot: [0, 180, 0], c: 'wood-light' },        // slipway ramp
      { s: 'box', d: [1.0, 0.1, 2.6], at: [2.3, 0.5, 5.2], c: 'wood-light' },                           // jetty deck
      { s: 'cyl', d: [0.07, 0.07, 0.6], at: [1.9, 0.3, 6.35], c: 'wood-dark', seg: 6 },                 // jetty posts
      { s: 'cyl', d: [0.07, 0.07, 0.6], at: [2.7, 0.3, 6.35], c: 'wood-dark', seg: 6 },
      { s: 'cyl', d: [0.07, 0.07, 0.6], at: [1.9, 0.3, 4.3], c: 'wood-dark', seg: 6 },
      { s: 'cyl', d: [0.07, 0.07, 0.6], at: [2.7, 0.3, 4.3], c: 'wood-dark', seg: 6 },
      { s: 'ball', d: [1], at: [0.85, 0.25, 5.4], scale: [0.4, 0.25, 1.1], c: 'blue', seg: 8 },         // rowing boat hull
      { s: 'box', d: [0.7, 0.05, 0.15], at: [0.85, 0.33, 5.4], c: 'wood-light' },                       // boat seat
      { s: 'ring', d: [0.28, 0.07], at: [2.3, 2.6, 3.95], c: 'white', seg: 8 },                         // life ring
      { s: 'ring', d: [0.18, 0.05], at: [2.3, 0.6, 4.6], rot: [90, 0, 0], c: 'burlap', seg: 8 },        // rope coils
      { s: 'ring', d: [0.15, 0.05], at: [2.3, 0.6, 5.7], rot: [90, 0, 0], c: 'burlap', seg: 8 },
    ],
  },
  {
    id: 'euro-shopfront-cheese', name: 'Cheese Shop', category: 'prop', uses: ['place'],
    tags: ['cheese', 'shop', 'shopfront', 'awning', 'terrace', 'mansard', 'dairy', 'building', 'gta', 'euro'], emoji: [],
    tint: 0xf3e6c4, trim: 0x5a6470,
    footprint: { r: 1.8, h: 8.8 },
    about: 'Gnome Theft Auto: Cheese Shop, narrow terrace shopfront 3.6 x 6 x 8.8. Cream walls take the tint, the slate mansard the trim. Yellow-and-white striped awning, cheese wheels in the window, cheese wheel sign.',
    examine: [
      'A narrow cream shop with a yellow and white awning and wheels of cheese stacked in the window like cart wheels for a very slow cart.',
      'Saying: a gnome with cheese is never lost, only a short walk from lunch.',
      'Tip: ask for a taste first. The shop has forty cheeses and every one is, officially, mild.',
      'Joke: open from ten until lunch, and lunch is until tomorrow.',
      'One wheel in the window has a small neat bite out of it. The sign says it is part of the display.',
    ],
    parts: [
      ...shopfrontFrame(),
      ...shopGround('wood-dark', 'wood'),
      { s: 'wedge', d: [0.4, 0.5, 1.0], at: [0.2, 2.25, 3.5], rot: [0, 180, 0], c: 'yellow', mirror: true }, // awning stripes
      { s: 'wedge', d: [0.4, 0.5, 1.0], at: [0.6, 2.25, 3.5], rot: [0, 180, 0], c: 'white', mirror: true },
      { s: 'wedge', d: [0.4, 0.5, 1.0], at: [1.0, 2.25, 3.5], rot: [0, 180, 0], c: 'yellow', mirror: true },
      { s: 'wedge', d: [0.4, 0.5, 1.0], at: [1.4, 2.25, 3.5], rot: [0, 180, 0], c: 'white', mirror: true },
      { s: 'cyl', d: [0.4, 0.4, 0.2], at: [0.2, 0.6, 3.2], c: 'honey', seg: 8 },                           // cheese wheels
      { s: 'cyl', d: [0.32, 0.32, 0.2], at: [0.2, 0.8, 3.2], c: 'yellow', seg: 8 },
      { s: 'cyl', d: [0.3, 0.3, 0.2], at: [1.0, 0.6, 3.2], c: 'yellow', seg: 8 },
      { s: 'cyl', d: [0.28, 0.28, 0.06], at: [0, 2.6, 3.08], rot: [90, 0, 0], c: 'honey', seg: 8 },       // cheese wheel sign
      { s: 'ball', d: [0.05], at: [0.08, 2.68, 3.12], c: 'clay-dark', seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.08, 2.54, 3.12], c: 'clay-dark', seg: 6 },
    ],
  },
  {
    id: 'euro-shopfront-chemist', name: 'Chemist', category: 'prop', uses: ['place'],
    tags: ['chemist', 'pharmacy', 'shop', 'shopfront', 'cross', 'bottles', 'terrace', 'mansard', 'building', 'gta', 'euro'], emoji: [],
    tint: 0xdfe8e4, trim: 0x5a6470,
    footprint: { r: 1.8, h: 8.8 },
    about: 'Gnome Theft Auto: Chemist, narrow terrace shopfront 3.6 x 6 x 8.8. Pale green walls take the tint, the slate mansard the trim. White shop frame, glowing green cross on a bracket, bottles on a window shelf.',
    examine: [
      'A pale shop with a white frame, rows of coloured bottles in the window and a green cross that glows on a bracket over the street.',
      'Saying: a bottle with a label is a promise, a bottle without one is a surprise.',
      'Tip: the chemist knows a cure for everything. Ask for the one that works, and expect a long, calm answer.',
      'Joke: the queue outside is for nothing. It is just a good queue.',
      'A handwritten note in the window says "back in five minutes". The ink has faded to a pleasant brown.',
    ],
    parts: [
      ...shopfrontFrame(),
      ...shopGround('white', 'white'),
      { s: 'box', d: [1.9, 0.05, 0.2], at: [0.45, 1.25, 3.13], c: 'wood-light' },                          // window shelf
      { s: 'cyl', d: [0.07, 0.07, 0.3], at: [-0.1, 0.65, 3.1], c: 'glaze-green', seg: 6 },                // bottles, sill row
      { s: 'cyl', d: [0.07, 0.07, 0.3], at: [0.2, 0.65, 3.1], c: 'sapphire', seg: 6 },
      { s: 'cyl', d: [0.07, 0.07, 0.3], at: [0.5, 0.65, 3.1], c: 'honey', seg: 6 },
      { s: 'cyl', d: [0.07, 0.07, 0.3], at: [0.8, 0.65, 3.1], c: 'red', seg: 6 },
      { s: 'cyl', d: [0.07, 0.07, 0.3], at: [0.1, 1.43, 3.1], c: 'amethyst', seg: 6 },                     // bottles, shelf row
      { s: 'cyl', d: [0.07, 0.07, 0.3], at: [0.5, 1.43, 3.1], c: 'glaze-blue', seg: 6 },
      { s: 'cyl', d: [0.07, 0.07, 0.3], at: [0.9, 1.43, 3.1], c: 'glaze-green', seg: 6 },
      { s: 'box', d: [0.08, 0.08, 0.7], at: [1.3, 2.4, 3.33], c: 'iron-dark' },                             // sign bracket
      { s: 'box', d: [0.15, 0.7, 0.1], at: [1.3, 2.4, 3.65], c: 'emerald', glow: true },                  // green cross
      { s: 'box', d: [0.7, 0.15, 0.1], at: [1.3, 2.4, 3.65], c: 'emerald', glow: true },
    ],
  },
  {
    id: 'euro-shopfront-antiques', name: 'Antiques Shop', category: 'prop', uses: ['place'],
    tags: ['antiques', 'shop', 'shopfront', 'clock', 'lamp', 'chair', 'junk', 'terrace', 'mansard', 'building', 'gta', 'euro'], emoji: [],
    tint: 0xe9d3c0, trim: 0x7b8691,
    footprint: { r: 1.8, h: 8.8 },
    about: 'Gnome Theft Auto: Antiques Shop, narrow terrace shopfront 3.6 x 6 x 8.8. Peach walls take the tint, the grey mansard the trim. Dark frame, cluttered window (clock, lamp, chair), hanging sign, battered armchair out front.',
    examine: [
      'A dark-framed shop with a window packed with a clock, a lamp and a chair, and a battered armchair left out front.',
      'Saying: everything in here was somebody\'s favourite once, and a few things still are.',
      'Tip: haggle. The price tag is only the first line of a very long conversation.',
      'Joke: the clock in the window is right twice a day. The owner says that is twice more than the clock next door.',
      'The armchair out front is not for sale. It is for sitting, and a small hat on the arm says someone is already doing it.',
    ],
    parts: [
      ...shopfrontFrame(),
      ...shopGround(0x2a2420, 0x2a2420),
      { s: 'cyl', d: [0.2, 0.2, 0.04], at: [0.0, 1.4, 3.08], rot: [90, 0, 0], c: 'white', seg: 10 },        // clock face
      { s: 'ring', d: [0.22, 0.04], at: [0.0, 1.4, 3.1], c: 'brass', seg: 10 },                            // clock rim
      { s: 'pill', d: [0.05, 0.3], at: [0.95, 0.85, 3.12], c: 'brass', seg: 6 },                           // lamp stand
      { s: 'cone', d: [0.22, 0.25], at: [0.95, 1.2, 3.12], c: 'cloth', seg: 8 },                           // lamp shade
      { s: 'box', d: [0.35, 0.05, 0.35], at: [0.4, 0.75, 3.2], c: 'wood' },                                // window chair seat
      { s: 'box', d: [0.35, 0.5, 0.05], at: [0.4, 1.0, 3.07], c: 'wood' },                                 // window chair back
      { s: 'box', d: [0.28, 0.2, 0.28], at: [0.4, 0.62, 3.2], c: 'wood-dark' },                            // window chair legs
      { s: 'box', d: [0.06, 0.06, 0.9], at: [1.4, 3.0, 3.45], c: 'iron-dark' },                            // hanging sign arm
      { s: 'box', d: [0.06, 0.55, 0.6], at: [1.4, 2.62, 3.6], c: 'wood-light' },                           // hanging sign
      { s: 'box', d: [0.7, 0.4, 0.6], at: [0.6, 0.2, 3.9], c: 0x7a2e3a },                                  // armchair seat
      { s: 'box', d: [0.7, 0.55, 0.15], at: [0.6, 0.55, 3.62], rot: [-10, 0, 0], c: 0x7a2e3a },           // armchair back
      { s: 'box', d: [0.12, 0.3, 0.54], at: [0.2, 0.5, 3.9], c: 0x6a2530 },                                // armchair arms
      { s: 'box', d: [0.12, 0.3, 0.54], at: [1.0, 0.5, 3.9], c: 0x6a2530 },
    ],
  },
];
