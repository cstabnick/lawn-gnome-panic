import type { BotController, BotDecisionContext, BotInput, GameStateSnapshot } from '../types';
import {
  attackDir,
  chaseLooseBall,
  dist2D,
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
  teammateOf,
} from './helpers';

export interface FireFeederOptions {
  /** Whether to actively pass to a teammate with a hotter streak / onFire. Default true. */
  funnelFire?: boolean;
}

/**
 * Fire Feeder: Streak & "ON FIRE!" Specialist.
 * - Funnels possessions via safe passes to whichever teammate has streak >= 1 or is ON FIRE.
 * - Uses high-certainty dunks to ignite streaks (3 in a row = infinite turbo, unblockable dunks, +28% shooting).
 * - Once ON FIRE, attacks ruthlessly with unblockable Meteor Dunks and boosted Fire 3s.
 */
export function createFireFeederBot(opts: FireFeederOptions = {}): BotController {
  const funnelFire = opts.funnelFire ?? true;

  return {
    id: funnelFire ? 'fire-feeder' : 'fire-feeder-nofunnel',
    name: funnelFire ? 'Fire Feeder' : 'Fire Feeder (No Funnel)',
    decide(state: GameStateSnapshot, ctx: BotDecisionContext): BotInput {
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

      // OFFENSE WITH BALL
      if (state.ball.carrier === p.index) {
        if (honorHumanCalls(ctx, out)) return out;
        if (handleMidAirShot(p, out, true)) return out;

        // 1. Hot-hand funnel: if teammate is onFire (and I'm not) or has a strictly higher streak, feed them!
        const mateHotter =
          funnelFire &&
          mate.stunTimer <= 0 &&
          ((mate.onFire && !p.onFire) || (!p.onFire && mate.streak > p.streak && mate.streak >= 1));

        if (mateHotter && state.shotClock > 3.5) {
          out.passPressed = true;
          return out;
        }

        const dHoop = distToHoop(state, p);
        const canTurbo = p.onFire || p.turbo > 22;
        const reach = dunkReach(p, canTurbo);

        // 2. If ON FIRE: unblockable Meteor Dunk or boosted open 3PT!
        if (p.onFire) {
          const shot = expectedJumpShotPoints(state, p);
          if (shot.isThree && shot.contest <= 0.14 && distToRim(state, p) <= 8.4 && dHoop > dunkReach(p, false) + 0.2) {
            out.turbo = false;
            out.shootPressed = true;
            out.shootDown = true;
            return out;
          }
          if (dHoop <= reach - 0.1) {
            out.turbo = true;
            out.shootPressed = true;
            out.shootDown = true;
            return out;
          }
          steerToward(p, hx - dir * 1.0, 0, out, true);
          return out;
        }

        // 3. Building a streak: prioritize high-certainty dunks (2.0 EV, ~95%+ make rate) to reach 3-in-a-row!
        if (dHoop <= reach - 0.15) {
          out.turbo = canTurbo;
          out.shootPressed = true;
          out.shootDown = true;
          return out;
        }

        // If wide open for a high-EV 3PT (e.g. >= 2.55 EV) and not at streak 2 (where we want guaranteed dunk)
        const shot = expectedJumpShotPoints(state, p);
        if (p.streak < 2 && shot.isThree && shot.ev >= 2.55 && dHoop > dunkReach(p, false) + 0.25) {
          out.turbo = false;
          out.shootPressed = true;
          out.shootDown = true;
          return out;
        }

        if (state.shotClock < 1.8) {
          out.shootPressed = true;
          out.shootDown = true;
          return out;
        }

        // Drive hard to the basket
        const [o1, o2] = opponentsOf(state, p.team);
        const closer = dist2D(p.pos, o1.pos) < dist2D(p.pos, o2.pos) ? o1 : o2;
        const laneZ = closer.pos[2] >= p.pos[2] ? -1.8 : 1.8;
        steerToward(p, hx - dir * 1.0, dHoop < 4.5 ? 0 : laneZ, out, p.turbo > 30);
        return out;
      }

      // OFF-BALL OFFENSE
      const teamHasBall =
        state.ball.carrier !== null && state.players[state.ball.carrier]?.team === p.team;
      if (teamHasBall) {
        // If I'm the hot hand, sprint toward dunk lane so teammate can feed me immediately
        const imHot = funnelFire && (p.onFire || p.streak > mate.streak);
        const wantZ = mate.pos[2] >= 0 ? -2.6 : 2.6;
        const wantX = imHot ? hx - dir * 2.5 : hx - dir * 5.2;
        steerToward(p, wantX, wantZ, out, imHot || p.onFire);
        return out;
      }

      // DEFENSE: Protect our fire! Never let opponent score when we have an active streak/fire.
      const carrier = state.ball.carrier !== null ? state.players[state.ball.carrier] : null;
      if (carrier) {
        const myD = dist2D(p.pos, carrier.pos);
        const mateD = dist2D(mate.pos, carrier.pos);
        const weHaveStreak = p.onFire || mate.onFire || p.streak >= 2 || mate.streak >= 2;
        const guardBall = myD <= mateD + 0.5;
        const ownHoopX = targetHoopX(state, carrier.team);

        if (guardBall) {
          const gx = carrier.pos[0] + Math.sign(ownHoopX - carrier.pos[0]) * 0.9;
          steerToward(p, gx, carrier.pos[2] * 0.92, out, myD > 1.8 && (p.turbo > 25 || p.onFire || weHaveStreak));
          if (myD < 1.6 && p.stealCooldown <= 0 && !carrier.isDunking && carrier.stunTimer <= 0) {
            out.passPressed = true;
            out.turbo = p.onFire || p.turbo >= (weHaveStreak ? 24 : 38);
          }
          if ((!carrier.grounded || carrier.isDunking) && myD < 2.3 && p.grounded) {
            out.shootPressed = true;
          }
        } else {
          const oppOff = opponentsOf(state, p.team).find((o) => o.index !== carrier.index);
          if (oppOff) {
            const gx = (oppOff.pos[0] + ownHoopX * 0.35) / 1.35;
            steerToward(p, gx, oppOff.pos[2] * 0.85, out, false);
          }
        }
      }

      return out;
    },
  };
}
