// Gnome Theft Auto: achievement gear for the Tessie side quest (Wild World Epic 7). Also holds the Snigms rewards:
// the Friendship Knot ("Neighbourly"), the Straw Boater ("Out on the Town") and the Garden Bonnet ("Best of Neighbours").
import type { PrefabDef } from '../types';

export const GTA_TESSIE_GEAR: readonly PrefabDef[] = [
  {
    id: 'turtle-shell-pack', name: 'Turtle-Shell Pack', category: 'armor', uses: ['wear-back'],
    tags: ['turtle', 'shell', 'pack', 'back', 'moss', 'tessie', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Turtle-Shell Pack. A domed olive turtle shell worn like a backpack, with darker scute plates, moss patches, a tiny lily pad and two leather shoulder straps.',
    examine: [
      'A domed olive shell with darker scute plates, a few stubborn patches of moss, and a lily pad stuck on top like a tiny flag.',
      "A cast-off shell of Tessie's, or possibly a cousin's; nobody on the loch shore is quite sure which.",
      'Only the few who know about the loch wear it, and they never say much about it beyond a polite nod.',
      'Tip: keep the straps short, or the shell knocks against your ears every time you duck under a fence.',
      'Joke: the only backpack in Turfton that has never been late for a meeting, mostly because it is slower than the meeting.',
    ],
    parts: [
      { s: 'ball', d: [0.12], scale: [1, 1.25, 0.5], at: [0, 0.15, -0.1], c: 'moss', seg: 12 },            // domed shell (min.y = 0)
      { s: 'ball', d: [0.05], scale: [1.2, 0.4, 1.3], at: [0, 0.292, -0.1], c: 'bark', seg: 8 },          // centre scute plate
      { s: 'ball', d: [0.035], scale: [1, 1, 0.6], at: [0.085, 0.2, -0.1], c: 'bark', seg: 8, mirror: true }, // side scutes
      { s: 'ball', d: [0.03], scale: [1.3, 0.5, 1], at: [-0.06, 0.2, -0.15], c: 'leaf-dark', seg: 8 },    // moss patch
      { s: 'cyl', d: [0.035, 0.035, 0.006], at: [0.05, 0.285, -0.08], c: 'leaf', seg: 10 },              // lily pad
      { s: 'box', d: [0.03, 0.26, 0.025], at: [0.085, 0.15, -0.02], c: 'leather-dark', mirror: true },   // shoulder straps
    ],
  },
  {
    id: 'loch-tam', name: 'Loch Moss Tam', category: 'armor', uses: ['wear-head'],
    tags: ['tam', 'bonnet', 'hat', 'loch', 'moss', 'head', 'reward', 'gta'], emoji: [],
    tint: 0x2f5a3a,
    trim: 0x8e2b2b,
    about: 'Gnome Theft Auto: the Loch Moss Tam. A flat woollen highland tam with a tartan-ish band, crossed stripes, a bobble on top and a sprig of heather at the side. Tint sets the wool, trim sets the tartan.',
    examine: [
      'A flat woollen tam in deep loch green, banded in claret and crossed with stripes, with a bobble on top and heather tucked at the side.',
      'Loch Moss saying: whoever wears the tam sees the ripple first and admits it last.',
      'Tip: pull it low over your ears on the shore, where the loch wind is sharper than any forecast from Turfton.',
      'Joke: the bobble has been mistaken for a monster sighting twice this year, and both times it was only the bobble.',
      'The inside band is stitched with the name Driftwood, though the thread has gone soft from years of loch air.',
    ],
    parts: [
      { s: 'ball', d: [0.16], scale: [1, 0.3, 1], at: [0, 0.048, 0], c: 'tint', seg: 12 },              // flat wool crown (min.y = 0)
      { s: 'cyl', d: [0.162, 0.162, 0.02], at: [0, 0.03, 0], c: 'trim', seg: 12 },                     // claret band
      { s: 'box', d: [0.02, 0.016, 0.3], at: [0, 0.094, 0], c: 'trim' },                              // tartan stripe, front to back
      { s: 'box', d: [0.3, 0.016, 0.02], at: [0, 0.1, 0], c: 'trim' },                                // tartan stripe, side to side
      { s: 'ball', d: [0.035], at: [0, 0.125, 0], c: 'cloth', seg: 8 },                               // bobble
      { s: 'cyl', d: [0.006, 0.006, 0.05], rot: [0, 0, 25], at: [-0.115, 0.045, 0.1], c: 'leaf-dark', seg: 6 }, // heather stem
      { s: 'ball', d: [0.02], at: [-0.12, 0.07, 0.11], c: 'purple', seg: 6 },                         // heather flower
      { s: 'ball', d: [0.018], at: [-0.13, 0.085, 0.13], c: 'purple', seg: 6 },                       // heather flower
    ],
  },
  {
    id: 'loch-binoculars', wear: { at: [0, -0.07, 0.05] }, name: 'Loch Binoculars', category: 'trinket', uses: ['wear-neck'],
    tags: ['binoculars', 'spyglass', 'neck', 'strap', 'loch', 'lookout', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Loch Binoculars. Two short black barrels joined by a bridge, with eyecups and a strap loop, hanging on a neck strap at the chest, clear of the head and face.',
    examine: [
      'A pair of short black binoculars on a little bridge, with leather eyecups and a loop at the top for the strap.',
      'Loch Moss saying: a true lookout sees the ripple before the ripple sees him, which is why nobody ever sees the lookout.',
      'Tip: rest the eyecups on your brow and hold very still for a count of ten, or the loch goes blurry at the edges.',
      'Joke: the lenses are spotless, but the view is mostly of an HOA dredger, which is not what anybody hoped to see.',
      'A crooked sticker on the strap reads Property of Driftwood, though nobody recalls signing anything out.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.012], at: [0, 0.012, -0.05], rot: [90, 0, 0], c: 'leather-dark', seg: 12 }, // neck strap (min.y = 0)
      { s: 'cyl', d: [0.03, 0.03, 0.1], rot: [90, 0, 0], at: [-0.034, 0.04, 0.08], c: 'black', seg: 10, mirror: true }, // barrels
      { s: 'box', d: [0.072, 0.024, 0.04], at: [0, 0.05, 0.08], c: 'iron-dark' },                    // bridge
      { s: 'cyl', d: [0.012, 0.012, 0.02], rot: [90, 0, 0], at: [-0.034, 0.04, 0.14], c: 'leather-dark', seg: 8, mirror: true }, // eyecups
      { s: 'ring', d: [0.018, 0.005], at: [0, 0.07, 0.08], c: 'leather', seg: 8 },                     // strap loop
    ],
  },
  {
    id: 'friendship-knot', name: 'Friendship Knot', category: 'trinket', uses: ['wear-neck'],
    tags: ['friendship', 'knot', 'cord', 'neck', 'neighbour', 'reward', 'snigms'], emoji: [],
    about: "Snigms' Friendship Knot, the Neighbourly reward. A braided cord loop tied in a fat knot at the front with one glazed clay bead and a small tassel, worn at the neck.",
    examine: [
      'A braided cord loop tied in a fat knot at the front, with one glazed bead slipped on as a sort of promise.',
      'Neighbourly saying: a fence is only a fence until the gnome next door brings round a pie and a knot like this.',
      'Tip: tie it a little looser than you think, so the neighbour can slip it off to borrow your rake.',
      'Joke: the knot holds better than any promise made across a hedge, which is not saying a great deal.',
      'The tassel was left loose on purpose, so a neighbour can give it a tug whenever they fancy a chat.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.01], at: [0, 0.01, -0.05], rot: [90, 0, 0], c: 'leather', seg: 12 },      // cord loop (min.y = 0)
      { s: 'ring', d: [0.2, 0.008], at: [0, 0.026, -0.05], rot: [90, 0, 0], c: 'wool', seg: 12 },      // braid's second strand
      { s: 'ball', d: [0.045], scale: [1, 0.9, 1], at: [0, 0.045, 0.155], c: 'leather-dark', seg: 8 },  // fat knot
      { s: 'ball', d: [0.024], at: [-0.03, 0.04, 0.19], c: 'glaze-blue', seg: 8 },                   // glazed clay bead
      { s: 'cyl', d: [0.012, 0.006, 0.04], at: [0.03, 0.02, 0.19], c: 'burlap', seg: 6 },            // tassel
    ],
  },
  {
    id: 'straw-boater', name: 'Straw Boater', category: 'armor', uses: ['wear-head'],
    tags: ['straw', 'boater', 'hat', 'town', 'head', 'reward', 'snigms'], emoji: [],
    tint: 'blue',
    about: 'Gnome Theft Auto: the Straw Boater. A flat-topped woven straw hat with a ribbon band and a small bow at the front. Tint sets the ribbon.',
    examine: [
      'A flat-topped boater woven from golden straw, with a ribbon band and a little bow tied neatly at the front.',
      'Snigms saying: a neighbour in a boater is a neighbour who means to stay for tea.',
      "Tip: tilt the brim a finger's width forward on a sunny day, so the bow does not dazzle the baker across the square.",
      'Joke: bought for a single day trip to town, and worn on the same head ever since, which makes it a very long day.',
      'A paper label inside still reads Second-hand, but somebody crossed it out and wrote Neighbour in pencil.',
    ],
    parts: [
      { s: 'cyl', d: [0.15, 0.15, 0.012], at: [0, 0.006, 0], c: 'straw', seg: 12 },                  // flat brim (min.y = 0)
      { s: 'cyl', d: [0.09, 0.095, 0.07], at: [0, 0.047, 0], c: 'straw', seg: 12 },                  // flat-topped crown
      { s: 'cyl', d: [0.096, 0.096, 0.018], at: [0, 0.025, 0], c: 'tint', seg: 12 },                // ribbon band
      { s: 'box', d: [0.024, 0.02, 0.012], at: [0, 0.035, 0.1], c: 'tint' },                        // bow knot
      { s: 'box', d: [0.012, 0.03, 0.01], rot: [0, 0, -20], at: [0.012, 0.015, 0.1], c: 'tint' },   // bow tail
    ],
  },
  {
    id: 'garden-bonnet', name: 'Garden Bonnet', category: 'armor', uses: ['wear-head'],
    tags: ['bonnet', 'garden', 'hat', 'flower', 'head', 'reward', 'snigms'], emoji: [],
    tint: 'petal',
    trim: 'ruby',
    about: 'Gnome Theft Auto: the Garden Bonnet. A soft cloth bonnet with a wide front brim, a ribbon tie under the chin and two small flowers on the crown. Tint sets the cloth, trim sets the ribbon.',
    examine: [
      'A soft petal-pink cloth bonnet with a wide front brim, a ribbon tied under the chin and two little flowers on the crown.',
      'Snigms saying: good neighbours share a bonnet for the sun, and a spade for the hedge.',
      'Tip: tie the ribbon in a bow rather than a knot, so the neighbour can loosen it while leaning over the fence.',
      'Joke: the flowers are convincing enough to draw bees, which is why two gardens have asked for the bonnet to be kept indoors.',
      'A tiny stitched note inside reads Pass it on when you are done, in a tidy hand that is plainly a neighbour\'s.',
    ],
    parts: [
      { s: 'ball', d: [0.13], scale: [1, 0.85, 1.1], at: [0, 0.1105, -0.02], c: 'tint', seg: 12 },   // soft crown (min.y = 0)
      { s: 'ball', d: [0.16], scale: [1, 0.05, 0.85], at: [0, 0.02, 0.03], c: 'tint', seg: 12 },    // wide front brim
      { s: 'box', d: [0.022, 0.08, 0.01], at: [0.05, 0.06, 0.14], c: 'trim', mirror: true },        // chin ribbon tails
      { s: 'ball', d: [0.03], at: [-0.09, 0.19, 0.06], c: 'yellow', seg: 6 },                       // flower
      { s: 'ball', d: [0.028], at: [0.08, 0.2, 0.07], c: 'pink', seg: 6 },                          // flower
    ],
  },
  {
    id: 'chore-basket', name: 'Chore Basket', category: 'armor', uses: ['wear-back'],
    wear: { at: [0, -0.04, 0] },
    tags: ['basket', 'wicker', 'chore', 'pack', 'back', 'reward', 'snigms'], emoji: [],
    about: "Snigms: the Chore Basket, a wicker basket worn on the back with leather straps, a folded cloth and a wooden spoon poking out. Snigms' Fine, Whatever reward.",
    examine: [
      'A deep wicker basket on two leather straps, with a folded cloth on top and the handle of a wooden spoon sticking out.',
      'Neighbour saying: a full basket on the back is a chore half done, and an empty one is a chore not yet started.',
      'Tip: put the heavy things at the bottom, or the basket will lean you backwards on every hill.',
      'Joke: it has been asked to do the washing up so often that it now flinches at the sight of a spoon.',
      'One strap has been mended with a different leather, and someone has scratched a small tick mark beside the knot.',
    ],
    parts: [
      { s: 'cyl', d: [0.12, 0.1, 0.26], at: [0, 0.13, -0.12], c: 'straw', seg: 8 },                 // wicker basket body (min.y = 0)
      { s: 'ring', d: [0.115, 0.012, 360], rot: [90, 0, 0], at: [0, 0.26, -0.12], c: 'wood-light', seg: 10 }, // rim
      { s: 'box', d: [0.2, 0.03, 0.16], at: [0, 0.27, -0.12], c: 'cloth' },                          // folded cloth on top
      { s: 'box', d: [0.02, 0.18, 0.02], rot: [12, 0, 0], at: [0.06, 0.3, -0.16], c: 'wood' },        // spoon handle
      { s: 'box', d: [0.03, 0.24, 0.02], at: [0.06, 0.14, -0.01], c: 'leather', mirror: true },       // shoulder straps
    ],
  },
];
