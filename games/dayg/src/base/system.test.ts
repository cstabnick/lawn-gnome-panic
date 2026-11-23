// Base system: claim, placement with collider blocks and ladder routes, push damage, door burst, abandon, sim sync.
import { describe, it, expect } from 'vitest';
import { createCollider } from '../world/collide';
import type { BlockoutMap } from '../world/types';
import { createWorld } from '../sim/world';
import { createBus } from '../game/bus';
import type { CampSystem, HatlessSystem, PlayerState } from '../game/types';
import type { PlotDef } from './types';
import { createBaseSystem } from './system';

const map: BlockoutMap = {
  bounds: { x0: 0, x1: 1000, z0: 0, z1: 1000 },
  blocks: [], routes: [], pits: [], spots: [], havens: [], water: [], paths: [], props: [], containers: [],
  playerSpawn: { x: 0, y: 0, z: 0 },
};

const PLOT: PlotDef = { x0: 320, z0: 410, y: 0, region: 'forecourt' };

function setup() {
  const { world } = createWorld(1);
  const collider = createCollider(map);
  const bus = createBus();
  const events: Record<string, unknown[]> = {};
  for (const name of ['piece-broken', 'piece-placed', 'piece-damaged', 'base-abandoned', 'base-claimed', 'hint'] as const) {
    events[name] = [];
    bus.on(name, (e) => events[name].push(e));
  }
  let nearby = 0;
  const hatless = {
    nearCount: () => nearby,
    strike: () => 0,
  } as unknown as HatlessSystem;
  const camp = { nearFire: () => false } as unknown as CampSystem;
  const player = { pos: { x: 0, y: 0, z: 0 } } as unknown as PlayerState;
  const sys = createBaseSystem({ seed: 1, world, collider, bus, hatless, camp, getPlayer: () => player });
  return {
    world, collider, sys, events,
    setPushers(n: number) { nearby = n; },
    player,
  };
}

describe('base system', () => {
  it('claims, places a plank wall with a collider block, and breaks it under pushing', () => {
    const t = setup();
    expect(t.sys.claim(PLOT)).toBe(true);
    expect(t.sys.claim(PLOT)).toBe(false);
    expect(t.events['base-claimed'].length).toBe(1);

    const wall = t.sys.place('plank-wall', { slot: 'e:x:0:0', kind: 'edge', side: 1 });
    expect(wall).not.toBeNull();
    expect(t.collider.blockById('piece-1')).toBeDefined();
    expect(t.world.base?.hp).toBe(120);
    expect(t.world.base?.maxHp).toBe(120);

    t.setPushers(5);
    for (let i = 0; i < 3600; i++) t.sys.update(1, 1 / 3600);
    expect(t.collider.blockById('piece-1')).toBeUndefined();
    expect(t.sys.state()?.pieces.length).toBe(0);
    expect(t.events['piece-broken'].length).toBe(1);
  });

  it('a door opened has no block, closed has one', () => {
    const t = setup();
    t.sys.claim(PLOT);
    const door = t.sys.place('door', { slot: 'e:x:1:0', kind: 'edge', side: 1 });
    expect(door).not.toBeNull();
    expect(t.collider.blockById(door!.id)).toBeDefined();
    expect(t.sys.setDoor(door!.id, { open: true })).toBe(true);
    expect(t.collider.blockById(door!.id)).toBeUndefined();
    expect(t.sys.setDoor(door!.id, { open: false })).toBe(true);
    expect(t.collider.blockById(door!.id)).toBeDefined();
  });

  it('refuses to close a door on the player', () => {
    const t = setup();
    t.sys.claim(PLOT);
    const door = t.sys.place('door', { slot: 'e:x:1:0', kind: 'edge', side: 1 })!;
    t.sys.setDoor(door.id, { open: true });
    const hinge = { x: PLOT.x0 + 4, z: PLOT.z0 };
    t.player.pos.x = hinge.x + 2;
    t.player.pos.z = hinge.z;
    expect(t.sys.setDoor(door.id, { open: false })).toBe(false);
    expect(t.events.hint.at(-1)).toEqual({ text: 'Step out of the doorway.' });
  });

  it('a ladder on a wall adds a route and pulling it up removes it', () => {
    const t = setup();
    t.sys.claim(PLOT);
    const wall = t.sys.place('plank-wall', { slot: 'e:z:0:1', kind: 'edge', side: 1 })!;
    const ladder = t.sys.place('ladder', { slot: 'e:z:0:1', kind: 'ladder', side: 1 })!;
    expect(ladder).not.toBeNull();
    expect(t.collider.routesOn(wall.id, 'e').length).toBe(1);
    t.sys.setLadderUp(ladder.id, true);
    expect(t.collider.routesOn(wall.id, 'e').length).toBe(0);
  });

  it('abandon clears the base and the sim copy', () => {
    const t = setup();
    t.sys.claim(PLOT);
    t.sys.place('plank-wall', { slot: 'e:x:0:0', kind: 'edge', side: 1 });
    expect(t.world.base).not.toBeNull();
    t.sys.abandon();
    expect(t.world.base).toBeNull();
    expect(t.sys.state()).toBeNull();
    expect(t.events['base-abandoned'].length).toBe(1);
    expect(t.collider.blockById('piece-1')).toBeUndefined();
  });
});
