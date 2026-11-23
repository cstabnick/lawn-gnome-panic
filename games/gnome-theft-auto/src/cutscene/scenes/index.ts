// Every scripted scene by id. Quests name one with `cutscene: { kind: 'script', script: '<id>' }`; `?cutscene=<id>`
// plays one at once; `npm test` and `?cutscenecheck` run the line-of-sight and collision check on all of them.
import type { SceneScript } from '../script';
import { STREET_PICKUP } from './streetPickup';
import { PULL_UP } from './pullUp';
import { BACK_ROOM } from './backRoom';
import { CH1_SCENES } from './story/ch1';
import { CH1B_SCENES } from './story/ch1b';
import { CH2_SCENES } from './story/ch2';
import { CH2B_SCENES } from './story/ch2b';
import { CH3_SCENES } from './story/ch3';
import { CH4_SCENES } from './story/ch4';
import { CH5_SCENES } from './story/ch5';
import { SPEEDWAY_SCENES } from './speedway';

export const SCENES: Record<string, SceneScript> = {
  'street-pickup': STREET_PICKUP,
  'pull-up': PULL_UP,
  'back-room': BACK_ROOM,
  // The main story (docs/roadmaps/gta-story-cutscenes.md).
  ...CH1_SCENES,
  ...CH1B_SCENES,
  ...CH2_SCENES,
  ...CH2B_SCENES,
  ...CH3_SCENES,
  ...CH4_SCENES,
  ...CH5_SCENES,
  // The Fizz Cup races: race-<raceId>-intro and race-<raceId>-podium for each race in quests/races.ts.
  ...SPEEDWAY_SCENES,
};
