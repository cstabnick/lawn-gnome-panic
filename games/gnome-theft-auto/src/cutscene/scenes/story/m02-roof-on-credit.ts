// Story row 2: A Roof on Credit. Three scenes: the bench that is full (intro, Side-Valve, Mabel will not carry mower-mud),
// the loan counter (mid, the First Kiln Bank), and the stairwell (outro, Saucer Court at dusk, Hyssop's door).
// Notes: docs/design/gnome-theft-auto/direction/scenes/roof-on-credit-{intro,mid,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, insert, reaction, shot } from '../../direct';
import { carMark, markOf, up } from './kit';

const SV = 'side-valve-bay';
const BANK = 'first-kiln-bank-front';
const SAUCER = 'saucer-court-stairs';
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

const MABEL_LOOK = { hat: 0xf2c200, shirt: 0x222222, glasses: true };

// ---- Intro: the bench is full ------------------------------------------------------------------------------------------

const I_PIP: Vec2 = [-154.6, 73.2];
const I_PLAYER: Vec2 = [-151.8, 71.2];
const I_CAM_A: Vec2 = [-146, 72.6];

/** Where Mabel's cab stops on the z = 60 road, eastbound lane, opposite the bay's apron: her window faces the apron. */
const I_STOP: Vec2 = [-150.5, 62.5];
/** Pip and the player: one side of the line for the whole exchange. */
const PP = coverage('pip', 'player', 1);

export const ROOF_ON_CREDIT_INTRO: SceneScript = {
  id: 'roof-on-credit-intro',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'street',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/roof-on-credit-intro.md', kind: 'intro' },
  title: 'A Roof on Credit',
  actors: [
    { id: 'player', player: true, at: I_PLAYER, yaw: towards(I_PLAYER, I_PIP) },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: I_PIP, yaw: towards(I_PIP, I_PLAYER) },
    { id: 'turncoat', name: 'Turncoat Cam', look: { hat: 0xf4f4f8, shirt: 0xc9b99b }, held: 'broom', at: I_CAM_A, yaw: Math.PI / 2 },
    { id: 'mabel', preset: 'mabel', name: 'Mabel Kerbstone', hidden: true, seatedIn: 'taxi', at: [0, 0] },
  ],
  vehicles: [
    { id: 'taxi', kind: 'taxi', at: [-190, 62.5], yaw: Math.PI / 2, hidden: true },
  ],
  props: [
    // L95: the bench is full. Pip's bed is a stack of crates on a bedroll, a lamp wedged on top.
    { id: 'bed-roll', prefab: 'bedroll', at: [-158.4, 74.2], yaw: 0.3, size: 1.5 },
    { id: 'bed-crate-a', prefab: 'crate', at: up(-158.4, 74.2, 0.18), yaw: 0.2 },
    { id: 'bed-crate-b', prefab: 'crate', at: up(-158.1, 74.5, 0.7), yaw: -0.3 },
    { id: 'bed-lamp', prefab: 'lamp', at: up(-158.3, 74.4, 1.25), yaw: 0 },
  ],
  steps: [
    // 1. Hook: Pip sweeps the bench clear with one arm and is still not done. The line is the joke.
    cut(PP.single('pip', 'mcu')),
    { do: 'sfx', id: 'clatter', at: 'pip', gain: 0.5, async: true },
    { do: 'gesture', who: 'pip', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: "That bench is my bed, my desk and my alibi. It's full." },
    // 2. The player's one dry question, then Pip answers a different one.
    cut(PP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'So where do I sleep?' },
    cut(PP.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'A flat! Saucer Court, lovely. Mabel is outside. The fare is on the bank.' },
    cut(PP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Who pays?' },
    cut(PP.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'shrug', s: 1.0, async: true },
    { do: 'say', who: 'pip', text: 'The bank! Anyway, nice weather!' },
    // 3. The turn: Mabel's cab rolls up on the road and she looks at the player's boots.
    { do: 'spawn', id: 'taxi' },
    { do: 'spawn', id: 'mabel' },
    { do: 'cam', shot: { kind: 'track', pos: up(-168, 66.4, 1.8), who: 'taxi', fov: 50 } },
    { do: 'sfx', id: 'bell', at: 'taxi', gain: 0.5, async: true },
    { do: 'drive', vehicle: 'taxi', path: [[-190, 62.5], [-170, 62.5], I_STOP], speed: 9 },
    { do: 'horn', vehicle: 'taxi' },
    // The still is on the apron side of the kerb, so the camera sees her through the driver's window.
    cut({ kind: 'cut', pos: up(-150.8, 67, 1.15), look: 'mabel', fov: 38 }),
    { do: 'say', who: 'mabel', text: 'Not with that mud on my seats, dear.' },
    { do: 'intro', who: 'mabel' },
    cut(PP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "I'll ride behind." },
    cut({ kind: 'cut', pos: up(-150.8, 67, 1.15), look: 'mabel', fov: 38 }),
    { do: 'say', who: 'mabel', text: "Walking pace, dear. The meter's running anyway." },
    // 4. The button: the cab creeps away at a walking pace and Pip walks alongside, proud of it. Cam keeps sweeping.
    { do: 'drive', vehicle: 'taxi', path: [I_STOP, [-142, 62.5]], speed: 1.8, depart: false, arrive: false, async: true },
    { do: 'walk', who: 'pip', path: [[-151.5, 66.6], [-144, 66.4]], speed: 1.8, async: true },
    { do: 'walk', who: 'turncoat', path: [[-143, 73.2]], speed: 0.8, async: true },
    cut(shot('pip', 'ms', { toward: 'mabel', side: 50 })),
    { do: 'say', who: 'pip', text: 'She said walking pace! I am walking!' },
    { do: 'cam', shot: { kind: 'track', pos: up(-146, 69.5, 1.6), who: 'taxi', fov: 50 } },
    { do: 'wait', s: 1.6 },
  ],
};

// ---- Mid: the loan counter ---------------------------------------------------------------------------------------------

const B_PARSLEY = markOf(BANK, 'parsley');
const B_PLAYER = markOf(BANK, 'player');
const BANK_TAXI = carMark(BANK, 'bank-kerb-taxi');
/** Parsley and the player over the counter: one side of the line all scene. */
const LOAN = coverage('parsley', 'player', 1);

export const ROOF_ON_CREDIT_MID: SceneScript = {
  id: 'roof-on-credit-mid',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'street',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/roof-on-credit-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: B_PLAYER.at, yaw: B_PLAYER.yaw },
    { id: 'parsley', preset: 'parsley', name: 'Parsley Inkpot', at: B_PARSLEY.at, yaw: B_PARSLEY.yaw },
  ],
  vehicles: [
    { id: 'taxi', kind: 'taxi', at: BANK_TAXI.at, yaw: BANK_TAXI.yaw },
  ],
  props: [
    // L95: the loan counter is wheeled out onto the pavement, with its queue sign and a lamp for the small print.
    { id: 'counter', prefab: 'counter', at: [101, 110.8], yaw: 0, size: 2.6 },
    { id: 'queue-sign', prefab: 'sandwich-board', at: [97.6, 111.6], yaw: 0.4 },
    { id: 'desk-lamp', prefab: 'lamp', at: up(100.2, 110.8, 0.95), yaw: 0 },
  ],
  steps: [
    // 1. Hook: the stamp lands before he speaks.
    cut(LOAN.single('parsley', 'ms')),
    { do: 'sfx', id: 'thud', at: 'parsley', gain: 0.4, async: true },
    { do: 'gesture', who: 'parsley', name: 'nod', s: 0.9, async: true },
    { do: 'say', who: 'parsley', text: 'Sign here, and here. Initial where the pen has bled, as it were.' },
    { do: 'intro', who: 'parsley' },
    // 2. The question, the sum, the objection.
    cut(LOAN.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'What am I signing?' },
    cut(LOAN.single('parsley', 'mcu')),
    { do: 'say', who: 'parsley', text: 'A flat. Fifteen hundred Acorns, added to your Kiln-Debt.' },
    cut(LOAN.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "I haven't got fifteen hundred." },
    cut(LOAN.single('parsley', 'mcu', { height: 'low' })),
    { do: 'say', who: 'parsley', text: 'Nobody has, as it were. That is what the form is for.' },
    // 3. The turn: the ledger gains a line, and the keys change hands.
    cut(insert('parsley', { toward: 'player' })),
    { do: 'sfx', id: 'paper', at: 'parsley', gain: 0.5, async: true },
    { do: 'sfx', id: 'tap', at: 'parsley', gain: 0.5, async: true },
    { do: 'wait', s: 1.5 },
    { do: 'sfx', id: 'keys', at: 'parsley', gain: 0.5, async: true },
    { do: 'give', from: 'parsley', to: 'player', prop: 'brass-key', s: 1.0 },
    ...reaction('player', { toward: 'parsley', size: 'mcu', hold: 'pause' }),
    // 4. The button: his one fear, said kindly, and the cab's horn answering from the kerb.
    cut(LOAN.single('parsley', 'mcu')),
    { do: 'say', who: 'parsley', text: 'Welcome home. Please do not read the small print aloud.' },
    cut(LOAN.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'How small?' },
    cut(shot('parsley', 'cu', { toward: 'player', side: 25 })),
    beat('beat'),
    { do: 'say', who: 'parsley', text: 'Quite.' },
    { do: 'horn', vehicle: 'taxi' },
    { do: 'wait', s: 1.2 },
  ],
};

// ---- Outro: the stairwell ------------------------------------------------------------------------------------------------

const S_HYSSOP = markOf(SAUCER, 'hyssop');
const S_PLAYER = markOf(SAUCER, 'player');
/** Where the player stops at the door, and ends the scene (the flat objective starts here). */
const S_DOOR: Vec2 = [30.4, 82.6];
/** The player and Hyssop at the door: one side of the line. */
const DOOR = coverage('hyssop', 'player', 1);

export const ROOF_ON_CREDIT_OUTRO: SceneScript = {
  id: 'roof-on-credit-outro',
  stage: { kind: 'world' },
  music: 'turfton-dusk',
  ambience: 'street',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/roof-on-credit-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: S_PLAYER.at, yaw: S_PLAYER.yaw, held: 'bedroll' },
    { id: 'hyssop', preset: 'hyssop', name: 'Hyssop Doormat', hidden: true, at: S_HYSSOP.at, yaw: S_HYSSOP.yaw },
  ],
  steps: [
    // 1. Hook: the signature shot, straight down on the dry saucer at dusk, the player a speck crossing it.
    { do: 'cam', shot: { kind: 'dolly', from: up(30, 26, 101), to: up(30, 7, 92), look: up(30, 0, 97), lookTo: up(30, 1.2, 82), s: 4.2, fov: 54 } },
    { do: 'walk', who: 'player', path: [S_DOOR], speed: 1.6, async: true },
    { do: 'wait', s: 4.2 },
    // 2. The door opens a crack: a face at the chain, and the stairwell rules begin with a question.
    { do: 'sfx', id: 'latch', at: up(30, 79.6, 1.2), gain: 0.5, async: true },
    { do: 'spawn', id: 'hyssop' },
    { do: 'face', who: 'player', at: 'hyssop', s: 0.3 },
    cut(DOOR.single('hyssop', 'mcu')),
    { do: 'sfx', id: 'creak', at: 'hyssop', gain: 0.5, async: true },
    { do: 'say', who: 'hyssop', text: 'For the record, you are the new 3B?' },
    { do: 'intro', who: 'hyssop' },
    cut(DOOR.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "That's me." },
    cut(DOOR.single('hyssop', 'mcu')),
    { do: 'gesture', who: 'hyssop', name: 'point', s: 1.4, async: true },
    { do: 'say', who: 'hyssop', text: 'Wipe your feet. No running. No lodgers. I am watching.' },
    // 3. The turn: she has seen the bedroll.
    cut(shot('player', 'cu', { toward: 'hyssop', height: 'high' })),
    { do: 'sfx', id: 'cloth', at: 'player', gain: 0.4, async: true },
    beat('pause'),
    cut(DOOR.single('hyssop', 'mcu')),
    { do: 'say', who: 'hyssop', text: 'One mattress. Singular. For the record?' },
    // 4. The button: the door shuts, and the name is on the buzzer at last.
    { do: 'sfx', id: 'latch', at: 'hyssop', gain: 0.6, async: true },
    { do: 'despawn', id: 'hyssop' },
    cut(shot('player', 'mcu', { toward: 'hyssop' })),
    { do: 'gesture', who: 'player', name: 'nod', s: 1.0 },
    { do: 'cam', shot: { kind: 'cut', pos: up(31.6, 82.2, 1.55), look: up(31.5, 79.5, 1.65), fov: 34 } },
    { do: 'sfx', id: 'tap', gain: 0.5, async: true },
    { do: 'wait', s: 1.6 },
    { do: 'cam', shot: { kind: 'dolly', from: up(31.4, 83, 1.6), to: up(31.1, 85, 3.4), look: up(31.5, 79.5, 1.65), lookTo: up(31.2, 78.8, 5.2), s: 3.0, fov: 40 } },
    { do: 'music', track: null, fade: 2.0 },
    { do: 'wait', s: 3.0 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'roof-on-credit-intro': ROOF_ON_CREDIT_INTRO,
  'roof-on-credit-mid': ROOF_ON_CREDIT_MID,
  'roof-on-credit-outro': ROOF_ON_CREDIT_OUTRO,
};
