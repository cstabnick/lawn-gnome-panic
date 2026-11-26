// The Brim Walk (E33): the footpath along the Hatbrim's crest. From a stile at Mittenholt it climbs Old Pate (bald,
// with a cairn), drops to Brim Gap (crossing the Brim Gap Road by the Top Hat café), climbs the ridge to the Bobble's
// summit (the summit cairn and the Summit Register, the highest point in the yard), passes Pate's Bothy... and comes down
// the east side to the High Tarn's bothy, where it meets the tarn path. Walkers only. Data only.
// Laid by hand on the real land (E33 G1): the stile is on the north side of the band road, so the path slips under the
// road's first hairpins by crossing the band road twice, climbs Old Pate from the south, does a lap of its top, drops to
// the gap, zig-zags up the ridge to the summit and comes down the east flank north of the High Tarn.
import type { RouteDef, RouteSpot } from '../types';

export const BRIM_WALK: RouteDef = {
  id: 'brim-walk',
  name: 'the Brim Walk',
  blurb: 'Ridge walk over Old Pate and the Bobble to the High Tarn. Boots, not wheels.',
  kind: 'trail',
  closed: false,
  width: 2.5,
  shoulder: 0.6,
  fade: 4,
  barrierOffset: 1.6,
  surface: 'dirt',
  relief: 'ribbon',
  maxGrade: 0.42,
  smooth: 10,
  gates: 2,
  startOffset: 6,
  finishPad: 6,
  jumps: [],
  control: [
    { x: 618, z: -1325 }, { x: 605, z: -1320 }, { x: 637, z: -1297 }, { x: 645, z: -1270 },
    { x: 665, z: -1266 }, { x: 696, z: -1280 }, { x: 705, z: -1297 }, { x: 733, z: -1337 },
    { x: 732, z: -1350 }, { x: 785, z: -1389 }, { x: 749, z: -1400 }, { x: 761, z: -1426 },
    { x: 795, z: -1439 }, { x: 744, z: -1466 }, { x: 778, z: -1479 }, { x: 800, z: -1500 },
    { x: 822, z: -1486 }, { x: 860, z: -1504 }, { x: 838, z: -1545 }, { x: 831, z: -1536 },
    { x: 806, z: -1565 }, { x: 779, z: -1535 }, { x: 762, z: -1540 }, { x: 726, z: -1539 },
    { x: 721, z: -1563 }, { x: 708, z: -1597 }, { x: 717, z: -1604 }, { x: 701, z: -1617 },
    { x: 725, z: -1642 }, { x: 702, z: -1650 }, { x: 722, z: -1693 }, { x: 677, z: -1699 },
    { x: 690, z: -1690 }, { x: 698, z: -1745 }, { x: 736, z: -1742 }, { x: 790, z: -1699 },
    { x: 806, z: -1741 }, { x: 872, z: -1721 }, { x: 926, z: -1713 }, { x: 955, z: -1711 },
    { x: 976, z: -1700 }, { x: 1033, z: -1671 }, { x: 1062, z: -1671 }, { x: 1075, z: -1622 },
    { x: 1072, z: -1562 },
  ],
};

/**
 * Named spots along the walk (x, z, and the way the thing there faces; yaw 0 = +z, south): the stile at Mittenholt,
 * Old Pate's cairn on the dome's top, the gap crossing (where the walk crosses the Brim Gap Road), Pate's Bothy beside
 * the ridge path (it faces the path), the Bobble's summit (the summit cairn and the Summit Register), a bench with a view
 * east, and the end by the High Tarn bothy.
 */
export const BRIM_WALK_SPOTS: Readonly<Record<string, RouteSpot>> = {
  stile: { x: 618, z: -1325, yaw: -1.38 },
  pateCairn: { x: 800, z: -1500, yaw: 3.14 },
  gapCrossing: { x: 714.6, z: -1577.4, yaw: -2.68 },
  bothy: { x: 702.9, z: -1607.7, yaw: 2.58 },
  summit: { x: 690, z: -1690, yaw: 0 },
  ridgeBench: { x: 701, z: -1696, yaw: 1.57 },
  tarnEnd: { x: 1072, z: -1562, yaw: -0.12 },
};
