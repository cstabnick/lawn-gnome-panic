import { describe, expect, it, vi } from 'vitest';
import type * as THREE from 'three';
import type { PlaceId, Resident } from './config';
import type { Nav, Pt } from './nav';
import type { Town } from './town';
import type { ResidentActor } from './actors';

// The gnome package pulls in three and the platform store. These tests never build a model, so stub it out.
vi.mock('@lawn/gnome', () => ({
  createGnomeModel: () => {
    throw new Error('not used in tests');
  },
  toModelLook: (look: unknown) => look,
}));

// The schedule is replaced by a value each test sets, so no real resident data is needed.
const activity = vi.hoisted(() => ({ at: 'bakery' as string, doing: 'baking', asleep: false }));
vi.mock('./schedule', () => ({
  activityAt: () => ({ ...activity }),
}));

const { Walker, updateResidentActors } = await import('./actors');

function fakeObject(): THREE.Object3D {
  return {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    visible: true,
  } as unknown as THREE.Object3D;
}

const flatTown = { heightAt: () => 0 } as unknown as Town;

describe('Walker', () => {
  it('walks toward the next point at its speed and turns to face it', () => {
    const obj = fakeObject();
    const walker = new Walker(obj, flatTown, { x: 0, z: 0 }, 1);
    walker.setPath([{ x: 3, z: 0 }]);
    expect(walker.moving).toBe(true);
    walker.update(1);
    expect(walker.pos.x).toBeCloseTo(1);
    expect(obj.position.x).toBeCloseTo(1);
    expect(obj.position.y).toBe(0);
    expect(obj.rotation.y).toBeCloseTo(Math.PI / 2);
  });

  it('reaches the point and stops moving', () => {
    const walker = new Walker(fakeObject(), flatTown, { x: 0, z: 0 }, 1);
    walker.setPath([{ x: 3, z: 0 }]);
    for (let i = 0; i < 10; i++) walker.update(1);
    expect(walker.pos.x).toBeCloseTo(3);
    expect(walker.moving).toBe(false);
  });

  it('stop() clears the path', () => {
    const walker = new Walker(fakeObject(), flatTown, { x: 0, z: 0 }, 1);
    walker.setPath([{ x: 3, z: 0 }, { x: 3, z: 3 }]);
    walker.stop();
    expect(walker.moving).toBe(false);
    walker.update(1);
    expect(walker.pos).toEqual({ x: 0, z: 0 });
  });
});

interface FakeNav extends Nav {
  calls: number;
}

function fakeNav(path: Pt[] | null): FakeNav {
  const nav: FakeNav = {
    calls: 0,
    isFree: () => true,
    nearestFree: () => null,
    findPath: () => {
      nav.calls++;
      return path;
    },
  };
  return nav;
}

function fakeActor(place: PlaceId | null, walker: InstanceType<typeof Walker>): ResidentActor {
  return {
    resident: { id: 'nettle' } as unknown as Resident,
    walker,
    place,
    doing: '',
    asleep: false,
  };
}

// One place called 'bakery' at (5, 5), radius 1.
const town = {
  heightAt: () => 0,
  places: { bakery: { id: 'bakery', kind: 'place', label: 'Bakery', x: 5, z: 5, r: 1 } },
} as unknown as Town;

describe('updateResidentActors', () => {
  it('sets the walker path when the place changes', () => {
    activity.at = 'bakery';
    activity.doing = 'baking';
    activity.asleep = false;
    const walker = new Walker(fakeObject(), town, { x: 0, z: 0 }, 1);
    const actor = fakeActor(null, walker);
    const nav = fakeNav([{ x: 1, z: 0 }]);
    updateResidentActors([actor], town, nav, 0, () => 0.5);
    expect(nav.calls).toBe(1);
    expect(walker.moving).toBe(true);
    expect(actor.place).toBe('bakery');
    expect(actor.doing).toBe('baking');
  });

  it('does nothing when the place has not changed', () => {
    activity.at = 'bakery';
    activity.asleep = false;
    const walker = new Walker(fakeObject(), town, { x: 0, z: 0 }, 1);
    const actor = fakeActor('bakery', walker);
    const nav = fakeNav([{ x: 1, z: 0 }]);
    updateResidentActors([actor], town, nav, 0, () => 0.5);
    expect(nav.calls).toBe(0);
    expect(walker.moving).toBe(false);
  });

  it('keeps the old place when no path is found, so the next call retries', () => {
    activity.at = 'bakery';
    activity.asleep = false;
    const walker = new Walker(fakeObject(), town, { x: 0, z: 0 }, 1);
    const actor = fakeActor(null, walker);
    updateResidentActors([actor], town, fakeNav(null), 0, () => 0.5);
    expect(actor.place).toBe(null);
    expect(walker.moving).toBe(false);
  });

  it('hides a sleeping resident and stops them', () => {
    activity.at = 'bakery';
    activity.asleep = true;
    const obj = fakeObject();
    const walker = new Walker(obj, town, { x: 0, z: 0 }, 1);
    const actor = fakeActor('bakery', walker);
    updateResidentActors([actor], town, fakeNav([{ x: 1, z: 0 }]), 0, () => 0.5);
    expect(obj.visible).toBe(false);
    expect(actor.asleep).toBe(true);
    expect(walker.moving).toBe(false);
    activity.asleep = false;
  });
});
