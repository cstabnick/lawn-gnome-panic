// Countryside herds (E16): red deer in herds (one stag, hinds, fawns) and hill goats. Deer bolt together from a gnome on
// foot, a vehicle or a gunshot, graze now and then, and get up offended when knocked over (the default knock-over).
// Nothing dies (R-021): a shot deer lies down, gets up and runs off.
import { CRITTER_SPECS, type Critter, type CritterCtx, type CritterKind, type CritterRuntime, openSpot, type RegionLife } from '../critters';
import { MAX_HERD, type HerdDef } from '../country/types';
import { regionAt } from '../levels';

/** Where the herds live (world coordinates; each is nudged to open ground in its region). */
export const HERDS: readonly HerdDef[] = [
  { id: 'herd-west-estates', kind: 'deer', x: -1290, z: -640, count: 5, leash: 45 },
  { id: 'herd-highlands-west', kind: 'deer', x: -840, z: -1190, count: 5, leash: 45 },
  { id: 'herd-highlands-east', kind: 'deer', x: 560, z: -1090, count: 5, leash: 45 },
  { id: 'herd-rootwell-meadow', kind: 'deer', x: 1060, z: 810, count: 5, leash: 45 },
  { id: 'herd-cloverfield', kind: 'deer', x: 360, z: 560, count: 5, leash: 45 },
  { id: 'herd-loch-moss', kind: 'deer', x: -490, z: -790, count: 5, leash: 45 },
  { id: 'goats-highland-spine', kind: 'goat', x: -140, z: -1140, count: 5, leash: 30 },
  { id: 'goats-fells-north', kind: 'goat', x: 210, z: -990, count: 4, leash: 30 },
];

const DEER: ReadonlySet<CritterKind> = new Set<CritterKind>(['deer', 'stag', 'fawn']);
const GUNFIRE_RANGE = 80;
const GRAZE_GAP = 4;
const GRAZE_CHANCE = 0.2;
const GRAZE_MIN = 3;
const GRAZE_SPAN = 5;
const HERD_FAR = 250;

interface State { ammo?: number }
const states = new WeakMap<CritterRuntime, State>();
function stateOf(rt: CritterRuntime): State {
  let s = states.get(rt);
  if (!s) {
    s = {};
    states.set(rt, s);
  }
  return s;
}

/** The runtime that ran this life most recently (for deerWithin). */
let last: CritterRuntime | null = null;

/**
 * Spawn a herd of `n` around (x, z) sharing one group id. kind 'deer' makes one stag, then hinds and fawns (about one
 * fawn per three); 'goat' makes goats. Returns the members. Reusable by other epics (E12/E17) for any CritterKind.
 */
export function spawnHerd(rt: CritterRuntime, kind: CritterKind, x: number, z: number, n: number, group: string, leash = 40): Critter[] {
  const region = regionAt(x, z);
  const count = Math.min(n, MAX_HERD);
  const fawns = kind === 'deer' ? Math.floor(count / 3) : 0;
  const out: Critter[] = [];
  for (let i = 0; i < count; i++) {
    const memberKind: CritterKind = kind !== 'deer' ? kind : i === 0 ? 'stag' : i >= count - fawns ? 'fawn' : 'deer';
    const stag = memberKind === 'stag';
    const a = Math.random() * Math.PI * 2;
    const r = stag ? 8 : Math.sqrt(Math.random()) * 6;
    const spot = openSpot(x + Math.cos(a) * r, z + Math.sin(a) * r, CRITTER_SPECS[memberKind].radius + 1, region, rt.world);
    if (!spot) continue;
    const c = rt.spawn(memberKind, spot.x, spot.z, { region, group, leash: stag ? leash * 0.6 : leash, yaw: Math.random() * Math.PI * 2 });
    c.homeX = x;
    c.homeZ = z;
    out.push(c);
  }
  return out;
}

/**
 * Ids of deer (kinds 'deer', 'stag', 'fawn') within r of (x, z) that are calm (mode 'idle' or 'wander', not fleeing or
 * down), from the last runtime that ran this life. [] before the critters start. Used by "Deer Me".
 */
export function deerWithin(x: number, z: number, r: number): number[] {
  if (!last) return [];
  const ids: number[] = [];
  for (const c of last.list) {
    if (!DEER.has(c.kind) || (c.mode !== 'idle' && c.mode !== 'wander')) continue;
    if (Math.hypot(c.x - x, c.z - z) <= r) ids.push(c.id);
  }
  return ids;
}

export const countrysideLife: RegionLife = {
  id: 'countryside',
  groups: [],

  init(rt) {
    last = rt;
    for (const h of HERDS) {
      const region = regionAt(h.x, h.z);
      const centre = openSpot(h.x, h.z, 2, region, rt.world) ?? { x: h.x, z: h.z };
      spawnHerd(rt, h.kind, centre.x, centre.z, h.count, h.id, h.leash);
    }
  },

  update(rt, ctx: CritterCtx) {
    const s = stateOf(rt);
    last = rt;

    // Gunfire: a drop in the magazine since last frame is a shot; every deer near the player bolts from the player.
    let shot = false;
    if (typeof ctx.ammo === 'number') {
      shot = s.ammo !== undefined && ctx.ammo < s.ammo;
      s.ammo = ctx.ammo;
    }
    if (shot) {
      for (const c of rt.list) {
        if (DEER.has(c.kind) && Math.hypot(c.x - ctx.playerX, c.z - ctx.playerZ) <= GUNFIRE_RANGE) rt.scare(c, ctx.playerX, ctx.playerZ);
      }
    }

    // A herd flees as one: any fleeing deer takes its calm herd-mates with it, from the same point.
    const fleeing = new Map<string, { x: number; z: number }>();
    for (const c of rt.list) {
      if (DEER.has(c.kind) && c.group !== '' && c.mode === 'flee' && !fleeing.has(c.group)) fleeing.set(c.group, { x: c.fromX, z: c.fromZ });
    }
    if (fleeing.size > 0) {
      for (const c of rt.list) {
        if (!DEER.has(c.kind) || (c.mode !== 'idle' && c.mode !== 'wander')) continue;
        const f = fleeing.get(c.group);
        if (f) rt.scare(c, f.x, f.z);
      }
    }

    // Grazing: calm deer stop now and then, so a herd looks like it is grazing rather than marching.
    for (const c of rt.list) {
      if (!DEER.has(c.kind) || c.mode !== 'wander') continue;
      if (Math.hypot(c.homeX - ctx.playerX, c.homeZ - ctx.playerZ) > HERD_FAR) continue;
      const at = (c.data.grazeAt as number | undefined) ?? -Infinity;
      if (ctx.time - at < GRAZE_GAP) continue;
      if (Math.random() < GRAZE_CHANCE * ctx.dt) {
        c.mode = 'idle';
        c.modeT = GRAZE_MIN + Math.random() * GRAZE_SPAN;
        c.data.grazeAt = ctx.time;
      }
    }
  },

  // The default knock-over is right: a puff, they lie down, get up and run off.
  onHit: () => false,
};
