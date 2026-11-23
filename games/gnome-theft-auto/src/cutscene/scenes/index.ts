// Every scripted scene by id. Quests name one with `cutscene: { kind: 'script', script: '<id>' }`; `?cutscene=<id>`
// plays one at once; `npm test` and `?cutscenecheck` run the line-of-sight and collision check on all of them.
import type { SceneScript } from '../script';
import { STREET_PICKUP } from './streetPickup';
import { PULL_UP } from './pullUp';
import { BACK_ROOM } from './backRoom';
import { SPEEDWAY_SCENES } from './speedway';

export const SCENES: Record<string, SceneScript> = {
  'street-pickup': STREET_PICKUP,
  'pull-up': PULL_UP,
  'back-room': BACK_ROOM,
  // The Fizz Cup races: race-<raceId>-intro and race-<raceId>-podium for each race in quests/races.ts.
  ...SPEEDWAY_SCENES,
};
