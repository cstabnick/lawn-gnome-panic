// Every scripted scene by id. Quests name one with `cutscene: { kind: 'script', script: '<id>' }`; `?cutscene=<id>`
// plays one at once; `npm test` and `?cutscenecheck` run the line-of-sight and collision check on all of them.
import type { SceneScript } from '../script';
import { STREET_PICKUP } from './streetPickup';
import { PULL_UP } from './pullUp';
import { BACK_ROOM } from './backRoom';
import { SIDE_SCENES } from './side';
import { CITY_SCENES } from './city';
import { CH1_SCENES } from './story/ch1';
import { CH1B_SCENES } from './story/ch1b';
import { CH1C_SCENES } from './story/ch1c';
import { CH1D_SCENES } from './story/ch1d';
import { CH2_SCENES } from './story/ch2';
import { CH2B_SCENES } from './story/ch2b';
import { CH2C_SCENES } from './story/ch2c';
import { CH2D_SCENES } from './story/ch2d';
import { CH3_SCENES } from './story/ch3';
import { CH4_SCENES } from './story/ch4';
import { CH5_SCENES } from './story/ch5';
import { ACT_I_SCENES } from './story/actI';
import { ACT_II_SCENES } from './story/actII';
import { SPEEDWAY_SCENES } from './speedway';
import { LAB_SCENES } from './lab';

export const SCENES: Record<string, SceneScript> = {
  'street-pickup': STREET_PICKUP,
  'pull-up': PULL_UP,
  'back-room': BACK_ROOM,
  // Side quests (side/index.ts).
  ...SIDE_SCENES,
  // The Kerbside Exchange city contracts (city/index.ts).
  ...CITY_SCENES,
  // The main story (docs/roadmaps/gta-story-cutscenes.md).
  ...CH1_SCENES,
  ...CH1B_SCENES,
  ...CH1C_SCENES,
  ...CH1D_SCENES,
  ...CH2_SCENES,
  ...CH2B_SCENES,
  ...CH2C_SCENES,
  ...CH2D_SCENES,
  ...CH3_SCENES,
  ...CH4_SCENES,
  ...CH5_SCENES,
  // E20 story rows, one file per row (story/m<NN>-<slug>.ts), acts I and II.
  ...ACT_I_SCENES,
  ...ACT_II_SCENES,
  // The Fizz Cup races: race-<raceId>-intro and race-<raceId>-podium for each race in quests/races.ts.
  ...SPEEDWAY_SCENES,
  // Dev labs (lab.ts): seats, dismounts and held guns, staged to look at.
  ...LAB_SCENES,
};
