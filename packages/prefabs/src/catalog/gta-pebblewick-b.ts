// Gnome Theft Auto, Pebblewick (docs/roadmaps/gta-outskirts-town.md): the workshop, water tower, bus shelter, welcome sign and dry plot.
import type { PrefabDef } from '../types';

export const GTA_PEBBLEWICK_B: readonly PrefabDef[] = [
  {
    id: 'pebblewick-workshop', name: "Ratchet's Mower & Dew", category: 'prop', uses: ['place'],
    tags: ['pebblewick', 'gta', 'workshop', 'garage', 'shed', 'tyre', 'wrench', 'tools', 'adobe', 'town'], emoji: [],
    tint: 0xc98f5e, trim: 0x9aa3a8,
    footprint: { r: 5, h: 5 },
    about: 'Gnome Theft Auto: Ratchet\'s workshop in Pebblewick. Life-size metres, front on +z. Adobe walls take the tint, a ribbed tin roof and the half-rolled door take the trim. Open front below 3.5 m, a workbench, a stack of tyres and a hanging wrench sign inside.',
    examine: [
      'A shed with its front half open, a ribbed tin roof, and a workbench at the back covered in small brass shavings.',
      'Saying: a tool left out overnight has been lent to the wind, and the wind always brings it back rusted.',
      'Tip: the half-rolled door is heavier than it looks. Roll it up before you glare at it.',
      'Joke: three tyres are stacked by the wall. Nobody remembers who had the fourth, and nobody asks.',
      'A wrench hangs over the opening on a hook. It has never once tightened anything, but it swings beautifully in a breeze.',
    ],
    parts: [
      { s: 'box', d: [9.8, 5, 0.4], at: [0, 2.5, -3.75], c: 'tint' },                             // back wall
      { s: 'box', d: [0.4, 5, 7.6], at: [4.8, 2.5, 0.1], c: 'tint', mirror: true },               // side walls
      { s: 'box', d: [9.8, 1.5, 0.4], at: [0, 4.25, 3.75], c: 'tint' },                           // front wall, above the opening
      { s: 'box', d: [0.5, 0.3, 7.8], at: [0.5, 5.1, -0.05], c: 0x9aa3a8, mirror: true },         // corrugated roof ribs
      { s: 'box', d: [0.5, 0.3, 7.8], at: [1.5, 5.1, -0.05], c: 0x9aa3a8, mirror: true },
      { s: 'box', d: [0.5, 0.3, 7.8], at: [2.5, 5.1, -0.05], c: 0x9aa3a8, mirror: true },
      { s: 'box', d: [0.5, 0.3, 7.8], at: [3.5, 5.1, -0.05], c: 0x9aa3a8, mirror: true },
      { s: 'box', d: [0.5, 0.3, 7.8], at: [4.5, 5.1, -0.05], c: 0x9aa3a8, mirror: true },
      { s: 'cyl', d: [0.35, 0.35, 9.4], at: [0, 3.6, 3.6], rot: [0, 0, 90], c: 'trim', seg: 8 }, // half-rolled door
      { s: 'box', d: [3.0, 0.15, 1.0], at: [-3.0, 1.125, -2.8], c: 'wood' },                     // workbench top
      { s: 'box', d: [0.15, 1.05, 0.9], at: [-4.3, 0.525, -2.8], c: 'wood-dark' },                // workbench legs
      { s: 'box', d: [0.15, 1.05, 0.9], at: [-1.7, 0.525, -2.8], c: 'wood-dark' },
      { s: 'ring', d: [0.5, 0.15], at: [3.2, 0.15, -2.8], rot: [90, 0, 0], c: 0x222222, seg: 8 }, // tyres
      { s: 'ring', d: [0.5, 0.15], at: [3.2, 0.45, -2.8], rot: [90, 0, 0], c: 0x222222, seg: 8 },
      { s: 'ring', d: [0.5, 0.15], at: [3.2, 0.75, -2.8], rot: [90, 0, 0], c: 0x222222, seg: 8 },
      { s: 'box', d: [1.0, 0.7, 0.1], at: [-2.9, 2.7, 3.6], c: 'yellow' },                        // wrench sign plate
      { s: 'cyl', d: [0.06, 0.06, 0.9], at: [-2.9, 2.7, 3.7], c: 'iron', seg: 6 },                // wrench shaft
    ],
  },
  {
    id: 'pebblewick-water-tower', name: 'Water Tower', category: 'prop', uses: ['place'],
    tags: ['pebblewick', 'gta', 'water', 'tower', 'tank', 'tin', 'ladder', 'town', 'desert'], emoji: [],
    tint: 0xb9c3c9, trim: 'wood-dark',
    footprint: { r: 3, h: 16 },
    about: 'Gnome Theft Auto: the Water Tower of Pebblewick. Life-size metres, front on +z. Four legs and cross braces (trim wood-dark), a tin tank and conical cap (tint 0xb9c3c9), a walkway ring, a ladder up the front leg and a red valve wheel on a standpipe.',
    examine: [
      'Four tall legs carry a tin tank as wide as a bath, with a little ladder and a red valve wheel at the front.',
      'Saying: whoever climbs the water tower sees the whole town, and whoever sees the whole town starts planning to leave it.',
      'Tip: the ladder rungs are spaced for a gnome in a hurry, so take them one at a time and do not look down.',
      'Joke: the tank holds a great deal of water, which is more than can be said for the promises made to fill it.',
      'Every so often the tank sighs and a cold drop falls from the rim. The gnomes call this the tower clearing its throat.',
    ],
    parts: [
      { s: 'cyl', d: [0.18, 0.18, 10], at: [2.4, 5, 2.4], c: 'trim', seg: 8, mirror: true },       // legs, front pair
      { s: 'cyl', d: [0.18, 0.18, 10], at: [2.4, 5, -2.4], c: 'trim', seg: 8, mirror: true },      // legs, back pair
      { s: 'box', d: [4.8, 0.12, 0.12], at: [0, 3, 2.4], c: 'trim' },                             // cross braces, low ring
      { s: 'box', d: [4.8, 0.12, 0.12], at: [0, 3, -2.4], c: 'trim' },
      { s: 'box', d: [0.12, 0.12, 4.8], at: [2.4, 3, 0], c: 'trim', mirror: true },
      { s: 'box', d: [4.8, 0.12, 0.12], at: [0, 7, 2.4], c: 'trim' },                             // cross braces, high ring
      { s: 'box', d: [4.8, 0.12, 0.12], at: [0, 7, -2.4], c: 'trim' },
      { s: 'box', d: [0.12, 0.12, 4.8], at: [2.4, 7, 0], c: 'trim', mirror: true },
      { s: 'box', d: [5.2, 0.2, 5.2], at: [0, 10.1, 0], c: 'trim' },                              // platform
      { s: 'cyl', d: [2.4, 2.8, 4], at: [0, 12.2, 0], c: 'tint', seg: 10 },                       // tank
      { s: 'cone', d: [2.5, 1.8], at: [0, 15.1, 0], c: 'tint', seg: 10 },                         // conical cap to 16
      { s: 'ring', d: [2.6, 0.1], at: [0, 10.3, 0], rot: [90, 0, 0], c: 'trim', seg: 8 },          // walkway ring
      { s: 'cyl', d: [0.04, 0.04, 10], at: [2.0, 5, 2.85], c: 'trim', seg: 6 },                   // ladder rails
      { s: 'cyl', d: [0.04, 0.04, 10], at: [2.8, 5, 2.85], c: 'trim', seg: 6 },
      { s: 'box', d: [0.8, 0.05, 0.05], at: [2.4, 1.5, 2.85], c: 'trim' },                         // ladder rungs
      { s: 'box', d: [0.8, 0.05, 0.05], at: [2.4, 3.0, 2.85], c: 'trim' },
      { s: 'box', d: [0.8, 0.05, 0.05], at: [2.4, 4.5, 2.85], c: 'trim' },
      { s: 'box', d: [0.8, 0.05, 0.05], at: [2.4, 6.0, 2.85], c: 'trim' },
      { s: 'box', d: [0.8, 0.05, 0.05], at: [2.4, 7.5, 2.85], c: 'trim' },
      { s: 'box', d: [0.8, 0.05, 0.05], at: [2.4, 9.0, 2.85], c: 'trim' },
      { s: 'cyl', d: [0.18, 0.18, 1.3], at: [0, 0.65, 2.6], c: 'iron', seg: 8 },                    // standpipe
      { s: 'ring', d: [0.2, 0.05], at: [0, 1.1, 2.85], c: 0xc0392b, seg: 8 },                     // valve wheel
    ],
  },
  {
    id: 'pebblewick-bus-shelter', name: 'Bus Shelter', category: 'prop', uses: ['place'],
    tags: ['pebblewick', 'gta', 'bus', 'shelter', 'bench', 'timetable', 'stop', 'town'], emoji: [],
    tint: 0xd9a441, trim: 'wood-dark',
    footprint: { r: 2, h: 2.8 },
    about: 'Gnome Theft Auto: the Bus Shelter in Pebblewick. Life-size metres, front on +z, open front. Walls and roof take the tint, a bench for two and a pole with a timetable board take the trim and paper.',
    examine: [
      'A small open-fronted shelter with yellow walls, a bench for two gnomes, and a timetable board on a pole by the corner.',
      'Saying: the bus comes when the bus comes, and the shelter is there so that waiting feels like a choice.',
      'Tip: the bench is for sitting and the board is for reading. Neither has ever been known to do the other\'s job.',
      'Joke: the timetable has not changed since the first bus, which is either very reliable or the first bus is still on its way.',
      'Someone has scratched a small gnome into the back wall, holding a bus in one hand and a sandwich in the other.',
    ],
    parts: [
      { s: 'box', d: [3.8, 2.65, 0.1], at: [0, 1.325, -0.9], c: 'tint' },                       // back wall
      { s: 'box', d: [0.1, 2.65, 1.7], at: [1.9, 1.325, -0.15], c: 'tint', mirror: true },       // side walls
      { s: 'box', d: [3.8, 0.2, 1.9], at: [0, 2.7, 0], c: 'tint' },                             // flat roof
      { s: 'box', d: [3.0, 0.1, 0.45], at: [0, 0.45, -0.55], c: 'trim' },                        // bench seat
      { s: 'box', d: [0.1, 0.42, 0.45], at: [1.2, 0.21, -0.55], c: 'trim', mirror: true },       // bench legs
      { s: 'cyl', d: [0.04, 0.04, 2.1], at: [1.8, 1.05, 0.9], c: 'trim', seg: 6 },               // timetable pole
      { s: 'box', d: [0.36, 0.6, 0.05], at: [1.8, 1.8, 0.9], c: 'paper' },                        // timetable board
    ],
  },
  {
    id: 'pebblewick-welcome-sign', name: 'Welcome Sign', category: 'prop', uses: ['place'],
    tags: ['pebblewick', 'gta', 'sign', 'welcome', 'board', 'sun', 'pepper', 'town', 'desert'], emoji: [],
    tint: 0xe8c27a, trim: 'wood-dark',
    footprint: { r: 3, h: 4 },
    about: 'Gnome Theft Auto: the Welcome Sign of Pebblewick. Life-size metres, front on +z. A wide board (tint) on two wooden posts (trim), with a painted yellow sun, two red peppers and a blank plaque under it.',
    examine: [
      'A broad painted board on two wooden posts, with a yellow sun, two red peppers, and a blank plaque hanging underneath.',
      'Saying: a sign that says welcome is only as good as the gnome who reads it, and the gnome is usually in a hurry.',
      'Tip: the posts are set deep and the board is not. Lean on the sign and it will lean back, with a creak.',
      'Joke: the plaque is blank so that every visitor can write their own opinion of Pebblewick on it.',
      'The peppers are painted so red that the local birds have tried to peck them, and given up in disgust.',
    ],
    parts: [
      { s: 'cyl', d: [0.12, 0.12, 3.8], at: [2.6, 1.9, 0], c: 'trim', seg: 6, mirror: true },   // posts
      { s: 'box', d: [4.1, 1.8, 0.2], at: [0, 2.6, 0], c: 'tint' },                              // board
      { s: 'cyl', d: [0.9, 0.9, 0.2], at: [2.05, 2.6, 0], rot: [90, 0, 0], c: 'tint', seg: 10, mirror: true }, // rounded ends
      { s: 'cyl', d: [0.45, 0.45, 0.04], at: [-1.2, 2.6, 0.15], rot: [90, 0, 0], c: 'yellow', seg: 10 }, // painted sun
      { s: 'box', d: [0.1, 0.3, 0.04], at: [-1.2, 3.2, 0.15], c: 'yellow' },                     // sun rays
      { s: 'box', d: [0.1, 0.3, 0.04], at: [-1.2, 2.0, 0.15], c: 'yellow' },
      { s: 'box', d: [0.3, 0.1, 0.04], at: [-1.8, 2.6, 0.15], c: 'yellow' },
      { s: 'box', d: [0.3, 0.1, 0.04], at: [-0.6, 2.6, 0.15], c: 'yellow' },
      { s: 'ball', d: [0.22], at: [1.35, 2.45, 0.15], scale: [1, 1, 0.5], c: 'red', seg: 8 },     // peppers
      { s: 'ball', d: [0.22], at: [1.85, 2.45, 0.15], scale: [1, 1, 0.5], c: 'red', seg: 8 },
      { s: 'box', d: [0.05, 0.12, 0.05], at: [1.35, 2.73, 0.15], c: 'green' },                    // pepper stems
      { s: 'box', d: [0.05, 0.12, 0.05], at: [1.85, 2.73, 0.15], c: 'green' },
      { s: 'box', d: [1.6, 0.5, 0.06], at: [0, 1.3, 0.05], c: 'paper' },                         // blank plaque
    ],
  },
  {
    id: 'pebblewick-dry-plot', name: 'Dry Plot', category: 'prop', uses: ['place'],
    tags: ['pebblewick', 'gta', 'garden', 'plot', 'pepper', 'field', 'soil', 'water', 'desert', 'town'], emoji: [],
    footprint: { r: 5, h: 0.9 },
    about: 'Gnome Theft Auto: the Dry Plot at Pebblewick. Life-size metres, under 0.9 m tall. Five furrowed soil ridges along x with pepper plants and a few red peppers, and a dark tube along the front edge with three small blue drops.',
    examine: [
      'A furrowed plot of pepper plants in tidy ridges, with a few red fruits already ripe and a dark tube along the front edge.',
      'Saying: the first pepper is for the gnome who planted it, the second is for the crow, and the rest are for the argument.',
      'Tip: the line that weeps along the front is not to be stepped on. Step over it, and the ridges will forgive you.',
      'Joke: it is the driest plot in the valley and still somehow the most talked about.',
      'Three blue drops hang from the front line, each waiting for its turn to fall, and none of them ever hurries.',
    ],
    parts: [
      { s: 'box', d: [9.6, 0.25, 0.6], at: [0, 0.125, -2], c: 0x8a5a3a },                        // soil ridges
      { s: 'box', d: [9.6, 0.25, 0.6], at: [0, 0.125, -1], c: 0x8a5a3a },
      { s: 'box', d: [9.6, 0.25, 0.6], at: [0, 0.125, 0], c: 0x8a5a3a },
      { s: 'box', d: [9.6, 0.25, 0.6], at: [0, 0.125, 1], c: 0x8a5a3a },
      { s: 'box', d: [9.6, 0.25, 0.6], at: [0, 0.125, 2], c: 0x8a5a3a },
      { s: 'ball', d: [0.25], at: [0, 0.45, -2], c: 'leaf', seg: 8 },                            // pepper plants
      { s: 'ball', d: [0.25], at: [3, 0.45, -2], c: 'leaf', seg: 8, mirror: true },
      { s: 'ball', d: [0.25], at: [0, 0.45, -1], c: 'leaf', seg: 8 },
      { s: 'ball', d: [0.25], at: [3, 0.45, -1], c: 'leaf', seg: 8, mirror: true },
      { s: 'ball', d: [0.25], at: [0, 0.45, 0], c: 'leaf', seg: 8 },
      { s: 'ball', d: [0.25], at: [3, 0.45, 0], c: 'leaf', seg: 8, mirror: true },
      { s: 'ball', d: [0.25], at: [0, 0.45, 1], c: 'leaf', seg: 8 },
      { s: 'ball', d: [0.25], at: [3, 0.45, 1], c: 'leaf', seg: 8, mirror: true },
      { s: 'ball', d: [0.25], at: [0, 0.45, 2], c: 'leaf', seg: 8 },
      { s: 'ball', d: [0.25], at: [3, 0.45, 2], c: 'leaf', seg: 8, mirror: true },
      { s: 'ball', d: [0.2], at: [1.5, 0.55, -2], scale: [1, 0.8, 1], c: 'red', seg: 6 },        // red peppers
      { s: 'ball', d: [0.2], at: [1.5, 0.55, 0], scale: [1, 0.8, 1], c: 'red', seg: 6 },
      { s: 'ball', d: [0.2], at: [1.5, 0.55, 2], scale: [1, 0.8, 1], c: 'red', seg: 6 },
      { s: 'cyl', d: [0.06, 0.06, 9.6], at: [0, 0.07, 2.9], rot: [0, 0, 90], c: 0x2a2a2a, seg: 6 }, // the line that weeps
      { s: 'ball', d: [0.05], at: [-3.0, 0.06, 2.9], c: 0x6fb8e8, seg: 6 },                       // blue drops
      { s: 'ball', d: [0.05], at: [-1.5, 0.06, 2.9], c: 0x6fb8e8, seg: 6 },
      { s: 'ball', d: [0.05], at: [0, 0.06, 2.9], c: 0x6fb8e8, seg: 6 },
    ],
  },
];
