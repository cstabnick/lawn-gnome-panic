// Gnome Theft Auto: gnome houses for the outer-region settlements (terrain pass). Life-size metres.
// Every house: front door on +z, walls take `tint` (recolour the walls), the roof takes `trim` (recolour the roof).
import type { PrefabDef } from '../types';

export const GTA_HOUSES: readonly PrefabDef[] = [
  {
    id: 'gnome-cottage', name: 'Gnome Cottage', category: 'prop', uses: ['place'],
    tags: ['cottage', 'house', 'home', 'gnome', 'paper', 'slate', 'chimney', 'village', 'meadow', 'flower'], emoji: [],
    tint: 'paper', trim: 'slate',
    footprint: { r: 3, h: 4.8 },
    about: 'Gnome Theft Auto: the Gnome Cottage. Life-size metres, front door on +z. Walls take the tint (paper), the pitched roof takes the trim (slate). Chimney, flower box, front step.',
    examine: [
      'A low paper-walled cottage with a steep slate roof, a chimney that leans a little, and a flower box under the front window.',
      'Saying: a gnome with a roof over the head is a gnome who has stopped asking for much else.',
      'Tip: wipe your boots on the step. The flower box has opinions about mud, and it is not shy about sharing them.',
      'Joke: the chimney smokes so cheerfully that the neighbours have stopped asking whether anyone is in.',
      'The front door has a brass knocker shaped like a snail. It is the only thing in Mossbottom that moves slower than the postman.',
    ],
    parts: [
      { s: 'box', d: [6, 2.6, 5], at: [0, 1.3, 0], c: 'tint' },                                   // walls
      { s: 'wedge', d: [6.2, 2.0, 2.9], at: [0, 3.6, 1.45], rot: [0, 180, 0], c: 'trim' },         // roof, front slope
      { s: 'wedge', d: [6.2, 2.0, 2.9], at: [0, 3.6, -1.45], c: 'trim' },                          // roof, back slope
      { s: 'box', d: [0.5, 2.6, 0.5], at: [1.8, 4.0, -0.8], c: 'stone' },                          // chimney
      { s: 'box', d: [0.8, 1.4, 0.04], at: [0, 0.7, 2.52], c: 'wood-dark' },                       // door
      { s: 'box', d: [0.7, 0.7, 0.04], at: [-1.8, 1.5, 2.52], c: 'glass' },                        // window, left
      { s: 'box', d: [0.7, 0.7, 0.04], at: [1.8, 1.5, 2.52], c: 'glass' },                         // window, right
      { s: 'box', d: [0.9, 0.18, 0.25], at: [-1.8, 0.95, 2.6], c: 'wood-dark' },                   // flower box
      { s: 'ball', d: [0.1], at: [-2.0, 1.15, 2.62], c: 'petal', seg: 6 },                         // flowers
      { s: 'ball', d: [0.1], at: [-1.6, 1.15, 2.62], c: 'petal', seg: 6 },
      { s: 'box', d: [1.2, 0.2, 0.6], at: [0, 0.1, 3.0], c: 'stone' },                             // front step
    ],
  },
  {
    id: 'thatched-cottage', name: 'Thatched Cottage', category: 'prop', uses: ['place'],
    tags: ['cottage', 'house', 'home', 'gnome', 'thatch', 'straw', 'round', 'meadow', 'farm', 'village'], emoji: [],
    tint: 'paper', trim: 'straw',
    footprint: { r: 3.5, h: 4.8 },
    about: 'Gnome Theft Auto: the Thatched Cottage. Life-size metres, front door on +z. White walls take the tint (paper), a thick rounded thatch roof takes the trim (straw). Low porch, round window.',
    examine: [
      'White walls under a thick roof of straw that comes down low on every side, like a hat pulled over the eyes.',
      'Saying: a thatch roof is never finished, only fixed a little more each spring, the way a gnome is never finished with a hat.',
      'Tip: the straw is a bird\'s favourite nesting place. Knock before you go up to look, and expect a row of very rude opinions.',
      'Joke: the thatcher is paid in cake, and the cake is paid to the thatcher, and so far the roof has not been thatched at all.',
      'Someone has pushed a tiny clay pot into the thatch near the chimney. It holds a single daisy and a great deal of pride.',
    ],
    parts: [
      { s: 'box', d: [7, 2.4, 5], at: [0, 1.2, 0], c: 'tint' },                                    // walls
      { s: 'ball', d: [1], at: [0, 3.3, 0], scale: [3.8, 1.5, 3.0], c: 'trim', seg: 8 },            // thatch dome
      { s: 'cyl', d: [0.35, 0.35, 5.6], at: [0, 4.5, 0], rot: [0, 0, 90], c: 'trim', seg: 6 },     // thatch ridge
      { s: 'box', d: [0.8, 1.4, 0.04], at: [0, 0.7, 2.52], c: 'wood-dark' },                       // door
      { s: 'cyl', d: [0.35, 0.35, 0.05], at: [2.0, 1.5, 2.52], rot: [90, 0, 0], c: 'glass', seg: 8 }, // round window
      { s: 'cyl', d: [0.35, 0.35, 0.05], at: [-2.0, 1.5, 2.52], rot: [90, 0, 0], c: 'glass', seg: 8 },
      { s: 'box', d: [2.6, 0.2, 1.4], at: [0, 0.1, 3.2], c: 'wood' },                                // porch deck
      { s: 'cyl', d: [0.07, 0.07, 0.6], at: [-1.2, 0.3, 3.8], c: 'wood-dark', seg: 6 },               // porch posts
      { s: 'cyl', d: [0.07, 0.07, 0.6], at: [1.2, 0.3, 3.8], c: 'wood-dark', seg: 6 },
    ],
  },
  {
    id: 'snow-cottage', name: 'Snow Cottage', category: 'prop', uses: ['place'],
    tags: ['cottage', 'house', 'home', 'gnome', 'stone', 'snow', 'slate', 'winter', 'mountain', 'chimney'], emoji: [],
    tint: 'stone', trim: 'slate',
    footprint: { r: 3, h: 5.4 },
    about: 'Gnome Theft Auto: the Snow Cottage. Life-size metres, front door on +z. Stone walls take the tint (stone), a steep slate roof takes the trim (slate), with a snow layer on each slope and a snowy stone chimney.',
    examine: [
      'Stone walls and a steep slate roof, with a white layer of snow on each slope that nobody has ever got round to brushing off.',
      'Saying: stone keeps the cold out and the gnome in, and a snowy roof keeps everyone guessing about the weather.',
      'Tip: the shutters are painted shut. Open them with a shove, a second shove and a short apology to the window.',
      'Joke: the chimney is the only warm spot for a mile, so every mouse and magpie in the valley has a standing appointment there.',
      'A row of icicles hangs from the eaves. They are counted every morning, and the count has never once gone down.',
    ],
    parts: [
      { s: 'box', d: [6, 2.6, 5], at: [0, 1.3, 0], c: 'tint' },                                    // walls
      { s: 'wedge', d: [6.2, 2.6, 2.9], at: [0, 3.9, 1.45], rot: [0, 180, 0], c: 'trim' },          // roof, front slope
      { s: 'wedge', d: [6.2, 2.6, 2.9], at: [0, 3.9, -1.45], c: 'trim' },                           // roof, back slope
      { s: 'box', d: [6.1, 0.14, 3.85], at: [0, 3.97, 1.51], rot: [41.9, 0, 0], c: 'white' },       // snow, front slope
      { s: 'box', d: [6.1, 0.14, 3.85], at: [0, 3.97, -1.51], rot: [-41.9, 0, 0], c: 'white' },     // snow, back slope
      { s: 'box', d: [0.5, 2.9, 0.5], at: [1.8, 4.45, -0.9], c: 'stone' },                          // chimney
      { s: 'box', d: [0.6, 0.12, 0.6], at: [1.8, 5.96, -0.9], c: 'white' },                         // chimney snow
      { s: 'box', d: [0.8, 1.4, 0.04], at: [0, 0.7, 2.52], c: 'wood-dark' },                       // door
      { s: 'box', d: [0.6, 0.7, 0.04], at: [-1.8, 1.4, 2.52], c: 'glass' },                        // window, left
      { s: 'box', d: [0.6, 0.7, 0.04], at: [1.8, 1.4, 2.52], c: 'glass' },                         // window, right
      { s: 'box', d: [0.25, 0.7, 0.05], at: [2.25, 1.4, 2.53], c: 'slate', mirror: true },         // shutters
    ],
  },
  {
    id: 'stilt-cottage', name: 'Stilt Cottage', category: 'prop', uses: ['place'],
    tags: ['cottage', 'house', 'home', 'gnome', 'wood', 'stilts', 'loch', 'swamp', 'wetland', 'deck', 'forest'], emoji: [],
    tint: 'wood', trim: 'leaf-dark',
    footprint: { r: 2.5, h: 5.6 },
    about: 'Gnome Theft Auto: the Stilt Cottage. Life-size metres, front door on +z. A wooden cabin on six 1.6 m stilts, a ramp down the front to the ground, a small deck. Walls take the tint (wood), roof the trim (leaf-dark).',
    examine: [
      'A wooden cabin up on six long stilts, with a small deck out front and a ramp that runs down to the wet ground.',
      'Saying: a house that stands on legs has nowhere to put the water, which is precisely why the gnomes of the loch built it.',
      'Tip: the ramp is steep and the deck is sticky. Take the ramp slowly, and do not wave at the frogs; they take it personally.',
      'Joke: the stilts are sturdy, the floor is not, and the best way to find out which is which is to ask a cousin to visit.',
      'Under the floor, a family of newts has built a small, damp parlour. They invite visitors. They do not offer chairs.',
    ],
    parts: [
      { s: 'cyl', d: [0.12, 0.12, 1.6], at: [-1.9, 0.8, -1.9], c: 'wood-dark', seg: 6 },              // stilts
      { s: 'cyl', d: [0.12, 0.12, 1.6], at: [0, 0.8, -1.9], c: 'wood-dark', seg: 6 },
      { s: 'cyl', d: [0.12, 0.12, 1.6], at: [1.9, 0.8, -1.9], c: 'wood-dark', seg: 6 },
      { s: 'cyl', d: [0.12, 0.12, 1.6], at: [-1.9, 0.8, 1.9], c: 'wood-dark', seg: 6 },
      { s: 'cyl', d: [0.12, 0.12, 1.6], at: [0, 0.8, 1.9], c: 'wood-dark', seg: 6 },
      { s: 'cyl', d: [0.12, 0.12, 1.6], at: [1.9, 0.8, 1.9], c: 'wood-dark', seg: 6 },
      { s: 'box', d: [5.0, 0.2, 5.0], at: [0, 1.7, 0], c: 'wood' },                                  // floor slab, 1.6 to 1.8
      { s: 'box', d: [4.6, 2.2, 4.6], at: [0, 2.9, 0], c: 'tint' },                                  // walls
      { s: 'wedge', d: [5.2, 1.6, 2.8], at: [0, 4.8, 1.4], rot: [0, 180, 0], c: 'trim' },           // roof, front slope
      { s: 'wedge', d: [5.2, 1.6, 2.8], at: [0, 4.8, -1.4], c: 'trim' },                            // roof, back slope
      { s: 'box', d: [0.8, 1.4, 0.04], at: [0, 2.5, 2.32], c: 'wood-dark' },                        // door
      { s: 'box', d: [0.6, 0.6, 0.04], at: [-1.2, 3.0, 2.32], c: 'glass' },                         // window, left
      { s: 'box', d: [0.6, 0.6, 0.04], at: [1.2, 3.0, 2.32], c: 'glass' },                          // window, right
      { s: 'box', d: [2.4, 0.12, 1.2], at: [0, 1.74, 3.1], c: 'wood-light' },                       // deck
      { s: 'wedge', d: [1.0, 1.8, 1.6], at: [0, 0.9, 4.5], rot: [0, 180, 0], c: 'wood-light' },     // ramp down to the ground
    ],
  },
  {
    id: 'toadstool-cottage', name: 'Toadstool Cottage', category: 'prop', uses: ['place'],
    tags: ['cottage', 'house', 'home', 'gnome', 'mushroom', 'toadstool', 'bone', 'round', 'forest', 'meadow', 'garden'], emoji: [],
    tint: 'bone', trim: 'mushroom-cap',
    footprint: { r: 3, h: 5.2 },
    about: 'Gnome Theft Auto: the Toadstool Cottage. Life-size metres, front door on +z. A fat round stem (tint bone) under a wide spotted cap (trim mushroom-cap), a round door, round windows and a little chimney.',
    examine: [
      'A round house under a huge red cap with white spots, built on a fat stem the colour of old bone, with a round door and two round windows.',
      'Saying: a toadstool does not grow in a hurry, and neither does a gnome who sleeps under one. Both will be there in the morning.',
      'Tip: the spots are not for decoration. Count them before you walk up, or the cottage will count you instead.',
      'Joke: it is the only house in the forest where the gnome gets the ceiling for free and the rain gets the carpet.',
      'A tiny chimney pokes out of the cap, and a thin thread of smoke rises from it in neat little curls, like someone signing their name.',
    ],
    parts: [
      { s: 'cyl', d: [1.75, 1.75, 2.6], at: [0, 1.3, 0], c: 'tint', seg: 10 },                         // stem
      { s: 'ball', d: [3.0], at: [0, 3.2, 0], scale: [1, 0.6, 1], c: 'trim', seg: 10 },               // cap
      { s: 'ball', d: [0.3], at: [2.1, 4.5, 0], scale: [1, 0.4, 1], c: 'white', seg: 6 },             // cap spots
      { s: 'ball', d: [0.3], at: [-0.8, 4.8, 1.2], scale: [1, 0.4, 1], c: 'white', seg: 6 },
      { s: 'ball', d: [0.3], at: [0.9, 4.6, -1.6], scale: [1, 0.4, 1], c: 'white', seg: 6 },
      { s: 'box', d: [0.45, 1.4, 0.45], at: [1.5, 4.9, 0], c: 'stone' },                                // chimney
      { s: 'cyl', d: [0.5, 0.5, 0.1], at: [0, 0.5, 1.78], rot: [90, 0, 0], c: 'wood-dark', seg: 10 },   // round door
      { s: 'cyl', d: [0.3, 0.3, 0.08], at: [1.2, 1.8, 1.3], rot: [90, 0, 0], c: 'glass', seg: 8, mirror: true }, // round windows
    ],
  },
  {
    id: 'adobe-house', name: 'Adobe House', category: 'prop', uses: ['place'],
    tags: ['house', 'home', 'gnome', 'adobe', 'clay', 'desert', 'mesa', 'flat', 'sand', 'town'], emoji: [],
    tint: 'clay', trim: 'clay-dark',
    footprint: { r: 4, h: 5.4 },
    about: 'Gnome Theft Auto: the Adobe House. Life-size metres, front door on +z. Two flat-roofed clay blocks (walls take the tint, clay), rounded parapets and beam ends (trim clay-dark), a turquoise door frame, and a ladder to the upper roof.',
    examine: [
      'Two flat-roofed clay blocks stacked like sugar cubes, with rounded parapets along the roof and a little blue door in the front.',
      'Saying: a flat roof is a place to sleep, a place to dry the chillies and a place to shout across the valley at the neighbours.',
      'Tip: the upper roof is reached by the ladder on the side. Climb it slowly; the clay is warm and the rungs are not.',
      'Joke: the parapet is so rounded that the rain has nowhere to stand, so it sits in the middle of the roof and sulks instead.',
      'Someone has painted a sun above the door in faded yellow. Every rainy season the paint runs, and every dry one it is put back.',
    ],
    parts: [
      { s: 'box', d: [8, 2.8, 6], at: [0, 1.4, 0], c: 'tint' },                                     // ground block
      { s: 'box', d: [4, 2.4, 4], at: [-2, 4.0, 0], c: 'tint' },                                     // upper block
      { s: 'cyl', d: [0.15, 0.15, 8], at: [0, 2.95, 3.0], rot: [0, 0, 90], c: 'trim', seg: 6 },    // lower parapet, front
      { s: 'cyl', d: [0.15, 0.15, 8], at: [0, 2.95, -3.0], rot: [0, 0, 90], c: 'trim', seg: 6 },   // lower parapet, back
      { s: 'cyl', d: [0.15, 0.15, 6], at: [-4.0, 2.95, 0], rot: [90, 0, 0], c: 'trim', seg: 6 },   // lower parapet, left
      { s: 'cyl', d: [0.15, 0.15, 6], at: [4.0, 2.95, 0], rot: [90, 0, 0], c: 'trim', seg: 6 },    // lower parapet, right
      { s: 'cyl', d: [0.16, 0.16, 4], at: [-2, 5.2, 2.0], rot: [0, 0, 90], c: 'trim', seg: 6 },    // upper parapet, front
      { s: 'cyl', d: [0.16, 0.16, 4], at: [-2, 5.2, -2.0], rot: [0, 0, 90], c: 'trim', seg: 6 },   // upper parapet, back
      { s: 'cyl', d: [0.16, 0.16, 4], at: [-4.0, 5.2, 0], rot: [90, 0, 0], c: 'trim', seg: 6 },    // upper parapet, left
      { s: 'cyl', d: [0.16, 0.16, 4], at: [0, 5.2, 0], rot: [90, 0, 0], c: 'trim', seg: 6 },       // upper parapet, right
      { s: 'box', d: [0.3, 0.3, 0.3], at: [-3.0, 2.6, 3.15], c: 'wood-dark' },                      // beam ends
      { s: 'box', d: [0.3, 0.3, 0.3], at: [-1.0, 2.6, 3.15], c: 'wood-dark' },
      { s: 'box', d: [0.3, 0.3, 0.3], at: [0.6, 2.6, 3.15], c: 'wood-dark' },
      { s: 'box', d: [0.3, 0.3, 0.3], at: [3.2, 2.6, 3.15], c: 'wood-dark' },
      { s: 'box', d: [0.8, 1.4, 0.06], at: [2.0, 0.7, 3.03], c: 'wood-dark' },                      // door
      { s: 'box', d: [0.1, 1.5, 0.12], at: [1.55, 0.75, 3.06], c: 0x3fb8b0 },                       // turquoise door frame
      { s: 'box', d: [0.1, 1.5, 0.12], at: [2.45, 0.75, 3.06], c: 0x3fb8b0 },
      { s: 'box', d: [1.0, 0.12, 0.12], at: [2.0, 1.52, 3.06], c: 0x3fb8b0 },
      { s: 'box', d: [0.6, 0.6, 0.04], at: [-3.0, 1.5, 3.02], c: 'glass' },                          // window, left
      { s: 'box', d: [0.6, 0.6, 0.04], at: [3.2, 1.5, 3.02], c: 'glass' },                           // window, right
      { s: 'cyl', d: [0.04, 0.04, 2.4], at: [0.15, 4.0, -1.2], c: 'wood-dark', seg: 6 },            // ladder rails
      { s: 'cyl', d: [0.04, 0.04, 2.4], at: [0.15, 4.0, -0.4], c: 'wood-dark', seg: 6 },
      { s: 'box', d: [0.1, 0.05, 0.9], at: [0.2, 3.2, -0.8], c: 'wood-dark' },                       // ladder rungs
      { s: 'box', d: [0.1, 0.05, 0.9], at: [0.2, 3.8, -0.8], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.05, 0.9], at: [0.2, 4.4, -0.8], c: 'wood-dark' },
    ],
  },
];
