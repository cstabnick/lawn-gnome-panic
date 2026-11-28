// Story row 30 "Cam's Big Night": Cam holds out his entry slip on the Side-Valve apron (dusk), comes in last at the
// Speedway under the floodlights and sweeps the finish line (night), and is handed a beige envelope by a man in a beige
// vest on the way home (night). Cam speaks in short, flat lines; the broom is in his hand in every scene.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m30-cams-big-night-{intro,mid,outro}.md
// No intro cards: Cam had his in the prologue and Lulu hers at the night meet (m05).
import type { SceneScript, ScriptActor, Vec2 } from '../../script';
import { beat, coverage, cut, insert, pushIn, reaction, shot } from '../../direct';
import { carMark, markOf, pathOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

const APRON = 'side-valve-apron';
const LINE = 'speedway-finish-night';

/** Beige: the HOA courier's coat (m21) and the vest of the man who brings the envelope. */
const BEIGE = 0xd8c8a8;
const VEST_LOOK: Look = { hat: BEIGE, shirt: BEIGE, pants: 0xbcae94, beard: 0xeeeeee };

// ---- Stage marks ------------------------------------------------------------------------------------------------------
const I_CAM = markOf(APRON, 'turncoat-cam', 0);
const I_PLAYER = markOf(APRON, 'player', 0);
const O_CAM = markOf(APRON, 'turncoat-cam', 1);
const O_PLAYER = markOf(APRON, 'player', 1);
const O_VEST = markOf(APRON, 'beige-vest');
const M_CAM = markOf(LINE, 'cam');
const M_LULU = markOf(LINE, 'lulu');
const M_PLAYER = markOf(LINE, 'player');
const M_LOWRIDER = carMark(LINE, 'speedway-finish-lowrider');
const M_MOWER = carMark(LINE, 'speedway-finish-mower');
/** The last stretch of Cam's run, down the main straight to the line (the first point is a long way back). */
const CAM_RUN: Vec2[] = pathOf(LINE, 'cam-finish-run').slice(1);

/** Where the broom leans while Cam holds the slip: against the bay wall at his shoulder. */
const BROOM_LEAN: Vec2 = [-156.4, 67.6];
/** The finish line paint, across the straight, and Cam's two sweeps along it. */
const LINE_SWEEP: Vec2[] = [[735.6, -359.2], [735.6, -362.4]];
/** Where the vest man stands in the dark first, and where he steps out to. */
const VEST_START: Vec2 = [-170, 77];
const VEST_STOP: Vec2 = [-157.4, 73.4];

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

/** Cam and the player on the apron: one side of the line. */
const ASK = coverage('cam', 'player', 1);
/** Lulu and the player at the line. */
const LULU_PLAYER = coverage('lulu', 'player', 1);
/** Cam, the player and the vest on the apron at night: all shot from the north side. */
const HANDOVER = coverage('cam', 'player', -1);

// ---- Intro: the entry slip (dusk) -------------------------------------------------------------------------------------
/**
 * Cam sweeps the apron at dusk, stops, leans the broom on the wall and holds out a paper entry slip without looking up.
 * He wants a pit crew and has nobody; he says it flatly, the one sincere line, and then takes the broom up again and
 * brings it to a race. Tansy is not in the scene: the bench joke reaches her by comms.
 */
export const M30_CAMS_BIG_NIGHT_INTRO: SceneScript = {
  id: 'm30-cams-big-night-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m30-cams-big-night-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: I_PLAYER.at, yaw: I_PLAYER.yaw },
    { id: 'cam', preset: 'turncoat cam', name: 'Turncoat Cam', at: [-159.4, 65.4], yaw: Math.PI / 2 },
  ],
  props: [
    // The broom, leant against the bay wall while he holds the slip.
    { id: 'broom-lean', prefab: 'broom', at: up(BROOM_LEAN[0], BROOM_LEAN[1], 0), yaw: 0.2, size: 1.2, by: 'h', hidden: true },
  ],
  steps: [
    // 1. Hook: the broom on concrete, the apron long in the low sun, Cam sweeping towards the player and not looking up.
    cut(spot(APRON, 'apron-wide')),
    { do: 'sfx', id: 'crunch', at: 'cam', gain: 0.5, async: true },
    { do: 'walk', who: 'cam', path: [I_CAM.at], speed: 0.9, async: true },
    { do: 'wait', s: 2.6 },
    { do: 'face', who: 'cam', at: 'player', s: 0.5, async: true },
    // 2. He stops. The broom is leant on the wall, and the slip comes out of a pocket.
    cut(ASK.single('cam', 'mcu')),
    { do: 'say', who: 'cam', text: 'Speedway. One race. I saved up for it.' },
    { do: 'sfx', id: 'paper', at: 'cam', gain: 0.5, async: true },
    { do: 'spawn', id: 'broom-lean' },
    { do: 'hold', who: 'cam', prop: 'ticket-stub' },
    cut(insert('cam', { toward: 'player' })),
    { do: 'wait', s: 1.3 },
    // 3. The player's one question, and the answer that is a want.
    cut(ASK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'You? Racing?' },
    cut(ASK.single('cam', 'mcu')),
    { do: 'say', who: 'cam', text: 'I need a pit crew. Someone who drives.' },
    ...reaction('player', { toward: 'cam', gesture: 'shrug', hold: 'pause' }),
    // 4. The bench: Tansy is a name in a joke.
    cut(ASK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Does Tansy know?' },
    cut(ASK.single('cam', 'mcu')),
    { do: 'say', who: 'cam', text: 'She says do not bet the bench.' },
    // 5. The turn: the sincere line, flat, said to the bay and not to the person.
    cut(pushIn('cam', 'mcu', 3.6, { toward: 'player', side: 25 })),
    { do: 'say', who: 'cam', text: 'Nobody has ever come to watch me.' },
    { do: 'say', who: 'cam', text: 'Bring a ride round. I will wait here.' },
    // 6. The button: he takes the broom up again. It is coming.
    cut(ASK.single('player', 'ms')),
    { do: 'say', who: 'player', text: 'You are bringing the broom?' },
    cut(ASK.single('cam', 'ms')),
    { do: 'despawn', id: 'broom-lean' },
    { do: 'hold', who: 'cam', prop: 'broom' },
    { do: 'sfx', id: 'clatter', at: 'cam', gain: 0.4, async: true },
    { do: 'say', who: 'cam', text: 'It has never seen a race.' },
    beat('pause'),
  ],
};

// ---- Mid: last place (night) ------------------------------------------------------------------------------------------
/**
 * The Speedway after the relay. Lulu leans on her lowrider on the finish line, already laughing; Cam's mower comes down
 * the straight at walking pace, last, the broom upright in his fist like a pennant. She teases him as she teases everyone
 * she likes. He says thanks. Then he walks to the line and sweeps it, and her laugh runs out.
 */
export const M30_CAMS_BIG_NIGHT_MID: SceneScript = {
  id: 'm30-cams-big-night-mid',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'turfton',
  ambience: 'crowd',
  radio: 0.1,
  direction: {
    notes: 'docs/design/gnome-theft-auto/direction/scenes/m30-cams-big-night-mid.md',
    kind: 'arrival',
    waive: [{ code: 'repeat-line', why: 'also registered as the Speedway result scene race-cams-big-night-podium; the quest plays it once' }],
  },
  actors: [
    { id: 'player', player: true, at: M_PLAYER.at, yaw: M_PLAYER.yaw },
    { id: 'lulu', preset: 'lugnut lulu', name: 'Lugnut Lulu', at: M_LULU.at, yaw: M_LULU.yaw },
    { id: 'cam', preset: 'turncoat cam', name: 'Turncoat Cam', at: [0, 0], seatedIn: 'mower' },
  ],
  vehicles: [
    { id: 'lowrider', kind: 'lowrider', at: M_LOWRIDER.at, yaw: M_LOWRIDER.yaw, tint: 0x8e44ad, headlights: true },
    { id: 'mower', kind: 'ride-on', at: CAM_RUN[0], yaw: M_MOWER.yaw, headlights: true },
  ],
  steps: [
    // 1. Hook: Lulu's laugh arrives before the reason does.
    cut(shot('lulu', 'mcu', { toward: 'player', side: 30 })),
    { do: 'gesture', who: 'lulu', name: 'lean', s: 1.0, async: true },
    { do: 'say', who: 'lulu', text: 'Ha! He is still going!' },
    // 2. The straight, floodlit: a ride-on at walking pace with a broom held up like a flag.
    { do: 'drive', vehicle: 'mower', path: CAM_RUN, speed: 5.5, async: true },
    { do: 'cam', shot: { kind: 'track', pos: up(729, -356, 1.7), who: 'mower', fov: 46 } },
    { do: 'sfx', id: 'engine-rev', at: 'mower', gain: 0.4, async: true },
    { do: 'wait', s: 3.4 },
    { do: 'horn', vehicle: 'mower' },
    { do: 'wait', s: 1.2 },
    // 3. He gets off. The broom is still in his hand.
    cut(shot('cam', 'ms', { toward: 'lulu', side: 30 })),
    { do: 'exit', who: 'cam' },
    { do: 'walk', who: 'cam', path: [M_CAM.at], speed: 1.1 },
    { do: 'face', who: 'cam', at: 'lulu', s: 0.4, async: true },
    ...reaction('cam', { toward: 'lulu', hold: 'pause' }),
    // 4. Lulu's tease, and the player's two words.
    cut(LULU_PLAYER.single('lulu', 'mcu')),
    { do: 'gesture', who: 'lulu', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'lulu', text: 'Last, sweeper! You drive the way you sweep. Thoroughly!' },
    cut(LULU_PLAYER.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'He finished.' },
    cut(LULU_PLAYER.single('lulu', 'mcu')),
    { do: 'say', who: 'lulu', text: 'He did. Nobody finishes last on purpose.' },
    // 5. The turn: Cam says thanks, flat, and goes to the line.
    cut(pushIn('cam', 'ms', 3.2, { toward: 'lulu', side: -25 })),
    { do: 'say', who: 'cam', text: 'Thanks.' },
    { do: 'walk', who: 'cam', path: [LINE_SWEEP[0]], speed: 1.8, async: true },
    { do: 'wait', s: 1.0 },
    // 6. Button: he sweeps the finish line. Her laugh runs out under the floodlights.
    cut(shot('lulu', 'mcu', { toward: 'player', side: 30 })),
    { do: 'say', who: 'lulu', text: 'Is he sweeping the line?' },
    cut(LULU_PLAYER.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'He does that.' },
    cut(spot(LINE, 'line-low')),
    { do: 'walk', who: 'cam', path: [LINE_SWEEP[1]], speed: 0.8, async: true },
    { do: 'sfx', id: 'crunch', at: 'cam', gain: 0.5, async: true },
    { do: 'wait', s: 3.0 },
  ],
};

// ---- Outro: the envelope (night) --------------------------------------------------------------------------------------
/**
 * Home at the storeroom door under the bay lamp. Cam thanks the player and says last is still finished; a man in a beige
 * vest steps out of the dark along the wall, gives him an envelope and says nothing. The player sees it. Cam says it is
 * parts, and goes back to sweeping, slower. The envelope is seen and not understood.
 */
export const M30_CAMS_BIG_NIGHT_OUTRO: SceneScript = {
  id: 'm30-cams-big-night-outro',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'mystery',
  ambience: 'night',
  radio: 0.08,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m30-cams-big-night-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: O_PLAYER.at, yaw: O_PLAYER.yaw },
    { id: 'cam', preset: 'turncoat cam', name: 'Turncoat Cam', at: O_CAM.at, yaw: O_CAM.yaw },
    { id: 'vest', name: 'Beige Vest', look: VEST_LOOK, at: VEST_START, yaw: towards(VEST_START, VEST_STOP), hz: 90, hidden: true, held: null },
  ],
  steps: [
    // 1. Hook: the ride ticking as it cools under the bay lamp; Cam says thanks to the dark.
    cut(spot(APRON, 'apron-night')),
    { do: 'sfx', id: 'door-creak', at: 'cam', gain: 0.35, async: true },
    { do: 'wait', s: 1.2 },
    cut(HANDOVER.single('cam', 'mcu')),
    { do: 'say', who: 'cam', text: 'Thanks. For the stint.' },
    cut(HANDOVER.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'You finished.' },
    cut(HANDOVER.single('cam', 'mcu')),
    { do: 'say', who: 'cam', text: 'Last is still finished.' },
    // 2. The turn: a footstep on the concrete, and Cam's eyes go past the player.
    { do: 'sfx', id: 'footsteps', at: up(-160, 74, 0.5), gain: 0.5, async: true },
    cut(shot('cam', 'cu', { toward: 'player', side: -25 })),
    { do: 'face', who: 'cam', at: VEST_STOP, s: 0.6, async: true },
    { do: 'spawn', id: 'vest' },
    { do: 'walk', who: 'vest', path: [VEST_STOP], speed: 2.2, async: true },
    { do: 'wait', s: 2.4 },
    cut(shot('vest', 'ms', { toward: 'cam', side: -30, height: 'low' })),
    { do: 'wait', s: 1.6 },
    { do: 'gesture', who: 'vest', name: 'tipHat', s: 0.9, async: true },
    beat('pause'),
    // 3. The envelope: it changes hands without a word. A close, high shot of the hands.
    { do: 'hold', who: 'vest', prop: 'sealed-letter' },
    { do: 'sfx', id: 'paper', at: 'cam', gain: 0.55, async: true },
    { do: 'give', from: 'vest', to: 'cam', prop: 'sealed-letter', s: 1 },
    cut(insert('cam', { toward: 'vest', side: -30 })),
    { do: 'stinger', id: 'mystery' },
    { do: 'wait', s: 1.6 },
    // 4. The player saw it. Cam knows.
    ...reaction('player', { toward: 'cam', gesture: 'think', hold: 'pause' }),
    { do: 'walk', who: 'vest', path: [VEST_START], speed: 1.8, async: true },
    { do: 'face', who: 'cam', at: 'player', s: 0.4, async: true },
    cut(HANDOVER.single('cam', 'mcu')),
    { do: 'say', who: 'cam', text: 'Parts. Nothing. Thanks again.' },
    // 5. Button: the envelope goes in his vest and the broom comes back up. He sweeps, a little slower.
    { do: 'hold', who: 'cam', prop: 'broom' },
    cut(pushIn('cam', 'ms', 3.4, { toward: 'player', side: -25, height: 'low' })),
    { do: 'sfx', id: 'crunch', at: 'cam', gain: 0.5, async: true },
    { do: 'walk', who: 'cam', path: [[O_CAM.at[0] - 1.8, O_CAM.at[1] - 2.8]], speed: 0.7 },
    beat('beat'),
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm30-cams-big-night-intro': M30_CAMS_BIG_NIGHT_INTRO,
  'm30-cams-big-night-mid': M30_CAMS_BIG_NIGHT_MID,
  // The Speedway runner plays this id when the race is finished (the result scene): the same scene, Cam's last place.
  'race-cams-big-night-podium': {
    ...M30_CAMS_BIG_NIGHT_MID,
    id: 'race-cams-big-night-podium',
    direction: {
      notes: 'docs/design/gnome-theft-auto/direction/scenes/m30-cams-big-night-mid.md',
      kind: 'arrival',
      waive: [{ code: 'repeat-line', why: 'the same scene under the Speedway result id; the quest plays it once' }],
    },
  },
  'm30-cams-big-night-outro': M30_CAMS_BIG_NIGHT_OUTRO,
};
