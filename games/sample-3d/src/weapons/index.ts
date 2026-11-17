import type { WeaponFactory, WeaponId } from '../config';
import { createSlingshot } from './slingshot';
import { createTrowels } from './trowels';
import { createSprinkler } from './sprinkler';
import { createMushrooms } from './mushrooms';
import { createPitchfork } from './pitchfork';
import { createLeafBlower } from './leafBlower';
import { createWindChimeLullaby } from './windChimeLullaby';
import { createHoseMissile } from './hoseMissile';
import { createLeafPileFireball } from './leafPileFireball';
import { createStormOfDaggers } from './stormOfDaggers';
import { createSaguaroSpines } from './saguaroSpines';
import { createHaboob } from './haboob';
import { createMonsoon } from './monsoon';

export const WEAPON_FACTORIES: Record<WeaponId, WeaponFactory> = {
  slingshot: createSlingshot,
  trowels: createTrowels,
  sprinkler: createSprinkler,
  mushrooms: createMushrooms,
  pitchfork: createPitchfork,
  leafBlower: createLeafBlower,
  windChimeLullaby: createWindChimeLullaby,
  hoseMissile: createHoseMissile,
  leafPileFireball: createLeafPileFireball,
  stormOfDaggers: createStormOfDaggers,
  saguaroSpines: createSaguaroSpines,
  haboob: createHaboob,
  monsoon: createMonsoon,
};
