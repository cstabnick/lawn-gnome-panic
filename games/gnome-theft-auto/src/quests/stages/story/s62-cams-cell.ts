// Story row 62 stages: Cam's Cell. One place: the HOA lockup in the Double Pot Tunnel (the tunnel runs x 111..129, z -111..-69,
// 8 m clear under the roof slab; row 21's stage `double-pot-tunnel` is the same passage: its stairwell lantern and its table
// stand on the east side and the north half, so the lockup takes the west wall south of the stairwell, clear of row 21's marks).
// E05 has no lockup interior, so the lockup is the outline's fallback: a short row of tin lock-up units on the tunnel's west wall
// (set dressing, kept after the quest: lore says the Double Pot is "later, the HOA lockup") with a fenced yard in front of the
// middle unit. The yard is the cell: a chain-link pen with a gate gap on the road side, a bunk, a lantern at each outer corner,
// a broom leant on the tin. The player goes in through the gap (the interior-visit fallback: a visit to the yard door, and a
// scene that stays out of an interior). The units are 0.6 of the prefab (7.2 m long, 1.8 m tall: gnome-sized doors).
import { cam, car, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'cams-lockup',
    name: 'The HOA lockup, Double Pot Tunnel',
    region: 'turfton',
    center: [119, -90],
    radius: 20,
    facing: Math.PI / 2,
    time: 'night',
    built: 'dressed',
    usedBy: ['m62-cams-cell'],
    look: 'A long beige tunnel at night under a roof slab, a short row of tin lock-up units along the west wall, a chain-link pen in front of the middle one with a bunk and a lantern at each outer corner, a stairwell lantern further up the wall, a broom leant against the tin.',
    sounds: 'A lift tone and nothing else: no birds, no wind, no traffic; footsteps in even steps, a tin wall ticking, a speaker that clears its throat.',
    marks: [
      mark('turncoat-cam', [116.2, -99.6], [118.5, -97.6], 'sit', 'on the edge of the bunk, hands between his knees, the broom against the tin behind him', 0.55),
      mark('turncoat-cam', [116.5, -97.8], [118.9, -97.6], 'stand', 'on his feet at the sound of the gate, talking before the player is through it'),
      mark('player', [118.9, -97.6], [116.4, -97.8], 'stand', 'in the gap in the chain-link, the wire at his shoulders'),
      mark('player', [120.5, -97.2], [116.4, -97.8], 'stand', 'outside the gap on the road side, the chain-link between him and the cell'),
      mark('juniper', [112.9, -73.2], [116, -98], 'stand', 'in the shadow of the west wall at the mouth, phone to her ear, briefcase at her feet, watching the lockup'),
      mark('hoa-watch', [120.4, -94.6], [118.5, -97.6], 'stand', 'steps up to the gap with a clipboard, boots even'),
      mark('hoa-watch', [120.4, -100.4], [118.5, -97.6], 'stand', 'a pace behind the first, hands behind his back'),
    ],
    cameras: [
      cam('pen-wide', [123.4, 1.9, -96.4], [116.3, 1.0, -98.2], 'from the east side of the tunnel across the road and through the gate gap onto the pen, the bunk and the lockup units behind it', 46),
      cam('pen-high', [123.2, 3.4, -103.2], [116.3, 0.7, -98.2], 'a high three-quarter from the south-east over the pen, the swept floor in view', 46),
      cam('juniper-mouth', [116.8, 1.5, -70.2], [112.9, 1.3, -73.2], 'from the road at the mouth onto Juniper in the shadow of the wall', 38),
      cam('gap-low', [121.8, 0.8, -94.6], [117.6, 0.9, -98.0], 'low on the gap in the chain-link, the bunk and a lantern beyond', 40),
    ],
    walks: [],
    vehicles: [
      car('cam-ride', 'parked', 'ride-on', [121.8, -91.8], Math.PI, undefined, "the player's ride waiting on the tunnel road, engine ticking, a passenger seat empty"),
    ],
    paths: [
      { id: 'lockup-approach', role: 'approach', kind: 'ride-on', points: [[117.5, -66], [117.5, -80], [119.5, -92], [120.6, -97.6]], note: 'in from the mouth and down the tunnel road to the gap' },
      { id: 'lockup-getaway', role: 'getaway', kind: 'ride-on', points: [[120.6, -97.6], [119.5, -92], [117.5, -80], [117.5, -66]], note: 'back up the tunnel and out of the mouth' },
    ],
    set: [
      // The lock-up row along the west wall: four roller doors facing east onto the road (x 111..114.6, z -101.6..-94.4).
      { prefab: 'lockup-row', at: [112.8, -98], yaw: Math.PI / 2, scale: 0.6, solid: [3.6, 1.8, 1.8] },
      // The cell: a chain-link pen against the middle unit (x 114.6..118.5, z -100.6..-95.4), a gate gap on the road side.
      { prefab: 'chain-link-fence', at: [116.55, -95.4], yaw: 0, scale: 1, solid: [2, 0.08, 1.7] },
      { prefab: 'chain-link-fence', at: [116.55, -100.6], yaw: 0, scale: 1, solid: [2, 0.08, 1.7] },
      { prefab: 'chain-link-fence', at: [118.5, -99.4], yaw: Math.PI / 2, scale: 0.6, solid: [1.2, 0.08, 1.7] },
      { prefab: 'chain-link-fence', at: [118.5, -96.2], yaw: Math.PI / 2, scale: 0.4, solid: [0.8, 0.08, 1.7] },
      { prefab: 'cell-bunk', at: [115.75, -99.7], yaw: Math.PI / 2, scale: 1.3, solid: [0.4, 0.85, 0.55] },
      { prefab: 'camp-lantern-post', at: [119.4, -101.4], yaw: 0, scale: 1.4 },
      { prefab: 'camp-lantern-post', at: [119.4, -94.6], yaw: 0, scale: 1.4 },
    ],
  },
];

/** Existing stage id -> this row's quest ids (the Double Pot Tunnel is where row 21's tour went). */
export const USES: Record<string, string[]> = {
  'double-pot-tunnel': ['m62-cams-cell'],
};
