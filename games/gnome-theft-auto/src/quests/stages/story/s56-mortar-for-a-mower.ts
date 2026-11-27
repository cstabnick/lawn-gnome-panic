// Story row 56 (A Mortar for a Mower): the stages its scenes stand on. Nothing here builds set dressing in the world.
// - m56-radio-night: the map table at the Dust Flats overlook after dark, Pip at the dispatch radio (the intro's home end of the call).
// - m56-underspan-night: the Underspan under the Unfinished Span at night (E17: societies/config.ts UNDERSPAN; the welding bench at
//   (576, -10) is built by societies/underspan/build.ts). Hogweed's chalkboard call stands on the open ground south of the spool
//   table, the Dewdrop's run across the yard at z -30 behind him (the same run as row 10); the fitting is at the bench, Hogweed west
//   of it and the player east.
// - m56-dawn-strip: the overlook's strip at first light, the Crop Duster parked west of the camp with the sun behind the fort.
import { cam, car, mark, type Stage } from '../kit';

const QUEST = 'm56-mortar-for-a-mower';

export const STAGES: readonly Stage[] = [
  {
    id: 'm56-radio-night',
    name: 'Dust Flats overlook, the map table at night',
    region: 'dust-flats',
    center: [270.5, 41.5],
    radius: 8,
    facing: Math.PI / 2,
    time: 'night',
    built: 'existing',
    usedBy: [QUEST],
    look: 'The camp after dark: the map table lit by a lantern post, the heist board a pale rectangle with red string, the campfire a glow behind the hut and, far to the east, the lit walls of Fort Sandpit.',
    sounds: 'Crickets, a campfire ticking, a dispatch radio hissing and spitting a stranger\'s voice, Pip saying yes to it.',
    marks: [
      mark('pip', [272.2, 42.4], [266, 42.4], 'stand', 'at the end of the table with the dispatch radio to his ear, nodding at everything'),
      mark('player', [269.2, 44], [272.2, 42.4], 'stand', 'arms folded by the table, watching Pip nod at a box'),
    ],
    cameras: [
      cam('night-wide', [262.5, 1.9, 36.5], [272, 1.4, 42.4], 'from the north-west over the tent corner: the table, the lantern, Pip with the radio, the board pale beyond', 46),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm56-underspan-night',
    name: 'The Underspan at night, Hogweed at his workshop',
    region: 'dust-flats',
    center: [578, -16],
    radius: 12,
    facing: Math.PI,
    time: 'night',
    built: 'existing',
    usedBy: [QUEST],
    look: 'Scaffold towers and hammocks under the black underside of the Unfinished Span, a pedal generator ticking over, a welding bench with a mask on it throwing sparks, a lamp post on the dirt, Hogweed in his leather apron beside a chalkboard of ratios.',
    sounds: 'A pedal generator whirring, a welder crackling and stopping, a spanner on a plank, chalk squeaking, traffic thumping over the Skyway.',
    marks: [
      mark('hogweed', [581, -23.6], 0, 'stand', 'the call: facing the lens at his chalkboard, spanner in one hand and the slate in the other, Dewdrop run behind him'),
      mark('hogweed', [573.8, -9.8], [578.4, -9.8], 'work', 'the fitting: west of the welding bench, goggles down, a bolt in his teeth'),
      mark('player', [578.4, -9.8], [573.8, -9.8], 'stand', 'the fitting: east of the bench, holding what he is told to hold'),
    ],
    cameras: [
      cam('bench-wide', [566.5, 2.8, -1.5], [576, 1, -10], 'from the south-west and a little above: the bench, Hogweed, the player, the shed wall behind and the lit dark of the Underspan', 46),
      cam('bench-top', [577.8, 2.1, -8.0], [576, 1.1, -10], 'close and low across the bench top at the mortar tube and the parachute rig', 36),
      cam('yard-wide', [586, 2.2, -27], [578, 1.4, -17], 'from the shed side across the yard toward the lamp, the chalkboard and the Dewdrop lane', 44),
    ],
    walks: [],
    vehicles: [],
    paths: [
      { id: 'dewdrop-run', role: 'patrol', kind: 'bubble-mobile', offRoad: true, points: [[563, -30], [583, -30], [598, -30]], note: 'the Dewdrop crossing the yard, as in row 10 (z -30 is clear from wall to wall)' },
      { id: 'hat-watch-pass', role: 'patrol', kind: 'hoa-van', offRoad: true, points: [[628, 4], [596, 4], [560, 4]], note: 'a Hat Watch van crawling along the flat south of the Underspan' },
    ],
    set: [],
  },
  {
    id: 'm56-dawn-strip',
    name: 'Dust Flats overlook, the strip at first light',
    region: 'dust-flats',
    center: [248, 40],
    radius: 14,
    facing: Math.PI / 2,
    time: 'dawn',
    built: 'existing',
    usedBy: [QUEST],
    look: 'The open ground west of the camp at sunrise: the Crop Duster parked on the strip with its nose to the east, the low gold sun behind the fort walls, long shadows, Pip with a parachute pack in his arms.',
    sounds: 'Early wind, a hint of birdsong, a propeller ticking as it cools, canvas, Pip talking to a stencil.',
    marks: [
      mark('pip', [251.6, 39.4], [249.2, 41.8], 'stand', 'holding the packed parachute rig against his chest, reading the stencil'),
      mark('player', [249.2, 41.8], [251.6, 39.4], 'stand', 'back from the flight, hat dusty, arms folded'),
    ],
    cameras: [
      cam('dawn-wide', [262, 1.9, 46], [247, 1.6, 40.6], 'from the east of the camp over the crates: Pip and the player in the gold, the plane beyond them on the strip', 46),
    ],
    walks: [],
    vehicles: [
      car('m56-fitted-plane', 'parked', 'plane', [236, 38], Math.PI / 2, undefined, 'the Crop Duster with the door mortar bolted on and the rig stowed, nose to the east'),
    ],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> this row's quest ids (none: the row stands on its own stages). */
export const USES: Record<string, string[]> = {};
