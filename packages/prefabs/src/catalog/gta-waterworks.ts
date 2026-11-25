// Gnome Theft Auto: bridges, docks and the gnome waterworks (Wild World Epic 4, issue 4C). Life-size in game metres.
import type { Part, PrefabDef } from '../types';

// Posts along a bridge rail, every 3 m from z = -12 to z = +12.
const RAIL_POSTS = [-12, -9, -6, -3, 0, 3, 6, 9, 12];

export const GTA_WATERWORKS: readonly PrefabDef[] = [
  {
    id: 'road-bridge', name: 'Road Bridge', category: 'prop', uses: ['place'],
    tags: ['bridge', 'road', 'river', 'stone', 'railing', 'deck', 'span', 'abutment', 'crossing', 'plaque'],
    emoji: [],
    footprint: { r: 6, h: 3.7 },
    about: 'Gnome Theft Auto: the Road Bridge. A 12 wide, 24 long road deck (top at 2.8) on two stone abutments, with kerbs, iron railings every 3 m and a brass sponsor plaque on one rail. Boats pass under it. Long axis along z.',
    examine: [
      'A wide grey bridge with iron railings and a brass plate that says the crossing was made possible by Pay-n-Glaze.',
      'Old saying: a bridge is only a road that has agreed to be lifted over the water, and it does not like being asked twice.',
      'Tip: keep to the middle of the deck. The kerbs keep the carts in, the railings keep the gnomes in, and both take the job very seriously.',
      'Joke: the toll booth at the far end takes only acorns and the occasional hat, and the hats are never given back.',
      'Boats pass underneath, and the gnomes on the boats all agree the bridge is a little too low.',
    ],
    parts: [
      { s: 'box', d: [12, 0.5, 24], at: [0, 2.55, 0], c: 'slate' },                                   // deck slab, top at 2.8
      { s: 'box', d: [12, 2.3, 2], at: [0, 1.15, -11], c: 'stone-dark' },                              // abutment, -z
      { s: 'box', d: [12, 2.3, 2], at: [0, 1.15, 11], c: 'stone-dark' },                               // abutment, +z
      { s: 'box', d: [0.5, 0.3, 24], at: [5.5, 2.95, 0], c: 'stone', mirror: true },                  // kerb
      ...RAIL_POSTS.map((z): Part => ({ s: 'cyl', d: [0.06, 0.06, 0.9], at: [5.85, 3.25, z], c: 'iron-dark', seg: 6, mirror: true })), // rail posts
      { s: 'box', d: [0.1, 0.1, 24], at: [5.85, 3.65, 0], c: 'iron-dark', mirror: true },              // top rail, top at 3.7
      { s: 'box', d: [0.06, 0.4, 1.2], at: [5.95, 3.2, 1.5], c: 'brass' },                              // sponsor plaque
    ],
  },
  {
    id: 'canal-road-bridge', name: 'Canal Road Bridge', category: 'prop', uses: ['place'],
    tags: ['bridge', 'road', 'canal', 'stone', 'railing', 'deck', 'span', 'abutment', 'crossing', 'low'],
    emoji: [],
    footprint: { r: 6, h: 4 },
    about: 'Gnome Theft Auto: the Canal Road Bridge. A low 12 wide, 24 long road deck (top at 3.0) on two stone abutments, with kerbs and iron railings every 3 m. Made for the shallow canal, where a tall arch would sink through the bed. Long axis along z.',
    examine: [
      'A squat grey bridge with iron railings, standing on two stubby stone feet either side of the canal.',
      'Canal saying: a low bridge teaches a tall hat humility, and a tall gnome patience.',
      'Tip: the boats get under with a hand to spare. Duck anyway, and keep your hat on your own head.',
      'Joke: the bridge is so low that the ducks cross it on foot and file a complaint about the draught.',
      'Someone has chalked a row of little boats on the abutment, one for every one that touched the stonework.',
    ],
    parts: [
      { s: 'box', d: [12, 0.5, 24], at: [0, 2.75, 0], c: 'slate' },                                    // deck slab, top at 3.0
      { s: 'box', d: [12, 2.5, 3], at: [0, 1.25, -10.5], c: 'stone-dark' },                             // abutment, -z
      { s: 'box', d: [12, 2.5, 3], at: [0, 1.25, 10.5], c: 'stone-dark' },                              // abutment, +z
      { s: 'box', d: [0.5, 0.3, 24], at: [5.5, 3.15, 0], c: 'stone', mirror: true },                  // kerb
      ...RAIL_POSTS.map((z): Part => ({ s: 'cyl', d: [0.06, 0.06, 0.9], at: [5.85, 3.45, z], c: 'iron-dark', seg: 6, mirror: true })), // rail posts
      { s: 'box', d: [0.1, 0.1, 24], at: [5.85, 3.85, 0], c: 'iron-dark', mirror: true },              // top rail, top at 3.9
    ],
  },
  {
    id: 'arch-road-bridge', name: 'Arch Road Bridge', category: 'prop', uses: ['place'],
    tags: ['bridge', 'road', 'river', 'stone', 'arch', 'railing', 'deck', 'span', 'parapet', 'abutment', 'crossing', 'plaque'],
    emoji: [],
    footprint: { r: 6, h: 7.3 },
    about: 'Gnome Theft Auto: the Arch Road Bridge. A tall stone road bridge: a 12 wide, 24 long deck with its top at 6.5 on a corbelled stone arch between two piers, with spandrel walls, parapets, lamp posts and a brass plaque. Boats pass under the open span. Long axis along z, centred on the ground.',
    examine: [
      'A tall grey bridge that stands well clear of the water on a high stone arch, with lamps along its parapets and a brass plate on one side.',
      'Bridge saying: the higher the arch, the more room the boats have, and the more the gnomes complain about the walk up to it.',
      'Tip: the arch is open under the middle of the span. Steer for the gap, and keep your mast well below the stonework.',
      'Joke: the lamps on the parapets are lit every evening by a gnome who has been promised a ladder for twenty years.',
      'The brass plate says the bridge was raised by Pay-n-Glaze to clear the boats, which the boats find rather generous of them.',
    ],
    parts: [
      { s: 'box', d: [12, 0.6, 24], at: [0, 6.2, 0], c: 'slate' },                                        // deck slab, top at 6.5
      { s: 'box', d: [0.8, 2.95, 24], at: [5.6, 4.375, 0], c: 'stone', mirror: true },                    // spandrel wall, top at 5.85 (under the slab)
      { s: 'box', d: [12, 6, 3], at: [0, 3, -10.5], c: 'stone-dark' },                                   // pier, -z
      { s: 'box', d: [12, 6, 3], at: [0, 3, 10.5], c: 'stone-dark' },                                    // pier, +z
      { s: 'box', d: [11, 0.6, 24], at: [0, 3.2, 0], c: 'stone-dark' },                                  // arch course 1, y 2.9-3.5
      { s: 'box', d: [11, 0.6, 18], at: [0, 3.8, 0], c: 'stone-dark' },                                  // arch course 2, y 3.5-4.1
      { s: 'box', d: [11, 0.6, 12], at: [0, 4.4, 0], c: 'stone-dark' },                                  // arch course 3, y 4.1-4.7
      { s: 'box', d: [11, 0.6, 8], at: [0, 5.0, 0], c: 'stone-dark' },                                   // arch course 4, y 4.7-5.3
      { s: 'box', d: [11, 0.6, 5], at: [0, 5.6, 0], c: 'stone-dark' },                                   // arch course 5, y 5.3-5.9
      { s: 'box', d: [0.5, 0.9, 24], at: [5.75, 6.95, 0], c: 'stone', mirror: true },                    // parapet, top at 7.4
      { s: 'box', d: [0.05, 0.5, 1.4], at: [6.02, 4.6, 0], c: 'brass' },                                 // brass plaque on the +x wall
      { s: 'cyl', d: [0.05, 0.05, 1.4], at: [5.75, 8.1, 11.5], c: 'iron-dark', seg: 6, mirror: true },   // lamp post, +z
      { s: 'ball', d: [0.15], at: [5.75, 8.95, 11.5], c: 'brass', glow: true, seg: 6, mirror: true },     // lamp glow, +z
      { s: 'cyl', d: [0.05, 0.05, 1.4], at: [5.75, 8.1, -11.5], c: 'iron-dark', seg: 6, mirror: true },  // lamp post, -z
      { s: 'ball', d: [0.15], at: [5.75, 8.95, -11.5], c: 'brass', glow: true, seg: 6, mirror: true },    // lamp glow, -z
    ],
  },
  {
    id: 'wooden-dock', name: 'Wooden Dock', category: 'prop', uses: ['place'],
    tags: ['dock', 'jetty', 'pier', 'wood', 'planks', 'posts', 'bollard', 'rope', 'lifering', 'water'],
    emoji: [],
    footprint: { r: 1.5, h: 2.6 },
    about: 'Gnome Theft Auto: the Wooden Dock. A plank jetty 3 wide and 12 long on corner and 3 m posts, deck top at 1.6, with an iron bollard and a coiled rope near the +z end and a life ring on a post. Long axis along z.',
    examine: [
      'A long plank jetty on stubby wooden legs, with an iron bollard at one end and a rope coiled beside it like a sleeping snake.',
      'Dockers\' rhyme: plank by plank and post by post, the jetty stays up, and so does the boat.',
      'Tip: test each plank with a boot before you walk the length of it. The gaps between the boards are wider than they look from above.',
      'Joke: the life ring has been hanging there for years and has never once been needed, which is the best thing anyone can say about a life ring.',
      'Someone has scratched a row of tally marks into the nearest post. Nobody knows what they count, but there are a great many of them.',
    ],
    parts: [
      { s: 'box', d: [3, 0.15, 12], at: [0, 1.525, 0], c: 'wood-light' },                                 // deck planks, top at 1.6
      { s: 'cyl', d: [0.12, 0.12, 1.45], at: [1.4, 0.725, -6], c: 'wood-dark', seg: 8, mirror: true },    // post, corner
      { s: 'cyl', d: [0.12, 0.12, 1.45], at: [1.4, 0.725, -3], c: 'wood-dark', seg: 8, mirror: true },    // post
      { s: 'cyl', d: [0.12, 0.12, 1.45], at: [1.4, 0.725, 0], c: 'wood-dark', seg: 8, mirror: true },     // post
      { s: 'cyl', d: [0.12, 0.12, 1.45], at: [1.4, 0.725, 3], c: 'wood-dark', seg: 8, mirror: true },     // post
      { s: 'cyl', d: [0.12, 0.12, 1.45], at: [1.4, 0.725, 6], c: 'wood-dark', seg: 8, mirror: true },     // post, corner
      { s: 'cyl', d: [0.1, 0.12, 0.3], at: [0, 1.75, 5.2], c: 'iron-dark', seg: 8 },                     // bollard
      { s: 'ring', d: [0.18, 0.04], rot: [90, 0, 0], at: [-0.7, 1.65, 5.0], c: 'straw', seg: 8 },        // coiled rope, flat
      { s: 'cyl', d: [0.04, 0.04, 1.0], at: [1.2, 2.1, -4.55], c: 'iron-dark', seg: 6 },                 // life ring post
      { s: 'box', d: [0.06, 0.06, 0.2], at: [1.2, 2.0, -4.48], c: 'iron-dark' },                         // ring bracket
      { s: 'ring', d: [0.22, 0.05], at: [1.2, 2.0, -4.4], c: 'red', seg: 8 },                           // life ring
    ],
  },
  {
    id: 'wharf', name: 'Canal Wharf', category: 'prop', uses: ['place'],
    tags: ['wharf', 'quay', 'canal', 'brick', 'stone', 'bollard', 'crate', 'rope', 'dock', 'landing'],
    emoji: [],
    footprint: { r: 6, h: 2.6 },
    about: 'Gnome Theft Auto: the Canal Wharf. A brick-and-stone quay 12 wide and 6 deep, front face at +z toward the water, top surface at 1.8, with iron bollards along the edge, a crate and a coil of rope.',
    examine: [
      'A stone quay with a brick band along its front and a row of iron bollards standing guard over the water.',
      'Wharf saying: whatever goes into the canal comes out again eventually, usually with a boat attached.',
      'Tip: tie up at the bollards, not to the crate. The crate has been tied up to before and has not forgotten.',
      'Joke: the Pay-n-Glaze sign on the warehouse says the quay was built to last forever, and so far the quay is inclined to agree.',
      'The iron bollards were cast in one batch, and each one has a slightly different number scratched into its top by a bored lock-keeper.',
    ],
    parts: [
      { s: 'box', d: [12, 1.7, 6], at: [0, 0.85, 0], c: 'stone-dark' },                                 // quay body, top at 1.7
      { s: 'box', d: [12, 0.1, 6], at: [0, 1.75, 0], c: 'stone' },                                       // coping, top at 1.8
      { s: 'box', d: [12.05, 0.25, 0.12], at: [0, 0.6, 3.0], c: 'clay' },                                // brick band on the front
      { s: 'cyl', d: [0.1, 0.12, 0.35], at: [4.5, 1.975, 2.4], c: 'iron-dark', seg: 8, mirror: true },   // bollard
      { s: 'cyl', d: [0.1, 0.12, 0.35], at: [0, 1.975, 2.4], c: 'iron-dark', seg: 8 },                   // bollard, centre
      { s: 'box', d: [0.9, 0.8, 0.9], at: [2.0, 2.2, -1.0], c: 'wood' },                                 // crate
      { s: 'box', d: [0.6, 0.5, 0.6], at: [2.9, 2.05, -1.1], c: 'wood-light' },                          // small crate
      { s: 'ring', d: [0.2, 0.07], rot: [90, 0, 0], at: [-1.5, 1.87, -1.0], c: 'straw', seg: 8 },        // coil of rope
    ],
  },
  {
    id: 'canal-lock-gate', name: 'Canal Lock Gates', category: 'prop', uses: ['place'],
    tags: ['lock', 'gate', 'gates', 'canal', 'timber', 'sluice', 'mitre', 'beam', 'footbridge', 'water'],
    emoji: [],
    footprint: { r: 5.6, h: 2.6 },
    about: 'Gnome Theft Auto: the Canal Lock Gates. Open timber gate leaves 4.8 long and 2.6 tall against two stone walls across a 10 m canal, long balance beams behind them, a footbridge plank across the top and a sponsor board. Boats pass between the leaves. Long axis along z.',
    examine: [
      'Two tall timber gates stand open against the stone walls, with a plank footbridge laid across the top like a very narrow hat.',
      'Canal rhyme: the gates are closed to lift the boat, and open to let it go, and the boat has never once been consulted.',
      'Tip: keep clear of the balance beams. They swing back and forth with the water, and they do not care who is standing where.',
      'Joke: the lock-keeper says the gates are sound, and the lock-keeper has been saying so for a very long time, from the middle of the footbridge.',
      'Painted on the nearest wall in very neat letters is the sponsor, Pay-n-Glaze Lock No. 1, and a smaller line: no swimming, no exceptions.',
    ],
    parts: [
      { s: 'box', d: [0.3, 2.6, 4.8], at: [4.7, 1.3, 0], c: 'wood', mirror: true },                         // gate leaf, open
      { s: 'box', d: [0.6, 2.4, 6], at: [5.3, 1.2, 0], c: 'stone-dark', mirror: true },                     // lock wall
      { s: 'box', d: [0.22, 0.2, 4.0], at: [4.7, 2.5, -4.4], c: 'wood-dark', mirror: true },               // balance beam
      { s: 'box', d: [11.2, 0.2, 0.8], at: [0, 2.5, 0], c: 'wood-light' },                                 // footbridge plank, y 2.4-2.6
      { s: 'box', d: [0.06, 0.5, 1.6], at: [5.63, 1.6, 0], c: 'cloth' },                                  // sponsor board
      { s: 'cyl', d: [0.2, 0.2, 0.2], at: [5.3, 2.5, -1.5], c: 'iron-dark', seg: 8 },                     // capstan on the wall top
      { s: 'box', d: [0.6, 1.2, 0.6], at: [5.3, 0.6, -3.3], c: 'stone', mirror: true },                    // buttress, -z
      { s: 'box', d: [0.6, 1.2, 0.6], at: [5.3, 0.6, 3.3], c: 'stone', mirror: true },                     // buttress, +z
    ],
  },
  {
    id: 'loch-weir', name: 'Loch Weir', category: 'prop', uses: ['place'],
    tags: ['weir', 'sluice', 'river', 'loch', 'stone', 'sill', 'board', 'wheel', 'dam', 'water'],
    emoji: [],
    footprint: { r: 6, h: 3.7 },
    about: 'Gnome Theft Auto: the Loch Weir. A stone sill 12 wide and 2 deep across a river, top at 2.4, with a timber sluice frame in the middle (two posts 3.2 tall, a cross beam, a board) and a little wheel to raise the board. Long axis along x.',
    examine: [
      'A low stone wall across the river, with a wooden frame in the middle and a little wheel on top that lifts the board.',
      'Loch saying: the water goes over the weir when it likes, and under the board when it is told, and never the other way round.',
      'Tip: do not sit on the sill to watch the water. The sill is wet, the water is quick, and the sluice-keeper is slow to laugh.',
      'Joke: the wheel is turned by one gnome and a great deal of hope, and the hope is usually the first to get tired.',
      'The gauge board on the front is marked in acorns, not inches, and it has never once been agreed what an acorn of water is.',
    ],
    parts: [
      { s: 'box', d: [12, 2.4, 2], at: [0, 1.2, 0], c: 'stone' },                                       // sill, top at 2.4
      { s: 'cyl', d: [0.12, 0.12, 3.2], at: [1.2, 1.6, 0], c: 'wood', seg: 8, mirror: true },              // sluice post
      { s: 'box', d: [2.8, 0.2, 0.2], at: [0, 3.0, 0], c: 'wood-dark' },                                   // cross beam
      { s: 'box', d: [2.0, 0.5, 0.1], at: [0, 2.65, 0], c: 'wood-dark' },                                  // sluice board
      { s: 'ring', d: [0.22, 0.04], at: [0, 3.3, 0.14], c: 'iron-dark', seg: 8 },                         // winding wheel
      { s: 'ball', d: [0.05], at: [0, 3.3, 0.14], c: 'iron', seg: 6 },                                      // wheel hub
      { s: 'box', d: [0.5, 0.9, 0.06], at: [3.0, 1.3, 1.03], c: 'white' },                                 // gauge board
      { s: 'ball', d: [0.5], at: [-6.2, 0.5, 0], c: 'stone-dark', seg: 6, mirror: true },                    // rubble at the bank
    ],
  },
  {
    id: 'field-sluice', name: 'Field Sluice', category: 'prop', uses: ['place'],
    tags: ['sluice', 'field', 'ditch', 'headwall', 'gate', 'iron', 'wheel', 'channel', 'water', 'concrete'],
    emoji: [],
    footprint: { r: 1.6, h: 2.7 },
    about: 'Gnome Theft Auto: the Field Sluice. A small stone headwall 3 wide and 2.2 tall with an iron gate in a slot on +z, a hand wheel on a spindle on top and a short ditch lip in front. Top at 2.2 (wheel to 2.7).',
    examine: [
      'A squat stone wall with an iron gate set in its face and a wheel on top, like a small gate that has been taught manners.',
      'Field saying: the water goes where the wall says, and the wall goes where the farmer says, and the farmer is in no hurry.',
      'Tip: turn the wheel slowly, a quarter at a time. A fast turn lets the whole ditch out at once, and then the ditch is very cross.',
      'Joke: the iron gate was once a shed door, and it still tries to shut itself whenever anyone is standing close enough to be hurt by it.',
      'The lip in front is worn smooth in one place, which is where every gnome in the valley has stood to look at the water and say nothing.',
    ],
    parts: [
      { s: 'box', d: [3, 2.2, 1], at: [0, 1.1, 0], c: 'stone-dark' },                                     // headwall
      { s: 'box', d: [1.0, 1.0, 0.06], at: [0, 1.0, 0.53], c: 'iron' },                                    // iron gate in the slot
      { s: 'box', d: [1.1, 0.1, 0.1], at: [0, 1.55, 0.53], c: 'iron-dark' },                               // slot frame, top
      { s: 'box', d: [0.08, 1.1, 0.1], at: [0.56, 1.05, 0.53], c: 'iron-dark', mirror: true },            // slot frame, sides
      { s: 'cyl', d: [0.04, 0.04, 0.5], at: [0, 2.45, 0], c: 'iron-dark', seg: 6 },                         // spindle
      { s: 'ring', d: [0.22, 0.03], at: [0, 2.5, 0], c: 'iron', seg: 8 },                                  // hand wheel
      { s: 'box', d: [2.6, 0.15, 1.0], at: [0, 0.075, 1.0], c: 'stone' },                                  // ditch lip
      { s: 'box', d: [0.2, 0.3, 1.0], at: [1.4, 0.15, 1.0], c: 'stone', mirror: true },                    // ditch side lip
    ],
  },
];
