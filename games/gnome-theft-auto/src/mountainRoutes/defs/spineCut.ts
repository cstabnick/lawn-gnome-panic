// The Spine Cut (E33): a road through a gorge cut in the Highland Spine (the ridge between Capwood and Pinwheel Ridge).
// It leaves the north band road, dives into the cut under the Keyhole (a rock arch left standing over the road), and
// runs out across the moor south of Pinwheel Ridge to the east band road: a short cut across the Snowcap loop.
// A two-way asphalt road in the road graph. Data only.
// FOUNDATION STUB: rough line only, the geometry issue (G2) replaces the control points and fills SPINE_CUT_SPOTS.
import type { PadDef, RouteDef, RouteSpot } from '../types';

export const SPINE_CUT: RouteDef = {
  id: 'spine-cut',
  name: 'the Spine Cut',
  blurb: 'Gorge road through the Highland Spine, under the Keyhole, across the moor to the east band.',
  kind: 'road',
  closed: false,
  width: 7,
  shoulder: 1.5,
  fade: 9,
  barrierOffset: 5,
  surface: 'asphalt',
  relief: 'ribbon',
  maxGrade: 0.08,
  smooth: 40,
  gates: 2,
  startOffset: 10,
  finishPad: 10,
  jumps: [],
  control: [
    { x: 450, z: -1324 }, { x: 470, z: -1260 }, { x: 520, z: -1180 }, { x: 590, z: -1110 }, { x: 700, z: -1060 },
    { x: 850, z: -1020 }, { x: 1011, z: -990 },
  ],
};

/** Named spots (filled by G2): the Keyhole, the gorge floor, the moor lay-by. */
export const SPINE_CUT_SPOTS: Readonly<Record<string, RouteSpot>> = {};

/** Pads on the Spine Cut (filled by G2): the Keyhole pull-in, the moor lay-by. */
export const SPINE_PADS: readonly PadDef[] = [];
