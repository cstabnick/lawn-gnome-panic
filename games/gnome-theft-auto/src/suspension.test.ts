// Body suspension maths. Run: npx vitest run games/gnome-theft-auto/src/suspension.test.ts
import { describe, expect, it } from 'vitest';
import { SUSPENSION } from './config';
import { createSuspension, stepSuspension, type SuspensionOutput } from './suspension';

const FRAME = 1 / 60;

interface Frame { speed?: number; yaw?: number; groundY?: number; grounded?: boolean; hop?: number; dt?: number }

/** Run frames with a fixed input, returning the output after each one. */
function run(frames: Frame[], start: Partial<{ speed: number; yaw: number; groundY: number }> = {}) {
  const b = createSuspension();
  const out: SuspensionOutput = { heave: 0, pitch: 0, roll: 0 };
  let speed = start.speed ?? 0;
  let yaw = start.yaw ?? 0;
  let groundY = start.groundY ?? 0;
  const history: SuspensionOutput[] = [];
  // First frame records the inputs so the rest start from a clean baseline.
  stepSuspension(b, { dt: FRAME, speed, yaw, groundY, grounded: true, hop: 0 }, out);
  for (const f of frames) {
    speed = f.speed ?? speed;
    yaw = f.yaw ?? yaw;
    groundY = f.groundY ?? groundY;
    stepSuspension(b, { dt: f.dt ?? FRAME, speed, yaw, groundY, grounded: f.grounded ?? true, hop: f.hop ?? 0 }, out);
    history.push({ ...out });
  }
  return history;
}

describe('stepSuspension', () => {
  it('stays at rest with constant inputs', () => {
    const h = run(Array.from({ length: 120 }, () => ({ speed: 8, yaw: 0.3, groundY: 1 })), { speed: 8, yaw: 0.3, groundY: 1 });
    for (const o of h) {
      expect(Math.abs(o.heave)).toBeLessThan(1e-9);
      expect(Math.abs(o.pitch)).toBeLessThan(1e-9);
      expect(Math.abs(o.roll)).toBeLessThan(1e-9);
    }
  });

  it('dips the nose under braking and settles back within 5% in under 2 s', () => {
    // Speed falls by 10 m/s over 0.2 s, then holds.
    const ramp: Frame[] = [];
    for (let i = 1; i <= 12; i++) ramp.push({ speed: 10 - (10 * i) / 12 });
    const hold: Frame[] = Array.from({ length: 120 }, () => ({}));
    const h = run([...ramp, ...hold], { speed: 10 });
    const pitches = h.map((o) => o.pitch);
    expect(Math.min(...pitches)).toBeLessThan(-0.01);
    const settleFrame = 2 * 60 - 1;
    expect(Math.abs(h[ramp.length + settleFrame].pitch)).toBeLessThan(0.05 * Math.abs(Math.min(...pitches)));
  });

  it('squats the tail under acceleration (nose up)', () => {
    const ramp: Frame[] = [];
    for (let i = 1; i <= 12; i++) ramp.push({ speed: (10 * i) / 12 });
    const h = run(ramp, { speed: 0 });
    expect(Math.max(...h.map((o) => o.pitch))).toBeGreaterThan(0.01);
  });

  it('rolls steadily to the outside of a constant left turn', () => {
    // yaw increasing = turning left, so the body rolls onto its right side (roll positive).
    const turn: Frame[] = [];
    let yaw = 0;
    for (let i = 0; i < 300; i++) {
      yaw += 0.5 * FRAME;
      turn.push({ speed: 10, yaw });
    }
    const h = run(turn, { speed: 10, yaw: 0 });
    const last = h[h.length - 1].roll;
    expect(last).toBeGreaterThan(0.02);
    expect(last).toBeCloseTo(0.5 * 10 * SUSPENSION.latToRoll, 3);
    expect(h[h.length - 2].roll).toBeCloseTo(last, 4);
  });

  it('rings and decays after a 0.3 m step in ground height', () => {
    const h = run([{ groundY: 0.3 }, ...Array.from({ length: 240 }, () => ({}))], { groundY: 0 });
    const peak = Math.max(...h.map((o) => Math.abs(o.heave)));
    expect(peak).toBeGreaterThan(0.005);
    expect(peak).toBeLessThanOrEqual(SUSPENSION.maxHeave);
    // Count sign changes of the ringing while it is still visibly moving (|heave| above 1e-3) over 2 s.
    const sig = h.slice(0, 120).map((o) => o.heave).filter((x) => Math.abs(x) > 1e-3);
    let changes = 0;
    for (let i = 1; i < sig.length; i++) if (Math.sign(sig[i]) !== Math.sign(sig[i - 1])) changes++;
    expect(changes).toBeLessThanOrEqual(3);
    expect(Math.abs(h[h.length - 1].heave)).toBeLessThan(1e-3);
  });

  it('stays finite and bounded with dt of 0.1 s', () => {
    const h = run(Array.from({ length: 60 }, (_, i) => ({ dt: 0.1, speed: i % 2 ? 12 : 0, yaw: i * 0.2, groundY: i % 3 ? 0.5 : 0, hop: 1 })));
    for (const o of h) {
      expect(Number.isFinite(o.heave) && Number.isFinite(o.pitch) && Number.isFinite(o.roll)).toBe(true);
      expect(Math.abs(o.heave)).toBeLessThanOrEqual(SUSPENSION.maxHeave);
      expect(Math.abs(o.pitch)).toBeLessThanOrEqual(SUSPENSION.maxPitch);
      expect(Math.abs(o.roll)).toBeLessThanOrEqual(SUSPENSION.maxRoll);
    }
  });

  it('never exceeds the clamps, even with huge inputs', () => {
    const h = run(Array.from({ length: 200 }, (_, i) => ({ speed: i % 2 ? 300 : -300, yaw: i * 3, groundY: i % 2 ? 50 : -50, hop: 1 })));
    for (const o of h) {
      expect(Math.abs(o.heave)).toBeLessThanOrEqual(SUSPENSION.maxHeave);
      expect(Math.abs(o.pitch)).toBeLessThanOrEqual(SUSPENSION.maxPitch);
      expect(Math.abs(o.roll)).toBeLessThanOrEqual(SUSPENSION.maxRoll);
    }
  });

  it('a lowrider hop lifts the body by up to hopLift, capped at maxHeave', () => {
    const h = run(Array.from({ length: 60 }, () => ({ hop: 1 })));
    const top = h[h.length - 1].heave;
    expect(top).toBeGreaterThan(0.5 * SUSPENSION.hopLift);
    expect(top).toBeLessThanOrEqual(SUSPENSION.maxHeave);
  });

  it('gives no NaN for dt = 0, and a zero dt leaves the state alone', () => {
    const b = createSuspension();
    const out: SuspensionOutput = { heave: 0, pitch: 0, roll: 0 };
    stepSuspension(b, { dt: 0, speed: 5, yaw: 1, groundY: 2, grounded: true, hop: 1 }, out);
    expect(out).toEqual({ heave: 0, pitch: 0, roll: 0 });
    stepSuspension(b, { dt: 0, speed: 9, yaw: 2, groundY: 3, grounded: true, hop: 1 }, out);
    expect(Number.isNaN(out.heave) || Number.isNaN(out.pitch) || Number.isNaN(out.roll)).toBe(false);
  });

  it('the first call does not spike from the inputs', () => {
    const b = createSuspension();
    const out: SuspensionOutput = { heave: 0, pitch: 0, roll: 0 };
    stepSuspension(b, { dt: FRAME, speed: 20, yaw: 3, groundY: 40, grounded: true, hop: 0 }, out);
    expect(out).toEqual({ heave: 0, pitch: 0, roll: 0 });
  });
});
