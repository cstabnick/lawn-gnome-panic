// Story row 46 (m46-starfall-at-the-anthill): Starfall at the Anthill, act III's one long adventure. Eight scenes:
// - p1-intro (night): the Long Shelf's steps. Betony explains the Even Line in two stars and a ruler, lends the player a
//   faculty gown (it hides the hat), and Dean Inkwell's lantern comes up the quad to the gate and goes away satisfied.
// - p2-intro (night): the ants' north door. One ant on the step, a bowl, a tapping; Pip does not like ants; the ant turns
//   and points at the Trencher.
// - p2-outro (dawn): the rent is counted, twice; a line of ants parts up the mound; Pip thanks a landlord.
// - p3-intro (dawn): the summit. The dome groans open, a technician lifts the lens to the last star, six white coats on
//   the rim, and one of them looks up from the road.
// - p3-outro (dawn): the lens in the player's hands, the work order with the Dean's name under it, an HOA radio ringing,
//   and headlights starting up the Anthill road.
// - intro (dawn, the final): Betony's farewell on the observatory step. She signs the lens; she stays with the sky; Pip
//   stays with the ants. The vans below, and the quick way down.
// - mid (dawn): the top of the run-up. The ramp ends in air. Wally on the radio.
// - outro (dawn): Rootwell Field. Wind-Sock Wally in his deck chair (his intro card), the plane lifting, Rootwell
//   dropping away and the Anthill's dome open and empty behind (W12).
// Stages: quests/stages/story/s46-starfall-at-the-anthill.ts. Notes: direction/scenes/<scene id>.md.
import type { ScriptActor, SceneScript, Step, Vec2 } from '../../script';
import { beat, coverage, cut, insert, pushIn, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

/** HOA technicians: the black hat and a white survey coat (the quest's crack targets wear the same). */
const TECH_LOOK: Look = { hat: 0x18181e, shirt: 0xe8e4d8, pants: 0x3a3a40 };
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);
const NOTES = (id: string): string => `docs/design/gnome-theft-auto/direction/scenes/${id}.md`;

// ---- p1: the Long Shelf steps, night ------------------------------------------------------------------------------
const STEPS = 'rootwell-library-steps';
const L_BET = markOf(STEPS, 'betony');
const L_YOU = markOf(STEPS, 'player');
const L_DEAN = markOf(STEPS, 'lovage');
/** The Dean starts out on the quad, on the path from the sundial, and walks his rounds up to the gate. */
const DEAN_FAR: Vec2 = [1110.5, -247];
/** Where Betony looks when she talks about the sky: the Anthill, south across the quad. */
const SOUTH: Vec2 = [1150, -150];

/** Betony and the player on the steps: one side of their line for the scene. */
const STEP = coverage('betony', 'player', 1);
/** The Dean at the gate and Betony on the step. */
const GATE = coverage('lovage', 'betony', 1);

const P1_INTRO: SceneScript = {
  id: 'm46-starfall-at-the-anthill-p1-intro',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'mystery',
  ambience: 'night',
  direction: { notes: NOTES('m46-starfall-at-the-anthill-p1-intro'), kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: L_YOU.at, yaw: L_YOU.yaw },
    { id: 'betony', preset: 'betony', held: 'faculty-gown', at: L_BET.at, yaw: towards(L_BET.at, SOUTH) },
    { id: 'lovage', preset: 'lovage', held: 'night-shift-lantern', at: DEAN_FAR, yaw: 0 },
  ],
  steps: [
    // 1. Hook: Rootwell's signature, the library dead centre on the quad axis, one high window lit; the night bell.
    cut(spot(STEPS, 'library-axis')),
    { do: 'sfx', id: 'bell', at: up(1110, -290, 10), gain: 0.35, async: true },
    { do: 'wait', s: 2.4 },
    // 2. Setup: Betony on the bottom step, looking past the player at the sky, as if the player were a cloud.
    cut(STEP.single('betony', 'mcu')),
    { do: 'say', who: 'betony', text: 'They have the survey. Tonight they read it, through my lens.' },
    { do: 'face', who: 'betony', at: 'player', s: 0.5 },
    cut(STEP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Read it how?' },
    // 3. The Even Line in two stars: she points south, and the crane goes up over the quad to the Anthill.
    { do: 'face', who: 'betony', at: SOUTH, s: 0.5 },
    { do: 'gesture', who: 'betony', name: 'point', s: 2.2, async: true },
    cut(STEP.single('betony', 'ms')),
    { do: 'say', who: 'betony', text: 'Two stars at the horizon. The lens draws a line between them.' },
    // The Dean's lantern starts its round on the quad below the crane: a small warm light coming up the path.
    { do: 'walk', who: 'lovage', path: [L_DEAN.at], speed: 1.15, async: true },
    { do: 'sfx', id: 'creak', at: 'lovage', gain: 0.3, async: true },
    { do: 'cam', shot: { kind: 'dolly', from: up(1110, -268, 6), to: up(1110, -272, 16), look: up(1150, -150, 3), lookTo: up(1250, 150, 6), s: 4.6, fov: 54 } },
    { do: 'wait', s: 4.6 },
    cut(STEP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'And the Combine?' },
    { do: 'face', who: 'betony', at: 'player', s: 0.4 },
    cut(pushIn('betony', 'mcu', 2.8, { toward: 'player', side: 25 })),
    { do: 'say', who: 'betony', text: 'Cuts along it. The line is level. That is the whole problem.' },
    ...reaction('player', { toward: 'betony', size: 'mcu', side: -25, hold: 'pause' }),
    // 4. The gown: held out, handed over. The hat goes under it; that is the plan.
    { do: 'give', from: 'betony', to: 'player', s: 1.0, async: true },
    { do: 'sfx', id: 'cloth', at: 'betony', gain: 0.6, async: true },
    cut(insert('betony', { toward: 'player', side: 30 })),
    { do: 'wait', s: 1.2 },
    cut(STEP.single('betony', 'mcu')),
    { do: 'say', who: 'betony', text: 'Faculty walk the quad at night. Hats do not. Put it on.' },
    cut(STEP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Over the hat?' },
    cut(STEP.single('betony', 'mcu')),
    { do: 'say', who: 'betony', text: 'It is cut for it. Professors have hats too. Some of us have two.' },
    // 5. The turn: gravel at the gate, and the lantern held up. The Dean, on his rounds.
    { do: 'sfx', id: 'crunch', at: 'lovage', gain: 0.6, async: true },
    { do: 'face', who: 'betony', at: 'lovage', s: 0.5, async: true },
    { do: 'face', who: 'lovage', at: 'betony', s: 0.5 },
    { do: 'music', track: null, fade: 0.5 },
    cut(spot(STEPS, 'gate')),
    { do: 'wait', s: 1.1 },
    cut(GATE.single('lovage', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lovage', text: 'Professor Sextant. Out late. With a colleague?' },
    cut(GATE.single('betony', 'mcu')),
    { do: 'say', who: 'betony', text: 'A visiting astronomer, Dean. Very mature.' },
    // The lantern swings to the player's gown, and stops a hand short of the hat.
    { do: 'face', who: 'lovage', at: 'player', s: 0.5 },
    cut(shot('player', 'mcu', { toward: 'lovage', side: -20 })),
    { do: 'wait', s: 1.3 },
    cut(GATE.single('lovage', 'mcu')),
    { do: 'say', who: 'lovage', text: 'Splendid. We must be mindful of the optics. Goodnight.' },
    // He glides back to his round; the lantern shrinks down the path.
    { do: 'walk', who: 'lovage', path: [[1110.5, -256]], speed: 1.3, async: true },
    { do: 'music', track: 'mystery', fade: 1.0, async: true },
    cut(GATE.two('fs')),
    { do: 'wait', s: 2.0 },
    // 6. Button: the gown worked, and Betony's verdict on the Dean.
    { do: 'face', who: 'betony', at: 'player', s: 0.4 },
    cut(STEP.single('betony', 'mcu')),
    { do: 'say', who: 'betony', text: 'He never looks at anything he has signed.' },
    ...reaction('player', { toward: 'betony', gesture: 'nod', size: 'mcu', side: -25, hold: 'pause' }),
  ],
};

// ---- p2: the ants' north door, night and dawn ---------------------------------------------------------------------
const DOOR = 'anthill-north-door';
const D_BET = markOf(DOOR, 'betony');
const D_PIP = markOf(DOOR, 'pip');
const D_YOU = markOf(DOOR, 'player');
/** The landlord on the step, 1.6 m out from the door (OBSERVATORY.antDoors[0] (1172, 82), facing out at -2.36). */
const ANT: Vec2 = [1170.9, 80.9];
const ANT_AT = up(ANT[0], ANT[1], 0.05);
const ANT_FACING = towards(ANT, D_YOU.at);
/** The way the Trencher lies from the step: the ant turns its antennae that way to point. */
const ANT_POINTING = towards(ANT, [1245, -215]);
const BOWL_AT = up(1170.4, 80.1, 0.02);

/** The three below the step: Betony and Pip, one side of their line. */
const LAWN = coverage('betony', 'pip', -1);

const P2_INTRO: SceneScript = {
  id: 'm46-starfall-at-the-anthill-p2-intro',
  stage: { kind: 'world' },
  sky: 'night',
  ambience: 'night',
  direction: { notes: NOTES('m46-starfall-at-the-anthill-p2-intro'), kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: D_YOU.at, yaw: D_YOU.yaw },
    { id: 'betony', preset: 'betony', held: null, at: D_BET.at, yaw: D_BET.yaw },
    { id: 'pip', preset: 'pip', held: null, at: D_PIP.at, yaw: D_PIP.yaw },
  ],
  props: [
    { id: 'ant', prefab: 'rootwell-ant', at: ANT_AT, yaw: ANT_FACING, size: 0.55 },
    { id: 'ant-pointing', prefab: 'rootwell-ant', at: ANT_AT, yaw: ANT_POINTING, size: 0.55, hidden: true },
    { id: 'bowl', prefab: 'mixing-bowl', at: BOWL_AT, yaw: 0, size: 0.34 },
  ],
  steps: [
    // 1. Hook: tap, tap, tap on stone. The ant's own eye line: the landlord on its step, and its bowl.
    cut(spot(DOOR, 'ant-eye')),
    { do: 'sfx', id: 'tap', at: 'ant', gain: 0.6 },
    { do: 'wait', s: 0.5 },
    { do: 'sfx', id: 'tap', at: 'ant', gain: 0.6 },
    { do: 'wait', s: 0.5 },
    { do: 'sfx', id: 'tap', at: 'ant', gain: 0.6 },
    { do: 'wait', s: 1.0 },
    // 2. Setup: Pip, as far from the door as he can stand and still be at it.
    cut(LAWN.single('pip', 'ms', { handheld: 0.015 })),
    { do: 'say', who: 'pip', text: 'Ants. I do not like ants.' },
    { do: 'face', who: 'pip', at: 'betony', s: 0.3 },
    { do: 'say', who: 'pip', text: 'That one is holding a bowl at me. Why a bowl?' },
    { do: 'face', who: 'betony', at: 'pip', s: 0.4 },
    cut(LAWN.single('betony', 'mcu')),
    { do: 'say', who: 'betony', text: 'It is the landlord. The university is late again.' },
    cut(shot('player', 'mcu', { toward: 'betony', side: -25, height: 'high' })),
    { do: 'say', who: 'player', text: 'Late with what?' },
    cut(LAWN.single('betony', 'mcu')),
    { do: 'say', who: 'betony', text: 'Sugar. A bowl a night. Nobody goes up the mound unpaid.' },
    // 3. The turn: the ant does not speak. It turns, and points.
    { do: 'music', track: 'heist', fade: 0.4, async: true },
    cut(spot(DOOR, 'ant-eye')),
    { do: 'wait', s: 0.9 },
    { do: 'sfx', id: 'tap', at: 'ant', gain: 0.7 },
    { do: 'despawn', id: 'ant' },
    { do: 'spawn', id: 'ant-pointing' },
    { do: 'wait', s: 1.4 },
    cut(spot(DOOR, 'from-step')),
    { do: 'face', who: 'pip', at: [1180, 40], s: 0.4, async: true },
    { do: 'face', who: 'betony', at: [1180, 40], s: 0.5 },
    { do: 'wait', s: 0.9 },
    cut(LAWN.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'It is pointing. Why is it pointing?' },
    cut(LAWN.single('betony', 'mcu')),
    { do: 'say', who: 'betony', text: 'At the Trencher. That is where the sugar is kept.' },
    // 4. The job, to the player, three clauses.
    { do: 'face', who: 'betony', at: 'player', s: 0.4 },
    cut(pushIn('betony', 'mcu', 2.6, { toward: 'player', side: -25 })),
    { do: 'say', who: 'betony', text: 'Take a barrow from behind it. Fill it. Do not spill.' },
    ...reaction('player', { toward: 'betony', gesture: 'nod', size: 'mcu', side: 25, hold: 'pause' }),
    // 5. Button: Pip tries a shortcut. He raises a fist to knock; the landlord turns back, and taps once.
    { do: 'face', who: 'pip', at: ANT, s: 0.4 },
    cut(shot('pip', 'ms', { toward: 'betony', side: 60 })),
    { do: 'say', who: 'pip', text: 'Or we could just knock?' },
    { do: 'gesture', who: 'pip', name: 'handsUp', s: 0.8, async: true },
    { do: 'despawn', id: 'ant-pointing' },
    { do: 'spawn', id: 'ant' },
    cut(spot(DOOR, 'ant-eye')),
    { do: 'sfx', id: 'tap', at: 'ant', gain: 0.8 },
    { do: 'wait', s: 1.0 },
    cut(shot('pip', 'mcu', { toward: 'betony', side: 40 })),
    { do: 'gesture', who: 'pip', name: 'flinch', s: 0.8 },
    beat('pause'),
  ],
};

/** The line of ants across the way up the mound, and where they stand once they have parted. */
const ANT_LINE: Vec2[] = [[1163.4, 78.6], [1164.6, 77.6], [1165.8, 76.6], [1167.0, 75.6], [1168.2, 74.6], [1169.4, 73.6]];
const ANT_PARTED: Vec2[] = [[1162.6, 77.6], [1163.6, 79.0], [1164.6, 80.4], [1168.0, 74.2], [1169.2, 75.4], [1170.4, 76.6]];
const LINE_YAW = towards(ANT, D_YOU.at) + Math.PI / 2;
const UP_MOUND = towards(D_YOU.at, ANT);

const P2_OUTRO: SceneScript = {
  id: 'm46-starfall-at-the-anthill-p2-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'wind',
  direction: { notes: NOTES('m46-starfall-at-the-anthill-p2-outro'), kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: D_YOU.at, yaw: D_YOU.yaw },
    { id: 'betony', preset: 'betony', held: null, at: D_BET.at, yaw: D_BET.yaw },
    { id: 'pip', preset: 'pip', held: null, at: D_PIP.at, yaw: D_PIP.yaw },
  ],
  props: [
    { id: 'ant', prefab: 'rootwell-ant', at: ANT_AT, yaw: ANT_FACING, size: 0.55 },
    { id: 'bowl', prefab: 'sugar-cube-crate', at: BOWL_AT, yaw: 0.3, size: 0.42 },
    ...ANT_LINE.map((p, i) => ({ id: `line-${i}`, prefab: 'rootwell-ant', at: p, yaw: LINE_YAW + (i % 2 ? 0.2 : -0.15), size: 0.4 })),
    ...ANT_PARTED.map((p, i) => ({ id: `parted-${i}`, prefab: 'rootwell-ant', at: p, yaw: UP_MOUND + (i < 3 ? 0.4 : -0.4), size: 0.4, hidden: true })),
  ],
  steps: [
    // 1. Hook: dawn on the step, and the count: the landlord taps every cube.
    cut(spot(DOOR, 'ant-eye')),
    ...[0, 1, 2, 3, 4].flatMap((i): Step[] => [{ do: 'sfx', id: 'tap', at: 'ant', gain: 0.5 + i * 0.03 }, { do: 'wait', s: 0.4 }]),
    // 2. Pip, whispering, and Betony on the custom.
    { do: 'face', who: 'betony', at: 'pip', s: 0.4, async: true },
    cut(LAWN.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'It is counting.' },
    cut(LAWN.single('betony', 'mcu')),
    { do: 'say', who: 'betony', text: 'Twice. They always count twice.' },
    cut(shot('player', 'mcu', { toward: 'betony', side: -25, height: 'high' })),
    { do: 'say', who: 'player', text: 'And if it is short?' },
    cut(LAWN.single('betony', 'mcu')),
    { do: 'say', who: 'betony', text: 'Then it is short twice.' },
    // 3. The turn: the tapping stops. The line of ants across the way up parts, cleanly, down the middle.
    { do: 'wait', s: 0.8 },
    cut(spot(DOOR, 'door-wide')),
    { do: 'music', track: 'warm', fade: 0.8 },
    { do: 'wait', s: 1.2 },
    ...ANT_LINE.map((_, i): Step => ({ do: 'despawn', id: `line-${i}` })),
    ...ANT_PARTED.map((_, i): Step => ({ do: 'spawn', id: `parted-${i}` })),
    { do: 'sfx', id: 'rustle', at: up(1166.4, 76.6, 0.2), gain: 0.5 },
    { do: 'wait', s: 2.0 },
    // 4. Pip, who does not like ants, takes his hat off to one.
    cut(LAWN.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'They are letting us up.' },
    { do: 'face', who: 'pip', at: ANT, s: 0.4 },
    { do: 'gesture', who: 'pip', name: 'tipHat', s: 1.2, async: true },
    cut(shot('pip', 'ms', { toward: 'betony', side: 50 })),
    { do: 'say', who: 'pip', text: 'Thank you, sir. Or madam. Thank you.' },
    // Button: the landlord taps once. Pip, beaming.
    cut(spot(DOOR, 'ant-eye')),
    { do: 'sfx', id: 'tap', at: 'ant', gain: 0.7 },
    { do: 'wait', s: 1.0 },
    cut(shot('pip', 'mcu', { toward: 'betony', side: 35, height: 'low' })),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.0, async: true },
    beat('pause'),
  ],
};

// ---- p3: the summit at dawn ---------------------------------------------------------------------------------------
const TOP = 'anthill-forecourt';
const T_BET = markOf(TOP, 'betony');
const T_PIP = markOf(TOP, 'pip');
const T_YOU = markOf(TOP, 'player');
const TECHS = [0, 1, 2, 3, 4, 5].map((n) => markOf(TOP, 'hoa-tech', n));
const TECH_HELD = ['guidance-lens', null, 'hoa-clipboard', null, 'hoa-radio', null] as const;
const STAND_PT: Vec2 = [1222, 152];

const techActors = (holdLens: boolean): ScriptActor[] =>
  TECHS.map((m, i) => ({
    id: `tech-${i + 1}`,
    name: 'HOA Technician',
    look: TECH_LOOK,
    at: m.at,
    yaw: m.yaw,
    held: i === 0 && !holdLens ? null : TECH_HELD[i],
  }));

/** Betony and Pip by the observatory step: one side of their line. */
const RIM = coverage('betony', 'pip', -1);
/** The lead technician and the one with the list. */
const SIGHT = coverage('tech-3', 'tech-1', 1);
/** Pip and the player, crouched at the step. */
const PIP_YOU = coverage('pip', 'player', 1);

const P3_INTRO: SceneScript = {
  id: 'm46-starfall-at-the-anthill-p3-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'wind',
  direction: { notes: NOTES('m46-starfall-at-the-anthill-p3-intro'), kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: T_YOU.at, yaw: T_YOU.yaw },
    { id: 'betony', preset: 'betony', held: null, at: T_BET.at, yaw: towards(T_BET.at, STAND_PT) },
    { id: 'pip', preset: 'pip', held: null, at: T_PIP.at, yaw: T_PIP.yaw },
    ...techActors(true),
  ],
  steps: [
    // 1. Hook: the dome's one long mechanical groan, low up its face to the slit and the last of the night.
    cut(spot(TOP, 'dome-low')),
    { do: 'sfx', id: 'creak', at: up(1258, 158, 6), gain: 0.9 },
    { do: 'gesture', who: 'tech-4', name: 'saw', s: 2.4, async: true },
    { do: 'wait', s: 2.2 },
    // 2. The lens, lifted to the sky in both hands: it gleams.
    cut(insert('tech-1', { toward: 'tech-3', side: 35 })),
    { do: 'stinger', id: 'reveal' },
    { do: 'wait', s: 1.8 },
    cut(SIGHT.single('tech-3', 'mcu')),
    { do: 'say', who: 'tech-3', text: 'Last star in four minutes. Mark the line.' },
    { do: 'face', who: 'tech-1', at: 'tech-3', s: 0.4 },
    cut(SIGHT.single('tech-1', 'mcu')),
    { do: 'say', who: 'tech-1', text: 'Lens is true. Level to the grain.' },
    // 3. The three by the step, in the lee of the dome.
    { do: 'sfx', id: 'cloth', at: 'betony', gain: 0.4, async: true },
    cut(RIM.single('betony', 'mcu')),
    { do: 'say', who: 'betony', text: 'My lens. Out in the cold, on a stick, like a teacup.' },
    { do: 'face', who: 'pip', at: 'player', s: 0.4, async: true },
    { do: 'face', who: 'player', at: 'pip', s: 0.4 },
    cut(RIM.single('pip', 'mcu', { handheld: 0.015 })),
    { do: 'say', who: 'pip', text: 'Six of them. In little white coats.' },
    cut(PIP_YOU.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Will they fight?' },
    cut(PIP_YOU.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'I will take the three on the left. Or one. I will take one.' },
    // 4. The turn: the technician watching the road turns round.
    { do: 'face', who: 'tech-6', at: 'player', s: 0.6 },
    { do: 'music', track: null, fade: 0.3 },
    cut(shot('tech-6', 'mcu', { toward: 'player', side: 15, height: 'low' })),
    { do: 'say', who: 'tech-6', text: 'Who is that, by the step?' },
    { do: 'stinger', id: 'danger' },
    { do: 'face', who: 'tech-1', at: 'player', s: 0.5, async: true },
    { do: 'face', who: 'tech-3', at: 'player', s: 0.5, async: true },
    cut(spot(TOP, 'stand-wide')),
    { do: 'wait', s: 1.4 },
    // 5. Betony, quietly, to the player.
    { do: 'face', who: 'betony', at: 'player', s: 0.4 },
    cut(pushIn('betony', 'mcu', 2.6, { toward: 'player', side: 25 })),
    { do: 'say', who: 'betony', text: 'Crack them. Then the lens. Gently. It is older than the Dean.' },
    // Button: Pip goes first, at a run, before anybody can stop him.
    { do: 'music', track: 'chase', fade: 0.3 },
    { do: 'walk', who: 'pip', path: [[1235, 158]], run: true, async: true },
    cut(shot('pip', 'ms', { toward: 'tech-3', side: -30, handheld: 0.03 })),
    { do: 'sfx', id: 'crunch', at: 'pip', gain: 0.6 },
    { do: 'wait', s: 1.4 },
  ],
};

const STAND_YOU: Vec2 = [1225.4, 155.2];
const STAND_BET: Vec2 = [1228, 157.4];
const STAND_PIP: Vec2 = [1224.2, 158];
const RADIO_AT = up(1221.0, 153.8, 0.02);
/** Headlights starting up the Anthill road on the mound's east flank: an HOA van, cutscene-only. */
const VAN_UP: Vec2[] = [[1304, 96], [1304, 112], [1301, 128]];

const P3_OUTRO: SceneScript = {
  id: 'm46-starfall-at-the-anthill-p3-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'wind',
  direction: { notes: NOTES('m46-starfall-at-the-anthill-p3-outro'), kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: 'guidance-lens', at: STAND_YOU, yaw: towards(STAND_YOU, STAND_BET) },
    { id: 'betony', preset: 'betony', held: null, at: STAND_BET, yaw: towards(STAND_BET, STAND_YOU) },
    { id: 'pip', preset: 'pip', held: 'essay-page', at: STAND_PIP, yaw: towards(STAND_PIP, STAND_BET) },
  ],
  props: [
    { id: 'radio', prefab: 'hoa-radio', at: RADIO_AT, yaw: 0.6, size: 0.45 },
  ],
  vehicles: [
    { id: 'van', kind: 'hoa-van', at: VAN_UP[0], yaw: 0, headlights: true },
  ],
  steps: [
    // 1. Hook: the lens in the player's hands, warm from the night, the dawn on its glass.
    cut(insert('player', { toward: 'betony', side: 30 })),
    { do: 'sfx', id: 'latch', at: 'player', gain: 0.5 },
    { do: 'wait', s: 1.6 },
    cut(RIM.single('betony', 'mcu')),
    { do: 'say', who: 'betony', text: 'Still warm. It has been looking all night.' },
    // 2. The work order: Pip found it under the cradle.
    { do: 'sfx', id: 'paper', at: 'pip', gain: 0.6, async: true },
    cut(RIM.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'This was under it. It has the Dean\'s name on.' },
    cut(RIM.single('betony', 'mcu')),
    beat('beat'),
    { do: 'say', who: 'betony', text: 'Approved, L. Inkwell. Of course. He signs everything.' },
    // 3. The turn: the radio by the stand squelches, and then the HOA alarm starts and does not stop.
    { do: 'sfx', id: 'static', at: 'radio', gain: 0.7 },
    cut({ kind: 'cut', pos: up(1222.6, 155.4, 0.9), look: RADIO_AT, fov: 36 }),
    { do: 'say', who: 'HOA Radio', text: 'Anthill, report. Anthill, your lens is off the line.' },
    { do: 'sfx', id: 'alarm', at: 'radio', gain: 0.8 },
    { do: 'face', who: 'pip', at: 'radio', s: 0.3, async: true },
    cut(RIM.single('pip', 'mcu', { handheld: 0.02 })),
    { do: 'say', who: 'pip', text: 'That is an alarm. I know alarms.' },
    // 4. Button: far down the east flank, headlights start up the Anthill road.
    { do: 'drive', vehicle: 'van', path: VAN_UP, speed: 6, arrive: false, async: true },
    { do: 'music', track: 'tension', fade: 0.4 },
    cut({ kind: 'cut', pos: up(1266, 138, 2.4), look: up(1302, 112, 1.2), fov: 40 }),
    { do: 'sfx', id: 'alarm', at: 'radio', gain: 0.5 },
    { do: 'wait', s: 2.4 },
  ],
};

// ---- the final: Betony's farewell on the step, the ramp, the Field ------------------------------------------------
const CART_AT: Vec2 = [1238, 179];

/** Betony and the player at the step for the farewell: one side of their line. */
const FAREWELL = coverage('betony', 'player', 1);
/** Betony and Pip, for his offer. */
const STAY = coverage('betony', 'pip', 1);

const FINAL_INTRO: SceneScript = {
  id: 'm46-starfall-at-the-anthill-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'wind',
  direction: { notes: NOTES('m46-starfall-at-the-anthill-intro'), kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: 'guidance-lens', at: T_YOU.at, yaw: T_YOU.yaw },
    { id: 'betony', preset: 'betony', held: null, at: T_BET.at, yaw: T_BET.yaw },
    { id: 'pip', preset: 'pip', held: null, at: T_PIP.at, yaw: towards(T_PIP.at, T_BET.at) },
  ],
  vehicles: [
    { id: 'cart', kind: 'golf-cart', at: CART_AT, yaw: Math.PI, tint: 0x5a1f2a },
  ],
  steps: [
    // 1. Hook: chalk on brass. Betony writes on the lens ring while the player holds it.
    { do: 'sfx', id: 'tap', at: 'betony', gain: 0.5, async: true },
    { do: 'gesture', who: 'betony', name: 'read', s: 2.0, async: true },
    cut(insert('player', { toward: 'betony', side: -30 })),
    { do: 'wait', s: 2.0 },
    cut(FAREWELL.single('betony', 'mcu')),
    { do: 'say', who: 'betony', text: 'There. B. Sextant. So whoever looks through it knows.' },
    cut(FAREWELL.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'You are not coming?' },
    cut(FAREWELL.single('betony', 'mcu')),
    { do: 'say', who: 'betony', text: 'Somebody has to stay with the sky. And the rent.' },
    // 2. Pip, who has been at the ants' door all night, volunteers.
    { do: 'face', who: 'betony', at: 'pip', s: 0.4, async: true },
    cut(STAY.single('pip', 'ms')),
    { do: 'say', who: 'pip', text: 'I will stay too. Somebody has to carry the sugar.' },
    cut(STAY.single('betony', 'mcu')),
    beat('pause'),
    // 3. The sincere beat: no gag on it. She looks up, then at the player, and means it.
    { do: 'music', track: 'warm', fade: 1.0 },
    { do: 'face', who: 'betony', at: 'player', s: 0.6 },
    cut(FAREWELL.two('ms')),
    beat('pause'),
    cut(pushIn('betony', 'mcu', 3.2, { toward: 'player', side: 25 })),
    { do: 'say', who: 'betony', text: 'Take it somewhere the ground is not level. Somewhere lovely, and uneven.' },
    ...reaction('player', { toward: 'betony', gesture: 'nod', size: 'mcu', side: -25, hold: 'pause' }),
    // 4. The turn: engines down the mound, the vans on the road. Pip at the rim.
    { do: 'music', track: null, fade: 0.6 },
    { do: 'sfx', id: 'engine-rev', at: up(1290, 186, 1), gain: 0.5, async: true },
    { do: 'walk', who: 'pip', path: [[1236.4, 170.4]], run: true, async: true },
    cut(shot('pip', 'ms', { toward: 'player', side: -40, handheld: 0.02 })),
    { do: 'wait', s: 1.6 },
    { do: 'face', who: 'pip', at: 'player', s: 0.3 },
    { do: 'say', who: 'pip', text: 'Vans! On the road! The only road!' },
    cut(FAREWELL.single('betony', 'mcu')),
    { do: 'say', who: 'betony', text: 'Not the only road.' },
    // She points north, past the cones, at the ramp. The Dean's valet cart is parked at the top, keys in.
    { do: 'face', who: 'betony', at: [1238, 130], s: 0.5 },
    { do: 'gesture', who: 'betony', name: 'point', s: 1.6, async: true },
    cut(spot('deans-leap-runup', 'lip-back')),
    { do: 'wait', s: 2.2 },
    cut(FAREWELL.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Does it fly?' },
    // Button.
    { do: 'face', who: 'betony', at: 'player', s: 0.3 },
    cut(FAREWELL.single('betony', 'mcu', { height: 'low' })),
    { do: 'say', who: 'betony', text: 'Everything flies once.' },
    beat('pause'),
  ],
};

const FINAL_MID: SceneScript = {
  id: 'm46-starfall-at-the-anthill-mid',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'wind',
  direction: { notes: NOTES('m46-starfall-at-the-anthill-mid'), kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: CART_AT, seatedIn: 'cart' },
    // Wally is a voice on the radio until the outro.
    { id: 'wally', preset: 'wally', hidden: true, at: [1238, 140], name: 'Wind-Sock Wally (radio)' },
  ],
  vehicles: [
    { id: 'cart', kind: 'golf-cart', from: 'player', at: [1238, 166], yaw: Math.PI },
  ],
  steps: [
    // 1. Hook: over the lip. The ramp ends, the slope falls away, the campus is a long way down.
    cut(spot('deans-leap-runup', 'lip')),
    { do: 'sfx', id: 'whoosh', gain: 0.5 },
    { do: 'wait', s: 2.6 },
    // 2. Back up the run-up: the cart at the top, idling.
    cut(spot('deans-leap-runup', 'lip-back')),
    { do: 'sfx', id: 'engine-rev', at: 'cart', gain: 0.5 },
    { do: 'sfx', id: 'static', gain: 0.5, async: true },
    { do: 'say', who: 'wally', text: "Wind's nor'-nor'-east, kid. Good. Hit it straight and keep your foot down." },
    // 3. Button: the player, hands on the wheel.
    cut(shot('player', 'mcu', { side: 15, height: 'low' })),
    { do: 'sfx', id: 'engine-rev', at: 'cart', gain: 0.8 },
    { do: 'wait', s: 2.6 },
  ],
};

const FIELD = 'rootwell-field-tower';
const F_WALLY = markOf(FIELD, 'wally');
const F_YOU = markOf(FIELD, 'player');
const PLANE_AT: Vec2 = [1300, 430];
/** The take-off roll south down the runway and the climb out over the south lawn. */
const CLIMB = [up(1300, 470, 0), up(1300, 560, 1), up(1300, 660, 10), up(1298, 780, 34)];

/** Wally in his chair and the player: one side of their line. */
const CHAIR = coverage('wally', 'player', 1);

const FINAL_OUTRO: SceneScript = {
  id: 'm46-starfall-at-the-anthill-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'wind',
  direction: { notes: NOTES('m46-starfall-at-the-anthill-outro'), kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: 'guidance-lens', at: F_YOU.at, yaw: F_YOU.yaw },
    { id: 'wally', preset: 'wally', held: 'field-binoculars', at: F_WALLY.at, yaw: towards(F_WALLY.at, [1240, 150]) },
    // In the air: the same two, seated.
    { id: 'wally-air', preset: 'wally', name: 'Wind-Sock Wally', held: null, at: PLANE_AT, seatedIn: 'plane', seat: 0 },
    { id: 'player-air', player: true, held: null, at: PLANE_AT, seatedIn: 'plane', seat: 1 },
  ],
  vehicles: [
    { id: 'plane', kind: 'plane', at: PLANE_AT, yaw: 0 },
  ],
  steps: [
    // 1. Hook: Wally in his deck chair, binoculars up, still watching the Anthill.
    { do: 'gesture', who: 'wally', name: 'sit', s: 0.3 },
    cut(spot(FIELD, 'chair')),
    { do: 'sfx', id: 'flutter', gain: 0.5, async: true },
    { do: 'wait', s: 1.6 },
    cut(CHAIR.single('wally', 'mcu', { height: 'high' })),
    { do: 'say', who: 'wally', text: 'Saw that. Four seconds of air. Not bad, kid.' },
    { do: 'intro', who: 'wally' },
    // 2. He stands. Wally stands only for something in the air.
    cut(CHAIR.single('wally', 'ms')),
    { do: 'face', who: 'wally', at: 'player', s: 0.4 },
    { do: 'gesture', who: 'wally', name: 'stand', s: 0.8 },
    { do: 'hold', who: 'wally', prop: null },
    { do: 'say', who: 'wally', text: "Plane's warm. Stall speed twenty-two. Wind's sou'-sou'-east. Good." },
    ...reaction('player', { toward: 'wally', gesture: 'nod', size: 'mcu', side: -25, hold: 'pause' }),
    // 3. The lift: the roll down the runway, the wheels off.
    { do: 'music', track: 'triumph', fade: 0.6 },
    { do: 'drive', vehicle: 'plane', path: CLIMB, speed: 34, arrive: false, async: true },
    cut(spot(FIELD, 'runway')),
    { do: 'sfx', id: 'engine-rev', at: 'plane', gain: 0.8 },
    { do: 'wait', s: 3.0 },
    // 4. Rootwell dropping away behind: a camera on the tail, looking back over the pilot at the Anthill.
    cut({ kind: 'follow', who: 'plane', offset: [1.1, 1.8, 3.4], look: [0, 0.8, -12], lag: 0.2, fov: 50 }),
    { do: 'sfx', id: 'static', gain: 0.4, async: true },
    { do: 'say', who: 'wally-air', text: 'Rootwell, this is Wally. Two souls, one lens. Going home.' },
    { do: 'wait', s: 0.8 },
    // 5. Button: the Anthill's dome, open and empty under the morning (W12).
    { do: 'music', track: 'turfton-dusk', fade: 1.4 },
    cut({ kind: 'cut', pos: up(1296, 560, 24), look: up(1258, 168.6, 6), fov: 18 }),
    { do: 'wait', s: 1.8 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  [P1_INTRO.id]: P1_INTRO,
  [P2_INTRO.id]: P2_INTRO,
  [P2_OUTRO.id]: P2_OUTRO,
  [P3_INTRO.id]: P3_INTRO,
  [P3_OUTRO.id]: P3_OUTRO,
  [FINAL_INTRO.id]: FINAL_INTRO,
  [FINAL_MID.id]: FINAL_MID,
  [FINAL_OUTRO.id]: FINAL_OUTRO,
};

