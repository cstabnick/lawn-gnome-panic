// Story row 67 stages: Emergency Assessment. Two places. The Tattler's street desk at the north gate of Founders' Green (R-229:
// the Tattler works from a pavement desk; row 28 dressed it as `tattler-front`, this stage is the same spot with the giver
// `tattler-desk` on it, so nothing is dressed twice), and the side-door yard of City Hall: the 20 m lane between the Hall's
// west wall and its neighbour, where the Hall has a plain service door on the wall at x = 10. There is no walk-in City Hall
// interior, so the outline's fallback is used: the yard door, a scene, and a short crack in the yard. The door itself is only
// in the scenes (a closed leaf, then an open one).
import { cam, mark, type Stage } from '../kit';

const ROW = ['m67-emergency-assessment'];

export const STAGES: readonly Stage[] = [
  {
    id: 'm67-tattler-desk',
    name: "The Tattler's desk, Founders' Green north gate (the emergency)",
    region: 'turfton',
    center: [-90, 6.2],
    radius: 9,
    facing: Math.PI,
    time: 'day',
    built: 'existing',
    givers: ['tattler-desk'],
    usedBy: ROW,
    look: "The pavement desk in the park gate with the printer chattering, Hedda behind it with a pencil behind her ear, the kiosk and the red newspaper box beside it, and up the street an HOA van going by very slowly with a loudspeaker on its roof.",
    sounds: 'A printer clearing its throat, keys, a municipal loudspeaker on the z = 0 road, a pencil, the Tattler not printing a correction.',
    marks: [
      mark('hedda', [-90, 9.6], Math.PI, 'stand', 'behind the desk, typing and speaking at the same time, never quite still'),
      mark('player', [-90, 5.6], [-90, 8], 'stand', 'at the front of the desk, off the road'),
    ],
    cameras: [
      cam('road', [-72, 1.6, 1.0], [-90, 1.3, 8.5], 'from the kerb across the z = 0 road onto the desk and the gate'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm67-side-door-yard',
    name: 'City Hall side-door yard',
    region: 'turfton',
    center: [3, -88],
    radius: 9,
    facing: -Math.PI / 2,
    time: 'day',
    built: 'dressed',
    usedBy: ROW,
    look: "A swept service lane of grey paving between City Hall's plain west wall and its neighbour, a steel service door in the wall, two HOA barricades at the mouth of the lane and a chalked notice that the building is under assessment.",
    sounds: 'A far siren, a door bolt, boots on paving, a caliper clicking open and shut, the HOA emergency horn two streets over.',
    marks: [
      mark('player', [-1, -88], [8.8, -88], 'stand', 'steps into the side-door yard from the lane'),
      mark('reginald', [7.8, -88.6], [-1, -88], 'stand', 'at the open service door, caliper in one hand, not quite in the yard'),
      mark('juniper', [7.4, -89.4], [-1, -88], 'stand', 'steps out of the service door into the yard, a folded counter-order under one arm'),
      mark('reginald', [8.9, -87.0], [7.4, -89.4], 'stand', 'stays in the doorway, behind the open door leaf, caliper shut'),
    ],
    cameras: [
      cam('yard-wide', [-8, 3.6, -80], [6, 1.2, -88], 'establishing: the yard, the service door in the Hall wall and the barricades'),
      cam('door-low', [-0.5, 0.8, -90.8], [8.4, 1.2, -88], 'low along the paving onto the service door'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [
      { prefab: 'barricade', at: [-3.5, -79], yaw: 0, scale: 1.2 },
      { prefab: 'barricade', at: [1.5, -79], yaw: 0, scale: 1.2 },
      { prefab: 'site-cone', at: [6.5, -80], yaw: 0 },
    ],
  },
];

/** Existing stage id -> this row's quest id: the desk's marks are shared with row 28's `tattler-front`. */
export const USES: Record<string, string[]> = { 'tattler-front': ROW };
