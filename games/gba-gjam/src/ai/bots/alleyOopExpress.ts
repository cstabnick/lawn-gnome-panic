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

/**
 * Alley-Oop Express: Coordinated 2-man lob & dunk attack.
 * - Off-ball teammate sprints into the alley-oop zone (< 4.2m from hoop) and jumps when the handler is in range.
 * - Ball-handler watches for airborne teammate near the rim and immediately lobs the alley-oop pass!
 * - If the lane opens up for the handler, slams it home themselves.
 */
export function decideAlleyOopExpress(state: GameStateSnapshot, ctx: BotDecisionContext): BotInput {
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

    const dHoop = distToHoop(state, p);
    const mateDHoop = distToHoop(state, mate);

    // 1. LOB THE ALLEY-OOP if teammate is airborne near the hoop!
    if (!mate.grounded && mateDHoop < 4.5 && mate.stunTimer <= 0) {
      out.passPressed = true;
      return out;
    }

    // 2. If I have an open dunk myself, take it!
    const canTurbo = p.onFire || p.turbo > 20;
    if (dHoop <= dunkReach(p, canTurbo) - 0.15) {
      out.turbo = canTurbo;
      out.shootPressed = true;
      out.shootDown = true;
      return out;
    }

    if (state.shotClock < 1.8) {
      out.shootPressed = true;
      out.shootDown = true;
      return out;
    }

    // 3. Drive to the wing/top to draw defenders while teammate cuts for the lob
    const drawZ = mate.pos[2] >= 0 ? -3.0 : 3.0;
    const drawX = hx - dir * 4.8;
    // Once close to draw spot and teammate is cutting, attack rim if no oop happens
    if (dHoop < 6.0 && mateDHoop > 4.6) {
      steerToward(p, hx - dir * 1.2, drawZ * 0.5, out, p.turbo > 30 || p.onFire);
    } else {
      steerToward(p, drawX, drawZ, out, p.turbo > 35 || p.onFire);
    }
    return out;
  }

  // OFF-BALL OFFENSE: Cut to alley-oop launchpad and jump for the lob!
  const teamHasBall =
    state.ball.carrier !== null && state.players[state.ball.carrier]?.team === p.team;
  if (teamHasBall) {
    const cutZ = mate.pos[2] >= 0 ? -1.8 : 1.8;
    const cutX = hx - dir * 2.6;
    const dCut = dist2D(p.pos, [cutX, 0, cutZ]);
    const myDHoop = distToHoop(state, p);
    const mateDHoop = distToHoop(state, mate);

    steerToward(p, cutX, cutZ, out, dCut > 1.5 && (p.turbo > 25 || p.onFire));

    // Jump for the Alley-Oop once positioned near rim and handler is across half-court!
    if (myDHoop < 4.2 && mateDHoop < 11.5 && p.grounded && state.ball.mode === 'held') {
      out.shootPressed = true;
      out.turbo = p.turbo > 30 || p.onFire;
    }
    return out;
  }

  // DEFENSE: Standard aggressive man-to-man
  const carrier = state.ball.carrier !== null ? state.players[state.ball.carrier] : null;
  if (carrier) {
    const myD = dist2D(p.pos, carrier.pos);
    const mateD = dist2D(mate.pos, carrier.pos);
    const guardBall = myD <= mateD + 0.5;
    const ownHoopX = targetHoopX(state, carrier.team);

    if (guardBall) {
      const gx = carrier.pos[0] + Math.sign(ownHoopX - carrier.pos[0]) * 1.0;
      steerToward(p, gx, carrier.pos[2] * 0.9, out, myD > 2.0 && p.turbo > 30);
      if (myD < 1.58 && p.stealCooldown <= 0 && !carrier.isDunking && carrier.stunTimer <= 0) {
        out.passPressed = true;
        out.turbo = p.turbo > 38 || p.onFire;
      }
      if ((!carrier.grounded || carrier.isDunking) && myD < 2.25 && p.grounded) {
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
}

export function createAlleyOopExpressBot(): BotController {
  return {
    id: 'alley-oop-express',
    name: 'Alley-Oop Express',
    decide: decideAlleyOopExpress,
  };
}
