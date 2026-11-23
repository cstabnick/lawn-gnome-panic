import { describe, expect, it } from 'vitest';
import { VEHICLES } from '../config';
import { initAir, stepAir } from './flight';
import type { AirBody, AirControls, AirEnv, AirSpec, AirState } from './model';

const DT = 1 / 60;
const FLOOR: AirEnv = { floorY: 0, water: false };

function spec(kind: 'hedge-hopper' | 'sycamore-copter' | 'dandelion-drifter'): AirSpec {
  return VEHICLES[kind].air!;
}
function body(y = 0, speed = 0, yaw = 0): AirBody {
  return { x: 0, y, z: 0, yaw, speed, vy: 0 };
}
function ctl(over: Partial<AirControls> = {}): AirControls {
  return { throttle: 0, steer: 0, lift: 0, powered: true, ...over };
}
function flying(): AirState {
  return { ...initAir(), airborne: true };
}

describe('fixed-wing (Hedge-Hopper)', () => {
  it('stays on the floor below stall at full throttle, then lifts off and never exceeds maxSpeed', () => {
    const s = spec('hedge-hopper');
    const b = body(0);
    const st = initAir();
    let airborneAt = -1;
    for (let i = 0; i < 10 / DT; i++) {
      stepAir(b, st, s, ctl({ throttle: 1, lift: 1 }), FLOOR, DT);
      if (b.speed < s.stallSpeed!) expect(b.y).toBe(0);
      expect(b.speed).toBeLessThanOrEqual(s.maxSpeed + 1e-9);
      if (st.airborne && airborneAt < 0) airborneAt = i * DT;
    }
    expect(airborneAt).toBeGreaterThan(0);
    expect(airborneAt).toBeLessThanOrEqual(10);
  });

  it('flying slower than stall sinks, and stallStarted fires on exactly one frame', () => {
    const s = spec('hedge-hopper');
    const b = body(50, 30);
    const st = flying();
    let stalls = 0;
    for (let i = 0; i < 120; i++) {
      b.speed = 10;
      const r = stepAir(b, st, s, ctl(), FLOOR, DT);
      if (r.stallStarted) stalls++;
    }
    expect(stalls).toBe(1);
    expect(b.vy).toBeLessThan(0);
  });

  it('a hard touchdown damages the plane and a gentle one does not', () => {
    const s = spec('hedge-hopper');
    const env = FLOOR;

    const hard = { x: 0, y: 0.5, z: 0, yaw: 0, speed: 20, vy: -15 };
    const hardSt = flying();
    let hardDamage = 0;
    for (let i = 0; i < 60; i++) hardDamage += stepAir(hard, hardSt, s, ctl(), env, DT).damage;
    expect(hardDamage).toBeGreaterThan(0);

    const gentle = { x: 0, y: 0.5, z: 0, yaw: 0, speed: 20, vy: -2 };
    const gentleSt = flying();
    let gentleDamage = 0;
    for (let i = 0; i < 60; i++) gentleDamage += stepAir(gentle, gentleSt, s, ctl(), env, DT).damage;
    expect(gentleDamage).toBe(0);
  });
});

describe('rotor (Sycamore Copter)', () => {
  it('lifts off from the floor, hovers still with throttle 0, and flies forward at full throttle', () => {
    const s = spec('sycamore-copter');
    const b = body(0);
    const st = initAir();
    for (let i = 0; i < 2 / DT; i++) stepAir(b, st, s, ctl({ lift: 1 }), FLOOR, DT);
    expect(st.airborne).toBe(true);
    expect(Math.abs(b.speed)).toBeLessThan(0.01);

    for (let i = 0; i < 10 / DT; i++) stepAir(b, st, s, ctl({ throttle: 1, lift: 1 }), FLOOR, DT);
    expect(b.speed).toBeGreaterThan(0.9 * s.maxSpeed);
    expect(st.pitch).toBeLessThan(0);
  });

  it('pedals (steer 1) decrease yaw even in a hover', () => {
    const s = spec('sycamore-copter');
    const b = body(0);
    const st = initAir();
    for (let i = 0; i < 2 / DT; i++) stepAir(b, st, s, ctl({ lift: 1, steer: 1 }), FLOOR, DT);
    expect(b.yaw).toBeLessThan(0);
  });

  it('unpowered at 40 m falls and lands on the floor with no vertical speed left', () => {
    const s = spec('sycamore-copter');
    const b = body(40);
    const st = flying();
    let landed = false;
    for (let i = 0; i < 20 / DT; i++) {
      stepAir(b, st, s, ctl({ powered: false }), FLOOR, DT);
      if (b.y === 0) landed = true;
    }
    expect(landed).toBe(true);
    expect(b.vy).toBe(0);
    expect(b.y).toBe(0);
  });

  it('never climbs past its ceiling', () => {
    const s = spec('sycamore-copter');
    const b = body(0);
    const st = initAir();
    for (let i = 0; i < 120 / DT; i++) {
      stepAir(b, st, s, ctl({ lift: 1 }), FLOOR, DT);
      expect(b.y).toBeLessThanOrEqual(s.ceiling + 1e-9);
    }
  });

  it('on water with lift -1 settles on the surface and never sinks below it', () => {
    const s = spec('sycamore-copter');
    const b = body(5);
    const st = initAir();
    const water: AirEnv = { floorY: -0.65, water: true };
    for (let i = 0; i < 10 / DT; i++) {
      stepAir(b, st, s, ctl({ lift: -1 }), water, DT);
      expect(b.y).toBeGreaterThanOrEqual(-0.65 - 1e-9);
    }
    expect(b.y).toBeCloseTo(-0.65, 5);
  });
});

describe('buoyant (Dandelion Drifter)', () => {
  it('climbs less than the copter with lift 1 for 3 s', () => {
    const rotor = body(10);
    const balloon = body(10);
    const rotorSt = initAir();
    const balloonSt = initAir();
    for (let i = 0; i < 3 / DT; i++) {
      stepAir(rotor, rotorSt, spec('sycamore-copter'), ctl({ lift: 1 }), FLOOR, DT);
      stepAir(balloon, balloonSt, spec('dandelion-drifter'), ctl({ lift: 1 }), FLOOR, DT);
    }
    expect(balloon.y).toBeLessThan(rotor.y);
    expect(balloon.y).toBeGreaterThan(10);
  });

  it('unpowered it never sinks faster than its sinkRate', () => {
    const s = spec('dandelion-drifter');
    const b = body(100);
    const st = flying();
    for (let i = 0; i < 30 / DT; i++) {
      stepAir(b, st, s, ctl({ powered: false }), FLOOR, DT);
      expect(b.vy).toBeGreaterThanOrEqual(-(s.sinkRate + 0.01));
    }
  });
});

describe('invalid time steps', () => {
  it('dt 0 and dt NaN return a zero result and leave the body unchanged', () => {
    const s = spec('hedge-hopper');
    for (const dt of [0, Number.NaN]) {
      const b = body(10, 5, 0.3);
      const before = { ...b };
      const r = stepAir(b, initAir(), s, ctl({ throttle: 1, lift: 1 }), FLOOR, dt);
      expect(r).toEqual({ touchdownSpeed: 0, damage: 0, liftedOff: false, stallStarted: false });
      expect(b).toEqual(before);
    }
  });
});
