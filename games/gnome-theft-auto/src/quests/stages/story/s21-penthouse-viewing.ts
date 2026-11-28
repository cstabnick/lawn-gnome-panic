// Story row 21: the stages its scenes play on (new ones), and extra quest ids for existing stages' usedBy.
// New: the door of flat 3B (the giver: the beige card on the mat) and the Double Pot Tunnel (the tour and the key on the
// table). The Patio Gate is the existing `patio-gate` stage (turftonB.ts), listed in USES.
import { cam, mark, type Stage } from '../kit';

/** The Double Pot slab top, metres above the tunnel floor (city/megaBlock.ts MEGA_BLOCK.roof). */
const ROOF = 9;

export const STAGES: readonly Stage[] = [
  {
    id: 'saucer-court-mat',
    name: 'Saucer Court, the door of flat 3B',
    region: 'turfton',
    center: [30, 86],
    radius: 18,
    facing: 0,
    time: 'day',
    built: 'existing',
    givers: ['flat-3b-mat'],
    usedBy: ['m21-penthouse-viewing'],
    look: 'The Saucer Court courtyard in flat afternoon light, the Tall-One saucer set into the paving, the stairwell door of flats 3A and 3B on the north wing and a worn mat in front of it.',
    sounds: 'A tap dripping in the stairwell, a courtyard with nobody in it, a card landing on a mat, then footsteps leaving.',
    marks: [
      mark('player', [34, 87], [30.4, 82.4], 'stand', 'stands at the edge of the courtyard, keys in hand, looking at the stairwell door'),
      mark('hoa-courier', [33, 90], [30.4, 83.4], 'stand', 'a beige courier in a beige coat, arriving with one card and no conversation'),
    ],
    cameras: [
      cam('wide', [19, 3.5, 108], [30, 1.2, 84], 'establishing: the courtyard from the south gap, the saucer in the middle, the stairwell door beyond'),
      cam('mat', [27.6, 0.9, 88.6], [30.4, 0.15, 82.6], 'low on the mat in front of the stairwell door, where the card will land'),
      cam('overhead', [30, 26, 97.5], [30, 0, 97], 'straight down on the saucer in the courtyard, the signature shot of Saucer Court', 45),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'double-pot-tunnel',
    name: 'The Double Pot roof garden, the viewing',
    region: 'turfton',
    center: [120, -92],
    radius: 22,
    facing: 0,
    time: 'day',
    built: 'dressed',
    usedBy: ['m21-penthouse-viewing'],
    look: 'A beige roof garden on the Double Pot slab, nine metres up: a beige table with beige chairs and two pots on the north half, a lantern post by the stairwell, the lift kiosk at the south parapet, the helipad kept clear, and Turfton laid out beyond the open edges.',
    sounds: 'A lift tone and nothing else: no birds, no traffic, only a high even wind and footsteps in even steps.',
    marks: [
      mark('vesper', [120, -79.5], [120, -75.5], 'stand', 'already standing outside the lift kiosk, hands folded, a long beige shadow behind him', ROOF),
      mark('player', [120, -75.5], [120, -79.5], 'stand', 'steps out of the lift kiosk onto the roof', ROOF),
      mark('player', [124.4, -105.5], [121.5, -105.5], 'stand', 'stands at the east side of the beige table with the key on it', ROOF),
      mark('vesper', [118.6, -105.5], [121.5, -105.5], 'stand', 'at the west side of the table, the open edge and the city behind him', ROOF),
    ],
    cameras: [
      cam('kiosk', [120, ROOF + 1.6, -90], [120, ROOF + 1.3, -73], 'from the helipad, up the roof to the lift kiosk with Vesper standing in front of it'),
      cam('lantern', [117, ROOF + 1.5, -82.8], [113.5, ROOF + 1.4, -84.8], 'an insert on the lantern post by the stairwell'),
      cam('table', [126.2, ROOF + 1.6, -101.6], [121.5, ROOF + 0.9, -105.5], 'the table with the key on it, the open edge and the city beyond'),
      cam('long', [120, ROOF + 1.8, -78], [121, ROOF + 1.4, -108], 'the whole roof garden, the helipad and the table beyond it'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [
      { prefab: 'camp-lantern-post', at: [113.5, -84.8], yaw: Math.PI / 2, scale: 1.6, lift: ROOF },
      { prefab: 'beige-garden-table', at: [121.5, -105.5], yaw: 0, scale: 1.6, lift: ROOF, solid: [0.6, 0.6, 0.6] },
      { prefab: 'beige-garden-chair', at: [121.5, -107.0], yaw: 0, scale: 1.5, lift: ROOF },
      { prefab: 'beige-garden-chair', at: [121.5, -104.0], yaw: Math.PI, scale: 1.5, lift: ROOF },
      { prefab: 'beige-garden-planter', at: [113.6, -108.6], yaw: 0, scale: 1.8, lift: ROOF },
      { prefab: 'beige-garden-planter', at: [127.2, -108.6], yaw: 0, scale: 1.8, lift: ROOF },
    ],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'patio-gate': ['m21-penthouse-viewing'],
};
