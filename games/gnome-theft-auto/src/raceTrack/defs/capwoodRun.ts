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
  startOffset: 45,
  finishPad: 25,
  // Placeholder line (E14 epic 1): epic 2 replaces it with the full route, banks, jump and fords.
  control: [
    { x: 90, z: -730 }, { x: 95, z: -800 }, { x: 160, z: -850 }, { x: 240, z: -860 }, { x: 300, z: -900 },
    { x: 320, z: -980 }, { x: 290, z: -1060 }, { x: 250, z: -1140 }, { x: 220, z: -1210 }, { x: 150, z: -1290 },
  ],
  jumps: [],
  fords: [
    { id: 'first-ford', name: 'Cap-water Ford', s: 900, len: 26, depth: 0.35, dip: 0.6 },
  ],
};
