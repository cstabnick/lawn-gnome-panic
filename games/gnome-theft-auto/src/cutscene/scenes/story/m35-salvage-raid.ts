// Story row 35: the scenes of The Salvage Raid's two new parts. The final's intro (the betrayal, Vesper's "Nice hat.
// Shame.", Pip's arm) is salvage-raid-intro in ch3.ts and its outro is salvage-raid-outro in ch3b.ts: not edited here.
// - ch3-salvage-raid-p1-intro (p1, dawn): the storeroom door. The clock, Pip's two cold teas (the act's last gag: the
//   wasted waiting), Cam's cot not slept in, his broom left behind, and the day of the week.
// - ch3-salvage-raid-p1-mid (p1, day, after the photographs): six HOA vans nose to tail inside the Patio Gate (a
//   cutscene-only fleet); "one yard, dusk"; the lock "has been seen to"; Gary: the valet is on charter business.
// - ch3-salvage-raid-p2-intro (p2, noon): the wrenches come off the wall into the crate; the acorn stays in the bench
//   lock, "the safest thing in Turfton"; HOA mowers roll up the street early.
// - ch3-salvage-raid-p2-mid (p2's outro, dusk): the mowers leave; the bench lock is open and the acorn cell is gone; Tansy
//   counts who had the number, and the broom is gone from the storeroom wall. No gag. The final's intro follows it.
// Stages: quests/stages/story/s35-salvage-raid.ts. Notes: docs/design/gnome-theft-auto/direction/scenes/<id>.md.
import type { ScriptActor, SceneScript, Vec2, Vec3 } from '../../script';
import { beat, coverage, cut, insert, pushIn, reaction, shot } from '../../direct';
import { carMark, markOf, rideOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

/** HOA raiders and the foreman: the black hat and the tan shirt (the final's raiders wear the same). */
const HOA_LOOK: Look = { hat: 0x18181e, shirt: 0xc9b99b };
const HOA_TINT = 0x222226;
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- p1: the storeroom door ----------------------------------------------------------------------------------------
const STORE = 'side-valve-storeroom';
const ST_TANSY = markOf(STORE, 'tansy');
const ST_PLAYER = markOf(STORE, 'player');
const ST_PIP_IN: Vec2 = [-166.8, 75.6];
const ST_PIP: Vec2 = [-167.3, 80.3];
/** The shop clock over the storeroom door, on the block's west wall. */
const CLOCK_AT: Vec3 = up(-161.9, 81, 2.3);
const COT_AT: Vec2 = [-164.4, 85.8];
const BROOM_AT: Vec2 = [-162.7, 82.2];

/** Tansy and Pip at the storeroom door: one side of their line for the whole scene. */
const DOOR = coverage('tansy', 'pip', 1);

export const P1_INTRO: SceneScript = {
  id: 'ch3-salvage-raid-p1-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/ch3-salvage-raid-p1-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: ST_PLAYER.at, yaw: ST_PLAYER.yaw },
    { id: 'tansy', preset: 'tansy', at: ST_TANSY.at, yaw: ST_TANSY.yaw, held: 'torque-wrench-chrome' },
    { id: 'pip', preset: 'pip', at: ST_PIP_IN, yaw: 0, held: 'cocoa-mug' },
  ],
  props: [
    { id: 'clock', prefab: 'wall-clock', at: CLOCK_AT, yaw: -Math.PI / 2, size: 0.5 },
    { id: 'cot', prefab: 'camp-bedroll', at: COT_AT, yaw: 0, size: 1.6 },
    { id: 'broom', prefab: 'broom', at: BROOM_AT, yaw: -Math.PI / 2, size: 1.3, by: 'h' },
  ],
  steps: [
    // 1. Hook: the shop clock over the storeroom door, ticking past six.
    cut(spot(STORE, 'clock')),
    { do: 'sfx', id: 'tap', at: CLOCK_AT, gain: 0.5 },
    { do: 'wait', s: 0.9 },
    { do: 'sfx', id: 'tap', at: CLOCK_AT, gain: 0.5 },
    { do: 'wait', s: 0.8 },
    // Tansy glances up at it, then away.
    cut(DOOR.single('tansy', 'mcu')),
    { do: 'face', who: 'tansy', at: [-162, 81], s: 0.5 },
    beat('beat'),
    { do: 'face', who: 'tansy', at: 'pip', s: 0.4 },
    { do: 'say', who: 'tansy', text: 'Ten past six. The apron isn\'t swept.' },
    // 2. Pip round the corner at a run, a mug in each hand: the wasted waiting.
    { do: 'walk', who: 'pip', path: [ST_PIP], run: true, async: true },
    { do: 'sfx', id: 'crunch', at: 'pip', gain: 0.5, async: true },
    cut(shot('pip', 'ms', { toward: 'tansy', side: -40, handheld: 0.02 })),
    { do: 'wait', s: 1.1 },
    { do: 'face', who: 'pip', at: 'tansy', s: 0.3 },
    cut(DOOR.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'I made Cam\'s tea at six. And at ten past. Both went cold.' },
    ...reaction('tansy', { toward: 'pip', size: 'mcu', side: 35, hold: 'pause' }),
    cut(DOOR.single('pip', 'ms')),
    { do: 'sfx', id: 'gulp', at: 'pip', gain: 0.5, async: true },
    { do: 'say', who: 'pip', text: 'I drank them. So nobody would know. Now you know.' },
    // 3. The picture: the cot made up square, and the broom against the wall without him.
    { do: 'face', who: 'tansy', at: COT_AT, s: 0.5, async: true },
    cut(spot(STORE, 'door-wide')),
    { do: 'music', track: 'mystery', fade: 0.8 },
    { do: 'wait', s: 2.6 },
    { do: 'face', who: 'tansy', at: 'pip', s: 0.4 },
    cut(DOOR.single('tansy', 'ms', { height: 'low' })),
    { do: 'say', who: 'tansy', text: 'That broom has never once left his hand.' },
    ...reaction('pip', { toward: 'tansy', size: 'mcu', side: -25, hold: 'beat' }),
    // 4. The job, to the player: three short clauses.
    { do: 'face', who: 'tansy', at: 'player', s: 0.4 },
    cut(pushIn('tansy', 'mcu', 3.2, { toward: 'pip', side: 30 })),
    { do: 'say', who: 'tansy', text: 'Look over his things. Find his route. Tell me what you see.' },
    // 5. The turn: Pip remembers the party.
    cut(DOOR.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'He kept saying Tuesday at the party. Like it was his birthday.' },
    { do: 'music', track: null, fade: 0.6 },
    { do: 'face', who: 'tansy', at: 'pip', s: 0.4 },
    cut(DOOR.single('tansy', 'cu')),
    beat('pause'),
    // 6. Button: the day of the week, and the spanner put down.
    { do: 'say', who: 'tansy', text: 'It\'s Tuesday.' },
    { do: 'hold', who: 'tansy', prop: null },
    { do: 'sfx', id: 'clatter', at: 'tansy', gain: 0.6 },
    beat('pause'),
  ],
};

// ---- p1 mid: the van line inside the Patio Gate ---------------------------------------------------------------------
const LINE = 'patio-gate-vanline';
const VL_FOREMAN = markOf(LINE, 'hoa-foreman');
const VL_RAIDER_A = markOf(LINE, 'hoa-raider', 0);
const VL_RAIDER_B = markOf(LINE, 'hoa-raider', 1);
const VL_GARY = markOf(LINE, 'gary');
const VL_PLAYER = markOf(LINE, 'player');
const VAN_IDS = ['van-l1', 'van-l2', 'van-l3', 'van-r1', 'van-r2', 'van-r3'] as const;

/** The foreman briefs his driver; Gary and the player across the gate: each pair on its own side of its line. */
const BRIEF = coverage('foreman', 'raider-a', 1);
const GATE = coverage('gary', 'player', 1);

export const P1_MID: SceneScript = {
  id: 'ch3-salvage-raid-p1-mid',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'tension',
  ambience: 'garden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/ch3-salvage-raid-p1-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: VL_PLAYER.at, yaw: VL_PLAYER.yaw, held: 'box-camera' },
    { id: 'gary', preset: 'gary', at: VL_GARY.at, yaw: towards(VL_GARY.at, VL_PLAYER.at) },
    { id: 'foreman', name: 'HOA Foreman', look: HOA_LOOK, at: VL_FOREMAN.at, yaw: towards(VL_FOREMAN.at, VL_RAIDER_A.at), held: 'hoa-clipboard' },
    { id: 'raider-a', name: 'HOA Driver', look: HOA_LOOK, at: VL_RAIDER_A.at, yaw: VL_RAIDER_A.yaw },
    { id: 'raider-b', name: 'HOA Driver', look: HOA_LOOK, at: VL_RAIDER_B.at, yaw: VL_RAIDER_B.yaw },
  ],
  vehicles: VAN_IDS.map((id) => {
    const m = carMark(LINE, id);
    return { id, kind: m.kind, at: m.at, yaw: m.yaw };
  }),
  steps: [
    // 1. Hook: the shutter, then the push through the gate gap down the line of vans.
    { do: 'sfx', id: 'snap', at: 'player', gain: 0.7 },
    { do: 'cam', shot: { kind: 'dolly', from: up(150, -122.5, 1.6), to: up(150, -127.6, 1.4), look: up(150, -146, 1.1), s: 3.4, fov: 46 } },
    { do: 'sfx', id: 'engine-rev', at: 'van-r2', gain: 0.4, async: true },
    { do: 'wait', s: 3.4 },
    // 2. The briefing: the rota slapped on a van's flank.
    { do: 'sfx', id: 'thud', at: 'foreman', gain: 0.6, async: true },
    cut(BRIEF.single('foreman', 'ms')),
    { do: 'say', who: 'foreman', text: 'Six vans. One yard. Dusk.' },
    cut(BRIEF.single('raider-a', 'mcu')),
    { do: 'say', who: 'raider-a', text: 'And the lock on the bench?' },
    cut(pushIn('foreman', 'mcu', 2.6, { toward: 'raider-a', side: 25, height: 'low' })),
    { do: 'say', who: 'foreman', text: 'The lock has been seen to.' },
    // 3. The turn: Gary, from the sentry box, and the valet who is not on his stand.
    { do: 'face', who: 'player', at: 'gary', s: 0.4, async: true },
    { do: 'sfx', id: 'paper', at: 'gary', gain: 0.5, async: true },
    cut(GATE.single('gary', 'mcu')),
    { do: 'say', who: 'gary', text: 'Sigh. No photographs. Section twelve.' },
    cut(GATE.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Where\'s the valet?' },
    cut(GATE.single('gary', 'ms')),
    { do: 'gesture', who: 'gary', name: 'shrug', s: 1.0, async: true },
    { do: 'say', who: 'gary', text: 'Sigh. Day off. Charter business.' },
    ...reaction('player', { toward: 'gary', size: 'mcu', side: -25, hold: 'beat' }),
    // 4. Button: the foreman looks up at the gate, and the first van's lights come on.
    { do: 'face', who: 'foreman', at: 'player', s: 0.5 },
    cut(shot('foreman', 'mcu', { toward: 'player', side: 15, height: 'low' })),
    { do: 'say', who: 'foreman', text: '...Who is that at the gate?' },
    { do: 'lights', vehicle: 'van-l1', on: true },
    { do: 'stinger', id: 'danger' },
    cut(spot(LINE, 'vans-low')),
    { do: 'sfx', id: 'engine-rev', at: 'van-l1', gain: 0.7 },
    { do: 'wait', s: 1.6 },
  ],
};

// ---- p2: the bay, the crate and the bench lock ---------------------------------------------------------------------
const BAY = 'side-valve-bay';
const BAY_PLAYER: Vec2 = [-148.5, 70.2];
const RACK_TANSY: Vec2 = [-147, 77.9];
const CRATE_PIP: Vec2 = [-140.6, 74.6];
/** The wrench rack on the bay's front wall, the crate Pip packs, and the bench lock on Tansy's workbench. */
const RACK_AT: Vec3 = up(-147, 79.25, 0.9);
const CRATE_AT: Vec2 = [-139.2, 76.2];
const LOCK_AT: Vec3 = up(-158, 75.7, 0.62);
const PIP_RIDE = carMark(BAY, 'pip-zero-turn');
const TANSY_RIDE = carMark(BAY, 'tansy-zero-turn');
/** Two HOA mowers roll up the z = 60 road from the Bodega corner and stop off the apron. */
const MOWER_A_IN: Vec2[] = [[-96, 57.5], [-138, 57.5]];
const MOWER_B_IN: Vec2[] = [[-104, 62.5], [-150, 62.5]];

/** Tansy and Pip packing: one side of their line. */
const PACK = coverage('tansy', 'pip', 1);

export const P2_INTRO: SceneScript = {
  id: 'ch3-salvage-raid-p2-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'tension',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/ch3-salvage-raid-p2-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: BAY_PLAYER, yaw: towards(BAY_PLAYER, RACK_TANSY) },
    { id: 'tansy', preset: 'tansy', at: RACK_TANSY, yaw: towards(RACK_TANSY, CRATE_PIP), held: 'torque-wrench-chrome' },
    { id: 'pip', preset: 'pip', at: CRATE_PIP, yaw: towards(CRATE_PIP, CRATE_AT), held: null },
    { id: 'rider-a', name: 'HOA Raider', look: HOA_LOOK, at: [0, 0], seatedIn: 'mower-a' },
    { id: 'rider-b', name: 'HOA Raider', look: HOA_LOOK, at: [0, 0], seatedIn: 'mower-b' },
  ],
  props: [
    { id: 'rack', prefab: 'wrench-rack', at: RACK_AT, yaw: Math.PI, size: 1.4 },
    { id: 'crate', prefab: 'cargo-crate', at: CRATE_AT, yaw: 0.2, size: 1.0 },
    { id: 'lock', prefab: 'bench-lock', at: LOCK_AT, yaw: Math.PI, size: 0.3 },
  ],
  vehicles: [
    { id: 'pip-ride', ...rideOf('pip'), at: PIP_RIDE.at, yaw: PIP_RIDE.yaw },
    { id: 'tansy-ride', ...rideOf('tansy'), at: TANSY_RIDE.at, yaw: TANSY_RIDE.yaw },
    { id: 'mower-a', kind: 'ride-on', at: MOWER_A_IN[0], yaw: -Math.PI / 2, tint: HOA_TINT, headlights: true },
    { id: 'mower-b', kind: 'ride-on', at: MOWER_B_IN[0], yaw: -Math.PI / 2, tint: HOA_TINT, headlights: true },
  ],
  steps: [
    // 1. Hook: a wrench off its hook, and Tansy counting them down the way she counted them up at the party.
    { do: 'sfx', id: 'clink', at: 'tansy', gain: 0.6 },
    cut(insert('tansy', { toward: 'pip', side: 30 })),
    { do: 'say', who: 'tansy', text: 'Forty-five. Forty-six.' },
    // 2. Pip at the crate, the one practical question.
    { do: 'sfx', id: 'clatter', at: 'pip', gain: 0.5, async: true },
    cut(PACK.single('pip', 'ms')),
    { do: 'face', who: 'pip', at: 'tansy', s: 0.4 },
    { do: 'say', who: 'pip', text: 'Shouldn\'t the acorn go in first? Before the wrenches?' },
    { do: 'face', who: 'tansy', at: 'pip', s: 0.4 },
    cut(PACK.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Bench lock. Hogweed\'s best. Safest thing in Turfton.' },
    // Pip reaches for the cigar box; it is the one thing Tansy will not let anyone else carry.
    { do: 'hold', who: 'pip', prop: 'cigar-box' },
    cut(insert('pip', { toward: 'tansy', side: -30 })),
    { do: 'sfx', id: 'creak', at: 'pip', gain: 0.4 },
    { do: 'wait', s: 1.0 },
    cut(PACK.single('tansy', 'ms')),
    { do: 'say', who: 'tansy', text: 'Not the box. I carry the box.' },
    { do: 'give', from: 'pip', to: 'tansy', s: 1.0 },
    cut(shot('tansy', 'ms', { toward: 'pip', side: 55, height: 'high' })),
    { do: 'face', who: 'tansy', at: [-147, 80], s: 0.4 },
    { do: 'sfx', id: 'clink', at: 'tansy', gain: 0.5, async: true },
    { do: 'wait', s: 0.6 },
    { do: 'face', who: 'tansy', at: 'pip', s: 0.4 },
    { do: 'say', who: 'tansy', text: 'Forty-seven.' },
    // 3. The turn: engines on the street, early. Two HOA mowers roll up off the Bodega corner and wait.
    { do: 'drive', vehicle: 'mower-a', path: MOWER_A_IN, speed: 9, async: true },
    { do: 'drive', vehicle: 'mower-b', path: MOWER_B_IN, speed: 9, async: true },
    cut({ kind: 'track', pos: up(-147, 66.4, 1.1), who: 'mower-b', fov: 50 }),
    { do: 'sfx', id: 'engine-rev', at: 'mower-a', gain: 0.6, async: true },
    { do: 'wait', s: 2.4 },
    { do: 'face', who: 'pip', at: [-146, 60], s: 0.3, async: true },
    { do: 'face', who: 'tansy', at: [-146, 60], s: 0.4 },
    cut(shot('pip', 'mcu', { side: 10 })),
    { do: 'wait', s: 1.2 },
    { do: 'face', who: 'pip', at: 'tansy', s: 0.4 },
    cut(PACK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'The rota said dusk. It isn\'t dusk.' },
    // 4. Tansy turns to the player, and means it.
    { do: 'face', who: 'tansy', at: 'player', s: 0.4 },
    cut(pushIn('tansy', 'mcu', 3, { toward: 'pip', side: 25 })),
    { do: 'say', who: 'tansy', text: 'Then they\'re early. Hold the alley. We load.' },
    ...reaction('player', { toward: 'tansy', gesture: 'nod', size: 'mcu', side: -25, hold: 'pause' }),
    // 5. Button: a raider revs at the bay.
    { do: 'music', track: 'chase', fade: 0.4 },
    { do: 'stinger', id: 'danger' },
    cut(shot('rider-b', 'ms', { side: 20, height: 'low' })),
    { do: 'sfx', id: 'engine-rev', at: 'mower-b', gain: 0.8 },
    { do: 'wait', s: 1.4 },
  ],
};

// ---- p2 mid (p2's outro): dusk, the bench lock --------------------------------------------------------------------
const OUT_PLAYER: Vec2 = [-150.5, 66.8];
const OUT_PIP: Vec2 = [-147.2, 66.2];
const OUT_TANSY: Vec2 = [-149.2, 68.8];
const AT_BENCH: Vec2 = [-156.8, 73.9];
const PIP_BEHIND: Vec2 = [-154, 72.2];
const MOWER_A_OUT: Vec2[] = [[-140, 57.5], [-177.5, 57.5], [-177.5, 24]];
const MOWER_B_OUT: Vec2[] = [[-132, 57.5], [-177.5, 57.5], [-177.5, 30]];

/** Tansy and Pip at the bench: one side of their line. */
const COUNT = coverage('tansy', 'pip', -1);

export const P2_MID: SceneScript = {
  id: 'ch3-salvage-raid-p2-mid',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/ch3-salvage-raid-p2-mid.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: OUT_PLAYER, yaw: Math.PI },
    { id: 'tansy', preset: 'tansy', at: OUT_TANSY, yaw: Math.PI, held: null },
    { id: 'pip', preset: 'pip', at: OUT_PIP, yaw: Math.PI, held: null },
    { id: 'rider-a', name: 'HOA Raider', look: HOA_LOOK, at: [0, 0], seatedIn: 'mower-a' },
    { id: 'rider-b', name: 'HOA Raider', look: HOA_LOOK, at: [0, 0], seatedIn: 'mower-b' },
  ],
  props: [
    { id: 'crate', prefab: 'cargo-crate', at: CRATE_AT, yaw: 0.2, size: 1.0 },
    { id: 'lock', prefab: 'bench-lock', at: LOCK_AT, yaw: Math.PI, size: 0.3 },
    { id: 'cot', prefab: 'camp-bedroll', at: COT_AT, yaw: 0, size: 1.6 },
  ],
  vehicles: [
    { id: 'pip-ride', ...rideOf('pip'), at: PIP_RIDE.at, yaw: PIP_RIDE.yaw },
    { id: 'tansy-ride', ...rideOf('tansy'), at: TANSY_RIDE.at, yaw: TANSY_RIDE.yaw },
    { id: 'mower-a', kind: 'ride-on', at: MOWER_A_OUT[0], yaw: -Math.PI / 2, tint: HOA_TINT, headlights: true },
    { id: 'mower-b', kind: 'ride-on', at: MOWER_B_OUT[0], yaw: -Math.PI / 2, tint: HOA_TINT, headlights: true },
  ],
  steps: [
    // 1. Hook: the HOA mowers turn for home at dusk, unbeaten and in no hurry.
    { do: 'drive', vehicle: 'mower-a', path: MOWER_A_OUT, speed: 7, arrive: false, async: true },
    { do: 'drive', vehicle: 'mower-b', path: MOWER_B_OUT, speed: 7, arrive: false, async: true },
    cut({ kind: 'track', pos: up(-152, 64.4, 1.0), who: 'mower-a', fov: 50 }),
    { do: 'sfx', id: 'engine-rev', at: 'mower-b', gain: 0.5 },
    { do: 'wait', s: 2.2 },
    // 2. Pip, out of breath, out front.
    { do: 'face', who: 'pip', at: 'tansy', s: 0.4 },
    cut(COUNT.single('pip', 'ms')),
    { do: 'say', who: 'pip', text: 'They\'re going. Why are they going?' },
    // 3. Tansy knows before she knows. She walks to the bench.
    cut(shot('tansy', 'mcu', { toward: 'pip', side: 20 })),
    beat('beat'),
    { do: 'face', who: 'tansy', at: [-158, 75.7], s: 0.5 },
    cut(shot('tansy', 'fs', { toward: 'player', side: 70 })),
    { do: 'walk', who: 'tansy', path: [AT_BENCH], speed: 1.2 },
    { do: 'face', who: 'tansy', at: [-158, 75.7], s: 0.3 },
    // 4. The insert: the shackle hangs open. Music out.
    { do: 'music', track: null, fade: 0.4 },
    cut({ kind: 'cut', pos: up(-158.9, 73.5, 1.1), look: LOCK_AT, fov: 34 }),
    { do: 'sfx', id: 'latch', at: LOCK_AT, gain: 0.4 },
    beat('pause'),
    { do: 'face', who: 'tansy', at: 'pip', s: 0.4 },
    cut(COUNT.single('tansy', 'cu')),
    { do: 'say', who: 'tansy', text: 'It\'s open. The cell\'s gone.' },
    // 5. The count.
    { do: 'walk', who: 'pip', path: [PIP_BEHIND], speed: 1.4, async: true },
    cut(COUNT.single('pip', 'mcu')),
    { do: 'wait', s: 1.0 },
    { do: 'face', who: 'pip', at: 'tansy', s: 0.3 },
    { do: 'say', who: 'pip', text: 'We were all out front. All of us.' },
    cut(pushIn('tansy', 'mcu', 3.4, { toward: 'pip', side: -25 })),
    { do: 'say', who: 'tansy', text: 'Two of us had the number.' },
    cut(COUNT.single('pip', 'cu')),
    { do: 'say', who: 'pip', text: 'I never wrote it down. I can\'t even keep a number.' },
    cut(COUNT.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'I know.' },
    // 6. The turn: her eyes go to the corner of the block, the storeroom wall. The cot. No broom.
    { do: 'face', who: 'tansy', at: [-163, 80], s: 0.6 },
    cut(spot(STORE, 'door-wide')),
    { do: 'stinger', id: 'reveal' },
    { do: 'wait', s: 2.2 },
    { do: 'face', who: 'tansy', at: 'pip', s: 0.4 },
    cut(COUNT.single('tansy', 'cu')),
    beat('beat'),
    { do: 'say', who: 'tansy', text: 'Three.' },
    // 7. Button: the first thunder, and the rain coming in over the bay. Nobody moves.
    { do: 'sfx', id: 'thunder', gain: 0.7 },
    { do: 'ambience', bed: 'rain', fade: 1.5 },
    ...reaction('pip', { toward: 'tansy', gesture: 'slump', size: 'mcu', side: 25, hold: 'pause' }),
    cut(shot('tansy', 'ms', { toward: 'pip', side: -60, height: 'high' })),
    beat('pause'),
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'ch3-salvage-raid-p1-intro': P1_INTRO,
  'ch3-salvage-raid-p1-mid': P1_MID,
  'ch3-salvage-raid-p2-intro': P2_INTRO,
  'ch3-salvage-raid-p2-mid': P2_MID,
};
