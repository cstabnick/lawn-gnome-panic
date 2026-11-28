// Story row 35 (ch3-salvage-raid, extended): the stages its new scenes play on, and extra quest ids for existing stages.
// - p1 Tuesday: the storeroom door on the west wall of the Side-Valve block (block x -162..-138, z 79.5..100.5), where Cam
//   sleeps on a cot and leaves his broom (scene and inspect props only: no set dressing, so nothing stays in the world
//   after the raid); then the van line inside the Patio Gate (the compound wall is z = -130, the gate gap x 146..154),
//   a cutscene-only fleet of six HOA vans parked nose to tail between the gate and the gallery green.
// - p2 Hold the Bay: the existing Side-Valve bay (side-valve-bay), day for the loading, dusk for the bench lock.
import { cam, car, mark, type Stage } from '../kit';

const P1 = 'ch3-salvage-raid-p1';
const P2 = 'ch3-salvage-raid-p2';

export const STAGES: readonly Stage[] = [
  {
    id: 'side-valve-storeroom',
    name: "Side-Valve storeroom door (Cam's cot)",
    region: 'turfton',
    center: [-165, 84],
    radius: 8,
    facing: -Math.PI / 2,
    time: 'dawn',
    built: 'existing',
    usedBy: [P1, P2],
    look: "The west wall of the Side-Valve block, by the storeroom door: Cam's cot made up square under the eave, his push-broom leaning on the wall, a shop clock over the door.",
    sounds: 'The shop clock ticking, a pigeon on the gutter, the first traffic on the x = -180 road.',
    marks: [
      mark('tansy', [-165.2, 81.6], [-164.2, 85.6], 'stand', 'at the storeroom door, spanner in hand, looking at the cot'),
      mark('pip', [-166.8, 79.4], [-165.2, 81.6], 'stand', 'comes round the corner with two mugs'),
      mark('player', [-167.6, 82.4], [-165.2, 81.6], 'stand', 'at the corner of the block, on the pavement'),
    ],
    cameras: [
      cam('door-wide', [-171, 2.2, 78], [-163.6, 0.8, 84.5], 'establishing: the storeroom door from the pavement, the cot and the broom against the wall', 50),
      cam('clock', [-165.6, 1.6, 80.2], [-162, 2.3, 81], 'insert: the shop clock over the storeroom door', 36),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'patio-gate-vanline',
    name: 'The van line inside the Patio Gate',
    region: 'turfton',
    center: [150, -143],
    radius: 14,
    facing: 0,
    time: 'day',
    built: 'existing',
    usedBy: [P1],
    look: 'Six obsidian HOA vans parked nose to tail in two rows on the compound flagstones, pointing at the gate; a foreman with a rota between the rows.',
    sounds: 'Engines warming, a clipboard slapped on a van flank, a binder page turning at the sentry box.',
    marks: [
      mark('hoa-foreman', [150.5, -142], [150, -150], 'stand', 'between the rows with the van rota, briefing the drivers'),
      mark('hoa-raider', [148, -145.5], [150, -141], 'stand', 'a driver, cap in hand'),
      mark('hoa-raider', [152.2, -146], [150, -141], 'stand', 'a driver, arms folded'),
      mark('gary', [142.8, -134.2], [150, -130], 'stand', 'on his stool by the sentry box, binder open'),
      mark('player', [150.5, -126.5], [150, -140], 'stand', 'outside the gate gap with a camera'),
    ],
    cameras: [
      cam('through-gate', [150, 1.6, -123], [150, 1.1, -146], 'through the gate gap down the van line', 46),
      cam('vans-low', [146.4, 0.7, -133.4], [154, 1, -150], 'low along the left row of vans toward the gallery', 44),
    ],
    walks: [],
    vehicles: [
      car('van-l1', 'parked', 'hoa-van', [144.5, -139], 0, undefined, 'left row, first: nose at the gate'),
      car('van-l2', 'parked', 'hoa-van', [144.5, -146], 0, undefined, 'left row, second'),
      car('van-l3', 'parked', 'hoa-van', [144.5, -153], 0, undefined, 'left row, third'),
      car('van-r1', 'parked', 'hoa-van', [155.5, -139], 0, undefined, 'right row, first: nose at the gate'),
      car('van-r2', 'parked', 'hoa-van', [155.5, -146], 0, undefined, 'right row, second'),
      car('van-r3', 'parked', 'hoa-van', [155.5, -153], 0, undefined, 'right row, third'),
    ],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'side-valve-bay': [P1, P2],
  'patio-gate': [P1],
};
