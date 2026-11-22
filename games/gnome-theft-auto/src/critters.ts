// Wildlife runtime (Epic 6): one system for every animal in the outer regions. Region behaviour files
// (src/critters/*.ts) are data plus a small RegionLife; this file spawns, wanders, flees, chases, knocks over, culls and
// animates. Animals never die (roadmap decision 7, R-021): a shot or a hit knocks them over in a puff of fluff or
// feathers, and they get up and run off. Critters are local to each browser (no net), like townsgnomes and traffic.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { angleDiff, pushOutOfBoxes } from './collide';
import { CRITTERS as CFG, HIGHWAYS, WORLD_HALF } from './config';
import { regionAt, type RegionId } from './levels';
import { heightAt, waterAt } from './terrain';
import type { Fx, Sfx, Vehicle, World } from './types';

// ---- Kinds ------------------------------------------------------------------------------------------------------

export type CritterKind = 'cow' | 'sheep' | 'pig' | 'hen' | 'squirrel' | 'polar-bear' | 'bee';

export interface CritterSpec {
  /** @lawn/prefabs id of the body. Named pivots the runtime animates when present: body, head, tail, leg-0..leg-3, wing-0, wing-1. */
  prefab: string;
  /** Scale applied to the prefab. */
  scale: number;
  /** Collision and hit radius, world units. */
  radius: number;
  /** Hit height above its feet, world units. */
  height: number;
  /** Wander and run speeds, units/s. */
  walk: number;
  run: number;
  /** Turn rate, radians/s. */
  turn: number;
  /** Flees from the player on foot within this distance (0 = never). */
  scareFoot: number;
  /** Flees from a moving vehicle within this distance (0 = never). */
  scareVehicle: number;
  /** Colour of the puff (fluff, feathers, wool) when knocked over. */
  puff: number;
  /** Seconds lying on its side before getting up. */
  downTime: number;
  /** Flyers hover this high above the ground (bees). */
  flyHeight?: number;
  /** Never flees, never chases, never wanders by itself (the Fells' polar bears). Its RegionLife moves it if at all. */
  calm?: boolean;
}

export const CRITTER_SPECS: Record<CritterKind, CritterSpec> = {
  cow: { prefab: 'cow', scale: 1, radius: 1.0, height: 1.5, walk: 1.1, run: 5.5, turn: 1.6, scareFoot: 0, scareVehicle: 14, puff: 0xf4f4f4, downTime: 3.5 },
  sheep: { prefab: 'sheep', scale: 1, radius: 0.6, height: 0.95, walk: 1.2, run: 6.5, turn: 2.6, scareFoot: 5, scareVehicle: 16, puff: 0xf4f1e8, downTime: 2.2 },
  pig: { prefab: 'pig', scale: 1, radius: 0.55, height: 0.75, walk: 1.0, run: 5.8, turn: 2.4, scareFoot: 3, scareVehicle: 12, puff: 0xf2b8c6, downTime: 2.4 },
  hen: { prefab: 'hen', scale: 1, radius: 0.3, height: 0.5, walk: 1.4, run: 6.8, turn: 4.5, scareFoot: 4, scareVehicle: 12, puff: 0xfff8e8, downTime: 1.6 },
  squirrel: { prefab: 'squirrel', scale: 1, radius: 0.4, height: 0.75, walk: 2.4, run: 9.5, turn: 6, scareFoot: 0, scareVehicle: 10, puff: 0xb5651d, downTime: 1.8 },
  'polar-bear': { prefab: 'polar-bear', scale: 1, radius: 1.0, height: 1.7, walk: 0, run: 0, turn: 0.8, scareFoot: 0, scareVehicle: 0, puff: 0xffffff, downTime: 0, calm: true },
  bee: { prefab: 'bee', scale: 1, radius: 0.35, height: 0.5, walk: 2.5, run: 8.5, turn: 7, scareFoot: 0, scareVehicle: 0, puff: 0xf2c230, downTime: 1.2, flyHeight: 1.6 },
};

// ---- Critters ---------------------------------------------------------------------------------------------------

export type CritterMode = 'idle' | 'wander' | 'flee' | 'chase' | 'down' | 'script';
/** What hit a critter: a bullet, a vehicle, an explosion or a gnome on foot (a cow tip). */
export type HitCause = 'shot' | 'vehicle' | 'blast' | 'foot';

export interface Critter {
  readonly id: number;
  readonly kind: CritterKind;
  readonly spec: CritterSpec;
  readonly region: RegionId;
  /** SpawnGroup id ('' when spawned loose). */
  readonly group: string;
  x: number; y: number; z: number;
  yaw: number;
  /** Current ground speed, units/s (drives the leg animation). */
  speed: number;
  /** Where it wanders around, and how far from there it may go. */
  homeX: number; homeZ: number; leash: number;
  mode: CritterMode;
  /** Seconds left in the current mode (idle, flee, chase, down). 'script' ignores it. */
  modeT: number;
  /** Wander goal. */
  goalX: number; goalZ: number;
  /** What it is fleeing from (or what knocked it over). */
  fromX: number; fromZ: number;
  /** Flee along this direction instead of straight away from (fromX, fromZ): herding. Cleared when the flee ends. */
  fleeDir: { x: number; z: number } | null;
  /** 0 standing .. 1 lying on its side. */
  tip: number;
  /** Built on first approach (meshRadius). Null while it has never been near the player. */
  object: THREE.Group | null;
  /** Animation phase (legs, wings). */
  phase: number;
  /** Scratch space for region behaviours. */
  data: Record<string, unknown>;
}

/** A herd, flock, gang or swarm placed once at start. (x, z) is nudged to the nearest open spot in `region`. */
export interface SpawnGroup {
  id: string;
  kind: CritterKind;
  region: RegionId;
  x: number;
  z: number;
  count: number;
  /** Members start within this radius of the centre. */
  spread: number;
  /** Members wander up to this far from the centre. */
  leash: number;
}

/** What the runtime and the region behaviours see each frame. */
export interface CritterCtx {
  dt: number;
  /** Seconds since start. */
  time: number;
  playerX: number; playerY: number; playerZ: number;
  /** The vehicle the player is in, or null on foot. */
  playerVehicle: Vehicle | null;
  /** Player's speed on foot, units/s (0 in a vehicle). */
  playerSpeed: number;
  vehicles: readonly Vehicle[];
  world: World;
  /** 0 day .. 1 night (atmosphere.nightFactor()). */
  night: number;
}

/** Ids passed to CritterDeps.event. app.ts sends each to Turfton FM (only if radio/content.ts has a bulletin for it). */
export type CritterEvent =
  | 'cow-tipped'
  | 'herd-herded'
  | 'drey-raid'
  | 'drey-mower-stolen'
  | 'drey-scattered'
  | 'snowman-smashed'
  | 'bear-shrug'
  | 'hive-knocked'
  | 'swarm-escaped';

/** The game services a region behaviour may use. app.ts provides them. */
export interface CritterDeps {
  fx: Fx;
  play(sfx: Sfx): void;
  toast(text: string): void;
  /** A big centred callout (stunts): title and an optional subtitle. */
  callout(title: string, sub?: string): void;
  /** Give the player Acorns. */
  earn(amount: number, reason: string): void;
  /** Take up to `amount` Acorns from the player's pocket. Returns how many were taken (0 when the pocket is empty). */
  steal(amount: number, reason: string): number;
  /** Chip the player's clay: `amount` of full health (0..1). Ignored while the player is in a vehicle. */
  hurtPlayer(amount: number): void;
  /** A world happening (radio bulletins now, achievements in Epic 8). */
  event(id: CritterEvent): void;
}

/** One region's animals and their behaviour (src/critters/*.ts). Every hook is optional. */
export interface RegionLife {
  id: string;
  groups: readonly SpawnGroup[];
  /** Once, after the groups spawn: build static things (snowmen, grass, hives, villages, deck chairs). */
  init?(rt: CritterRuntime): void;
  /** Every frame, after the runtime has moved the critters. */
  update?(rt: CritterRuntime, ctx: CritterCtx): void;
  /** A critter of this life's groups (or any critter, if the life wants) was hit. Return true when handled: the runtime then skips its default knock-over. */
  onHit?(rt: CritterRuntime, c: Critter, cause: HitCause, fromX: number, fromZ: number): boolean;
  /** A bullet at (x, y, z) against this life's own things (snowmen, hives, sgnowmes). Return true when it hit one. */
  hitTest?(rt: CritterRuntime, x: number, y: number, z: number): boolean;
}

export interface CritterRuntime {
  readonly list: readonly Critter[];
  readonly scene: THREE.Scene;
  readonly world: World;
  readonly deps: CritterDeps;
  /** The latest frame's context (null before the first update). */
  readonly ctx: CritterCtx | null;
  /** Add a critter at (x, z). Region defaults to regionAt(x, z); leash to 30 around (x, z). Lives may spawn their own in init
   * (give them a `group` id of your own: knock() then asks every life's onHit, so check c.group or c.kind there). */
  spawn(kind: CritterKind, x: number, z: number, opts?: { region?: RegionId; group?: string; leash?: number; yaw?: number; mode?: CritterMode }): Critter;
  remove(c: Critter): void;
  inGroup(group: string): Critter[];
  /** Run away from (fromX, fromZ) for `seconds` (default CRITTERS.fleeSeconds). No effect on calm or down critters. */
  scare(c: Critter, fromX: number, fromZ: number, seconds?: number): void;
  /** Run at the player for `seconds`. The behaviour applies any harm itself. */
  chase(c: Critter, seconds: number): void;
  /** The knocked-over reaction: asks the owning RegionLife.onHit first, else falls on its side in a puff, gets up, flees. */
  knock(c: Critter, fromX: number, fromZ: number, cause: HitCause): void;
  /** Knock every critter within `radius` of (x, z). Returns the count. */
  knockArea(x: number, z: number, radius: number, cause: HitCause): number;
  /** A bullet at (x, y, z): knocks the critter it is inside, else asks each RegionLife.hitTest. True when something was hit. */
  hitTest(x: number, y: number, z: number): boolean;
  /** One step towards (x, z) at `speed` (turning at spec.turn), on the ground, pushed out of boxes, kept out of water. Returns the distance left. */
  moveToward(c: Critter, x: number, z: number, speed: number, dt: number): number;
  /** Nearest critter of `kind` within maxD of (x, z), or null. */
  nearest(kind: CritterKind, x: number, z: number, maxD: number): Critter | null;
  update(ctx: CritterCtx): void;
}

// ---- Shared helpers ---------------------------------------------------------------------------------------------

let hidden = false;
/** Tallgrass Commons sets this each frame: true while the player is on foot inside unmown giant grass. police.ts reads it. */
export function setPlayerHidden(h: boolean): void { hidden = h; }
/** True while the Hat Watch cannot see the player (giant grass). */
export function isPlayerHidden(): boolean { return hidden; }

/** A prefab mesh for a critter or a region prop. Missing prefab: a small grey box, so a missing catalog entry never breaks the game. */
export function critterMesh(prefab: string, scale = 1, tint?: number): THREE.Group {
  if (getPrefab(prefab)) return buildPrefab(prefab, { scale, lights: false, ...(tint !== undefined ? { tint } : {}) });
  const g = new THREE.Group();
  g.name = `missing:${prefab}`;
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.6 * scale, 0.6 * scale, 0.6 * scale), new THREE.MeshLambertMaterial({ color: 0x888888 }));
  m.position.y = 0.3 * scale;
  g.add(m);
  return g;
}

function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax, dz = bz - az;
  const l2 = dx * dx + dz * dz;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)) : 0;
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

/** Distance from (x, z) to the nearest highway centre line. */
export function roadDistance(x: number, z: number): number {
  let best = Infinity;
  for (const h of HIGHWAYS) {
    for (let i = 0; i + 1 < h.points.length; i++) {
      const [ax, az] = h.points[i];
      const [bx, bz] = h.points[i + 1];
      best = Math.min(best, segDist(x, z, ax, az, bx, bz));
    }
  }
  return best;
}

/** True when a circle of radius r at (x, z) is open land in `region`: no box, no water, off the highways, inside the fence. */
export function isOpen(x: number, z: number, r: number, region: RegionId, world: World): boolean {
  const lim = WORLD_HALF - 8;
  if (Math.abs(x) > lim || Math.abs(z) > lim) return false;
  if (regionAt(x, z) !== region || waterAt(x, z)) return false;
  if (roadDistance(x, z) < 8 + r) return false;
  return !pushOutOfBoxes(x, z, r, world.boxes, heightAt(x, z)).hit;
}

/** The open spot nearest (x, z) (searched outwards in rings up to 120 units), or null. Deterministic. */
export function openSpot(x: number, z: number, r: number, region: RegionId, world: World): { x: number; z: number } | null {
  if (isOpen(x, z, r, region, world)) return { x, z };
  for (let ring = 4; ring <= 120; ring += 4) {
    const n = Math.max(8, Math.round(ring * 1.5));
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const px = x + Math.cos(a) * ring, pz = z + Math.sin(a) * ring;
      if (isOpen(px, pz, r, region, world)) return { x: px, z: pz };
    }
  }
  return null;
}

// ---- Runtime ----------------------------------------------------------------------------------------------------

interface Pivots { body?: THREE.Object3D; head?: THREE.Object3D; tail?: THREE.Object3D; legs: THREE.Object3D[]; wings: THREE.Object3D[] }

export function createCritters(scene: THREE.Scene, world: World, deps: CritterDeps, lives: readonly RegionLife[]): CritterRuntime {
  const list: Critter[] = [];
  const owner = new Map<string, RegionLife>();
  const pivots = new WeakMap<Critter, Pivots>();
  let nextId = 1;
  let seed = 1234567;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const rt: CritterRuntime = {
    list,
    scene,
    world,
    deps,
    ctx: null,
    spawn(kind, x, z, opts = {}) {
      const spec = CRITTER_SPECS[kind];
      const c: Critter = {
        id: nextId++, kind, spec, region: opts.region ?? regionAt(x, z), group: opts.group ?? '',
        x, y: heightAt(x, z) + (spec.flyHeight ?? 0), z, yaw: opts.yaw ?? rnd() * Math.PI * 2, speed: 0,
        homeX: x, homeZ: z, leash: opts.leash ?? 30,
        mode: opts.mode ?? 'idle', modeT: 1 + rnd() * 4, goalX: x, goalZ: z, fromX: x, fromZ: z, fleeDir: null,
        tip: 0, object: null, phase: rnd() * 10, data: {},
      };
      list.push(c);
      return c;
    },
    remove(c) {
      const i = list.indexOf(c);
      if (i >= 0) list.splice(i, 1);
      if (c.object) scene.remove(c.object);
    },
    inGroup(group) { return list.filter((c) => c.group === group); },
    scare(c, fromX, fromZ, seconds = CFG.fleeSeconds) {
      if (c.spec.calm || c.mode === 'down' || c.mode === 'script') return;
      c.mode = 'flee';
      c.modeT = seconds;
      c.fromX = fromX;
      c.fromZ = fromZ;
    },
    chase(c, seconds) {
      if (c.spec.calm || c.mode === 'down') return;
      c.mode = 'chase';
      c.modeT = seconds;
    },
    knock(c, fromX, fromZ, cause) {
      // The life that spawned its group decides first; a critter spawned outside any SpawnGroup asks every life.
      const life = owner.get(c.group);
      if (life) {
        if (life.onHit?.(rt, c, cause, fromX, fromZ)) return;
      } else {
        for (const l of lives) if (l.onHit?.(rt, c, cause, fromX, fromZ)) return;
      }
      if (c.spec.calm) return;
      deps.fx.smash?.(c.x, c.y + c.spec.height * 0.5, c.z, c.spec.puff);
      if (c.mode !== 'down') deps.play('bump');
      c.mode = 'down';
      c.modeT = c.spec.downTime;
      c.fromX = fromX;
      c.fromZ = fromZ;
      c.speed = 0;
    },
    knockArea(x, z, radius, cause) {
      let n = 0;
      for (const c of [...list]) {
        if (Math.hypot(c.x - x, c.z - z) <= radius) { rt.knock(c, x, z, cause); n++; }
      }
      return n;
    },
    hitTest(x, y, z) {
      for (const c of list) {
        const r = c.spec.radius;
        if (Math.abs(x - c.x) > r || Math.abs(z - c.z) > r) continue;
        if (y < c.y - 0.2 || y > c.y + c.spec.height + 0.1) continue;
        if (Math.hypot(x - c.x, z - c.z) > r) continue;
        const px = rt.ctx?.playerX ?? x, pz = rt.ctx?.playerZ ?? z;
        rt.knock(c, px, pz, 'shot');
        return true;
      }
      for (const l of lives) if (l.hitTest?.(rt, x, y, z)) return true;
      return false;
    },
    moveToward(c, x, z, speed, dt) {
      const dx = x - c.x, dz = z - c.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.05 || speed <= 0) { c.speed = 0; return d; }
      const want = Math.atan2(dx, dz);
      const turn = angleDiff(want, c.yaw);
      const maxTurn = c.spec.turn * dt;
      c.yaw += Math.max(-maxTurn, Math.min(maxTurn, turn));
      // Slow down while facing well away from the goal, so a critter turns before it runs.
      const v = speed * Math.max(0.25, Math.cos(Math.min(Math.PI / 2, Math.abs(turn))));
      const step = Math.min(d, v * dt);
      let nx = c.x + Math.sin(c.yaw) * step;
      let nz = c.z + Math.cos(c.yaw) * step;
      if (!c.spec.flyHeight) {
        if (waterAt(nx, nz)) { c.speed = 0; return d; }
        const p = pushOutOfBoxes(nx, nz, c.spec.radius, world.boxes, c.y);
        nx = p.x;
        nz = p.z;
      }
      const lim = WORLD_HALF - 6;
      nx = Math.max(-lim, Math.min(lim, nx));
      nz = Math.max(-lim, Math.min(lim, nz));
      c.speed = Math.hypot(nx - c.x, nz - c.z) / Math.max(dt, 1e-6);
      c.x = nx;
      c.z = nz;
      return Math.hypot(x - c.x, z - c.z);
    },
    nearest(kind, x, z, maxD) {
      let best: Critter | null = null;
      let bd = maxD;
      for (const c of list) {
        if (c.kind !== kind) continue;
        const d = Math.hypot(c.x - x, c.z - z);
        if (d <= bd) { bd = d; best = c; }
      }
      return best;
    },
    update(ctx) {
      (rt as { ctx: CritterCtx | null }).ctx = ctx;
      for (const c of [...list]) step(c, ctx);
      for (const l of lives) l.update?.(rt, ctx);
      for (const c of list) draw(c, ctx);
    },
  };

  /** A wander goal inside the leash, in the critter's region, out of water. */
  function pickGoal(c: Critter): void {
    for (let t = 0; t < 8; t++) {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * c.leash;
      const gx = c.homeX + Math.cos(a) * r, gz = c.homeZ + Math.sin(a) * r;
      if (regionAt(gx, gz) !== c.region || (!c.spec.flyHeight && waterAt(gx, gz))) continue;
      c.goalX = gx;
      c.goalZ = gz;
      return;
    }
    c.goalX = c.homeX;
    c.goalZ = c.homeZ;
  }

  function step(c: Critter, ctx: CritterCtx): void {
    const { dt } = ctx;
    const dP = Math.hypot(c.x - ctx.playerX, c.z - ctx.playerZ);
    if (dP > CFG.simRadius) { c.speed = 0; return; }

    // Vehicles: a fast one knocks it over, a moving one nearby frightens it.
    if (c.mode !== 'down') {
      for (const v of ctx.vehicles) {
        if (v.exploded) continue;
        const d = Math.hypot(c.x - v.x, c.z - v.z);
        const sp = Math.abs(v.speed);
        if (v.spec.flies && v.y - heightAt(v.x, v.z) > 2) continue;
        if (d < c.spec.radius + v.spec.radius && sp >= CFG.knockSpeed) {
          if (!c.spec.calm) {
            const ux = d > 0.01 ? (c.x - v.x) / d : 1, uz = d > 0.01 ? (c.z - v.z) / d : 0;
            c.x += ux * 0.8;
            c.z += uz * 0.8;
          }
          rt.knock(c, v.x, v.z, 'vehicle');
          break;
        }
        if (c.spec.scareVehicle > 0 && d < c.spec.scareVehicle && sp >= CFG.scareSpeed && c.mode !== 'flee' && c.mode !== 'chase') {
          rt.scare(c, v.x, v.z);
        }
      }
    }
    if (!ctx.playerVehicle && c.spec.scareFoot > 0 && dP < c.spec.scareFoot && (c.mode === 'idle' || c.mode === 'wander')) {
      rt.scare(c, ctx.playerX, ctx.playerZ);
    }

    const tipRate = dt / CFG.tipSeconds;
    switch (c.mode) {
      case 'idle':
        c.speed = 0;
        c.modeT -= dt;
        if (c.modeT <= 0 && !c.spec.calm) { pickGoal(c); c.mode = 'wander'; }
        break;
      case 'wander': {
        const left = rt.moveToward(c, c.goalX, c.goalZ, c.spec.walk, dt);
        if (left < 0.6 || c.speed < 0.01) { c.mode = 'idle'; c.modeT = 2 + rnd() * 5; }
        break;
      }
      case 'flee': {
        c.modeT -= dt;
        let ux = c.x - c.fromX, uz = c.z - c.fromZ;
        if (c.fleeDir) { ux = c.fleeDir.x; uz = c.fleeDir.z; }
        const l = Math.hypot(ux, uz) || 1;
        // Lean back towards home when far outside the leash.
        const hx = c.homeX - c.x, hz = c.homeZ - c.z;
        const hd = Math.hypot(hx, hz);
        const pull = hd > c.leash * 2 ? 0.8 : 0;
        const gx = c.x + (ux / l) * 6 + (hd > 0 ? (hx / hd) * 6 * pull : 0);
        const gz = c.z + (uz / l) * 6 + (hd > 0 ? (hz / hd) * 6 * pull : 0);
        rt.moveToward(c, gx, gz, c.spec.run, dt);
        if (c.modeT <= 0) { c.mode = 'idle'; c.modeT = 1 + rnd() * 2; c.fleeDir = null; }
        break;
      }
      case 'chase':
        c.modeT -= dt;
        rt.moveToward(c, ctx.playerX, ctx.playerZ, c.spec.run, dt);
        if (c.modeT <= 0) { c.mode = 'idle'; c.modeT = 1; }
        break;
      case 'down':
        c.speed = 0;
        c.tip = Math.min(1, c.tip + tipRate);
        c.modeT -= dt;
        if (c.modeT <= 0) {
          c.tip = Math.max(0, c.tip - 2 * tipRate);
          if (c.tip <= 0) {
            c.mode = 'idle';
            rt.scare(c, c.fromX, c.fromZ);
          }
        }
        break;
      case 'script':
        break;
    }
    if (c.mode !== 'down' && c.tip > 0) c.tip = Math.max(0, c.tip - tipRate);
    if (c.mode !== 'script') c.y = heightAt(c.x, c.z) + (c.spec.flyHeight ?? 0);
  }

  function pivotsOf(o: THREE.Group): Pivots {
    const legs: THREE.Object3D[] = [];
    const wings: THREE.Object3D[] = [];
    for (let k = 0; k < 4; k++) { const l = o.getObjectByName(`leg-${k}`); if (l) legs.push(l); }
    for (let k = 0; k < 2; k++) { const w = o.getObjectByName(`wing-${k}`); if (w) wings.push(w); }
    return { body: o.getObjectByName('body'), head: o.getObjectByName('head'), tail: o.getObjectByName('tail'), legs, wings };
  }

  function draw(c: Critter, ctx: CritterCtx): void {
    const d = Math.hypot(c.x - ctx.playerX, c.z - ctx.playerZ);
    if (d > CFG.meshRadius) {
      if (c.object) c.object.visible = false;
      return;
    }
    if (!c.object) {
      c.object = critterMesh(c.spec.prefab, c.spec.scale);
      c.object.rotation.order = 'YXZ';
      scene.add(c.object);
      pivots.set(c, pivotsOf(c.object));
    }
    const o = c.object;
    o.visible = true;
    const fall = c.tip * Math.PI / 2;
    o.position.set(c.x, c.y + c.tip * c.spec.radius * 0.35, c.z);
    o.rotation.set(0, c.yaw, fall);
    if (d > CFG.animRadius) return;
    const p = pivots.get(c);
    if (!p) return;
    const moving = Math.min(1, c.speed / Math.max(0.5, c.spec.walk));
    c.phase += ctx.dt * (4 + c.speed * 2.2);
    const swing = Math.sin(c.phase) * 0.55 * moving;
    // Diagonal gait: legs 0 and 3 together, 1 and 2 opposite (two-legged critters: 0 and 1 opposite).
    p.legs.forEach((l, k) => { l.rotation.x = (p.legs.length === 2 ? (k === 0 ? 1 : -1) : (k === 0 || k === 3 ? 1 : -1)) * swing; });
    if (p.tail) p.tail.rotation.y = Math.sin(c.phase * 0.7 + 1) * (0.15 + 0.3 * moving);
    if (p.head) p.head.rotation.x = c.mode === 'idle' ? Math.max(0, Math.sin(ctx.time * 0.8 + c.phase)) * 0.35 : 0;
    if (p.body) {
      // Bob around the pivot's own height (prefab pivots sit at the torso, not at 0).
      const base = (p.body.userData.baseY as number | undefined) ?? (p.body.userData.baseY = p.body.position.y);
      p.body.position.y = base + Math.abs(Math.sin(c.phase)) * 0.04 * moving;
    }
    const flap = c.spec.flyHeight ? Math.sin(ctx.time * 60 + c.phase) * 0.7 : c.mode === 'flee' ? Math.sin(c.phase * 3) * 0.6 : 0;
    p.wings.forEach((w, k) => { w.rotation.z = (k === 0 ? 1 : -1) * flap; });
    if (c.spec.flyHeight) o.position.y += Math.sin(ctx.time * 3 + c.phase) * 0.15;
  }

  // Spawn every group once, at the open spot nearest its centre.
  for (const life of lives) {
    for (const g of life.groups) {
      owner.set(g.id, life);
      const centre = openSpot(g.x, g.z, 2, g.region, world) ?? { x: g.x, z: g.z };
      for (let i = 0; i < g.count; i++) {
        const a = rnd() * Math.PI * 2;
        const r = Math.sqrt(rnd()) * g.spread;
        let x = centre.x + Math.cos(a) * r, z = centre.z + Math.sin(a) * r;
        if (!CRITTER_SPECS[g.kind].flyHeight && !isOpen(x, z, CRITTER_SPECS[g.kind].radius, g.region, world)) { x = centre.x; z = centre.z; }
        const c = rt.spawn(g.kind, x, z, { region: g.region, group: g.id, leash: g.leash });
        c.homeX = centre.x;
        c.homeZ = centre.z;
      }
    }
  }
  for (const life of lives) life.init?.(rt);
  return rt;
}
