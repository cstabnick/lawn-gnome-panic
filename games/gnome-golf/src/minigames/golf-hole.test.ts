import { describe, expect, it } from 'vitest';
import { GNORMAN_LOOK } from '@lawn/gnome';
import { STEP_S, mulberry32, type SeatIndex, type SeatInfo } from '@lawn/party';
import { HOLES } from '../config';
import { lieAt } from '../course';
import { clubFor, yawTo } from '../round';
import def, { type HoleInput, type HoleState } from './golf-hole';

const seats: SeatInfo[] = ([0, 1, 2, 3] as SeatIndex[]).map((seat) => ({
  seat, name: `G${seat}`, look: GNORMAN_LOOK, color: 0xd93636, cpu: seat !== 0,
}));
const NONE: null[] = [null, null, null, null];

function run(s: HoleState, inputs: (HoleInput | null)[], seconds: number, rng: () => number): void {
  for (let i = 0; i < Math.round(seconds / STEP_S); i++) def.step(s, inputs, STEP_S, rng);
}

describe('golf-hole slice', () => {
  it('a full-power shot from the tee of a par 3 lands within 30 yd of the pin', () => {
    const rng = mulberry32(11);
    const s = def.init(seats, rng);
    const { pin, par } = HOLES[s.hole];
    expect(par).toBe(3);
    const b = s.balls[0];
    const yaw = yawTo(b.x, b.z, pin.x, pin.z);
    def.step(s, [{ yaw, power: 1, shots: 1 }, null, null, null], STEP_S, rng);
    expect(s.balls[0].strokes).toBe(1);
    for (let i = 0; i < 60 * 30 && s.balls[0].flight !== null; i++) def.step(s, NONE, STEP_S, rng);
    expect(s.balls[0].flight).toBeNull();
    expect(Math.hypot(s.balls[0].x - pin.x, s.balls[0].z - pin.z)).toBeLessThanOrEqual(30);
  });

  it('a shots counter that does not grow causes no shot', () => {
    const rng = mulberry32(12);
    const s = def.init(seats, rng);
    run(s, [{ yaw: 0, power: 1, shots: 0 }, null, null, null], 2, rng);
    expect(s.balls[0].strokes).toBe(0);
    expect(s.balls[0].flight).toBeNull();
  });

  it('a water ball lands on dry land near its drop spot, with a penalty stroke', () => {
    // Hole 2 (index 1) is a par 3 over a pond at (165, -22), r 22. Scan for a tee shot aimed at the pond that splashes.
    const pond = { x: 165, z: -22 };
    let splash: { strokes: number; x: number; z: number; lie: string } | null = null;
    for (let power = 0.4; power <= 1 && splash === null; power += 0.02) {
      const rng = mulberry32(13);
      const s = def.init(seats, rng);
      s.hole = 1;
      const b = s.balls[0];
      b.x = HOLES[1].tee.x;
      b.z = HOLES[1].tee.z;
      def.step(s, [{ yaw: yawTo(b.x, b.z, pond.x, pond.z), power, shots: 1 }, null, null, null], STEP_S, rng);
      run(s, NONE, 20, rng);
      if (b.strokes === 2) splash = { strokes: b.strokes, x: b.x, z: b.z, lie: b.lie };
    }
    expect(splash).not.toBeNull();
    expect(splash!.strokes).toBe(2);
    expect(lieAt(splash!.x, splash!.z)).not.toBe('water');
    expect(splash!.lie).not.toBe('water');
    expect(Math.hypot(splash!.x - HOLES[1].tee.x, splash!.z - HOLES[1].tee.z)).toBeGreaterThan(0);
  });

  it('the state stays under 2 KB mid-flight', () => {
    const rng = mulberry32(14);
    const s = def.init(seats, rng);
    const { pin } = HOLES[s.hole];
    const inputs: HoleInput[] = s.balls.map((b) => ({ yaw: yawTo(b.x, b.z, pin.x, pin.z), power: 1, shots: 1 }));
    def.step(s, inputs, STEP_S, rng);
    for (const b of s.balls) expect(b.flight).not.toBeNull();
    run(s, NONE, 3, rng);
    expect(JSON.stringify(s).length).toBeLessThan(2048);
  });

  it('the club is the putter on the green and the shortest club that reaches elsewhere', () => {
    expect(clubFor('green', 10)).toBe('PT');
    expect(clubFor('tee', 150)).not.toBe('PT');
  });
});
