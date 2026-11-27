// Story row 54 scenes: The Heist Board. Intro (day): Tansy pins the last red string on her board while Pip, two steps behind,
// says "Okay, hear me out. Just once." and braces for the sigh; it does not come ("Go."), the first rung of her arc. He pitches
// the idea the board already says (up: the Whirligig), she asks the question she knows the answer to so that he can finish, and
// the camera finds the strings. Mid (day, the arrival at the apron): Wally has lost his caravan key; it is hanging in the open
// door; the key goes round his neck. Outro (dusk): Wally studies the board through binoculars at arm's length, taps the
// Whirligig and asks who is paying for the fuel; Pip announces Tansy's old answer and she says "Mine." All dressing (the board,
// the Stopping Stone and the chart, the key, the pilot's card) is scene props.
// Notes: docs/design/gnome-theft-auto/direction/scenes/heist-board-{intro,caravan,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const CAMP = 'm54-heist-board';
const BOARD_AT: Vec2 = [273.4, 36];
const TANSY_IN = markOf(CAMP, 'tansy', 0);
const PIP_IN = markOf(CAMP, 'pip', 0);
const YOU_IN = markOf(CAMP, 'player', 0);
const TANSY_OUT = markOf(CAMP, 'tansy', 1);
const PIP_OUT = markOf(CAMP, 'pip', 1);
const YOU_OUT = markOf(CAMP, 'player', 1);
const WALLY_FROM = markOf(CAMP, 'wally', 0);
const WALLY_AT = markOf(CAMP, 'wally', 1);
/** Wally's walk up from the dust track to the board, clear of the table (x 269.3..270.7, z 39.5..40.5) and the rail. */
const WALLY_WALK: Vec2[] = [[277.2, 46.2], [274.4, 41.6], [WALLY_AT.at[0], WALLY_AT.at[1]]];

const APRON = 'm54-wally-caravan';
const W_DOOR = markOf(APRON, 'wally');
const W_YOU = markOf(APRON, 'player');

/** The props every scene at the board shares: the plan board, the stone holding a chart down on the table. */
const BOARD_PROPS: NonNullable<SceneScript['props']> = [
  { id: 'board', prefab: 'heist-board', at: BOARD_AT, yaw: -Math.PI / 2, size: 2.0 },
  { id: 'stone', prefab: 'stopping-stone', at: up(269.6, 40.2, 0.85), yaw: 0.6, size: 0.42, by: 'h' },
  { id: 'chart', prefab: 'rolled-chart', at: up(270.4, 39.9, 0.85), yaw: 1.2, size: 0.9 },
];

const PIP_TANSY = coverage('pip', 'tansy', 1);
const TANSY_YOU = coverage('tansy', 'player', 1);

/** Row 54 intro: the last string, "Okay, hear me out. Just once.", "Go.". Day. */
const INTRO: SceneScript = {
  id: 'heist-board-intro',
  stage: { kind: 'world' },
  music: 'heist',
  ambience: 'wind',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/heist-board-intro.md', kind: 'chapter-open' },
  actors: [
    { id: 'tansy', preset: 'tansy', held: null, at: TANSY_IN.at, yaw: TANSY_IN.yaw },
    { id: 'pip', preset: 'pip', at: PIP_IN.at, yaw: PIP_IN.yaw },
    { id: 'player', player: true, held: null, at: YOU_IN.at, yaw: YOU_IN.yaw },
  ],
  props: BOARD_PROPS,
  steps: [
    // Hook: the crane over the Dust Flats onto Fort Sandpit's walls, and the act's title (runway-intro no longer carries it).
    { do: 'cam', shot: { kind: 'dolly', from: up(214, -70, 64), to: up(246, -14, 44), look: up(330, -6, 6), lookTo: up(366, 4, 10), s: 5, fov: 54 } },
    { do: 'stinger', id: 'chapter' },
    { do: 'title', text: 'CHAPTER 4 — SANDPIT PROTOCOL' },
    { do: 'wait', s: 3 },
    { do: 'title', text: null },
    // The camp: a tack tapped in with the heel of a wrench, and Pip bouncing two steps behind.
    cut(spot(CAMP, 'wide')),
    { do: 'sfx', id: 'tap', at: 'tansy', gain: 0.5, async: true },
    { do: 'gesture', who: 'tansy', name: 'lean', s: 1.4, async: true },
    { do: 'wait', s: 1.5 },
    { do: 'sfx', id: 'tap', at: 'tansy', gain: 0.5, async: true },
    cut(PIP_TANSY.single('pip', 'ms')),
    { do: 'say', who: 'pip', text: 'Okay, hear me out. Just once.' },
    // The beat the row hangs on: the music drops, Pip flinches, and nobody sighs.
    { do: 'music', track: null, fade: 0.3 },
    { do: 'gesture', who: 'pip', name: 'flinch', s: 0.9, async: true },
    cut(PIP_TANSY.single('tansy', 'mcu', { height: 'low' })),
    { do: 'face', who: 'tansy', at: 'pip', s: 0.8, async: true },
    beat('silence'),
    { do: 'say', who: 'tansy', text: 'Go.' },
    // Setup: he does not know what to do with a yes.
    cut(PIP_TANSY.single('pip', 'mcu')),
    { do: 'music', track: 'heist', fade: 0.8 },
    beat('beat'),
    { do: 'say', who: 'pip', text: '...Go?' },
    cut(PIP_TANSY.single('tansy', 'mcu', { height: 'low' })),
    { do: 'say', who: 'tansy', text: 'Pip.' },
    // The pitch: the whole of Pip, in one breath, to the back of her head.
    cut(PIP_TANSY.single('pip', 'ms')),
    { do: 'gesture', who: 'pip', name: 'point', s: 1.4, async: true },
    { do: 'say', who: 'pip', text: 'Everything the Combine owns is on the ground. Four parts, four roads!' },
    { do: 'say', who: 'pip', text: 'So we go up. We take the Whirligig!' },
    cut(PIP_TANSY.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Where is it?' },
    cut(PIP_TANSY.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'In a fort. ...That is the bit I had not finished.' },
    ...reaction('player', { toward: 'pip', size: 'mcu', hold: 'pause' }),
    // The turn: she was a string ahead of him all along, and let him finish anyway.
    cut(spot(CAMP, 'board')),
    { do: 'sfx', id: 'paper', at: up(273.4, 36, 1.2), gain: 0.35, async: true },
    { do: 'wait', s: 1.7 },
    cut(PIP_TANSY.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'I know. Air superiority means the Whirligig. It is in Fort Sandpit.' },
    cut(PIP_TANSY.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'You let me finish.' },
    cut(PIP_TANSY.single('tansy', 'mcu', { height: 'low' })),
    { do: 'say', who: 'tansy', text: 'It was a good idea. It is still in a fort.' },
    // The job, said to the player and handed over: a camera, a rail, then a pilot.
    { do: 'face', who: 'tansy', at: 'player', s: 0.5 },
    cut(TANSY_YOU.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Three sides to scout from the rail: north wall, gate, pad.' },
    cut(spot(CAMP, 'fort')),
    { do: 'give', from: 'tansy', to: 'player', prop: 'field-camera', s: 1 },
    { do: 'sfx', id: 'flutter', gain: 0.3, async: true },
    { do: 'wait', s: 1.6 },
    cut(TANSY_YOU.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Then Wally, at his caravan on the airfield. He flies.' },
    // Button: Pip, a stage whisper; Tansy, not turning round.
    cut(shot('pip', 'mcu', { toward: 'tansy', side: -25 })),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 0.8, async: true },
    { do: 'say', who: 'pip', text: 'She said good idea.' },
    cut(shot('tansy', 'mcu', { toward: 'pip', side: 25, height: 'low' })),
    { do: 'sfx', id: 'tap', at: 'tansy', gain: 0.5, async: true },
    { do: 'say', who: 'tansy', text: 'I heard that.' },
    { do: 'wait', s: 0.9 },
  ],
};

const WALLY_PLAYER = coverage('wally', 'player', 1, 15);

/** Row 54 mid: the arrival at Wally's caravan. The key is in the door. Day. */
const CARAVAN: SceneScript = {
  id: 'heist-board-caravan',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'wind',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/heist-board-caravan.md', kind: 'arrival' },
  actors: [
    { id: 'wally', preset: 'wally', held: null, at: W_DOOR.at, yaw: W_DOOR.yaw },
    { id: 'player', player: true, held: null, at: W_YOU.at, yaw: W_YOU.yaw },
  ],
  vehicles: [{ id: 'ride', kind: 'lowrider', from: 'player', at: [461.4, -87.6], yaw: 0.2, keep: true }],
  props: [
    // The key in the lock, hanging where the door has held it since March.
    { id: 'key', prefab: 'brass-key', at: up(466.9, -76.62, 1.08), yaw: Math.PI, size: 0.22, by: 'h' },
  ],
  steps: [
    // Hook: a man patting every pocket twice, and the jingle of a ring that is not the right ring.
    cut(spot(APRON, 'door')),
    { do: 'sfx', id: 'keys', at: 'wally', gain: 0.5, async: true },
    { do: 'gesture', who: 'wally', name: 'shrug', s: 1.2, async: true },
    { do: 'wait', s: 1.3 },
    cut(WALLY_PLAYER.single('wally', 'mcu')),
    { do: 'say', who: 'wally', text: 'Kid. Give me a minute. I have lost the caravan key.' },
    cut(WALLY_PLAYER.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Your door is open.' },
    cut(WALLY_PLAYER.single('wally', 'mcu', { height: 'low' })),
    beat('beat'),
    { do: 'say', who: 'wally', text: 'It is the principle of the thing.' },
    // The turn: the camera finds it before he does.
    cut(spot(APRON, 'lock')),
    { do: 'face', who: 'wally', at: [466.9, -76.6], s: 0.5, async: true },
    { do: 'sfx', id: 'keys', at: 'key', gain: 0.4, async: true },
    { do: 'wait', s: 1.8 },
    cut(shot('wally', 'mcu', { toward: 'player', side: 85 })),
    beat('beat'),
    { do: 'say', who: 'wally', text: '...Found it.' },
    { do: 'face', who: 'wally', at: 'player', s: 0.5, async: true },
    { do: 'despawn', id: 'key' },
    { do: 'sfx', id: 'keys', at: 'wally', gain: 0.4, async: true },
    cut(WALLY_PLAYER.single('player', 'mcu')),
    beat('pause'),
    { do: 'say', who: 'player', text: 'Tansy wants a pilot.' },
    cut(WALLY_PLAYER.single('wally', 'ms')),
    { do: 'say', who: 'wally', text: 'She radioed. I still think about those four seconds, kid.' },
    // Button: the key goes round his neck, where it should have been, and he says it to himself.
    cut(WALLY_PLAYER.single('wally', 'cu', { height: 'high' })),
    { do: 'sfx', id: 'latch', at: 'wally', gain: 0.5, async: true },
    { do: 'say', who: 'wally', text: 'Neck. Key goes on the neck.' },
    { do: 'wait', s: 0.9 },
  ],
};

const WALLY_PIP = coverage('wally', 'pip', 1, 15);
const PIP_TANSY_OUT = coverage('pip', 'tansy', 1, 15);
const TANSY_WALLY = coverage('tansy', 'wally', 1, 15);

/** Row 54 outro: Wally studies the board; "Who is paying for the fuel?" Dusk. */
const OUTRO: SceneScript = {
  id: 'heist-board-outro',
  stage: { kind: 'world' },
  music: 'heist',
  ambience: 'wind',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/heist-board-outro.md', kind: 'outro' },
  actors: [
    { id: 'tansy', preset: 'tansy', held: null, at: TANSY_OUT.at, yaw: TANSY_OUT.yaw },
    { id: 'pip', preset: 'pip', at: PIP_OUT.at, yaw: PIP_OUT.yaw },
    { id: 'player', player: true, held: null, at: YOU_OUT.at, yaw: YOU_OUT.yaw },
    { id: 'wally', preset: 'wally', held: 'field-binoculars', at: WALLY_FROM.at, yaw: WALLY_FROM.yaw },
  ],
  props: [
    ...BOARD_PROPS,
    // The pilot's card, pinned last: a stall speed in marker pen.
    { id: 'card', prefab: 'framed-photograph', at: up(273.2, 36.8, 1.0), yaw: -Math.PI / 2, size: 0.3, hidden: true },
  ],
  steps: [
    // Hook: the slow walk in at golden hour; Pip pointing at somebody he has been told to expect.
    cut(spot(CAMP, 'dusk-wide')),
    { do: 'walk', who: 'wally', path: WALLY_WALK, speed: 1.1, async: true },
    { do: 'sfx', id: 'crunch', at: 'wally', gain: 0.4, async: true },
    { do: 'gesture', who: 'pip', name: 'point', s: 1.2, async: true },
    { do: 'wait', s: 3.0 },
    // Setup: the old pilot looks at a plan through binoculars from a pace away.
    cut(WALLY_PIP.single('wally', 'mcu')),
    { do: 'sfx', id: 'paper', at: 'wally', gain: 0.3, async: true },
    { do: 'wait', s: 1.4 },
    { do: 'say', who: 'wally', text: 'I can fly anything with a propeller.' },
    cut(WALLY_PIP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'It is a mower with a rotor!' },
    cut(WALLY_PIP.single('wally', 'mcu', { height: 'low' })),
    { do: 'say', who: 'wally', text: 'A rotor is a propeller with ambition.' },
    // The turn: a knuckle on the map where the pad is, and the practical question.
    cut({ kind: 'cut', pos: up(271.0, 33.4, 0.4), look: up(273.4, 36.2, 1.0), fov: 40 }),
    { do: 'sfx', id: 'tap', at: up(273.4, 36.0, 1.0), gain: 0.5, async: true },
    { do: 'wait', s: 1.2 },
    cut(WALLY_PIP.single('wally', 'mcu')),
    { do: 'say', who: 'wally', text: 'Who is paying for the fuel?' },
    // Pip knows this one. Everybody does.
    { do: 'face', who: 'tansy', at: 'wally', s: 0.5, async: true },
    { do: 'face', who: 'pip', at: 'tansy', s: 0.5, async: true },
    cut(WALLY_PIP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Here it comes. "Not my problem."' },
    cut(TANSY_WALLY.single('tansy', 'mcu', { height: 'low' })),
    beat('beat'),
    { do: 'say', who: 'tansy', text: 'Mine.' },
    cut(PIP_TANSY_OUT.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'facepalm', s: 0.8, async: true },
    beat('pause'),
    cut(TANSY_WALLY.single('wally', 'mcu')),
    { do: 'say', who: 'wally', text: "Wind's nor'-nor'-east. Good." },
    // Button: the pilot's card goes up on the board with one more string; the tack is tapped home.
    { do: 'spawn', id: 'card' },
    { do: 'sfx', id: 'tap', at: up(273.2, 36.8, 1.0), gain: 0.5, async: true },
    cut(spot(CAMP, 'board')),
    { do: 'wait', s: 2.4 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'heist-board-intro': INTRO,
  'heist-board-caravan': CARAVAN,
  'heist-board-outro': OUTRO,
};
