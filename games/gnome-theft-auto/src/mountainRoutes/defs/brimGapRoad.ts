// The Brim Gap Road (E33): the pass road over the Hatbrim. It leaves the north band road just east of Mittenholt, climbs
// the west face of Old Pate in hairpins to Brim Gap (the col between Old Pate and the Bobble, where the Top Hat café and
// lookout stand), drops down the east side to the High Tarn's west shore and runs back south to the north band road.
// A two-way asphalt road in the road graph. Data only; createTrack (../../raceTrack/trackDef.ts) does the geometry.
// FOUNDATION STUB: rough line only, the geometry issue (G1) replaces the control points and fills BRIM_GAP_SPOTS.
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
  maxGrade: 0.1,
  smooth: 24,
  gates: 2,
  startOffset: 10,
  finishPad: 10,
  jumps: [],
  control: [
    { x: 640, z: -1302 }, { x: 650, z: -1380 }, { x: 660, z: -1450 }, { x: 690, z: -1520 }, { x: 705, z: -1588 },
    { x: 760, z: -1600 }, { x: 830, z: -1590 }, { x: 880, z: -1560 }, { x: 890, z: -1450 }, { x: 885, z: -1298 },
  ],
};

/** Named spots along the road (filled by G1): hairpins, the café lay-by, the lookout, the tarn lay-by. */
export const BRIM_GAP_SPOTS: Readonly<Record<string, RouteSpot>> = {};
