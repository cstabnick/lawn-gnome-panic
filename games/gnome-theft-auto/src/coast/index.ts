// Saltbucket Shore's coast (E11): world build (world.ts calls buildCoast) and the runtime (app.ts calls installCoast).
// Each part lives in its own module; this file only combines them.
import type * as THREE from 'three';
import type { JobsDeps } from '../jobs/types';
import type { Blip, Box, InputState, Vehicle } from '../types';
import { buildBoardwalk } from './boardwalk';
import { buildDunes } from './dunes';
import { buildBeachScenes } from './beachScenes';
import { buildPirateShip, installPirateShip } from './pirateShip';
import { installSpokewheel } from './spokewheel';
import { installCoastLife } from './life';
import { installCoastAmbience } from './ambience';
import { stepCoastNight } from './nightLights';
import type { Coast, CoastPart } from './types';

export { COAST, COAST_ACH, COAST_QUESTS, OCEAN_ID, SALTCUT_ID } from './config';
export type { Coast, CoastPart } from './types';

/** Static scenery and colliders: the boardwalk, Long Spoon Pier, the Bathtub Queen (+ their walkable rooftops), the
 *  dunes and the bucket, and the beach scenes along the strand. */
export function buildCoast(scene: THREE.Scene, boxes: Box[]): void {
  buildBoardwalk(scene, boxes);
  buildPirateShip(scene, boxes);
  buildDunes(scene, boxes);
  buildBeachScenes(scene, boxes);
}

/** The living coast: the Spokewheel ride, boarding the ship, residents, sounds and the night lights. Install once, after tubing. */
export function installCoast(deps: JobsDeps): Coast {
  const parts: CoastPart[] = [installSpokewheel(deps), installPirateShip(deps), installCoastLife(deps), installCoastAmbience(deps)];
  return {
    update(dt) {
      stepCoastNight(dt, deps.timeLabel());
      for (const p of parts) p.update?.(dt);
    },
    blips() { const out: Blip[] = []; for (const p of parts) if (p.blips) out.push(...p.blips()); return out; },
    drives(v: Vehicle) { return parts.some((p) => p.drives?.(v) ?? false); },
    stepRider(v: Vehicle, inp: InputState, dt: number) {
      const p = parts.find((q) => q.drives?.(v));
      p?.stepRider?.(v, inp, dt);
    },
  };
}
