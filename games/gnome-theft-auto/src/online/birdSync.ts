// Bird flocks (docs/roadmaps/gta-online-sync.md, Issue 1.4): the lead spawns flocks near the players, each flock's owner
// publishes its pose and target, and everyone near mirrors it, so all players watch the same birds. A shot or noise on
// a mirrored flock is sent back to its owner as a flush command.
import type * as THREE from 'three';
import type { Birding } from '../birding/birding';
import { BIRDS } from '../birding/species';
import type { Flock, FlockMode, PerchKind } from '../birding/types';
import type { MirrorChanges, MirrorEnt, OwnedEnt, SyncAdapter, SyncFrame, SyncLink } from './hub';
import { qAngle, qPos, SYS, uqAngle, uqPos } from './protocol';

export interface BirdSyncDeps { birding: Birding; scene: THREE.Scene }

/** Wire codes: the index is the code on the wire. Append only. */
const MODES: readonly FlockMode[] = ['perched', 'flying', 'circling', 'swimming', 'running'];
const KINDS: readonly PerchKind[] = ['roof', 'fence', 'tree', 'ground', 'water', 'shore'];
/** Command 1 to an owner: flush the flock away from the position in the args (qPos x, qPos z). */
const CMD_FLUSH = 1;
/** Largest flock a record may claim (a sanity bound on what the wire can ask us to build). */
const MAX_SIZE = 24;
/** How fast a mirror eases toward the owner's centre and heading (1/s). */
const EASE = 6;

/** Where a mirrored flock's centre and heading are heading. */
interface Aim { x: number; y: number; z: number; heading: number }

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export function createBirdSync(link: SyncLink, d: BirdSyncDeps): SyncAdapter {
  let lead = true;
  // Mirror flock -> the entity it mirrors (for the flush command) and its centre / heading aim.
  const mirrorOf = new Map<Flock, MirrorEnt>();
  const aims = new Map<Flock, Aim>();
  // My flocks' ids on the wire: their own ids are per-client counters, so an adopted flock could clash with one of mine.
  const netIds = new WeakMap<Flock, number>();
  let netSeq = 0;
  const netId = (fl: Flock): number => {
    let id = netIds.get(fl);
    if (id === undefined) { id = ++netSeq; netIds.set(fl, id); }
    return id;
  };

  d.birding.setNet({
    spawning: () => !link.online() || lead,
    flushed(fl: Flock, x: number, z: number) {
      const e = mirrorOf.get(fl);
      if (e) link.command(e.owner, e.id, CMD_FLUSH, [qPos(x), qPos(z)]);
    },
  });

  function drop(fl: Flock): void {
    d.birding.removeFlock(fl);
    mirrorOf.delete(fl);
    aims.delete(fl);
  }

  // Take the owner's target, mode and centre from a record (shared by added and changed).
  function aim(fl: Flock, r: number[]): void {
    fl.mode = MODES[r[3]] ?? fl.mode;
    fl.tx = uqPos(r[8]);
    fl.ty = uqPos(r[9]);
    fl.tz = uqPos(r[10]);
    fl.targetKind = KINDS[r[11]] ?? 'ground';
    aims.set(fl, { x: uqPos(r[4]), y: uqPos(r[5]), z: uqPos(r[6]), heading: uqAngle(r[7]) });
  }

  /** A centre in whole metres, still in the wire's decimetre unit (older clients read it the same way). */
  const qMetre = (v: number): number => qPos(Math.round(v));

  return {
    sys: SYS.flock,
    radius: 160,
    // 1 Hz and whole-metre centres (docs/roadmaps/gta-multiplayer-audit.md, bandwidth): mirrors ease toward the centre
    // anyway, and flying flocks at 4 Hz in decimetres were the biggest idle cost on the wire.
    hz: 1,
    // Perched flocks do not change: resend them every 6 s, not 2 (mirrors lapse after 15 s).
    keyframeMs: 6000,
    staleMs: 15000,

    collect(out: OwnedEnt[]) {
      for (const fl of d.birding.flockList()) {
        if (d.birding.isMirror(fl)) continue;
        const id = netId(fl);
        out.push({
          id,
          x: fl.x,
          z: fl.z,
          rec: [
            id,
            BIRDS.indexOf(fl.species),
            fl.members.length,
            MODES.indexOf(fl.mode),
            qMetre(fl.x),
            qMetre(fl.y),
            qMetre(fl.z),
            qAngle(fl.heading),
            qPos(fl.tx),
            qPos(fl.ty),
            qPos(fl.tz),
            KINDS.indexOf(fl.targetKind),
          ],
        });
      }
    },

    receive(ch: MirrorChanges) {
      for (const e of ch.added) {
        const r = e.rec;
        const sp = BIRDS[r[1]];
        if (!sp) continue;
        const fl = d.birding.addMirrorFlock(
          sp.id, clamp(r[2], 1, MAX_SIZE), uqPos(r[4]), uqPos(r[5]), uqPos(r[6]), MODES[r[3]] ?? 'flying',
        );
        if (!fl) continue;
        e.view = fl;
        mirrorOf.set(fl, e);
        aim(fl, r);
      }
      for (const e of ch.changed) {
        const fl = e.view as Flock | undefined;
        if (fl) aim(fl, e.rec);
      }
      for (const e of ch.removed) {
        const fl = e.view as Flock | undefined;
        if (fl) drop(fl);
        e.view = undefined;
      }
    },

    command(_from: number, id: number, c: number, a: readonly number[]) {
      if (c !== CMD_FLUSH || a.length < 2) return;
      for (const fl of d.birding.flockList()) {
        if (!d.birding.isMirror(fl) && netIds.get(fl) === id) {
          d.birding.flush(fl, uqPos(a[0]), uqPos(a[1]));
          return;
        }
      }
    },

    ownerGone(_owner: number, gone: readonly MirrorEnt[], adopt: (x: number, z: number) => boolean) {
      for (const e of gone) {
        const fl = e.view as Flock | undefined;
        if (!fl) continue;
        if (adopt(fl.x, fl.z)) {
          d.birding.adoptMirror(fl);
          mirrorOf.delete(fl);
          aims.delete(fl);
        } else {
          drop(fl);
        }
        e.view = undefined;
      }
    },

    update(dt: number, f: SyncFrame) {
      lead = f.lead;
      const k = 1 - Math.exp(-EASE * dt);
      for (const [fl, a] of aims) {
        fl.x += (a.x - fl.x) * k;
        fl.y += (a.y - fl.y) * k;
        fl.z += (a.z - fl.z) * k;
        // Shortest arc: the heading turns the way that is less than half a circle.
        const dh = Math.atan2(Math.sin(a.heading - fl.heading), Math.cos(a.heading - fl.heading));
        fl.heading += dh * k;
      }
    },

    reset() {
      for (const fl of [...d.birding.flockList()]) {
        if (d.birding.isMirror(fl)) d.birding.removeFlock(fl);
      }
      mirrorOf.clear();
      aims.clear();
      lead = true;
    },
  };
}
