// Story row 33 (m33-the-bench-lock): The Bench Lock. Three scenes: Tansy turning the old lock over at her bench and sending
// the player and Cam to Hogweed; Hogweed's yard under the Span (the lock tested, the Dewdrop rolling past again, Cam looking at
// the lock and not at the Dewdrop); and dusk at the bench, Tansy setting the code with Cam at her elbow and the broom in his
// hand. The player sees nothing wrong with Cam, and neither does the scene. The Golden Acorn is never named.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m33-the-bench-lock-{intro,mid,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, insert, pushIn, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const BENCH = 'side-valve-bench';
const UNDERSPAN = 'hogweed';
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- 1. Intro: the old lock ---------------------------------------------------------------------------------------------------
const B_TANSY = markOf(BENCH, 'tansy');
const B_CAM = markOf(BENCH, 'turncoat-cam');
const B_YOU = markOf(BENCH, 'player');
/** Cam sweeps the apron south-east of the bench, then is called over. */
const CAM_SWEEP: Vec2 = [-151.2, 68.4];
const CAM_CALLED: Vec2 = [-154.6, 70.8];
const BENCH_TOP: Vec2 = [-158.4, 76];
const BENCH_TALK = coverage('tansy', 'player', 1);

/** Day at the bay. Tansy turns the old lock over and does not look up; what sleeps under the bench needs a proper one. */
export const M33_INTRO: SceneScript = {
  id: 'm33-the-bench-lock-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'turfton',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m33-the-bench-lock-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: B_YOU.at, yaw: B_YOU.yaw },
    { id: 'tansy', preset: 'tansy', held: 'bench-lock', at: B_TANSY.at, yaw: B_TANSY.yaw },
    { id: 'cam', preset: 'turncoat cam', name: 'Cam', at: CAM_SWEEP, yaw: towards(CAM_SWEEP, B_TANSY.at) },
  ],
  steps: [
    // Hook: the bench under its tarp, a push-broom going somewhere behind it, and the old lock set down hard.
    cut(spot(BENCH, 'bench-wide')),
    { do: 'sfx', id: 'clatter', at: 'tansy', gain: 0.55, async: true },
    { do: 'walk', who: 'cam', path: [[-152.4, 69.6]], speed: 0.8, async: true },
    { do: 'wait', s: 2.8 },
    cut(BENCH_TALK.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Spoon opens this lock. Any spoon.' },
    cut(BENCH_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Any spoon?' },
    cut(BENCH_TALK.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Pip tried a comb. It worked.' },
    cut(BENCH_TALK.single('player', 'mcu', { height: 'low' })),
    { do: 'say', who: 'player', text: 'What are we locking?' },
    // Turn: she looks up, only because she means this one.
    { do: 'face', who: 'tansy', at: 'player', s: 0.5, async: true },
    cut(pushIn('tansy', 'mcu', 3.2, { toward: 'player', side: 25 })),
    { do: 'say', who: 'tansy', text: 'What sleeps under this bench needs a proper lock.' },
    // Cam, sweeping, is nearer the bench than the last time you looked.
    { do: 'walk', who: 'cam', path: [CAM_CALLED], speed: 0.9, async: true },
    cut(shot('cam', 'ms', { toward: 'tansy', side: 35 })),
    { do: 'sfx', id: 'rustle', at: 'cam', gain: 0.4, async: true },
    beat('pause'),
    // Her three short clauses; the objective is in her voice.
    cut(BENCH_TALK.single('tansy', 'mcu', { height: 'low' })),
    { do: 'say', who: 'tansy', text: 'Hogweed builds it. You test it. Cam carries it.' },
    cut(shot('cam', 'mcu', { toward: 'tansy', side: 30 })),
    { do: 'say', who: 'cam', text: 'What does it lock?' },
    cut(BENCH_TALK.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'A bench.' },
    // Button: the old lock changes hands; Cam's eyes go to the bench and stay there.
    { do: 'give', from: 'tansy', to: 'player', prop: 'bench-lock', s: 1 },
    cut(insert('player', { toward: 'tansy' })),
    { do: 'sfx', id: 'keys', at: 'player', gain: 0.5, async: true },
    { do: 'wait', s: 1.4 },
    cut(shot('cam', 'ms', { toward: 'tansy', side: -35 })),
    { do: 'face', who: 'cam', at: [BENCH_TOP[0], BENCH_TOP[1]], s: 0.6 },
    { do: 'wait', s: 1.8 },
  ],
};

// ---- 2. Mid: Hogweed's yard ---------------------------------------------------------------------------------------------------
const U_HOG = markOf(UNDERSPAN, 'hogweed');
const U_YOU = markOf(UNDERSPAN, 'player');
/** Cam stands by the lock bench with the crates he carried; the Dewdrop's run is the same z = -30 lane as row 10. */
const CAM_UNDER: Vec2 = [576.4, -14.2];
const DEWDROP_RUN: Vec2[] = [[563, -30], [583, -30], [598, -30]];
const HOG_TALK = coverage('hogweed', 'player', 1);

/** The yard in daylight. The lock has been tested; the Dewdrop rolls through again, slower; Cam watches the lock. */
export const M33_MID: SceneScript = {
  id: 'm33-the-bench-lock-mid',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'turfton',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m33-the-bench-lock-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: U_YOU.at, yaw: U_YOU.yaw },
    { id: 'hogweed', preset: 'hogweed', held: 'bench-lock', at: U_HOG.at, yaw: U_HOG.yaw },
    { id: 'cam', preset: 'turncoat cam', name: 'Cam', at: CAM_UNDER, yaw: towards(CAM_UNDER, U_HOG.at) },
    { id: 'tester', name: 'Tester', look: { hat: 0xe0b020, shirt: 0x3d5a80, glasses: true }, hz: 150, hidden: true, seatedIn: 'dewdrop', at: [0, 0] },
  ],
  vehicles: [{ id: 'dewdrop', kind: 'bubble-mobile', at: DEWDROP_RUN[0], yaw: Math.PI / 2, hidden: true }],
  props: [
    { id: 'crates', prefab: 'crate', at: [575.2, -13.4], yaw: 0.3, size: 0.9, by: 'w' },
  ],
  steps: [
    // Hook: the click, and Hogweed's delight, before anyone says a word.
    cut(HOG_TALK.single('hogweed', 'ms')),
    { do: 'sfx', id: 'latch', at: 'hogweed', gain: 0.6, async: true },
    { do: 'say', who: 'hogweed', text: 'Did it click? It clicked. I heard it click from here.' },
    cut(HOG_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Twice.' },
    cut(HOG_TALK.single('hogweed', 'mcu')),
    { do: 'gesture', who: 'hogweed', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'hogweed', text: 'Two clicks and it is yours. Nobody else even hears them.' },
    // Cam, listening for the clicks, looks at the lock and not at the speaker.
    cut(shot('cam', 'mcu', { toward: 'hogweed', side: 28 })),
    { do: 'sfx', id: 'tap', at: 'cam', gain: 0.35, async: true },
    beat('pause'),
    // Turn: something rolls through the yard, slower this time, and the gnome inside has learned a trick.
    { do: 'spawn', id: 'dewdrop' },
    { do: 'spawn', id: 'tester' },
    { do: 'sfx', id: 'whoosh', at: 'dewdrop', gain: 0.5, async: true },
    { do: 'cam', shot: { kind: 'track', pos: up(578, -26, 1.1), who: 'dewdrop', fov: 52 } },
    { do: 'drive', vehicle: 'dewdrop', path: DEWDROP_RUN, speed: 3.4, arrive: false, async: true },
    { do: 'wait', s: 1.8 },
    cut(shot('tester', 'ms', { side: 55 })),
    { do: 'say', who: 'tester', text: 'I can STOP it now!' },
    { do: 'wait', s: 0.4 },
    cut(HOG_TALK.single('hogweed', 'mcu')),
    { do: 'say', who: 'hogweed', text: 'He can stop it. He cannot choose when.' },
    { do: 'despawn', id: 'dewdrop' },
    { do: 'despawn', id: 'tester' },
    // Button: Cam has not moved. He is still looking at the lock.
    cut(shot('cam', 'ms', { toward: 'hogweed', side: -35 })),
    { do: 'wait', s: 1.8 },
  ],
};

// ---- 3. Outro: the code, in lamplight ----------------------------------------------------------------------------------------------
const O_TANSY = markOf(BENCH, 'tansy');
const O_CAM = markOf(BENCH, 'turncoat-cam');
const O_YOU = markOf(BENCH, 'player');
const FACE_AWAY: Vec2 = [-141, 73.6];
const CODE_TALK = coverage('tansy', 'player', 1);

/** Dusk at the bench. Tansy hangs the lock, sends the player to face the yard and sets the code; Cam stands at her elbow. */
export const M33_OUTRO: SceneScript = {
  id: 'm33-the-bench-lock-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m33-the-bench-lock-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: O_YOU.at, yaw: towards(O_YOU.at, O_TANSY.at) },
    { id: 'tansy', preset: 'tansy', held: 'bench-lock', at: O_TANSY.at, yaw: O_TANSY.yaw },
    { id: 'cam', preset: 'turncoat cam', name: 'Cam', at: O_CAM.at, yaw: O_CAM.yaw },
  ],
  props: [
    { id: 'lock', prefab: 'bench-lock', at: up(BENCH_TOP[0], BENCH_TOP[1], 1.08), yaw: 0, size: 0.4, by: 'h', hidden: true },
  ],
  steps: [
    // Hook: the lock on the bench, from the apron side, at the end of the light.
    cut(spot(BENCH, 'lock')),
    { do: 'hold', who: 'tansy', prop: null },
    { do: 'spawn', id: 'lock' },
    { do: 'sfx', id: 'clatter', at: 'tansy', gain: 0.5, async: true },
    { do: 'wait', s: 1.6 },
    // The check on the player, in her three clauses.
    cut(CODE_TALK.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Four wheels. Ten numbers each. I only need one set.' },
    cut(CODE_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Which numbers?' },
    cut(CODE_TALK.single('tansy', 'mcu', { height: 'low' })),
    { do: 'say', who: 'tansy', text: 'Turn round.' },
    // The player turns to the yard; the scene stays on the bench.
    { do: 'face', who: 'player', at: FACE_AWAY, s: 0.5 },
    cut(shot('tansy', 'ms', { toward: 'cam', side: 40 })),
    { do: 'say', who: 'tansy', text: 'The code is mine. Not yours, not Pip\'s. Not the broom\'s.' },
    // The wheels, one at a time, in lamplight, and the face at her elbow.
    cut(spot(BENCH, 'lock')),
    { do: 'sfx', id: 'tap', at: 'tansy', gain: 0.5 },
    { do: 'sfx', id: 'tap', at: 'tansy', gain: 0.5 },
    { do: 'sfx', id: 'tap', at: 'tansy', gain: 0.5 },
    { do: 'sfx', id: 'latch', at: 'tansy', gain: 0.7, async: true },
    { do: 'wait', s: 0.8 },
    cut(shot('cam', 'cu', { toward: 'tansy', side: 30 })),
    { do: 'wait', s: 1.4 },
    cut(CODE_TALK.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Done. Now it sleeps.' },
    cut(shot('cam', 'mcu', { toward: 'tansy', side: 30 })),
    { do: 'say', who: 'cam', text: 'Good lock.' },
    cut(CODE_TALK.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Sweep.' },
    // Button: Cam goes, broom in hand, and looks back at the bench once.
    cut(shot('cam', 'ms', { toward: 'tansy', side: -35 })),
    { do: 'walk', who: 'cam', path: [[-153.4, 70.2]], speed: 1.0, async: true },
    { do: 'wait', s: 1.6 },
    { do: 'face', who: 'cam', at: [BENCH_TOP[0], BENCH_TOP[1]], s: 0.8 },
    { do: 'stinger', id: 'mystery' },
    { do: 'wait', s: 2.2 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm33-the-bench-lock-intro': M33_INTRO,
  'm33-the-bench-lock-mid': M33_MID,
  'm33-the-bench-lock-outro': M33_OUTRO,
};
