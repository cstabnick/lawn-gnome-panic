// Gnome Theft Auto, the Saltbucket strand (FX11): beach-scene kit (groynes, rowing boat, rock pool, windbreak, wreck rib, lifebuoy post, winch), the Saltcut daymark and the fishing smack.
import type { Part, PrefabDef } from '../types';

const D2R = Math.PI / 180;
const r3 = (n: number): number => Math.round(n * 1000) / 1000;

/** Tilt parts about the z axis through the point (px, 0): lays a boat onto one side. Only z rotations are added. */
function tilt(parts: readonly Part[], deg: number, px: number): Part[] {
  const s = Math.sin(deg * D2R);
  const c = Math.cos(deg * D2R);
  return parts.map((p) => {
    const [x, y, z] = p.at ?? [0, 0, 0];
    const [rx, ry, rz] = p.rot ?? [0, 0, 0];
    return { ...p, at: [r3(px + (x - px) * c - y * s), r3((x - px) * s + y * c), z], rot: [rx, ry, rz + deg] };
  });
}

// Groyne: nine uneven piles along z, two planks bolted along them, weed at the sea end (+z).
const GROYNE_H = [0.42, 0.36, 0.5, 0.4, 0.32, 0.46, 0.38, 0.3, 0.44];
const GROYNE_PILES: Part[] = GROYNE_H.map((h, i) => ({
  s: 'cyl', d: [0.05, 0.055, h], at: [i % 2 ? 0.012 : -0.012, h / 2, r3(-1.4 + i * 0.35)],
  c: i % 3 === 1 ? 0x5a4a38 : 0x6b5a45, seg: 7,
}));

// Rock pool: a ring of squashed rocks round a shallow disc of water; weed on two rocks, a starfish on the first.
const POOL_ROCKS: Part[] = [0.2, 0.15, 0.18, 0.21, 0.16, 0.19, 0.14].map((rad, i, all) => {
  const a = (i / all.length) * Math.PI * 2 + 0.3;
  return {
    s: 'ball', d: [rad], at: [r3(Math.cos(a) * 0.55), r3(rad * 0.7), r3(Math.sin(a) * 0.5)], scale: [1.1, 0.7, 1],
    c: i % 2 ? 0x8e8a80 : 0x7d7a72, seg: 7,
  };
});
const rockTop = (i: number): [number, number, number] => {
  const p = POOL_ROCKS[i];
  return [p.at![0], r3(p.at![1] * 2), p.at![2]];
};
const STAR: Part[] = [0, 1, 2, 3, 4].map((i) => {
  const a = i * 72 * D2R;
  const [rx, ry, rz] = rockTop(0);
  return { s: 'box', d: [0.035, 0.014, 0.13], at: [r3(rx + Math.sin(a) * 0.05), r3(ry - 0.012), r3(rz + Math.cos(a) * 0.05)], rot: [0, i * 72, 0], c: 0xe8822e };
});
const POOL_WEED: Part[] = [2, 4].map((i) => {
  const [rx, ry, rz] = rockTop(i);
  return { s: 'ball', d: [0.06], at: [rx, r3(ry - 0.03), rz], scale: [1.4, 0.5, 1.2], c: 0x4f6b3a, seg: 6 };
});

// Windbreak: five poles, four panels each turned 10 degrees, two stripes per panel.
const WB_POLES: Part[] = [0, 1, 2, 3, 4].map((i) => ({
  s: 'cyl', d: [0.014, 0.016, 0.7], at: [r3(-0.8 + i * 0.4), 0.35, i % 2 ? -0.035 : 0.035], c: 'wood', seg: 6,
}));
const WB_PANELS: Part[] = [0, 1, 2, 3].flatMap((i): Part[] => {
  const deg = i % 2 ? -10 : 10;
  const cx = -0.6 + i * 0.4;
  const dx = Math.cos(deg * D2R) * 0.1;
  const dz = -Math.sin(deg * D2R) * 0.1;
  return [
    { s: 'box', d: [0.2, 0.46, 0.012], at: [r3(cx - dx), 0.42, r3(-dz)], rot: [0, deg, 0], c: i % 2 ? 'trim' : 'tint' },
    { s: 'box', d: [0.2, 0.46, 0.012], at: [r3(cx + dx), 0.42, r3(dz)], rot: [0, deg, 0], c: i % 2 ? 'tint' : 'trim' },
  ];
});

// Wreck ribs: stern (-z) to bow (+z), shrinking; the third has lost its starboard side.
const RIB_W = [0.9, 0.82, 0.72, 0.58, 0.42];
const RIBS: Part[] = RIB_W.flatMap((w, i): Part[] => {
  const z = r3(-0.7 + i * 0.35);
  const h = w * 0.55;
  const col = i % 2 ? 0x9e927a : 0xb8ac94;
  const lean = 20;
  const side = (sign: number, len: number): Part => ({
    s: 'box', d: [0.05, r3(len), 0.06],
    at: [r3(sign * (w * 0.25 + (len / 2) * Math.sin(lean * D2R))), r3(0.04 + (len / 2) * Math.cos(lean * D2R)), z],
    rot: [0, 0, -sign * lean], c: col,
  });
  return [
    { s: 'box', d: [r3(w * 0.5), 0.05, 0.06], at: [0, 0.05, z], c: col },
    side(-1, h),
    side(1, i === 2 ? h * 0.35 : h),
  ];
});

// Lifebuoy bands at 0, 90, 180, 270 degrees.
const BUOY_BANDS: Part[] = [0, 90, 180, 270].map((deg) => ({
  s: 'box', d: [0.1, 0.06, 0.1],
  at: [r3(Math.cos(deg * D2R) * 0.17), r3(0.55 + Math.sin(deg * D2R) * 0.17), 0.095], rot: [0, 0, deg], c: 'white',
}));

// Daymark: four stacked stripes and a rocky foot.
const TOWER: Part[] = [0, 1, 2, 3].map((i) => ({
  s: 'cyl', d: [r3(0.155 - i * 0.02), r3(0.175 - i * 0.02), 0.35], at: [0, r3(0.295 + i * 0.35), 0],
  c: i % 2 ? 'white' : 0xd8342c, seg: 10,
}));
const DAY_ROCKS: Part[] = [0, 1, 2, 3, 4].map((i) => {
  const a = i * 72 * D2R + 0.4;
  const rad = 0.13 + (i % 2) * 0.03;
  return { s: 'ball', d: [rad], at: [r3(Math.cos(a) * 0.22), r3(rad * 0.7), r3(Math.sin(a) * 0.22)], scale: [1.1, 0.7, 1.1], c: i % 2 ? 0x7d7a72 : 0x8e8a80, seg: 7 };
});

// Hung net: nine hanging strands, three sagging rows, three corks.
const NET_X = [-0.54, -0.405, -0.27, -0.135, 0, 0.135, 0.27, 0.405, 0.54];
const NET_STRANDS: Part[] = NET_X.map((x) => {
  const bottom = 0.38 + 0.12 * (x / 0.6) ** 2;
  const len = 0.96 - bottom;
  return { s: 'box', d: [0.012, r3(len), 0.012], at: [x, r3(bottom + len / 2), 0], c: 0x5a6b5a };
});
const NET_ROWS: Part[] = [0.85, 0.7, 0.55].flatMap((y): Part[] => {
  const a = r3(Math.atan(0.06 / 0.6) / D2R);
  return [
    { s: 'box', d: [0.6, 0.012, 0.012], at: [-0.3, r3(y - 0.03), 0], rot: [0, 0, -a], c: 0x5a6b5a },
    { s: 'box', d: [0.6, 0.012, 0.012], at: [0.3, r3(y - 0.03), 0], rot: [0, 0, a], c: 0x5a6b5a },
  ];
});

// Oars: crossed, 12 degrees off vertical, 1.2 long, blade across the top 0.4.
const OAR_A = 12 * D2R;
function oarParts(sign: number, z: number): Part[] {
  const sx = sign * Math.sin(OAR_A);
  const cy = Math.cos(OAR_A);
  const base = 0.6 * cy + 0.003;
  const rot: [number, number, number] = [0, 0, -sign * 12];
  return [
    { s: 'cyl', d: [0.015, 0.015, 1.2], at: [0, r3(base), z], rot, c: 'wood-light', seg: 6 },
    { s: 'box', d: [0.1, 0.4, 0.02], at: [r3(sx * 0.4), r3(base + 0.4 * cy), z], rot, c: 0x2f6fa8 },
    { s: 'ball', d: [0.025], at: [r3(-sx * 0.5), r3(base - 0.5 * cy), z], c: 'wood', seg: 6 },
  ];
}

// Towel line: a towel hangs from (x, 0.86) in four stripes of 0.125; deg turns it about that hanging point.
function towel(x: number, deg: number, a: number | 'white', b: number | 'white'): Part[] {
  const s = Math.sin(deg * D2R);
  const c = Math.cos(deg * D2R);
  return [0, 1, 2, 3].map((i): Part => {
    const ly = -0.0625 - i * 0.125;
    return { s: 'box', d: [0.35, 0.125, 0.022], at: [r3(x - ly * s), r3(0.86 + ly * c), 0], rot: [0, 0, deg], c: i % 2 ? b : a };
  });
}

export const GTA_COAST_BEACH: readonly PrefabDef[] = [
  {
    id: 'groyne', name: 'Sea Groyne', category: 'prop', uses: ['place'],
    tags: ['groyne', 'breakwater', 'piles', 'timber', 'beach', 'sea', 'saltbucket', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a timber sea groyne section, 2.98 long along z (the sea end is +z), 0.2 wide, 0.5 tall at scale 1, nine uneven piles, two planks, weed at the sea end. Origin: centre, on the sand. Game scale 3.',
    examine: [
      'A row of weathered piles with two planks bolted along them, running down the beach to the sea like a very slow fence.',
      'Shore saying: the groyne holds the sand, the sand holds the beach, and nobody holds the groyne.',
      'Tip: the weedy end is slippery, the dry end is not, and the middle is both depending on the hour.',
      'Joke: it was built to stop the sand wandering off, and the sand has opinions about being managed.',
      'Someone has carved a tide table into the top plank, and every figure in it is wrong by a different amount.',
    ],
    parts: [
      ...GROYNE_PILES,
      { s: 'box', d: [0.035, 0.09, 2.98], at: [-0.065, 0.2, 0], c: 0x7a6850 },
      { s: 'box', d: [0.035, 0.09, 2.9], at: [0.065, 0.26, 0], c: 0x6b5a45 },
      { s: 'ball', d: [0.06], at: [0.04, 0.03, 1.4], scale: [1.4, 0.5, 1.6], c: 0x4f6b3a, seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.05, 0.025, 1.05], scale: [1.4, 0.5, 1.5], c: 0x4f6b3a, seg: 6 },
      { s: 'ball', d: [0.05], at: [0.05, 0.025, 0.7], scale: [1.3, 0.5, 1.4], c: 0x4f6b3a, seg: 6 },
    ],
  },
  {
    id: 'rowing-boat', name: 'Beached Rowing Boat', category: 'prop', uses: ['place'],
    tags: ['boat', 'rowing', 'clinker', 'oars', 'beach', 'sea', 'saltbucket', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a small clinker rowing boat pulled up on the sand, about 1.4 long (bow +z), 0.5 wide, 0.3 tall at scale 1, tilted 8 degrees onto one side. White hull, blue stripe, two thwarts, two oars, a painter trailing from the bow. Origin: centre, on the sand. Game scale 2.5.',
    examine: [
      'A white clinker boat tipped onto one side, a blue stripe round the top, two oars across the seats and a rope trailing off the bow.',
      'Shore saying: a boat on the sand is a boat that has made its decision.',
      'Tip: the oars are not tied in, so the first gnome to climb aboard should sit down before anything else does.',
      'Joke: the painter rope is tied to nothing, which is the most honest mooring on the whole Shore.',
      'Someone has painted a name on the stern in very small letters, and the name is "Not Yet".',
    ],
    parts: [
      ...tilt([
        { s: 'box', d: [0.4, 0.05, 1.2], at: [0, 0.025, 0], c: 'white' },
        { s: 'box', d: [0.03, 0.1, 1.2], at: [-0.215, 0.1, 0], c: 'white' },
        { s: 'box', d: [0.03, 0.1, 1.2], at: [0.215, 0.1, 0], c: 'white' },
        { s: 'box', d: [0.03, 0.1, 1.3], at: [-0.24, 0.2, 0], c: 'white' },
        { s: 'box', d: [0.03, 0.1, 1.3], at: [0.24, 0.2, 0], c: 'white' },
        { s: 'box', d: [0.034, 0.035, 1.31], at: [-0.24, 0.215, 0], c: 0x2f6fa8 },
        { s: 'box', d: [0.034, 0.035, 1.31], at: [0.24, 0.215, 0], c: 0x2f6fa8 },
        { s: 'box', d: [0.03, 0.025, 1.32], at: [-0.245, 0.26, 0], c: 'wood-light' },
        { s: 'box', d: [0.03, 0.025, 1.32], at: [0.245, 0.26, 0], c: 'wood-light' },
        { s: 'box', d: [0.5, 0.24, 0.04], at: [0, 0.14, -0.64], c: 'white' },
        { s: 'box', d: [0.5, 0.26, 0.04], at: [0, 0.15, 0.66], rot: [15, 0, 0], c: 'white' },
        { s: 'box', d: [0.5, 0.03, 0.12], at: [0, 0.17, -0.2], c: 'wood-light' },
        { s: 'box', d: [0.5, 0.03, 0.12], at: [0, 0.17, 0.2], c: 'wood-light' },
        { s: 'cyl', d: [0.012, 0.012, 0.8], at: [0, 0.2, -0.2], rot: [0, 0, 90], c: 'wood', seg: 6 },
        { s: 'box', d: [0.2, 0.012, 0.07], at: [0.3, 0.2, -0.2], c: 0x2f6fa8 },
        { s: 'cyl', d: [0.012, 0.012, 0.8], at: [0, 0.2, 0.2], rot: [0, 0, 90], c: 'wood', seg: 6 },
        { s: 'box', d: [0.2, 0.012, 0.07], at: [-0.3, 0.2, 0.2], c: 0x2f6fa8 },
      ], 8, -0.2),
      { s: 'cyl', d: [0.012, 0.012, 0.29], at: [-0.04, 0.15, 0.745], rot: [-22.5, 0, 0], c: 'burlap', seg: 5 },
      { s: 'box', d: [0.02, 0.02, 0.22], at: [-0.03, 0.011, 0.9], rot: [0, 15, 0], c: 'burlap' },
      { s: 'box', d: [0.02, 0.02, 0.14], at: [0.04, 0.011, 1.04], rot: [0, -35, 0], c: 'burlap' },
    ],
  },
  {
    id: 'rock-pool', name: 'Rock Pool', category: 'prop', uses: ['place'],
    tags: ['rock', 'pool', 'tide', 'starfish', 'water', 'beach', 'saltbucket', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a ring of seven rounded rocks, about 1.3 across and 0.3 tall at scale 1, round a shallow disc of water (top at y 0.03), weed on two rocks and an orange starfish on the tallest. Origin: centre, on the sand. Game scale 3.',
    examine: [
      'A ring of grey rocks round a puddle the sea forgot to take back, with a little weed and one orange starfish on top.',
      'Shore saying: everything in a rock pool is waiting for the tide, and the tide is in no hurry.',
      'Tip: look, but do not poke the starfish, because it has been there longer than you have had opinions.',
      'Joke: the pool contains two crabs, one limpet and a bottle top, and the bottle top is the one in charge.',
      'The water is only a finger deep, but a very small crab has built a very large house in it.',
    ],
    parts: [
      { s: 'cyl', d: [0.5, 0.5, 0.02], at: [0, 0.02, 0], c: 0x6fa8b8, seg: 14 },
      ...POOL_ROCKS,
      ...POOL_WEED,
      ...STAR,
    ],
  },
  {
    id: 'windbreak', name: 'Beach Windbreak', category: 'prop', uses: ['place'],
    tags: ['windbreak', 'canvas', 'stripes', 'beach', 'saltbucket', 'gta'], emoji: [],
    tint: 0xe8453c, trim: 0xf2f2ee,
    about: 'Gnome Theft Auto: a striped canvas windbreak, 1.6 long along x, 0.7 tall, 0.1 deep at scale 1, on five wooden poles, each panel turned 10 degrees. Tint = one stripe, trim = the other. Origin: centre, on the sand.',
    examine: [
      'Four panels of striped canvas on five poles, zig-zagged so that the wind has to take the long way round.',
      'Shore saying: the windbreak keeps out the wind, and everything else that was going to be a story.',
      'Tip: park it with the long side facing the sea, and the sandwiches will stay on the plate for nearly a minute.',
      'Joke: it breaks the wind perfectly and the wind has simply started coming from underneath.',
      'One panel has a patch sewn on, and the patch has a patch, and nobody remembers what was there at the start.',
    ],
    parts: [...WB_POLES, ...WB_PANELS],
  },
  {
    id: 'wreck-rib', name: 'Wreck Ribs', category: 'prop', uses: ['place'],
    tags: ['wreck', 'ribs', 'keel', 'timber', 'bleached', 'beach', 'saltbucket', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the bleached ribs of an old wreck, a keel 1.8 long along z (bow +z) and five ribs shrinking toward the bow, the middle one broken, 0.9 wide and 0.5 tall at scale 1. Origin: centre, keel on the sand. Game scale 4.',
    examine: [
      'A bare keel with five curved ribs standing up out of the sand, the middle one snapped, all of it bleached the colour of old bone.',
      'Shore saying: every wreck on the Shore was a ship once, and every ship thought it was the exception.',
      'Tip: the ribs make a fine windbreak and a poor shelter, and the keel makes a very good bench for sulking.',
      'Joke: the wreck has been here so long that the gulls have started calling it the old neighbourhood.',
      'Something is carved on the keel, worn smooth, and the only word left is "Pickle".',
    ],
    parts: [
      { s: 'box', d: [0.1, 0.08, 1.8], at: [0, 0.04, 0], c: 0x9e927a },
      ...RIBS,
    ],
  },
  {
    id: 'lifebuoy-post', name: 'Lifebuoy Post', category: 'prop', uses: ['place'],
    tags: ['lifebuoy', 'post', 'safety', 'ring', 'emergency', 'beach', 'saltbucket', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a red and white post, 0.9 tall and 0.1 wide at scale 1, with a red and white lifebuoy on a hook and an IN EMERGENCY plate, all facing +z. Origin: centre of the foot. Game scale 2.',
    examine: [
      'A red and white post with a lifebuoy hung on a hook and a small white plate that says IN EMERGENCY, in letters of fading confidence.',
      'Shore saying: the lifebuoy has never been used, which the town considers a perfect safety record.',
      'Tip: in an emergency, read the plate, then the plate under it, then give up and throw the ring anyway.',
      'Joke: the emergency has to be a specific one, and the plate does not say which, so the town is still waiting for it.',
      'The ring is tied on with a knot nobody can undo, which counts as a safety feature if you ask the HOA.',
    ],
    parts: [
      { s: 'box', d: [0.09, 0.3, 0.09], at: [0, 0.15, 0], c: 0xd8342c },
      { s: 'box', d: [0.095, 0.3, 0.095], at: [0, 0.45, 0], c: 'white' },
      { s: 'box', d: [0.09, 0.3, 0.09], at: [0, 0.75, 0], c: 0xd8342c },
      { s: 'box', d: [0.12, 0.03, 0.12], at: [0, 0.905, 0], c: 'white' },
      { s: 'ring', d: [0.17, 0.045], at: [0, 0.55, 0.095], c: 0xd8342c, seg: 12 },
      ...BUOY_BANDS,
      { s: 'box', d: [0.025, 0.025, 0.1], at: [0, 0.765, 0.085], c: 'iron-dark' },
      { s: 'box', d: [0.2, 0.08, 0.014], at: [0, 0.84, 0.052], c: 'white' },
      { s: 'box', d: [0.15, 0.016, 0.006], at: [0, 0.84, 0.06], c: 'black' },
    ],
  },
  {
    id: 'fishing-winch', name: 'Fishing Winch', category: 'prop', uses: ['place'],
    tags: ['winch', 'capstan', 'rope', 'fishing', 'boat', 'beach', 'saltbucket', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a beach capstan winch, a wooden drum on a frame with four spokes and rope wound round it, the rope leading off along +z, a stake beside it; about 0.6 tall and 0.6 wide at scale 1. Origin: the drum, on the sand. Game scale 2.',
    examine: [
      'A wooden drum on a low frame, four spokes on top and a rope wound round it, running down the beach towards the sea.',
      'Shore saying: the winch pulls the boat in, and the boat pulls the gnome out, and so it goes.',
      'Tip: push the spokes with your whole back, and walk in a circle, and do not think about how long you have been walking.',
      'Joke: the winch has pulled in forty boats and a piano, and it is still not sure which one was the mistake.',
      'The stake in the sand has a rope burn on one side and a name scratched on the other, and the name is Bernard.',
    ],
    parts: [
      { s: 'box', d: [0.5, 0.05, 0.12], at: [0, 0.025, 0], c: 'wood-dark' },
      { s: 'box', d: [0.12, 0.05, 0.5], at: [0, 0.025, 0], c: 'wood' },
      { s: 'cyl', d: [0.03, 0.03, 0.52], at: [0, 0.26, 0], c: 'iron-dark', seg: 6 },
      { s: 'cyl', d: [0.085, 0.1, 0.27], at: [0, 0.285, 0], c: 'wood-light', seg: 10 },
      { s: 'ring', d: [0.105, 0.012], at: [0, 0.22, 0], rot: [90, 0, 0], c: 'burlap', seg: 8 },
      { s: 'ring', d: [0.105, 0.012], at: [0, 0.29, 0], rot: [90, 0, 0], c: 'burlap', seg: 8 },
      { s: 'ring', d: [0.105, 0.012], at: [0, 0.36, 0], rot: [90, 0, 0], c: 'burlap', seg: 8 },
      { s: 'box', d: [0.5, 0.03, 0.03], at: [0, 0.53, 0], c: 'wood-dark' },
      { s: 'box', d: [0.03, 0.03, 0.5], at: [0, 0.53, 0], c: 'wood-dark' },
      { s: 'box', d: [0.02, 0.02, 0.52], at: [0.105, 0.15, 0.225], rot: [30, 0, 0], c: 'burlap' },
      { s: 'cyl', d: [0.012, 0.018, 0.3], at: [-0.22, 0.14, 0.3], rot: [-15, 0, 0], c: 'wood-dark', seg: 6 },
      { s: 'box', d: [0.14, 0.02, 0.02], at: [-0.15, 0.03, 0.3], rot: [0, 20, 0], c: 'burlap' },
    ],
  },
  {
    id: 'saltcut-daymark', name: 'Saltcut Daymark', category: 'prop', uses: ['place'],
    tags: ['lighthouse', 'daymark', 'tower', 'saltcut', 'light', 'beach', 'saltbucket', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a tiny striped red and white lighthouse, about 2.0 tall and 0.5 across the rocky base at scale 1, a gallery, an amber lantern room (a warm light inside) and a cone cap. Front +z. Origin: centre of the base. Game scale 4.',
    examine: [
      'A tiny red and white tower on a heap of rocks, with a lantern on top that glows amber long before it is really dark.',
      'Shore saying: the Saltcut light is not there to guide you, it is there to remind the rocks you know about them.',
      'Tip: steer for the lamp, then steer away from the rocks the lamp is standing on, which is the harder half.',
      'Joke: it is a lighthouse about a gnome and a half tall, so it does not so much warn ships as ask them politely.',
      'The little door at the foot is painted shut, and on the other side, according to the plaque, is a very small keeper.',
    ],
    lights: [{ at: [0, 1.64, 0], c: 0xffc46b, intensity: 0.8, distance: 3 }],
    parts: [
      { s: 'ball', d: [0.22], at: [0, 0.13, 0], scale: [1, 0.6, 1], c: 0x7d7a72, seg: 8 },
      ...DAY_ROCKS,
      ...TOWER,
      { s: 'box', d: [0.07, 0.14, 0.04], at: [0, 0.27, 0.17], c: 'wood-dark' },
      { s: 'box', d: [0.04, 0.07, 0.06], at: [0, 0.6, 0.13], c: 'ink' },
      { s: 'box', d: [0.04, 0.07, 0.06], at: [0, 1.3, 0.1], c: 'ink' },
      { s: 'cyl', d: [0.17, 0.17, 0.03], at: [0, 1.535, 0], c: 'iron-dark', seg: 10 },
      { s: 'ring', d: [0.165, 0.01], at: [0, 1.6, 0], rot: [90, 0, 0], c: 'iron-dark', seg: 10 },
      { s: 'cyl', d: [0.085, 0.085, 0.2], at: [0, 1.65, 0], c: 'glass', alpha: 0.4, seg: 10 },
      { s: 'cyl', d: [0.05, 0.05, 0.14], at: [0, 1.65, 0], c: 0xffc46b, glow: true, seg: 8 },
      { s: 'cone', d: [0.11, 0.22], at: [0, 1.86, 0], c: 0xd8342c, seg: 10 },
    ],
  },
  {
    id: 'fishing-smack', name: 'Fishing Smack', category: 'prop', uses: ['place'],
    tags: ['boat', 'smack', 'fishing', 'ship', 'sail', 'sea', 'saltbucket', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a small sea-going fishing boat seen far out, 2.0 long along z (bow +z), 0.7 wide, 1.5 tall at scale 1, a dark hull with a red waterline band, a white wheelhouse aft, one mast with a tan sail and a net boom. Waterline is y 0.15, hull bottom at y 0. Origin: centre. Game scale 6.',
    examine: [
      'A small dark fishing boat with a red stripe at the waterline, a white wheelhouse at the back and one tan sail on a single mast.',
      'Shore saying: the smack goes out before dawn and comes back after dark, and what it catches is a family matter.',
      'Tip: wave from the pier and it will wave back, but do not shout, because the captain is also the cook and the choir.',
      'Joke: the smack has a net boom for hauling fish, and so far it has hauled in a barrel, a boot and one polite eel.',
      'The wheelhouse window is always lit, and the figure inside has not moved since breakfast, or possibly last Tuesday.',
    ],
    parts: [
      { s: 'box', d: [0.66, 0.3, 1.2], at: [0, 0.15, -0.4], c: 0x3b4a5a },
      { s: 'box', d: [0.675, 0.05, 1.21], at: [0, 0.15, -0.4], c: 0xb8352c },
      { s: 'box', d: [0.2, 0.3, 0.55], at: [0.11, 0.15, 0.72], rot: [0, -35, 0], c: 0x3b4a5a },
      { s: 'box', d: [0.2, 0.3, 0.55], at: [-0.11, 0.15, 0.72], rot: [0, 35, 0], c: 0x3b4a5a },
      { s: 'box', d: [0.205, 0.05, 0.56], at: [0.11, 0.15, 0.72], rot: [0, -35, 0], c: 0xb8352c },
      { s: 'box', d: [0.205, 0.05, 0.56], at: [-0.11, 0.15, 0.72], rot: [0, 35, 0], c: 0xb8352c },
      { s: 'box', d: [0.6, 0.03, 1.15], at: [0, 0.315, -0.4], c: 'wood' },
      { s: 'box', d: [0.4, 0.32, 0.4], at: [0, 0.49, -0.7], c: 'white' },
      { s: 'box', d: [0.3, 0.1, 0.02], at: [0, 0.54, -0.49], c: 'ink' },
      { s: 'box', d: [0.02, 0.1, 0.25], at: [0.205, 0.54, -0.7], c: 'ink' },
      { s: 'box', d: [0.02, 0.1, 0.25], at: [-0.205, 0.54, -0.7], c: 'ink' },
      { s: 'box', d: [0.46, 0.03, 0.46], at: [0, 0.665, -0.7], c: 0xb8352c },
      { s: 'cyl', d: [0.02, 0.025, 1.2], at: [0, 0.9, 0.2], c: 'wood-dark', seg: 6 },
      { s: 'wedge', d: [0.015, 0.8, 0.5], at: [0, 0.9, -0.07], c: 0xb06a3a },
      { s: 'cyl', d: [0.012, 0.012, 0.55], at: [0, 0.5, -0.07], rot: [90, 0, 0], c: 'wood-dark', seg: 5 },
      { s: 'cyl', d: [0.012, 0.012, 0.7], at: [0.35, 0.525, 0.35], rot: [0, 0, -60], c: 'wood-dark', seg: 5 },
      { s: 'box', d: [0.14, 0.16, 0.02], at: [0.64, 0.7, 0.35], c: 0x5a6b5a },
    ],
  },
  {
    id: 'lawn-shark-fin', name: 'Lawn Shark Fin', category: 'prop', uses: ['place'],
    tags: ['shark', 'fin', 'fibreglass', 'grass', 'roof', 'beach', 'saltbucket', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a fibreglass shark fin made of grass, 0.5 tall and 0.5 long at scale 1, on a flat mount so it can sit on a hut roof. It swims toward +z. Origin: centre of the mount. Game scale 2.',
    examine: [
      'A grey-green fibreglass shark fin with a ragged back edge and a tuft of grass on the tip, bolted to a plank.',
      'Shore saying: the shark on the roof is only ever dangerous to the people who put it there.',
      'Tip: it looks real from the sea and obviously fake from the pavement, so view it from the middle distance.',
      'Joke: it is a lawn shark, which means it is mostly hedge and has never once caught a swimmer.',
      'The tuft on the tip is real grass and has been mown twice, which is two more times than the lawn next door.',
    ],
    parts: [
      { s: 'box', d: [0.5, 0.04, 0.34], at: [0, 0.02, 0], c: 'wood-dark' },
      { s: 'wedge', d: [0.06, 0.42, 0.5], at: [0, 0.25, 0], rot: [0, 180, 0], c: 0x5f7a4a },
      { s: 'box', d: [0.07, 0.1, 0.05], at: [0, 0.2, -0.27], c: 0x7a9a5a },
      { s: 'box', d: [0.07, 0.08, 0.05], at: [0, 0.35, -0.24], c: 0x4a6338 },
      { s: 'box', d: [0.07, 0.06, 0.05], at: [0, 0.12, -0.27], c: 0x4a6338 },
      { s: 'cone', d: [0.03, 0.1], at: [0, 0.47, -0.21], rot: [0, 0, 10], c: 'grass', seg: 5 },
      { s: 'cone', d: [0.025, 0.09], at: [0.03, 0.465, -0.22], rot: [0, 0, -25], c: 'leaf', seg: 5 },
      { s: 'cone', d: [0.025, 0.08], at: [-0.03, 0.46, -0.2], rot: [0, 0, 28], c: 'leaf-dark', seg: 5 },
    ],
  },
  {
    id: 'driftwood-pile', name: 'Driftwood Pile', category: 'prop', uses: ['place'],
    tags: ['driftwood', 'wood', 'planks', 'bleached', 'pile', 'beach', 'saltbucket', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a heap of bleached driftwood planks and branches leaning together, about 0.8 long and 0.4 tall at scale 1. Origin: centre, on the sand. Game scale 2.',
    examine: [
      'A heap of bleached planks and branches leaned together, every one of them worn smooth by a sea with all the time in the world.',
      'Shore saying: the sea gives you wood and then, a week later, wants to know where it went.',
      'Tip: the dry bits burn well and smell of salt, and the damp bits are home to somebody, so leave those alone.',
      'Joke: one plank still says SALTBUCKET FERRY, which is the closest the Shore ever came to a timetable.',
      'Behind the pile a gull has built a nest from a single shoelace and a great deal of confidence.',
    ],
    parts: [
      { s: 'box', d: [0.8, 0.06, 0.07], at: [0, 0.03, -0.08], c: 0xb8ac94 },
      { s: 'box', d: [0.7, 0.055, 0.07], at: [0.05, 0.0275, 0.1], c: 0xa89c84 },
      { s: 'box', d: [0.06, 0.5, 0.07], at: [-0.16, 0.206, 0], rot: [0, 0, -40], c: 0xc8bca4 },
      { s: 'box', d: [0.06, 0.5, 0.07], at: [0.16, 0.206, 0.03], rot: [0, 0, 40], c: 0xb8ac94 },
      { s: 'cyl', d: [0.02, 0.025, 0.5], at: [-0.1, 0.17, -0.06], rot: [0, 0, -50], c: 0xa89c84, seg: 5 },
      { s: 'cyl', d: [0.02, 0.025, 0.46], at: [0.12, 0.16, -0.04], rot: [0, 0, 55], c: 0xc8bca4, seg: 5 },
      { s: 'box', d: [0.62, 0.04, 0.06], at: [0, 0.3, 0], rot: [0, 12, 4], c: 0xa89c84 },
    ],
  },
  {
    id: 'hung-net', name: 'Hung Fishing Net', category: 'prop', uses: ['place'],
    tags: ['net', 'fishing', 'drying', 'posts', 'cork', 'beach', 'saltbucket', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a fishing net hung to dry between two posts, posts 1.2 apart along x and 1.0 tall, the net a sagging grid with three cork floats. Origin: centre, between the posts. Game scale 2.',
    examine: [
      'A fishing net hung between two posts to dry, sagging in the middle, with three cork floats along the bottom edge.',
      'Shore saying: a net hung out to dry has only ever caught one thing, and that was gossip.',
      'Tip: duck under it rather than through it, because it has been mended so many times it remembers who tore it.',
      'Joke: the net catches fish in the sea and compliments in the sun, and it has had far more of the second.',
      'A very small crab is stuck in one corner and is treating it, quite reasonably, as a holiday.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.035, 1.0], at: [-0.6, 0.5, 0], c: 'wood', seg: 6 },
      { s: 'cyl', d: [0.03, 0.035, 1.0], at: [0.6, 0.5, 0], c: 'wood', seg: 6 },
      { s: 'box', d: [1.2, 0.025, 0.025], at: [0, 0.97, 0], c: 'wood-dark' },
      ...NET_STRANDS,
      ...NET_ROWS,
      { s: 'ball', d: [0.035], at: [-0.35, 0.4, 0.015], c: 0xc9a06a, seg: 6 },
      { s: 'ball', d: [0.035], at: [0, 0.35, 0.015], c: 0xc9a06a, seg: 6 },
      { s: 'ball', d: [0.035], at: [0.35, 0.4, 0.015], c: 0xc9a06a, seg: 6 },
    ],
  },
  {
    id: 'oar-pair', name: 'Crossed Oars', category: 'prop', uses: ['place'],
    tags: ['oar', 'oars', 'boat', 'paddle', 'blue', 'beach', 'saltbucket', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: two oars crossed and leaning, blades up and blue, about 1.2 tall and 0.3 wide at scale 1. Origin: centre between the feet. Game scale 2.',
    examine: [
      'Two oars crossed in an X and leaning, blue blades up in the air, as if the boat they belong to has gone for a walk.',
      'Shore saying: crossed oars mean the boat is home, and the boat has never agreed with this reading.',
      'Tip: lean on them and they fall, so lean on something else and let the oars lean on you.',
      'Joke: two oars, one boat, and a long-running argument about which of them does the actual rowing.',
      'The blades have been painted blue so many times that the oars are about a third paint by now.',
    ],
    parts: [...oarParts(1, -0.025), ...oarParts(-1, 0.025)],
  },
  {
    id: 'x-marker-post', name: 'X Marker Post', category: 'prop', uses: ['place'],
    tags: ['post', 'marker', 'treasure', 'shovel', 'rag', 'beach', 'saltbucket', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a crooked wooden marker post, 0.8 tall, with a red rag tied on top and a shovel leaning against it, a heap of dirt at its foot. Shovel on the +z side. Origin: the foot of the post. Game scale 2.',
    examine: [
      'A crooked post with a red rag on the top, a shovel leaning on it and a fresh heap of dirt, which is how all the best legends start.',
      'Shore saying: where a post leans, a gnome dug, and where a gnome dug, there was a reason that ended badly.',
      'Tip: ask whoever planted it before you dig, and if nobody planted it, dig quickly and quietly.',
      'Joke: the marker says X, and the treasure is, per the map, directly below, so the real treasure was the shovel.',
      'The rag is red and the dirt is fresh, and somewhere nearby a gnome is pretending very hard to be a gull.',
    ],
    parts: [
      { s: 'cyl', d: [0.035, 0.04, 0.8], at: [-0.024, 0.402, 0], rot: [0, 0, 7], c: 'wood', seg: 6 },
      { s: 'box', d: [0.14, 0.07, 0.015], at: [-0.05, 0.78, 0.03], rot: [0, 0, -12], c: 0xc8352f },
      { s: 'box', d: [0.07, 0.05, 0.015], at: [0.04, 0.74, 0.04], rot: [0, 0, -35], c: 0xc8352f },
      { s: 'cyl', d: [0.015, 0.015, 0.6], at: [0.14, 0.43, 0.2], rot: [-21, 0, 0], c: 'wood-light', seg: 6 },
      { s: 'box', d: [0.1, 0.2, 0.015], at: [0.14, 0.095, 0.325], rot: [-21, 0, 0], c: 'iron' },
      { s: 'box', d: [0.07, 0.02, 0.02], at: [0.14, 0.73, 0.06], rot: [-21, 0, 0], c: 'wood-dark' },
      { s: 'ball', d: [0.13], at: [-0.1, 0.045, 0.15], scale: [1.3, 0.35, 1], c: 'dirt', seg: 7 },
    ],
  },
  {
    id: 'towel-line', name: 'Towel Line', category: 'prop', uses: ['place'],
    tags: ['towel', 'washing', 'line', 'pegs', 'stripes', 'beach', 'saltbucket', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a washing line between two short posts 1.4 apart along x (0.9 tall) with three striped beach towels (red and white, blue and yellow, green and white), the middle one hanging crooked, and two pegs. Origin: centre, between the posts. Game scale 2.',
    examine: [
      'A washing line between two posts with three striped towels hanging out, the middle one crooked and holding on by a corner.',
      'Shore saying: a towel on the line is a flag of surrender to the sun, and the sun has never once accepted it.',
      'Tip: the pegs keep the towels on, mostly, but when the wind gets up, it is the line that goes first.',
      'Joke: nobody owns the towels, everybody uses the towels, and the red one has become the town mayor.',
      'The blue and yellow towel has a handprint on it that is the wrong size for any gnome, and nobody wants to ask.',
    ],
    parts: [
      { s: 'cyl', d: [0.025, 0.03, 0.9], at: [-0.7, 0.45, 0], c: 'wood', seg: 6 },
      { s: 'cyl', d: [0.025, 0.03, 0.9], at: [0.7, 0.45, 0], c: 'wood', seg: 6 },
      { s: 'box', d: [1.4, 0.012, 0.012], at: [0, 0.865, 0], c: 'burlap' },
      ...towel(-0.4, 0, 0xd8342c, 'white'),
      ...towel(0, 14, 0x2f6fa8, 0xf0c63a),
      ...towel(0.4, 0, 0x4f9a3c, 'white'),
      { s: 'box', d: [0.03, 0.07, 0.03], at: [-0.52, 0.86, 0.015], c: 0xe0a030 },
      { s: 'box', d: [0.03, 0.07, 0.03], at: [0.28, 0.86, 0.015], c: 0xe0a030 },
    ],
  },
];
