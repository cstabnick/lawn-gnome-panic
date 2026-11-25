// Every region's wildlife, in update order. app.ts passes this to createCritters.
import type { RegionLife } from '../critters';
import { bandsLife } from './bands';
import { cloverfieldLife } from './cloverfield';
import { commonsLife } from './commons';
import { dreyGangLife } from './dreyGang';
import { fellsLife } from './fells';
import { snowcapLife } from './snowcap';
import { unmownLife } from './unmown';

export const REGION_LIFE: readonly RegionLife[] = [cloverfieldLife, dreyGangLife, fellsLife, commonsLife, snowcapLife, unmownLife, bandsLife];
