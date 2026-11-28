// Gnome Theft Auto E25 jobs III: the two work vehicles: the Bin Lorry (`gta-bin-lorry`) and the Watering-Can Pumper (`gta-fire-engine`).
// Plan: docs/roadmaps/gta-batch-3/E25/roadmap.md. Rules: docs/roadmaps/prefab-library/_common.md.
// Ids, seats and the wheel / door / arm / lid / nozzle / ladder pivots are a contract with the game: do not move them.
import type { PrefabDef, Part } from '../types';

const TYRE = 0x222222;
const SMOKE = 0x77716b;
const DENT = 0x3b3b3b;
const CHASSIS = 0x3a3a3a;
const CAB_WHITE = 0xe9e6dc;
const AMBER = 0xffb000;
const BRASS = 0xd4a537;
const HOSE = 0x2f6b3a;

/** A grey smoke column of three puffs starting at (x, y, z). */
const smoke = (x: number, y: number, z: number, s = 1): Part[] => [
  { s: 'ball', d: [0.09 * s], at: [x, y, z], c: SMOKE, alpha: 0.6, seg: 6 },
  { s: 'ball', d: [0.12 * s], at: [x + 0.03 * s, y + 0.16 * s, z - 0.02 * s], c: SMOKE, alpha: 0.45, seg: 6 },
  { s: 'ball', d: [0.15 * s], at: [x - 0.02 * s, y + 0.34 * s, z + 0.03 * s], c: SMOKE, alpha: 0.3, seg: 6 },
];

/** Four wheels: wheel-0 (-x, rear), wheel-1 (+x, rear), wheel-2 (-x, front), wheel-3 (+x, front). */
const wheels = (xs: number, zr: number, zf: number): Part[] => [
  { s: 'cyl', d: [0.15, 0.15, 0.1], rot: [0, 0, 90], at: [-xs, 0.15, zr], c: TYRE, seg: 10, group: 'wheel-0' },
  { s: 'cyl', d: [0.15, 0.15, 0.1], rot: [0, 0, 90], at: [xs, 0.15, zr], c: TYRE, seg: 10, group: 'wheel-1' },
  { s: 'cyl', d: [0.15, 0.15, 0.1], rot: [0, 0, 90], at: [-xs, 0.15, zf], c: TYRE, seg: 10, group: 'wheel-2' },
  { s: 'cyl', d: [0.15, 0.15, 0.1], rot: [0, 0, 90], at: [xs, 0.15, zf], c: TYRE, seg: 10, group: 'wheel-3' },
];

/** Vertical ribs down both sides of the compost bin, leaving a gap at z = -0.45 for the lift arm. */
const binRibs = (): Part[] => {
  const out: Part[] = [];
  for (const z of [-0.9, -0.7, -0.1, 0.1]) {
    for (const side of [1, -1]) {
      out.push({ s: 'box', d: [0.03, 0.56, 0.04], at: [side * 0.515, 0.62, z], c: 'tint' });
    }
  }
  return out;
};

/** The ladder's rungs, every 0.12 along its 1.0 length, starting at z0 (the pivot). */
const rungs = (z0: number): Part[] => {
  const out: Part[] = [];
  for (let i = 0; i < 9; i++) {
    out.push({ s: 'box', d: [0.2, 0.02, 0.02], at: [0, 1.15, z0 + 0.02 + i * 0.12], c: 'trim', group: 'ladder' });
  }
  return out;
};

export const GTA_JOBS3_FLEET: readonly PrefabDef[] = [
  // ---- Bin Lorry: a stubby cab-over lorry with a garden compost bin for a back --------------------------------------
  {
    id: 'gta-bin-lorry', name: 'Bin Lorry', category: 'prop', uses: ['place', 'sit'],
    tags: ['bin', 'lorry', 'truck', 'rubbish', 'compost', 'garbage', 'refuse', 'vehicle', 'seat', 'ride', 'gta', 'jobs'], emoji: [],
    tint: 0x3f8f3a,
    trim: 0xf2d11a,
    seat: [0.17, 0.47, 0.56],
    pivots: {
      'wheel-0': [-0.43, 0.15, -0.6], 'wheel-1': [0.43, 0.15, -0.6],
      'wheel-2': [-0.43, 0.15, 0.7], 'wheel-3': [0.43, 0.15, 0.7],
      'door-left': [0.5, 0.42, 0.79], 'door-right': [-0.5, 0.42, 0.79],
      arm: [-0.52, 0.62, -0.45],
      lid: [0, 0.93, -1.0],
    },
    about: 'Gnome Theft Auto E25: the Bin Lorry. A stubby cab-over lorry (white cab) with a big ribbed green compost bin (tint) for a back, hi-vis yellow stripes (trim), an amber beacon, a flip lid (pivot lid, hinged at the back) and a kerb-side lift arm (pivot arm at the hopper: parts hang straight down, claw at local [0, -0.5, 0]; rotation.z 2.4 swings it up and over the hopper toward +x). wheel-0..3 and door-left / door-right pivots. Nose +z.',
    examine: [
      'A stubby white cab-over lorry with a huge green compost bin for a back, yellow hi-vis stripes and a little amber beacon.',
      'Saying: every bin has a day, and the Bin Lorry insists the day is today.',
      'Tip: park on the kerb side. The lift arm is on the left, and it does not like to be surprised.',
      'Joke: the plate on the back says BIN DAY IS EVERY DAY, which the crew consider a threat and the bins consider a promise.',
      'The claw has two prongs and plenty of manners. It always puts the bin back, slightly further from where you left it.',
    ],
    parts: [
      { s: 'box', d: [0.8, 0.14, 1.96], at: [0, 0.2, 0], c: CHASSIS, name: 'chassis' },
      // The cab: a cab-over, so the front is a flat face.
      { s: 'box', d: [0.96, 0.3, 0.5], at: [0, 0.42, 0.75], c: CAB_WHITE, name: 'cab' },
      { s: 'box', d: [0.9, 0.26, 0.44], at: [0, 0.7, 0.75], c: 'glass', name: 'cab-glass' },
      { s: 'box', d: [0.98, 0.05, 0.54], at: [0, 0.855, 0.75], c: CAB_WHITE, name: 'cab-roof' },
      { s: 'box', d: [0.98, 0.05, 0.4], at: [0, 0.42, 0.75], c: 'trim', name: 'cab-stripe' },
      { s: 'box', d: [0.8, 0.14, 0.04], at: [0, 0.34, 1.02], c: CHASSIS, name: 'grille' },
      { s: 'box', d: [0.92, 0.07, 0.07], at: [0, 0.22, 1.03], c: 'trim', name: 'bumper' },
      { s: 'ball', d: [0.05], scale: [1, 1, 0.5], at: [-0.32, 0.4, 1.02], c: 'spark', glow: true, seg: 8, mirror: true },
      // The beacon.
      { s: 'cyl', d: [0.06, 0.07, 0.04], at: [0, 0.905, 0.75], c: CHASSIS, seg: 8 },
      { s: 'ball', d: [0.07], at: [0, 0.96, 0.75], c: AMBER, glow: true, seg: 8, name: 'beacon' },
      // The compost bin (x -0.5..0.5, z -1.0..0.3): ribbed sides, a flip lid and a plate on the back.
      { s: 'box', d: [1.0, 0.62, 1.3], at: [0, 0.62, -0.35], c: 'tint', name: 'bin' },
      ...binRibs(),
      { s: 'box', d: [0.9, 0.06, 0.016], at: [0, 0.4, -1.012], c: 'trim', name: 'stripe-low' },
      { s: 'box', d: [0.9, 0.06, 0.016], at: [0, 0.84, -1.012], c: 'trim', name: 'stripe-high' },
      { s: 'box', d: [0.42, 0.13, 0.02], at: [0, 0.62, -1.015], c: 0xf2e6a0, name: 'plate' },
      { s: 'box', d: [1.04, 0.06, 1.34], at: [0, 0.96, -0.33], c: 'tint', group: 'lid', name: 'lid-top' },
      { s: 'box', d: [0.3, 0.05, 0.06], at: [0, 1.02, 0.28], c: 'trim', group: 'lid', name: 'lid-handle' },
      // The lift arm, drawn hanging straight down from its pivot; the claw crossbar sits at exactly [0, -0.5, 0].
      { s: 'box', d: [0.1, 0.1, 0.1], at: [-0.52, 0.62, -0.45], c: CHASSIS, group: 'arm' },
      { s: 'box', d: [0.05, 0.5, 0.05], at: [-0.52, 0.37, -0.45], c: 'trim', group: 'arm', name: 'arm-bar' },
      { s: 'box', d: [0.04, 0.04, 0.24], at: [-0.52, 0.12, -0.45], c: 'trim', group: 'arm', name: 'claw' },
      { s: 'box', d: [0.14, 0.03, 0.03], at: [-0.59, 0.12, -0.55], c: 'trim', group: 'arm', name: 'prong-a' },
      { s: 'box', d: [0.14, 0.03, 0.03], at: [-0.59, 0.12, -0.35], c: 'trim', group: 'arm', name: 'prong-b' },
      ...wheels(0.43, -0.6, 0.7),
      // Doors: hinged at the front edge (z 0.79), outer faces proud of the cab sides.
      { s: 'box', d: [0.03, 0.3, 0.34], at: [0.485, 0.42, 0.62], c: CAB_WHITE, group: 'door-left' },
      { s: 'box', d: [0.05, 0.24, 0.28], at: [0.49, 0.7, 0.62], c: 'glass', group: 'door-left' },
      { s: 'box', d: [0.03, 0.3, 0.34], at: [-0.485, 0.42, 0.62], c: CAB_WHITE, group: 'door-right' },
      { s: 'box', d: [0.05, 0.24, 0.28], at: [-0.49, 0.7, 0.62], c: 'glass', group: 'door-right' },
    ],
    damage: [
      {
        name: 'dented', darken: 0.25,
        morph: { 'lid-top': { rot: [0, 0, 4] } },
        add: [{ s: 'box', d: [0.04, 0.14, 0.24], at: [0.52, 0.55, 0.1], c: DENT }],
      },
      {
        name: 'wrecked', darken: 0.6, sink: 0.04,
        hide: ['wheel-1'],
        morph: { 'lid-top': { rot: [0, 0, 12] }, 'arm-bar': { rot: [0, 0, 18] }, grille: { rot: [6, 0, 0] } },
        add: [...smoke(0, 1.0, 0.75, 1.1)],
      },
    ],
  },

  // ---- Watering-Can Pumper: a red fire engine built around a big watering can ----------------------------------------
  {
    id: 'gta-fire-engine', name: 'Watering-Can Pumper', category: 'prop', uses: ['place', 'sit'],
    tags: ['fire', 'engine', 'pumper', 'watering', 'can', 'hose', 'ladder', 'red', 'vehicle', 'seat', 'ride', 'gta', 'jobs'], emoji: [],
    tint: 0xc9302c,
    trim: BRASS,
    seat: [0.17, 0.47, 0.56],
    pivots: {
      'wheel-0': [-0.45, 0.15, -0.6], 'wheel-1': [0.45, 0.15, -0.6],
      'wheel-2': [-0.45, 0.15, 0.75], 'wheel-3': [0.45, 0.15, 0.75],
      'door-left': [0.48, 0.42, 0.78], 'door-right': [-0.48, 0.42, 0.78],
      nozzle: [0, 1.0, 1.0],
      ladder: [0, 1.15, -0.5],
    },
    about: 'Gnome Theft Auto E25: the Watering-Can Pumper. A red fire engine whose body is a big watering can on its side (tint) on a chassis, a brass handle arching over the top, a spout running forward over the cab with the rose as the nozzle (pivot nozzle at the spout tip, points +z), a blue-and-red light bar, a coiled hose reel on the +x side and a 1.0-long rung ladder on the roof (pivot ladder near the back, lies along +z). wheel-0..3 and door-left / door-right pivots. Nose +z.',
    examine: [
      'A red fire engine built around one enormous watering can, with a brass handle, a long spout over the cab and a rose for a nozzle.',
      'Saying: a fire is only a flowerbed that has got ideas above its station.',
      'Tip: aim the rose first and open the tap second. The Pumper has one volume, and it is all of it.',
      'Joke: the crew insist it is a fire engine. The geraniums at the station insist it is a very good watering can.',
      'The ladder on the roof has nine rungs, and the crew have named all nine. The sixth is the favourite.',
    ],
    parts: [
      { s: 'box', d: [0.86, 0.12, 2.0], at: [0, 0.21, 0.02], c: CHASSIS, name: 'chassis' },
      // The can on its side: a round body along z, a rear end cap, a brass rim.
      { s: 'cyl', d: [0.45, 0.45, 1.2], rot: [90, 0, 0], at: [0, 0.64, -0.35], c: 'tint', seg: 12, name: 'can' },
      { s: 'cyl', d: [0.47, 0.47, 0.06], rot: [90, 0, 0], at: [0, 0.64, -0.93], c: 'trim', seg: 12, name: 'can-rim' },
      // The handle: a brass bar arching over the top at the back.
      { s: 'box', d: [0.06, 0.05, 0.3], at: [0, 1.17, -0.75], c: 'trim', name: 'handle' },
      { s: 'box', d: [0.06, 0.1, 0.06], at: [0, 1.12, -0.9], c: 'trim' },
      { s: 'box', d: [0.06, 0.1, 0.06], at: [0, 1.12, -0.6], c: 'trim' },
      // The cab.
      { s: 'box', d: [0.92, 0.3, 0.62], at: [0, 0.42, 0.7], c: 'tint', name: 'cab' },
      { s: 'box', d: [0.86, 0.26, 0.56], at: [0, 0.7, 0.7], c: 'glass', name: 'cab-glass' },
      { s: 'box', d: [0.94, 0.05, 0.64], at: [0, 0.855, 0.7], c: 'tint', name: 'cab-roof' },
      { s: 'box', d: [0.94, 0.07, 0.07], at: [0, 0.24, 1.04], c: 'trim', name: 'bumper' },
      { s: 'ball', d: [0.05], scale: [1, 1, 0.5], at: [-0.32, 0.4, 1.02], c: 'spark', glow: true, seg: 8, mirror: true },
      // The light bar: black base, one blue and one red lamp.
      { s: 'box', d: [0.44, 0.04, 0.12], at: [0, 0.9, 0.7], c: CHASSIS, name: 'light-bar' },
      { s: 'ball', d: [0.06], at: [-0.15, 0.95, 0.7], c: 0x2a6bff, glow: true, seg: 8, name: 'lamp-blue' },
      { s: 'ball', d: [0.06], at: [0.15, 0.95, 0.7], c: 0xff2a2a, glow: true, seg: 8, name: 'lamp-red' },
      // The spout: forward from the top of the can, over the cab, to the rose.
      { s: 'cyl', d: [0.05, 0.05, 0.7], rot: [90, 0, 0], at: [0, 1.0, 0.6], c: 'tint', seg: 8, name: 'spout' },
      // The nozzle: the rose, wide end forward (+z), with a dark perforated face.
      { s: 'cyl', d: [0.1, 0.05, 0.12], rot: [90, 0, 0], at: [0, 1.0, 1.0], c: 'trim', seg: 10, group: 'nozzle', name: 'rose' },
      { s: 'cyl', d: [0.08, 0.08, 0.01], rot: [90, 0, 0], at: [0, 1.0, 1.065], c: CHASSIS, seg: 10, group: 'nozzle' },
      // The hose reel on the +x side: a brass hub and a coil of green hose.
      { s: 'cyl', d: [0.06, 0.06, 0.12], rot: [0, 0, 90], at: [0.5, 0.55, -0.4], c: 'trim', seg: 8, name: 'reel-hub' },
      { s: 'ring', d: [0.17, 0.05], rot: [0, 90, 0], at: [0.5, 0.55, -0.4], c: HOSE, seg: 10, name: 'hose-outer' },
      // The ladder: two rails lying along +z from the pivot, rungs every 0.12, in two roof brackets.
      { s: 'box', d: [0.03, 0.03, 1.0], at: [-0.1, 1.15, 0], c: 'trim', group: 'ladder', name: 'rail-a' },
      { s: 'box', d: [0.03, 0.03, 1.0], at: [0.1, 1.15, 0], c: 'trim', group: 'ladder', name: 'rail-b' },
      ...rungs(-0.5),
      { s: 'box', d: [0.26, 0.07, 0.04], at: [0, 1.11, -0.3], c: CHASSIS },
      { s: 'box', d: [0.26, 0.07, 0.04], at: [0, 1.11, 0.2], c: CHASSIS },
      ...wheels(0.45, -0.6, 0.75),
      // Doors: hinged at the front edge (z 0.78).
      { s: 'box', d: [0.03, 0.3, 0.34], at: [0.485, 0.42, 0.61], c: 'tint', group: 'door-left' },
      { s: 'box', d: [0.05, 0.24, 0.28], at: [0.49, 0.7, 0.61], c: 'glass', group: 'door-left' },
      { s: 'box', d: [0.03, 0.3, 0.34], at: [-0.485, 0.42, 0.61], c: 'tint', group: 'door-right' },
      { s: 'box', d: [0.05, 0.24, 0.28], at: [-0.49, 0.7, 0.61], c: 'glass', group: 'door-right' },
    ],
    damage: [
      {
        name: 'dented', darken: 0.25,
        morph: { handle: { rot: [0, 0, 8] } },
        add: [{ s: 'box', d: [0.04, 0.14, 0.24], at: [0.5, 0.45, 0.2], c: DENT }],
      },
      {
        name: 'wrecked', darken: 0.6, sink: 0.04,
        hide: ['wheel-1'],
        morph: { handle: { rot: [0, 0, 20] }, nozzle: { rot: [18, 0, 0] }, 'reel-hub': { rot: [0, 0, 15] } },
        add: [...smoke(0, 1.0, 0.1, 1.2)],
      },
    ],
  },
];
