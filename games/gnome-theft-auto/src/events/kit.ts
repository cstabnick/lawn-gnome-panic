// The street-event kit: what an event script uses to put gnomes, cars and props into the world and move them, and
// how they all leave again. One kit per running event (director.ts makes it). Gnomes are real pedestrians from npcs.ts
// (spawnNamed with an "event:" tag), so the player can shoot, run over and knock them like anyone else; cars go into
// the game's vehicle list, so they can be stolen and wrecked.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { angleDiff } from '../collide';
import type { Economy } from '../economy';
import { gnomeState, makeGnome, randomGnomeName, randomTownLook } from '../gnomes';
import { perkRewardScale } from '../perks';
import { roadRoute, type Pt } from '../route';
import { heightAt } from '../terrain';
import { offRoad, pickAnchor } from './spots';
import type { Fx, Hud, Npc, Npcs, Player, Sfx, Vehicle, Watch, World } from '../types';
import { createVehicle, exitPoint, removeVehicle, stepVehicle, syncVehicleMesh } from '../vehicles';
import type { Actor, Car, CarOpts, EventAnchor, EventKit, GnomeOpts } from './types';

/** A say() toast is shown only when the player is this close to the speaker. */
export const HEAR_RADIUS = 60;

export interface KitDeps {
  scene: THREE.Scene;
  world: World;
  hud: Hud;
  vehicles: Vehicle[];
  npcs: Npcs;
  watch: Watch;
  fx: Fx;
  economy?: Economy;
  play?: (s: Sfx) => void;
}

/** The kit plus what the director needs to run and clean it. */
export interface RunKit extends EventKit {
  /** Advance time and move every actor and car (call before the script's update). */
  step(dt: number, player: Player): void;
  /** The event is over: its gnomes become ordinary pedestrians, its cars stop being steered (they stay until dispose). */
  release(): void;
  /** Remove everything the event still owns (cars nobody stole, props, unreleased gnomes). */
  dispose(): void;
  /** Smallest distance from the player to anything the event owns (or the anchor). */
  nearest(): number;
}

type Mode =
  | { k: 'hold'; x: number; z: number }
  | { k: 'walk'; x: number; z: number }
  | { k: 'run'; x: number; z: number }
  | { k: 'free'; until: number };

interface ActorRec {
  actor: Actor;
  npc: Npc;
  mode: Mode;
  face: { x: number; z: number } | null;
  gone: boolean;
  stopped: boolean;
}

interface CarRec {
  car: Car;
  v: Vehicle;
  route: Pt[];
  wp: number;
  goal: Pt | null;
  chase: (() => { x: number; z: number }) | null;
  throttle: number;
  stuckT: number;
  lastX: number;
  lastZ: number;
  reverseT: number;
  /** The player has driven it at some point (it is theirs to keep). */
  taken: boolean;
}

let eventSeq = 0;

export function createKit(
  deps: KitDeps,
  player: Player,
  anchor: EventAnchor,
  rand: () => number = Math.random,
  /** EventDef.roadScene: gnomes and props may stand on the road. */
  roadScene = false,
): RunKit {
  const tag = `event:${++eventSeq}`;
  let seq = 0;
  let t = 0;
  let released = false;
  let pl = player;
  const actors: ActorRec[] = [];
  const cars: CarRec[] = [];
  const props: THREE.Object3D[] = [];

  const px = (): number => (pl.vehicle ? pl.vehicle.x : pl.x);
  const pz = (): number => (pl.vehicle ? pl.vehicle.z : pl.z);
  const dist = (x: number, z: number): number => Math.hypot(px() - x, pz() - z);
  const verge = (x: number, z: number): Pt => offRoad(deps.world.roads, x, z);
  /** Where a gnome or prop of this event may stand: off the road unless it is a road scene. */
  const place = (x: number, z: number): Pt => (roadScene ? { x, z } : verge(x, z));

  function alive(r: ActorRec): boolean {
    if (r.gone) return false;
    if (!deps.npcs.list.includes(r.npc)) {
      r.gone = true;
      r.stopped = true;
    }
    return !r.gone;
  }

  function removeNpc(n: Npc): void {
    const i = deps.npcs.list.indexOf(n);
    if (i >= 0) {
      deps.npcs.list.splice(i, 1);
      n.model.object.parent?.remove(n.model.object);
    }
  }

  function gnome(o: GnomeOpts): Actor {
    const look = { ...randomTownLook(), ...(o.look ?? {}) };
    const name = o.name ?? randomGnomeName();
    const at = place(o.x, o.z);
    const npc = deps.npcs.spawnNamed(name, at.x, at.z, look, `${tag}:${seq++}`);
    npc.calm = true;
    const rec: ActorRec = { actor: null as unknown as Actor, npc, mode: { k: 'hold', x: at.x, z: at.z }, face: null, gone: false, stopped: false };
    const goal = (): Pt => (rec.mode.k === 'free' ? { x: npc.x, z: npc.z } : { x: rec.mode.x, z: rec.mode.z });
    rec.actor = {
      npc,
      name,
      x: () => npc.x,
      z: () => npc.z,
      walkTo(x, z) { const p = place(x, z); rec.mode = { k: 'walk', x: p.x, z: p.z }; rec.face = null; },
      runTo(x, z) { const p = place(x, z); rec.mode = { k: 'run', x: p.x, z: p.z }; rec.face = null; },
      hold(x, z) { const p = place(x ?? npc.x, z ?? npc.z); rec.mode = { k: 'hold', x: p.x, z: p.z }; },
      face(x, z) { rec.face = { x, z }; },
      flee(fromX, fromZ) {
        if (!alive(rec) || npc.state === 'ragdoll') return;
        deps.npcs.scare(npc, fromX, fromZ);
        rec.mode = { k: 'free', until: t + 6 };
      },
      arrived(r = 1.5) { const g = goal(); return Math.hypot(npc.x - g.x, npc.z - g.z) <= r; },
      cracked() { alive(rec); return rec.gone; },
      down() { return alive(rec) && npc.state === 'ragdoll'; },
      stopped() { alive(rec); return rec.stopped; },
      remove() { rec.gone = true; removeNpc(npc); },
    };
    actors.push(rec);
    return rec.actor;
  }

  function stepActor(r: ActorRec): void {
    if (!alive(r)) return;
    const n = r.npc;
    if (n.state === 'ragdoll') { r.stopped = true; return; }
    const m = r.mode;
    if (m.k === 'free') {
      if (t >= m.until && n.state !== 'flee') r.mode = { k: 'hold', x: n.x, z: n.z };
      return;
    }
    const dx = m.x - n.x;
    const dz = m.z - n.z;
    const d = Math.hypot(dx, dz);
    if (m.k === 'run') {
      if (d > 1.2) {
        // Flee mode runs directly away from fromX/Z: put the "scare" behind the gnome, on the far side from the goal.
        n.state = 'flee';
        n.fleeTime = 0.5;
        n.fromX = n.x - (dx / d) * 5;
        n.fromZ = n.z - (dz / d) * 5;
      } else {
        // Let npcs.ts end the flee itself (it lowers the hands), then stand here.
        if (n.state === 'flee') n.fleeTime = 0.0001;
        r.mode = { k: 'hold', x: m.x, z: m.z };
      }
      return;
    }
    if (n.state === 'flee') return; // scared by something: let it run, resume after
    n.targetX = m.x;
    n.targetZ = m.z;
    if (d > 0.7) {
      n.state = 'walk';
    } else if (r.face && n.state === 'idle') {
      n.yaw = Math.atan2(r.face.x - n.x, r.face.z - n.z);
    }
    if (m.k === 'walk' && d <= 0.7) r.mode = { k: 'hold', x: m.x, z: m.z };
  }

  function seatDriver(v: Vehicle, over: CarOpts['driver']): void {
    if (over === null) return;
    const look = { ...randomTownLook(), ...(over ?? {}) };
    const rider = makeGnome(v.object, look);
    rider.object.position.set(...v.spec.seat);
    rider.update(gnomeState(0, 0, 0, 0, 0, true), 0);
    v.rider = rider;
    v.riderLook = look;
    v.driver = 'npc';
  }

  function car(o: CarOpts): Car {
    const v = createVehicle(deps.scene, o.kind, o.x, o.z, o.yaw, o.tint);
    v.questOwned = true;
    seatDriver(v, o.driver);
    deps.vehicles.push(v);
    const rec: CarRec = {
      car: null as unknown as Car, v, route: [], wp: 0, goal: null, chase: null, throttle: 0.7,
      stuckT: 0, lastX: v.x, lastZ: v.z, reverseT: 0, taken: false,
    };
    rec.car = {
      v,
      driveTo(x, z, throttle = 0.7) {
        rec.goal = { x, z };
        rec.chase = null;
        rec.throttle = throttle;
        rec.route = roadRoute(deps.world.roads, { x: v.x, z: v.z }, { x, z });
        rec.wp = rec.route.length > 1 ? 1 : 0;
      },
      follow(target, throttle = 0.9) {
        rec.chase = typeof target === 'function' ? target : () => target;
        rec.goal = null;
        rec.throttle = throttle;
      },
      stop() { rec.goal = null; rec.chase = null; rec.route = []; },
      arrived(r = 8) {
        const g = rec.route[rec.route.length - 1];
        return !!g && Math.hypot(v.x - g.x, v.z - g.z) <= r;
      },
      stolen: () => v.driver === 'player',
      wrecked: () => !!v.exploded,
      lost: () => v.driver !== 'npc' || !!v.exploded,
      eject() {
        if (v.driver !== 'npc' || !v.rider || !v.riderLook) return null;
        const look = v.riderLook;
        v.object.remove(v.rider.object);
        v.rider = null;
        v.riderLook = null;
        v.driver = 'none';
        v.speed = 0;
        rec.goal = null;
        rec.chase = null;
        const out = exitPoint(v);
        return gnome({ x: out.x, z: out.z, look });
      },
    };
    cars.push(rec);
    return rec.car;
  }

  function stepCar(r: CarRec, dt: number): void {
    const v = r.v;
    if (v.driver === 'player') r.taken = true;
    if (v.driver !== 'npc' || v.exploded || !deps.vehicles.includes(v)) return;
    let aim: Pt | null = null;
    if (r.chase) {
      aim = r.chase();
    } else if (r.goal && r.route.length > 0) {
      while (r.wp < r.route.length - 1 && Math.hypot(r.route[r.wp].x - v.x, r.route[r.wp].z - v.z) < 7) r.wp++;
      const last = r.wp >= r.route.length - 1;
      const w = r.route[r.wp];
      if (last && Math.hypot(w.x - v.x, w.z - v.z) < 5) r.goal = null;
      else aim = w;
    }
    let throttle = 0;
    let steer = 0;
    if (aim) {
      const diff = angleDiff(Math.atan2(aim.x - v.x, aim.z - v.z), v.yaw);
      steer = Math.max(-1, Math.min(1, diff * 2));
      throttle = Math.abs(diff) > 0.9 ? r.throttle * 0.45 : r.throttle;
      // Unstick: barely moved for 2.5 s while trying to drive, so back up for a second.
      r.stuckT += dt;
      if (r.stuckT >= 2.5) {
        if (Math.hypot(v.x - r.lastX, v.z - r.lastZ) < 1.5) r.reverseT = 1.1;
        r.stuckT = 0;
        r.lastX = v.x;
        r.lastZ = v.z;
      }
      if (r.reverseT > 0) {
        r.reverseT -= dt;
        throttle = -0.6;
        steer = -steer;
      }
    }
    stepVehicle(v, { throttle, steer, lift: 0 }, dt, deps.world);
    syncVehicleMesh(v, dt);
  }

  function prop(id: string, x: number, z: number, yaw = 0, scale = 1): THREE.Object3D {
    let o: THREE.Object3D;
    try {
      o = buildPrefab(id, { scale });
    } catch {
      o = new THREE.Group(); // an unknown id must never break the game: an empty marker
    }
    ({ x, z } = place(x, z));
    o.position.set(x, heightAt(x, z), z);
    o.rotation.y = yaw;
    deps.scene.add(o);
    props.push(o);
    return o;
  }

  function dropProp(o: THREE.Object3D): void {
    const i = props.indexOf(o);
    if (i >= 0) props.splice(i, 1);
    deps.scene.remove(o);
  }

  const kit: RunKit = {
    get t() { return t; },
    get player() { return pl; },
    world: deps.world,
    fx: deps.fx,
    rand,
    pick: <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length) % Math.max(1, list.length)],
    ground: heightAt,
    dist,
    near: (x, z, r) => dist(x, z) <= r,
    px,
    pz,
    inVehicle: () => !!pl.vehicle,
    offRoad: verge,
    spot: (kind, min, max, fromX = anchor.x, fromZ = anchor.z) => pickAnchor(deps.world, kind, fromX, fromZ, rand, min, max),
    gnome,
    car,
    prop,
    dropProp,
    say(text, x = anchor.x, z = anchor.z, ms = 4500) {
      if (dist(x, z) <= HEAR_RADIUS) deps.hud.toast(text, ms);
    },
    tell(text, ms = 4500) { deps.hud.toast(text, ms); },
    sfx(s) { deps.play?.(s); },
    addHeat(a) { deps.watch.addHeat(a); },
    heat: () => deps.watch.heat,
    reward(acorns, reason) {
      const n = Math.round(acorns * perkRewardScale());
      if (n <= 0) return;
      deps.economy?.earn(n, reason);
      deps.hud.toast(`${reason} +${n} Acorns`, 3500);
      deps.play?.('steal');
    },
    charge(acorns, reason) {
      return deps.economy ? deps.economy.spend(acorns, reason) : false;
    },
    heal(amount) {
      if (pl.health > 0) pl.health = Math.min(1, pl.health + amount);
    },

    step(dt, p) {
      pl = p;
      t += dt;
      if (released) {
        for (const c of cars) stepCar(c, dt);
        return;
      }
      for (const a of actors) stepActor(a);
      for (const c of cars) stepCar(c, dt);
    },
    release() {
      if (released) return;
      released = true;
      for (const a of actors) {
        if (!alive(a)) continue;
        // Back into the crowd: npcs.ts recycles it like any pedestrian from now on.
        delete a.npc.quest;
        a.npc.calm = false;
        if (a.npc.state === 'idle') a.npc.state = 'walk';
      }
    },
    dispose() {
      for (const a of actors) if (!a.gone && a.npc.quest) { a.gone = true; removeNpc(a.npc); }
      for (const c of cars) {
        const v = c.v;
        // A car the player took stays in the world as an ordinary vehicle; everything else the event brought leaves.
        if (v.driver === 'player' || v === pl.vehicle || (c.taken && !v.exploded)) {
          v.questOwned = false;
          continue;
        }
        const i = deps.vehicles.indexOf(v);
        if (i >= 0) deps.vehicles.splice(i, 1);
        removeVehicle(deps.scene, v);
      }
      cars.length = 0;
      for (const o of props) deps.scene.remove(o);
      props.length = 0;
    },
    nearest() {
      let best = dist(anchor.x, anchor.z);
      for (const a of actors) if (!a.gone) best = Math.min(best, dist(a.npc.x, a.npc.z));
      for (const c of cars) if (deps.vehicles.includes(c.v)) best = Math.min(best, dist(c.v.x, c.v.z));
      return best;
    },
  };
  return kit;
}
