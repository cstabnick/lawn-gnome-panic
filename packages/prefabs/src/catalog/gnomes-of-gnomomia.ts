// New prefabs for gnomes-of-gnomomia. One owner (the gnomes-of-gnomomia adoption issue): add entries here and nowhere else.
import type { PrefabDef } from '../types';

export const GNOMES_OF_GNOMOMIA: readonly PrefabDef[] = [
  {
    id: 'gnome-valve', name: 'Valve', category: 'prop', uses: ['place'],
    tags: ['valve', 'pipe', 'wheel', 'tap', 'machine', 'water'], emoji: [],
    tint: 0x7a7f86,
    about: 'A standpipe with a red-wheeled valve head on top: the tap for a buried water pipe.',
    examine: [
      'A grey standpipe with a red wheel on top, bolted to the ground and sweating at the joints.',
      'Gnome saying: a valve is only ever stuck until someone turns it the wrong way.',
      'Tip: turn it slowly. Water that has been held back for a century does not like to be rushed.',
      'Joke: the red wheel is painted so the careless can find it before the water does.',
    ],
    parts: [
      { s: 'cyl', d: [0.12, 0.12, 1.2], at: [0, 0.6, 0], c: 'tint', seg: 8 },
      { s: 'cyl', d: [0.1, 0.1, 0.6], rot: [0, 0, 90], at: [0.3, 0.9, 0], c: 'tint', seg: 8 },
      { s: 'ring', d: [0.26, 0.05], at: [0, 1.35, 0.14], c: 0xc62828, seg: 12 },
      { s: 'cyl', d: [0.06, 0.06, 0.08], rot: [90, 0, 0], at: [0, 1.35, 0.14], c: 0xc62828, seg: 6 },
    ],
  },
  {
    id: 'wooden-cart', name: 'Hand Cart', category: 'prop', uses: ['place'],
    tags: ['cart', 'wagon', 'wood', 'wheels', 'barrow', 'load'], emoji: [],
    tint: 0x8b5a2b,
    about: 'A wooden cart on four iron-rimmed wheels, its box stained and split along one side.',
    examine: [
      'A wooden cart with a split side board and four wheels, each one rimmed in black iron.',
      'It was pulled by a pony once. The pony has since gone off to join the Charters.',
      'Tip: a cart on a slope wants a second gnome on the brake, or it wants a new slope.',
      'Joke: the load is always heavier on the way back, and the cart never gets lighter.',
    ],
    parts: [
      { s: 'box', d: [0.9, 0.4, 0.6], at: [0, 0.5, 0], c: 'tint' },
      { s: 'cyl', d: [0.15, 0.15, 0.08], rot: [90, 0, 0], at: [-0.38, 0.15, -0.34], c: 0x2b2b2b, seg: 10 },
      { s: 'cyl', d: [0.15, 0.15, 0.08], rot: [90, 0, 0], at: [0.38, 0.15, -0.34], c: 0x2b2b2b, seg: 10 },
      { s: 'cyl', d: [0.15, 0.15, 0.08], rot: [90, 0, 0], at: [-0.38, 0.15, 0.34], c: 0x2b2b2b, seg: 10 },
      { s: 'cyl', d: [0.15, 0.15, 0.08], rot: [90, 0, 0], at: [0.38, 0.15, 0.34], c: 0x2b2b2b, seg: 10 },
    ],
  },
  {
    id: 'standing-stone', name: 'Standing Stone', category: 'prop', uses: ['place'],
    tags: ['stone', 'standing', 'menhir', 'barrow', 'monument', 'rock'], emoji: [],
    tint: 0x8d9097,
    about: 'A rough upright stone, a little wider at the foot, cut by no tool anyone can name.',
    examine: [
      'A rough grey stone stood on its end, a little fatter at the foot than at the top.',
      'Old saying: the stones were put up by the first gnomes, who would not say why.',
      'Tip: lean on it only if you are sure of your footing. The ground round it is soft.',
      'Joke: every stone in a ring is said to be a gnome who would not move out of the way.',
    ],
    parts: [
      { s: 'cyl', d: [0.3, 0.36, 1.3], at: [0, 0.65, 0], c: 'tint', seg: 6 },
    ],
  },
  {
    id: 'water-trough', name: 'Water Trough', category: 'prop', uses: ['place'],
    tags: ['trough', 'water', 'stone', 'drink', 'farm', 'animal'], emoji: [],
    tint: 0x5e4026,
    about: 'A long wooden trough with a skin of still water on top, for the beasts to drink from.',
    examine: [
      'A long wooden trough, its water still and green at the edges, with a skin of pollen on top.',
      'Gnome saying: the trough was made for the cattle, and the cattle have all gone to the Keep.',
      'Tip: the water is cold and clean at the bottom. The top is for ducks and the foolish.',
      'Joke: somebody once tried to milk the trough. The aphids were very offended.',
    ],
    parts: [
      { s: 'box', d: [1.6, 0.4, 0.5], at: [0, 0.2, 0], c: 'tint' },
      { s: 'box', d: [1.5, 0.05, 0.4], at: [0, 0.4, 0], c: 0x3a6f8f },
    ],
  },
  {
    id: 'stone-plaque', name: 'Stone Plaque', category: 'prop', uses: ['place', 'read'],
    tags: ['plaque', 'stone', 'memorial', 'sign', 'inscription', 'pedestal'], emoji: [],
    tint: 0x8d9097,
    about: 'A stone plaque on a low plinth, a dark panel on its face for the words that were cut into it.',
    examine: [
      'A grey slab on a low stone base, with a darker panel on its face where the words are cut.',
      'The words are worn so smooth that only the first line is still a line and not a smudge.',
      'Tip: read it out loud. The old letters are easier to hear than to see.',
      'Joke: a plaque is the only thing in the garden that has never been known to argue back.',
    ],
    parts: [
      { s: 'box', d: [0.9, 0.2, 0.4], at: [0, 0.1, 0], c: 0x7d828a },
      { s: 'box', d: [0.7, 0.9, 0.12], at: [0, 0.65, 0], c: 'tint' },
      { s: 'box', d: [0.5, 0.6, 0.02], at: [0, 0.65, 0.07], c: 0x4a4f56 },
    ],
  },
  {
    id: 'book-pedestal', name: 'Reading Pedestal', category: 'prop', uses: ['place', 'read'],
    tags: ['book', 'pedestal', 'lectern', 'read', 'record', 'stand'], emoji: [],
    tint: 0x6b4a2b,
    about: 'A waist-high stand with an open book laid across its top, its pages turned to the light.',
    examine: [
      'A waist-high pedestal with an open book laid across it, its pages curling in the damp.',
      'The book is chained to the pedestal, which is the only reason anybody has finished reading it.',
      'Tip: the pages are thin and the ink is thinner. Read them in the light, not in the shade.',
      'Joke: the last reader asked for a bigger book. The Charters sent a smaller pedestal.',
    ],
    parts: [
      { s: 'cyl', d: [0.06, 0.08, 0.9], at: [0, 0.45, 0], c: 'tint', seg: 6 },
      { s: 'box', d: [0.5, 0.06, 0.4], rot: [-20, 0, 0], at: [0, 0.95, 0], c: 'tint' },
      { s: 'box', d: [0.22, 0.03, 0.3], rot: [-20, 0, 0], at: [-0.12, 1.0, 0], c: 0xf2e8c9 },
      { s: 'box', d: [0.22, 0.03, 0.3], rot: [-20, 0, 0], at: [0.12, 1.0, 0], c: 0xf2e8c9 },
    ],
  },
  {
    id: 'wooden-post', name: 'Wooden Post', category: 'prop', uses: ['place'],
    tags: ['post', 'wood', 'fence', 'marker', 'cross', 'stake'], emoji: [],
    tint: 0x7a5230,
    about: 'A plain wooden post with a crossbar at the top, a marker for a gate, a boundary or a lost thing.',
    examine: [
      'A plain wooden post with a crossbar nailed on top, grey with weather and very upright.',
      'Gnome saying: a post is only a post until someone hangs a name on it.',
      'Tip: a post makes a fine lean for a tired gnome. It makes a worse one for a tired goat.',
      'Joke: every crossbar in the garden is in the wrong place, and every gnome says so.',
    ],
    parts: [
      { s: 'cyl', d: [0.1, 0.12, 1.5], at: [0, 0.75, 0], c: 'tint', seg: 6 },
      { s: 'box', d: [0.7, 0.12, 0.12], at: [0, 1.2, 0], c: 'tint' },
    ],
  },
  {
    id: 'garden-lump', name: 'Garden Lump', category: 'prop', uses: ['place'],
    tags: ['lump', 'mound', 'heap', 'clutter', 'garden', 'mystery'], emoji: [],
    tint: 0xd0c080,
    about: 'A plain round lump on the ground, the stand-in for anything in the garden that has not got a proper shape yet.',
    examine: [
      'A round lump of something, sitting on the grass with a faint smell of leaves and old tea.',
      'Nobody has ever agreed what it is. Several gnomes have agreed that it should be moved.',
      'Tip: a lump is always heavier than it looks. Test it with a stick before you lift it.',
      'Joke: the lump has been there since before the Charters, and so far it has outlasted them.',
    ],
    parts: [
      { s: 'ball', d: [0.4], at: [0, 0.4, 0], c: 'tint', seg: 10 },
    ],
  },
];
