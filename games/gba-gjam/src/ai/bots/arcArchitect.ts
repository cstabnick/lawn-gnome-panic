import type { BotController, BotDecisionContext, BotInput, GameStateSnapshot } from '../types';
import {
  attackDir,
  chaseLooseBall,
  dist2D,
  distToRim,
  dunkReach,
  emptyOut,
  estimateContest,
  handleMidAirShot,
  honorHumanCalls,
  opponentsOf,
  steerToward,
  targetHoopX,
  targetRimX,
  teammateOf,
} from './helpers';

export interface ArcArchitectOptions {
  /** Release jump shots at peak apex (vel.y <= 0.35) vs early naive release. Default true. */
  strictApex?: boolean;
  /** Refuse contested 3PT shots and pass/relocate to find open looks. Default true. */
  contestDiscipline?: boolean;
  /** Maximum acceptable contest penalty before passing/relocating. Default 0.08. */
  maxContest?: number;
}

/**
 * Arc Architect: Pure 3-point spacing & analytics bot.
 * - Drops turbo before pressing shoot so high-dunk players don't accidentally dunk instead of shooting 3s.
 * - Hunts open 3PT wing/top spots in the zero-distance-penalty band [5.6, 8.2] from the rim.
 * - Uses strict apex timing and passes to an open teammate beyond the arc when contested.
 */
export function createArcArchitectBot(opts: ArcArchitectOptions = {}): BotController {
  const strictApex = opts.strictApex ?? true;
  const contestDiscipline = opts.contestDiscipline ?? true;
  const maxContest = opts.maxContest ?? 0.08;

  const idSuffix =
    strictApex && contestDiscipline
      ? ''
      : `-apex${strictApex ? 1 : 0}-disc${contestDiscipline ? 1 : 0}`;

  return {
    id: `arc-architect${idSuffix}`,
    name: `Arc Architect${idSuffix ? ` (${idSuffix.slice(1)})` : ''}`,
    decide(state: GameStateSnapshot, ctx: BotDecisionContext): BotInput {
      const out = emptyOut();
      const p = state.players[ctx.playerIndex];
      if (!p || p.stunTimer > 0 || p.isDunking) return out;

      const dir = attackDir(p.team);
      const hx = targetHoopX(state, p.team);
      const rimX = targetRimX(state, p.team);
      const mate = teammateOf(state, p);

      if (state.ball.mode === 'loose') {
        chaseLooseBall(state, p, out);
        return out;
      }

      // OFFENSE WITH BALL
      if (state.ball.carrier === p.index) {
        if (honorHumanCalls(ctx, out)) return out;
        if (handleMidAirShot(p, out, strictApex)) return out;

        const dRim = distToRim(state, p);
        const minThreeDist = Math.max(state.court.threePtRadius + 0.35, dunkReach(p, false) + 0.25);
        const inSweetZone = dRim >= minThreeDist && dRim <= 8.2;
        const contest = estimateContest(state, p);

        // Emergency shot clock heave
        if (state.shotClock < 1.8) {
          out.turbo = false;
          out.shootPressed = true;
          out.shootDown = true;
          return out;
        }

        if (inSweetZone) {
          if (!contestDiscipline || contest <= maxContest || p.onFire) {
            // IMPORTANT: turbo=false so dunkReach stays low and we actually fire a 3PT!
            out.turbo = false;
            out.shootPressed = true;
            out.shootDown = true;
            return out;
          }

          // Contested! Check if teammate is open beyond the arc
          const mateDRim = distToRim(state, mate);
          const mateContest = estimateContest(state, mate);
          if (
            mate.stunTimer <= 0 &&
            mateDRim >= state.court.threePtRadius + 0.3 &&
            mateDRim <= 8.3 &&
            mateContest < contest - 0.05
          ) {
            out.passPressed = true;
            return out;
          }
        }

        // Relocate along the 3-point arc away from the nearest defender
        const [o1, o2] = opponentsOf(state, p.team);
        const defAvgZ = (o1.pos[2] + o2.pos[2]) * 0.5;
        const desiredZ = defAvgZ >= 0 ? -4.3 : 4.3;
        const desiredDist = Math.max(minThreeDist + 0.5, 6.4);
        const dxNeeded = Math.sqrt(Math.max(1, desiredDist * desiredDist - desiredZ * desiredZ));
        const spotX = rimX - dir * dxNeeded;

        steerToward(p, spotX, desiredZ, out, p.turbo > 35 || p.onFire);
        return out;
      }

      // OFF-BALL OFFENSE: Space opposite wing beyond 3-point arc
      const teamHasBall =
        state.ball.carrier !== null && state.players[state.ball.carrier]?.team === p.team;
      if (teamHasBall) {
        const wingZ = mate.pos[2] >= 0 ? -4.4 : 4.4;
        const spotX = rimX - dir * 5.0; // dist from rim = hypot(5.0, 4.4) = 6.66m (sweet 3PT!)
        steerToward(p, spotX, wingZ, out, dist2D(p.pos, [spotX, 0, wingZ]) > 3.0 && p.turbo > 45);
        return out;
      }

      // DEFENSE: Balanced gap + steal/shove when close
      const carrier = state.ball.carrier !== null ? state.players[state.ball.carrier] : null;
      if (carrier) {
        const myD = dist2D(p.pos, carrier.pos);
        const mateD = dist2D(mate.pos, carrier.pos);
        const guardBall = myD <= mateD + 0.5;
        const ownHoopX = targetHoopX(state, carrier.team);

        if (guardBall) {
          const gx = carrier.pos[0] + Math.sign(ownHoopX - carrier.pos[0]) * 1.0;
          steerToward(p, gx, carrier.pos[2] * 0.92, out, myD > 2.2 && p.turbo > 35);
          if (myD < 1.55 && p.stealCooldown <= 0 && !carrier.isDunking && carrier.stunTimer <= 0) {
            out.passPressed = true;
            out.turbo = p.turbo > 45 || p.onFire;
          }
          if ((!carrier.grounded || carrier.isDunking) && myD < 2.2 && p.grounded) {
            out.shootPressed = true;
          }
        } else {
          const oppOff = opponentsOf(state, p.team).find((o) => o.index !== carrier.index);
          if (oppOff) {
            const gx = (oppOff.pos[0] + ownHoopX * 0.25) / 1.25;
            steerToward(p, gx, oppOff.pos[2] * 0.9, out, false);
          }
        }
      }

      return out;
    },
  };
}
