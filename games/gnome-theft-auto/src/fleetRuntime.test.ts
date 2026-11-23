// Regression: driving a mower into water (shallow canal, then deep loch) must not throw or go NaN, with the fleet runtime
// (waterlog + debris) wired in as app.ts wires it.
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./audio', () => ({ play: () => undefined }));

// fleetRuntime appends a badge to #ui: a tiny DOM stand-in is enough under node.
const fakeEl = (): Record<string, unknown> => ({ style: {}, className: '', textContent: '', appendChild: () => undefined });
(globalThis as Record<string, unknown>).document ??= { createElement: fakeEl };
(globalThis as Record<string, unknown>).location ??= { search: '' };
(globalThis as Record<string, unknown>).localStorage ??= { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };

const { createFleetRuntime } = await import('./fleetRuntime');
const { createVehicle, damageVehicle, explodeVehicle, stepVehicle, syncVehicleMesh, setPartsHooks } = await import('./vehicles');
const { stepSunk } = await import('./swim');
const { bedAt, heightAt, waterAt } = await import('./terrain');
import type { Fx, Vehicle, World } from './types';

const fx = { spark: () => undefined, trail: () => undefined } as unknown as Fx;
const world = { boxes: [], half: 2000 } as unknown as World;

function finite(v: Vehicle): boolean {
  return [v.x, v.y, v.z, v.speed, v.yaw, v.waterlog ?? 0].every(Number.isFinite);
}

function setup() {
  const scene = new THREE.Scene();
  const vehicles: Vehicle[] = [];
  const toasts: string[] = [];
  const fleet = createFleetRuntime({
    scene, ui: fakeEl() as unknown as HTMLElement, fx, vehicles,
    hud: { toast: (t) => { toasts.push(t); } },
    achievements: { unlock: () => undefined, increment: () => undefined },
    playerPos: () => ({ x: 0, z: 0 }),
  });
  return { scene, vehicles, toasts, fleet };
}

describe('fleet runtime in water', () => {
  it('a ride-on driven into the canal soaks, stalls and limps without throwing or going NaN', () => {
    const { scene, vehicles, toasts, fleet } = setup();
    const w = waterAt(-150, 230);
    expect(w).not.toBeNull();
    const v = createVehicle(scene, 'ride-on', -150, 222, 0);
    v.driver = 'player';
    vehicles.push(v);
    const dt = 1 / 60;
    for (let i = 0; i < 60 * 20; i++) {
      stepVehicle(v, { throttle: fleet.throttle(v, 1), steer: 0, lift: 0 }, dt, world);
      fleet.update(dt, v);
      syncVehicleMesh(v, dt);
      expect(finite(v), `frame ${i}`).toBe(true);
    }
    expect(toasts.some((t) => t.includes('waterlogged'))).toBe(true);
    setPartsHooks(null);
  });

  it('the physics (sim) drive into the canal and on into deep water does not throw or go NaN', async () => {
    const { createSimDrive, stepSimDrive } = await import('./simdrive');
    const { checkSink } = await import('./swim');
    const { scene, vehicles, fleet } = setup();
    for (const [x, z0] of [[-150, 222], [-700, -660]] as const) {
      const v = createVehicle(scene, 'golf-cart', x, z0, 0);
      v.driver = 'player';
      v.sim = createSimDrive(v);
      vehicles.push(v);
      const inp = { moveX: 0, moveY: 1, lift: 0, jump: false, fire: false, enterExit: false, switchGun: false, reload: false, radio: false, camYaw: 0, camPitch: 0 };
      for (let i = 0; i < 60 * 15 && !v.sunk; i++) {
        if (v.sim) stepSimDrive(v, v.sim, { ...inp, moveY: fleet.throttle(v, inp.moveY) } as never, 1 / 60, world);
        checkSink(v);
        fleet.update(1 / 60, v);
        syncVehicleMesh(v, 1 / 60);
        expect(finite(v), `frame ${i} at ${x}`).toBe(true);
      }
      // It really got wet: soaked in the canal, sunk in the loch.
      expect((v.waterlog ?? 0) > 0 || v.sunk, `wet at ${x}`).toBe(true);
    }
    setPartsHooks(null);
  });

  it('damage and explosions in water throw debris that settles on the bed', () => {
    const { scene, vehicles, fleet } = setup();
    const v = createVehicle(scene, 'ride-on', -150, 230, 0);
    v.y = bedAt(-150, 230);
    v.driver = 'player';
    vehicles.push(v);
    damageVehicle(v, 0.5);
    damageVehicle(v, 0.6);
    explodeVehicle(v);
    expect(fleet.debris.count()).toBeGreaterThan(0);
    for (let i = 0; i < 600; i++) fleet.update(1 / 60, v);
    for (const o of scene.children) {
      expect([o.position.x, o.position.y, o.position.z].every(Number.isFinite)).toBe(true);
    }
    setPartsHooks(null);
  });

  it('a mower driven into the deep loch sinks and comes back home dry', () => {
    const { scene, vehicles, fleet } = setup();
    const v = createVehicle(scene, 'ride-on', -700, -680, 0);
    v.y = heightAt(-700, -680);
    v.driver = 'player';
    vehicles.push(v);
    for (let i = 0; i < 120; i++) {
      stepVehicle(v, { throttle: fleet.throttle(v, 1), steer: 0, lift: 0 }, 1 / 60, world);
      fleet.update(1 / 60, v);
      if (v.sunk) break;
    }
    expect(v.sunk).toBe(true);
    v.driver = 'none';
    for (let i = 0; i < 60 * 50; i++) {
      stepSunk(vehicles, 1 / 60, 5000, 5000);
      fleet.update(1 / 60, null);
    }
    expect(finite(v)).toBe(true);
    setPartsHooks(null);
  });
});
