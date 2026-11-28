// Gnome Billiards rules: 8-ball, 9-ball, Straight Pool, and 6-ball Blitz. Pure functions, no DOM.
import { BALL_R, CUE_BALL, EIGHT_BALL, TABLE_H, TABLE_W } from './config';
import { copyBalls, POCKETS, type Ball, type ShotEvents } from './physics';

export type Group = 'solid' | 'stripe';
export type GameMode = '8ball' | '9ball' | 'straight' | '6ball' | 'bank';

export const STRAIGHT_TARGET = 8;
export const BANK_TARGET = 5;

export const GAME_MODE_META: Record<GameMode, { label: string; short: string; desc: string }> = {
  '8ball': { label: '8-Ball', short: '8-Ball', desc: 'Classic solids vs stripes. Clear your group, then sink the 8.' },
  '9ball': { label: '9-Ball', short: '9-Ball', desc: 'Hit the lowest ball first. Sink the 9 legally to win!' },
  straight: { label: 'Straight Pool', short: 'Straight', desc: 'Any ball counts (+1 pt, scratch -1). First to 8 wins.' },
  '6ball': { label: '6-Ball Blitz', short: '6-Ball', desc: 'Fast 6-ball rotation. Lowest ball first, sink the 6 to win.' },
  bank: { label: 'Bank Pool', short: 'Bank', desc: 'Balls must hit a cushion before pocketing (+1 pt). First to 5 wins!' },
};

export interface Match {
  balls: Ball[];
  /** The group each slot owns, or null while the table is still open (8-ball only). */
  groups: (Group | null)[];
  /** The slot whose shot it is. */
  turn: number;
  /** The player to move has to place the cue ball (after a foul). */
  ballInHand: boolean;
  /** The winning slot, once the game is over. */
  winner: number | null;
  shots: number;
  gameMode: GameMode;
  /** Points per slot (used in Straight Pool). */
  scores: [number, number];
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
  /** Balls of the shooter's own group pocketed on this shot (or legal pots in other modes). */
  ownPotted: number;
  /** Why it was a foul, and what happened to the money ball: short words the game turns into a line of text. */
  reasons: string[];
  /** Updated scores for Straight Pool. */
  scores?: [number, number];
  /** Balls to re-spot on the foot spot (e.g. 9-ball or 6-ball pocketed on a foul). */
  respotIds?: number[];
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

function shuffle<T>(arr: T[], rnd: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
}

/** Racks the table for the given game mode. */
export function rack(seed: number, gameMode: GameMode = '8ball'): Ball[] {
  const rnd = mulberry32(seed);
  const apexX = TABLE_W * 0.7;
  const cy = TABLE_H / 2;
  const rowStep = 2 * BALL_R * 0.866 * 1.003;
  const ballStep = 2 * BALL_R * 1.003;
  const balls: Ball[] = [{ id: CUE_BALL, x: TABLE_W * 0.25, y: cy, vx: 0, vy: 0, pocketed: false }];

  if (gameMode === '9ball' || gameMode === 'bank') {
    const ids = [2, 3, 4, 5, 6, 7, 8];
    shuffle(ids, rnd);
    const counts = [1, 2, 3, 2, 1];
    const spots: [number, number][] = [];
    for (let k = 0; k < counts.length; k++) {
      const c = counts[k];
      for (let i = 0; i < c; i++) {
        spots.push([apexX + k * rowStep, cy + (i - (c - 1) / 2) * ballStep]);
      }
    }
    let n = 0;
    for (let s = 0; s < spots.length; s++) {
      const [x, y] = spots[s];
      const id = s === 0 ? 1 : s === 4 ? 9 : ids[n++];
      balls.push({ id, x, y, vx: 0, vy: 0, pocketed: false });
    }
    return balls;
  }

  if (gameMode === '6ball') {
    const ids = [2, 3, 4, 5];
    shuffle(ids, rnd);
    const spots: [number, number][] = [];
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i <= k; i++) spots.push([apexX + k * rowStep, cy + (i - k / 2) * ballStep]);
    }
    let n = 0;
    for (let s = 0; s < spots.length; s++) {
      const [x, y] = spots[s];
      const id = s === 0 ? 1 : s === 4 ? 6 : ids[n++];
      balls.push({ id, x, y, vx: 0, vy: 0, pocketed: false });
    }
    return balls;
  }

  // 8-ball and Straight Pool: 15-ball triangle with 8 in the middle.
  const ids: number[] = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];
  shuffle(ids, rnd);
  const spots: [number, number][] = [];
  for (let k = 0; k < 5; k++) {
    for (let i = 0; i <= k; i++) spots.push([apexX + k * rowStep, cy + (i - k / 2) * ballStep]);
  }
  let n = 0;
  for (let s = 0; s < spots.length; s++) {
    const [x, y] = spots[s];
    const id = s === 4 ? EIGHT_BALL : ids[n++];
    balls.push({ id, x, y, vx: 0, vy: 0, pocketed: false });
  }
  return balls;
}

export function newMatch(seed: number, firstTurn = 0, gameMode: GameMode = '8ball'): Match {
  return {
    balls: rack(seed, gameMode),
    groups: [null, null],
    turn: firstTurn,
    ballInHand: false,
    winner: null,
    shots: 0,
    gameMode,
    scores: [0, 0],
  };
}

/** Lowest non-pocketed object ball id, or null if none remain. */
export function lowestBallId(balls: readonly Ball[]): number | null {
  let min = Infinity;
  for (const b of balls) {
    if (!b.pocketed && b.id !== CUE_BALL && b.id < min) min = b.id;
  }
  return Number.isFinite(min) ? min : null;
}

/** Legal first-hit target ball IDs for the given mode and group. */
export function legalTargetIds(balls: readonly Ball[], group: Group | null, gameMode: GameMode): number[] {
  const live = balls.filter((b) => !b.pocketed && b.id !== CUE_BALL);
  if (gameMode === '9ball' || gameMode === '6ball') {
    const low = lowestBallId(balls);
    return low !== null ? [low] : [];
  }
  if (gameMode === 'straight' || gameMode === 'bank') {
    return live.map((b) => b.id);
  }
  // 8-ball
  if (group === null) {
    const nonEight = live.filter((b) => b.id !== EIGHT_BALL);
    return (nonEight.length > 0 ? nonEight : live).map((b) => b.id);
  }
  const own = live.filter((b) => groupOf(b.id) === group);
  return (own.length > 0 ? own : live.filter((b) => b.id === EIGHT_BALL)).map((b) => b.id);
}

/** Live object balls of one group. */
function liveOf(balls: readonly Ball[], g: Group): number {
  let n = 0;
  for (const b of balls) if (!b.pocketed && b.id !== CUE_BALL && groupOf(b.id) === g) n++;
  return n;
}

/**
 * Judges one shot. `before` is the table as the shooter struck it (the cue already placed), `ev` the shot's events.
 */
export function judge(
  before: readonly Ball[],
  ev: ShotEvents,
  groups: readonly (Group | null)[],
  shooter: number,
  gameMode: GameMode = '8ball',
  scores: readonly [number, number] = [0, 0],
): Verdict {
  const opp = 1 - shooter;
  const reasons: string[] = [];
  const scratch = ev.pocketed.includes(CUE_BALL);
  const objPotted = ev.pocketed.filter((id) => id !== CUE_BALL);
  const groupsOut: (Group | null)[] = [groups[0] ?? null, groups[1] ?? null];

  if (gameMode === '9ball' || gameMode === '6ball') {
    const moneyBall = gameMode === '9ball' ? 9 : 6;
    const lowest = lowestBallId(before);
    if (scratch) reasons.push('scratch');
    if (ev.firstHit === null) {
      reasons.push('no ball hit');
    } else if (lowest !== null && ev.firstHit !== lowest) {
      reasons.push(`must hit ${lowest} ball first`);
    }
    const foul = reasons.length > 0;
    const moneyPotted = objPotted.includes(moneyBall);
    let winner: number | null = null;
    let respotIds: number[] | undefined;
    if (moneyPotted) {
      if (!foul) {
        winner = shooter;
        reasons.push(`${moneyBall} ball in`);
      } else {
        respotIds = [moneyBall];
        reasons.push(`${moneyBall} ball respotted`);
      }
    }
    const continues = winner === null && !foul && objPotted.length > 0;
    return {
      winner,
      groups: groupsOut,
      nextTurn: continues ? shooter : opp,
      continues,
      ballInHand: winner === null && foul,
      foul,
      scratch,
      potted: objPotted,
      ownPotted: foul ? 0 : objPotted.length,
      reasons,
      respotIds,
    };
  }

  if (gameMode === 'bank') {
    if (scratch) reasons.push('scratch');
    if (ev.firstHit === null) reasons.push('no ball hit');
    const foul = reasons.length > 0;
    const nextScores: [number, number] = [scores[0], scores[1]];
    const respotIds: number[] = [];
    let banked = 0;
    for (const id of objPotted) {
      if (!foul && (ev.cushionHits?.[id] ?? 0) >= 1) {
        banked++;
      } else {
        respotIds.push(id);
      }
    }
    nextScores[shooter] += banked;
    if (respotIds.length > 0 && !foul && banked === 0) {
      reasons.push('no rail bank (respotted)');
    }
    let winner: number | null = null;
    if (nextScores[shooter] >= BANK_TARGET) {
      winner = shooter;
    } else {
      const liveAfter = before.filter((b) => !b.pocketed && b.id !== CUE_BALL && !objPotted.includes(b.id)).length + respotIds.length;
      if (liveAfter <= 0) {
        winner = nextScores[shooter] >= nextScores[opp] ? shooter : opp;
      }
    }
    const continues = winner === null && !foul && banked > 0;
    return {
      winner,
      groups: groupsOut,
      nextTurn: continues ? shooter : opp,
      continues,
      ballInHand: winner === null && foul,
      foul,
      scratch,
      potted: objPotted,
      ownPotted: banked,
      reasons,
      scores: nextScores,
      respotIds: respotIds.length > 0 ? respotIds : undefined,
    };
  }

  if (gameMode === 'straight') {
    if (scratch) reasons.push('scratch');
    if (ev.firstHit === null) reasons.push('no ball hit');
    const foul = reasons.length > 0;
    const nextScores: [number, number] = [scores[0], scores[1]];
    if (!foul) nextScores[shooter] += objPotted.length;
    if (scratch) nextScores[shooter] = Math.max(0, nextScores[shooter] - 1);

    let winner: number | null = null;
    if (nextScores[shooter] >= STRAIGHT_TARGET) {
      winner = shooter;
    } else {
      const liveBefore = before.filter((b) => !b.pocketed && b.id !== CUE_BALL).length;
      if (liveBefore - objPotted.length <= 0) {
        winner = nextScores[shooter] >= nextScores[opp] ? shooter : opp;
      }
    }
    const continues = winner === null && !foul && objPotted.length > 0;
    return {
      winner,
      groups: groupsOut,
      nextTurn: continues ? shooter : opp,
      continues,
      ballInHand: winner === null && foul,
      foul,
      scratch,
      potted: objPotted,
      ownPotted: foul ? 0 : objPotted.length,
      reasons,
      scores: nextScores,
    };
  }

  // 8-ball
  const mine = groups[shooter] ?? null;
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

function isSpotClear(balls: readonly Ball[], x: number, y: number, ignoreId: number): boolean {
  const R = BALL_R;
  if (x < R || x > TABLE_W - R || y < R || y > TABLE_H - R) return false;
  for (const p of POCKETS) {
    if ((x - p.x) ** 2 + (y - p.y) ** 2 < (p.r + R) ** 2) return false;
  }
  for (const b of balls) {
    if (b.pocketed || b.id === ignoreId) continue;
    if ((x - b.x) ** 2 + (y - b.y) ** 2 < (2 * R + 0.002) ** 2) return false;
  }
  return true;
}

/** Places a respotted ball on the foot spot or the nearest clear spot behind it toward the foot rail. */
function respotBall(balls: Ball[], id: number): void {
  const b = balls.find((x) => x.id === id);
  if (!b) return;
  const y = TABLE_H / 2;
  for (let x = TABLE_W * 0.7; x <= TABLE_W - BALL_R * 1.5; x += BALL_R * 0.5) {
    if (isSpotClear(balls, x, y, id)) {
      b.x = x;
      b.y = y;
      b.vx = 0;
      b.vy = 0;
      b.pocketed = false;
      return;
    }
  }
  b.x = TABLE_W * 0.7;
  b.y = y;
  b.vx = 0;
  b.vy = 0;
  b.pocketed = false;
}

/** Applies a verdict to a match (`after` is the table once the shot has settled). */
export function applyVerdict(m: Match, after: readonly Ball[], v: Verdict): void {
  m.balls = copyBalls(after);
  if (v.respotIds) {
    for (const id of v.respotIds) respotBall(m.balls, id);
  }
  m.groups = [...v.groups];
  m.turn = v.nextTurn;
  m.ballInHand = v.ballInHand;
  m.winner = v.winner;
  if (v.scores) m.scores = [v.scores[0], v.scores[1]];
  m.shots++;
}
