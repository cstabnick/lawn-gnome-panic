import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCritters, type CritterCtx, type CritterDeps, type CritterRuntime } from '../critters';
import { SNOWCAP_BEARS } from '../winter/types';
import type { Fx, World } from '../types';
import { BEAR_SHRUGS } from './fells';
import { snowcapLife } from './snowcap';

const fx = { smash() {}, spark() {} } as unknown as Fx;

function makeRuntime() {
  const world = { boxes: [], parked: [], half: 900 } as unknown as World;
  const toasts: string[] = [];
  const deps: CritterDeps = {
    fx, play() {}, toast(t) { toasts.push(t); }, callout() {}, earn() {}, steal: () => 0, hurtPlayer() {},
    event() {},
  };
  const rt: CritterRuntime = createCritters(new THREE.Scene(), world, deps, [snowcapLife]);
  return { rt, world, toasts };
}

const ctx = (over: Partial<CritterCtx> = {}): CritterCtx => ({
  dt: 0.05, time: 0, playerX: 0, playerY: 0, playerZ: 0, playerVehicle: null, playerSpeed: 0,
  vehicles: [], world: { boxes: [], parked: [], half: 900 } as unknown as World, night: 0, ...over,
});

describe('snowcap rise locals', () => {
  it('spawns four polar bears at the snowcap spots, all scripted', () => {
    const { rt } = makeRuntime();
    const bears = rt.list.filter((c) => c.kind === 'polar-bear');
    expect(bears).toHaveLength(4);
    expect(bears).toHaveLength(SNOWCAP_BEARS.length);
    for (const spot of SNOWCAP_BEARS) {
      const b = bears.find((c) => Math.hypot(c.x - spot.x, c.z - spot.z) < 0.5);
      expect(b).toBeDefined();
      expect(b!.mode).toBe('script');
    }
  });

  it('a shot on a bear is shrugged off: it stays put, still scripted, and toasts a shrug', () => {
    const { rt, toasts } = makeRuntime();
    const b = rt.list.find((c) => c.kind === 'polar-bear')!;
    const x0 = b.x, z0 = b.z;
    expect(rt.hitTest(b.x, b.y + 1, b.z)).toBe(true);
    expect(b.mode).toBe('script');
    expect(b.x).toBe(x0);
    expect(b.z).toBe(z0);
    expect(toasts).toHaveLength(1);
    expect(BEAR_SHRUGS).toContain(toasts[0]);
  });

  it('a fast vehicle driven onto the tube bear never moves it off its spot or puts it down', () => {
    const { rt } = makeRuntime();
    const spot = SNOWCAP_BEARS.find((s) => s.pose === 'tube')!;
    const b = rt.list.find((c) => c.kind === 'polar-bear' && Math.hypot(c.x - spot.x, c.z - spot.z) < 0.5)!;
    const x0 = b.x, z0 = b.z;
    const car = { x: b.x, y: 0, z: b.z - 1, speed: 12, exploded: false, spec: { radius: 1.5, flies: false } };
    for (let i = 0; i < 40; i++) {
      rt.update(ctx({ vehicles: [car as never], playerX: b.x, playerZ: b.z + 5, time: i * 0.05 }));
      expect(b.mode).not.toBe('down');
      expect(b.mode).toBe('script');
      expect(b.x).toBe(x0);
      expect(b.z).toBe(z0);
    }
  });
});
