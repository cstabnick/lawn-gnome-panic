import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { InputState, Vehicle } from '../types';
import { WINTER_SAVE_KEY } from './save';
import {
  installWinter, lodgeAction, powderTune, rideInput, tiltOf, winterApi, type LodgeCtx, type WinterDeps,
} from './runtime';
import {
  BLACK_DIAMOND_S, COCOA_HATCH, RENT, SHANTY, SKI, SKI_RACK, SLED_STACK, WOOL_RUN, type RunDef, type RunResult, type RunState,
} from './types';

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

/** The scripted Wool Run's cruise speed, m/s: a sensible pace that clears every gate. */
const WOOL_PILOT_CRUISE = 8;
const IDLE = { moveX: 0, moveY: 0, jump: false } as InputState;

/** Starts a run and rides it with no input until it finishes (or 60 s). */
function straightRun(id: 'nursery' | 'tea-tray-run') {
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

/** The stick for a rider heading for the next gate: steer from the heading error, light brake above `cruise` m/s. */
function autopilot(def: RunDef, phase: RunState['phase'], next: number, v: Vehicle, cruise: number): Pick<InputState, 'moveX' | 'moveY'> {
  const gate = phase === 'ready' ? def.start : next < def.gates.length ? def.gates[next] : def.finish;
  // Close to a gate, start swinging toward the one after it (a smooth line, not a corner at every pole).
  const after = phase === 'running' ? def.gates[next + 1] ?? def.finish : gate;
  const k = Math.max(0, Math.min(1, 1 - (gate.z - v.z) / 7)) * 0.8;
  // Aim a little past the pole on the side the rider is coming from, so the carve does not undershoot it.
  const over = Math.max(-9, Math.min(9, (gate.x - v.x) * 0.3));
  const aimX = gate.x + over + (after.x - gate.x) * k;
  const want = Math.atan2(aimX - v.x, Math.max(10, gate.z - v.z));
  let err = want - v.yaw;
  err = Math.atan2(Math.sin(err), Math.cos(err));
  const speed = Math.abs(v.speed);
  return { moveX: Math.max(-1, Math.min(1, -err * 3)), moveY: speed < 3 ? 1 : -Math.max(0, Math.min(1, (speed - cruise) / 6)) };
}

/**
 * Skis the Wool Run from its start with the autopilot, then lets go of the stick for `after` seconds past the finish
 * (so only the run-out slows the rider).
 */
function pilotedWoolRun(cruise: number, after = 0) {
  const w = makeWorld();
  const winter = installWinter(w.deps, { storage: w.storage });
  const finished: RunResult[] = [];
  winter.api.onFinish((r) => finished.push(r));
  expect(winter.api.startRun('wool-run')).toBeNull();
  const v = w.player.vehicle as Vehicle;
  const dt = 1 / 30;
  let n = 0;
  let finishedAt = -1;
  let maxZ = -Infinity;
  const afterSpeeds: number[] = [];
  while (n < 90 * 30 && (finished.length === 0 || n < finishedAt + after * 30)) {
    const run = winter.debug().run;
    const stick = finishedAt >= 0 || !run ? {} : autopilot(WOOL_RUN, run.phase, run.next, v, cruise);
    winter.stepRider(v, { ...IDLE, ...stick } as InputState, dt);
    winter.update(dt);
    n++;
    if (finished.length > 0 && finishedAt < 0) finishedAt = n;
    if (finishedAt >= 0) {
      maxZ = Math.max(maxZ, v.z);
      afterSpeeds.push(Math.abs(v.speed));
    }
  }
  return { w, winter, finished, v, afterSpeeds, maxZ, seconds: n / 30 };
}

describe('winter runtime on the real terrain', () => {
  beforeAll(() => { installFakeDom(); });

  it('skis with no input finish the Nursery once and record it', () => {
    const { w, winter, finished, seconds } = straightRun('nursery');
    console.log(`straight ski run: ${seconds.toFixed(1)} s from spawn, run ${finished[0]?.seconds.toFixed(1)} s, missed ${finished[0]?.missed}`);
    expect(finished).toHaveLength(1);
    expect(finished[0].id).toBe('nursery');
    expect(finished[0].ride).toBe('snow-skis');
    expect(seconds).toBeLessThan(40);
    const saved = JSON.parse(w.mem.get(WINTER_SAVE_KEY) ?? '{}');
    expect(saved.runs.nursery).toBe(1);
    expect(saved.runs['wool-run']).toBeUndefined();
    expect(w.unlocked).toContain('gta-first-tracks');
    expect(w.unlocked).not.toContain('gta-black-diamond');
    expect(winter.debug().save.best.nursery).toBeGreaterThan(0);
    expect(winterApi()).toBe(winter.api);
  });

  it('a scripted run from the summit finishes the Wool Run clean in 35-45 s', () => {
    const { w, winter, finished, seconds } = pilotedWoolRun(WOOL_PILOT_CRUISE);
    const f = finished[0];
    console.log(`scripted Wool Run (cruise ${WOOL_PILOT_CRUISE} m/s): ${f?.seconds.toFixed(1)} s, missed ${f?.missed}, ${seconds.toFixed(1)} s total`);
    expect(finished).toHaveLength(1);
    expect(f.id).toBe('wool-run');
    expect(f.missed).toBe(0);
    expect(f.clean).toBe(true);
    expect(f.seconds).toBeGreaterThanOrEqual(35);
    expect(f.seconds).toBeLessThanOrEqual(45);
    expect(winter.debug().save.best['wool-run']).toBe(Math.round(f.seconds * 10) / 10);
    expect(winter.debug().save.best.nursery).toBeUndefined();
    expect(w.unlocked).toContain('gta-first-tracks');
  });

  it('a faster clean line beats the Black Diamond time, and the slow one does not', () => {
    const fast = pilotedWoolRun(12).finished[0];
    console.log(`fast Wool Run: ${fast?.seconds.toFixed(1)} s, missed ${fast?.missed}, Black Diamond at ${BLACK_DIAMOND_S} s`);
    expect(fast.clean).toBe(true);
    expect(fast.seconds).toBeLessThanOrEqual(BLACK_DIAMOND_S);
    const slow = pilotedWoolRun(7);
    expect(slow.finished[0].seconds).toBeGreaterThan(BLACK_DIAMOND_S);
    expect(slow.w.unlocked).not.toContain('gta-black-diamond');
    expect(pilotedWoolRun(12).w.unlocked).toContain('gta-black-diamond');
  });

  it('the run-out brakes the rider to a stop well before the band road', () => {
    const { afterSpeeds, maxZ, w, v } = pilotedWoolRun(WOOL_PILOT_CRUISE, 8);
    const within4s = afterSpeeds.slice(0, 4 * 30);
    console.log(`run-out: speed at finish ${afterSpeeds[0].toFixed(1)} m/s, slowest in 4 s ${Math.min(...within4s).toFixed(2)} m/s, furthest z ${maxZ.toFixed(1)}`);
    expect(Math.min(...within4s)).toBeLessThan(1);
    expect(maxZ).toBeLessThan(-965);
    expect(w.toasts.filter((t) => t.startsWith('Run-out'))).toHaveLength(1);
    expect(v.z).toBeLessThan(-965);
  });

  it('the Nursery cannot start while the Wool Run is running, and there is one finish per descent', () => {
    const { finished, w } = pilotedWoolRun(WOOL_PILOT_CRUISE, 8);
    expect(finished.map((r) => r.id)).toEqual(['wool-run']);
    expect(JSON.parse(w.mem.get(WINTER_SAVE_KEY) ?? '{}').runs.nursery).toBeUndefined();
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
