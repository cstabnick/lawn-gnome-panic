// The Hatband (E33): a narrow gravel shelf cut round the Bobble's steep upper cone, for bikes and buggies only. It
// leaves the Brim Gap Road at Brim Gap, climbs onto the cone and runs round its west and north faces with a sheer drop
// on the outside (no rails: marker posts only) to the World's Edge lookout over the north fence, then on round the
// east face back towards the gap. Not in the road graph; bollard gates keep cars out. Data only.
// Traced on the real land (E33 G1): it leaves the road on the north edge of the last climb to the gap, rides the cone's
// west and north faces on a shelf 4 m wide with a 4 m+ drop outside most of the way, and drops down the east face to the
// start of the east descent. `lift` eases the shelf up or down where the land is steeper than a track may climb.
import type { RouteDef, RouteSpot } from '../types';

export const HATBAND: RouteDef = {
  id: 'hatband',
  name: 'the Hatband',
  blurb: 'Gravel shelf round the Bobble, bikes and buggies only. Mind the drop.',
  kind: 'track',
  closed: false,
  width: 4,
  shoulder: 0.8,
  fade: 6,
  barrierOffset: 2.6,
  surface: 'gravel',
  relief: 'ribbon',
  maxGrade: 0.145,
  smooth: 8,
  gates: 2,
  startOffset: 10,
  finishPad: 10,
  jumps: [],
  control: [
    { x: 656, z: -1596, lift: -6.3 }, { x: 646, z: -1598, lift: -6 }, { x: 619, z: -1634, lift: -0.9 }, { x: 602, z: -1651, lift: 2.6 },
    { x: 606, z: -1724, lift: 1.9 }, { x: 606, z: -1724, lift: 1.8 }, { x: 656, z: -1766, lift: 1.3 }, { x: 659, z: -1767, lift: 1.1 },
    { x: 696, z: -1769, lift: 0.6 }, { x: 709, z: -1769, lift: -1.5 }, { x: 772, z: -1748, lift: -1.2 }, { x: 778, z: -1738, lift: -1 },
    { x: 775, z: -1717 }, { x: 781, z: -1680 }, { x: 777, z: -1655 }, { x: 770, z: -1628 },
    { x: 762, z: -1611 }, { x: 757, z: -1600 },
  ],
};

/**
 * Named spots (x, z, the way the thing there faces; yaw 0 = +z, south): the bollard gates where the track leaves the road
 * at the gap (west) and rejoins it on the east descent (east), both facing the way you ride; the World's Edge lookout
 * facing north over the fence; a passing place on the west face; and the scree where a rockfall has come down onto the
 * outer verge of the north face (it faces down the slope).
 */
export const HATBAND_SPOTS: Readonly<Record<string, RouteSpot>> = {
  gateWest: { x: 643.2, z: -1600.3, yaw: -2.35 },
  gateEast: { x: 762.8, z: -1612.7, yaw: -0.46 },
  worldsEdge: { x: 704, z: -1769.5, yaw: 3.14 },
  passingPlace: { x: 620.7, z: -1736.9, yaw: 2.29 },
  scree: { x: 658.4, z: -1770.5, yaw: -2.97 },
};
