// Gnome Theft Auto: European kit (E29, docs/roadmaps/gta-batch-3/E29/). Filled by its issue.
import type { Part, PrefabDef } from '../types';

// A 4 x 4 grid of squashed cobbles on a 1.96 m slab. Cobbles sit inside the slab so their bottoms are hidden.
const cobbles = (): Part[] => {
  const out: Part[] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      out.push({
        s: 'ball', d: [0.12], scale: [1, 0.35, 1], seg: 6,
        at: [-0.735 + i * 0.49, 0.08, -0.735 + j * 0.49],
        c: (i + j) % 2 ? 'slate' : 'stone',
      });
    }
  }
  return out;
};

// Vertical bars at these x positions, each one with a spear tip on top.
const RAIL_BARS = [-0.88, -0.62, -0.36, -0.1, 0.1, 0.36, 0.62, 0.88];

const railBars = (): Part[] => RAIL_BARS.flatMap((x): Part[] => [
  { s: 'box', d: [0.025, 1.0, 0.025], at: [x, 0.55, 0], c: 'black' },
  { s: 'cone', d: [0.02, 0.04], at: [x, 1.08, 0], c: 'black', seg: 6 },
]);

// A scroll (ring) between each pair of neighbouring bars.
const railScrolls = (): Part[] => {
  const out: Part[] = [];
  for (let k = 0; k < RAIL_BARS.length - 1; k++) {
    const mid = (RAIL_BARS[k] + RAIL_BARS[k + 1]) / 2;
    out.push({ s: 'ring', d: [0.09, 0.015], at: [mid, 0.56, 0], c: 'black' });
  }
  return out;
};

export const GTA_EURO_STREET: readonly PrefabDef[] = [
  {
    id: 'euro-cobble-tile', name: 'Cobble Tile', category: 'prop', uses: ['place'],
    tags: ['gta', 'euro', 'street', 'cobble', 'stone', 'paving'], emoji: [],
    about: 'Gnome Theft Auto: the Cobble Tile. 1.96 m grey slab topped with a 4 x 4 grid of rounded grey cobbles. No tint. Lays on a 2 m grid.',
    examine: [
      'A grey slab of flat stones, each one the size of a loaf and rounded off by a hundred years of boots.',
      'Saying: the cobbles were laid by hand, so every one is a little different, and so is every gnome who walks over them.',
      'Tip: lay the tile on a bed of sand and tap it level with a mallet, or it will rock under you like a rowing boat.',
      'Joke: the cobbles are the only thing in the square that has never been on strike, mostly because they cannot stand up to do it.',
      'Between two of the stones in the far corner, a single Acorn has been wedged for so long it has become part of the paving.',
    ],
    parts: [
      { s: 'box', d: [1.96, 0.08, 1.96], at: [0, 0.04, 0], c: 'stone-dark' },
      ...cobbles(),
    ],
  },
  {
    id: 'euro-paving-tile', name: 'Paving Tile', category: 'prop', uses: ['place'],
    tags: ['gta', 'euro', 'street', 'paving', 'stone', 'slab'], emoji: [],
    about: 'Gnome Theft Auto: the Paving Tile. 1.96 m pale slab with four 0.94 m flags on top, each a slightly different shade. No tint. Lays on a 2 m grid.',
    examine: [
      'A pale square slab with four smaller flags set on top, each one a slightly different shade of tired stone.',
      'Saying: a paving slab is only as level as the last gnome who stood on it, and that gnome was probably leaning.',
      'Tip: keep the grout gaps clear of leaves, or the rain will settle in them and sulk for a week.',
      'Joke: the flags were laid in a neat grid so that everyone could see exactly where the mistake was.',
      'On the chalk-coloured flag, someone has drawn a hopscotch square, and then a note that says it is for the council to decide.',
    ],
    parts: [
      { s: 'box', d: [1.96, 0.06, 1.96], at: [0, 0.03, 0], c: 'cloth' },
      { s: 'box', d: [0.94, 0.03, 0.94], at: [-0.49, 0.07, -0.49], c: 'chalk' },
      { s: 'box', d: [0.94, 0.03, 0.94], at: [0.49, 0.07, -0.49], c: 'sand' },
      { s: 'box', d: [0.94, 0.03, 0.94], at: [-0.49, 0.07, 0.49], c: 'wool' },
      { s: 'box', d: [0.94, 0.03, 0.94], at: [0.49, 0.07, 0.49], c: 'bone' },
    ],
  },
  {
    id: 'euro-bollard', name: 'Street Bollard', category: 'prop', uses: ['place'],
    tags: ['gta', 'euro', 'street', 'bollard', 'iron', 'post'], emoji: [],
    footprint: { r: 0.15, h: 1 },
    about: 'Gnome Theft Auto: the Euro Street Bollard. Dark green cast-iron post, tapered, with a gold ring band and a ball cap. 0.3 x 1.0 x 0.3 m. No tint.',
    examine: [
      'A short dark green iron post, tapered at the top, with a gold ring round its middle and a round cap like a small bald head.',
      'Saying: the bollard keeps the carts out and the gnomes in, and nobody has ever asked the bollard how it feels about that.',
      'Tip: lean on the gold band, not the cap. The cap is for show, and the band is what the council actually paid for.',
      'Joke: a bollard is the only gnome in the square that has never once been late for anything, because it has never once gone anywhere.',
      'The paint on the third one from the fountain has been scraped down to bare iron, in the shape of a small hand.',
    ],
    parts: [
      { s: 'cyl', d: [0.16, 0.16, 0.08], at: [0, 0.04, 0], c: 'leaf-dark', seg: 8 },
      { s: 'cyl', d: [0.12, 0.14, 0.84], at: [0, 0.48, 0], c: 'leaf-dark', seg: 8 },
      { s: 'ring', d: [0.13, 0.025], at: [0, 0.7, 0], rot: [90, 0, 0], c: 'gold' },
      { s: 'ball', d: [0.13], scale: [1, 0.7, 1], at: [0, 0.91, 0], c: 'leaf-dark', seg: 8 },
    ],
  },
  {
    id: 'euro-lamp-post', name: 'Ornate Lamp Post', category: 'prop', uses: ['place'],
    tags: ['gta', 'euro', 'street', 'lamp', 'lantern', 'iron'], emoji: [],
    footprint: { r: 0.2, h: 4.2 },
    lights: [{ at: [0, 3.9, 0], c: 'yellow', intensity: 0.6, distance: 4 }],
    about: 'Gnome Theft Auto: the Ornate Lamp Post. Fluted dark green post on a stepped base, scrolled arm, glass lantern with a glowing core. 0.84 x 4.2 x 0.84 m. No tint.',
    examine: [
      'A tall fluted green post on a wide stepped base, with a scrolled arm and a glass lantern that glows yellow after dark.',
      'Saying: the lamp is lit by a match that was lit by a gnome who was told the lamp was lit already.',
      'Tip: the lantern glows brightest in the rain, which is the only time anyone on the street thinks to look up at it.',
      'Joke: the lamp has been switched on every evening for as long as anyone can remember, though nobody has ever seen it switched off.',
      'Scratched into the base is a date, beside it a second date, and then a long row of small dates that nobody will explain.',
    ],
    parts: [
      { s: 'cyl', d: [0.4, 0.42, 0.1], at: [0, 0.05, 0], c: 'leaf-dark', seg: 8 },
      { s: 'cyl', d: [0.3, 0.34, 0.23], at: [0, 0.205, 0], c: 'leaf-dark', seg: 8 },
      { s: 'cyl', d: [0.08, 0.1, 3.22], at: [0, 1.91, 0], c: 'leaf-dark', seg: 8 },
      { s: 'cyl', d: [0.14, 0.14, 0.08], at: [0, 3.56, 0], c: 'leaf-dark', seg: 8 },
      { s: 'ring', d: [0.2, 0.025, 180], at: [0, 3.62, 0], c: 'leaf-dark' },
      { s: 'box', d: [0.3, 0.34, 0.3], at: [0, 3.9, 0], c: 'glass' },
      { s: 'box', d: [0.18, 0.26, 0.18], at: [0, 3.9, 0], c: 'yellow', glow: true },
      { s: 'cone', d: [0.2, 0.13], at: [0, 4.125, 0], c: 'leaf-dark', seg: 8 },
    ],
  },
  {
    id: 'euro-flower-trough', name: 'Flower Trough', category: 'prop', uses: ['place'],
    tags: ['gta', 'euro', 'street', 'flower', 'planter', 'wood'], emoji: [],
    tint: 'blue',
    footprint: { r: 0.25, h: 0.9 },
    about: 'Gnome Theft Auto: the Flower Trough. Long painted wooden planter on short legs with red and pink geraniums and hanging ivy. Tint = the paint. 1.6 x 0.9 x 0.5 m.',
    examine: [
      'A long painted planter on short legs, packed with red and pink geraniums and a fringe of ivy hanging over the front.',
      'Saying: a geranium will flower in any soil, provided the soil is in a trough and the trough is on a balcony.',
      'Tip: water the trough from the back, so the ivy at the front does not drip on the bench and start an argument.',
      'Joke: the geraniums have been red for so long that the pink ones have given up trying to be anything else.',
      'Tucked under the ivy at one end is a small brass key, and nobody on the street can say which door it belongs to.',
    ],
    parts: [
      { s: 'box', d: [0.08, 0.24, 0.36], at: [-0.7, 0.12, 0], c: 'wood-dark', mirror: true },
      { s: 'box', d: [1.6, 0.34, 0.5], at: [0, 0.37, 0], c: 'tint' },
      { s: 'box', d: [1.52, 0.04, 0.42], at: [0, 0.49, 0], c: 'dirt' },
      { s: 'ball', d: [0.07], at: [-0.62, 0.6, -0.1], c: 'red', seg: 6 },
      { s: 'ball', d: [0.07], at: [-0.37, 0.6, 0.1], c: 'pink', seg: 6 },
      { s: 'ball', d: [0.07], at: [-0.12, 0.6, -0.1], c: 'red', seg: 6 },
      { s: 'ball', d: [0.07], at: [0.13, 0.6, 0.1], c: 'pink', seg: 6 },
      { s: 'ball', d: [0.07], at: [0.38, 0.6, -0.1], c: 'red', seg: 6 },
      { s: 'ball', d: [0.07], at: [0.62, 0.6, 0.1], c: 'pink', seg: 6 },
      { s: 'box', d: [0.3, 0.26, 0.08], at: [-0.6, 0.4, 0.28], c: 'leaf' },
      { s: 'box', d: [0.3, 0.26, 0.08], at: [-0.2, 0.4, 0.28], c: 'leaf-dark' },
      { s: 'box', d: [0.3, 0.26, 0.08], at: [0.2, 0.4, 0.28], c: 'leaf' },
      { s: 'box', d: [0.3, 0.26, 0.08], at: [0.6, 0.4, 0.28], c: 'leaf-dark' },
    ],
  },
  {
    id: 'euro-iron-railing', name: 'Wrought-Iron Railing', category: 'prop', uses: ['place'],
    tags: ['gta', 'euro', 'street', 'railing', 'iron', 'fence'], emoji: [],
    about: 'Gnome Theft Auto: the Wrought-Iron Railing. One black 2 m section: top and bottom rails, eight spiked bars and a scroll between each pair. 2.0 x 1.1 x 0.12 m. No tint.',
    examine: [
      'A black iron railing section with a top and bottom rail, eight thin spiked bars, and a curl of scroll between each pair.',
      'Saying: iron railings were once fences of spears, and the spears have been polished into something that only looks sharp.',
      'Tip: lean on the top rail, never the spears. The spears are polished for looks and the rail is for holding.',
      'Joke: the railing keeps people off the grass, and then it keeps the grass off the people, as a point of civic pride.',
      'One bar near the end has been bent back at the top, and it has been bent that way so long it is now the official shape.',
    ],
    parts: [
      { s: 'box', d: [2.0, 0.04, 0.04], at: [0, 0.04, 0], c: 'black' },
      { s: 'box', d: [2.0, 0.04, 0.04], at: [0, 1.06, 0], c: 'black' },
      ...railBars(),
      ...railScrolls(),
    ],
  },
  {
    id: 'euro-fountain', name: 'Square Fountain', category: 'prop', uses: ['place'],
    tags: ['gta', 'euro', 'street', 'fountain', 'stone', 'water'], emoji: [],
    footprint: { r: 2, h: 1.0 },
    about: 'Gnome Theft Auto: the Square Fountain. Round stone basin with a rim hoop, blue water, a central column with two bowls and a clay gnome spouting water. 4 x 3.1 x 4 m.',
    examine: [
      'A round stone basin with an iron hoop for a rim, a column of two bowls, and a fat clay gnome on top spouting blue water.',
      'Saying: the fountain has been running since the Tall Ones were young, and it has never once been asked to stop.',
      'Tip: the coins in the water are wishes. Only take the ones you have dropped yourself, or the water will notice.',
      'Joke: the statue has been pointing at the same gnome for years, and the gnome has been pretending not to notice for just as long.',
      'The gnome statue has one ear that is shinier than the other, from years of passing gnomes who rub it for luck.',
    ],
    parts: [
      { s: 'cyl', d: [2.0, 2.0, 0.5], at: [0, 0.25, 0], c: 'stone', seg: 12 },
      { s: 'ring', d: [1.96, 0.06], at: [0, 0.54, 0], rot: [90, 0, 0], c: 'stone' },
      { s: 'cyl', d: [1.85, 1.85, 0.2], at: [0, 0.46, 0], c: 'glaze-blue', seg: 12 },
      { s: 'cyl', d: [0.16, 0.2, 1.9], at: [0, 1.25, 0], c: 'stone', seg: 8 },
      { s: 'cyl', d: [0.6, 0.35, 0.12], at: [0, 1.5, 0], c: 'stone', seg: 8 },
      { s: 'cyl', d: [0.4, 0.22, 0.1], at: [0, 2.0, 0], c: 'stone', seg: 8 },
      { s: 'ball', d: [0.2], scale: [1, 1.3, 1], at: [0, 2.3, 0], c: 'clay', seg: 8 },
      { s: 'ball', d: [0.12], at: [0, 2.66, 0], c: 'clay', seg: 8 },
      { s: 'cone', d: [0.1, 0.2], at: [0, 2.74, 0], c: 'red', seg: 8 },
      { s: 'pill', d: [0.03, 0.3], at: [0.15, 2.95, 0], rot: [0, 0, -30], c: 'water', glow: true, seg: 6 },
      { s: 'cyl', d: [0.06, 0.06, 0.02], at: [0.6, 0.575, 0.5], c: 'gold', seg: 8 },
      { s: 'cyl', d: [0.06, 0.06, 0.02], at: [-0.8, 0.575, 0.3], c: 'gold', seg: 8 },
      { s: 'cyl', d: [0.06, 0.06, 0.02], at: [0.2, 0.575, -0.9], c: 'gold', seg: 8 },
    ],
  },
];
