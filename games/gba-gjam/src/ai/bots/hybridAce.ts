import type { BotController, BotDecisionContext, BotInput, GameStateSnapshot } from '../types';
import {
  attackDir,
  chaseLooseBall,
  dist2D,
  dist3D,
  distToHoop,
  distToRim,
  dunkReach,
  emptyOut,
  expectedJumpShotPoints,
  handleMidAirShot,
  honorHumanCalls,
  opponentsOf,
  steerToward,
  targetHoopX,
  targetRimX,
  teammateOf,
} from './helpers';

export type DefenseMode = 'passive' | 'steal-only' | 'balanced-shove' | 'relentless-shove';

export interface HybridAceOptions {
  defenseMode?: DefenseMode;
}

/**
 * Hybrid Ace: Stat-aware Expected-Value (EV) Optimizer.
 * - Reads both players' stats, defender proximity, contest, and shot clock every tick.
 * - Shoots apex-timed 3PT when EV > 2.25 and uncontested; otherwise drives for guaranteed 2.0 EV dunk.
 * - Passes to teammate whenever teammate has a materially higher EV look or is open in transition.
 * - Configurable defenseMode for controlled defense experiments (default 'balanced-shove').
 */
export function createHybridAceBot(opts: HybridAceOptions = {}): BotController {
  const defenseMode: DefenseMode = opts.defenseMode ?? 'balanced-shove';
  const suffix = defenseMode === 'balanced-shove' ? '' : `-${defenseMode}`;

  return {
    id: `hybrid-ace${suffix}`,
    name: defenseMode === 'balanced-shove' ? 'Hybrid Ace' : `Hybrid Ace (${defenseMode})`,
    decide(state: GameStateSnapshot, ctx: BotDecisionContext): BotInput {
      const out = emptyOut();
      const p = state.players[ctx.playerIndex];
      if (!p || p.stunTimer > 0 || p.isDunking) return out;

      const dir = attackDir(p.team);
      const hx = targetHoopX(state, p.team);
      const rimX = targetRimX(state, p.team);
      const mate = teammateOf(state, p);

      // Swat rising opponent jump shots if within immediate reach
      if (state.ball.mode === 'shot' && state.ball.lastTouchTeam !== p.team) {
        if (dist3D(p.pos, state.ball.pos) < 2.15 && p.grounded) {
          out.shootPressed = true;
          out.turbo = p.turbo > 25 || p.onFire;
          return out;
        }
      }

      if (state.ball.mode === 'loose') {
        chaseLooseBall(state, p, out);
        return out;
      }

      // OFFENSE WITH BALL
      if (state.ball.carrier === p.index) {
        if (honorHumanCalls(ctx, out)) return out;
        if (handleMidAirShot(p, out, true)) return out;

        const dHoop = distToHoop(state, p);
        const dRim = distToRim(state, p);
        const canTurbo = p.onFire || p.turbo > 22;
        const reach = dunkReach(p, canTurbo);
        const myShot = expectedJumpShotPoints(state, p);
        const mateShot = expectedJumpShotPoints(state, mate);

        // 1. High-EV open 3PT beats a 2.0 EV dunk! (Ensure turbo=false so we don't accidentally dunk)
        const outsideNoTurboDunk = dHoop > dunkReach(p, false) + 0.25;
        if (myShot.isThree && outsideNoTurboDunk && dRim <= 8.3 && myShot.ev >= 2.25 && myShot.contest <= 0.1) {
          out.turbo = false;
          out.shootPressed = true;
          out.shootDown = true;
          return out;
        }

        // 2. Guaranteed dunk if in reach
        if (dHoop <= reach - 0.15) {
          out.turbo = canTurbo;
          out.shootPressed = true;
          out.shootDown = true;
          return out;
        }

        // 3. Pass to teammate if they have an elite open 3PT OR are much closer to the rim
        const mateDHoop = distToHoop(state, mate);
        if (mate.stunTimer <= 0) {
          const mateOpenThree =
            mateShot.isThree &&
            mateShot.ev >= 2.35 &&
            mateShot.contest <= 0.08 &&
            distToRim(state, mate) <= 8.3 &&
            mateShot.ev > myShot.ev + 0.35;
          const mateAhead = mateDHoop + 3.0 < dHoop && mateDHoop < 6.5;
          if (mateOpenThree || mateAhead) {
            out.passPressed = true;
            return out;
          }
        }

        // 4. Emergency shot clock
        if (state.shotClock < 1.8) {
          out.turbo = false;
          out.shootPressed = true;
          out.shootDown = true;
          return out;
        }

        // 5. Movement: strong 3PT shooters hunt open arc spots; dunkers slash to the rim
        const isShooter = p.stats.threePt >= 80 && p.stats.threePt >= p.stats.dunk;
        if (isShooter && dRim > 4.5) {
          const [o1, o2] = opponentsOf(state, p.team);
          const defZ = (o1.pos[2] + o2.pos[2]) * 0.5;
          const wantZ = defZ >= 0 ? -4.2 : 4.2;
          const wantX = rimX - dir * 5.0;
          steerToward(p, wantX, wantZ, out, p.turbo > 35 || p.onFire);
        } else {
          const [o1, o2] = opponentsOf(state, p.team);
          const closer = dist2D(p.pos, o1.pos) < dist2D(p.pos, o2.pos) ? o1 : o2;
          const avoidZ = closer.pos[2] >= p.pos[2] ? -2.0 : 2.0;
          steerToward(p, hx - dir * 1.0, dHoop < 4.5 ? 0 : avoidZ, out, p.turbo > 28 || p.onFire);
        }
        return out;
      }

      // OFF-BALL OFFENSE: Role-based floor spacing
      const teamHasBall =
        state.ball.carrier !== null && state.players[state.ball.carrier]?.team === p.team;
      if (teamHasBall) {
        const wantZ = mate.pos[2] >= 0 ? -4.2 : 4.2;
        const isShooter = p.stats.threePt >= 75;
        const wantX = isShooter ? rimX - dir * 5.0 : hx - dir * 2.5;
        steerToward(p, wantX, wantZ, out, dist2D(p.pos, [wantX, 0, wantZ]) > 3.2 && p.turbo > 40);
        return out;
      }

      // DEFENSE: Controlled by defenseMode
      const carrier = state.ball.carrier !== null ? state.players[state.ball.carrier] : null;
      if (carrier) {
        const myD = dist2D(p.pos, carrier.pos);
        const mateD = dist2D(mate.pos, carrier.pos);
        const guardBall = myD <= mateD + 0.5;
        const ownHoopX = targetHoopX(state, carrier.team);

        if (guardBall) {
          const gap = defenseMode === 'passive' ? 1.3 : defenseMode === 'relentless-shove' ? 0.2 : 0.7;
          const gx = carrier.pos[0] + Math.sign(ownHoopX - carrier.pos[0]) * gap;
          const sprintThresh = defenseMode === 'relentless-shove' ? 22 : 32;
          steerToward(p, gx, carrier.pos[2] * 0.92, out, myD > 1.5 && (p.turbo > sprintThresh || p.onFire));

          if ((!carrier.grounded || carrier.isDunking) && myD < 2.25 && p.grounded) {
            out.shootPressed = true;
          } else if (
            defenseMode !== 'passive' &&
            myD < 1.6 &&
            p.stealCooldown <= 0 &&
            !carrier.isDunking &&
            carrier.stunTimer <= 0
          ) {
            out.passPressed = true;
            if (defenseMode === 'steal-only') {
              out.turbo = false;
            } else if (defenseMode === 'balanced-shove') {
              out.turbo = p.onFire || p.turbo >= 35;
            } else if (defenseMode === 'relentless-shove') {
              out.turbo = p.onFire || p.turbo >= 22;
            }
          }
        } else {
          const oppOff = opponentsOf(state, p.team).find((o) => o.index !== carrier.index);
          if (oppOff) {
            const gx = (oppOff.pos[0] + ownHoopX * 0.3) / 1.3;
            steerToward(p, gx, oppOff.pos[2] * 0.88, out, false);
          }
        }
      }

      return out;
    },
  };
}
