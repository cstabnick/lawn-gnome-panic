// Parts that fall off damaged mowers: which parts a stage hides, loose tyres stripped, and thrown pieces landing and fading.
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import {
  DEBRIS, createDebris, forgetLostParts, hiddenBetween, hideLostParts, looseParts, stripLooseParts,
} from './debris';
import { heightAt } from './terrain';
import type { Vehicle } from './types';

/** A fake mower: `object` holds a fresh ride-on-mower body on the ground at the origin, as vehicles.ts lays it out. */
function fakeVehicle(): { v: Vehicle; body: THREE.Group } {
  const y = heightAt(0, 0);
  const object = new THREE.Group();
  const body = buildPrefab('ride-on-mower', { scale: 1.5 }) as THREE.Group;
  body.position.set(0, y, 0);
  object.add(body);
  const v = {
    x: 0, y, z: 0, yaw: 0, speed: 5, tint: 0xd8342c,
    spec: { prefab: 'ride-on-mower', scale: 1.5 }, object,
  } as unknown as Vehicle;
  return { v, body };
}

describe('hiddenBetween', () => {
  it('lists the parts the ride-on mower wrecked stage hides', () => {
    expect(hiddenBetween('ride-on-mower', 0, 2)).toEqual(['wheel-1']);
    expect(hiddenBetween('ride-on-mower', 1, 2)).toEqual(['wheel-1']);
    expect(hiddenBetween('ride-on-mower', 0, 1)).toEqual([]);
  });

  it('gives nothing for an unknown prefab', () => {
    expect(hiddenBetween('no-such-prefab', 0, 2)).toEqual([]);
  });
});

describe('stripLooseParts', () => {
  it('removes fallen tyres and their mirrors, keeps the rest', () => {
    const g = new THREE.Group();
    for (const name of ['fallen-tyre', 'fallen-tyre-mirror', 'wheel-0', 'body']) {
      const m = new THREE.Object3D();
      m.name = name;
      g.add(m);
    }
    expect(stripLooseParts(g)).toBe(2);
    expect(g.children.map((c) => c.name)).toEqual(['wheel-0', 'body']);
  });
});

describe('createDebris', () => {
  it('detach throws the hidden wheel and scraps, lands them, then fades and removes them', () => {
    const scene = new THREE.Scene();
    const debris = createDebris(scene);
    const { v, body } = fakeVehicle();
    const thrown = debris.detach(v, body, 1, 2);
    expect(thrown).toBeGreaterThanOrEqual(1);
    expect(scene.children.length).toBe(thrown);

    for (let t = 0; t < 5; t += 1 / 30) debris.update(1 / 30);
    for (const child of scene.children) {
      const box = new THREE.Box3().setFromObject(child);
      expect(Math.abs(box.min.y - heightAt(child.position.x, child.position.z))).toBeLessThan(0.05);
    }

    for (let t = 0; t < 50; t += 1 / 30) debris.update(1 / 30);
    expect(debris.count()).toBe(0);
    expect(scene.children.length).toBe(0);
  });

  it('burst removes two wheels from the body and throws at least two pieces', () => {
    const debris = createDebris(new THREE.Scene());
    const { v, body } = fakeVehicle();
    const countWheels = () => ['wheel-0', 'wheel-1', 'wheel-2', 'wheel-3']
      .filter((n) => body.getObjectByName(n)).length;
    const before = countWheels();
    expect(debris.burst(v)).toBeGreaterThanOrEqual(2);
    expect(countWheels()).toBe(before - 2);
  });

  it('keeps the number of pieces at or below DEBRIS.max', () => {
    const debris = createDebris(new THREE.Scene());
    let thrown = 0;
    for (let i = 0; i < 15; i++) thrown += debris.burst(fakeVehicle().v);
    expect(thrown).toBeGreaterThan(DEBRIS.max);
    expect(debris.count()).toBeLessThanOrEqual(DEBRIS.max);
  });
});

/** A vehicle-like object with named parts: mirror-l on +x, exhaust on -x, a wheel and a seat (never loose). */
function partVehicle(extraMirrors = 0): Vehicle {
  const object = new THREE.Group();
  const add = (name: string, x: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2));
    m.name = name;
    m.position.set(x, 0.5, z);
    object.add(m);
  };
  add('mirror-l', 1, 0);
  add('exhaust', -1, 0);
  add('wheel-0', 0, 1);
  add('seat', 0, -1);
  for (let i = 0; i < extraMirrors; i++) add(`mirror-x${i}`, 0.5, 0.5 + i * 0.1);
  return { x: 0, y: 0, z: 0, yaw: 0, speed: 0, object, spec: { prefab: 'none', scale: 1 } } as unknown as Vehicle;
}

function showAll(v: Vehicle): void {
  v.object.traverse((o) => { o.visible = true; });
}

function findPart(v: Vehicle, name: string): THREE.Object3D {
  return v.object.getObjectByName(name)!;
}

describe('knockParts', () => {
  afterEach(() => vi.restoreAllMocks());

  it('lists the loose parts and never the wheel or seat', () => {
    const names = looseParts(partVehicle()).map((o) => o.name).sort();
    expect(names).toEqual(['exhaust', 'mirror-l']);
  });

  it('knocks the part on the hit side off', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const debris = createDebris(new THREE.Scene());
    const v = partVehicle();
    const before = debris.count();
    expect(debris.knock(v, 1, 0, 20)).toBeGreaterThanOrEqual(1);
    expect(findPart(v, 'mirror-l').visible).toBe(false);
    expect(debris.count()).toBeGreaterThan(before);
    expect(findPart(v, 'wheel-0').visible).toBe(true);
    expect(findPart(v, 'seat').visible).toBe(true);
  });

  it('does nothing below knockMin', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const debris = createDebris(new THREE.Scene());
    const v = partVehicle();
    expect(debris.knock(v, 1, 0, DEBRIS.knockMin - 1)).toBe(0);
    expect(findPart(v, 'mirror-l').visible).toBe(true);
    expect(debris.count()).toBe(0);
  });

  it('hides a knocked part again after a rebuild, until repair', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const debris = createDebris(new THREE.Scene());
    const v = partVehicle();
    debris.knock(v, 1, 0, 20);

    showAll(v);
    hideLostParts(v);
    expect(findPart(v, 'mirror-l').visible).toBe(false);

    forgetLostParts(v);
    showAll(v);
    hideLostParts(v);
    expect(findPart(v, 'mirror-l').visible).toBe(true);
  });

  it('caps the parts one vehicle loses at knocksPerVehicle', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const debris = createDebris(new THREE.Scene());
    const v = partVehicle(DEBRIS.knocksPerVehicle + 2);
    let total = 0;
    for (let i = 0; i < 10; i++) total += debris.knock(v, 1, 0, DEBRIS.knockMin + 1);
    expect(total).toBe(DEBRIS.knocksPerVehicle);
  });
});
