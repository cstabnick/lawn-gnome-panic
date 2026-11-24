// Hunting quarry online (docs/roadmaps/gta-online-sync.md, Issue 1.3): each quarry is owned by the highest-ranked player
// near it. The owner steps it and publishes its record; everyone else mirrors it. A guest's shot or comb is sent to the
// owner. Quarry the plan seeded have ids below REMOTE_ID; debug spawns (100000+) stay local.
import type { Hunting, HuntNet } from '../hunting/hunting';
import type { Quarry } from '../hunting/quarry';
import { SPECIES } from '../hunting/species';
import type { SyncAdapter, SyncFrame, SyncLink } from './hub';
import { SYS, qAngle, qPos, qUnit, uqAngle, uqPos, uqUnit } from './protocol';
import type { MirrorChanges, MirrorEnt, OwnedEnt } from './replicate';

export interface HuntSyncDeps { hunting: Hunting }

/** Wire code = index. Matches QuarryMode in quarry.ts. */
export const MODES = ['graze', 'walk', 'wary', 'flee', 'rolled', 'flying', 'burrowed', 'down', 'hidden'] as const;

/** Ids from here up are local-only debug spawns (hunting.ts spawn). */
const REMOTE_ID = 100000;
/** Quarry within this distance of me get an owner; farther ones are dropped from the owner map. */
const OWN_RANGE = 400;
/** Noise a remote gnome makes to the quarry it is stepping against (walking pace). */
const FOCUS_NOISE = 0.45;
/** A mirrored quarry farther than this from its record is put straight there instead of eased. */
const SNAP_DIST = 20;
/** Easing rate toward a mirrored target (1/s). */
const EASE = 8;

interface Target { x: number; y: number; z: number; yaw: number }

function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

export function createHuntSync(link: SyncLink, d: HuntSyncDeps): SyncAdapter {
  /** Quarry id -> the player that owns it (null: nobody near it yet). */
  const owners = new Map<number, number | null>();
  /** Mirrored quarry id -> where its record says it is. */
  const targets = new Map<number, Target>();
  const byId = new Map<number, Quarry>();
  let indexedLen = -1;
  let lastFrame: SyncFrame | null = null;

  function index(): void {
    const list = d.hunting.list;
    if (list.length === indexedLen) return;
    indexedLen = list.length;
    byId.clear();
    for (const q of list) byId.set(q.id, q);
  }

  function owns(q: Quarry): boolean {
    if (q.id >= REMOTE_ID || !link.online()) return true;
    const o = owners.get(q.id) ?? null;
    return o === null || o === link.myId();
  }

  const net: HuntNet = {
    owns,
    focus(q) {
      const f = lastFrame;
      if (!f) return null;
      let best = f.me;
      let bd = Math.hypot(f.me.x - q.x, f.me.z - q.z);
      for (const p of f.peers) {
        const dd = Math.hypot(p.x - q.x, p.z - q.z);
        if (dd < bd) { bd = dd; best = p; }
      }
      if (best === f.me || best.id === f.myId) return null;
      return { x: best.x, z: best.z, noise: FOCUS_NOISE };
    },
    shot(q, fx, fz, dist) {
      const owner = owners.get(q.id);
      if (typeof owner === 'number') link.command(owner, q.id, 1, [qPos(fx), qPos(fz), qPos(dist)]);
    },
    combed(q) {
      const owner = owners.get(q.id);
      if (typeof owner === 'number') link.command(owner, q.id, 2, [qPos(q.x), qPos(q.z)]);
    },
  };
  d.hunting.setNet(net);

  function applyRecord(e: MirrorEnt): void {
    const r = e.rec;
    const q = byId.get(e.id);
    if (!q || r.length < 13) return;
    if (r[1] !== SPECIES.indexOf(q.species)) return;
    if (owners.get(q.id) === link.myId()) return;
    const m = MODES[r[6]];
    const changed = !!m && m !== q.mode;
    if (m) q.mode = m;
    if (changed || Math.abs(q.modeT - r[7] / 10) > 1.5) q.modeT = r[7] / 10;
    q.awareness = uqUnit(r[8]);
    q.tip = r[9] / 100;
    q.lift = r[10] / 100;
    if (changed || Math.abs(q.combedT - r[11] / 10) > 1.5) q.combedT = r[11] / 10;
    q.speed = r[12] / 10;
    const t: Target = { x: uqPos(r[2]), y: uqPos(r[3]), z: uqPos(r[4]), yaw: uqAngle(r[5]) };
    if (Math.hypot(q.x - t.x, q.z - t.z) > SNAP_DIST) {
      q.x = t.x; q.y = t.y; q.z = t.z; q.yaw = t.yaw;
    }
    targets.set(q.id, t);
  }

  return {
    sys: SYS.quarry,
    radius: 160,
    hz: 5,
    collect(out: OwnedEnt[], f: SyncFrame) {
      index();
      for (const q of d.hunting.list) {
        if (q.id >= REMOTE_ID) continue;
        if (owners.get(q.id) !== f.myId) continue;
        const rec = [
          q.id,
          SPECIES.indexOf(q.species),
          qPos(q.x),
          qPos(q.y),
          qPos(q.z),
          qAngle(q.yaw),
          MODES.indexOf(q.mode),
          // Clocks in whole seconds (capped at 60 s) and awareness in tenths: the record does not change every tick while
          // an animal grazes (bandwidth; mirrors run their own clocks between records, see update()).
          Math.min(600, Math.floor(Math.max(0, q.modeT)) * 10),
          Math.round(Math.max(0, Math.min(1, q.awareness)) * 10) * 10,
          Math.round(q.tip * 100),
          Math.round(q.lift * 100),
          Math.min(600, Math.ceil(Math.max(0, q.combedT)) * 10),
          Math.round(q.speed * 10),
        ];
        out.push({ id: q.id, x: q.x, z: q.z, rec });
      }
    },
    receive(ch: MirrorChanges) {
      index();
      for (const e of ch.added) applyRecord(e);
      for (const e of ch.changed) applyRecord(e);
      for (const e of ch.removed) targets.delete(e.id);
    },
    command(_from: number, id: number, c: number, a: readonly number[]) {
      index();
      const q = byId.get(id);
      if (!q) return;
      if (c === 1 && a.length >= 3) d.hunting.remoteShot(q, uqPos(a[0]), uqPos(a[1]), uqPos(a[2]));
      else if (c === 2 && a.length >= 2) d.hunting.remoteComb(q, uqPos(a[0]), uqPos(a[1]));
    },
    ownerGone(owner: number, ents: readonly MirrorEnt[]) {
      for (const [id, o] of owners) if (o === owner) owners.delete(id);
      for (const e of ents) targets.delete(e.id);
    },
    update(dt: number, f: SyncFrame) {
      lastFrame = f;
      index();
      for (const q of d.hunting.list) {
        if (q.id >= REMOTE_ID) continue;
        if (Math.hypot(q.x - f.me.x, q.z - f.me.z) <= OWN_RANGE) {
          owners.set(q.id, f.ownerOf(q.x, q.z, owners.get(q.id) ?? null));
        } else {
          owners.delete(q.id);
        }
      }
      const k = 1 - Math.exp(-EASE * dt);
      for (const q of d.hunting.list) {
        if (owns(q)) continue;
        const t = targets.get(q.id);
        if (!t) continue;
        q.modeT += dt;
        q.combedT = Math.max(0, q.combedT - dt);
        q.x += (t.x - q.x) * k;
        q.y += (t.y - q.y) * k;
        q.z += (t.z - q.z) * k;
        q.yaw += wrapAngle(t.yaw - q.yaw) * k;
      }
    },
    reset() {
      owners.clear();
      targets.clear();
      lastFrame = null;
    },
  };
}
