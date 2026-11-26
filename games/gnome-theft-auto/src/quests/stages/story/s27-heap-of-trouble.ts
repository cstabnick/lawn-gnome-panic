// Story row 27: the stages its scenes play on (new ones), and extra quest ids for existing stages' usedBy.
// New: the furnace mouth at the Compost Heap (the giver, Ash-Shovel Ernie; the existing `compost-heap` stage is the forge
// yard behind it, built for the tablet quest) and the last lay-by before the snow line on the road north, where the
// convoy's lead truck stops and the rest go on without it. Nothing here is solid: the furnace and the heaps are already
// colliders, and no set prop stands on a path or in a shot.
import { cam, car, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'compost-heap-furnace',
    name: 'The Compost Heap furnace mouth',
    region: 'mossy-wood',
    center: [-247, -55],
    radius: 10,
    facing: Math.PI,
    time: 'dusk',
    built: 'dressed',
    givers: ['compost-heap'],
    usedBy: ['m27-heap-of-trouble'],
    look: 'The south face of the furnace glowing orange in the dusk, soot-grey heaps steaming behind it, a trampled yard of plates laid out for loading and an HOA van idling at the head of the forge track.',
    sounds: 'The furnace roaring low, a chestnut spitting on a trowel, a van engine ticking over, and Ernie humming a tune he cannot finish.',
    marks: [
      mark('ernie', [-246.2, -55], [-251, -57.8], 'work', 'roasts a chestnut on his trowel at the furnace mouth, rocking to a tune'),
      mark('player', [-251, -57.8], [-246.2, -55], 'stand', 'walks up from the yard to the furnace mouth'),
    ],
    cameras: [
      cam('wide', [-262, 5, -34], [-249, 1.6, -52], 'establishing: the furnace glow, the yard, the vans at the head of the forge track', 50),
      cam('plates', [-246.4, 2.6, -60.6], [-243.2, 0.1, -59.4], 'high and close on the four plates laid out in a cross, the clipboard on top', 40),
    ],
    walks: [],
    vehicles: [
      car('plate-van-a', 'parked', 'hoa-van', [-252, -43.5], Math.PI, undefined, 'the first plate van of the night, already loaded and pulling out'),
      car('plate-van-b', 'parked', 'hoa-van', [-247, -36], Math.PI, undefined, 'the second van, idling at the head of the forge track: the one to follow'),
    ],
    paths: [
      { id: 'forge-track-north', role: 'getaway', kind: 'hoa-van', points: [[-252, -43.5], [-251.5, -30], [-250, -22], [-250, -20], [-285, 0]], offRoad: true, note: 'up the forge track and out west along the highway' },
    ],
    set: [],
  },
  {
    id: 'snow-line-lay-by',
    name: 'The last lay-by before the snow line',
    region: 'north-highlands',
    center: [22, -1000],
    radius: 14,
    facing: Math.PI,
    time: 'night',
    built: 'dressed',
    usedBy: ['m27-heap-of-trouble'],
    look: 'A wide stretch of the road north where the verge turns to old snow, the lead plate van pulled in on the shoulder with its doors open, a sealed crate on the verge, and nothing beyond the headlights but the climb.',
    sounds: 'Wind with no trees in it, a cooling engine, paper rattling on a clipboard, a convoy fading up the hill.',
    marks: [
      mark('player', [18, -999], [24, -1003], 'stand', 'stands at the shoulder, the bill of lading in hand'),
    ],
    cameras: [
      cam('wide', [10, 3.4, -968], [24, 1.8, -1012], 'establishing from the south: the lay-by, the open van, the road climbing north into the dark', 50),
      cam('north', [19.5, 1.5, -993], [36, 2.0, -1052], 'low along the road north: where the convoy goes', 38),
    ],
    walks: [],
    vehicles: [
      car('lead-van-stopped', 'parked', 'hoa-van', [24.2, -1002.8], 2.88, undefined, 'the convoy\'s lead van, stopped at the last lay-by with its doors open'),
    ],
    paths: [
      { id: 'convoy-onward', role: 'getaway', kind: 'hoa-van', points: [[22, -1000], [40, -1060], [60, -1320]], note: 'the rest of the convoy, north over the snow line' },
    ],
    set: [
      { prefab: 'crate', at: [27.5, -1005], yaw: 0.3, scale: 1.4 },
    ],
  },
];
/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {};
