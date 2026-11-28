// Story row 67 (m67-emergency-assessment): Emergency Assessment. Three scenes: Hedda at her street desk, typing the story as an HOA van
// announces it (her filing-as-it-happens gag is the only gag in the row); Reginald opening City Hall's service door with a caliper
// in his hand, saying the door is a quarter-inch under code and that he did not report it; and Juniper walking out of the side door
// without him, Reginald staying behind to measure something, the Vances looking at each other once, plainly, for the first time.
// There is no walk-in City Hall interior, so the door is a world set beside the building (as in E21). The van, the door leaves
// and the loudspeaker crier are cutscene-only.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m67-emergency-assessment-{intro,mid,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, insert, pushIn, shot } from '../../direct';
import { markOf, spot } from './kit';

const DESK = 'm67-tattler-desk';
const YARD = 'm67-side-door-yard';

const toward = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- 1. Intro: the desk (day) -----------------------------------------------------------------------------------------------
const D_HEDDA = markOf(DESK, 'hedda');
const D_PLAYER = markOf(DESK, 'player');
const FILING = coverage('hedda', 'player', 1);
/** The road in front of the desk: the van comes along the eastbound lane (z = 2.5) and idles by the gate. */
const VAN_FROM: Vec2 = [-136, 2.5];
const VAN_STOP: Vec2 = [-100, 2.5];
const VAN_AWAY: Vec2 = [-72, 2.5];

/**
 * Midday at the Tattler's pavement desk. Hedda types the story as it happens and says the headline before anyone has told her. An
 * HOA van creeps up with a loudspeaker: City Hall is under emergency assessment, pending a small fee. She has typed the fee into the
 * story already. Then the facts, in telegrams: Juniper held, side door on the west wall, and Reginald, her one unconfirmed source,
 * has telephoned her himself. She sends the player off and files.
 */
export const M67_INTRO: SceneScript = {
  id: 'm67-emergency-assessment-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'tension',
  ambience: 'street',
  radio: 0.1,
  title: 'Emergency Assessment',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m67-emergency-assessment-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: D_PLAYER.at, yaw: D_PLAYER.yaw },
    { id: 'hedda', preset: 'hedda', held: null, at: D_HEDDA.at, yaw: D_HEDDA.yaw },
    { id: 'crier', name: 'HOA Crier', look: { hat: 0x18181e, shirt: 0xc9b99b, beard: 0x6b6b6b }, at: [0, 0], seatedIn: 'van' },
  ],
  vehicles: [{ id: 'van', kind: 'hoa-van', at: VAN_FROM, yaw: Math.PI / 2 }],
  steps: [
    // 1. Hook: the printer chattering and a woman talking over it to nobody.
    cut(spot(DESK, 'road')),
    { do: 'sfx', id: 'tap', at: 'hedda', gain: 0.5, async: true },
    { do: 'sfx', id: 'clatter', at: 'hedda', gain: 0.3, async: true },
    { do: 'drive', vehicle: 'van', path: [VAN_STOP], speed: 4.5, async: true },
    { do: 'wait', s: 3.2 },
    cut(FILING.single('hedda', 'mcu')),
    { do: 'say', who: 'hedda', text: 'Emergency. HOA. City Hall. Seized.' },
    // 2. The van arrives and announces it, with a loudspeaker, to a street that already knows.
    { do: 'horn', vehicle: 'van' },
    cut(shot('crier', 'mcu', { toward: 'hedda', side: 40 })),
    { do: 'say', who: 'crier', text: 'Residents, remain even. City Hall is under emergency assessment. A small fee applies.' },
    // 3. The gag: she typed it before he said it.
    cut(FILING.single('hedda', 'mcu')),
    { do: 'gesture', who: 'hedda', name: 'think', s: 0.8, async: true },
    { do: 'sfx', id: 'tap', at: 'hedda', gain: 0.5, async: true },
    { do: 'say', who: 'hedda', text: 'Small fee. Typed. Filed.' },
    // 4. The facts, as telegrams. She turns to the player.
    cut(pushIn('hedda', 'mcu', 4.0, { to: 'cu', toward: 'player', side: 25 })),
    { do: 'say', who: 'hedda', text: 'Juniper. Held. Inside. Side door, west wall.' },
    cut(FILING.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Who opens it?' },
    cut(FILING.single('hedda', 'mcu')),
    { do: 'say', who: 'hedda', text: 'Reginald. Telephoned me. Himself. First time.' },
    cut(FILING.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'nod', s: 0.9, async: true },
    { do: 'wait', s: 1.5 },
    // 5. Button: she sends them and goes back to the keys; the van creeps on to the next gate.
    cut(FILING.single('hedda', 'mcu')),
    { do: 'say', who: 'hedda', text: 'Drive. I file.' },
    { do: 'drive', vehicle: 'van', path: [VAN_AWAY], speed: 6, async: true },
    cut(spot(DESK, 'road')),
    { do: 'sfx', id: 'tap', at: 'hedda', gain: 0.5, async: true },
    { do: 'wait', s: 3.0 },
  ],
};

// ---- 2. Mid: the door (day) -------------------------------------------------------------------------------------------------
const Y_PLAYER = markOf(YARD, 'player');
const Y_REG = markOf(YARD, 'reginald', 0);
const DOOR_X = 9.85;
const DOOR_Z = -88.0;
const OPEN_SPOT: Vec2 = [9.72, -86.9];
const DOORWAY: Vec2 = [9.3, -88.0];
const DOOR = coverage('reginald', 'player', 1);

/**
 * The side-door yard. A swept lane, a plain steel door in City Hall's west wall, a far siren. A bolt draws and the door opens inward:
 * Reginald in the doorway with a caliper in his hand, correct to the last millimetre. The door is a quarter-inch under code, he says,
 * and he did not report it. The player thanks him; he says he did nothing, he measured. Three enforcers in the yard, and he will not
 * be here. He steps back in.
 */
export const M67_MID: SceneScript = {
  id: 'm67-emergency-assessment-mid',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'tension',
  ambience: 'street',
  radio: 0.1,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m67-emergency-assessment-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: Y_PLAYER.at, yaw: toward(Y_PLAYER.at, [DOOR_X, DOOR_Z]) },
    { id: 'reginald', preset: 'reginald', at: DOORWAY, yaw: Y_REG.yaw, hidden: true },
  ],
  props: [
    { id: 'door-shut', prefab: 'panelled-door', at: [DOOR_X, DOOR_Z], yaw: -Math.PI / 2, size: 2.2, by: 'h' },
    { id: 'door-open', prefab: 'panelled-door', at: OPEN_SPOT, yaw: -Math.PI / 2, size: 2.2, by: 'h', hidden: true },
  ],
  steps: [
    // 1. Hook: a shut door in a plain wall, and a bolt drawn from the far side.
    cut(spot(YARD, 'yard-wide')),
    { do: 'sfx', id: 'latch', at: [DOOR_X, 1.0, DOOR_Z], gain: 0.5, async: true },
    { do: 'wait', s: 1.8 },
    // 2. The door opens inward on him.
    cut(spot(YARD, 'door-low')),
    { do: 'sfx', id: 'door-creak', at: [DOOR_X, 1.0, DOOR_Z], gain: 0.5, async: true },
    { do: 'despawn', id: 'door-shut' },
    { do: 'spawn', id: 'door-open' },
    { do: 'spawn', id: 'reginald' },
    { do: 'wait', s: 1.2 },
    cut(DOOR.single('reginald', 'mcu', { height: 'low' })),
    { do: 'say', who: 'reginald', text: 'This service door is a quarter-inch under code.' },
    cut(insert('reginald', { toward: 'player', side: 30 })),
    { do: 'sfx', id: 'clink', at: 'reginald', gain: 0.4, async: true },
    { do: 'wait', s: 1.0 },
    cut(DOOR.single('reginald', 'mcu')),
    { do: 'say', who: 'reginald', text: 'I did not report it.' },
    // 3. The player thanks him; he will not take it.
    cut(DOOR.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Thank you.' },
    cut(DOOR.single('reginald', 'mcu')),
    { do: 'say', who: 'reginald', text: 'Do not. I did nothing. I measured.' },
    cut(DOOR.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'nod', s: 0.8, async: true },
    { do: 'wait', s: 1.1 },
    // 4. The job, in his own terms; he steps back inside.
    cut(DOOR.single('reginald', 'mcu', { height: 'low' })),
    { do: 'say', who: 'reginald', text: 'Three enforcers in the yard. I will not be here.' },
    { do: 'walk', who: 'reginald', path: [[9.7, -88.0]], speed: 0.8, async: true },
    { do: 'sfx', id: 'latch', at: 'reginald', gain: 0.3, async: true },
    { do: 'wait', s: 1.0 },
  ],
};

// ---- 3. Outro: Juniper out, Reginald stays (dusk) ---------------------------------------------------------------------------
const O_JUNIPER = markOf(YARD, 'juniper');
const O_REG = markOf(YARD, 'reginald', 1);
const O_PLAYER = markOf(YARD, 'player');
const SIBLINGS = coverage('juniper', 'reginald', -1);

/**
 * The same door, a few minutes later, in the last light. Juniper steps out with the counter-order folded under her arm. Reginald
 * stays in the doorway: there is something he must measure. For once neither of them insults the other. They look at each other for
 * two seconds, plainly, which in thirty years has not happened. "Measure it twice." "Twice." He closes the door; she walks on.
 */
export const M67_OUTRO: SceneScript = {
  id: 'm67-emergency-assessment-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'sad',
  ambience: 'street',
  radio: 0.08,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m67-emergency-assessment-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: O_PLAYER.at, yaw: toward(O_PLAYER.at, O_JUNIPER.at) },
    { id: 'juniper', preset: 'juniper', held: null, at: DOORWAY, yaw: Y_REG.yaw, hidden: true },
    { id: 'reginald', preset: 'reginald', at: O_REG.at, yaw: toward(O_REG.at, O_JUNIPER.at) },
  ],
  props: [{ id: 'door-open', prefab: 'panelled-door', at: OPEN_SPOT, yaw: -Math.PI / 2, size: 2.2, by: 'h' }],
  steps: [
    // 1. Hook: the open door, and a councilwoman stepping out of it into the light.
    cut(spot(YARD, 'door-low')),
    { do: 'sfx', id: 'door-creak', at: [DOOR_X, 1.0, DOOR_Z], gain: 0.4, async: true },
    { do: 'spawn', id: 'juniper' },
    { do: 'walk', who: 'juniper', path: [O_JUNIPER.at], speed: 1.6, async: true },
    { do: 'sfx', id: 'footsteps', at: 'juniper', gain: 0.3, async: true },
    { do: 'wait', s: 2.2 },
    cut(shot('juniper', 'mcu', { toward: 'player', side: 30, height: 'low' })),
    { do: 'say', who: 'juniper', text: 'Thank you. I have a signature to deliver.' },
    // 2. He does not come out.
    cut(SIBLINGS.single('reginald', 'mcu')),
    { do: 'say', who: 'reginald', text: 'I will stay. There is something to measure.' },
    // 3. The look: two in profile, no line, a held silence.
    { do: 'face', who: 'juniper', at: 'reginald', s: 0.6, async: true },
    cut(shot('juniper', 'ms', { toward: 'reginald', side: 90 })),
    { do: 'music', track: null, fade: 0.6 },
    { do: 'sfx', id: 'tap', at: 'reginald', gain: 0.25, async: true },
    beat('silence'),
    { do: 'music', track: 'sad', fade: 2.0 },
    // 4. Her one instruction, in his own language.
    cut(SIBLINGS.single('juniper', 'cu')),
    { do: 'say', who: 'juniper', text: 'Measure it twice.' },
    cut(SIBLINGS.single('reginald', 'cu')),
    { do: 'say', who: 'reginald', text: 'Twice.' },
    // 5. Button: the door closes; she walks to the car without looking back, and the player follows.
    { do: 'sfx', id: 'door-creak', at: [DOOR_X, 1.0, DOOR_Z], gain: 0.4, async: true },
    { do: 'despawn', id: 'door-open' },
    { do: 'walk', who: 'juniper', path: [[O_PLAYER.at[0] + 2, O_PLAYER.at[1] - 1]], speed: 1.5, async: true },
    cut(spot(YARD, 'yard-wide')),
    { do: 'sfx', id: 'latch', at: [DOOR_X, 1.0, DOOR_Z], gain: 0.4, async: true },
    { do: 'wait', s: 2.8 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm67-emergency-assessment-intro': M67_INTRO,
  'm67-emergency-assessment-mid': M67_MID,
  'm67-emergency-assessment-outro': M67_OUTRO,
};
