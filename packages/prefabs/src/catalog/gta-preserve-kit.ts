// Gnome Theft Auto: the Unmown preserve's structures (E31): ranger station, bird hide, marsh boardwalk, viewing platform,
// and three interior props.
// Rules: docs/roadmaps/prefab-library/_common.md. Life-size metres, front on +z.
import type { PrefabDef } from '../types';

export const GTA_PRESERVE_KIT: readonly PrefabDef[] = [
  {
    id: 'unmown-ranger-hut', name: 'Unmown Ranger Station', category: 'prop', uses: ['place'],
    tags: ['ranger', 'station', 'cabin', 'hut', 'lodge', 'timber', 'roof', 'porch', 'weathervane', 'gta', 'unmown', 'preserve'], emoji: [],
    tint: 'wood-light', trim: 'moss',
    footprint: { r: 7, h: 6.5 },
    about: 'Gnome Theft Auto: the Unmown Ranger Station, life-size, front on +z. Plank walls (tint), moss-green roof (trim), a covered porch at z 4 to 6, door at x 0. Blank name board front face at z 6.06, centre (0, 3.6, 6.06): put text at z 6.09.',
    examine: [
      'A plank cabin with a moss-green roof, a porch on two posts, and a dandelion weathervane that turns toward whoever is arguing.',
      'Saying: the ranger who keeps the gate keeps the grass, and the grass keeps the ranger. Both have been very patient about it.',
      'Tip: knock twice before you come in, and once more if your hat is on. The rangers keep a box for hats at the door.',
      'Joke: the rangers keep a sign reading NO MOWERS, which the mowers have never once been able to read.',
      'Under the porch step there is a tin of biscuits, a logbook of every bird seen here, and one HOA hat kept as evidence.',
    ],
    parts: [
      { s: 'box', d: [12.2, 0.3, 8.2], at: [0, 0.15, 0], c: 'stone-dark' },                       // plinth
      { s: 'box', d: [12, 3.0, 8], at: [0, 1.8, 0], c: 'tint' },                                   // walls
      { s: 'box', d: [12.8, 0.2, 5.2], at: [0, 4.3, -2.3], rot: [-23.5, 0, 0], c: 'trim' },      // roof, back slope
      { s: 'box', d: [12.8, 0.2, 5.2], at: [0, 4.3, 2.3], rot: [23.5, 0, 0], c: 'trim' },        // roof, front slope
      { s: 'box', d: [12.9, 0.12, 0.3], at: [0, 5.36, 0], c: 'trim' },                           // ridge cap
      { s: 'box', d: [12, 0.2, 2.05], at: [0, 0.35, 4.975], c: 'wood' },                         // porch deck
      { s: 'box', d: [1.4, 0.45, 0.55], at: [0, 0.225, 6.225], c: 'stone' },                     // step
      { s: 'box', d: [12.2, 0.15, 2.2], at: [0, 3.075, 5], c: 'trim' },                          // porch canopy
      { s: 'cyl', d: [0.1, 0.1, 2.8], at: [5.5, 1.7, 5.8], c: 'wood-dark', seg: 6, mirror: true }, // porch posts
      { s: 'box', d: [1.0, 2.2, 0.05], at: [0, 1.55, 4.03], c: 'wood-dark' },                     // front door
      { s: 'box', d: [1.6, 1.0, 0.05], at: [3.5, 1.9, 4.03], c: 'glass', mirror: true },          // windows
      { s: 'box', d: [0.6, 2.9, 0.6], at: [3.8, 4.75, -2.0], c: 'stone-dark' },                  // chimney
      { s: 'box', d: [0.75, 0.2, 0.75], at: [3.8, 6.3, -2.0], c: 'iron-dark' },                  // chimney cap
      { s: 'cyl', d: [0.02, 0.02, 1.2], at: [0, 5.95, 0], c: 'iron-dark', seg: 6 },              // vane pole
      { s: 'ball', d: [0.14], at: [0, 6.6, 0], scale: [1, 1, 0.5], c: 'chalk', seg: 8 },         // dandelion head
      { s: 'ball', d: [0.04], at: [0.1, 6.85, 0.05], c: 'white', seg: 6 },                       // seeds
      { s: 'ball', d: [0.04], at: [-0.1, 6.85, -0.05], c: 'white', seg: 6 },
      { s: 'ball', d: [0.035], at: [0, 6.95, 0], c: 'white', seg: 6 },
      { s: 'box', d: [3.0, 0.6, 0.06], at: [0, 3.6, 6.03], c: 'cloth' },                          // name board
      { s: 'box', d: [0.1, 0.25, 0.1], at: [1.3, 3.2, 5.95], c: 'iron-dark', mirror: true },     // board brackets
    ],
  },
  {
    id: 'bird-hide', name: 'Bird Hide', category: 'prop', uses: ['place'],
    tags: ['bird', 'hide', 'blind', 'hut', 'wood', 'viewing', 'slot', 'roof', 'gta', 'unmown', 'preserve'], emoji: [],
    tint: 'wood', trim: 'moss',
    footprint: { r: 3, h: 2.8 },
    about: 'Gnome Theft Auto: a wooden bird hide in the Unmown, life-size, front on +z. 5 m wide, 3.5 m deep, 2.8 m tall. Planks (tint), mossy roof (trim), a long dark viewing slot on the front wall at 1.3 to 1.6 m, a door on the back wall.',
    examine: [
      'A plank box the colour of old reeds, with a long black slot in the front wall and a mossy roof that hides it from the sky.',
      'Saying: the bird that sees you first is the one that gets away. Sit still, and let the birds forget you were ever a gnome.',
      'Tip: keep your head below the slot. A gnome face in the window is the one thing the birds have never forgiven.',
      'Joke: the hide is painted to look like a bush, and the bush has been painted to look like the hide. Nobody is fooled.',
      'The door at the back was cut so rangers can leave in the wrong direction without anyone seeing them go.',
    ],
    parts: [
      { s: 'box', d: [5, 2.2, 3.5], at: [0, 1.1, 0], c: 'tint' },                                // body
      { s: 'box', d: [5.3, 0.15, 2.1], at: [0, 2.5, -0.93], rot: [-17.9, 0, 0], c: 'trim' },      // roof, back slope
      { s: 'box', d: [5.3, 0.15, 2.1], at: [0, 2.5, 0.93], rot: [17.9, 0, 0], c: 'trim' },        // roof, front slope
      { s: 'box', d: [4.0, 0.3, 0.04], at: [0, 1.45, 1.79], c: 'black' },                        // viewing slot
      { s: 'box', d: [0.9, 1.9, 0.04], at: [0, 0.95, -1.79], c: 'wood-dark' },                   // back door
      { s: 'box', d: [0.9, 0.2, 0.4], at: [0, 0.1, -2.05], c: 'wood-dark' },                     // back step
    ],
  },
  {
    id: 'marsh-boardwalk-deck', name: 'Marsh Boardwalk Deck', category: 'prop', uses: ['place'],
    tags: ['boardwalk', 'deck', 'walkway', 'planks', 'marsh', 'bridge', 'wood', 'gta', 'unmown', 'preserve'], emoji: [],
    tint: 'wood', trim: 'wood-light',
    about: 'Gnome Theft Auto: one 3 m section of marsh boardwalk, life-size. Deck 2 m wide (x) by 3 m long (z), top at y 1.0, four round posts (trim), cross planks on top. Walkable, not solid.',
    examine: [
      'A three-metre length of raised boardwalk on round posts, with cross planks worn pale by feet and the occasional escaped hat.',
      'Saying: the boards go over the water so gnomes need not go through it, and the water has never once been asked.',
      'Tip: the second plank from the end is loose. Step on the one before it and you will be fine. Step on it and you are a story.',
      'Joke: a boardwalk is just a path that has given up on the ground. The posts are the only ones with any opinion.',
      'Someone has carved a small dandelion into the end post. The carving is better than the post deserves.',
    ],
    parts: [
      { s: 'box', d: [2.0, 0.12, 2.96], at: [0, 0.94, 0], c: 'tint' },                            // deck, top at y 1.0
      { s: 'cyl', d: [0.06, 0.06, 0.9], at: [0.9, 0.45, 1.38], c: 'trim', seg: 6, mirror: true },  // posts
      { s: 'cyl', d: [0.06, 0.06, 0.9], at: [0.9, 0.45, -1.38], c: 'trim', seg: 6, mirror: true },
      { s: 'box', d: [2.0, 0.02, 0.12], at: [0, 1.02, -1.0], c: 'wood-dark' },                   // cross planks
      { s: 'box', d: [2.0, 0.02, 0.12], at: [0, 1.02, 0], c: 'wood-dark' },
      { s: 'box', d: [2.0, 0.02, 0.12], at: [0, 1.02, 1.0], c: 'wood-dark' },
    ],
  },
  {
    id: 'marsh-boardwalk-rail', name: 'Marsh Boardwalk Rail', category: 'prop', uses: ['place'],
    tags: ['boardwalk', 'rail', 'railing', 'handrail', 'fence', 'marsh', 'wood', 'gta', 'unmown', 'preserve'], emoji: [],
    tint: 'wood',
    about: 'Gnome Theft Auto: one 3 m section of boardwalk rail, life-size, along z. Two 1 m posts at z plus or minus 1.45, a top rail and a mid rail. Stands on the deck: the game lifts it to deck height.',
    examine: [
      'A waist-high rail of two posts, a top rail and a mid rail, all grey with weather and held on by string and optimism.',
      'Saying: hold on to the rail in the marsh, for the marsh has no rails of its own and is jealous of yours.',
      'Tip: lean on the rail only as far as the posts. Past that it leans back, and it has better balance than you.',
      'Joke: the rail was put up to stop gnomes falling in. It is very good at that and very bad at stopping them climbing out.',
      'The mid rail has a notch worn in it by a century of thumbs. The rangers say it is a map. It is not a map.',
    ],
    parts: [
      { s: 'cyl', d: [0.05, 0.05, 1.0], at: [0, 0.5, 1.44], c: 'tint', seg: 6 },                  // posts
      { s: 'cyl', d: [0.05, 0.05, 1.0], at: [0, 0.5, -1.44], c: 'tint', seg: 6 },
      { s: 'box', d: [0.07, 0.07, 2.9], at: [0, 0.95, 0], c: 'tint' },                           // top rail
      { s: 'box', d: [0.05, 0.05, 2.9], at: [0, 0.5, 0], c: 'tint' },                            // mid rail
    ],
  },
  {
    id: 'viewing-platform', name: 'Viewing Platform', category: 'prop', uses: ['place'],
    tags: ['viewing', 'platform', 'deck', 'lookout', 'telescope', 'bench', 'rail', 'wood', 'gta', 'unmown', 'preserve'], emoji: [],
    tint: 'wood', trim: 'wood-light',
    footprint: { r: 4, h: 1.9 },
    about: 'Gnome Theft Auto: the Unmown viewing platform, life-size. 8 m (x) by 6 m (z) deck, top at y 1.0, posts underneath, rails on the +z, +x and -x sides (open on -z where the boardwalk arrives), a bench and a brass telescope on the +z rail.',
    examine: [
      'An eight-metre deck on posts, with rails on three sides and a brass telescope on the front rail, looking out over the unmown grass.',
      'Saying: the view from the top is the same as the view from the bottom, only you have more time to think about it.',
      'Tip: the telescope is for watching birds. Watching the HOA through it is allowed, but do not tell the HOA that.',
      'Joke: there is a bench for resting and a rail for leaning, and the rangers have never agreed which is which.',
      'The open side faces the boardwalk. Visitors arrive that way, and so do the inspectors, who always get lost by the second plank.',
    ],
    parts: [
      { s: 'box', d: [8, 0.12, 6], at: [0, 0.94, 0], c: 'tint' },                                // deck, top at y 1.0
      { s: 'cyl', d: [0.1, 0.1, 0.9], at: [3.8, 0.45, 2.8], c: 'trim', seg: 6, mirror: true },   // corner posts
      { s: 'cyl', d: [0.1, 0.1, 0.9], at: [3.8, 0.45, -2.8], c: 'trim', seg: 6, mirror: true },
      { s: 'cyl', d: [0.1, 0.1, 0.9], at: [0, 0.45, 2.8], c: 'trim', seg: 6 },                  // middle posts
      { s: 'cyl', d: [0.1, 0.1, 0.9], at: [0, 0.45, -2.8], c: 'trim', seg: 6 },
      { s: 'cyl', d: [0.04, 0.04, 0.9], at: [3.9, 1.45, 2.9], c: 'trim', seg: 6, mirror: true },  // +z rail posts
      { s: 'cyl', d: [0.04, 0.04, 0.9], at: [1.3, 1.45, 2.9], c: 'trim', seg: 6, mirror: true },
      { s: 'box', d: [7.8, 0.06, 0.06], at: [0, 1.87, 2.9], c: 'trim' },                        // +z top rail
      { s: 'box', d: [7.8, 0.04, 0.04], at: [0, 1.4, 2.9], c: 'trim' },                          // +z mid rail
      { s: 'cyl', d: [0.04, 0.04, 0.9], at: [3.9, 1.45, -2.9], c: 'trim', seg: 6, mirror: true },  // side rail posts
      { s: 'cyl', d: [0.04, 0.04, 0.9], at: [3.9, 1.45, -1.3], c: 'trim', seg: 6, mirror: true },
      { s: 'cyl', d: [0.04, 0.04, 0.9], at: [3.9, 1.45, 1.3], c: 'trim', seg: 6, mirror: true },
      { s: 'box', d: [0.06, 0.06, 5.8], at: [3.9, 1.87, 0], c: 'trim', mirror: true },           // side top rails
      { s: 'box', d: [0.04, 0.04, 5.8], at: [3.9, 1.4, 0], c: 'trim', mirror: true },            // side mid rails
      { s: 'box', d: [1.6, 0.1, 0.45], at: [-1.8, 1.45, 1.8], c: 'wood-light' },                  // bench seat
      { s: 'box', d: [0.08, 0.4, 0.4], at: [-2.5, 1.2, 1.8], c: 'wood-dark' },                    // bench legs
      { s: 'box', d: [0.08, 0.4, 0.4], at: [-1.1, 1.2, 1.8], c: 'wood-dark' },
      { s: 'cyl', d: [0.05, 0.05, 0.7], at: [2.0, 1.35, 2.4], c: 'iron-dark', seg: 6 },          // telescope post
      { s: 'cyl', d: [0.07, 0.05, 0.6], at: [2.0, 1.85, 2.4], rot: [60, 0, 0], c: 'brass', seg: 8 }, // telescope tube
    ],
  },
  {
    id: 'specimen-jar', name: 'Specimen Jar', category: 'prop', uses: ['place'],
    tags: ['jar', 'specimen', 'glass', 'grass', 'cork', 'label', 'unmown', 'gta', 'preserve'], emoji: [],
    about: 'Gnome Theft Auto: a big specimen jar of uncut grass from the Unmown, interior prop, 0.52 m tall. Pale glass, cork stopper, paper label on the front (+z).',
    examine: [
      'A tall glass jar of pale blue-green glass, full of uncut grass, with a cork stopper and a paper label gone soft at the corners.',
      'Saying: grass that is never cut grows long enough to hide a gnome, and that is the whole point of it.',
      'Tip: do not open the jar. The grass inside is still growing and will try to hide the lid as well.',
      'Joke: the label says SPECIMEN, and underneath, in smaller letters, the words NOT TO BE MOWED.',
      'The grass in the jar was picked the day the Unmown was set aside, and it has been very pleased with itself ever since.',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.2, 0.4], at: [0, 0.2, 0], c: 'glass', seg: 8 },                     // jar
      { s: 'cyl', d: [0.17, 0.17, 0.3], at: [0, 0.2, 0], c: 'grass', seg: 8 },                   // grass
      { s: 'cone', d: [0.035, 0.3], at: [0.08, 0.2, 0.05], c: 'leaf', seg: 5 },                  // blades
      { s: 'cone', d: [0.04, 0.3], at: [-0.06, 0.2, -0.04], c: 'leaf-dark', seg: 5 },
      { s: 'cyl', d: [0.14, 0.2, 0.06], at: [0, 0.43, 0], c: 'glass', seg: 8 },                  // neck
      { s: 'cyl', d: [0.15, 0.15, 0.06], at: [0, 0.49, 0], c: 0xb8895a, seg: 8 },                // cork
      { s: 'box', d: [0.3, 0.16, 0.01], at: [0, 0.2, 0.205], c: 'paper' },                       // label
    ],
  },
  {
    id: 'unmown-display-case', name: 'Display Case', category: 'furniture', uses: ['place'],
    tags: ['display', 'case', 'glass', 'blade', 'cabinet', 'museum', 'rust', 'unmown', 'gta', 'preserve'], emoji: [],
    about: 'Gnome Theft Auto: a waist-high glass-topped display case in the Unmown station, interior, 1.6 m wide (x), 0.7 m deep (z), 1.1 m tall. Wood base, glass lid, a rusty mower blade inside, a card on the front (+z). Id differs from the brief (display-case is taken by gnomeokemon-lab).',
    examine: [
      'A waist-high wooden case with a glass lid, holding a rusty blade the size of a gnome shield, which the rangers keep as a warning.',
      'Saying: the Mower is a thing nobody understands and everybody fears, so the rangers keep a piece of it under glass.',
      'Tip: the lid lifts on a hinge. Lift it only with gloves on, and only with a witness.',
      'Joke: the blade was on display before the display was built. The case was made around it, out of pure respect.',
      'Someone has written a note in wax pencil: DO NOT SHARPEN. Below it, in other handwriting, the word SORRY.',
    ],
    parts: [
      { s: 'box', d: [1.6, 0.8, 0.7], at: [0, 0.4, 0], c: 'wood' },                            // base
      { s: 'box', d: [1.6, 0.31, 0.7], at: [0, 0.945, 0], c: 'glass' },                         // glass lid
      { s: 'box', d: [1.62, 0.04, 0.72], at: [0, 1.12, 0], c: 'wood-dark' },                    // lid frame
      { s: 'box', d: [0.9, 0.02, 0.2], at: [0, 0.82, 0], c: 'iron' },                            // blade
      { s: 'ball', d: [0.08], at: [0.3, 0.85, 0.03], scale: [1, 0.3, 1], c: 'rust', seg: 6 },    // rust
      { s: 'ball', d: [0.06], at: [-0.25, 0.85, -0.05], scale: [1, 0.3, 1], c: 'rust', seg: 6 },
      { s: 'cyl', d: [0.03, 0.03, 0.04], at: [0.42, 0.85, 0.05], rot: [90, 0, 0], c: 'iron-dark', seg: 6 }, // bolt
      { s: 'box', d: [0.5, 0.14, 0.01], at: [0, 0.4, 0.36], c: 'paper' },                         // card
    ],
  },
  {
    id: 'lost-hat-box', name: 'Lost Hat Box', category: 'prop', uses: ['place'],
    tags: ['hat', 'hats', 'crate', 'box', 'confiscated', 'hoa', 'tag', 'unmown', 'gta', 'preserve'], emoji: [],
    about: 'Gnome Theft Auto: a wooden crate of confiscated HOA hats in the Unmown station, interior prop, 0.8 x 0.6 x 0.5 m, overflowing with black and red hats. A tag on the front (+z).',
    examine: [
      'A wooden crate heaped with black and red hats, confiscated from the HOA inspectors who came to the Unmown and left without their dignity.',
      'Saying: a hat is a head with a lid on it. Take the lid off and the head will tell you what it thinks.',
      'Tip: take a hat from the crate only if you are not an inspector. The tag says what to do if you are.',
      'Joke: the crate has been labelled CONFISCATED so many times that the label now confiscates the crate.',
      'Some of the hats are still warm. The rangers say this is because the inspectors wore them the whole way back.',
    ],
    parts: [
      { s: 'box', d: [0.8, 0.5, 0.6], at: [0, 0.25, 0], c: 'wood' },                            // crate
      { s: 'box', d: [0.72, 0.02, 0.52], at: [0, 0.51, 0], c: 'bark' },                          // dark interior
      { s: 'box', d: [0.16, 0.12, 0.01], at: [0.3, 0.38, 0.305], c: 'paper' },                   // tag
      { s: 'cyl', d: [0.17, 0.17, 0.02], at: [-0.2, 0.53, -0.1], c: 'black', seg: 8 },           // hats
      { s: 'cyl', d: [0.1, 0.1, 0.14], at: [-0.2, 0.6, -0.1], c: 'black', seg: 8 },
      { s: 'cyl', d: [0.17, 0.17, 0.02], at: [0.12, 0.55, 0.08], c: 'red', seg: 8 },
      { s: 'cyl', d: [0.1, 0.1, 0.14], at: [0.12, 0.62, 0.08], c: 'red', seg: 8 },
      { s: 'cyl', d: [0.17, 0.17, 0.02], at: [0.22, 0.53, -0.14], c: 'black', seg: 8 },
      { s: 'cyl', d: [0.1, 0.1, 0.14], at: [0.22, 0.6, -0.14], c: 'black', seg: 8 },
      { s: 'cyl', d: [0.17, 0.17, 0.02], at: [-0.05, 0.62, 0.1], c: 'red', seg: 8 },
      { s: 'cyl', d: [0.1, 0.1, 0.14], at: [-0.05, 0.69, 0.1], c: 'red', seg: 8 },
    ],
  },
];
