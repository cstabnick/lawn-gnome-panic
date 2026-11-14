import { describe, expect, it } from 'vitest';
import { GNORMAN_LOOK } from '@lawn/gnome';
import { STEP_S, mulberry32, type SeatIndex, type SeatInfo } from '@lawn/party';
import { HOLES } from '../config';
import { yawTo } from '../round';
import def, { pickClub, type Flight, type HoleInput, type HoleState } from './golf-hole';

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

  it('a water ball keeps its spot and takes a penalty stroke', () => {
    const rng = mulberry32(13);
    const s = def.init(seats, rng);
    const b = s.balls[1];
    const f: Flight = {
      sx: b.x, sz: b.z, club: 'DR', power: 1, accuracy: 0, yaw: 0, lie: 'tee',
      t0: s.t, dur: 0.05, ex: b.x + 10, ez: b.z + 10, endLie: 'water', holed: false,
    };
    b.flight = f;
    b.strokes = 1;
    run(s, NONE, 0.2, rng);
    expect(b.flight).toBeNull();
    expect(b.strokes).toBe(2);
    expect(b.x).toBe(f.sx);
    expect(b.z).toBe(f.sz);
    expect(b.lie).toBe('tee');
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
    expect(pickClub('green', 10)).toBe('PT');
    expect(pickClub('tee', 150)).not.toBe('PT');
  });
});
