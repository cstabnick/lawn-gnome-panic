// The Rutbottom Dirt Bowl (E14, site `dirt-track`, Rootwell): a bumpy dirt circuit with big banked turns, whoops and
// a jump, on the levelled site x 1000..1400, z -780..-520 (centre (1200, -650), gate (1000, -650) on the east-band road).
// Data only; createTrack (../trackDef.ts) does the geometry. Lore: docs/lore/entries/apocrypha/rutbottom-dirt-bowl.md.
import type { TrackDef } from '../trackDef';

export const RUTBOTTOM: TrackDef = {
  id: 'rutbottom',
  name: 'Rutbottom Dirt Bowl',
  closed: true,
  width: 11,
  shoulder: 3,
  fade: 8,
  barrierOffset: 10,
  surface: 'dirt',
  relief: 'raise',
  gates: 10,
  startOffset: 40,
  // Placeholder oval (E14 epic 1): epic 2 replaces the control points, banks, whoops and jumps.
  control: [
    { x: 1080, z: -600 }, { x: 1200, z: -600 }, { x: 1300, z: -610, bank: 2 }, { x: 1320, z: -650, bank: 3 },
    { x: 1300, z: -690, bank: 2 }, { x: 1200, z: -700 }, { x: 1080, z: -690, bank: 2 }, { x: 1060, z: -650, bank: 3 },
  ],
  jumps: [],
  whoops: [],
  reserve: { x: 1200, z: -650, hw: 200, hd: 130 },
};
