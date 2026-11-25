import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { InputState, Vehicle } from '../types';
import { WINTER_SAVE_KEY } from './save';
import {
  installWinter, lodgeAction, powderTune, rideInput, tiltOf, winterApi, type LodgeCtx, type WinterDeps,
} from './runtime';
import { COCOA_HATCH, RENT, SHANTY, SKI, SKI_RACK, SLED_STACK, type RunResult } from './types';

const ctx = (o: Partial<LodgeCtx> = {}): LodgeCtx => ({ sledOwned: false, teaTrayDone: false, acorns: 100, rodLent: false, ...o });

describe('rideInput', () => {
  it('maps the stick and hop', () => {
    expect(rideInput({ moveX: 0.5, moveY: -1, jump: false }, false)).toEqual({ steer: 0.5, brake: 1, push: 0, jump: false });
    expect(rideInput({ moveX: -3, moveY: 0.4, jump: false }, true)).toEqual({ steer: -1, brake: 0, push: 0.4, jump: true });
    expect(rideInput({ moveX: 0, moveY: 0, jump: true }, false).jump).toBe(true);
  });
});

describe('lodgeAction', () => {
  it('finds each spot', () => {
    expect(lodgeAction(SKI_RACK.x, SKI_RACK.z, ctx())?.kind).toBe('skis');
    expect(lodgeAction(COCOA_HATCH.x, COCOA_HATCH.z, ctx())?.kind).toBe('cocoa');
    expect(lodgeAction(SHANTY.x, SHANTY.z, ctx())?.kind).toBe('rod');
    expect(lodgeAction(SHANTY.x, SHANTY.z, ctx({ rodLent: true }))).toBeNull();
    expect(lodgeAction(0, 0, ctx())).toBeNull();
  });
  it('sled: rent, then buy after a finished Tea-Tray Run, then take once owned', () => {
    const at = (c: LodgeCtx) => lodgeAction(SLED_STACK.x, SLED_STACK.z, c)?.kind;
    expect(at(ctx())).toBe('sled-rent');
    expect(at(ctx({ teaTrayDone: true }))).toBe('sled-buy');
    expect(at(ctx({ teaTrayDone: true, acorns: RENT.ownSled - 1 }))).toBe('sled-rent');
    expect(at(ctx({ sledOwned: true }))).toBe('sled-take');
  });
});

describe('small helpers', () => {
  it('powder lowers snow friction only', () => {
    const p = powderTune(SKI);
    expect(p.muSnow).toBeCloseTo(SKI.muSnow * 0.85);
    expect(p.muIce).toBe(SKI.muIce);
  });
  it('tilt is zero on level ground and pitches up along a rising heading', () => {
    const flat = tiltOf(0, 1, 0, 1);
    expect(flat.pitch).toBeCloseTo(0);
    expect(flat.roll).toBeCloseTo(0);
    // Ground rising toward +z has a normal leaning to -z; a rider facing +z pitches up (negative pitch).
    expect(tiltOf(0, 0.9, -0.3, 0).pitch).toBeLessThan(0);
  });
});

// ---- Integration on the real terrain -----------------------------------------------------------------------------

function makeWorld() {
  const toasts: string[] = [];
  const unlocked: string[] = [];
  const mem = new Map<string, string>();
  let acorns = 100;
  const player = { x: SKI_RACK.x, y: 0, z: SKI_RACK.z, yaw: 0, vehicle: null as Vehicle | null };
  const deps = {
    scene: new THREE.Scene(),
    ui: { appendChild: () => {} } as unknown as HTMLElement,
    world: { boxes: [] },
    hud: { toast: (t: string) => { toasts.push(t); }, callout: () => {} },
    economy: {
      spend: (n: number) => { if (acorns < n) return false; acorns -= n; return true; },
      earn: (n: number) => { acorns += n; },
      state: () => ({ acorns }),
    },
    vehicles: [] as Vehicle[],
    player,
    play: () => {},
    unlock: (id: string) => { unlocked.push(id); },
    increment: () => {},
    blocked: () => null,
    seatPlayer: (v: Vehicle) => { v.driver = 'player'; player.vehicle = v; },
    throwPlayer: (v: Vehicle) => { v.driver = 'none'; player.vehicle = null; },
    lendRod: () => true,
    bears: () => [],
    onFoot: () => player.vehicle === null,
  } as unknown as WinterDeps;
  const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); } };
  return { deps, toasts, unlocked, mem, player, storage, acorns: () => acorns };
}

const IDLE = { moveX: 0, moveY: 0, jump: false } as InputState;

/** Starts a run and rides it with no input until it finishes (or 60 s). */
function straightRun(id: 'wool-run' | 'tea-tray-run') {
  const w = makeWorld();
  const winter = installWinter(w.deps, { storage: w.storage });
  const finished: RunResult[] = [];
  winter.api.onFinish((r) => finished.push(r));
  expect(winter.api.startRun(id)).toBeNull();
  const v = w.player.vehicle as Vehicle;
  let n = 0;
  while (finished.length === 0 && n < 30 * 60) {
    winter.stepRider(v, IDLE, 1 / 30);
    winter.update(1 / 30);
    n++;
  }
  return { w, winter, finished, seconds: n / 30 };
}

describe('winter runtime on the real terrain', () => {
  beforeAll(() => { installFakeDom(); });

  it('skis with no input finish the Wool Run once and record it', () => {
    const { w, winter, finished, seconds } = straightRun('wool-run');
    console.log(`straight ski run: ${seconds.toFixed(1)} s from spawn, run ${finished[0]?.seconds.toFixed(1)} s, missed ${finished[0]?.missed}`);
    expect(finished).toHaveLength(1);
    expect(finished[0].id).toBe('wool-run');
    expect(finished[0].ride).toBe('snow-skis');
    expect(seconds).toBeLessThan(40);
    expect(JSON.parse(w.mem.get(WINTER_SAVE_KEY) ?? '{}').runs['wool-run']).toBe(1);
    expect(w.unlocked).toContain('gta-first-tracks');
    expect(winter.debug().save.best['wool-run']).toBeGreaterThan(0);
    expect(winterApi()).toBe(winter.api);
  });

  it('the sled finishes the Tea-Tray Run', () => {
    const { w, finished, seconds } = straightRun('tea-tray-run');
    console.log(`straight sled run: ${seconds.toFixed(1)} s from spawn, run ${finished[0]?.seconds.toFixed(1)} s`);
    expect(finished).toHaveLength(1);
    expect(w.unlocked).toContain('gta-tea-tray-run');
  });

  it('renting skis spends Acorns and seats the player', () => {
    const w = makeWorld();
    const winter = installWinter(w.deps, { storage: w.storage });
    expect(winter.prompt(SKI_RACK.x, SKI_RACK.z)).toBe('Rent skis (8 Acorns)');
    expect(winter.interact(SKI_RACK.x, SKI_RACK.z)).toBe(true);
    expect(w.acorns()).toBe(100 - RENT.skis);
    expect(w.player.vehicle?.kind).toBe('snow-skis');
    expect(winter.drives(w.player.vehicle as Vehicle)).toBe(true);
    expect(winter.blips()).toHaveLength(3);
  });
});
