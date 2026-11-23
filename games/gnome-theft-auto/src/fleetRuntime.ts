// Fleet-damage glue for app.ts: waterlogged engines (waterlog.ts), parts breaking off into real debris (debris.ts), fleet
// spawns by id (fleet.ts), their toasts, the waterlog HUD badge and the achievements (Fore!, Bog Standard, Some Assembly
// Required). app.ts makes one with createFleetRuntime and calls throttle / update / onEnter.
import type * as THREE from 'three';
import { createDebris, type DebrisSystem } from './debris';
import { spawnFleet, type SpotChecks } from './fleet';
import { insideBox } from './collide';
import { surfaceAt } from './surfaces';
import { waterAt } from './terrain';
import { setPartsHooks } from './vehicles';
import { stepWaterlog, waterlogThrottle, type WaterlogEvent } from './waterlog';
import type { Fx, Vehicle, World } from './types';

/** The road and blocked-ground checks for clearOfRoads and the debris road tidy, from the live world. */
export function worldSpotChecks(world: World): SpotChecks {
  return {
    onRoad: (x, z) => surfaceAt(x, z, world).kind === 'asphalt',
    blocked: (x, z) => insideBox(x, 0.5, z, world.boxes) || (waterAt(x, z)?.depth ?? 0) > 0.05,
  };
}

export const FLEET_ACHIEVEMENTS = {
  fore: 'gta-fore',
  swamp: 'gta-swamp-engine',
  bits: 'gta-bits-everywhere',
} as const;

/** Parts knocked off within this distance of the player count toward Some Assembly Required. */
const BITS_RADIUS = 30;

export interface FleetDeps {
  scene: THREE.Scene;
  /** The shared #ui element: the badge appends its own container to it. */
  ui: HTMLElement;
  fx: Fx;
  hud: { toast(text: string, ms?: number): void };
  achievements: { unlock(id: string): unknown; increment(id: string, by?: number): unknown };
  /** The live vehicle list (spawn pushes into it). */
  vehicles: Vehicle[];
  /** The player's position (for counting nearby breakages). */
  playerPos(): { x: number; z: number };
  /** True on a road surface: debris that comes to rest there is tidied away quickly (DEBRIS.roadLife). */
  onRoad?(x: number, z: number): boolean;
}

export interface FleetRuntime {
  /** The throttle the player's engine really gives this frame (waterlog sputter / stall). */
  throttle(v: Vehicle, throttle: number): number;
  /** Every frame: soak / dry every ground vehicle, step debris, steam puffs and the badge. */
  update(dt: number, playerVehicle: Vehicle | null): void;
  /** The player just got into v. */
  onEnter(v: Vehicle): void;
  /** Spawn fleet entry `id` (a variant id or a VehicleKind) and add it to the vehicle list. Null for an unknown id. */
  spawn(id: string, x: number, z: number, yaw: number): Vehicle | null;
  debris: DebrisSystem;
}

const TOASTS: Record<WaterlogEvent, (name: string) => string> = {
  soaked: (n) => `${n}: waterlogged. The engine is coughing.`,
  flooded: (n) => `${n}: flooded and stalled. Let it dry out, or get it to a garage.`,
  restarted: (n) => `${n}: dried out enough to start again.`,
  dry: (n) => `${n}: dry again.`,
};

export function createFleetRuntime(deps: FleetDeps): FleetRuntime {
  const debris = createDebris(deps.scene, deps.onRoad);
  let clock = 0;
  let steamT = 0;

  const near = (v: Vehicle): boolean => {
    const p = deps.playerPos();
    return Math.hypot(v.x - p.x, v.z - p.z) <= BITS_RADIUS;
  };
  setPartsHooks({
    beforeDamage(v, body, fromLevel, toLevel) {
      const n = debris.detach(v, body, fromLevel, toLevel);
      if (n > 0) {
        deps.fx.spark(v.x, v.y + 0.6, v.z);
        if (near(v)) void deps.achievements.increment(FLEET_ACHIEVEMENTS.bits, n);
      }
    },
    exploded(v) {
      const n = debris.burst(v);
      if (n > 0 && near(v)) void deps.achievements.increment(FLEET_ACHIEVEMENTS.bits, n);
    },
  });

  // The badge: a small pill under the top of the screen while the player's ride is waterlogged. Display only (no input).
  const badge = document.createElement('div');
  badge.className = 'gta-waterlog-badge';
  Object.assign(badge.style, {
    position: 'absolute', left: '50%', top: 'calc(env(safe-area-inset-top, 0px) + 64px)', transform: 'translateX(-50%)',
    padding: '4px 12px', borderRadius: '999px', background: 'rgba(20, 60, 90, 0.82)', color: '#e8f4ff',
    font: '600 13px/1.4 system-ui, sans-serif', pointerEvents: 'none', display: 'none', zIndex: '5', whiteSpace: 'nowrap',
  } satisfies Partial<CSSStyleDeclaration>);
  deps.ui.appendChild(badge);
  let badgeText = '';

  function showBadge(v: Vehicle | null): void {
    const wl = v?.waterlog ?? 0;
    let text = '';
    if (v && v.waterlogStalled) text = 'Flooded: drying out';
    else if (v && wl > 0.05) text = `Waterlogged ${Math.round(wl * 100)}%`;
    if (text === badgeText) return;
    badgeText = text;
    badge.textContent = text;
    badge.style.display = text ? 'block' : 'none';
  }

  return {
    debris,
    throttle(v, throttle) {
      return waterlogThrottle(v, throttle, clock);
    },
    update(dt, playerVehicle) {
      clock += dt;
      for (const v of deps.vehicles) {
        if (v.spec.flies || v.spec.boat || v.exploded) continue;
        if (v.driver === 'none' && !(v.waterlog && v.waterlog > 0)) continue;
        const ev = stepWaterlog(v, dt);
        if (ev && v === playerVehicle) {
          deps.hud.toast(TOASTS[ev](v.spec.name), ev === 'flooded' ? 4000 : 2600);
          if (ev === 'flooded') void deps.achievements.unlock(FLEET_ACHIEVEMENTS.swamp);
        }
      }
      // Steam and drips off the player's soaked engine.
      const pv = playerVehicle;
      if (pv && (pv.waterlog ?? 0) > 0.2) {
        steamT -= dt;
        if (steamT <= 0) {
          steamT = pv.waterlogStalled ? 0.12 : 0.3;
          deps.fx.trail?.(pv.x, pv.y + 0.7, pv.z, 'smoke');
        }
      }
      debris.update(dt);
      showBadge(pv);
    },
    onEnter(v) {
      if (v.kind === 'golf-cart') void deps.achievements.unlock(FLEET_ACHIEVEMENTS.fore);
    },
    spawn(id, x, z, yaw) {
      const v = spawnFleet(deps.scene, id, x, z, yaw);
      if (v) deps.vehicles.push(v);
      return v;
    },
  };
}
