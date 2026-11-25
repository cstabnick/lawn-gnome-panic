// Gnome Theft Auto: Hedgeworth Links (batch 3 E15): the yard fence and the Kicked Board, the Members' Gate, the
// clubhouse, the pro's cottage, the groundskeeper's shed, the cart shelter and course furniture.
import type { PrefabDef } from '../types';

export const GTA_GOLF: readonly PrefabDef[] = [
  {
    id: 'board-fence-panel', name: 'Board Fence Panel', category: 'prop', uses: ['place'],
    tags: ['fence', 'board', 'boards', 'panel', 'garden', 'wood', 'gta', 'golf', 'hedgeworth', 'boundary', 'neighbour'], emoji: [],
    tint: 0x8a6a48,
    footprint: { r: 1.0, h: 2.6 },
    about: 'Gnome Theft Auto: the Board Fence Panel. Life-size metres, 2 m wide and 2.6 m tall, boards on the front (+z), two rails on the back. Boards take the tint (weathered brown).',
    examine: [
      'A tall panel of weathered garden fence, its boards set close together and its rails hidden on the back, where the neighbours keep their opinions.',
      'Saying: a fence is a line drawn on the ground by someone who has never had to cross it.',
      'Tip: the boards are nailed to the rails from behind. Go round the back if you want to see how the nails were driven.',
      'Joke: the fence keeps the neighbours out, and the neighbours keep the fence out of their conversations.',
      'Someone has scratched a small tally into the third board. It reads eleven, and nobody remembers what for.',
    ],
    parts: [
      { s: 'box', d: [0.24, 2.6, 0.06], at: [-0.875, 1.3, 0.02], c: 'tint' },    // boards, 8 across
      { s: 'box', d: [0.24, 2.6, 0.06], at: [-0.625, 1.3, 0.02], c: 'tint' },
      { s: 'box', d: [0.24, 2.6, 0.06], at: [-0.375, 1.3, 0.02], c: 'tint' },
      { s: 'box', d: [0.24, 2.6, 0.06], at: [-0.125, 1.3, 0.02], c: 'tint' },
      { s: 'box', d: [0.24, 2.6, 0.06], at: [0.125, 1.3, 0.02], c: 'tint' },
      { s: 'box', d: [0.24, 2.6, 0.06], at: [0.375, 1.3, 0.02], c: 'tint' },
      { s: 'box', d: [0.24, 2.6, 0.06], at: [0.625, 1.3, 0.02], c: 'tint' },
      { s: 'box', d: [0.24, 2.6, 0.06], at: [0.875, 1.3, 0.02], c: 'tint' },
      { s: 'box', d: [1.9, 0.1, 0.04], at: [0, 0.5, -0.035], c: 'wood-dark' },      // rails, behind the boards
      { s: 'box', d: [1.9, 0.1, 0.04], at: [0, 2.1, -0.035], c: 'wood-dark' },
    ],
  },
  {
    id: 'kicked-board-panel', name: 'Kicked Board Panel', category: 'prop', uses: ['place'],
    tags: ['fence', 'board', 'boards', 'loose', 'kicked', 'panel', 'garden', 'wood', 'gta', 'golf', 'hedgeworth', 'broken'], emoji: [],
    tint: 0x8a6a48,
    footprint: { r: 1.3, h: 2.6 },
    about: 'Gnome Theft Auto: the Kicked Board. Life-size metres, 2.6 m wide. Nine boards fixed and one gap where the loose board hangs crooked from a single nail in front of the fence. Boards take the tint.',
    examine: [
      'A board of the neighbour\'s fence hangs from one nail at a crooked angle, its bottom swung out and its paint kicked off in a boot-shaped patch.',
      'Saying: a loose board is a door that has not yet been told it is a door.',
      'Tip: the gap it leaves is exactly gnome-sized, which the gnomes find either reassuring or deeply suspicious.',
      'Joke: the scuff on it is the shape of a boot, and the boot is the shape of someone who was told to stop.',
      'It has been kicked by everyone who ever wanted a ball back, and it has never once given a ball back.',
    ],
    parts: [
      { s: 'box', d: [0.25, 2.6, 0.06], at: [-1.17, 1.3, 0.02], c: 'tint' },    // fixed boards, 10 across with one gap
      { s: 'box', d: [0.25, 2.6, 0.06], at: [-0.91, 1.3, 0.02], c: 'tint' },
      { s: 'box', d: [0.25, 2.6, 0.06], at: [-0.65, 1.3, 0.02], c: 'tint' },
      { s: 'box', d: [0.25, 2.6, 0.06], at: [-0.39, 1.3, 0.02], c: 'tint' },
      { s: 'box', d: [0.25, 2.6, 0.06], at: [0.13, 1.3, 0.02], c: 'tint' },
      { s: 'box', d: [0.25, 2.6, 0.06], at: [0.39, 1.3, 0.02], c: 'tint' },
      { s: 'box', d: [0.25, 2.6, 0.06], at: [0.65, 1.3, 0.02], c: 'tint' },
      { s: 'box', d: [0.25, 2.6, 0.06], at: [0.91, 1.3, 0.02], c: 'tint' },
      { s: 'box', d: [0.25, 2.6, 0.06], at: [1.17, 1.3, 0.02], c: 'tint' },
      { s: 'box', d: [0.25, 1.9, 0.04], at: [0.195, 1.357, 0.09], rot: [0, 0, 20], c: 'tint' },  // loose board, hung from the nail
      { s: 'box', d: [0.26, 0.36, 0.02], at: [-0.6, 0.9, 0.062], c: 'leather-dark' },            // boot scuff
      { s: 'box', d: [0.22, 0.1, 0.02], at: [-0.6, 0.66, 0.062], c: 'leather-dark' },            // boot toe
      { s: 'ball', d: [0.03], at: [-0.13, 2.25, 0.13], c: 'iron', seg: 6 },                      // nail head
      { s: 'box', d: [0.07, 0.01, 0.01], at: [-0.1, 2.28, 0.14], rot: [0, 0, 35], c: 'iron-dark' }, // bent nail
      { s: 'box', d: [2.5, 0.1, 0.04], at: [0, 0.5, -0.035], c: 'wood-dark' },                  // rails, behind
      { s: 'box', d: [2.5, 0.1, 0.04], at: [0, 2.1, -0.035], c: 'wood-dark' },
    ],
  },
  {
    id: 'fence-plank-pile', name: 'Fence Plank Pile', category: 'prop', uses: ['place'],
    tags: ['fence', 'planks', 'plank', 'pile', 'broken', 'splinters', 'wood', 'debris', 'gta', 'golf', 'hedgeworth'], emoji: [],
    about: 'Gnome Theft Auto: the Fence Plank Pile. Life-size metres, about 2.6 m by 1.2 m. Five planks lying askew at different thicknesses, two broken stubs at the ends and a few splinters.',
    examine: [
      'Five planks lying every which way, with two broken stubs at the ends like teeth in a bad smile.',
      'Saying: a plank that has left its fence has a new opinion, and most of them have it about gnomes.',
      'Tip: step over the planks, not on them. The ones that are not nailed down are the ones that move.',
      'Joke: a pile of planks is only a fence that has stopped pretending it was ever a wall.',
      'Splinters glint in the grass, and the gnomes have been collecting them for something they will not describe.',
    ],
    parts: [
      { s: 'box', d: [1.6, 0.03, 0.2], at: [0, 0.015, -0.48], rot: [0, 3, 0], c: 'wood-light' },
      { s: 'box', d: [1.6, 0.12, 0.2], at: [0, 0.06, -0.24], rot: [0, -2, 0], c: 'wood' },
      { s: 'box', d: [1.6, 0.06, 0.2], at: [0, 0.03, 0], rot: [0, 4, 0], c: 'wood-dark' },
      { s: 'box', d: [1.6, 0.09, 0.2], at: [0, 0.045, 0.24], rot: [0, -3, 0], c: 'wood' },
      { s: 'box', d: [1.6, 0.04, 0.2], at: [0, 0.02, 0.48], rot: [0, 2, 0], c: 'wood-light' },
      { s: 'box', d: [0.14, 0.4, 0.14], at: [-1.15, 0.2, 0], c: 'wood-dark' },                 // broken stub, left
      { s: 'box', d: [0.14, 0.4, 0.14], at: [1.15, 0.21, 0.3], rot: [0, 0, 8], c: 'wood-dark' }, // broken stub, right
      { s: 'box', d: [0.05, 0.01, 0.01], at: [0.9, 0.005, -0.1], c: 'wood-light' },            // splinters
      { s: 'box', d: [0.05, 0.01, 0.01], at: [-0.95, 0.005, 0.35], rot: [0, 40, 0], c: 'wood-light' },
      { s: 'box', d: [0.05, 0.01, 0.01], at: [0.3, 0.005, 0.7], rot: [0, -20, 0], c: 'wood' },
    ],
  },
  {
    id: 'members-gate', name: "Members' Gate", category: 'prop', uses: ['place'],
    tags: ['gate', 'gates', 'iron', 'wrought', 'members', 'locked', 'padlock', 'chain', 'fence', 'gta', 'golf', 'hedgeworth'], emoji: [],
    footprint: { r: 3.5, h: 2.4 },
    about: 'Gnome Theft Auto: the Members\' Gate. Life-size metres, 7 m wide and 2.4 m tall, two brick piers and two wrought-iron leaves on +z. A blank white plaque on the left leaf (the game writes MEMBERS ONLY on it).',
    examine: [
      'Two wrought-iron leaves between brick piers, with a fat brass padlock on a chain and a white plaque on the left leaf that says MEMBERS ONLY.',
      'Saying: a gate that is always locked is the only honest gate, and the gnomes respect it for that.',
      'Tip: the bars are close enough to stop a gnome and far enough apart to see the course through, which is the whole design.',
      'Joke: the gate keeps members in and everyone else slightly to one side of it.',
      'A small hollow under the left leaf has been dug, filled and dug again. Something is still going in and out.',
    ],
    parts: [
      { s: 'box', d: [0.6, 2.8, 0.6], at: [-3.2, 1.4, 0], c: 'clay-dark', mirror: true },    // brick piers
      { s: 'box', d: [0.72, 0.14, 0.72], at: [-3.2, 2.87, 0], c: 'stone', mirror: true },     // stone caps
      { s: 'ball', d: [0.14], at: [-3.2, 3.1, 0], c: 'stone', seg: 6, mirror: true },          // ball finials
      { s: 'box', d: [0.04, 2.3, 0.04], at: [0.1, 1.15, 0], c: 'black', mirror: true },       // bars, 9 each side
      { s: 'box', d: [0.04, 2.3, 0.04], at: [0.4, 1.15, 0], c: 'black', mirror: true },
      { s: 'box', d: [0.04, 2.3, 0.04], at: [0.7, 1.15, 0], c: 'black', mirror: true },
      { s: 'box', d: [0.04, 2.3, 0.04], at: [1.0, 1.15, 0], c: 'black', mirror: true },
      { s: 'box', d: [0.04, 2.3, 0.04], at: [1.3, 1.15, 0], c: 'black', mirror: true },
      { s: 'box', d: [0.04, 2.3, 0.04], at: [1.6, 1.15, 0], c: 'black', mirror: true },
      { s: 'box', d: [0.04, 2.3, 0.04], at: [1.9, 1.15, 0], c: 'black', mirror: true },
      { s: 'box', d: [0.04, 2.3, 0.04], at: [2.2, 1.15, 0], c: 'black', mirror: true },
      { s: 'box', d: [0.04, 2.3, 0.04], at: [2.5, 1.15, 0], c: 'black', mirror: true },
      { s: 'box', d: [2.9, 0.06, 0.04], at: [1.45, 2.25, 0], c: 'black', mirror: true },      // top rail
      { s: 'box', d: [2.9, 0.06, 0.04], at: [1.45, 0.1, 0], c: 'black', mirror: true },       // bottom rail
      { s: 'ring', d: [0.15, 0.015], at: [2.2, 2.0, 0], rot: [0, 0, 0], c: 'black', mirror: true }, // scroll
      { s: 'ring', d: [0.2, 0.012], at: [-0.3, 1.1, 0], rot: [90, 0, 0], c: 'iron-dark' },    // chain, wound round two bars
      { s: 'ring', d: [0.2, 0.012], at: [-0.3, 1.3, 0], rot: [90, 0, 0], c: 'iron-dark' },
      { s: 'box', d: [0.2, 0.24, 0.1], at: [-0.3, 1.2, 0.2], c: 'brass' },                    // padlock
      { s: 'box', d: [0.8, 0.3, 0.02], at: [-1.45, 1.6, 0.06], c: 'white' },                  // enamel plaque
    ],
  },
  {
    id: 'hedgeworth-clubhouse', name: 'Hedgeworth Clubhouse', category: 'prop', uses: ['place'],
    tags: ['clubhouse', 'club', 'house', 'tudor', 'timber', 'cream', 'render', 'clock', 'gable', 'awning', 'building', 'gta', 'golf', 'hedgeworth'], emoji: [],
    footprint: { r: 6.6, h: 6.2 },
    about: 'Gnome Theft Auto: the Hedgeworth Clubhouse. About 13 x 7 x 6 m, modelled at half size (the game scales it 2x). Cream walls, dark timber strips, a steep slate roof with three front gables, a clock in the main gable, a chimney, glazed ground floor, bay windows upstairs, a green awning. Front door on +z.',
    examine: [
      'A mock-Tudor clubhouse of cream render and dark timber, three gables at the front, and a clock in the middle one that is right twice a day.',
      'Saying: the clubhouse is older than its timber, which was painted on in the spring.',
      'Tip: the front door is for members. The side door is for staff, and the staff are there so the members have someone to shout at.',
      'Joke: the awning is green so that nobody mistakes the clubhouse for anything with a sense of humour.',
      'Upstairs a bay window stares out over the first tee. Peony\'s rooms have the best view and the worst draughts.',
    ],
    parts: [
      { s: 'box', d: [13.0, 3.4, 6.2], at: [0, 1.7, 0], c: 'wool' },                           // cream walls
      { s: 'box', d: [13.4, 0.2, 4.6], at: [0, 4.9, 1.75], rot: [40, 0, 0], c: 'slate' },       // roof, front slope
      { s: 'box', d: [13.4, 0.2, 4.6], at: [0, 4.9, -1.75], rot: [-40, 0, 0], c: 'slate' },     // roof, back slope
      { s: 'box', d: [3.0, 2.2, 0.4], at: [0, 4.2, 3.25], c: 'wool' },                          // main gable
      { s: 'cyl', d: [0.5, 0.5, 0.03], at: [0, 4.3, 3.47], rot: [90, 0, 0], c: 'white', seg: 12 }, // clock face
      { s: 'box', d: [2.4, 1.8, 0.4], at: [4.6, 4.0, 3.25], c: 'wool', mirror: true },         // side gables
      { s: 'box', d: [0.8, 2.8, 0.8], at: [4.6, 4.8, -1.5], c: 'stone' },                       // chimney
      { s: 'box', d: [0.95, 0.14, 0.95], at: [4.6, 6.27, -1.5], c: 'stone-dark' },              // chimney cap
      { s: 'box', d: [12.8, 0.18, 0.02], at: [0, 2.45, 3.11], c: 'wood-dark' },                 // timber beam, ground floor
      { s: 'box', d: [12.8, 0.18, 0.02], at: [0, 3.2, 3.11], c: 'wood-dark' },                  // timber beam, upstairs
      { s: 'box', d: [0.18, 3.4, 0.02], at: [1.5, 1.7, 3.11], c: 'wood-dark', mirror: true },  // timber posts
      { s: 'box', d: [0.18, 3.4, 0.02], at: [4.1, 1.7, 3.11], c: 'wood-dark', mirror: true },
      { s: 'box', d: [0.18, 3.4, 0.02], at: [6.3, 1.7, 3.11], c: 'wood-dark', mirror: true },
      { s: 'box', d: [1.6, 1.3, 0.02], at: [2.9, 1.05, 3.11], c: 'glass', mirror: true },       // ground floor glazing
      { s: 'box', d: [1.6, 1.3, 0.02], at: [5.0, 1.05, 3.11], c: 'glass', mirror: true },
      { s: 'box', d: [1.2, 1.4, 0.04], at: [0, 0.7, 3.11], c: 'wood-dark' },                   // double door
      { s: 'box', d: [3.2, 0.12, 1.2], at: [0, 2.3, 3.7], rot: [15, 0, 0], c: 'green' },        // green awning
      { s: 'box', d: [1.8, 1.1, 0.5], at: [3.6, 2.7, 3.36], c: 'wool', mirror: true },         // bay window
      { s: 'box', d: [1.4, 0.8, 0.02], at: [3.6, 2.7, 3.63], c: 'glass', mirror: true },       // bay glass
    ],
  },
  {
    id: 'pro-cottage', name: "Basil's Pro Cottage", category: 'prop', uses: ['place'],
    tags: ['cottage', 'cabin', 'house', 'pro', 'shop', 'whitewash', 'horseshoe', 'flowers', 'window', 'sign', 'gta', 'golf', 'hedgeworth'], emoji: [],
    footprint: { r: 3.0, h: 4.0 },
    about: 'Gnome Theft Auto: the Pro Cottage. About 5 x 4 x 4 m. Whitewashed walls, a green door front centre (+z), window boxes with red flowers, a crooked chimney, a lucky horseshoe over the door and a blank sign over the left window (the game writes PRO SHOP).',
    examine: [
      'A whitewashed cottage with a green front door, red flowers in its window boxes and a horseshoe nailed up over the door for luck.',
      'Saying: a horseshoe over the door keeps the luck in and the bad strokes out, or so the pro says while he is standing under it.',
      'Tip: the sign over the window is blank. It will say PRO SHOP once someone decides what a pro is.',
      'Joke: Basil is superstitious about everything except the horseshoe, which he says is merely a habit.',
      'The chimney leans a little further each spring, and Basil has been saying he will fix it since before it was crooked.',
    ],
    parts: [
      { s: 'box', d: [5.0, 2.4, 4.0], at: [0, 1.2, 0], c: 'chalk' },                           // whitewashed walls
      { s: 'box', d: [5.3, 0.16, 3.1], at: [0, 2.85, 1.15], rot: [35, 0, 0], c: 'slate' },      // roof, front slope
      { s: 'box', d: [5.3, 0.16, 3.1], at: [0, 2.85, -1.15], rot: [-35, 0, 0], c: 'slate' },    // roof, back slope
      { s: 'box', d: [0.9, 1.5, 0.05], at: [0, 0.75, 2.04], c: 'green' },                       // green door
      { s: 'box', d: [0.9, 0.8, 0.04], at: [1.5, 1.4, 2.04], c: 'glass', mirror: true },       // windows
      { s: 'box', d: [0.9, 0.18, 0.2], at: [1.5, 0.9, 2.12], c: 'wood-dark', mirror: true },   // window boxes
      { s: 'ball', d: [0.05], at: [1.7, 1.05, 2.12], c: 'red', seg: 6, mirror: true },         // red flowers
      { s: 'ball', d: [0.05], at: [1.3, 1.05, 2.12], c: 'red', seg: 6, mirror: true },
      { s: 'box', d: [1.6, 0.3, 0.06], at: [-1.5, 2.1, 2.04], c: 'parchment' },                  // blank sign
      { s: 'ring', d: [0.12, 0.025], at: [0, 1.7, 2.06], c: 'iron' },                             // horseshoe
      { s: 'box', d: [0.6, 1.8, 0.6], at: [1.6, 3.2, -0.8], rot: [0, 0, 8], c: 'stone' },         // crooked chimney
    ],
  },
  {
    id: 'groundskeeper-shed', name: "Thrift's Groundskeeper Shed", category: 'prop', uses: ['place'],
    tags: ['shed', 'hut', 'timber', 'hose', 'reel', 'butt', 'barrel', 'sign', 'mole', 'hole', 'groundskeeper', 'gta', 'golf', 'hedgeworth'], emoji: [],
    footprint: { r: 2.5, h: 2.6 },
    about: 'Gnome Theft Auto: the Groundskeeper Shed. About 4 x 3 x 3 m. Timber walls, a pent roof, a door on +z, a hose reel on the left wall, a water butt on the right, a blank sign over the door, and a small dark arched hole at the base of the back wall.',
    examine: [
      'A timber shed with a pent roof, a hose reel on one wall, a water butt on the other, and a blank sign above the door.',
      'Saying: a shed keeps the tools in and the groundskeeper out, and the groundskeeper prefers it that way.',
      'Tip: the tiny arched hole at the back is not a drain. Do not put your foot in it, and do not ask Thrift about it.',
      'Joke: the watering can lives in the shed, though nobody has ever seen it used on anything except the grass.',
      'Thrift talks to the grass through the shed window, and the grass, for once, seems to be listening.',
    ],
    parts: [
      { s: 'box', d: [4.0, 2.1, 3.0], at: [0, 1.05, 0], c: 'wood' },                              // timber walls
      { s: 'box', d: [4.3, 0.14, 3.3], at: [0, 2.2, 0], rot: [-12, 0, 0], c: 'slate' },           // pent roof
      { s: 'box', d: [1.0, 1.8, 0.04], at: [0, 0.9, 1.53], c: 'wood-dark' },                     // door
      { s: 'box', d: [1.2, 0.3, 0.04], at: [0, 2.0, 1.53], c: 'parchment' },                     // blank sign
      { s: 'cyl', d: [0.25, 0.25, 0.2], at: [-2.12, 1.2, 0.5], rot: [0, 0, 90], c: 'iron-dark' }, // hose reel drum
      { s: 'ring', d: [0.2, 0.03], at: [-2.27, 1.2, 0.5], rot: [0, 90, 0], c: 'green' },         // coiled hose
      { s: 'cyl', d: [0.35, 0.35, 1.0], at: [2.4, 0.5, 0.8], c: 'wood-dark' },                   // water butt
      { s: 'ball', d: [0.2], at: [0.5, 0.16, -1.53], scale: [1, 0.8, 0.1], c: 'black', seg: 6 }, // mole hole
    ],
  },
  {
    id: 'cart-shelter', name: 'Cart Shelter', category: 'prop', uses: ['place'],
    tags: ['cart', 'carts', 'shelter', 'shed', 'roof', 'corrugated', 'charger', 'charging', 'cable', 'golf', 'gta', 'hedgeworth'], emoji: [],
    footprint: { r: 3.1, h: 2.7 },
    about: 'Gnome Theft Auto: the Cart Shelter. About 6 x 4 x 2.7 m, open on all sides. Six posts, a shallow green ridged roof of slats at alternating heights, and a charging point with a coiled cable on a back post.',
    examine: [
      'An open shelter on six posts with a shallow green roof of ridged sheets, and a charging point on the back post with a coiled cable.',
      'Saying: a cart with no roof is a wish, and a cart with a roof is a plan, and the carts here have both.',
      'Tip: the cable is coiled for a reason, and the reason is that the last person who uncoiled it is still looking for the end.',
      'Joke: the carts are silent, which the rival club says is a sign of quality, and the carts agree they have nothing to say.',
      'The roof sheets are all slightly different heights, as if the shelter was built by several carts arguing about it.',
    ],
    parts: [
      { s: 'box', d: [0.12, 2.4, 0.12], at: [2.8, 1.2, 1.8], c: 'wood-dark', mirror: true },    // posts
      { s: 'box', d: [0.12, 2.4, 0.12], at: [2.8, 1.2, -1.8], c: 'wood-dark', mirror: true },
      { s: 'box', d: [0.12, 2.4, 0.12], at: [0, 1.2, 1.8], c: 'wood-dark' },
      { s: 'box', d: [0.12, 2.4, 0.12], at: [0, 1.2, -1.8], c: 'wood-dark' },
      { s: 'box', d: [6.2, 0.08, 0.46], at: [0, 2.58, -1.75], c: 'green' },                    // ridged roof sheets
      { s: 'box', d: [6.2, 0.08, 0.46], at: [0, 2.68, -1.25], c: 'green' },
      { s: 'box', d: [6.2, 0.08, 0.46], at: [0, 2.58, -0.75], c: 'green' },
      { s: 'box', d: [6.2, 0.08, 0.46], at: [0, 2.68, -0.25], c: 'green' },
      { s: 'box', d: [6.2, 0.08, 0.46], at: [0, 2.58, 0.25], c: 'green' },
      { s: 'box', d: [6.2, 0.08, 0.46], at: [0, 2.68, 0.75], c: 'green' },
      { s: 'box', d: [6.2, 0.08, 0.46], at: [0, 2.58, 1.25], c: 'green' },
      { s: 'box', d: [6.2, 0.08, 0.46], at: [0, 2.68, 1.75], c: 'green' },
      { s: 'box', d: [0.25, 0.35, 0.12], at: [2.8, 1.5, -1.675], c: 'black' },                 // charging point
      { s: 'ring', d: [0.08, 0.015], at: [2.8, 1.1, -1.58], c: 'black' },                       // coiled cable
    ],
  },
];
