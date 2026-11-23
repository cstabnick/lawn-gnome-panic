// The base as the sim sees it: pushes, noise, warmth, damage (roadmap 9).
import { addNoise, hatlessInRegion } from './horde';
import type { Rng } from './rng';
import type { RegionId, WorldState } from './types';

export function setSimBase(w: WorldState, b: { region: RegionId; x: number; z: number; hp: number; maxHp: number; warmth: number } | null): void {
  if (b === null) { w.base = null; return; }
  const old = w.base;
  const same = old !== null && old.region === b.region;
  w.base = { ...b, pending: same ? old.pending : 0, fallenTick: same ? old.fallenTick : null };
}

export function stepBase(w: WorldState, rng: Rng): void {
  const base = w.base;
  if (base === null || base.hp <= 0) return;
  const t = w.tuning;
  if (base.warmth > 0) addNoise(w, base.region, base.warmth * t.base.noisePerWarmth);
  // The game simulates this region's Hatless itself while the player is there.
  if (w.promoted.region === base.region) return;
  const pushers = rng.round(Math.min(t.base.pushCap, hatlessInRegion(w, base.region) * t.base.pushShare));
  const dmg = pushers * t.base.hpPerPusherMinute * (24 * 60 / t.clock.ticksPerDay);
  base.hp = Math.max(0, base.hp - dmg);
  base.pending += dmg;
  if (base.hp === 0) {
    base.fallenTick = w.tick;
    w.flags['base-fell'] = true;
    w.chronicle.push({ tick: w.tick, text: `The Hatless broke into a lone gnome's camp in ${w.graph.byId[base.region].name}.` });
  }
}

export function takeBaseDamage(w: WorldState): number {
  if (!w.base) return 0;
  const n = w.base.pending;
  w.base.pending = 0;
  return n;
}
