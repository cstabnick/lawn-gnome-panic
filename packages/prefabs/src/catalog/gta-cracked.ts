// Gnome Theft Auto: four cracked-gnome patterns. Every piece is its own named group (p0, p1, ...) pivoting on its own
// centre, so the game can fling the pieces out and let them settle when a gnome cracks.
import type { Part, PrefabDef, Vec3 } from '../types';

const SKIN = 0xf1c27d;
const HAT = 0xd93636;
const BEARD = 0xe8e8e8;
const PANTS = 0x4b3a2a;
const BOOT = 0x222222;

const EXAMINE = [
  'A gnome in several pieces, the pointy hat a little way off and the beard somehow still in one piece.',
  'Clinic rule: every piece goes back in the van, even the ones that look like they belong to someone else.',
  'Tip: do not stand on it. The shards are sharp, and the gnome is still in there somewhere, being brave about it.',
  'Joke: the hat is always the only piece that survives. The hat, as ever, has no comment.',
  'A tiny label has been tied to one boot: handle with glue.',
];

/** Turns a flat list of single-part pieces into a prefab where each piece is a group pivoting on its own centre. */
function body(id: string, name: string, shape: string, parts: readonly Part[]): PrefabDef {
  const pivots: Record<string, Vec3> = {};
  const grouped = parts.map((p, i) => {
    const g = `p${i}`;
    pivots[g] = [p.at?.[0] ?? 0, p.at?.[1] ?? 0, p.at?.[2] ?? 0];
    return { ...p, group: g };
  });
  return {
    id, name, category: 'prop', uses: ['place'], tint: 0x2f8a4a,
    tags: ['clay', 'shards', 'cracked', 'broken', 'pottery', 'terracotta', 'gnome', 'body', 'remains'], emoji: [],
    pivots,
    about: `Gnome Theft Auto: a Cracked Gnome (${shape}). Every piece is its own group (p0, p1, ...) so it can be flung out and settle. About 1.2 wide. Tint sets the coat.`,
    examine: EXAMINE,
    parts: grouped,
  };
}

const shard = (x: number, z: number, ry: number, c: Part['c'], w = 0.1, d = 0.08): Part =>
  ({ s: 'box', d: [w, 0.035, d], at: [x, 0.018, z], rot: [0, ry, 0], c });

/** A: sprawled on its back, the torso split in two and the head in halves. */
const A: Part[] = [
  { s: 'box', d: [0.3, 0.12, 0.26], at: [0.05, 0.06, 0], rot: [0, 15, 4], c: 'tint' },
  { s: 'box', d: [0.26, 0.1, 0.24], at: [-0.22, 0.05, -0.1], rot: [0, -35, -8], c: 'tint' },
  { s: 'ball', d: [0.15], at: [0.42, 0.08, 0.22], scale: [1, 0.55, 1], c: SKIN, seg: 6 },
  { s: 'ball', d: [0.12], at: [0.55, 0.05, 0.05], scale: [1, 0.5, 1], c: SKIN, seg: 6 },
  { s: 'cone', d: [0.1, 0.2], at: [0.3, 0.14, 0.5], rot: [0, 0, 80], c: BEARD, seg: 5 },
  { s: 'cone', d: [0.12, 0.26], at: [-0.45, 0.14, 0.3], rot: [0, 20, 75], c: HAT, seg: 6 },
  { s: 'cyl', d: [0.045, 0.045, 0.3], at: [-0.1, 0.045, 0.32], rot: [0, 0, 90], c: 'tint', seg: 6 },
  { s: 'cyl', d: [0.06, 0.06, 0.32], at: [-0.3, 0.09, -0.38], rot: [0, 0, 80], c: PANTS, seg: 6 },
  { s: 'box', d: [0.12, 0.07, 0.1], at: [-0.48, 0.035, -0.4], c: BOOT },
  { s: 'cyl', d: [0.06, 0.06, 0.28], at: [0.1, 0.09, -0.42], rot: [0, 0, 100], c: PANTS, seg: 6 },
  { s: 'box', d: [0.12, 0.07, 0.1], at: [0.26, 0.035, -0.44], rot: [0, 25, 0], c: BOOT },
  shard(0.22, 0, 50, 'terracotta', 0.12, 0.09), shard(-0.5, -0.1, -20, 'clay'), shard(0, 0.5, 70, 'clay-dark'),
];

/** B: face down, the torso in three chunks, the head rolled well away and the arms flung wide. */
const B: Part[] = [
  { s: 'box', d: [0.28, 0.1, 0.22], at: [0, 0.05, 0], rot: [0, 10, 0], c: 'tint' },
  { s: 'box', d: [0.2, 0.09, 0.2], at: [0.3, 0.045, 0.05], rot: [0, -25, 5], c: 'tint' },
  { s: 'box', d: [0.16, 0.08, 0.18], at: [-0.28, 0.04, -0.05], rot: [0, 40, -6], c: 'tint' },
  { s: 'ball', d: [0.1], at: [0.7, 0.1, -0.3], c: SKIN, seg: 8 },
  { s: 'box', d: [0.03, 0.02, 0.1], at: [0.7, 0.2, -0.3], rot: [0, 30, 0], c: 'black' },
  { s: 'cone', d: [0.12, 0.26], at: [-0.55, 0.14, 0.4], rot: [0, -30, 70], c: HAT, seg: 6 },
  { s: 'cone', d: [0.1, 0.2], at: [0.4, 0.14, -0.55], rot: [0, 0, 80], c: BEARD, seg: 5 },
  { s: 'cyl', d: [0.045, 0.045, 0.3], at: [-0.45, 0.045, 0.05], rot: [0, 20, 90], c: 'tint', seg: 6 },
  { s: 'cyl', d: [0.045, 0.045, 0.3], at: [0.2, 0.045, -0.4], rot: [0, -40, 90], c: 'tint', seg: 6 },
  { s: 'cyl', d: [0.06, 0.06, 0.34], at: [-0.1, 0.09, -0.5], rot: [0, 0, 80], c: PANTS, seg: 6 },
  { s: 'cyl', d: [0.06, 0.06, 0.34], at: [0.1, 0.09, -0.52], rot: [0, 0, 100], c: PANTS, seg: 6 },
  { s: 'box', d: [0.12, 0.07, 0.1], at: [-0.3, 0.035, -0.5], c: BOOT },
  { s: 'box', d: [0.12, 0.07, 0.1], at: [0.32, 0.035, -0.54], rot: [0, 20, 0], c: BOOT },
  shard(0.5, 0.3, 30, 'terracotta'), shard(-0.15, 0.3, -50, 'clay'), shard(0.1, 0.6, 10, 'clay-dark'), shard(-0.6, -0.4, 80, 'clay'),
];

/** C: the legs are still standing with the hat on top of one; the rest lies scattered around them. */
const C: Part[] = [
  { s: 'cyl', d: [0.07, 0.07, 0.4], at: [-0.12, 0.2, 0], c: PANTS, seg: 6 },
  { s: 'box', d: [0.14, 0.08, 0.18], at: [-0.12, 0.04, 0.03], c: BOOT },
  { s: 'cyl', d: [0.07, 0.07, 0.4], at: [0.12, 0.2, 0], c: PANTS, seg: 6 },
  { s: 'box', d: [0.14, 0.08, 0.18], at: [0.12, 0.04, 0.03], c: BOOT },
  { s: 'cone', d: [0.12, 0.26], at: [-0.12, 0.53, 0], c: HAT, seg: 6 },
  { s: 'box', d: [0.3, 0.14, 0.2], at: [-0.5, 0.1, 0.3], rot: [0, 20, 20], c: 'tint' },
  { s: 'box', d: [0.28, 0.12, 0.2], at: [0.45, 0.09, -0.2], rot: [0, -30, -18], c: 'tint' },
  { s: 'ball', d: [0.15], at: [0.1, 0.075, 0.5], scale: [1, 0.55, 1], c: SKIN, seg: 6 },
  { s: 'ball', d: [0.12], at: [-0.15, 0.06, 0.6], scale: [1, 0.55, 1], c: SKIN, seg: 6 },
  { s: 'cone', d: [0.1, 0.2], at: [0, 0.14, 0.35], rot: [0, 0, 80], c: BEARD, seg: 5 },
  { s: 'cyl', d: [0.045, 0.045, 0.3], at: [0.55, 0.045, 0.35], rot: [0, 60, 90], c: 'tint', seg: 6 },
  shard(-0.3, -0.3, 20, 'terracotta'), shard(0.3, 0.2, -40, 'clay'), shard(0.55, -0.55, 70, 'clay-dark'),
];

/** D: a burst: shards in a ring around a small heap, the hat in the middle. */
const D: Part[] = (() => {
  const ring: Part[] = [];
  const colours: Part['c'][] = ['terracotta', 'clay', 'clay-dark', 'terracotta'];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + 0.2;
    ring.push(shard(Math.cos(a) * 0.5, Math.sin(a) * 0.5, -(a * 180) / Math.PI, colours[k % 4], 0.14, 0.1));
  }
  return [
    ...ring,
    { s: 'box', d: [0.22, 0.1, 0.2], at: [0.05, 0.05, 0.02], rot: [0, 30, 0], c: 'tint' },
    { s: 'box', d: [0.16, 0.08, 0.16], at: [-0.12, 0.04, -0.08], rot: [0, -20, 6], c: 'tint' },
    { s: 'box', d: [0.14, 0.07, 0.14], at: [0.12, 0.09, -0.1], rot: [0, 50, 10], c: 'tint' },
    { s: 'ball', d: [0.11], at: [0.3, 0.05, 0.2], scale: [1, 0.55, 1], c: SKIN, seg: 6 },
    { s: 'ball', d: [0.11], at: [-0.3, 0.05, 0.25], scale: [1, 0.55, 1], c: SKIN, seg: 6 },
    { s: 'ball', d: [0.1], at: [0.15, 0.05, 0.35], scale: [1, 0.55, 1], c: SKIN, seg: 6 },
    { s: 'cone', d: [0.12, 0.26], at: [0, 0.14, 0.12], rot: [0, 10, 78], c: HAT, seg: 6 },
    { s: 'cone', d: [0.1, 0.2], at: [-0.05, 0.14, 0.45], rot: [0, 0, 80], c: BEARD, seg: 5 },
    { s: 'cyl', d: [0.045, 0.045, 0.28], at: [0.7, 0.045, -0.1], rot: [0, 80, 90], c: 'tint', seg: 6 },
    { s: 'cyl', d: [0.06, 0.06, 0.3], at: [-0.7, 0.09, -0.2], rot: [0, 10, 80], c: PANTS, seg: 6 },
    { s: 'box', d: [0.12, 0.07, 0.1], at: [-0.88, 0.035, -0.22], c: BOOT },
    { s: 'box', d: [0.12, 0.07, 0.1], at: [0.1, 0.035, -0.75], rot: [0, 40, 0], c: BOOT },
  ];
})();

export const GTA_CRACKED: readonly PrefabDef[] = [
  body('gta-cracked-1', 'Cracked Gnome (Sprawled)', 'sprawled on its back', A),
  body('gta-cracked-2', 'Cracked Gnome (Face Down)', 'face down', B),
  body('gta-cracked-3', 'Cracked Gnome (Legs Standing)', 'legs still standing', C),
  body('gta-cracked-4', 'Cracked Gnome (Burst)', 'burst into a ring of shards', D),
];
