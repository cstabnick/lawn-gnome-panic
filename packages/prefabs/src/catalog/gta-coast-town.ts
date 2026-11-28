// Gnome Theft Auto, Saltbucket town (FX11): the giant sunk bucket, the Tall One's spade, marram grass, the stall wares and the promenade's rides and kit.
import type { PrefabDef, Part, Vec3 } from '../types';

const RAD = Math.PI / 180;
const r3 = (n: number): number => Math.round(n * 1000) / 1000;

/** Euler angles (degrees, three's XYZ order) for "pitch about local x, then yaw about world y", so a part can be turned to a heading and then tipped along it. */
function yawPitch(yawDeg: number, pitchDeg: number): Vec3 {
  const sy = Math.sin(yawDeg * RAD), cy = Math.cos(yawDeg * RAD), sa = Math.sin(pitchDeg * RAD), ca = Math.cos(pitchDeg * RAD);
  const y = Math.asin(Math.max(-1, Math.min(1, sy * ca)));
  const x = Math.atan2(sa, cy * ca);
  const z = Math.atan2(-sy * sa, cy);
  return [r3(x / RAD), r3(y / RAD), r3(z / RAD)];
}

// ---- giant bucket rim arc: 9 tangent segments, 120 degrees around (-1, 0, 0), radius 1; the ends sink into the sand.
const RIM_OFF = 0.075;
const RIM_Y = [0.0, 0.02, 0.045, 0.06, 0.07, 0.06, 0.045, 0.02, 0.0];
const RIM_PITCH = [-20, -13, -7, -3, 0, 3, 7, 13, 20];
const RIM_GREY = [0xb9c2c8, 0x9aa6ad];
const rimParts: Part[] = [];
for (let i = 0; i < 9; i++) {
  const th = -60 + (i + 0.5) * (120 / 9);
  const t = th * RAD;
  const y = r3(RIM_Y[i] + RIM_OFF);
  const rot = yawPitch(-th, RIM_PITCH[i]);
  const lipC = i === 2 ? 0x8a5a3a : RIM_GREY[i % 2];
  rimParts.push({ s: 'box', d: [0.1, 0.09, 0.26], at: [r3(-1 + Math.cos(t)), y, r3(Math.sin(t))], rot, c: lipC });
  if (i >= 2 && i <= 6) {
    const wallC = i === 6 ? 0x8a5a3a : RIM_GREY[(i + 1) % 2];
    rimParts.push({ s: 'box', d: [0.02, 0.08, 0.26], at: [r3(-1 + 0.985 * Math.cos(t)), r3(y - 0.04), r3(0.985 * Math.sin(t))], rot, c: wallC });
  }
}
rimParts.push({ s: 'ring', d: [0.035, 0.012], at: [0.06, r3(0.07 + RIM_OFF - 0.02), -0.07], rot: [0, 90, 0], c: 0x9aa6ad, seg: 8 });
rimParts.push({ s: 'ring', d: [0.035, 0.012], at: [0.06, r3(0.07 + RIM_OFF - 0.02), 0.07], rot: [0, 90, 0], c: 0x9aa6ad, seg: 8 });

// ---- giant bucket handle: an elliptical arch, 2.0 wide, 0.7 high, made of 12 thin rods.
const HANDLE_OFF = 0.03;
const handleParts: Part[] = [];
for (let i = 0; i < 12; i++) {
  const a0 = Math.PI - (i * Math.PI) / 12, a1 = Math.PI - ((i + 1) * Math.PI) / 12;
  const x0 = Math.cos(a0), y0 = 0.7 * Math.sin(a0), x1 = Math.cos(a1), y1 = 0.7 * Math.sin(a1);
  const len = Math.hypot(x1 - x0, y1 - y0);
  handleParts.push({
    s: 'cyl', d: [0.025, 0.025, r3(len + 0.02)], at: [r3((x0 + x1) / 2), r3((y0 + y1) / 2 + HANDLE_OFF), 0],
    rot: [0, 0, r3(-Math.atan2(x1 - x0, y1 - y0) / RAD)], c: i % 2 ? 0x9aa6ad : 0xb9c2c8, seg: 6,
  });
}
handleParts.push({ s: 'pill', d: [0.05, 0.35], at: [0, r3(0.7 + HANDLE_OFF), 0], rot: [0, 0, 90], c: 'wood', seg: 8 });
handleParts.push({ s: 'ring', d: [0.045, 0.012], at: [-1.0, 0.05, 0], c: 0x9aa6ad, seg: 8 });
handleParts.push({ s: 'ring', d: [0.045, 0.012], at: [1.0, 0.05, 0], c: 0x9aa6ad, seg: 8 });

// ---- marram grass: a tuft of splayed blades.
const MARRAM: [number, number, number, number, number][] = [
  // yaw, tilt, height, radius, colour
  [0, 6, 0.5, 0.028, 0xc9c28a], [40, 22, 0.46, 0.026, 0xa9b07a], [85, 30, 0.4, 0.026, 0xd8cfa0], [130, 18, 0.5, 0.028, 0xa9b07a],
  [175, 34, 0.38, 0.024, 0xc9c28a], [215, 14, 0.48, 0.028, 0xd8cfa0], [255, 28, 0.42, 0.026, 0xc9c28a], [295, 38, 0.34, 0.024, 0xa9b07a],
  [335, 20, 0.46, 0.026, 0xc9c28a], [20, 44, 0.3, 0.022, 0xd8cfa0],
];
const marramParts: Part[] = MARRAM.map(([yaw, tilt, h, r, c]) => {
  const dx = Math.sin(tilt * RAD) * Math.sin(yaw * RAD), dy = Math.cos(tilt * RAD), dz = Math.sin(tilt * RAD) * Math.cos(yaw * RAD);
  return { s: 'cone', d: [r, h], at: [r3((dx * h) / 2), r3((dy * h) / 2 + 0.012), r3((dz * h) / 2)], rot: yawPitch(yaw, tilt), scale: [1, 1, 0.45], c, seg: 4 } as Part;
});

// ---- dune fence: 11 slots, one slat missing, one leaning.
const SLAT_H = [0.46, 0.42, 0.5, 0.38, 0.47, 0.44, 0, 0.5, 0.4, 0.45, 0.36];
const fenceParts: Part[] = [
  { s: 'box', d: [0.06, 0.62, 0.06], at: [-0.9, 0.31, -0.03], rot: [0, 0, 4], c: 0x7d7568 },
  { s: 'box', d: [0.06, 0.58, 0.06], at: [0.9, 0.29, -0.03], rot: [0, 0, -5], c: 0x8a8274 },
];
SLAT_H.forEach((h, i) => {
  if (h === 0) return;
  const x = -0.85 + i * 0.17;
  const lean = i === 8;
  fenceParts.push({ s: 'box', d: [0.05, h, 0.014], at: [r3(x), r3(h / 2 + 0.01), 0.01], rot: lean ? [0, 0, 14] : undefined, c: i % 2 ? 0x9e978a : 0xb8b2a4 });
});
fenceParts.push({ s: 'box', d: [1.9, 0.012, 0.012], at: [0, 0.14, 0.026], c: 'iron-dark' });
fenceParts.push({ s: 'box', d: [1.9, 0.012, 0.012], at: [0, 0.38, 0.026], c: 'iron-dark' });

// ---- souvenir rack helpers.
const polar = (r: number, deg: number): [number, number] => [r3(r * Math.sin(deg * RAD)), r3(r * Math.cos(deg * RAD))];
const rackParts: Part[] = [
  { s: 'cyl', d: [0.26, 0.29, 0.04], at: [0, 0.02, 0], c: 'wood-dark', seg: 10 },
  { s: 'cyl', d: [0.03, 0.04, 1.0], at: [0, 0.5, 0], c: 'wood', seg: 8 },
  { s: 'ball', d: [0.05], at: [0, 1.03, 0], c: 'brass', seg: 6 },
  { s: 'cyl', d: [0.3, 0.3, 0.015], at: [0, 0.55, 0], c: 'wood-light', seg: 12 },
  { s: 'cyl', d: [0.24, 0.24, 0.015], at: [0, 0.78, 0], c: 'wood-light', seg: 12 },
  { s: 'cyl', d: [0.18, 0.18, 0.015], at: [0, 0.97, 0], c: 'wood-light', seg: 12 },
];
// Tin hooks: little downward cones on the rim of each tier.
for (const [y, r, angs] of [[0.55, 0.3, [20, 110, 200, 290]], [0.78, 0.24, [60, 150, 240, 330]], [0.97, 0.18, [0, 120, 240]]] as [number, number, number[]][]) {
  for (const a of angs) {
    const [x, z] = polar(r, a);
    rackParts.push({ s: 'cone', d: [0.012, 0.06], at: [x, r3(y - 0.04), z], rot: [180, 0, 0], c: 'iron', seg: 4 });
  }
}
function hangGull(deg: number): void {
  const [x, z] = polar(0.3, deg);
  rackParts.push({ s: 'ball', d: [0.05], at: [x, 0.43, z], scale: [0.9, 0.9, 1.3], c: 'white', seg: 6 });
  rackParts.push({ s: 'ball', d: [0.03], at: [x, 0.49, r3(z + 0.05)], c: 'white', seg: 6 });
  rackParts.push({ s: 'cone', d: [0.012, 0.04], at: [x, 0.488, r3(z + 0.1)], rot: [90, 0, 0], c: 'yellow', seg: 4 });
}
function hangHat(deg: number): void {
  const [x, z] = polar(0.24, deg);
  rackParts.push({ s: 'cyl', d: [0.09, 0.09, 0.012], at: [x, 0.68, z], c: 'straw', seg: 8 });
  rackParts.push({ s: 'cyl', d: [0.045, 0.06, 0.05], at: [x, 0.71, z], c: 'black', seg: 8 });
}
hangGull(20); hangGull(200); hangHat(60); hangHat(240);

// ---- chalk board: the front board leans 12 degrees (top towards -z); fb() turns board-local coordinates into prefab space.
const LEAN = 12;
const fb = (lx: number, ly: number, lz: number): Vec3 => [r3(lx), r3(0.4499 + ly * Math.cos(LEAN * RAD) + lz * Math.sin(LEAN * RAD)), r3(0.0956 - ly * Math.sin(LEAN * RAD) + lz * Math.cos(LEAN * RAD))];
const bb = (lx: number, ly: number, lz: number): Vec3 => [r3(lx), r3(0.4499 + ly * Math.cos(LEAN * RAD) + lz * Math.sin(LEAN * RAD)), r3(-0.0956 + ly * Math.sin(LEAN * RAD) - lz * Math.cos(LEAN * RAD))];
const FRONT_ROT: Vec3 = [-LEAN, 0, 0];
const BACK_ROT: Vec3 = [LEAN, 0, 0];
const boardParts: Part[] = [
  { s: 'box', d: [0.52, 0.84, 0.03], at: fb(0, 0, 0), rot: FRONT_ROT, c: 0x2b2b2b },
  { s: 'box', d: [0.6, 0.04, 0.04], at: fb(0, 0.44, 0.005), rot: FRONT_ROT, c: 'wood' },
  { s: 'box', d: [0.6, 0.04, 0.04], at: fb(0, -0.44, 0.005), rot: FRONT_ROT, c: 'wood' },
  { s: 'box', d: [0.04, 0.92, 0.04], at: fb(-0.28, 0, 0.005), rot: FRONT_ROT, c: 'wood' },
  { s: 'box', d: [0.04, 0.92, 0.04], at: fb(0.28, 0, 0.005), rot: FRONT_ROT, c: 'wood' },
  { s: 'box', d: [0.2, 0.012, 0.004], at: fb(0.12, -0.3, 0.018), rot: [-LEAN, 0, 4], c: 'white' },
  { s: 'box', d: [0.14, 0.012, 0.004], at: fb(0.16, -0.34, 0.018), rot: [-LEAN, 0, -3], c: 'white' },
  { s: 'box', d: [0.52, 0.84, 0.03], at: bb(0, 0, 0), rot: BACK_ROT, c: 0x2b2b2b },
  { s: 'box', d: [0.6, 0.04, 0.04], at: bb(0, 0.44, 0.005), rot: BACK_ROT, c: 'wood' },
  { s: 'box', d: [0.6, 0.04, 0.04], at: bb(0, -0.44, 0.005), rot: BACK_ROT, c: 'wood' },
  { s: 'box', d: [0.04, 0.92, 0.04], at: bb(-0.28, 0, 0.005), rot: BACK_ROT, c: 'wood' },
  { s: 'box', d: [0.04, 0.92, 0.04], at: bb(0.28, 0, 0.005), rot: BACK_ROT, c: 'wood' },
  { s: 'cyl', d: [0.015, 0.015, 0.66], at: [0, 0.885, 0], rot: [0, 0, 90], c: 'iron-dark', seg: 6 },
];

// ---- stub shelf: two rows of ledger spines, a roof board with a paper spike.
const SPINE_COLS = [0x8a2f2a, 0x3f6b3a, 0x7a5232, 0x6b2724, 0x4d5d3a, 0x5e3d22, 0x7d3a2e, 0x35563a, 0x8a6a3a];
const SPINE_H = [0.2, 0.22, 0.18, 0.23, 0.21, 0.19, 0.22, 0.2, 0.17];
const shelfParts: Part[] = [
  { s: 'box', d: [0.7, 0.6, 0.02], at: [0, 0.3, -0.08], c: 'wood-dark' },
  { s: 'box', d: [0.02, 0.6, 0.18], at: [-0.34, 0.3, 0], c: 'wood' },
  { s: 'box', d: [0.02, 0.6, 0.18], at: [0.34, 0.3, 0], c: 'wood' },
  { s: 'box', d: [0.66, 0.025, 0.18], at: [0, 0.0125, 0], c: 'wood' },
  { s: 'box', d: [0.66, 0.025, 0.18], at: [0, 0.3, 0], c: 'wood' },
  { s: 'box', d: [0.7, 0.025, 0.18], at: [0, 0.5875, 0], c: 'wood-light' },
];
for (let row = 0; row < 2; row++) {
  const base = row === 0 ? 0.025 : 0.3125;
  for (let i = 0; i < 9; i++) {
    const h = SPINE_H[(i + row * 3) % 9];
    shelfParts.push({ s: 'box', d: [0.068, h, 0.12], at: [r3(-0.288 + i * 0.072), r3(base + h / 2), 0.01], c: SPINE_COLS[(i * 2 + row * 4) % 9] });
  }
}
shelfParts.push({ s: 'cyl', d: [0.006, 0.006, 0.12], at: [0.2, 0.66, 0.02], c: 'iron-dark', seg: 4 });
shelfParts.push({ s: 'cyl', d: [0.03, 0.03, 0.004], at: [0.2, 0.615, 0.02], c: 'paper', seg: 8 });
shelfParts.push({ s: 'cyl', d: [0.028, 0.028, 0.004], at: [0.2, 0.623, 0.02], c: 0xe8dfc4, seg: 8 });
shelfParts.push({ s: 'cyl', d: [0.03, 0.03, 0.004], at: [0.2, 0.632, 0.02], c: 'paper', seg: 8 });

const TAGS = ['saltbucket', 'gta'];

export const GTA_COAST_TOWN: readonly PrefabDef[] = [
  {
    id: 'giant-bucket-rim-arc', name: 'Giant Bucket Rim Arc', category: 'prop', uses: ['place'],
    tags: [...TAGS, 'bucket', 'giant', 'rim', 'tin', 'galvanised', 'sand'], emoji: [],
    about: 'Gnome Theft Auto: a 120-degree arc of the rolled rim of a giant tin bucket breaking out of sand (game scale 20). Centre of the circle at local (-1, 0, 0), radius 1, from -60 to +60 degrees: middle point at (0, ~0.19, 0), ends near (-0.5, 0, +-0.87). Two lug ears on the outside (+x) of the middle. About 0.6 across x, 1.85 along z, 0.19 tall at the middle (ends sink to y 0).',
    examine: [
      'A rolled steel rim as thick as a gnome\'s arm, coming up out of the sand in a long grey curve, rust on one patch.',
      'Shore saying: the bucket is not buried, it is only waiting for a very large tide to come and fill it.',
      'Tip: the rim is warm on sunny days and a fine place to sit, as long as you do not look down the inside.',
      'Joke: the Tall One says it is a bucket, and the Tall One has never once been wrong about a bucket.',
      'Two iron ears stick out where a handle should hook in, and one has a smaller ear tied to it with string.',
    ],
    parts: rimParts,
  },
  {
    id: 'giant-bucket-handle', name: 'Giant Bucket Handle', category: 'prop', uses: ['place'],
    tags: [...TAGS, 'bucket', 'giant', 'handle', 'wire', 'arch', 'tin'], emoji: [],
    about: 'Gnome Theft Auto: the wire handle of the giant bucket (game scale 20), an arch in the x-y plane. Feet (hooked rings) at x -1.0 and +1.0, y 0.05; apex at (0, 0.73); a wooden grip 0.45 long in the middle. About 2.1 wide, 0.8 tall, 0.1 deep.',
    examine: [
      'A wire handle as tall as a gnome and as wide as a rowing boat, with a wooden grip worn smooth by nobody at all.',
      'Shore saying: lift by the handle and the bucket comes up, lift by the bottom and you are in the bucket.',
      'Tip: grip in the middle, where the wood is, because the wire has been out in the weather and has opinions.',
      'Joke: it is the handle of a bucket, and yet it is not the handle of this bucket, which is somehow worse.',
      'One foot hooks into a ring that is a size too small, and the wire has learned to bend about it.',
    ],
    parts: handleParts,
  },
  {
    id: 'giant-spade', name: 'Giant Spade', category: 'prop', uses: ['place'],
    tags: [...TAGS, 'spade', 'giant', 'toy', 'beach', 'plastic', 'red'], emoji: [],
    about: 'Gnome Theft Auto: the Tall One\'s toy beach spade stuck blade-down in sand (game scale 8). Only the top 0.15 of the blade shows (0.5 wide, 0.04 thick, blade face towards +z); a red shaft 1.4 long leans 6 degrees towards +x; D-grip at the top (y about 1.67). About 0.5 wide, 1.7 tall.',
    examine: [
      'A bright red plastic spade, upside-down in the sand with only the top of the blade showing, and it is the size of a tree.',
      'Shore saying: the Tall One dug a hole here once and went home for tea, and the hole is still thinking about it.',
      'Tip: do not pull it out. Whatever the Tall One was digging for, it is a good deal further down than you want to go.',
      'Joke: the toy shop sold it with a tiny bucket, and the tiny bucket is now the giant bucket, which is a longer story.',
      'There are teeth marks on the grip, and they are not gnome-sized.',
    ],
    parts: [
      { s: 'box', d: [0.5, 0.15, 0.04], at: [0, 0.075, 0], c: 0xd8342c },
      { s: 'box', d: [0.12, 0.05, 0.05], at: [0, 0.16, 0], c: 0xb82a24 },
      { s: 'cyl', d: [0.04, 0.04, 1.4], at: [0.073, 0.85, 0], rot: [0, 0, -6], c: 0xd8342c, seg: 8 },
      { s: 'box', d: [0.04, 0.2, 0.06], at: [0.17, 1.52, 0], c: 0xd8342c },
      { s: 'box', d: [0.04, 0.2, 0.06], at: [0.01, 1.52, 0], c: 0xd8342c },
      { s: 'box', d: [0.24, 0.05, 0.06], at: [0.09, 1.65, 0], c: 0xd8342c },
    ],
  },
  {
    id: 'marram-grass', name: 'Marram Grass', category: 'prop', uses: ['place'],
    tags: [...TAGS, 'grass', 'dune', 'marram', 'plant', 'beach'], emoji: [],
    about: 'Gnome Theft Auto: a tuft of bleached dune grass, ten flat blades splaying from one base point (game scale 1.5-3). About 0.5 tall, 0.45 across, no front.',
    examine: [
      'A bleached tuft of tall grass with blades like old bootlaces, leaning every way at once.',
      'Dune saying: marram holds the dune and the dune holds the town, so please do not pick the grass.',
      'Tip: the blades are sharp along the edge, so walk through the tuft and not along it.',
      'Joke: it is the only plant in Saltbucket that has never needed watering, and it is smug about it.',
      'A tiny shell is caught in the roots, and a tinier crab has caught the shell.',
    ],
    parts: marramParts,
  },
  {
    id: 'dune-fence', name: 'Dune Fence', category: 'prop', uses: ['place'],
    tags: [...TAGS, 'fence', 'dune', 'sand', 'slats', 'wire'], emoji: [],
    about: 'Gnome Theft Auto: a weathered sand fence, 2.0 long along x, two leaning posts, ten grey slats of uneven height (one missing, one leaning) and two wires; front is +z (wires side). About 2.0 wide, 0.62 tall, 0.1 deep (game scale 2).',
    examine: [
      'Grey slats strung on two wires between two tired posts, with a gap where a slat gave up and went to the beach.',
      'Dune saying: the fence keeps the sand in and the gnomes out, and it has never once been asked which.',
      'Tip: the sand piles up on the windward side, so stand there and you will be taller than the fence by teatime.',
      'Joke: it was put up to stop the dunes walking off, and the dunes have been walking off round the end ever since.',
      'One slat leans out at an angle that looks deliberate and is probably a gull.',
    ],
    parts: fenceParts,
  },
  {
    id: 'pickle-barrel', name: 'Pickle Barrel', category: 'prop', uses: ['place'],
    tags: [...TAGS, 'pickle', 'barrel', 'gherkin', 'brine', 'stall', 'food'], emoji: [],
    about: 'Gnome Theft Auto: a small open brine barrel with gherkins and a ladle, for the pickle stall counter (game scale 2.4). About 0.3 wide, 0.4 tall (ladle top).',
    examine: [
      'A little barrel of green brine with gherkins bobbing in it and a wooden-handled ladle leaning on the rim.',
      'Stall saying: a pickle is a cucumber that has seen things and come through it.',
      'Tip: ask for one from the bottom, where they have been in the brine longest and have no illusions left.',
      'Joke: the sign says "fresh pickles", and the barrel says "not since March", and the barrel is the honest one.',
      'The brine is exactly the colour of the stall owner\'s coat, and nobody has asked whether that is on purpose.',
    ],
    parts: [
      { s: 'cyl', d: [0.14, 0.13, 0.3], at: [0, 0.15, 0], c: 'wood', seg: 12 },
      { s: 'cyl', d: [0.148, 0.148, 0.02], at: [0, 0.07, 0], c: 'iron-dark', seg: 12 },
      { s: 'cyl', d: [0.148, 0.148, 0.02], at: [0, 0.23, 0], c: 'iron-dark', seg: 12 },
      { s: 'cyl', d: [0.12, 0.12, 0.012], at: [0, 0.303, 0], c: 0xb7c98a, seg: 12 },
      { s: 'pill', d: [0.025, 0.07], at: [-0.04, 0.32, 0.02], rot: [10, 0, 70], c: 0x6f8f3a, seg: 6 },
      { s: 'pill', d: [0.025, 0.07], at: [0.04, 0.325, -0.03], rot: [-20, 0, 20], c: 0x6f8f3a, seg: 6 },
      { s: 'pill', d: [0.025, 0.06], at: [0.03, 0.318, 0.05], rot: [60, 0, 80], c: 0x7fa044, seg: 6 },
      { s: 'pill', d: [0.022, 0.06], at: [-0.03, 0.322, -0.05], rot: [30, 0, -60], c: 0x6f8f3a, seg: 6 },
      { s: 'cyl', d: [0.008, 0.008, 0.22], at: [0.08, 0.3, 0.03], rot: [10, 0, -35], c: 'wood-dark', seg: 5 },
      { s: 'ball', d: [0.03], at: [0.02, 0.31, 0.01], scale: [1, 0.5, 1], c: 'iron', seg: 6 },
    ],
  },
  {
    id: 'cone-bucket-tray', name: 'Cone Bucket Tray', category: 'prop', uses: ['place'],
    tags: [...TAGS, 'ice', 'cream', 'cone', 'bucket', 'tray', 'stall', 'food'], emoji: [],
    about: 'Gnome Theft Auto: a wooden tray of three small tin buckets, each holding an ice-cream cone with a scoop (vanilla, sand-coloured, pink) and a tiny spade, for the ice-cream stall counter (game scale 2.4). About 0.4 wide, 0.17 deep, 0.3 tall.',
    examine: [
      'Three tin buckets in a tray, each with a cone and a scoop and a small spade sticking out, so you can eat it or build with it.',
      'Stall saying: the sand-coloured one is vanilla, mostly, and nobody has been asked to check.',
      'Tip: eat the cone from the top and build with the bucket, and do not do both at once, whatever the sign says.',
      'Joke: the spade is included so you can dig yourself out of the price.',
      'A gull has left a very small footprint in the pink one, and the stall has decided to charge extra for it.',
    ],
    parts: [
      { s: 'box', d: [0.4, 0.03, 0.17], at: [0, 0.015, 0], c: 'wood-light' },
      ...([[-0.13, 0xf4ead0], [0, 0xd8c08a], [0.13, 0xf2a1b8]] as [number, number][]).flatMap(([x, col], i): Part[] => [
        { s: 'cyl', d: [0.05, 0.04, 0.09], at: [x, 0.075, 0], c: 'steel', seg: 8 },
        { s: 'cone', d: [0.034, 0.12], at: [x, 0.14, 0], rot: [180, 0, 0], c: 0xd8a35a, seg: 6 },
        { s: 'ball', d: [0.047], at: [x, 0.215, 0], c: col, seg: 8 },
        { s: 'cyl', d: [0.006, 0.006, 0.1], at: [r3(x + 0.045), 0.15, 0.03], rot: [0, 0, -20 - i * 5], c: 0xd8342c, seg: 4 },
        { s: 'box', d: [0.03, 0.03, 0.006], at: [r3(x + 0.07 + i * 0.002), 0.2, 0.03], c: 0xd8342c },
      ]),
      { s: 'ball', d: [0.012], at: [0.13, 0.263, 0], c: 'red', seg: 5 },
    ],
  },
  {
    id: 'fortune-shell', name: 'Fortune Shell', category: 'prop', uses: ['place'],
    tags: [...TAGS, 'shell', 'scallop', 'fortune', 'paper', 'stall'], emoji: [],
    about: 'Gnome Theft Auto: a big scallop shell standing on its hinge on a little wooden stand, a paper fortune curling out of its front (game scale 2.4). Face towards +z. About 0.3 wide, 0.36 tall, 0.1 deep.',
    examine: [
      'A scallop shell the size of a dinner plate on a little wooden stand, with a paper strip curling out of it like a tongue.',
      'Stall saying: the shell knows what will happen to you, and tells everyone, and charges you for the paper.',
      'Tip: read the fortune out loud to be sure it counts, and then act surprised, because that is what it is for.',
      'Joke: every fortune says "you will meet a tall stranger", and so far every tall stranger has been the same gull.',
      'There is a smaller fortune stuck to the inside which says only "ask again later".',
    ],
    parts: [
      { s: 'cyl', d: [0.07, 0.09, 0.04], at: [0, 0.02, 0], c: 'wood-dark', seg: 8 },
      { s: 'box', d: [0.1, 0.04, 0.05], at: [0, 0.06, 0], c: 0xd9c3a0 },
      { s: 'cyl', d: [0.15, 0.15, 0.03], at: [0, 0.21, 0], rot: [90, 0, 0], c: 0xefdcbc, seg: 12 },
      ...[-50, -25, 0, 25, 50].map((a): Part => ({ s: 'box', d: [0.014, 0.22, 0.01], at: [r3(-Math.sin(a * RAD) * 0.1), r3(0.075 + Math.cos(a * RAD) * 0.1), 0.02], rot: [0, 0, a], c: 0xd9b98a })),
      { s: 'box', d: [0.05, 0.1, 0.004], at: [0.02, 0.1, 0.045], rot: [-25, 0, 8], c: 'paper' },
      { s: 'box', d: [0.05, 0.07, 0.004], at: [0.025, 0.05, 0.08], rot: [-70, 0, 8], c: 'paper' },
    ],
  },
  {
    id: 'stub-shelf', name: 'Stub Shelf', category: 'prop', uses: ['place'],
    tags: [...TAGS, 'shelf', 'ledger', 'office', 'books', 'paper', 'marram'], emoji: [],
    about: 'Gnome Theft Auto: Marram\'s Office ledger shelf: a floor-standing unit with two shelves of ledger spines, a roof board and a spike of paper stubs on top (game scale 2.4). Stands on y = 0, front towards +z. About 0.7 wide, 0.72 tall (roof board at 0.6), 0.2 deep.',
    examine: [
      'Two shelves of ledgers in dull red, green and brown, all of them thick, and one spike of paper stubs on top that nobody will ever read.',
      'Office saying: if it is not in the ledger it did not happen, and if it is in the ledger it happened to someone else.',
      'Tip: the green ones are the tide tables, and the red ones are the tide tables for a tide that did not come.',
      'Joke: the stubs on the spike are receipts for the spike.',
      'One ledger is labelled "Complaints (Closed)" and is the thickest by far.',
    ],
    parts: shelfParts,
  },
  {
    id: 'dropped-candyfloss', name: 'Dropped Candyfloss', category: 'prop', uses: ['place'],
    tags: [...TAGS, 'candyfloss', 'floss', 'sweet', 'dropped', 'food', 'litter'], emoji: [],
    about: 'Gnome Theft Auto: a candyfloss dropped on the ground, lying on its side, white paper stick poking out towards +x (game scale 2-3). About 0.25 long, 0.15 across, 0.15 tall.',
    examine: [
      'A pink cloud on a paper stick, lying on its side on the ground, already collecting sand and regret.',
      'Boardwalk saying: the five-second rule does not apply to candyfloss, because candyfloss has never been alive for five seconds.',
      'Tip: leave it for the gulls, who will not leave it for you.',
      'Joke: Sal says candyfloss is a vegetable, and this one has gone back to the earth.',
      'It is still faintly warm, which is either a good sign or a very bad one.',
    ],
    parts: [
      { s: 'ball', d: [0.075], at: [-0.03, 0.065, 0], scale: [1, 0.85, 0.9], c: 0xf7a8c8, seg: 8 },
      { s: 'ball', d: [0.06], at: [-0.06, 0.052, 0.04], scale: [1, 0.85, 0.9], c: 0xf2c8dc, seg: 8 },
      { s: 'ball', d: [0.065], at: [-0.01, 0.055, -0.04], scale: [1, 0.85, 0.9], c: 0xf7a8c8, seg: 8 },
      { s: 'cyl', d: [0.01, 0.01, 0.2], at: [0.06, 0.018, 0.0], rot: [0, 0, 90], c: 'white', seg: 5 },
    ],
  },
  {
    id: 'rubber-seagull', name: 'Rubber Seagull', category: 'prop', uses: ['place'],
    tags: [...TAGS, 'seagull', 'gull', 'rubber', 'toy', 'squeaky', 'souvenir'], emoji: [],
    about: 'Gnome Theft Auto: a squeaky rubber gull toy, white with grey wing tops and a yellow beak, standing on a squashed orange base; beak towards +z (game scale 2-3). About 0.2 tall, 0.16 wide, 0.2 long.',
    examine: [
      'A rubber seagull with a yellow beak and a look of permanent complaint, squashed flat at the feet so it stays put.',
      'Souvenir saying: squeeze it, and a real gull hears and comes to see what you did.',
      'Tip: do not squeeze it near the fish stall, and do not squeeze it near the fish, and do not squeeze it.',
      'Joke: it is the only gull in Saltbucket you can hold, and it still manages to look at you as if you owe it chips.',
      'A hole in the back lets the squeak out, and the squeak is exactly the pitch of the real gulls.',
    ],
    parts: [
      { s: 'cyl', d: [0.075, 0.085, 0.03], at: [0, 0.015, 0], c: 0xf0a030, seg: 8 },
      { s: 'ball', d: [0.075], at: [0, 0.1, 0], scale: [0.9, 0.9, 1.3], c: 'white', seg: 8 },
      { s: 'ball', d: [0.045], at: [0, 0.165, 0.07], c: 'white', seg: 8 },
      { s: 'cone', d: [0.015, 0.06], at: [0, 0.16, 0.135], rot: [90, 0, 0], c: 0xf0c63a, seg: 5 },
      { s: 'box', d: [0.02, 0.05, 0.12], at: [0.065, 0.115, -0.01], rot: [0, 0, -15], c: 0x9aa0a6, mirror: true },
      { s: 'ball', d: [0.008], at: [0.022, 0.18, 0.105], c: 'black', seg: 4, mirror: true },
      { s: 'box', d: [0.04, 0.02, 0.07], at: [0, 0.1, -0.1], rot: [-20, 0, 0], c: 0x9aa0a6 },
    ],
  },
  {
    id: 'wellies', name: 'Wellies', category: 'prop', uses: ['place'],
    tags: [...TAGS, 'wellies', 'boots', 'wellington', 'green', 'rubber', 'footwear'], emoji: [],
    about: 'Gnome Theft Auto: a pair of green wellington boots standing side by side, toes towards +z; the left (-x) one has slumped over at the top (game scale 2-3). About 0.3 wide, 0.3 tall, 0.22 deep.',
    examine: [
      'Two green wellies standing side by side, black soles, and one of them has given up at the top and is leaning on its elbow.',
      'Shore saying: a gnome with wet feet is a gnome who has been told, and a gnome with wellies is a gnome who has been ignored.',
      'Tip: tip them upside down first. The crab is not the only one who thinks they are a house.',
      'Joke: they are the right way round, which makes them the only pair in Saltbucket that is.',
      'There is a name written inside, in marker, and the name has been crossed out, and another name written in, and crossed out.',
    ],
    parts: [
      { s: 'box', d: [0.095, 0.03, 0.22], at: [0.075, 0.015, 0.03], c: 'black', mirror: true },
      { s: 'box', d: [0.085, 0.07, 0.17], at: [0.075, 0.065, 0.05], c: 0x3f6b3a, mirror: true },
      { s: 'cyl', d: [0.045, 0.05, 0.22], at: [0.075, 0.14, -0.01], c: 0x3f6b3a, seg: 8, mirror: true },
      { s: 'cyl', d: [0.052, 0.052, 0.012], at: [0.075, 0.256, -0.01], c: 0x35593a, seg: 8 },
      { s: 'cyl', d: [0.05, 0.047, 0.08], at: [-0.115, 0.265, -0.005], rot: [0, 0, 58], c: 0x3f6b3a, seg: 8 },
    ],
  },
  {
    id: 'souvenir-rack', name: 'Souvenir Rack', category: 'prop', uses: ['place'],
    tags: [...TAGS, 'souvenir', 'rack', 'stand', 'hooks', 'seagull', 'pirate', 'hat', 'stall'], emoji: [],
    about: 'Gnome Theft Auto: a spinning souvenir stand: a post with three wooden tiers of tin hooks, two rubber seagulls and two straw pirate hats hanging on it (game scale 2). About 0.58 across, 1.08 tall.',
    examine: [
      'A post with three round shelves of tin hooks, and on the hooks, two rubber gulls and two straw pirate hats that say "Authentic" and are not.',
      'Souvenir saying: take home a piece of Saltbucket, which is a gull, a hat or an argument.',
      'Tip: spin it slowly. The stall owner can tell when you spin it fast, and he takes it personally.',
      'Joke: the pirate hats are straw, because the pirates were poor, and the gulls are rubber, because the gulls were not.',
      'The top hook has nothing on it, and a card that reads: "Reserved for the Mayor\'s head."',
    ],
    parts: rackParts,
  },
  {
    id: 'fare-tin', name: 'Fare Tin', category: 'prop', uses: ['place'],
    tags: [...TAGS, 'tin', 'fare', 'money', 'box', 'coin', 'slot', 'blue'], emoji: [],
    about: 'Gnome Theft Auto: a dented blue tin money box with a white stripe and a coin slot in front (+z), on a short post (game scale 2-3). About 0.3 wide, 0.22 deep, 0.6 tall.',
    examine: [
      'A blue tin with a white stripe and a slot, bolted on a post, and a dent on the front that was somebody\'s argument.',
      'Boardwalk saying: the fare is one coin, and the coin is not coming back.',
      'Tip: coins go in, and rides come out, and sometimes it is the other way about, but you will have to ask nicely.',
      'Joke: it has never been emptied, which is a rumour the tin started itself, and it rattles to prove it.',
      'A note on the lid reads: "Exact change. No change. Thank you."',
    ],
    parts: [
      { s: 'cyl', d: [0.04, 0.05, 0.35], at: [0, 0.175, 0], c: 'wood', seg: 8 },
      { s: 'box', d: [0.28, 0.23, 0.2], at: [0, 0.465, 0], c: 0x2f6fa8 },
      { s: 'box', d: [0.286, 0.04, 0.206], at: [0, 0.5, 0], c: 'white' },
      { s: 'box', d: [0.3, 0.02, 0.22], at: [0, 0.59, 0], c: 0x2a5f92 },
      { s: 'box', d: [0.1, 0.012, 0.012], at: [0, 0.545, 0.102], c: 'black' },
      { s: 'box', d: [0.07, 0.05, 0.012], at: [-0.07, 0.42, 0.102], rot: [0, 0, 20], c: 0x24557f },
      { s: 'box', d: [0.04, 0.04, 0.012], at: [0.08, 0.44, 0.102], rot: [0, 0, -15], c: 0x24557f },
    ],
  },
  {
    id: 'spokewheel-bell', name: 'Spokewheel Bell', category: 'prop', uses: ['place'],
    tags: [...TAGS, 'spokewheel', 'bell', 'brass', 'ship', 'gallows', 'rope'], emoji: [],
    about: 'Gnome Theft Auto: a brass ship\'s bell hanging from a small wooden gallows with a pull rope (game scale 2.2). Front towards +z. Post at x -0.22, beam y 1.18, bell mouth 0.75 up at x 0.08, rope hangs to y 0.2. About 0.5 wide, 1.2 tall.',
    examine: [
      'A brass ship\'s bell on a wooden gallows, with a rope and a knot at the bottom for a gnome to pull, and a polished spot on the knot.',
      'Boardwalk saying: ring once to board, twice to leave, three times to say it was not you.',
      'Tip: pull the rope smoothly. A jerk makes a clang, and a clang wakes the Bathtub Queen, who does not like to be woken.',
      'Joke: the bell came from a ship that never sank, which is why it is so loud about it.',
      'Engraved round the rim: "Property of the Spokewheel. If found, do not ring."',
    ],
    parts: [
      { s: 'box', d: [0.2, 0.03, 0.2], at: [-0.22, 0.015, 0], c: 'wood-dark' },
      { s: 'cyl', d: [0.035, 0.045, 1.2], at: [-0.22, 0.6, 0], c: 'wood', seg: 8 },
      { s: 'box', d: [0.5, 0.05, 0.05], at: [0.01, 1.18, 0], c: 'wood' },
      { s: 'box', d: [0.04, 0.22, 0.03], at: [-0.12, 1.08, 0], rot: [0, 0, 45], c: 'wood-dark' },
      { s: 'cyl', d: [0.008, 0.008, 0.06], at: [0.08, 1.12, 0], c: 'iron-dark', seg: 5 },
      { s: 'cyl', d: [0.03, 0.05, 0.06], at: [0.08, 1.07, 0], c: 0xc9a227, seg: 8 },
      { s: 'cyl', d: [0.05, 0.13, 0.28], at: [0.08, 0.89, 0], c: 0xc9a227, seg: 10 },
      { s: 'cyl', d: [0.15, 0.15, 0.025], at: [0.08, 0.762, 0], c: 0xb18f1f, seg: 10 },
      { s: 'ball', d: [0.035], at: [0.08, 0.72, 0], c: 'iron-dark', seg: 6 },
      { s: 'cyl', d: [0.009, 0.009, 0.5], at: [0.08, 0.45, 0], c: 'burlap', seg: 5 },
      { s: 'ball', d: [0.03], at: [0.08, 0.2, 0], c: 'burlap', seg: 6 },
    ],
  },
  {
    id: 'chalk-tour-board', name: 'Chalk Tour Board', category: 'prop', uses: ['place'],
    tags: [...TAGS, 'chalkboard', 'board', 'sign', 'tour', 'a-frame', 'chalk'], emoji: [],
    about: 'Gnome Theft Auto: an A-frame chalkboard, two black boards leaning together on a hinge bar (game scale 2). Boards lean 12 degrees (tops towards -z). FRONT FACE: flat black board 0.52 wide x 0.84 long, its centre at height y 0.45, outer surface z 0.11 (the wooden frame stands 0.005 proud of it), face normal tilted up 12 degrees from +z. Apex y 0.9, base z -0.2..0.2. About 0.6 wide, 0.9 tall, 0.4 deep. Two chalk scribbles sit at its lower right, 0.3 below centre.',
    examine: [
      'An A-frame blackboard in a wooden frame, with a bit of chalk scribble on the front and a dry wipe where something was crossed out.',
      'Boardwalk saying: tours at noon, cargo at midnight, and the chalk will be up to date by tea.',
      'Tip: read the board before the tour, not during, because the tour will move on and the board will not.',
      'Joke: the tour guide updates it daily, and so far the only thing that has changed is the spelling.',
      'The back of the board says "Back soon", and the same hand has written "Back" next to it, and then nothing.',
    ],
    parts: boardParts,
  },
];
