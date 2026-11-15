// Side by side: every bowler on their own lane at the same time, no turns (the turn-based game is game.ts).
// Pure: no DOM, no THREE objects in the state, so it can travel as JSON and a throw replays from its stored input.
// Each lane bowls the turn-based game's own rules: simulateThrow / clampThrow (physics.ts), and the roll list,
// rack and marks (scoring.ts cursor / knockDown / freshRack / frameMarks). A lane bowls `frames` frames.
// Gnome Party's "Bowl Frame" slice (minigames/bowl-frame.ts) is this mode for four lanes and one frame.
import { SIDE_BY_SIDE, type ThrowInput } from './config';
import { clampThrow, simulateThrow } from './physics';
import { cursor, frameMarks, freshRack, knockDown } from './scoring';

export interface LaneThrow {
  /** The throw's input (clamped): the view replays simulateThrow(input, standing) from it. */
  input: ThrowInput;
  t0: number;
  dur: number;
  down: boolean[];
}

export interface Lane {
  standing: boolean[];
  /** Pins knocked by each ball so far, in order: the frame, ball, score and marks all come from this. */
  rolls: number[];
  /** The next ball may be bowled from this time. */
  readyAt: number;
  /** When the lane bowled its last ball. */
  doneAt: number;
  /** The bowler's stance (ball x at the foul line). */
  x: number;
  flight: LaneThrow | null;
}

export function newLane(): Lane {
  return { standing: freshRack(), rolls: [], readyAt: 0, doneAt: 0, x: 0, flight: null };
}

/** The lane has bowled all its frames. */
export function laneDone(l: Lane, frames: number): boolean {
  const c = cursor(l.rolls);
  return c.done || c.frame >= frames;
}

/** A ball may be bowled on this lane at time t. */
export function laneReady(l: Lane, t: number, frames: number): boolean {
  return !laneDone(l, frames) && l.flight === null && t >= l.readyAt;
}

/** Bowls a ball on a ready lane at time t. False (and nothing happens) when the lane is not ready. */
export function bowlLane(l: Lane, input: ThrowInput, t: number, frames: number): boolean {
  if (!laneReady(l, t, frames)) return false;
  const c = clampThrow(input);
  const r = simulateThrow(c, l.standing);
  l.x = c.x;
  l.flight = { input: c, t0: t, dur: Math.round(r.duration * 1e3) / 1e3, down: r.down };
  return true;
}

/** Advances a lane to time t: a throw that has run its course (and settled) counts its pins and racks the next ball. */
export function tickLane(l: Lane, t: number, frames: number): void {
  const f = l.flight;
  if (!f || t < f.t0 + f.dur + SIDE_BY_SIDE.settleSeconds) return;
  l.rolls.push(knockDown(l.standing, f.down));
  l.flight = null;
  if (laneDone(l, frames)) {
    l.doneAt = t;
    return;
  }
  if (cursor(l.rolls).fresh) l.standing = freshRack();
  l.readyAt = t + SIDE_BY_SIDE.readySeconds;
}

/** Pins knocked down so far. */
export function lanePins(l: Lane): number {
  return l.rolls.reduce((a, b) => a + b, 0);
}

/** Every ball's scoreboard mark so far: 'X' strike, '/' spare, digits, '-' zero. */
export function laneMarks(l: Lane): string[] {
  return frameMarks(l.rolls).flat();
}

/** The latest ball's mark, when it was a strike or spare ('X' or '/'), else null. */
export function lastBigMark(l: Lane): 'X' | '/' | null {
  const marks = laneMarks(l);
  const m = marks[marks.length - 1];
  return m === 'X' || m === '/' ? m : null;
}

const count = (marks: string[], m: string): number => marks.filter((x) => x === m).length;

/** True when lane a places above lane b: more pins, then more strikes, then more spares, then the earlier finish. */
function beats(a: Lane, b: Lane, frames: number): boolean {
  const pa = lanePins(a);
  const pb = lanePins(b);
  if (pa !== pb) return pa > pb;
  const ma = laneMarks(a);
  const mb = laneMarks(b);
  if (count(ma, 'X') !== count(mb, 'X')) return count(ma, 'X') > count(mb, 'X');
  if (count(ma, '/') !== count(mb, '/')) return count(ma, '/') > count(mb, '/');
  // A lane still bowling sorts after every finished one.
  const fa = laneDone(a, frames) ? a.doneAt : Infinity;
  const fb = laneDone(b, frames) ? b.doneAt : Infinity;
  return fa < fb;
}

/** Each lane's place (0 = first): the number of lanes that beat it, so equal lanes share. */
export function placeLanes(lanes: readonly Lane[], frames: number): number[] {
  return lanes.map((a) => lanes.filter((b) => beats(b, a, frames)).length);
}

/** Where lane k of n is shown, across the alley: lane 0 on the left as the bowlers face the pins (+x is the left). */
export function laneOffset(k: number, n: number): number {
  return ((n - 1) / 2 - k) * SIDE_BY_SIDE.laneSpacing;
}
