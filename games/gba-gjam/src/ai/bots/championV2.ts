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

export interface ChampionV2Params {
  /** Exp 7: Use quick-release jump shot (shootHold >= 0.06) instead of strict apex. */
  quickRelease: boolean;
  /** Exp 9: Steer toward safest point on outer dunkReach perimeter when driving. */
  dunkPerimeter: boolean;
  /** Minimum turbo required for primary/pinch turbo-shoves. */
  shoveTurboMin: number;
  /** Defender proximity (m) triggering an anti-shove pass to a safer teammate. */
  passThreatDist: number;
  /** Minimum EV required to take an open 3PT shot outside dunk reach. */
  threeEvThreshold: number;
  /** Carrier distance from hoop within which secondary defender pinches to double-team. */
  doubleTeamRadius: number;
  /** Minimum turbo for secondary defender to shove off-ball opponent (Infinity = disabled). */
  offBallShoveTurboMin: number;
  /** Exp 13: Immediate forward lead-pass on inbound. */
  inboundPass?: boolean;
  /** Exp 13: Pass to teammate when teammate is in dunkReach and carrier is pressured. */
  mateDunkPass?: boolean;
  /** Exp 13: Jump/swat earlier when carrier is shooting even at 2.6m. */
  wideSwat?: boolean;
}

export const DEFAULT_CHAMPION_V2_PARAMS: ChampionV2Params = {
  quickRelease: true,
  dunkPerimeter: false,
  shoveTurboMin: 22,
  passThreatDist: 1.85,
  threeEvThreshold: 2.05,
  doubleTeamRadius: 14.0,
  offBallShoveTurboMin: Infinity,
};

/**
 * Champion v2: Synthesizes Exp 6–9 breakthroughs:
 * - Quick-Release 3PT (Exp 7) for +41% tempo & half the shove exposure
 * - Dunk-Reach Perimeter Geometry (Exp 9) for earliest shove-immune dunk launches
 * - Full-court 2v1 Double-Team Trap without wasting turbo on off-ball shoves (Exp 8)
 * - Anti-Shove ball-protection passing & On-Fire funneling (Exp 4–5)
 */
export function decideChampionV2(
  state: GameStateSnapshot,
  ctx: BotDecisionContext,
  params: Partial<ChampionV2Params> = {},
): BotInput {
  const cfg = { ...DEFAULT_CHAMPION_V2_PARAMS, ...params };
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
      out.turbo = p.turbo > cfg.shoveTurboMin || p.onFire;
      return out;
    }
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
    if (handleMidAirShot(p, out, !cfg.quickRelease)) return out;

    const dHoop = distToHoop(state, p);
    const dRim = distToRim(state, p);
    const canTurbo = p.onFire || p.turbo > 20;
    const reach = dunkReach(p, canTurbo);
    const myDefDist = nearestDefenderDist(state, p);
    const mateDefDist = nearestDefenderDist(state, mate);
    const myShot = expectedJumpShotPoints(state, p);
    const mateShot = expectedJumpShotPoints(state, mate);

    // Exp 13: Immediate inbound lead-pass
    if (
      cfg.inboundPass &&
      Math.abs(p.pos[0] + dir * (state.court.halfX - 2.4)) < 1.5 &&
      state.shotClock > 23.2 &&
      (mate.pos[0] - p.pos[0]) * dir > 2.0 &&
      mate.stunTimer <= 0 &&
      mateDefDist > 1.8
    ) {
      out.passPressed = true;
      return out;
    }

    // 3a. Immediate dunk if inside dunk reach (100% immune to shove once dunk starts)
    if (dHoop <= reach - 0.15) {
      const outsideNoTurbo = dHoop > dunkReach(p, false) + 0.25;
      if (outsideNoTurbo && myShot.isThree && myShot.ev >= cfg.threeEvThreshold + 0.3 && myDefDist > 2.3 && dRim <= 8.2) {
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

    // 3b. Elite uncontested quick-release 3PT when outside dunk reach
    const outsideNoTurbo = dHoop > dunkReach(p, false) + 0.25;
    if (outsideNoTurbo && myShot.isThree && myShot.ev >= cfg.threeEvThreshold && myShot.contest <= 0.08 && myDefDist > 2.05 && dRim <= 8.3) {
      out.turbo = false;
      out.shootPressed = true;
      out.shootDown = true;
      return out;
    }

    // 3c. Anti-shove ball protection pass
    if (myDefDist < cfg.passThreatDist && mate.stunTimer <= 0 && mateDefDist > myDefDist + 0.35) {
      out.passPressed = true;
      return out;
    }

    // 3d. Hot-hand funnel
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
        mateShot.ev >= cfg.threeEvThreshold + 0.2 &&
        mateShot.contest <= 0.06 &&
        distToRim(state, mate) <= 8.2 &&
        mateShot.ev > myShot.ev + 0.3;
      const mateBreakaway = mateDHoop + 2.6 < dHoop && mateDHoop < 7.0;
      const mateDunkReady =
        Boolean(cfg.mateDunkPass) &&
        myDefDist < 2.6 &&
        mateDHoop <= dunkReach(mate, mate.onFire || mate.turbo > 20) - 0.3 &&
        mateDefDist > 1.8;
      if (mateOpenThree || mateBreakaway || mateDunkReady) {
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
    const preferShooterSpot = p.stats.threePt >= 82 && p.stats.threePt > p.stats.dunk && dRim > 4.8;
    if (preferShooterSpot) {
      const wantZ = closer.pos[2] >= 0 ? -4.3 : 4.3;
      steerToward(p, rimX - dir * 5.0, wantZ, out, p.turbo > 30 || p.onFire);
    } else if (cfg.dunkPerimeter) {
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

  // 4. OFF-BALL OFFENSE: Stay safe from defenders to provide an instant anti-shove pass outlet
  const teamHasBall =
    state.ball.carrier !== null && state.players[state.ball.carrier]?.team === p.team;
  if (teamHasBall) {
    const wantZ = mate.pos[2] >= 0 ? -3.8 : 3.8;
    const isShooter = p.stats.threePt >= 78;
    const wantX = isShooter ? rimX - dir * 5.0 : hx - dir * 2.4;
    steerToward(p, wantX, wantZ, out, dist2D(p.pos, [wantX, 0, wantZ]) > 2.5 && (p.turbo > 30 || p.onFire));
    return out;
  }

  // 5. RELENTLESS TURBO-SHOVE + 2v1 TRAP DEFENSE (Exp 8 winner)
  const carrier = state.ball.carrier !== null ? state.players[state.ball.carrier] : null;
  if (carrier) {
    const myD = dist2D(p.pos, carrier.pos);
    const mateD = dist2D(mate.pos, carrier.pos);
    const primary = myD <= mateD + 0.6;
    const ownHoopX = targetHoopX(state, carrier.team);

    if (primary) {
      steerToward(p, carrier.pos[0], carrier.pos[2], out, myD > 1.25 && (p.turbo > cfg.shoveTurboMin || p.onFire));
      if (myD < 1.62 && p.stealCooldown <= 0 && !carrier.isDunking && carrier.stunTimer <= 0) {
        out.passPressed = true;
        out.turbo = p.onFire || p.turbo >= cfg.shoveTurboMin;
      } else if ((!carrier.grounded || carrier.isDunking) && myD < (cfg.wideSwat ? 2.65 : 2.25) && p.grounded) {
        out.shootPressed = true;
        out.turbo = p.turbo > 25 || p.onFire;
      }
    } else {
      const carrierDist = Math.hypot(ownHoopX - carrier.pos[0], carrier.pos[2]);
      if (carrierDist < cfg.doubleTeamRadius) {
        steerToward(p, carrier.pos[0], carrier.pos[2], out, myD > 1.5 && (p.turbo > cfg.shoveTurboMin + 2 || p.onFire));
        if (myD < 1.62 && p.stealCooldown <= 0 && !carrier.isDunking && carrier.stunTimer <= 0) {
          out.passPressed = true;
          out.turbo = p.onFire || p.turbo >= cfg.shoveTurboMin;
        }
      } else {
        const oppOff = opponentsOf(state, p.team).find((o) => o.index !== carrier.index);
        if (oppOff) {
          const dOff = dist2D(p.pos, oppOff.pos);
          steerToward(p, oppOff.pos[0], oppOff.pos[2], out, dOff > 2.5 && p.turbo > 45);
          if (
            dOff < 1.58 &&
            p.stealCooldown <= 0 &&
            Number.isFinite(cfg.offBallShoveTurboMin) &&
            (p.onFire || p.turbo > cfg.offBallShoveTurboMin) &&
            oppOff.stunTimer <= 0
          ) {
            out.passPressed = true;
            out.turbo = true;
          }
        }
      }
    }
  }

  return out;
}

export function createChampionV2Bot(params: Partial<ChampionV2Params> = {}): BotController {
  return {
    id: 'champion-v2',
    name: 'Champion v2',
    decide: (state, ctx) => decideChampionV2(state, ctx, params),
  };
}
