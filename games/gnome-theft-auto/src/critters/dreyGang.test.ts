import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createCritters, type CritterCtx, type CritterDeps, type CritterEvent } from '../critters';

// dreyGang.ts imports seatWorld from vehicles.ts, which pulls in audio.ts: that module wires a window keydown
// listener at load. Node has no window, so give it a stub before the imports run.
vi.hoisted(() => {
  const g = globalThis as { window?: unknown };
  if (!g.window) g.window = { addEventListener() {}, removeEventListener() {} };
});

import type { Fx, Vehicle, World } from '../types';
import { canSteal, DREY_DENS, dreyGangLife } from './dreyGang';

const newWorld = (): World => ({ boxes: [], parked: [], half: 900 } as unknown as World);
const fx = { smash() {}, spark() {} } as unknown as Fx;

function makeDeps(over: Partial<CritterDeps> = {}): CritterDeps {
  return {
    fx, play() {}, toast() {}, callout() {}, earn() {}, steal: () => 0, hurtPlayer() {}, event() {}, ...over,
  };
}

const ctx = (world: World, over: Partial<CritterCtx> = {}): CritterCtx => ({
  dt: 0.05, time: 0, playerX: 0, playerY: 0, playerZ: 0, playerVehicle: null, playerSpeed: 0,
  vehicles: [], world, night: 0, ...over,
});

describe('Drey Gang', () => {
  it('spawns three dens of 6, 6 and 8 squirrels in cloverfield-farms', () => {
    const world = newWorld();
    const rt = createCritters(new THREE.Scene(), world, makeDeps(), [dreyGangLife]);
    expect(DREY_DENS.map((d) => d.id)).toEqual(['drey-hedge-west', 'drey-hedge-east', 'drey-silo']);
    expect(rt.inGroup('drey-hedge-west')).toHaveLength(6);
    expect(rt.inGroup('drey-hedge-east')).toHaveLength(6);
    expect(rt.inGroup('drey-silo')).toHaveLength(8);
    for (const c of rt.list) {
      expect(c.kind).toBe('squirrel');
      expect(c.region).toBe('cloverfield-farms');
    }
  });

  it('a raid on foot causes pocket picks and a drey-raid event, and nothing is removed', () => {
    const world = newWorld();
    let stolen = 0;
    const events: CritterEvent[] = [];
    const rt = createCritters(new THREE.Scene(), world, makeDeps({
      steal: (n) => { stolen += n; return n; },
      event: (id) => { events.push(id); },
    }), [dreyGangLife]);
    const centre = rt.inGroup('drey-hedge-west')[0];
    for (let i = 0; i < 400; i++) {
      rt.update(ctx(world, { time: i * 0.05, playerX: centre.homeX + 20, playerZ: centre.homeZ }));
    }
    expect(stolen).toBeGreaterThan(0);
    expect(events).toContain('drey-raid');
    expect(rt.list).toHaveLength(20);
  });

  it('shooting one squirrel knocks it over and scatters at least 3 of its den mates', () => {
    const world = newWorld();
    const rt = createCritters(new THREE.Scene(), world, makeDeps(), [dreyGangLife]);
    const centre = rt.inGroup('drey-hedge-west')[0];
    rt.update(ctx(world, { time: 0, playerX: centre.homeX + 20, playerZ: centre.homeZ }));
    const target = centre;
    expect(rt.hitTest(target.x, target.y + 0.3, target.z)).toBe(true);
    const down = rt.list.filter((c) => c.mode === 'down');
    expect(down).toHaveLength(1);
    expect(down[0].group).toBe('drey-hedge-west');
    const fleeing = rt.inGroup('drey-hedge-west').filter((c) => c !== down[0] && c.mode === 'flee');
    expect(fleeing.length).toBeGreaterThanOrEqual(3);
  });

  it('canSteal: a free parked ride-on near the den only', () => {
    const den = DREY_DENS[0];
    const far = { x: den.x + 500, z: den.z };
    const veh = (over: Record<string, unknown> = {}): Vehicle => ({
      x: den.x + 30, z: den.z, kind: 'ride-on', driver: 'none', questOwned: false, exploded: false,
      spec: { flies: false }, ...over,
    }) as unknown as Vehicle;
    expect(canSteal(veh(), den.x, den.z, far.x, far.z)).toBe(true);
    expect(canSteal(veh({ driver: 'player' }), den.x, den.z, far.x, far.z)).toBe(false);
    expect(canSteal(veh({ questOwned: true }), den.x, den.z, far.x, far.z)).toBe(false);
    expect(canSteal(veh({ x: den.x + 80 }), den.x, den.z, far.x, far.z)).toBe(false);
  });
});
