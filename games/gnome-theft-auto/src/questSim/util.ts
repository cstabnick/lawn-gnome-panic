// Quest sim: helpers every solver uses. Work through SimCtx only, so they run headless and in the browser.
import type { Blip, Vehicle, VehicleKind } from '../types';
import type { SimCtx } from './types';
import { SimFail } from './types';

/** True once the quest engine has moved past objective `step` of `questId` (or finished / dropped the quest). */
export function stepDone(ctx: SimCtx, questId: string, step: number): boolean {
  const j = ctx.quests.getJournal();
  if (j.saves[questId]?.state === 'done') return true;
  if (j.activeId !== questId) return true;
  return j.activeStep > step;
}

/**
 * Step the game until `questId` is past `step`, calling `tick` before every step (the solver's per-frame action).
 * Throws SimFail('bot', ...) when `budget` sim seconds pass first. `dt` overrides the step length.
 */
export async function runUntil(
  ctx: SimCtx,
  o: { questId: string; step: number; budget: number; what: string },
  tick: () => void | Promise<void>,
  dt?: number,
): Promise<void> {
  const t0 = ctx.now();
  while (!stepDone(ctx, o.questId, o.step)) {
    if (ctx.now() - t0 > o.budget) throw new SimFail('bot', `${o.what}: not done after ${o.budget}s (player ${fmt(ctx.player.x)}, ${fmt(ctx.player.z)})`);
    await tick();
    await ctx.step(dt);
  }
}

/** Step until `pred()` holds; false when `seconds` pass first. */
export async function waitFor(ctx: SimCtx, pred: () => boolean, seconds: number, dt?: number): Promise<boolean> {
  const t0 = ctx.now();
  while (!pred()) {
    if (ctx.now() - t0 > seconds) return false;
    await ctx.step(dt);
  }
  return true;
}

export const fmt = (n: number): string => n.toFixed(1);

/** The active quest's objective blips (targets, drop-offs, the leader, the next gate), nearest first. */
export function objectiveBlips(ctx: SimCtx): Blip[] {
  const p = ctx.player;
  return ctx.quests
    .blips()
    .filter((b) => b.kind === 'objective')
    .sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
}

/**
 * Go to (x, z) on foot or in the current vehicle. With the instantTravel cheat: a teleport (recorded). Without it the
 * bot walks / drives there (driver.ts driveTo / walkTo); `standOff` stops that far short.
 */
export async function travelTo(ctx: SimCtx, x: number, z: number, why: string, opts: { y?: number; standOff?: number } = {}): Promise<void> {
  const p = ctx.player;
  let tx = x;
  let tz = z;
  const off = opts.standOff ?? 0;
  if (off > 0) {
    const d = Math.hypot(x - p.x, z - p.z) || 1;
    tx = x - ((x - p.x) / d) * off;
    tz = z - ((z - p.z) / d) * off;
  }
  if (ctx.cheats.instantTravel) {
    ctx.useCheat('instantTravel', `teleport: ${why}`);
    ctx.teleport(tx, tz, opts.y !== undefined ? { y: opts.y } : undefined);
    await ctx.step();
    return;
  }
  const { driveTo, walkTo } = await import('./solvers/driver');
  if (p.vehicle) await driveTo(ctx, tx, tz, { arrive: 4, why });
  else await walkTo(ctx, tx, tz, { arrive: 1.5, why });
}

/** The nearest vehicle of `kind` (any kind when omitted) to (x, z) that nobody else drives, or null. */
export function nearestVehicle(ctx: SimCtx, x: number, z: number, kind?: VehicleKind, maxDist = Infinity): Vehicle | null {
  let best: Vehicle | null = null;
  let bd = maxDist;
  for (const v of ctx.vehicles) {
    if (kind && v.kind !== kind) continue;
    if (v.exploded || (v.driver !== 'none' && v.driver !== 'player')) continue;
    const d = Math.hypot(v.x - x, v.z - z);
    if (d < bd) { bd = d; best = v; }
  }
  return best;
}

/** Walk / teleport next to `v` and take its wheel. */
export async function getInto(ctx: SimCtx, v: Vehicle, why: string): Promise<void> {
  if (ctx.player.vehicle === v) return;
  if (ctx.player.vehicle) ctx.exit();
  await travelTo(ctx, v.x + 1.5, v.z, why);
  ctx.enter(v);
  await ctx.step();
}
