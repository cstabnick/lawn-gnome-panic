// Gnome Theft Auto: Pardonlin, the Beetle Market and the Opera forecourt (stall canopies, goods, ticket kiosk, scooter) (FX09, docs/roadmaps/gta-batch-3/review/fix/FX09/).
import type { Part, PrefabDef } from '../types';

// ---- The canopied stall: eight roof stripes (tint / white), a scalloped valance and four poles. -------------------
const SLATS = 8;
const SLAT_W = 1.7 / SLATS;
const ROOF_TILT = 11; // degrees: the front edge hangs lower than the back
const slatX = (k: number): number => -0.85 + SLAT_W / 2 + k * SLAT_W;
const stripe = (k: number): 'tint' | 'white' => (k % 2 === 0 ? 'tint' : 'white');
const canopy = (): Part[] => Array.from({ length: SLATS }, (_, k): Part => ({
  s: 'box', d: [SLAT_W, 0.03, 1.57], at: [slatX(k), 2.3, -0.01], rot: [ROOF_TILT, 0, 0], c: stripe(k),
}));
const valanceStrips = (): Part[] => Array.from({ length: SLATS }, (_, k): Part => ({
  s: 'box', d: [SLAT_W, 0.15, 0.02], at: [slatX(k), 2.07, 0.77], c: stripe(k),
}));
const valanceScallops = (): Part[] => Array.from({ length: SLATS }, (_, k): Part => ({
  s: 'ball', d: [SLAT_W / 2], at: [slatX(k), 2.0, 0.77], scale: [1, 0.85, 0.12], c: stripe(k), seg: 6,
}));

// ---- Beetle jars: three jars of three sizes with a beetle or two in each, and a tray of pinned ones. ----------------
const JARS: readonly (readonly [number, number, readonly (readonly [number, number, number | string])[]])[] = [
  [-0.17, 0.22, [[0.0, 0.05, 'chitin'], [0.01, 0.13, 'emerald']]],
  [0.0, 0.17, [[0.0, 0.05, 'sapphire'], [0.0, 0.11, 'chitin']]],
  [0.16, 0.13, [[0.0, 0.05, 'ruby']]],
];
const jarParts = (): Part[] => JARS.flatMap(([x, h, bugs]): Part[] => [
  { s: 'cyl', d: [0.06, 0.06, h], at: [x, h / 2, -0.05], c: 'glass', alpha: 0.4, seg: 8 },
  { s: 'cyl', d: [0.066, 0.066, 0.025], at: [x, h + 0.0125, -0.05], c: 'brass', seg: 8 },
  ...bugs.map(([bx, by, col]): Part => ({
    s: 'ball', d: [0.028], at: [x + bx, by, -0.05], scale: [1, 0.7, 1.4], c: col as Part['c'], seg: 6,
  })),
]);
const TRAY_BEETLES: readonly (readonly [number, number, string])[] = [
  [-0.12, 0.05, 'sapphire'], [0, 0.05, 'emerald'], [0.12, 0.05, 'ruby'],
  [-0.06, 0.15, 'chitin'], [0.06, 0.15, 'sapphire'], [0.18, 0.12, 'emerald'],
];
const trayParts = (): Part[] => TRAY_BEETLES.map(([x, z, col]): Part => ({
  s: 'ball', d: [0.026], at: [x, 0.045, z], scale: [0.9, 0.55, 1.4], c: col as Part['c'], seg: 6,
}));

// ---- Bric-a-brac: a lamp, a clock, a teapot, a vase, a doll's chair and a pair of candlesticks. ----------------------
const CHAIR_LEGS: readonly (readonly [number, number])[] = [[-0.06, -0.05], [0.06, -0.05], [-0.06, 0.05], [0.06, 0.05]];
const dollChair = (): Part[] => [
  ...CHAIR_LEGS.map(([x, z]): Part => ({ s: 'box', d: [0.016, 0.12, 0.016], at: [0.38 + x, 0.06, 0.08 + z], c: 'wood-dark' })),
  { s: 'box', d: [0.16, 0.02, 0.14], at: [0.38, 0.13, 0.08], c: 'red' },
  { s: 'box', d: [0.16, 0.16, 0.02], at: [0.38, 0.22, 0.01], c: 'wood-dark' },
];

// ---- Books: two flat stacks and a leaning row. -------------------------------------------------------------------------
const BOOK_ROW: readonly (readonly [number, number, string])[] = [
  [0.05, 0.22, 'blue'], [0.09, 0.26, 'red'], [0.13, 0.2, 'brass'], [0.17, 0.25, 'leather'], [0.21, 0.22, 'green'],
  [0.25, 0.27, 'purple'], [0.29, 0.21, 'black'],
];
const bookRow = (): Part[] => BOOK_ROW.map(([x, h, col]): Part => ({
  s: 'box', d: [0.035, h, 0.17], at: [x, h / 2, -0.08], rot: [0, 0, col === 'black' ? 12 : 0], c: col as Part['c'],
}));

// ---- Records: sleeves standing in a crate, leaning on the back. --------------------------------------------------------
const SLEEVES: readonly (readonly [number, string])[] = [
  [-0.14, 'red'], [-0.1, 'yellow'], [-0.06, 'blue'], [-0.02, 'cloth'], [0.02, 'green'], [0.06, 'orange'], [0.1, 'purple'], [0.14, 'pink'],
];
const sleeves = (): Part[] => SLEEVES.map(([x, col]): Part => ({
  s: 'box', d: [0.012, 0.29, 0.29], at: [x, 0.25, 0], rot: [0, 0, col === 'blue' ? 8 : 0], c: col as Part['c'],
}));

// ---- Prints: a six-picture rack. ----------------------------------------------------------------------------------------
const PRINTS: readonly (readonly [number, number, number | string, number])[] = [
  [-0.38, 1.05, 0x3a6bff, 0], [0, 1.05, 'ruby', 3], [0.38, 1.05, 'leaf', 0],
  [-0.38, 0.62, 'yellow', 0], [0, 0.62, 'amethyst', -3], [0.38, 0.62, 'water', 0],
];
const printParts = (): Part[] => PRINTS.flatMap(([x, y, col, tilt]): Part[] => [
  { s: 'box', d: [0.33, 0.37, 0.02], at: [x, y, 0.045], rot: [0, 0, tilt], c: 'brass' },
  { s: 'box', d: [0.27, 0.31, 0.02], at: [x, y, 0.058], rot: [0, 0, tilt], c: col as Part['c'] },
]);

// ---- Hats: five on pegs up a stand. ---------------------------------------------------------------------------------------
const hatStand = (): Part[] => [
  // top hat
  { s: 'cyl', d: [0.12, 0.12, 0.015], at: [0, 1.41, 0], c: 'black', seg: 10 },
  { s: 'cyl', d: [0.075, 0.08, 0.17], at: [0, 1.5, 0], c: 'black', seg: 10 },
  { s: 'cyl', d: [0.082, 0.082, 0.025], at: [0, 1.44, 0], c: 'red', seg: 10 },
  // beret, on a peg to the left
  { s: 'ball', d: [0.13], at: [-0.2, 1.17, 0.02], scale: [1, 0.35, 1], c: 'blue', seg: 8 },
  // bowler, on a peg to the right
  { s: 'cyl', d: [0.12, 0.12, 0.014], at: [0.2, 1.1, 0.0], c: 'wood-dark', seg: 10 },
  { s: 'ball', d: [0.09], at: [0.2, 1.14, 0.0], scale: [1, 0.9, 1], c: 'wood-dark', seg: 8 },
  // fez
  { s: 'cyl', d: [0.065, 0.085, 0.11], at: [-0.19, 0.83, -0.02], c: 'red', seg: 8 },
  { s: 'cyl', d: [0.01, 0.01, 0.07], at: [-0.19, 0.93, -0.02], rot: [0, 0, 25], c: 'brass', seg: 5 },
  // flat cap
  { s: 'ball', d: [0.11], at: [0.19, 0.82, 0.0], scale: [1, 0.3, 1], c: 'slate', seg: 8 },
  { s: 'box', d: [0.12, 0.012, 0.07], at: [0.19, 0.8, 0.09], c: 'slate' },
];

// ---- Bunting: a sagging string of eleven points with a pennant hanging at the middle of each of its ten spans. ------
const BUNT_X = Array.from({ length: 11 }, (_, k) => -1.45 + 0.29 * k);
const buntY = (x: number): number => 0.3 + 0.15 * (x / 1.45) ** 2;
const BUNT_COLOURS = ['red', 'yellow', 'blue', 'white', 'green', 'orange', 'pink', 'yellow', 'blue', 'red'] as const;
const buntingRope = (): Part[] => BUNT_X.slice(1).map((x1, i): Part => {
  const x0 = BUNT_X[i];
  const dx = x1 - x0, dy = buntY(x1) - buntY(x0);
  return { s: 'box', d: [Math.hypot(dx, dy), 0.024, 0.024], at: [(x0 + x1) / 2, (buntY(x0) + buntY(x1)) / 2, 0], rot: [0, 0, (Math.atan2(dy, dx) * 180) / Math.PI], c: 'wood-dark' };
});
const buntingFlags = (): Part[] => BUNT_X.slice(1).map((x1, i): Part => {
  const xm = (BUNT_X[i] + x1) / 2;
  const ym = (buntY(BUNT_X[i]) + buntY(x1)) / 2;
  return { s: 'cone', d: [0.14, 0.3], at: [xm, ym - 0.15, 0], rot: [180, 0, 0], scale: [1, 1, 0.12], c: i % 3 === 0 ? 'tint' : BUNT_COLOURS[i], seg: 3 };
});

export const GTA_PARDONLIN_MARKET: readonly PrefabDef[] = [
  {
    id: 'pl-bunting', name: 'Market Bunting', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'bunting', 'flags', 'pennants', 'string', 'festive', 'market', 'party'], emoji: [],
    tint: 'red',
    about: 'Gnome Theft Auto: a 2.9 m string of ten paper pennants on a sagging rope, lying along x. Rope ends sit 0.45 m above the origin (times scale); scale it to span the gap. Tint = every third pennant.',
    examine: [
      'A string of little triangular flags in cheerful colours, hung between two things that were not consulted.',
      'Saying: "Bunting means a party, or an inspection, and the flags look the same either way."',
      'Tip: duck under the sag, because the string is stronger than it looks and the pennants have long memories.',
      'Joke: the flags were hung for a festival that was cancelled, and they have been celebrating its absence ever since.',
      'Each pennant has a small stitched initial in one corner, and none of the initials match any known stallholder.',
    ],
    parts: [...buntingRope(), ...buntingFlags()],
  },
  {
    id: 'pl-stall-canopy', name: 'Canopied Market Stall', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'market', 'stall', 'canopy', 'awning', 'striped', 'valance', 'counter'], emoji: [],
    tint: 'red', trim: 'wool',
    about: 'Gnome Theft Auto: the Beetle Market stall, 1.7 m wide, 2.4 m tall. Counter 0.85 high with room behind it for the stallholder, striped sloping canopy with a scalloped valance on four poles. Tint = the stripes. Front is +z. No collider.',
    examine: [
      'A wooden counter under a sloping canopy in two alternating colours, with a scalloped edge that sways whenever anyone mentions a price.',
      'Saying: "A good canopy keeps off the sun, the rain and the customers who only came to look."',
      'Tip: stand under the front edge to haggle, because the stallholder cannot see over the valance and will lower the price to find you.',
      'Joke: every stall in the market claims the best stripes, and every awning has been mended by someone who disagreed.',
      'A small hook behind the counter holds a bell, a ribbon and a note that says BACK IN FIVE MINUTES, written in a year nobody checks.',
    ],
    parts: [
      { s: 'box', d: [1.5, 0.82, 0.6], at: [0, 0.41, 0.3], c: 'wood' },
      { s: 'box', d: [1.58, 0.05, 0.68], at: [0, 0.845, 0.3], c: 'wood-light' },
      { s: 'box', d: [1.5, 0.5, 0.02], at: [0, 0.5, 0.61], c: 'trim' },
      { s: 'cyl', d: [0.025, 0.025, 2.17], at: [0.8, 1.085, 0.72], c: 'wood-dark', seg: 6, mirror: true },
      { s: 'cyl', d: [0.025, 0.025, 2.45], at: [0.8, 1.225, -0.74], c: 'wood-dark', seg: 6, mirror: true },
      { s: 'box', d: [1.7, 1.05, 0.02], at: [0, 1.5, -0.76], c: 'tint' },
      { s: 'box', d: [0.12, 1.06, 0.022], at: [-0.5, 1.5, -0.755], c: 'white', mirror: true },
      { s: 'box', d: [0.12, 1.06, 0.022], at: [0, 1.5, -0.755], c: 'white' },
      { s: 'box', d: [1.7, 0.16, 0.024], at: [0, 1.0, -0.755], c: 'trim' },
      { s: 'box', d: [0.02, 0.13, 1.57], at: [0.86, 2.15, -0.01], rot: [ROOF_TILT, 0, 0], c: 'tint', mirror: true },
      { s: 'box', d: [0.02, 0.06, 1.57], at: [0.86, 2.05, -0.01], rot: [ROOF_TILT, 0, 0], c: 'white', mirror: true },
      ...canopy(),
      ...valanceStrips(),
      ...valanceScallops(),
    ],
  },
  {
    id: 'pl-beetle-jar', name: 'Beetle Jars', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'beetle', 'jar', 'bug', 'glass', 'market', 'tray'], emoji: [],
    about: 'Gnome Theft Auto: the Beetle Market\'s stock, 0.4 m across. Three lidded glass jars with a beetle or two in each, and a tray of pinned beetles in front. No tint.',
    examine: [
      'Three glass jars with brass lids, each holding a beetle that looks quietly offended at being held, and a tray of others pinned in a row.',
      'Saying: "A beetle in a jar is a bargain, a beetle on a tray is a story, and a beetle in your hat is a lesson."',
      'Tip: the lids are screwed on tightly, and you should check that the beetle does not agree.',
      'Joke: the sign says BEETLE, slightly used, and the beetle, when asked, said it was used exactly as much as it wished.',
      'The tray has a tiny label under each pinned beetle, and every label says the same thing, which is "price: negotiable".',
    ],
    parts: [
      { s: 'box', d: [0.5, 0.03, 0.3], at: [0, 0.015, 0.1], c: 'wood-dark' },
      ...jarParts(),
      ...trayParts(),
    ],
  },
  {
    id: 'pl-bric-a-brac-pile', name: 'Bric-a-brac Pile', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'bric', 'brac', 'junk', 'lamp', 'clock', 'teapot', 'chair', 'antique', 'market'], emoji: [],
    tint: 'amethyst',
    about: 'Gnome Theft Auto: the Beetle Market\'s junk table top, 0.9 m wide: a lamp, a carriage clock, a teapot, a vase, candlesticks and a doll\'s chair. Tint = the lampshade.',
    examine: [
      'A heap of things that were once someone\'s favourite: a lamp with a dented shade, a clock that has opinions, and a teapot with a very long spout.',
      'Saying: "One gnome\'s clutter is another gnome\'s antique, and both are priced the same."',
      'Tip: ask the clock the time, then ask a second clock, and then give up and trust the sun.',
      'Joke: the little chair is not for sale, because a doll sits in it every night and nobody will say which doll.',
      'Every item has a small paper tag tied on with string, and every tag says only "ask", which has made it very hard to buy anything.',
    ],
    parts: [
      // lamp
      { s: 'cyl', d: [0.05, 0.06, 0.03], at: [-0.33, 0.015, 0], c: 'brass', seg: 8 },
      { s: 'cyl', d: [0.012, 0.012, 0.28], at: [-0.33, 0.17, 0], c: 'brass', seg: 6 },
      { s: 'cyl', d: [0.06, 0.11, 0.14], at: [-0.33, 0.37, 0], c: 'tint', seg: 8 },
      // carriage clock
      { s: 'box', d: [0.13, 0.15, 0.07], at: [-0.12, 0.075, 0.03], c: 'brass' },
      { s: 'ball', d: [0.045], at: [-0.12, 0.085, 0.067], scale: [1, 1, 0.2], c: 'white', seg: 8 },
      { s: 'box', d: [0.006, 0.04, 0.006], at: [-0.12, 0.095, 0.075], c: 'black' },
      { s: 'ball', d: [0.02], at: [-0.12, 0.165, 0.03], c: 'brass', seg: 6 },
      // teapot
      { s: 'ball', d: [0.07], at: [0.07, 0.07, 0.05], scale: [1, 0.85, 1], c: 'glaze-blue', seg: 8 },
      { s: 'cyl', d: [0.02, 0.03, 0.04], at: [0.07, 0.15, 0.05], c: 'glaze-blue', seg: 6 },
      { s: 'cyl', d: [0.012, 0.018, 0.12], at: [0.15, 0.11, 0.05], rot: [0, 0, -50], c: 'glaze-blue', seg: 6 },
      { s: 'ring', d: [0.035, 0.008], at: [-0.01, 0.075, 0.05], rot: [0, 90, 0], c: 'glaze-blue', seg: 6 },
      // vase
      { s: 'ball', d: [0.065], at: [0.13, 0.065, -0.1], scale: [0.9, 1.1, 0.9], c: 'clay', seg: 8 },
      { s: 'cyl', d: [0.03, 0.025, 0.1], at: [0.13, 0.175, -0.1], c: 'clay', seg: 8 },
      // candlesticks
      { s: 'cyl', d: [0.012, 0.025, 0.2], at: [-0.22, 0.1, -0.1], c: 'brass', seg: 6 },
      { s: 'cyl', d: [0.012, 0.012, 0.07], at: [-0.22, 0.235, -0.1], c: 'wax', seg: 6 },
      { s: 'cyl', d: [0.012, 0.025, 0.16], at: [-0.1, 0.08, -0.12], c: 'brass', seg: 6 },
      { s: 'cyl', d: [0.012, 0.012, 0.07], at: [-0.1, 0.195, -0.12], c: 'wax', seg: 6 },
      ...dollChair(),
    ],
  },
  {
    id: 'pl-book-pile', name: 'Second-hand Books', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'book', 'books', 'stack', 'market', 'paper', 'read'], emoji: [],
    about: 'Gnome Theft Auto: the Beetle Market\'s book table top, 0.4 m wide: two flat stacks and seven leaning spines in mixed colours. No tint.',
    examine: [
      'Two stacks of books lying down and seven standing up, in the colours of every sort of leather and one sort of cheese.',
      'Saying: "Never judge a book by its cover, but do judge it by how many gnomes have already folded the corner."',
      'Tip: take the book from the middle of the stack, because the one on top is always the second-hand one and it knows.',
      'Joke: every book has the previous owner\'s name inside, and every previous owner is called "this belongs to the library".',
      'One thin book has been tucked into the row backwards, so that it can read the others.',
    ],
    parts: [
      { s: 'box', d: [0.24, 0.045, 0.18], at: [-0.12, 0.0225, 0.0], c: 'red' },
      { s: 'box', d: [0.2, 0.04, 0.16], at: [-0.11, 0.065, 0.01], rot: [0, 8, 0], c: 'cloth' },
      { s: 'box', d: [0.22, 0.05, 0.17], at: [-0.13, 0.11, -0.01], rot: [0, -6, 0], c: 'leather' },
      { s: 'box', d: [0.17, 0.035, 0.13], at: [-0.12, 0.1525, 0.0], rot: [0, 14, 0], c: 'blue' },
      { s: 'box', d: [0.26, 0.04, 0.2], at: [0.07, 0.02, 0.17], rot: [0, 4, 0], c: 'green' },
      { s: 'box', d: [0.2, 0.04, 0.15], at: [0.08, 0.06, 0.17], rot: [0, -9, 0], c: 'orange' },
      ...bookRow(),
    ],
  },
  {
    id: 'pl-record-crate', name: 'Record Crate', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'record', 'records', 'vinyl', 'sleeve', 'crate', 'music', 'market'], emoji: [],
    about: 'Gnome Theft Auto: the Beetle Market\'s record crate, 0.34 m: a wooden crate holding eight colourful record sleeves. No tint.',
    examine: [
      'A wooden crate packed with square cardboard sleeves in bright colours, each with a black disc inside that is mostly silence.',
      'Saying: "Every record is the best record, until it is played, and then it is the second best."',
      'Tip: flick through the sleeves from the front, because the ones at the back have all been broadcast already.',
      'Joke: all the records are by the Maestro, and all of them are the same record, played at a different speed.',
      'One sleeve has a thumb-print on it in jam, which the stallholder says is the sleeve\'s signature.',
    ],
    parts: [
      { s: 'box', d: [0.34, 0.02, 0.34], at: [0, 0.01, 0], c: 'wood-dark' },
      { s: 'box', d: [0.34, 0.16, 0.02], at: [0, 0.08, 0.16], c: 'wood' },
      { s: 'box', d: [0.34, 0.2, 0.02], at: [0, 0.1, -0.16], c: 'wood' },
      { s: 'box', d: [0.02, 0.14, 0.3], at: [-0.16, 0.07, 0], c: 'wood' },
      { s: 'box', d: [0.02, 0.14, 0.3], at: [0.16, 0.07, 0], c: 'wood' },
      ...sleeves().map((p): Part => ({ ...p, d: [p.d[0], 0.27, 0.27], at: [(p.at as readonly number[])[0] * 1.0, 0.24, 0] })),
    ],
  },
  {
    id: 'pl-prints-rack', name: 'Prints Rack', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'print', 'prints', 'picture', 'painting', 'frame', 'rack', 'art', 'market'], emoji: [],
    about: 'Gnome Theft Auto: the Beetle Market\'s prints rack, 1.2 m wide and 1.5 m tall: two wooden uprights with six framed prints in two rows. No tint.',
    examine: [
      'A tall rack of framed pictures in six colours, hung slightly crooked in a way that is probably meant.',
      'Saying: "A print is a painting that has learned to stand in a queue."',
      'Tip: look at the prints from the side, where they all look like the same blue square and are much easier to afford.',
      'Joke: the pictures are all views of the market, and each shows the stall that sold it to you, a little cheaper than it is today.',
      'One frame is empty, and its price tag is the highest on the rack.',
    ],
    parts: [
      { s: 'box', d: [0.05, 1.5, 0.05], at: [0.6, 0.75, 0], c: 'wood-dark', mirror: true },
      { s: 'box', d: [1.2, 0.05, 0.05], at: [0, 1.46, 0], c: 'wood-dark' },
      { s: 'box', d: [1.2, 0.04, 0.05], at: [0, 0.4, 0], c: 'wood-dark' },
      { s: 'box', d: [1.2, 1.1, 0.02], at: [0, 0.85, 0.015], c: 'cloth' },
      { s: 'box', d: [1.2, 0.04, 0.05], at: [0, 0.03, 0], c: 'wood-dark' },
      ...printParts(),
    ],
  },
  {
    id: 'pl-hat-stand', name: 'Old-hats Stand', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'hat', 'hats', 'stand', 'top', 'beret', 'bowler', 'fez', 'cap', 'market'], emoji: [],
    about: 'Gnome Theft Auto: the Beetle Market\'s hat stand, 1.6 m tall: a pole on a round foot with a top hat, a beret, a bowler, a fez and a flat cap. No tint.',
    examine: [
      'A wooden pole with five hats on it, each a different shape, and each one the exact size of a head that has since moved away.',
      'Saying: "A gnome who buys a hat at the market is buying the opinion of its last owner."',
      'Tip: try the hat on before you decide, because a hat that fits too well has usually been waiting for you.',
      'Joke: the fez has a note that says OPINIONATED, and nobody has dared to find out in which direction.',
      'The top hat has a faint ring inside, from a long-gone head that frowned at the world for forty years.',
    ],
    parts: [
      { s: 'cyl', d: [0.22, 0.24, 0.04], at: [0, 0.02, 0], c: 'wood-dark', seg: 10 },
      { s: 'cyl', d: [0.025, 0.025, 1.4], at: [0, 0.74, 0], c: 'wood', seg: 6 },
      { s: 'cyl', d: [0.012, 0.012, 0.44], at: [0, 1.17, 0], rot: [0, 0, 90], c: 'wood', seg: 5 },
      { s: 'cyl', d: [0.012, 0.012, 0.44], at: [0, 0.83, 0], rot: [0, 0, 90], c: 'wood', seg: 5 },
      ...hatStand(),
    ],
  },
  {
    id: 'pl-hand-cart', name: 'Hand Cart', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'cart', 'handcart', 'barrow', 'wheel', 'market', 'crate', 'wood'], emoji: [],
    tint: 'orange',
    about: 'Gnome Theft Auto: a two-wheeled hand cart, 1.7 m long including its handles, loaded with two crates and a sack. Tint = the produce in the crates. Handles at +z.',
    examine: [
      'A wooden two-wheeled cart with two long handles, a sack and two crates piled in it as though gravity has been asked to wait.',
      'Saying: "A loaded cart is a promise, and an empty cart is the stallholder\'s explanation."',
      'Tip: lift the handles together and push, and do not whistle, because the cart goes where the tune goes.',
      'Joke: the cart has delivered the same load to the same stall every morning for years, and the stall has never paid.',
      'A chalk scribble on the side reads BACK SOON, with the BACK rubbed out and replaced with a smaller one.',
    ],
    parts: [
      { s: 'box', d: [0.8, 0.06, 0.5], at: [0, 0.4, -0.2], c: 'wood' },
      { s: 'box', d: [0.8, 0.14, 0.03], at: [0, 0.5, 0.045], c: 'wood-light' },
      { s: 'box', d: [0.8, 0.14, 0.03], at: [0, 0.5, -0.445], c: 'wood-light' },
      { s: 'box', d: [0.03, 0.14, 0.5], at: [0.385, 0.5, -0.2], c: 'wood-light', mirror: true },
      { s: 'cyl', d: [0.3, 0.3, 0.045], at: [0.46, 0.3, -0.2], rot: [0, 0, 90], c: 'wood-dark', seg: 12, mirror: true },
      { s: 'cyl', d: [0.045, 0.045, 0.06], at: [0.5, 0.3, -0.2], rot: [0, 0, 90], c: 'iron', seg: 6, mirror: true },
      { s: 'box', d: [0.04, 0.04, 0.9], at: [0.32, 0.42, 0.18], rot: [-6, 0, 0], c: 'wood-dark', mirror: true },
      { s: 'box', d: [0.6, 0.03, 0.03], at: [0, 0.38, 0.55], c: 'wood-dark' },
      { s: 'box', d: [0.3, 0.2, 0.3], at: [-0.2, 0.55, -0.22], c: 'wood' },
      { s: 'ball', d: [0.11], at: [-0.2, 0.7, -0.22], scale: [1.3, 0.7, 1.3], c: 'tint', seg: 6 },
      { s: 'box', d: [0.3, 0.2, 0.3], at: [0.15, 0.55, -0.22], c: 'wood' },
      { s: 'ball', d: [0.11], at: [0.15, 0.7, -0.22], scale: [1.3, 0.7, 1.3], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.2], at: [-0.05, 0.64, -0.38], scale: [1, 0.9, 1.1], c: 'burlap', seg: 6 },
    ],
  },
  {
    id: 'pl-ticket-kiosk', name: 'Ticket Kiosk', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'ticket', 'kiosk', 'booth', 'box', 'office', 'opera', 'queue'], emoji: [],
    tint: 'green', trim: 'cloth',
    about: 'Gnome Theft Auto: the opera ticket kiosk, 1.4 x 1.2 m and 2.8 m tall: green panelled booth, barred ticket window with a shelf and a trimmed roof. Tint = the panels, trim = the roof and mouldings. Window faces +z. Hang the sign on it as a plaque.',
    examine: [
      'A small green booth with a barred window, a shelf for coins, and a roof like a hat that has been told to wait.',
      'Saying: "A ticket is a promise that the music will start, and that you will be sitting down when it does."',
      'Tip: speak into the window politely, because the clerk inside can hear everything and will say nothing for several minutes.',
      'Joke: the window says OPEN, the shelf says CLOSED, and the clerk says it is a matter for the committee.',
      'A little brass bell on the shelf has a note tied to it that says: PLEASE DO NOT RING. WE HEARD YOU THE FIRST TIME.',
    ],
    parts: [
      { s: 'box', d: [1.4, 0.12, 1.2], at: [0, 0.06, 0], c: 'stone' },
      { s: 'box', d: [1.26, 2.1, 1.06], at: [0, 1.17, 0], c: 'tint' },
      { s: 'box', d: [1.32, 0.08, 1.12], at: [0, 0.16, 0], c: 'trim' },
      { s: 'box', d: [1.32, 0.08, 1.12], at: [0, 2.14, 0], c: 'trim' },
      { s: 'box', d: [0.7, 0.55, 0.04], at: [0, 1.5, 0.52], c: 'slate' },
      { s: 'box', d: [0.8, 0.05, 0.3], at: [0, 1.2, 0.62], c: 'wood-light' },
      { s: 'box', d: [0.04, 0.55, 0.03], at: [-0.21, 1.5, 0.54], c: 'brass', mirror: true },
      { s: 'box', d: [0.04, 0.55, 0.03], at: [0, 1.5, 0.54], c: 'brass' },
      { s: 'box', d: [0.5, 0.6, 0.04], at: [0.42, 0.7, 0.54], c: 'trim' },
      { s: 'box', d: [0.5, 0.6, 0.04], at: [-0.42, 0.7, 0.54], c: 'trim' },
      { s: 'box', d: [0.36, 0.5, 0.02], at: [0.42, 0.7, 0.57], c: 'tint' },
      { s: 'box', d: [0.36, 0.5, 0.02], at: [-0.42, 0.7, 0.57], c: 'tint' },
      { s: 'box', d: [1.5, 0.1, 1.3], at: [0, 2.26, 0], c: 'red' },
      { s: 'box', d: [1.3, 0.1, 1.1], at: [0, 2.36, 0], c: 'red' },
      { s: 'box', d: [1.0, 0.1, 0.8], at: [0, 2.46, 0], c: 'red' },
      { s: 'box', d: [0.6, 0.1, 0.45], at: [0, 2.56, 0], c: 'red' },
      { s: 'ball', d: [0.07], at: [0, 2.67, 0], c: 'brass', seg: 8 },
      { s: 'ball', d: [0.05], at: [0.2, 1.275, 0.68], c: 'brass', scale: [1, 0.8, 1], seg: 6 },
      { s: 'box', d: [0.24, 0.3, 0.02], at: [-0.5, 1.4, 0.54], c: 'paper' },
    ],
  },
  {
    id: 'pl-scooter', name: 'Maestro\'s Scooter', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'scooter', 'vespa', 'moped', 'wheels', 'vehicle', 'parked', 'maestro'], emoji: [],
    tint: 'sapphire', trim: 'chalk',
    about: 'Gnome Theft Auto: a parked Vespa-style scooter, 1.4 m long and 0.95 m tall, on its stand. Tint = the bodywork. Front is +z.',
    examine: [
      'A round-backed scooter with a little curved shield at the front and a seat the colour of an old violin case.',
      'Saying: "Slow is smooth, and smooth is the only way a Maestro arrives."',
      'Tip: do not sit on the scooter, because its owner can tell from three streets away and will describe it in a very long speech.',
      'Joke: its top speed is exactly the speed of a march, and its owner insists this is deliberate.',
      'A rolled-up score rides on the back rack, tied with ribbon, and the ribbon is tied in the key of C.',
    ],
    parts: [
      { s: 'cyl', d: [0.16, 0.16, 0.07], at: [0, 0.16, 0.48], rot: [0, 0, 90], c: 'black', seg: 12 },
      { s: 'cyl', d: [0.16, 0.16, 0.07], at: [0, 0.16, -0.46], rot: [0, 0, 90], c: 'black', seg: 12 },
      { s: 'cyl', d: [0.07, 0.07, 0.085], at: [0, 0.16, 0.48], rot: [0, 0, 90], c: 'silver', seg: 8 },
      { s: 'cyl', d: [0.07, 0.07, 0.085], at: [0, 0.16, -0.46], rot: [0, 0, 90], c: 'silver', seg: 8 },
      { s: 'box', d: [0.36, 0.05, 0.52], at: [0, 0.23, 0.04], c: 'tint' },
      { s: 'box', d: [0.38, 0.015, 0.54], at: [0, 0.26, 0.04], c: 'trim' },
      { s: 'ball', d: [0.2], at: [0, 0.43, -0.36], scale: [0.95, 1.15, 1.7], c: 'tint', seg: 8 },
      { s: 'box', d: [0.22, 0.24, 0.5], at: [0.0, 0.4, -0.26], c: 'tint' },
      { s: 'box', d: [0.36, 0.62, 0.05], at: [0, 0.54, 0.31], rot: [-14, 0, 0], c: 'tint' },
      { s: 'box', d: [0.07, 0.07, 0.07], at: [0, 0.27, 0.31], c: 'tint' },
      { s: 'cyl', d: [0.02, 0.02, 0.42], at: [0, 0.82, 0.38], rot: [-14, 0, 0], c: 'silver', seg: 6 },
      { s: 'cyl', d: [0.014, 0.014, 0.56], at: [0, 0.91, 0.34], rot: [0, 0, 90], c: 'silver', seg: 6 },
      { s: 'ball', d: [0.03], at: [0.28, 0.91, 0.34], c: 'leather-dark', seg: 6, mirror: true },
      { s: 'ball', d: [0.065], at: [0, 0.86, 0.45], scale: [1, 1, 0.8], c: 'spark', glow: true, seg: 8 },
      { s: 'box', d: [0.3, 0.07, 0.46], at: [0, 0.6, -0.2], c: 'leather' },
      { s: 'box', d: [0.12, 0.04, 0.18], at: [0, 0.57, 0.12], c: 'leather-dark' },
      { s: 'box', d: [0.2, 0.05, 0.3], at: [0, 0.37, 0.5], c: 'tint' },
      { s: 'box', d: [0.19, 0.03, 0.04], at: [0, 0.19, -0.67], c: 'ruby', glow: true },
      { s: 'cyl', d: [0.03, 0.03, 0.46], at: [0.2, 0.17, -0.34], rot: [90, 0, 0], c: 'steel', seg: 6 },
      { s: 'ball', d: [0.035], at: [0.2, 0.17, -0.6], c: 'steel', seg: 6 },
      { s: 'cyl', d: [0.014, 0.014, 0.1], at: [0.18, 0.12, -0.08], rot: [0, 0, 70], c: 'iron-dark', seg: 5 },
      { s: 'box', d: [0.3, 0.015, 0.2], at: [0, 0.69, -0.52], c: 'iron-dark' },
      { s: 'cyl', d: [0.03, 0.03, 0.4], at: [0, 0.73, -0.52], rot: [0, 0, 90], c: 'cloth', seg: 6 },
      { s: 'box', d: [0.14, 0.12, 0.02], at: [0, 0.64, -0.62], c: 'trim' },
    ],
  },
];
