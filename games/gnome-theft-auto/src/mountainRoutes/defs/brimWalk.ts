// The Brim Walk (E33): the footpath along the Hatbrim's crest. From a stile at Mittenholt it climbs Old Pate (bald,
// with a cairn), drops to Brim Gap (crossing the Brim Gap Road by the Top Hat café), climbs the ridge to the Bobble's
// summit (the summit cairn and the Summit Register, the highest point in the yard), passes Pate's Bothy... and comes down
// the east side to the High Tarn's bothy, where it meets the tarn path. Walkers only. Data only.
// FOUNDATION STUB: rough line only, the geometry issue (G1) replaces the control points and fills BRIM_WALK_SPOTS.
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
  maxGrade: 0.45,
  smooth: 10,
  gates: 2,
  startOffset: 6,
  finishPad: 6,
  jumps: [],
  control: [
    { x: 612, z: -1330 }, { x: 700, z: -1420 }, { x: 760, z: -1500 }, { x: 712, z: -1590 }, { x: 690, z: -1690 },
    { x: 790, z: -1700 }, { x: 900, z: -1650 }, { x: 1040, z: -1612 },
  ],
};

/** Named spots (filled by G1): the stile, Old Pate cairn, the summit cairn + register, the hut, the tarn end. */
export const BRIM_WALK_SPOTS: Readonly<Record<string, RouteSpot>> = {};
