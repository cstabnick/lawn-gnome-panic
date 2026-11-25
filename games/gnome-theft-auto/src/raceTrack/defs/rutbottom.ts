// The Rutbottom Dirt Bowl (E14, site `dirt-track`, Rootwell): a bumpy dirt circuit with big banked turns, whoops and
// two jumps, on the levelled site x 1000..1400, z -780..-520 (centre (1200, -650), gate (1000, -650) on the east-band road).
// Data only; createTrack (../trackDef.ts) does the geometry. Lore: docs/lore/entries/apocrypha/rutbottom-dirt-bowl.md.
// The lap runs east along the south straight (the start line is on it), round the Berm, back west along the north side
// with a dip into the infield, and home through the west corners. The west end stays clear of the gate at (1000, -650).
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
  control: [
    { x: 1085, z: -548 },
    { x: 1170, z: -543 },
    { x: 1260, z: -543, lift: 1 },
    { x: 1335, z: -552, lift: 1.5, bank: 2.6 },          // Hay Fever, first right-hander
    { x: 1378, z: -598, lift: 1, bank: 4 },              // the Berm: biggest bank, the berm remembers
    { x: 1372, z: -665, lift: 2, bank: 3.2 },
    { x: 1350, z: -725, lift: 3, bank: 2.8 },            // Gravel Hat
    { x: 1300, z: -762, lift: 2 },
    { x: 1235, z: -758, lift: 1 },
    { x: 1228, z: -705, lift: 2.5, bank: 2.6 },          // Mudguard Dip, down into the infield
    { x: 1218, z: -622, lift: 3.5, bank: 3 },
    { x: 1150, z: -608, lift: 3, bank: 3 },
    { x: 1100, z: -660, lift: 1.5 },
    { x: 1105, z: -730, lift: 1 },
    { x: 1075, z: -762, lift: 1, bank: 3 },              // Cowpat Corner
    { x: 1054, z: -722, bank: 3 },
    { x: 1058, z: -625, lift: 1.5 },
    { x: 1050, z: -575, bank: 3 },                       // Last Orders, onto the home straight
  ],
  // s = lap distance from the start line (1124, -543). Whoops stay 25 m or more from every jump and the line.
  jumps: [
    { id: 'claryhump', name: "Clary's Hump", s: 150, rise: 1.5, up: 9, down: 5 },
    { id: 'teaseltable', name: "Teasel's Table", s: 500, rise: 1.7, up: 10, down: 6 },
  ],
  whoops: [
    { from: 50, to: 110, amp: 0.3, wave: 7 },
    { from: 575, to: 640, amp: 0.35, wave: 8 },
    { from: 1030, to: 1090, amp: 0.3, wave: 6 },
  ],
  reserve: { x: 1200, z: -650, hw: 200, hd: 130 },
};
