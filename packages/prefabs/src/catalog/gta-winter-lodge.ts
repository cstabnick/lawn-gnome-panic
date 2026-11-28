// Gnome Theft Auto winter sports (E12): the Woolly Sock Lodge and Pail Pond kit (lodge building, racks, mug, ice auger,
// ice shanty, sardine tin, the pail's handle). Scenery for games/gnome-theft-auto winter/hill.ts and winter/pond.ts.
import type { PrefabDef } from '../types';

export const GTA_WINTER_LODGE: readonly PrefabDef[] = [
  {
    id: 'woolly-sock-lodge', name: 'Woolly Sock Lodge', category: 'prop', uses: ['place'],
    tags: ['lodge', 'cabin', 'ski', 'winter', 'snow', 'wool', 'sock', 'house', 'chimney', 'porch', 'log'], emoji: [],
    tint: 'wood', trim: 'bark',
    footprint: { r: 5.2, h: 5.2 },
    about: 'Gnome Theft Auto: the Woolly Sock Lodge. Life-size metres, front door on +z. Log walls take the tint (wood), a steep roof takes the trim (bark) with white snow slabs on top, a stone chimney, a porch on two posts, a giant knitted sock for a sign.',
    examine: [
      'Low log walls under a steep roof wearing a hat of snow, with a red and white sock the size of a rowing boat hung over the door.',
      'Saying: a lodge with a sock for a sign has nothing left to prove, and a great deal of wool to prove it with.',
      'Tip: the porch bench is for taking your boots off on. Sitting on it in boots is how the bench got its dent.',
      'Gentian Bootlace says she has never once fallen over the lodge. She has, twice, and says both were on purpose.',
      'A knitting basket sits in the front window, and every week the sock over the door is a few inches longer.',
    ],
    parts: [
      { s: 'box', d: [9.6, 3.0, 6.6], at: [0, 1.5, 0], c: 'tint' },                                       // log walls
      { s: 'box', d: [9.64, 0.12, 0.03], at: [0, 0.4, 3.315], c: 'wood-dark' },                           // front log bands
      { s: 'box', d: [9.64, 0.12, 0.03], at: [0, 0.9, 3.315], c: 'wood-dark' },
      { s: 'box', d: [9.64, 0.12, 0.03], at: [0, 2.45, 3.315], c: 'wood-dark' },
      { s: 'box', d: [9.64, 0.12, 0.03], at: [0, 2.95, 3.315], c: 'wood-dark' },
      { s: 'box', d: [10.2, 0.2, 4.03], at: [0, 4.0, 1.75], rot: [29.7, 0, 0], c: 'trim' },              // roof, front slope
      { s: 'box', d: [10.2, 0.2, 4.03], at: [0, 4.0, -1.75], rot: [-29.7, 0, 0], c: 'trim' },            // roof, back slope
      { s: 'box', d: [10.0, 0.06, 3.9], at: [0, 4.148, 1.834], rot: [29.7, 0, 0], c: 'white' },         // snow, front slope
      { s: 'box', d: [10.0, 0.06, 3.9], at: [0, 4.148, -1.834], rot: [-29.7, 0, 0], c: 'white' },       // snow, back slope
      { s: 'box', d: [0.8, 3.2, 0.8], at: [3.0, 3.6, -1.2], c: 'stone' },                               // chimney
      { s: 'box', d: [0.95, 0.12, 0.95], at: [3.0, 5.25, -1.2], c: 'stone-dark' },                      // chimney cap
      { s: 'box', d: [1.2, 2.2, 0.04], at: [0, 1.1, 3.32], c: 'wood-dark' },                            // front door
      { s: 'box', d: [1.0, 0.7, 0.04], at: [-3.0, 1.5, 3.32], c: 'yellow', glow: true },                 // window, left
      { s: 'box', d: [1.0, 0.7, 0.04], at: [3.0, 1.5, 3.32], c: 'yellow', glow: true },                  // window, right
      { s: 'box', d: [3.2, 0.2, 1.7], at: [0, 0.1, 4.05], c: 'wood-light' },                            // porch deck
      { s: 'cyl', d: [0.1, 0.1, 2.8], at: [1.4, 1.4, 4.7], c: 'wood-dark', seg: 6, mirror: true },      // porch posts
      { s: 'box', d: [3.4, 0.14, 2.2], at: [0, 2.8, 4.2], c: 'bark' },                                  // porch roof
      { s: 'box', d: [0.04, 0.7, 1.0], at: [4.82, 1.5, -1.5], c: 'yellow', glow: true, mirror: true },                // side windows
      { s: 'box', d: [0.04, 0.7, 1.0], at: [4.82, 1.5, 1.5], c: 'yellow', glow: true, mirror: true },                // side windows
      { s: 'box', d: [1.0, 0.7, 0.04], at: [-3.0, 1.5, -3.32], c: 'yellow', glow: true },                 // back windows
      { s: 'box', d: [1.0, 0.7, 0.04], at: [0, 1.5, -3.32], c: 'yellow', glow: true },                 // back windows
      { s: 'box', d: [1.0, 0.7, 0.04], at: [3.0, 1.5, -3.32], c: 'yellow', glow: true },                 // back windows
      { s: 'box', d: [0.14, 0.14, 4.4], at: [-2.6, 5.12, 2.0], c: 'wood-dark' },                         // sock boom from the ridge
      { s: 'box', d: [0.05, 0.4, 0.05], at: [-2.6, 4.9, 4.15], c: 'wood-dark' },                         // sock hanger
      { s: 'box', d: [1.1, 0.3, 0.46], at: [-2.6, 4.70, 4.15], c: 'red' },                          // sock stripe 1
      { s: 'box', d: [1.1, 0.3, 0.46], at: [-2.6, 4.40, 4.15], c: 'white' },                          // sock stripe 2
      { s: 'box', d: [1.1, 0.3, 0.46], at: [-2.6, 4.10, 4.15], c: 'red' },                          // sock stripe 3
      { s: 'box', d: [1.1, 0.3, 0.46], at: [-2.6, 3.80, 4.15], c: 'white' },                          // sock stripe 4
      { s: 'box', d: [1.1, 0.3, 0.46], at: [-2.6, 3.50, 4.15], c: 'red' },                          // sock stripe 5
      { s: 'box', d: [1.1, 0.3, 0.46], at: [-2.6, 3.20, 4.15], c: 'white' },                          // sock stripe 6
      { s: 'box', d: [1.1, 0.3, 0.46], at: [-2.6, 2.90, 4.15], c: 'red' },                          // sock stripe 7
      { s: 'box', d: [1.22, 0.14, 0.5], at: [-2.6, 4.92, 4.15], c: 'white' },                         // sock cuff
      { s: 'box', d: [1.1, 0.3, 0.46], at: [-2.6, 2.6, 4.15], c: 'red' },                           // sock heel
      { s: 'box', d: [1.9, 0.5, 0.45], at: [-1.95, 2.3, 4.15], c: 'red' },                          // sock foot
      { s: 'box', d: [0.4, 0.5, 0.47], at: [-1.1, 2.3, 4.15], c: 'white' },                         // sock toe
      { s: 'ball', d: [0.3], at: [-2.6, 5.15, 4.15], c: 'white', seg: 8 },                          // bobble
    ],
  },
  {
    id: 'ski-rack', name: 'Ski Rack', category: 'prop', uses: ['place'],
    tags: ['ski', 'skis', 'rack', 'winter', 'snow', 'poles', 'wood', 'lodge'], emoji: [],
    footprint: { r: 0.9, h: 1.3 },
    about: 'Gnome Theft Auto: the Ski Rack. A wooden A-frame about 2 m wide with three pairs of skis and two poles leaning on it. Life-size metres.',
    examine: [
      'An A-frame of pale wood with three pairs of long, thin skis leaning on it, all pointing the same slightly unhelpful way.',
      'Saying: a pair of skis is two planks that have agreed to go in the same direction, which is more than most gnomes manage.',
      'Tip: lean the skis tops-up, the way the rack wants them, or they slide down and take the poles with them.',
      'Joke: the poles are for balance. The skis are for falling over at speed, which is why the poles always look so brave.',
      'A tiny red ribbon is tied to one ski. Nobody remembers whose it is, and nobody has dared to take it off.',
    ],
    parts: [
      { s: 'box', d: [0.08, 1.24, 0.08], at: [0.45, 0.62, 0], rot: [0, 0, 36.9], c: 'wood-dark', mirror: true },   // legs
      { s: 'box', d: [1.05, 0.06, 0.06], at: [0, 0.5, 0], c: 'wood-light' },                                     // cross bar
      { s: 'box', d: [0.09, 1.6, 0.02], at: [-0.7, 0.775, 0.2], rot: [-15, 0, 0], c: 'red' },                    // ski pair 1
      { s: 'box', d: [0.09, 1.6, 0.02], at: [-0.58, 0.775, 0.2], rot: [-15, 0, 0], c: 'red' },
      { s: 'box', d: [0.09, 1.6, 0.02], at: [-0.2, 0.775, 0.2], rot: [-15, 0, 0], c: 'blue' },                   // ski pair 2
      { s: 'box', d: [0.09, 1.6, 0.02], at: [-0.08, 0.775, 0.2], rot: [-15, 0, 0], c: 'blue' },
      { s: 'box', d: [0.09, 1.6, 0.02], at: [0.3, 0.775, 0.2], rot: [-15, 0, 0], c: 'yellow' },                    // ski pair 3
      { s: 'box', d: [0.09, 1.6, 0.02], at: [0.42, 0.775, 0.2], rot: [-15, 0, 0], c: 'yellow' },
      { s: 'cyl', d: [0.012, 0.012, 1.3], at: [0.95, 0.65, 0.25], rot: [-12, 0, 0], c: 'steel', seg: 4, mirror: true }, // poles
    ],
  },
  {
    id: 'sock-rack', name: 'Sock Rack', category: 'prop', uses: ['place'],
    tags: ['sock', 'socks', 'rack', 'drying', 'wool', 'washing', 'clothes', 'horse', 'lodge', 'winter'], emoji: [],
    footprint: { r: 0.9, h: 1.3 },
    about: 'Gnome Theft Auto: the Sock Rack. A clothes-horse drying rack about 1.6 m wide with five woolly socks over the top rail and one giant grey sock draped over the end (three times the size).',
    examine: [
      'A clothes-horse drying rack with five woolly socks hung over the top rail, and a giant grey sock draped over one end.',
      'Saying: a sock hung up to dry is a promise that someone will come back for it, and they usually do.',
      'Tip: check the heel before you take a sock down. The big one has a hole, and the hole is the only part that is entirely its own.',
      'Joke: the giant sock is said to belong to someone very large who has not come back for it. The gnomes have been careful not to borrow it.',
      'Five socks, three colours, and one sock the colour of a rainy afternoon, all hanging very still in the windless air.',
    ],
    parts: [
      { s: 'box', d: [1.6, 0.05, 0.05], at: [0, 1.25, 0], c: 'wood' },                                                  // top rail
      { s: 'box', d: [0.05, 1.3, 0.05], at: [0.75, 0.625, 0.175], rot: [-15.6, 0, 0], c: 'wood-dark', mirror: true },   // front legs
      { s: 'box', d: [0.05, 1.3, 0.05], at: [0.75, 0.625, -0.175], rot: [15.6, 0, 0], c: 'wood-dark', mirror: true },   // back legs
      { s: 'box', d: [0.14, 0.4, 0.05], at: [-0.62, 1.05, 0], c: 'red' },                                             // sock 1, leg
      { s: 'box', d: [0.15, 0.07, 0.02], at: [-0.62, 1.12, 0.04], c: 'white' },                                       // sock 1, stripe
      { s: 'box', d: [0.16, 0.1, 0.07], at: [-0.61, 0.82, 0.01], c: 'red' },                                          // sock 1, foot
      { s: 'box', d: [0.14, 0.4, 0.05], at: [-0.38, 1.05, 0], c: 'green' },                                           // sock 2, leg
      { s: 'box', d: [0.15, 0.07, 0.02], at: [-0.38, 1.12, 0.04], c: 'wool' },                                        // sock 2, stripe
      { s: 'box', d: [0.16, 0.1, 0.07], at: [-0.37, 0.82, 0.01], c: 'green' },                                        // sock 2, foot
      { s: 'box', d: [0.14, 0.4, 0.05], at: [-0.14, 1.05, 0], c: 'blue' },                                            // sock 3, leg
      { s: 'box', d: [0.15, 0.07, 0.02], at: [-0.14, 1.12, 0.04], c: 'slate' },                                       // sock 3, stripe
      { s: 'box', d: [0.16, 0.1, 0.07], at: [-0.13, 0.82, 0.01], c: 'blue' },                                         // sock 3, foot
      { s: 'box', d: [0.14, 0.4, 0.05], at: [0.1, 1.05, 0], c: 'red' },                                               // sock 4, leg
      { s: 'box', d: [0.15, 0.07, 0.02], at: [0.1, 1.12, 0.04], c: 'white' },                                         // sock 4, stripe
      { s: 'box', d: [0.16, 0.1, 0.07], at: [0.11, 0.82, 0.01], c: 'red' },                                           // sock 4, foot
      { s: 'box', d: [0.14, 0.4, 0.05], at: [0.34, 1.05, 0], c: 'green' },                                            // sock 5, leg
      { s: 'box', d: [0.15, 0.07, 0.02], at: [0.34, 1.12, 0.04], c: 'wool' },                                         // sock 5, stripe
      { s: 'box', d: [0.16, 0.1, 0.07], at: [0.35, 0.82, 0.01], c: 'green' },                                         // sock 5, foot
      { s: 'box', d: [0.42, 1.0, 0.15], at: [0.72, 0.75, 0], c: 'slate' },                                            // giant sock, leg
      { s: 'box', d: [0.44, 0.3, 0.14], at: [0.72, 0.15, 0.02], c: 'slate' },                                         // giant sock, foot
      { s: 'cyl', d: [0.09, 0.09, 0.02], at: [0.72, 0.45, 0.085], rot: [90, 0, 0], c: 'black', seg: 8 },            // giant sock, hole at the heel
    ],
  },
  {
    id: 'cocoa-mug', name: 'Cocoa Mug', category: 'consumable', uses: ['hold', 'drink', 'place'],
    wear: { rot: [90, 0, 0] },
    tags: ['cocoa', 'mug', 'cup', 'hot', 'drink', 'chocolate', 'marshmallow', 'winter', 'tea'], emoji: ['☕'],
    about: 'Gnome Theft Auto: the Cocoa Mug. A fat cream enamel mug with a red rim, a handle ring, cocoa and marshmallows on top and a wisp of steam. The Bear Hug reward for the hand slot.',
    examine: [
      'A fat cream mug with a red rim, a dome of cocoa and three marshmallows bobbing on top, and a thin wisp of steam.',
      'Saying: a cup of cocoa warms the hands before it warms the belly, which is the order the gnomes prefer.',
      'Tip: hold it by the handle. The marshmallows do not survive a grab from the top.',
      'Joke: the marshmallows are counted, and the count is always three, which nobody has explained since the first morning.',
      'The steam curls up in a neat little question mark. Nobody has answered it, and the cocoa is getting cold.',
    ],
    grip: [0.125, 0.08, 0],
    parts: [
      { s: 'cyl', d: [0.065, 0.06, 0.14], at: [0, 0.07, 0], c: 'wool', seg: 8 },                        // body
      { s: 'cyl', d: [0.068, 0.068, 0.02], at: [0, 0.132, 0], c: 'red', seg: 8 },                      // red rim band
      { s: 'ring', d: [0.035, 0.012], at: [0.09, 0.08, 0], c: 'wool', seg: 6 },                        // handle
      { s: 'cyl', d: [0.06, 0.06, 0.02], at: [0, 0.125, 0], c: 'leather', seg: 8 },                    // cocoa
      { s: 'box', d: [0.022, 0.022, 0.022], at: [0.02, 0.147, 0.02], c: 'white' },                     // marshmallow
      { s: 'box', d: [0.022, 0.022, 0.022], at: [-0.03, 0.147, -0.01], c: 'white' },                  // marshmallow
      { s: 'box', d: [0.022, 0.022, 0.022], at: [0.0, 0.147, -0.035], c: 'white' },                    // marshmallow
      { s: 'cone', d: [0.02, 0.05], at: [0, 0.195, 0], c: 'white', glow: true, alpha: 0.5, seg: 6 },   // steam
    ],
  },
  {
    id: 'ice-auger', name: 'Ice Auger', category: 'tool', uses: ['hold', 'place'],
    tags: ['ice', 'auger', 'drill', 'tool', 'fishing', 'winter', 'hole', 'pond'], emoji: [],
    about: 'Gnome Theft Auto: the Ice Auger. A hand ice drill about 1.1 m tall: T-handle on top, steel shaft, spiral blade and a point at the bottom. Hold it by the shaft.',
    examine: [
      'A hand drill with a T-handle on top, a long steel shaft, and a spiral blade at the bottom that turns the ice into slush.',
      'Saying: the ice has a thickness, and that thickness is always exactly one auger deeper than you hoped.',
      'Tip: turn it slowly, keep your weight on the cross bar, and lift it out before the hole closes behind it.',
      'Joke: it was named after the thing it does, which is the only sensible naming any gnome has ever managed.',
      'The knobs on the crank are worn smooth by a thousand hands, and every one of them was in a hurry.',
    ],
    grip: [0, 0.9, 0],
    parts: [
      { s: 'cyl', d: [0.02, 0.02, 0.95], at: [0, 0.575, 0], c: 'steel', seg: 6 },                       // shaft
      { s: 'cone', d: [0.03, 0.12], at: [0, 0.06, 0], rot: [180, 0, 0], c: 'steel', seg: 6 },           // point
      { s: 'cyl', d: [0.09, 0.09, 0.02], at: [0, 0.16, 0], rot: [15, 0, 0], c: 'iron', seg: 8 },        // blade 1
      { s: 'cyl', d: [0.09, 0.09, 0.02], at: [0, 0.22, 0], rot: [-15, 0, 0], c: 'iron', seg: 8 },       // blade 2
      { s: 'cyl', d: [0.09, 0.09, 0.02], at: [0, 0.28, 0], rot: [15, 0, 0], c: 'iron', seg: 8 },        // blade 3
      { s: 'cyl', d: [0.09, 0.09, 0.02], at: [0, 0.34, 0], rot: [-15, 0, 0], c: 'iron', seg: 8 },       // blade 4
      { s: 'cyl', d: [0.025, 0.025, 0.5], at: [0, 1.05, 0], rot: [0, 0, 90], c: 'wood-dark', seg: 6 }, // cross bar
      { s: 'ball', d: [0.04], at: [0.25, 1.05, 0], c: 'wood-light', mirror: true, seg: 6 },            // crank knobs
    ],
  },
  {
    id: 'ice-shanty', name: 'Ice Shanty', category: 'prop', uses: ['place'],
    tags: ['shanty', 'hut', 'ice', 'fishing', 'shack', 'winter', 'house', 'pond', 'sign'], emoji: [],
    tint: 0xa8432f, trim: 'white',
    footprint: { r: 1.3, h: 2.5 },
    about: 'Gnome Theft Auto: the Ice Shanty. Life-size metres, on two skids, door and blank sign on +z. Plank walls take the tint (faded red), white corner trim, a sloped tin roof, a stovepipe and a small side window.',
    examine: [
      'A small faded-red hut on two skids, with a tin roof, a stovepipe with a cap, and a door under a blank painted sign.',
      'Saying: a shanty on the ice is a house that can be moved, which is the only kind of house the Pail Pond gnomes trust.',
      'Tip: the sign is blank on purpose. Write your name on it, and the next gnome will write theirs underneath.',
      'Joke: the stovepipe smokes so hard that the fish think a kettle has been put on, and swim up to ask for tea.',
      'Someone has scratched a row of tally marks inside the window frame. Nobody will say what they are counting.',
    ],
    parts: [
      { s: 'box', d: [0.12, 0.12, 2.2], at: [0.9, 0.06, 0], c: 'wood-dark', mirror: true },                // skids
      { s: 'box', d: [2.0, 1.9, 1.8], at: [0, 1.05, 0], c: 'tint' },                                        // plank walls
      { s: 'box', d: [0.08, 1.8, 0.08], at: [1.0, 1.05, 0.9], c: 'trim', mirror: true },                   // corner trim, front
      { s: 'box', d: [0.08, 1.8, 0.08], at: [1.0, 1.05, -0.9], c: 'trim', mirror: true },                  // corner trim, back
      { s: 'box', d: [2.4, 0.1, 2.2], at: [0, 2.2, 0], rot: [10, 0, 0], c: 'iron' },                       // tin roof
      { s: 'cyl', d: [0.05, 0.05, 0.82], at: [0.6, 2.6, -0.5], c: 'iron', seg: 6 },                       // stovepipe
      { s: 'cyl', d: [0.07, 0.07, 0.04], at: [0.6, 3.02, -0.5], c: 'iron-dark', seg: 6 },                 // pipe cap
      { s: 'box', d: [0.5, 1.2, 0.04], at: [0.3, 0.7, 0.92], c: 'wood-dark' },                             // door
      { s: 'box', d: [0.5, 0.22, 0.04], at: [0.3, 1.5, 0.93], c: 'paper' },                                // sign board
      { s: 'box', d: [0.04, 0.4, 0.4], at: [-1.01, 1.3, 0], c: 'glass' },                                  // side window
    ],
  },
  {
    id: 'sardine-tin', name: 'Sardine Tin', category: 'prop', uses: ['place'],
    tags: ['sardine', 'tin', 'can', 'fish', 'empty', 'litter', 'pond', 'larder'], emoji: [],
    about: 'Gnome Theft Auto: the Sardine Tin. An opened oval tin, lid rolled back on its key, empty, with a shine inside. About 0.25 m long.',
    examine: [
      'An oval tin, its lid rolled back on the key and empty, with a bright shine inside where the last sardine used to be.',
      'Saying: an empty tin is a lamp for the one gnome who checks every corner of the larder.',
      'Tip: the key is the only thing that opens a tin. Do not try it with a spoon, a fork or a stubborn sneeze.',
      'Joke: the label says Product of the Pond, which is a claim nobody has checked and nobody has been asked to.',
      'It smells of the sea, and of a tin that has been very good to someone for a long time.',
    ],
    parts: [
      { s: 'ball', d: [0.12], at: [0, 0.03, 0], scale: [1, 0.25, 0.55], c: 'silver', seg: 8 },            // tin body
      { s: 'ball', d: [0.1], at: [0, 0.058, 0], scale: [1, 0.05, 0.5], c: 'silver', glow: true, seg: 8 }, // shine inside
      { s: 'box', d: [0.22, 0.01, 0.1], at: [0, 0.06, -0.13], rot: [-25, 0, 0], c: 'silver' },          // lid, rolled back
      { s: 'cyl', d: [0.012, 0.012, 0.04], at: [0.13, 0.02, 0], rot: [0, 0, 90], c: 'iron', seg: 6 },   // key
    ],
  },
  {
    id: 'nap-towel', name: 'Nap Towel', category: 'prop', uses: ['place'],
    tags: ['towel', 'beach', 'nap', 'stripes', 'bear', 'pond', 'lie', 'rest'], emoji: [],
    footprint: { r: 1.6, h: 0.03 },
    about: 'Gnome Theft Auto: the Nap Towel. A big red-and-white striped towel laid flat, about 2.8 x 3.1 m (polar-bear size), for napping on the ice. Stripes run along local z.',
    examine: [
      'A towel big enough for a polar bear, striped red and white, laid out flat with the corners tugged straight.',
      'Saying: a towel on the ice is a promise that somebody intends to be very still for a very long time.',
      'Tip: lay it stripes-downhill. Nobody knows why. Everybody who naps does it.',
      'Joke: the label says Beach Towel. The beach is four hundred metres of snow away, and the bear does not mind.',
      'It is warm in the middle, the shape of a bear, and nobody is going to check that.',
    ],
    parts: [
      { s: 'box', d: [0.398, 0.02, 3.1], at: [-1.2, 0.01, 0], c: 'red' },
      { s: 'box', d: [0.398, 0.022, 3.1], at: [-0.8, 0.011, 0], c: 'white' },
      { s: 'box', d: [0.398, 0.02, 3.1], at: [-0.4, 0.01, 0], c: 'red' },
      { s: 'box', d: [0.398, 0.022, 3.1], at: [0, 0.011, 0], c: 'white' },
      { s: 'box', d: [0.398, 0.02, 3.1], at: [0.4, 0.01, 0], c: 'red' },
      { s: 'box', d: [0.398, 0.022, 3.1], at: [0.8, 0.011, 0], c: 'white' },
      { s: 'box', d: [0.398, 0.02, 3.1], at: [1.2, 0.01, 0], c: 'red' },
    ],
  },
  {
    id: 'pail-handle', name: 'Pail Handle', category: 'prop', uses: ['place'],
    tags: ['pail', 'handle', 'wire', 'ice', 'pond', 'bucket', 'rim', 'giant', 'winter'], emoji: [],
    footprint: { r: 0.3, h: 0.3 },
    about: 'Gnome Theft Auto: the Pail Handle. The galvanised arc of a giant Tall-One pail sticking out of the ice at Pail Pond: about 6 m wide, 2.5 m tall, feet at y = 0, with a wooden grip tube in the middle top.',
    examine: [
      'A huge galvanised wire arc rising out of the ice, with a wooden grip tube in the middle top and a rivet lug at each foot.',
      'Saying: the Rim is the best place to find a handle, which is why nobody has found what the handle is for.',
      'Tip: do not climb the wire. It is slippery, it is cold, and it is not a ladder, however often the gnomes have hoped.',
      'Joke: everyone has pulled the handle and nobody has lifted it, and it still makes everyone feel they could.',
      'Thermos Theo says the handle moves when nobody is looking. He says that about most things, but this time he looked hard.',
    ],
    parts: [
      { s: 'cyl', d: [0.06, 0.06, 0.98], at: [-2.88582, 0.47835, 0], rot: [0, 0, -13.44], c: 'steel', seg: 6 }, // arc 1
      { s: 'cyl', d: [0.06, 0.06, 1.04], at: [-2.44648, 1.36224, 0], rot: [0, 0, -38.71], c: 'steel', seg: 6 },        // arc 2
      { s: 'cyl', d: [0.06, 0.06, 1.2], at: [-1.63469, 2.03874, 0], rot: [0, 0, -63.22], c: 'steel', seg: 6 },         // arc 3
      { s: 'cyl', d: [0.06, 0.06, 1.16], at: [-0.57403, 2.40485, 0], rot: [0, 0, -80.54], c: 'steel', seg: 6 },        // arc 4
      { s: 'cyl', d: [0.06, 0.06, 1.16], at: [0.57403, 2.40485, 0], rot: [0, 0, -99.46], c: 'steel', seg: 6 },         // arc 5
      { s: 'cyl', d: [0.06, 0.06, 1.11], at: [1.63469, 2.03874, 0], rot: [0, 0, -119.1], c: 'steel', seg: 6 },         // arc 6
      { s: 'cyl', d: [0.06, 0.06, 1.04], at: [2.42648, 1.36224, 0], rot: [0, 0, -141.3], c: 'steel', seg: 6 },         // arc 7
      { s: 'cyl', d: [0.06, 0.06, 0.98], at: [2.88582, 0.47835, 0], rot: [0, 0, -166.56], c: 'steel', seg: 6 },        // arc 8
      { s: 'cyl', d: [0.1, 0.1, 0.9], at: [0, 2.5, 0], rot: [0, 0, 90], c: 'wood', seg: 6 },                           // grip tube
      { s: 'cyl', d: [0.14, 0.14, 0.2], at: [-3, 0.1, 0], c: 'iron', seg: 8, mirror: true },                            // rivet lugs
    ],
  },
  {
    id: 'lost-mittens', name: 'Lost Mittens', category: 'prop', uses: ['place'],
    tags: ['mitten', 'mittens', 'lost', 'glove', 'gloves', 'heap', 'wool', 'winter', 'tag'], emoji: [],
    about: 'Gnome Theft Auto: the Lost Mittens. A heap of single mismatched mittens about 0.6 m across, with a blank paper tag stuck in the top.',
    examine: [
      'A heap of single mismatched mittens, each squashed flat against the next, with a blank paper tag stuck in the top.',
      'Saying: a lost mitten is never really lost. It is only waiting for its pair, which is also lost, somewhere else.',
      'Tip: check the thumbs. The best mitten is often the one waiting on the wrong side of the heap.',
      'Joke: the tag is blank, which is the first honest thing any lost property office has ever written.',
      'Every colour in the heap has a partner missing, and every partner seems to have been last seen by the pond.',
    ],
    parts: [
      { s: 'ball', d: [0.11], at: [-0.2, 0.055, 0.05], scale: [1, 0.5, 0.75], c: 'red', seg: 8 },            // mitten 1
      { s: 'ball', d: [0.035], at: [-0.1, 0.035, 0.1], c: 'red', seg: 6 },                                  // mitten 1, thumb
      { s: 'ball', d: [0.11], at: [0.12, 0.055, -0.05], scale: [1, 0.5, 0.75], c: 'blue', seg: 8 },         // mitten 2
      { s: 'ball', d: [0.035], at: [0.22, 0.035, -0.02], c: 'blue', seg: 6 },                               // mitten 2, thumb
      { s: 'ball', d: [0.11], at: [0.0, 0.055, 0.2], scale: [1, 0.5, 0.75], c: 'yellow', seg: 8 },          // mitten 3
      { s: 'ball', d: [0.035], at: [0.1, 0.035, 0.22], c: 'yellow', seg: 6 },                               // mitten 3, thumb
      { s: 'ball', d: [0.11], at: [-0.12, 0.055, -0.18], scale: [1, 0.5, 0.75], c: 'green', seg: 8 },       // mitten 4
      { s: 'ball', d: [0.035], at: [-0.02, 0.035, -0.17], c: 'green', seg: 6 },                             // mitten 4, thumb
      { s: 'ball', d: [0.11], at: [0.25, 0.055, 0.15], scale: [1, 0.5, 0.75], c: 'orange', seg: 8 },        // mitten 5
      { s: 'ball', d: [0.035], at: [0.35, 0.035, 0.17], c: 'orange', seg: 6 },                              // mitten 5, thumb
      { s: 'ball', d: [0.11], at: [0.05, 0.055, -0.2], scale: [1, 0.5, 0.75], c: 'purple', seg: 8 },        // mitten 6
      { s: 'box', d: [0.07, 0.005, 0.05], at: [-0.2, 0.09, 0.05], rot: [0, 20, 10], c: 'paper' },           // blank tag
    ],
  },
  {
    id: 'bear-deck', name: 'Bear Deck', category: 'prop', uses: ['place'],
    tags: ['deck', 'bear', 'timber', 'sun', 'lodge', 'terrace', 'planks', 'winter', 'gta'], emoji: [],
    footprint: { r: 11.5, h: 0.9 },
    about: 'Gnome Theft Auto: the Bear Deck, a timber sun deck about 22 m wide and 6 m deep for five deck chairs. Top at 0.25 m, planks along x with dark gaps, a low rail on the back and both ends, open at the front (+z) with two steps in the middle. Base at y 0.',
    examine: [
      'A long timber deck with a low rail round three sides and two steps up at the front, set out for a row of deck chairs and nothing else.',
      'Saying: the bears are really chill, and a really chill bear never once asked anyone to move off its chair.',
      'Tip: the sign says they are not asleep. Keep your voice down all the same, in case they are being polite.',
      'Joke: the planks run the long way so the sun can find all of them at once, and the bears can find all of the sun.',
      'The dark gaps between the planks are where the cocoa goes, and the bears have never once complained.',
    ],
    parts: [
      { s: 'box', d: [22, 0.25, 0.46], at: [0, 0.125, -2.75], c: 'wood-light' },
      { s: 'box', d: [22, 0.246, 0.46], at: [0, 0.123, -2.25], c: 'wood' },
      { s: 'box', d: [22, 0.25, 0.46], at: [0, 0.125, -1.75], c: 'wood-light' },
      { s: 'box', d: [22, 0.246, 0.46], at: [0, 0.123, -1.25], c: 'wood' },
      { s: 'box', d: [22, 0.25, 0.46], at: [0, 0.125, -0.75], c: 'wood-light' },
      { s: 'box', d: [22, 0.246, 0.46], at: [0, 0.123, -0.25], c: 'wood' },
      { s: 'box', d: [22, 0.25, 0.46], at: [0, 0.125, 0.25], c: 'wood-light' },
      { s: 'box', d: [22, 0.246, 0.46], at: [0, 0.123, 0.75], c: 'wood' },
      { s: 'box', d: [22, 0.25, 0.46], at: [0, 0.125, 1.25], c: 'wood-light' },
      { s: 'box', d: [22, 0.246, 0.46], at: [0, 0.123, 1.75], c: 'wood' },
      { s: 'box', d: [22, 0.25, 0.46], at: [0, 0.125, 2.25], c: 'wood-light' },
      { s: 'box', d: [22, 0.246, 0.46], at: [0, 0.123, 2.75], c: 'wood' },
      { s: 'box', d: [21.6, 0.12, 5.6], at: [0, 0.06, 0], c: 'wood-dark' },                                // shadow under the planks
      { s: 'box', d: [0.1, 0.7, 0.1], at: [-10.9, 0.55, -2.9], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.7, 0.1], at: [-7.3, 0.55, -2.9], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.7, 0.1], at: [-3.65, 0.55, -2.9], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.7, 0.1], at: [0, 0.55, -2.9], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.7, 0.1], at: [3.65, 0.55, -2.9], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.7, 0.1], at: [7.3, 0.55, -2.9], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.7, 0.1], at: [10.9, 0.55, -2.9], c: 'wood-dark' },
      { s: 'box', d: [22, 0.06, 0.1], at: [0, 0.85, -2.9], c: 'wood' },
      { s: 'box', d: [22, 0.05, 0.06], at: [0, 0.5, -2.9], c: 'wood' },
      { s: 'box', d: [0.1, 0.7, 0.1], at: [10.9, 0.55, -0.95], c: 'wood-dark', mirror: true },
      { s: 'box', d: [0.1, 0.7, 0.1], at: [10.9, 0.55, 1.0], c: 'wood-dark', mirror: true },
      { s: 'box', d: [0.1, 0.7, 0.1], at: [10.9, 0.55, 2.9], c: 'wood-dark', mirror: true },
      { s: 'box', d: [0.1, 0.06, 5.9], at: [10.9, 0.85, 0], c: 'wood', mirror: true },
      { s: 'box', d: [0.06, 0.05, 5.9], at: [10.9, 0.5, 0], c: 'wood', mirror: true },
      { s: 'box', d: [3.0, 0.17, 0.5], at: [0, 0.085, 3.2], c: 'wood-light' },                           // step 1
      { s: 'box', d: [3.0, 0.09, 0.55], at: [0, 0.045, 3.6], c: 'wood' },                              // step 2
    ],
  },
];
