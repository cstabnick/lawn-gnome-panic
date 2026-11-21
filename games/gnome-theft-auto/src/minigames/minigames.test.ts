import { describe, expect, it } from 'vitest';
import { GNORMAN_LOOK } from '@lawn/gnome';
import type { SeatIndex, SeatInfo } from '@lawn/party';
import { testMinigame } from '@lawn/party/testkit';
import { minigames } from './index';
import gtaGetaway from './gta-getaway';

for (const m of minigames) testMinigame(m);

const seats: SeatInfo[] = ([0, 1, 2, 3] as SeatIndex[]).map((seat) => ({
  seat,
  name: `Seat ${seat}`,
  look: GNORMAN_LOOK,
  color: 0xffffff,
  cpu: seat !== 0,
}));
const rng = (): number => 0.5;

describe('gta-getaway', () => {
  it('starts all 4 racers outside The Gnomecino near (60, -30) with auto-throttle', () => {
    const s = gtaGetaway.init(seats, rng);
    expect(s.r).toHaveLength(4);
    expect(s.c).toHaveLength(3);
    for (const r of s.r) {
      expect(Math.hypot(r.x - 60, r.z - -30)).toBeLessThan(4);
      expect(r.cp).toBe(0);
    }
    for (let i = 0; i < 90; i++) {
      gtaGetaway.step(s, [{ steer: 0, drift: false }, null, null, null], 1 / 60, rng);
    }
    expect(s.r[0].z).toBeGreaterThan(-20);
    expect(s.r[0].s).toBeGreaterThan(20);
  });

  it('steers and handbrake drifts with one verb', () => {
    const s = gtaGetaway.init(seats, rng);
    for (let i = 0; i < 45; i++) {
      gtaGetaway.step(s, [{ steer: 1, drift: true }, null, null, null], 1 / 60, rng);
    }
    expect(s.r[0].yaw).toBeLessThan(-0.5);
    expect(s.r[0].dr).toBeGreaterThan(0.5);
  });

  it('4 CPUs finish all 5 checkpoints well within maxSeconds', () => {
    const cpuSeats = seats.map((s) => ({ ...s, cpu: true }));
    const s = gtaGetaway.init(cpuSeats, rng);
    let places: number[] | null = null;
    for (let i = 0; i < 45 * 60 && places === null; i++) {
      gtaGetaway.step(s, cpuSeats.map((seat) => gtaGetaway.cpu(s, seat.seat, rng)), 1 / 60, rng);
      places = gtaGetaway.result(s, false);
    }
    expect(places).not.toBeNull();
    expect(s.t).toBeLessThan(40);
    expect(s.r.every((r) => r.cp === 5)).toBe(true);
  });

  it('cruisers bump overlapping racers using momentum', () => {
    const s = gtaGetaway.init(seats, rng);
    s.r[0].x = s.c[0].x - 1.5;
    s.r[0].z = s.c[0].z;
    s.r[0].yaw = Math.PI / 2;
    s.r[0].s = 25;
    gtaGetaway.step(s, [{ steer: 0, drift: false }, null, null, null], 1 / 60, rng);
    expect(Math.hypot(s.r[0].x - s.c[0].x, s.r[0].z - s.c[0].z)).toBeGreaterThanOrEqual(3.4);
  });

  it('reports Checkpoints and Time', () => {
    const s = gtaGetaway.init(seats, rng);
    for (let i = 0; i < 600; i++) {
      gtaGetaway.step(s, seats.map((seat) => gtaGetaway.cpu(s, seat.seat, rng)), 1 / 60, rng);
    }
    const places = gtaGetaway.result(s, true)!;
    const rep = gtaGetaway.report!(s, places, seats);
    expect(rep.stats.map((st) => st.label)).toEqual(['Checkpoints', 'Time']);
  });
});
