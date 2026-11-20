// Gnome Billiards rules: 8-ball with groups. Pure functions, no DOM. The judge reads the balls before a shot and the
// shot's events, and says who wins, who is next, and whether the next player has ball in hand.
import { BALL_R, CUE_BALL, EIGHT_BALL, TABLE_H, TABLE_W } from './config';
import { copyBalls, type Ball, type ShotEvents } from './physics';

export type Group = 'solid' | 'stripe';

export interface Match {
  balls: Ball[];
  /** The group each slot owns, or null while the table is still open. */
  groups: (Group | null)[];
  /** The slot whose shot it is. */
  turn: number;
  /** The player to move has to place the cue ball (after a foul). */
  ballInHand: boolean;
  /** The winning slot, once the game is over. */
  winner: number | null;
  shots: number;
}

export interface Verdict {
  winner: number | null;
  groups: (Group | null)[];
  nextTurn: number;
  continues: boolean;
  ballInHand: boolean;
  foul: boolean;
  scratch: boolean;
  /** Object balls pocketed on this shot, in order (never the cue ball). */
  potted: number[];
  /** Balls of the shooter's own group pocketed on this shot. */
  ownPotted: number;
  /** Why it was a foul, and what happened to the 8 ball: short words the game turns into a line of text. */
  reasons: string[];
}

export function groupOf(id: number): Group | null {
  if (id >= 1 && id <= 7) return 'solid';
  if (id >= 9 && id <= 15) return 'stripe';
  return null;
}

export function otherGroup(g: Group): Group {
  return g === 'solid' ? 'stripe' : 'solid';
}

/** A small seeded generator (mulberry32). Both players build the same rack from the same seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The triangle: the cue ball on the head string, 15 object balls racked at the foot spot, the 8 in the middle. */
export function rack(seed: number): Ball[] {
  const rnd = mulberry32(seed);
  const ids: number[] = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = ids[i];
    ids[i] = ids[j];
    ids[j] = t;
  }
  const apexX = TABLE_W * 0.7;
  const cy = TABLE_H / 2;
  const rowStep = 2 * BALL_R * 0.866 * 1.003;
  const ballStep = 2 * BALL_R * 1.003;
  const spots: [number, number][] = [];
  for (let k = 0; k < 5; k++) {
    for (let i = 0; i <= k; i++) spots.push([apexX + k * rowStep, cy + (i - k / 2) * ballStep]);
  }
  const balls: Ball[] = [{ id: CUE_BALL, x: TABLE_W * 0.25, y: cy, vx: 0, vy: 0, pocketed: false }];
  let n = 0;
  for (let s = 0; s < spots.length; s++) {
    const [x, y] = spots[s];
    const id = s === 4 ? EIGHT_BALL : ids[n++];
    balls.push({ id, x, y, vx: 0, vy: 0, pocketed: false });
  }
  return balls;
}

export function newMatch(seed: number, firstTurn = 0): Match {
  return { balls: rack(seed), groups: [null, null], turn: firstTurn, ballInHand: false, winner: null, shots: 0 };
}

/** Live object balls of one group. */
function liveOf(balls: readonly Ball[], g: Group): number {
  let n = 0;
  for (const b of balls) if (!b.pocketed && b.id !== CUE_BALL && groupOf(b.id) === g) n++;
  return n;
}

/**
 * Judges one shot. `before` is the table as the shooter struck it (the cue already placed), `ev` the shot's events.
 * Fouls: the cue ball pocketed, no ball touched, the wrong ball touched first, and the 8 touched first.
 * Winning: the 8 pocketed legally after the shooter's group is cleared. Pocketing the 8 any other way loses.
 */
export function judge(before: readonly Ball[], ev: ShotEvents, groups: readonly (Group | null)[], shooter: number): Verdict {
  const opp = 1 - shooter;
  const mine = groups[shooter] ?? null;
  const reasons: string[] = [];
  const scratch = ev.pocketed.includes(CUE_BALL);
  const objPotted = ev.pocketed.filter((id) => id !== CUE_BALL);
  const eightPotted = objPotted.includes(EIGHT_BALL);
  const ownLeft = mine ? liveOf(before, mine) : -1;

  if (scratch) reasons.push('scratch');
  if (ev.firstHit === null) {
    reasons.push('no ball hit');
  } else if (mine === null) {
    if (ev.firstHit === EIGHT_BALL) reasons.push('8 ball hit first');
  } else if (ownLeft > 0) {
    if (groupOf(ev.firstHit) !== mine) reasons.push('wrong ball hit first');
  } else if (ev.firstHit !== EIGHT_BALL) {
    reasons.push('8 ball not hit first');
  }
  const foul = reasons.length > 0;

  const groupsOut: (Group | null)[] = [groups[0] ?? null, groups[1] ?? null];
  let winner: number | null = null;
  if (eightPotted) {
    const legal = mine !== null && ownLeft === 0 && !foul;
    winner = legal ? shooter : opp;
    reasons.push(legal ? '8 ball in' : '8 ball too early');
  }

  if (winner === null && !foul && mine === null) {
    const first = objPotted[0];
    if (first !== undefined) {
      const g = groupOf(first);
      if (g) {
        groupsOut[shooter] = g;
        groupsOut[opp] = otherGroup(g);
      }
    }
  }
  const myGroup = groupsOut[shooter];
  const oppGroup = groupsOut[opp];
  const ownBalls = myGroup ? objPotted.filter((id) => groupOf(id) === myGroup).length : 0;
  const oppBalls = oppGroup ? objPotted.filter((id) => groupOf(id) === oppGroup).length : 0;

  const continues = winner === null && !foul && ownBalls > 0 && oppBalls === 0;
  return {
    winner,
    groups: groupsOut,
    nextTurn: continues ? shooter : opp,
    continues,
    ballInHand: winner === null && foul,
    foul,
    scratch,
    potted: objPotted,
    ownPotted: ownBalls,
    reasons,
  };
}

/** Applies a verdict to a match (`after` is the table once the shot has settled). */
export function applyVerdict(m: Match, after: readonly Ball[], v: Verdict): void {
  m.balls = copyBalls(after);
  m.groups = [...v.groups];
  m.turn = v.nextTurn;
  m.ballInHand = v.ballInHand;
  m.winner = v.winner;
  m.shots++;
}
