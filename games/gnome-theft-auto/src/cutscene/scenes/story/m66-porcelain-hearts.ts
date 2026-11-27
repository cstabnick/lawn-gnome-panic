// Story row 66 (m66-porcelain-hearts): Porcelain Hearts. The sincere low of act IV, and the quietest scenes in the game. Three scenes at
// dusk on the old porch in Mossy Wood: Clara waiting at her hollow log with the lantern unlit; the player and Clara crossing the HOA's
// seal tape to the door she sealed years ago; and the photograph in her hands (two gnomes on a step, a hair-fine crack under one
// hat), the plea, and the photograph given. No gag anywhere: the next row opens with Hedda's. Clara counts, trails off, and never
// says "the Tall House": she says "the porch". The lantern stays unlit from the first shot to the last.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m66-porcelain-hearts-{intro,mid,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, insert, pushIn, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const PORCH = 'm66-porch-log';

const LOG_CLARA = markOf(PORCH, 'clara', 0);
const LOG_PLAYER = markOf(PORCH, 'player', 0);
const TAPE_CLARA = markOf(PORCH, 'clara', 1);
const TAPE_PLAYER = markOf(PORCH, 'player', 1);
const STEP_CLARA = markOf(PORCH, 'clara', 2);
const STEP_PLAYER = markOf(PORCH, 'player', 2);
/** Past the tape, and where the framed photograph stands on the boards. */
const PAST_TAPE: Vec2 = [-552.4, 42.0];
const PAST_TAPE_C: Vec2 = [-552.2, 40.6];
const PHOTO: Vec2 = [-552.6, 40.6];
const toward = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- 1. Intro: the log (dusk) -----------------------------------------------------------------------------------------------
const WAIT = coverage('clara', 'player', 1);

/**
 * Dusk, the hollow log below the porch steps. Clara counts the refugees she took to the oak stump tonight (four, all whole), the
 * porcelain lantern in her hand unlit. The player comes up the path. She has not crossed the porch since she sealed it; she knows
 * the face the Combine wears. Her sentences end early. She asks the player to come across with her, and does not light the lantern.
 */
export const M66_INTRO: SceneScript = {
  id: 'm66-porcelain-hearts-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'fescue',
  ambience: 'forest',
  radio: 0.1,
  title: 'Porcelain Hearts',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m66-porcelain-hearts-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: [LOG_PLAYER.at[0], LOG_PLAYER.at[1] - 7], yaw: 0, hidden: true },
    { id: 'clara', preset: 'clara', at: LOG_CLARA.at, yaw: LOG_CLARA.yaw },
  ],
  steps: [
    // 1. Hook: a porch with nobody on it, a lantern chain ticking, a pale figure at the mouth of a log.
    cut(spot(PORCH, 'wide')),
    { do: 'sfx', id: 'creak', at: 'clara', gain: 0.35, async: true },
    { do: 'wait', s: 2.6 },
    // 2. Setup: she counts, because counting is how she keeps them.
    cut(WAIT.single('clara', 'mcu', { height: 'low' })),
    { do: 'say', who: 'clara', text: 'Four to the oak stump tonight. Four. All of them whole.' },
    { do: 'intro', who: 'clara', s: 2.4 },
    // 3. The player comes up the path; she was not sure she would ask.
    { do: 'spawn', id: 'player' },
    cut(shot('player', 'ms', { toward: 'clara', side: 30 })),
    { do: 'walk', who: 'player', path: [LOG_PLAYER.at], speed: 1.4, async: true },
    { do: 'sfx', id: 'footsteps', at: 'player', gain: 0.3, async: true },
    { do: 'wait', s: 2.6 },
    cut(WAIT.single('clara', 'mcu')),
    { do: 'say', who: 'clara', text: 'Thank you for coming. I was not sure I would ask.' },
    cut(WAIT.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'The Combine has a face now.' },
    // 4. Turn: she does not say his name. She says the one thing she cannot.
    cut(pushIn('clara', 'mcu', 4.2, { to: 'cu', toward: 'player', side: 25 })),
    { do: 'say', who: 'clara', text: 'I know the face.' },
    beat('pause'),
    { do: 'say', who: 'clara', text: 'I have not crossed the porch since I sealed it.' },
    // 5. The ask, and the lantern she will not light.
    cut(WAIT.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'nod', s: 1.0, async: true },
    { do: 'wait', s: 1.0 },
    cut(WAIT.single('clara', 'mcu', { height: 'low' })),
    { do: 'say', who: 'clara', text: 'Come with me. There is something I cannot tell you from here.' },
    { do: 'music', track: 'sad', fade: 2.5 },
    // 6. Button: the sealed door and the new tape stirring in the draught; the lantern stays dark.
    cut(spot(PORCH, 'tape')),
    { do: 'sfx', id: 'flutter', at: up(-551, 41, 1.0), gain: 0.3, async: true },
    { do: 'wait', s: 3.0 },
  ],
};

// ---- 2. Mid: the tape (arrival) ---------------------------------------------------------------------------------------------
const TAPE = coverage('clara', 'player', -1);

/**
 * The seal tape across the sealed door. Clara stops with one hand not quite touching it. She sealed the door herself, years ago; now
 * the Association has sealed it too, twice shut. The player lifts the tape and she tells them to mind it, it is new, and goes under.
 * The scene ends on the boards by the wall where the photograph stands.
 */
export const M66_MID: SceneScript = {
  id: 'm66-porcelain-hearts-mid',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'sad',
  ambience: 'forest',
  radio: 0.1,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m66-porcelain-hearts-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: TAPE_PLAYER.at, yaw: toward(TAPE_PLAYER.at, [-552.4, 41.2]) },
    { id: 'clara', preset: 'clara', at: TAPE_CLARA.at, yaw: TAPE_CLARA.yaw },
  ],
  props: [{ id: 'photo', prefab: 'porch-photograph', at: PHOTO, yaw: Math.PI / 2, size: 0.34, by: 'h' }],
  steps: [
    // 1. Hook: the tape, low, stirring; a board that creaks under no one.
    cut(spot(PORCH, 'tape')),
    { do: 'sfx', id: 'creak', at: up(-551, 41, 0.5), gain: 0.4, async: true },
    { do: 'wait', s: 1.8 },
    // 2. She stops at it.
    cut(TAPE.single('clara', 'mcu', { height: 'low' })),
    { do: 'say', who: 'clara', text: 'I sealed it myself. Years ago.' },
    cut(insert('clara', { toward: 'player', side: 30 })),
    { do: 'sfx', id: 'cloth', at: 'clara', gain: 0.3, async: true },
    { do: 'wait', s: 1.3 },
    cut(TAPE.single('clara', 'mcu')),
    { do: 'say', who: 'clara', text: 'Now they have sealed it too. Twice shut.' },
    // 3. The player lifts the tape.
    cut(shot('player', 'mcu', { toward: 'clara', side: -25 })),
    { do: 'gesture', who: 'player', name: 'lean', s: 1.4, async: true },
    { do: 'sfx', id: 'rustle', at: 'player', gain: 0.4, async: true },
    { do: 'wait', s: 1.0 },
    cut(TAPE.single('clara', 'mcu', { height: 'low' })),
    { do: 'say', who: 'clara', text: 'Mind the tape. It is new.' },
    // 4. They cross together; the camera stays on the boards, where the frame is.
    { do: 'walk', who: 'clara', path: [PAST_TAPE_C], speed: 1.0, async: true },
    { do: 'walk', who: 'player', path: [PAST_TAPE], speed: 1.0, async: true },
    cut({ kind: 'dolly', from: up(-548.6, 43.0, 1.1), to: up(-550.4, 41.8, 0.9), look: up(PHOTO[0], PHOTO[1], 0.25), s: 3.2, fov: 40 }),
    { do: 'sfx', id: 'footsteps', at: 'clara', gain: 0.25, async: true },
    { do: 'wait', s: 3.4 },
  ],
};

// ---- 3. Outro: the photograph (dusk) ----------------------------------------------------------------------------------------
const PLEA = coverage('clara', 'player', 1);

/**
 * Deeper dusk on the porch steps. The photograph is in Clara's hands, the lantern set down unlit on the step. "He was one of us on the
 * porch." Under the hat, a hair: she saw it first. She asks that he be stopped, not broken, and trails off on the second word. She
 * puts the photograph in the player's hands and tells them to hold it by the frame. The last shot holds her, small, in the dusk.
 */
export const M66_OUTRO: SceneScript = {
  id: 'm66-porcelain-hearts-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'sad',
  ambience: 'night',
  radio: 0.08,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m66-porcelain-hearts-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: STEP_PLAYER.at, yaw: STEP_PLAYER.yaw },
    { id: 'clara', preset: 'clara', held: 'porch-photograph', at: STEP_CLARA.at, yaw: STEP_CLARA.yaw },
  ],
  props: [{ id: 'lantern', prefab: 'porcelain-lantern', at: [STEP_CLARA.at[0] + 1.0, STEP_CLARA.at[1] - 0.4], yaw: 0.4, size: 0.6, by: 'h' }],
  steps: [
    // 1. Hook: the paper of the photograph under her thumb.
    cut(PLEA.single('clara', 'mcu', { height: 'low' })),
    { do: 'sfx', id: 'paper', at: 'clara', gain: 0.35, async: true },
    { do: 'say', who: 'clara', text: 'He was one of us on the porch.' },
    cut(PLEA.single('player', 'mcu')),
    beat('pause'),
    // 2. Under the hat: she saw it first.
    cut(pushIn('clara', 'mcu', 3.6, { to: 'cu', toward: 'player', side: 25 })),
    { do: 'say', who: 'clara', text: 'Under the hat. A hair. I saw it first.' },
    beat('pause'),
    // 3. The ask. She stops on the second word, and has to start again.
    cut(PLEA.single('clara', 'mcu')),
    { do: 'say', who: 'clara', text: 'Stop him. Please. Do not...' },
    cut(PLEA.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'I will.' },
    cut(PLEA.single('clara', 'cu')),
    { do: 'say', who: 'clara', text: 'Do not break him.' },
    // 4. She gives the photograph.
    cut(insert('clara', { toward: 'player', side: 20 })),
    { do: 'give', from: 'clara', to: 'player', prop: 'porch-photograph', s: 1.4 },
    { do: 'sfx', id: 'cloth', at: 'player', gain: 0.3, async: true },
    cut(PLEA.single('clara', 'mcu')),
    { do: 'say', who: 'clara', text: 'By the frame. The picture scratches.' },
    // 5. Button: the last light on a small figure and a lantern that stays dark.
    cut(shot('clara', 'ms', { toward: 'player', side: 40, height: 'low' })),
    { do: 'say', who: 'clara', text: 'Slowly, please. We break in the small places.' },
    { do: 'music', track: null, fade: 3.0 },
    { do: 'wait', s: 3.0 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm66-porcelain-hearts-intro': M66_INTRO,
  'm66-porcelain-hearts-mid': M66_MID,
  'm66-porcelain-hearts-outro': M66_OUTRO,
};
