// The countryside (E16): Thorne Even-Estates' building sites, Trellisdown Vineyard and Brassknock Manor, Windfall Croft
// (the farm, src/farm/), the hunter camps and the deer. world.ts calls buildCountryside (static scenery and colliders);
// app.ts calls installCountryside (the living parts, prompts and E). Each part lives in its own module; this file only
// combines them. Contracts: ./types.ts, ../farm/types.ts, docs/roadmaps/gta-batch-3/E16/contracts.md.
import type * as THREE from 'three';
import type { JobsDeps } from '../jobs/types';
import type { Blip, Box } from '../types';
import { buildEstates } from './estates';
import { buildEstatesStory, installEstatesLife } from './estatesLife';
import { buildVineyard } from './vineyard';
import { buildManor } from './manor';
import { registerCountryHomes } from './manorInterior';
import { buildTrellisStory, installTrellisLife } from './trellisLife';
import { buildCroft } from './croft';
import { buildCamps, installCamps } from './campsBuild';
import { registerCountrySounds } from './sounds';
import { installCountryAchievements } from './achievements';
import { installFarm } from '../farm/runtime';
import { registerFarmApp } from '../farm/farmApp';
import type { CountryPart, Countryside } from './types';

export { EVEN_ESTATES, MANOR, VINEYARD, COUNTRY_ACH, COUNTRY_QUESTS } from './types';
export type { Countryside } from './types';

/** Static scenery and colliders for every countryside place (push into world.boxes). */
export function buildCountryside(scene: THREE.Scene, boxes: Box[]): void {
  buildEstates(scene, boxes);
  buildEstatesStory(scene, boxes);
  buildVineyard(scene, boxes);
  buildManor(scene, boxes);
  buildTrellisStory(scene, boxes);
  buildCroft(scene, boxes);
  buildCamps(scene, boxes);
}

/** The living parts. Install once, after the jobs runtime (needs its deps). */
export function installCountryside(deps: JobsDeps): Countryside {
  registerCountrySounds();
  registerCountryHomes();
  const farm = installFarm(deps);
  registerFarmApp(farm);
  const parts: CountryPart[] = [
    farm, installEstatesLife(deps), installTrellisLife(deps), installCamps(deps), installCountryAchievements(deps),
  ];
  let t = 0;
  return {
    update(dt) { t += dt; for (const p of parts) p.update?.(dt, t); },
    blips() { const out: Blip[] = []; for (const p of parts) if (p.blips) out.push(...p.blips()); return out; },
    prompt(x, z) {
      for (const p of parts) { const s = p.prompt?.(x, z); if (s) return s; }
      return null;
    },
    interact(x, z) {
      for (const p of parts) if (p.prompt?.(x, z) && p.interact?.(x, z)) return true;
      return false;
    },
  };
}
