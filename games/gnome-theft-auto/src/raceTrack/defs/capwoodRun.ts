// The Capwood Run (E14, site `rally-route`): the point-to-point rally from the Frostbite Fells paddock (90, -760) up
// the Fells mountain to the summit (300, -900), down its north flank into Capwood (the toadstool forest, site
// `toadstool-forest`, x 100..400, z -1280..-1080) and on to the finish (150, -1300), with fords of Cap-water that slow a
// car but never flood it. The road is carved into the land ('ribbon' relief). Data only; createTrack (../trackDef.ts)
// does the geometry. Lore: docs/lore/entries/apocrypha/capwood-run.md.
import type { TrackDef } from '../trackDef';

export const CAPWOOD_RUN: TrackDef = {
  id: 'capwood-run',
  name: 'the Capwood Run',
  closed: false,
  width: 9,
  shoulder: 2,
  fade: 10,
  barrierOffset: 8,
  surface: 'dirt',
  relief: 'ribbon',
  maxGrade: 0.22,
  smooth: 30,
  gates: 14,
  startOffset: 36,
  finishPad: 25,
  control: [
    { x: 90, z: -746 }, { x: 94, z: -800 }, { x: 94, z: -900 }, { x: 94, z: -1000 },
    { x: 94, z: -1062 }, { x: 99, z: -1076, bank: 1 }, { x: 109, z: -1081, bank: 1 }, { x: 119, z: -1076, bank: 1 },
    { x: 124, z: -1062 }, { x: 124, z: -950 }, { x: 124, z: -870 }, { x: 124, z: -810 },
    { x: 128, z: -795 }, { x: 138, z: -790, bank: 1 }, { x: 148, z: -795, bank: 1 }, { x: 152, z: -810 },
    { x: 152, z: -880 }, { x: 152, z: -1000 }, { x: 152, z: -1062 }, { x: 157, z: -1076, bank: 1 },
    { x: 167, z: -1081, bank: 1 }, { x: 177, z: -1076, bank: 1 }, { x: 182, z: -1062 }, { x: 182, z: -950 },
    { x: 182, z: -870 }, { x: 182, z: -810 }, { x: 186, z: -797 }, { x: 195, z: -792, bank: 1 },
    { x: 204, z: -797, bank: 1 }, { x: 208, z: -810 }, { x: 208, z: -900 }, { x: 208, z: -1000 },
    { x: 208, z: -1038 }, { x: 212, z: -1050 }, { x: 220, z: -1056, bank: 1 }, { x: 228, z: -1052, bank: 1 },
    { x: 236, z: -1038 }, { x: 236, z: -960 }, { x: 236, z: -900 }, { x: 238, z: -872 },
    { x: 268, z: -872 }, { x: 302, z: -870 }, { x: 336, z: -874, bank: 1 }, { x: 356, z: -896 },
    { x: 358, z: -940 }, { x: 350, z: -965, bank: 1 }, { x: 322, z: -985 }, { x: 316, z: -1010 },
    { x: 342, z: -1028 }, { x: 350, z: -1052 }, { x: 335, z: -1085 }, { x: 300, z: -1108 },
    { x: 262, z: -1112, bank: 1 }, { x: 245, z: -1130, bank: 1 }, { x: 262, z: -1150 }, { x: 320, z: -1150 },
    { x: 345, z: -1160, bank: 1 }, { x: 342, z: -1185, bank: 1 }, { x: 310, z: -1197 }, { x: 250, z: -1197 },
    { x: 205, z: -1200, bank: 1 }, { x: 195, z: -1225, bank: 1 }, { x: 215, z: -1238 }, { x: 262, z: -1240 },
    { x: 275, z: -1247, bank: 1 }, { x: 258, z: -1268, bank: 1 }, { x: 220, z: -1280 }, { x: 140, z: -1288 },
  ],
  jumps: [
    { id: 'puffball-pop', name: 'the Puffball Pop', s: 1900, rise: 1.4, up: 14, down: 20 },
  ],
  fords: [
    { id: 'gill-ford', name: 'the Gill Ford', s: 2244, len: 30, depth: 0.35, dip: 0.8 },
    { id: 'spore-splash', name: 'Spore Splash', s: 2411, len: 28, depth: 0.4, dip: 0.7 },
  ],
};
