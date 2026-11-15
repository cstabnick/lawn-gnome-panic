import { describe, expect, it } from 'vitest';
import { GNORMAN_LOOK } from '@lawn/gnome';
import type { SeatIndex, SeatInfo } from '@lawn/party';
import { checkPlaces, testMinigame } from '@lawn/party/testkit';
import { minigames } from '.';
import prixRace from './prix-race';

for (const m of minigames) testMinigame(m);

const seats: SeatInfo[] = ([0, 1, 2, 3] as SeatIndex[]).map((seat) => ({
  seat,
  name: `Seat ${seat}`,
  look: GNORMAN_LOOK,
  color: 0xffffff,
  cpu: seat !== 0,
}));
const rng = (): number => 0.5;

describe('prix-race', () => {
  it('a seat with steer 0 and no brake never moves backwards over 2 s', () => {
    const s = prixRace.init(seats, rng);
    const start = s.karts[0].dist;
    let last = start;
    for (let i = 0; i < 120; i++) {
      prixRace.step(s, [{ steer: 0, drift: false, brake: false }, null, null, null], 1 / 60, rng);
      expect(s.karts[0].dist).toBeGreaterThanOrEqual(last);
      last = s.karts[0].dist;
    }
    expect(s.karts[0].dist).toBeGreaterThan(start);
  });

  it('after 10 s of 4 CPUs, result(s, true) is a valid ranking', () => {
    const s = prixRace.init(seats, rng);
    for (let i = 0; i < 600; i++) {
      prixRace.step(s, seats.map((seat) => prixRace.cpu(s, seat.seat, rng)), 1 / 60, rng);
    }
    const places = prixRace.result(s, true);
    expect(places).not.toBeNull();
    expect(checkPlaces(places ?? [])).toBeNull();
  });
});
