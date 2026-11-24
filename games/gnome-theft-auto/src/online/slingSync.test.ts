import { describe, expect, it } from 'vitest';
import type * as THREE from 'three';
import type { Lockup } from '../lockup/runtime';
import type { SlingState } from '../lockup/types';
import type { OwnedEnt, SyncFrame, SyncLink } from './hub';
import { createSlingSync } from './slingSync';

function fakeLink(): SyncLink {
  return { command() {}, pay() {}, online: () => true, myId: () => 1 };
}

const frame = {} as SyncFrame;

describe('createSlingSync (collect)', () => {
  it('pushes nothing when no Sling-Lift is in the air', () => {
    const lockup = { slingWire: () => null } as unknown as Lockup;
    const adapter = createSlingSync(fakeLink(), { lockup, scene: {} as THREE.Scene });
    const out: OwnedEnt[] = [];
    adapter.collect(out, frame);
    expect(out).toHaveLength(0);
  });

  it('publishes one 10-number record with id 1 while the flight is up', () => {
    const state: SlingState = { phase: 'lowering', t: 0, hx: 1, hy: 20, hz: 2, heading: 0, loadY: 15, released: false };
    const lockup = { slingWire: () => ({ state, kind: 'ride-on', tint: 0 }) } as unknown as Lockup;
    const adapter = createSlingSync(fakeLink(), { lockup, scene: {} as THREE.Scene });
    const out: OwnedEnt[] = [];
    adapter.collect(out, frame);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe(1);
    expect(out[0].rec).toHaveLength(10);
    expect(out[0].rec[0]).toBe(1);
    expect(out[0].rec.every(Number.isInteger)).toBe(true);
  });
});
