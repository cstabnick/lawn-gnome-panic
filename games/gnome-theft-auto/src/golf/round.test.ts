// Hedgeworth's round as pure state: the tee, the three-tap swing, the flight, a holed putt, a water penalty, the card.
import { describe, expect, it } from 'vitest';
import { CLUBS, powerFor, scoreName } from '@lawn/golf';
import { yardsBetween } from './course';
import { addressBall, cardView, nextHole, newRound, pinYards, tapSwing, tickRound } from './round';
import { HOLES, MAX_WIND } from './types';
import type { RoundState } from './types';

/** Run the flight until the shot has stopped (or the hole is scored). */
function finishFlight(s: RoundState): void {
  for (let i = 0; i < 60 * 60 && s.phase === 'flight'; i++) tickRound(s, 1 / 60);
}

describe('a round', () => {
  it('starts on the tee in walk with a seeded wind', () => {
    const a = newRound(42, 0);
    const b = newRound(42, 0);
    expect(a.phase).toBe('walk');
    expect(a.ball).toEqual({ x: HOLES[0].tee.x, z: HOLES[0].tee.z });
    expect(a.lie).toBe('tee');
    expect(Math.abs(a.wind.mph)).toBeLessThanOrEqual(MAX_WIND);
    expect(a.wind).toEqual(b.wind);
  });

  it('a near-perfect driver off the tee flies toward the pin and comes to rest', () => {
    const s = newRound(7, 0);
    s.wind = { yaw: 0, mph: 0 };
    addressBall(s);
    expect(s.phase).toBe('aim');
    expect(s.club).toBe('DR');
    const tee = { ...s.ball };
    const pinBefore = pinYards(s);

    tapSwing(s);
    expect(s.phase).toBe('swing');
    while (s.swing.marker < 1) tickRound(s, 1 / 120);
    tapSwing(s);
    while (s.swing.marker > 0) tickRound(s, 1 / 120);
    tapSwing(s);
    expect(s.phase).toBe('flight');
    expect(s.strokes).toBe(1);

    finishFlight(s);
    expect(s.phase).toBe('walk');
    const carried = yardsBetween(tee, s.ball);
    expect(carried).toBeGreaterThan(CLUBS.DR.carry * 0.75);
    expect(carried).toBeLessThan(CLUBS.DR.carry * 1.25);
    expect(pinYards(s)).toBeLessThan(pinBefore);
  });

  it('a putt of the right power on the green holes out and scores the hole', () => {
    const s = newRound(7, 0);
    const pin = HOLES[0].pin;
    s.wind = { yaw: 0, mph: 0 };
    s.strokes = 1;
    s.ball = { x: pin.x - 4, z: pin.z };
    s.lie = 'green';
    s.phase = 'aim';
    s.club = 'PT';
    s.aimYaw = Math.atan2(pin.x - s.ball.x, pin.z - s.ball.z);
    const power = powerFor('PT', 'green', yardsBetween(s.ball, pin));

    tapSwing(s);
    s.swing = { stage: 'accuracy', marker: 0, power };
    tapSwing(s);
    finishFlight(s);

    expect(s.phase).toBe('holed');
    expect(s.scores[0]).toBe(2);
    expect(s.banner).toBe(scoreName(2, HOLES[0].par));
  });

  it('a shot into Hosepipe Pond costs two strokes and drops the ball where it was struck from', () => {
    const s = newRound(7, 2);
    const pond = HOLES[2].ponds[0];
    s.wind = { yaw: 0, mph: 0 };
    const from = { x: pond.x - 40, z: pond.z };
    s.ball = { ...from };
    s.lie = 'fairway';
    s.phase = 'aim';
    s.club = 'GW';
    s.strokes = 0;
    s.aimYaw = Math.atan2(pond.x - from.x, pond.z - from.z);

    tapSwing(s);
    s.swing = { stage: 'accuracy', marker: 0, power: 1 };
    tapSwing(s);
    finishFlight(s);

    expect(s.ball).toEqual(from);
    expect(s.strokes).toBe(2);
    expect(s.phase).toBe('walk');
  });

  it('after the last unscored hole, nextHole ends the round with the total', () => {
    const s = newRound(7, 0);
    s.scores = [4, 5, 3, 5];
    s.hole = 3;
    s.phase = 'holed';
    expect(nextHole(s)).toEqual([{ kind: 'round-done', total: 17, toPar: 1 }]);
    expect(s.phase).toBe('done');
    expect(cardView(s, [4, null, null, null]).final).toBe(true);
  });
});
