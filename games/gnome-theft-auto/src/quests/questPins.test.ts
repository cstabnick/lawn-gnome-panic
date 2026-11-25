import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { Npc, Vehicle } from '../types';
import { createVehicle, explodeVehicle } from '../vehicles';
import { createQuestPins, restoreVehicle } from './questPins';

const car = (x = 0, z = 0): Vehicle => createVehicle(new THREE.Scene(), 'ride-on', x, z, 0);
const npc = (quest?: string): Npc => ({ quest }) as unknown as Npc;

describe('quest pins', () => {
  it('pinVehicle sets questOwned and releaseAll restores the old value (not owned before)', () => {
    const pins = createQuestPins();
    const v = car();
    v.questOwned = undefined;
    pins.pinVehicle(v);
    pins.pinVehicle(v);
    expect(v.questOwned).toBe(true);
    expect(pins.isPinned(v)).toBe(true);
    pins.releaseAll();
    expect(v.questOwned).toBeUndefined();
    expect(pins.isPinned(v)).toBe(false);
  });

  it('releaseAll restores a vehicle that was already questOwned', () => {
    const pins = createQuestPins();
    const v = car();
    v.questOwned = false;
    pins.pinVehicle(v);
    pins.releaseAll();
    expect(v.questOwned).toBe(false);
  });

  it('setRide swaps: the old ride is released, the new one is pinned (questPinned, not questOwned)', () => {
    const pins = createQuestPins();
    const a = car();
    const b = car(5, 5);
    a.questOwned = false;
    pins.setRide(a);
    expect(a.questPinned).toBe(true);
    expect(a.questOwned).toBe(false);
    expect(pins.ride()).toBe(a);
    pins.setRide(b);
    expect(a.questPinned).toBe(false);
    expect(b.questPinned).toBe(true);
    expect(pins.ride()).toBe(b);
    pins.setRide(null);
    expect(b.questPinned).toBeFalsy();
    expect(pins.ride()).toBeNull();
  });

  it('a ride that was also pinned explicitly stays pinned when the ride moves on', () => {
    const pins = createQuestPins();
    const a = car();
    pins.pinVehicle(a);
    pins.setRide(a);
    pins.setRide(car(9, 9));
    expect(a.questOwned).toBe(true);
    expect(pins.isPinned(a)).toBe(true);
  });

  it('pinNpc sets quest when missing and releaseAll restores the previous value', () => {
    const pins = createQuestPins();
    const free = npc();
    const tagged = npc('chapter-2');
    pins.pinNpc(free);
    pins.pinNpc(free);
    pins.pinNpc(tagged);
    expect(free.quest).toBe('pinned');
    expect(tagged.quest).toBe('chapter-2');
    expect(pins.npcs()).toHaveLength(2);
    pins.releaseAll();
    expect(free.quest).toBeUndefined();
    expect(tagged.quest).toBe('chapter-2');
    expect(pins.npcs()).toHaveLength(0);
  });

  it('restoreVehicle on an exploded vehicle clears exploded and sunk, sets hp 1', () => {
    const v = car();
    explodeVehicle(v);
    v.sunk = true;
    v.sunkT = 3;
    v.hp = 0;
    restoreVehicle(v);
    expect(v.exploded).toBe(false);
    expect(v.sunk).toBe(false);
    expect(v.sunkT).toBe(0);
    expect(v.hp).toBe(1);
    expect(v.speed).toBe(0);
  });
});
