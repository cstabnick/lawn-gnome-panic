import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCritters, type CritterCtx, type CritterDeps, type CritterRuntime } from '../critters';
import type { Fx, World } from '../types';
import { BEAR_SHRUGS, fellsLife, nightRose, SGNOWME_LINES, sgnowmeLook, SNOWMAN_COUNT } from './fells';

const fx = { smash() {}, spark() {} } as unknown as Fx;

function makeRuntime() {
  const world = { boxes: [], parked: [], half: 900 } as unknown as World;
  const events: string[] = [];
  const toasts: string[] = [];
  const deps: CritterDeps = {
    fx, play() {}, toast(t) { toasts.push(t); }, callout() {}, earn() {}, steal: () => 0, hurtPlayer() {},
    event(id) { events.push(id); },
  };
  const rt: CritterRuntime = createCritters(new THREE.Scene(), world, deps, [fellsLife]);
  return { rt, world, events, toasts };
}

const ctx = (over: Partial<CritterCtx> = {}): CritterCtx => ({
  dt: 0.05, time: 0, playerX: 0, playerY: 0, playerZ: 0, playerVehicle: null, playerSpeed: 0,
  vehicles: [], world: { boxes: [], parked: [], half: 900 } as unknown as World, night: 0, ...over,
});

describe('frostbite fells locals', () => {
  it('spawns five polar bears and four cabin colliders', () => {
    const { rt, world } = makeRuntime();
    const bears = rt.list.filter((c) => c.kind === 'polar-bear');
    expect(bears).toHaveLength(5);
    expect(world.boxes.length).toBe(4);
    expect(SNOWMAN_COUNT).toBe(14);
  });

  it('a shot on a bear is shrugged off: it stays put in script mode and never goes down', () => {
    const { rt } = makeRuntime();
    const b = rt.list.find((c) => c.kind === 'polar-bear')!;
    const x0 = b.x, z0 = b.z;
    expect(rt.hitTest(b.x, b.y + 1, b.z)).toBe(true);
    expect(b.mode).toBe('script');
    expect(Number(b.data.shrugT)).toBeGreaterThan(0);
    expect(b.x).toBe(x0);
    expect(b.z).toBe(z0);
  });

  it('a fast vehicle driven onto a bear leaves it in place and never knocks it down', () => {
    const { rt } = makeRuntime();
    const b = rt.list.find((c) => c.kind === 'polar-bear')!;
    const x0 = b.x, z0 = b.z;
    const car = { x: b.x, y: 0, z: b.z - 1, speed: 12, exploded: false, spec: { radius: 1.5, flies: false } };
    for (let i = 0; i < 20; i++) {
      rt.update(ctx({ vehicles: [car as never], playerX: b.x, playerZ: b.z + 5, time: i * 0.05 }));
      expect(b.mode).not.toBe('down');
    }
    expect(b.mode).toBe('script');
    expect(b.x).toBe(x0);
    expect(b.z).toBe(z0);
  });

  it('bear shrug toasts are throttled and drawn from the list', () => {
    const { rt, toasts } = makeRuntime();
    const b = rt.list.find((c) => c.kind === 'polar-bear')!;
    rt.update(ctx({ time: 0 }));
    rt.hitTest(b.x, b.y + 1, b.z);
    rt.hitTest(b.x, b.y + 1, b.z);
    expect(toasts).toHaveLength(1);
    expect(BEAR_SHRUGS).toContain(toasts[0]);
  });

  it('nightRose fires only on the frame the light crosses 0.6', () => {
    expect(nightRose(0.5, 0.7)).toBe(true);
    expect(nightRose(0.7, 0.8)).toBe(false);
  });

  it('sgnowmeLook wears a white or ice-blue hat from the list', () => {
    const hats = [0xf4f8ff, 0xbfe6ff, 0x9ec6de];
    for (let i = 0; i < 20; i++) expect(hats).toContain(sgnowmeLook().hat);
    expect(SGNOWME_LINES.length).toBeGreaterThan(0);
  });

  it('a snowman smashed by a driven vehicle stands again at nightfall', () => {
    const { rt, events } = makeRuntime();
    const t0 = 0;
    rt.update(ctx({ time: t0, night: 0 }));
    // Snowmen are scene meshes, not critters: find the field's meshes by position and shoot one.
    const snowmen = rt.scene.children.filter((o) => o.position.x < -100 && o.position.x > -150 && o.position.z < -700);
    expect(snowmen.length).toBeGreaterThanOrEqual(SNOWMAN_COUNT);
    const s = snowmen[0];
    expect(rt.hitTest(s.position.x, s.position.y + 1, s.position.z)).toBe(true);
    expect(s.visible).toBe(false);
    expect(events).toContain('snowman-smashed');
    rt.update(ctx({ time: 10, night: 0.7 }));
    expect(s.visible).toBe(true);
  });
});
