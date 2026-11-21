import { COURT_HALF_X, COURT_HALF_Z, HOOP_X, HOOP_Y, THREE_PT_RADIUS } from '../arena';
import type { PlayerControlInput } from '../input';
import type { JamSimulation, SimPlayer } from '../sim';
import type { BotInput, GameStateSnapshot, PlayerStateSnapshot } from './types';

function snapshotPlayer(p: SimPlayer): PlayerStateSnapshot {
  return {
    index: p.index,
    team: p.team,
    name: p.profile.name,
    pos: [p.pos.x, p.pos.y, p.pos.z],
    vel: [p.vel.x, p.vel.y, p.vel.z],
    facing: p.facing,
    grounded: p.grounded,
    turbo: p.turbo,
    streak: p.streak,
    onFire: p.onFire,
    stunTimer: p.stunTimer,
    shoveTimer: p.shoveTimer,
    stealCooldown: p.stealCooldown,
    isShooting: p.isShooting,
    shootHold: p.shootHold,
    isDunking: p.dunk !== null,
    stats: { ...p.profile.stats },
  };
}

/** Builds a pure, JSON-serializable GameStateSnapshot from a JamSimulation instance. */
export function captureGameState(sim: JamSimulation): GameStateSnapshot {
  const b = sim.ball;
  const p = sim.players;
  return {
    tick: sim.tick,
    phase: sim.phase,
    quarter: sim.quarter,
    clockSec: sim.clockSec,
    shotClock: sim.shotClock,
    score: [sim.score[0], sim.score[1]],
    inboundTeam: sim.inboundTeam,
    court: {
      halfX: COURT_HALF_X,
      halfZ: COURT_HALF_Z,
      hoopX: HOOP_X,
      hoopY: HOOP_Y,
      threePtRadius: THREE_PT_RADIUS,
    },
    ball: {
      pos: [b.pos.x, b.pos.y, b.pos.z],
      vel: [b.vel.x, b.vel.y, b.vel.z],
      carrier: b.carrier,
      mode: b.mode,
      shooter: b.shooter,
      passTarget: b.passTarget,
      isThreeAttempt: b.isThreeAttempt,
      onFire: b.onFire,
      lastTouchTeam: b.lastTouchTeam,
    },
    players: [
      snapshotPlayer(p[0]),
      snapshotPlayer(p[1]),
      snapshotPlayer(p[2]),
      snapshotPlayer(p[3]),
    ],
  };
}

function clampUnit(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 0;
  return Math.max(-1, Math.min(1, v));
}

/** Normalizes partial/untrusted bot output into a valid PlayerControlInput. */
export function normalizeBotInput(raw: BotInput | null | undefined): PlayerControlInput {
  if (!raw || typeof raw !== 'object') {
    return {
      moveX: 0,
      moveZ: 0,
      turbo: false,
      shootDown: false,
      shootPressed: false,
      shootReleased: false,
      passPressed: false,
      fakePressed: false,
    };
  }
  let moveX = clampUnit(raw.moveX);
  let moveZ = clampUnit(raw.moveZ);
  const mag = Math.hypot(moveX, moveZ);
  if (mag > 1) {
    moveX /= mag;
    moveZ /= mag;
  }
  return {
    moveX,
    moveZ,
    turbo: Boolean(raw.turbo),
    shootDown: Boolean(raw.shootDown),
    shootPressed: Boolean(raw.shootPressed),
    shootReleased: Boolean(raw.shootReleased),
    passPressed: Boolean(raw.passPressed),
    fakePressed: Boolean(raw.fakePressed),
  };
}
