// Gnome Theft Auto (E16): deer (hind, stag, fawn) and the hill goat. Built at scale 1 (1 unit = one gnome's height).
// Pivots: 'body' (bobs), 'head' (nods), 'tail' (wags), 'leg-0'..'leg-3' (swing; leg k at sx,sz = (-1,-1), (-1,1), (1,-1),
// (1,1), so legs 1 and 3 are the front). Pivot points are absolute prefab coordinates, like gta-farm-critters.ts.
// The stag and the fawn are the hind's parts scaled (scaleParts), so the three deer share one structure.
import type { Part, PrefabDef, Vec3 } from '../types';

const scaleAt = (v: Vec3, k: number): Vec3 => [v[0] * k, v[1] * k, v[2] * k];

function scaleParts(parts: readonly Part[], k: number): Part[] {
  return parts.map((p) => ({
    ...p,
    d: p.d.map((x) => x * k),
    ...(p.at ? { at: scaleAt(p.at, k) } : {}),
  }));
}

function scalePivots(pivots: Readonly<Record<string, Vec3>>, k: number): Record<string, Vec3> {
  const out: Record<string, Vec3> = {};
  for (const name of Object.keys(pivots)) out[name] = scaleAt(pivots[name], k);
  return out;
}

// Four slim legs hanging from their hip pivots, with dark hooves at the bottom.
function deerLeg(group: string, x: number, z: number): Part[] {
  return [
    { s: 'cyl', d: [0.07, 0.07, 0.93], at: [x, 0.485, z], c: 'tint', seg: 6, group },
    { s: 'cyl', d: [0.075, 0.075, 0.06], at: [x, 0.03, z], c: 'leather-dark', seg: 6, group },
  ];
}

const HIND_PIVOTS: Record<string, Vec3> = {
  body: [0, 1.25, 0],
  head: [0, 1.6, 0.6],
  tail: [0, 1.45, -0.7],
  'leg-0': [-0.2, 0.95, -0.55],
  'leg-1': [-0.2, 0.95, 0.55],
  'leg-2': [0.2, 0.95, -0.55],
  'leg-3': [0.2, 0.95, 0.55],
};

const HIND_PARTS: readonly Part[] = [
  { s: 'box', d: [0.6, 0.65, 1.4], at: [0, 1.25, 0], c: 'tint', group: 'body' },
  { s: 'box', d: [0.5, 0.16, 1.2], at: [0, 0.99, 0], c: 0xd8b48a, group: 'body' },
  { s: 'box', d: [0.5, 0.4, 0.1], at: [0, 1.3, -0.71], c: 'wool', group: 'body' },
  { s: 'box', d: [0.26, 0.7, 0.26], at: [0, 1.5, 0.55], rot: [25, 0, 0], c: 'tint', group: 'head' },
  { s: 'box', d: [0.2, 0.24, 0.38], at: [0, 1.82, 0.82], c: 'tint', group: 'head' },
  { s: 'box', d: [0.16, 0.14, 0.2], at: [0, 1.74, 1.0], c: 'leather', group: 'head' },
  { s: 'ball', d: [0.03], at: [0, 1.76, 1.1], c: 'black', group: 'head' },
  { s: 'ball', d: [0.025], at: [0.1, 1.88, 0.9], c: 'black', group: 'head', mirror: true },
  { s: 'box', d: [0.07, 0.22, 0.04], at: [0.1, 2.0, 0.74], rot: [0, 0, -15], c: 'tint', group: 'head', mirror: true },
  { s: 'ball', d: [0.08], at: [0, 1.42, -0.78], c: 'white', group: 'tail' },
  ...deerLeg('leg-0', -0.2, -0.55),
  ...deerLeg('leg-1', -0.2, 0.55),
  ...deerLeg('leg-2', 0.2, -0.55),
  ...deerLeg('leg-3', 0.2, 0.55),
];

const STAG_EXTRA: readonly Part[] = [
  // shaggy darker ruff at the base of the neck
  { s: 'ball', d: [0.18], scale: [0.9, 1.3, 1.0], at: [0, 1.62, 0.6], c: 'leather-dark', group: 'head' },
  // antler beam and three tines per side, reaching to about 3 gnome-heights
  { s: 'cyl', d: [0.018, 0.012, 0.9], at: [0.1, 2.5, 0.85], rot: [0, 0, -15], c: 'bone', seg: 5, group: 'head', mirror: true },
  { s: 'cyl', d: [0.01, 0.008, 0.28], at: [0.135, 2.441, 0.85], rot: [0, 0, -45], c: 'bone', seg: 5, group: 'head', mirror: true },
  { s: 'cyl', d: [0.01, 0.008, 0.28], at: [0.193, 2.658, 0.85], rot: [0, 0, -45], c: 'bone', seg: 5, group: 'head', mirror: true },
  { s: 'cyl', d: [0.01, 0.008, 0.22], at: [0.251, 2.875, 0.85], rot: [0, 0, -45], c: 'bone', seg: 5, group: 'head', mirror: true },
];

const FAWN_EXTRA: readonly Part[] = [
  // white dapples on the back and flanks, flattened and set just proud of the coat
  { s: 'ball', d: [0.035], scale: [1, 0.3, 1], at: [-0.07, 0.947, -0.22], c: 'white', group: 'body' },
  { s: 'ball', d: [0.035], scale: [1, 0.3, 1], at: [0.07, 0.947, -0.05], c: 'white', group: 'body' },
  { s: 'ball', d: [0.035], scale: [1, 0.3, 1], at: [-0.07, 0.947, 0.12], c: 'white', group: 'body' },
  { s: 'ball', d: [0.035], scale: [1, 0.3, 1], at: [0.07, 0.947, 0.29], c: 'white', group: 'body' },
  { s: 'ball', d: [0.035], scale: [0.3, 1, 1], at: [0.18, 0.75, -0.12], c: 'white', group: 'body', mirror: true },
  { s: 'ball', d: [0.035], scale: [0.3, 1, 1], at: [0.18, 0.7, 0.16], c: 'white', group: 'body', mirror: true },
];

const HIND: PrefabDef = {
  id: 'deer-hind', name: 'Red Deer Hind', category: 'prop', uses: ['place'],
  tags: ['deer', 'hind', 'doe', 'red-deer', 'animal', 'critter', 'gta'], emoji: [],
  tint: 0xa8743f,
  about: 'A red deer hind: red-brown coat (tint), pale belly, cream rump and a short white tail, long neck and big ears. Pivots: body, head, tail, leg-0..3.',
  examine: [
    'A slim red-brown doe with a cream rump and a short white tail that flicks when she is thinking about leaving.',
    'Saying of the Hedgewood: "Stand still and the deer will come to you. Stand very still and it will eat your hat."',
    'Her ears are bigger than her opinions, and her opinions are very large. Keep a sensible distance.',
    'Hunters in Turfton knock a deer over in a puff. She gets up offended, shakes the leaves off and runs for the Hedgewood.',
    'She stops dead at the edge of the lawn, looks at you for a long moment, and then decides you are not worth the effort. Gnomes call this a win.',
  ],
  pivots: HIND_PIVOTS,
  parts: HIND_PARTS,
};

const STAG: PrefabDef = {
  id: 'deer-stag', name: 'Red Deer Stag', category: 'prop', uses: ['place'],
  tags: ['deer', 'stag', 'buck', 'antlers', 'red-deer', 'animal', 'critter', 'gta'], emoji: [],
  tint: 0x8a5a2b,
  about: 'A red deer stag: the hind scaled up ten percent, darker coat (tint), shaggy dark ruff and branching antlers (bone). Pivots: body, head, tail, leg-0..3.',
  examine: [
    'A big red deer stag with a shaggy dark ruff and a pair of branching antlers that reach well over a gnome.',
    'Saying of the Hedgewood: "Antlers grow every spring and fall off every winter. Gnomes call this a hint."',
    'Do not wave a stick at the stag. It is not impressed by sticks, and its antlers have a longer reach than yours.',
    'Tuft and Tally licence holders say the antlers are a trophy. The stag says they are a stag. Nobody has won that argument.',
    'A stag knocked over in Turfton gets up, straightens its antlers and walks off with its head held very high.',
  ],
  pivots: scalePivots(HIND_PIVOTS, 1.1),
  parts: [...scaleParts(HIND_PARTS, 1.1), ...STAG_EXTRA],
};

const FAWN: PrefabDef = {
  id: 'deer-fawn', name: 'Red Deer Fawn', category: 'prop', uses: ['place'],
  tags: ['deer', 'fawn', 'baby-deer', 'spotted', 'red-deer', 'animal', 'critter', 'gta'], emoji: [],
  tint: 0xc89060,
  about: 'A red deer fawn: about 0.6 of the hind, lighter coat (tint) with white dapple spots, big ears. Pivots: body, head, tail, leg-0..3.',
  examine: [
    'A small spotted fawn with big ears and legs too long for it, lying in the long grass pretending to be a shadow.',
    'Gnome saying: "A fawn left alone is not lost. Its mother is in the next garden being very annoyed."',
    'Do not pick up a fawn. Its mother will know, and the Rockery will hear about it for a month.',
    'It wobbles on its first morning, and then runs faster than any gnome has ever been able to run.',
    'Its white spots are there for camouflage. They work well in dappled light and fail completely on the path.',
  ],
  pivots: scalePivots(HIND_PIVOTS, 0.6),
  parts: [...scaleParts(HIND_PARTS, 0.6), ...FAWN_EXTRA],
};

const GOAT: PrefabDef = {
  id: 'goat', name: 'Hill Goat', category: 'prop', uses: ['place'],
  tags: ['goat', 'billy', 'hill-goat', 'animal', 'critter', 'shag', 'gta'], emoji: [],
  tint: 0xeeeae0, trim: 0x9a9590,
  about: 'A stocky hill goat: off-white shag (tint), grey saddle patch (trim), backswept horns, a little beard and a brass bell. Pivots: body, head, tail, leg-0..3.',
  examine: [
    'A stocky hill goat in off-white shag, with a grey saddle, backswept horns, a little beard and a brass bell on its collar.',
    'Saying of the Verge: "A goat will eat anything you would not, and several things you would."',
    'Its bell tells you where it is. Gnomes who want a quiet walk have learned to listen for the bell and walk the other way.',
    'It climbs onto the Shed roof, looks down at the gnomes and calls that a view. Nobody has yet persuaded it otherwise.',
    'Hill goats are not stubborn. They have simply decided, and the decision was made long before you arrived.',
  ],
  pivots: {
    body: [0, 0.7, 0],
    head: [0, 0.9, 0.42],
    tail: [0, 0.85, -0.45],
    'leg-0': [-0.18, 0.45, -0.3],
    'leg-1': [-0.18, 0.45, 0.3],
    'leg-2': [0.18, 0.45, -0.3],
    'leg-3': [0.18, 0.45, 0.3],
  },
  parts: [
    { s: 'box', d: [0.5, 0.5, 0.9], at: [0, 0.7, 0], c: 'tint', group: 'body' },
    { s: 'box', d: [0.51, 0.03, 0.4], at: [0, 0.96, -0.05], c: 'trim', group: 'body' },
    { s: 'box', d: [0.2, 0.3, 0.2], at: [0, 0.98, 0.42], rot: [25, 0, 0], c: 'tint', group: 'head' },
    { s: 'box', d: [0.22, 0.24, 0.3], at: [0, 1.06, 0.56], c: 'tint', group: 'head' },
    { s: 'box', d: [0.14, 0.12, 0.14], at: [0, 1.0, 0.75], c: 'tint', group: 'head' },
    { s: 'cone', d: [0.03, 0.1], rot: [180, 0, 0], at: [0, 0.9, 0.72], c: 'stone-dark', seg: 5, group: 'head' },
    { s: 'ball', d: [0.02], at: [0.11, 1.08, 0.64], c: 'ink', group: 'head', mirror: true },
    { s: 'cone', d: [0.03, 0.22], rot: [-35, 0, -12], at: [0.09, 1.22, 0.5], c: 'bone', seg: 5, group: 'head', mirror: true },
    { s: 'ball', d: [0.05], at: [0, 0.86, 0.47], c: 'brass', group: 'head' },
    { s: 'cyl', d: [0.045, 0.04, 0.45], at: [-0.18, 0.225, -0.3], c: 'tint', seg: 6, group: 'leg-0' },
    { s: 'cyl', d: [0.045, 0.04, 0.45], at: [-0.18, 0.225, 0.3], c: 'tint', seg: 6, group: 'leg-1' },
    { s: 'cyl', d: [0.045, 0.04, 0.45], at: [0.18, 0.225, -0.3], c: 'tint', seg: 6, group: 'leg-2' },
    { s: 'cyl', d: [0.045, 0.04, 0.45], at: [0.18, 0.225, 0.3], c: 'tint', seg: 6, group: 'leg-3' },
    { s: 'cyl', d: [0.05, 0.03, 0.12], at: [0, 0.9, -0.48], rot: [-20, 0, 0], c: 'tint', seg: 6, group: 'tail' },
  ],
};

export const GTA_COUNTRY_DEER: readonly PrefabDef[] = [HIND, STAG, FAWN, GOAT];
