// Every park's layout, in one DressPlan (docs/roadmaps/gta-parks-and-fringe.md). Parks are planned first, before the
// street scenery and the fringe, so they get their blocks whole.
import type { Site } from '../cityScenery/site';
import { emptyPlan, type DressPlan } from '../cityScenery/types';
import { PARKS, type ParkId } from './blocks';
import { parkCtx, type ParkCtx } from './kit';
import { layoutBandstandGreen, layoutGnorwin, layoutKilnsideRec } from './layoutA';
import { layoutGnorwinCourts, layoutGnorwinSkate } from './layoutC';
import { layoutClayfootRose, layoutMallardMere, layoutPureLoam } from './layoutB';

const LAYOUTS: Record<ParkId, (c: ParkCtx) => void> = {
  gnorwin: layoutGnorwin,
  'bandstand-green': layoutBandstandGreen,
  'kilnside-rec': layoutKilnsideRec,
  'mallard-mere': layoutMallardMere,
  'clayfoot-rose': layoutClayfootRose,
  'pure-loam': layoutPureLoam,
  'gnorwin-courts': layoutGnorwinCourts,
  'gnorwin-skate': layoutGnorwinSkate,
};

export function planParks(site: Site): DressPlan {
  const plan = emptyPlan();
  for (const park of PARKS) LAYOUTS[park.id](parkCtx(site, plan, park));
  return plan;
}
