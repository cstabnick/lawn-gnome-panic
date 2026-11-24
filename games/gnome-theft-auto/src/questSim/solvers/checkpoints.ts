// Quest sim solvers. Gates in order (courier rounds, the Skyway job, the Thorne Tower fly-by), driven / flown for real when timed.
import { VEHICLES } from '../../config';
import type { CheckpointDef, ObjectiveDef } from '../../quests/types';
import { heightAt } from '../../terrain';
import type { Vehicle, VehicleKind, World } from '../../types';
import type { Finding, SimCtx, SolveOpts, Solver } from '../types';
import { SimFail } from '../types';
import { getInto, nearestVehicle, runUntil, stepDone, waitFor } from '../util';
import { driveTo, flyTo, walkTo } from './driver';

type Checkpoints = Extract<ObjectiveDef, { kind: 'checkpoints' }>;

const GATE_RE = /\((\d+)\/(\d+)\)/;

/** Index of the gate the tracker shows as 'Next: ... (k/n)', or -1 when no gate line is shown. */
function nextGate(ctx: SimCtx): number {
  for (const line of ctx.quests.getJournal().activeLines) {
    const m = GATE_RE.exec(line);
    if (m) return Number(m[1]) - 1;
  }
  return -1;
}

/** World y of a gate's centre, or undefined for a ground gate (the body's own ground height there). */
function gateY(g: CheckpointDef): number | undefined {
  return g.height !== undefined ? heightAt(g.at[0], g.at[1]) + g.height : undefined;
}

/** The ride the job uses: `requireVehicle` when set, else the spawned `vehicle`'s kind. */
function rideKind(obj: Checkpoints): VehicleKind | undefined {
  return obj.requireVehicle ?? obj.vehicle?.kind;
}

/**
 * Straight-line length of the route from gate 0 through every gate. Horizontal distance plus the difference in gate
 * heights (no terrain lookup, so check() can run without a built world).
 */
function routeLength(points: CheckpointDef[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    total += Math.hypot(b.at[0] - a.at[0], b.at[1] - a.at[1], (b.height ?? 0) - (a.height ?? 0));
  }
  return total;
}

/** Get the job's ride: the spawned one near its spawn point, or a fresh one beside the player; then sit in it. */
async function getRide(ctx: SimCtx, obj: Checkpoints): Promise<Vehicle | null> {
  const kind = rideKind(obj);
  if (!kind) return null;
  let ride: Vehicle;
  if (obj.vehicle) {
    const [x, z] = obj.vehicle.at;
    const near = (): Vehicle | null => nearestVehicle(ctx, x, z, kind);
    if (!(await waitFor(ctx, () => near() !== null, 2))) {
      throw new SimFail('bug', `checkpoints ${obj.text}: no ${kind} spawned at (${x}, ${z})`);
    }
    const found = near();
    if (!found) throw new SimFail('bug', `checkpoints ${obj.text}: the ${kind} vanished`);
    ride = found;
  } else {
    const p = ctx.player;
    ride = ctx.spawnVehicle(kind, p.x + 2, p.z, p.yaw);
    ctx.useCheat('unlockAllItems', `checkpoints: ${kind} spawned`);
    await ctx.step();
  }
  await getInto(ctx, ride, `checkpoints: ride ${kind}`);
  return ride;
}

/** Untimed: hop from gate to gate by teleport (recorded), stepping 0.2 s, until the objective is done. */
async function untimed(ctx: SimCtx, obj: Checkpoints, opts: SolveOpts): Promise<void> {
  const n = obj.points.length;
  await runUntil(ctx, { questId: opts.questId, step: opts.step, budget: opts.budget, what: `checkpoints ${obj.text}` }, () => {
    const k = nextGate(ctx);
    if (k < 0 || k >= n) return;
    const g = obj.points[k];
    const y = gateY(g);
    ctx.useCheat('instantTravel', `checkpoints: hop to gate ${g.label}`);
    ctx.teleport(g.at[0], g.at[1], y !== undefined ? { y } : undefined);
  }, 0.2);
}

/**
 * One timed run from gate 0. Returns true when the objective is done, else the number of gates the run had passed
 * when the clock ran out or the ride was too damaged (the tracker went back to gate 0).
 */
async function timedAttempt(
  ctx: SimCtx,
  obj: Checkpoints,
  opts: SolveOpts,
  ride: Vehicle | null,
  kind: VehicleKind | undefined,
  t0: number,
): Promise<true | number> {
  const n = obj.points.length;
  const flies = kind !== undefined && VEHICLES[kind].flies;
  if (ride && ctx.player.vehicle !== ride) await getInto(ctx, ride, 'checkpoints: back into the ride');

  // Gate 0 starts the clock, so teleporting there is allowed; after this, no teleports.
  const g0 = obj.points[0];
  const y0 = gateY(g0);
  ctx.useCheat('instantTravel', 'checkpoints: start at gate 0 (the clock starts there)');
  ctx.teleport(g0.at[0], g0.at[1], y0 !== undefined ? { y: y0 } : undefined);
  await ctx.step();
  if (!(await waitFor(ctx, () => nextGate(ctx) >= 1 || stepDone(ctx, opts.questId, opts.step), 3))) return 0;

  let lastK = -1;
  let stalls = 0;
  let reached = 0;
  for (;;) {
    if (stepDone(ctx, opts.questId, opts.step)) return true;
    if (ctx.now() - t0 > opts.budget) throw new SimFail('bot', `checkpoints ${obj.text}: budget ${opts.budget}s spent`);
    const k = nextGate(ctx);
    reached = Math.max(reached, k);
    if (k < 1) return reached;

    // Arriving without the gate registering twice in a row means the run is stuck, not slow.
    if (k === lastK) {
      stalls++;
      if (stalls > 3) throw new SimFail('bot', `checkpoints ${obj.text}: stuck at gate ${k + 1} (${obj.points[k].label})`);
    } else {
      lastK = k;
      stalls = 0;
    }

    const g = obj.points[k];
    const y = gateY(g);
    const why = `checkpoints gate ${k + 1}/${n} ${g.label}`;
    const until = (): boolean => nextGate(ctx) !== k || stepDone(ctx, opts.questId, opts.step);
    const arrive = g.radius * 0.6;
    if (!kind) await walkTo(ctx, g.at[0], g.at[1], { arrive, why, until });
    else if (flies) await flyTo(ctx, g.at[0], y ?? heightAt(g.at[0], g.at[1]) + 10, g.at[1], { arrive, why, until });
    else await driveTo(ctx, g.at[0], g.at[1], { arrive, why, deckY: y, until });
  }
}

/** Timed: the clock runs from gate 0. Three attempts; then the quest data or the bot is blamed. */
async function timed(ctx: SimCtx, obj: Checkpoints, opts: SolveOpts, ride: Vehicle | null, kind: VehicleKind | undefined): Promise<void> {
  const n = obj.points.length;
  const seconds = obj.seconds ?? 0;
  const t0 = ctx.now();
  let best = 0;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await timedAttempt(ctx, obj, opts, ride, kind, t0);
    if (r === true) return;
    best = Math.max(best, r);
    ctx.log(`checkpoints ${obj.text}: attempt ${attempt} ended after ${r}/${n} gates`);
  }
  if (kind && routeLength(obj.points) / VEHICLES[kind].maxSpeed > seconds) {
    throw new SimFail('content', `checkpoints ${obj.text}: the route is longer than ${seconds}s even in a straight line`);
  }
  throw new SimFail('bot', `checkpoints ${obj.text}: 3 timed attempts failed (best gate ${best}/${n})`);
}

export const checkpointsSolver: Solver<'checkpoints'> = {
  kind: 'checkpoints',
  async solve(obj, ctx, opts) {
    const kind = rideKind(obj);
    const ride = await getRide(ctx, obj);
    if (!obj.seconds) await untimed(ctx, obj, opts);
    else await timed(ctx, obj, opts, ride, kind);
  },
  check(obj, world: World, questId, step): Finding[] {
    const out: Finding[] = [];
    obj.points.forEach((g, i) => {
      const [x, z] = g.at;
      if (Math.abs(x) > world.half || Math.abs(z) > world.half) {
        out.push({
          questId, step, check: 'spot-off-world', class: 'content',
          detail: `gate ${i + 1} (${g.label}) at (${x}, ${z}) is outside the world (half ${world.half})`,
        });
      }
    });
    const kind = rideKind(obj);
    if (obj.seconds !== undefined && kind) {
      const len = routeLength(obj.points);
      const best = len / VEHICLES[kind].maxSpeed;
      if (best > obj.seconds) {
        out.push({
          questId, step, check: 'gate-time-impossible', class: 'content',
          detail: `route ${len.toFixed(0)} m at ${VEHICLES[kind].maxSpeed} m/s takes ${best.toFixed(1)}s, the clock is ${obj.seconds}s`,
        });
      }
    }
    return out;
  },
};
