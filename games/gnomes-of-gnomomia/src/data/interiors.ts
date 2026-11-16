// Building interiors: room templates shared by every common building, and the seeded layout that makes each house a little
// different (palette, mirrored plan, which furniture fills each slot, scattered clutter, the family name on the door).
// Pure data and maths, no three.js: content.ts runs layoutInterior once per house at load time.
import type { FurnitureKind, FurniturePlacement, HouseDef, InteriorSpec, InteriorTemplateId } from '../config';

/** A spot in the room that holds one piece of furniture, picked by the house's seed from `pick` (or nothing). */
export interface FurnitureSlot {
  x: number; z: number; yaw?: number;
  pick: readonly FurnitureKind[];
  /** 0..1 chance the slot is filled at all (default 1). */
  chance?: number;
}

export interface InteriorTemplate {
  id: InteriorTemplateId;
  /** Room name when the house has no `interior.name`; `{family}` becomes a seeded family name. */
  name: string;
  hw: number; hd: number;
  floors: readonly number[]; walls: readonly number[]; trims: readonly number[];
  light: number;
  /** Always present (not mirrored away, but mirrored with the plan). */
  fixed: readonly FurniturePlacement[];
  slots: readonly FurnitureSlot[];
  /** Small things scattered on free floor. */
  clutter: { kinds: readonly FurnitureKind[]; min: number; max: number };
}

/** Collision radius of each kind (0 = walk over it). Bookshelves and lecterns are objects but still block. */
export const FURNITURE_RADIUS: Record<FurnitureKind, number> = {
  bed: 0.9, bedroll: 0, table: 0.8, chair: 0.3, stool: 0.3, bench: 0.5, hearth: 0.9, barrel: 0.45, crate: 0.45,
  sack: 0.35, rug: 0, pot: 0.35, lamp: 0.25, counter: 0.9, altar: 0.8, pew: 0.7, workbench: 0.9, anvil: 0.5,
  loom: 0.8, cauldron: 0.6, plant: 0.35, painting: 0, wardrobe: 0.6, cupboard: 0.6, millstone: 1.0,
  bookshelf: 0.6, lectern: 0.4,
};

/** Kinds that hang on or stand flush against a wall: placed by slots only, never as clutter. */
const WALL_KINDS: ReadonlySet<FurnitureKind> = new Set(['painting', 'bookshelf', 'wardrobe', 'cupboard', 'hearth', 'counter']);

/** Family names for unnamed houses (rule 5: soil, tools and household things). Not used by any canon NPC. */
export const FAMILY_NAMES: readonly string[] = [
  'Trowelby', 'Muckridge', 'Pegsworth', 'Twineham', 'Sodsmith', 'Barrowman', 'Loamwell', 'Rakeford', 'Dibbler', 'Seedpot',
  'Mulchwick', 'Hoeland', 'Pebblesby', 'Thimblewood', 'Spadeley', 'Potherb', 'Kettleby', 'Clodhurst', 'Bucketsby', 'Wickerwell',
  'Sprigg', 'Bootlace', 'Cobbleton', 'Ladleworth', 'Puttock', 'Skep', 'Tinderby', 'Grubwell',
];

// Back wall is z = -hd, door wall is z = +hd. yaw 0 faces the door; Math.PI faces the back wall;
// PI/2 faces +x (east) and -PI/2 faces -x (west).
const E = Math.PI / 2, W = -Math.PI / 2, N = Math.PI;

export const TEMPLATES: Record<InteriorTemplateId, InteriorTemplate> = {
  cottage: {
    id: 'cottage', name: 'the {family} cottage', hw: 5, hd: 4,
    floors: [0x8a6a44, 0x9a7a4e, 0x7d5f3c], walls: [0xe6d3a3, 0xd9c08a, 0xeadcb8], trims: [0x6b4a2b, 0x5a3a1e],
    light: 0xffc97a,
    fixed: [{ kind: 'hearth', x: 0, z: -3.3, yaw: 0 }],
    slots: [
      { x: -3.6, z: -2.6, yaw: E, pick: ['bed', 'bed', 'bedroll'] },
      { x: 1.4, z: 0.3, pick: ['table'] },
      { x: 2.5, z: 0.3, yaw: W, pick: ['chair', 'stool'], chance: 0.8 },
      { x: 0.3, z: 0.3, yaw: E, pick: ['chair', 'stool'], chance: 0.6 },
      { x: 4.4, z: -2.0, yaw: W, pick: ['bookshelf', 'cupboard', 'wardrobe'] },
      { x: -4.4, z: 1.2, yaw: E, pick: ['bookshelf', 'cupboard'], chance: 0.5 },
      { x: -1.6, z: -1.2, pick: ['rug'], chance: 0.7 },
      { x: 2.2, z: -3.8, pick: ['painting'], chance: 0.5 },
      { x: 4.2, z: 3.2, pick: ['plant', 'pot', 'barrel'], chance: 0.7 },
    ],
    clutter: { kinds: ['barrel', 'crate', 'sack', 'pot', 'stool', 'lamp', 'plant'], min: 1, max: 3 },
  },
  'mushroom-home': {
    id: 'mushroom-home', name: 'the {family} cap-house', hw: 4.5, hd: 4.5,
    floors: [0x7a5a3a, 0x6e5034], walls: [0xf2e6c8, 0xeee0bd], trims: [0xc8352e, 0xb02e28],
    light: 0xffd38a,
    fixed: [{ kind: 'hearth', x: 0, z: -3.8, yaw: 0 }],
    slots: [
      { x: -3.2, z: -2.6, yaw: E, pick: ['bed', 'bedroll'] },
      { x: 1.2, z: 0.5, pick: ['table'] },
      { x: 2.3, z: 0.5, yaw: W, pick: ['stool', 'chair'], chance: 0.8 },
      { x: 3.9, z: -1.8, yaw: W, pick: ['bookshelf', 'cupboard'] },
      { x: -3.9, z: 1.5, yaw: E, pick: ['bookshelf', 'wardrobe', 'cupboard'], chance: 0.5 },
      { x: -1.2, z: -0.8, pick: ['rug'], chance: 0.6 },
      { x: 2.0, z: -4.3, pick: ['painting'], chance: 0.4 },
      { x: -3.4, z: 3.4, pick: ['plant', 'pot'], chance: 0.6 },
    ],
    clutter: { kinds: ['pot', 'sack', 'stool', 'lamp', 'plant', 'barrel'], min: 1, max: 3 },
  },
  hall: {
    id: 'hall', name: 'the {family} hall', hw: 7, hd: 6,
    floors: [0x8d8d86, 0x7f7f78, 0x9a9488], walls: [0xa8a8a0, 0xb3ada0], trims: [0x6e6e68, 0x5a5a54],
    light: 0xffd9a0,
    fixed: [{ kind: 'hearth', x: 0, z: -5.3, yaw: 0 }, { kind: 'table', x: 0, z: -0.5, scale: 1.4 }],
    slots: [
      { x: -1.6, z: -0.5, yaw: E, pick: ['bench', 'chair'] },
      { x: 1.6, z: -0.5, yaw: W, pick: ['bench', 'chair'] },
      { x: -6.4, z: -3.0, yaw: E, pick: ['bookshelf'] },
      { x: -6.4, z: 0.5, yaw: E, pick: ['bookshelf', 'cupboard'], chance: 0.6 },
      { x: 6.4, z: -3.0, yaw: W, pick: ['bookshelf', 'wardrobe', 'cupboard'] },
      { x: 3.0, z: -5.8, pick: ['painting'], chance: 0.7 },
      { x: -3.0, z: -5.8, pick: ['painting'], chance: 0.5 },
      { x: 0, z: 3.0, pick: ['rug'], chance: 0.8 },
      { x: 5.6, z: 4.6, pick: ['lamp', 'plant'], chance: 0.8 },
      { x: -5.6, z: 4.6, pick: ['lamp', 'plant', 'barrel'], chance: 0.8 },
    ],
    clutter: { kinds: ['crate', 'barrel', 'lamp', 'pot', 'stool'], min: 1, max: 3 },
  },
  workshop: {
    id: 'workshop', name: 'the {family} workshop', hw: 6, hd: 5,
    floors: [0x6e5232, 0x7a5a36], walls: [0x8b5a2b, 0x7d4f26], trims: [0x5a3a1e, 0x4a2f18],
    light: 0xffbf70,
    fixed: [{ kind: 'workbench', x: 0, z: -4.2, yaw: 0 }],
    slots: [
      { x: -3.4, z: -1.4, pick: ['anvil', 'loom', 'millstone', 'cauldron'] },
      { x: 3.4, z: -1.4, pick: ['workbench', 'loom', 'cauldron', 'table'], chance: 0.7 },
      { x: 5.3, z: 1.8, yaw: W, pick: ['cupboard', 'bookshelf'], chance: 0.6 },
      { x: -5.0, z: 3.6, yaw: E, pick: ['bedroll'], chance: 0.6 },
      { x: 4.8, z: -4.3, pick: ['barrel', 'crate'] },
      { x: -4.8, z: -4.3, pick: ['barrel', 'crate', 'sack'] },
    ],
    clutter: { kinds: ['crate', 'barrel', 'sack', 'sack', 'stool', 'lamp'], min: 2, max: 4 },
  },
  chapel: {
    id: 'chapel', name: 'the {family} shrine-pot', hw: 5, hd: 6,
    floors: [0xb5562f, 0xa44e2b], walls: [0xc96a3c, 0xd27a4a], trims: [0x8a3c20, 0x7a3418],
    light: 0xffe0b0,
    fixed: [{ kind: 'altar', x: 0, z: -5.0, yaw: 0 }, { kind: 'lectern', x: 0, z: -3.2, yaw: 0 }],
    slots: [
      { x: -2.0, z: -0.8, yaw: N, pick: ['pew', 'bench'] },
      { x: 2.0, z: -0.8, yaw: N, pick: ['pew', 'bench'] },
      { x: -2.0, z: 1.6, yaw: N, pick: ['pew', 'bench'], chance: 0.8 },
      { x: 2.0, z: 1.6, yaw: N, pick: ['pew', 'bench'], chance: 0.8 },
      { x: -4.2, z: -5.0, pick: ['plant', 'lamp'] },
      { x: 4.2, z: -5.0, pick: ['plant', 'lamp'] },
      { x: 4.4, z: 3.5, yaw: W, pick: ['bookshelf', 'cupboard'], chance: 0.5 },
    ],
    clutter: { kinds: ['pot', 'lamp', 'plant'], min: 0, max: 2 },
  },
  tent: {
    id: 'tent', name: 'the {family} tent', hw: 3.5, hd: 3.5,
    floors: [0x8a7a52, 0x7d6e48], walls: [0xc8b07a, 0xb8a06a], trims: [0x6a5a40, 0x5a4a34],
    light: 0xffb060,
    fixed: [{ kind: 'bedroll', x: -1.6, z: -1.8, yaw: E }],
    slots: [
      { x: 1.8, z: -2.2, pick: ['crate', 'sack', 'barrel'] },
      { x: 0.6, z: 0.4, pick: ['lamp', 'pot'], chance: 0.8 },
      { x: 2.6, z: 1.6, pick: ['sack', 'crate'], chance: 0.5 },
    ],
    clutter: { kinds: ['sack', 'pot'], min: 0, max: 1 },
  },
  tavern: {
    id: 'tavern', name: 'the {family} tavern', hw: 7, hd: 6,
    floors: [0x7a5a36, 0x6e5232], walls: [0xd9b56a, 0xccaa60], trims: [0x5a3a1e, 0x4a2f18],
    light: 0xffbf70,
    fixed: [{ kind: 'counter', x: 0, z: -4.4, yaw: 0, scale: 1.5 }, { kind: 'hearth', x: -6.3, z: 0, yaw: E }],
    slots: [
      { x: -5.0, z: -5.4, pick: ['barrel'] }, { x: 5.0, z: -5.4, pick: ['barrel'] }, { x: 3.6, z: -5.4, pick: ['barrel', 'crate'], chance: 0.7 },
      { x: -3.0, z: 0.0, pick: ['table'] }, { x: -3.0, z: 1.1, pick: ['stool'] }, { x: -3.0, z: -1.1, pick: ['stool'], chance: 0.7 },
      { x: 2.6, z: 0.0, pick: ['table'] }, { x: 2.6, z: 1.1, pick: ['stool'] }, { x: 3.7, z: 0.0, yaw: W, pick: ['stool'], chance: 0.7 },
      { x: 2.6, z: 3.6, pick: ['table'], chance: 0.8 }, { x: 3.7, z: 3.6, yaw: W, pick: ['stool'], chance: 0.8 },
      { x: 6.4, z: -1.5, yaw: W, pick: ['bookshelf', 'cupboard'], chance: 0.6 },
      { x: 0, z: -5.8, pick: ['painting'], chance: 0.8 },
    ],
    clutter: { kinds: ['stool', 'barrel', 'lamp', 'pot'], min: 1, max: 2 },
  },
  library: {
    id: 'library', name: 'the {family} reading room', hw: 6, hd: 6,
    floors: [0x6b4a2b, 0x5a3e24], walls: [0xe6d3a3, 0xd9c08a], trims: [0x5a3a1e, 0x3e2814],
    light: 0xffe6b0,
    fixed: [{ kind: 'lectern', x: 0, z: -1.0, yaw: 0 }],
    slots: [
      { x: -5.4, z: -4.0, yaw: E, pick: ['bookshelf'] }, { x: -5.4, z: -1.0, yaw: E, pick: ['bookshelf'] }, { x: -5.4, z: 2.0, yaw: E, pick: ['bookshelf'], chance: 0.7 },
      { x: 5.4, z: -4.0, yaw: W, pick: ['bookshelf'] }, { x: 5.4, z: -1.0, yaw: W, pick: ['bookshelf'] }, { x: 5.4, z: 2.0, yaw: W, pick: ['bookshelf'], chance: 0.7 },
      { x: -2.0, z: -5.4, pick: ['bookshelf', 'painting'] }, { x: 2.0, z: -5.4, pick: ['bookshelf', 'painting'] },
      { x: 0, z: 2.4, pick: ['table'] }, { x: -1.1, z: 2.4, yaw: E, pick: ['chair'] }, { x: 1.1, z: 2.4, yaw: W, pick: ['chair', 'stool'], chance: 0.7 },
      { x: 0, z: 0.8, pick: ['rug'], chance: 0.8 },
    ],
    clutter: { kinds: ['lamp', 'plant', 'stool'], min: 1, max: 2 },
  },
  shop: {
    id: 'shop', name: 'the {family} shop', hw: 5, hd: 5,
    floors: [0x8a6a44, 0x7d5f3c], walls: [0xd9c08a, 0xe6d3a3], trims: [0x6b4a2b, 0x5a3a1e],
    light: 0xffd08a,
    fixed: [{ kind: 'counter', x: 0, z: -2.4, yaw: 0, scale: 1.3 }],
    slots: [
      { x: -4.4, z: -4.2, yaw: E, pick: ['cupboard', 'bookshelf'] }, { x: 4.4, z: -4.2, yaw: W, pick: ['cupboard', 'wardrobe'] },
      { x: -4.0, z: 1.0, pick: ['crate', 'barrel'] }, { x: -4.0, z: 2.4, pick: ['crate', 'sack'], chance: 0.8 },
      { x: 4.0, z: 1.0, pick: ['barrel', 'sack'] }, { x: 4.0, z: 2.4, pick: ['crate', 'pot'], chance: 0.8 },
      { x: 0, z: -4.6, pick: ['painting', 'cupboard'], chance: 0.6 },
    ],
    clutter: { kinds: ['sack', 'crate', 'pot', 'lamp'], min: 1, max: 3 },
  },
};

/** Default template per house style. */
export const STYLE_TEMPLATE: Record<HouseDef['style'], InteriorTemplateId> = {
  thatch: 'cottage', mushroom: 'mushroom-home', stone: 'hall', log: 'workshop', pot: 'chapel', tent: 'tent',
};

/** Same generator world.ts uses. */
export function mulberry32(a: number): () => number {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** FNV-1a hash of a string, for seeding. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

export interface InteriorLayout {
  template: InteriorTemplate;
  name: string;
  palette: { floor: number; wall: number; trim: number };
  /** Everything in the room, bookshelves and lecterns included (content.ts turns those into objects). */
  furniture: FurniturePlacement[];
}

/** Room keeps a clear lane from the door: |x| < 1.1 and z > hd - 2.4. */
function inDoorLane(t: InteriorTemplate, x: number, z: number, r: number): boolean {
  return Math.abs(x) < 1.1 + r && z > t.hd - 2.4 - r;
}

/**
 * The furniture of one house. Deterministic in (zoneId, spec.seed). `keepClear` are spots something else stands on
 * (NPCs and objects that packs placed in this interior); generated furniture stays 1 m clear of them.
 */
export function layoutInterior(
  zoneId: string, style: HouseDef['style'], spec: InteriorSpec, keepClear: readonly { x: number; z: number }[],
): InteriorLayout {
  const t = TEMPLATES[spec.template ?? STYLE_TEMPLATE[style]];
  const rng = mulberry32(hashString(zoneId) ^ (spec.seed ?? 0));
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rng() * xs.length) % xs.length];
  const mirror = rng() < 0.5 ? -1 : 1;
  const palette = {
    floor: spec.palette?.floor ?? pick(t.floors),
    wall: spec.palette?.wall ?? pick(t.walls),
    trim: spec.palette?.trim ?? pick(t.trims),
  };
  const family = pick(FAMILY_NAMES);
  const name = spec.name ?? t.name.replace('{family}', family);
  const removed = new Set(spec.remove ?? []);

  const out: FurniturePlacement[] = [];
  const blocked = (x: number, z: number, r: number): boolean => {
    if (keepClear.some((k) => Math.hypot(x - k.x, z - k.z) < r + 1)) return true;
    if (inDoorLane(t, x, z, r)) return true;
    return out.some((o) => Math.hypot(x - o.x, z - o.z) < r + FURNITURE_RADIUS[o.kind] + 0.2 && FURNITURE_RADIUS[o.kind] > 0 && r > 0);
  };
  const flipYaw = (yaw: number | undefined): number => (mirror < 0 ? -(yaw ?? 0) : (yaw ?? 0));
  const push = (p: FurniturePlacement): void => { if (!removed.has(p.kind)) out.push(p); };

  for (const f of t.fixed) {
    const x = f.x * mirror;
    if (keepClear.some((k) => Math.hypot(x - k.x, f.z - k.z) < FURNITURE_RADIUS[f.kind] + 1)) continue;
    push({ ...f, x, yaw: flipYaw(f.yaw) });
  }
  for (const s of t.slots) {
    const roll = rng(); const kind = pick(s.pick);
    if (roll > (s.chance ?? 1)) continue;
    const jitter = WALL_KINDS.has(kind) ? 0 : (rng() - 0.5) * 0.3;
    const x = s.x * mirror + jitter, z = s.z;
    if (blocked(x, z, FURNITURE_RADIUS[kind])) continue;
    push({ kind, x, z, yaw: flipYaw(s.yaw) + (WALL_KINDS.has(kind) || kind === 'bed' ? 0 : (rng() - 0.5) * 0.4) });
  }
  const n = t.clutter.min + Math.floor(rng() * (t.clutter.max - t.clutter.min + 1));
  for (let placed = 0, tries = 0; placed < n && tries < 40; tries++) {
    const kind = pick(t.clutter.kinds);
    const r = FURNITURE_RADIUS[kind];
    const x = (rng() * 2 - 1) * (t.hw - 0.6 - r);
    const z = (rng() * 2 - 1) * (t.hd - 0.6 - r);
    if (blocked(x, z, Math.max(r, 0.3))) continue;
    push({ kind, x, z, yaw: rng() * Math.PI * 2 });
    placed++;
  }
  for (const a of spec.add ?? []) out.push({ ...a });
  return { template: t, name, palette, furniture: out };
}

/** Where the door is, for a house on its zone map: the outside doormat (exit trigger) and where you stand on leaving. */
export function doorSpots(h: HouseDef): { matX: number; matZ: number; outX: number; outZ: number } {
  const s = Math.sin(h.yaw), c = Math.cos(h.yaw);
  const mat = h.r * 0.9 + 0.7, out = h.r * 0.9 + 2.5;
  return { matX: h.x + s * mat, matZ: h.z + c * mat, outX: h.x + s * out, outZ: h.z + c * out };
}
