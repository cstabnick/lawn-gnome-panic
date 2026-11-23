// Other players' gnomes in the world (roadmap 8.8). Each one is a makeGnome model built from the player's look
// (resolveLook: the gear fetched by userId when there is one, else the look code), hat in the player's colour. Its
// movement comes from its `pose` messages through an Interp; it is hidden after 3 s without a pose.
import * as THREE from 'three';
import { buildGear, onLooksChanged, prefetchLooks, resolveLook, type GnomeLook, type GnomeModel } from '@lawn/gnome';
import { Interp } from '@lawn/mp';
import type { NetPlayer, NetSession, RemotePlayers, SimHost } from '../game/types';
import type { DaygMsg } from '../net/protocol';
import { FALLBACK_LOOK, makeGnome } from './gnomes';

const STALE_MS = 3000;

interface Remote {
  key: string;
  id: number;
  player: NetPlayer;
  model: GnomeModel;
  lookKey: string;
  interp: Interp;
  buf: number[];                 // [x, y, z, facing, a] as sampled this frame
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  prev: { x: number; z: number } | null;
  last: number;                  // performance.now() of the newest pose; -Infinity before the first
  held: string | null;           // from the newest pose
  heldShown: string | null;      // what is attached to the hand now
  heldObj: THREE.Object3D | null;
  dead: boolean;
}

export function createRemotePlayers(deps: { scene: THREE.Scene; host: SimHost; session: NetSession }): RemotePlayers {
  const { scene, host, session } = deps;
  const remotes = new Map<string, Remote>();   // by PlayerKey
  const byId = new Map<number, Remote>();      // by session id, for pose messages
  let rosterSig = '';

  const lookFor = (p: NetPlayer): GnomeLook => ({
    ...(resolveLook({ id: p.id, character: p.character, userId: p.userId ?? undefined }) ?? FALLBACK_LOOK),
    hat: p.color,
  });

  const build = (p: NetPlayer): Remote => {
    const look = lookFor(p);
    const model = makeGnome(look);
    scene.add(model.object);
    model.object.visible = false;
    return {
      key: p.key, id: p.id, player: p, model, lookKey: JSON.stringify(look),
      interp: new Interp({ angles: [3], steps: [4], pos: [0, 1, 2], snapDist: 6 }),
      buf: [0, 0, 0, 0, 0], pos: new THREE.Vector3(), vel: new THREE.Vector3(), prev: null,
      last: -Infinity, held: null, heldShown: null, heldObj: null, dead: false,
    };
  };

  /** Swaps in a model when the player's look changed (fetched gear, new colour). The new model shows nothing held yet. */
  const rebuildLook = (r: Remote): void => {
    const look = lookFor(r.player);
    const key = JSON.stringify(look);
    if (key === r.lookKey) return;
    scene.remove(r.model.object);
    r.model = makeGnome(look);
    scene.add(r.model.object);
    r.model.object.visible = false;
    r.lookKey = key;
    r.heldObj = null;
    r.heldShown = null;
    r.dead = false;
    r.prev = null;
  };

  /** Attaches the held prefab to the right hand when the pose names one; anything else is no item. */
  const setHeld = (r: Remote): void => {
    r.heldObj?.removeFromParent();
    r.heldObj = null;
    if (r.held) {
      try {
        r.heldObj = buildGear('hand', r.held);
        r.model.arms.right.add(r.heldObj);
      } catch {
        r.heldObj = null; // not a prefab id: nothing shown
      }
    }
    r.model.setEquipmentOverride?.('hand', r.heldObj !== null);
    r.heldShown = r.held;
  };

  const drop = (r: Remote): void => {
    scene.remove(r.model.object);
  };

  /** Keeps one Remote per other online player in the roster, and asks for their gear when the roster changes. */
  const sync = (): void => {
    const roster = session.players().filter((p) => p.key !== host.me && host.world.players[p.key]?.online === true);
    const sig = roster.map((p) => `${p.key}|${p.id}|${p.userId ?? ''}|${p.character}`).sort().join(';');
    if (sig !== rosterSig) {
      rosterSig = sig;
      void prefetchLooks(roster.map((p) => ({ id: p.id, character: p.character, userId: p.userId ?? undefined })));
    }
    const keep = new Set<string>();
    for (const p of roster) {
      keep.add(p.key);
      let r = remotes.get(p.key);
      if (r && r.id !== p.id) {
        drop(r);
        remotes.delete(p.key);
        r = undefined;
      }
      if (!r) {
        r = build(p);
        remotes.set(p.key, r);
      }
      r.player = p;
      rebuildLook(r);
    }
    for (const [key, r] of [...remotes]) {
      if (keep.has(key)) continue;
      drop(r);
      remotes.delete(key);
    }
    byId.clear();
    for (const r of remotes.values()) byId.set(r.id, r);
  };

  session.onMessage((from: number, m: DaygMsg) => {
    if (m.t !== 'pose') return;
    const r = byId.get(from);
    if (!r) return;
    const p = m.p;
    r.interp.push([p.x, p.y, p.z, p.f, p.a]);
    r.last = performance.now();
    r.held = p.held;
  });

  onLooksChanged(() => {
    for (const r of remotes.values()) rebuildLook(r);
  });

  return {
    update(dt: number): void {
      sync();
      const now = performance.now();
      for (const r of remotes.values()) {
        const show = now - r.last <= STALE_MS;
        r.model.object.visible = show;
        if (!show || !r.interp.sample(r.buf, now)) {
          r.prev = null;
          continue;
        }
        const [x, y, z, f, a] = r.buf;
        const vx = r.prev && dt > 0 ? (x - r.prev.x) / dt : 0;
        const vz = r.prev && dt > 0 ? (z - r.prev.z) / dt : 0;
        r.prev = { x, z };
        if (r.held !== r.heldShown) setHeld(r);
        const dead = a === 4;
        if (dead !== r.dead) {
          r.dead = dead;
          r.model.setDead(dead);
        }
        r.pos.set(x, y, z);
        r.vel.set(vx, 0, vz);
        r.model.update({ position: r.pos, velocity: r.vel, facing: f, grounded: a !== 3, jumpsUsed: 0 }, dt);
      }
    },
    count: (): number => remotes.size,
  };
}
