// Story row 39 (m39-couch-surfing): the stages its scenes play on. Four places: the porch of the Woolly Sock Lodge (the giver
// `pip-call-lodge`: Pip's call comes in on the porch phone), the Central Bus Stop with a dumpster Pip hides behind (intro), the
// landing in front of the stairwell door of flats 3A and 3B at Saucer Court (mid; Hyssop's door at z 79.9, the courtyard south of
// it), and the Under-Deck storm drain where Tansy surfaces (outro; the portal under the kerb west of the x = 0 road).
import { cam, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'lodge-porch-call',
    name: "The Woolly Sock Lodge porch, Pip's call",
    region: 'north-highlands',
    center: [-434, -1016],
    radius: 6,
    facing: Math.PI / 2,
    time: 'dusk',
    built: 'existing',
    givers: ['pip-call-lodge'],
    usedBy: ['m39-couch-surfing'],
    look: 'The lodge porch in blue dusk, a woolly sock on every peg of the rack, cocoa steaming at the hatch and the party-line phone on its hook by the door.',
    sounds: 'Snow settling, a kettle, a cotton-reel tow clacking far up the slope, the phone ringing twice.',
    marks: [
      mark('player', [-431.5, -1016.5], [-437, -1016.5], 'stand', 'on the porch by the party-line phone, holding the receiver'),
    ],
    cameras: [
      cam('porch', [-426, 1.7, -1012], [-436, 1.4, -1017], 'from the slope side onto the porch and its pegs of socks'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'bus-stop-bin',
    name: 'The Central Bus Stop, behind the dumpster',
    region: 'turfton',
    center: [-9, 19],
    radius: 10,
    facing: Math.PI / 2,
    time: 'night',
    built: 'dressed',
    usedBy: ['m39-couch-surfing'],
    look: 'The kerbside stop on the west pavement of the x = 0 road at night: the shelter lit, the bench, a plain green dumpster beside it with a very small boot at its foot, and beige HOA watchers strolling past with a clipboard each.',
    sounds: 'A far snail-coach, a streetlamp buzzing, beige shoes on the pavement in step, a clipboard clicking.',
    marks: [
      mark('pip', [-12, 21.8], [-7.5, 21], 'kneel', 'crouched behind the dumpster with a tin-can phone to his ear, the red hat just above the lid'),
      mark('watcher', [-7.5, 11], [-7.5, 20], 'stand', 'an HOA watcher at the top of the stop with a clipboard, reading the timetable'),
      mark('watcher', [-7.5, 8], [-7.5, 20], 'stand', 'his partner, a pace behind, nodding to the beat of nothing'),
    ],
    cameras: [
      cam('wide', [-1.5, 3.2, 31], [-9.5, 1.0, 19.5], 'establishing from across the road: the stop, the lit shelter, the dumpster and the watchers in step'),
      cam('bin-low', [-6.2, 0.55, 21], [-11.2, 0.75, 21.6], 'ground level on the dumpster and a very small boot beside it'),
      cam('sticker', [-7.4, 1.5, 22.6], [-10.9, 1.25, 21.6], 'insert: the dumpster flank, where the beige sticker lands'),
    ],
    walks: [
      { who: 'watcher', points: [[-7.5, 6], [-7.5, 30]], loop: false, speed: 1.0, pauseS: 2, activity: 'strolls the pavement and checks the timetable' },
    ],
    vehicles: [],
    paths: [],
    set: [
      { prefab: 'dumpster', at: [-10.7, 21.7], yaw: Math.PI / 2 },
    ],
  },
  {
    id: 'saucer-court-landing',
    name: 'Saucer Court, the stairwell landing at night',
    region: 'turfton',
    center: [30, 84],
    radius: 8,
    facing: Math.PI,
    time: 'night',
    built: 'existing',
    usedBy: ['m39-couch-surfing'],
    look: 'The north wing of the courtyard by night: the stairwell door ajar on its chain, a strip of lamp-yellow, a leaning stop sign, and the dry saucer pale behind.',
    sounds: 'A washing line creaking, a door chain, a kettle behind the door, a very watchful silence.',
    marks: [
      mark('hyssop', [30, 79.9], 0, 'stand', 'in the stairwell doorway in her dressing gown, the stop paddle in one hand and the chain on'),
      mark('pip', [28.8, 84.2], [30, 79.9], 'stand', 'at the foot of the step with the red toolbox, a plain cap squashed over his hat'),
      mark('player', [31.2, 84.0], [30, 79.9], 'stand', 'at his shoulder in a plain cap of their own'),
    ],
    cameras: [
      cam('door', [33, 1.5, 89], [30, 1.4, 80.2], 'from the courtyard onto the stairwell door and the three at its foot'),
      cam('paddle', [27.4, 0.8, 83.4], [30, 1.15, 80], 'low from the left onto the paddle and the foot of the door'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'culvert-reunion',
    name: 'The Under-Deck storm drain, the reunion',
    region: 'turfton',
    center: [-8, -8],
    radius: 9,
    facing: 0.6,
    time: 'night',
    built: 'dressed',
    usedBy: ['m39-couch-surfing'],
    look: 'The storm-drain portal under the kerb in torchlight: the grate lifted, a crate set before it for a table, a lamp, a scatter of acorns and magazines, and the dark of the drain behind.',
    sounds: 'Dripping water, a torch hissing, a rubber boot on wet concrete, the hush of a gnome deciding not to cry.',
    marks: [
      mark('tansy', [-10, -10.4], [-6.6, -7.4], 'stand', 'stands at the mouth of the drain, pigtails wet, the wrench for once hanging at her side'),
      mark('sal', [-11.8, -8.6], [-9.2, -7.0], 'lean', 'behind her and to the left, the colander helmet lamp-lit, a magnet on a string'),
      mark('player', [-6.6, -7.4], [-10, -10.4], 'stand', 'steps up to the crate from the road side'),
      mark('pip', [-5.2, -8.8], [-10, -10.4], 'stand', 'at the player\'s shoulder, arm flexing in its resin, not saying anything for once'),
    ],
    cameras: [
      cam('wide', [-1, 3.4, -1.5], [-9, 1.0, -9.5], 'establishing from the road side: the portal, the lamp on the crate, the four of them small in the torchlight'),
      cam('portal-low', [-14, 1.4, -14], [-10, 1.1, -10.4], 'ground level on the drain mouth and the first sight of a hand on its rim'),
      cam('crate', [-8.0, 2.2, -5.0], [-9.2, 0.6, -7.0], 'down on the crate where the two maps will lie side by side'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [
      { prefab: 'crate', at: [-9.2, -7.0], yaw: 0.3 },
    ],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'culvert-under-deck': ['m39-couch-surfing'],
  'saucer-court-stairs': ['m39-couch-surfing'],
  'bus-stop': ['m39-couch-surfing'],
};
