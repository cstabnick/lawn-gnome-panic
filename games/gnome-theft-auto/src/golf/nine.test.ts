// Hedgeworth's nine holes are completable: a simple golfer bot plays full rounds through the pure round API.
import { describe, expect, it } from 'vitest';
import { CLUB_ORDER, powerFor, simulateShot, type ClubId, type ShotResult } from '@lawn/golf';
import { golfEnv, golfHeight, golfStart, golfToWorld, HOLES_YD } from './course';
import { addressBall, nextHole, newRound, playShot, setAim, tickRound, totals } from './round';
import { COURSE_PAR, distToLine, HOLE_ORDER, HOLES, MAX_STROKES, POTTING_SHED, toGolf, YD } from './types';
import type { RoundState } from './types';

const CALM = { yaw: 0, mph: 0 };
const OFFSETS = [0, 0.15, -0.15, 0.3, -0.3];
const BOT_CLUBS: ClubId[] = CLUB_ORDER.filter((c) => c !== 'PT');

/** Metres still to play along the hole's path from the world point (x, z): what is left of the path plus the stray. */
function remaining(hole: number, x: number, z: number): number {
  const h = HOLES[hole];
  let total = 0;
  for (let i = 0; i < h.path.length - 1; i++) total += Math.hypot(h.path[i + 1].x - h.path[i].x, h.path[i + 1].z - h.path[i].z);
  const d = distToLine(h.path, x, z);
  return Math.max(0, total - d.along) + d.dist;
}

function calmShot(s: RoundState, club: ClubId, power: number, yaw: number): ShotResult {
  return simulateShot(golfEnv(), golfStart(s.ball.x, s.ball.z), { club, power, accuracy: 0, yaw }, s.lie, CALM, HOLES_YD[s.hole].pin, { noWind: true });
}

function rate(s: RoundState, r: ShotResult): number {
  if (r.holed) return -1000;
  const w = golfToWorld(r.end);
  let v = remaining(s.hole, w.x, w.z);
  if (r.endLie === 'water') v += 1000;
  else if (r.endLie === 'sand') v += 6;
  return v;
}

/** Choose club, power and aim for the next stroke by trying alternatives in a calm preview. */
function choose(s: RoundState): { club: ClubId; power: number; yaw: number } {
  const h = HOLES[s.hole];
  const pin = h.pin;
  const yawTo = (x: number, z: number): number => Math.atan2(x - s.ball.x, z - s.ball.z);
  if (s.lie === 'green') {
    const yards = Math.hypot(pin.x - s.ball.x, pin.z - s.ball.z) / YD;
    let best = { club: 'PT' as ClubId, power: 1, yaw: yawTo(pin.x, pin.z) };
    let bestV = Infinity;
    for (const mul of [1, 0.9, 1.1, 1.25, 1.5]) {
      for (const off of [0, 0.03, -0.03, 0.08, -0.08]) {
        const power = Math.min(1, powerFor('PT', 'green', yards) * mul);
        const yaw = yawTo(pin.x, pin.z) + off;
        const r = calmShot(s, 'PT', power, yaw);
        const e = golfToWorld(r.end);
        const v = r.holed ? -1000 : Math.hypot(e.x - pin.x, e.z - pin.z);
        if (v < bestV) { bestV = v; best = { club: 'PT', power, yaw }; }
      }
    }
    return best;
  }
  // Aim points: the pin and every path point still ahead of the ball.
  const along = distToLine(h.path, s.ball.x, s.ball.z).along;
  const targets: { x: number; z: number }[] = [pin];
  let walked = 0;
  for (let i = 1; i < h.path.length - 1; i++) {
    walked += Math.hypot(h.path[i].x - h.path[i - 1].x, h.path[i].z - h.path[i - 1].z);
    if (walked > along + 4) targets.push(h.path[i]);
  }
  let best = { club: 'DR' as ClubId, power: 1, yaw: yawTo(pin.x, pin.z) };
  let bestV = Infinity;
  for (const t of targets) {
    const yards = Math.hypot(t.x - s.ball.x, t.z - s.ball.z) / YD;
    for (const club of BOT_CLUBS) {
      if (club === 'DR' && s.lie !== 'tee') continue;
      for (const power of [powerFor(club, s.lie, yards), 1]) {
        for (const off of OFFSETS) {
          const yaw = yawTo(t.x, t.z) + off;
          const r = calmShot(s, club, power, yaw);
          const v = rate(s, r) + (r.holed ? 0 : 0.5 * (1 - power)); // slight taste for full swings
          if (v < bestV) { bestV = v; best = { club, power, yaw }; }
        }
      }
    }
  }
  return best;
}

function playHole(s: RoundState): void {
  for (let guard = 0; guard < 40 && s.phase === 'walk'; guard++) {
    addressBall(s);
    const c = choose(s);
    s.club = c.club;
    setAim(s, c.yaw);
    playShot(s, c.power, 0);
    // playShot moved the phase on to 'flight' (TS narrowed it to 'walk' from the loop test).
    for (let i = 0; i < 4000 && (s.phase as RoundState['phase']) === 'flight'; i++) tickRound(s, 0.05);
  }
}

function playRound(seed: number): { order: number[]; scores: number[] } {
  const s = newRound(seed, HOLE_ORDER[0]);
  const order: number[] = [];
  while (s.phase !== 'done') {
    order.push(s.hole);
    playHole(s);
    expect(s.phase).toBe('holed');
    nextHole(s);
  }
  expect(totals(s).played).toBe(HOLES.length);
  return { order, scores: s.scores.map((x) => x ?? -1) };
}

describe('the nine holes are completable', () => {
  for (const seed of [1, 2, 3]) {
    it(`a bot finishes a round (seed ${seed}) within par + 3 per hole`, () => {
      const { order, scores } = playRound(seed);
      const rows = HOLE_ORDER.map((i) => `#${HOLES[i].number} ${HOLES[i].name.padEnd(18)} par ${HOLES[i].par}  strokes ${scores[i]}`);
      const total = scores.reduce((a, b) => a + b, 0);
      console.log(`seed ${seed}\n${rows.join('\n')}\ntotal ${total} (par ${COURSE_PAR})`);
      expect(order).toEqual([...HOLE_ORDER]);
      for (const i of HOLE_ORDER) {
        expect(scores[i], `hole ${HOLES[i].number} ${HOLES[i].name}`).toBeLessThan(MAX_STROKES);
        expect(scores[i], `hole ${HOLES[i].number} ${HOLES[i].name}`).toBeLessThanOrEqual(HOLES[i].par + 3);
      }
      expect(total).toBeLessThanOrEqual(COURSE_PAR + 12);
    }, 60000);
  }

  it("hole 7's tee stands on the shed roof", () => {
    const start = golfStart(HOLES[7].tee.x, HOLES[7].tee.z);
    const g = toGolf(POTTING_SHED.x + 10, POTTING_SHED.z);
    expect(start.y - golfHeight(g.x, g.z)).toBeGreaterThanOrEqual(2.5 / YD);
  });

  it('a low driver into the first maze wall bounces off it on hole 5', () => {
    const s = newRound(1, 5);
    const yaw = Math.atan2(-1318 - s.ball.x, 870 - s.ball.z);
    const r = calmShot(s, 'DR', 1, yaw);
    expect(r.events.some((e) => e.kind === 'bounce')).toBe(true);
  });
});
