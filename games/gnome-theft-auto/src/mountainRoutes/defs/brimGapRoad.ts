// The Brim Gap Road (E33): the pass road over the Hatbrim. It leaves the north band road just east of Mittenholt, climbs
// the west face of Old Pate in hairpins to Brim Gap (the col between Old Pate and the Bobble, where the Top Hat café and
// lookout stand), drops down the east side to the High Tarn's west shore and runs back south to the north band road.
// A two-way asphalt road in the road graph. Data only; createTrack (../../raceTrack/trackDef.ts) does the geometry.
// Hand-laid on the real land (E33 G1): the road leaves the band road at x 648, switchbacks up the west face of Old Pate
// (the control points hug the contours; `lift` lets a leg ride a little above the slope where the face is steep), levels
// out over the col, then drops down the east side in two more hairpins to the tarn basin and runs back south. The
// geometry test (hatbrim.geometry.test.ts) holds every rule: grade, curvature, hairpins, cut and fill, clearances.
import type { RouteDef, RouteSpot } from '../types';

export const BRIM_GAP_ROAD: RouteDef = {
  id: 'brim-gap-road',
  name: 'the Brim Gap Road',
  blurb: 'Pass road over the Hatbrim: hairpins, the Top Hat café at Brim Gap, down to the High Tarn.',
  kind: 'road',
  closed: false,
  width: 7,
  shoulder: 1.5,
  fade: 9,
  barrierOffset: 5,
  surface: 'asphalt',
  relief: 'ribbon',
  maxGrade: 0.088,
  smooth: 24,
  gates: 2,
  startOffset: 10,
  finishPad: 10,
  jumps: [],
  control: [
    { x: 648, z: -1301 }, { x: 646, z: -1340 }, { x: 651, z: -1370, lift: 1.2 }, { x: 650, z: -1377, lift: 0.9 },
    { x: 644, z: -1397, lift: 0.2 }, { x: 640, z: -1431, lift: 2.1 }, { x: 653, z: -1450, lift: 1.4 }, { x: 676, z: -1455, lift: 1 },
    { x: 694, z: -1471, lift: 0.9 }, { x: 689, z: -1491, lift: 1 }, { x: 674, z: -1496, lift: 0.5 }, { x: 666, z: -1493, lift: 0.7 },
    { x: 620, z: -1502, lift: 4 }, { x: 619, z: -1502, lift: 4 }, { x: 609, z: -1507, lift: 2.9 }, { x: 605, z: -1520, lift: 2.9 },
    { x: 613, z: -1532, lift: 2.4 }, { x: 631, z: -1533, lift: 2.5 }, { x: 636, z: -1531, lift: 2.1 }, { x: 639, z: -1528, lift: 1.8 },
    { x: 659, z: -1526, lift: 1.7 }, { x: 672, z: -1534, lift: 1.7 }, { x: 673, z: -1549, lift: 1.2 }, { x: 665, z: -1557, lift: 1.2 },
    { x: 619, z: -1561, lift: 1.4 }, { x: 595, z: -1566, lift: 1.5 }, { x: 584, z: -1581, lift: 1.8 }, { x: 589, z: -1598, lift: 1.9 },
    { x: 623, z: -1608, lift: 2.1 }, { x: 639, z: -1595, lift: 2.1 }, { x: 663, z: -1590, lift: 2.2 }, { x: 674, z: -1577, lift: 2.3 },
    { x: 721, z: -1579, lift: -1 }, { x: 726, z: -1583, lift: -1 }, { x: 736, z: -1589, lift: -1 }, { x: 772, z: -1601, lift: -1.2 },
    { x: 785, z: -1609, lift: -1 }, { x: 808, z: -1684, lift: -1.5 }, { x: 819, z: -1726, lift: -1.7 }, { x: 833, z: -1731, lift: -1.8 },
    { x: 844, z: -1722, lift: -1.8 }, { x: 841, z: -1696, lift: -1.9 }, { x: 831, z: -1663, lift: -0.6 }, { x: 833, z: -1648, lift: 0.4 },
    { x: 821, z: -1606, lift: 0.4 }, { x: 822, z: -1585, lift: 0.2 }, { x: 839, z: -1575, lift: -1.7 }, { x: 853, z: -1583, lift: -1.7 },
    { x: 855, z: -1590, lift: -1.7 }, { x: 856, z: -1622, lift: -1.4 }, { x: 865, z: -1666, lift: -1.2 }, { x: 867, z: -1687, lift: -0.6 },
    { x: 875, z: -1707, lift: 0.2 }, { x: 898, z: -1709, lift: 0.4 }, { x: 910, z: -1689, lift: 0.4 }, { x: 892, z: -1661, lift: 0.4 },
    { x: 889, z: -1626, lift: 0.2 }, { x: 888, z: -1616, lift: 0.3 }, { x: 892, z: -1538, lift: -3.1 }, { x: 960, z: -1521, lift: -0.1 },
    { x: 975, z: -1511, lift: -0.2 }, { x: 1002, z: -1485 }, { x: 1009, z: -1428, lift: -0.2 }, { x: 960, z: -1379, lift: -0.1 },
    { x: 964, z: -1341, lift: 0.4 }, { x: 950, z: -1320 }, { x: 950, z: -1298 },
  ],
};

/**
 * Named spots along the road: x, z and the way the thing there faces (yaw 0 = +z, south). `start` and `end` face the
 * way you drive; `hairpinN` stands on the apex of the Nth hairpin and faces the OUTSIDE of the turn (the drop side);
 * `cafe` is where the Top Hat café stands on its pad (on the flat just south of the road at the gap) and `lookout` the
 * railing on the pad's south-west edge, both facing south-west out over Mittenholt and the plain; the picnic and camper spots stand on the outside verge of the hairpins with the most room.
 */
export const BRIM_GAP_SPOTS: Readonly<Record<string, RouteSpot>> = {
  start: { x: 648, z: -1301, yaw: -3.04 },
  end: { x: 950, z: -1298, yaw: 0.13 },
  hairpin1: { x: 676.3, z: -1495.9, yaw: 3.06 },
  hairpin2: { x: 611.4, z: -1530.9, yaw: -2.46 },
  hairpin3: { x: 671.8, z: -1551.4, yaw: 2.13 },
  hairpin4: { x: 842.9, z: -1724.1, yaw: 2.15 },
  hairpin5: { x: 839.9, z: -1575.1, yaw: 0.1 },
  cafe: { x: 699, z: -1560, yaw: -0.93 },
  lookout: { x: 692, z: -1551, yaw: -0.93 },
  picnicHairpin: { x: 676.9, z: -1502.9, yaw: 3.06 },
  camperHairpin: { x: 607.9, z: -1535.1, yaw: -1.96 },
  tarnLayby: { x: 895, z: -1625, yaw: -0.12 },
};
