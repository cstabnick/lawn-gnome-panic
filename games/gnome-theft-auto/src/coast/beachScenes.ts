// Beach scenes along the strand (FX11, G3#13 / G3#14 / G3#26): small hand-placed stories on the two kilometres of sand east
// and west of the town, lifebuoy posts along the whole strand, Dunelow's deckchair hire, the treasure X (with its hole and
// its boot), and the Saltcut's banks and mouth. Every scene is a small table of prefab placements baked into one merged
// group (buildStaticPrefabs) that the culler shows only near the player. The plan is pure data (no scene), so the test can
// check every prop stands on dry sand.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildStaticPrefabs, getPrefab, type StaticPrefabPlacement } from '@lawn/prefabs';
import type { Box } from '../types';
import type { AmbientGnomeDef } from '../ambientGnomes';
import { registerCull } from '../cull';
import { heightAt } from '../terrain';
import { courseProfile, waterDepthAt } from '../water';
import { coastSign } from './sign';

/** The treasure X (quests/coastQuests.ts CHART_X, step 1 of Bilge's chart). Keep in step with that constant. */
export const CHART_X: readonly [number, number] = [-520, 1170];
/** Stop three of the Pirate Tours (coastQuests.ts SALTCUT_MOUTH). */
export const SALTCUT_MOUTH: readonly [number, number] = [746, 1186];

/** The gnomes in the beach scenes (life.ts adds them to the coast residents). */
export const BEACH_FOLK: readonly AmbientGnomeDef[] = [
  {
    id: 'coast-beach-hessian', name: 'Hessian Nap',
    x: -594, z: 1164.5, yaw: 0.3,
    look: { hat: 0xe8d9a0, shirt: 0x3f8f8f, pants: 0xcfc3a0, beard: 0xd9d9d9, glasses: true },
    bubble: 'One acorn an hour. The gulls pay nothing and sit longest.',
  },
  {
    id: 'coast-beach-skerrick', name: 'Old Skerrick',
    x: -936, z: 1159.5, yaw: 0,
    look: { hat: 0x2d3b52, shirt: 0xb8452f, pants: 0x4a4a3a, beard: 0xc4b79a },
    bubble: 'The boat comes up when it comes up. I only push the winch.',
  },
  {
    id: 'coast-beach-winkle', name: 'Winkle Pennant',
    x: -852, z: 1165.2, yaw: 1.2,
    look: { hat: 0xf0c030, shirt: 0xd05a7a, pants: 0x2f5d8a },
    bubble: 'I have named all the crabs. They have not agreed to the names.',
  },
];

interface Prop {
  id: string;
  x: number; z: number;
  yaw?: number;
  scale?: number;
  /** Lift above the ground at (x, z), metres (negative sinks it). */
  dy?: number;
  /** Full rotation overriding yaw (radians). */
  rot?: [number, number, number];
  tint?: number;
}
interface BeachSign { text: string; x: number; z: number; yaw: number; w: number; h: number; post: number }
export interface BeachScene {
  id: string;
  props: Prop[];
  signs?: BeachSign[];
}

const p = (id: string, x: number, z: number, yaw = 0, scale = 1, extra: Partial<Prop> = {}): Prop => ({ id, x, z, yaw, scale, ...extra });

/** A cheap deterministic 0..1 hash, so the banks look irregular but never change between runs. */
function hash(i: number, k: number): number {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** A sea groyne running down the beach into the sea at x: three sections tilted to the slope (the sea end is +z). */
function groyne(id: string, x: number, jitter: number): BeachScene {
  const props: Prop[] = [];
  for (const z of [1167, 1176, 1185]) {
    const slope = (heightAt(x, z + 4.5) - heightAt(x, z - 4.5)) / 9;
    props.push(p('groyne', x + jitter * (z - 1167) / 18, z, 0, 3, { rot: [Math.atan(-slope), 0, 0] }));
  }
  return { id, props };
}

const SCENES: BeachScene[] = [
  // The fisherman's winch hauls a rowing boat up the sand; a net dries, a gull claims the bow.
  {
    id: 'winch-and-boat',
    props: [
      p('fishing-winch', -940, 1158, 0.1, 2),
      p('rowing-boat', -940.6, 1172, 0.05, 2.5),
      p('bird-gull', -940.4, 1174.4, 2.6, 1.3, { dy: 0.72 }),
      p('hung-net', -927, 1162, 0.35, 2),
      p('oar-pair', -949, 1166, 0.5, 2),
      p('rope-coil', -937.5, 1165, 0.8, 2),
      p('driftwood-pile', -921, 1166.5, 1.9, 1.8),
    ],
  },
  // Rock pool: two crabs, one child's bucket.
  {
    id: 'rock-pool',
    props: [
      p('rock-pool', -850, 1168, 0.4, 3),
      p('critter-crab', -848.2, 1170.2, 2.2, 1.6),
      p('critter-crab', -851.8, 1166.6, 5.4, 1.3),
      p('bucket-and-spade', -846.5, 1165.8, 0.9, 2),
      p('garden-rock', -855.5, 1171, 0.6, 0.7),
    ],
  },
  // Windbreaks round a picnic; a gull walks off with the afternoon.
  {
    id: 'windbreak-picnic',
    props: [
      p('picnic-blanket-spread', -890, 1166, 0.2, 1.8),
      p('windbreak', -890.4, 1162, 0, 2.2, { tint: 0xd04a3a }),
      p('windbreak', -894.6, 1164.4, 1.35, 2),
      p('windbreak', -885.4, 1164.2, -1.3, 2, { tint: 0x2f6fb0 }),
      p('bird-gull', -884.4, 1169.6, 0.8, 1.3, { dy: 0.28 }),
      p('beach-umbrella', -897, 1160.5, 0.2, 2, { tint: 0xe8c03a }),
    ],
  },
  // A lone deckchair facing the sea; the towel has opinions about the wind.
  {
    id: 'lone-chair',
    props: [
      p('deck-chair', -780, 1170, 0.15, 2.4, { tint: 0x2a9d8f }),
      p('towel-line', -773.5, 1165, 0.15, 2),
      p('bucket-and-spade', -777.6, 1173.4, 2.2, 1.6, { tint: 0xe05a3a }),
    ],
  },
  // A wreck rib, half in the sand, with marram grass.
  {
    id: 'wreck-rib',
    props: [
      p('wreck-rib', -700, 1163, 0.5, 4, { dy: -0.1 }),
      p('marram-grass', -704, 1157, 0, 2.2),
      p('marram-grass', -696.5, 1158.8, 1.1, 2),
      p('marram-grass', -708.5, 1160.8, 2.3, 1.8),
      p('bird-gull', -698.6, 1166.6, 3.6, 1.3, { dy: 1.2 }),
    ],
  },
  // Driftwood and a beached dinghy at the far end.
  {
    id: 'dinghy-driftwood',
    props: [
      p('walnut-dinghy', -980, 1171, 1.1, 1.5, { rot: [0, 1.1, 0.14] }),
      p('driftwood-pile', -972, 1166, 0.7, 2),
      p('driftwood-pile', -989, 1175, 2.4, 1.6),
      p('rope-coil', -975.5, 1174.5, 0.4, 2),
      p('critter-crab', -970.5, 1170.5, 1.3, 1.4),
    ],
  },
  // East: a stretch of groynes (the sand has opinions about being managed).
  groyne('groyne-1', 385, 0.6),
  groyne('groyne-2', 452, -0.5),
  groyne('groyne-3', 520, 0.7),
  groyne('groyne-4', 590, -0.4),
  // East: an upturned rowing boat with a crab under the weather.
  {
    id: 'upturned-boat',
    props: [
      p('rowing-boat', 665, 1168, 2.4, 2.5, { rot: [0, 2.4, Math.PI], dy: 0.62 }),
      p('oar-pair', 659.5, 1170.5, 0.9, 2),
      p('critter-crab', 669.4, 1171.8, 4.4, 1.5),
      p('wellies', 662.5, 1163.8, 0.4, 2.4),
    ],
  },
  // East of the Saltcut: nets drying on the headland, a boat waiting for a tide that has been late since Tuesday.
  {
    id: 'headland-nets',
    props: [
      p('hung-net', 806, 1166, -0.25, 2),
      p('hung-net', 813, 1169.4, 0.2, 2.2),
      p('rowing-boat', 822, 1167, 1.6, 2.4, { rot: [0, 1.6, -0.2] }),
      p('wooden-post', 799, 1171, 0.3, 1.8),
      p('bird-gull', 799, 1171, 1.4, 1.3, { dy: 1.75 }),
      p('rope-coil', 803, 1172.4, 0.9, 1.8),
      p('oar-pair', 817.4, 1163.6, 2.1, 2),
      p('marram-grass', 826, 1160, 0.7, 2),
    ],
  },
  // East: sandcastle works, with a rock pool for a moat.
  {
    id: 'bucket-works',
    props: [
      p('garden-rock', 880, 1167, 0.4, 0.9, { tint: 0xcdb98a }),
      p('garden-rock', 881.8, 1168.4, 1.7, 0.6, { tint: 0xcdb98a }),
      p('garden-rock', 878.6, 1168.8, 2.2, 0.5, { tint: 0xcdb98a }),
      p('bucket-and-spade', 876.2, 1166.4, 0.5, 2, { tint: 0x2f6fb0 }),
      p('bucket-and-spade', 884.6, 1170.4, 2.6, 2, { tint: 0xe8c03a }),
      p('bucket-and-spade', 880.4, 1172, 3.8, 1.8, { tint: 0xd04a3a }),
      p('rock-pool', 889, 1175, 1.8, 2.4),
    ],
  },
  // East: the HOA closed the beach. The beach did not hear.
  {
    id: 'closed-beach',
    props: [
      p('deck-chair', 951, 1166, 0.5, 2.4, { rot: [0, 0.5, 0.18] }),
      p('beach-umbrella', 946, 1160, 0.3, 2.2, { tint: 0xd04a3a, rot: [0.14, 0.3, 0.1] }),
      p('bird-gull', 953, 1161.4, 3.3, 1.3, { dy: 0.4 }),
      p('driftwood-pile', 960, 1170, 1.2, 1.8),
    ],
    signs: [{ text: 'BEACH CLOSED\n(By the HOA. The sea disagrees.)', x: 957, z: 1158, yaw: Math.PI, w: 3.4, h: 1.3, post: 1.2 }],
  },
  // Dunelow's strand: the deckchair hire (the attendant is a BEACH_FOLK resident).
  {
    id: 'dunelow-hire',
    props: [
      p('deck-chair', -612, 1170.2, 0.1, 2.4, { tint: 0xd04a3a }),
      p('deck-chair', -605, 1169.4, -0.12, 2.4, { tint: 0x2f6fb0 }),
      p('deck-chair', -598.5, 1171, 0.2, 2.4, { tint: 0xe8c03a }),
      p('deck-chair', -590, 1169.8, -0.05, 2.4, { tint: 0x2a9d8f }),
      p('deck-chair', -583, 1170.6, 0.3, 2.4, { tint: 0xd04a3a }),
      p('deck-chair', -576, 1169.2, -0.22, 2.4, { tint: 0x2f6fb0, rot: [0, -0.22, 0.12] }),
      p('deck-chair', -569, 1170.4, 0.08, 2.4, { tint: 0xe8c03a }),
      // The stack, leaning on the sign.
      p('deck-chair', -626, 1163, 0.4, 2.4, { tint: 0xd04a3a, rot: [-0.35, 0.4, 0] }),
      p('deck-chair', -624.8, 1162.4, 0.5, 2.4, { tint: 0x2f6fb0, rot: [-0.3, 0.5, 0] }),
      p('deck-chair', -623.6, 1162, 0.6, 2.4, { tint: 0xe8c03a, rot: [-0.25, 0.6, 0] }),
      p('beach-umbrella', -596.5, 1166.6, 0.2, 2.2, { tint: 0xf0f0e8 }),
      p('rope-coil', -600.2, 1164.8, 0.9, 1.6),
    ],
    signs: [{ text: 'DECKCHAIRS\nHIRE 1 ACORN\n(Chairs not responsible for gulls)', x: -619, z: 1160, yaw: Math.PI, w: 3.6, h: 1.5, post: 1.2 }],
  },
];

// ---------------------------------------------------------------------------------------------------------------------
// The X (G3#14). The strips, the hole and the heap are flat meshes; the post, the boot and the heap's rock are prefabs.

const X_HOLE: readonly [number, number] = [CHART_X[0] + 2.8, CHART_X[1] + 1.6];

const CHART_SCENE: BeachScene = {
  id: 'chart-x',
  props: [
    p('x-marker-post', CHART_X[0] - 2.4, CHART_X[1] - 1.8, 0.3, 2),
    // The boot, lying on its side in the hole ("Only a boot.").
    p('wellies', X_HOLE[0] - 0.1, X_HOLE[1] + 0.05, 0.8, 2.4, { rot: [0, 0.8, Math.PI / 2], dy: 0.3 }),
    // The heap the digger made.
    p('garden-rock', X_HOLE[0] + 1.3, X_HOLE[1] + 0.5, 0.5, 0.55, { tint: 0xcdb98a, dy: -0.12 }),
    p('garden-rock', X_HOLE[0] + 1.9, X_HOLE[1] + 1.0, 1.6, 0.4, { tint: 0xc4ad7a, dy: -0.1 }),
  ],
};

// ---------------------------------------------------------------------------------------------------------------------
// The Saltcut (G3#26): reeds and mooring posts on its banks, a daymark and a sign at the mouth.

/** The daymark stands on the east bank, just inside the shore. */
export const DAYMARK: Prop = p('saltcut-daymark', 743, 1186, 0, 4);

interface Sample { x: number; z: number; nx: number; nz: number }

/** The channel's centre line from z 1070 down to the shore, with its unit normal, one entry per profile sample. */
function saltcutSamples(): Sample[] {
  const prof = courseProfile('saltcut');
  if (!prof) return [];
  const out: Sample[] = [];
  for (let i = 1; i < prof.x.length - 1; i++) {
    if (prof.z[i] < 1070 || prof.z[i] > 1186) continue;
    const tx = prof.x[i + 1] - prof.x[i - 1], tz = prof.z[i + 1] - prof.z[i - 1];
    const l = Math.hypot(tx, tz) || 1;
    out.push({ x: prof.x[i], z: prof.z[i], nx: -tz / l, nz: tx / l });
  }
  return out;
}

function nearestSample(s: Sample[], z: number): Sample {
  let best = s[0];
  for (const c of s) if (Math.abs(c.z - z) < Math.abs(best.z - z)) best = c;
  return best;
}

const dry = (x: number, z: number): boolean => waterDepthAt(x, z) === 0;

function saltcutScene(): BeachScene {
  const props: Prop[] = [];
  const samples = saltcutSamples();
  if (samples.length === 0) return { id: 'saltcut', props };
  // Reeds on both banks, in irregular groups with gaps.
  samples.forEach((s, i) => {
    for (const side of [1, -1]) {
      const k = side > 0 ? 1 : 2;
      if (hash(i, k) < 0.42) continue;
      const off = 7.6 + hash(i, k + 4) * 2.4;
      const along = (hash(i, k + 8) - 0.5) * 3;
      const x = s.x + side * s.nx * off - s.nz * along, z = s.z + side * s.nz * off + s.nx * along;
      if (!dry(x, z) || z > 1187) continue;
      const flat = Math.abs(heightAt(x + 1.2, z) - heightAt(x - 1.2, z)) + Math.abs(heightAt(x, z + 1.2) - heightAt(x, z - 1.2)) < 0.35;
      const bed = flat && hash(i, k + 12) < 0.35;
      props.push(p(bed ? 'reed-bed' : 'reed-clump', x, z, hash(i, k + 16) * 6.28, bed ? 0.7 + hash(i, 3) * 0.3 : 1.2 + hash(i, 5) * 0.7));
    }
  });
  // Mooring posts, some with a rope coil; a dinghy tied up at one.
  const posts: { z: number; side: number; coil: boolean; big: boolean }[] = [
    { z: 1112, side: 1, coil: true, big: false },
    { z: 1128, side: -1, coil: false, big: true },
    { z: 1144, side: 1, coil: true, big: true },
    { z: 1159, side: -1, coil: true, big: false },
    { z: 1175, side: 1, coil: false, big: false },
  ];
  for (const m of posts) {
    const s = nearestSample(samples, m.z);
    const x = s.x + m.side * s.nx * 8.2, z = s.z + m.side * s.nz * 8.2;
    if (!dry(x, z)) continue;
    props.push(m.big ? p('pier-post', x, z, 0, 0.7) : p('wooden-post', x, z, m.z, 1.6));
    if (m.coil) props.push(p('rope-coil', x + 0.7, z + 0.5, m.z, 1.6));
  }
  const dinghyAt = nearestSample(samples, 1144);
  const dx = dinghyAt.x + dinghyAt.nx * 10.6, dz = dinghyAt.z + dinghyAt.nz * 10.6;
  if (dry(dx, dz)) props.push(p('walnut-dinghy', dx, dz, Math.atan2(-dinghyAt.nz, -dinghyAt.nx) + Math.PI / 2, 1.3, { rot: [0, Math.atan2(-dinghyAt.nz, -dinghyAt.nx) + Math.PI / 2, 0.1] }));
  // The mouth: the daymark and its sign.
  props.push(DAYMARK);
  props.push(p('reed-clump', 750.5, 1183.4, 1.2, 1.5), p('reed-clump', 747, 1178.5, 3.1, 1.3), p('rope-coil', 741, 1182.4, 0.4, 1.6), p('driftwood-pile', 754, 1186, 0.9, 1.4));
  return {
    id: 'saltcut', props,
    signs: [{ text: 'THE SALTCUT\nWhere the Puddle Sea\nlearned to run downhill.', x: 751.5, z: 1176.5, yaw: Math.PI, w: 3.6, h: 1.5, post: 1.2 }],
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Lifebuoy posts every 150 m along the top of the beach.

/** x of each lifebuoy post, and its z (the top of the sand). */
const LIFEBUOY_X = [-900, -750, -600, -450, -300, -150, 0, 150, 300, 450, 600, 790, 920];
const LIFEBUOYS: BeachScene = {
  id: 'lifebuoys',
  props: LIFEBUOY_X.map((x, i) => p('lifebuoy-post', x, x > -330 && x < 330 ? 1146 : 1152, (i % 2 ? 0.1 : -0.12), 2)),
};

/** Every scene of the beach strand (pure data: the test reads it). */
export function beachScenePlan(): BeachScene[] {
  return [...SCENES, CHART_SCENE, saltcutScene(), LIFEBUOYS];
}

// ---------------------------------------------------------------------------------------------------------------------
// Building.

/** A ribbon laid on the ground from a to b (width w), every vertex 2 cm over the ground there. */
function groundRibbon(ax: number, az: number, bx: number, bz: number, w: number): THREE.BufferGeometry {
  const segs = 8;
  const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz);
  const nx = -dz / l * w / 2, nz = dx / l * w / 2;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let k = 0; k <= segs; k++) {
    const cx = ax + dx * k / segs, cz = az + dz * k / segs;
    pos.push(cx + nx, heightAt(cx + nx, cz + nz) + 0.02, cz + nz, cx - nx, heightAt(cx - nx, cz - nz) + 0.02, cz - nz);
    if (k > 0) { const a = (k - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  return upGeometry(pos, idx);
}

/** A disc laid on the ground (radius r, a slightly wobbly edge), every vertex 2 cm over the ground there. */
function groundDisc(cx: number, cz: number, r: number): THREE.BufferGeometry {
  const n = 20;
  const pos: number[] = [cx, heightAt(cx, cz) + 0.02, cz];
  const idx: number[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2, rr = r * (0.9 + 0.2 * hash(k, 9));
    const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
    pos.push(x, heightAt(x, z) + 0.02, z);
    idx.push(0, 1 + k, 1 + ((k + 1) % n));
  }
  return upGeometry(pos, idx);
}

function upGeometry(pos: number[], idx: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const nrm: number[] = [];
  for (let i = 0; i < pos.length / 3; i++) nrm.push(0, 1, 0);
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setIndex(idx);
  return g;
}

function buildScene(parent: THREE.Scene, def: BeachScene): void {
  const group = new THREE.Group();
  group.name = `beach-scene-${def.id}`;
  const placements: StaticPrefabPlacement[] = [];
  for (const pr of def.props) {
    if (!getPrefab(pr.id)) continue;
    placements.push({
      id: pr.id, x: pr.x, z: pr.z, y: heightAt(pr.x, pr.z) + (pr.dy ?? 0),
      yaw: pr.yaw ?? 0, scale: pr.scale ?? 1,
      ...(pr.rot ? { rot: pr.rot } : {}),
      ...(pr.tint !== undefined ? { tint: pr.tint } : {}),
    });
  }
  if (placements.length > 0) group.add(buildStaticPrefabs(placements, { lights: false, name: `${def.id}-props` }));
  for (const s of def.signs ?? []) {
    const sign = coastSign(s.text, { w: s.w, h: s.h, post: s.post });
    sign.position.set(s.x, heightAt(s.x, s.z), s.z);
    sign.rotation.y = s.yaw;
    group.add(sign);
  }
  if (def.id === 'chart-x') addChartX(group);
  parent.add(group);
  registerCull(group, 'prop');
}

/** The X itself and the hole: flat things on a decal layer. */
function addChartX(group: THREE.Group): void {
  const [cx, cz] = CHART_X;
  const strip = flatLayer(new THREE.MeshStandardMaterial({ color: 0xb5502e, emissive: 0x3a1408, roughness: 0.95, side: THREE.DoubleSide }), LAYER.decal);
  const h = 1.7 * Math.SQRT1_2;
  group.add(new THREE.Mesh(groundRibbon(cx - h, cz - h, cx + h, cz + h, 0.4), strip));
  group.add(new THREE.Mesh(groundRibbon(cx - h, cz + h, cx + h, cz - h, 0.4), strip));
  const holeMat = flatLayer(new THREE.MeshStandardMaterial({ color: 0x6b5638, roughness: 1, side: THREE.DoubleSide }), LAYER.decal);
  group.add(new THREE.Mesh(groundDisc(X_HOLE[0], X_HOLE[1], 0.85), holeMat));
}

/** Static scenery for the strand, the chart X and the Saltcut. */
export function buildBeachScenes(scene: THREE.Scene, _boxes: Box[]): void {
  for (const def of beachScenePlan()) buildScene(scene, def);
}
