// Gnome Theft Auto: fringe buildings A (docs/roadmaps/gta-parks-and-fringe.md). Life-size metres, standing on y = 0, centred on
// x and z, front on +z. Rough = weathered: rust patches, mismatched panels, stains, and a little rooftop gear on each.
import type { PrefabDef } from '../types';

export const GTA_FRINGE_KIT: readonly PrefabDef[] = [
  {
    id: 'rough-workshop', name: 'Rough Workshop', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'rough'], emoji: [],
    tint: 0x8a8f86,
    footprint: { r: 5, h: 5 },
    about: 'Gnome Theft Auto: the Rough Workshop. Corrugated shed 10 x 8 x 5 m with a big roller door, a side door and a roof vent. tint = walls. Life-size metres.',
    examine: [
      'Tall corrugated walls of tin, ribbed like a washboard and patched with rust, under a roof that is only slightly less tired than the walls.',
      'Saying: a shed that has been mended more often than it was built is still a shed, and it will tell you so with a loud clatter.',
      'Tip: knock on the wall before going in. The big door rattles when it is ready to open and sulks when it is not.',
      'Joke: the shed has never once made anything, but it has heard that claim so often that it now argues back in a clatter.',
      'Behind the roof vent a pale stripe of paint shows where a much larger sign used to hang, and nobody has agreed what it said.',
    ],
    parts: [
      { s: 'box', d: [10, 4, 8], at: [0, 2, 0], c: 'tint' },                              // walls
      { s: 'box', d: [10.2, 0.15, 4.4], at: [0, 4.5, 2.1], rot: [13.4, 0, 0], c: 'slate' }, // shallow pitched roof
      { s: 'box', d: [10.2, 0.15, 4.4], at: [0, 4.5, -2.1], rot: [-13.4, 0, 0], c: 'slate' },
      { s: 'box', d: [0.08, 3.6, 0.12], at: [5.02, 2, -2.4], c: 'tint', mirror: true },     // corrugation ribs
      { s: 'box', d: [0.08, 3.6, 0.12], at: [5.02, 2, 0], c: 'tint', mirror: true },
      { s: 'box', d: [0.08, 3.6, 0.12], at: [5.02, 2, 2.4], c: 'tint', mirror: true },
      { s: 'box', d: [3.6, 3.0, 0.1], at: [-1.5, 1.5, 4.05], c: 'iron-dark' },             // roller door
      { s: 'box', d: [3.6, 0.1, 0.12], at: [-1.5, 0.9, 4.07], c: 'iron' },                // door bands
      { s: 'box', d: [3.6, 0.1, 0.12], at: [-1.5, 2.1, 4.07], c: 'iron' },
      { s: 'box', d: [0.9, 2.1, 0.1], at: [3.2, 1.05, 4.05], c: 'wood-dark' },             // side door
      { s: 'box', d: [0.7, 0.4, 0.04], at: [-4.0, 3.4, 4.02], c: 'rust' },                // rust patches
      { s: 'box', d: [0.04, 0.8, 1.2], at: [5.02, 1.2, 1.0], c: 'rust', mirror: true },
      { s: 'box', d: [0.04, 1.4, 0.9], at: [5.02, 2.5, -0.6], c: 'dirt', mirror: true },   // stain
      { s: 'cyl', d: [0.18, 0.18, 0.4], at: [-3, 5.2, 0], c: 'iron-dark', seg: 8 },        // roof vent
    ],
  },
  {
    id: 'lockup-row', name: 'Lock-Up Row', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'lockup'], emoji: [],
    tint: 0x5b7a8a,
    footprint: { r: 6, h: 3 },
    about: 'Gnome Theft Auto: the Lock-Up Row. Four roller-door units in a row, 12 x 6 x 3 m, one door half open. tint = doors. Life-size metres.',
    examine: [
      'A row of four tall tin hutches with hinged doors on the front, each door painted the grey-blue of a sky that has given up.',
      'Saying: a locked door keeps the dark in and the gnomes out, which is the only fair arrangement anyone has ever made with the dark.',
      'Tip: the hutches with a door half up are the ones nobody has checked in weeks. Look inside before you lean on one.',
      'Joke: the four hutches share one roof and one drain, and they have argued about who gets the roof for forty years.',
      'One door has been rolled up just enough to show a cold grey floor and a single tin cup, set in the exact middle as if expected.',
    ],
    parts: [
      { s: 'box', d: [12, 2.4, 5.6], at: [0, 1.2, 0], c: 'stone' },                       // walls
      { s: 'box', d: [12.2, 0.2, 6.2], at: [0, 2.5, 0], c: 'stone-dark' },                // flat roof slab
      { s: 'box', d: [12.2, 0.4, 0.2], at: [0, 2.8, 3.1], c: 'stone-dark' },              // roof lips
      { s: 'box', d: [12.2, 0.4, 0.2], at: [0, 2.8, -3.1], c: 'stone-dark' },
      { s: 'box', d: [2.6, 2.2, 0.1], at: [-4.5, 1.1, 2.85], c: 'tint' },                 // closed roller doors
      { s: 'box', d: [2.6, 2.2, 0.1], at: [1.5, 1.1, 2.85], c: 'tint' },
      { s: 'box', d: [2.6, 2.2, 0.1], at: [4.5, 1.1, 2.85], c: 'tint' },
      { s: 'box', d: [2.5, 2.0, 0.12], at: [-1.5, 1.0, 2.86], c: 'black' },              // open unit, dark inside
      { s: 'box', d: [2.6, 0.4, 0.12], at: [-1.5, 2.2, 2.86], c: 'tint' },                // rolled-up door
      { s: 'box', d: [0.16, 2.4, 0.2], at: [-3, 1.2, 2.85], c: 'stone-dark' },            // dividers
      { s: 'box', d: [0.16, 2.4, 0.2], at: [0, 1.2, 2.85], c: 'stone-dark' },
      { s: 'box', d: [0.16, 2.4, 0.2], at: [3, 1.2, 2.85], c: 'stone-dark' },
      { s: 'cyl', d: [0.06, 0.06, 2.6], at: [5.9, 1.3, 2.9], c: 'iron', seg: 8 },           // drainpipe
    ],
  },
  {
    id: 'rough-warehouse', name: 'Rough Warehouse', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'rough'], emoji: [],
    tint: 0xa89a7a,
    footprint: { r: 9, h: 7 },
    about: 'Gnome Theft Auto: the Rough Warehouse. Big two-step shed 18 x 12 x 7 m with a loading dock, high windows and a rooftop tank. tint = walls. Life-size metres.',
    examine: [
      'A long low shed of pale tin with a stepped roof, a loading shelf on the front and high dark slots running along the walls near the top.',
      'Saying: a building this big has more rooms than it needs and more echoes than it can hold, and the echoes have started to answer back.',
      'Tip: the big shutter lifts with the rope on the left side. Pull the right side and the shutter will come down on your head.',
      'Joke: the front has a painted sign so old that only the unpainted letters survive, and they seem to say STOP, which is good advice.',
      'A water tank sits on the roof on four stilts. A gnome once climbed up to check it and came down with a fish, and nobody knows where the fish came from.',
    ],
    parts: [
      { s: 'box', d: [18, 5.6, 9], at: [0, 2.8, -1.5], c: 'tint' },                         // walls
      { s: 'box', d: [18.4, 0.25, 9.0], at: [0, 5.725, -1.5], c: 'slate' },                // lower roof step
      { s: 'box', d: [10, 1.2, 7], at: [0, 6.45, -1.5], c: 'slate' },                      // raised roof step
      { s: 'box', d: [0.06, 0.6, 8], at: [9.03, 4.6, -1.5], c: 'black', mirror: true },    // high side windows
      { s: 'box', d: [10, 0.6, 0.06], at: [0, 4.6, -6.03], c: 'black' },                   // high back window
      { s: 'box', d: [10, 1.0, 3.0], at: [0, 0.5, 4.5], c: 'stone' },                      // loading dock
      { s: 'box', d: [7, 3.4, 0.12], at: [0, 2.7, 3.02], c: 'iron-dark' },                 // dock shutter
      { s: 'box', d: [6, 0.8, 0.12], at: [0, 5.0, 3.04], c: 'cloth' },                     // faded sign
      { s: 'box', d: [0.04, 1.0, 1.2], at: [9.02, 2.2, -3.0], c: 'rust', mirror: true },   // rust patch
      { s: 'cyl', d: [0.9, 0.9, 1.4], at: [6.5, 6.55, -4.0], c: 'iron', seg: 10 },        // rooftop tank
      { s: 'cone', d: [0.95, 0.3], at: [6.5, 7.4, -4.0], c: 'iron-dark', seg: 10 },        // tank cap
      { s: 'cyl', d: [0.15, 0.15, 0.6], at: [-6.5, 6.15, 1.0], c: 'iron-dark', seg: 6 },   // roof vent pipe
    ],
  },
  {
    id: 'rough-pub', name: 'The Rusty Tine', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'rough'], emoji: [],
    tint: 0x8a4a3a,
    footprint: { r: 5, h: 6 },
    about: 'Gnome Theft Auto: the Rusty Tine. Two-storey brick house 10 x 8 x 6 m with a slate roof, a chimney, glowing windows, a hanging fork sign and barrels by the door. tint = walls. Life-size metres.',
    examine: [
      'A squat two-storey house of dark brick with a slate roof, warm windows on the front, and a chimney that breathes grey smoke in the evening.',
      'Saying: the house with the fork over the door is always warm, and the voices inside are always louder than the fire.',
      'Tip: the barrels by the door are full of something that is not water. Do not tip them over, they are heavy and they are full.',
      'Joke: the fork on the sign has three tines, and every gnome who has ever come out of that door swears it had four.',
      'The fork on the sign was painted by a gnome who was certain it was a fork, and still nobody has been able to say what it is for.',
    ],
    parts: [
      { s: 'box', d: [10, 4, 7.2], at: [0, 2, 0], c: 'tint' },                              // brick walls
      { s: 'box', d: [10.4, 0.18, 4.5], at: [0, 5.0, 2.0], rot: [26.6, 0, 0], c: 'slate' }, // pitched slate roof
      { s: 'box', d: [10.4, 0.18, 4.5], at: [0, 5.0, -2.0], rot: [-26.6, 0, 0], c: 'slate' },
      { s: 'box', d: [0.7, 1.9, 0.7], at: [3.0, 5.0, -2.0], c: 'stone-dark' },              // chimney
      { s: 'box', d: [1.0, 2.0, 0.1], at: [0, 1.0, 3.65], c: 'wood-dark' },                 // door
      { s: 'box', d: [1.2, 1.0, 0.08], at: [-3, 1.3, 3.64], c: 'glass', glow: true },       // ground windows
      { s: 'box', d: [1.2, 1.0, 0.08], at: [3, 1.3, 3.64], c: 'glass', glow: true },
      { s: 'box', d: [1.2, 1.0, 0.08], at: [-3, 2.9, 3.64], c: 'glass', glow: true },       // upper windows
      { s: 'box', d: [1.2, 1.0, 0.08], at: [3, 2.9, 3.64], c: 'glass', glow: true },
      { s: 'box', d: [0.9, 0.6, 0.06], at: [1.6, 2.4, 3.7], c: 'wood-dark' },              // hanging sign board
      { s: 'box', d: [0.6, 0.05, 0.05], at: [1.6, 2.75, 3.67], c: 'iron-dark' },           // bracket
      { s: 'box', d: [0.05, 0.4, 0.03], at: [1.45, 2.4, 3.75], c: 'rust' },                // painted fork tines
      { s: 'box', d: [0.05, 0.4, 0.03], at: [1.6, 2.4, 3.75], c: 'rust' },
      { s: 'box', d: [0.05, 0.4, 0.03], at: [1.75, 2.4, 3.75], c: 'rust' },
      { s: 'cyl', d: [0.3, 0.3, 0.9], at: [-1.6, 0.45, 3.9], c: 'wood', seg: 8 },            // beer barrels
      { s: 'cyl', d: [0.3, 0.3, 0.9], at: [-0.9, 0.45, 3.9], c: 'wood', seg: 8 },
      { s: 'cyl', d: [0.32, 0.32, 0.06], at: [-1.6, 0.25, 3.9], c: 'iron', seg: 8 },         // hoops
      { s: 'cyl', d: [0.32, 0.32, 0.06], at: [-0.9, 0.25, 3.9], c: 'iron', seg: 8 },
      { s: 'box', d: [0.7, 0.4, 0.04], at: [4.3, 0.6, 3.62], c: 'rust' },                   // rust on the wall
    ],
  },
  {
    id: 'portacabin', name: 'Portacabin', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'portacabin'], emoji: [],
    tint: 0xd9c06a,
    footprint: { r: 3, h: 2.6 },
    about: 'Gnome Theft Auto: the Portacabin. Site cabin 6 x 2.6 x 2.6 m on blocks, with a door, two windows, steps and a roof unit. tint = body. Life-size metres.',
    examine: [
      'A small box of tin on blocks, with a single door, two windows and a lip of roof, painted a pale yellow that has faded to the colour of butter.',
      'Saying: a cabin that stands on blocks has no roots, so it can be moved in the night while the gnomes are asleep, and it often is.',
      'Tip: the steps are the only level thing about the cabin. Put your foot on the top step and count to three before the door opens.',
      'Joke: the box on the roof hums all summer long, and the cabin has never once been able to explain why it thinks it is cooler than anyone.',
      'A rust stain runs down one end in a long thin tongue, as if the cabin had been crying there for years and nobody had fixed the leak.',
    ],
    parts: [
      { s: 'box', d: [6, 2.0, 2.2], at: [0, 1.3, 0], c: 'tint' },                           // body
      { s: 'box', d: [6.1, 0.3, 2.3], at: [0, 2.45, 0], c: 'iron-dark' },                  // roof lip
      { s: 'box', d: [0.9, 1.8, 0.07], at: [-1.2, 1.2, 1.135], c: 'slate' },               // door
      { s: 'box', d: [0.9, 0.7, 0.06], at: [0.6, 1.45, 1.13], c: 'glass' },                // windows
      { s: 'box', d: [0.9, 0.7, 0.06], at: [2.0, 1.45, 1.13], c: 'glass' },
      { s: 'box', d: [1.0, 0.3, 0.2], at: [-1.2, 0.15, 1.2], c: 'iron' },                  // front step
      { s: 'box', d: [1.0, 0.3, 0.2], at: [-1.2, 0.15, -1.2], c: 'iron' },                 // rear step
      { s: 'box', d: [0.4, 0.3, 0.4], at: [2.4, 0.15, 0.9], c: 'stone', mirror: true },    // blocks under
      { s: 'box', d: [0.4, 0.3, 0.4], at: [2.4, 0.15, -0.9], c: 'stone', mirror: true },
      { s: 'box', d: [0.8, 0.2, 0.6], at: [1.5, 2.7, -0.2], c: 'steel' },                   // roof unit
      { s: 'box', d: [0.04, 0.5, 0.6], at: [3.02, 1.0, 0.6], c: 'rust', mirror: true },    // rust stain
    ],
  },
  {
    id: 'nissen-hut', name: 'Nissen Hut', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'nissen'], emoji: [],
    tint: 0x6a6e66,
    footprint: { r: 4, h: 3 },
    about: 'Gnome Theft Auto: the Nissen Hut. Half-round corrugated hut 8 x 5 x 3 m with brick end walls and a small porch on the +z side. tint = roof. Life-size metres.',
    examine: [
      'A low hut shaped like a half-buried barrel of corrugated tin, with brick end walls and a little porch on the long side that faces the road.',
      'Saying: a hut with a round roof has never had to decide which way is up, and it is all the better for not thinking about it.',
      'Tip: stand in the middle of the hut and the rain becomes a drum. Do not sing inside, the roof gives the song back twice.',
      'Joke: the hut has no corners, so when a gnome asks it where the corner is, it can only shrug, and it has been shrugging since the Tall Ones left.',
      'Someone has scratched a row of tiny tally marks into one porch post, one for every visitor who came to the door and then left again.',
    ],
    parts: [
      // the roof: a half-round of tilted tin slices, arc centred at y 0.5 (radius 2.5, top at 3.0), cut off by the ground
      { s: 'box', d: [8, 0.1, 1.25], at: [0, 0.63084, -2.49657], rot: [-87, 0, 0], c: 'tint' },
      { s: 'box', d: [8, 0.1, 1.25], at: [0, 1.8248, -2.12012], rot: [-58, 0, 0], c: 'tint' },
      { s: 'box', d: [8, 0.1, 1.25], at: [0, 2.68655, -1.21203], rot: [-29, 0, 0], c: 'tint' },
      { s: 'box', d: [8, 0.1, 1.25], at: [0, 3.0, 0], c: 'tint' },
      { s: 'box', d: [8, 0.1, 1.25], at: [0, 2.68655, 1.21203], rot: [29, 0, 0], c: 'tint' },
      { s: 'box', d: [8, 0.1, 1.25], at: [0, 1.8248, 2.12012], rot: [58, 0, 0], c: 'tint' },
      { s: 'box', d: [8, 0.1, 1.25], at: [0, 0.63084, 2.49657], rot: [87, 0, 0], c: 'tint' },
      { s: 'box', d: [0.14, 1.2, 4.8], at: [3.99, 0.6, 0], c: 'clay-dark', mirror: true },   // brick end walls
      { s: 'box', d: [0.12, 1.0, 3.6], at: [3.99, 1.7, 0], c: 'clay-dark', mirror: true },  // gable infill
      { s: 'box', d: [0.9, 1.4, 0.08], at: [0, 0.7, 2.46], c: 'wood-dark' },                // door on the long side
      { s: 'box', d: [2.1, 0.1, 0.5], at: [0, 1.9, 2.5], c: 'tint' },                       // porch roof
      { s: 'box', d: [0.1, 1.85, 0.1], at: [0.95, 0.925, 2.7], c: 'wood-dark', mirror: true }, // porch posts
      { s: 'box', d: [0.9, 0.12, 0.25], at: [0, 0.06, 2.62], c: 'stone' },                 // porch step
      { s: 'cyl', d: [0.1, 0.1, 0.25], at: [-2.0, 3.12, 0], c: 'iron-dark', seg: 6 },       // roof vent
    ],
  },
];
