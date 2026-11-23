import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { encodeLoadout } from '@lawn/glaze';

vi.mock('../audio', () => ({ play: () => undefined }));
const { cannotStore, restoreVehicle, snapshotVehicle, storageKindOf } = await import('./snapshot');
const { createVehicle, damageVehicle } = await import('../vehicles');

describe('storageKindOf', () => {
  it('sorts ground, air and water vehicles', () => {
    expect(storageKindOf(createVehicle(new THREE.Scene(), 'ride-on', 0, 0, 0, 0x2f64c9))).toBe('ground');
    expect(storageKindOf(createVehicle(new THREE.Scene(), 'plane', 0, 0, 0, 0x2f64c9))).toBe('air');
    expect(storageKindOf(createVehicle(new THREE.Scene(), 'clog-cruiser', 0, 0, 0, 0x2f64c9))).toBe('water');
  });
});

describe('cannotStore', () => {
  it('refuses wrecks', () => {
    const v = createVehicle(new THREE.Scene(), 'zero-turn', 0, 0, 0, 0x2f64c9);
    v.exploded = true;
    expect(cannotStore(v, 'ground', true)).toBe('That is a wreck. Tansy does not store wrecks.');
  });

  it('refuses a vehicle of the wrong kind', () => {
    const v = createVehicle(new THREE.Scene(), 'zero-turn', 0, 0, 0, 0x2f64c9);
    expect(cannotStore(v, 'air', true)).toBe('The hangar only takes aircraft.');
    expect(cannotStore(v, 'water', true)).toBe('The boathouse only takes boats.');
    expect(cannotStore(v, 'ground', true)).toBeNull();
  });

  it('refuses Tessie for the boathouse', () => {
    const v = createVehicle(new THREE.Scene(), 'tessie', 0, 0, 0, 0x2f64c9);
    expect(cannotStore(v, 'water', true)).toBe('Tessie belongs to the loch, not to a boathouse.');
  });

  it('refuses a quest vehicle unless the player owns it', () => {
    const v = createVehicle(new THREE.Scene(), 'zero-turn', 0, 0, 0, 0x2f64c9);
    v.questOwned = true;
    expect(cannotStore(v, 'ground', false)).toBe('That one is spoken for (a job or a boat on its mooring).');
    expect(cannotStore(v, 'ground', true)).toBeNull();
  });
});

describe('snapshot round trip', () => {
  it('restores kind, name, tint, look and damage', () => {
    const scene = new THREE.Scene();
    const v = createVehicle(scene, 'zero-turn', 0, 0, 0, 0x2f64c9);
    damageVehicle(v, 0.4);
    const snap = snapshotVehicle(v);
    const r = restoreVehicle(scene, { ...snap, uid: 'lk-test', storedAt: 1 }, 5, 5, 1);
    expect(r.kind).toBe(v.kind);
    expect(r.spec.name).toBe(v.spec.name);
    expect(r.tint).toBe(v.tint);
    if (v.look) expect(encodeLoadout(r.look!)).toBe(encodeLoadout(v.look));
    expect(r.hp).toBeCloseTo(v.hp, 2);
    expect(r.questOwned).toBe(true);
    expect(r.x).toBe(5);
  });

  it('restores the fleet variant', () => {
    const scene = new THREE.Scene();
    const r = restoreVehicle(
      scene,
      { uid: 'lk-test', kind: 'golf-cart', variant: 'golf-cart', name: 'Golf Cart', tint: 0x2f64c9, look: null, hp: 1, enginePitch: null, storedAt: 1 },
      0, 0, 0,
    );
    expect(r.variant).toBe('golf-cart');
  });
});
