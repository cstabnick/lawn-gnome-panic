// Fennel's lines: ride through the gates of a line in order, within its time limit. Pure: no three.js.
import { SKATE_LINES, SKATE_ORIGIN, type BoardState, type LineEvent, type LineId, type SkateLine } from './types';

export interface LineRun { line: SkateLine; next: number; t: number; started: boolean; done: boolean }

export function lineById(id: LineId): SkateLine {
  const line = SKATE_LINES.find((l) => l.id === id);
  if (!line) throw new Error(`unknown skate line: ${id}`);
  return line;
}

export function newLineRun(line: SkateLine): LineRun {
  return { line, next: 0, t: 0, started: false, done: false };
}

/** One frame: the board's position and mode. A gate counts when the board is within its r (park frame: u = b.x -
 *  SKATE_ORIGIN.x, v = b.z - SKATE_ORIGIN.z) in the state it needs ('air': mode 'air', 'grind': mode 'grind').
 *  The clock starts at the first gate. Fails on time (t > timeLimit) or when the board bails (mode 'bail').
 *  Gate events carry the 0-based index of the gate just passed. */
export function stepLineRun(run: LineRun, b: BoardState, dt: number): LineEvent {
  if (run.done) return null;
  if (b.mode === 'bail') {
    run.done = true;
    return { kind: 'fail', reason: 'bail' };
  }
  if (run.started) {
    run.t += dt;
    if (run.t > run.line.timeLimit) {
      run.done = true;
      return { kind: 'fail', reason: 'time' };
    }
  }
  const gates = run.line.gates;
  const gate = gates[run.next];
  const u = b.x - SKATE_ORIGIN.x;
  const v = b.z - SKATE_ORIGIN.z;
  const near = Math.hypot(u - gate.u, v - gate.v) <= gate.r;
  const stateOk = gate.need === 'any' || gate.need === b.mode;
  if (!near || !stateOk) return null;

  const index = run.next;
  if (index === 0) run.started = true;
  run.next++;
  if (run.next === gates.length) {
    run.done = true;
    return { kind: 'done', time: run.t };
  }
  return { kind: 'gate', index, of: gates.length };
}

/** The attempt ends because the player got off the board: { kind: 'fail', reason: 'off' } unless it is already over. */
export function abortLineRun(run: LineRun): LineEvent {
  if (run.done) return null;
  run.done = true;
  return { kind: 'fail', reason: 'off' };
}
