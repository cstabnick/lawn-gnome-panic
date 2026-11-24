// Parts knocked off on a hard hit: a head-on wall hit throws a part, a nudge does not, a damage rebuild keeps a knocked part
// off and a repair shows it again.
import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./audio', () => ({ play: () => undefined }));

const fakeEl = (): Record<string, unknown> => ({ style: {}, className: '', textContent: '', appendChild: () => undefined });
(globalThis as Record<string, unknown>).document ??= { createElement: fakeEl };
(globalThis as Record<string, unknown>).location ??= { search: '' };
(globalThis as Record<string, unknown>).localStorage ??= { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };

const { createFleetRuntime } = await import('./fleetRuntime');
const { createVehicle, damageVehicle, repairVehicle, setPartsHooks, stepVehicle, syncVehicleMesh } = await import('./vehicles');
import type { Fx, Vehicle, World } from './types';

const fx = { spark: () => undefined, trail: () => undefined } as unknown as Fx;
// A wall across the car's path: its near face is at z = 3.
const wall = { minX: -20, maxX: 20, minZ: 3, maxZ: 4, h: 5 };
const world = { boxes: [wall], half: 600 } as unknown as World;

function setup() {
  const scene = new THREE.Scene();
  const vehicles: Vehicle[] = [];
  createFleetRuntime({
    scene, ui: fakeEl() as unknown as HTMLElement, fx, vehicles,
    hud: { toast: () => undefined },
    achievements: { unlock: () => undefined, increment: () => undefined },
    playerPos: () => ({ x: 0, z: 0 }),
  });
  return { scene, vehicles };
}

/** Names of the visible, named parts under v. */
function visibleNames(v: Vehicle): Set<string> {
  const out = new Set<string>();
  v.object.traverse((o) => { if (o.visible && o.name) out.add(o.name); });
  return out;
}

/** Drive v straight at the wall at `speed` until it hits. Returns true when it hit. */
function driveInto(v: Vehicle, speed: number): boolean {
  v.speed = speed;
  const dt = 1 / 60;
  for (let i = 0; i < 240; i++) {
    stepVehicle(v, { throttle: 0, steer: 0, lift: 0 }, dt, world);
    syncVehicleMesh(v, dt);
    if (v.speed < speed * 0.5) return true;
  }
  return false;
}

/** Every object named n under v. */
function objectsNamed(v: Vehicle, n: string): THREE.Object3D[] {
  const objs: THREE.Object3D[] = [];
  v.object.traverse((o) => { if (o.name === n) objs.push(o); });
  return objs;
}

afterEach(() => {
  setPartsHooks(null);
  vi.restoreAllMocks();
});

describe('parts knocked off on hard hits', () => {
  it('a 15 m/s head-on wall hit throws a part off the hit side', () => {
    const { scene, vehicles } = setup();
    const v = createVehicle(scene, 'ride-on', 0, 0, 0);
    vehicles.push(v);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const pieces = scene.children.length;
    expect(driveInto(v, 15)).toBe(true);
    // Each piece thrown is added to the scene (a named part's copy, or a scrap panel for a model without one).
    expect(scene.children.length).toBeGreaterThan(pieces);
  });

  it('a 3 m/s nudge into the wall loses no part', () => {
    const { scene, vehicles } = setup();
    const v = createVehicle(scene, 'ride-on', 0, 0, 0);
    vehicles.push(v);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const pieces = scene.children.length;
    expect(driveInto(v, 3)).toBe(true);
    expect(scene.children.length).toBe(pieces);
  });

  it('a knocked part stays off through a damage rise and comes back on repair', () => {
    const { scene, vehicles } = setup();
    const v = createVehicle(scene, 'ride-on', 0, 0, 0);
    vehicles.push(v);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const before = visibleNames(v);
    driveInto(v, 15);
    const lostNames = [...before].filter((n) => !visibleNames(v).has(n));
    expect(lostNames.length).toBeGreaterThan(0);

    damageVehicle(v, 0.5);
    expect(v.damage).toBeGreaterThan(0);
    expect(lostNames.every((n) => objectsNamed(v, n).length > 0 && objectsNamed(v, n).every((o) => !o.visible))).toBe(true);

    repairVehicle(v);
    expect(v.damage).toBe(0);
    expect(lostNames.every((n) => objectsNamed(v, n).some((o) => o.visible))).toBe(true);
  });
});
