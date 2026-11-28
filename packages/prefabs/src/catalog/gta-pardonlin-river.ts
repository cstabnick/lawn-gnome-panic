// Gnome Theft Auto: Pardonlin, the Thymes' quays (quay wall, stairs, bouquiniste boxes, moored boats, bridge parapet,
// the padlock railing) (FX09, docs/roadmaps/gta-batch-3/review/fix/FX09/).
//
// Modelling notes. The quay pieces are placed by games/gnome-theft-auto/src/pardonlin/districts/thymes.ts, which sinks them
// so the coping lies 0.06 m above the quay ground: a wall piece is WALL_H tall, its water-side face is at local z = 0 and
// its body runs back to z = -2.9. The water sits 1.8 m below the quay ground (WATER.courses.thymes.freeboard), so a piece's
// waterline is at local y = WALL_H - 1.86. Boats are modelled keel at y = 0, nose +z, and float 0.4 m deep; their rope runs
// out of the +x side to a mooring eye on the wall one metre away.
import type { Part, PrefabDef } from '../types';

const WALL_H = 3.2;

// Dressed stone: a plinth, five courses (the odd ones stand 3 cm proud, their joints staggered) and a coping slab.
const wallCourses = (): Part[] => {
  const out: Part[] = [{ s: 'box', d: [4.2, 0.5, 2.95], at: [0, 0.25, -1.425], c: 'stone-dark' }];
  for (let i = 0; i < 5; i++) {
    const y = 0.75 + i * 0.5;
    const f = i % 2 ? 0.03 : 0;
    out.push({ s: 'box', d: [4.2, 0.48, 2.9 + f], at: [0, y, -1.45 + f / 2], c: i % 2 ? 'trim' : 'tint' });
    for (const x of i % 2 ? [-1.5, 0.6] : [-0.55, 1.45]) {
      out.push({ s: 'box', d: [0.03, 0.48, 0.03], at: [x, y, f + 0.012], c: 'stone-dark' });
    }
  }
  return out;
};

// Rough blocks for the Jardin's mossy bank: a toe of three uneven courses, 1.5 m deep, that stops 0.9 m above the
// water; the earth bank rises behind it (placed so its top meets the ramp the Thymes' carve leaves).
const roughCourses = (): Part[] => {
  const out: Part[] = [{ s: 'box', d: [4.2, 0.5, 1.55], at: [0, 0.25, -0.725], c: 'stone-dark' }];
  const splits = [-0.7, 0.9, -0.3];
  for (let i = 0; i < 3; i++) {
    const y = 0.75 + i * 0.5;
    const s = splits[i];
    const lw = 2.1 + s, rw = 2.1 - s;
    out.push({ s: 'box', d: [lw, 0.48, 1.5 + (i % 2 ? 0.05 : 0)], at: [-2.1 + lw / 2, y, -0.75 + (i % 2 ? 0.025 : 0)], c: i % 2 ? 'trim' : 'tint' });
    out.push({ s: 'box', d: [rw, 0.48, 1.5 + (i % 2 ? 0 : 0.05)], at: [2.1 - rw / 2, y, -0.75 + (i % 2 ? 0 : 0.025)], c: i % 2 ? 'tint' : 'trim' });
  }
  return out;
};

// Parapet balusters: nine little stone posts between the base and the rail.
const balusters = (): Part[] => Array.from({ length: 9 }, (_, i): Part => ({
  s: 'cyl', d: [0.065, 0.075, 0.6], at: [-1.2 + i * 0.3, 0.55, 0], c: 'trim', seg: 6,
}));

// The river stairs: they run along the wall's face, down toward +x, standing in the water in front of it (the quay ground
// behind the wall cannot be cut, so the stair is built out instead). Five steps 0.48 m long, then a wet landing 0.15 m above the water.
const stairSteps = (): Part[] => {
  const out: Part[] = [];
  for (let i = 0; i < 5; i++) {
    const top = WALL_H - 0.28 * (i + 1);
    out.push({ s: 'box', d: [0.48, top, 1.25], at: [-2.1 + 0.24 + 0.48 * i, top / 2, 0.575], c: i % 2 ? 'stone' : 'sand' });
  }
  const land = WALL_H - 0.28 * 6;
  out.push({ s: 'box', d: [1.8, land, 1.4], at: [1.2, land / 2, 0.65], c: 'stone-dark' });
  out.push({ s: 'box', d: [1.8, 0.03, 0.12], at: [1.2, land + 0.015, 1.3], c: 'leaf-dark' });
  return out;
};

// Book spines in blocks in the open box: [x, height, colour].
const BOX_BOOKS: readonly (readonly [number, number, string])[] = [
  [-0.86, 0.24, 'red'], [-0.66, 0.2, 'blue'], [-0.46, 0.27, 'leather'], [-0.26, 0.21, 'cloth'], [-0.06, 0.25, 'brass'],
  [0.14, 0.19, 'green'], [0.34, 0.26, 'purple'], [0.54, 0.22, 'wood-light'], [0.74, 0.25, 'black'], [0.9, 0.18, 'sand'],
];

// A point on the propped-open lid, `t` metres up the lid from its hinge and `x` along it, lifted `n` off its inner face.
// The lid is hinged on the back edge of the box and propped 100 degrees back.
const lidPoint = (x: number, t: number, n: number): [number, number, number] => {
  const a = (100 * Math.PI) / 180;
  // Along the lid: (0, sin a, cos a). Out of its inner face: (0, -cos a, sin a), which points forward and a little up.
  return [x, 0.96 + Math.sin(a) * t - Math.cos(a) * n, -0.3 + Math.cos(a) * t + Math.sin(a) * n];
};

const openBox = (): Part[] => [
  { s: 'box', d: [0.06, 0.52, 0.06], at: [0.92, 0.26, 0.19], c: 'iron-dark', mirror: true },
  { s: 'box', d: [0.06, 0.52, 0.06], at: [0.92, 0.26, -0.19], c: 'iron-dark', mirror: true },
  { s: 'box', d: [2.0, 0.42, 0.58], at: [0, 0.73, 0], c: 'tint' },
  { s: 'box', d: [2.04, 0.04, 0.62], at: [0, 0.96, 0], c: 'trim' },
  { s: 'box', d: [1.9, 0.02, 0.48], at: [0, 0.945, 0], c: 'leather-dark' },
  ...BOX_BOOKS.map(([x, h, c]): Part => ({ s: 'box', d: [0.17, h, 0.34], at: [x, 0.94 + h / 2, -0.04], c: c as Part['c'] })),
  { s: 'box', d: [0.28, 0.04, 0.2], at: [0.28, 1.0, 0.18], rot: [0, 25, 0], c: 'paper' },
];

const lidOpen = (): Part[] => {
  const lid: Part = { s: 'box', d: [2.04, 0.04, 0.6], at: lidPoint(0, 0.3, 0), rot: [-100, 0, 0], c: 'tint' };
  const prints: Part[] = [
    { s: 'box', d: [0.42, 0.34, 0.01], at: lidPoint(-0.62, 0.3, 0.03), rot: [-100, 0, 0], c: 'sand' },
    { s: 'box', d: [0.32, 0.26, 0.01], at: lidPoint(-0.1, 0.34, 0.03), rot: [-100, 0, 0], c: 'glaze-blue' },
    { s: 'box', d: [0.36, 0.3, 0.01], at: lidPoint(0.42, 0.3, 0.03), rot: [-100, 0, 0], c: 'honey' },
    { s: 'box', d: [0.26, 0.2, 0.01], at: lidPoint(0.84, 0.36, 0.03), rot: [-100, 0, 0], c: 'petal' },
    { s: 'box', d: [0.2, 0.16, 0.01], at: lidPoint(0.2, 0.1, 0.03), rot: [-100, 0, 0], c: 'chalk' },
  ];
  // Two brass hinges and a little brass stay.
  const hinge: Part = { s: 'box', d: [0.14, 0.05, 0.04], at: [0.8, 0.96, -0.3], c: 'brass', mirror: true };
  return [lid, ...prints, hinge];
};

// Laundry on the péniche's line: [z, height, colour].
const LAUNDRY: readonly (readonly [number, number, string])[] = [
  [-0.4, 0.62, 'white'], [0.1, 0.45, 'red'], [0.6, 0.7, 'blue'], [1.05, 0.36, 'yellow'], [1.5, 0.56, 'pink'], [2.0, 0.3, 'white'], [2.5, 0.66, 'green'],
];
const laundry = (): Part[] => LAUNDRY.map(([z, h, c]): Part => ({
  s: 'box', d: [0.025, h, 0.34], at: [0, 2.25 - h / 2 - 0.02, z], c: c as Part['c'],
}));

// Padlocks on the railing: [x, y, colour]. Pairs about x = 0 (mirror) and loners down the middle.
const LOCKS: readonly (readonly [number, number, string])[] = [
  [0.1, 1.0, 'red'], [0.26, 0.82, 'brass'], [0.42, 0.98, 'blue'], [0.58, 0.7, 'green'], [0.74, 0.9, 'gold'], [0.9, 0.62, 'purple'],
  [1.06, 0.96, 'pink'], [1.22, 0.74, 'orange'], [1.38, 0.88, 'silver'], [1.54, 0.55, 'red'], [1.66, 0.99, 'blue'], [0.34, 0.5, 'yellow'],
  [0.66, 0.46, 'brass'], [1.0, 0.4, 'green'], [1.3, 0.48, 'pink'],
];
const padlocks = (): Part[] => [
  ...LOCKS.map(([x, y, c], i): Part => ({
    s: 'box', d: [0.07, 0.085, 0.075], at: [x, y, i % 2 ? 0.01 : -0.01], c: c as Part['c'], mirror: true,
  })),
  { s: 'box', d: [0.08, 0.1, 0.08], at: [0, 0.75, 0], c: 'gold' },
  { s: 'box', d: [0.07, 0.085, 0.075], at: [0.04, 0.3, 0], c: 'ruby' },
  { s: 'box', d: [0.07, 0.085, 0.075], at: [-0.04, 0.58, 0], c: 'sapphire' },
];

// Everything the wall and the stairs share: courses, paved coping, waterline stain, the mooring eye (and moss patches).
const wallBody = (moss: boolean): Part[] => [
  ...wallCourses(),
  { s: 'box', d: [4.3, 0.2, 3.02], at: [0, 3.1, -1.39], c: 0xbdb6a8 },
  { s: 'box', d: [0.03, 0.012, 2.9], at: [-1.4, 3.2, -1.45], c: 'stone-dark' },
  { s: 'box', d: [0.03, 0.012, 2.9], at: [0, 3.2, -1.45], c: 'stone-dark' },
  { s: 'box', d: [0.03, 0.012, 2.9], at: [1.4, 3.2, -1.45], c: 'stone-dark' },
  { s: 'box', d: [4.3, 0.012, 0.03], at: [0, 3.2, -1.3], c: 'stone-dark' },
  { s: 'box', d: [4.3, 0.04, 0.05], at: [0, 3.2, 0.11], c: 0xe4ded0 },
  { s: 'box', d: [4.2, 0.34, 0.025], at: [0, 1.38, 0.0125], c: 'stone-dark' },
  { s: 'ring', d: [0.1, 0.016], at: [-1.2, 2.5, 0.05], c: 'iron-dark' },
  { s: 'box', d: [0.18, 0.18, 0.04], at: [-1.2, 2.6, 0.03], c: 'iron-dark' },
  ...(moss ? [
    { s: 'ball', d: [0.22], scale: [1.4, 0.4, 0.2], at: [1.3, 1.5, 0.03], c: 'moss', seg: 6 } as Part,
    { s: 'ball', d: [0.18], scale: [1.3, 0.4, 0.2], at: [0.5, 0.95, 0.03], c: 'leaf-dark', seg: 6 } as Part,
  ] : []),
];

export const GTA_PARDONLIN_RIVER: readonly PrefabDef[] = [
  {
    id: 'pl-quay-wall', name: 'Quay Wall', category: 'prop', uses: ['place'],
    tint: 'stone', trim: 0xa8a297,
    footprint: { r: 2.1, h: 3.2 },
    tags: ['gta', 'pardonlin', 'quay', 'wall', 'stone', 'river', 'thymes', 'embankment'], emoji: [],
    about: 'Gnome Theft Auto: Pardonlin quay wall. A 4.2 m piece of dressed stone, 3.2 m tall and 2.9 m deep with a paved coping slab, water-side face at z = 0 and a mooring eye on it. Tint is the stone, trim the paler courses.',
    examine: [
      'A wall of dressed stone, laid in courses, with a coping slab on top and an iron ring set into the face for tying up anything that floats.',
      'Saying: the Thymes was put in a stone box so that it would stay where it was put, and it has stayed there out of politeness.',
      'Tip: do not lean over the coping to look at the water. The water looks back, and it is usually unimpressed.',
      'Joke: the wall is older than the river, say the Continentals, which is a hard claim to make about a river that was only turned on in the spring.',
      'The ring has a groove worn in it by a great many ropes, and one very small groove that belongs to nobody, which the bridge warden finds restful.',
    ],
    parts: [
      ...wallBody(true),
    ],
  },
  {
    id: 'pl-quay-wall-low', name: 'Mossy Quay Bank', category: 'prop', uses: ['place'],
    tint: 'stone', trim: 0x8b8a78,
    footprint: { r: 2.1, h: 3.2 },
    tags: ['gta', 'pardonlin', 'quay', 'bank', 'stone', 'moss', 'jardin', 'river', 'thymes'], emoji: [],
    about: 'Gnome Theft Auto: the Jardin\'s mossy quay bank. A 4.2 m toe of rough uneven stone, 2.3 m tall and 1.5 m deep with a turfed lip and reed tufts at the waterline; the earth bank rises behind it. Same frame as the quay wall, so the two mix.',
    examine: [
      'A bank of rough stone blocks of no particular size, furred with moss, with a lip of turf on top and a few reeds at the foot.',
      'Saying: stone left alone long enough turns into garden, and garden left alone long enough turns back into stone, and nobody can say which stage this is.',
      'Tip: sit on the turf at the top, not on the stone below it. The stone is damp in a way that has opinions.',
      'Joke: the Jardin keeps this bank untidy on purpose, because a tidy bank would make the swans feel watched.',
      'A tin of white paint is lodged between two blocks, and the lid has been on so long it has become part of the bank.',
    ],
    parts: [
      ...roughCourses(),
      { s: 'box', d: [4.3, 0.3, 1.7], at: [0, 2.15, -0.7], c: 'leaf' },
      { s: 'box', d: [4.3, 0.08, 0.3], at: [0, 2.25, 0.02], c: 'moss' },
      { s: 'ball', d: [0.5], scale: [1.4, 0.35, 0.3], at: [-1.1, 1.9, 0.04], c: 'moss', seg: 6 },
      { s: 'ball', d: [0.4], scale: [1.5, 0.4, 0.3], at: [1.2, 1.55, 0.04], c: 'leaf-dark', seg: 6 },
      { s: 'ball', d: [0.35], scale: [1.4, 0.35, 0.3], at: [-0.2, 1.05, 0.04], c: 'moss', seg: 6 },
      { s: 'ball', d: [0.3], scale: [1.6, 0.5, 1.2], at: [0.9, 2.35, -0.3], c: 'leaf-dark', seg: 6 },
      { s: 'cone', d: [0.05, 0.9], at: [-1.6, 1.8, 0.15], rot: [8, 0, 3], c: 'leaf', seg: 4 },
      { s: 'cone', d: [0.05, 1.0], at: [-1.5, 1.85, 0.2], rot: [10, 0, -4], c: 'leaf-dark', seg: 4 },
      { s: 'cone', d: [0.05, 0.8], at: [1.7, 1.75, 0.15], rot: [6, 0, 5], c: 'leaf', seg: 4 },
      { s: 'cone', d: [0.05, 0.95], at: [1.8, 1.8, 0.2], rot: [9, 0, -3], c: 'leaf-dark', seg: 4 },
    ],
  },
  {
    id: 'pl-quay-stairs', name: 'Quay Stairs', category: 'prop', uses: ['place'],
    tint: 'stone', trim: 0xa8a297,
    footprint: { r: 2.1, h: 3.2 },
    tags: ['gta', 'pardonlin', 'quay', 'stairs', 'steps', 'landing', 'river', 'thymes'], emoji: [],
    about: 'Gnome Theft Auto: Pardonlin quay stairs. A 4.2 m piece of quay wall with river stairs built along its face: five steps down toward +x and a wet landing 1.8 x 1.4 m, 0.15 m above the water, standing out 1.4 m into the channel. Same frame as the quay wall, face at z = 0.',
    examine: [
      'Five stone steps running down the face of the quay to a wet landing at the water, with an iron bollard at each end of the coping above.',
      'Saying: the stairs go down to the water so that gnomes may go down to the water, and they go no further so that gnomes may think twice.',
      'Tip: the bottom step is slick. Hold the left wall, step on the sand-coloured stone and never on the green.',
      'Joke: the council counted the steps twice and got a different number each time, and has since declared the number to be five, to settle it.',
      'On the third step someone has chalked a small square, in which, they say, one may stand and wait for a boat without being asked to queue.',
    ],
    parts: [
      ...wallBody(false),
      ...stairSteps(),
      { s: 'cyl', d: [0.1, 0.12, 0.38], at: [-1.9, 3.4, -0.3], c: 'iron-dark', seg: 8 },
      { s: 'ball', d: [0.11], at: [-1.9, 3.62, -0.3], c: 'iron-dark', seg: 6 },
      { s: 'cyl', d: [0.1, 0.12, 0.38], at: [1.9, 3.4, -0.3], c: 'iron-dark', seg: 8 },
      { s: 'ball', d: [0.11], at: [1.9, 3.62, -0.3], c: 'iron-dark', seg: 6 },
    ],
  },
  {
    id: 'pl-bouquiniste', name: 'Bouquiniste Box', category: 'prop', uses: ['place'],
    tint: 0x2f5d3a, trim: 0x244a2e,
    footprint: { r: 1.0, h: 1.9 },
    tags: ['gta', 'pardonlin', 'bouquiniste', 'bookstall', 'books', 'prints', 'green', 'box', 'quay'], emoji: [],
    about: 'Gnome Theft Auto: a bouquiniste\'s green box, open. 2 x 0.6 m on iron legs, 1.9 m tall with the lid propped back and pinned with prints, ten blocks of books inside. Faces +z. Tint is the green.',
    examine: [
      'A green box on iron legs with the lid propped open and pinned with prints, and a row of books packed in so tight they hold each other up.',
      'Saying: the bouquiniste sells the books and keeps the weather, and it is the weather that has better stock.',
      'Tip: ask for the green one at the back. He will not have it, but he will say so beautifully.',
      'Joke: the prints in the lid are of the river, and all of them are of a slightly different river.',
      'One of the books has a pressed leaf in it, and the leaf is marking a page that has not been written yet.',
    ],
    parts: [...openBox(), ...lidOpen()],
  },
  {
    id: 'pl-bouquiniste-shut', name: 'Bouquiniste Box, Shut', category: 'prop', uses: ['place'],
    tint: 0x2f5d3a, trim: 0x244a2e,
    footprint: { r: 1.0, h: 1.1 },
    tags: ['gta', 'pardonlin', 'bouquiniste', 'bookstall', 'shut', 'padlock', 'green', 'box', 'quay'], emoji: [],
    about: 'Gnome Theft Auto: a bouquiniste\'s green box, shut and padlocked, with a note on the front. 2 x 0.6 x 1.1 m on iron legs. Faces +z. Tint is the green.',
    examine: [
      'A green box on iron legs with the lid shut, a brass padlock on the hasp, and a paper note pinned to the front.',
      'Saying: a shut box is a book that has not yet decided to be read, and a padlocked box is one that has decided not to.',
      'Tip: do not knock. The bouquiniste is at lunch, and lunch here is a place, not a time.',
      'Joke: the note says BACK IN FIVE MINUTES, and the minutes are the river\'s, and the river is slow.',
      'There is a faint smell of old paper and wet stone, which the Continentals regard as the town\'s finest perfume.',
    ],
    parts: [
      { s: 'box', d: [0.06, 0.52, 0.06], at: [0.92, 0.26, 0.19], c: 'iron-dark', mirror: true },
      { s: 'box', d: [0.06, 0.52, 0.06], at: [0.92, 0.26, -0.19], c: 'iron-dark', mirror: true },
      { s: 'box', d: [2.0, 0.42, 0.58], at: [0, 0.73, 0], c: 'tint' },
      { s: 'box', d: [2.06, 0.1, 0.64], at: [0, 1.0, 0], c: 'trim' },
      { s: 'box', d: [0.12, 0.2, 0.03], at: [0, 0.93, 0.325], c: 'iron-dark' },
      { s: 'box', d: [0.1, 0.12, 0.05], at: [0, 0.82, 0.34], c: 'brass' },
      { s: 'ring', d: [0.035, 0.008, 200], at: [0, 0.91, 0.36], rot: [0, 0, 80], c: 'steel' },
      { s: 'box', d: [0.3, 0.22, 0.01], at: [0.5, 0.72, 0.295], rot: [0, 0, 4], c: 'paper' },
      { s: 'box', d: [0.2, 0.012, 0.01], at: [0.5, 0.75, 0.302], rot: [0, 0, 4], c: 'ink' },
      { s: 'box', d: [0.17, 0.012, 0.01], at: [0.5, 0.71, 0.302], rot: [0, 0, 4], c: 'ink' },
      { s: 'box', d: [0.14, 0.04, 0.04], at: [0.8, 1.06, -0.3], c: 'brass', mirror: true },
    ],
  },
  {
    id: 'pl-bridge-parapet', name: 'Bridge Parapet', category: 'prop', uses: ['place'],
    tint: 'stone', trim: 0xcfc8b8,
    footprint: { r: 1.75, h: 1.2 },
    tags: ['gta', 'pardonlin', 'bridge', 'parapet', 'balustrade', 'stone', 'thymes'], emoji: [],
    about: 'Gnome Theft Auto: a Pardonlin bridge parapet. A 3.5 m stone balustrade, 1.05 m tall: base, nine little posts, a coping rail and a ball-capped pier at each end. Symmetrical. Tint is the stone, trim the pale posts.',
    examine: [
      'A stone balustrade of nine little posts like chess pieces, with a flat rail on top and a ball on each end pier.',
      'Saying: a bridge has two sides so that the river may be looked at from both, and the parapet is there so that it is only looked at.',
      'Tip: rest your elbows on the rail and your thoughts on the river, and let neither of them go over the edge.',
      'Joke: the parapet is exactly the height of an opinion, which is to say high enough to lean on and low enough to be wrong over.',
      'The rail is worn smooth in three places, each the width of a gnome who has stood there for a long time doing nothing in particular.',
    ],
    parts: [
      { s: 'box', d: [3.5, 0.26, 0.5], at: [0, 0.13, 0], c: 'tint' },
      ...balusters(),
      { s: 'box', d: [3.5, 0.14, 0.56], at: [0, 0.98, 0], c: 0xd0c9b8 },
      { s: 'box', d: [0.24, 1.0, 0.5], at: [1.62, 0.5, 0], c: 'tint', mirror: true },
      { s: 'box', d: [0.3, 0.1, 0.6], at: [1.62, 1.05, 0], c: 0xd0c9b8, mirror: true },
      { s: 'cone', d: [0.2, 0.12], at: [1.62, 1.16, 0], rot: [0, 45, 0], c: 0xd0c9b8, seg: 4, mirror: true },
    ],
  },
  {
    id: 'pl-padlock-railing', name: 'Padlock Railing', category: 'prop', uses: ['place'],
    tint: 'black',
    footprint: { r: 1.75, h: 1.1 },
    tags: ['gta', 'pardonlin', 'padlock', 'love', 'locks', 'railing', 'bridge', 'iron', 'thymes'], emoji: [],
    about: 'Gnome Theft Auto: Pardonlin love-lock railing. A 3.5 m black iron railing, 1.1 m tall, hung with some forty small coloured padlocks on both faces. Symmetrical. Tint is the iron.',
    examine: [
      'A black iron railing so thickly hung with small padlocks, red and brass and blue, that the bars have almost stopped being the point.',
      'Saying: a lock on a bridge is a promise that has been told to stay where it is, and a promise that stays is the best kind.',
      'Tip: the keys were thrown into the Thymes, so do not bother to look for one. Look instead for a gnome with a very large pair of cutters.',
      'Joke: the railing is a little lower every year, and the town has decided this is the railing being romantic.',
      'On one of the padlocks, somebody has scratched a tiny plain word, and the word is not a name. It is the word perhaps.',
    ],
    parts: [
      { s: 'box', d: [3.5, 0.05, 0.05], at: [0, 1.07, 0], c: 'tint' },
      { s: 'box', d: [3.5, 0.05, 0.05], at: [0, 0.12, 0], c: 'tint' },
      ...Array.from({ length: 9 }, (_, i): Part => ({ s: 'box', d: [0.035, 1.1, 0.035], at: [-1.7 + i * 0.425, 0.55, 0], c: 'tint' })),
      ...padlocks(),
    ],
  },
  {
    id: 'pl-houseboat', name: 'Cabin Barge', category: 'prop', uses: ['place'],
    tint: 0xc9503f, trim: 'white',
    footprint: { r: 3.8, h: 3.0 },
    tags: ['gta', 'pardonlin', 'houseboat', 'barge', 'boat', 'cabin', 'moored', 'thymes', 'water'], emoji: [],
    about: 'Gnome Theft Auto: a moored cabin barge. 3 x 9 m: slate hull with a white stripe and a pointed bow, a gabled cabin with window boxes, a chimney with smoke, tyre fenders. Keel y 0, nose +z, mooring rope out of +x. Tint is the cabin, trim the frames.',
    examine: [
      'A flat boat with a small house on it, window boxes full of flowers, a chimney that smokes in a thoughtful way, and tyres hung along the side.',
      'Saying: a house that floats is a house that has not been told it has to stay, and a boat that stays is a house that has given in.',
      'Tip: knock before you step aboard. The deck is the front garden, and the owner is very particular about the front garden.',
      'Joke: the barge has been moored here so long the river now goes around it, out of respect, and sometimes under it, out of habit.',
      'In the smallest window there is a brass telescope aimed at the next barge, and in that window there is another brass telescope aimed back.',
    ],
    parts: [
      { s: 'box', d: [3.0, 0.95, 7.0], at: [0, 0.475, -0.5], c: 'slate' },
      { s: 'box', d: [3.02, 0.08, 7.02], at: [0, 0.62, -0.5], c: 'white' },
      { s: 'box', d: [2.12, 0.95, 2.12], at: [0, 0.475, 3.0], rot: [0, 45, 0], c: 'slate' },
      { s: 'box', d: [3.04, 0.07, 7.04], at: [0, 0.95, -0.5], c: 'trim' },
      { s: 'box', d: [2.2, 0.06, 2.2], at: [0, 0.955, 3.0], rot: [0, 45, 0], c: 'wood-light' },
      { s: 'box', d: [2.4, 1.35, 4.6], at: [0, 1.675, -1.3], c: 'tint' },
      { s: 'box', d: [1.5, 0.08, 4.9], at: [-0.62, 2.52, -1.3], rot: [0, 0, 12], c: 'wood-dark' },
      { s: 'box', d: [1.5, 0.08, 4.9], at: [0.62, 2.52, -1.3], rot: [0, 0, -12], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.06, 4.9], at: [0, 2.7, -1.3], c: 'black' },
      { s: 'box', d: [0.03, 0.62, 0.78], at: [1.203, 1.78, -2.4], c: 'trim', mirror: true },
      { s: 'box', d: [0.03, 0.62, 0.78], at: [1.203, 1.78, -1.3], c: 'trim', mirror: true },
      { s: 'box', d: [0.03, 0.62, 0.78], at: [1.203, 1.78, -0.2], c: 'trim', mirror: true },
      { s: 'box', d: [0.04, 0.5, 0.64], at: [1.21, 1.78, -2.4], c: 'glass', mirror: true },
      { s: 'box', d: [0.04, 0.5, 0.64], at: [1.21, 1.78, -1.3], c: 'glass', mirror: true },
      { s: 'box', d: [0.04, 0.5, 0.64], at: [1.21, 1.78, -0.2], c: 'glass', mirror: true },
      { s: 'box', d: [0.16, 0.14, 0.72], at: [1.3, 1.36, -2.4], c: 'wood-dark', mirror: true },
      { s: 'box', d: [0.16, 0.14, 0.72], at: [1.3, 1.36, -1.3], c: 'wood-dark', mirror: true },
      { s: 'box', d: [0.16, 0.14, 0.72], at: [1.3, 1.36, -0.2], c: 'wood-dark', mirror: true },
      { s: 'ball', d: [0.12], scale: [1, 0.8, 3], at: [1.3, 1.48, -2.4], c: 'red', seg: 6, mirror: true },
      { s: 'ball', d: [0.12], scale: [1, 0.8, 3], at: [1.3, 1.48, -1.3], c: 'petal', seg: 6, mirror: true },
      { s: 'ball', d: [0.12], scale: [1, 0.8, 3], at: [1.3, 1.48, -0.2], c: 'yellow', seg: 6, mirror: true },
      { s: 'box', d: [0.9, 1.15, 0.04], at: [0.45, 1.58, 1.0], c: 'wood-dark' },
      { s: 'box', d: [0.7, 0.5, 0.04], at: [-0.6, 1.8, 1.0], c: 'glass' },
      { s: 'cyl', d: [0.14, 0.17, 0.8], at: [0.55, 2.95, -2.6], c: 'clay-dark', seg: 8 },
      { s: 'cyl', d: [0.2, 0.17, 0.06], at: [0.55, 3.38, -2.6], c: 'iron-dark', seg: 8 },
      { s: 'ball', d: [0.15], at: [0.62, 3.65, -2.6], c: 'chalk', alpha: 0.55, seg: 6 },
      { s: 'ball', d: [0.1], at: [0.8, 3.95, -2.55], c: 'chalk', alpha: 0.4, seg: 6 },
      { s: 'cyl', d: [0.17, 0.17, 0.22], at: [1.58, 0.64, -2.6], rot: [0, 0, 90], c: 'black', seg: 8, mirror: true },
      { s: 'cyl', d: [0.17, 0.17, 0.22], at: [1.58, 0.64, 0.4], rot: [0, 0, 90], c: 'black', seg: 8, mirror: true },
      { s: 'cyl', d: [0.17, 0.17, 0.22], at: [1.58, 0.64, 2.4], rot: [0, 0, 90], c: 'black', seg: 8, mirror: true },
      { s: 'box', d: [0.12, 0.1, 0.2], at: [1.3, 1.02, 2.2], c: 'iron-dark' },
      { s: 'cyl', d: [0.022, 0.022, 1.2], at: [1.9, 1.3, 2.2], rot: [0, 0, -65], c: 'burlap', seg: 5 },
      { s: 'box', d: [0.04, 0.16, 0.16], at: [2.4, 1.56, 2.2], c: 'iron-dark' },
    ],
  },
  {
    id: 'pl-peniche', name: 'Péniche', category: 'prop', uses: ['place'],
    tint: 0x2f5d3a, trim: 'red',
    footprint: { r: 5.8, h: 3.0 },
    tags: ['gta', 'pardonlin', 'peniche', 'barge', 'boat', 'washing', 'laundry', 'geranium', 'moored', 'thymes', 'water'], emoji: [],
    about: 'Gnome Theft Auto: a moored péniche. A black 2.6 x 11.3 m working barge with a red gunwale, wheelhouse at the stern, tarped hold, geraniums on the hatch and a washing line of seven items. Keel y 0, nose +z, rope out of +x. Tint is the wheelhouse, trim the gunwale.',
    examine: [
      'A long black barge with a red edge, a green wheelhouse at the back, geraniums on the hatch, and a line of washing strung down the length of it.',
      'Saying: a barge is a road that has been told to go slowly, and the washing is the flag it flies to say so.',
      'Tip: do not walk under the washing. It is dry on top and wet underneath, and nobody has ever worked out the rule.',
      'Joke: the péniche has not moved since the spring, but the washing has moved forty times, and so has the geranium.',
      'Under the hatch someone has stacked cheeses and a very small bicycle, and everyone agrees it is none of their business.',
    ],
    parts: [
      { s: 'box', d: [2.6, 0.9, 10.0], at: [0, 0.45, -0.8], c: 'black' },
      { s: 'box', d: [1.84, 0.9, 1.84], at: [0, 0.45, 4.2], rot: [0, 45, 0], c: 'black' },
      { s: 'box', d: [2.62, 0.07, 10.02], at: [0, 0.6, -0.8], c: 'trim' },
      { s: 'box', d: [0.1, 0.12, 10.0], at: [1.3, 0.95, -0.8], c: 'trim', mirror: true },
      { s: 'box', d: [2.5, 0.05, 10.0], at: [0, 0.92, -0.8], c: 'wood' },
      { s: 'box', d: [1.9, 0.05, 1.9], at: [0, 0.93, 4.2], rot: [0, 45, 0], c: 'wood' },
      { s: 'box', d: [2.2, 1.3, 2.4], at: [0, 1.57, -4.0], c: 'tint' },
      { s: 'box', d: [2.45, 0.1, 2.65], at: [0, 2.27, -4.0], c: 'wood-dark' },
      { s: 'box', d: [0.04, 0.5, 0.8], at: [1.11, 1.75, -4.0], c: 'glass', mirror: true },
      { s: 'box', d: [0.8, 1.0, 0.04], at: [0, 1.5, -5.2], c: 'wood-dark' },
      { s: 'box', d: [0.5, 0.5, 0.04], at: [-0.5, 1.8, -2.78], c: 'glass' },
      { s: 'box', d: [2.0, 0.28, 5.2], at: [0, 1.06, 0.9], c: 'wood-dark' },
      { s: 'box', d: [1.8, 0.16, 5.0], at: [0, 1.28, 0.9], c: 'cloth' },
      { s: 'cyl', d: [0.03, 0.035, 1.5], at: [0, 1.7, -1.1], c: 'iron', seg: 6 },
      { s: 'cyl', d: [0.03, 0.035, 1.5], at: [0, 1.7, 3.6], c: 'iron', seg: 6 },
      { s: 'cyl', d: [0.008, 0.008, 4.7], at: [0, 2.25, 1.25], rot: [90, 0, 0], c: 'bone', seg: 4 },
      ...laundry().map((p): Part => ({ ...p, at: [p.at![0], p.at![1], p.at![2] + 0.6] })),
      { s: 'cyl', d: [0.12, 0.09, 0.2], at: [0.65, 1.46, 0.3], c: 'clay', seg: 8, mirror: true },
      { s: 'ball', d: [0.17], scale: [1, 0.8, 1], at: [0.65, 1.62, 0.3], c: 'red', seg: 6, mirror: true },
      { s: 'cyl', d: [0.12, 0.09, 0.2], at: [0.5, 1.46, 2.2], c: 'clay', seg: 8, mirror: true },
      { s: 'ball', d: [0.17], scale: [1, 0.8, 1], at: [0.5, 1.62, 2.2], c: 'petal', seg: 6, mirror: true },
      { s: 'cyl', d: [0.17, 0.17, 0.22], at: [1.4, 0.7, -2.0], rot: [0, 0, 90], c: 'black', seg: 8, mirror: true },
      { s: 'cyl', d: [0.17, 0.17, 0.22], at: [1.4, 0.7, 2.0], rot: [0, 0, 90], c: 'black', seg: 8, mirror: true },
      { s: 'box', d: [0.12, 0.1, 0.2], at: [1.2, 1.0, 3.0], c: 'iron-dark' },
      { s: 'cyl', d: [0.022, 0.022, 1.2], at: [1.8, 1.25, 3.0], rot: [0, 0, -65], c: 'burlap', seg: 5 },
      { s: 'box', d: [0.04, 0.16, 0.16], at: [2.3, 1.5, 3.0], c: 'iron-dark' },
    ],
  },
  {
    id: 'pl-rowboat-sunk', name: 'Sunk Rowing Boat', category: 'prop', uses: ['place'],
    tint: 0x4a77a8, trim: 'chalk',
    footprint: { r: 1.6, h: 1.2 },
    tags: ['gta', 'pardonlin', 'rowboat', 'sunk', 'sunken', 'sale', 'boat', 'wreck', 'moored', 'thymes', 'water'], emoji: [],
    about: 'Gnome Theft Auto: a rowing boat sunk to its gunwales. 1.3 x 4 m, painted sides and a white stripe, a pennant on a pole, an oar over the stern, a floating bailer. Place it 0.52 m below the water. Keel y 0, nose +z, rope out of +x. Tint is the paint.',
    examine: [
      'A painted rowing boat that has settled gently into the river up to its edges, with a pennant on a pole as if nothing had happened.',
      'Saying: a boat that has sunk is only a boat that has made up its mind, and it is rude to hurry a decision.',
      'Tip: if you must buy it, buy it dry. The seller will tell you it is dry. The seller has not looked.',
      'Joke: it is listed as slightly used, mostly river, and both words are accurate, in that order.',
      'The oar is still lashed over the stern, and a small tin bailer drifts about inside, doing what it can.',
    ],
    parts: [
      { s: 'box', d: [1.2, 0.08, 2.8], at: [0, 0.04, 0], c: 'wood-dark' },
      { s: 'box', d: [0.08, 0.52, 2.8], at: [0.6, 0.26, 0], c: 'tint', mirror: true },
      { s: 'box', d: [0.085, 0.07, 2.8], at: [0.6, 0.42, 0], c: 'trim', mirror: true },
      { s: 'box', d: [0.85, 0.52, 0.85], at: [0, 0.26, 1.4], rot: [0, 45, 0], c: 'tint' },
      { s: 'box', d: [0.75, 0.07, 0.75], at: [0, 0.52, 1.4], rot: [0, 45, 0], c: 'wood' },
      { s: 'box', d: [1.2, 0.52, 0.08], at: [0, 0.26, -1.4], c: 'tint' },
      { s: 'box', d: [1.2, 0.06, 0.24], at: [0, 0.3, 0.3], c: 'wood' },
      { s: 'box', d: [1.2, 0.06, 0.24], at: [0, 0.3, -0.7], c: 'wood' },
      { s: 'cyl', d: [0.025, 0.025, 1.4], at: [0, 1.1, 1.6], c: 'wood-light', seg: 5 },
      { s: 'box', d: [0.02, 0.2, 0.34], at: [0, 1.65, 1.42], c: 'red' },
      { s: 'cyl', d: [0.02, 0.02, 3.0], at: [0.15, 0.62, -0.2], rot: [78, 0, 8], c: 'wood-light', seg: 5 },
      { s: 'cyl', d: [0.1, 0.08, 0.14], at: [-0.25, 0.46, 0.7], rot: [0, 0, 80], c: 'iron', seg: 8 },
      { s: 'box', d: [0.12, 0.1, 0.2], at: [0.65, 0.5, 0.9], c: 'iron-dark' },
      { s: 'cyl', d: [0.022, 0.022, 1.2], at: [1.25, 0.95, 0.9], rot: [0, 0, -63], c: 'burlap', seg: 5 },
      { s: 'box', d: [0.04, 0.16, 0.16], at: [1.8, 1.2, 0.9], c: 'iron-dark' },
    ],
  },
  {
    id: 'pl-swan-nest', name: 'Swan\'s Nest', category: 'prop', uses: ['place'],
    tags: ['gta', 'pardonlin', 'swan', 'nest', 'eggs', 'straw', 'reeds', 'thymes'], emoji: [],
    about: 'Gnome Theft Auto: a swan\'s nest. A 0.9 m ring of straw and reeds with a bowl in the middle, two pale eggs and a feather. Place the cygnets (bird-swan, scale 0.5) beside it.',
    examine: [
      'A big untidy ring of straw and reed stalks, with a bowl pressed into the middle and two pale eggs sitting in it as if on a plate.',
      'Saying: a nest is a house built by someone who has never read a plan, and it is always the right size.',
      'Tip: do not come closer than the length of your own arm. The swan can measure, and it measures from the other side.',
      'Joke: the swans chose the stairs because the stairs were free, and have since sent a very short note to the council.',
      'A single white feather has been tucked into the rim on the water side, and it moves a little whenever anyone approaches.',
    ],
    parts: [
      { s: 'ball', d: [0.45], scale: [1, 0.3, 1], at: [0, 0.135, 0], c: 'straw', seg: 8 },
      { s: 'ball', d: [0.3], scale: [1, 0.15, 1], at: [0, 0.255, 0], c: 'sand', seg: 8 },
      { s: 'ball', d: [0.05], scale: [0.8, 1.1, 0.8], at: [0.08, 0.31, 0.05], c: 'chalk', seg: 6 },
      { s: 'ball', d: [0.05], scale: [0.8, 1.1, 0.8], at: [-0.1, 0.31, -0.04], c: 'chalk', seg: 6 },
      { s: 'cyl', d: [0.012, 0.012, 0.5], at: [0.4, 0.42, 0.2], rot: [0, 0, 40], c: 'moss', seg: 4 },
      { s: 'cyl', d: [0.012, 0.012, 0.5], at: [-0.38, 0.42, 0.1], rot: [0, 0, -45], c: 'moss', seg: 4 },
      { s: 'cyl', d: [0.012, 0.012, 0.45], at: [0.1, 0.42, -0.42], rot: [40, 0, 0], c: 'leaf-dark', seg: 4 },
      { s: 'box', d: [0.02, 0.01, 0.16], at: [0.3, 0.29, -0.1], rot: [0, 30, 10], c: 'white' },
    ],
  },
];
