// Gnome Theft Auto: European kit (E29, docs/roadmaps/gta-batch-3/E29/): the three drivable cars of the old-town yard.
// Ids, seats and wheel / door / steer pivots are a contract with the game's config (VEHICLES): do not move them.
import type { PrefabDef, Part } from '../types';

const TYRE = 0x222222;
const SMOKE = 0x77716b;
const DENT = 0x3b3b3b;
const BUNTING_RED = 0xb0372f;
const BUNTING_WHITE = 0xf3efe6;

/** A grey smoke column of three puffs starting at (x, y, z). */
const smoke = (x: number, y: number, z: number, s = 1): Part[] => [
  { s: 'ball', d: [0.09 * s], at: [x, y, z], c: SMOKE, alpha: 0.6, seg: 6 },
  { s: 'ball', d: [0.12 * s], at: [x + 0.03 * s, y + 0.16 * s, z - 0.02 * s], c: SMOKE, alpha: 0.45, seg: 6 },
  { s: 'ball', d: [0.15 * s], at: [x - 0.02 * s, y + 0.34 * s, z + 0.03 * s], c: SMOKE, alpha: 0.3, seg: 6 },
];

/** Vertical corrugation ribs on one side of the Crepe Van body (x = side * 0.445), skipping any z in `skip`. */
const ribs = (side: 1 | -1, skip: (z: number) => boolean): Part[] => {
  const out: Part[] = [];
  for (let i = 0; i < 10; i++) {
    const z = Math.round((-0.7 + i * 0.1) * 100) / 100;
    if (skip(z)) continue;
    out.push({ s: 'box', d: [0.05, 0.5, 0.03], at: [side * 0.445, 0.51, z], c: 'tint' });
  }
  return out;
};

/** Little bunting flags hanging off the end of the crepe flap. */
const bunting = (): Part[] =>
  [0, 1, 2, 3, 4].map((i): Part => ({
    s: 'box', d: [0.02, 0.06, 0.05], at: [-0.63, 0.75, -0.21 + i * 0.07],
    c: i % 2 === 0 ? BUNTING_RED : BUNTING_WHITE,
  }));

export const GTA_EURO_FLEET: readonly PrefabDef[] = [
  // ---- Petit Pois: a tiny pea-green city hatchback ------------------------------------------------------------------
  {
    id: 'gta-euro-hatch', name: 'Petit Pois', category: 'prop', uses: ['place', 'sit'],
    tags: ['hatchback', 'car', 'small', 'city', 'pea', 'green', 'vehicle', 'seat', 'ride', 'gta', 'euro'], emoji: [],
    tint: 0x8fbf4a,
    trim: 0xf3efe6,
    seat: [0.15, 0.22, -0.08],
    pivots: {
      'wheel-0': [-0.33, 0.1, -0.36], 'wheel-1': [0.33, 0.1, -0.36],
      'wheel-2': [-0.33, 0.1, 0.36], 'wheel-3': [0.33, 0.1, 0.36],
      'door-left': [0.355, 0.32, 0.17], 'door-right': [-0.355, 0.32, 0.17],
    },
    about: 'Gnome Theft Auto: the Petit Pois, a tiny city hatchback. Pea-green body (tint), white roof and stripe (trim), glass cabin, a pea-pod roof box with three peas, wheel-0..3 pivots and door-left / door-right pivots. Nose +z.',
    examine: [
      'A tiny pea-green hatchback with a white roof, round lamps, a spare wheel on the tailgate and a pea pod on top.',
      'Saying: a small car fits every gap, and every gap has a small car in it already.',
      'Tip: it turns in its own length, so take the corners as if the road were a very polite queue.',
      'Joke: the pod on the roof is not a luggage box. The three peas inside are the previous owners.',
      'A tiny handwritten note under the wiper asks the car to please stop parking in the same impossible gap.',
    ],
    parts: [
      { s: 'box', d: [0.7, 0.2, 1.1], at: [0, 0.22, 0], c: 'tint', name: 'body' },
      { s: 'box', d: [0.6, 0.26, 0.6], at: [0, 0.45, -0.12], c: 'glass', name: 'cabin' },
      { s: 'box', d: [0.66, 0.04, 0.66], at: [0, 0.6, -0.12], c: 'trim', name: 'roof' },
      { s: 'wedge', d: [0.66, 0.12, 0.35], rot: [0, 180, 0], at: [0, 0.375, 0.375], c: 'tint', name: 'bonnet' },
      { s: 'ball', d: [0.055], at: [-0.2, 0.26, 0.57], c: 'spark', glow: true, seg: 8, mirror: true },
      { s: 'box', d: [0.5, 0.04, 0.08], at: [0, 0.33, -0.57], c: 'trim', name: 'stripe' },
      { s: 'cyl', d: [0.07, 0.07, 0.08], rot: [90, 0, 0], at: [0, 0.2, -0.57], c: TYRE, seg: 10, name: 'spare' },
      { s: 'box', d: [0.14, 0.04, 0.46], at: [0, 0.65, -0.12], c: 0x5fa83a, name: 'pod' },
      { s: 'ball', d: [0.05], at: [0, 0.7, -0.28], c: 0x7fd04a, seg: 6, name: 'pea-a' },
      { s: 'ball', d: [0.05], at: [0, 0.7, -0.12], c: 0x7fd04a, seg: 6, name: 'pea-b' },
      { s: 'ball', d: [0.05], at: [0, 0.7, 0.04], c: 0x7fd04a, seg: 6, name: 'pea-c' },
      { s: 'ring', d: [0.07, 0.015], rot: [-60, 0, 0], at: [0.15, 0.42, 0.1], c: 'black', seg: 10, name: 'wheel-ring' },
      { s: 'box', d: [0.2, 0.06, 0.2], at: [0.15, 0.34, -0.08], c: 'black' },
      { s: 'box', d: [0.2, 0.06, 0.2], at: [-0.15, 0.34, -0.08], c: 'black' },
      // Doors (hinged at the front edge, z 0.17): outer faces at x +-0.375, 0.025 proud of the body sides.
      { s: 'box', d: [0.03, 0.3, 0.34], at: [0.36, 0.32, 0], c: 'tint', group: 'door-left' },
      { s: 'box', d: [0.06, 0.12, 0.22], at: [0.395, 0.38, 0], c: 'glass', group: 'door-left' },
      { s: 'box', d: [0.03, 0.3, 0.34], at: [-0.36, 0.32, 0], c: 'tint', group: 'door-right' },
      { s: 'box', d: [0.06, 0.12, 0.22], at: [-0.395, 0.38, 0], c: 'glass', group: 'door-right' },
      { s: 'cyl', d: [0.1, 0.1, 0.07], rot: [0, 0, 90], at: [-0.33, 0.1, -0.36], c: TYRE, seg: 10, group: 'wheel-0' },
      { s: 'cyl', d: [0.1, 0.1, 0.07], rot: [0, 0, 90], at: [0.33, 0.1, -0.36], c: TYRE, seg: 10, group: 'wheel-1' },
      { s: 'cyl', d: [0.1, 0.1, 0.07], rot: [0, 0, 90], at: [-0.33, 0.1, 0.36], c: TYRE, seg: 10, group: 'wheel-2' },
      { s: 'cyl', d: [0.1, 0.1, 0.07], rot: [0, 0, 90], at: [0.33, 0.1, 0.36], c: TYRE, seg: 10, group: 'wheel-3' },
    ],
    damage: [
      {
        name: 'dented', darken: 0.25,
        morph: { bonnet: { rot: [0, 0, 5] } },
        add: [{ s: 'box', d: [0.14, 0.03, 0.05], at: [0.1, 0.45, 0.38], c: DENT }],
      },
      {
        name: 'wrecked', darken: 0.6, sink: 0.04,
        hide: ['wheel-1'],
        morph: { bonnet: { rot: [0, 0, 8] }, pod: { rot: [0, 0, 14] }, spare: { rot: [0, 0, 20] } },
        add: [...smoke(0, 0.7, 0.3, 1)],
      },
    ],
  },

  // ---- Deux-Pots: a boxy corrugated tin snail with a roll-back canvas roof -------------------------------------------
  {
    id: 'gta-deux-pots', name: 'Deux-Pots', category: 'prop', uses: ['place', 'sit'],
    tags: ['tin', 'snail', 'car', 'corrugated', 'canvas', 'convertible', 'onions', 'vehicle', 'seat', 'ride', 'gta', 'euro'], emoji: [],
    tint: 0x9aa3ab,
    trim: 0xb0372f,
    seat: [0.16, 0.24, -0.12],
    pivots: {
      'wheel-0': [-0.36, 0.11, -0.42], 'wheel-1': [0.36, 0.11, -0.42],
      'wheel-2': [-0.36, 0.11, 0.42], 'wheel-3': [0.36, 0.11, 0.42],
      steer: [0.16, 0.45, 0.15],
    },
    about: 'Gnome Theft Auto: the Deux-Pots. A boxy grey tin car (tint) with a ribbed bonnet, stalk headlamps, bulging wings, skinny wheels, a furled red canvas roof (trim) at the back, an onion basket and a steering wheel (steer). Nose +z.',
    examine: [
      'A boxy grey tin car with a ribbed bonnet, lamps on stalks, bulging wings, skinny wheels and a canvas roof rolled up behind the seats.',
      'Saying: a car that leans in the corners is only agreeing with the road.',
      'Tip: roll the roof back before the rain, not after. The rain has opinions about timing.',
      'Joke: it has two pots and a great deal of confidence, which is enough for any hill that does not go up.',
      'The basket at the back holds onions and a note that says the onions are not for sale, only for company.',
    ],
    parts: [
      { s: 'box', d: [0.62, 0.24, 1.2], at: [0, 0.31, 0], c: 'tint', name: 'body' },
      { s: 'box', d: [0.52, 0.2, 0.4], at: [0, 0.52, 0.45], c: 'tint', name: 'bonnet' },
      { s: 'box', d: [0.03, 0.04, 0.36], at: [-0.18, 0.63, 0.45], c: 'tint' },
      { s: 'box', d: [0.03, 0.04, 0.36], at: [-0.06, 0.63, 0.45], c: 'tint' },
      { s: 'box', d: [0.03, 0.04, 0.36], at: [0.06, 0.63, 0.45], c: 'tint' },
      { s: 'box', d: [0.03, 0.04, 0.36], at: [0.18, 0.63, 0.45], c: 'tint' },
      { s: 'box', d: [0.62, 0.14, 0.06], at: [0, 0.5, 0.24], c: 'tint', name: 'dash' },
      { s: 'box', d: [0.03, 0.2, 0.03], at: [-0.3, 0.67, 0.24], c: 'black' },
      { s: 'box', d: [0.03, 0.2, 0.03], at: [0.3, 0.67, 0.24], c: 'black' },
      { s: 'box', d: [0.57, 0.17, 0.02], rot: [-15, 0, 0], at: [0, 0.68, 0.24], c: 'glass', name: 'windscreen' },
      { s: 'box', d: [0.2, 0.1, 0.18], at: [0.16, 0.475, -0.12], c: 'black' },
      { s: 'box', d: [0.2, 0.1, 0.18], at: [-0.16, 0.475, -0.12], c: 'black' },
      { s: 'box', d: [0.2, 0.18, 0.04], at: [0.16, 0.58, -0.24], c: 'black' },
      { s: 'box', d: [0.2, 0.18, 0.04], at: [-0.16, 0.58, -0.24], c: 'black' },
      { s: 'box', d: [0.56, 0.1, 0.18], at: [0, 0.47, -0.41], c: 'black', name: 'bench' },
      { s: 'box', d: [0.6, 0.18, 0.04], at: [0, 0.6, -0.5], c: 'black' },
      { s: 'pill', d: [0.09, 0.5], rot: [0, 0, 90], at: [0, 0.76, -0.54], c: 'trim', seg: 8, name: 'roof' },
      { s: 'box', d: [0.62, 0.3, 0.06], at: [0, 0.58, -0.62], c: 'trim', name: 'canvas-rear' },
      { s: 'ball', d: [0.13], scale: [0.4, 0.7, 1.6], at: [-0.33, 0.27, 0.42], c: 'tint', seg: 8, mirror: true, name: 'wing' },
      { s: 'cyl', d: [0.015, 0.015, 0.12], at: [-0.24, 0.66, 0.5], c: 'black', seg: 6, mirror: true },
      { s: 'ball', d: [0.07], at: [-0.24, 0.76, 0.5], c: 'spark', glow: true, seg: 8, mirror: true, name: 'lamp' },
      { s: 'box', d: [0.2, 0.14, 0.16], at: [-0.17, 0.54, -0.405], c: 0xb98a4a, name: 'basket' },
      { s: 'ball', d: [0.05], at: [-0.24, 0.63, -0.4], c: 0xd9b25f, seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.17, 0.63, -0.4], c: 0xd9b25f, seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.1, 0.63, -0.4], c: 0xd9b25f, seg: 6 },
      { s: 'cyl', d: [0.12, 0.12, 0.04], rot: [0, 0, 90], at: [-0.36, 0.11, -0.42], c: TYRE, seg: 10, group: 'wheel-0' },
      { s: 'cyl', d: [0.12, 0.12, 0.04], rot: [0, 0, 90], at: [0.36, 0.11, -0.42], c: TYRE, seg: 10, group: 'wheel-1' },
      { s: 'cyl', d: [0.12, 0.12, 0.04], rot: [0, 0, 90], at: [-0.36, 0.11, 0.42], c: TYRE, seg: 10, group: 'wheel-2' },
      { s: 'cyl', d: [0.12, 0.12, 0.04], rot: [0, 0, 90], at: [0.36, 0.11, 0.42], c: TYRE, seg: 10, group: 'wheel-3' },
      { s: 'cyl', d: [0.012, 0.012, 0.2], rot: [-60, 0, 0], at: [0.16, 0.4, 0.07], c: 'black', seg: 6, group: 'steer' },
      { s: 'ring', d: [0.08, 0.015], rot: [-60, 0, 0], at: [0.16, 0.45, 0.15], c: 'black', seg: 10, group: 'steer' },
    ],
    damage: [
      {
        name: 'dented', darken: 0.25,
        morph: { lamp: { rot: [0, 0, 10] } },
        add: [{ s: 'box', d: [0.16, 0.03, 0.05], at: [0.1, 0.63, 0.5], c: DENT }],
      },
      {
        name: 'wrecked', darken: 0.6, sink: 0.04,
        hide: ['wheel-1'],
        morph: { bonnet: { rot: [0, 0, 6] }, roof: { rot: [0, 0, 10] }, steer: { rot: [0, 0, 22] } },
        add: [...smoke(0, 0.8, 0.4, 1)],
      },
    ],
  },

  // ---- Crepe Van: a ribbed grey food van with a serving hatch ----------------------------------------------------------
  {
    id: 'gta-crepe-van', name: 'Crepe Van', category: 'prop', uses: ['place', 'sit'],
    tags: ['crepe', 'van', 'food', 'truck', 'corrugated', 'pancake', 'vehicle', 'seat', 'ride', 'gta', 'euro'], emoji: [],
    tint: 0x7d8a93,
    trim: 0xe8c547,
    seat: [0.18, 0.3, 0.42],
    pivots: {
      'wheel-0': [-0.4, 0.11, -0.5], 'wheel-1': [0.4, 0.11, -0.5],
      'wheel-2': [-0.4, 0.11, 0.5], 'wheel-3': [0.4, 0.11, 0.5],
      'door-left': [0.445, 0.42, 0.62], 'door-right': [-0.445, 0.42, 0.62],
    },
    about: 'Gnome Theft Auto: the Crepe Van. A ribbed grey food van (tint) with a snub nose, a glass cab, a serving hatch on the -x side with a yellow flap (trim), counter, griddle, crepe and bunting, and a menu board on the roof. Nose +z.',
    examine: [
      'A ribbed grey food van with a snub nose, a serving hatch on one side and a yellow flap propped up on a stick.',
      'Saying: a crepe is a promise, and the promise is that you will wait for it.',
      'Tip: stand on the hatch side. The driver side only has a door and no crepes, which is a design choice.',
      'Joke: the menu board has forty items and the van has made one, and nobody dares to ask why.',
      'The bunting on the flap is a different colour every day, and always the colours of a flag nobody can place.',
    ],
    parts: [
      { s: 'box', d: [0.86, 0.62, 1.1], at: [0, 0.51, -0.2], c: 'tint', name: 'body' },
      { s: 'box', d: [0.86, 0.22, 0.38], at: [0, 0.31, 0.52], c: 'tint', name: 'nose' },
      { s: 'box', d: [0.8, 0.31, 0.4], at: [0, 0.575, 0.54], c: 'glass', name: 'windscreen' },
      { s: 'box', d: [0.84, 0.05, 0.44], at: [0, 0.745, 0.54], c: 'tint', name: 'cab-roof' },
      ...ribs(1, () => false),
      ...ribs(-1, (z) => z >= -0.25 && z <= 0.11),
      { s: 'ball', d: [0.05], scale: [1, 1, 0.5], at: [-0.28, 0.32, 0.725], c: 'spark', glow: true, seg: 8, mirror: true },
      { s: 'box', d: [0.05, 0.26, 0.3], at: [-0.445, 0.5, -0.07], c: 'black', name: 'hatch' },
      { s: 'box', d: [0.1, 0.03, 0.34], at: [-0.52, 0.38, -0.07], c: 'trim', name: 'counter' },
      { s: 'cyl', d: [0.09, 0.09, 0.02], at: [-0.52, 0.405, -0.07], c: 'black', seg: 10, name: 'griddle' },
      { s: 'cyl', d: [0.07, 0.07, 0.02], at: [-0.52, 0.43, -0.07], c: 0xe2b46a, seg: 10, name: 'crepe' },
      { s: 'box', d: [0.03, 0.24, 0.34], rot: [0, 0, 50], at: [-0.542, 0.717, -0.07], c: 'trim', name: 'flap' },
      ...bunting(),
      { s: 'box', d: [0.5, 0.14, 0.04], rot: [-10, 0, 0], at: [0, 0.93, -0.2], c: 0x2f4a3a, name: 'menu' },
      { s: 'box', d: [0.94, 0.04, 1.2], at: [0, 0.83, -0.2], c: 'trim', name: 'roof-strip' },
      { s: 'cyl', d: [0.11, 0.11, 0.08], rot: [0, 0, 90], at: [-0.4, 0.11, -0.5], c: TYRE, seg: 10, group: 'wheel-0' },
      { s: 'cyl', d: [0.11, 0.11, 0.08], rot: [0, 0, 90], at: [0.4, 0.11, -0.5], c: TYRE, seg: 10, group: 'wheel-1' },
      { s: 'cyl', d: [0.11, 0.11, 0.08], rot: [0, 0, 90], at: [-0.4, 0.11, 0.5], c: TYRE, seg: 10, group: 'wheel-2' },
      { s: 'cyl', d: [0.11, 0.11, 0.08], rot: [0, 0, 90], at: [0.4, 0.11, 0.5], c: TYRE, seg: 10, group: 'wheel-3' },
      { s: 'box', d: [0.03, 0.34, 0.34], at: [0.45, 0.42, 0.45], c: 'tint', group: 'door-left' },
      { s: 'box', d: [0.03, 0.34, 0.34], at: [-0.45, 0.42, 0.45], c: 'tint', group: 'door-right' },
    ],
    damage: [
      {
        name: 'dented', darken: 0.25,
        morph: { flap: { rot: [0, 0, 8] } },
        add: [{ s: 'box', d: [0.04, 0.12, 0.2], at: [0.45, 0.65, -0.3], c: DENT }],
      },
      {
        name: 'wrecked', darken: 0.6, sink: 0.04,
        hide: ['wheel-1'],
        morph: { flap: { rot: [0, 0, 25] }, menu: { rot: [0, 0, 14] }, nose: { rot: [4, 0, 0] } },
        add: [...smoke(0, 0.95, 0.4, 1.1)],
      },
    ],
  },
];
