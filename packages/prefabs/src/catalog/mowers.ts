// Lawn Gnome Panic mowers and the combine (enemy machines).
// Transcribed from games/sample-3d/src/mowerModels.ts at the game's size (1 unit = 1 game unit), except the combine,
// which is at half size (the game builds it with scale 2). Every wheel is a pivot 'wheel-<n>' at its centre
// (pivot y = radius); the reel is a pivot 'reel'; the powered tiers' engine is a pivot 'engine'.
import type { Part, PrefabDef } from '../types';
import { COMBINE_DAMAGE } from './damage-stages';

const DARK = 0x222222;
const WOOD = 0x9c6b3c;
const REEL_METAL = 0x8a9399;
const COMBINE_BODY = 0x2e8b3a;
const COMBINE_ACCENT = 0xf2c230;
const COMBINE_GLASS = 0x9fd8ff;

/** The powered tiers share one chassis: a deck, four wheels, a bobbing engine and a pair of handles. */
function poweredMower(id: string, name: string, deck: number, about: string, examine: string[], extra: Part[]): PrefabDef {
  const wheels: Part[] = [];
  const pivots: Record<string, [number, number, number]> = {};
  const corners: [number, number][] = [[-0.72, -0.45], [-0.72, 0.45], [0.72, -0.45], [0.72, 0.45]];
  corners.forEach(([x, z], n) => {
    pivots[`wheel-${n}`] = [x, 0.18, z];
    wheels.push({ s: 'cyl', d: [0.18, 0.18, 0.12], rot: [0, 0, 90], at: [x, 0.18, z], c: DARK, group: `wheel-${n}` });
  });
  return {
    id, name, category: 'prop', uses: ['place'],
    tags: ['mower', 'machine', 'enemy', 'lawn', 'wheel', 'engine', 'handle'], emoji: [],
    pivots: { ...pivots, engine: [0, 0.65, 0.1] },
    about, examine,
    parts: [
      { s: 'box', d: [1.4, 0.3, 1.3], at: [0, 0.35, 0], c: deck },
      ...wheels,
      { s: 'cyl', d: [0.3, 0.32, 0.3], at: [0, 0.65, 0.1], c: DARK, seg: 16, group: 'engine' },
      { s: 'box', d: [0.2, 0.1, 0.2], at: [0, 0.85, 0.1], c: deck, group: 'engine' },
      { s: 'cyl', d: [0.03, 0.03, 0.9925], at: [0.45, 0.825, -0.975], rot: [-49.086, 0, 0], c: DARK, mirror: true },
      { s: 'cyl', d: [0.035, 0.035, 0.9], at: [0, 1.15, -1.35], rot: [0, 0, 90], c: DARK },
      ...extra,
    ],
  };
}

export const MOWERS: readonly PrefabDef[] = [
  {
    id: 'reel-mower', name: 'Reel Mower', category: 'prop', uses: ['place'],
    tags: ['mower', 'machine', 'enemy', 'reel', 'blades', 'drum', 'lawn'], emoji: [],
    pivots: { 'wheel-0': [-0.38, 0.32, 0], 'wheel-1': [0.38, 0.32, 0], reel: [0, 0.3, 0.05] },
    about: 'The first Mower: a drum of five steel blades between two wheels, pushed by two wooden arms. Wood and steel.',
    examine: [
      'A drum of five steel blades turns between two wheels. Nobody in the garden has ever seen it stop.',
      'Old saying: "Keep to the short grass, and keep out of the Mower\'s way."',
      'The only machine in the garden, and every gnome in the garden is afraid of it.',
      'Tip: the blades are at knee height. Hop, do not run.',
      'The handles are wood, but the hum behind them is nothing a gnome could carve.',
    ],
    parts: [
      { s: 'cyl', d: [0.32, 0.32, 0.08], rot: [0, 0, 90], at: [-0.38, 0.32, 0], c: DARK, group: 'wheel-0' },
      { s: 'cyl', d: [0.32, 0.32, 0.08], rot: [0, 0, 90], at: [0.38, 0.32, 0], c: DARK, group: 'wheel-1' },
      { s: 'cyl', d: [0.05, 0.05, 0.7], rot: [0, 0, 90], at: [0, 0.3, 0.05], c: REEL_METAL, group: 'reel' },
      { s: 'box', d: [0.7, 0.03, 0.06], rot: [0, 0, 0], at: [0, 0.47, 0.05], c: REEL_METAL, group: 'reel' },
      { s: 'box', d: [0.7, 0.03, 0.06], rot: [72, 0, 0], at: [0, 0.353, 0.212], c: REEL_METAL, group: 'reel' },
      { s: 'box', d: [0.7, 0.03, 0.06], rot: [144, 0, 0], at: [0, 0.162, 0.15], c: REEL_METAL, group: 'reel' },
      { s: 'box', d: [0.7, 0.03, 0.06], rot: [216, 0, 0], at: [0, 0.162, -0.05], c: REEL_METAL, group: 'reel' },
      { s: 'box', d: [0.7, 0.03, 0.06], rot: [288, 0, 0], at: [0, 0.353, -0.112], c: REEL_METAL, group: 'reel' },
      { s: 'cyl', d: [0.07, 0.07, 0.7], rot: [0, 0, 90], at: [0, 0.08, -0.35], c: WOOD },
      { s: 'cyl', d: [0.03, 0.03, 1.0876], rot: [-47.405, -2.319, 5.28], at: [0.25, 0.685, -0.45], c: WOOD, mirror: true },
      { s: 'cyl', d: [0.035, 0.035, 0.48], rot: [0, 0, 90], at: [0, 1.05, -0.85], c: DARK },
    ],
  },
  poweredMower('push-mower-green', 'Push Mower (Green)', 0x3fa34d,
    'A green push mower: a squat deck on four small wheels, a black engine cap that bobs as it runs. Painted tin and wood.',
    [
      'A squat green deck on four small wheels, with a black engine cap that bobs and mutters.',
      'Gnome saying: the one that hums is the one that bites.',
      'Tip: the engine runs hot and loud. Approach from the side, never the front.',
      'Joke: a green Mower is still a Mower. Paint has never made anything kinder.',
      'A little cog sits under the cap. Every gnome who has wound it has come away without eyebrows.',
    ], []),
  poweredMower('push-mower-yellow', 'Push Mower (Yellow)', 0xf2c230,
    'A yellow push mower with a black band around the deck. Same chassis as the green one, louder.',
    [
      'A yellow deck with a black band across it, like a wasp that grew up in a shed.',
      'The Charters say yellow is for warnings. Nobody read the Charters closely enough.',
      'Tip: the black band is the only part that is not hot. Do not lean on it.',
      'Joke: it is painted to be noticed, and it is very good at being noticed.',
      'The engine cap rattles on every turn, as if it is trying to say something important.',
    ],
    [{ s: 'box', d: [1.41, 0.06, 1.31], at: [0, 0.25, 0], c: 0x111111 }]),
  poweredMower('push-mower-red', 'Push Mower (Red)', 0xd8342c,
    'A red push mower with a white stripe down the deck. The fastest of the powered tiers, which is not saying much.',
    [
      'A red deck with a white stripe down its spine, painted by someone who wanted to be seen.',
      'When the red one comes over the Verge, the planting songs stop mid-verse.',
      'Tip: red is faster. Not much faster. Enough.',
      'Joke: the red one is the first thing every gnome runs from, and the last thing anyone remembers.',
      'The white stripe is the only clean paint left in the garden. Nobody wants to be near it.',
    ],
    [{ s: 'box', d: [0.25, 0.01, 1.31], at: [0, 0.505, 0], c: 0xffffff }]),
  {
    id: 'combine-harvester', name: 'Combine Harvester', category: 'prop', uses: ['place'],
    damage: COMBINE_DAMAGE,
    tags: ['combine', 'harvester', 'machine', 'enemy', 'reel', 'lawn', 'boss'], emoji: [],
    pivots: {
      'wheel-0': [-0.725, 0.45, 0.1], 'wheel-1': [0.725, 0.45, 0.1],
      'wheel-2': [-0.625, 0.275, -0.9], 'wheel-3': [0.625, 0.275, -0.9],
      reel: [0, 0.475, 1.05],
    },
    about: 'The combine: a big green harvester at half size (the game scales it 2x), with a wide cutting reel and a glass cab. Tin and paint.',
    examine: [
      'A great green harvester with a cutting platform wider than a gnome is tall, and a glass cab with nobody in it.',
      'The empty seat in the glass cab is the most frightening thing in the garden.',
      'Old saying: "The combine eats the field, and then it looks for the next field."',
      'Tip: its dividers point forward and are sharp. Going round the side is safer.',
      'Joke: it is called a harvester. Nothing has been harvested with it but lawn and nerves.',
    ],
    parts: [
      { s: 'cyl', d: [0.45, 0.45, 0.25], rot: [0, 0, 90], at: [-0.725, 0.45, 0.1], c: DARK, group: 'wheel-0' },
      { s: 'cyl', d: [0.45, 0.45, 0.25], rot: [0, 0, 90], at: [0.725, 0.45, 0.1], c: DARK, group: 'wheel-1' },
      { s: 'cyl', d: [0.275, 0.275, 0.2], rot: [0, 0, 90], at: [-0.625, 0.275, -0.9], c: DARK, group: 'wheel-2' },
      { s: 'cyl', d: [0.275, 0.275, 0.2], rot: [0, 0, 90], at: [0.625, 0.275, -0.9], c: DARK, group: 'wheel-3' },
      { s: 'box', d: [1.3, 0.9, 1.7], at: [0, 0.75, -0.3], c: COMBINE_BODY },
      { s: 'box', d: [0.65, 0.5, 0.6], at: [0, 1.45, 0.15], c: COMBINE_BODY },
      { s: 'box', d: [0.6, 0.35, 0.025], at: [0, 1.5, 0.46], c: COMBINE_GLASS, alpha: 0.7 },
      { s: 'box', d: [0.75, 0.05, 0.7], at: [0, 1.725, 0.15], c: COMBINE_ACCENT },
      { s: 'box', d: [2.5, 0.2, 0.45], at: [0, 0.225, 1.0], c: COMBINE_ACCENT },
      { s: 'cone', d: [0.125, 0.35], rot: [90, 0, 0], at: [1.25, 0.225, 1.275], c: COMBINE_ACCENT, seg: 12, mirror: true },
      { s: 'cyl', d: [0.04, 0.04, 2.4], rot: [0, 0, 90], at: [0, 0.475, 1.05], c: DARK, group: 'reel' },
      { s: 'box', d: [2.4, 0.03, 0.06], rot: [0, 0, 0], at: [0, 0.7, 1.05], c: COMBINE_BODY, group: 'reel' },
      { s: 'box', d: [2.4, 0.03, 0.06], rot: [60, 0, 0], at: [0, 0.5875, 1.245], c: COMBINE_BODY, group: 'reel' },
      { s: 'box', d: [2.4, 0.03, 0.06], rot: [120, 0, 0], at: [0, 0.3625, 1.245], c: COMBINE_BODY, group: 'reel' },
      { s: 'box', d: [2.4, 0.03, 0.06], rot: [180, 0, 0], at: [0, 0.25, 1.05], c: COMBINE_BODY, group: 'reel' },
      { s: 'box', d: [2.4, 0.03, 0.06], rot: [240, 0, 0], at: [0, 0.3625, 0.855], c: COMBINE_BODY, group: 'reel' },
      { s: 'box', d: [2.4, 0.03, 0.06], rot: [300, 0, 0], at: [0, 0.5875, 0.855], c: COMBINE_BODY, group: 'reel' },
      { s: 'cyl', d: [0.075, 0.075, 1.2748], rot: [58.246, -22.697, -39.623], at: [0.925, 1.275, -0.25], c: COMBINE_BODY },
      { s: 'cyl', d: [0.04, 0.04, 0.4], at: [-0.4, 1.4, -0.8], c: DARK, seg: 12 },
    ],
  },
];
