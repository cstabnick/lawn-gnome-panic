// Story row 68 scenes: Lights Out in Turfton, the night before the Even Cut (tone: warm, then hushed; act IV's sincere low, tension 3).
// - m68-lights-out-intro (dusk): the stairwell door of Saucer Court. Hyssop Doormat, a stop-sign lollipop planted across the doorway,
//   counts the dinner guests up her stairs (her one gag: the count, with a for-the-record), Pip insists the dinner is small, Juniper
//   (two days out of the sub-basement) laughs for the first time in the game, Granny holds her pie level, and the lollipop comes down.
// - m68-lights-out-mid (night): four doors, one exchange apiece: Juniper's step on Kerb Row, Bodega's swept step under the neon, Tansy
//   at the sealed bay lifting the mat ("Tomorrow it is my problem too": the end of "not my bay, not my problem"), Granny's porch.
// - m68-lights-out-outro (night): the roof. Pip and the player at the north rail, a telescope, two cocoa mugs, the city lit below and
//   the Combine's glow on the north horizon. Four lines, one of them the player's, then no line for the last ten seconds. No gag.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m68-lights-out-{intro,mid,outro}.md
import type { SceneScript, Vec2, Vec3 } from '../../script';
import { beat, coverage, cut, exchangeLooks, pullOut, pushIn, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const STAIR = 'm68-stair-dusk';
const JUN = 'm68-door-juniper';
const BOD = 'm68-door-bodega';
const BAY = 'm68-door-bay';
const FARM = 'm68-door-farm';
const ROOF = 'm68-roof';
const NOTES = 'docs/design/gnome-theft-auto/direction/scenes/';

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- 1. Intro: six on the stairs ---------------------------------------------------------------------------------------------
const S_HYSSOP = markOf(STAIR, 'hyssop');
const S_JUN = markOf(STAIR, 'juniper');
const S_GRAN = markOf(STAIR, 'granny');
const S_BOD = markOf(STAIR, 'bodega');
const S_TAN = markOf(STAIR, 'tansy');
const S_PIP = markOf(STAIR, 'pip');
const S_YOU = markOf(STAIR, 'player');
/** Where the queue goes in: just inside the stairwell door, out of the light. */
const IN_DOOR: Vec2 = [30, 80.9];
/** Hyssop steps aside, to the chair by the door, to let them past. */
const ASIDE: Vec2 = [32.3, 80.5];
const QH = coverage('hyssop', 'pip', 1);
const QJ = coverage('hyssop', 'juniper', 1);
const QP = coverage('pip', 'tansy', 1);

/**
 * Dusk at the stairwell door. Hyssop counts the dinner guests aloud over a planted lollipop; Pip says it is a small dinner and
 * undoes it in the same breath; Juniper, two days out of the City Hall sub-basement, laughs at the stairs; Granny says there is
 * pie for every number. The turn is Hyssop lowering the sign: up by ten, down by ten. Then the queue goes up past her in turn,
 * and the courtyard is left to a leaning stop sign and one window lighting. Pip's job for the player (everybody home) is the button.
 */
export const M68_INTRO: SceneScript = {
  id: 'm68-lights-out-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'street',
  radio: 0,
  direction: { notes: `${NOTES}m68-lights-out-intro.md`, kind: 'intro' },
  actors: [
    { id: 'hyssop', preset: 'hyssop', held: 'stop-sign-lollipop', at: S_HYSSOP.at, yaw: S_HYSSOP.yaw },
    { id: 'juniper', preset: 'juniper', held: 'gta-can-cola', at: S_JUN.at, yaw: S_JUN.yaw },
    { id: 'granny', preset: 'granny', held: 'pie-tin', at: S_GRAN.at, yaw: S_GRAN.yaw },
    { id: 'bodega', preset: 'bodega', held: 'broom', at: S_BOD.at, yaw: S_BOD.yaw },
    { id: 'tansy', preset: 'tansy', held: null, at: S_TAN.at, yaw: S_TAN.yaw },
    { id: 'pip', preset: 'pip', held: 'glaze-extra-toolbox', at: S_PIP.at, yaw: S_PIP.yaw },
    { id: 'player', player: true, held: null, at: S_YOU.at, yaw: S_YOU.yaw },
  ],
  steps: [
    // Hook: a queue of six in gold light, a warden in the doorway with the sign across it, counting.
    cut(spot(STAIR, 'wide')),
    { do: 'sfx', id: 'footsteps', at: 'juniper', gain: 0.3, async: true },
    { do: 'wait', s: 1.8 },
    cut(shot('hyssop', 'ms', { toward: 'juniper', side: 35 })),
    { do: 'gesture', who: 'hyssop', name: 'point', s: 2.6, async: true },
    { do: 'say', who: 'hyssop', text: 'One. Two. Three. Four. Five. Six?' },
    // Setup: the objection, for the record.
    cut(QH.single('hyssop', 'mcu')),
    { do: 'say', who: 'hyssop', text: 'For the record, the stairs hold two? Occasionally three?' },
    cut(QH.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'shrug', s: 1.1, async: true },
    { do: 'say', who: 'pip', text: 'It is a small dinner! A medium dinner. It is six.' },
    // Juniper, out of the dark, laughs at a staircase.
    cut(QJ.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'Madam, I have spent two days under City Hall.' },
    ...reaction('hyssop', { toward: 'juniper', hold: 'pause', side: 25 }),
    cut(QJ.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'Your stairs do not frighten me.' },
    { do: 'gesture', who: 'juniper', name: 'cheer', s: 1.0, async: true },
    { do: 'say', who: 'juniper', text: 'Ha.' },
    ...reaction('granny', { toward: 'hyssop', gesture: 'nod', hold: 'beat', side: 25 }),
    { do: 'say', who: 'granny', text: 'Let her count, sugar. There is pie for every number.' },
    // Turn: the sign comes down. She has heard the radio too.
    cut(pushIn('hyssop', 'mcu', 3.4, { toward: 'pip', side: 25 })),
    { do: 'sfx', id: 'cloth', at: 'hyssop', gain: 0.4, async: true },
    { do: 'gesture', who: 'hyssop', name: 'stand', s: 0.6 },
    { do: 'hold', who: 'hyssop', prop: null },
    { do: 'say', who: 'hyssop', text: 'Up by ten. Down by ten. Everybody home by ten?' },
    beat('pause'),
    ...exchangeLooks('pip', 'tansy'),
    cut(QP.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Dinner, then everybody home! Every door. You drive.' },
    cut(QP.single('tansy', 'mcu')),
    { do: 'gesture', who: 'tansy', name: 'crossArms', s: 1.0, async: true },
    { do: 'say', who: 'tansy', text: 'I know where I live. Tonight I will let you drive me there.' },
    // The queue goes up past her, one by one, and she counts them in a whisper.
    cut(spot(STAIR, 'queue-low')),
    { do: 'walk', who: 'hyssop', path: [ASIDE], speed: 1.3, async: true },
    { do: 'walk', who: 'juniper', path: [[S_JUN.at[0] + 1.5, 82.0], IN_DOOR], speed: 1.5, async: true },
    { do: 'sfx', id: 'footsteps', at: 'juniper', gain: 0.4, async: true },
    { do: 'wait', s: 1.4 },
    { do: 'walk', who: 'granny', path: [[S_GRAN.at[0] - 0.8, 82.2], IN_DOOR], speed: 1.2, async: true },
    { do: 'wait', s: 1.2 },
    { do: 'walk', who: 'bodega', path: [[S_BOD.at[0] + 2, 82.6], IN_DOOR], speed: 1.4, async: true },
    { do: 'walk', who: 'tansy', path: [[S_TAN.at[0] - 2, 82.6], IN_DOOR], speed: 1.4, async: true },
    { do: 'wait', s: 1.6 },
    { do: 'despawn', id: 'juniper' },
    { do: 'despawn', id: 'granny' },
    { do: 'despawn', id: 'bodega' },
    { do: 'despawn', id: 'tansy' },
    // Button: Pip and the player are last; the sign stays planted by the door; one lit window above.
    cut(shot('pip', 'ms', { toward: 'player', side: 35 })),
    { do: 'face', who: 'pip', at: 'player', s: 0.4 },
    { do: 'walk', who: 'pip', path: [IN_DOOR], speed: 1.4, async: true },
    { do: 'wait', s: 1.6 },
    { do: 'despawn', id: 'pip' },
    cut(spot(STAIR, 'wide')),
    { do: 'walk', who: 'player', path: [IN_DOOR], speed: 1.2, async: true },
    { do: 'wait', s: 2.2 },
  ],
};

// ---- 2. Mid: four doors ------------------------------------------------------------------------------------------------------
const J_JUN = markOf(JUN, 'juniper');
const J_YOU = markOf(JUN, 'player');
const B_BOD = markOf(BOD, 'bodega');
const B_YOU = markOf(BOD, 'player');
const T_TAN = markOf(BAY, 'tansy');
const T_YOU = markOf(BAY, 'player');
const G_GRAN = markOf(FARM, 'granny');
const G_YOU = markOf(FARM, 'player');
const DJ = coverage('juniper', 'player', 1);
const DB = coverage('bodega', 'player', 1);
const DT = coverage('tansy', 'player', 1);
const DG = coverage('granny', 'player', 1);

/**
 * Night, four doors. Each is one short exchange and a wave. Juniper on her doorstep under the porch lamp laughs about her pipes and
 * says she will be early. Bodega, sweeping, prices a broom that is not for sale and says the sign is on. Tansy crouches at the mat of
 * the sealed bay and lifts the key, and says tomorrow it is her problem too. Granny, on her porch with the empty pie tin, would rather
 * her own roof, to come home to. The player's lines: none (a tipped hat at each door).
 */
export const M68_MID: SceneScript = {
  id: 'm68-lights-out-mid',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'warm',
  ambience: 'night',
  radio: 0,
  direction: { notes: `${NOTES}m68-lights-out-mid.md`, kind: 'arrival', waive: [{ code: 'scene-long', why: 'four doors, one exchange each: a montage, ~10 s a door' }] },
  actors: [
    { id: 'player', player: true, held: null, at: G_YOU.at, yaw: G_YOU.yaw, hidden: true },
    { id: 'juniper', preset: 'juniper', held: null, at: J_JUN.at, yaw: J_JUN.yaw, hidden: true },
    { id: 'bodega', preset: 'bodega', held: 'broom', at: B_BOD.at, yaw: B_BOD.yaw, hidden: true },
    { id: 'tansy', preset: 'tansy', held: null, at: T_TAN.at, yaw: T_TAN.yaw, hidden: true },
    { id: 'granny', preset: 'granny', held: 'pie-tin', at: G_GRAN.at, yaw: G_GRAN.yaw, hidden: true },
  ],
  props: [
    { id: 'key', prefab: 'brass-key', at: up(T_TAN.at[0] + 0.5, T_TAN.at[1] - 0.4, 0.15), yaw: 0, size: 0.18, by: 'w', hidden: true },
  ],
  steps: [
    // Door 1: Juniper, Kerb Row.
    { do: 'spawn', id: 'juniper' },
    { do: 'spawn', id: 'player', at: J_YOU.at, yaw: J_YOU.yaw },
    cut(DJ.single('juniper', 'mcu', { height: 'low' })),
    { do: 'sfx', id: 'keys', at: 'juniper', gain: 0.4, async: true },
    { do: 'say', who: 'juniper', text: 'I know every pipe under City Hall by name. I shall be early.' },
    { do: 'gesture', who: 'juniper', name: 'cheer', s: 0.9, async: true },
    cut(DJ.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'tipHat', s: 1.0 },
    { do: 'despawn', id: 'juniper' },
    { do: 'despawn', id: 'player' },
    // Door 2: Bodega, the step.
    { do: 'spawn', id: 'bodega' },
    { do: 'spawn', id: 'player', at: B_YOU.at, yaw: B_YOU.yaw },
    cut(DB.single('bodega', 'ms', { height: 'low' })),
    { do: 'sfx', id: 'bell', at: 'bodega', gain: 0.3, async: true },
    { do: 'say', who: 'bodega', text: 'Broom. Four acorns. Not for sale.' },
    cut(DB.single('bodega', 'mcu')),
    { do: 'say', who: 'bodega', text: 'Sign is on. Go.' },
    { do: 'despawn', id: 'bodega' },
    { do: 'despawn', id: 'player' },
    // Door 3: Tansy, the sealed bay, the mat.
    { do: 'spawn', id: 'tansy' },
    { do: 'spawn', id: 'player', at: T_YOU.at, yaw: T_YOU.yaw },
    cut(DT.single('tansy', 'ms', { height: 'high' })),
    { do: 'sfx', id: 'cloth', at: 'tansy', gain: 0.3, async: true },
    { do: 'spawn', id: 'key' },
    { do: 'sfx', id: 'keys', at: 'tansy', gain: 0.5, async: true },
    { do: 'wait', s: 1.7 },
    cut(DT.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Tomorrow it is my problem too. Good night.' },
    { do: 'despawn', id: 'tansy' },
    { do: 'despawn', id: 'key' },
    { do: 'despawn', id: 'player' },
    // Door 4: Granny, the porch, the empty pie tin.
    { do: 'spawn', id: 'granny' },
    { do: 'spawn', id: 'player', at: G_YOU.at, yaw: G_YOU.yaw },
    cut(DG.single('granny', 'mcu', { height: 'low' })),
    { do: 'sfx', id: 'creak', at: 'granny', gain: 0.4, async: true },
    { do: 'say', who: 'granny', text: 'My own roof, sugar. Somewhere to come home to.' },
    { do: 'gesture', who: 'granny', name: 'wave', s: 1.2, async: true },
    cut(pullOut('granny', 'mcu', 3.0, { to: 'fs', toward: 'player', side: 30 })),
    { do: 'wait', s: 1.4 },
  ],
};

// ---- 3. Outro: the roof ------------------------------------------------------------------------------------------------------
const R_PIP = markOf(ROOF, 'pip');
const R_YOU = markOf(ROOF, 'player');
/** The deck of the roof terrace (stage m68-roof's viewing platform, set dressing laid over the mansard: deck top 14.4 m up). */
const ROOF_H = 14.4;

const deck = (x: number, z: number, dy = 0): Vec3 => up(x, z, ROOF_H + dy);
/** The Combine sits where it was built, in the yard of the Compost Heap far to the west-north-west, its headlamps lit all night. */
const FAR: Vec2 = [-232, -66];
const ROOF_TALK = coverage('pip', 'player', 1);

/**
 * Late night on the roof of Saucer Court. Pip and the player lean on the north rail with a cocoa each. The lit windows of Turfton
 * below, the Combine's glow on the horizon. Pip says what he is going to have to say tomorrow, and thanks the player for the couch;
 * the player has one line. Then ten seconds with no line at all: the city, the glow, a far engine, the two of them. No gag on top.
 */
export const M68_OUTRO: SceneScript = {
  id: 'm68-lights-out-outro',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'turfton-dusk',
  ambience: 'night',
  radio: 0,
  direction: { notes: `${NOTES}m68-lights-out-outro.md`, kind: 'outro' },
  actors: [
    { id: 'pip', preset: 'pip', held: 'cocoa-mug', at: deck(R_PIP.at[0], R_PIP.at[1]), yaw: Math.PI },
    { id: 'player', player: true, held: 'cocoa-mug', at: deck(R_YOU.at[0], R_YOU.at[1]), yaw: Math.PI },
  ],
  props: [
    { id: 'toolbox', prefab: 'glaze-extra-toolbox', at: deck(27.3, 73.4), yaw: 0.6, size: 0.7, by: 'w' },
    { id: 'crate', prefab: 'crate', at: deck(32.9, 74.6), yaw: 0.2, size: 0.8, by: 'w' },
    // The Combine, a lit shape far off on the horizon, headlights on.
    { id: 'combine', prefab: 'grand-combine-boss', at: [FAR[0], FAR[1]], yaw: 1.08, size: 14, by: 'w' },
  ],
  steps: [
    // Hook: from the south edge of the roof, over their shoulders: the lit city, the glow, a far engine.
    cut({ kind: 'dolly', from: deck(30.2, 79.4, 2.4), to: deck(30.2, 76.6, 1.8), look: deck(29.6, 60, 1.2), s: 5.0, fov: 50 }),
    { do: 'sfx', id: 'creak', at: 'pip', gain: 0.3, async: true },
    { do: 'wait', s: 2.6 },
    // Setup: Pip, looking at the glow.
    cut(ROOF_TALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'That orange. The sunset was hours ago.' },
    beat('pause'),
    // Turn: what he will have to say tomorrow.
    cut(pushIn('pip', 'mcu', 5.0, { to: 'cu', toward: 'player', side: 25 })),
    { do: 'say', who: 'pip', text: 'Tomorrow somebody says go. Tansy says it is me.' },
    cut(ROOF_TALK.single('player', 'mcu', { height: 'low' })),
    { do: 'say', who: 'player', text: 'You will say it right.' },
    cut(ROOF_TALK.single('pip', 'mcu')),
    { do: 'sfx', id: 'cloth', at: 'pip', gain: 0.3, async: true },
    { do: 'say', who: 'pip', text: 'Thanks for the couch.' },
    // The silence: music out, ambience only, nobody speaks for the last ten seconds. Something small happens every few seconds.
    { do: 'music', track: null, fade: 2.0 },
    cut(ROOF_TALK.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'nod', s: 1.2, async: true },
    { do: 'sfx', id: 'flutter', at: deck(30, 72, 5), gain: 0.3, async: true },
    { do: 'wait', s: 2.0 },
    cut({ kind: 'cut', pos: deck(33.4, 75.6, 1.5), look: up(FAR[0], FAR[1], 6), fov: 26 }),
    { do: 'sfx', id: 'static', at: 'pip', gain: 0.15, async: true },
    { do: 'wait', s: 2.6 },
    cut(pullOut('pip', 'ms', 6.0, { to: 'ws', toward: 'player', side: 60, height: 'high' })),
    { do: 'sfx', id: 'creak', at: 'pip', gain: 0.25, async: true },
    { do: 'gesture', who: 'pip', name: 'lean', s: 2.0, async: true },
    { do: 'wait', s: 3.0 },
    { do: 'sfx', id: 'bell', at: deck(30, 60), gain: 0.15, async: true },
    { do: 'wait', s: 3.0 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm68-lights-out-intro': M68_INTRO,
  'm68-lights-out-mid': M68_MID,
  'm68-lights-out-outro': M68_OUTRO,
};
