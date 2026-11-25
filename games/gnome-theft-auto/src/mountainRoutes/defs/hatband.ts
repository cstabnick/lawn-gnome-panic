// The Hatband (E33): a narrow gravel shelf cut round the Bobble's steep upper cone, for bikes and buggies only. It
// leaves the Brim Gap Road at Brim Gap, climbs onto the cone and runs round its west and north faces with a sheer drop
// on the outside (no rails: marker posts only) to the World's Edge lookout over the north fence, then on round the
// east face back towards the gap. Not in the road graph; bollard gates keep cars out. Data only.
// FOUNDATION STUB: rough line only, the geometry issue (G1) replaces the control points and fills HATBAND_SPOTS.
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
  maxGrade: 0.16,
  smooth: 14,
  gates: 2,
  startOffset: 10,
  finishPad: 10,
  jumps: [],
  control: [
    { x: 700, z: -1605 }, { x: 660, z: -1630 }, { x: 625, z: -1680 }, { x: 640, z: -1745 }, { x: 700, z: -1765 },
    { x: 760, z: -1730 }, { x: 770, z: -1670 }, { x: 740, z: -1628 },
  ],
};

/** Named spots (filled by G1): the two gates, the World's Edge lookout, a passing place. */
export const HATBAND_SPOTS: Readonly<Record<string, RouteSpot>> = {};
