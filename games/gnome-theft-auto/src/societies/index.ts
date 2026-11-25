// E17 Underground societies (docs/roadmaps/gta-batch-3/E17/): the Underspan, Wader's Rest and Loamdeep.
// world.ts calls buildSocieties (static scenery, colliders); app.ts calls installSocieties (the living parts).
// Importing this module defines the four interiors (workshop, big tent, Loamdeep, DJ Moleman's burrow).
// Contracts: ./config.ts and docs/roadmaps/gta-batch-3/E17/contracts.md.
import type * as THREE from 'three';
import type { Blip, Box } from '../types';
import { registerProbe } from '../city/probes';
import { MOLE_JOB_IDS, SOCIETY_PROBES, type SocietyDeps, type SocietyPart } from './config';
import { loadSocietySave } from './save';
import { buildUnderspan } from './underspan/build';
import './underspan/workshop';
import { installUnderspanLife } from './underspan/life';
import { buildWadersRest } from './flock/build';
import './flock/tent';
import { installFlockLife } from './flock/life';
import { installSermon } from './flock/sermon';
import { buildBurrowDoor } from './loamdeep/door';
import './loamdeep/interior';
import './loamdeep/moleman';
import { updateMoleFolk } from './loamdeep/folk';
import { installLoamdeep } from './loamdeep/runtime';
import { installSocietyAchievements } from './achievements';

export * from './config';

/** Static scenery and colliders for the three places (push into world.boxes). */
export function buildSocieties(scene: THREE.Scene, boxes: Box[]): void {
  buildUnderspan(scene, boxes);
  buildWadersRest(scene, boxes);
  buildBurrowDoor(scene, boxes);
}

/** What app.ts calls. */
export interface Societies {
  update(dt: number): void;
  blips(): Blip[];
  /** A full-screen society UI is up: hold the player's controls. */
  isOpen(): boolean;
  speaker(x: number, z: number): { x: number; y: number; z: number; station: 'under' } | null;
}

/** Quest probes read from the societies save (a running total each). */
function registerSocietyProbes(): void {
  const jobProbe = { roots: SOCIETY_PROBES.moleRoots, lamps: SOCIETY_PROBES.moleLamps, post: SOCIETY_PROBES.molePost, dig: SOCIETY_PROBES.moleDig } as const;
  for (const id of MOLE_JOB_IDS) registerProbe(jobProbe[id], () => loadSocietySave().moleJobs[id]);
  registerProbe(SOCIETY_PROBES.moleAny, () => { const j = loadSocietySave().moleJobs; return j.roots + j.lamps + j.post + j.dig; });
  registerProbe(SOCIETY_PROBES.molemanMet, () => loadSocietySave().molemanMet);
  registerProbe(SOCIETY_PROBES.updraft, () => loadSocietySave().updraftRides);
  registerProbe(SOCIETY_PROBES.sermon, () => loadSocietySave().sermonsStood);
}

/** The living parts. Install once, after the jobs runtime. */
export function installSocieties(deps: SocietyDeps): Societies {
  registerSocietyProbes();
  const parts: SocietyPart[] = [
    installUnderspanLife(deps), installFlockLife(deps), installSermon(deps), installLoamdeep(deps), installSocietyAchievements(deps),
  ];
  let t = 0;
  return {
    update(dt) {
      t += dt;
      for (const p of parts) p.update?.(dt, t);
      updateMoleFolk(dt, t);
    },
    blips() { const out: Blip[] = []; for (const p of parts) if (p.blips) out.push(...p.blips()); return out; },
    isOpen: () => parts.some((p) => p.isOpen?.() ?? false),
    speaker(x, z) {
      for (const p of parts) { const s = p.speaker?.(x, z); if (s) return s; }
      return null;
    },
  };
}
