// Gnome Theft Auto, Pebblewick (docs/roadmaps/gta-outskirts-town.md): the civic buildings (diner, general store, post office, town hall, clinic).
// Life-size metres. Every building: front on +z, walls take `tint` (the adobe), parapets and trim take `trim`.
import type { PrefabDef } from '../types';

export const GTA_PEBBLEWICK: readonly PrefabDef[] = [
  {
    id: 'pebblewick-diner', name: 'The Dry Spoon', category: 'prop', uses: ['place'],
    tags: ['diner', 'cafe', 'restaurant', 'food', 'spoon', 'awning', 'adobe', 'pebblewick', 'gta', 'town'], emoji: [],
    tint: 0xe0c49a, trim: 'clay-dark',
    footprint: { r: 5, h: 7.5 },
    about: 'Gnome Theft Auto, Pebblewick: The Dry Spoon, a flat-roofed adobe diner with a red and cream striped awning, a serving hatch and a big wooden spoon on the roof. Life-size, front on +z. Walls take the tint, parapets the trim.',
    examine: [
      'A flat-roofed adobe diner with a red and cream striped awning along the front and a wooden spoon the height of three gnomes standing on the roof.',
      'Saying: a spoon on the roof means the food is good, and a spoon that has fallen off means the cook has gone out to find it.',
      'Tip: order at the serving hatch, not the door. The door leads to the kitchen, and the kitchen leads to the cook\'s opinions.',
      'Joke: the soup of the day is always the same soup, and the day is always dry, so the soup is always a little bit sorry.',
      'The counter shelf under the hatch is carved with a row of initials, and beside them a small stack of clay bowls waits to be filled.',
    ],
    parts: [
      { s: 'box', d: [10, 3.0, 5.6], at: [0, 1.5, -0.7], c: 'tint' },                                   // adobe body
      { s: 'box', d: [10, 0.25, 0.3], at: [0, 3.125, 1.95], c: 'trim' },                                // parapet, front
      { s: 'box', d: [10, 0.25, 0.3], at: [0, 3.125, -3.35], c: 'trim' },                               // parapet, back
      { s: 'box', d: [0.3, 0.25, 5.6], at: [-4.85, 3.125, -0.7], c: 'trim' },                           // parapet, left
      { s: 'box', d: [0.3, 0.25, 5.6], at: [4.85, 3.125, -0.7], c: 'trim' },                            // parapet, right
      { s: 'box', d: [1.8, 0.15, 1.3], at: [-3.6, 2.6, 2.75], c: 'red' },                               // awning stripes
      { s: 'box', d: [1.8, 0.15, 1.3], at: [-1.8, 2.6, 2.75], c: 'chalk' },
      { s: 'box', d: [1.8, 0.15, 1.3], at: [0, 2.6, 2.75], c: 'red' },
      { s: 'box', d: [1.8, 0.15, 1.3], at: [1.8, 2.6, 2.75], c: 'chalk' },
      { s: 'box', d: [1.8, 0.15, 1.3], at: [3.6, 2.6, 2.75], c: 'red' },
      { s: 'cyl', d: [0.06, 0.06, 2.6], at: [-4.4, 1.3, 3.2], c: 'wood-dark', seg: 6 },                  // awning posts
      { s: 'cyl', d: [0.06, 0.06, 2.6], at: [4.4, 1.3, 3.2], c: 'wood-dark', seg: 6 },
      { s: 'box', d: [2.2, 1.2, 0.12], at: [2.6, 1.7, 2.12], c: 'chalk' },                              // serving hatch frame
      { s: 'box', d: [1.8, 0.8, 0.1], at: [2.6, 1.6, 2.17], c: 'ink' },                                 // hatch opening
      { s: 'box', d: [2.4, 0.1, 0.5], at: [2.6, 1.0, 2.35], c: 'wood-light' },                         // counter shelf
      { s: 'box', d: [1.0, 2.1, 0.08], at: [-2.4, 1.05, 2.14], c: 'red' },                              // door
      { s: 'box', d: [1.0, 0.9, 0.06], at: [-4.0, 1.6, 2.13], c: 'glass' },                             // windows
      { s: 'box', d: [1.0, 0.9, 0.06], at: [0.0, 1.6, 2.13], c: 'glass' },
      { s: 'cyl', d: [0.1, 0.1, 2.6], at: [2.5, 4.55, -0.7], c: 'wood-light', seg: 6 },                 // spoon handle
      { s: 'ball', d: [0.5], scale: [0.9, 0.5, 0.9], at: [2.5, 5.95, -0.7], c: 'wood', seg: 8 },        // spoon bowl, up
    ],
  },
  {
    id: 'pebblewick-general-store', name: "Twine's General", category: 'prop', uses: ['place'],
    tags: ['store', 'shop', 'general', 'market', 'grocer', 'jars', 'barrel', 'adobe', 'pebblewick', 'gta', 'town'], emoji: [],
    tint: 0xd8b080, trim: 0x7a4a2a,
    footprint: { r: 4.5, h: 6.5 },
    about: "Gnome Theft Auto, Pebblewick: Twine's General, an adobe store with a tall false front, a porch roof on three posts, a jar window and barrels by the door. Life-size, front on +z. Walls take the tint, the false front and porch the trim.",
    examine: [
      'A tall adobe store with a flat false front board that rises above the roof line, and a porch roof held up on three posts across the whole front.',
      'Saying: a shop that hangs its name high enough can be read from the next town, which is why the sign is the tallest thing in Pebblewick.',
      'Tip: the barrels by the door are not for sitting on. They are for rolling, and the keeper will ask you to roll them back.',
      'Joke: the jars in the window are full of pickles, honey and something labelled later, and nobody has ever been sure which is which.',
      'Two chains hold the hanging sign under the porch, and the left one has been mended with a length of twine, which is the shop\'s name in a small way.',
    ],
    parts: [
      { s: 'box', d: [9, 4.5, 5], at: [0, 2.25, -1], c: 'tint' },                                       // adobe body
      { s: 'box', d: [8.6, 6.5, 0.2], at: [0, 3.25, 1.6], c: 'trim' },                                    // false front
      { s: 'box', d: [2.0, 1.0, 0.06], at: [-2.5, 1.4, 1.72], c: 'glass' },                               // jar window
      { s: 'box', d: [2.0, 0.08, 0.3], at: [-2.5, 1.25, 1.8], c: 'wood-light' },                          // window shelf
      { s: 'cyl', d: [0.08, 0.08, 0.2], at: [-2.9, 1.39, 1.8], c: 'red', seg: 8 },                        // jars
      { s: 'cyl', d: [0.08, 0.08, 0.2], at: [-2.5, 1.39, 1.8], c: 'honey', seg: 8 },
      { s: 'cyl', d: [0.08, 0.08, 0.2], at: [-2.1, 1.39, 1.8], c: 'green', seg: 8 },
      { s: 'box', d: [8.8, 0.15, 1.9], at: [0, 2.9, 2.45], c: 'trim' },                                  // porch roof
      { s: 'cyl', d: [0.1, 0.1, 2.8], at: [-4.0, 1.4, 3.3], c: 'wood-dark', seg: 6 },                     // porch posts
      { s: 'cyl', d: [0.1, 0.1, 2.8], at: [0, 1.4, 3.3], c: 'wood-dark', seg: 6 },
      { s: 'cyl', d: [0.1, 0.1, 2.8], at: [4.0, 1.4, 3.3], c: 'wood-dark', seg: 6 },
      { s: 'box', d: [2.6, 0.6, 0.08], at: [0, 2.25, 2.9], c: 'wood-light' },                              // hanging sign
      { s: 'cyl', d: [0.01, 0.01, 0.3], at: [-1.0, 2.675, 2.9], c: 'iron-dark', seg: 4 },                   // sign chains
      { s: 'cyl', d: [0.01, 0.01, 0.3], at: [1.0, 2.675, 2.9], c: 'iron-dark', seg: 4 },
      { s: 'box', d: [1.6, 0.2, 0.02], at: [0, 2.25, 2.95], c: 'ink' },                                    // sign letters
      { s: 'box', d: [1.0, 2.1, 0.06], at: [1.8, 1.05, 1.73], c: 'wood-dark' },                           // door
      { s: 'cyl', d: [0.35, 0.35, 0.9], at: [3.0, 0.45, 2.3], c: 'wood', seg: 8 },                        // barrels
      { s: 'cyl', d: [0.35, 0.35, 0.9], at: [3.9, 0.45, 2.3], c: 'wood', seg: 8 },
    ],
  },
  {
    id: 'pebblewick-post-office', name: 'Pebblewick Post Office', category: 'prop', uses: ['place'],
    tags: ['post', 'office', 'mail', 'letter', 'stamp', 'drum', 'weathervane', 'adobe', 'pebblewick', 'gta', 'town'], emoji: [],
    tint: 0xe6cfa8, trim: 'clay-dark',
    footprint: { r: 3, h: 4.5 },
    about: 'Gnome Theft Auto, Pebblewick: the post office, a low adobe box with a blue door, a brass letter drum on a post and a snail-shell weathervane on the roof. Life-size, front on +z. Walls take the tint, the roof edge the trim.',
    examine: [
      'A low adobe office with a blue door, a fat brass letter drum on a post beside it, and a snail-shell weathervane turning slowly on the roof.',
      'Saying: a letter posted in Pebblewick arrives when the snail gets there, and the snail is never in a hurry to go anywhere.',
      'Tip: the letter drum takes one letter at a time. Push it in slowly, or the drum will jam and give the post a pleasant but unhelpful sigh.',
      'Joke: the stamps are sold by weight, and the clerk keeps a small brass scale in case a gnome tries to post a whole hedge.',
      'Somebody has pinned a note under the sign that says the post is running a little behind, and the note itself has been running behind for years.',
    ],
    parts: [
      { s: 'box', d: [6, 4.4, 3.2], at: [0, 2.2, -0.3], c: 'tint' },                                  // adobe body
      { s: 'box', d: [6, 0.15, 3.2], at: [0, 4.475, -0.3], c: 'trim' },                                  // roof slab
      { s: 'box', d: [1.0, 2.0, 0.08], at: [-1.0, 1.0, 1.34], c: 'blue' },                              // blue door
      { s: 'box', d: [0.1, 2.1, 0.1], at: [-1.55, 1.05, 1.36], c: 'trim' },                             // door frame
      { s: 'box', d: [0.1, 2.1, 0.1], at: [-0.45, 1.05, 1.36], c: 'trim' },
      { s: 'box', d: [1.6, 0.15, 0.6], at: [-1.0, 0.075, 1.6], c: 'stone' },                            // step
      { s: 'box', d: [1.8, 0.4, 0.06], at: [-1.0, 2.45, 1.34], c: 'chalk' },                            // sign board
      { s: 'box', d: [1.4, 0.08, 0.02], at: [-1.0, 2.45, 1.38], c: 'ink' },                             // sign lettering
      { s: 'box', d: [0.9, 0.8, 0.06], at: [-2.2, 2.6, 1.34], c: 'glass' },                             // window
      { s: 'box', d: [1.1, 0.08, 0.2], at: [-2.2, 2.18, 1.4], c: 'trim' },                              // window sill
      { s: 'cyl', d: [0.06, 0.06, 1.0], at: [1.6, 0.5, 1.5], c: 'wood-dark', seg: 6 },                  // letter drum post
      { s: 'cyl', d: [0.22, 0.22, 0.45], at: [1.6, 1.225, 1.5], c: 'brass', seg: 10 },                   // letter drum
      { s: 'box', d: [0.2, 0.06, 0.05], at: [1.6, 1.25, 1.73], c: 'ink' },                              // drum slot
      { s: 'cyl', d: [0.035, 0.035, 0.2], at: [1.5, 4.65, -0.3], c: 'iron-dark', seg: 5 },              // weathervane pole
      { s: 'ball', d: [0.1], at: [1.5, 4.85, -0.3], c: 0xd9b38c, seg: 8 },                              // snail shell
      { s: 'ball', d: [0.06], at: [1.5, 5.0, -0.3], c: 0xd9b38c, seg: 8 },                              // shell tip
    ],
  },
  {
    id: 'pebblewick-town-hall', name: 'Pebblewick Town Hall', category: 'prop', uses: ['place'],
    tags: ['hall', 'town', 'bell', 'tower', 'clock', 'belfry', 'civic', 'adobe', 'pebblewick', 'gta'], emoji: [],
    tint: 0xead8b4, trim: 0x8a5a3a,
    footprint: { r: 4, h: 9 },
    about: 'Gnome Theft Auto, Pebblewick: the town hall, a long adobe hall with a bell tower, an open belfry with a bell, a clock face and wide front steps. Life-size, front on +z. Walls take the tint, the cornice and belfry the trim.',
    examine: [
      'A long adobe hall with a tall bell tower at its front, an open belfry at the top with a bell hanging inside, and a round clock face halfway down.',
      'Saying: the bell rings for the Charter and for the rain, and the town has never been sure which one it is ringing for at any given hour.',
      'Tip: pull the bell rope gently. Pull it hard and the bell answers, then the whole tower answers, then the neighbours answer for the tower.',
      'Joke: the clock has said half past noon for as long as anyone remembers, which suits the councillors, who have never once been on time.',
      'The steps are worn into two shallow dips in the middle, from generations of gnomes walking in to be told that the meeting is next week.',
    ],
    parts: [
      { s: 'box', d: [8, 5, 4], at: [0, 2.5, -1], c: 'tint' },                                          // hall body
      { s: 'box', d: [8, 0.3, 4], at: [0, 5.15, -1], c: 'trim' },                                       // cornice
      { s: 'box', d: [2.4, 7, 2.4], at: [0, 3.5, 1.8], c: 'tint' },                                     // bell tower
      { s: 'cyl', d: [0.08, 0.08, 1.4], at: [-1.0, 7.7, 0.8], c: 'trim', seg: 6 },                      // belfry posts
      { s: 'cyl', d: [0.08, 0.08, 1.4], at: [1.0, 7.7, 0.8], c: 'trim', seg: 6 },
      { s: 'cyl', d: [0.08, 0.08, 1.4], at: [-1.0, 7.7, 2.8], c: 'trim', seg: 6 },
      { s: 'cyl', d: [0.08, 0.08, 1.4], at: [1.0, 7.7, 2.8], c: 'trim', seg: 6 },
      { s: 'box', d: [2.6, 0.4, 2.6], at: [0, 8.8, 1.8], c: 'trim' },                                   // belfry cap
      { s: 'cone', d: [0.3, 0.4], at: [0, 7.6, 1.8], rot: [180, 0, 0], c: 0xc9a24a, seg: 8 },           // bell
      { s: 'cyl', d: [0.7, 0.7, 0.06], at: [0, 5.5, 3.03], rot: [90, 0, 0], c: 'paper', seg: 12 },        // clock face
      { s: 'box', d: [0.05, 0.35, 0.02], at: [0, 5.67, 3.08], c: 'ink' },                               // clock hands
      { s: 'box', d: [0.25, 0.05, 0.02], at: [0.12, 5.5, 3.08], c: 'ink' },
      { s: 'box', d: [0.78, 1.8, 0.1], at: [-0.4, 1.3, 3.0], c: 'wood-dark' },                           // double door
      { s: 'box', d: [0.78, 1.8, 0.1], at: [0.4, 1.3, 3.0], c: 'wood-dark' },
      { s: 'box', d: [4, 0.2, 0.6], at: [0, 0.1, 3.2], c: 'stone' },                                    // step, low
      { s: 'box', d: [4, 0.4, 0.3], at: [0, 0.2, 3.35], c: 'stone' },                                   // step, high
      { s: 'cyl', d: [0.03, 0.03, 6.4], at: [0.95, 4.2, 3.1], c: 'leather', seg: 5 },                   // bell rope
      { s: 'box', d: [0.9, 1.4, 0.06], at: [2.6, 2.6, 1.03], c: 'glass', mirror: true },                // hall windows
    ],
  },
  {
    id: 'pebblewick-clinic', name: 'The Glaze Post', category: 'prop', uses: ['place'],
    tags: ['clinic', 'doctor', 'medic', 'health', 'glaze', 'cure', 'hospital', 'adobe', 'pebblewick', 'gta', 'town'], emoji: [],
    tint: 0xf2efe6, trim: 0x3fb8b0,
    footprint: { r: 3, h: 4 },
    about: 'Gnome Theft Auto, Pebblewick: the Glaze Post, a white-washed adobe clinic with a teal awning, a glaze-drop sign on a bracket and a planter by the window. Life-size, front on +z. Walls take the tint, the awning and sign the trim.',
    examine: [
      'A white-washed adobe clinic with a teal awning over the door and a glowing glaze-drop sign on a bracket by the wall, lit even in the day.',
      'Saying: a cracked gnome goes in to the Glaze Post, and a mended gnome comes out with a little more shine than the one that went in.',
      'Tip: sit on the step, not the planter. The planter is full of mint for the nerves, and the mint has very firm opinions about visitors.',
      'Joke: the waiting bench has room for four gnomes, and the queue has always had room for eleven, so the bench is mostly a suggestion.',
      'Somebody has scratched a row of tally marks on the door frame, each one a crack that was mended, and the last few are shaped like small smiles.',
    ],
    parts: [
      { s: 'box', d: [6, 4.2, 3.2], at: [0, 2.1, -0.4], c: 'tint' },                                   // white-washed body
      { s: 'box', d: [1.0, 2.1, 0.08], at: [-0.8, 1.05, 1.24], c: 'wood-dark' },                         // door
      { s: 'box', d: [1.4, 0.15, 0.5], at: [-0.8, 0.075, 1.45], c: 'stone' },                           // step
      { s: 'box', d: [1.6, 0.12, 0.9], at: [-0.8, 2.25, 1.65], c: 'trim' },                             // teal awning
      { s: 'cyl', d: [0.05, 0.05, 2.2], at: [-1.5, 1.1, 2.0], c: 'wood-dark', seg: 6 },                 // awning posts
      { s: 'cyl', d: [0.05, 0.05, 2.2], at: [-0.1, 1.1, 2.0], c: 'wood-dark', seg: 6 },
      { s: 'box', d: [0.12, 0.36, 0.04], at: [-0.8, 2.75, 1.22], c: 'trim' },                           // cross above door
      { s: 'box', d: [0.36, 0.12, 0.04], at: [-0.8, 2.75, 1.22], c: 'trim' },
      { s: 'box', d: [0.9, 0.9, 0.06], at: [-2.1, 1.6, 1.23], c: 'glass' },                              // window, left
      { s: 'box', d: [0.9, 0.9, 0.06], at: [1.8, 1.6, 1.23], c: 'glass' },                              // window, right
      { s: 'box', d: [1.0, 0.08, 0.2], at: [1.8, 1.1, 1.3], c: 'stone' },                               // window sill
      { s: 'box', d: [0.08, 0.08, 0.7], at: [1.8, 3.5, 1.55], c: 'trim' },                              // sign bracket
      { s: 'ball', d: [0.25], at: [1.8, 3.55, 1.9], c: 0x3fb8b0, glow: true, seg: 8 },                  // glaze drop
      { s: 'cone', d: [0.25, 0.4], at: [1.8, 4.0, 1.9], c: 0x3fb8b0, glow: true, seg: 8 },
      { s: 'box', d: [0.8, 0.4, 0.4], at: [-2.1, 0.2, 1.7], c: 'clay' },                                  // planter
      { s: 'ball', d: [0.2], at: [-2.1, 0.5, 1.7], c: 'leaf', seg: 6 },                                  // mint
    ],
  },
];
