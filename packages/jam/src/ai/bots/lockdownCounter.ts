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
  teammateOf,
} from './helpers';

/**
 * Lockdown Counter: Elite rim-protecting shot-blocker & transition counter-attacker.
 * - One defender pressures the ball while the other anchors the paint/rim to swat dunks and jump shots.
 * - Exploits sim.ts's 100% guaranteed block on rising jump shots within 2.2m.
 * - Immediately pushes fast-break outlet passes after stops and takes high-EV open looks.
 */
export function decideLockdownCounter(state: GameStateSnapshot, ctx: BotDecisionContext): BotInput {
  const out = emptyOut();
  const p = state.players[ctx.playerIndex];
  if (!p || p.stunTimer > 0 || p.isDunking) return out;

  const dir = attackDir(p.team);
  const hx = targetHoopX(state, p.team);
  const mate = teammateOf(state, p);

  // 1. In-flight opponent shot -> JUMP TO SWAT IT if within 2.2m!
  if (state.ball.mode === 'shot' && state.ball.lastTouchTeam !== p.team) {
    const dBall3D = dist3D(p.pos, state.ball.pos);
    if (dBall3D < 2.15 && p.grounded) {
      out.shootPressed = true;
      out.turbo = p.turbo > 25 || p.onFire;
      return out;
    }
    // Otherwise box out near our own hoop for the rebound!
    const defHoopX = -hx;
    const boxX = defHoopX + dir * 2.1;
    steerToward(p, boxX, state.ball.pos[2] * 0.4, out, true);
    return out;
  }

  if (state.ball.mode === 'loose') {
    chaseLooseBall(state, p, out);
    return out;
  }

  // 2. OFFENSE WITH BALL: Smart counter-attack
  if (state.ball.carrier === p.index) {
    if (honorHumanCalls(ctx, out)) return out;
    if (handleMidAirShot(p, out, true)) return out;

    const dHoop = distToHoop(state, p);
    const canTurbo = p.onFire || p.turbo > 22;
    const reach = dunkReach(p, canTurbo);

    // Check high-EV open 3PT first for strong shooters
    const shot = expectedJumpShotPoints(state, p);
    if (
      shot.isThree &&
      shot.ev >= 2.4 &&
      shot.contest <= 0.1 &&
      dHoop > dunkReach(p, false) + 0.25 &&
      distToRim(state, p) <= 8.2
    ) {
      out.turbo = false;
      out.shootPressed = true;
      out.shootDown = true;
      return out;
    }

    if (dHoop <= reach - 0.15) {
      out.turbo = canTurbo;
      out.shootPressed = true;
      out.shootDown = true;
      return out;
    }

    // Outlet pass to teammate ahead in transition
    const mateDHoop = distToHoop(state, mate);
    if (mateDHoop + 2.8 < dHoop && mate.stunTimer <= 0) {
      out.passPressed = true;
      return out;
    }

    if (state.shotClock < 1.8) {
      out.shootPressed = true;
      out.shootDown = true;
      return out;
    }

    steerToward(p, hx - dir * 1.1, p.pos[2] * 0.4, out, p.turbo > 30 || p.onFire);
    return out;
  }

  // 3. OFF-BALL OFFENSE: Leak out to opposite wing/lane
  const teamHasBall =
    state.ball.carrier !== null && state.players[state.ball.carrier]?.team === p.team;
  if (teamHasBall) {
    const wantZ = mate.pos[2] >= 0 ? -3.4 : 3.4;
    const wantX = p.stats.threePt >= 75 ? hx - dir * 5.2 : hx - dir * 2.5;
    steerToward(p, wantX, wantZ, out, p.turbo > 40 || p.onFire);
    return out;
  }

  // 4. LOCKDOWN DEFENSE: One on-ball shadow, one rim-protector anchor!
  const carrier = state.ball.carrier !== null ? state.players[state.ball.carrier] : null;
  if (carrier) {
    const ownHoopX = targetHoopX(state, carrier.team);
    const myD = dist2D(p.pos, carrier.pos);
    const mateD = dist2D(mate.pos, carrier.pos);
    // Higher defense stat prefers anchoring the rim if roughly equidistant
    const isRimAnchor =
      p.stats.defense > mate.stats.defense
        ? myD > mateD - 0.8
        : myD > mateD + 0.5;

    if (!isRimAnchor) {
      // Tight on-ball containment between carrier and rim
      const toHoopX = ownHoopX - carrier.pos[0];
      const toHoopZ = -carrier.pos[2];
      const len = Math.max(0.01, Math.hypot(toHoopX, toHoopZ));
      const gx = carrier.pos[0] + (toHoopX / len) * 0.85;
      const gz = carrier.pos[2] + (toHoopZ / len) * 0.85;
      steerToward(p, gx, gz, out, myD > 1.8 && (p.turbo > 25 || p.onFire));

      // Jump to block airborne shooter or dunker!
      if ((!carrier.grounded || carrier.isDunking) && myD < 2.25 && p.grounded) {
        out.shootPressed = true;
        out.turbo = p.turbo > 20 || p.onFire;
      } else if (myD < 1.55 && p.stealCooldown <= 0 && !carrier.isDunking && carrier.stunTimer <= 0) {
        out.passPressed = true;
        // Conserve turbo for blocks unless we have plenty
        out.turbo = p.turbo > 55 || p.onFire;
      }
    } else {
      // Rim-protector anchor: camp the paint at the rim to meet dunkers mid-air!
      const anchorX = ownHoopX - Math.sign(ownHoopX) * 1.45;
      const anchorZ = Math.max(-1.6, Math.min(1.6, carrier.pos[2] * 0.45));
      const dCarrierToRim = Math.hypot(ownHoopX - carrier.pos[0], carrier.pos[2]);

      if (carrier.isDunking && myD < 2.6) {
        steerToward(p, ownHoopX - Math.sign(ownHoopX) * 0.7, 0, out, true);
        if (p.grounded && myD < 2.1) {
          out.shootPressed = true;
          out.turbo = true;
        }
      } else if (dCarrierToRim < 5.5) {
        steerToward(p, anchorX, anchorZ, out, dist2D(p.pos, [anchorX, 0, anchorZ]) > 1.2);
        if (!carrier.grounded && myD < 2.3 && p.grounded) {
          out.shootPressed = true;
        }
      } else {
        // Shade off-ball opponent while staying between them and the rim
        const oppOff = opponentsOf(state, p.team).find((o) => o.index !== carrier.index);
        if (oppOff) {
          const gx = oppOff.pos[0] * 0.55 + anchorX * 0.45;
          const gz = oppOff.pos[2] * 0.65;
          steerToward(p, gx, gz, out, false);
        }
      }
    }
  }

  return out;
}

export function createLockdownCounterBot(): BotController {
  return {
    id: 'lockdown-counter',
    name: 'Lockdown Counter',
    decide: decideLockdownCounter,
  };
}
