// Gnome Theft Auto: forest and farmland scenery (issue 1B2).
// Prefabs wider than 3 gnome-heights are authored at a reduced scale (noted in `about`): place them at that scale
// in the world. Their `footprint` values are already divided by the same factor, so they scale back to the issue's sizes.
import type { PrefabDef } from '../types';

export const GTA_WORLD_GREEN: readonly PrefabDef[] = [
  {
    id: 'log-cabin', name: 'Log Cabin', category: 'prop', uses: ['place'],
    tags: ['cabin', 'log', 'wood', 'forest', 'chimney', 'house', 'stone'], emoji: [],
    footprint: { r: 1.33, h: 1.67 },
    about: 'Gnome Theft Auto: the Log Cabin. Built at 1/3 scale: place it at scale 3. Stacked logs with dark bands, a pitched roof, a stone chimney, a door on +z.',
    examine: [
      'Stacked logs with dark bands between them, a steep pitched roof, and a stone chimney that has been smoking since before anyone can remember.',
      'Saying: a cabin with one window is a cabin, and a cabin with none is a dare.',
      'Tip: knock twice before you open the door. The gnome inside will be sitting exactly where you hoped to sit.',
      'Joke: the chimney draws so well that the Hat Watch once wrote to ask whether the cabin was on fire. It was not. It was just proud.',
      'Someone has notched a row of marks into the doorframe, one for each winter, and stopped counting after the thirty-first.',
    ],
    parts: [
      { s: 'box', d: [2.33, 1.0, 1.67], at: [0, 0.5, 0], c: 'wood' },                              // walls
      { s: 'box', d: [2.36, 0.12, 1.7], at: [0, 0.2, 0], c: 'wood-dark' },                          // log band
      { s: 'box', d: [2.36, 0.12, 1.7], at: [0, 0.5, 0], c: 'wood-dark' },                          // log band
      { s: 'box', d: [2.36, 0.12, 1.7], at: [0, 0.8, 0], c: 'wood-dark' },                          // log band
      { s: 'wedge', d: [2.5, 0.55, 0.9], rot: [0, 180, 0], at: [0, 1.275, 0.42], c: 'bark' },      // roof, front slope
      { s: 'wedge', d: [2.5, 0.55, 0.9], at: [0, 1.275, -0.42], c: 'bark' },                        // roof, back slope
      { s: 'box', d: [0.3, 1.7, 0.3], at: [0.75, 0.85, -0.5], c: 'stone' },                         // chimney
      { s: 'box', d: [0.4, 0.6, 0.04], at: [0, 0.3, 0.855], c: 'wood-dark' },                       // door
      { s: 'box', d: [0.3, 0.25, 0.03], at: [-0.75, 0.6, 0.85], c: 'glass' },                       // window
    ],
  },
  {
    id: 'giant-oak', name: 'Giant Oak', category: 'prop', uses: ['place'],
    tags: ['oak', 'tree', 'giant', 'forest', 'canopy', 'leaf', 'shade', 'wood'], emoji: [],
    footprint: { r: 0.225, h: 2.5 },
    about: 'Gnome Theft Auto: the Giant Oak. Built at 1/4 scale: place it at scale 4. A thick trunk (footprint r is the trunk) under a broad, layered canopy of four leafy balls.',
    examine: [
      'A thick grey trunk under a broad canopy of dark and light leaves, and a shade so deep that the grass underneath has given up trying.',
      'Saying: a great many gnomes have sat under this oak, and not one of them ever stood up for the view.',
      'Tip: climb on the side with the knots. The smooth side is for the very determined, and the very determined are usually sorry.',
      'Joke: the birds keep a list of who may nest where, and the top branch is the only spot nobody has ever written down.',
      'A knot near the roots has a face in it. Gnomes agree the face looks smug, which is hard to judge from bark.',
    ],
    parts: [
      { s: 'cyl', d: [0.225, 0.3, 1.0], at: [0, 0.5, 0], c: 'bark', seg: 8 },                         // trunk
      { s: 'ball', d: [0.75], at: [0, 1.45, 0], scale: [1, 0.75, 1], c: 'leaf', seg: 8 },            // canopy, low layer
      { s: 'ball', d: [0.6], at: [0.35, 1.75, 0.1], scale: [1, 0.75, 1], c: 'leaf-dark', seg: 8 },   // canopy, side
      { s: 'ball', d: [0.55], at: [-0.3, 1.8, -0.2], scale: [1, 0.75, 1], c: 'leaf', seg: 8 },       // canopy, other side
      { s: 'ball', d: [0.5], at: [0, 2.0, 0.1], c: 'leaf-dark', seg: 8 },                           // canopy, top
    ],
  },
  {
    id: 'fallen-log', name: 'Fallen Log', category: 'prop', uses: ['place'],
    tags: ['log', 'fallen', 'moss', 'wood', 'forest', 'bench', 'bridge'], emoji: [],
    footprint: { r: 0.6, h: 0.5 },
    about: 'Gnome Theft Auto: the Fallen Log. Built at 1/2 scale: place it at scale 2. A mossy log lying along x with a moss patch on top.',
    examine: [
      'A long mossy log lying along the ground, grey at the ends where the rain has got in and green along the top where it likes to sit.',
      'Gnome saying: a log that falls by itself is a warning, and a log that falls on purpose is a bench.',
      'Tip: step on the moss side only. The bark side is slippery, and the moss side is slippery in a more cheerful way.',
      'Joke: it has been a bridge, a wall, a sofa and a dare, and it has never once asked to be any of them.',
      'Small beetles have moved in under the bark and set up a little town. They pay no rent and will not discuss it.',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.2, 2.5], rot: [0, 0, 90], at: [0, 0.2, 0], c: 'wood', seg: 8 },        // log
      { s: 'box', d: [0.8, 0.03, 0.42], at: [0.2, 0.415, 0], c: 'moss' },                          // moss patch
      { s: 'cyl', d: [0.19, 0.19, 0.02], rot: [0, 0, 90], at: [1.26, 0.2, 0], c: 'wood-light', seg: 8 }, // cut end
    ],
  },
  {
    id: 'fern-clump', name: 'Fern Clump', category: 'prop', uses: ['place'],
    tags: ['fern', 'plant', 'leaf', 'clump', 'forest', 'green', 'frond'], emoji: [],
    about: 'Gnome Theft Auto: the Fern Clump. A low clump of leafy fronds about a gnome-foot across, built from squashed balls.',
    examine: [
      'A low clump of leafy fronds, each one curled at the tip like something asleep, all leaning toward the nearest damp spot.',
      'Saying: a fern never blooms, which is why it has so much time to notice everything else.',
      'Tip: keep the clump out of the full sun. It sulks loudly otherwise, mostly by drooping over your boots.',
      'Joke: the fern by the Hedgewood path has been there longer than the path, which is either a compliment to the fern or an insult to the path.',
      'Gnomes hide small things under a clump like this. Nobody has ever found the thing they hid, only the things they forgot.',
    ],
    parts: [
      { s: 'ball', d: [0.22], at: [0, 0.11, 0], scale: [1, 0.5, 1], c: 'leaf-dark', seg: 8 },
      { s: 'ball', d: [0.18], at: [0.22, 0.09, 0.1], scale: [1, 0.5, 1], c: 'leaf', seg: 8 },
      { s: 'ball', d: [0.18], at: [-0.2, 0.09, -0.12], scale: [1, 0.5, 1], c: 'leaf', seg: 8 },
      { s: 'ball', d: [0.16], at: [0.05, 0.08, -0.25], scale: [1, 0.5, 1], c: 'leaf-dark', seg: 8 },
      { s: 'ball', d: [0.15], at: [-0.12, 0.075, 0.22], scale: [1, 0.5, 1], c: 'leaf', seg: 8 },
    ],
  },
  {
    id: 'barn', name: 'Barn', category: 'prop', uses: ['place'],
    tags: ['barn', 'farm', 'red', 'roof', 'door', 'hay', 'building'], emoji: [],
    footprint: { r: 1.6, h: 1.8 },
    about: 'Gnome Theft Auto: the Barn. Built at 1/5 scale: place it at scale 5 for the 14 x 10 x 9 barn. Red walls with white trim, a gambrel roof, and a big door on +z with a white X.',
    examine: [
      'A big red barn with white corner trim, a gambrel roof that bends twice on each side, and a wide front door with a white X across it.',
      'Saying: a good barn keeps the weather out and the hay in, and a great barn keeps the gnomes out of the hay.',
      'Tip: close the big door with both hands and a sense of purpose. It is heavy, and it gets heavier the more you explain it.',
      'Joke: the white X is a mark for the farmer, a mark for the post, and a mark for anybody who enjoys a dramatic entrance.',
      'Somebody has painted a small gnome high on the red wall, peering down at the yard. Nobody remembers painting it.',
    ],
    parts: [
      { s: 'box', d: [2.8, 1.2, 1.8], at: [0, 0.6, 0], c: 'red' },                                 // walls
      { s: 'box', d: [2.84, 0.06, 1.84], at: [0, 1.2, 0], c: 'white' },                            // white trim
      { s: 'wedge', d: [2.9, 0.4, 0.4], rot: [0, 180, 0], at: [0, 1.4, 0.7], c: 'slate' },        // roof, lower slope front
      { s: 'wedge', d: [2.9, 0.4, 0.4], at: [0, 1.4, -0.7], c: 'slate' },                          // roof, lower slope back
      { s: 'wedge', d: [2.9, 0.3, 0.5], rot: [0, 180, 0], at: [0, 1.75, 0.25], c: 'slate' },       // roof, upper slope front
      { s: 'wedge', d: [2.9, 0.3, 0.5], at: [0, 1.75, -0.25], c: 'slate' },                        // roof, upper slope back
      { s: 'box', d: [1.0, 0.9, 0.03], at: [0, 0.45, 0.91], c: 'red' },                            // big door
      { s: 'box', d: [0.07, 0.9, 0.03], rot: [0, 0, 35], at: [0, 0.45, 0.935], c: 'white' },       // door X, one arm
      { s: 'box', d: [0.07, 0.9, 0.03], rot: [0, 0, -35], at: [0, 0.45, 0.935], c: 'white' },      // door X, other arm
    ],
  },
  {
    id: 'silo', name: 'Silo', category: 'prop', uses: ['place'],
    tags: ['silo', 'grain', 'farm', 'tower', 'steel', 'dome', 'tall'], emoji: [],
    footprint: { r: 0.6, h: 2.4 },
    about: 'Gnome Theft Auto: the Silo. Built at 1/5 scale: place it at scale 5 for the 12-tall silo. A steel cylinder with three dark bands and a domed top.',
    examine: [
      'A tall steel grain silo with three dark bands around it and a domed silver top, standing as straight as a gnome who has been told to.',
      'Saying: the grain goes in at the top and comes out at the bottom, which is more than can be said for most gnomes in Turfton.',
      'Tip: never climb to the top. The view is excellent, but the ladder has opinions and the dome has no handrail.',
      'Joke: it is the tallest thing for miles that is not a gnome with a hat on, and it is taller than the hat as well.',
      'A faded number is painted near the base. Nobody knows what it counts, but the farmers say it is counting down.',
    ],
    parts: [
      { s: 'cyl', d: [0.6, 0.6, 2.1], at: [0, 1.05, 0], c: 'steel', seg: 10 },                    // body
      { s: 'cyl', d: [0.62, 0.62, 0.06], at: [0, 0.5, 0], c: 'iron-dark', seg: 10 },               // band
      { s: 'cyl', d: [0.62, 0.62, 0.06], at: [0, 1.0, 0], c: 'iron-dark', seg: 10 },               // band
      { s: 'cyl', d: [0.62, 0.62, 0.06], at: [0, 1.5, 0], c: 'iron-dark', seg: 10 },               // band
      { s: 'ball', d: [0.6], at: [0, 2.1, 0], scale: [1, 0.5, 1], c: 'silver', seg: 10 },          // dome
    ],
  },
  {
    id: 'haystack', name: 'Haystack', category: 'prop', uses: ['place'],
    tags: ['haystack', 'hay', 'straw', 'stack', 'farm', 'round', 'bed'], emoji: [],
    footprint: { r: 1.5, h: 2.5 },
    about: 'Gnome Theft Auto: the Haystack. A round golden stack 2.9 wide and 2.5 tall, with a burlap band and a domed top.',
    examine: [
      'A round golden stack of hay with a burlap band tied around the middle and a domed top that takes the rain and gives back very little.',
      'Old saying: a haystack is a bed for the tired, a hiding place for the curious and a mystery for anyone who has sneezed in one.',
      'Tip: go in from the side. From the top, the slope takes you the wrong way, and the hay gets everywhere.',
      'Joke: the stack has been built so neatly that the farmer has entered it in the Turfton fair as a sculpture.',
      'Under the very bottom, a small space has been hollowed out. Nobody will say who lives there, only that they bring their own pillow.',
    ],
    parts: [
      { s: 'cyl', d: [1.45, 1.45, 1.4], at: [0, 0.7, 0], c: 'honey', seg: 12 },                     // body
      { s: 'cyl', d: [1.48, 1.48, 0.06], at: [0, 0.7, 0], c: 'burlap', seg: 12 },                   // band
      { s: 'ball', d: [1.45], at: [0, 1.4, 0], scale: [1, 0.75, 1], c: 'straw', seg: 12 },         // dome
    ],
  },
  {
    id: 'scarecrow', name: 'Scarecrow', category: 'prop', uses: ['place'],
    tags: ['scarecrow', 'farm', 'straw', 'post', 'crow', 'hat', 'field'], emoji: [],
    footprint: { r: 0.4, h: 2.5 },
    about: 'Gnome Theft Auto: the Scarecrow. A 2.5-tall scarecrow on a post: a red shirt, blue trousers, a burlap head with button eyes, a floppy gnome hat and outstretched arms.',
    examine: [
      'A wooden post with a straw-stuffed body in a red shirt and blue trousers, a burlap head, two black button eyes and arms held wide.',
      'Saying: a scarecrow frightens no crows at all, but it does frighten the gnomes who walk past it at dusk, which is much more useful.',
      'Tip: tip your hat to it. It cannot tell whether you are being polite or hiding, and it respects both.',
      'Joke: the crows have written to the farmer to say the scarecrow is the most restful thing they have ever seen, and the farmer has written back.',
      'The floppy red hat has been mended so many times that it is now mostly string, and the string has its own opinions.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.03, 2.0], at: [0, 1.0, 0], c: 'wood-dark', seg: 6 },                  // post
      { s: 'cyl', d: [0.025, 0.025, 1.0], rot: [0, 0, 90], at: [0, 1.5, 0], c: 'wood', seg: 6 },    // arms
      { s: 'ball', d: [0.05], at: [0.5, 1.5, 0], c: 'burlap', seg: 6, mirror: true },              // hands
      { s: 'box', d: [0.3, 0.55, 0.14], at: [0, 1.4, 0], c: 'red' },                               // shirt
      { s: 'box', d: [0.26, 0.5, 0.13], at: [0, 0.85, 0], c: 'blue' },                             // trousers
      { s: 'ball', d: [0.14], at: [0, 2.0, 0], c: 'burlap', seg: 8 },                              // head
      { s: 'ball', d: [0.02], at: [0.05, 2.02, 0.12], c: 'black', seg: 6, mirror: true },          // eyes
      { s: 'ring', d: [0.2, 0.03], at: [0, 2.12, 0], rot: [90, 0, 0], c: 'red', seg: 10 },         // hat brim
      { s: 'cone', d: [0.16, 0.4], at: [0.02, 2.3, 0], c: 'red', seg: 8 },                         // floppy hat
    ],
  },
  {
    id: 'wooden-fence', name: 'Wooden Fence', category: 'prop', uses: ['place'],
    tags: ['fence', 'wood', 'rail', 'post', 'farm', 'boundary', 'section'], emoji: [],
    footprint: { r: 1, h: 0.6 },
    about: 'Gnome Theft Auto: the Wooden Fence. Built at 1/2 scale: place it at scale 2 for the 4-long fence. Two posts, two rails, long axis along x.',
    examine: [
      'A short section of fence with two grey wooden posts, two long rails, and a top rail a shade lighter than the rest where hands have worn it.',
      'Saying: a good fence keeps the neighbours in and the gnomes out, though the gnomes do not agree on which is which.',
      'Tip: lean on the top rail only if you are sure it is still attached. Several gnomes have found out the hard way.',
      'Joke: a fence is the only wall that lets you see the other side, which is why it has never once been a successful wall.',
      'Someone has carved a tiny door into the middle post. It has no hinges and no handle, and nobody has ever been seen walking through it.',
    ],
    parts: [
      { s: 'box', d: [0.08, 0.6, 0.08], at: [0.92, 0.3, 0], c: 'wood-dark', mirror: true },       // posts
      { s: 'box', d: [2.0, 0.06, 0.04], at: [0, 0.15, 0], c: 'wood' },                              // lower rail
      { s: 'box', d: [2.0, 0.06, 0.04], at: [0, 0.42, 0], c: 'wood-light' },                       // top rail
    ],
  },
  {
    id: 'wheat-patch', name: 'Wheat Patch', category: 'prop', uses: ['place'],
    tags: ['wheat', 'patch', 'field', 'crop', 'farm', 'golden', 'stalk', 'grain'], emoji: [],
    about: 'Gnome Theft Auto: the Wheat Patch. Built at 1/2 scale: place it at scale 2 for the 4 x 4 patch. A flat square of low golden clumps on dark soil.',
    examine: [
      'A flat square of golden stalks in neat rows, bending a little in the wind, with the dark soil showing between the clumps.',
      'Saying: wheat that bends in the wind is wheat that is listening, and it has heard every one of your plans.',
      'Tip: walk along the rows, not across them. A path through the wheat is the first thing the farmer will notice.',
      'Joke: the stalks are very tall for gnomes and very short for the farmer, which the farmer says is the natural order of things.',
      'Gnomes say the wheat keeps a quiet count of the ones who sneak through at night, and it is not a short list.',
    ],
    parts: [
      { s: 'box', d: [1.9, 0.04, 1.9], at: [0, 0.02, 0], c: 'dirt' },                              // soil
      { s: 'ball', d: [0.22], at: [-0.7, 0.2, -0.7], scale: [1, 0.9, 1], c: 'straw', seg: 6 },
      { s: 'ball', d: [0.22], at: [-0.25, 0.2, -0.7], scale: [1, 0.9, 1], c: 'honey', seg: 6 },
      { s: 'ball', d: [0.22], at: [0.25, 0.2, -0.7], scale: [1, 0.9, 1], c: 'straw', seg: 6 },
      { s: 'ball', d: [0.22], at: [0.7, 0.2, -0.7], scale: [1, 0.9, 1], c: 'honey', seg: 6 },
      { s: 'ball', d: [0.22], at: [-0.7, 0.2, -0.25], scale: [1, 0.9, 1], c: 'honey', seg: 6 },
      { s: 'ball', d: [0.22], at: [-0.25, 0.2, -0.25], scale: [1, 0.9, 1], c: 'straw', seg: 6 },
      { s: 'ball', d: [0.22], at: [0.25, 0.2, -0.25], scale: [1, 0.9, 1], c: 'honey', seg: 6 },
      { s: 'ball', d: [0.22], at: [0.7, 0.2, -0.25], scale: [1, 0.9, 1], c: 'straw', seg: 6 },
      { s: 'ball', d: [0.22], at: [-0.7, 0.2, 0.25], scale: [1, 0.9, 1], c: 'straw', seg: 6 },
      { s: 'ball', d: [0.22], at: [-0.25, 0.2, 0.25], scale: [1, 0.9, 1], c: 'honey', seg: 6 },
      { s: 'ball', d: [0.22], at: [0.25, 0.2, 0.25], scale: [1, 0.9, 1], c: 'straw', seg: 6 },
      { s: 'ball', d: [0.22], at: [0.7, 0.2, 0.25], scale: [1, 0.9, 1], c: 'honey', seg: 6 },
      { s: 'ball', d: [0.22], at: [-0.7, 0.2, 0.7], scale: [1, 0.9, 1], c: 'honey', seg: 6 },
      { s: 'ball', d: [0.22], at: [-0.25, 0.2, 0.7], scale: [1, 0.9, 1], c: 'straw', seg: 6 },
      { s: 'ball', d: [0.22], at: [0.25, 0.2, 0.7], scale: [1, 0.9, 1], c: 'honey', seg: 6 },
      { s: 'ball', d: [0.22], at: [0.7, 0.2, 0.7], scale: [1, 0.9, 1], c: 'straw', seg: 6 },
    ],
  },
];
