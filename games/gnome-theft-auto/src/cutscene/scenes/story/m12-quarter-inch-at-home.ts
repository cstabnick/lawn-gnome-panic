// Story row 12 (m12-quarter-inch-at-home): Quarter-Inch at Home. Four scenes: Juniper's terrace (the calipers and a forged
// pass), the Patio Gate (Gary reads a signature and not a pass), the back fence (Reginald, the photograph) and the
// doorframe (Reginald measures twice and says nothing about the stranger).
// Notes: docs/design/gnome-theft-auto/direction/scenes/quarter-inch-{intro,gate,mid,outro}.md
import type { SceneScript } from '../../script';
import { beat, coverage, cut, insert, pushIn, reaction, shot } from '../../direct';
import { markOf, spot } from './kit';

const TERRACE = 'juniper-terrace';
const GATE = 'patio-gate';
const FENCE = 'townhouse-back-fence';
const FRONT = 'townhouse-404';

const JUNIPER = markOf(TERRACE, 'juniper');
const TERRACE_PLAYER = markOf(TERRACE, 'player');
const GATE_PLAYER = markOf(GATE, 'player');
const GATE_GARY = markOf(GATE, 'gary');
const FENCE_REGINALD = markOf(FENCE, 'reginald');
const FENCE_PLAYER = markOf(FENCE, 'player');
const FRONT_REGINALD = markOf(FRONT, 'reginald');

/** Juniper and the player: one side of the line all scene. */
const TALK = coverage('juniper', 'player', 1);
/** Gary and the player at the gate. */
const GATEKEEP = coverage('gary', 'player', 1);
/** Reginald and the player at the fence; Reginald is shot from a little above (he is crouched: the bible's high angle). */
const FENCE_TALK = coverage('reginald', 'player', -1);

/**
 * Juniper's terrace, morning. She cannot ask her brother why he signed the permits, so she hands the player a pair of
 * calipers that read a quarter-inch long and a pass in her brother's handwriting. Funny first: the funeral, the
 * flowers, "excellent". Sets up the photograph (she says nothing about it) and the doubt the swap plants.
 */
export const QUARTER_INCH_INTRO: SceneScript = {
  id: 'quarter-inch-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'turfton',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/quarter-inch-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: TERRACE_PLAYER.at, yaw: TERRACE_PLAYER.yaw },
    { id: 'juniper', preset: 'juniper', held: 'gta-can-cola', at: JUNIPER.at, yaw: JUNIPER.yaw },
  ],
  steps: [
    // Hook: Kerb Row at nine, the council bike with its ticket, and a can opening. Sound first, then her.
    cut(spot(TERRACE, 'wide')),
    { do: 'sfx', id: 'pop', at: 'juniper', gain: 0.55, async: true },
    { do: 'wait', s: 1.4 },
    cut(TALK.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'Reginald signed the Even-Estates permits. I cannot ask him why.' },
    cut(TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Why not ask him?' },
    cut(TALK.single('juniper', 'mcu', { height: 'low' })),
    { do: 'say', who: 'juniper', text: 'We last spoke at a funeral. He measured the flowers.' },
    // The player's face takes it.
    ...reaction('player', { toward: 'juniper', hold: 'pause' }),
    // The calipers, from her hand to theirs.
    { do: 'sfx', id: 'paper', at: 'juniper', gain: 0.5, async: true },
    { do: 'give', from: 'juniper', to: 'player', prop: 'brass-calipers', s: 1 },
    cut(insert('player', { toward: 'juniper' })),
    { do: 'wait', s: 1.1 },
    cut(TALK.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'These read a quarter-inch long. Swap them for his. Townhouse four-oh-four.' },
    cut(TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'He will notice.' },
    // The turn: the point of the whole job is in her answer.
    cut(pushIn('juniper', 'mcu', 3.2, { toward: 'player', side: 25 })),
    { do: 'say', who: 'juniper', text: 'He will measure it twice. Then he will wonder.' },
    beat('beat'),
    // The pass, and the button.
    { do: 'sfx', id: 'paper', at: 'juniper', gain: 0.5, async: true },
    { do: 'give', from: 'juniper', to: 'player', prop: 'letter-of-passage', s: 1 },
    cut(TALK.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'Gary guards the gate. The pass is forged. It is excellent.' },
    cut(TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Excellent how?' },
    cut(TALK.single('juniper', 'mcu', { height: 'low' })),
    { do: 'say', who: 'juniper', text: 'His sevens. I have had forty years of his sevens.' },
    beat('pause'),
  ],
};

/**
 * The Patio Gate, on arrival with the forged pass: Gary reads the signature and not the pass, cites a section of a book
 * he has not read, and waves the player in. His intro card lands after his second line (his first on screen).
 */
export const QUARTER_INCH_GATE: SceneScript = {
  id: 'quarter-inch-gate',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'turfton',
  ambience: 'garden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/quarter-inch-gate.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: GATE_PLAYER.at, yaw: GATE_PLAYER.yaw },
    { id: 'gary', preset: 'gary', at: GATE_GARY.at, yaw: GATE_GARY.yaw },
  ],
  steps: [
    // Hook: a 900-page binder dropped on a sentry-box shelf, and Gary coming out to meet it.
    cut(spot(GATE, 'two-shot')),
    { do: 'sfx', id: 'thud', at: 'gary', gain: 0.6, async: true },
    { do: 'walk', who: 'gary', path: [[148.2, -130.4]], speed: 1.3, async: true },
    { do: 'wait', s: 1.6 },
    { do: 'face', who: 'player', at: 'gary', s: 0.4, async: true },
    cut(GATEKEEP.single('gary', 'mcu')),
    { do: 'say', who: 'gary', text: 'Sigh. Pass.' },
    { do: 'sfx', id: 'paper', at: 'gary', gain: 0.5, async: true },
    { do: 'give', from: 'player', to: 'gary', prop: 'letter-of-passage', s: 0.9 },
    cut(GATEKEEP.single('gary', 'ms')),
    { do: 'gesture', who: 'gary', name: 'think', s: 1.6, async: true },
    { do: 'say', who: 'gary', text: 'Sigh. Vance. R. Vance. Very neat.' },
    { do: 'intro', who: 'gary' },
    cut(GATEKEEP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Is it good?' },
    cut(GATEKEEP.single('gary', 'mcu')),
    { do: 'say', who: 'gary', text: 'Sigh. Section nine. Hats must be level.' },
    cut(GATEKEEP.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'tipHat', s: 1.0, async: true },
    beat('pause'),
    cut(GATEKEEP.single('gary', 'mcu')),
    { do: 'say', who: 'gary', text: 'Sigh. Wave through. Do not smoke.' },
    cut(GATEKEEP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'I do not smoke.' },
    cut(GATEKEEP.single('gary', 'mcu')),
    { do: 'say', who: 'gary', text: 'Sigh. Not yet.' },
    // Button: the player walks in past the sentry box; Gary goes back to his stool.
    { do: 'sfx', id: 'latch', at: 'gary', gain: 0.5, async: true },
    cut(spot(GATE, 'wide')),
    { do: 'walk', who: 'player', path: [[149.4, -131.2]], speed: 1.6, async: true },
    { do: 'walk', who: 'gary', path: [[145.5, -133.2]], speed: 1.0, async: true },
    { do: 'wait', s: 2.6 },
  ],
};

/**
 * The back fence behind townhouse 404: Reginald, crouched at a post with the swapped calipers, reading everything a
 * quarter-inch over. Funny (the fence was exact at breakfast; ajar is a legal state), then the photograph, played
 * straight: no stinger, no music, one held silence, and no gag on it. His last line is a man coping.
 */
export const QUARTER_INCH_MID: SceneScript = {
  id: 'quarter-inch-mid',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'turfton',
  ambience: 'garden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/quarter-inch-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: FENCE_PLAYER.at, yaw: FENCE_PLAYER.yaw },
    { id: 'reginald', preset: 'reginald', at: FENCE_REGINALD.at, yaw: FENCE_REGINALD.yaw },
  ],
  steps: [
    // Hook: calipers ticking on a post, and the number he does not like.
    cut(insert('reginald', { toward: 'player' })),
    { do: 'sfx', id: 'tap', at: 'reginald', gain: 0.6, async: true },
    { do: 'wait', s: 0.8 },
    { do: 'say', who: 'reginald', text: 'Quarter-inch over. Again.' },
    cut(FENCE_TALK.single('reginald', 'mcu', { height: 'high' })),
    { do: 'say', who: 'reginald', text: 'The fence was exact at breakfast.' },
    ...reaction('player', { toward: 'reginald', hold: 'beat' }),
    { do: 'face', who: 'reginald', at: 'player', s: 0.5 },
    cut(FENCE_TALK.single('reginald', 'mcu', { height: 'high' })),
    { do: 'say', who: 'reginald', text: 'I came home early. The door was ajar.' },
    cut(FENCE_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Ajar?' },
    cut(FENCE_TALK.single('reginald', 'mcu', { height: 'high' })),
    { do: 'say', who: 'reginald', text: 'Ajar is a legal state. Open is not.' },
    beat('beat'),
    // The turn: he does not accuse. He asks about the photograph.
    cut(pushIn('reginald', 'mcu', 3.4, { toward: 'player', side: -25, height: 'high' })),
    { do: 'say', who: 'reginald', text: 'Did you look at the photograph?' },
    cut(FENCE_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Yes.' },
    // Played straight: the music goes out, nothing is added.
    { do: 'music', track: null, fade: 0.6 },
    cut(FENCE_TALK.single('reginald', 'mcu', { height: 'high' })),
    { do: 'gesture', who: 'reginald', name: 'slump', s: 1.4, async: true },
    { do: 'say', who: 'reginald', text: 'Eight and ten. She held the ruler. I held the pencil.' },
    // The held silence is the player's face, not a second look at his.
    cut(FENCE_TALK.single('player', 'mcu')),
    beat('silence'),
    cut(FENCE_TALK.single('reginald', 'mcu', { height: 'high' })),
    { do: 'say', who: 'reginald', text: 'It hangs level. I check it every morning.' },
    { do: 'music', track: 'turfton-dusk', fade: 2.2 },
    beat('beat'),
    // Coping: he goes back to the post, and the player is free to leave by the fence.
    { do: 'face', who: 'reginald', yaw: -Math.PI / 2, s: 0.6, async: true },
    cut(FENCE_TALK.single('reginald', 'ms', { height: 'high' })),
    { do: 'say', who: 'reginald', text: 'The back fence is a quarter-inch low. I will be here a while.' },
    { do: 'sfx', id: 'tap', at: 'reginald', gain: 0.5, async: true },
    { do: 'walk', who: 'player', path: [[92.8, -167.4]], speed: 1.2, async: true },
    beat('pause'),
  ],
};

/**
 * The doorframe, afternoon: Reginald measures his own door with the calipers that read long, and measures it again.
 * He looks down the street towards Kerb Row and says nothing about the stranger. Almost silent: foley and a held ending.
 */
export const QUARTER_INCH_OUTRO: SceneScript = {
  id: 'quarter-inch-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'garden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/quarter-inch-outro.md', kind: 'outro' },
  actors: [{ id: 'reginald', preset: 'reginald', at: FRONT_REGINALD.at, yaw: FRONT_REGINALD.yaw }],
  steps: [
    // Hook: the calipers against the frame, a tick, and the reading.
    cut(insert('reginald', { side: 40 })),
    { do: 'sfx', id: 'tap', at: 'reginald', gain: 0.6, async: true },
    { do: 'wait', s: 2.0 },
    cut(shot('reginald', 'mcu', { side: 35, height: 'high' })),
    { do: 'say', who: 'reginald', text: 'Quarter-inch.' },
    { do: 'sfx', id: 'clink', at: 'reginald', gain: 0.45, async: true },
    { do: 'gesture', who: 'reginald', name: 'think', s: 1.4, async: true },
    beat('pause'),
    // Twice.
    cut(insert('reginald', { side: -40 })),
    { do: 'sfx', id: 'tap', at: 'reginald', gain: 0.6, async: true },
    { do: 'wait', s: 1.2 },
    cut(shot('reginald', 'mcu', { side: -30, height: 'high' })),
    { do: 'say', who: 'reginald', text: 'Again.' },
    beat('beat'),
    // He stands and looks down the street, towards Kerb Row. Wide and still. Nobody speaks.
    { do: 'face', who: 'reginald', yaw: -Math.PI / 4, s: 0.9, async: true },
    cut(spot(FRONT, 'door')),
    { do: 'gesture', who: 'reginald', name: 'stand', s: 0.4, async: true },
    { do: 'sfx', id: 'cloth', at: 'reginald', gain: 0.4, async: true },
    { do: 'wait', s: 2.4 },
    // The button: he goes in and leaves the door ajar.
    { do: 'sfx', id: 'door-creak', at: 'reginald', gain: 0.5, async: true },
    { do: 'walk', who: 'reginald', path: [[102.1, -136.5]], speed: 1.1 },
    { do: 'despawn', id: 'reginald' },
    cut(spot(FRONT, 'wide')),
    { do: 'wait', s: 2.6 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'quarter-inch-intro': QUARTER_INCH_INTRO,
  'quarter-inch-gate': QUARTER_INCH_GATE,
  'quarter-inch-mid': QUARTER_INCH_MID,
  'quarter-inch-outro': QUARTER_INCH_OUTRO,
};
