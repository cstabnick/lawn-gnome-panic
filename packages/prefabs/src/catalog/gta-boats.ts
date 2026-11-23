// Gnome Theft Auto: boats (Wild World Epic 4, issue 4B). Modelled life-size in game metres, nose +z, keel at y = 0.
import type { PrefabDef } from '../types';

const NAVY = 0x1f2f5a;

export const GTA_BOATS: readonly PrefabDef[] = [
  {
    id: 'walnut-dinghy', name: 'Walnut Dinghy', category: 'prop', uses: ['place', 'sit'],
    tags: ['boat', 'dinghy', 'walnut', 'shell', 'rowing', 'oar', 'oars', 'thwart', 'wood', 'brown', 'water'], emoji: [],
    seat: [0, 0.3, -0.35],
    tint: 'wood-dark',
    footprint: { r: 1.3, h: 0.6 },
    about: 'Gnome Theft Auto: the Walnut Dinghy. A wrinkled brown walnut-shell rowing boat, pale inside, with two plank thwarts and two oars resting in rowlocks. Bow toward +z, keel at y 0. Seat top at [0, 0.3, -0.35].',
    examine: [
      'A wrinkled brown shell, pale and smooth on the inside, with two plank seats laid across it like the rungs of a very short ladder.',
      'Saying from the Charters: a boat that floats is a boat that has not yet been tested by the Spigot, so row gently.',
      'Tip: keep your weight low and central. A dinghy with a gnome standing up in it has the manners of a dropped teacup.',
      'Joke: the oars have never once been used for rowing, only for pointing at things the gnome would like the others to look at.',
      'The inside is lined with a pale and very fine skin. Gnomes say it is the last of the walnut, and nobody has ever tried to find the rest.',
    ],
    parts: [
      { s: 'box', d: [1.5, 0.28, 2.2], at: [0, 0.14, 0], c: 'wood-light' },                 // hull, pale inside (top 0.28)
      { s: 'ball', d: [0.45], at: [0, 0.3, 0.8], scale: [1.0, 0.67, 1.1], c: 'tint' },    // bow shell (top 0.6)
      { s: 'ball', d: [0.35], at: [0, 0.3, -0.95], scale: [1.2, 0.86, 1.0], c: 'tint' }, // stern shell (top 0.6)
      { s: 'ball', d: [0.12], at: [0.3, 0.45, 0.6], scale: [1, 0.6, 1], c: 'tint' },     // wrinkle
      { s: 'ball', d: [0.09], at: [-0.2, 0.52, 0.75], scale: [1, 0.6, 1], c: 'tint' },   // wrinkle
      { s: 'ball', d: [0.1], at: [0.22, 0.46, -1.1], scale: [1, 0.6, 1], c: 'tint' },    // wrinkle
      { s: 'box', d: [1.2, 0.2, 0.12], at: [0, 0.2, 0.55], c: 'wood' },                       // front thwart (top 0.3)
      { s: 'box', d: [1.2, 0.2, 0.12], at: [0, 0.2, -0.35], c: 'wood' },                      // seat thwart (top 0.3)
      { s: 'cyl', d: [0.02, 0.02, 2.4], rot: [90, 0, 0], at: [0.7, 0.44, 0], c: 'wood-light', seg: 6, mirror: true }, // oar
      { s: 'box', d: [0.08, 0.14, 0.08], at: [0.7, 0.37, 0], c: 'iron', mirror: true },        // rowlock
    ],
  },
  {
    id: 'gravy-boat', name: 'Gravy Boat', category: 'prop', uses: ['place', 'sit'],
    tags: ['boat', 'speedboat', 'gravy', 'porcelain', 'white', 'motor', 'outboard', 'fast', 'water', 'blue'], emoji: [],
    seat: [0, 0.35, -0.5],
    tint: 'white',
    footprint: { r: 1.8, h: 0.7 },
    pivots: { prop: [0, 0.2, -2.0] },
    about: 'Gnome Theft Auto: the Gravy Boat. A white glossy speedboat with a raised spout at the bow, a curled handle at the stern, a windscreen, two seats and an outboard motor (group prop, spins on its hub). Bow toward +z, keel at y 0. Seat tops at z -0.5 and -1.2.',
    examine: [
      'A long white dish of a boat, glossy as an egg, with a little spout standing up at the front and a curled handle hanging off the back.',
      'Saying from the Verge: the fastest things on the water are the ones that have been polished the most, and a gnome should never ask why.',
      'Tip: hold the handle with both hands at the stern. Gnomes who steer from the spout tend to end up in the reeds.',
      'Joke: it is very fast, and the only danger is that the motor at the back makes a sound like a hen being asked to leave.',
      'The white paint has a thin blue line where a gnome once tried to draw a wave. It is the only wave in the whole of Mossbottom.',
    ],
    parts: [
      { s: 'box', d: [1.6, 0.3, 3.2], at: [0, 0.15, 0], c: 'tint' },                       // hull (top 0.3)
      { s: 'wedge', d: [1.6, 0.5, 0.4], at: [0, 0.25, 1.8], c: 'tint' },                    // bow ramp (z 1.6 to 2.0)
      { s: 'cyl', d: [0.1, 0.14, 0.9], rot: [35, 0, 0], at: [0, 0.6, 1.5], c: 'tint', seg: 8 }, // spout, raised at the bow
      { s: 'box', d: [0.9, 0.3, 0.05], at: [0, 0.47, 0.5], c: 'glass' },                     // windscreen
      { s: 'box', d: [0.9, 0.15, 0.4], at: [0, 0.275, -0.5], c: 'wood-light' },              // seat (top 0.35)
      { s: 'box', d: [0.9, 0.15, 0.4], at: [0, 0.275, -1.2], c: 'wood-light' },              // seat (top 0.35)
      { s: 'box', d: [0.9, 0.4, 0.05], at: [0, 0.4, -0.72], c: 'white' },                    // seat backrest
      { s: 'box', d: [0.04, 0.1, 3.0], at: [0.81, 0.2, 0], c: 'blue', mirror: true },         // blue side stripe
      { s: 'ring', d: [0.13, 0.03], at: [0, 0.7, -1.66], c: 'white' },                        // curled handle at the stern
      { s: 'box', d: [0.22, 0.45, 0.35], at: [0, 0.32, -1.78], c: 'iron-dark' },              // outboard housing
      { s: 'box', d: [0.04, 0.2, 0.02], at: [0, 0.3, -2.0], c: 'iron-dark', group: 'prop' }, // propeller blade, upper
      { s: 'box', d: [0.04, 0.18, 0.02], at: [0, 0.11, -2.0], c: 'iron-dark', group: 'prop' }, // propeller blade, lower
      { s: 'ball', d: [0.04], at: [0, 0.2, -2.0], c: 'iron', seg: 6, group: 'prop' },        // propeller hub
    ],
  },
  {
    id: 'clog-cruiser', name: 'Clog Cruiser', category: 'prop', uses: ['place', 'sit'],
    tags: ['boat', 'clog', 'shoe', 'wooden', 'yellow', 'cruiser', 'cockpit', 'wheel', 'pennant', 'water'], emoji: [],
    seat: [0, 0.55, -1.4],
    tint: 'yellow',
    footprint: { r: 2.5, h: 1.0 },
    pivots: { prop: [0, 0.2, -2.6] },
    about: 'Gnome Theft Auto: the Clog Cruiser. A giant yellow wooden clog with an open heel for a cockpit, benches, a little steering wheel, a pennant on a short mast and an outboard motor (group prop). Bow (upturned toe) toward +z, keel at y 0. Seat top at [0, 0.55, -1.4].',
    examine: [
      'A huge yellow shoe of a boat, with a rounded toe that turns up at the front and an open heel at the back for sitting in.',
      'Saying from the Planting: a gnome who has a shoe large enough to sail in will never need to walk again, and that is the whole of the Planting.',
      'Tip: sit in the heel with your back to the toe. A clog that goes forward wobbles, and a wobbling gnome is a sorry sight.',
      'Joke: the steering wheel is very small and very shiny, and it turns nothing at all, so the gnome at the front does all the work.',
      'A small red pennant flies from the mast. Nobody knows whose colours it is, but it is always the first thing the neighbours wave at.',
    ],
    parts: [
      { s: 'box', d: [2.0, 0.2, 3.0], at: [0, 0.1, -0.5], c: 'tint' },                     // floor (top 0.2)
      { s: 'box', d: [0.2, 0.8, 3.0], at: [-1.0, 0.4, -0.5], c: 'tint', mirror: true },    // side walls (top 0.8)
      { s: 'box', d: [2.0, 0.4, 0.2], at: [0, 0.2, -1.9], c: 'tint' },                     // low heel rail
      { s: 'ball', d: [1.1], at: [0, 0.396, 1.5], scale: [1.0, 0.36, 0.9], c: 'tint' },   // toe, rounded
      { s: 'ball', d: [0.5], at: [0, 0.5, 2.0], scale: [1.0, 0.7, 0.9], c: 'tint' },       // upturned tip
      { s: 'box', d: [0.4, 0.35, 0.8], at: [0.6, 0.375, 0.1], c: 'wood', mirror: true },    // side benches (top 0.55)
      { s: 'box', d: [1.2, 0.35, 0.4], at: [0, 0.375, 1.0], c: 'wood' },                     // front bench (top 0.55)
      { s: 'box', d: [0.8, 0.35, 0.5], at: [0, 0.375, -1.4], c: 'wood-light' },              // driver's seat (top 0.55)
      { s: 'cyl', d: [0.03, 0.03, 0.3], at: [0, 0.7, -0.85], c: 'iron-dark', seg: 6 },        // steering post
      { s: 'ring', d: [0.2, 0.025], at: [0, 0.95, -0.85], c: 'wood-dark' },                   // steering wheel
      { s: 'cyl', d: [0.03, 0.03, 0.6], at: [-0.85, 1.1, -1.5], c: 'iron-dark', seg: 6 },    // short mast
      { s: 'box', d: [0.02, 0.2, 0.3], at: [-0.85, 1.3, -1.35], c: 'red' },                  // pennant
      { s: 'box', d: [0.4, 0.55, 0.4], at: [0, 0.3, -2.25], c: 'iron-dark' },                // outboard housing
      { s: 'cyl', d: [0.03, 0.03, 0.2], rot: [90, 0, 0], at: [0, 0.2, -2.5], c: 'iron', seg: 6 }, // motor shaft
      { s: 'box', d: [0.04, 0.2, 0.02], at: [0, 0.3, -2.6], c: 'iron-dark', group: 'prop' }, // propeller blade, upper
      { s: 'box', d: [0.04, 0.18, 0.02], at: [0, 0.11, -2.6], c: 'iron-dark', group: 'prop' }, // propeller blade, lower
      { s: 'ball', d: [0.04], at: [0, 0.2, -2.6], c: 'iron', seg: 6, group: 'prop' },        // propeller hub
    ],
  },
  {
    id: 'watering-can-steamer', name: 'Watering-Can Steamer', category: 'prop', uses: ['place', 'sit'],
    tags: ['boat', 'ferry', 'steamer', 'paddle', 'watering', 'can', 'green', 'red', 'deck', 'water'], emoji: [],
    seat: [0, 0.9, -2.6],
    tint: 'green',
    footprint: { r: 4.0, h: 3.0 },
    pivots: { reel: [0, 0.6, 0] },
    about: 'Gnome Theft Auto: the Watering-Can Steamer. A long flat green paddle ferry with a can-shaped cabin, a spout funnel with a rose on the bow, two red paddle wheels (group reel, spin about x) and benches on deck. Bow toward +z, keel at y 0. Driver seat top at [0, 0.9, -2.6].',
    examine: [
      'A squat green tin can of a cabin stands on a flat deck, with a long spout poking forward and a red paddle wheel turning at each side.',
      'Saying from the Charters: a steamer is only as fast as the gnome who is stoking it, and that gnome is always far below the deck.',
      'Tip: keep the paddles wet and the spout dry. A rose full of water at the front is a sure way to start the afternoon with a bath.',
      'Joke: the paddles make a steady slapping sound, which the gnomes say is the boat applauding its own bravery.',
      'There is a small brass plate on the cabin door with a number on it. No one has ever found the gnome who owns the number.',
    ],
    parts: [
      { s: 'box', d: [2.6, 0.8, 7.0], at: [0, 0.4, -0.5], c: 'wood-dark' },                   // hull and deck (top 0.8)
      { s: 'wedge', d: [2.6, 0.8, 1.0], at: [0, 0.4, 3.5], c: 'wood-dark' },                  // bow ramp (z 3.0 to 4.0)
      { s: 'cyl', d: [0.8, 0.8, 2.3], at: [0, 1.85, -0.9], c: 'tint', seg: 10 },             // watering-can body cabin (top 3.0)
      { s: 'cyl', d: [0.06, 0.12, 1.4], rot: [35, 0, 0], at: [0, 1.57, 0.4], c: 'tint', seg: 8 }, // spout funnel
      { s: 'cyl', d: [0.14, 0.14, 0.06], rot: [35, 0, 0], at: [0, 2.17, 0.82], c: 'iron', seg: 8 }, // rose on the spout end
      { s: 'ring', d: [0.35, 0.05], at: [0, 2.45, -1.85], c: 'tint' },                        // carry handle on the cabin
      { s: 'box', d: [0.9, 0.2, 0.5], at: [0, 0.8, -2.6], c: 'wood-light' },                  // driver's seat (top 0.9)
      { s: 'box', d: [0.4, 0.2, 0.9], at: [1.1, 0.8, 0.6], c: 'wood-light', mirror: true },    // deck bench (top 0.9)
      { s: 'box', d: [0.4, 0.2, 0.9], at: [1.1, 0.8, 2.0], c: 'wood-light', mirror: true },    // deck bench (top 0.9)
      { s: 'cyl', d: [0.04, 0.04, 0.6], rot: [0, 0, 90], at: [1.5, 0.6, 0], c: 'iron-dark', seg: 6, mirror: true }, // axle
      { s: 'cyl', d: [0.6, 0.6, 0.1], rot: [0, 0, 90], at: [1.85, 0.6, 0], c: 'red', seg: 12, group: 'reel', mirror: true }, // paddle wheel disc
      { s: 'box', d: [0.16, 0.16, 0.16], at: [1.85, 1.1, 0], c: 'wood', group: 'reel', mirror: true },  // paddle, top
      { s: 'box', d: [0.16, 0.16, 0.16], at: [1.85, 0.6, 0.5], c: 'wood', group: 'reel', mirror: true }, // paddle, front
      { s: 'box', d: [0.16, 0.16, 0.16], at: [1.85, 0.1, 0], c: 'wood', group: 'reel', mirror: true },    // paddle, bottom
      { s: 'box', d: [0.16, 0.16, 0.16], at: [1.85, 0.6, -0.5], c: 'wood', group: 'reel', mirror: true }, // paddle, back
    ],
  },
  {
    id: 'hoa-patrol-boat', name: 'HOA Patrol Boat', category: 'prop', uses: ['place', 'sit'],
    tags: ['boat', 'patrol', 'hoa', 'inflatable', 'beige', 'navy', 'light', 'siren', 'clipboard', 'police', 'water'], emoji: [],
    seat: [0, 0.45, -0.6],
    tint: 'cloth',
    footprint: { r: 2.0, h: 1.5 },
    pivots: { prop: [0, 0.2, -2.05] },
    about: 'Gnome Theft Auto: the HOA Patrol Boat. An inflatable beige patrol boat with a navy stripe, two seats, a centre console with a clipboard, a light bar (red and blue glow boxes) and an outboard motor (group prop). Bow toward +z, keel at y 0. Seat tops at z -0.6 and -1.4.',
    examine: [
      'A beige, puffy boat with a navy stripe along each side, a little console in the middle and a bar of lights on a pole at the front.',
      'Saying from the Fence: the patrol goes round the lawn twice each morning, and anybody who sees it twice has been seen twice too.',
      'Tip: the clipboard is for writing down everyone who goes by. It is best to keep it turned face down until the gnome in the boat has been introduced.',
      'Joke: the light bar flashes red and blue, which is very helpful for finding the patrol and very unhelpful for hiding from it.',
      'The tubes are soft and full of a warm breath that smells faintly of cut grass. Gnomes do not say where the breath comes from.',
    ],
    parts: [
      { s: 'pill', d: [0.25, 3.5], rot: [90, 0, 0], at: [0.8, 0.25, 0], c: 'tint', seg: 8, mirror: true }, // inflatable tubes (bottom 0)
      { s: 'box', d: [1.2, 0.1, 3.2], at: [0, 0.25, 0], c: 'tint' },                          // floor (top 0.3)
      { s: 'box', d: [1.0, 0.2, 0.4], at: [0, 0.35, -0.6], c: 'wood-light' },                 // seat (top 0.45)
      { s: 'box', d: [1.0, 0.2, 0.4], at: [0, 0.35, -1.4], c: 'wood-light' },                 // seat (top 0.45)
      { s: 'box', d: [0.5, 0.45, 0.4], at: [0, 0.525, 0], c: 'tint' },                       // centre console (top 0.75)
      { s: 'box', d: [0.16, 0.02, 0.22], at: [0.1, 0.76, 0.05], c: 'wood' },                  // clipboard
      { s: 'box', d: [0.13, 0.01, 0.18], at: [0.1, 0.777, 0.05], c: 'paper' },                // clipboard paper
      { s: 'cyl', d: [0.025, 0.025, 0.6], at: [0, 1.05, -0.2], c: 'iron-dark', seg: 6 },      // light bar pole
      { s: 'box', d: [0.4, 0.12, 0.14], at: [0, 1.42, -0.2], c: 'iron-dark' },                // light bar
      { s: 'box', d: [0.12, 0.08, 0.06], at: [-0.12, 1.42, -0.1], c: 'red', glow: true },    // red light
      { s: 'box', d: [0.12, 0.08, 0.06], at: [0.12, 1.42, -0.1], c: 'blue', glow: true },    // blue light
      { s: 'box', d: [0.5, 0.04, 3.4], at: [0.8, 0.47, 0], c: NAVY, mirror: true },           // navy stripe on each tube
      { s: 'box', d: [0.22, 0.45, 0.2], at: [0, 0.3, -1.9], c: 'iron-dark' },                 // outboard housing
      { s: 'cyl', d: [0.02, 0.02, 0.1], rot: [90, 0, 0], at: [0, 0.2, -2.0], c: 'iron', seg: 6 }, // motor shaft
      { s: 'box', d: [0.04, 0.2, 0.02], at: [0, 0.3, -2.05], c: 'iron-dark', group: 'prop' }, // propeller blade, upper
      { s: 'box', d: [0.04, 0.18, 0.02], at: [0, 0.11, -2.05], c: 'iron-dark', group: 'prop' }, // propeller blade, lower
      { s: 'ball', d: [0.04], at: [0, 0.2, -2.05], c: 'iron', seg: 6, group: 'prop' },        // propeller hub
    ],
  },
];
