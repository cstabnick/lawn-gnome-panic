// The Spine Cut (E33): a road through a gorge cut in the Highland Spine (the ridge between Capwood and Pinwheel Ridge).
// It leaves the north band road, dives into the cut under the Keyhole (a rock arch left standing over the road), and
// runs out across the moor south of Pinwheel Ridge to the east band road: a short cut across the Snowcap loop.
// A two-way asphalt road in the road graph. Data only.
// Hand-fitted to the land (G2): the road runs the flat moor to the Spine at about 2 m, then sinks into a gorge over 100 m long and up to 26 m deep; negative lift on the control points digs the road below the crest.
import type { PadDef, RouteDef, RouteSpot } from '../types';

export const SPINE_CUT: RouteDef = {
  id: 'spine-cut',
  name: 'the Spine Cut',
  blurb: 'Gorge road through the Highland Spine, under the Keyhole, across the moor to the east band.',
  kind: 'road',
  closed: false,
  width: 7,
  shoulder: 1.5,
  fade: 4,
  barrierOffset: 5,
  surface: 'asphalt',
  relief: 'ribbon',
  maxGrade: 0.03,
  smooth: 160,
  pinEnds: 40,
  gates: 2,
  startOffset: 10,
  finishPad: 10,
  jumps: [],
  control: [
    { x: 440, z: -1325.3 }, { x: 440, z: -1270 }, { x: 460, z: -1240 }, { x: 505, z: -1220, lift: -2.5 },
    { x: 550, z: -1203, lift: -5 }, { x: 600, z: -1188, lift: -6 }, { x: 645, z: -1160, lift: -5 },
    { x: 700, z: -1110, lift: -4 }, { x: 752, z: -1075, lift: -2.5 },
    { x: 815, z: -1090, lift: -1 }, { x: 880, z: -1088 }, { x: 935, z: -1060 }, { x: 965, z: -1020 }, { x: 1011.6, z: -990 },
  ],
};

/** Named spots on the Spine Cut. keyhole = where the cut is deepest (the arch stands over it), yaw = the road's direction. */
export const SPINE_CUT_SPOTS: Readonly<Record<string, RouteSpot>> = {
  start: { x: 440.0, z: -1325.3, yaw: -0.108 },
  end: { x: 1011.6, z: -990.0, yaw: 1.077 },
  gorgeIn: { x: 527.8, z: -1210.9, yaw: 1.203 },
  keyhole: { x: 576.5, z: -1195.8, yaw: 1.317 },
  rockfall: { x: 566.1, z: -1203.6, yaw: 1.320 },
  gorgeOut: { x: 623.9, z: -1174.9, yaw: 0.984 },
  moorBend: { x: 754.4, z: -1074.7, yaw: 1.477 },
  /** Beside the Keyhole pull-in, facing the arch. */
  surveyor: { x: 519.4, z: -1227.7, yaw: 1.06 },
};

/** Pads on the Spine Cut: the Keyhole pull-in (just outside the gorge mouth, north of the road, a view of the arch) and the moor lay-by. */
export const SPINE_PADS: readonly PadDef[] = [
  { id: 'keyhole-pullin', route: 'spine-cut', x: 514.6, z: -1226.4, yaw: 1.187, hw: 4, hd: 10, fade: 5, surface: 'gravel' },
  { id: 'moor-layby', route: 'spine-cut', x: 729.2, z: -1097.2, yaw: 0.894, hw: 3.5, hd: 9, fade: 5, surface: 'gravel' },
];
