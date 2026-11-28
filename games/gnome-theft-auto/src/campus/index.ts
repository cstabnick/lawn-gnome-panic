// Rootwell (E13): Rootwell University, the Anthill Observatory and Dean's Leap, Rootwell Field and Pinwheel Ridge.
// world.ts calls buildRootwell (static scenery, colliders, rooftops); app.ts calls installRootwell (the living parts).
// Each part lives in its own module; this file only combines them. Contracts: ./types.ts.
import type * as THREE from 'three';
import type { JobsDeps } from '../jobs/types';
import type { Blip, Box } from '../types';
import { buildCampusBuildings } from './buildings';
import { buildCampusGrounds } from './grounds';
import { buildCampusStory } from './story';
import { addCampusRooftops } from './interiors';
import { buildObservatory, installObservatory } from './observatory';
import './observatoryInterior';
import { buildRootwellField, installFieldLife } from './field';
import { buildWindFarm, installWindFarm } from './windFarm';
import { installCampusLife } from './life';
import { installRootwellAchievements } from './achievements';
import type { Rootwell, RootwellPart } from './types';

export { CAMPUS, CAMPUS_BUILDINGS, OBSERVATORY, PINWHEEL_SIZE, ROOTWELL_ACH, ROOTWELL_FIELD, ROOTWELL_QUESTS, WIND_FARM } from './types';
export type { CampusBuilding, Rootwell } from './types';

/** Static scenery and colliders for every Rootwell place (push into world.boxes). */
export function buildRootwell(scene: THREE.Scene, boxes: Box[]): void {
  buildCampusBuildings(scene, boxes);
  buildCampusGrounds(scene, boxes);
  buildCampusStory(scene, boxes);
  addCampusRooftops();
  buildObservatory(scene, boxes);
  buildRootwellField(scene, boxes);
  buildWindFarm(scene, boxes);
}

/** The living parts. Install once, after the jobs runtime (needs its deps). */
export function installRootwell(deps: JobsDeps): Rootwell {
  const parts: RootwellPart[] = [
    installCampusLife(deps), installObservatory(deps), installFieldLife(deps), installWindFarm(deps),
    installRootwellAchievements(deps),
  ];
  let t = 0;
  return {
    update(dt) { t += dt; for (const p of parts) p.update?.(dt, t); },
    blips() { const out: Blip[] = []; for (const p of parts) if (p.blips) out.push(...p.blips()); return out; },
  };
}
