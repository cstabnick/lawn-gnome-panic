// Gnome Theft Auto: European kit, shops and booths (E29, docs/roadmaps/gta-batch-3/E29/). Life-size metres, front on +z.
// Walls take `tint`, roofs take `trim`. Nothing goes past x = +-width/2 so they pack into a terrace.
import type { PrefabDef } from '../types';

export const GTA_EURO_BUILDINGS_B: readonly PrefabDef[] = [
  {
    id: 'euro-bakery', name: 'Bakery', category: 'prop', uses: ['place'],
    tags: ['bakery', 'bread', 'baguette', 'shop', 'building', 'pastry', 'loaf', 'awning', 'gta', 'euro'], emoji: [],
    tint: 0xe6dcb8, trim: 0x5a6470,
    footprint: { r: 2.25, h: 7.2 },
    about: 'Gnome Theft Auto: the Bakery. Two storeys, cream walls (tint), low slate roof (trim) with one chimney. Painted shopfront with a window of loaves, a scalloped red awning, a baguette sign and a bread crate.',
    examine: [
      'A cream two-storey shop with a painted wooden front, a window full of loaves, and a baguette as long as a gnome hanging over the door.',
      'Saying: bread is ready when the queue says so, not when the oven does.',
      'Tip: come early. By ten the good loaves are gone, and by eleven so is the baker.',
      'Joke: the sign says open from six, and it is true, because it never says which day.',
      'There is a very small crate by the door holding yesterday\'s loaves. They are labelled "still good", with no evidence.',
    ],
    parts: [
      { s: 'box', d: [4.4, 6.6, 5.9], at: [0, 3.3, 0], c: 'tint' },                                   // walls
      { s: 'box', d: [4.5, 0.12, 6.0], at: [0, 3.5, 0], c: 'trim' },                                  // floor band
      { s: 'box', d: [4.5, 0.3, 6.0], at: [0, 6.75, 0], c: 'trim' },                                  // slate roof
      { s: 'box', d: [0.5, 0.5, 0.5], at: [1.4, 7.05, -1.5], c: 'stone' },                            // chimney
      { s: 'box', d: [3.8, 2.6, 0.12], at: [0, 1.3, 3.0], c: 0x6b4a3a },                              // shopfront frame
      { s: 'box', d: [2.0, 1.3, 0.04], at: [-0.7, 1.45, 3.22], c: 'glass' },                          // shop window
      { s: 'box', d: [1.8, 0.06, 0.2], at: [-0.7, 1.1, 3.12], c: 'wood-dark' },                       // shelf low
      { s: 'box', d: [1.8, 0.06, 0.2], at: [-0.7, 1.65, 3.12], c: 'wood-dark' },                      // shelf high
      { s: 'pill', d: [0.07, 0.3], at: [-1.2, 1.21, 3.12], rot: [0, 0, 90], c: 0xc99a55, seg: 6 },    // loaves
      { s: 'pill', d: [0.07, 0.3], at: [-0.7, 1.21, 3.12], rot: [0, 0, 90], c: 0xc99a55, seg: 6 },
      { s: 'pill', d: [0.07, 0.3], at: [-0.2, 1.21, 3.12], rot: [0, 0, 90], c: 0xb5803f, seg: 6 },
      { s: 'ball', d: [0.1], at: [-1.1, 1.78, 3.12], c: 0xd9a95f, seg: 6 },
      { s: 'ball', d: [0.1], at: [-0.5, 1.78, 3.12], c: 0xd9a95f, seg: 6 },
      { s: 'ball', d: [0.1], at: [0.0, 1.78, 3.12], c: 0xb5803f, seg: 6 },
      { s: 'box', d: [0.8, 1.9, 0.05], at: [1.2, 0.95, 3.095], c: 0x3c5a73 },                         // door
      { s: 'box', d: [0.5, 0.5, 0.04], at: [1.2, 1.35, 3.13], c: 'glass' },                           // door pane
      { s: 'box', d: [0.8, 1.0, 0.12], at: [1.0, 5.0, 3.0], c: 'glass', mirror: true },               // upper windows
      { s: 'wedge', d: [3.9, 0.4, 1.2], at: [0, 2.7, 3.57], rot: [0, 180, 0], c: 'red' },             // awning
      { s: 'ball', d: [0.13], at: [-1.6, 2.58, 4.17], c: 'red', seg: 6, mirror: true },               // scallops
      { s: 'ball', d: [0.13], at: [-0.8, 2.58, 4.17], c: 'red', seg: 6, mirror: true },
      { s: 'ball', d: [0.13], at: [0, 2.58, 4.17], c: 'red', seg: 6 },
      { s: 'box', d: [0.06, 0.06, 1.1], at: [1.0, 3.55, 3.45], c: 'iron-dark' },                      // sign bracket
      { s: 'box', d: [0.03, 0.2, 0.03], at: [1.0, 3.45, 3.85], c: 'iron-dark' },                      // sign chain
      { s: 'pill', d: [0.12, 1.0], at: [1.0, 3.28, 3.85], rot: [0, 0, 90], c: 0xd9a95f, seg: 6 },     // baguette sign
      { s: 'box', d: [0.5, 0.35, 0.4], at: [1.95, 0.175, 3.4], c: 'wood' },                           // bread crate
      { s: 'pill', d: [0.06, 0.25], at: [1.95, 0.42, 3.4], rot: [0, 0, 90], c: 0xc99a55, seg: 6 },    // crate loaf
    ],
  },
  {
    id: 'euro-bistro', name: 'Bistro', category: 'prop', uses: ['place'],
    tags: ['bistro', 'cafe', 'restaurant', 'coffee', 'table', 'awning', 'shop', 'building', 'gta', 'euro'], emoji: [],
    tint: 0xd9e2d3, trim: 0x4a4f57,
    footprint: { r: 2.5, h: 7.4 },
    about: 'Gnome Theft Auto: the Bistro. Two storeys, pale green walls (tint), grey roof (trim). Deep red shopfront, lace curtains, a long red awning with glowing lamps, a round table with two chairs, a chalkboard easel and two bay trees.',
    examine: [
      'A pale green corner of tables and lace, with a long red awning, a round table out front, and a chalkboard that changes its mind hourly.',
      'Saying: a coffee is not a drink, it is an argument you have with yourself, slowly, in public.',
      'Tip: sit outside under the lamps. Inside there are only opinions, and they are served cold.',
      'Joke: the waiter will be with you shortly. He has been with you shortly since the spring.',
      'One of the two chairs has a cushion that nobody sits on. The staff say it is reserved, and will not say for whom.',
    ],
    parts: [
      { s: 'box', d: [4.9, 6.8, 5.9], at: [0, 3.4, 0], c: 'tint' },                                   // walls
      { s: 'box', d: [5.0, 0.12, 6.0], at: [0, 3.5, 0], c: 'trim' },                                  // floor band
      { s: 'box', d: [5.0, 0.4, 6.0], at: [0, 7.0, 0], c: 'trim' },                                   // roof
      { s: 'box', d: [4.2, 2.7, 0.12], at: [0, 1.35, 3.0], c: 0x7a1f26 },                             // shopfront frame
      { s: 'box', d: [0.9, 1.9, 0.05], at: [0, 0.95, 3.095], c: 'wood-dark' },                        // door
      { s: 'box', d: [1.4, 1.4, 0.05], at: [1.3, 1.5, 3.09], c: 'glass', mirror: true },              // windows
      { s: 'box', d: [1.4, 0.6, 0.04], at: [1.3, 1.15, 3.14], c: 'white', alpha: 0.85, mirror: true }, // lace curtains
      { s: 'box', d: [1.0, 1.1, 0.12], at: [1.3, 5.0, 3.0], c: 'glass', mirror: true },               // upper windows
      { s: 'box', d: [0.9, 1.1, 0.12], at: [0, 5.0, 3.0], c: 'glass' },
      { s: 'wedge', d: [4.4, 0.45, 1.8], at: [0, 2.78, 3.87], rot: [0, 180, 0], c: 0xb33a3a },         // awning
      { s: 'ball', d: [0.07], at: [0, 2.5, 4.8], c: 'spark', glow: true, seg: 6 },                    // lamp string
      { s: 'ball', d: [0.07], at: [0.7, 2.5, 4.8], c: 'spark', glow: true, seg: 6, mirror: true },
      { s: 'ball', d: [0.07], at: [1.4, 2.5, 4.8], c: 'spark', glow: true, seg: 6, mirror: true },
      { s: 'ball', d: [0.07], at: [2.0, 2.5, 4.8], c: 'spark', glow: true, seg: 6, mirror: true },
      { s: 'cyl', d: [0.38, 0.38, 0.05], at: [0, 0.73, 4.3], c: 'wood-light', seg: 10 },               // table top
      { s: 'cyl', d: [0.04, 0.04, 0.7], at: [0, 0.35, 4.3], c: 'iron-dark', seg: 6 },                 // table pole
      { s: 'cyl', d: [0.2, 0.2, 0.05], at: [0, 0.025, 4.3], c: 'iron-dark', seg: 8 },                 // table foot
      { s: 'box', d: [0.4, 0.05, 0.4], at: [0.7, 0.45, 4.3], c: 'wood', mirror: true },               // chair seats
      { s: 'box', d: [0.04, 0.45, 0.4], at: [0.9, 0.7, 4.3], c: 'wood', mirror: true },               // chair backs
      { s: 'cyl', d: [0.03, 0.03, 0.43], at: [0.7, 0.215, 4.3], c: 'wood-dark', seg: 5, mirror: true }, // chair legs
      { s: 'box', d: [0.7, 1.0, 0.04], at: [1.95, 0.55, 3.7], rot: [-10, 0, 0], c: 'wood' },          // easel frame
      { s: 'box', d: [0.56, 0.8, 0.04], at: [1.95, 0.6, 3.74], rot: [-10, 0, 0], c: 'black' },        // chalkboard
      { s: 'box', d: [0.05, 0.9, 0.05], at: [1.95, 0.45, 3.45], rot: [20, 0, 0], c: 'wood-dark' },    // easel leg
      { s: 'cyl', d: [0.22, 0.17, 0.35], at: [0.75, 0.175, 3.4], c: 'terracotta', seg: 8, mirror: true }, // bay tree pots
      { s: 'cyl', d: [0.04, 0.05, 0.8], at: [0.75, 0.75, 3.4], c: 'bark', seg: 5, mirror: true },     // trunks
      { s: 'ball', d: [0.32], at: [0.75, 1.4, 3.4], c: 'leaf-dark', seg: 6, mirror: true },           // crowns
    ],
  },
  {
    id: 'euro-tabac-kiosk', name: 'Tabac Kiosk', category: 'prop', uses: ['place'],
    tags: ['kiosk', 'tabac', 'newspaper', 'stand', 'postcard', 'shop', 'octagon', 'booth', 'gta', 'euro'], emoji: [],
    tint: 0x2f5a3a, trim: 0xb08d3a,
    footprint: { r: 1.2, h: 3.2 },
    about: 'Gnome Theft Auto: the Tabac Kiosk. A freestanding octagonal kiosk, dark green walls (tint), a gold-ish conical roof (trim) with a finial. Serving hatch on +z with a shelf, newspapers and a striped canopy; a postcard rack on the +x side.',
    examine: [
      'A small green eight-sided hut with a gold hat, a serving hatch, a stack of papers, and a rack of postcards from places that may not exist.',
      'Saying: the kiosk knows everything and sells only the news, which is a kindness.',
      'Tip: the hatch is open when the owner is in, and the owner is in when the hatch is open. Wait for one to cause the other.',
      'Joke: the newspapers are all the same one, printed on different days and never read.',
      'One postcard shows a beach. Nobody has ever found the beach, but the card has been sold eleven times.',
    ],
    parts: [
      { s: 'cyl', d: [1.3, 1.3, 0.12], at: [0, 0.06, 0], rot: [0, 22.5, 0], c: 'stone-dark', seg: 8 },  // plinth
      { s: 'cyl', d: [1.25, 1.25, 2.3], at: [0, 1.15, 0], rot: [0, 22.5, 0], c: 'tint', seg: 8 },      // octagonal body
      { s: 'cone', d: [1.3, 0.6], at: [0, 2.62, 0], rot: [0, 22.5, 0], c: 'trim', seg: 8 },            // roof
      { s: 'cone', d: [0.07, 0.3], at: [0, 3.05, 0], c: 'gold', seg: 6 },                              // finial spike
      { s: 'ball', d: [0.1], at: [0, 2.96, 0], c: 'gold', seg: 6 },                                    // finial ball
      { s: 'box', d: [0.8, 0.7, 0.06], at: [0, 1.5, 1.18], c: 'black' },                               // hatch opening
      { s: 'box', d: [0.9, 0.06, 0.3], at: [0, 1.1, 1.3], c: 'wood' },                                 // shelf
      { s: 'box', d: [0.4, 0.1, 0.28], at: [-0.17, 1.18, 1.32], c: 'chalk' },                            // newspapers
      { s: 'box', d: [0.34, 0.08, 0.24], at: [0.25, 1.17, 1.3], c: 'paper' },
      { s: 'wedge', d: [0.25, 0.25, 0.6], at: [0.125, 2.0, 1.45], rot: [0, 180, 0], c: 'white', mirror: true }, // canopy stripes
      { s: 'wedge', d: [0.25, 0.25, 0.6], at: [0.375, 2.0, 1.45], rot: [0, 180, 0], c: 'red', mirror: true },
      { s: 'box', d: [0.07, 0.8, 0.5], at: [1.18, 1.1, 0], c: 'iron-dark' },                            // postcard rack
      { s: 'box', d: [0.04, 0.14, 0.4], at: [1.21, 1.3, 0], c: 'yellow' },                             // postcards
      { s: 'box', d: [0.04, 0.14, 0.4], at: [1.21, 1.0, 0], c: 'sapphire' },
    ],
  },
  {
    id: 'euro-post-booth', name: 'Post and Natter Booth', category: 'prop', uses: ['place'],
    tags: ['booth', 'post', 'phone', 'telephone', 'letterbox', 'yellow', 'box', 'acorn', 'gta', 'euro'], emoji: [],
    tint: 0xd8b632, trim: 0x222222,
    footprint: { r: 0.6, h: 2.8 },
    about: 'Gnome Theft Auto: the Post and Natter Booth. A tall yellow box (tint) with a black domed top (trim) and an acorn finial. Glazed door with bars, a letter slot and an out-of-order plaque, and a receiver inside.',
    examine: [
      'A tall yellow box with a black domed top, a door of little glass squares, a letter slot, and an acorn where a crown should be.',
      'Saying: a message posted is a message half delivered, and a call made is a call half heard.',
      'Tip: the plaque says out of order. The booth works. The plaque is the part that is out of order.',
      'Joke: it is a phone box and a post box, so every call arrives late and every letter arrives talking.',
      'The receiver inside swings slightly, though the door is shut and there is no wind.',
    ],
    parts: [
      { s: 'box', d: [1.15, 0.1, 1.15], at: [0, 0.05, 0], c: 'trim' },                                // base
      { s: 'box', d: [1.08, 2.3, 0.1], at: [0, 1.15, -0.5], c: 'tint' },                              // back wall
      { s: 'box', d: [0.1, 2.3, 1.0], at: [0.5, 1.15, 0], c: 'tint', mirror: true },                  // side walls
      { s: 'box', d: [0.12, 2.3, 0.12], at: [0.5, 1.15, 0.5], c: 'tint', mirror: true },              // door posts
      { s: 'box', d: [0.86, 0.5, 0.06], at: [0, 0.3, 0.5], c: 'tint' },                               // lower panel
      { s: 'box', d: [0.86, 1.6, 0.04], at: [0, 1.35, 0.5], c: 'glass' },                             // door glass
      { s: 'box', d: [0.8, 0.04, 0.1], at: [0, 0.95, 0.55], c: 'tint' },                              // glazing bars (0.8 wide, clear of the glass edges)
      { s: 'box', d: [0.8, 0.04, 0.1], at: [0, 1.5, 0.55], c: 'tint' },
      { s: 'box', d: [0.8, 0.04, 0.1], at: [0, 2.05, 0.55], c: 'tint' },
      { s: 'box', d: [0.04, 1.52, 0.1], at: [0, 1.35, 0.55], c: 'tint' },                              // centre bar (stops 0.04 short of glass top and bottom)
      { s: 'box', d: [0.3, 0.05, 0.04], at: [0, 0.42, 0.57], c: 'black' },                            // letter slot
      { s: 'box', d: [0.3, 0.16, 0.04], at: [0, 0.2, 0.57], c: 'white' },                             // out of order plaque
      { s: 'box', d: [0.2, 0.3, 0.05], at: [0, 1.5, -0.4], c: 'iron-dark' },                          // phone cradle
      { s: 'pill', d: [0.04, 0.18], at: [0.1, 1.45, -0.35], rot: [0, 0, 20], c: 'black', seg: 6 },    // receiver
      { s: 'ball', d: [0.6], at: [0, 2.5, 0], scale: [1, 0.45, 1], c: 'trim', seg: 10 },              // dome
      { s: 'ball', d: [0.08], at: [0, 2.84, 0], scale: [1, 1.2, 1], c: 'wood-light', seg: 6 },        // acorn nut
      { s: 'ball', d: [0.09], at: [0, 2.92, 0], scale: [1, 0.5, 1], c: 'wood-dark', seg: 6 },         // acorn cap
    ],
  },
];
