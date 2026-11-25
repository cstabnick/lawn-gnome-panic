// E33 mountain routes registry: every hand-made route over the Hatbrim and the Highland Spine, by id.
// Terrain relief, driving surface and scenery keep-out come through raceTrack/tracks.ts GROUND_TRACKS (which lists
// ALL_ROUTES after the race tracks, in the order below: trails first, then tracks, then roads, so where two cross the
// road's grade wins). The 'road' kinds join the road graph (graph.ts). Contract: docs/roadmaps/gta-batch-3/E33/contracts.md.
// Pure: no three.js, no DOM.
import { createTrack, type Track } from '../raceTrack/trackDef';
import { BRIM_GAP_ROAD } from './defs/brimGapRoad';
import { BRIM_WALK } from './defs/brimWalk';
import { HATBAND } from './defs/hatband';
import { SPINE_CUT } from './defs/spineCut';
import type { RouteDef, RouteKind } from './types';

export const ROUTE_IDS = ['brim-walk', 'hatband', 'spine-cut', 'brim-gap-road'] as const;
export type RouteId = (typeof ROUTE_IDS)[number];

export const ROUTE_DEFS: Readonly<Record<RouteId, RouteDef>> = {
  'brim-walk': BRIM_WALK,
  hatband: HATBAND,
  'spine-cut': SPINE_CUT,
  'brim-gap-road': BRIM_GAP_ROAD,
};

export const ROUTES: Readonly<Record<RouteId, Track>> = {
  'brim-walk': createTrack(BRIM_WALK),
  hatband: createTrack(HATBAND),
  'spine-cut': createTrack(SPINE_CUT),
  'brim-gap-road': createTrack(BRIM_GAP_ROAD),
};

/** Every route's Track, in registry order (the order their relief is applied). */
export const ALL_ROUTES: readonly Track[] = ROUTE_IDS.map((id) => ROUTES[id]);

/** The route's kind ('road' | 'track' | 'trail'). */
export function routeKind(id: RouteId): RouteKind {
  return ROUTE_DEFS[id].kind;
}

/** Ids of the routes of one kind, in registry order. */
export function routesOfKind(kind: RouteKind): RouteId[] {
  return ROUTE_IDS.filter((id) => ROUTE_DEFS[id].kind === kind);
}

/** The route with this id (throws on an unknown id). */
export function routeById(id: string): Track {
  const t = (ROUTES as Record<string, Track>)[id];
  if (!t) throw new Error(`unknown mountain route '${id}'`);
  return t;
}
