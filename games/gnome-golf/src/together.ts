// Stroke play together: every golfer plays their own ball on one hole at the same time, with no turns, carts or
// swing meter (a stroke is an aim and a power). Pure: no DOM, no Ctx, no THREE objects in the state, so the state
// can travel as JSON and a flight replays from its stored inputs (replayFlight).
// The rules are the round's own: simulateShot (physics.ts), clubFor / restingSpot / playableLie (round.ts).
// Gnome Party's "Golf Hole" slice (minigames/golf-hole.ts) is this mode for four on a par 3.
import * as THREE from 'three';
import { HOLES, TOGETHER, type ClubId, type Lie, type ShotResult, type Wind } from './config';
import { heightAt } from './course';
import { powerFor, simulateShot } from './physics';
import { clubFor, playableLie, restingSpot, yawTo } from './round';

export interface TogetherFlight {
  /** Where it was struck from, and the stroke's inputs: replayFlight re-runs simulateShot from these. */
  sx: number; sz: number; club: ClubId; power: number; accuracy: number; yaw: number; lie: Lie;
  t0: number; dur: number;
  /** Where it comes to rest and the lie there. A water ball is already at its dry drop spot (restingSpot). */
  ex: number; ez: number; endLie: Lie; holed: boolean;
}

export interface TogetherBall {
  x: number; z: number; lie: Lie;
  strokes: number; holed: boolean; holedAt: number;
  /** Seconds at rest since the last landing or stroke. */
  restT: number;
  flight: TogetherFlight | null;
}

/** Stored numbers are rounded to 1 mm: the state stays small and every replay runs on exactly the host's values. */
const r3 = (v: number): number => Math.round(v * 1000) / 1000;

export function distToPin(b: { x: number; z: number }, hole: number): number {
  const pin = HOLES[hole].pin;
  return Math.hypot(pin.x - b.x, pin.z - b.z);
}

/** A ball is picked up at this many strokes. */
export function pickupAt(hole: number): number {
  return HOLES[hole].par + TOGETHER.pickupOverPar;
}

/** `n` balls on the tee, TOGETHER.teeSpread apart across the line to the pin. */
export function teeBalls(hole: number, n: number): TogetherBall[] {
  const { tee, pin } = HOLES[hole];
  const len = Math.hypot(pin.x - tee.x, pin.z - tee.z) || 1;
  const nx = -(pin.z - tee.z) / len;
  const nz = (pin.x - tee.x) / len;
  return Array.from({ length: n }, (_, k) => {
    const off = (k - (n - 1) / 2) * TOGETHER.teeSpread;
    return {
      x: r3(tee.x + nx * off), z: r3(tee.z + nz * off), lie: 'tee' as Lie,
      strokes: 0, holed: false, holedAt: 0, restT: 0, flight: null,
    };
  });
}

/** At rest, not holed and not picked up. */
export function canStrike(b: TogetherBall, hole: number): boolean {
  return b.flight === null && !b.holed && b.strokes < pickupAt(hole);
}

/** Every ball is holed or picked up, and none is still flying. */
export function holeDone(balls: readonly TogetherBall[], hole: number): boolean {
  return balls.every((b) => b.flight === null && (b.holed || b.strokes >= pickupAt(hole)));
}

/** The club the ball will be struck with: the round's own choice for its lie and distance. */
export function clubOf(b: TogetherBall, hole: number): ClubId {
  return clubFor(b.lie, distToPin(b, hole));
}

/** The aim and power that send the ball at the pin with the round's club choice (no error). */
export function caddieShot(b: TogetherBall, hole: number): { yaw: number; power: number } {
  const { pin } = HOLES[hole];
  return { yaw: yawTo(b.x, b.z, pin.x, pin.z), power: powerFor(clubOf(b, hole), b.lie, distToPin(b, hole)) };
}

/** The full simulated flight of a stored stroke: the host and every viewer get the same trajectory. */
export function replayFlight(f: TogetherFlight, hole: number, wind: Wind): ShotResult {
  return simulateShot(
    new THREE.Vector3(f.sx, heightAt(f.sx, f.sz), f.sz),
    { club: f.club, power: f.power, accuracy: f.accuracy, yaw: f.yaw },
    f.lie, wind, HOLES[hole].pin,
  );
}

/** Plays one stroke for a ball that canStrike, starting its flight at time t. Water costs its penalty stroke now. */
export function strokeBall(b: TogetherBall, yaw: number, power: number, hole: number, wind: Wind, t: number, rng: () => number): void {
  if (!canStrike(b, hole)) return;
  const f: TogetherFlight = {
    sx: b.x, sz: b.z, club: clubOf(b, hole), lie: b.lie,
    power: r3(Math.min(1, Math.max(0, power))),
    accuracy: r3((rng() - 0.5) * TOGETHER.accuracySpread),
    yaw: r3(yaw),
    t0: t, dur: 0, ex: 0, ez: 0, endLie: b.lie, holed: false,
  };
  const r = replayFlight(f, hole, wind);
  const rest = restingSpot(b, r);
  f.dur = r3(r.duration);
  f.ex = r3(rest.x);
  f.ez = r3(rest.z);
  f.endLie = rest.penalty ? playableLie(f.ex, f.ez) : r.endLie;
  f.holed = r.holed;
  b.strokes += 1 + rest.penalty;
  b.restT = 0;
  b.flight = f;
}

/** Advances every ball to time t: a flight that has run its course lands; balls at rest count their rest time. */
export function settleBalls(balls: TogetherBall[], t: number, dt: number): void {
  for (const b of balls) {
    const f = b.flight;
    if (f && t >= f.t0 + f.dur) {
      b.x = f.ex;
      b.z = f.ez;
      b.lie = f.endLie;
      if (f.holed) {
        b.holed = true;
        b.holedAt = t;
      }
      b.flight = null;
      b.restT = 0;
    }
    if (b.flight === null) b.restT += dt;
  }
}

/** True when ball a places strictly ahead of b: holed first (fewer strokes, then the earlier hole), then the nearer to the pin. */
function ahead(a: TogetherBall, b: TogetherBall, hole: number): boolean {
  if (a.holed !== b.holed) return a.holed;
  if (a.holed) return a.strokes !== b.strokes ? a.strokes < b.strokes : a.holedAt < b.holedAt;
  return distToPin(a, hole) < distToPin(b, hole);
}

/** Each ball's place (0 = first): the number of balls ahead of it, so equal balls share. */
export function placeBalls(balls: readonly TogetherBall[], hole: number): number[] {
  return balls.map((a) => balls.filter((b) => ahead(b, a, hole)).length);
}
