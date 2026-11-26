// Story row 21: the stages its scenes play on (new ones), and extra quest ids for existing stages' usedBy.
// New: the door of flat 3B (the giver: the beige card on the mat) and the Double Pot Tunnel (the tour and the key on the
// table). The Patio Gate is the existing `patio-gate` stage (turftonB.ts), listed in USES.
import { cam, mark, type Stage } from '../kit';

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
    name: 'The Double Pot Tunnel, the viewing',
    region: 'turfton',
    center: [120, -90],
    radius: 22,
    facing: 0,
    time: 'day',
    built: 'dressed',
    usedBy: ['m21-penthouse-viewing'],
    look: 'The Double Pot Tunnel, a long even passage under the roof slab, beige to the vanishing point, a stairwell door in the west wall with one lantern hung beside it, and a plain table at the far end with a beige key on it.',
    sounds: 'A lift tone and nothing else: no birds, no wind, no traffic, footsteps that echo in even steps.',
    marks: [
      mark('vesper', [120, -76], [120, -70.5], 'stand', 'already standing at the tunnel mouth, hands folded, a long beige shadow behind him'),
      mark('player', [120, -70.5], [120, -76], 'stand', 'arrives at the north mouth of the tunnel from the lobby of Thorne Tower'),
      mark('player', [121.4, -92], [125.4, -99], 'stand', 'stands in front of the table with the key on it'),
    ],
    cameras: [
      cam('mouth', [120, 3, -66], [120, 1.4, -80], 'from outside the north mouth, down the tunnel to Vesper standing in it'),
      cam('lantern', [117.2, 1.5, -82.4], [113.4, 2.0, -84.6], 'an insert on the lantern hung beside the stairwell door'),
      cam('table', [119.2, 1.5, -93.2], [125.4, 0.9, -99], 'the table with the key on it, the tunnel running on behind'),
      cam('long', [120, 2.2, -72], [120, 1.6, -107], 'the whole tunnel, beige to the vanishing point'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [
      { prefab: 'camp-lantern-post', at: [113.5, -84.8], yaw: Math.PI / 2, scale: 1.6 },
      { prefab: 'table', at: [125.4, -99], yaw: 0, scale: 1.4, solid: [0.85, 0.55, 0.55] },
      { prefab: 'chair', at: [125.4, -97.6], yaw: Math.PI, scale: 1.4 },
      { prefab: 'chair', at: [123.8, -99], yaw: -Math.PI / 2, scale: 1.4 },
    ],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'patio-gate': ['m21-penthouse-viewing'],
};
