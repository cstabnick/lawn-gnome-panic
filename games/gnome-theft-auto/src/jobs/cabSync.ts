// Player cabs online: the SYS.cab hub adapter (protocol.ts, cabCalls.ts). As a rider I own one call entity and publish
// it; as a taxi driver I mirror everyone's calls and send take / drop / giveup commands to the caller.
import type { MirrorChanges, MirrorEnt, OwnedEnt, SyncAdapter, SyncFrame, SyncLink } from '../online/hub';
import { SYS } from '../online/protocol';
import {
  driverEnd, driverForget, driverIdle, driverSee, driverStatus, driverTake,
  openCalls, riderCall, riderCancel, riderCommand, riderIdle, riderMoved, riderTick, riderWire,
  type DriverCabs, type JobStatus, type RiderCab, type RiderNote, type SeenCall,
} from './cabCalls';
import { CAB_CMD, decodeCab, decodeDropArgs, encodeCab } from './protocol';
import type { JobsNet } from './types';

export interface CabSync extends SyncAdapter {
  // Rider side.
  /** Call a cab to place `dest` from (x, z): null, or why not ("Already calling.", "Not online."). */
  call(dest: string, name: string, x: number, z: number): string | null;
  cancel(): void;
  rider(): Readonly<RiderCab>;
  /** Rider notes (assigned, riding, paid, reopened, expired, left), one call per note. */
  onRider(cb: (n: Exclude<RiderNote, null>) => void): void;
  /** Every frame: rider position and seat checks (riderMoved / riderTick). */
  tick(x: number, z: number): void;
  // Driver side (only used while on taxi duty).
  open(x: number, z: number): SeenCall[];
  /** Send CAB_CMD.take for `key`: null, or why not. */
  take(key: string): string | null;
  /** The call I took (its latest record), or null. */
  job(): SeenCall | null;
  status(myId: number): JobStatus;
  /** Delivered: CAB_CMD.drop with fare and stars to the caller; job cleared. */
  drop(fare: number, stars: number): void;
  /** Give the job up: CAB_CMD.giveup; job cleared. */
  giveUp(): void;
}

export function createCabSync(link: SyncLink, net: JobsNet, now: () => number = () => performance.now()): CabSync {
  const r: RiderCab = riderIdle();
  let d: DriverCabs = driverIdle();
  const riderNotes: ((n: Exclude<RiderNote, null>) => void)[] = [];

  function emit(n: RiderNote): void {
    if (!n) return;
    for (const cb of riderNotes) cb(n);
  }

  return {
    sys: SYS.cab,
    radius: 900,
    hz: 2,

    collect(out: OwnedEnt[], _f: SyncFrame): void {
      void _f;
      const w = riderWire(r);
      if (!w) return;
      const { rec, str } = encodeCab(w);
      out.push({ id: w.id, x: w.x, z: w.z, rec, str });
    },

    receive(ch: MirrorChanges, _f: SyncFrame | null): void {
      void _f;
      for (const e of [...ch.added, ...ch.changed]) {
        const c = decodeCab(e.rec, e.str);
        if (c) driverSee(d, e.owner, c, now());
      }
      for (const e of ch.removed) driverForget(d, e.owner, e.id);
    },

    command(from: number, id: number, c: number, a: readonly number[]): void {
      const drop = c === CAB_CMD.drop ? decodeDropArgs(a) : null;
      emit(riderCommand(r, from, id, c, drop, now()));
    },

    ownerGone(owner: number, ents: readonly MirrorEnt[]): void {
      for (const e of ents) driverForget(d, owner, e.id);
    },

    update(): void {
      // Nothing per frame: the driver list follows the mirror, the rider follows tick().
    },

    reset(): void {
      d = driverIdle();
      if (r.phase !== 'idle') {
        riderCancel(r);
        emit({ t: 'expired' });
      }
    },

    call(dest: string, name: string, x: number, z: number): string | null {
      if (!link.online()) return 'Online only: no other players here.';
      if (!riderCall(r, name, x, z, dest, now())) return 'You already have a cab coming.';
      return null;
    },

    cancel(): void {
      riderCancel(r);
    },

    rider: () => r,

    onRider(cb: (n: Exclude<RiderNote, null>) => void): void {
      riderNotes.push(cb);
    },

    tick(x: number, z: number): void {
      riderMoved(r, x, z);
      emit(riderTick(r, now(), net.riding()?.host ?? null));
    },

    open(x: number, z: number): SeenCall[] {
      return openCalls(d, x, z);
    },

    take(key: string): string | null {
      const t = driverTake(d, key);
      if (!t) return 'That call is gone.';
      link.command(t.owner, t.id, CAB_CMD.take);
      return null;
    },

    job(): SeenCall | null {
      return d.job ? d.calls.get(d.job) ?? null : null;
    },

    status(myId: number): JobStatus {
      return driverStatus(d, myId);
    },

    drop(fare: number, stars: number): void {
      const e = driverEnd(d);
      if (e) link.command(e.owner, e.id, CAB_CMD.drop, [Math.round(fare), Math.round(stars)]);
    },

    giveUp(): void {
      const e = driverEnd(d);
      if (e) link.command(e.owner, e.id, CAB_CMD.giveup);
    },
  };
}
