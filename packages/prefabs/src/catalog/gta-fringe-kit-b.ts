// Gnome Theft Auto: fringe buildings B (docs/roadmaps/gta-parks-and-fringe.md). Life-size metres, standing on y = 0, centred on
// x and z, front on +z. Rough = weathered: rust, patches, stains, mismatched parts.
import type { PrefabDef } from '../types';

export const GTA_FRINGE_KIT_B: readonly PrefabDef[] = [
  {
    id: 'caravan', name: 'Caravan', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'caravan'], emoji: [],
    tint: 0x3a7ab8,
    footprint: { r: 2.5, h: 2.4 },
    about: 'Gnome Theft Auto: the Caravan. A round-ended caravan 5 x 2.2 x 2.4 m on four blocks, with a stripe in the tint colour. Life-size metres.',
    examine: [
      'A round-ended wagon of pale clay sits on four stout blocks, with a blue stripe painted along each side and a square hole at the front.',
      'Saying: a house that will not stand still is a wagon, and a wagon that will not roll is a sad sort of house.',
      'Tip: the little square holes at the front are dark inside, so do not reach through them unless you enjoy surprises with teeth.',
      'Joke: the wagon has four blocks underneath because it once tried to leave, and the blocks have been holding the grudge ever since.',
      'The bottle clipped to one end is green-glazed clay with a brass cap, and it hums quietly on still nights as if something inside wants out.',
    ],
    parts: [
      { s: 'box', d: [4.4, 0.12, 1.8], at: [0, 0.5, 0], c: 'iron-dark' },                            // chassis
      { s: 'box', d: [0.3, 0.5, 0.3], at: [1.8, 0.25, 0.7], c: 'iron-dark' },                       // four blocks
      { s: 'box', d: [0.3, 0.5, 0.3], at: [-1.8, 0.25, 0.7], c: 'iron-dark' },
      { s: 'box', d: [0.3, 0.5, 0.3], at: [1.8, 0.25, -0.7], c: 'iron-dark' },
      { s: 'box', d: [0.3, 0.5, 0.3], at: [-1.8, 0.25, -0.7], c: 'iron-dark' },
      { s: 'box', d: [0.12, 0.1, 2.2], at: [0, 0.4, 0], c: 'iron' },                                // drawbar, front to back
      { s: 'box', d: [3.4, 1.8, 1.9], at: [0, 1.45, 0], c: 'cloth' },                              // body
      { s: 'cyl', d: [0.95, 0.95, 3.4], at: [0, 1.4, 0], rot: [0, 0, 90], c: 'cloth', seg: 8 },   // rounded roof
      { s: 'ball', d: [0.95], at: [1.9, 1.4, 0], scale: [0.55, 1, 1], c: 'cloth', seg: 8 },       // rounded ends
      { s: 'ball', d: [0.95], at: [-1.9, 1.4, 0], scale: [0.55, 1, 1], c: 'cloth', seg: 8 },
      { s: 'box', d: [3.4, 0.22, 0.03], at: [0, 1.2, 0.96], c: 'tint' },                          // stripes
      { s: 'box', d: [3.4, 0.22, 0.03], at: [0, 1.2, -0.96], c: 'tint' },
      { s: 'box', d: [0.5, 1.2, 0.04], at: [-0.9, 1.1, 0.97], c: 'wood' },                         // door
      { s: 'box', d: [0.6, 0.5, 0.04], at: [0.2, 1.7, 0.97], c: 'glass' },                        // windows
      { s: 'box', d: [0.6, 0.5, 0.04], at: [1.2, 1.7, 0.97], c: 'glass' },
      { s: 'cyl', d: [0.12, 0.12, 0.6], at: [-2.3, 0.3, 0.5], c: 'steel', seg: 8 },                // gas bottle
    ],
  },
  {
    id: 'trailer-home', name: 'Trailer Home', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'trailer'], emoji: [],
    tint: 0xd8d0b0,
    footprint: { r: 5, h: 3 },
    about: 'Gnome Theft Auto: the Trailer Home. A long trailer 10 x 2.8 x 3.2 m with skirting, a porch with steps on +z and a roof dish. Tint = walls. Life-size metres.',
    examine: [
      'A long low clay house on a skirt of dark slate, with a fat dish on its roof that turns slowly to face the sky.',
      'Saying: a house that never leaves its own street has put its roots in the wrong direction, as the Tall Ones always did.',
      'Tip: the porch steps are the only way in, and they are taller than they look, so take them one at a time and say hello on the way up.',
      'Joke: the dish has pointed at the same cloud for eleven years, and the cloud has never once said anything worth hearing.',
      'Under the skirt somebody has scratched a row of tiny gnomes holding hands, every one of them facing the wrong way.',
    ],
    parts: [
      { s: 'box', d: [9.8, 0.5, 2.0], at: [0, 0.25, 0], c: 'slate' },                              // skirting
      { s: 'box', d: [10, 2.4, 2.2], at: [0, 1.7, 0], c: 'tint' },                                 // walls
      { s: 'box', d: [10.1, 0.1, 2.3], at: [0, 2.95, 0], c: 'iron-dark' },                        // roof lip
      { s: 'box', d: [1.0, 0.8, 0.04], at: [-3.6, 1.8, 1.12], c: 'glass' },                       // windows on +z
      { s: 'box', d: [1.0, 0.8, 0.04], at: [-1.2, 1.8, 1.12], c: 'glass' },
      { s: 'box', d: [1.0, 0.8, 0.04], at: [1.3, 1.8, 1.12], c: 'glass' },
      { s: 'box', d: [0.8, 1.9, 0.05], at: [3, 1.15, 1.125], c: 'wood' },                         // door
      { s: 'box', d: [2.0, 0.1, 0.3], at: [3, 2.2, 1.25], c: 'iron-dark' },                       // porch canopy
      { s: 'cyl', d: [0.05, 0.05, 2.2], at: [2.1, 1.1, 1.35], c: 'iron-dark', seg: 6 },           // porch posts
      { s: 'cyl', d: [0.05, 0.05, 2.2], at: [3.9, 1.1, 1.35], c: 'iron-dark', seg: 6 },
      { s: 'box', d: [1.2, 0.2, 0.3], at: [3, 0.1, 1.25], c: 'stone' },                            // porch step
      { s: 'box', d: [1.2, 0.2, 0.3], at: [-3, 0.1, -1.25], c: 'stone' },                         // rear step
      { s: 'cyl', d: [0.04, 0.04, 0.2], at: [-3.5, 3.05, 0], c: 'iron', seg: 6 },                 // dish stand
      { s: 'ball', d: [0.3], at: [-3.5, 3.12, 0], scale: [1, 0.35, 1], c: 'white', seg: 8 },      // dish
    ],
  },
  {
    id: 'half-built-house', name: 'Half-Built House', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'half'], emoji: [],
    footprint: { r: 4, h: 6 },
    about: 'Gnome Theft Auto: the Half-Built House. A timber frame 8 x 7 x 6 m with two finished wall panels, a scaffold on one side and a pile of blocks. Raw wood colours.',
    examine: [
      'A bare wooden frame of raw posts and beams, with two finished walls on one side and a rickety scaffold climbing up the other.',
      'Saying: a house is never finished, only abandoned at a convenient height, and the gnomes who started it are still up on the roof.',
      'Tip: the scaffold planks bend when you step on them, so walk along the middle plank, near the pole, and keep one hand on the wall.',
      'Joke: the house has been half built for so long that the pile of blocks has grown a second pile, which is also half built.',
      'One block on the pile has a mark pressed into it, the print of a hand with six fingers, and nobody on the site will say whose.',
    ],
    parts: [
      { s: 'box', d: [8, 0.3, 7], at: [0, 0.15, 0], c: 'stone' },                                  // floor slab
      { s: 'box', d: [0.25, 5.2, 0.25], at: [-3.875, 2.9, -3.375], c: 'wood' },                    // posts
      { s: 'box', d: [0.25, 5.2, 0.25], at: [0, 2.9, -3.375], c: 'wood' },
      { s: 'box', d: [0.25, 5.2, 0.25], at: [3.875, 2.9, -3.375], c: 'wood' },
      { s: 'box', d: [0.25, 5.2, 0.25], at: [-3.875, 2.9, 3.375], c: 'wood' },
      { s: 'box', d: [0.25, 5.2, 0.25], at: [0, 2.9, 3.375], c: 'wood' },
      { s: 'box', d: [0.25, 5.2, 0.25], at: [3.875, 2.9, 3.375], c: 'wood' },
      { s: 'box', d: [8, 0.25, 0.25], at: [0, 5.55, -3.375], c: 'wood-light' },                   // top plates
      { s: 'box', d: [8, 0.25, 0.25], at: [0, 5.55, 3.375], c: 'wood-light' },
      { s: 'box', d: [8, 0.2, 0.2], at: [0, 6.0, 0], c: 'wood-light' },                           // ridge
      { s: 'box', d: [0.15, 0.15, 3.55], at: [-3, 5.8, 1.75], rot: [6.5, 0, 0], c: 'wood-dark' }, // rafters
      { s: 'box', d: [0.15, 0.15, 3.55], at: [-3, 5.8, -1.75], rot: [-6.5, 0, 0], c: 'wood-dark' },
      { s: 'box', d: [0.15, 0.15, 3.55], at: [0, 5.8, 1.75], rot: [6.5, 0, 0], c: 'wood-dark' },
      { s: 'box', d: [0.15, 0.15, 3.55], at: [0, 5.8, -1.75], rot: [-6.5, 0, 0], c: 'wood-dark' },
      { s: 'box', d: [0.15, 0.15, 3.55], at: [3, 5.8, 1.75], rot: [6.5, 0, 0], c: 'wood-dark' },
      { s: 'box', d: [0.15, 0.15, 3.55], at: [3, 5.8, -1.75], rot: [-6.5, 0, 0], c: 'wood-dark' },
      { s: 'box', d: [3.2, 4.6, 0.15], at: [-2, 2.6, 3.4], c: 'wood-light' },                     // finished wall panels
      { s: 'box', d: [3.4, 4.6, 0.15], at: [2, 2.6, -3.4], c: 'wood' },
      { s: 'cyl', d: [0.05, 0.05, 5.2], at: [4.35, 2.6, 3.3], c: 'iron', seg: 6 },                // scaffold poles
      { s: 'cyl', d: [0.05, 0.05, 5.2], at: [4.35, 2.6, -3.3], c: 'iron', seg: 6 },
      { s: 'box', d: [0.3, 0.06, 6.4], at: [4.2, 2.0, 0], c: 'wood-light' },                      // scaffold planks
      { s: 'box', d: [0.3, 0.06, 6.4], at: [4.2, 4.0, 0], c: 'wood-light' },
      { s: 'box', d: [0.6, 0.3, 0.3], at: [-4.1, 0.15, -3.0], c: 'stone' },                       // pile of blocks
      { s: 'box', d: [0.6, 0.3, 0.3], at: [-4.1, 0.45, -3.0], c: 'stone-dark' },
    ],
  },
  {
    id: 'water-tower', name: 'Water Tower', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'water'], emoji: [],
    tint: 0x8aa0a8,
    footprint: { r: 2, h: 10 },
    about: 'Gnome Theft Auto: the Water Tower. Four splayed legs, a round tank at 6 to 9 m with a cone roof and a ladder. 4 x 4 x 10 m, tint = tank. Life-size metres.',
    examine: [
      'Four splayed iron legs braced with crossbars hold a round tank high above the grass, with a pointed hat on top and a ladder up one side.',
      'Saying: whatever goes up the tower comes back down the pipe, and whatever comes down the pipe is never quite the same again.',
      'Tip: the ladder rungs stay cold even in summer, and they do not like wet boots, so climb with dry hands and a clean conscience.',
      'Joke: the tower has stood so tall for so long that it has started to look down on the town hall, and the town hall has noticed.',
      'Someone has painted a small orange cone on the tank at its highest point, where only birds and very determined gnomes will ever see it.',
    ],
    parts: [
      { s: 'box', d: [0.25, 6.07, 0.25], at: [1.45, 3.0, 1.45], rot: [-8.5, 0, 8.5], c: 'iron' },    // legs
      { s: 'box', d: [0.25, 6.07, 0.25], at: [-1.45, 3.0, 1.45], rot: [-8.5, 0, -8.5], c: 'iron' },
      { s: 'box', d: [0.25, 6.07, 0.25], at: [1.45, 3.0, -1.45], rot: [8.5, 0, 8.5], c: 'iron' },
      { s: 'box', d: [0.25, 6.07, 0.25], at: [-1.45, 3.0, -1.45], rot: [8.5, 0, -8.5], c: 'iron' },
      { s: 'box', d: [3.2, 0.1, 0.1], at: [0, 2.0, 1.6], c: 'iron' },                              // braces, low
      { s: 'box', d: [3.2, 0.1, 0.1], at: [0, 2.0, -1.6], c: 'iron' },
      { s: 'box', d: [0.1, 0.1, 3.2], at: [1.6, 2.0, 0], c: 'iron' },
      { s: 'box', d: [0.1, 0.1, 3.2], at: [-1.6, 2.0, 0], c: 'iron' },
      { s: 'box', d: [2.5, 0.1, 0.1], at: [0, 4.5, 1.25], c: 'iron' },                              // braces, high
      { s: 'box', d: [2.5, 0.1, 0.1], at: [0, 4.5, -1.25], c: 'iron' },
      { s: 'box', d: [0.1, 0.1, 2.5], at: [1.25, 4.5, 0], c: 'iron' },
      { s: 'box', d: [0.1, 0.1, 2.5], at: [-1.25, 4.5, 0], c: 'iron' },
      { s: 'cyl', d: [1.5, 1.5, 3.0], at: [0, 7.5, 0], c: 'tint', seg: 10 },                      // tank 6 to 9 m
      { s: 'cone', d: [1.6, 1.0], at: [0, 9.5, 0], c: 'iron-dark', seg: 10 },                      // cone roof, top at 10
      { s: 'box', d: [0.06, 6.0, 0.06], at: [0.25, 3.0, 1.6], c: 'iron-dark' },                   // ladder rails
      { s: 'box', d: [0.06, 6.0, 0.06], at: [0.65, 3.0, 1.6], c: 'iron-dark' },
      { s: 'box', d: [0.46, 0.05, 0.05], at: [0.45, 0.8, 1.6], c: 'iron-dark' },                   // ladder rungs
      { s: 'box', d: [0.46, 0.05, 0.05], at: [0.45, 1.8, 1.6], c: 'iron-dark' },
      { s: 'box', d: [0.46, 0.05, 0.05], at: [0.45, 2.8, 1.6], c: 'iron-dark' },
      { s: 'box', d: [0.46, 0.05, 0.05], at: [0.45, 3.8, 1.6], c: 'iron-dark' },
      { s: 'box', d: [0.46, 0.05, 0.05], at: [0.45, 4.8, 1.6], c: 'iron-dark' },
    ],
  },
  {
    id: 'polytunnel', name: 'Polytunnel', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'polytunnel'], emoji: [],
    footprint: { r: 5, h: 2.4 },
    about: 'Gnome Theft Auto: the Polytunnel. A half-round clear tunnel 10 x 4 x 2.4 m along x on a timber base, with a door frame on the +x end.',
    examine: [
      'A long clear tunnel of stretched pale film over bent hoops, with a wooden door at one end and a ridge pole running along its top.',
      'Saying: a tunnel that keeps the warm in and the rain out has made a great many promises, and the gnomes have kept most of them.',
      'Tip: the film sags after a storm, so push it back up from the inside with a long stick, or the rain will sit in the crease and rot the peas.',
      'Joke: the cabbages inside grow so tall and proud that they refuse to be picked, and now they only visit the door on Sundays.',
      'A row of small green pots stands just inside the door, each labelled with one letter that nobody has been able to read since.',
    ],
    parts: [
      { s: 'box', d: [10, 0.06, 1.2307], at: [0, 0.6, -1.866], rot: [-77.4, 0, 0], c: 'white', alpha: 0.5 },   // film panels, half-round
      { s: 'box', d: [10, 0.06, 1.1433], at: [0, 1.6, -1.366], rot: [-50.2, 0, 0], c: 'white', alpha: 0.5 },
      { s: 'box', d: [10, 0.06, 1.0508], at: [0, 2.239, -0.5], rot: [-17.8, 0, 0], c: 'white', alpha: 0.5 },
      { s: 'box', d: [10, 0.06, 1.0508], at: [0, 2.239, 0.5], rot: [17.8, 0, 0], c: 'white', alpha: 0.5 },
      { s: 'box', d: [10, 0.06, 1.1433], at: [0, 1.6, 1.366], rot: [50.2, 0, 0], c: 'white', alpha: 0.5 },
      { s: 'box', d: [10, 0.06, 1.2307], at: [0, 0.6, 1.866], rot: [77.4, 0, 0], c: 'white', alpha: 0.5 },
      { s: 'box', d: [10, 0.08, 0.08], at: [0, 2.36, 0], c: 'iron' },                                   // ridge pole
      { s: 'box', d: [10, 0.08, 0.08], at: [0, 0.04, 2.0], c: 'wood-dark' },                          // base rails
      { s: 'box', d: [10, 0.08, 0.08], at: [0, 0.04, -2.0], c: 'wood-dark' },
      { s: 'box', d: [0.15, 2.0, 0.15], at: [5.0, 1.0, -0.9], c: 'wood-dark' },                      // door frame
      { s: 'box', d: [0.15, 2.0, 0.15], at: [5.0, 1.0, 0.9], c: 'wood-dark' },
      { s: 'box', d: [0.15, 0.2, 1.95], at: [5.0, 2.1, 0], c: 'wood-dark' },
      { s: 'box', d: [0.05, 1.8, 1.5], at: [5.03, 0.9, 0], c: 'wood-light' },                         // door
    ],
  },
  {
    id: 'lean-to-shed', name: 'Lean-To Shed', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'lean'], emoji: [],
    tint: 0x7a5a3a,
    footprint: { r: 2, h: 2.6 },
    about: 'Gnome Theft Auto: the Lean-To Shed. A plank shed 4 x 3 x 2.6 m with a single-slope roof, high at the back, open on +z, with tools inside. Tint = planks.',
    examine: [
      'A plank hut with one sloping roof, high at the back and low at the front, and no door at all, only an open mouth of shadow.',
      'Saying: a shed with no front door is the friendliest shed in Turfton, because it has nothing to close on anybody.',
      'Tip: the rake leans in the corner with its teeth up. Step on the teeth and it will tell you about it, loudly and at length.',
      'Joke: a one-wheeled cart with a tray at the front has the only sensible job in the shed, which is to be pushed, and it never once asks to stop.',
      'On the back wall a row of scratched lines counts the seasons, and the last mark has been pressed so hard it has gone through the planks.',
    ],
    parts: [
      { s: 'box', d: [4.0, 2.5, 0.1], at: [0, 1.25, -1.45], c: 'tint' },                           // back wall
      { s: 'box', d: [0.1, 2.3, 3.0], at: [-1.95, 1.15, 0], c: 'tint' },                           // side walls
      { s: 'box', d: [0.1, 2.3, 3.0], at: [1.95, 1.15, 0], c: 'tint' },
      { s: 'box', d: [4.2, 0.1, 3.2], at: [0, 2.2, 0], rot: [14.9, 0, 0], c: 'iron-dark' },        // single-slope roof
      { s: 'box', d: [4.0, 0.05, 0.02], at: [0, 0.8, -1.38], c: 'wood-dark' },                      // planks on the back wall
      { s: 'box', d: [4.0, 0.05, 0.02], at: [0, 1.6, -1.38], c: 'wood-dark' },
      { s: 'box', d: [0.04, 1.5, 0.04], at: [-1.2, 0.8, 0.9], c: 'wood-light' },                    // rake
      { s: 'box', d: [0.4, 0.05, 0.1], at: [-1.2, 0.025, 0.9], c: 'iron' },
      { s: 'box', d: [0.8, 0.25, 0.55], at: [0.7, 0.45, 0.2], c: 'iron' },                         // one-wheeled cart: tray
      { s: 'cyl', d: [0.2, 0.2, 0.06], at: [0.7, 0.2, 0.6], rot: [0, 0, 90], c: 'iron-dark', seg: 8 }, // wheel
      { s: 'box', d: [0.06, 0.06, 1.0], at: [0.7, 0.35, -0.5], c: 'wood' },                        // handles
    ],
  },
];
