// Gnome Theft Auto: Pardonlin's town props (E30, docs/roadmaps/gta-batch-3/E30/). Cafés, quays, market, music, garden.
import type { Part, PrefabDef } from '../types';

// Six baguettes standing in a ring inside the bread basket, and one in the middle.
const LOAF_SPOTS: readonly (readonly [number, number])[] = [
  [0.12, 0], [0.06, 0.104], [-0.06, 0.104], [-0.12, 0], [-0.06, -0.104], [0.06, -0.104], [0, 0],
];
const loaves = (): Part[] => LOAF_SPOTS.map(([x, z]): Part => ({
  s: 'cyl', d: [0.028, 0.028, 0.55], at: [x, 0.42, z], c: 'wood-light', seg: 6,
}));

// Nine round produce in a heap inside the crate.
const PRODUCE_SPOTS: readonly (readonly [number, number, number])[] = [
  [-0.2, 0.1, -0.1], [0, 0.1, -0.1], [0.2, 0.1, -0.1],
  [-0.2, 0.1, 0.1], [0, 0.1, 0.1], [0.2, 0.1, 0.1],
  [-0.1, 0.165, 0], [0.1, 0.165, 0],
  [0, 0.235, 0],
];
const produce = (): Part[] => PRODUCE_SPOTS.map(([x, y, z]): Part => ({
  s: 'ball', d: [0.07], at: [x, y, z], c: 'tint', seg: 6,
}));

// Crate slats: three rows across the front and back, and two sides.
const CRATE_ROWS = [0.06, 0.12, 0.18];
const crateSlats = (): Part[] => CRATE_ROWS.flatMap((y): Part[] => [
  { s: 'box', d: [0.6, 0.05, 0.02], at: [0, y, 0.19], c: 'wood' },
  { s: 'box', d: [0.6, 0.05, 0.02], at: [0, y, -0.19], c: 'wood' },
  { s: 'box', d: [0.02, 0.05, 0.36], at: [-0.29, y, 0], c: 'wood' },
  { s: 'box', d: [0.02, 0.05, 0.36], at: [0.29, y, 0], c: 'wood' },
]);

// Newspaper text lines, ten of them, across the page.
const PAPER_LINES = [-0.09, -0.07, -0.05, -0.03, -0.01, 0.01, 0.03, 0.05, 0.07, 0.09];
const paperLines = (): Part[] => PAPER_LINES.map((z): Part => ({
  s: 'box', d: [0.26, 0.004, 0.006], at: [0, 0.02, z], c: 'stone',
}));

// Book spines standing on the open top of the stall.
const BOOK_SPECS: readonly (readonly [number, number, string])[] = [
  [-0.84, 0.2, 'red'], [-0.6, 0.22, 'blue'], [-0.36, 0.18, 'brass'], [-0.12, 0.24, 'cloth'],
  [0.12, 0.2, 'leather'], [0.36, 0.22, 'wood'], [0.6, 0.18, 'black'], [0.84, 0.21, 'sand'],
];
const bookSpines = (): Part[] => BOOK_SPECS.map(([x, h, c]): Part => ({
  s: 'box', d: [0.1, h, 0.2], at: [x, 0.95 + h / 2 - 0.02, -0.1], c: c as Part['c'],
}));

// Queue rope: eight short segments following a shallow sag from the post at x = 0 to the next post at x = 1.5.
// Each segment is centred on its midpoint and tilted to the slope of the curve (rot z = 90 + slope angle).
const ROPE: readonly (readonly [number, number, number])[] = [
  [0.09375, 0.7648, -19.3], [0.28125, 0.7086, -14.0], [0.46875, 0.6711, -8.5], [0.65625, 0.6523, -2.9],
  [0.84375, 0.6523, 2.9], [1.03125, 0.6711, 8.5], [1.21875, 0.7086, 14.0], [1.40625, 0.7648, 19.3],
];
const rope = (): Part[] => ROPE.map(([x, y, tilt]): Part => ({
  s: 'cyl', d: [0.012, 0.012, 0.2], at: [x, y, 0], rot: [0, 0, 90 + tilt], c: 'red', seg: 6,
}));

// Three croissant segments along a shallow crescent, lying on the ground.
const CROISSANT_SPOTS: readonly (readonly [number, number, number, string])[] = [
  [-0.0433, 0.0224, 0.015, 'wood-light'], [-0.025, 0.0224, -0.0033, 'wood-light'],
  [0, 0.0224, -0.01, 'straw'], [0.025, 0.0224, -0.0033, 'wood-light'], [0.0433, 0.0224, 0.015, 'wood-light'],
];

export const GTA_PARDONLIN_PROPS: readonly PrefabDef[] = [
  {
    id: 'pl-easel', name: 'Painter\'s Easel', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'easel', 'painting', 'canvas', 'wood', 'art'], emoji: [],
    about: 'Gnome Theft Auto: Pardonlin painter\'s easel. Wooden A-frame, 1.6 m, holding a canvas with a croissant-shaped tower painted on it, and a paint box at its foot. No tint.',
    examine: [
      'A wooden A-frame holding a canvas that shows a tower shaped like a croissant, painted by someone who had clearly never tasted one.',
      'Saying: a painting is finished when the paint stops moving, and the paint on this one has been moving since the spring.',
      'Tip: stand well back to look at the picture, because from close up the tower looks more like a loaf than a building.',
      'Joke: the artist signed the corner, painted over the signature, then signed it again with a small apology.',
      'A row of old brushes stands in a jar beside the paint box, each one worn to a different angle of regret.',
    ],
    parts: [
      { s: 'box', d: [0.04, 1.54, 0.04], at: [0, 0.75, 0.175], rot: [-13.1, 0, 0], c: 'wood' },
      { s: 'box', d: [0.04, 1.54, 0.04], at: [0, 0.75, -0.175], rot: [13.1, 0, 0], c: 'wood' },
      { s: 'box', d: [0.03, 0.03, 0.3], at: [0, 0.9, 0], c: 'wood-dark' },
      { s: 'box', d: [0.8, 0.5, 0.03], at: [0, 1.2, 0.2], c: 'cloth' },
      { s: 'ball', d: [0.1], scale: [2.2, 0.6, 0.1], at: [0, 1.02, 0.215], c: 'sand', seg: 8 },
      { s: 'ball', d: [0.1], scale: [1.8, 0.6, 0.1], at: [0, 1.12, 0.215], c: 'straw', seg: 8 },
      { s: 'ball', d: [0.1], scale: [1.4, 0.6, 0.1], at: [0, 1.22, 0.215], c: 'honey', seg: 8 },
      { s: 'ball', d: [0.1], scale: [1.0, 0.6, 0.1], at: [0, 1.32, 0.215], c: 'brass', seg: 8 },
      { s: 'box', d: [0.18, 0.08, 0.12], at: [0.15, 0.04, 0.2], c: 'wood-dark' },
    ],
  },
  {
    id: 'pl-gramophone', name: 'Horn Gramophone', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'gramophone', 'record', 'music', 'horn', 'brass'], emoji: [],
    about: 'Gnome Theft Auto: the Pardonlin horn gramophone. Wooden box, brass horn, crank and a black record on a brass turntable. 0.3 x 0.5 x 0.3 m. No tint.',
    examine: [
      'A wooden box with a brass horn sprouting from it, like a flower that has decided to be loud.',
      'Saying: the song lives in the black disc, and the horn is only there so the neighbours can hear it as well.',
      'Tip: wind the handle slowly, or the music comes out at the speed of an argument and nobody enjoys it.',
      'Joke: it has played the same waltz for forty years, and the waltz has not yet noticed that it is finished.',
      'Pasted inside the lid is a scrap of paper in careful handwriting: "Do not let the horn play it twice."',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.14, 0.3], at: [0, 0.07, 0], c: 'wood-dark' },
      { s: 'cyl', d: [0.11, 0.11, 0.02], at: [0, 0.15, 0], c: 'brass', seg: 12 },
      { s: 'cyl', d: [0.1, 0.1, 0.01], at: [0, 0.167, 0], c: 'black', seg: 12 },
      { s: 'cyl', d: [0.1, 0.03, 0.3], at: [0, 0.27, -0.06], rot: [45, 0, 0], c: 'brass', seg: 12 },
      { s: 'cyl', d: [0.015, 0.015, 0.08], at: [0.192, 0.1, 0], rot: [0, 0, 90], c: 'black', seg: 6 },
    ],
  },
  {
    id: 'pl-horn-speaker', name: 'Horn Loudspeaker', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'speaker', 'horn', 'loudspeaker', 'post', 'brass'], emoji: [],
    footprint: { r: 0.2, h: 4.1 },
    about: 'Gnome Theft Auto: the Pardonlin horn loudspeaker. Brass horn on a 4 m iron post with a small base. Horn points +z. No tint.',
    examine: [
      'A brass horn on top of a tall iron post, pointing down the street at whoever is least ready to hear it.',
      'Saying: the post was raised so the announcements could be heard over the queues, which are very long.',
      'Tip: if the horn starts to crackle, the street has had enough, and the wise gnome leaves a little earlier than the notice says.',
      'Joke: every announcement begins with "Attention", and nobody has ever paid attention to any of them.',
      'Someone has tied a red ribbon to the post beneath the horn, and nobody remembers whether it was a prize or a warning.',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.22, 0.06], at: [0, 0.03, 0], c: 'iron-dark', seg: 12 },
      { s: 'cyl', d: [0.04, 0.05, 4.04], at: [0, 2.08, 0], c: 'iron', seg: 8 },
      { s: 'cyl', d: [0.3, 0.05, 0.5], at: [0, 4.12, 0.2], rot: [90, 0, 0], c: 'brass', seg: 12 },
    ],
  },
  {
    id: 'pl-accordion', name: 'Accordion', category: 'prop', uses: ['place', 'hold'],
    tags: ['gta', 'pardonlin', 'accordion', 'music', 'bellows', 'instrument'], emoji: [],
    grip: [0, 0.2, 0],
    about: 'Gnome Theft Auto: the Pardonlin accordion. Upright 0.45 m instrument: leather bellows folds, two wooden button blocks with ivory keys. Grip on the bellows. No tint.',
    examine: [
      'A small box of bellows with a row of ivory buttons on each side, and folds of leather that breathe in and out.',
      'Saying: an accordion makes a sound like a sigh that has been given music lessons, and it is the sigh the town remembers.',
      'Tip: squeeze slowly, since the bellows keep whatever air you give them, and the song is only as long as your lungs.',
      'Joke: an accordion can play two tunes at once, which is one more than most committees manage in an afternoon.',
      'On the bass side, a little brass plate has been polished so often that the name on it has worn quite away.',
    ],
    parts: [
      { s: 'box', d: [0.22, 0.3, 0.1], at: [0, 0.225, 0], c: 'leather-dark' },
      { s: 'box', d: [0.232, 0.02, 0.106], at: [0, 0.12, 0], c: 'leather' },
      { s: 'box', d: [0.232, 0.02, 0.106], at: [0, 0.17, 0], c: 'leather' },
      { s: 'box', d: [0.232, 0.02, 0.106], at: [0, 0.22, 0], c: 'leather' },
      { s: 'box', d: [0.232, 0.02, 0.106], at: [0, 0.27, 0], c: 'leather' },
      { s: 'box', d: [0.232, 0.02, 0.106], at: [0, 0.32, 0], c: 'leather' },
      { s: 'box', d: [0.14, 0.07, 0.06], at: [0, 0.415, 0], c: 'wood-dark' },
      { s: 'box', d: [0.14, 0.07, 0.06], at: [0, 0.035, 0], c: 'wood-dark' },
      { s: 'ball', d: [0.012], at: [-0.04, 0.4, 0.03], c: 'bone', seg: 6 },
      { s: 'ball', d: [0.012], at: [0, 0.4, 0.03], c: 'bone', seg: 6 },
      { s: 'ball', d: [0.012], at: [0.04, 0.4, 0.03], c: 'bone', seg: 6 },
      { s: 'ball', d: [0.012], at: [-0.04, 0.43, 0.03], c: 'bone', seg: 6 },
      { s: 'ball', d: [0.012], at: [0, 0.43, 0.03], c: 'bone', seg: 6 },
      { s: 'ball', d: [0.012], at: [0.04, 0.43, 0.03], c: 'bone', seg: 6 },
      { s: 'ball', d: [0.012], at: [-0.04, 0.025, 0.03], c: 'bone', seg: 6 },
      { s: 'ball', d: [0.012], at: [0.04, 0.025, 0.03], c: 'bone', seg: 6 },
      { s: 'ball', d: [0.012], at: [-0.04, 0.05, 0.03], c: 'bone', seg: 6 },
      { s: 'ball', d: [0.012], at: [0.04, 0.05, 0.03], c: 'bone', seg: 6 },
    ],
  },
  {
    id: 'pl-baguette', name: 'Baguette', category: 'prop', uses: ['place', 'hold'],
    tags: ['gta', 'pardonlin', 'baguette', 'bread', 'loaf', 'food'], emoji: [],
    grip: [0, 0.1, 0],
    about: 'Gnome Theft Auto: the Pardonlin baguette. Long crusty loaf, 0.7 m, standing upright with three slashes on its face. Grip near the bottom. No tint.',
    examine: [
      'A long crusty loaf, slashed three times along its back, the way a bakery marks the things it is proud of.',
      'Saying: a baguette is carried under the arm, never in a pocket, or it will be sat on by a pigeon with standing.',
      'Tip: break it over the knee, not over the table; the table has opinions about crumbs and will tell everyone.',
      'Joke: the crust is so firm that it could be used as a weapon, which is why the bakers never sell them after dark.',
      'On the end of this one, a single sesame seed has been stuck for three days, and nobody is brave enough to remove it.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.035, 0.7], at: [0, 0.35, 0], c: 'wood-light', seg: 8 },
      { s: 'box', d: [0.04, 0.012, 0.012], at: [0, 0.2, 0.03], rot: [0, 0, 30], c: 'wood-dark' },
      { s: 'box', d: [0.04, 0.012, 0.012], at: [0, 0.35, 0.03], rot: [0, 0, 30], c: 'wood-dark' },
      { s: 'box', d: [0.04, 0.012, 0.012], at: [0, 0.5, 0.03], rot: [0, 0, 30], c: 'wood-dark' },
    ],
  },
  {
    id: 'pl-bread-basket', name: 'Bread Basket', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'basket', 'bread', 'baguette', 'wicker', 'market'], emoji: [],
    about: 'Gnome Theft Auto: the Pardonlin bread basket. Straw wicker basket, 0.7 m tall, with seven standing baguettes poking out of the top. No tint.',
    examine: [
      'A wicker basket packed with long loaves that poke out of the top like a bundle of very stern umbrellas.',
      'Saying: a loaf in a basket is worth two on the counter, and three in the hands of the gnome who saw the baker first.',
      'Tip: take the one at the front, because the ones at the back have been there since the queue began and have grown bitter.',
      'Joke: the basket has never once been in a queue, though it has been the reason for a great many of them.',
      'Tucked between two loaves at the rim is a folded note saying the baker is sorry, folded the same way for years.',
    ],
    parts: [
      { s: 'cyl', d: [0.3, 0.22, 0.45], at: [0, 0.225, 0], c: 'straw', seg: 12 },
      { s: 'ring', d: [0.3, 0.02], at: [0, 0.45, 0], rot: [90, 0, 0], c: 'wood-dark' },
      ...loaves(),
    ],
  },
  {
    id: 'pl-book-stall', name: 'Riverside Book Stall', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'bookstall', 'books', 'stall', 'green', 'riverside'], emoji: [],
    footprint: { r: 1.0, h: 1.4 },
    about: 'Gnome Theft Auto: the Pardonlin riverside book stall. Green box on short legs, 2 x 0.8 m, 1.4 m tall, lid propped open at 45 degrees over a row of book spines. No tint.',
    examine: [
      'A green wooden stall on four short legs, its lid propped open over rows of book spines that all look equally unread.',
      'Saying: a book on the riverside is only as old as its cover, and the covers here have been mended with a good deal of string.',
      'Tip: read the spine before you open the book, because a spine can tell you more than the bookseller will.',
      'Joke: the bookseller sells only books with happy endings, though he has never read to the end of any of them.',
      'At the back of the stall, a book with no title is left open at a blank page, which the bookseller says is the best one.',
    ],
    parts: [
      { s: 'box', d: [0.1, 0.17, 0.1], at: [-0.9, 0.085, -0.3], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.17, 0.1], at: [0.9, 0.085, -0.3], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.17, 0.1], at: [-0.9, 0.085, 0.3], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.17, 0.1], at: [0.9, 0.085, 0.3], c: 'wood-dark' },
      { s: 'box', d: [2.0, 0.8, 0.8], at: [0, 0.55, 0], c: 'green' },
      { s: 'box', d: [2.0, 0.03, 0.6], at: [0, 1.162, -0.612], rot: [-135, 0, 0], c: 'green' },
      ...bookSpines(),
    ],
  },
  {
    id: 'pl-queue-post', name: 'Queue Post', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'queue', 'stanchion', 'rope', 'post', 'brass'], emoji: [],
    about: 'Gnome Theft Auto: the Pardonlin queue post. 0.95 m stanchion with a weighted base, brass post and ball top. Its red rope sags 1.5 m along +x to the next post. No tint.',
    examine: [
      'A short iron post with a brass stem and a ball on top, with a red rope hanging from its hook to the next post along.',
      'Saying: a queue is a line of gnomes who agreed to wait, and the rope is only there to remind them of the agreement.',
      'Tip: stand on the near side of the rope, not the far side, or the gnome behind will be cross and you will be in the wrong.',
      'Joke: the rope has held back the queue for so long that nobody can remember what the queue was waiting for.',
      'Where the rope meets the second post, someone has knotted a small blue ribbon, and nobody has asked why.',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.2, 0.06], at: [0, 0.03, 0], c: 'iron-dark', seg: 10 },
      { s: 'cyl', d: [0.022, 0.022, 0.85], at: [0, 0.475, 0], c: 'brass', seg: 8 },
      { s: 'ball', d: [0.035], at: [0, 0.915, 0], c: 'brass', seg: 8 },
      ...rope(),
    ],
  },
  {
    id: 'pl-cheese-wheel', name: 'Cheese Wheels', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'cheese', 'wheel', 'rind', 'market', 'food'], emoji: [],
    tint: 'wood',
    about: 'Gnome Theft Auto: the Pardonlin cheese wheels. Stack of three 0.6 m high cheese wheels, straw-yellow faces. Tint = the rind.',
    examine: [
      'Three round cheeses stacked one on another, each with a yellow face and a thick brown rind that has been nibbled on.',
      'Saying: a good cheese improves with age, and a bad cheese improves with the second opinion of another gnome.',
      'Tip: cut the wheel from the top, like a sensible gnome, or the rind will refuse to be cut and the cheese will sulk.',
      'Joke: the cheese is so old that it has started to hold meetings, and the rind has not yet been asked to attend.',
      'On the bottom wheel, a small mark is pressed into the rind with a thumb, the thumb of a gnome who is still waiting.',
    ],
    parts: [
      { s: 'cyl', d: [0.16, 0.16, 0.196], at: [0, 0.098, 0], c: 'tint', seg: 12 },
      { s: 'cyl', d: [0.14, 0.14, 0.002], at: [0, 0.196, 0], c: 'straw', seg: 12 },
      { s: 'cyl', d: [0.16, 0.16, 0.196], at: [0, 0.296, 0], c: 'tint', seg: 12 },
      { s: 'cyl', d: [0.14, 0.14, 0.002], at: [0, 0.394, 0], c: 'straw', seg: 12 },
      { s: 'cyl', d: [0.16, 0.16, 0.196], at: [0, 0.494, 0], c: 'tint', seg: 12 },
      { s: 'cyl', d: [0.14, 0.14, 0.002], at: [0, 0.592, 0], c: 'straw', seg: 12 },
    ],
  },
  {
    id: 'pl-produce-crate', name: 'Produce Crate', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'crate', 'produce', 'fruit', 'market', 'wood'], emoji: [],
    tint: 'orange',
    about: 'Gnome Theft Auto: the Pardonlin produce crate. Slatted wooden crate, 0.6 x 0.4 m, heaped with round produce. Tint = the produce.',
    examine: [
      'A slatted wooden crate on the ground, heaped with round produce so bright it looks like it is trying to get noticed.',
      'Saying: a heap of fruit is never as high as it looks, but the gnome who carried it always says it was.',
      'Tip: take the one at the bottom of the heap, since the top ones were arranged by the stallholder to look good.',
      'Joke: the produce is always the best in the market, which every stallholder has said about every crate.',
      'Scratched into the side slat is a tally of sales, one mark for each gnome, and the last mark is still fresh.',
    ],
    parts: [
      { s: 'box', d: [0.6, 0.03, 0.4], at: [0, 0.015, 0], c: 'wood' },
      ...crateSlats(),
      ...produce(),
    ],
  },
  {
    id: 'pl-cafe-parasol', name: 'Café Parasol', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'parasol', 'umbrella', 'cafe', 'shade', 'stripes'], emoji: [],
    tint: 'red',
    trim: 'cloth',
    about: 'Gnome Theft Auto: the Pardonlin café parasol. Striped canopy on a weighted base, 2.4 m tall, 2.6 m across. Tint = the canopy, trim = the hem.',
    examine: [
      'A tall parasol on a heavy base, its canopy in two colours so the café tables can tell it apart from the sky.',
      'Saying: a parasol keeps the sun off the one underneath it, and the rest of the square gets the sun and the bill.',
      'Tip: the base is heavy for a reason, and the reason is the wind, which has never once been invited to lunch.',
      'Joke: the parasol has shaded three generations of lunch, and the lunch has not yet paid for the shade.',
      'At the tip of the canopy a small brass ball has been polished to a shine, and the gnomes take turns admiring themselves in it.',
    ],
    parts: [
      { s: 'cyl', d: [0.25, 0.25, 0.08], at: [0, 0.04, 0], c: 'iron-dark', seg: 12 },
      { s: 'cyl', d: [0.03, 0.03, 2.06], at: [0, 1.07, 0], c: 'wood', seg: 8 },
      { s: 'cone', d: [1.3, 0.45], at: [0, 2.175, 0], c: 'tint', seg: 12 },
      { s: 'ring', d: [1.3, 0.03], at: [0, 1.95, 0], rot: [90, 0, 0], c: 'trim' },
      { s: 'ball', d: [0.04], at: [0, 2.38, 0], c: 'brass', seg: 8 },
    ],
  },
  {
    id: 'pl-boule', name: 'Steel Boule', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'boule', 'ball', 'steel', 'game', 'gravel'], emoji: [],
    about: 'Gnome Theft Auto: one steel boule, a 0.09 m ball. No tint.',
    examine: [
      'A heavy steel ball, cold in the hand and dented on one side from a long afternoon of rolling about on gravel.',
      'Saying: a boule thrown close to the jack is worth two in the hand, and one in the bush is worth an argument.',
      'Tip: throw underarm and slowly, and let the ball do the talking, since it is the only one in the game with nothing to prove.',
      'Joke: the boule has been rolling for years and has finally arrived where the jack began.',
      'A tiny scratch on the far side spells out a name, too faint to read without a magnifier and a long rest.',
    ],
    parts: [
      { s: 'ball', d: [0.045], at: [0, 0.045, 0], c: 'steel', seg: 10 },
    ],
  },
  {
    id: 'pl-newspaper', name: 'Folded Newspaper', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'newspaper', 'paper', 'news', 'print'], emoji: [],
    about: 'Gnome Theft Auto: a folded newspaper lying flat, 0.3 x 0.22 x 0.02 m, with ten grey text-line strips. No tint.',
    examine: [
      'A folded sheet of newsprint lying flat, its grey columns of small print too dense for any gnome to read in one go.',
      'Saying: the news is always old by the time it is printed, which is why it is read so carefully the second time.',
      'Tip: fold it into a hat only if the news is bad, since a hat made of bad news is very hard to get out of.',
      'Joke: the paper has printed the same headline every morning for a year, and every morning it is surprised by it.',
      'In the margin, a gnome has written a long reply to a letter that was never printed, signed with a small drawing of a pigeon.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.02, 0.22], at: [0, 0.01, 0], c: 'paper' },
      ...paperLines(),
    ],
  },
  {
    id: 'pl-espresso-cup', name: 'Espresso Cup', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'espresso', 'cup', 'saucer', 'coffee', 'cafe'], emoji: [],
    about: 'Gnome Theft Auto: a tiny espresso cup on a saucer, 0.06 m tall, white. No tint.',
    examine: [
      'A tiny white cup on a flat saucer, no bigger than an acorn cap, with a loop of handle so small it is a matter of faith.',
      'Saying: strong and small is the gnome way, and the cup is proof that a great deal can be said in very few sips.',
      'Tip: hold it by the handle with the little finger out, which is the custom, and the only way to keep it upright.',
      'Joke: the cup is empty most of the time, but nobody has had the courage to say so to the waiter.',
      'A brown ring inside the cup marks every cup that came before, and the ring is now higher than the cup is deep.',
    ],
    parts: [
      { s: 'cyl', d: [0.035, 0.035, 0.008], at: [0, 0.004, 0], c: 'white', seg: 10 },
      { s: 'cyl', d: [0.02, 0.015, 0.055], at: [0, 0.0325, 0], c: 'white', seg: 8 },
      { s: 'ring', d: [0.008, 0.002], at: [0.022, 0.03, 0], c: 'white' },
    ],
  },
  {
    id: 'pl-croissant', name: 'Croissant', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'croissant', 'pastry', 'bread', 'food', 'crescent'], emoji: [],
    about: 'Gnome Theft Auto: a croissant, 0.14 m crescent of five curved pastry segments lying on the ground. No tint.',
    examine: [
      'A crescent of golden pastry, flaky in layers, with a crisp curled tip at each end and a bend in the middle like a moon.',
      'Saying: a crescent is only a loaf that has been told a story and has decided to be a moon for an afternoon.',
      'Tip: eat it from the outside in, so the middle is still warm when you get there, and the crumbs stay where they belong.',
      'Joke: the croissant has been folded so many times that it is now mostly the idea of a croissant, which is still delicious.',
      'Pressed into the top of one crescent is the print of a small fork, and nobody will say whose fork it was.',
    ],
    parts: CROISSANT_SPOTS.map(([x, y, z, c]): Part => ({
      s: 'ball', d: [0.028], scale: [1, 0.8, 1], at: [x, y, z], c: c as Part['c'], seg: 8,
    })),
  },
  {
    id: 'pl-music-stand', name: 'Music Stand', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'music', 'stand', 'sheet', 'orchestra', 'black'], emoji: [],
    about: 'Gnome Theft Auto: a black folding music stand, 1.2 m, with a tilted rest and a sheet of music clipped to it. No tint.',
    examine: [
      'A black folding stand with a single flat rest tilted toward the player, and a sheet of music pinned to it with two clips.',
      'Saying: the stand holds the notes so the gnome does not have to, which makes it the only member of the orchestra that stands still.',
      'Tip: lower the rest before you sit down, or the music will slide off and the whole row will have to play the same bar again.',
      'Joke: the stand is the only member of the orchestra that never misses a note, though it does not play a single one.',
      'In the margin of the music, someone has written "slower" in red, and the orchestra has been slowing down ever since.',
    ],
    parts: [
      { s: 'box', d: [0.44, 0.02, 0.04], at: [0, 0.01, 0], c: 'black' },
      { s: 'cyl', d: [0.012, 0.012, 1.09], at: [0, 0.555, 0], c: 'black', seg: 6 },
      { s: 'box', d: [0.4, 0.02, 0.26], at: [0, 1.1, 0.08], rot: [-25, 0, 0], c: 'black' },
      { s: 'box', d: [0.32, 0.003, 0.22], at: [0, 1.11314, 0.07387], rot: [-25, 0, 0], c: 'paper' },
    ],
  },
  {
    id: 'pl-cello', name: 'Cello', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'cello', 'music', 'instrument', 'strings', 'bow'], emoji: [],
    about: 'Gnome Theft Auto: a cello, 1.25 m including its spike, with a bow leaned against it. Wood-dark varnish. No tint.',
    examine: [
      'A tall dark-varnished instrument, big as a gnome, standing on a long spike with a bow leaning against its side like a tired friend.',
      'Saying: the cello sings in the voice of the lower strings, which is the voice of the gnome too polite to interrupt.',
      'Tip: tune it before the concert, because a cello out of tune can be heard from the far end of the square.',
      'Joke: the cello has stood in the same spot for so long that a small patch of moss has grown up its spike.',
      'Carved into the scroll at the top is a small gnome face, looking slightly bored, as all good cello players do.',
    ],
    parts: [
      { s: 'cone', d: [0.02, 0.13], at: [0, 0.065, 0], rot: [180, 0, 0], c: 'iron-dark', seg: 6 },
      { s: 'ball', d: [0.2], scale: [1, 1.25, 0.25], at: [0, 0.37, 0], c: 'wood-dark', seg: 10 },
      { s: 'box', d: [0.16, 0.1, 0.08], at: [0, 0.67, 0], c: 'wood-dark' },
      { s: 'ball', d: [0.15], scale: [1, 1.3, 0.25], at: [0, 0.9, 0], c: 'wood-dark', seg: 10 },
      { s: 'box', d: [0.04, 0.25, 0.03], at: [0, 1.075, 0], c: 'wood-dark' },
      { s: 'ball', d: [0.03], at: [0, 1.22, 0], c: 'wood-dark', seg: 6 },
      { s: 'box', d: [0.015, 0.7, 0.015], at: [0.25, 0.338, 0.09], rot: [0, 0, 15], c: 'wood' },
    ],
  },
  {
    id: 'pl-marrow', name: 'Prize Marrow', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'marrow', 'vegetable', 'prize', 'straw', 'garden'], emoji: [],
    about: 'Gnome Theft Auto: a giant prize marrow, 0.9 m long, lying on a straw bed with a red rosette. No tint.',
    examine: [
      'A giant green marrow as long as a gnome is tall, lying on a bed of straw and looking extremely pleased with itself.',
      'Saying: a marrow grown in secret is worth two grown in public, and this one was grown behind the shed.',
      'Tip: cut it with a clean blade and a steady hand, and keep the rosette, since the judges look for it first.',
      'Joke: the marrow has won so many prizes that the rosette has begun to wilt under the pressure.',
      'A small label on the straw reads "Entry 1", and under it someone has added "Entry 2, the same marrow, again".',
    ],
    parts: [
      { s: 'box', d: [1.0, 0.04, 0.4], at: [0, 0.02, 0], c: 'straw' },
      { s: 'ball', d: [0.1], scale: [4.5, 0.9, 1.0], at: [0, 0.128, 0], c: 'green', seg: 10 },
      { s: 'cyl', d: [0.02, 0.02, 0.08], at: [-0.49, 0.128, 0], rot: [0, 0, 90], c: 'wood-dark', seg: 6 },
      { s: 'cyl', d: [0.055, 0.055, 0.012], at: [0.2, 0.212, 0], c: 'red', seg: 10 },
      { s: 'cyl', d: [0.02, 0.02, 0.014], at: [0.2, 0.224, 0], c: 'white', seg: 8 },
    ],
  },
  {
    id: 'pl-tour-flag', name: 'Tour Guide Flag', category: 'prop', uses: ['place', 'hold'],
    tags: ['gta', 'pardonlin', 'flag', 'pole', 'tour', 'guide', 'pennant'], emoji: [],
    grip: [0, 0.35, 0],
    tint: 'red',
    about: 'Gnome Theft Auto: the Pardonlin tour guide flag. A 2 m wooden pole with a small pointed pennant (tint) and a pom-pom on top. Grip near the bottom.',
    examine: [
      'A tall wooden pole with a small pointed pennant near the top, bright enough to be seen from the back of any tour group.',
      'Saying: the guide always carries the flag, so the group will never be lost, only a little behind the flag.',
      'Tip: hold it high and keep it moving slowly, because a flag that stops is a flag that someone will sit under.',
      'Joke: the pom-pom on top is there so the flag can be found in the crowd, which is also the only purpose of the crowd.',
      'The pole has a notch near the bottom where a previous guide hung his lunch, and it is still the best place to grip it.',
    ],
    parts: [
      { s: 'cyl', d: [0.02, 0.02, 2.0], at: [0, 1.0, 0], c: 'wood', seg: 6 },
      { s: 'cone', d: [0.08, 0.3], at: [0.16, 1.8, 0], rot: [0, 0, -90], c: 'tint', seg: 3 },
      { s: 'ball', d: [0.04], at: [0, 2.03, 0], c: 'red', seg: 6 },
    ],
  },
  {
    id: 'pl-sheet-music', name: 'Scattered Sheet Music', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'sheet', 'music', 'paper', 'score', 'notes'], emoji: [],
    about: 'Gnome Theft Auto: a scattered sheaf of three sheets of music fanned on the ground, 0.3 m across. Each sheet 0.003 above the one below. No tint.',
    examine: [
      'Three sheets of music fanned out on the ground, their staves crossing one another like the lines of a nervous orchestra.',
      'Saying: a sheet of music is a map of a tune, and a tune is a map of where the gnome was going when the music began.',
      'Tip: pick them up in the order they were printed, or the second part will be played before the first, and nobody will forgive it.',
      'Joke: the three sheets were written for the same piece, but each one insists that it is the important one.',
      'On the middle sheet a rest has been drawn so long that it has become a small sleeping gnome, and nobody will wake it.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.004, 0.2], at: [0, 0.002, 0], rot: [0, -12, 0], c: 'paper' },
      { s: 'box', d: [0.3, 0.004, 0.2], at: [0, 0.005, 0], rot: [0, 0, 0], c: 'parchment' },
      { s: 'box', d: [0.3, 0.004, 0.2], at: [0, 0.008, 0], rot: [0, 12, 0], c: 'cloth' },
    ],
  },
];
