// The sky-traffic runtime (docs/roadmaps/gta-npc-planes.md): spawns NPC aircraft as ordinary Vehicles from the behaviour
// table, flies them with the kinematic follower, runs their actions (spray, smoke, parcel drops, the towed advert
// banner), crashes them when shot down, releases one the player steals, and despawns them by distance.
import * as THREE from 'three';
import type { Box, Fx, Hud, Sfx, Vehicle, World } from '../types';
import { createVehicle, explodeVehicle, removeVehicle } from '../vehicles';
import { floorUnder } from '../craft/aircraft';
import { insideBox } from '../collide';
import { activeWorldEvents } from '../events/api';
import { SKY } from './config';
import { SKY_BEHAVIOURS, skyBehaviour } from './behaviours';
import { followSpecFor, newFollow, stepFollow } from './follow';
import { createBanner } from './banner';
import type { SkyBanner } from './banner';
import { READABLE_AD_COUNT, nextAd } from './ads';
import { createPuffs } from './puffs';
import type { PuffPool } from './puffs';
import { createParcels } from './parcels';
import type { ParcelDrops } from './parcels';
import { createSkyProgress } from './progress';
import type { SkyProgress } from './progress';
import { registerSkySounds } from './sounds';
import type { AdDef, FollowSpec, FollowState, SkyBehaviourDef, SkyBody, SkyContext, SkyWaypoint } from './types';

export interface SkyTrafficDeps {
  scene: THREE.Scene;
  world: World;
  vehicles: Vehicle[];
  fx: Fx;
  hud: Hud;
  economy: { earn(amount: number, reason?: string): void };
  achievements: { unlock(id: string): unknown; increment(id: string): unknown };
  /** Hat Watch heat (watch.heat). */
  heat: () => number;
  play: (s: Sfx) => void;
}

export interface SkyTrafficInfo { id: string; title: string; active: boolean }

export interface SkyTraffic {
  /** Every frame: the player's position, the vehicle they drive (null on foot), and whether they are on foot. */
  update(dt: number, px: number, py: number, pz: number, driven: Vehicle | null, onFoot: boolean): void;
  /** A bullet at a point: true when it hit an advert banner (aircraft themselves are hit as vehicles). */
  hitTest(x: number, y: number, z: number): boolean;
  /** Force one behaviour to fly now (ignores distance, cooldown and caps). False for an unknown id or one already flying. */
  spawn(id: string): boolean;
  list(): SkyTrafficInfo[];
  /** Remove every NPC aircraft, banner, puff and parcel now. */
  clear(): void;
  /** Off: nothing new spawns (forced spawns still work) and the flying ones are cleared. */
  setEnabled(on: boolean): void;
  /** Online sync: false stops this client spawning new aircraft (the flying ones keep flying). Clears nothing. */
  setSpawning(on: boolean): void;
  /** Online sync: every NPC aircraft right now, for publishing. */
  netList(): SkyNetRec[];
  /** The vehicle of every flying or leaving aircraft (the same array is refilled each call: read it, do not keep it). */
  aircraft(): readonly Vehicle[];
  /** Online sync: take over a plane another client owned (the record is new, here). False for an unknown id or one already flying. */
  adopt(id: string, x: number, y: number, z: number, yaw: number, speed: number): boolean;
  /** Online sync: tear the banner of the aircraft with this key loose. */
  tearBanner(key: number): void;
  /** Online sync: send the aircraft with this key on its way out (another player's copy of the same flight wins). */
  dismiss(key: number): void;
}

/** One NPC aircraft as the online sync sees it. banner: 0 none, 1 towing, 2 torn. */
export interface SkyNetRec {
  key: number;
  id: string;
  v: Vehicle;
  body: SkyBody;
  state: 'flying' | 'leaving' | 'downed' | 'wreck';
  adId: string | null;
  banner: 0 | 1 | 2;
}

/** Where a new aircraft appears. next = the route index it flies to first. */
export interface SkySpawn {
  x: number;
  z: number;
  agl: number;
  next: number;
  ground: boolean;
}

// Scratch vector for banner.centre (one per module, never allocated per frame).
const scratch = new THREE.Vector3();

let keySeq = 0;

export function pickSpawn(
  route: readonly SkyWaypoint[],
  px: number,
  pz: number,
  startAirborne: boolean,
  repeat: SkyBehaviourDef['repeat'],
): SkySpawn {
  if (!startAirborne) return { x: route[0].x, z: route[0].z, agl: 0, next: 0, ground: true };
  let k = 0;
  if (repeat !== 'once') {
    let best = -1;
    for (let i = 0; i < route.length; i++) {
      const dx = route[i].x - px;
      const dz = route[i].z - pz;
      const d2 = dx * dx + dz * dz;
      if (d2 > best) { best = d2; k = i; }
    }
  }
  const p = route[k];
  const dx = p.x - px;
  const dz = p.z - pz;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist >= SKY.minSpawnDist) {
    const next = repeat === 'once' ? (route.length === 1 ? 0 : 1) : (k + 1) % route.length;
    return { x: p.x, z: p.z, agl: p.agl, next, ground: false };
  }
  let ux = 1;
  let uz = 0;
  if (dist > 1e-6) { ux = dx / dist; uz = dz / dist; }
  return { x: px + ux * SKY.spawnFar, z: pz + uz * SKY.spawnFar, agl: p.agl, next: k, ground: false };
}

export function pickBehaviour(
  defs: readonly SkyBehaviourDef[],
  ctx: SkyContext,
  active: ReadonlySet<string>,
  cooldownUntil: ReadonlyMap<string, number>,
  activeCount: number,
): SkyBehaviourDef | null {
  let best: SkyBehaviourDef | null = null;
  for (const def of defs) {
    if (active.has(def.id)) continue;
    if ((cooldownUntil.get(def.id) ?? 0) > ctx.time) continue;
    const cap = def.id === 'watch-copter' ? SKY.maxTotal : SKY.maxActive;
    if (activeCount >= cap) continue;
    if (Math.hypot(ctx.playerX - def.anchor.x, ctx.playerZ - def.anchor.z) > def.radius) continue;
    if (def.when?.(ctx) === false) continue;
    if (!best || def.priority > best.priority) best = def;
  }
  return best;
}

/** Height of the surface an aircraft must clear at (x, z): the terrain, deck or water, or the roof of a building in
 *  the way (probed at SKY.buildingProbe heights above it). */
export function skyFloor(x: number, z: number, y: number, boxes: readonly Box[]): number {
  const f = floorUnder(x, z, y).y;
  let top = -Infinity;
  for (const h of SKY.buildingProbe) {
    if (insideBox(x, f + h, z, boxes)) top = f + h;
  }
  return top === -Infinity ? f : top + SKY.buildingClear;
}

/** One NPC aircraft. */
interface Rec {
  key: number;
  def: SkyBehaviourDef;
  v: Vehicle;
  body: SkyBody;
  follow: FollowState;
  spec: FollowSpec;
  state: 'flying' | 'leaving' | 'downed' | 'wreck';
  floorY: number;
  floorT: number;
  tickAcc: number;
  puffT: number;
  sprayT: number;
  farT: number;
  leaveT: number;
  wreckT: number;
  forced: boolean;
  banner: SkyBanner | null;
  ad: AdDef | null;
  adT: number;
  adSeenT: number;
  adCredited: boolean;
}

function faceYaw(from: { x: number; z: number }, to: SkyWaypoint): number {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

export function createSkyTraffic(deps: SkyTrafficDeps): SkyTraffic {
  registerSkySounds();
  const puffs: PuffPool = createPuffs(deps.scene);
  const parcels: ParcelDrops = createParcels(deps.scene);
  const progress: SkyProgress = createSkyProgress(deps.achievements);
  const boxes = deps.world.boxes;
  const records: Rec[] = [];
  const loose: SkyBanner[] = [];
  const cooldownUntil = new Map<string, number>();
  const activeIds = new Set<string>();
  const ctx: SkyContext = {
    playerX: 0,
    playerZ: 0,
    heat: 0,
    eventActive: false,
    airfield: deps.world.airfield,
    time: 0,
    rng: Math.random,
  };

  let enabled = true;
  let spawning = true;
  let pendingId: string | null = null;
  if (typeof location !== 'undefined') {
    try {
      const q = new URLSearchParams(location.search).get('sky');
      if (q === '0') enabled = false;
      else if (q) pendingId = q;
    } catch {
      // No URL parsing here: the default (enabled, nothing forced) stands.
    }
  }

  let time = 0;
  let thinkT = 0;

  function refreshCtx(): void {
    ctx.heat = deps.heat();
    ctx.eventActive = activeWorldEvents().length > 0;
  }

  function spawn(def: SkyBehaviourDef, forced: boolean): void {
    const route = def.route(ctx);
    const s = pickSpawn(route, ctx.playerX, ctx.playerZ, def.startAirborne, def.repeat);
    const target = s.ground ? route[Math.min(1, route.length - 1)] : route[s.next];
    const yaw = faceYaw(s, target);
    const floor = s.ground ? floorUnder(s.x, s.z, 0).y : skyFloorAt(s.x, s.z);
    const v = createVehicle(deps.scene, def.kind, s.x, s.z, yaw);
    v.y = floor + s.agl;
    v.questOwned = true;
    v.variant = def.sound;
    v.driver = s.ground ? 'none' : 'npc';
    const body: SkyBody = {
      x: s.x,
      y: v.y,
      z: s.z,
      yaw,
      speed: s.ground ? 0 : route[s.next].speed,
      vy: 0,
      pitch: 0,
      roll: 0,
    };
    const follow = newFollow(route, body, s.next);
    deps.vehicles.push(v);
    const rec: Rec = {
      key: ++keySeq,
      def,
      v,
      body,
      follow,
      spec: followSpecFor(def.kind),
      state: 'flying',
      floorY: floor,
      floorT: 0,
      tickAcc: 0,
      puffT: 0,
      sprayT: 0,
      farT: 0,
      leaveT: 0,
      wreckT: 0,
      forced,
      banner: null,
      ad: null,
      adT: 0,
      adSeenT: 0,
      adCredited: false,
    };
    if (def.banner) {
      const banner = createBanner(deps.scene);
      const ad = nextAd(null, Math.random);
      banner.setAd(ad);
      rec.banner = banner;
      rec.ad = ad;
    }
    records.push(rec);
    if (def.toast && !s.ground) deps.hud.toast(def.toast, 3000);
  }

  function skyFloorAt(x: number, z: number): number {
    return skyFloor(x, z, 1e4, boxes);
  }

  function leave(rec: Rec): void {
    const b = rec.body;
    if (rec.state !== 'leaving') rec.leaveT = 0;
    rec.state = 'leaving';
    const route: SkyWaypoint[] = [{
      x: b.x + Math.sin(b.yaw) * 1500,
      z: b.z + Math.cos(b.yaw) * 1500,
      agl: 80,
      speed: Math.max(b.speed, 20),
    }];
    rec.follow = newFollow(route, b, 0);
  }

  function think(): void {
    refreshCtx();
    activeIds.clear();
    for (const r of records) {
      activeIds.add(r.def.id);
      if (!r.forced && r.state === 'flying' && r.def.when && !r.def.when(ctx)) leave(r);
    }
    if (!enabled || !spawning) return;
    const def = pickBehaviour(SKY_BEHAVIOURS, ctx, activeIds, cooldownUntil, records.length);
    if (def) spawn(def, false);
  }

  function tear(rec: Rec): void {
    if (!rec.banner) return;
    rec.banner.tearLoose();
    loose.push(rec.banner);
    rec.banner = null;
    progress.markTorn();
    deps.hud.toast('Ad Blocker! The banner tore loose.', 2500);
  }

  /** Despawn: the banner (if any) falls loose, the vehicle is removed. */
  function removeAt(i: number): void {
    const rec = records[i];
    if (rec.banner) {
      rec.banner.tearLoose();
      loose.push(rec.banner);
      rec.banner = null;
    }
    removeVehicle(deps.scene, rec.v);
    const vi = deps.vehicles.indexOf(rec.v);
    if (vi >= 0) deps.vehicles.splice(vi, 1);
    records.splice(i, 1);
  }

  /** The player stole it: it becomes an ordinary vehicle again, the record goes, the vehicle stays. */
  function releaseAt(i: number): void {
    const rec = records[i];
    if (rec.banner) {
      rec.banner.tearLoose();
      loose.push(rec.banner);
      rec.banner = null;
    }
    const v = rec.v;
    v.questOwned = false;
    v.variant = undefined;
    if (v.air) v.air.airborne = v.y - floorUnder(v.x, v.z, v.y).y > 0.05;
    cooldownUntil.set(rec.def.id, time + rec.def.cooldown);
    records.splice(i, 1);
  }

  function stepFlying(rec: Rec, sdt: number, d: number): void {
    const b = rec.body;
    rec.floorT -= sdt;
    if (rec.floorT <= 0) {
      rec.floorT = SKY.floorEvery;
      const ahead = SKY.floorAhead;
      const fwd = b.speed * ahead;
      rec.floorY = Math.max(
        skyFloor(b.x, b.z, b.y, boxes),
        skyFloor(b.x + Math.sin(b.yaw) * fwd, b.z + Math.cos(b.yaw) * fwd, b.y, boxes),
      );
    }
    const idx = stepFollow(b, rec.follow, rec.spec, rec.floorY, sdt);
    const route = rec.follow.route;
    if (idx >= 0 && route[idx].drop) {
      const sx = Math.sin(b.yaw) * b.speed * 0.5;
      const sz = Math.cos(b.yaw) * b.speed * 0.5;
      parcels.drop(b.x, b.y - 2, b.z, sx, sz);
      if (d < 300) deps.hud.toast('Pigeon-Drop parcel incoming!', 2500);
    }
    if (rec.follow.done) {
      if (rec.state === 'leaving' || rec.def.repeat === 'once') leave(rec);
      else if (rec.def.repeat === 'rebuild') rec.follow = newFollow(rec.def.route(ctx), b, 0);
      else rec.follow = newFollow(route, b, 0);
    }
    const last = rec.follow.route.length - 1;
    const wp = rec.follow.route[Math.min(rec.follow.i, last)];
    rec.v.driver = wp.ground && rec.follow.holdT > 0 ? 'none' : 'npc';

    if (d < 600) emitTrail(rec, sdt, wp);
  }

  function emitTrail(rec: Rec, sdt: number, leg: SkyWaypoint): void {
    const b = rec.body;
    const fx = Math.sin(b.yaw);
    const fz = Math.cos(b.yaw);
    const tx = b.x - fx * 3;
    const tz = b.z - fz * 3;
    if (leg.smoke) {
      rec.puffT += sdt;
      if (rec.puffT > SKY.smokeEvery * 4) rec.puffT = SKY.smokeEvery * 4;
      while (rec.puffT >= SKY.smokeEvery) {
        rec.puffT -= SKY.smokeEvery;
        puffs.emit(tx, b.y, tz, 0, 0, 0, SKY.smokeSize, SKY.smokeLife, rec.def.puff ?? SKY.smokeColour);
      }
    } else {
      rec.puffT = 0;
    }
    if (leg.spray) {
      rec.sprayT += sdt;
      if (rec.sprayT > SKY.sprayEvery * 4) rec.sprayT = SKY.sprayEvery * 4;
      while (rec.sprayT >= SKY.sprayEvery) {
        rec.sprayT -= SKY.sprayEvery;
        const vx = fx * b.speed * 0.15 + (Math.random() - 0.5);
        const vz = fz * b.speed * 0.15 + (Math.random() - 0.5);
        puffs.emit(tx, b.y - 1.5, tz, vx, -4, vz, SKY.spraySize, SKY.sprayLife, rec.def.puff ?? SKY.sprayColour);
      }
    } else {
      rec.sprayT = 0;
    }
  }

  function stepDowned(rec: Rec, dt: number): void {
    const b = rec.body;
    b.yaw += SKY.crashSpin * dt;
    b.speed *= Math.max(0, 1 - 0.3 * dt);
    b.vy -= SKY.crashGravity * dt;
    b.x += Math.sin(b.yaw) * b.speed * dt;
    b.z += Math.cos(b.yaw) * b.speed * dt;
    b.y += b.vy * dt;
    const ease = Math.min(1, 2 * dt);
    b.roll += (1.2 - b.roll) * ease;
    b.pitch += (-0.6 - b.pitch) * ease;
    rec.floorT -= dt;
    if (rec.floorT <= 0) {
      rec.floorT = SKY.floorEvery;
      rec.floorY = skyFloorAt(b.x, b.z);
    }
    if (b.y <= rec.floorY) {
      b.y = rec.floorY;
      b.speed = 0;
      b.vy = 0;
      deps.fx.explode(b.x, b.y, b.z);
      rec.state = 'wreck';
      rec.wreckT = SKY.wreckLife;
    }
  }

  function stepBanner(rec: Rec, dt: number, d: number, px: number, py: number, pz: number, driven: Vehicle | null): void {
    const banner = rec.banner;
    if (!banner) return;
    const b = rec.body;
    const v = rec.v;
    const fx = Math.sin(b.yaw);
    const fz = Math.cos(b.yaw);
    const r = v.spec.radius;
    banner.update(dt, b.x - fx * r, b.y + 0.5, b.z - fz * r, b.yaw, b.speed, time, d < SKY.bannerDetailRange);
    banner.setVisible(d < SKY.bannerDrawDist);

    rec.adT += dt;
    if (rec.adT > SKY.adEvery && rec.ad) {
      rec.ad = nextAd(rec.ad.id, Math.random);
      banner.setAd(rec.ad);
      rec.adT = 0;
      rec.adSeenT = 0;
      rec.adCredited = false;
    }

    const c = banner.centre(scratch);
    const ex = c.x - px;
    const ey = c.y - py;
    const ez = c.z - pz;
    const d3 = Math.sqrt(ex * ex + ey * ey + ez * ez);
    const ad = rec.ad;
    if (ad) {
      if (d3 < SKY.spotRange && progress.markSpotted()) {
        deps.hud.toast(`Look up! A sky-sign banner: ${ad.headline}`, 3000);
      }
      if (d3 < SKY.readRange) {
        rec.adSeenT += dt;
        if (rec.adSeenT >= SKY.readTime && !rec.adCredited) {
          rec.adCredited = true;
          if (progress.markRead(ad)) {
            if (ad.egg) deps.hud.toast(`Easter egg banner: "${ad.headline}"`, 3500);
            else deps.hud.toast(`Ad read ${progress.readCount()}/${READABLE_AD_COUNT}: ${ad.headline}`, 2500);
          }
        }
      }
    }

    if (driven && driven !== v && banner.hitTest(driven.x, driven.y + 0.5, driven.z)) tear(rec);
  }

  function update(dt: number, px: number, py: number, pz: number, driven: Vehicle | null, onFoot: boolean): void {
    time += dt;
    ctx.time = time;
    ctx.playerX = px;
    ctx.playerZ = pz;

    if (pendingId !== null) {
      const id = pendingId;
      pendingId = null;
      const def = skyBehaviour(id);
      if (def && !records.some((r) => r.def.id === def.id)) {
        refreshCtx();
        spawn(def, true);
      }
    }

    thinkT -= dt;
    if (thinkT <= 0) {
      thinkT = SKY.thinkEvery;
      think();
    }

    for (let i = records.length - 1; i >= 0; i--) {
      const rec = records[i];
      const v = rec.v;
      const b = rec.body;

      if (v.driver === 'player') {
        releaseAt(i);
        continue;
      }

      const dx = b.x - px;
      const dz = b.z - pz;
      const d = Math.sqrt(dx * dx + dz * dz);

      if ((rec.state === 'flying' || rec.state === 'leaving') && (v.exploded || v.hp <= 0)) {
        if (!v.exploded) {
          explodeVehicle(v);
          deps.fx.explode(v.x, v.y, v.z);
          if (d < 120) deps.play('boom');
        }
        rec.state = 'downed';
        rec.floorT = 0;
        v.driver = 'none';
        if (rec.banner) {
          rec.banner.tearLoose();
          loose.push(rec.banner);
          rec.banner = null;
        }
        if (d < SKY.downedCredit) {
          progress.markDowned();
          deps.hud.toast(`${rec.def.title} is going down!`, 2500);
        }
      }

      rec.farT = d > SKY.despawnDist ? rec.farT + dt : 0;
      if (rec.farT > SKY.despawnAfter && rec.state !== 'wreck') {
        removeAt(i);
        cooldownUntil.set(rec.def.id, time + 20);
        continue;
      }

      if (rec.state === 'leaving') {
        rec.leaveT += dt;
        if (rec.leaveT > SKY.leaveFor) {
          removeAt(i);
          cooldownUntil.set(rec.def.id, time + rec.def.cooldown);
          continue;
        }
      }

      if (rec.state === 'flying' || rec.state === 'leaving') {
        rec.tickAcc += dt;
        if (!(d > SKY.farTick && rec.tickAcc < 1 / SKY.farTickHz)) {
          const sdt = rec.tickAcc;
          rec.tickAcc = 0;
          stepFlying(rec, sdt, d);
        }
      } else if (rec.state === 'downed') {
        stepDowned(rec, dt);
      } else if (rec.state === 'wreck') {
        rec.wreckT -= dt;
        if (rec.wreckT <= 0) {
          removeAt(i);
          cooldownUntil.set(rec.def.id, time + SKY.downedCooldown);
          continue;
        }
      }

      // Write the body back to the vehicle every frame.
      v.x = b.x;
      v.y = b.y;
      v.z = b.z;
      v.yaw = b.yaw;
      v.speed = b.speed;
      v.vy = b.vy;
      const flying = rec.state === 'flying' || rec.state === 'leaving';
      if (v.air) {
        v.air.pitch = b.pitch;
        v.air.roll = b.roll;
        v.air.airborne = flying ? b.y - rec.floorY > 0.05 : false;
      } else {
        v.steerVis = Math.max(-1, Math.min(1, b.roll / 0.5));
      }

      stepBanner(rec, dt, d, px, py, pz, driven);
    }

    for (let j = loose.length - 1; j >= 0; j--) {
      const bn = loose[j];
      const c = bn.centre(scratch);
      const near = Math.hypot(c.x - px, c.z - pz) < SKY.bannerDetailRange;
      bn.update(dt, 0, 0, 0, 0, 0, time, near);
      if (bn.gone()) {
        bn.dispose();
        loose.splice(j, 1);
      }
    }

    puffs.update(dt);
    const n = parcels.update(dt, px, py, pz, onFoot);
    if (n > 0) {
      deps.economy.earn(n, 'Pigeon-Drop parcel');
      deps.hud.toast(`Pigeon-Drop parcel: +${n} Acorns (finder's fee)`, 2500);
      deps.play('chute');
    }
  }

  function hitTest(x: number, y: number, z: number): boolean {
    for (const rec of records) {
      const banner = rec.banner;
      if (!banner) continue;
      if (banner.hitTest(x, y, z)) {
        deps.fx.spark(x, y, z);
        if (banner.hits >= SKY.bannerTearHits) tear(rec);
        return true;
      }
    }
    return false;
  }

  function spawnById(id: string): boolean {
    const def = skyBehaviour(id);
    if (!def) return false;
    if (records.some((r) => r.def.id === def.id)) return false;
    refreshCtx();
    spawn(def, true);
    return true;
  }

  function list(): SkyTrafficInfo[] {
    return SKY_BEHAVIOURS.map((def) => ({
      id: def.id,
      title: def.title,
      active: records.some((r) => r.def.id === def.id),
    }));
  }

  function clear(): void {
    for (let i = records.length - 1; i >= 0; i--) {
      const rec = records[i];
      if (rec.banner) {
        rec.banner.dispose();
        rec.banner = null;
      }
      removeVehicle(deps.scene, rec.v);
      const vi = deps.vehicles.indexOf(rec.v);
      if (vi >= 0) deps.vehicles.splice(vi, 1);
    }
    records.length = 0;
    for (const bn of loose) bn.dispose();
    loose.length = 0;
    puffs.clear();
    parcels.clear();
    for (const def of SKY_BEHAVIOURS) cooldownUntil.set(def.id, time + 5);
  }

  function setEnabled(on: boolean): void {
    enabled = on;
    if (!on) clear();
  }

  function setSpawning(on: boolean): void {
    spawning = on;
  }

  const aircraftList: Vehicle[] = [];
  function aircraft(): readonly Vehicle[] {
    aircraftList.length = 0;
    for (const rec of records) aircraftList.push(rec.v);
    return aircraftList;
  }

  function netList(): SkyNetRec[] {
    return records.map((rec): SkyNetRec => ({
      key: rec.key,
      id: rec.def.id,
      v: rec.v,
      body: rec.body,
      state: rec.state,
      adId: rec.ad?.id ?? null,
      banner: rec.banner ? 1 : rec.def.banner ? 2 : 0,
    }));
  }

  function adopt(id: string, x: number, y: number, z: number, yaw: number, speed: number): boolean {
    const def = skyBehaviour(id);
    if (!def) return false;
    if (records.some((r) => r.def.id === def.id)) return false;
    refreshCtx();
    spawn(def, true);
    const rec = records[records.length - 1];
    rec.body.x = x;
    rec.body.y = y;
    rec.body.z = z;
    rec.body.yaw = yaw;
    rec.body.speed = speed;
    rec.v.x = x;
    rec.v.y = y;
    rec.v.z = z;
    rec.v.yaw = yaw;
    rec.v.speed = speed;
    return true;
  }

  function tearBanner(key: number): void {
    const rec = records.find((r) => r.key === key);
    if (rec) tear(rec);
  }

  function dismiss(key: number): void {
    const rec = records.find((r) => r.key === key);
    if (rec && rec.state === 'flying') leave(rec);
  }

  return { update, hitTest, spawn: spawnById, list, clear, setEnabled, setSpawning, netList, aircraft, adopt, tearBanner, dismiss };
}
