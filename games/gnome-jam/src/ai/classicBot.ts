import type { PlayerControlInput } from '../input';
import type {
  BotController,
  BotDecisionContext,
  BotInput,
  GameStateSnapshot,
  PlayerStateSnapshot,
} from './types';

function steerToward(
  p: PlayerStateSnapshot,
  tx: number,
  tz: number,
  out: PlayerControlInput,
  turbo: boolean,
): void {
  const dx = tx - p.pos[0];
  const dz = tz - p.pos[2];
  const d = Math.hypot(dx, dz);
  if (d > 0.35) {
    out.moveX = dx / d;
    out.moveZ = dz / d;
    out.turbo = turbo;
  }
}

function emptyOut(): PlayerControlInput {
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

/**
 * Pure-snapshot implementation of the classic GBA GJAM AI.
 * Works identically for teammates, opponents, or full bot-vs-bot matches.
 */
export function decideClassicBot(state: GameStateSnapshot, ctx: BotDecisionContext): BotInput {
  const out = emptyOut();
  const p = state.players[ctx.playerIndex];
  if (!p || p.stunTimer > 0 || p.isDunking) return out;

  const diffScale =
    ctx.role === 'teammate'
      ? 0.92
      : ctx.difficulty === 'rookie'
        ? 0.65
        : ctx.difficulty === 'allstar'
          ? 1.08
          : 0.88;

  const attackDir = p.team === 0 ? 1 : -1;
  const hx = attackDir * state.court.hoopX;
  const mateIdx = p.team === 0 ? (p.index === 0 ? 1 : 0) : p.index === 2 ? 3 : 2;
  const mate = state.players[mateIdx];

  const hasBall = state.ball.carrier === p.index;
  const teamHasBall =
    state.ball.carrier !== null && state.players[state.ball.carrier]?.team === p.team;

  // 1. Loose ball -> sprint to grab rebound!
  if (state.ball.mode === 'loose') {
    steerToward(p, state.ball.pos[0], state.ball.pos[2], out, true);
    const distBall = Math.hypot(
      p.pos[0] - state.ball.pos[0],
      p.pos[1] - state.ball.pos[1],
      p.pos[2] - state.ball.pos[2],
    );
    if (state.ball.pos[1] > 1.5 && distBall < 1.8 && p.grounded) {
      out.shootPressed = true;
    }
    return out;
  }

  // 2. AI HAS THE BALL
  if (hasBall) {
    if (ctx.role === 'teammate' && ctx.humanInput?.passPressed) {
      out.passPressed = true;
      return out;
    }
    if (ctx.role === 'teammate' && ctx.humanInput?.shootPressed) {
      out.shootPressed = true;
      out.shootDown = true;
      return out;
    }

    const distHoop = Math.hypot(hx - p.pos[0], p.pos[2]);
    const preferThree =
      p.stats.threePt >= 80 &&
      Math.abs(p.pos[2]) > 2.0 &&
      distHoop < 7.2 &&
      distHoop > state.court.threePtRadius + 0.3;

    if (distHoop < 3.4 + (p.stats.dunk / 10) * 0.16) {
      out.turbo = true;
      out.shootPressed = true;
      out.shootDown = true;
      return out;
    }

    if (preferThree && Math.random() < 0.035 * diffScale) {
      out.shootPressed = true;
      out.shootDown = true;
      return out;
    }

    const mateDistHoop = Math.hypot(hx - mate.pos[0], mate.pos[2]);
    if (mateDistHoop + 2.5 < distHoop && Math.random() < 0.025 * diffScale) {
      out.passPressed = true;
      return out;
    }

    const targetZ = Math.sin(state.clockSec * 1.4 + p.index) * 2.2;
    steerToward(p, hx - attackDir * 1.4, targetZ, out, p.turbo > 35 && distHoop < 9);
    if (p.isShooting && p.vel[1] <= 0.3) {
      out.shootReleased = true;
    } else if (p.isShooting) {
      out.shootDown = true;
    }
    return out;
  }

  // 3. TEAMMATE HAS THE BALL (Off-ball offense!)
  if (teamHasBall) {
    const wantZ = mate.pos[2] >= 0 ? -3.0 : 3.0;
    const wantX =
      p.stats.dunk >= 70
        ? hx - attackDir * 2.6
        : hx - attackDir * (state.court.threePtRadius + 0.7);
    steerToward(p, wantX, wantZ, out, Math.hypot(wantX - p.pos[0], wantZ - p.pos[2]) > 3.5);
    return out;
  }

  // 4. DEFENSE!
  const carrier = state.ball.carrier !== null ? state.players[state.ball.carrier] : null;
  if (carrier) {
    const myDist = Math.hypot(
      p.pos[0] - carrier.pos[0],
      p.pos[1] - carrier.pos[1],
      p.pos[2] - carrier.pos[2],
    );
    const mateDist = Math.hypot(
      mate.pos[0] - carrier.pos[0],
      mate.pos[1] - carrier.pos[1],
      mate.pos[2] - carrier.pos[2],
    );
    const guardBall = myDist <= mateDist + 0.5;
    const ownHoopX = (carrier.team === 0 ? 1 : -1) * state.court.hoopX;

    if (guardBall) {
      const gx = carrier.pos[0] + Math.sign(ownHoopX - carrier.pos[0]) * 1.1;
      const gz = carrier.pos[2] * 0.92;
      steerToward(p, gx, gz, out, myDist > 2.4 && p.turbo > 30);

      if (myDist < 1.55 && p.stealCooldown <= 0 && Math.random() < 1.6 * diffScale * ctx.dt) {
        out.passPressed = true;
        out.turbo = Math.random() < 0.45 * diffScale;
      }
      if ((!carrier.grounded || carrier.isDunking) && myDist < 2.3 && p.grounded && Math.random() < 0.25 * diffScale) {
        out.shootPressed = true;
      }
    } else {
      const oppOff = state.players.find((o) => o.team !== p.team && o.index !== carrier.index);
      if (oppOff) {
        const gx = (oppOff.pos[0] + ownHoopX * 0.35) / 1.35;
        steerToward(p, gx, oppOff.pos[2] * 0.85, out, false);
      }
    }
  }

  return out;
}

export function createClassicBot(): BotController {
  return {
    id: 'classic',
    name: 'Classic Jam AI',
    decide: decideClassicBot,
  };
}
