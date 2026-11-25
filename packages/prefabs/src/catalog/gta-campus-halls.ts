// Gnome Theft Auto, Rootwell University (E13): the halls round the quad. Six buildings, authored at HALF size: the game places
// them with scale 2. Stone and clay walls, slate roofs, dark glass windows (0.03 proud), nothing coplanar.
import type { PrefabDef } from '../types';

export const GTA_CAMPUS_HALLS: readonly PrefabDef[] = [
  {
    id: 'rootwell-library', name: 'The Long Shelf', category: 'prop', uses: ['place'],
    tags: ['library', 'shelf', 'books', 'hall', 'stone', 'slate', 'portico', 'rootwell', 'campus', 'university', 'building', 'gta'],
    emoji: [],
    footprint: { r: 9, h: 9.3 },
    about: 'Gnome Theft Auto: The Long Shelf, the Rootwell library. Half-size (game scale 2): 18 x 11 m body, front door on +z. Stone walls, a tall slate roof, a four-column portico with a book-spine frieze, five windows a side.',
    examine: [
      'A long stone hall under a tall slate roof, its portico carved with a frieze of book spines that nobody has ever been allowed to take down.',
      'Saying: a library is a garden where every flower is bound in leather and does not need watering, only dusting.',
      'Tip: the Long Shelf opens at dawn and closes when the last reader falls asleep on the steps. The steps are not for reading on.',
      'Joke: the catalogue is in order of height, so the largest books are always at the back, where nobody can reach them without a ladder.',
      'A small brass plate by the door reads "Please do not eat the shelves." The shelves have been eaten anyway, and the plate has been replaced twice.',
    ],
    parts: [
      { s: 'box', d: [18, 6, 11], at: [0, 3, 0], c: 'stone' },                                              // walls
      { s: 'box', d: [18.1, 0.4, 11.1], at: [0, 0.2, 0], c: 'stone-dark' },                                 // plinth
      { s: 'box', d: [18.2, 0.3, 6.71], at: [0, 7.5, 3], rot: [26.57, 0, 0], c: 'slate' },                  // roof, front slope
      { s: 'box', d: [18.2, 0.3, 6.71], at: [0, 7.5, -3], rot: [-26.57, 0, 0], c: 'slate' },                // roof, back slope
      { s: 'box', d: [6.4, 0.3, 2.4], at: [0, 0.15, 6.5], c: 'stone' },                                     // portico floor
      { s: 'box', d: [6.4, 0.15, 0.5], at: [0, 0.075, 7.95], c: 'stone-dark' },                             // portico step
      { s: 'box', d: [7, 0.3, 2.6], at: [0, 5.75, 6.7], c: 'slate' },                                       // portico roof
      { s: 'cyl', d: [0.28, 0.3, 5.6], at: [0.6, 2.8, 7.1], c: 'chalk', seg: 8, mirror: true },              // columns, inner pair
      { s: 'cyl', d: [0.28, 0.3, 5.6], at: [1.8, 2.8, 7.1], c: 'chalk', seg: 8, mirror: true },              // columns, outer pair
      { s: 'box', d: [0.8, 0.36, 0.06], at: [-3, 5, 5.5], c: 'red' },                                       // frieze books
      { s: 'box', d: [0.8, 0.36, 0.06], at: [-2, 5, 5.5], c: 'blue' },
      { s: 'box', d: [0.8, 0.36, 0.06], at: [-1, 5, 5.5], c: 'green' },
      { s: 'box', d: [0.8, 0.36, 0.06], at: [0, 5, 5.5], c: 'yellow' },
      { s: 'box', d: [0.8, 0.36, 0.06], at: [1, 5, 5.5], c: 'orange' },
      { s: 'box', d: [0.8, 0.36, 0.06], at: [2, 5, 5.5], c: 'purple' },
      { s: 'box', d: [0.8, 0.36, 0.06], at: [3, 5, 5.5], c: 'wood-dark' },
      { s: 'box', d: [2.4, 2.4, 0.04], at: [0, 1.2, 5.52], c: 'wood-dark' },                                // double door
      { s: 'box', d: [0.7, 2, 0.06], at: [3.5, 3.2, 5.5], c: 0x2b3a4a, mirror: true },                      // windows, five a side
      { s: 'box', d: [0.7, 2, 0.06], at: [4.7, 3.2, 5.5], c: 0x2b3a4a, mirror: true },
      { s: 'box', d: [0.7, 2, 0.06], at: [5.9, 3.2, 5.5], c: 0x2b3a4a, mirror: true },
      { s: 'box', d: [0.7, 2, 0.06], at: [7.1, 3.2, 5.5], c: 0x2b3a4a, mirror: true },
      { s: 'box', d: [0.7, 2, 0.06], at: [8.3, 3.2, 5.5], c: 0x2b3a4a, mirror: true },
      { s: 'box', d: [5.6, 0.1, 0.1], at: [5.9, 2.15, 5.5], c: 'white', mirror: true },                       // sills
      { s: 'box', d: [5.6, 0.1, 0.1], at: [5.9, 4.3, 5.5], c: 'white', mirror: true },                       // lintels
    ],
  },
  {
    id: 'rootwell-plumbob-hall', name: 'Plumbob Hall', category: 'prop', uses: ['place'],
    tags: ['hall', 'physics', 'clock', 'tower', 'helipad', 'brick', 'clay', 'flat', 'rootwell', 'campus', 'university', 'building', 'gta'],
    emoji: [],
    footprint: { r: 8, h: 5.5 },
    about: 'Gnome Theft Auto: Plumbob Hall, the gnome-physics hall. Half-size (game scale 2): 14 x 12 m clay-brick body with a flat roof at y 5.0, a helipad, a parapet and a clock tower with a plumb bob at the back-left corner. Front door on +z.',
    examine: [
      'A square clay-brick hall with a flat roof, a helipad painted on top, and a slim clock tower at the back corner with a plumb bob under a little arch.',
      'Saying: a plumb bob always finds the bottom, which is more than can be said for the gnomes who tried to work out why it swings.',
      'Tip: the helipad is for landing. Nothing has landed on it yet, but it is always kept clear, in case something does.',
      'Joke: the clock has one hand, which is the right number for a clock that is only ever interested in being level.',
      'The bob has swung out of line for thirty years. The physics faculty calls this settling, and the building says nothing at all.',
    ],
    parts: [
      { s: 'box', d: [14, 4.7, 12], at: [0, 2.35, 0], c: 'clay' },                                          // walls
      { s: 'box', d: [14.2, 0.3, 12.2], at: [0, 4.85, 0], c: 'stone-dark' },                                // flat roof slab, top at y 5.0
      { s: 'box', d: [14, 0.5, 0.3], at: [0, 5.25, 5.9], c: 'clay' },                                       // parapet, front
      { s: 'box', d: [14, 0.5, 0.3], at: [0, 5.25, -5.9], c: 'clay' },                                      // parapet, back
      { s: 'box', d: [0.3, 0.5, 11.6], at: [6.9, 5.25, 0], c: 'clay', mirror: true },                       // parapet, sides
      { s: 'cyl', d: [2.5, 2.5, 0.02], at: [0, 5.01, 0], c: 'white', seg: 16 },                             // helipad disc
      { s: 'box', d: [0.25, 0.01, 2], at: [0.6, 5.025, 0], c: 'red', mirror: true },                        // helipad H, uprights
      { s: 'box', d: [0.95, 0.01, 0.25], at: [0, 5.025, 0], c: 'red' },                                     // helipad H, bar
      { s: 'box', d: [1.4, 4.3, 1.4], at: [-5.8, 6.85, -4.8], c: 'clay' },                                  // clock tower, to y 9.0
      { s: 'cyl', d: [0.5, 0.5, 0.03], at: [-5.8, 7.5, -4.085], rot: [90, 0, 0], c: 'white', seg: 10 },    // clock face
      { s: 'box', d: [0.12, 0.8, 0.12], at: [-6.35, 9.4, -4.8], c: 'clay' },                                // arch post
      { s: 'box', d: [0.12, 0.8, 0.12], at: [-5.25, 9.4, -4.8], c: 'clay' },                                // arch post
      { s: 'box', d: [1.7, 0.2, 0.2], at: [-5.8, 9.9, -4.8], c: 'slate' },                                  // arch beam
      { s: 'cone', d: [0.12, 0.3], at: [-5.8, 9.25, -4.8], rot: [180, 0, 0], c: 'iron-dark', seg: 8 },      // plumb bob
      { s: 'cyl', d: [0.01, 0.01, 0.4], at: [-5.8, 9.6, -4.8], c: 'iron', seg: 4 },                         // plumb line
      { s: 'box', d: [1.6, 2.6, 0.04], at: [0, 1.3, 6.02], c: 'wood-dark' },                                // front door
      { s: 'box', d: [1.2, 1.4, 0.04], at: [1.5, 2.4, 6], c: 'white', mirror: true },                       // windows, frames
      { s: 'box', d: [1.2, 1.4, 0.04], at: [4.5, 2.4, 6], c: 'white', mirror: true },
      { s: 'box', d: [1, 1.2, 0.06], at: [1.5, 2.4, 6], c: 0x2b3a4a, mirror: true },                        // windows, glass
      { s: 'box', d: [1, 1.2, 0.06], at: [4.5, 2.4, 6], c: 0x2b3a4a, mirror: true },
    ],
  },
  {
    id: 'rootwell-lecture-hall', name: 'Tilth Hall', category: 'prop', uses: ['place'],
    tags: ['lecture', 'hall', 'tilth', 'stone', 'pediment', 'stair', 'rootwell', 'campus', 'university', 'building', 'gta'],
    emoji: [],
    footprint: { r: 11, h: 6.7 },
    about: 'Gnome Theft Auto: Tilth Hall, the lecture hall. Half-size (game scale 2): 18 x 12 m stone body with a flat roof at y 5.5 and a parapet, a pediment over a wide double door on +z, two rows of windows, a stair hut on the roof.',
    examine: [
      'A stone lecture hall with a pediment over its wide double doors, two rows of windows, and a stair hut on the flat roof behind a low parapet.',
      'Saying: a lecture is a long way of saying a short thing, and Tilth Hall has the windows to prove it, one row at a time.',
      'Tip: the front benches are for the eager. The back benches are for the gnomes who mean to be eager later, after lunch.',
      'Joke: the length of each lecture is set by the sugar supply, and the sugar supply is set by the ants, who are never in a hurry.',
      'The stair hut was built for the caretaker, who went up once to check the view. The view is still being checked, very thoroughly.',
    ],
    parts: [
      { s: 'box', d: [18, 5.2, 12], at: [0, 2.6, 0], c: 'stone' },                                          // walls
      { s: 'box', d: [18.2, 0.3, 12.2], at: [0, 5.35, 0], c: 'stone-dark' },                                // flat roof slab, top at y 5.5
      { s: 'box', d: [18, 0.5, 0.3], at: [0, 5.75, 5.9], c: 'stone' },                                      // parapet, front
      { s: 'box', d: [18, 0.5, 0.3], at: [0, 5.75, -5.9], c: 'stone' },                                     // parapet, back
      { s: 'box', d: [0.3, 0.5, 11.6], at: [8.9, 5.75, 0], c: 'stone', mirror: true },                      // parapet, sides
      { s: 'box', d: [2.2, 0.25, 0.5], at: [-1, 3.4, 6], rot: [0, 0, 22], c: 'stone-dark', mirror: true },  // pediment, two slopes
      { s: 'box', d: [3.6, 2.8, 0.04], at: [0, 1.4, 6.02], c: 'wood-dark' },                               // wide double door
      { s: 'box', d: [5.4, 0.3, 1.7], at: [0, 0.15, 6.75], c: 'stone' },                                    // door platform
      { s: 'box', d: [1.2, 1.3, 0.04], at: [3.6, 1.9, 6], c: 'white', mirror: true },                       // window frames, lower row
      { s: 'box', d: [1.2, 1.3, 0.04], at: [6.6, 1.9, 6], c: 'white', mirror: true },
      { s: 'box', d: [1.2, 1.3, 0.04], at: [3.6, 3.7, 6], c: 'white', mirror: true },                       // window frames, upper row
      { s: 'box', d: [1.2, 1.3, 0.04], at: [6.6, 3.7, 6], c: 'white', mirror: true },
      { s: 'box', d: [1, 1.1, 0.06], at: [3.6, 1.9, 6], c: 0x2b3a4a, mirror: true },                        // window glass, lower row
      { s: 'box', d: [1, 1.1, 0.06], at: [6.6, 1.9, 6], c: 0x2b3a4a, mirror: true },
      { s: 'box', d: [1, 1.1, 0.06], at: [3.6, 3.7, 6], c: 0x2b3a4a, mirror: true },                        // window glass, upper row
      { s: 'box', d: [1, 1.1, 0.06], at: [6.6, 3.7, 6], c: 0x2b3a4a, mirror: true },
      { s: 'box', d: [1.2, 1.2, 1.2], at: [-7, 6.1, -4], c: 'stone' },                                      // stair hut on the roof
    ],
  },
  {
    id: 'rootwell-lab-block', name: 'the Crucible Block', category: 'prop', uses: ['place'],
    tags: ['lab', 'laboratory', 'crucible', 'brick', 'chimney', 'block', 'hazard', 'rootwell', 'campus', 'university', 'building', 'gta'],
    emoji: [],
    footprint: { r: 6, h: 7 },
    about: 'Gnome Theft Auto: the Crucible Block, the lab block. Half-size (game scale 2): 14 x 11 m clay-brick block with a shallow slate roof, three fume stacks, big square windows, one scorched window and a yellow-striped door lintel on +z.',
    examine: [
      'A plain brick block with a shallow slate roof, three fume stacks, two big square windows, and one of them scorched black at the edges.',
      'Saying: the Crucible smells of burnt sugar on Mondays and of nothing at all on Fridays, which the faculty insists is the same experiment.',
      'Tip: use the door under the yellow stripes. The stripes are not decoration. They are a warning, and the warning is older than the building.',
      'Joke: the scorch on the window was the first experiment. It worked, in that it did something, and the dean has had it framed.',
      'A sign on the bench reads "Do not light the bench." Someone has lit the bench, and the sign has been moved closer to the bench.',
    ],
    parts: [
      { s: 'box', d: [14, 4.6, 11], at: [0, 2.3, 0], c: 'clay' },                                          // walls
      { s: 'box', d: [14.2, 0.3, 5.7], at: [0, 5.35, 2.75], rot: [15.3, 0, 0], c: 'slate' },                // roof, front slope
      { s: 'box', d: [14.2, 0.3, 5.7], at: [0, 5.35, -2.75], rot: [-15.3, 0, 0], c: 'slate' },              // roof, back slope
      { s: 'cyl', d: [0.35, 0.4, 3], at: [4, 5.5, -1.5], c: 'clay-dark', seg: 8, mirror: true },             // fume stacks
      { s: 'cyl', d: [0.35, 0.4, 3], at: [0, 5.5, -1.5], c: 'clay-dark', seg: 8 },
      { s: 'box', d: [1.6, 2.6, 0.04], at: [0, 1.3, 5.52], c: 'wood-dark' },                                // door
      { s: 'box', d: [2.2, 0.2, 0.06], at: [0, 2.8, 5.5], c: 'yellow' },                                    // hazard lintel
      { s: 'box', d: [0.3, 0.2, 0.07], at: [0.6, 2.8, 5.53], c: 'black', mirror: true },                    // hazard stripes
      { s: 'box', d: [2, 1.8, 0.06], at: [-4, 2.3, 5.52], c: 0x2b3a4a },                                    // window, plain
      { s: 'box', d: [2.4, 2.2, 0.02], at: [4, 2.3, 5.52], c: 'black' },                                    // scorch mark around the window
      { s: 'box', d: [2, 1.8, 0.06], at: [4, 2.3, 5.52], c: 0x2b3a4a },                                    // window, scorched
    ],
  },
  {
    id: 'rootwell-gate-lodge', name: 'Wicket Lodge', category: 'prop', uses: ['place'],
    tags: ['lodge', 'gate', 'porter', 'cricket', 'wicket', 'stone', 'slate', 'rootwell', 'campus', 'university', 'building', 'gta'],
    emoji: [],
    footprint: { r: 3, h: 4.7 },
    about: 'Gnome Theft Auto: Wicket Lodge, the gate lodge. Half-size (game scale 2): 5 x 4 m stone lodge with a steep slate roof, a tall chimney, a porter hatch beside the door on +z and a cricket-wicket weather vane on the ridge.',
    examine: [
      'A little stone lodge with a steep slate roof, a tall chimney, a hatch window beside the door, and a cricket wicket for a weather vane.',
      'Saying: the porter who does not see you go in has been paid in advance, and the wicket on the roof keeps count of the rest.',
      'Tip: knock on the hatch, not the door. The porter has been known to answer the door, and the answer is usually no.',
      'Joke: the weather vane always points at the bowler, and the bowler has always been the same gnome, who has never once been asked.',
      'Three stumps and two bails, all of them stone-cold still. The gate has never been shut, only politely asked not to be opened.',
    ],
    parts: [
      { s: 'box', d: [5, 2.5, 4], at: [0, 1.25, 0], c: 'stone' },                                           // walls
      { s: 'box', d: [5.2, 0.2, 2.97], at: [0, 3.5, 1.1], rot: [42.3, 0, 0], c: 'slate' },                  // roof, front slope
      { s: 'box', d: [5.2, 0.2, 2.97], at: [0, 3.5, -1.1], rot: [-42.3, 0, 0], c: 'slate' },                // roof, back slope
      { s: 'box', d: [0.5, 2.6, 0.5], at: [1.8, 3.3, -0.8], c: 'clay-dark' },                              // chimney
      { s: 'box', d: [0.62, 0.12, 0.62], at: [1.8, 4.66, -0.8], c: 'stone' },                              // chimney cap
      { s: 'box', d: [0.9, 1.9, 0.04], at: [0, 0.95, 2.02], c: 'wood-dark' },                              // door
      { s: 'box', d: [1, 0.8, 0.04], at: [1.6, 1.5, 2], c: 'white' },                                      // hatch, frame
      { s: 'box', d: [0.9, 0.7, 0.06], at: [1.6, 1.5, 2], c: 0x2b3a4a },                                   // hatch, glass
      { s: 'box', d: [0.12, 0.6, 0.03], at: [0, 4.8, 0], c: 'chalk' },                                     // wicket stumps
      { s: 'box', d: [0.12, 0.6, 0.03], at: [0.12, 4.8, 0], c: 'chalk', mirror: true },
      { s: 'box', d: [0.13, 0.04, 0.04], at: [-0.06, 5.12, 0], c: 'chalk', mirror: true },                  // bails
    ],
  },
  {
    id: 'rootwell-deans-lodge', name: "the Dean's lodge", category: 'prop', uses: ['place'],
    tags: ['house', 'villa', 'dean', 'lodge', 'clay', 'slate', 'railing', 'gate', 'rootwell', 'campus', 'university', 'building', 'gta'],
    emoji: [],
    footprint: { r: 4, h: 5.6 },
    about: 'Gnome Theft Auto: the Dean\'s lodge. Half-size (game scale 2): a two-storey 6 x 7 m clay villa with a slate hipped roof, white-framed windows and red flower boxes, a brass knocker on the door on +z and an iron railing gate in front.',
    examine: [
      'A tidy two-storey clay villa with a slate roof, white-framed windows, red flowers in the boxes below, and a brass knocker on the door.',
      'Saying: a house with flowers in its windows is a house that intends to stay, and the Dean has never once intended anything else.',
      'Tip: knock with the brass, not with your knuckles. The knocker is the only thing on the house that does not owe anyone rent.',
      'Joke: the iron gate opens inwards, which is a great deal of trouble for a gate that is only ever admired from the outside.',
      'The Dean keeps a ledger of late rent in the study. The ants keep their own copy, written in sugar, which is far harder to file.',
    ],
    parts: [
      { s: 'box', d: [6, 3.4, 7], at: [0, 1.7, 0], c: 'clay' },                                             // walls
      { s: 'box', d: [6.12, 0.12, 7.12], at: [0, 1.7, 0], c: 'white' },                                     // floor band between storeys
      { s: 'box', d: [6.7, 0.2, 3.27], at: [0, 4.45, 2.55], rot: [40, 0, 0], c: 'slate' },                  // roof, front slope
      { s: 'box', d: [6.7, 0.2, 3.27], at: [0, 4.45, -2.55], rot: [-40, 0, 0], c: 'slate' },                // roof, back slope
      { s: 'box', d: [2.9, 0.2, 6.7], at: [-2.3, 4.45, 0], rot: [0, 0, 46.4], c: 'slate', mirror: true },   // roof, hip ends
      { s: 'box', d: [2.6, 0.2, 2.6], at: [0, 5.5, 0], c: 'slate' },                                       // roof, flat top
      { s: 'box', d: [0.9, 2, 0.04], at: [0, 1, 3.52], c: 'wood-dark' },                                    // front door
      { s: 'ring', d: [0.08, 0.015], at: [0, 1.3, 3.56], c: 'brass', seg: 6 },                              // brass knocker
      { s: 'box', d: [1.1, 1.1, 0.04], at: [1.8, 1.1, 3.5], c: 'white', mirror: true },                     // lower windows, frames
      { s: 'box', d: [0.9, 0.9, 0.06], at: [1.8, 1.1, 3.5], c: 0x2b3a4a, mirror: true },                    // lower windows, glass
      { s: 'box', d: [1, 0.18, 0.2], at: [1.8, 0.56, 3.6], c: 'wood-dark', mirror: true },                  // window boxes
      { s: 'box', d: [1, 0.12, 0.22], at: [1.8, 0.71, 3.6], c: 'red', mirror: true },                       // red flowers
      { s: 'box', d: [1.1, 1.1, 0.04], at: [1.8, 2.6, 3.5], c: 'white', mirror: true },                     // upper windows, frames
      { s: 'box', d: [0.9, 0.9, 0.06], at: [1.8, 2.6, 3.5], c: 0x2b3a4a, mirror: true },                    // upper windows, glass
      { s: 'box', d: [0.12, 1.2, 0.12], at: [0.9, 0.6, 5], c: 'iron-dark', mirror: true },                  // gate posts
      { s: 'box', d: [0.05, 1, 0.05], at: [1.4, 0.5, 5], c: 'iron-dark', mirror: true },                    // railing bars
      { s: 'box', d: [0.05, 1, 0.05], at: [1.9, 0.5, 5], c: 'iron-dark', mirror: true },
      { s: 'box', d: [0.05, 1, 0.05], at: [2.4, 0.5, 5], c: 'iron-dark', mirror: true },
      { s: 'box', d: [0.05, 1, 0.05], at: [2.9, 0.5, 5], c: 'iron-dark', mirror: true },
      { s: 'box', d: [2.2, 0.05, 0.05], at: [2, 0.85, 5], c: 'iron-dark', mirror: true },                    // railing rails
      { s: 'box', d: [2.2, 0.05, 0.05], at: [2, 0.3, 5], c: 'iron-dark', mirror: true },
    ],
  },
];
