// The Turfton city contracts' scenes (quests/cityQuests.ts): intros at the Kerbside Exchange stage with Dot Pennywort
// and the client, payoffs at the client's own place. One file per quest.
import type { SceneScript } from '../../script';
import { GLOW_BAND_SCENES } from './glowBand';
import { IMPOUND_RUN_SCENES } from './impoundRun';
import { KERBSIDE_ROUNDS_SCENES } from './kerbsideRounds';
import { PENTHOUSE_SCENES } from './penthouse';
import { SKYWAY_JOB_SCENES } from './skywayJob';

export const CITY_SCENES: Record<string, SceneScript> = Object.fromEntries(
  [KERBSIDE_ROUNDS_SCENES, IMPOUND_RUN_SCENES, GLOW_BAND_SCENES, PENTHOUSE_SCENES, SKYWAY_JOB_SCENES].flat().map((s) => [s.id, s]),
);
