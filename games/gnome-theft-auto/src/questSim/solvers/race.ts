// Quest sim solvers. The Speedway race objective, driven for real by the racing line (raceTrack/autopilot.ts).
// The bot takes the race vehicle the run spawned on the grid and drives it through the game's own vehicle physics
// (ctx.drive). No cheat decides the result: the race runner counts the laps, the rivals and the places.
import type { Vehicle } from '../../types';
import { racingLine, steerTo } from '../../raceTrack/autopilot';
import { gridSlot, locate } from '../../raceTrack/track';
import type { ObjectiveDef } from '../../quests/types';
import type { SimCtx, Solver } from '../types';
import { SimFail } from '../types';
import { getInto, runUntil, waitFor } from '../util';

type RaceObj = Extract<ObjectiveDef, { kind: 'race' }>;

/**
 * Lateral grip (g) the racing line assumes, per attempt: start with margin, then corner harder after each loss (a
 * player who loses tries harder). Still real driving through stepVehicle: a grip the tyres cannot hold runs wide.
 */
const GRIPS = [0.95, 1.2, 1.5, 1.9];
/** Sim seconds to wait for the run to spawn the race vehicle on the grid. */
const FIND_WAIT = 2;
/** Lost attempts before the solver gives up. */
const MAX_LOSSES = GRIPS.length;
/** Within this many metres of the grid slot, and stopped, the car has been put back on the grid by a lost run. */
const GRID_NEAR = 15;
/** Beyond this many metres from the grid slot, the car has left the grid: a new attempt has started. */
const GRID_FAR = 30;
/** Speed (m/s) under which a car on the grid counts as stopped. */
const STOPPED = 1;

/** The race vehicle: kind `obj.vehicle`, quest-owned by the run, nearest its grid slot, not an NPC rival. */
function findRaceVehicle(ctx: SimCtx, obj: RaceObj): Vehicle | null {
  const g = gridSlot(obj.rivals.length);
  let best: Vehicle | null = null;
  let bd = Infinity;
  for (const v of ctx.vehicles) {
    if (v.kind !== obj.vehicle || !v.questOwned || v.driver === 'npc') continue;
    const d = Math.hypot(v.x - g.x, v.z - g.z);
    if (d < bd) { bd = d; best = v; }
  }
  return best;
}

export const raceSolver: Solver<'race'> = {
  kind: 'race',
  async solve(obj: RaceObj, ctx: SimCtx, opts) {
    const found = await waitFor(ctx, () => findRaceVehicle(ctx, obj) !== null, FIND_WAIT);
    const mine = found ? findRaceVehicle(ctx, obj) : null;
    if (!mine) throw new SimFail('bot', `race ${obj.raceId}: no ${obj.vehicle} on the grid for the run`);
    await getInto(ctx, mine, 'race grid');

    const grid = gridSlot(obj.rivals.length);
    let hint = -1;
    // Attempts: a new one starts when the car leaves the grid. A lost one puts the car back on the grid, stopped (the
    // runner's holdPlayer). A car passing the grid mid-lap is moving, so it is not counted as a loss.
    let started = 0;
    let losses = 0;
    let onRun = false;

    const tick = (): void => {
      if (ctx.player.vehicle !== mine) ctx.enter(mine);

      const fromGrid = Math.hypot(mine.x - grid.x, mine.z - grid.z);
      if (!onRun && fromGrid > GRID_FAR) {
        onRun = true;
        started++;
        ctx.log(`race attempt ${started}`);
      } else if (onRun && fromGrid < GRID_NEAR && mine.speed < STOPPED) {
        onRun = false;
        losses++;
        ctx.log(`race attempt ${started} lost (${losses}/${MAX_LOSSES})`);
        if (losses >= MAX_LOSSES) {
          throw new SimFail('content', `race ${obj.raceId}: lost ${MAX_LOSSES} times with the racing line at grips ${GRIPS.join(', ')} (rivals too fast for the racing line?)`);
        }
      }

      const spot = locate(mine.x, mine.z, 60, hint) ?? locate(mine.x, mine.z, 400);
      if (spot) {
        hint = spot.i;
        const { aimS, target } = racingLine(spot.s, mine.speed, GRIPS[Math.min(losses, GRIPS.length - 1)]);
        ctx.drive({
          throttle: mine.speed < target ? 1 : mine.speed > target + 1.5 ? -1 : 0,
          steer: steerTo(mine.x, mine.z, mine.yaw, aimS),
          lift: 0,
        });
      } else {
        // Off the track altogether: no line to follow, so the bot gives up on this run.
        throw new SimFail('bot', `race ${obj.raceId}: the race car is more than 400 m off the track (${mine.x.toFixed(0)}, ${mine.z.toFixed(0)})`);
      }
    };

    try {
      await runUntil(ctx, { questId: opts.questId, step: opts.step, budget: opts.budget, what: `race ${obj.raceId}` }, tick);
    } finally {
      ctx.drive(null);
    }
  },
};
