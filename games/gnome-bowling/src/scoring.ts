// Ten-pin scoring, pure functions over a player's roll list (pins knocked by each ball, in order).

/** Where a roll list stands: the frame (0..9) and ball (0..2) to bowl next, and whether the game is done. */
export interface Cursor {
  frame: number;
  ball: number;
  done: boolean;
  /** Pins standing before the next ball when it is not a fresh rack (second ball of a frame, or a 10th-frame fill ball after a non-strike/non-spare). */
  fresh: boolean;
}

/** Splits rolls into frames: frames[f] = the rolls bowled in frame f (the 10th may hold 3). */
export function framesOf(rolls: readonly number[]): number[][] {
  const frames: number[][] = [];
  let i = 0;
  for (let f = 0; f < 10 && i < rolls.length; f++) {
    if (f < 9) {
      if (rolls[i] === 10) {
        frames.push([10]);
        i += 1;
      } else {
        frames.push(rolls.slice(i, i + 2));
        i += 2;
      }
    } else {
      frames.push(rolls.slice(i, i + 3));
      i = rolls.length;
    }
  }
  return frames;
}

export function cursor(rolls: readonly number[]): Cursor {
  const frames = framesOf(rolls);
  if (frames.length === 0) return { frame: 0, ball: 0, done: false, fresh: true };
  const f = frames.length - 1;
  const fr = frames[f];
  if (f < 9) {
    if (fr[0] === 10 || fr.length === 2) return { frame: f + 1, ball: 0, done: false, fresh: true };
    return { frame: f, ball: 1, done: false, fresh: false };
  }
  // Tenth frame.
  if (fr.length === 1) return { frame: 9, ball: 1, done: false, fresh: fr[0] === 10 };
  if (fr.length === 2) {
    const strikeOrSpare = fr[0] === 10 || fr[0] + fr[1] === 10;
    if (!strikeOrSpare) return { frame: 9, ball: 2, done: true, fresh: true };
    // Fresh rack after X X, or after a spare; after X then 7 the third ball is at the 3 left.
    const fresh = (fr[0] === 10 && fr[1] === 10) || (fr[0] !== 10 && fr[0] + fr[1] === 10);
    return { frame: 9, ball: 2, done: false, fresh };
  }
  return { frame: 9, ball: 3, done: true, fresh: true };
}

/** Running total after each frame, or null where it cannot be known yet (bonus balls not bowled). */
export function frameScores(rolls: readonly number[]): (number | null)[] {
  const out: (number | null)[] = [];
  let i = 0;
  let total = 0;
  for (let f = 0; f < 10; f++) {
    if (i >= rolls.length) {
      out.push(null);
      continue;
    }
    let add: number | null;
    if (f === 9) {
      const fr = rolls.slice(i, i + 3);
      const need = fr[0] === 10 || fr[0] + (fr[1] ?? 0) === 10 ? 3 : 2;
      add = fr.length >= need ? fr.slice(0, need).reduce((a, b) => a + b, 0) : null;
      i = rolls.length;
    } else if (rolls[i] === 10) {
      add = i + 2 < rolls.length ? 10 + rolls[i + 1] + rolls[i + 2] : null;
      i += 1;
    } else if (i + 1 < rolls.length) {
      const two = rolls[i] + rolls[i + 1];
      add = two === 10 ? (i + 2 < rolls.length ? 10 + rolls[i + 2] : null) : two;
      i += 2;
    } else {
      add = null;
      i += 2;
    }
    if (add === null || (out.length > 0 && out[out.length - 1] === null)) {
      out.push(null);
    } else {
      total += add;
      out.push(total);
    }
  }
  return out;
}

/** Latest known total (0 before any complete frame). */
export function totalScore(rolls: readonly number[]): number {
  let best = 0;
  for (const s of frameScores(rolls)) if (s !== null) best = s;
  return best;
}

/** Highest total still possible (all strikes from here). Used to rank players mid-game. */
export function maxPossible(rolls: readonly number[]): number {
  const fill = rolls.slice();
  // Knock everything that is standing: a fresh rack has 10, otherwise 10 minus the last ball.
  for (let c = cursor(fill); !c.done; c = cursor(fill)) fill.push(c.fresh ? 10 : 10 - fill[fill.length - 1]);
  return totalScore(fill);
}

/**
 * Scoreboard marks for each ball of each frame: 'X' strike, '/' spare, '-' zero, else the digit.
 * Always 10 entries; frames not bowled yet are [].
 */
export function frameMarks(rolls: readonly number[]): string[][] {
  const frames = framesOf(rolls);
  const out: string[][] = [];
  for (let f = 0; f < 10; f++) {
    const fr = frames[f] ?? [];
    const marks: string[] = [];
    let fresh = true; // the next ball meets a full rack
    let first = 0;    // pins the rack's first ball knocked
    for (const n of fr) {
      if (fresh && n === 10) {
        marks.push('X');
      } else if (!fresh && first + n === 10) {
        marks.push('/');
        fresh = true;
      } else {
        marks.push(n === 0 ? '-' : String(n));
        if (fresh) {
          first = n;
          fresh = false;
        } else {
          fresh = true;
        }
      }
    }
    out.push(marks);
  }
  return out;
}

/**
 * A split: the head pin is down, at least two pins stand, and the standing pins fall into two or more
 * groups with no standing pin between them (neighbours: pins next to each other in a row or touching
 * diagonally in the next row).
 */
export function isSplit(standing: readonly boolean[]): boolean {
  if (standing[0]) return false;
  const up: number[] = [];
  for (let i = 0; i < 10; i++) if (standing[i]) up.push(i);
  if (up.length < 2) return false;
  const seen = new Set<number>([up[0]]);
  const stack = [up[0]];
  while (stack.length > 0) {
    const p = stack.pop() as number;
    for (const q of NEIGHBOURS[p]) {
      if (standing[q] && !seen.has(q)) {
        seen.add(q);
        stack.push(q);
      }
    }
  }
  return seen.size < up.length;
}

// Pin neighbours (0-based) on the triangle: 1 / 2 3 / 4 5 6 / 7 8 9 10.
const NEIGHBOURS: readonly (readonly number[])[] = [
  [1, 2],          // 1
  [0, 2, 3, 4],    // 2
  [0, 1, 4, 5],    // 3
  [1, 4, 6, 7],    // 4
  [1, 2, 3, 5, 7, 8], // 5
  [2, 4, 8, 9],    // 6
  [3, 7],          // 7
  [3, 4, 6, 8],    // 8
  [4, 5, 7, 9],    // 9
  [5, 8],          // 10
];
