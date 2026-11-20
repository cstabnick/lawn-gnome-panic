import type { BotController, BotDecisionContext, BotInput, GameStateSnapshot } from '../types';
import {
  attackDir,
  chaseLooseBall,
  dist2D,
  distToHoop,
  dunkReach,
  emptyOut,
  handleMidAirShot,
  honorHumanCalls,
  opponentsOf,
  steerToward,
  targetHoopX,
  teammateOf,
} from './helpers';

export interface ShoveHoundOptions {
  /** Minimum turbo required for secondary defender to shove off-ball opponent (default 55). */
  offBallShoveTurboMin?: number;
  /** Carrier distance from hoop within which secondary defender pinches to double-team (default 6.0). */
  doubleTeamRadius?: number;
}

/**
 * Shove Hound: High-pressure physical enforcer.
 * Exploits GBA GJAM's guaranteed turbo-shove turnover mechanic on defense,
 * stuns off-ball opponents when nearby, and pushes relentless fast-break dunks.
 */
export function decideShoveHound(
  state: GameStateSnapshot,
  ctx: BotDecisionContext,
  opts: ShoveHoundOptions = {},
): BotInput {
  const offBallShoveTurboMin = opts.offBallShoveTurboMin ?? 55;
  const doubleTeamRadius = opts.doubleTeamRadius ?? 6.0;
  const out = emptyOut();
  const p = state.players[ctx.playerIndex];
  if (!p || p.stunTimer > 0 || p.isDunking) return out;

  const dir = attackDir(p.team);
  const hx = targetHoopX(state, p.team);
  const mate = teammateOf(state, p);

  if (state.ball.mode === 'loose') {
    chaseLooseBall(state, p, out);
    return out;
  }

  // OFFENSE WITH BALL: Fast-break to the rim, pass if teammate is further ahead & open
  if (state.ball.carrier === p.index) {
    if (honorHumanCalls(ctx, out)) return out;
    if (handleMidAirShot(p, out, true)) return out;

    const dHoop = distToHoop(state, p);
    const canTurbo = p.onFire || p.turbo > 20;
    const reach = dunkReach(p, canTurbo);

    if (dHoop <= reach - 0.15) {
      out.turbo = canTurbo;
      out.shootPressed = true;
      out.shootDown = true;
      return out;
    }

    // Outlet pass if teammate is significantly closer to the rim
    const mateDHoop = distToHoop(state, mate);
    if (mateDHoop + 3.0 < dHoop && mate.stunTimer <= 0) {
      out.passPressed = true;
      return out;
    }

    // Emergency shot clock heave
    if (state.shotClock < 1.8) {
      out.shootPressed = true;
      out.shootDown = true;
      return out;
    }

    // Drive toward rim with slight weave away from nearest defender
    const [o1, o2] = opponentsOf(state, p.team);
    const closer = dist2D(p.pos, o1.pos) < dist2D(p.pos, o2.pos) ? o1 : o2;
    const avoidZ = closer.pos[2] >= p.pos[2] ? -2.0 : 2.0;
    const targetZ = Math.abs(hx - p.pos[0]) < 4.5 ? 0 : avoidZ;
    steerToward(p, hx - dir * 0.9, targetZ, out, p.turbo > 25 || p.onFire);
    return out;
  }

  // OFF-BALL OFFENSE: Leak out to opposite lane for fast-break / putback
  const teamHasBall =
    state.ball.carrier !== null && state.players[state.ball.carrier]?.team === p.team;
  if (teamHasBall) {
    const laneZ = mate.pos[2] >= 0 ? -2.8 : 2.8;
    steerToward(p, hx - dir * 2.2, laneZ, out, p.turbo > 35 || p.onFire);
    return out;
  }

  // DEFENSE: Relentless turbo-shove & pickpocket pressure!
  const carrier = state.ball.carrier !== null ? state.players[state.ball.carrier] : null;
  if (carrier) {
    const myD = dist2D(p.pos, carrier.pos);
    const mateD = dist2D(mate.pos, carrier.pos);
    const primary = myD <= mateD + 0.6;

    if (primary) {
      // Sprint directly into shove range (1.65m)
      steerToward(p, carrier.pos[0], carrier.pos[2], out, myD > 1.3 && (p.turbo > 24 || p.onFire));

      if (myD < 1.6 && p.stealCooldown <= 0 && !carrier.isDunking && carrier.stunTimer <= 0) {
        out.passPressed = true;
        // Turbo-shove guarantees stun + turnover! Fall back to steal poke if low turbo.
        out.turbo = p.onFire || p.turbo >= 24;
      } else if ((!carrier.grounded || carrier.isDunking) && myD < 2.2 && p.grounded) {
        out.shootPressed = true;
      }
    } else {
      // Secondary defender: harass off-ball opponent OR double-team if carrier enters paint
      const oppOff = opponentsOf(state, p.team).find((o) => o.index !== carrier.index);
      const carrierHoopX = targetHoopX(state, carrier.team);
      const carrierDist = Math.hypot(carrierHoopX - carrier.pos[0], carrier.pos[2]);

      if (carrierDist < doubleTeamRadius) {
        // Double-team the paint drive!
        steerToward(p, carrier.pos[0], carrier.pos[2], out, myD > 1.5 && (p.turbo > 30 || p.onFire));
        if (myD < 1.6 && p.stealCooldown <= 0 && !carrier.isDunking && carrier.stunTimer <= 0) {
          out.passPressed = true;
          out.turbo = p.onFire || p.turbo >= 24;
        }
      } else if (oppOff) {
        const dOff = dist2D(p.pos, oppOff.pos);
        steerToward(p, oppOff.pos[0], oppOff.pos[2], out, p.turbo > offBallShoveTurboMin + 10 && dOff > 2.2);
        // Occasional off-ball shove to disrupt cuts
        if (
          dOff < 1.55 &&
          p.stealCooldown <= 0 &&
          Number.isFinite(offBallShoveTurboMin) &&
          (p.onFire || p.turbo > offBallShoveTurboMin) &&
          oppOff.stunTimer <= 0
        ) {
          out.passPressed = true;
          out.turbo = true;
        }
      }
    }
  }

  return out;
}

export function createShoveHoundBot(opts: ShoveHoundOptions = {}): BotController {
  return {
    id: 'shove-hound',
    name: 'Shove Hound',
    decide: (state, ctx) => decideShoveHound(state, ctx, opts),
  };
}
