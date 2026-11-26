// E33 mountain routes: shared types. A mountain route is a TrackDef (raceTrack/trackDef.ts, 'ribbon' relief: carved into
// the land, grade-limited, cut and fill blended back) with a kind and an access rule. createTrack(def) turns it into a
// Track, so samples(), frame(s, lat), locate(), roadTopAt() and applyRelief() all come for free.
// Contract: docs/roadmaps/gta-batch-3/E33/contracts.md. Pure: no three.js, no DOM.
import type { TrackDef } from '../raceTrack/trackDef';

/**
 * 'road': a two-way asphalt road for any car, in the road graph (traffic and GPS use it), guard rails on the drops.
 * 'track': a narrow gravel shelf for bikes and buggies only (bollard gates at its ends), not in the road graph.
 * 'trail': a footpath (dirt), walkers only (stiles at its ends), not in the road graph.
 */
export type RouteKind = 'road' | 'track' | 'trail';

export interface RouteDef extends TrackDef {
  kind: RouteKind;
  /** relief is always 'ribbon' for a mountain route. */
  relief: 'ribbon';
  /** One line for the map legend and the route sign at each end. */
  blurb: string;
}

/** A named point on or beside a route (a hairpin, a café, a cairn): world x, z and the way it faces (yaw 0 = +z). */
export interface RouteSpot { readonly x: number; readonly z: number; readonly yaw: number }

/**
 * A pad: a level rectangle beside a route (a lay-by, the café terrace, a summit platform, a car park). Flattened to the
 * height of its route's road where the road passes nearest its centre (plus `lift`), blended back over `fade` m, after
 * every route has carved its ribbon (pads.ts applyPadRelief). Cells on a route's road are never touched, so the road
 * keeps its own grade: keep the road gentle (grade under 0.04) where a pad joins it.
 * The rectangle is turned by `yaw`: `hw` is its half size across (local x), `hd` along (local z, the yaw direction).
 */
export interface PadDef {
  id: string;
  /** The route the pad belongs to and takes its height from. */
  route: string;
  x: number; z: number; yaw: number;
  hw: number; hd: number;
  /** Blend back to the land over this many metres (default 6). */
  fade?: number;
  /** Metres above the road height (default 0). */
  lift?: number;
  /** What it drives like (default 'gravel'). */
  surface?: 'asphalt' | 'gravel' | 'dirt' | 'rock';
}
