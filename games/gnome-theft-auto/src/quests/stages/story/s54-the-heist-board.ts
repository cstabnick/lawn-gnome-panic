// Story row 54 (The Heist Board): the stages its scenes stand on.
// - m54-heist-board: the camp at the Dust Flats overlook, between the map table and the rail. Tansy's plan board stands east
//   of the hut (the intro and the outro; the board itself is a scene prop, the quest-line map that replaces it is the lead's).
//   The three photograph points of the quest stand just inside a W-beam rail along the rim of the rise (built here: the rail is
//   the only set of this stage), looking east over the highway to Fort Sandpit's north wall (x 340..408, z 34).
// - m54-wally-caravan: Wind-Sock Wally's caravan on the Desert Airfield apron (his home, L58), north of the parked planes
//   and clear of the runway. The caravan is built here (a solid set prop) so the pick-up point has something to point at.
import { cam, car, mark, type Stage } from '../kit';

const QUEST = 'm54-the-heist-board';

export const STAGES: readonly Stage[] = [
  {
    id: 'm54-heist-board',
    name: 'Dust Flats overlook, at the heist board',
    region: 'dust-flats',
    center: [272, 40],
    radius: 16,
    facing: Math.PI / 2,
    time: 'day',
    built: 'dressed',
    usedBy: [QUEST],
    look: 'The camp on the rise in a hard noon: a plank table with the Stopping Stone on it, a trestle board stuck with a map, red string and three photographs, and a steel guard rail along the rim with the highway below and Fort Sandpit glinting beyond.',
    sounds: 'Wind over the dust, a tin banner snapping, a tack tapped in with the heel of a wrench, Pip bouncing on a plank, a spyglass whistle from the ridge.',
    marks: [
      mark('tansy', [271.4, 36], [273.4, 36], 'stand', 'at the board with a tack between her teeth and a ball of red string, pinning the last line'),
      mark('pip', [268.4, 37.4], [271.4, 36], 'stand', 'two steps behind her, bouncing on his toes, about to say it'),
      mark('player', [267, 41.4], [271.4, 36], 'stand', 'by the map table with the Stopping Stone, arms folded, listening'),
      mark('tansy', [271.4, 34.9], [273.4, 36], 'stand', 'the outro: at the board, a tack in her hand, the last string still on the ball'),
      mark('pip', [269, 36.8], [271.4, 36], 'stand', 'the outro: bouncing at her elbow'),
      mark('player', [268.4, 39.4], [271.4, 36.4], 'stand', 'the outro: back from the airfield, hat dusty'),
      mark('wally', [279.4, 50.2], [273.4, 40], 'stand', 'the outro: comes up from the dust track on his old knees, clipboard under one arm'),
      mark('wally', [271.2, 37.9], [273.4, 36.4], 'stand', 'the outro: stops at the board and takes the whole plan in at once'),
    ],
    cameras: [
      cam('wide', [255.6, 1.9, 43.5], [273, 1.3, 36.5], 'low from the west of the camp over the tent corner: Tansy and Pip in the foreground, the board beyond, the fort glinting behind it', 48),
      cam('fort', [277, 1.9, 40.6], [374, 1.8, 35.5], 'long lens from the rail across the highway at the fort: the north wall, the gate, a banner on a pole', 30),
      cam('table', [268.2, 0.9, 42.6], [270, 0.8, 40], 'low across the plank table at the Stopping Stone holding a chart down', 36),
      cam('dusk-wide', [262, 2.6, 30], [272, 1.3, 37.5], 'from the north of the camp, over the tent roof onto the board and the group at its foot', 46),
      cam('board', [271.2, 1.5, 33], [273.4, 1.5, 36], 'close from the north-west corner onto the board: the map, the red string, the three photographs', 42),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [
      // The rail along the rim: three 4 m W-beam rails facing east (front +z turned to +x), the photograph points just inside it.
      // Set 3 m west of the highway's shoulder (the south rail stood on the carriageway); the three stay in line.
      { prefab: 'mountain-guard-rail', at: [279.5, 40.6], yaw: Math.PI / 2, solid: [2, 0.15, 0.8] },
      { prefab: 'mountain-guard-rail', at: [279.5, 36.6], yaw: Math.PI / 2, solid: [2, 0.15, 0.8] },
      { prefab: 'mountain-guard-rail', at: [279.5, 32.6], yaw: Math.PI / 2, solid: [2, 0.15, 0.8] },
    ],
  },
  {
    id: 'm54-wally-caravan',
    name: "Wind-Sock Wally's caravan, Desert Airfield apron",
    region: 'dust-flats',
    center: [466, -82],
    radius: 14,
    facing: 0,
    time: 'day',
    built: 'dressed',
    usedBy: [QUEST],
    look: 'A round-ended caravan on four blocks at the north edge of the apron, its door open and a brass key hanging in the lock, a windsock on a pole beyond it, the parked Crop Dusters on the apron and the runway shimmering in the heat.',
    sounds: 'A windsock snapping, a clipboard clapped shut, keys jingled and dropped, a stall speed muttered as comfort, the runway ticking in the sun.',
    marks: [
      mark('wally', [466.9, -79.4], [466, -86], 'stand', 'on the step by his open door, patting every pocket in turn'),
      mark('player', [466, -87], [466.9, -79.4], 'stand', 'pulled up on the apron below the step, engine ticking'),
    ],
    cameras: [
      cam('door', [460.6, 1.5, -89.6], [466.9, 1.3, -79.4], 'from the apron, level, onto Wally on his step and the open door behind him', 40),
      cam('wide', [446, 3.4, -87.4], [466, 1.2, -80.4], 'the caravan, the parked Crop Duster, the apron and the runway from the west', 50),
      cam('lock', [468.6, 1.5, -80.8], [466.9, 1.3, -78], 'close and low onto the door lock and a brass key hanging in it', 34),
    ],
    walks: [],
    vehicles: [
      car('m54-wally-ride', 'pull-up', 'lowrider', [462, -88], 0, undefined, 'the ride the crew leaves for Wally, nose to the caravan'),
    ],
    paths: [],
    set: [
      // Moved 1.4 m north, off the airfield spur's carriageway (z -75 to -65); the marks and cameras moved with it.
      { prefab: 'caravan', at: [466, -77], yaw: Math.PI, solid: [2.3, 1.05, 2.4], always: true },
    ],
  },
];

/** Existing stage id -> this row's quest ids (none: the row stands on its own stages). */
export const USES: Record<string, string[]> = {};
