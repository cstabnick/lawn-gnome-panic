import { describe, expect, it } from 'vitest';
import { newSlide, slideSpeed, stepSlide } from './slideRider';
import { SKI, SLED } from './types';
import type { SlideEvent, SlideGround, SlideInput, SlideState, SlideSurface } from './types';

const IDLE: SlideInput = { steer: 0, brake: 0, push: 0, jump: false };
const ground = (height: (x: number, z: number) => number, surface: SlideSurface = 'snow'): SlideGround => ({
  height,
  surface: () => surface,
});
const flat = ground(() => 0);
const plane = ground((_x, z) => -0.2 * z);

function run(s: SlideState, inp: SlideInput, g: SlideGround, secs: number, tune = SKI, dt = 1 / 60, onEvent?: (e: SlideEvent) => void): void {
  const n = Math.round(secs / dt);
  for (let i = 0; i < n; i++) {
    const e = stepSlide(s, inp, g, tune, dt);
    if (e && onEvent) onEvent(e);
  }
}

describe('slideRider', () => {
  it('standing still on flat snow stays still', () => {
    const s = newSlide(3, 4, 0.7, flat);
    run(s, IDLE, flat, 5);
    expect(s.x).toBe(3);
    expect(s.z).toBe(4);
    expect(slideSpeed(s)).toBe(0);
  });

  it('a 10 m/s start stops in the friction distance and never reverses', () => {
    const s = newSlide(0, 0, 0, flat);
    s.vz = 10;
    let minVz = 10;
    for (let i = 0; i < 60 * 20; i++) {
      stepSlide(s, IDLE, flat, SKI, 1 / 60);
      minVz = Math.min(minVz, s.vz);
    }
    const ideal = 100 / (2 * SKI.muSnow * SKI.gravity);
    expect(minVz).toBeGreaterThanOrEqual(0);
    expect(Math.abs(s.z - ideal) / ideal).toBeLessThan(0.2);
  });

  it('speeds up on an incline and hugs the surface', () => {
    const s = newSlide(0, 0, 0, plane);
    let worst = 0;
    for (let i = 0; i < 300; i++) {
      stepSlide(s, IDLE, plane, SKI, 1 / 60);
      worst = Math.max(worst, Math.abs(s.y - plane.height(s.x, s.z)));
    }
    const v = slideSpeed(s);
    expect(v).toBeGreaterThan(8);
    expect(v).toBeLessThan(18);
    expect(worst).toBeLessThan(0.05);
  });

  it('brake slows the descent', () => {
    const a = newSlide(0, 0, 0, plane);
    const b = newSlide(0, 0, 0, plane);
    run(a, IDLE, plane, 5);
    run(b, { ...IDLE, brake: 1 }, plane, 5);
    expect(slideSpeed(b)).toBeLessThan(slideSpeed(a));
  });

  it('carves right (toward -x when facing +z) and left', () => {
    const r = newSlide(0, 0, 0, plane);
    const l = newSlide(0, 0, 0, plane);
    run(r, { ...IDLE, steer: 1 }, plane, 1);
    run(l, { ...IDLE, steer: -1 }, plane, 1);
    expect(r.x).toBeLessThan(-0.05);
    expect(l.x).toBeGreaterThan(0.05);
  });

  it("'other' ground stops a 10 m/s rider within 12 m", () => {
    const g = ground(() => 0, 'other');
    const s = newSlide(0, 0, 0, g);
    s.vz = 10;
    run(s, IDLE, g, 5);
    expect(s.z).toBeLessThan(12);
    expect(slideSpeed(s)).toBe(0);
  });

  it('leaves the ground off a lip and lands after a real flight', () => {
    const g = ground((_x, z) => (z < 0 ? -0.2 * z : -4 - 0.6 * z));
    const s = newSlide(0, -10, 0, g);
    s.vz = 15;
    let sawAir = false;
    let landedAir = -1;
    for (let i = 0; i < 180; i++) {
      const e = stepSlide(s, IDLE, g, SKI, 1 / 60);
      if (!s.grounded) sawAir = true;
      if (e && e.t === 'landed' && landedAir < 0) landedAir = e.air;
    }
    expect(sawAir).toBe(true);
    expect(landedAir).toBeGreaterThan(0.2);
  });

  it('a sled hitting a bump gets airborne and lands', () => {
    // a short 0.6 m half-sine bump on a gentle slope
    const g = ground((_x, z) => -0.05 * z + (z > 10 && z < 10.8 ? 0.6 * Math.sin(((z - 10) / 0.8) * Math.PI) : 0));
    const s = newSlide(0, 0, 0, g);
    s.vz = 10;
    let air = 0;
    let landed = 0;
    let passed = false;
    for (let i = 0; i < 240; i++) {
      const e = stepSlide(s, IDLE, g, SLED, 1 / 60);
      if (s.z > 10.8) passed = true;
      if (passed && !s.grounded) air++;
      if (e && e.t === 'landed') landed++;
    }
    expect(air).toBeGreaterThanOrEqual(1);
    expect(landed).toBeGreaterThanOrEqual(1);
  });

  it('jump kicks vy, lands, and spins count', () => {
    const s = newSlide(0, 0, 0, flat);
    stepSlide(s, { ...IDLE, jump: true }, flat, SKI, 1 / 60);
    expect(s.vy).toBe(SKI.jumpV);
    expect(s.grounded).toBe(false);
    let landed: SlideEvent = null;
    for (let i = 0; i < 60 && !landed; i++) landed = stepSlide(s, IDLE, flat, SKI, 1 / 60);
    expect(landed?.t).toBe('landed');

    const sp = newSlide(0, 0, 0, flat);
    stepSlide(sp, { ...IDLE, jump: true }, flat, SKI, 1 / 60);
    const tune = { ...SKI, jumpV: 5.9, airSpin: 10 };
    sp.vy = tune.jumpV;
    let ev: SlideEvent = null;
    for (let i = 0; i < 120 && !(ev && ev.t === 'landed'); i++) ev = stepSlide(sp, { ...IDLE, steer: 1 }, flat, tune, 1 / 60);
    expect(ev && ev.t === 'landed' ? ev.spins : 0).toBeGreaterThanOrEqual(1);
  });

  it('never passes maxSpeed on a 45 degree plane', () => {
    const g = ground((_x, z) => -z);
    const s = newSlide(0, 0, 0, g);
    for (let i = 0; i < 60 * 30; i++) {
      stepSlide(s, IDLE, g, SKI, 1 / 60);
      expect(Math.hypot(s.vx, s.vy, s.vz)).toBeLessThanOrEqual(SKI.maxSpeed + 0.01);
      expect(Number.isFinite(s.x + s.y + s.z)).toBe(true);
    }
  });

  it('sub-steps: one 0.1 s call matches ten 0.01 s calls', () => {
    const a = newSlide(0, 0, 0, plane);
    const b = newSlide(0, 0, 0, plane);
    for (let k = 0; k < 20; k++) {
      stepSlide(a, IDLE, plane, SKI, 0.1);
      for (let i = 0; i < 10; i++) stepSlide(b, IDLE, plane, SKI, 0.01);
    }
    expect(Math.abs(a.z - b.z) / b.z).toBeLessThan(0.02);
    expect(Math.abs(slideSpeed(a) - slideSpeed(b)) / slideSpeed(b)).toBeLessThan(0.02);
  });
});
