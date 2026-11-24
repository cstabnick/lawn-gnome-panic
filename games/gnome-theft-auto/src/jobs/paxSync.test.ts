import { describe, expect, it } from 'vitest';
import type { MirrorEnt, SyncLink } from '../online/hub';
import { createPaxSync } from './paxSync';
import type { JobsNet, Vehicle } from './types';
import type { JobVisuals } from './visuals';

/** A fake visuals object that records every call. */
function fakeVisuals(calls: string[]): JobVisuals {
  return {
    showWaiting: () => undefined,
    hideWaiting: () => undefined,
    setPassengers: (v, seats) => { calls.push(`setPassengers:${seats.length}`); },
    setParcels: (v, kinds) => { calls.push(`setParcels:${kinds.length}`); },
    setSign: () => undefined,
    clearVehicle: () => { calls.push('clearVehicle'); },
    buildDepots: () => ({ spots: [], boxes: [] }),
    dropCrate: () => undefined,
    update: () => undefined,
  };
}

const link = {
  command() {},
  pay() {},
  online: () => true,
  myId: () => 1,
} as SyncLink;

const vehicle = { x: 3, z: 4 } as unknown as Vehicle;
const ownerVehicle = { x: 30, z: 40 } as unknown as Vehicle;
const net = {
  vehicleOf: (id: number) => (id === 5 ? ownerVehicle : null),
} as unknown as JobsNet;

describe('createPaxSync', () => {
  it('publishes my passengers and parcels from my vehicle', () => {
    const calls: string[] = [];
    const pax = createPaxSync(link, net, fakeVisuals(calls));
    pax.setMine({ parcels: 2, seats: [[3, 4]] }, vehicle);
    const out: { id: number; x: number; z: number; rec: number[] }[] = [];
    pax.collect(out, {} as never);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe(1);
    expect(out[0].rec).toEqual([1, 2, 3, 4]);
  });

  it('seats the owner passengers on receive and clears on removed', () => {
    const calls: string[] = [];
    const pax = createPaxSync(link, net, fakeVisuals(calls));
    const ent: MirrorEnt = { owner: 5, id: 1, rec: [1, 1, 2, 9], str: undefined, seenAt: 0, sentAt: 0 };

    pax.receive({ added: [ent], changed: [], removed: [] }, null);
    expect(calls).toContain('setPassengers:1');

    calls.length = 0;
    pax.receive({ added: [], changed: [], removed: [ent] }, null);
    expect(calls).toEqual(['clearVehicle']);
  });
});
