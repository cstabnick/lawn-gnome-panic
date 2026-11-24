import { describe, it, expect } from 'vitest';
import { createBus, type GameEvents } from './bus';
import { createPlayerController, createPlayerState } from './player';
import { createCollider } from '../world/collide';
import { STAMINA } from '../config';
import type { BlockoutMap } from '../world/types';
import type { InputState, MoveMods, PlayerState } from './types';

// Flat ground at y 0. Blocks sit well apart so each test uses its own spot.
const makeMap = (): BlockoutMap => ({
  bounds: { x0: 0, x1: 560, z0: 0, z1: 520 },
  blocks: [
    { id: 'kerb', kind: 'kerb', x0: 100, x1: 102, z0: 200, z1: 240, y: 0, h: 1.2 },
    { id: 'tower', kind: 'wall', x0: 200, x1: 210, z0: 300, z1: 310, y: 0, h: 10 },
    { id: 'ivy-block', kind: 'wall', x0: 400, x1: 410, z0: 300, z1: 310, y: 0, h: 10 },
  ],
  routes: [
    { id: 'ivy-w', block: 'ivy-block', side: 'w', kind: 'ivy', at: 5 },
    { id: 'ivy-e', block: 'ivy-block', side: 'e', kind: 'ivy', at: 5 },
  ],
  pits: [], spots: [], havens: [], water: [], paths: [], props: [], containers: [],
  playerSpawn: { x: 10, y: 0, z: 10 },
});

const DT = 1 / 60;
const input = (o: Partial<InputState> = {}): InputState => ({
  moveX: 0, moveZ: 0, lookX: 0, lookY: 0, sprint: false, crouch: false, action: false,
  attack: false, climb: false, inventory: false, view: false, map: false, ...o,
});
const mods = (o: Partial<MoveMods> = {}): MoveMods => ({
  speedMul: 1, staminaRegenMul: 1, canSprint: true, carryRatio: 0, hasRope: false, hasLadder: false, ...o,
});

function setup(map: BlockoutMap = makeMap()) {
  const bus = createBus();
  const collider = createCollider(map);
  const ctrl = createPlayerController({ bus, collider });
  const events = {
    fell: [] as GameEvents['fell'][],
    hint: [] as GameEvents['hint'][],
    climbed: [] as GameEvents['climbed'][],
    'route-placed': [] as GameEvents['route-placed'][],
  };
  bus.on('fell', (e) => events.fell.push(e));
  bus.on('hint', (e) => events.hint.push(e));
  bus.on('climbed', (e) => events.climbed.push(e));
  bus.on('route-placed', (e) => events['route-placed'].push(e));
  const at = (x: number, y: number, z: number, facing = 0): PlayerState => {
    const p = createPlayerState({ x, y, z });
    p.facing = facing;
    return p;
  };
  const run = (p: PlayerState, inp: InputState, seconds: number, m = mods(), yaw = 0): void => {
    const n = Math.round(seconds / DT);
    for (let i = 0; i < n; i++) ctrl.update(p, inp, yaw, DT, m);
  };
  /** One frame with the climb edge pressed, then `seconds` of no input. */
  const press = (p: PlayerState, m: MoveMods, seconds: number): void => {
    ctrl.update(p, input({ climb: true }), 0, DT, m);
    run(p, input(), seconds, m);
  };
  return { ctrl, events, at, run, press };
}

const FACE_EAST = Math.PI / 2; // forward = (sin f, 0, cos f) = +x

describe('createPlayerState', () => {
  it('starts standing, full stamina, alive, at rest', () => {
    const p = createPlayerState({ x: 1, y: 2, z: 3 });
    expect(p.stance).toBe('stand');
    expect(p.stamina).toBe(STAMINA.max);
    expect(p.alive).toBe(true);
    expect(p.pos).toMatchObject({ x: 1, y: 2, z: 3 });
    expect(p.climbing).toBeNull();
  });
});

describe('movement', () => {
  it('walks at about 2 gm/s', () => {
    const { at, run } = setup();
    const p = at(300, 0, 300);
    run(p, input({ moveZ: 0.5 }), 2);
    expect(p.speed).toBeCloseTo(2, 1);
    expect(p.pos.z).toBeGreaterThan(303.5);
  });

  it('sprint drains stamina', () => {
    const { at, run } = setup();
    const p = at(300, 0, 300);
    run(p, input({ moveZ: 1, sprint: true }), 1);
    expect(p.sprinting).toBe(true);
    expect(p.speed).toBeCloseTo(6, 1);
    expect(p.stamina).toBeLessThan(STAMINA.max - 10);
    expect(p.stamina).toBeGreaterThan(STAMINA.max - 15);
  });

  it('crouch halves speed', () => {
    const { at, run } = setup();
    const p = at(300, 0, 300);
    run(p, input({ crouch: true }), DT);            // toggles to crouch
    expect(p.stance).toBe('crouch');
    run(p, input({ moveZ: 0.5 }), 2);
    expect(p.speed).toBeCloseTo(1, 1);
  });

  it('a fall of 8 gm emits fell about 8', () => {
    const { run, events } = setup();
    const p = createPlayerState({ x: 300, y: 8, z: 300 });
    p.grounded = false;
    run(p, input(), 2);
    expect(p.grounded).toBe(true);
    expect(events.fell).toHaveLength(1);
    expect(events.fell[0].height).toBeCloseTo(8, 0);
  });
});

describe('climbing', () => {
  it('a 1.2 gm kerb is vaulted', () => {
    const { at, press } = setup();
    const p = at(99.3, 0, 220, FACE_EAST);
    press(p, mods(), 1);
    expect(p.pos.y).toBeCloseTo(1.2, 3);
    expect(p.pos.x).toBeGreaterThan(100);
    expect(p.vaulting).toBe(0);
  });

  it('a 10 gm block with no route and no items emits hint', () => {
    const { at, press, events } = setup();
    const p = at(199.3, 0, 305, FACE_EAST);
    press(p, mods(), 0.1);
    expect(events.hint).toHaveLength(1);
    expect(p.climbing).toBeNull();
    expect(p.pos.y).toBe(0);
  });

  it('with a rope in pack, the same 10 gm block is climbed, placing a route', () => {
    const { at, press, run, events } = setup();
    const p = at(199.3, 0, 305, FACE_EAST);
    press(p, mods({ hasRope: true }), 0);
    expect(events['route-placed']).toHaveLength(1);
    expect(p.climbing?.via).toBe('rope');
    run(p, input(), 13, mods({ hasRope: true }));
    expect(p.pos.y).toBeCloseTo(10, 3);
    expect(p.climbing).toBeNull();
    expect(events.climbed).toHaveLength(1);
    expect(events.climbed[0]).toMatchObject({ via: 'rope' });
    expect(events.climbed[0].height).toBeCloseTo(10, 3);
  });

  it('a fixed ivy route is climbed without items', () => {
    const { at, press, run, events } = setup();
    const p = at(399.3, 0, 305, FACE_EAST);
    press(p, mods(), 0);
    expect(p.climbing?.via).toBe('route');
    expect(events['route-placed']).toHaveLength(0);
    run(p, input(), 11);
    expect(p.pos.y).toBeCloseTo(10, 3);
    expect(events.climbed).toHaveLength(1);
    expect(events.climbed[0]).toMatchObject({ via: 'route' });
  });

  it('climbing down a route from the top reaches the ground', () => {
    const { at, press, run, events } = setup();
    const p = at(409.5, 10, 305, FACE_EAST);
    p.grounded = true;
    press(p, mods(), 0);
    expect(p.climbing?.down).toBe(true);
    run(p, input(), 11);
    expect(p.pos.y).toBeCloseTo(0, 3);
    expect(p.grounded).toBe(true);
    expect(p.climbing).toBeNull();
    expect(events.fell).toHaveLength(0);
  });

  it('vaulting a thin wall with a taller block right behind it never traps the player inside a block', () => {
    const map = makeMap();
    map.blocks.push(
      { id: 'thin-wall', kind: 'wall', x0: 150, x1: 150.6, z0: 200, z1: 220, y: 0, h: 1.2 },
      { id: 'pillar-behind', kind: 'wall', x0: 150.8, x1: 155, z0: 205, z1: 215, y: 0, h: 5 },
    );
    const { at, press, run } = setup(map);
    const p = at(149.4, 0, 210, FACE_EAST);
    press(p, mods(), 1);
    run(p, input({ moveZ: 1 }), 0.5);
    const collider = createCollider(map);
    const out = { x: 0, y: 0, z: 0 };
    expect(collider.move(p.pos, 0, 0, 0.45, 1.7, 0.5, out)).toBeNull();
  });
});
