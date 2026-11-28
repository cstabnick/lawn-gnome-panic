// Story row 45 (m45-rootwell-admissions): Rootwell Admissions. Four scenes, the laugh before the act's turn:
//   intro: Betony's letter, delivered by a pigeon to a mooring post at the foot of Long Spoon Pier, read aloud in her voice while the
//          Saltwater lies behind the player, its horizon the one perfectly level line in sight.
//   enrol: the registrar's desk outside Wicket Lodge (the funny beat: mature student, a sugar-cube fee, a mortarboard).
//   mid:   Dean Lovage Inkwell lectures twelve empty folding chairs on the quad; the player creeps along the audience, and when he
//          turns, sits down and is a chair. His one listener is a pigeon, which then leaves.
//   outro: dusk on the Long Shelf's steps: Betony in person, her pigeon's one technique, the Anthill in the last sun, and a doorframe.
// Betony's first appearance in person is the outro (her intro card); Dean Lovage's is the mid (his intro card).
// Notes: docs/design/gnome-theft-auto/direction/scenes/m45-rootwell-admissions-{intro,enrol,mid,outro}.md
import type { ScriptActor, SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, insert, pushIn, shot } from '../../direct';
import { markOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

const RAIL = 'queen-rail-letter';
const LODGE = 'rootwell-registrar';
const LECTURE = 'quad-lecture';
const STEPS = 'long-shelf-steps';

// ---- 1. Intro: the letter at the rail ---------------------------------------------------------------------------------------
const R_YOU = markOf(RAIL, 'player');
/** The pier head is a deck at this height (coast/config.ts ship.deckY), a little above the sand: props and the player stand on it. */
const DECK_Y = -3.0;
/** The mooring post that perches the pigeon, a pace to the player's left; the letter lies on its top beside the bird. */
const POST: Vec2 = [298.6, 1172.4];
const POST_H = 1.2;

/**
 * Noon on the pier head. A pigeon has been sitting on a mooring post with a letter for what the post considers a long time. The
 * player reads it; Betony's voice is the letter. The horizon behind the player is the line she is talking about.
 */
const INTRO: SceneScript = {
  id: 'm45-rootwell-admissions-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'warm',
  ambience: 'shore',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m45-rootwell-admissions-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: [R_YOU.at[0], DECK_Y, R_YOU.at[1]], yaw: Math.atan2(POST[0] - R_YOU.at[0], POST[1] - R_YOU.at[1]) },
    // Betony is only a voice here: she writes the letter, and her first appearance in person is the outro.
    { id: 'betony', preset: 'betony', held: null, hidden: true, at: [296, 1158] },
  ],
  props: [
    { id: 'post', prefab: 'pier-post', at: [POST[0], DECK_Y, POST[1]], yaw: 0.3, size: POST_H, by: 'h' },
    { id: 'pigeon', prefab: 'bird-pigeon', at: [POST[0], DECK_Y + POST_H, POST[1]], yaw: -0.9, size: 0.42, by: 'h' },
    { id: 'letter', prefab: 'sealed-letter', at: [POST[0] + 0.28, DECK_Y + POST_H, POST[1] - 0.12], yaw: 0.5, size: 0.34, by: 'w' },
  ],
  steps: [
    // Hook: a pigeon on a post, a letter at its feet, a bell a long way off, and the player's boots turning slowly into the frame.
    cut(spot(RAIL, 'post')),
    { do: 'sfx', id: 'bell', at: [300, DECK_Y + 4, 1268], gain: 0.35, async: true },
    { do: 'face', who: 'player', yaw: Math.PI, s: 1.4, async: true },
    { do: 'wait', s: 2.6 },
    // Setup: the player and the unmoving courier.
    cut(shot('player', 'mcu', { side: 18 })),
    { do: 'say', who: 'player', text: 'Is that for me?' },
    { do: 'sfx', id: 'paper', at: 'player', gain: 0.5, async: true },
    { do: 'despawn', id: 'letter' },
    { do: 'hold', who: 'player', prop: 'sealed-letter' },
    // The letter, in her voice, over the paper in the player's hands.
    cut(insert('player')),
    { do: 'say', who: 'betony', text: 'I am Professor Sextant, of Rootwell. Do forgive the pigeon.' },
    cut(shot('player', 'mcu', { side: -22 })),
    { do: 'say', who: 'player', text: 'He does not look sorry.' },
    cut(spot(RAIL, 'post')),
    { do: 'sfx', id: 'flutter', at: [POST[0], DECK_Y + POST_H, POST[1]], gain: 0.3, async: true },
    beat('pause'),
    // The ask, over the player reading: the survey, and what it did.
    cut(pushIn('player', 'mcu', 4.6, { side: 16 })),
    { do: 'say', who: 'betony', text: 'The Combine steers by my star survey. They took it. I want it back.' },
    // The turn: the horizon. The one perfectly level line, with the player small in front of it.
    cut(spot(RAIL, 'wide')),
    { do: 'music', track: 'mystery', fade: 2.0 },
    { do: 'say', who: 'betony', text: 'My survey drew a perfectly level line. That is the whole problem.' },
    { do: 'wait', s: 0.8 },
    // The job: the enrolment, and the Dean.
    cut(shot('player', 'mcu', { side: 20 })),
    { do: 'say', who: 'betony', text: 'Rootwell no longer admits me. Enrol as a mature student. Mind the Dean.' },
    cut(shot('player', 'ms', { side: -30, height: 'low' })),
    { do: 'say', who: 'player', text: 'Mature.' },
    { do: 'say', who: 'betony', text: 'He is pleasant, in the way a ledger is pleasant. Find me in the library.' },
    // Button: the back of the letter, and the pigeon's one job done.
    cut(insert('player', { side: -26 })),
    { do: 'sfx', id: 'paper', at: 'player', gain: 0.5, async: true },
    { do: 'say', who: 'betony', text: 'As I was saying: bring a pencil.' },
    cut(spot(RAIL, 'post')),
    { do: 'despawn', id: 'pigeon' },
    { do: 'sfx', id: 'flutter', at: [POST[0], DECK_Y + POST_H, POST[1]], gain: 0.6, async: true },
    { do: 'stinger', id: 'comic' },
    { do: 'wait', s: 2.2 },
  ],
};

// ---- 2. Enrol: the registrar's desk -----------------------------------------------------------------------------------------
const E_REG = markOf(LODGE, 'registrar');
const E_YOU = markOf(LODGE, 'player');
const DESK: Vec2 = [E_REG.at[0], E_REG.at[1] + 1.65];
const REGISTRAR_LOOK: Look = { hat: 0x6b5a45, shirt: 0xd8cfa8, pants: 0x4a4038, beard: 0x9a9a9a, glasses: true };
const ENROL = coverage('registrar', 'player', 1);

/**
 * Noon at the gate lodge. A registrar who does not look up until the player says "mature", a fee in sugar, a bursary that
 * everyone is on, and a mortarboard handed over a desk. The funniest ninety seconds of paperwork on the east side.
 */
const ENROL_SCENE: SceneScript = {
  id: 'm45-rootwell-admissions-enrol',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'turfton',
  ambience: 'office',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m45-rootwell-admissions-enrol.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: E_YOU.at, yaw: E_YOU.yaw },
    { id: 'registrar', name: 'Registrar', look: REGISTRAR_LOOK, held: 'hoa-clipboard', hz: 118, scale: 1.34, at: E_REG.at, yaw: E_REG.yaw },
  ],
  props: [
    { id: 'desk', prefab: 'registrar-desk', at: DESK, yaw: 0, size: 1.7, by: 'w' },
    { id: 'cap', prefab: 'rootwell-mortarboard', at: up(DESK[0] - 0.35, DESK[1], 1.3), yaw: 0.4, size: 0.34, by: 'w', hidden: true },
  ],
  steps: [
    // Hook: a stamp comes down on a form, hard, and the registrar has not looked up.
    cut(spot(LODGE, 'desk')),
    { do: 'sfx', id: 'knock', at: up(DESK[0], DESK[1], 1.0), gain: 0.6, async: true },
    { do: 'sfx', id: 'bell', at: up(DESK[0] + 0.5, DESK[1], 1.0), gain: 0.4, async: true },
    { do: 'wait', s: 1.6 },
    cut(ENROL.single('registrar', 'mcu', { height: 'low' })),
    { do: 'say', who: 'registrar', text: 'Name, age, and reason for studying.' },
    cut(ENROL.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Mature student.' },
    // The turn: he looks up, at the hat.
    cut(pushIn('registrar', 'mcu', 3.2, { toward: 'player', side: 25, height: 'low' })),
    { do: 'gesture', who: 'registrar', name: 'think', s: 1.0, async: true },
    { do: 'say', who: 'registrar', text: 'Hm. You do have the hat for it.' },
    cut(ENROL.single('registrar', 'mcu', { height: 'low' })),
    { do: 'say', who: 'registrar', text: 'Fee is one sugar cube, payable to the ants. They own the hill.' },
    cut(ENROL.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'shrug', s: 1.0, async: true },
    { do: 'say', who: 'player', text: 'I do not have a cube.' },
    cut(ENROL.single('registrar', 'mcu', { height: 'low' })),
    { do: 'sfx', id: 'knock', at: up(DESK[0], DESK[1], 1.0), gain: 0.7, async: true },
    { do: 'say', who: 'registrar', text: 'Then you are on a bursary. Everyone is.' },
    // The badge: a mortarboard slid across the desk.
    { do: 'spawn', id: 'cap' },
    cut(shot('player', 'ms', { toward: 'registrar', side: -40 })),
    { do: 'gesture', who: 'registrar', name: 'point', s: 1.0, async: true },
    { do: 'sfx', id: 'paper', at: up(DESK[0], DESK[1], 1.0), gain: 0.4, async: true },
    { do: 'wait', s: 1.0 },
    cut(ENROL.single('registrar', 'mcu', { height: 'low' })),
    { do: 'say', who: 'registrar', text: 'Welcome to Rootwell. Do not step on the grass. The grass is research.' },
    // Button: the player holds the mortarboard like a plate; he has already moved on to nobody.
    { do: 'despawn', id: 'cap' },
    { do: 'hold', who: 'player', prop: 'rootwell-mortarboard' },
    cut(shot('player', 'ms', { toward: 'registrar', side: -30 })),
    { do: 'gesture', who: 'player', name: 'shrug', s: 1.0, async: true },
    { do: 'sfx', id: 'bell', at: up(DESK[0] + 0.5, DESK[1], 1.0), gain: 0.5, async: true },
    { do: 'wait', s: 1.4 },
    cut(shot('registrar', 'mcu', { toward: 'player', side: 25, height: 'low' })),
    { do: 'say', who: 'registrar', text: 'Next.' },
    beat('pause'),
  ],
};

// ---- 3. Mid: the Dean lectures the chairs -----------------------------------------------------------------------------------
const L_DEAN = markOf(LECTURE, 'lovage');
const L_YOU = markOf(LECTURE, 'player');
/** Twelve folding chairs, three columns by four rows, facing west to the lectern (a gown's width from the Dean's front). */
const CHAIR_COLS = [1107, 1110.6, 1114.2];
const CHAIR_ROWS = [-244.6, -241.4, -238.4, -235.4];
const CHAIRS = CHAIR_COLS.flatMap((x, c) => CHAIR_ROWS.map((z, r) => ({ id: `chair-${c}-${r}`, at: [x, z] as Vec2 })));
/** The pigeon sits on the front row's second chair: the only member of the audience. */
const FRONT_PIGEON: Vec2 = [CHAIR_COLS[0], CHAIR_ROWS[1]];
/** The creep along the south end of the audience; the player drops into a seat where the thirteenth chair would be. */
const CREEP: Vec2[] = [[1097.4, -231.2], [1103, -231.8]];
const SEAT: Vec2 = [1107, -232.4];
const DEAN = coverage('lovage', 'player', 1);
const PIGEON_EYE: Vec2 = [1104.6, -237.6];

/**
 * Noon on the quad, the north-west lawn. Dean Lovage lectures to a hall of folding chairs and one pigeon. The player creeps along
 * the audience's end; he nearly hears, turns, and looks straight at them, and they sit down and are a chair. He answers himself; the
 * pigeon leaves; he minutes the loss. Pompous, never menacing for long.
 */
const MID: SceneScript = {
  id: 'm45-rootwell-admissions-mid',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'tension',
  ambience: 'office',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m45-rootwell-admissions-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: 'rootwell-mortarboard', at: L_YOU.at, yaw: Math.atan2(CREEP[0][0] - L_YOU.at[0], CREEP[0][1] - L_YOU.at[1]) },
    { id: 'lovage', preset: 'lovage', held: null, at: L_DEAN.at, yaw: L_DEAN.yaw },
  ],
  props: [
    { id: 'lectern', prefab: 'lectern', at: [L_DEAN.at[0] + 1.4, L_DEAN.at[1]], yaw: Math.PI / 2, size: 1.3, by: 'h' },
    ...CHAIRS.map((c) => ({ id: c.id, prefab: 'folding-chair', at: c.at, yaw: -Math.PI / 2, size: 0.85, by: 'h' as const })),
    { id: 'pigeon', prefab: 'bird-pigeon', at: up(FRONT_PIGEON[0], FRONT_PIGEON[1], 0.78), yaw: -Math.PI / 2, size: 0.42, by: 'h' },
  ],
  steps: [
    // Hook: a gavel on a lectern, and a Dean in full voice to a pigeon.
    cut(spot(LECTURE, 'wide')),
    { do: 'sfx', id: 'knock', at: 'lovage', gain: 0.5, async: true },
    { do: 'gesture', who: 'lovage', name: 'handsUp', s: 1.6, async: true },
    { do: 'wait', s: 1.6 },
    // Setup: who he is, and what he thinks of the room.
    cut(shot('lovage', 'mcu', { side: -25 })),
    { do: 'say', who: 'lovage', text: 'Welcome to a historic term. We must be mindful of the optics, and of the quad.' },
    cut(shot('lovage', 'ms', { side: 30, height: 'low' })),
    { do: 'intro', who: 'lovage' },
    cut(shot('lovage', 'mcu', { side: -35 })),
    { do: 'gesture', who: 'lovage', name: 'bow', s: 1.2, async: true },
    { do: 'say', who: 'lovage', text: 'Attendance is up. I count twelve.' },
    cut(spot(LECTURE, 'back')),
    { do: 'sfx', id: 'flutter', at: 'pigeon', gain: 0.3, async: true },
    { do: 'wait', s: 1.4 },
    // The player slips along the end of the audience, cap down.
    cut(shot('player', 'ms', { toward: 'lovage', side: -50 })),
    { do: 'walk', who: 'player', path: CREEP, speed: 1.0, async: true },
    { do: 'sfx', id: 'rustle', at: 'player', gain: 0.35, async: true },
    { do: 'say', who: 'player', text: 'Cap down. Cap down.' },
    // The Dean takes a question from the front row.
    cut(shot('lovage', 'mcu', { side: -25 })),
    { do: 'say', who: 'lovage', text: 'A question from the front row. Yes? You, in the grey.' },
    cut({ kind: 'cut', pos: up(PIGEON_EYE[0], PIGEON_EYE[1], 1.0), look: up(FRONT_PIGEON[0], FRONT_PIGEON[1], 0.9), fov: 36 }),
    beat('pause'),
    cut(shot('lovage', 'mcu', { side: -25, height: 'low' })),
    { do: 'say', who: 'lovage', text: 'I take your silence as agreement.' },
    // The turn: a boot on a dry twig, and the Dean's ears are the best thing about him. He turns and looks straight at the player.
    { do: 'sfx', id: 'crunch', at: 'player', gain: 0.7, async: true },
    { do: 'music', track: null, fade: 0.4 },
    { do: 'face', who: 'lovage', at: 'player', s: 0.8 },
    cut(DEAN.single('lovage', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lovage', text: 'Is someone walking behind me?' },
    // Be a chair.
    { do: 'walk', who: 'player', path: [SEAT], speed: 1.4, async: true },
    cut(DEAN.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'sit', s: 0.8 },
    { do: 'say', who: 'player', text: 'Be a chair.' },
    beat('pause'),
    cut(DEAN.single('lovage', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lovage', text: 'No. Nobody walks out of my lectures. It would be minuted.' },
    // Button: the pigeon takes off; the Dean counts the chairs again.
    { do: 'music', track: 'warm', fade: 1.0 },
    cut(spot(LECTURE, 'wide')),
    { do: 'despawn', id: 'pigeon' },
    { do: 'sfx', id: 'flutter', at: up(FRONT_PIGEON[0], FRONT_PIGEON[1], 0.9), gain: 0.7, async: true },
    { do: 'wait', s: 1.4 },
    cut(DEAN.single('lovage', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lovage', text: 'Attendance is down one. We must be mindful.' },
    cut(spot(LECTURE, 'wide')),
    { do: 'stinger', id: 'comic' },
    { do: 'wait', s: 1.4 },
  ],
};

// ---- 4. Outro: the steps of the Long Shelf ----------------------------------------------------------------------------------
const S_BET = markOf(STEPS, 'betony');
const S_YOU = markOf(STEPS, 'player');
const ARRIVE: Vec2 = [1113.6, -267.6];
/** The Anthill's dome (campus/types.ts OBSERVATORY.dome): where Betony points. */
const DOME: Vec2 = [1258, 158];
const BETONY = coverage('betony', 'player', 1);

/**
 * Dusk on the library's steps. Betony in person: precise, distracted, two statistical rarities. She points across the whole campus
 * at the white dome on the Anthill, catching the last of the sun, and finds the doorframe with her shoulder on the way in.
 */
const OUTRO: SceneScript = {
  id: 'm45-rootwell-admissions-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'office',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m45-rootwell-admissions-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: 'rootwell-mortarboard', at: ARRIVE, yaw: Math.atan2(S_YOU.at[0] - ARRIVE[0], S_YOU.at[1] - ARRIVE[1]) },
    { id: 'betony', preset: 'betony', held: null, at: S_BET.at, yaw: S_BET.yaw },
  ],
  steps: [
    // Hook: the door, the beam, the dust; Betony on the top step, squinting at the sky as if it owed her something.
    cut(spot(STEPS, 'wide')),
    { do: 'sfx', id: 'door-creak', at: up(S_BET.at[0], S_BET.at[1], 1.0), gain: 0.4, async: true },
    { do: 'gesture', who: 'betony', name: 'lean', s: 1.6, async: true },
    { do: 'walk', who: 'player', path: [S_YOU.at], speed: 1.3, async: true },
    { do: 'wait', s: 2.4 },
    // Setup: who she is, with a statistic.
    cut(BETONY.single('betony', 'mcu')),
    { do: 'face', who: 'betony', at: 'player', s: 0.5, async: true },
    { do: 'say', who: 'betony', text: 'A mature student, and punctual. Two statistical rarities.' },
    { do: 'intro', who: 'betony' },
    cut(BETONY.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Your pigeon stared at me.' },
    cut(BETONY.single('betony', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'betony', name: 'shrug', s: 1.0, async: true },
    { do: 'say', who: 'betony', text: 'He does that. It is his only technique.' },
    // The turn: she turns to the sky, and the light turns with her; the Anthill.
    { do: 'face', who: 'betony', yaw: Math.atan2(DOME[0] - S_BET.at[0], DOME[1] - S_BET.at[1]), s: 0.9, async: true },
    { do: 'music', track: 'mystery', fade: 2.0 },
    cut(BETONY.single('betony', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'betony', name: 'point', s: 2.0, async: true },
    { do: 'say', who: 'betony', text: 'They took the survey. The lens that reads it is still up there.' },
    cut(spot(STEPS, 'anthill')),
    { do: 'sfx', id: 'bell', at: up(1140, -200, 8), gain: 0.35, async: true },
    { do: 'wait', s: 2.6 },
    cut(pushIn('betony', 'mcu', 4.0, { toward: 'player', side: 28 })),
    { do: 'say', who: 'betony', text: 'The Anthill Observatory. Four hundred metres, bearing one-two-six, and a great many ants.' },
    cut(BETONY.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Is it guarded?' },
    cut(BETONY.single('betony', 'mcu', { height: 'low' })),
    { do: 'say', who: 'betony', text: 'By the HOA and, worse, the ants. They invoice.' },
    // Button: she backs into the doorframe, and apologises to it.
    { do: 'walk', who: 'betony', path: [[S_BET.at[0] - 0.7, S_BET.at[1] - 0.6]], speed: 0.9, async: true },
    cut(BETONY.single('player', 'mcu')),
    { do: 'sfx', id: 'thud', at: up(S_BET.at[0] - 0.7, S_BET.at[1] - 0.8, 1.0), gain: 0.6, async: true },
    { do: 'wait', s: 1.0 },
    { do: 'face', who: 'betony', at: 'player', s: 0.4 },
    cut(BETONY.single('betony', 'mcu', { height: 'low' })),
    { do: 'say', who: 'betony', text: 'Sorry. Not you. The doorframe.' },
    { do: 'stinger', id: 'comic' },
    { do: 'wait', s: 1.6 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm45-rootwell-admissions-intro': INTRO,
  'm45-rootwell-admissions-enrol': ENROL_SCENE,
  'm45-rootwell-admissions-mid': MID,
  'm45-rootwell-admissions-outro': OUTRO,
};
