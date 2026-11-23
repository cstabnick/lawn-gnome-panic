import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { Fx, Npc, Player, Vehicle, World } from '../types';
import { STREET_EVENTS } from './catalog';
import type { Actor, Car, CarOpts, EventAnchor, EventKit, EventStatus, GnomeOpts } from './types';

const CATEGORIES = ['police', 'crime', 'scene', 'traffic', 'wild'];
const STATUSES: EventStatus[] = ['running', 'done', 'failed', 'gone'];

/** Seeded LCG so every run is the same. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface Harness {
  kit: EventKit;
  /** Advance the fake world by dt seconds: moves actors and cars towards their goals, then the kit clock. */
  tick(dt: number): void;
}

/** A fake kit. The player is far away (200, 200) and does nothing. Actors and cars move towards their goals. */
function makeHarness(): Harness {
  const clock = { t: 0 };
  const rand = lcg(1234);
  const movers: Array<(dt: number) => void> = [];
  const player = { x: 200, z: 200, vehicle: null, health: 1, hurt() {} };

  function makeActor(o: GnomeOpts): Actor {
    let x = o.x;
    let z = o.z;
    let gx = o.x;
    let gz = o.z;
    const a: Actor = {
      npc: {} as Npc,
      name: o.name ?? 'Test Gnome',
      x: () => x,
      z: () => z,
      walkTo(tx, tz) { gx = tx; gz = tz; },
      runTo(tx, tz) { gx = tx; gz = tz; },
      hold(hx, hz) { gx = hx ?? x; gz = hz ?? z; },
      face() {},
      flee(fx, fz) { gx = x + Math.sign(x - fx || 1) * 8; gz = z + Math.sign(z - fz || 1) * 8; },
      arrived: (r = 1) => Math.hypot(x - gx, z - gz) <= r,
      cracked: () => false,
      down: () => false,
      stopped: () => false,
      remove() {},
    };
    movers.push((dt) => {
      const d = Math.hypot(gx - x, gz - z);
      if (d === 0) return;
      const step = Math.min(d, 4 * dt);
      x += ((gx - x) / d) * step;
      z += ((gz - z) / d) * step;
    });
    return a;
  }

  function makeCar(o: CarOpts): Car {
    const v = { x: o.x, z: o.z, yaw: o.yaw, speed: 0, driver: 'npc', exploded: false, object: new THREE.Group() };
    let gx = o.x;
    let gz = o.z;
    let follow: (() => { x: number; z: number }) | null = null;
    movers.push((dt) => {
      if (follow) {
        const p = follow();
        gx = p.x;
        gz = p.z;
      }
      const d = Math.hypot(gx - v.x, gz - v.z);
      if (d === 0) return;
      const step = Math.min(d, 10 * dt);
      v.x += ((gx - v.x) / d) * step;
      v.z += ((gz - v.z) / d) * step;
    });
    return {
      v: v as unknown as Vehicle,
      driveTo(x, z) { follow = null; gx = x; gz = z; },
      follow(target) { follow = typeof target === 'function' ? target : () => target; },
      stop() { follow = null; gx = v.x; gz = v.z; },
      arrived: (r = 8) => Math.hypot(v.x - gx, v.z - gz) <= r,
      stolen: () => false,
      wrecked: () => v.exploded,
      lost: () => false,
      eject: () => makeActor({ x: v.x, z: v.z }),
    };
  }

  // Any fx call is a no-op.
  const fx = new Proxy({}, { get: () => () => {} }) as unknown as Fx;

  const kit: EventKit = {
    get t() { return clock.t; },
    player: player as unknown as Player,
    world: {} as unknown as World,
    fx,
    rand,
    pick<T>(list: readonly T[]): T {
      return list[Math.floor(rand() * list.length) % list.length];
    },
    ground: () => 0,
    dist: (x, z) => Math.hypot(x - player.x, z - player.z),
    near: (x, z, r) => Math.hypot(x - player.x, z - player.z) <= r,
    px: () => player.x,
    pz: () => player.z,
    inVehicle: () => false,
    offRoad: (x: number, z: number) => ({ x, z }),
    spot: (_kind, min, _max, fromX = 0, fromZ = 0): EventAnchor | null => ({ x: fromX + min, z: fromZ, yaw: 0 }),
    gnome: makeActor,
    car: makeCar,
    prop: () => new THREE.Group(),
    dropProp: () => {},
    say: () => {},
    tell: () => {},
    sfx: () => {},
    addHeat: () => {},
    heat: () => 0,
    reward: () => {},
    charge: () => true,
    heal: () => {},
  };

  return {
    kit,
    tick(dt) {
      clock.t += dt;
      for (const m of movers) m(dt);
    },
  };
}

describe('STREET_EVENTS catalog', () => {
  it('ids are unique kebab-case', () => {
    const ids = STREET_EVENTS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('every event has a title and hint, a valid category and anchor', () => {
    for (const d of STREET_EVENTS) {
      expect(d.title.length, d.id).toBeGreaterThan(0);
      expect(d.hint.length, d.id).toBeGreaterThan(0);
      expect(CATEGORIES, d.id).toContain(d.category);
      expect(['road', 'walk'], d.id).toContain(d.anchor);
    }
  });

  it('weights and timings are sane', () => {
    for (const d of STREET_EVENTS) {
      expect(d.weight, d.id).toBeGreaterThanOrEqual(0);
      expect(d.cooldown, d.id).toBeGreaterThan(0);
      expect(d.duration, d.id).toBeGreaterThan(0);
    }
  });

  for (const def of STREET_EVENTS) {
    it(`${def.id} runs 30 s with a fake kit and never ends 'done' while the player is far away`, () => {
      const h = makeHarness();
      const script = def.start(h.kit, { x: 0, z: 0, yaw: 0 });
      for (let i = 0; i < 30 * 30; i++) {
        const dt = 1 / 30;
        h.tick(dt);
        const st = script.update(dt, h.kit);
        expect(STATUSES).toContain(st);
        expect(st, `${def.id} at ${h.kit.t.toFixed(2)} s`).not.toBe('done');
        if (st !== 'running') break;
      }
    });
  }
});
