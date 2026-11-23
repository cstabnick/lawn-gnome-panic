// Castaway's Dry-Dock (Driftwood). Melancholy and slow: a bell nobody answers, few words, golden sky going to dusk,
// 'sad' music under 'wind', then 'water'. Re-directed against docs/design/gnome-theft-auto/direction/bible.md; notes per
// scene in docs/design/gnome-theft-auto/direction/scenes/sq-castaway-drydock-*.md. Staged at driftwood-trailer (intro)
// and canal-raft (payoff) in quests/stages/cloverfield.ts.
import type { CamShot, SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { above, markOf, stageCut, walkOf } from './kit';

const TRAILER = 'driftwood-trailer';
const RAFT = 'canal-raft';
const TRAILER_PLAYER = markOf(TRAILER, 'player');
const TRAILER_WALK = walkOf(TRAILER, 'driftwood');
const RAFT_PLAYER = markOf(RAFT, 'player');
const RAFT_DRIFT = markOf(RAFT, 'driftwood');

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

/** Driftwood rings his bell on the trailer's clover side; the player walks up to him from the hitch. */
const DRIFT_AT: Vec2 = [18, 452];
const YOU_AT: Vec2 = [21.5, 465];

/** The intro's two-hander, one side of the line for every single. */
const TALK = coverage('driftwood', 'you', 1);

export const CASTAWAY_INTRO: SceneScript = {
  id: 'sq-castaway-drydock-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: "Castaway's Dry-Dock",
  music: 'sad',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-castaway-drydock-intro.md', kind: 'intro' },
  actors: [
    { id: 'you', player: true, at: TRAILER_PLAYER.at, yaw: towards(TRAILER_PLAYER.at, DRIFT_AT) },
    { id: 'driftwood', preset: 'driftwood', at: DRIFT_AT, yaw: towards(DRIFT_AT, YOU_AT), held: 'gunmod-charm-bell' },
  ],
  vehicles: [{ id: 'combine', kind: 'combine', at: [30, 460], yaw: Math.PI }],
  steps: [
    // 1. Hook: the bell rings at a sea of clover, and nobody answers.
    cut(shot('driftwood', 'ms', { toward: 'you', side: 40 })),
    { do: 'gesture', who: 'driftwood', name: 'wave', s: 1.4, async: true },
    { do: 'sfx', id: 'glass', at: 'driftwood', gain: 0.4 },
    { do: 'walk', who: 'you', path: [YOU_AT], speed: 1.2, async: true },
    beat('pause'),
    // 2. Setup: his one great line, then the straight man's correction.
    cut(TALK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'Tide\'s coming in. I can feel it in my hat.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'That\'s clover, Driftwood.' },
    cut(TALK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'That\'s the sea before it learns to swim.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Six months? For clover?' },
    cut(TALK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'HOA drained the ponds. Brenda got the canal. Lawn-chair republic.' },
    // 3. The job, in his voice: hitch it, haul it, one line at a time.
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'And your raft?' },
    cut(TALK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'Under me. Hitch it to that combine.' },
    ...reaction('you', { toward: 'driftwood', size: 'mcu', side: -25, hold: 'pause' }),
    cut(TALK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'Haul it to the Southern Drainage Canal.' },
    // 4. Turn: the light is going. He looks up, and the combine waits in the stubble.
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Is that far?' },
    cut(TALK.single('driftwood', 'mcu')),
    { do: 'gesture', who: 'driftwood', name: 'think', s: 1.0 },
    { do: 'say', who: 'driftwood', text: 'Sun\'s going.' },
    cut({ kind: 'cut', pos: above(38, 448, 2.6), look: above(30, 458, 1.2), fov: 40 }),
    beat('pause'),
    // 5. Button: his last warning, then the bell once more, and nobody answers.
    cut(TALK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'Mind the lawn sharks. Nobody believes me about the lawn sharks.' },
    // The last picture: the bell rung once more, from the far side, and nobody at the trailer answers.
    cut(shot('driftwood', 'ms', { toward: 'you', side: -50 })),
    { do: 'gesture', who: 'driftwood', name: 'wave', s: 1.4, async: true },
    { do: 'sfx', id: 'glass', at: 'driftwood', gain: 0.4 },
    { do: 'wait', s: 2.5 },
  ],
};

/** Driftwood on the raft, framed from the bank above the gunwale so his head stays in the shot. */
const RAFT_SPEAKER: CamShot = { kind: 'cut', pos: above(53, 222, 2.4), look: above(49.5, 228, 1.3), fov: 30 };

/** The payoff: the raft goes in, Driftwood is afloat, and something sings under the hull. */
const RAFT_TALK = coverage('driftwood', 'you', 1);

export const CASTAWAY_OUTRO: SceneScript = {
  id: 'sq-castaway-drydock-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: "Castaway's Dry-Dock",
  music: 'sad',
  ambience: 'water',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-castaway-drydock-outro.md', kind: 'outro' },
  actors: [
    { id: 'you', player: true, seatedIn: 'hauler', at: [60, 217], yaw: -Math.PI / 2 },
    { id: 'driftwood', preset: 'driftwood', hidden: true, seatedIn: 'raft', at: RAFT_DRIFT.at, yaw: RAFT_DRIFT.yaw },
  ],
  vehicles: [
    { id: 'hauler', kind: 'combine', from: 'player', at: [60, 217], yaw: -Math.PI / 2 },
    { id: 'raft', kind: 'walnut-dinghy', at: [46, 228], yaw: Math.PI / 2, hidden: true },
  ],
  steps: [
    // 1. Hook: the raft is on the bank, and the picture is the splash.
    { do: 'cam', shot: stageCut(RAFT, 'arrival') },
    { do: 'caption', text: 'Southern Drainage Canal. Brown water, gold light, and frogs making a case.' },
    { do: 'exit', who: 'you' },
    { do: 'walk', who: 'you', path: [RAFT_PLAYER.at], speed: 2.0, async: true },
    { do: 'caption', text: null },
    { do: 'spawn', id: 'raft' },
    { do: 'spawn', id: 'driftwood' },
    { do: 'sfx', id: 'splash', at: 'raft', gain: 0.6 },
    { do: 'drive', vehicle: 'raft', path: [[46, 228], [50, 228]], speed: 0.8, async: true },
    cut(RAFT_SPEAKER),
    { do: 'gesture', who: 'driftwood', name: 'stand', s: 0.8 },
    // 2. Afloat: the joke, the straight man, the joke again.
    { do: 'say', who: 'driftwood', text: 'Oh. It floats. Six months on a trailer and it still floats.' },
    // The player is framed on the eyeline to the raft, from the side that matches Driftwood's shots (no line jump).
    { do: 'face', who: 'you', at: 'driftwood', s: 0.5 },
    cut(shot('you', 'mcu', { toward: 'driftwood', side: 60 })),
    { do: 'say', who: 'you', text: 'Was it supposed to float?' },
    cut(RAFT_SPEAKER),
    { do: 'say', who: 'driftwood', text: 'Don\'t say anything. I\'m not talking. I\'m floating.' },
    ...reaction('you', { toward: 'driftwood', size: 'mcu', side: -25, hold: 'pause' }),
    cut(RAFT_SPEAKER),
    { do: 'say', who: 'driftwood', text: 'Captain\'s hat\'s in the trailer. Yours, if you row.' },
    // 3. Turn: music out, the hull rings far to the north, and he hears it before we do.
    { do: 'music', track: null, fade: 0.6 },
    { do: 'sfx', id: 'thud', at: 'raft', gain: 0.3 },
    { do: 'shake', amp: 0.02, s: 1.0 },
    { do: 'stinger', id: 'mystery' },
    beat('pause'),
    cut({ kind: 'cut', pos: above(53, 222, 1.9), look: above(49.5, 228, 1.5), fov: 26 }),
    { do: 'say', who: 'driftwood', text: 'Hear that? Under the hull. Far north.' },
    // 4. Button: no more words. The camera pulls out over the water, north, past him.
    { do: 'music', track: 'mystery', fade: 1.5 },
    cut({ kind: 'dolly', from: above(46, 232, 1.5), to: above(44, 204, 3.5), look: above(44, 186, 4), s: 6, fov: 40 }),
    { do: 'wait', s: 2.0 },
  ],
};

export const CASTAWAY_SCENES: SceneScript[] = [CASTAWAY_INTRO, CASTAWAY_OUTRO];
