// E25 firefighter: fire calls (what is burning, where, who called, whether someone is stuck up high) and how a call is
// scored. Pure: no three.js, no DOM. Same seed, same call.
import { starsForScore, type Stars } from '../../jobs/workDefs';
import type { CallFire, CallKind, CallOutcome, CallPlace, CallProp, CallRescue, CallScore, FireCall } from './types';

/** Mossy Wood clearings for toadstool calls (world x, z; the runtime finds clear ground near each). */
export const FOREST_PLACES: readonly CallPlace[] = [
  { id: 'mossy-picnic', name: 'the Mossy Wood picnic clearing', x: -380, z: -20, area: 'forest' },
  { id: 'mossy-badger', name: 'the Mossy Wood badger clearing', x: -430, z: 40, area: 'forest' },
  { id: 'mossy-stump', name: 'the Mossy Wood stump clearing', x: -350, z: 60, area: 'forest' },
  { id: 'mossy-owl', name: 'the Mossy Wood owl clearing', x: -470, z: -40, area: 'forest' },
  { id: 'mossy-bramble', name: 'the Mossy Wood bramble clearing', x: -410, z: 110, area: 'forest' },
  { id: 'mossy-pond', name: 'the Mossy Wood pond clearing', x: -330, z: -60, area: 'forest' },
];

const GNOME_NAMES = ['Barnaby Thistle', 'Old Mossgrave', 'Pip Dunnock', 'Clementine Hobb', 'Reginald Fen', 'Dot Larkspur'];
const GNOME_THANKS = [
  'Thank you. I was supervising.',
  'Lovely. I would have got down by myself, eventually.',
  'Thank you. The view was not worth it.',
];
const CAT_THANKS = ['...'];
const BIN_TINTS = [0x2e7d32, 0x607d8b, 0x8d6e63];

const CALLERS = [
  'Dorothy Pebblecourt', 'Clive Dunmore', 'Winifred Rook', 'Gerald Hollowell', 'Ted (no relation)',
  'Mrs. Ambrose Fenwick', 'Old Barnaby Thistle', 'A neighbour who prefers not to say',
];

const LINES: Record<CallKind, string[]> = {
  bin: [
    'It was a wheelie bin. It is now a wheelie fire.',
    'I only put my compost in. The compost did the rest.',
    'It was like that when I got here.',
    'The bin said it was fine.',
    'Bin day. Now it is bin day plus one.',
    'I rang twice. The first time I was only being rude.',
  ],
  bbq: [
    'I was told it needed more lighter fluid. By me.',
    'It was a barbecue. Now it is a barbeque with ambition.',
    'The sausages were fine. Everything else went wrong.',
    'I only looked away to find the tongs.',
    'I did read the instructions. They said "stand back".',
    'Not the grill, the deckchair. The deckchair is the problem.',
  ],
  shed: [
    'There was nothing flammable in there except the shed.',
    'It is a shed. It was always going to be a bonfire eventually.',
    'I smelled marmalade, then smoke.',
    'My husband said he would only nip in for the strimmer.',
    'I heard a pop, then a sort of cheerful whoomph.',
    'The shed had a stove, and the stove had opinions.',
  ],
  toadstool: [
    'The toadstool started it.',
    'It went up like a rumour.',
    'There is a whole wood of them. Please hurry.',
    'I stepped on one. Then the others sort of joined in.',
    'They were smouldering when I came out for the post.',
    'The toadstool was already on fire. We do not talk about that.',
  ],
};

const NOUN: Record<CallKind, string> = { bin: 'Bin', bbq: 'Barbecue', shed: 'Shed', toadstool: 'Toadstool' };
const WHAT: Record<CallKind, string> = { bin: 'The bin', bbq: 'The barbecue', shed: 'The shed', toadstool: 'The toadstools' };

const QUOTES: Record<Stars, string> = {
  5: 'Wet is best. You were wettest.',
  4: 'Very wet, very quick. Lovely work.',
  3: 'Damp. Good.',
  2: 'Slow. Quite a lot of it is gone, and I will be writing that down.',
  1: 'We do not let it finish. That is the job.',
};

type Rng = () => number;

/** Mulberry32: a small seeded generator. */
function rng(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(r: Rng, xs: readonly T[]): T {
  return xs[Math.floor(r() * xs.length)];
}

function between(r: Rng, a: number, b: number): number {
  return a + (b - a) * r();
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** A band inside [lo, hi] for the ladder window; narrower at higher levels. */
function bandAround(r: Rng, level: number, lo: number, hi: number): [number, number] {
  const w = Math.max(0.04, (hi - lo) * 0.6 - 0.02 * (level - 3));
  const start = between(r, lo, hi - w);
  return [clamp(start, 0, 1), clamp(start + w, 0, 1)];
}

interface Scene {
  props: CallProp[];
  fires: CallFire[];
  spread: CallFire[];
  rescue: CallRescue | null;
}

function binScene(r: Rng, level: number, cat: boolean): Scene {
  const props: CallProp[] = [{ prefab: 'gta-wheelie-bin', dx: 0, dz: 0, yaw: 0, tint: pick(r, BIN_TINTS) }];
  const spread: CallFire[] = [];
  const bagSpots = [{ dx: 1.1, dz: 0.4 }, { dx: -0.9, dz: 0.7 }];
  const bags = r() < 0.5 ? 1 : 2;
  for (let i = 0; i < bags; i++) {
    const { dx, dz } = bagSpots[i];
    props.push({ prefab: 'bin-bag', dx, dz, yaw: between(r, 0, Math.PI * 2) });
    spread.push({ dx, y: 0.2, dz, r: 0.3, fuel: 40 });
  }
  let rescue: CallRescue | null = null;
  if (cat) {
    // Asphalt sits on a lamp post beside the bin.
    const dx = 1.4;
    const dz = -1.2;
    props.push({ prefab: 'street-lamp', dx, dz, yaw: 0 });
    rescue = {
      who: 'cat', name: 'Asphalt', dx, y: 3.2, dz,
      band: bandAround(r, level, 0.75, 0.88), thanks: pick(r, CAT_THANKS),
    };
  }
  return { props, fires: [{ dx: 0, y: 0.9, dz: 0, r: 0.45, fuel: 70 }], spread, rescue };
}

function bbqScene(r: Rng): Scene {
  return {
    props: [
      { prefab: 'fire-bbq-grill', dx: 0, dz: 0, yaw: 0 },
      { prefab: 'fire-deckchair', dx: 1.6, dz: 0, yaw: -Math.PI / 2 + between(r, -0.3, 0.3) },
      { prefab: 'park-bench', dx: -2.2, dz: 1.6, yaw: Math.PI / 2 },
    ],
    fires: [{ dx: 0, y: 0.85, dz: 0, r: 0.5, fuel: 80 }],
    spread: [
      { dx: 1.6, y: 0.3, dz: 0, r: 0.6, fuel: 60 },
      { dx: -2.2, y: 0.4, dz: 1.6, r: 0.8, fuel: 50 },
    ],
    rescue: null,
  };
}

function shedScene(r: Rng, level: number): Scene {
  const fires: CallFire[] = [
    { dx: 0, y: 0.5, dz: 0, r: 1.2, fuel: 150 },
    { dx: 0.3, y: 2.2, dz: 0.2, r: 1.0, fuel: 150 },
  ];
  if (r() < 0.5) fires.push({ dx: -0.4, y: 1.4, dz: -0.3, r: 0.9, fuel: 150 });
  // A gnome stuck on the roof, at level 3 and up.
  let rescue: CallRescue | null = null;
  if (level >= 3 && r() < 0.4) {
    rescue = {
      who: 'gnome', name: pick(r, GNOME_NAMES), dx: 0.6, y: 2.4, dz: -0.5,
      band: bandAround(r, level, 0.55, 0.7), thanks: pick(r, GNOME_THANKS),
    };
  }
  return {
    props: [
      { prefab: 'garden-shed', dx: 0, dz: 0, yaw: r() < 0.5 ? 0 : Math.PI / 2 },
      { prefab: 'hedgerow', dx: -2.4, dz: 1.2, yaw: 0 },
    ],
    fires,
    spread: [{ dx: -2.4, y: 0.6, dz: 1.2, r: 0.9, fuel: 70 }],
    rescue,
  };
}

function toadstoolScene(r: Rng): Scene {
  const n = 2 + Math.floor(r() * 3); // 2..4 toadstools, 4 m apart
  const litCount = n >= 3 && r() < 0.5 ? 2 : 1;
  const props: CallProp[] = [];
  const fires: CallFire[] = [];
  const spread: CallFire[] = [];
  for (let i = 0; i < n; i++) {
    const dx = (i - (n - 1) / 2) * 4;
    const dz = between(r, -0.8, 0.8);
    props.push({
      prefab: r() < 0.5 ? 'giant-spotted-toadstool' : 'capwood-toadstool-cluster',
      dx, dz, yaw: between(r, 0, Math.PI * 2),
    });
    if (i < litCount) fires.push({ dx, y: 1.6, dz, r: 0.9, fuel: 110 });
    else spread.push({ dx, y: 1.2, dz, r: 0.8, fuel: 60 });
  }
  return { props, fires, spread, rescue: null };
}

/** A call for `level` (1..6) at one of `places`, picked by `seed`. Same inputs, same call. */
export function makeCall(level: number, seed: number, places: readonly CallPlace[], id = 1): FireCall {
  const r = rng(seed);
  const lvl = clamp(Math.floor(level), 1, 6);
  const place = pick(r, places.length > 0 ? places : FOREST_PLACES);

  let kind: CallKind;
  if (place.area === 'forest') {
    kind = 'toadstool';
  } else {
    const opts: { kind: CallKind; w: number }[] = [{ kind: 'bin', w: 3 }];
    if (lvl >= 2) opts.push({ kind: 'bbq', w: 2 });
    if (lvl >= 3) opts.push({ kind: 'shed', w: 2 });
    let roll = r() * opts.reduce((sum, o) => sum + o.w, 0);
    kind = opts[opts.length - 1].kind;
    for (const o of opts) {
      if (roll < o.w) { kind = o.kind; break; }
      roll -= o.w;
    }
  }

  let scene: Scene;
  if (kind === 'bin') scene = binScene(r, lvl, lvl >= 3 && r() < 0.3);
  else if (kind === 'bbq') scene = bbqScene(r);
  else if (kind === 'shed') scene = shedScene(r, lvl);
  else scene = toadstoolScene(r);

  return {
    id, kind,
    title: `${NOUN[kind]} fire: ${place.name}`,
    place,
    props: scene.props,
    fires: scene.fires,
    spread: scene.spread,
    rescue: scene.rescue,
    caller: pick(r, CALLERS),
    line: pick(r, LINES[kind]),
    seed,
  };
}

/** Score a finished call: fewer fires burnt and a quick out score higher; a failed rescue costs. */
export function scoreCall(call: FireCall, o: CallOutcome): CallScore {
  const burnt = clamp(o.burnt, 0, 1);
  const late = Math.max(0, o.seconds - 90);
  const score = 100 - 50 * burnt - late * 0.3 - (o.rescued === false ? 30 : 0) + (o.rescued ? 10 : 0);
  const stars = starsForScore(score);

  const lines: string[] = [`Arrived and out in ${Math.round(o.seconds)} s`];
  const what = WHAT[call.kind];
  if (burnt < 0.34) lines.push(`${what} mostly saved`);
  else if (burnt < 0.67) lines.push(`${what} half gone`);
  else lines.push(`${what}: a shed-shaped memory`);
  lines.push(`Water used: ${Math.round(o.water)} l`);
  if (o.rescued !== null) {
    const who = call.rescue?.who === 'cat' ? 'Asphalt' : (call.rescue?.name ?? 'The gnome');
    lines.push(o.rescued ? `${who} brought down safely` : `${who} was not reached in time`);
  }

  return { stars, lines, quote: `Chief Hydra Pumpwell: "${QUOTES[stars]}"` };
}
