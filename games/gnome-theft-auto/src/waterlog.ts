// Waterlogged mowers (fleet-damage workstream; lore ruling "waterlogged mowers" in docs/lore/rulings.md): a ground vehicle
// driven through water soaks its engine. A soaked engine loses top speed and sputters; a flooded one stalls until it
// dries out (or a garage repairs it: vehicles.ts repairVehicle calls clearWaterlog). Deep water still sinks it (swim.ts).
// Must not import vehicles.ts (vehicles.ts imports this file).
import { WATER } from './config';
import { waterAt } from './terrain';
import type { Vehicle } from './types';

/** Tuning. Soak and dry rates are per second on the 0..1 waterlog scale. */
export const WATERLOG = {
  /** Water shallower than this (metres, at the vehicle's centre) does not soak. */
  minDepth: 0.12,
  /** Soak rate in shallow water (minDepth) and at WATER.stallDepth (0.9); linear in between. */
  soakShallow: 0.18, soakDeep: 0.7,
  /** Extra soak multiplier while moving fast through water (above 8 units/s): a bow wave down the air intake. */
  splashMult: 1.6,
  /** Dry rate on land; a stalled engine sitting still dries at the same rate. */
  dryPerS: 1 / 28,
  /** Above this the engine sputters (throttle cuts out now and then) and toasts 'soaked'. */
  sputterAt: 0.35,
  /** At 1 the engine floods and stalls; it restarts once it has dried below restartAt. */
  restartAt: 0.55,
  /** Top-speed multiplier at waterlog 1 (lerped from 1 at 0). */
  minSpeedMult: 0.4,
  /** Share of the throttle a stalled engine still gives, so a stalled mower can crawl out of the water. */
  limp: 0.2,
} as const;

/** 'soaked' rising past sputterAt, 'flooded' on stalling at 1, 'restarted' when a stalled engine dries below restartAt, 'dry' back to 0. */
export type WaterlogEvent = 'soaked' | 'flooded' | 'restarted' | 'dry';

/** Soak or dry one vehicle for dt seconds. Returns the event crossed this frame, else null. */
export function stepWaterlog(v: Vehicle, dt: number): WaterlogEvent | null {
  if (v.spec.boat || v.spec.flies || v.exploded || v.sunk) return null;
  const prev = v.waterlog ?? 0;
  const w = waterAt(v.x, v.z);
  let wl: number;
  if (w && w.depth >= WATERLOG.minDepth && v.y < w.surface) {
    const d01 = clamp((w.depth - WATERLOG.minDepth) / (WATER.stallDepth - WATERLOG.minDepth), 0, 1);
    let rate = WATERLOG.soakShallow + (WATERLOG.soakDeep - WATERLOG.soakShallow) * d01;
    if (Math.abs(v.speed) > 8) rate *= WATERLOG.splashMult;
    wl = Math.min(1, prev + rate * dt);
  } else {
    wl = Math.max(0, prev - WATERLOG.dryPerS * dt);
  }
  v.waterlog = wl;

  if (!v.waterlogStalled && wl >= 1) {
    v.waterlogStalled = true;
    return 'flooded';
  }
  if (v.waterlogStalled && wl < WATERLOG.restartAt) {
    v.waterlogStalled = false;
    return 'restarted';
  }
  if (prev < WATERLOG.sputterAt && wl >= WATERLOG.sputterAt) return 'soaked';
  if (prev > 0 && wl === 0) return 'dry';
  return null;
}

/** The throttle the engine really gives for input `throttle` (-1..1) at clock `t` seconds. */
export function waterlogThrottle(v: Vehicle, throttle: number, t: number): number {
  const wl = v.waterlog ?? 0;
  if (wl <= 0) return throttle;
  if (v.waterlogStalled) return throttle * WATERLOG.limp;
  if (wl >= WATERLOG.sputterAt) {
    const cut = 0.5 * (wl - WATERLOG.sputterAt) / (1 - WATERLOG.sputterAt);
    const x = t * 1.7 + v.id * 0.37;
    const phase = x - Math.floor(x);
    if (phase < cut) return 0;
  }
  return throttle * (1 - 0.4 * wl);
}

/** Top-speed multiplier: 1 dry .. WATERLOG.minSpeedMult flooded. */
export function waterlogSpeedMult(v: Vehicle): number {
  return 1 - (1 - WATERLOG.minSpeedMult) * (v.waterlog ?? 0);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Dry it out at once (a repair, a respawn). */
export function clearWaterlog(v: Vehicle): void {
  v.waterlog = 0;
  v.waterlogStalled = false;
}
