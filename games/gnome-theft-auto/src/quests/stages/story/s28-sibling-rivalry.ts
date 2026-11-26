// Story row 28 (Sibling Rivalry): the stages its scenes play on (new ones), and extra quest ids for existing stages' usedBy.
// - thorne-tower-pickup: the strip at the foot of Thorne Tower, between the topiary line and the counter, where Reginald
//   waits to be fetched (the passenger pick-up is workOf('reginald'): the Glaze & Tax Office centre, (28, -48)).
// - tattler-front: the Tattler's street desk at the north gate of Founders' Green. The Tattler Building's own block became
//   Founders' Green (L92, so no tower is built there); Hedda works her desk on the pavement outside the gate, the same way
//   she runs the parade desk in row 15. The intro stands on the existing city-hall-steps stage.
import { cam, car, mark, type Stage } from '../kit';

const ROW = ['m28-sibling-rivalry'];

export const STAGES: readonly Stage[] = [
  {
    id: 'thorne-tower-pickup',
    name: 'The foot of Thorne Tower, the audit office kerb',
    region: 'turfton',
    center: [27, -48],
    radius: 9,
    facing: Math.PI,
    time: 'day',
    built: 'dressed',
    usedBy: ROW,
    look: 'The glossy strip under the north face of Thorne Tower: a brass counter, a row of clipped topiary, and one municipal Ride-On parked at the kerb with its seat being measured.',
    sounds: 'Calipers clicking, a clerk humming, traffic on the road behind the hedges, a quarter-inch being argued.',
    marks: [
      mark('reginald', [31.4, -47.2], [33.4, -48.6], 'work', 'crouched at the Ride-On seat with the brass calipers open, not looking up'),
      mark('player', [20.5, -48.5], [31.4, -47.2], 'stand', 'walks in from the strip, off the road'),
      mark('reginald', [28, -48], [33.4, -48.6], 'stand', 'waiting at the kerb: calipers shut, hat level'),
    ],
    cameras: [
      cam('strip-wide', [12, 3.4, -52.5], [30, 1.0, -48.2], 'establishing: the strip, the topiary line and the counter, Reginald small at the Ride-On'),
      cam('seat-insert', [32.0, 0.95, -45.6], [33.4, 0.55, -48.1], 'insert: the calipers across the Ride-On seat'),
    ],
    walks: [],
    vehicles: [
      car('measured-ride', 'parked', 'ride-on', [33.4, -48.6], Math.PI, undefined, 'the Ride-On whose seat Reginald is measuring against code (the scene keeps it for the ride)'),
    ],
    paths: [],
    set: [],
  },
  {
    id: 'tattler-front',
    name: "The Tattler's street desk, Founders' Green north gate",
    region: 'turfton',
    center: [-90, 6.2],
    radius: 11,
    facing: Math.PI,
    time: 'dusk',
    built: 'dressed',
    usedBy: ROW,
    look: "A pavement desk with a printer on it in front of the open north gate of Founders' Green, a news kiosk and a red newspaper box beside it, a street lamp coming on; the Tattler Building's block is a park now and the paper still works from its door.",
    sounds: 'A printer clearing its throat, traffic on the z = 0 road, a pencil on paper, a dusk wind in the planes, the Tattler not printing a correction.',
    marks: [
      mark('hedda', [-90, 9.6], Math.PI, 'stand', 'behind the desk in the park gate, pencil behind one ear, never quite still'),
      mark('juniper', [-94.4, 6.4], [-90, 8], 'stand', 'at the left end of the desk, facing the street, her cold Acorn-Cola in one hand'),
      mark('reginald', [-85.6, 6.4], [-90, 8], 'stand', 'at the right end of the desk, calipers shut, staring at the lamp'),
      mark('player', [-90, 5.6], [-90, 8], 'stand', 'at the front of the desk, between them, off the road'),
    ],
    cameras: [
      cam('front-wide', [-90, 3.0, -9], [-90, 1.2, 8], 'establishing: from the road, the desk, the gate and the lamp, long dusk shadows'),
      cam('desk-low', [-95.5, 0.9, 13.5], [-90, 1.0, 8], 'low through the gate onto the desk and the printer'),
    ],
    walks: [],
    vehicles: [
      car('juniper-tattler-ride', 'parked', 'ride-on', [-104.5, 6.4], 0, undefined, 'her navy Ride-On with the little flag, left at the kerb a minute before them'),
    ],
    paths: [],
    set: [
      { prefab: 'office-desk', at: [-90, 8], yaw: Math.PI, scale: 0.7, solid: [0.56, 0.28, 0.56] },
      { prefab: 'printer', at: [-88.9, 8], yaw: Math.PI, scale: 0.7 },
      { prefab: 'news-kiosk', at: [-98.5, 7.6], yaw: Math.PI, solid: [1, 1, 2.4] },
      { prefab: 'newspaper-box', at: [-82.5, 6.8], yaw: Math.PI, solid: [0.35, 0.3, 1] },
      { prefab: 'street-lamp', at: [-102, 6.4], yaw: 0 },
    ],
  },
];

/** Existing stage id -> this row's quest id: the intro plays at City Hall steps, where Juniper gives the errand. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'city-hall-steps': ROW,
};
