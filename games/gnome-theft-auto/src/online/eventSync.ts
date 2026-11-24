// Street events (docs/roadmaps/gta-online-sync.md, Issue 1.6): the lead's director runs the events and everyone near sees
// them. The owner of each event piece (a gnome, a car, a prop) publishes it; the event's header is piece 0 and carries
// its place and callout. Guests mirror every piece as a ghost, get the callout, and can shoot its gnomes and cars (the
// owner applies the hit). A guest who acted gets the event's reward (setRewardHook).
import * as THREE from 'three';
import { decodeLook, encodeLook, fromModelLook, toModelLook, type GnomeLook, type GnomeModel } from '@lawn/gnome';
import { buildPrefab } from '@lawn/prefabs';
import { Interp } from '@lawn/mp/interp';
import { STREET_EVENTS } from '../events/catalog';
import { DIRECTOR, type EventDirector } from '../events/director';
import type { EventDef, EventStatus } from '../events/types';
import { gnomeState, makeGnome, randomTownLook } from '../gnomes';
import { VEHICLE_CODES } from '../net';
import { heightAt } from '../terrain';
import type { Fx, Hud, Npc, Npcs, Sfx, Vehicle } from '../types';
import { createVehicle, removeVehicle, syncVehicleMesh } from '../vehicles';
import type { SyncAdapter, SyncFrame, SyncLink } from './hub';
import type { MirrorChanges, MirrorEnt } from './replicate';
import { qAngle, qPos, qUnit, SYS, uqAngle, uqPos } from './protocol';

export interface EventSyncDeps {
  director: EventDirector;
  scene: THREE.Scene;
  npcs: Npcs;
  vehicles: Vehicle[];
  fx: Fx;
  play(s: Sfx): void;
  hud: Hud;
  /** Shoot damage on a vehicle I own (blows it up at 0 hp). */
  damage(v: Vehicle, amount: number): void;
}

/** Event id = key * PIECES + piece number (0 = the header). */
const PIECES = 32;
const MAX_PIECE = PIECES - 1;
const STATUS: readonly EventStatus[] = ['running', 'done', 'failed', 'gone'];
const NPC_STATES: readonly Npc['state'][] = ['walk', 'idle', 'flee', 'ragdoll'];
/** Record kind (rec[1]). */
const KIND = { actor: 0, car: 1, prop: 2, head: 3 } as const;
/** How long a guest's shot keeps the reward for the event it hit. */
const SHOT_REWARD_MS = 30000;
/** Damage a guest's shot does to a car, in hit points (command 2's default, percent). */
const SHOT_CAR_PCT = 25;
/** A peer's shot is believed only from this close to the piece it hit, m (beyond any gun's useful range). */
const CMD_REACH_M = 150;

interface ActorGhost { kind: 'actor'; owner: number; id: number; model: GnomeModel; it: Interp; x: number; z: number }
interface CarGhost { kind: 'car'; owner: number; id: number; v: Vehicle | null; it: Interp; speed: number }
interface PropGhost { kind: 'prop'; owner: number; id: number; o: THREE.Object3D }
interface HeadGhost {
  kind: 'head'; owner: number; id: number; x: number; z: number;
  def: EventDef | undefined; status: EventStatus; called: boolean;
}
type Ghost = ActorGhost | CarGhost | PropGhost | HeadGhost;

/** A key's piece numbers: assigned in order of first sight, 1..MAX_PIECE. */
interface KeyPieces { nums: WeakMap<object, number>; next: number }

function propObject(prefab: string, scale: number): THREE.Object3D {
  try {
    return buildPrefab(prefab, { scale });
  } catch {
    return new THREE.Group(); // an unknown prefab must never break the game: an empty marker
  }
}

function lookOf(code: string | undefined): GnomeLook {
  const look = code ? decodeLook(code) : null;
  return look ? toModelLook(look) : randomTownLook();
}

const actorVals = (r: readonly number[]): number[] => [uqPos(r[2]), 0, uqPos(r[4]), uqAngle(r[5]), r[6]];
const pose4 = (r: readonly number[]): number[] => [uqPos(r[2]), uqPos(r[3]), uqPos(r[4]), uqAngle(r[5])];

export function createEventSync(link: SyncLink, d: EventSyncDeps): SyncAdapter {
  const pieces = new Map<number, KeyPieces>();
  /** My own pieces as of the last collect(): piece id -> the object. */
  const mineNpc = new Map<number, Npc>();
  const mineCar = new Map<number, Vehicle>();
  /** Who last shot into each event (key), for the reward hook. */
  const lastBy = new Map<number, { from: number; t: number }>();
  /** The last frame (peers' positions) for checking a command's sender is near what it shot. */
  let cmdFrame: SyncFrame | null = null;
  /** Every ghost I hold, for update() and ownerGone(). */
  const live = new Set<Ghost>();
  const scratch: number[] = [];

  d.director.setRewardHook((key, n, reason) => {
    const by = lastBy.get(key);
    if (by && link.online() && performance.now() - by.t < SHOT_REWARD_MS) {
      link.pay(by.from, n, reason);
      return true;
    }
    return false;
  });

  function pieceId(key: number, obj: object): number {
    let k = pieces.get(key);
    if (!k) {
      k = { nums: new WeakMap(), next: 1 };
      pieces.set(key, k);
    }
    let n = k.nums.get(obj);
    if (n === undefined) {
      if (k.next > MAX_PIECE) return -1;
      n = k.next++;
      k.nums.set(obj, n);
    }
    return key * PIECES + n;
  }

  function spawn(e: MirrorEnt): Ghost | null {
    const r = e.rec;
    const base = { owner: e.owner, id: e.id };
    switch (r[1]) {
      case KIND.actor: {
        const x = uqPos(r[2]);
        const z = uqPos(r[4]);
        const model = makeGnome(d.scene, lookOf(e.str));
        model.object.position.set(x, heightAt(x, z), z);
        const it = new Interp({ pos: [0, 1, 2], angles: [3], steps: [4], snapDist: 50 });
        it.push(actorVals(r), e.sentAt);
        return { ...base, kind: 'actor', model, it, x, z };
      }
      case KIND.car: {
        const kind = VEHICLE_CODES[r[6]];
        if (!kind) return null;
        const exploded = r[8] === 1;
        // A wreck that was already blown up when I see it is not shown again.
        const v = exploded ? null : createVehicle(d.scene, kind, uqPos(r[2]), uqPos(r[4]), uqAngle(r[5]), r[10]);
        if (v) v.driver = 'remote';
        const it = new Interp({ pos: [0, 1, 2], angles: [3], snapDist: 50 });
        it.push(pose4(r), e.sentAt);
        return { ...base, kind: 'car', v, it, speed: r[9] / 10 };
      }
      case KIND.prop: {
        const o = propObject(e.str ?? '', r[6] / 100);
        o.position.set(uqPos(r[2]), uqPos(r[3]), uqPos(r[4]));
        o.rotation.y = uqAngle(r[5]);
        d.scene.add(o);
        return { ...base, kind: 'prop', o };
      }
      case KIND.head:
        return {
          ...base, kind: 'head', x: uqPos(r[2]), z: uqPos(r[3]),
          def: r[4] >= 0 ? STREET_EVENTS[r[4]] : undefined,
          status: STATUS[r[5]] ?? 'running', called: false,
        };
      default:
        return null;
    }
  }

  function attach(e: MirrorEnt): void {
    const g = spawn(e);
    if (!g) return;
    e.view = g;
    live.add(g);
  }

  function apply(g: Ghost, e: MirrorEnt): void {
    const r = e.rec;
    switch (g.kind) {
      case 'actor':
        g.it.push(actorVals(r), e.sentAt);
        break;
      case 'car': {
        g.speed = r[9] / 10;
        if (!g.v) break;
        if (r[8] === 1) {
          // Blown up: one explosion, then the ghost goes too.
          d.fx.explode(g.v.x, g.v.y, g.v.z);
          removeVehicle(d.scene, g.v);
          g.v = null;
          break;
        }
        g.it.push(pose4(r), e.sentAt);
        break;
      }
      case 'prop':
        g.o.position.set(uqPos(r[2]), uqPos(r[3]), uqPos(r[4]));
        g.o.rotation.y = uqAngle(r[5]);
        break;
      case 'head':
        g.x = uqPos(r[2]);
        g.z = uqPos(r[3]);
        g.status = STATUS[r[5]] ?? g.status;
        break;
    }
  }

  function dispose(g: Ghost): void {
    live.delete(g);
    switch (g.kind) {
      case 'actor': d.scene.remove(g.model.object); break;
      case 'car': if (g.v) removeVehicle(d.scene, g.v); g.v = null; break;
      case 'prop': d.scene.remove(g.o); break;
      case 'head': break;
    }
  }

  function moveActor(g: ActorGhost, dt: number): void {
    if (!g.it.sample(scratch)) return;
    const x = scratch[0];
    const z = scratch[2];
    const yaw = scratch[3];
    const speed = dt > 0 ? Math.hypot(x - g.x, z - g.z) / dt : 0;
    g.x = x;
    g.z = z;
    const y = heightAt(x, z);
    g.model.update(gnomeState(x, y, z, yaw, speed), dt);
    if (NPC_STATES[Math.round(scratch[4])] === 'ragdoll') g.model.object.rotation.x = -Math.PI / 2;
  }

  function moveCar(g: CarGhost, dt: number): void {
    const v = g.v;
    if (!v || !g.it.sample(scratch)) return;
    const [x, y, z, yaw] = scratch;
    // Reversing shows as a negative speed (the wheels turn the other way).
    const back = (x - v.x) * Math.sin(yaw) + (z - v.z) * Math.cos(yaw) < 0;
    v.speed = back ? -g.speed : g.speed;
    v.x = x;
    v.y = y;
    v.z = z;
    v.yaw = yaw;
    syncVehicleMesh(v, dt);
  }

  function callout(g: HeadGhost, f: SyncFrame): void {
    if (g.called || g.status !== 'running' || !g.def) return;
    if (Math.hypot(f.me.x - g.x, f.me.z - g.z) > DIRECTOR.calloutRadius) return;
    g.called = true;
    d.hud.callout?.(g.def.title, g.def.hint);
  }

  return {
    sys: SYS.event,
    radius: 200,
    hz: 4, // 6 before the multiplayer audit (bandwidth); ghosts interpolate between records

    collect(out) {
      mineNpc.clear();
      mineCar.clear();
      const keys = new Set<number>();
      for (const e of d.director.netList()) {
        keys.add(e.key);
        const head = e.key * PIECES;
        out.push({
          id: head, x: e.x, z: e.z,
          rec: [head, KIND.head, qPos(e.x), qPos(e.z), STREET_EVENTS.findIndex((s) => s.id === e.defId), STATUS.indexOf(e.status)],
        });
        const p = e.kit.pieces();
        for (const npc of p.actors) {
          const id = pieceId(e.key, npc);
          if (id < 0) continue;
          mineNpc.set(id, npc);
          out.push({
            id, x: npc.x, z: npc.z,
            rec: [id, KIND.actor, qPos(npc.x), 0, qPos(npc.z), qAngle(npc.yaw), NPC_STATES.indexOf(npc.state)],
            str: encodeLook(fromModelLook(npc.look)),
          });
        }
        for (const v of p.cars) {
          const id = pieceId(e.key, v);
          if (id < 0) continue;
          mineCar.set(id, v);
          out.push({
            id, x: v.x, z: v.z,
            rec: [
              id, KIND.car, qPos(v.x), qPos(v.y), qPos(v.z), qAngle(v.yaw), VEHICLE_CODES.indexOf(v.kind),
              qUnit(v.hp), v.exploded ? 1 : 0, Math.round(Math.abs(v.speed) * 10), Math.round(v.tint),
            ],
          });
        }
        for (const o of p.props) {
          const id = pieceId(e.key, o);
          if (id < 0) continue;
          const scale = typeof o.userData.scale === 'number' ? o.userData.scale : 1;
          out.push({
            id, x: o.position.x, z: o.position.z,
            rec: [id, KIND.prop, qPos(o.position.x), qPos(o.position.y), qPos(o.position.z), qAngle(o.rotation.y), Math.round(scale * 100)],
            str: String(o.userData.prefab ?? ''),
          });
        }
      }
      for (const k of pieces.keys()) if (!keys.has(k)) pieces.delete(k);
    },

    receive(ch: MirrorChanges) {
      for (const e of ch.added) attach(e);
      for (const e of ch.changed) {
        const g = e.view as Ghost | undefined;
        if (g) apply(g, e);
        else attach(e);
      }
      for (const e of ch.removed) {
        const g = e.view as Ghost | undefined;
        if (g) dispose(g);
        e.view = undefined;
      }
    },

    command(from, id, c, a) {
      // Cheat-resistance (docs/roadmaps/gta-multiplayer-audit.md): only a piece that exists, only from a player within a
      // shot's reach of it, and a bounded damage. Anything else earns nothing (lastBy is the reward hook's record).
      const npc = c === 1 ? mineNpc.get(id) : undefined;
      const v = c === 2 ? mineCar.get(id) : undefined;
      const at = npc ?? v;
      if (!at) return;
      const p = cmdFrame?.peers.find((q) => q.id === from);
      if (!p || Math.hypot(p.x - at.x, p.z - at.z) > CMD_REACH_M) return;
      lastBy.set(Math.floor(id / PIECES), { from, t: performance.now() });
      if (npc) {
        if (d.npcs.list.includes(npc)) d.npcs.crack(npc, npc.x, npc.z);
      } else if (v) {
        d.damage(v, Math.max(0, Math.min(50, a[0] ?? SHOT_CAR_PCT)) / 100);
      }
    },

    ownerGone(owner, ents) {
      for (const e of ents) {
        const g = e.view as Ghost | undefined;
        if (g) dispose(g);
        e.view = undefined;
      }
      for (const g of [...live]) if (g.owner === owner) dispose(g);
    },

    update(dt, f) {
      cmdFrame = f;
      d.director.setSpawnGate(f.lead);
      for (const g of live) {
        switch (g.kind) {
          case 'actor': moveActor(g, dt); break;
          case 'car': moveCar(g, dt); break;
          case 'head': callout(g, f); break;
          case 'prop': break;
        }
      }
    },

    hitTest(x, y, z) {
      for (const g of live) {
        if (g.kind === 'actor') {
          const ground = heightAt(g.x, g.z);
          if (Math.hypot(x - g.x, z - g.z) < 0.45 && y >= ground && y <= ground + 1.1) {
            link.command(g.owner, g.id, 1);
            d.fx.crack(x, y, z);
            d.play('crack');
            return true;
          }
        } else if (g.kind === 'car' && g.v) {
          const v = g.v;
          const rad = v.spec.radius;
          if (Math.hypot(x - v.x, z - v.z) < rad * 0.9 && y >= v.y && y <= v.y + 1 + rad * 0.6) {
            link.command(g.owner, g.id, 2, [SHOT_CAR_PCT]);
            d.fx.spark(x, y, z);
            return true;
          }
        }
      }
      return false;
    },

    reset() {
      for (const g of [...live]) dispose(g);
      d.director.setSpawnGate(true);
    },
  };
}
