import type { PlayerControlInput } from '../../input';
import type { GameStateSnapshot, PlayerStateSnapshot } from '../types';

export function emptyOut(): PlayerControlInput {
  return {
    moveX: 0,
    moveZ: 0,
    turbo: false,
    shootDown: false,
    shootPressed: false,
    shootReleased: false,
    passPressed: false,
  };
}

export function steerToward(
  p: PlayerStateSnapshot,
  tx: number,
  tz: number,
  out: PlayerControlInput,
  turbo: boolean,
  stopRadius = 0.3,
): void {
  const dx = tx - p.pos[0];
  const dz = tz - p.pos[2];
  const d = Math.hypot(dx, dz);
  if (d > stopRadius) {
    out.moveX = dx / d;
    out.moveZ = dz / d;
    out.turbo = turbo;
  }
}

export function attackDir(team: 0 | 1): 1 | -1 {
  return team === 0 ? 1 : -1;
}

export function targetHoopX(state: GameStateSnapshot, team: 0 | 1): number {
  return attackDir(team) * state.court.hoopX;
}

export function targetRimX(state: GameStateSnapshot, team: 0 | 1): number {
  const dir = attackDir(team);
  return dir * state.court.hoopX + (team === 0 ? -0.36 : 0.36);
}

export function distToHoop(state: GameStateSnapshot, p: PlayerStateSnapshot): number {
  return Math.hypot(targetHoopX(state, p.team) - p.pos[0], p.pos[2]);
}

export function distToRim(state: GameStateSnapshot, p: PlayerStateSnapshot): number {
  return Math.hypot(targetRimX(state, p.team) - p.pos[0], p.pos[2]);
}

export function teammateOf(state: GameStateSnapshot, p: PlayerStateSnapshot): PlayerStateSnapshot {
  const idx = p.team === 0 ? (p.index === 0 ? 1 : 0) : p.index === 2 ? 3 : 2;
  return state.players[idx];
}

export function opponentsOf(
  state: GameStateSnapshot,
  team: 0 | 1,
): [PlayerStateSnapshot, PlayerStateSnapshot] {
  return team === 0
    ? [state.players[2], state.players[3]]
    : [state.players[0], state.players[1]];
}

export function dist2D(a: [number, number, number], b: [number, number, number]): number {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

export function dist3D(a: [number, number, number], b: [number, number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Exact dunk reach formula matching src/sim.ts. */
export function dunkReach(p: PlayerStateSnapshot, usingTurbo: boolean): number {
  return (
    3.2 +
    (p.stats.dunk / 10) * 0.24 +
    (usingTurbo ? 1.25 : 0) +
    (p.onFire ? 1.1 : 0)
  );
}

/** Closest non-stunned opponent distance (2D XZ) to player p. */
export function nearestDefenderDist(state: GameStateSnapshot, p: PlayerStateSnapshot): number {
  let best = Infinity;
  for (const opp of opponentsOf(state, p.team)) {
    if (opp.stunTimer > 0) continue;
    const d = dist2D(p.pos, opp.pos);
    if (d < best) best = d;
  }
  return best;
}

/** Exact contest penalty matching src/sim.ts releaseJumpShot(). */
export function estimateContest(state: GameStateSnapshot, p: PlayerStateSnapshot): number {
  let contest = 0;
  for (const opp of opponentsOf(state, p.team)) {
    if (opp.stunTimer > 0) continue;
    const d = dist2D(p.pos, opp.pos);
    if (d < 2.2) {
      const jumpBonus = !opp.grounded ? 0.16 : 0.06;
      contest = Math.max(
        contest,
        (1 - d / 2.2) * (0.14 + (opp.stats.defense / 10) * 0.018) + jumpBonus,
      );
    }
  }
  return contest;
}

/** Expected points per jump shot from p's current location assuming near-apex timing. */
export function expectedJumpShotPoints(
  state: GameStateSnapshot,
  p: PlayerStateSnapshot,
  timingQuality = 0.96,
): { ev: number; prob: number; isThree: boolean; contest: number } {
  const dist = distToRim(state, p);
  const isThree = dist >= state.court.threePtRadius;
  const contest = estimateContest(state, p);
  const baseChance = isThree
    ? 0.28 + (p.stats.threePt / 10) * 0.055
    : 0.44 + (p.stats.threePt / 10) * 0.042;
  const timingBonus = timingQuality * 0.22;
  const fireBonus = p.onFire ? 0.28 : 0;
  const distPenalty = Math.max(0, (dist - 8.5) * 0.045);
  const prob = Math.max(0.08, Math.min(0.96, baseChance + timingBonus + fireBonus - contest - distPenalty));
  return { ev: prob * (isThree ? 3 : 2), prob, isThree, contest };
}

/** Predicts where a loose ball will land/be in ~0.25s and steers to grab it. */
export function chaseLooseBall(state: GameStateSnapshot, p: PlayerStateSnapshot, out: PlayerControlInput): void {
  const b = state.ball;
  const leadT = Math.min(0.32, Math.max(0, b.pos[1] / 6));
  const tx = Math.max(-state.court.halfX + 0.6, Math.min(state.court.halfX - 0.6, b.pos[0] + b.vel[0] * leadT));
  const tz = Math.max(-state.court.halfZ + 0.6, Math.min(state.court.halfZ - 0.6, b.pos[2] + b.vel[2] * leadT));
  steerToward(p, tx, tz, out, true, 0.25);

  const dXZ = dist2D(p.pos, b.pos);
  if (b.pos[1] > 1.35 && b.pos[1] < 3.0 && dXZ < 1.6 && p.grounded) {
    out.shootPressed = true;
  }
}

/** Handles mid-air jump shot release with strict apex timing. */
export function handleMidAirShot(p: PlayerStateSnapshot, out: PlayerControlInput, strictApex = true): boolean {
  if (!p.isShooting) return false;
  if (strictApex) {
    if (p.vel[1] <= 0.35) {
      out.shootReleased = true;
    } else {
      out.shootDown = true;
    }
  } else {
    // Naive / early release for ablation experiments
    if (p.shootHold >= 0.06) {
      out.shootReleased = true;
    } else {
      out.shootDown = true;
    }
  }
  return true;
}

/** Shared helper: honors human teammate pass/shoot calls when playing alongside a human. */
export function honorHumanCalls(
  ctx: { role: string; humanInput: PlayerControlInput | null },
  out: PlayerControlInput,
): boolean {
  if (ctx.role !== 'teammate' || !ctx.humanInput) return false;
  if (ctx.humanInput.passPressed) {
    out.passPressed = true;
    return true;
  }
  if (ctx.humanInput.shootPressed) {
    out.shootPressed = true;
    out.shootDown = true;
    return true;
  }
  return false;
}
