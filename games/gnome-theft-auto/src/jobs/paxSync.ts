// NPC passengers and parcels online: the SYS.pax hub adapter (protocol.ts). The driver publishes what sits in their job
// vehicle; everyone else seats the same NPC models in that player's remote vehicle (visuals.setPassengers).
import type { MirrorChanges, MirrorEnt, OwnedEnt, SyncAdapter, SyncFrame, SyncLink } from '../online/hub';
import { SYS } from '../online/protocol';
import { decodePax, encodePax, type PaxWire } from './protocol';
import type { JobsNet, ParcelKind, Vehicle } from './types';
import type { JobVisuals } from './visuals';

export interface PaxSync extends SyncAdapter {
  /** What I carry now (null = nothing: stop publishing). The vehicle gives the entity's position. */
  setMine(p: PaxWire | null, v: Vehicle | null): void;
}

/** Parcel kinds shown on a shared vehicle, in order. */
const PARCEL_CYCLE: readonly ParcelKind[] = ['mail', 'fragile', 'food'];
/** At most this many parcel props on one vehicle. */
const MAX_PARCELS_SHOWN = 5;
/** How often a mirror checks whether the owner changed vehicles, s. */
const CHECK_EVERY_S = 1;

export function createPaxSync(link: SyncLink, net: JobsNet, visuals: JobVisuals): PaxSync {
  void link;
  let mine: PaxWire | null = null;
  let myVehicle: Vehicle | null = null;
  const shown = new Map<number, { v: Vehicle; p: PaxWire }>();
  let acc = 0;

  function show(owner: number, v: Vehicle, p: PaxWire): void {
    const prev = shown.get(owner);
    if (prev && prev.v !== v) visuals.clearVehicle(prev.v);
    visuals.setPassengers(v, p.seats, 'calm');
    const kinds: ParcelKind[] = [];
    const n = Math.min(p.parcels, MAX_PARCELS_SHOWN);
    for (let i = 0; i < n; i++) kinds.push(PARCEL_CYCLE[i % PARCEL_CYCLE.length]);
    visuals.setParcels(v, kinds);
    shown.set(owner, { v, p });
  }

  function clearOwner(owner: number): void {
    const s = shown.get(owner);
    if (!s) return;
    visuals.clearVehicle(s.v);
    shown.delete(owner);
  }

  return {
    sys: SYS.pax,
    radius: 250,
    hz: 2,

    setMine(p: PaxWire | null, v: Vehicle | null): void {
      mine = p;
      myVehicle = v;
    },

    collect(out: OwnedEnt[], _f: SyncFrame): void {
      void _f;
      if (mine && myVehicle) out.push({ id: 1, x: myVehicle.x, z: myVehicle.z, rec: encodePax(mine) });
    },

    receive(ch: MirrorChanges, _f: SyncFrame | null): void {
      void _f;
      for (const e of [...ch.added, ...ch.changed]) {
        const p = decodePax(e.rec);
        const v = net.vehicleOf(e.owner);
        if (p && v) show(e.owner, v, p);
      }
      for (const e of ch.removed) clearOwner(e.owner);
    },

    ownerGone(owner: number, _ents: readonly MirrorEnt[]): void {
      void _ents;
      clearOwner(owner);
    },

    update(dt: number): void {
      acc += dt;
      if (acc < CHECK_EVERY_S) return;
      acc = 0;
      for (const [owner, s] of [...shown]) {
        const v = net.vehicleOf(owner);
        if (v === s.v) continue;
        // The owner changed vehicles or got out: drop the old one, seat the same passengers in the new one.
        visuals.clearVehicle(s.v);
        shown.delete(owner);
        if (v) show(owner, v, s.p);
      }
    },

    reset(): void {
      for (const s of shown.values()) visuals.clearVehicle(s.v);
      shown.clear();
    },
  };
}
