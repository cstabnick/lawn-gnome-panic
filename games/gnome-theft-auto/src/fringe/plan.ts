// The fringe round Turfton (docs/roadmaps/gta-parks-and-fringe.md): tracks first (lots line up on them), then the lots,
// the power poles along the roads, and last the green creeping in round everything.
import type { Site } from '../cityScenery/site';
import { emptyPlan, type DressPlan } from '../cityScenery/types';
import { planEdgeGreen, planTracks } from './ground';
import { planLots, planPoles } from './lots';

export function planFringe(site: Site): DressPlan {
  const plan = emptyPlan();
  const tracks = planTracks(site, plan);
  planLots(site, plan, tracks);
  planPoles(site, plan);
  planEdgeGreen(site, plan);
  return plan;
}
