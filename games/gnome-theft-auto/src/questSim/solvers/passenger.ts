// Quest sim solver for 'passenger' (E20): drive to the pickup, stop, wait for the passenger, drive to the drop-off.
import type { Vehicle } from '../../types';
import type { Finding, SimCtx, Solver } from '../types';
import { SimFail } from '../types';
import { isGroundSpec } from '../../quests/objectivesPassenger';
import { getInto, runUntil, stepDone, travelTo, waitFor } from '../util';

type PassengerObj = Parameters<Solver<'passenger'>['solve']>[0];

/** A ground vehicle the bot may take: nobody else drives it, not wrecked. Nearest to (x, z) within maxDist. */
function nearestGround(ctx: SimCtx, x: number, z: number, maxDist: number): Vehicle | null {
  let best: Vehicle | null = null;
  let bd = maxDist;
  for (const v of ctx.vehicles) {
    if (!isGroundSpec(v.spec) || v.exploded || v.sunk) continue;
    if (v.driver !== 'none' && v.driver !== 'player') continue;
    const d = Math.hypot(v.x - x, v.z - z);
    if (d < bd) { bd = d; best = v; }
  }
  return best;
}

/** Get behind the wheel of a ground vehicle: the current one, one near the player or the pickup, or a spawned one. */
async function getRide(ctx: SimCtx, obj: PassengerObj): Promise<Vehicle> {
  const cur = ctx.player.vehicle;
  if (cur && isGroundSpec(cur.spec) && !cur.exploded && ctx.vehicles.includes(cur)) return cur;
  // The runner parks obj.vehicle at the pickup on its first update.
  if (obj.vehicle) await waitFor(ctx, () => nearestGround(ctx, obj.pickup[0], obj.pickup[1], 40) !== null, 2);
  let v = nearestGround(ctx, ctx.player.x, ctx.player.z, 20) ?? nearestGround(ctx, obj.pickup[0], obj.pickup[1], 40);
  if (!v) {
    // No ride anywhere near: walk up to the pickup; the runner parks one beside it for a player on foot.
    await travelTo(ctx, obj.pickup[0], obj.pickup[1], `passenger: on foot to ${obj.name}`, { standOff: 6 });
    await waitFor(ctx, () => nearestGround(ctx, obj.pickup[0], obj.pickup[1], 40) !== null, 3);
    v = nearestGround(ctx, obj.pickup[0], obj.pickup[1], 40);
  }
  if (!v) {
    const p = ctx.player;
    v = ctx.spawnVehicle(obj.vehicle?.kind ?? 'ride-on', p.x + 2, p.z, p.yaw);
    ctx.useCheat('unlockAllItems', `passenger: a ride spawned for ${obj.name}`);
    await ctx.step();
  }
  await getInto(ctx, v, `passenger: a ride for ${obj.name}`);
  if (!ctx.player.vehicle) throw new SimFail('bot', `passenger: could not get into the ${v.spec.name}`);
  return v;
}

/** Drive to (x, z) and come to a stop there. */
async function stopAt(ctx: SimCtx, x: number, z: number, why: string): Promise<void> {
  await travelTo(ctx, x, z, why);
  ctx.drive(null);
  await waitFor(ctx, () => Math.abs(ctx.player.vehicle?.speed ?? 0) < 0.5, 10);
}

export const passengerSolver: Solver<'passenger'> = {
  kind: 'passenger',
  async solve(obj, ctx, opts) {
    const [px, pz] = obj.pickup;
    const [dx, dz] = obj.dropAt;
    // Boarded: the drop-off blip replaces the pickup one.
    const boarded = (): boolean => ctx.quests.blips().some((b) => b.kind === 'objective' && Math.hypot(b.x - dx, b.z - dz) < 1);
    const past = (): boolean => stepDone(ctx, opts.questId, opts.step);
    let ride: Vehicle | null = null;
    /** Get a ride, pick the passenger up (stopped at the pickup until they board), drive to the drop and stop. */
    const leg = async (): Promise<void> => {
      if (!boarded()) {
        // A disruption (the player cracked, the ride wrecked) may take the ride away mid-pickup: try again a few times.
        for (let attempt = 0; attempt < 4 && !boarded() && !past(); attempt++) {
          const r = await getRide(ctx, obj);
          ride = r;
          await stopAt(ctx, px, pz, `passenger: pick up ${obj.name}`);
          const inRide = (): boolean => ctx.player.vehicle === r && ctx.vehicles.includes(r);
          await waitFor(ctx, () => boarded() || past() || !inRide(), 15);
          if (!boarded() && !past() && inRide()) {
            throw new SimFail('bug', `passenger: ${obj.name} did not board at (${px}, ${pz}) while stopped there`);
          }
          if (!boarded() && !past()) await waitFor(ctx, () => false, 2); // let a step retry settle
        }
        if (past()) return;
        if (!boarded()) throw new SimFail('bot', `passenger: lost the ride four times picking up ${obj.name}`);
      } else if (ride && ctx.player.vehicle !== ride && !ride.exploded) {
        // Back to the ride the passenger sits in.
        await getInto(ctx, ride, 'passenger: back into the ride');
      }
      await stopAt(ctx, dx, dz, `passenger: drop ${obj.name}`);
    };
    await leg();
    await runUntil(ctx, { questId: opts.questId, step: opts.step, budget: opts.budget, what: 'passenger' }, async () => {
      ctx.drive(null);
      // A retry (the ride was wrecked or too rough) puts the passenger back at the pickup; a bail leaves the ride.
      if (!boarded() || ctx.player.vehicle !== ride) await leg();
    });
  },
  check(obj, world, questId, step) {
    const out: Finding[] = [];
    for (const [name, [x, z]] of [['pickup', obj.pickup], ['dropAt', obj.dropAt]] as const) {
      if (Math.abs(x) <= world.half && Math.abs(z) <= world.half) continue;
      out.push({ questId, step, check: 'spot-off-world', class: 'content', detail: `${name} (${x.toFixed(1)}, ${z.toFixed(1)}) is outside the world (half ${world.half})` });
    }
    return out;
  },
};
