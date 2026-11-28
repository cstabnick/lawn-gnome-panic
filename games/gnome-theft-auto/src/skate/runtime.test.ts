import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { InputState, Vehicle } from '../types';
import { installSkate, skateApi, type SkateDeps } from './runtime';
import { BOARD_LIBRARY, SKATE_ACH, SKATE_ORIGIN, SKATE_LINES } from './types';

function makeWorld() {
  const toasts: string[] = [];
  const unlocked: string[] = [];
  const mem = new Map<string, string>();
  const player = { x: BOARD_LIBRARY.x, y: 0, z: BOARD_LIBRARY.z, yaw: 0, vehicle: null as Vehicle | null };
  const deps = {
    scene: new THREE.Scene(),
    ui: { appendChild: () => {} } as unknown as HTMLElement,
    world: { boxes: [] },
    hud: { toast: (t: string) => { toasts.push(t); }, callout: () => {} },
    vehicles: [] as Vehicle[],
    player,
    play: () => {},
    unlock: (id: string) => { unlocked.push(id); },
    increment: () => {},
    blocked: () => null,
    seatPlayer: (v: Vehicle) => { v.driver = 'player'; player.vehicle = v; },
    throwPlayer: (v: Vehicle) => { v.driver = 'none'; player.vehicle = null; },
    onFoot: () => player.vehicle === null,
  } as unknown as SkateDeps;
  const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); } };
  return { deps, toasts, unlocked, player, storage };
}

const PUSH = { moveX: 0, moveY: 1, jump: false } as InputState;
const OLLIE = { moveX: 0, moveY: 1, jump: true } as InputState;

describe('skate runtime', () => {
  beforeAll(() => {
    installFakeDom();
    (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame = () => 0;
    // The HUD needs plain elements: a tiny stand-in for div and button, canvases stay with the fake DOM.
    const doc = globalThis.document as unknown as { createElement(tag: string): unknown; body?: unknown };
    (doc as { head?: unknown }).head ??= { appendChild() {} };
    doc.body ??= { dataset: {}, style: { setProperty() {}, removeProperty() {} } };
    const make = doc.createElement.bind(doc);
    doc.createElement = (tag: string) => {
      if (tag !== 'div' && tag !== 'button') return make(tag);
      const el: Record<string, unknown> = { style: {}, children: [], textContent: '', id: '' };
      el.appendChild = (c: unknown) => c;
      el.addEventListener = () => {};
      el.remove = () => {};
      el.classList = { add() {}, remove() {} };
      return el;
    };
  });

  it('installs colliders, and the Board Library hands out a board and seats the player', () => {
    const w = makeWorld();
    const skate = installSkate(w.deps, { storage: w.storage });
    expect(w.deps.world.boxes.length).toBeGreaterThan(0);
    expect(skateApi()).toBe(skate.api);
    expect(skate.blips()).toHaveLength(1);
    expect(skate.prompt(BOARD_LIBRARY.x, BOARD_LIBRARY.z)).toBe('Take a board (the Board Library)');
    expect(skate.prompt(0, 0)).toBeNull();
    expect(skate.interact(BOARD_LIBRARY.x, BOARD_LIBRARY.z)).toBe(true);
    expect(skate.api.boardOwned()).toBe(true);
    const v = w.player.vehicle as Vehicle;
    expect(v.kind).toBe('skateboard');
    expect(skate.drives(v)).toBe(true);
    expect(skate.riding()).toBe(true);
  });

  it('pushing moves the board south and an ollie is saved', () => {
    const w = makeWorld();
    const skate = installSkate(w.deps, { storage: w.storage });
    skate.interact(BOARD_LIBRARY.x, BOARD_LIBRARY.z);
    const v = w.player.vehicle as Vehicle;
    const z0 = v.z;
    for (let i = 0; i < 120; i++) {
      skate.stepRider(v, PUSH, 1 / 60, PUSH);
      skate.update(1 / 60, PUSH);
    }
    expect(v.z).toBeGreaterThan(z0 + 1);
    expect(skate.riding()).toBe(true);
    skate.stepRider(v, OLLIE, 1 / 60, OLLIE);
    skate.update(1 / 60, OLLIE);
    expect(JSON.parse(w.storage.getItem('gta-sports-v1') ?? '{}').skate.ollies).toBeGreaterThanOrEqual(1);
    expect(w.unlocked).toContain(SKATE_ACH.firstOllie);
  });

  it('startLine puts the player on a board near the first gate', () => {
    const w = makeWorld();
    const skate = installSkate(w.deps, { storage: w.storage });
    expect(skate.api.startLine('first-push')).toBeNull();
    const v = w.player.vehicle as Vehicle;
    expect(v.kind).toBe('skateboard');
    const g = SKATE_LINES[0].gates[0];
    expect(Math.hypot(v.x - (SKATE_ORIGIN.x + g.u), v.z - (SKATE_ORIGIN.z + g.v))).toBeLessThan(6);
  });

  it('refuses far from the park and without a board', () => {
    const w = makeWorld();
    const skate = installSkate(w.deps, { storage: w.storage });
    expect(skate.api.dropBoard()).toContain('no board');
    w.player.x = 2000;
    expect(skate.api.startLine('first-push')).toContain('Gutter Bowls');
  });

  it('leaving the owned board stows it', () => {
    const w = makeWorld();
    const skate = installSkate(w.deps, { storage: w.storage });
    skate.interact(BOARD_LIBRARY.x, BOARD_LIBRARY.z);
    const v = w.player.vehicle as Vehicle;
    skate.update(1 / 60, PUSH);
    expect(w.deps.vehicles).toContain(v);
    v.driver = 'none';
    w.player.vehicle = null;
    skate.update(1 / 60, PUSH);
    expect(w.deps.vehicles).not.toContain(v);
    expect(w.toasts).toContain('Board under your arm.');
  });
});
