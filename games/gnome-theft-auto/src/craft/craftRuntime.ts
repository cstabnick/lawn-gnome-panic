// Game glue for the air-and-sea workstream (docs/roadmaps/gta-air-and-sea.md): spawns the airfield craft, opens the
// Wingwright's Slipway, wears the owned paint on boarding, lets an abandoned aircraft fall, toasts stalls and hard landings,
// and counts the Three Ways Up achievement (engine sounds: sound/engines.ts TABLE). app.ts makes one and calls it per frame.
import type * as THREE from 'three';
import { play } from '../audio';
import { ownedLoadout, isCraftKind } from '../glazeStore';
import { setVehicleLook, stepVehicle } from '../vehicles';
import type { Economy } from '../economy';
import type { Hud, Vehicle, VehicleKind, World } from '../types';
import { lastAirEvent } from './aircraft';
import { createCraftShop, type CraftShop } from './craftShop';
import { AIR_KINDS, spawnAirfieldCraft } from './spawns';

/** Achievements (packages/achievements catalog.ts). */
export const THREE_WAYS_UP = 'gta-three-ways-up';
export const SLIPWAY_REGULAR = 'gta-slipway-regular';
/** The new aircraft the player has taken off in (a JSON array of kinds), so Three Ways Up counts each once. */
export const AIR_FLOWN_KEY = 'gta-air-flown-v1';

interface RuntimeStorage { getItem(k: string): string | null; setItem(k: string, v: string): void }

function storage(): RuntimeStorage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

const memoryFlown = new Set<string>();

/** Remember that the player flew `kind`. True only the first time ever for one of AIR_KINDS. */
export function recordFlown(kind: VehicleKind, s: RuntimeStorage | null = storage()): boolean {
  if (!AIR_KINDS.includes(kind)) return false;
  if (s) {
    try {
      const raw: unknown = JSON.parse(s.getItem(AIR_FLOWN_KEY) ?? '[]');
      const known = new Set(Array.isArray(raw) ? raw.filter((k): k is string => typeof k === 'string') : []);
      if (known.has(kind)) return false;
      known.add(kind);
      s.setItem(AIR_FLOWN_KEY, JSON.stringify([...known]));
      return true;
    } catch {
      // fall through to memory
    }
  }
  if (memoryFlown.has(kind)) return false;
  memoryFlown.add(kind);
  return true;
}

export interface CraftRuntimeDeps {
  scene: THREE.Scene;
  ui: HTMLElement;
  hud: Hud;
  economy: Economy;
  world: World;
  vehicles: Vehicle[];
  achievements: { unlock(id: string): unknown; increment(id: string): unknown };
}

export interface CraftRuntime {
  shop: CraftShop;
  /** The player just took the controls of `v`: a boat or aircraft wears the paint the player owns for its model. */
  onEnter(v: Vehicle): void;
  /** Every frame, with the vehicle the player drives (null on foot or as a passenger). */
  update(dt: number, driven: Vehicle | null): void;
}

const NEUTRAL = { throttle: 0, steer: 0, lift: 0 };

export function createCraftRuntime(deps: CraftRuntimeDeps): CraftRuntime {
  spawnAirfieldCraft(deps.scene, deps.world, deps.vehicles);
  const shop = createCraftShop(deps.ui, deps.hud, {
    setLook: setVehicleLook,
    spend: (n, why) => deps.economy.spend(n, why),
    acorns: () => deps.economy.state().acorns,
    play,
    onPurchase: () => { void deps.achievements.unlock(SLIPWAY_REGULAR); },
  });

  return {
    shop,
    onEnter(v) {
      if (!isCraftKind(v.kind) || v.rig) return;
      const own = ownedLoadout(v.kind);
      if (own && own.paint !== v.tint) setVehicleLook(v, own);
    },
    update(dt, driven) {
      shop.update(driven);
      if (driven?.air) {
        const ev = lastAirEvent(driven.id);
        if (ev?.stallStarted) { deps.hud.toast('STALL! Nose down and throttle up.', 1800); play('alarm'); }
        if (ev && ev.damage > 0) deps.hud.toast('Hard landing!', 1500);
        if (ev?.liftedOff && recordFlown(driven.kind)) void deps.achievements.increment(THREE_WAYS_UP);
      }
      // An aircraft nobody flies (bailed out of, or its pilot shot) still falls or drifts down until it is on the floor.
      for (const v of deps.vehicles) {
        if (v.spec.air && v.driver === 'none' && v.air?.airborne && !v.exploded && v !== driven) stepVehicle(v, NEUTRAL, dt, deps.world);
      }
    },
  };
}
