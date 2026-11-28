// Drainpipe Court runtime (E19 B1): install, a pickup game, quitting, a finished game in the save, the shootaround.
import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { InputState } from '../types';
import { courtApi, installCourt, type CourtDeps } from './runtime';
import { SPORTS_SAVE_KEY } from '../sports/save';
import { BALL_CAGE, COURT, SCOREBOARD } from './types';

/** An element that takes any call or property: enough for the HUD. */
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
  const earned: number[] = [];
  const mem = new Map<string, string>();
  const player = {
    x: SCOREBOARD.x, y: 0, z: SCOREBOARD.z - 1, yaw: 0, health: 1, vehicle: null,
    model: { object: { visible: true } },
  };
  const deps = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    ui: { appendChild: () => {} } as unknown as HTMLElement,
    world: { boxes: [] },
    hud: { toast: (t: string) => { toasts.push(t); }, callout: () => {} },
    economy: { earn: (n: number) => { earned.push(n); } },
    vehicles: [],
    player,
    play: () => {},
    unlock: (id: string) => { unlocked.push(id); },
    increment: () => {},
    blocked: () => null,
    onFoot: () => player.vehicle === null,
  } as unknown as CourtDeps;
  const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); } };
  return { deps, toasts, unlocked, earned, mem, player, storage };
}

const inp = (o: Partial<InputState> = {}): InputState => ({ moveX: 0, moveY: 0, jump: false, fire: false, ...o }) as InputState;

describe('court runtime', () => {
  beforeAll(() => {
    installFakeDom();
    const doc = (globalThis as unknown as { document: { createElement(t: string): unknown } }).document;
    const canvasMaker = doc.createElement.bind(doc);
    doc.createElement = (tag: string) => (tag === 'canvas' ? canvasMaker(tag) : fakeEl());
  });

  it('installs with colliders, the blip and its prompts', () => {
    const w = makeWorld();
    const court = installCourt(w.deps, { storage: w.storage });
    expect(courtApi()).toBe(court.api);
    expect((w.deps.world.boxes as unknown[]).length).toBeGreaterThan(0);
    expect(court.blips()[0].label).toBe('Drainpipe Court');
    expect(court.inputMode()).toBe('none');
    expect(court.prompt(SCOREBOARD.x, SCOREBOARD.z)).toBe('Pickup game with Pansy (to 11)');
    expect(court.prompt(BALL_CAGE.x, BALL_CAGE.z)).toBe('Take a ball (shootaround)');
  });

  it('refuses far away and in a vehicle, then plays and quits', () => {
    const w = makeWorld();
    const court = installCourt(w.deps, { storage: w.storage });
    w.player.x = COURT.x + 200;
    expect(court.api.startGame()).toContain('Founders');
    expect(court.api.startShootaround()).toContain('Founders');
    w.player.x = SCOREBOARD.x;
    w.player.vehicle = {} as never;
    expect(court.api.startGame()).toBe('Get out first.');
    w.player.vehicle = null;
    expect(court.api.startGame()).toBeNull();
    expect(court.inputMode()).toBe('game');
    expect(court.api.inGame()).toBe(true);
    for (let i = 0; i < 600; i++) court.update(1 / 30, inp());
    expect(w.player.model.object.visible).toBe(false);
    expect(court.applyCamera(1 / 30)).toBe(true);
    court.api.quitGame();
    expect(court.inputMode()).toBe('none');
    expect(court.api.inGame()).toBe(false);
    expect(w.player.model.object.visible).toBe(true);
    expect(w.mem.get(SPORTS_SAVE_KEY)).toBeUndefined();
  });

  it('a finished game lands in the save and tells the listeners', () => {
    const w = makeWorld();
    const court = installCourt(w.deps, { storage: w.storage });
    const results: boolean[] = [];
    court.api.onGame((r) => results.push(r.won));
    expect(court.api.startGame({ target: 2 })).toBeNull();
    let n = 0;
    // Hold shoot in pulses, wander about: the sim's AI scores sooner or later either way.
    while (results.length === 0 && n++ < 30 * 900) {
      court.update(1 / 30, inp({ fire: n % 20 < 8, moveX: Math.sin(n / 40), moveY: Math.cos(n / 55) }));
    }
    expect(results).toHaveLength(1);
    const save = JSON.parse(w.mem.get(SPORTS_SAVE_KEY) ?? '{}');
    expect(save.jam.games).toBe(1);
    expect(save.jam.wins).toBe(results[0] ? 1 : 0);
    expect(w.earned.length).toBe(results[0] ? 1 : 0);
    // The card closes by itself.
    for (let i = 0; i < 30 * 6; i++) court.update(1 / 30, inp());
    expect(court.api.inGame()).toBe(false);
    expect(w.player.model.object.visible).toBe(true);
  });

  it('a shootaround release counts a shot, and it ends on leaving', () => {
    const w = makeWorld();
    const court = installCourt(w.deps, { storage: w.storage });
    w.player.x = BALL_CAGE.x - 3;
    w.player.z = BALL_CAGE.z + 4;
    expect(court.api.startShootaround()).toBeNull();
    expect(court.inputMode()).toBe('shootaround');
    for (let i = 0; i < 12; i++) court.update(1 / 30, inp({ fire: true }));
    court.update(1 / 30, inp());
    expect((court.debug() as { shots: number }).shots).toBe(1);
    for (let i = 0; i < 60; i++) court.update(1 / 30, inp());
    w.player.x = BALL_CAGE.x - 60;
    court.update(1 / 30, inp());
    expect(court.inputMode()).toBe('none');
  });
});
