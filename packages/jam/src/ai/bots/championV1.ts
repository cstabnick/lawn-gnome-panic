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
  nearestDefenderDist,
  opponentsOf,
  steerToward,
  targetHoopX,
  targetRimX,
  teammateOf,
} from './helpers';

export interface ChampionV1Options {
  /** Exp 6: Immediately pass forward on inbound if teammate is ahead & clear. */
  inboundPass?: boolean;
  /** Exp 6: Sprint toward sideline from backcourt to create lateral separation. */
  sidelineArc?: boolean;
  /** Exp 7: Use quick-release jump shot (shootHold >= 0.06) instead of strict apex. */
  quickRelease?: boolean;
  /** Exp 7: Ban lateral wing-hunting when a defender is within 4.5m. */
  noWingHunt?: boolean;
  /** Exp 9: Steer to safest point on outer dunkReach perimeter instead of under the basket. */
  dunkPerimeter?: boolean;
}

/**
 * Champion v1: Synthesis of Findings from Experiments 1–4.
 *
 * Key strategic levers combined:
 * 1. Anti-Shove Ball Protection: Passes are uninterceptable in sim.ts, while turbo-shoves
 *    are 100% guaranteed turnovers at d < 1.65m. When a non-stunned defender closes within
 *    2.05m and teammate is safer, immediately kick the ball to the open teammate!
 * 2. Stat-Aware EV Offense + Strict Apex Timing (Exp 1 & 3): Takes uncontested apex-timed
 *    3PT shots (turbo=false so dunkReach doesn't override) whenever EV >= 2.25; otherwise
 *    attacks with guaranteed turbo dunks.
 * 3. Hot-Hand / ON FIRE Funneling (Exp 4): Prioritizes feeding a teammate who is ON FIRE
 *    or at streak >= 2 (unblockable Meteor Dunks + infinite turbo + +28% shooting).
 * 4. Relentless Turbo-Shove Pressure Defense + Rising-Shot Swats (Exp 2): Exploits the
 *    guaranteed turbo-shove turnover whenever turbo >= 24, double-teams paint drives, and
 *    swats rising opponent jump shots within 2.15m.
 */
export function decideChampionV1(
  state: GameStateSnapshot,
  ctx: BotDecisionContext,
  opts: ChampionV1Options = {},
): BotInput {
  const out = emptyOut();
  const p = state.players[ctx.playerIndex];
  if (!p || p.stunTimer > 0 || p.isDunking) return out;

  const dir = attackDir(p.team);
  const hx = targetHoopX(state, p.team);
  const rimX = targetRimX(state, p.team);
  const mate = teammateOf(state, p);

  // 1. Swat rising opponent jump shots immediately if in reach
  if (state.ball.mode === 'shot' && state.ball.lastTouchTeam !== p.team) {
    if (dist3D(p.pos, state.ball.pos) < 2.15 && p.grounded) {
      out.shootPressed = true;
      out.turbo = p.turbo > 22 || p.onFire;
      return out;
    }
    // Box out near our own basket for the rebound
    const defHoopX = -hx;
    steerToward(p, defHoopX + dir * 2.0, state.ball.pos[2] * 0.4, out, true);
    return out;
  }

  // 2. Loose ball anticipation
  if (state.ball.mode === 'loose') {
    chaseLooseBall(state, p, out);
    return out;
  }

  // 3. OFFENSE WITH BALL
  if (state.ball.carrier === p.index) {
    if (honorHumanCalls(ctx, out)) return out;
    if (handleMidAirShot(p, out, !opts.quickRelease)) return out;

    const dHoop = distToHoop(state, p);
    const dRim = distToRim(state, p);
    const canTurbo = p.onFire || p.turbo > 20;
    const reach = dunkReach(p, canTurbo);
    const myDefDist = nearestDefenderDist(state, p);
    const mateDefDist = nearestDefenderDist(state, mate);
    const myShot = expectedJumpShotPoints(state, p);
    const mateShot = expectedJumpShotPoints(state, mate);

    // Exp 6: Immediate forward lead-pass on inbound
    if (
      opts.inboundPass &&
      Math.abs(p.pos[0] + dir * (state.court.halfX - 2.4)) < 1.5 &&
      state.shotClock > 23.2 &&
      (mate.pos[0] - p.pos[0]) * dir > 2.0 &&
      mate.stunTimer <= 0 &&
      mateDefDist > 1.8
    ) {
      out.passPressed = true;
      return out;
    }

    // 3a. Immediate dunk if inside dunk reach (100% immune to shove once dunk starts!)
    if (dHoop <= reach - 0.15) {
      // Only prefer 3PT over dunk if we are outside no-turbo dunk reach AND have an elite open 3PT
      const outsideNoTurbo = dHoop > dunkReach(p, false) + 0.25;
      if (outsideNoTurbo && myShot.isThree && myShot.ev >= 2.55 && myDefDist > 2.3 && dRim <= 8.2) {
        out.turbo = false;
        out.shootPressed = true;
        out.shootDown = true;
        return out;
      }
      out.turbo = canTurbo;
      out.shootPressed = true;
      out.shootDown = true;
      return out;
    }

    // 3b. Elite uncontested apex 3PT when outside dunk reach
    const outsideNoTurbo = dHoop > dunkReach(p, false) + 0.25;
    if (outsideNoTurbo && myShot.isThree && myShot.ev >= 2.25 && myShot.contest <= 0.08 && myDefDist > 2.1 && dRim <= 8.3) {
      out.turbo = false;
      out.shootPressed = true;
      out.shootDown = true;
      return out;
    }

    // 3c. ANTI-SHOVE BALL PROTECTION: Defender is about to turbo-shove us (< 2.05m)!
    // Pass immediately to teammate if teammate is not stunned and has more breathing room.
    if (myDefDist < 2.05 && mate.stunTimer <= 0 && mateDefDist > myDefDist + 0.35) {
      out.passPressed = true;
      return out;
    }

    // 3d. Hot-hand funnel (Exp 4): feed teammate if they are ON FIRE (and I'm not) or at streak >= 2
    const mateHotter =
      mate.stunTimer <= 0 &&
      mateDefDist > 1.85 &&
      ((mate.onFire && !p.onFire) || (!p.onFire && mate.streak >= 2 && mate.streak > p.streak));
    if (mateHotter && state.shotClock > 3.5) {
      out.passPressed = true;
      return out;
    }

    // 3e. Outlet / extra pass to teammate with wide-open elite 3PT or fast-break rim lane
    if (mate.stunTimer <= 0 && mateDefDist > 1.9) {
      const mateDHoop = distToHoop(state, mate);
      const mateOpenThree =
        mateShot.isThree &&
        mateShot.ev >= 2.45 &&
        mateShot.contest <= 0.06 &&
        distToRim(state, mate) <= 8.2 &&
        mateShot.ev > myShot.ev + 0.3;
      const mateBreakaway = mateDHoop + 2.6 < dHoop && mateDHoop < 7.0;
      if (mateOpenThree || mateBreakaway) {
        out.passPressed = true;
        return out;
      }
    }

    // 3f. Shot clock emergency
    if (state.shotClock < 1.8) {
      out.turbo = false;
      out.shootPressed = true;
      out.shootDown = true;
      return out;
    }

    // 3g. Drive / space away from nearest defender
    const [o1, o2] = opponentsOf(state, p.team);
    const closer = dist2D(p.pos, o1.pos) < dist2D(p.pos, o2.pos) ? o1 : o2;
    const avoidZ = closer.pos[2] >= p.pos[2] ? -2.4 : 2.4;
    const allowWingHunt = !opts.noWingHunt || myDefDist >= 4.5;
    const preferShooterSpot =
      allowWingHunt && p.stats.threePt >= 82 && p.stats.threePt > p.stats.dunk && dRim > 4.8;
    if (opts.sidelineArc && (hx - p.pos[0]) * dir > 11.0) {
      const sideZ = closer.pos[2] >= 0 ? -4.6 : 4.6;
      steerToward(p, p.pos[0] + dir * 4.5, sideZ, out, p.turbo > 22 || p.onFire);
    } else if (preferShooterSpot) {
      const wantZ = closer.pos[2] >= 0 ? -4.3 : 4.3;
      steerToward(p, rimX - dir * 5.0, wantZ, out, p.turbo > 30 || p.onFire);
    } else if (opts.dunkPerimeter) {
      // Exp 9: Steer toward safest point on outer dunkReach perimeter
      const targetR = Math.max(2.6, reach - 0.2);
      let bestX = hx - dir * 0.9;
      let bestZ = dHoop < 4.5 ? 0 : avoidZ;
      let bestScore = -Infinity;
      for (const ang of [-1.05, -0.7, -0.35, 0, 0.35, 0.7, 1.05]) {
        const cx = hx - dir * Math.cos(ang) * targetR;
        const cz = Math.max(
          -state.court.halfZ + 0.8,
          Math.min(state.court.halfZ - 0.8, Math.sin(ang) * targetR),
        );
        const minOpp = Math.min(
          o1.stunTimer > 0 ? 9 : Math.hypot(cx - o1.pos[0], cz - o1.pos[2]),
          o2.stunTimer > 0 ? 9 : Math.hypot(cx - o2.pos[0], cz - o2.pos[2]),
        );
        const dFromMe = Math.hypot(cx - p.pos[0], cz - p.pos[2]);
        const score = minOpp - 0.35 * dFromMe;
        if (score > bestScore) {
          bestScore = score;
          bestX = cx;
          bestZ = cz;
        }
      }
      steerToward(p, bestX, bestZ, out, p.turbo > 22 || p.onFire);
    } else {
      steerToward(p, hx - dir * 0.9, dHoop < 4.5 ? 0 : avoidZ, out, p.turbo > 22 || p.onFire);
    }
    return out;
  }

  // 4. OFF-BALL OFFENSE: Stay safe from defenders to provide an instant anti-shove pass outlet!
  const teamHasBall =
    state.ball.carrier !== null && state.players[state.ball.carrier]?.team === p.team;
  if (teamHasBall) {
    const wantZ = mate.pos[2] >= 0 ? -3.8 : 3.8;
    const isShooter = p.stats.threePt >= 78;
    const wantX = isShooter ? rimX - dir * 5.0 : hx - dir * 2.4;
    steerToward(p, wantX, wantZ, out, dist2D(p.pos, [wantX, 0, wantZ]) > 2.5 && (p.turbo > 30 || p.onFire));
    return out;
  }

  // 5. RELENTLESS TURBO-SHOVE DEFENSE + PAINT DOUBLE-TEAM (Exp 2 winner)
  const carrier = state.ball.carrier !== null ? state.players[state.ball.carrier] : null;
  if (carrier) {
    const myD = dist2D(p.pos, carrier.pos);
    const mateD = dist2D(mate.pos, carrier.pos);
    const primary = myD <= mateD + 0.6;
    const ownHoopX = targetHoopX(state, carrier.team);

    if (primary) {
      // Sprint directly into turbo-shove contact range!
      steerToward(p, carrier.pos[0], carrier.pos[2], out, myD > 1.25 && (p.turbo > 22 || p.onFire));

      if (myD < 1.62 && p.stealCooldown <= 0 && !carrier.isDunking && carrier.stunTimer <= 0) {
        out.passPressed = true;
        out.turbo = p.onFire || p.turbo >= 22;
      } else if ((!carrier.grounded || carrier.isDunking) && myD < 2.25 && p.grounded) {
        out.shootPressed = true;
        out.turbo = p.turbo > 25 || p.onFire;
      }
    } else {
      // Secondary defender: pinch/double-team if carrier is approaching scoring range, else shadow off-ball
      const carrierDist = Math.hypot(ownHoopX - carrier.pos[0], carrier.pos[2]);
      if (carrierDist < 7.0) {
        steerToward(p, carrier.pos[0], carrier.pos[2], out, myD > 1.5 && (p.turbo > 26 || p.onFire));
        if (myD < 1.62 && p.stealCooldown <= 0 && !carrier.isDunking && carrier.stunTimer <= 0) {
          out.passPressed = true;
          out.turbo = p.onFire || p.turbo >= 22;
        }
      } else {
        const oppOff = opponentsOf(state, p.team).find((o) => o.index !== carrier.index);
        if (oppOff) {
          const dOff = dist2D(p.pos, oppOff.pos);
          steerToward(p, oppOff.pos[0], oppOff.pos[2], out, dOff > 2.5 && p.turbo > 45);
          // Disrupt off-ball outlet target with a shove if turbo is plentiful!
          if (dOff < 1.58 && p.stealCooldown <= 0 && p.turbo > 52 && oppOff.stunTimer <= 0) {
            out.passPressed = true;
            out.turbo = true;
          }
        }
      }
    }
  }

  return out;
}

export function createChampionV1Bot(opts: ChampionV1Options = {}): BotController {
  return {
    id: 'champion-v1',
    name: 'Champion v1',
    decide: (state, ctx) => decideChampionV1(state, ctx, opts),
  };
}
