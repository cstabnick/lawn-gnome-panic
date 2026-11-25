// Hedgeworth runtime (E15 B1): the Kicked Board, a round from the first tee, the carts and the blips, on the real terrain.
import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { InputState, Vehicle } from '../types';
import { GOLF_SAVE_KEY } from './save';
import { golfApi, installGolf, type GolfDeps } from './runtime';
import { CART_SPOTS, GOLF_ACH, HOLES, KICKED_BOARD } from './types';

/** An element that takes any call or property: enough for the HUD, the card and the intro cards. */
function fakeEl(): unknown {
  const target: Record<string, unknown> = { style: {}, children: [], dataset: {} };
  return new Proxy(target, {
    get: (t, k) => (k in t ? t[k as string] : () => undefined),
    set: (t, k, v) => { t[k as string] = v; return true; },
  });
}

function makeWorld() {
  const toasts: string[] = [];
  const unlocked: string[] = [];
  const mem = new Map<string, string>();
  const player = { x: HOLES[0].tee.x + 1.5, y: 0, z: HOLES[0].tee.z + 1.5, yaw: 0, health: 1, vehicle: null as Vehicle | null };
  const deps = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    ui: { appendChild: () => {} } as unknown as HTMLElement,
    world: { boxes: [] },
    hud: { toast: (t: string) => { toasts.push(t); }, callout: () => {} },
    vehicles: [] as Vehicle[],
    player,
    play: () => {},
    unlock: (id: string) => { unlocked.push(id); },
    increment: () => {},
    blocked: () => null,
    onFoot: () => player.vehicle === null,
  } as unknown as GolfDeps;
  const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); } };
  return { deps, toasts, unlocked, mem, player, storage };
}

const inp = (o: Partial<InputState> = {}): InputState => ({ moveX: 0, moveY: 0, jump: false, fire: false, ...o }) as InputState;

describe('golf runtime', () => {
  beforeAll(() => {
    installFakeDom();
    const doc = (globalThis as unknown as { document: { createElement(t: string): unknown } }).document;
    const canvasMaker = doc.createElement.bind(doc);
    doc.createElement = (tag: string) => (tag === 'canvas' ? canvasMaker(tag) : fakeEl());
  });

  it('installs with two carts, the board standing, and the course blip', () => {
    const w = makeWorld();
    const golf = installGolf(w.deps, { storage: w.storage });
    expect(golfApi()).toBe(golf.api);
    expect(w.deps.vehicles.filter((v) => v.kind === 'golf-cart')).toHaveLength(CART_SPOTS.length);
    expect(golf.api.boardBroken()).toBe(false);
    expect(golf.blips().some((b) => b.kind === 'golf')).toBe(true);
    expect(golf.addressing()).toBe(false);
  });

  it('a vehicle at 8 m/s breaks the Kicked Board', () => {
    const w = makeWorld();
    const golf = installGolf(w.deps, { storage: w.storage });
    const before = w.deps.world.boxes.length;
    const cart = w.deps.vehicles[0];
    cart.driver = 'player';
    cart.x = KICKED_BOARD.x - 2;
    cart.z = KICKED_BOARD.z;
    cart.speed = 8;
    w.player.vehicle = cart;
    golf.update(1 / 30, inp());
    expect(w.deps.world.boxes.length).toBe(before - 1);
    expect(golf.api.boardBroken()).toBe(true);
    expect(JSON.parse(w.mem.get(GOLF_SAVE_KEY) ?? '{}').boardBroken).toBe(true);
    expect(w.unlocked).toContain(GOLF_ACH.kickedBoard);
  });

  it('on foot the board prompts a kick, and E breaks it', () => {
    const w = makeWorld();
    const golf = installGolf(w.deps, { storage: w.storage });
    expect(golf.prompt(KICKED_BOARD.x - 1, KICKED_BOARD.z)).toBe('Kick the loose board');
    expect(golf.interact(KICKED_BOARD.x - 1, KICKED_BOARD.z)).toBe(true);
    expect(golf.api.boardBroken()).toBe(true);
    expect(w.toasts[0]).toContain('Hedgeworth');
  });

  it('plays a shot from the first tee and quits', () => {
    const w = makeWorld();
    const golf = installGolf(w.deps, { storage: w.storage });
    const holes: number[] = [];
    golf.api.onHole((e) => holes.push(e.hole));
    w.player.x = -990;
    w.player.z = 640;
    expect(golf.api.startRound(0)).toBe('The fence is in the way. Find the loose board.');
    golf.api.breakBoard();
    // Stand on the tee, as a player walking up would.
    w.player.x = HOLES[0].tee.x;
    w.player.z = HOLES[0].tee.z + 1.5;
    expect(golf.prompt(w.player.x, w.player.z)).toBe('Tee off: hole 1 (par 4)');
    expect(golf.api.startRound(0)).toBeNull();
    expect(golf.api.inRound()).toBe(true);
    expect(golf.prompt(w.player.x, w.player.z)).toBe('Address the ball');
    golf.update(1 / 30, inp());
    expect(golf.interact(w.player.x, w.player.z)).toBe(true);
    expect(golf.addressing()).toBe(true);
    // Three taps: start the meter, lock power, lock accuracy.
    golf.update(1 / 30, inp({ jump: true }));
    for (let i = 0; i < 15; i++) golf.update(1 / 30, inp());
    golf.update(1 / 30, inp({ jump: true }));
    for (let i = 0; i < 9; i++) golf.update(1 / 30, inp());
    golf.update(1 / 30, inp({ jump: true }));
    let n = 0;
    while (golf.addressing() && n++ < 30 * 30) golf.update(1 / 30, inp());
    const d = golf.debug() as { round: { phase: string; strokes: number } | null };
    expect(d.round?.strokes).toBe(1);
    expect(d.round?.phase).toBe('walk');
    expect(golf.blips().filter((b) => b.kind === 'objective').length).toBeGreaterThan(0);
    golf.api.quitRound();
    expect(golf.api.inRound()).toBe(false);
    expect(golf.addressing()).toBe(false);
  });

  it('refuses a round from a cart', () => {
    const w = makeWorld();
    const golf = installGolf(w.deps, { storage: w.storage });
    golf.api.breakBoard();
    w.player.vehicle = w.deps.vehicles[0];
    expect(golf.api.startRound(0)).toBe('Get out of the cart first.');
  });
});
