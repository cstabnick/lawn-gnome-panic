// The Drey Gang, Cloverfield's evil squirrels: issue 6D.
// Three dens. On foot near a den they raid: pickers pinch the player's Acorns, throwers pelt the player with acorns
// from 10 to 16 units off. Now and then two squirrels mob a parked mower and drive it to the next den. Shooting one
// scatters its den; they regroup. Nothing dies (R-021): shot squirrels are knocked over and run off.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { angleDiff } from '../collide';
import type { Critter, CritterCtx, CritterRuntime, HitCause, RegionLife, SpawnGroup } from '../critters';
import { heightAt } from '../terrain';
import type { Vehicle, VehicleKind } from '../types';
import { seatWorld } from '../vehicles';

export const DREY_DENS: readonly { id: string; x: number; z: number; silo: boolean }[] = [
  { id: 'drey-hedge-west', x: -260, z: 520, silo: false },
  { id: 'drey-hedge-east', x: 260, z: 640, silo: false },
  { id: 'drey-silo', x: 420, z: 820, silo: true },
];

const RAID_RANGE = 45;
const RAID_END = 60;
const RAID_TOAST_GAP = 90;
const RAID_EVENT_GAP = 60;
const STEAL_GAP = 6;
const PICK_RANGE = 1.2;
const THROW_GAP = 1.6;
const ACORN_POOL = 12;
const ACORN_SPEED = 14;
const ACORN_ARC = 2.5;
const THEFT_RANGE = 150;
const THEFT_DEN_RANGE = 60;
const THEFT_PLAYER_CLEAR = 8;
const THEFT_RUN_LIMIT = 12;
const RIDE_LIMIT = 30;
const RIDE_SPEED = 9;
const RIDE_TURN = 1.5;
const RIDE_DONE = 12;
const RIDER_GAP = 0.4;
const STEAL_KINDS: readonly VehicleKind[] = ['ride-on', 'push-bike', 'zero-turn', 'lowrider', 'mulch-spreader'];

const groups: SpawnGroup[] = DREY_DENS.map((d): SpawnGroup => ({
  id: d.id, kind: 'squirrel', region: 'cloverfield-farms', x: d.x, z: d.z, count: d.silo ? 8 : 6, spread: 4, leash: 14,
}));

interface DenState {
  raided: boolean;
  toastAt: number;
  stealAt: number;
  roleT: number;
  scattered: boolean;
}

interface Acorn {
  mesh: THREE.Group;
  active: boolean;
  x0: number; y0: number; z0: number;
  x1: number; y1: number; z1: number;
  dur: number; t: number;
}

interface Theft {
  v: Vehicle;
  runners: Critter[];
  fromIdx: number;
  targetIdx: number;
  boarded: boolean;
  t0: number;
  rideT: number;
}

interface GangState {
  centres: Map<string, { x: number; z: number }>;
  dens: Map<string, DenState>;
  raidEventAt: number;
  acorns: Acorn[];
  nextTheft: number;
  theft: Theft | null;
}

const states = new WeakMap<CritterRuntime, GangState>();

function stateOf(rt: CritterRuntime): GangState {
  let s = states.get(rt);
  if (!s) {
    s = { centres: new Map(), dens: new Map(), raidEventAt: -Infinity, acorns: [], nextTheft: 60 + Math.random() * 60, theft: null };
    states.set(rt, s);
  }
  return s;
}

function denOf(s: GangState, id: string): DenState {
  let d = s.dens.get(id);
  if (!d) {
    d = { raided: false, toastAt: -Infinity, stealAt: -Infinity, roleT: 0, scattered: false };
    s.dens.set(id, d);
  }
  return d;
}

/** Can a mower be stolen from this den by this player position? Pure, for the tests. */
export function canSteal(v: Vehicle, denX: number, denZ: number, px: number, pz: number): boolean {
  if (v.driver !== 'none' || v.questOwned || v.exploded || v.spec.flies) return false;
  if (!STEAL_KINDS.includes(v.kind)) return false;
  if (Math.hypot(v.x - denX, v.z - denZ) > THEFT_DEN_RANGE) return false;
  return Math.hypot(v.x - px, v.z - pz) >= THEFT_PLAYER_CLEAR;
}

function startRaid(rt: CritterRuntime, s: GangState, ds: DenState, t: number): void {
  ds.raided = true;
  ds.scattered = false;
  ds.roleT = 0;
  if (t - ds.toastAt >= RAID_TOAST_GAP) {
    ds.toastAt = t;
    rt.deps.toast('The Drey Gang! Mind your Acorns.');
  }
  if (t - s.raidEventAt >= RAID_EVENT_GAP) {
    s.raidEventAt = t;
    rt.deps.event('drey-raid');
  }
}

function endRaid(rt: CritterRuntime, ds: DenState, denId: string): void {
  ds.raided = false;
  for (const c of rt.inGroup(denId)) {
    if (c.data.role === 'thrower') {
      if (c.mode === 'script') { c.mode = 'idle'; c.modeT = 1; }
      c.data.role = undefined;
    } else if (c.data.role === 'picker') {
      c.data.role = undefined;
    }
  }
}

function takeAcorn(rt: CritterRuntime, s: GangState): Acorn | null {
  let a = s.acorns.find((x) => !x.active) ?? null;
  if (!a && s.acorns.length < ACORN_POOL) {
    const mesh = buildPrefab('acorn', { scale: 2, lights: false });
    mesh.visible = false;
    rt.scene.add(mesh);
    a = { mesh, active: false, x0: 0, y0: 0, z0: 0, x1: 0, y1: 0, z1: 0, dur: 1, t: 0 };
    s.acorns.push(a);
  }
  return a;
}

function throwAcorn(rt: CritterRuntime, s: GangState, c: Critter, px: number, pz: number): void {
  const a = takeAcorn(rt, s);
  if (!a) return;
  a.x0 = c.x; a.y0 = c.y + 0.6; a.z0 = c.z;
  a.x1 = px; a.z1 = pz; a.y1 = heightAt(px, pz);
  a.dur = Math.max(0.2, Math.hypot(px - c.x, pz - c.z) / ACORN_SPEED);
  a.t = 0;
  a.active = true;
  a.mesh.visible = true;
}

function updateAcorns(rt: CritterRuntime, s: GangState, ctx: CritterCtx): void {
  for (const a of s.acorns) {
    if (!a.active) continue;
    a.t = Math.min(1, a.t + ctx.dt / a.dur);
    const k = a.t;
    const x = a.x0 + (a.x1 - a.x0) * k;
    const z = a.z0 + (a.z1 - a.z0) * k;
    const y = a.y0 + (a.y1 - a.y0) * k + ACORN_ARC * 4 * k * (1 - k);
    a.mesh.position.set(x, y, z);
    a.mesh.rotation.x += ctx.dt * 12;
    a.mesh.rotation.y += ctx.dt * 8;
    if (a.t >= 1) {
      a.active = false;
      a.mesh.visible = false;
      if (!ctx.playerVehicle && Math.hypot(ctx.playerX - x, ctx.playerZ - z) <= 0.9) {
        rt.deps.hurtPlayer(0.03);
        rt.deps.play('bump');
      }
      rt.deps.fx.spark(x, y, z);
    }
  }
}

function pickerStep(rt: CritterRuntime, s: GangState, ds: DenState, c: Critter, ctx: CritterCtx): void {
  if (c.mode !== 'chase' || Math.hypot(c.x - ctx.playerX, c.z - ctx.playerZ) > PICK_RANGE) return;
  if (ctx.time - ds.stealAt < STEAL_GAP) return;
  ds.stealAt = ctx.time;
  const n = rt.deps.steal(5, 'Drey Gang');
  if (n > 0) rt.deps.toast(`A Drey squirrel picked your pocket: -${n} Acorns`);
  c.mode = 'idle';
  rt.scare(c, ctx.playerX, ctx.playerZ, 6);
}

function throwerStep(rt: CritterRuntime, s: GangState, c: Critter, ctx: CritterCtx): void {
  const px = ctx.playerX, pz = ctx.playerZ;
  const dx = c.x - px, dz = c.z - pz;
  const d = Math.hypot(dx, dz) || 1;
  if (d < 10 || d > 16) {
    rt.moveToward(c, px + (dx / d) * 13, pz + (dz / d) * 13, c.spec.run * 0.6, ctx.dt);
  }
  c.y = heightAt(c.x, c.z);
  c.yaw = Math.atan2(px - c.x, pz - c.z);
  const left = ((c.data.throwT as number | undefined) ?? 0) - ctx.dt;
  if (left <= 0) {
    throwAcorn(rt, s, c, px, pz);
    c.data.throwT = THROW_GAP;
  } else {
    c.data.throwT = left;
  }
}

function runRaid(rt: CritterRuntime, s: GangState, ds: DenState, denId: string, ctx: CritterCtx): void {
  const members = rt.inGroup(denId);
  ds.roleT -= ctx.dt;
  if (ds.roleT <= 0) {
    ds.roleT = 3;
    members.forEach((c, i) => {
      if (c.data.riding || c.data.role === 'thief') return;
      if (c.mode !== 'idle' && c.mode !== 'wander') return;
      if (i % 2 === 0) {
        c.data.role = 'picker';
        rt.chase(c, 6);
      } else {
        c.data.role = 'thrower';
        c.mode = 'script';
        c.data.throwT = 0;
      }
    });
  }
  for (const c of members) {
    if (c.data.riding || c.mode === 'down') continue;
    if (c.data.role === 'picker') pickerStep(rt, s, ds, c, ctx);
    else if (c.data.role === 'thrower' && c.mode === 'script') throwerStep(rt, s, c, ctx);
  }
}

function denCentre(s: GangState, id: string): { x: number; z: number } | null {
  return s.centres.get(id) ?? null;
}

function releaseRiders(th: Theft): void {
  for (const c of th.runners) {
    c.data.riding = undefined;
    c.data.role = undefined;
    c.mode = 'idle';
    c.modeT = 1;
  }
}

function tryTheft(rt: CritterRuntime, s: GangState, ctx: CritterCtx): void {
  const near = DREY_DENS.map((d, idx) => ({ idx, c: denCentre(s, d.id) }))
    .filter((e): e is { idx: number; c: { x: number; z: number } } => e.c !== null)
    .map((e) => ({ idx: e.idx, c: e.c, dist: Math.hypot(ctx.playerX - e.c.x, ctx.playerZ - e.c.z) }))
    .filter((e) => e.dist <= THEFT_RANGE)
    .sort((a, b) => a.dist - b.dist);
  for (const e of near) {
    const v = ctx.vehicles.find((x) => canSteal(x, e.c.x, e.c.z, ctx.playerX, ctx.playerZ));
    if (!v) continue;
    const runners = rt.inGroup(DREY_DENS[e.idx].id)
      .filter((c) => !c.data.riding && c.mode !== 'down' && c.data.role !== 'thief')
      .sort((a, b) => Math.hypot(a.x - v.x, a.z - v.z) - Math.hypot(b.x - v.x, b.z - v.z))
      .slice(0, 2);
    if (runners.length < 2) continue;
    for (const c of runners) {
      c.mode = 'script';
      c.data.role = 'thief';
    }
    s.theft = { v, runners, fromIdx: e.idx, targetIdx: (e.idx + 1) % DREY_DENS.length, boarded: false, t0: ctx.time, rideT: 0 };
    return;
  }
}

function board(rt: CritterRuntime, th: Theft): void {
  th.boarded = true;
  th.rideT = 0;
  th.v.questOwned = true;
  for (const c of th.runners) c.data.riding = th.v;
  rt.deps.toast('The Drey Gang stole a mower!');
  rt.deps.event('drey-mower-stolen');
}

function rideStep(rt: CritterRuntime, s: GangState, th: Theft, ctx: CritterCtx): void {
  const v = th.v;
  const tgt = DREY_DENS[th.targetIdx];
  const dt = ctx.dt;
  if (ctx.playerVehicle === v) return endRide(rt, s, th, ctx);
  const want = Math.atan2(tgt.x - v.x, tgt.z - v.z);
  const diff = angleDiff(want, v.yaw);
  const maxTurn = RIDE_TURN * dt;
  v.yaw += Math.max(-maxTurn, Math.min(maxTurn, diff));
  v.speed = RIDE_SPEED;
  v.x += Math.sin(v.yaw) * RIDE_SPEED * dt;
  v.z += Math.cos(v.yaw) * RIDE_SPEED * dt;
  v.y = heightAt(v.x, v.z);
  th.rideT += dt;
  const seat = seatWorld(v, new THREE.Vector3(), 0);
  th.runners.forEach((c, i) => {
    const back = i * RIDER_GAP;
    c.x = seat.x - back * Math.sin(v.yaw);
    c.y = seat.y;
    c.z = seat.z - back * Math.cos(v.yaw);
    c.yaw = v.yaw;
    c.speed = RIDE_SPEED;
  });
  if (Math.hypot(v.x - tgt.x, v.z - tgt.z) <= RIDE_DONE || th.rideT >= RIDE_LIMIT) endRide(rt, s, th, ctx);
}

function endRide(rt: CritterRuntime, s: GangState, th: Theft, ctx: CritterCtx): void {
  th.v.speed = 0;
  th.v.questOwned = false;
  for (const c of th.runners) {
    c.data.riding = undefined;
    c.data.role = undefined;
    c.mode = 'idle';
    c.modeT = 1;
    rt.scare(c, ctx.playerX, ctx.playerZ, 4);
  }
  s.theft = null;
}

function updateTheft(rt: CritterRuntime, s: GangState, ctx: CritterCtx): void {
  if (ctx.time >= s.nextTheft) {
    s.nextTheft = ctx.time + 60 + Math.random() * 60;
    if (!s.theft) tryTheft(rt, s, ctx);
  }
  const th = s.theft;
  if (!th) return;
  if (!th.boarded) {
    if (th.v.driver !== 'none' || th.v.exploded || th.v.questOwned) {
      releaseRiders(th);
      s.theft = null;
      return;
    }
    let near = true;
    for (const c of th.runners) {
      const left = rt.moveToward(c, th.v.x, th.v.z, c.spec.run, ctx.dt);
      c.y = heightAt(c.x, c.z);
      if (left > 1.5) near = false;
    }
    if (near || ctx.time - th.t0 >= THEFT_RUN_LIMIT) board(rt, th);
    return;
  }
  rideStep(rt, s, th, ctx);
}

export const dreyGangLife: RegionLife = {
  id: 'drey-gang',
  groups,

  init(rt) {
    const s = stateOf(rt);
    for (const den of DREY_DENS) {
      const first = rt.inGroup(den.id)[0];
      const cx = first ? first.homeX : den.x;
      const cz = first ? first.homeZ : den.z;
      s.centres.set(den.id, { x: cx, z: cz });
      const y = heightAt(cx, cz);
      if (den.silo) {
        const silo = buildPrefab('silo', { scale: 5, lights: false });
        const sz = cz - 6;
        silo.position.set(cx, heightAt(cx, sz), sz);
        rt.scene.add(silo);
        rt.world.boxes.push({ minX: cx - 3, maxX: cx + 3, minZ: sz - 3, maxZ: sz + 3, h: 12 });
      } else {
        for (const yaw of [0.5, -0.5]) {
          const log = buildPrefab('fallen-log', { scale: 2.5, lights: false });
          log.position.set(cx, y, cz);
          log.rotation.y = yaw;
          rt.scene.add(log);
        }
      }
    }
  },

  update(rt, ctx) {
    const s = stateOf(rt);
    const onFoot = !ctx.playerVehicle;
    for (const den of DREY_DENS) {
      const cen = denCentre(s, den.id);
      if (!cen) continue;
      const ds = denOf(s, den.id);
      const d = Math.hypot(ctx.playerX - cen.x, ctx.playerZ - cen.z);
      if (!ds.raided && onFoot && d <= RAID_RANGE) startRaid(rt, s, ds, ctx.time);
      else if (ds.raided && (!onFoot || d > RAID_END)) endRaid(rt, ds, den.id);
      if (ds.raided) runRaid(rt, s, ds, den.id, ctx);
    }
    updateAcorns(rt, s, ctx);
    updateTheft(rt, s, ctx);
  },

  onHit(rt, c, cause, fromX, fromZ) {
    if (c.kind !== 'squirrel' || !DREY_DENS.some((d) => d.id === c.group)) return false;
    if (cause === 'vehicle' && c.data.riding) return true;
    if (cause !== 'shot' && cause !== 'blast') return false;
    const s = stateOf(rt);
    const ds = denOf(s, c.group);
    for (const o of rt.inGroup(c.group)) {
      if (o === c || o.mode === 'down' || o.data.riding || o.data.role === 'thief') continue;
      if (o.mode === 'script' || o.mode === 'chase') o.mode = 'idle';
      o.data.role = undefined;
      rt.scare(o, fromX, fromZ, 6);
    }
    if (!ds.scattered) {
      ds.scattered = true;
      rt.deps.event('drey-scattered');
    }
    return false;
  },
};
