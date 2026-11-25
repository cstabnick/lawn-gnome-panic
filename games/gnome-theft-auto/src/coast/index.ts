// Saltbucket Shore's coast (E11): world build (world.ts calls buildCoast) and the runtime (app.ts calls installCoast).
// Each part lives in its own module; this file only combines them.
import type * as THREE from 'three';
import type { JobsDeps } from '../jobs/types';
import type { Blip, Box, InputState, Vehicle } from '../types';
import { buildBoardwalk } from './boardwalk';
import { buildPirateShip, installPirateShip } from './pirateShip';
import { installSpokewheel } from './spokewheel';
import { installCoastLife } from './life';
import type { Coast, CoastPart } from './types';

export { COAST, COAST_ACH, COAST_QUESTS, COAST_UNLOCK_AFTER, OCEAN_ID, SALTCUT_ID } from './config';
export type { Coast, CoastPart } from './types';

/** Static scenery and colliders: the boardwalk, Long Spoon Pier and the Bathtub Queen (+ their walkable rooftops). */
export function buildCoast(scene: THREE.Scene, boxes: Box[]): void {
  buildBoardwalk(scene, boxes);
  buildPirateShip(scene, boxes);
}

/** The living coast: the Spokewheel ride, boarding the ship, residents and sounds. Install once, after tubing. */
export function installCoast(deps: JobsDeps): Coast {
  const parts: CoastPart[] = [installSpokewheel(deps), installPirateShip(deps), installCoastLife(deps)];
  return {
    update(dt) { for (const p of parts) p.update?.(dt); },
    blips() { const out: Blip[] = []; for (const p of parts) if (p.blips) out.push(...p.blips()); return out; },
    drives(v: Vehicle) { return parts.some((p) => p.drives?.(v) ?? false); },
    stepRider(v: Vehicle, inp: InputState, dt: number) {
      const p = parts.find((q) => q.drives?.(v));
      p?.stepRider?.(v, inp, dt);
    },
  };
}
