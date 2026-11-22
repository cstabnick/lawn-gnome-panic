// Tallgrass Commons (giant grass, bees, hives): issue 6F.
// Giant grass hides the player on foot from the Hat Watch and slows a mower that drives through it (the mower mows a
// path, which grows back). Four hives sit in flower rings; knocking one sends a swarm after the player.
import * as THREE from 'three';
import { buildPrefabInstances, getPrefab } from '@lawn/prefabs';
import { critterMesh, roadDistance, setPlayerHidden } from '../critters';
import type { Critter, CritterCtx, CritterEvent, CritterRuntime, RegionLife, SpawnGroup } from '../critters';
import { regionAt } from '../levels';
import { heightAt, waterAt } from '../terrain';

const REGION = 'tallgrass-commons' as const;
/** Tuft grid spacing (tufts are jittered within 0.7 of their grid point). */
const CELL = 2.2;
const REGROW_S = 45;
const MOW_PER_FRAME = 200;
const HIDE_TOAST_GAP_S = 30;
const EVENT_GAP_S = 60;
const HIVE_COOLDOWN_S = 60;
const SWARM_S = 40;
const SWARM_END_DIST = 140;
const SWARM_REACH = 1.4;
const SWARM_DPS = 0.02;
const FLOWER_TINTS = [0xf26b8a, 0xf2c230, 0xffffff, 0xb57edc];

export const GRASS_PATCHES = [
  { id: 'west', x: -800, z: 480, r: 55 },
  { id: 'south', x: -470, z: 760, r: 65 },
  { id: 'corner', x: -760, z: 800, r: 55 },
  { id: 'middle', x: -620, z: 660, r: 35 },
];

export const HIVES = [
  { id: 'hive-west', x: -735, z: 470 },
  { id: 'hive-south', x: -395, z: 760 },
  { id: 'hive-corner', x: -690, z: 810 },
  { id: 'hive-middle', x: -575, z: 640 },
];

// ---- Grass data (filled by buildPatches / init) ------------------------------------------------------------------

interface Tuft { x: number; y: number; z: number; yaw: number; s: number }

interface Patch {
  id: string;
  x: number; z: number; r: number;
  tufts: Tuft[];
  /** Time each tuft was mown, or -1 while it stands. */
  cutAt: Float32Array;
  /** "i,j" cell -> tuft indices. */
  cells: Map<string, number[]>;
  /** One InstancedMesh per prefab part (null when the giant-grass-blade prefab is missing). */
  group: THREE.Group | null;
  /** Per group child: the prefab part's own transform, so a tuft matrix can be re-applied to each part. */
  parts: THREE.Matrix4[];
}

let patches: Patch[] = [];
/** Round-robin list of every tuft, for regrowth. */
let regrowRefs: Array<[Patch, number]> = [];
let regrowCursor = 0;

// ---- Hive state (filled by init) ----------------------------------------------------------------------------------

type HiveDef = (typeof HIVES)[number];

interface Hive {
  def: HiveDef;
  cx: number; cz: number;
  mesh: THREE.Group | null;
  swarming: boolean;
  swarmStart: number;
  blockedUntil: number;
  members: Critter[];
  extras: Critter[];
}

let hives: Hive[] = [];
let wasHidden = false;
let lastHideToast = -Infinity;
let eventAt: Partial<Record<CritterEvent, number>> = {};

const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _sc = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4();

function composeTuft(t: Tuft, full: boolean, out: THREE.Matrix4): THREE.Matrix4 {
  _q.setFromAxisAngle(_up, t.yaw);
  _p.set(t.x, t.y, t.z);
  _sc.set(t.s, full ? t.s : 0.06, t.s);
  return out.compose(_p, _q, _sc);
}

function cellKey(ci: number, cj: number): string { return `${ci},${cj}`; }

/** Tuft indices within R of (x, z), from the cell lookup. */
function tuftsNear(p: Patch, x: number, z: number, R: number): number[] {
  const out: number[] = [];
  for (let ci = Math.floor((x - R) / CELL); ci <= Math.floor((x + R) / CELL); ci++) {
    for (let cj = Math.floor((z - R) / CELL); cj <= Math.floor((z + R) / CELL); cj++) {
      const list = p.cells.get(cellKey(ci, cj));
      if (!list) continue;
      for (const i of list) {
        const t = p.tufts[i];
        if (Math.hypot(t.x - x, t.z - z) <= R) out.push(i);
      }
    }
  }
  return out;
}

/** Writes one tuft's matrix into every part's InstancedMesh (stubble when not full). */
function writeTuft(p: Patch, i: number, full: boolean): void {
  if (!p.group) return;
  composeTuft(p.tufts[i], full, _m);
  const m2 = new THREE.Matrix4();
  p.group.children.forEach((ch, k) => {
    const im = ch as THREE.InstancedMesh;
    im.setMatrixAt(i, m2.multiplyMatrices(_m, p.parts[k]));
    im.instanceMatrix.needsUpdate = true;
  });
}

function buildPatch(def: (typeof GRASS_PATCHES)[number], salt: number): Patch {
  let seed = (7919 * salt) & 0x7fffffff;
  const rnd = (): number => {
    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const tufts: Tuft[] = [];
  const cells = new Map<string, number[]>();
  for (let gx = def.x - def.r; gx <= def.x + def.r; gx += CELL) {
    for (let gz = def.z - def.r; gz <= def.z + def.r; gz += CELL) {
      const x = gx + (rnd() * 2 - 1) * 0.7;
      const z = gz + (rnd() * 2 - 1) * 0.7;
      const yaw = rnd() * Math.PI * 2;
      const s = 2 + rnd();
      if (Math.hypot(x - def.x, z - def.z) > def.r) continue;
      if (regionAt(x, z) !== REGION || roadDistance(x, z) <= 7) continue;
      const i = tufts.length;
      tufts.push({ x, y: heightAt(x, z), z, yaw, s });
      const key = cellKey(Math.floor(x / CELL), Math.floor(z / CELL));
      let list = cells.get(key);
      if (!list) cells.set(key, (list = []));
      list.push(i);
    }
  }
  return {
    id: def.id, x: def.x, z: def.z, r: def.r, tufts,
    cutAt: new Float32Array(tufts.length).fill(-1), cells, group: null, parts: [],
  };
}

/** Fills the grass patch data (no meshes). init calls it; tests call it directly. */
export function buildPatches(): void {
  patches = GRASS_PATCHES.map((def, k) => buildPatch(def, k + 1));
  regrowRefs = [];
  for (const p of patches) for (let i = 0; i < p.tufts.length; i++) regrowRefs.push([p, i]);
  regrowCursor = 0;
}

/** True when an unmown tuft (or one grown back by `time`) is within 1.6 of (x, z). */
export function tallGrassAt(x: number, z: number, time: number): boolean {
  for (const p of patches) {
    if (Math.hypot(x - p.x, z - p.z) > p.r + 2) continue;
    for (const i of tuftsNear(p, x, z, 1.6)) {
      const c = p.cutAt[i];
      if (c < 0 || time - c > REGROW_S) return true;
    }
  }
  return false;
}

/** True when (x, z) is inside any grass patch circle. */
export function inPatch(x: number, z: number): boolean {
  return patches.some((p) => Math.hypot(x - p.x, z - p.z) <= p.r);
}

function mowNear(p: Patch, x: number, z: number, R: number, time: number): boolean {
  let touched = false;
  for (const i of tuftsNear(p, x, z, R)) {
    if (p.cutAt[i] >= 0) continue;
    p.cutAt[i] = time;
    writeTuft(p, i, false);
    touched = true;
  }
  return touched;
}

function buildGroup(rt: CritterRuntime, p: Patch): void {
  if (p.tufts.length === 0) return;
  const matrices = p.tufts.map((t) => composeTuft(t, true, new THREE.Matrix4()));
  const g = buildPrefabInstances('giant-grass-blade', matrices);
  g.name = `tallgrass:${p.id}`;
  rt.scene.add(g);
  const inv = new THREE.Matrix4().copy(matrices[0]).invert();
  p.parts = g.children.map((ch) => {
    const base = new THREE.Matrix4();
    (ch as THREE.InstancedMesh).getMatrixAt(0, base);
    return new THREE.Matrix4().multiplyMatrices(inv, base);
  });
  p.group = g;
}

function buildHive(rt: CritterRuntime, def: HiveDef): Hive {
  const first = rt.inGroup(def.id)[0];
  const cx = first ? first.homeX : def.x;
  const cz = first ? first.homeZ : def.z;
  const mesh = critterMesh('bee-hive', 1.3);
  mesh.position.set(cx, heightAt(cx, cz), cz);
  rt.scene.add(mesh);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    const x = cx + Math.cos(a) * 7;
    const z = cz + Math.sin(a) * 7;
    const flower = critterMesh('giant-flower', 3, FLOWER_TINTS[k % FLOWER_TINTS.length]);
    flower.position.set(x, heightAt(x, z), z);
    rt.scene.add(flower);
  }
  return { def, cx, cz, mesh, swarming: false, swarmStart: 0, blockedUntil: -Infinity, members: [], extras: [] };
}

function emit(rt: CritterRuntime, id: CritterEvent, time: number): void {
  const last = eventAt[id];
  if (last !== undefined && time - last < EVENT_GAP_S) return;
  eventAt[id] = time;
  rt.deps.event(id);
}

function canKnock(h: Hive, time: number): boolean {
  return !h.swarming && time >= h.blockedUntil;
}

function knockHive(rt: CritterRuntime, h: Hive, time: number): void {
  h.swarming = true;
  h.swarmStart = time;
  h.members = rt.inGroup(h.def.id);
  h.extras = [];
  for (let k = 0; k < 6; k++) {
    const e = rt.spawn('bee', h.cx, h.cz, { region: REGION, group: h.def.id, leash: 10 });
    h.extras.push(e);
    h.members.push(e);
  }
  for (const c of h.members) rt.chase(c, 40);
  rt.deps.toast('You knocked a hive! RUN!');
  rt.deps.play('bump');
  emit(rt, 'hive-knocked', time);
}

function endSwarm(rt: CritterRuntime, h: Hive, time: number): void {
  h.swarming = false;
  h.blockedUntil = time + HIVE_COOLDOWN_S;
  for (const c of h.members) {
    if (c.mode === 'down') continue;
    c.mode = 'idle';
    c.modeT = 1;
  }
  for (const e of h.extras) rt.remove(e);
  h.extras = [];
  h.members = [];
  rt.deps.toast('You lost the swarm.');
  emit(rt, 'swarm-escaped', time);
}

export const commonsLife: RegionLife = {
  id: REGION,
  groups: HIVES.map((h): SpawnGroup => ({
    id: h.id, kind: 'bee', region: REGION, x: h.x, z: h.z, count: 5, spread: 4, leash: 10,
  })),

  init(rt) {
    buildPatches();
    wasHidden = false;
    lastHideToast = -Infinity;
    eventAt = {};
    if (getPrefab('giant-grass-blade')) for (const p of patches) buildGroup(rt, p);
    hives = HIVES.map((def) => buildHive(rt, def));
  },

  update(rt, ctx: CritterCtx) {
    const { time, dt } = ctx;

    // Hiding: on foot inside unmown grass the Hat Watch cannot see the player.
    const hide = !ctx.playerVehicle && tallGrassAt(ctx.playerX, ctx.playerZ, time);
    setPlayerHidden(hide);
    if (hide && !wasHidden && time - lastHideToast >= HIDE_TOAST_GAP_S) {
      lastHideToast = time;
      rt.deps.toast('Hidden in the tall grass. The Hat Watch cannot see you.');
    }
    wasHidden = hide;

    for (const p of patches) {
      if (p.group) p.group.visible = Math.hypot(ctx.playerX - p.x, ctx.playerZ - p.z) <= p.r + 260;
    }

    // Mowing and slowing: a vehicle on the ground (or low) mows the grass it touches and slows in it.
    for (const v of ctx.vehicles) {
      if (v.spec.flies && v.y - heightAt(v.x, v.z) >= 2) continue;
      const R = v.spec.radius + 0.5;
      let touched = false;
      for (const p of patches) {
        if (Math.hypot(v.x - p.x, v.z - p.z) > p.r + R) continue;
        if (mowNear(p, v.x, v.z, R, time)) touched = true;
      }
      if (touched && Math.abs(v.speed) > 6) {
        v.speed -= Math.sign(v.speed) * Math.min(Math.abs(v.speed) - 6, 20 * dt);
      }
    }

    // Regrowth: a bounded round-robin over every tuft.
    const n = regrowRefs.length;
    if (n > 0) {
      const checks = Math.min(MOW_PER_FRAME, n);
      for (let k = 0; k < checks; k++) {
        const [p, i] = regrowRefs[(regrowCursor + k) % n];
        if (p.cutAt[i] >= 0 && time - p.cutAt[i] > REGROW_S) {
          p.cutAt[i] = -1;
          writeTuft(p, i, true);
        }
      }
      regrowCursor = (regrowCursor + MOW_PER_FRAME) % n;
    }

    // Hives knocked by a vehicle going faster than 3 units/s.
    for (const v of ctx.vehicles) {
      if (Math.abs(v.speed) <= 3) continue;
      if (v.spec.flies && v.y - heightAt(v.x, v.z) >= 2) continue;
      for (const h of hives) {
        if (!canKnock(h, time)) continue;
        if (Math.hypot(v.x - h.cx, v.z - h.cz) <= v.spec.radius + 1) knockHive(rt, h, time);
      }
    }

    // Swarms: bees keep chasing, sting the player on foot, and end when the player escapes.
    const px = ctx.playerX, pz = ctx.playerZ;
    let hurt = 0;
    for (const h of hives) {
      if (!h.swarming) continue;
      const over = waterAt(px, pz) !== null || Math.hypot(px - h.cx, pz - h.cz) > SWARM_END_DIST || time - h.swarmStart >= SWARM_S;
      if (over) {
        endSwarm(rt, h, time);
        continue;
      }
      for (const c of h.members) {
        if (c.mode === 'down') continue;
        if (c.mode !== 'chase') rt.chase(c, 1);
        if (Math.hypot(c.x - px, c.z - pz) <= SWARM_REACH) hurt += SWARM_DPS * dt;
      }
    }
    if (hurt > 0) rt.deps.hurtPlayer(hurt);

    // Hives lean while angry and until they stand up again.
    for (const h of hives) {
      if (h.mesh) h.mesh.rotation.z = h.swarming || time < h.blockedUntil ? 0.5 : 0;
    }
  },

  // Shot bees are knocked over by the runtime as usual.
  onHit: () => false,

  hitTest(rt, x, y, z) {
    const time = rt.ctx?.time ?? 0;
    for (const h of hives) {
      if (!canKnock(h, time)) continue;
      if (Math.hypot(x - h.cx, z - h.cz) > 1.2) continue;
      if (y >= heightAt(h.cx, h.cz) + 1.6) continue;
      knockHive(rt, h, time);
      return true;
    }
    return false;
  },
};
