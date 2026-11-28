// Story row 69 scenes: The Combine Wakes, the first light of the longest day (tension 9; one gag a scene, and it is Hyssop's).
// - m69-the-combine-wakes-intro (dawn): the Compost Heap, the furnace dark for the first time in forty years. Ernie, a chestnut on his
//   trowel that he does not eat (his full stop, withheld), hears the Combine come up behind the heap, headlights over the ridge, and
//   sends the player to Chard's crews. The Combine is cutscene-only (prefab grand-combine-boss), moved between cuts.
// - m69-the-combine-wakes-mid (dawn): the gate of Even-Estates Plot 1. The crews run for the bus; Chard stands in the gate gap reading
//   his spirit level against forty identical houses, and says, flatly, what he has just understood. Then he gives an order, fast, for
//   the first time in the game.
// - m69-the-combine-wakes-outro (dawn): Hyssop's crossing. Hyssop in the road with her old stop-sign lollipop up; the Combine
//   comes along the z = 0 road; her gag is that it slows for exactly one second; it turns onto the meridian. Chard on the verge with his
//   hard hat in both hands; Hyssop hands the player a note (warm: come home, she will log the hour).
// Notes: docs/design/gnome-theft-auto/direction/scenes/m69-the-combine-wakes-{intro,mid,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, pullOut, pushIn, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const HEAP = 'compost-heap';
const GATE = 'm69-estates-gate';
const CROSS = 'm69-crossing';
const NOTES = 'docs/design/gnome-theft-auto/direction/scenes/';
const WORKER = { hat: 0xd9c8a5, shirt: 0xe07a1f, pants: 0x4a3a2a, beard: 0x9a8a78 } as const;

// ---- 1. Intro: the Heap goes dark --------------------------------------------------------------------------------------------
const H_ERNIE = markOf(HEAP, 'ernie');
const H_YOU = markOf(HEAP, 'player');
const HE = coverage('ernie', 'player', 1);
/** The Combine comes up behind Ernie (from the camera's side: the camera stands south-east of the furnace), grille to the lens: three stations, closer every cut. */
const C1: Vec2 = [-293, -103];
const C2: Vec2 = [-276, -86];
const C3: Vec2 = [-262, -72];
const FACE_HEAP = (p: Vec2): number => Math.atan2(-232 - p[0], -42 - p[1]);

/**
 * Dawn at the Compost Heap. The furnace has gone out. Ernie holds a roasted chestnut on his trowel and does not eat it. He starts
 * a hum and loses it. Behind the heap, two headlights come up over the ridge. He says what it is, where its line runs, who is in the
 * way, and sends the player on. The last image: the dark furnace and the lamps, growing.
 */
export const M69_INTRO: SceneScript = {
  id: 'm69-the-combine-wakes-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'tension',
  ambience: 'wind',
  radio: 0,
  direction: { notes: `${NOTES}m69-the-combine-wakes-intro.md`, kind: 'intro' },
  actors: [
    { id: 'ernie', preset: 'ernie', held: 'old-trowel', at: H_ERNIE.at, yaw: towards(H_ERNIE.at, H_YOU.at) },
    { id: 'player', player: true, held: null, at: H_YOU.at, yaw: towards(H_YOU.at, H_ERNIE.at) },
  ],
  props: [
    { id: 'combine', prefab: 'grand-combine-boss', at: C1, yaw: FACE_HEAP(C1), size: 14, by: 'w', hidden: true },
  ],
  steps: [
    // Hook: the Heap at first light, the furnace dark, the first time anyone has seen it so. A hum, and the hum stops.
    cut({ kind: 'cut', pos: up(-232, -42, 3.0), look: 'ernie', fov: 50 }),
    { do: 'sfx', id: 'rustle', at: 'ernie', gain: 0.3, async: true },
    { do: 'wait', s: 2.2 },
    // Setup: Ernie, a chestnut on the trowel he does not eat.
    cut(HE.single('ernie', 'mcu')),
    { do: 'say', who: 'ernie', text: 'Hmm hmm, hm. Hm. ...' },
    { do: 'gesture', who: 'ernie', name: 'shrug', s: 1.2, async: true },
    { do: 'say', who: 'ernie', text: 'Furnace went out. First time in forty years. ...Years.' },
    cut(HE.single('player', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'player', name: 'think', s: 1.0 },
    // Turn: the ridge behind him lights up.
    cut(shot('ernie', 'ms', { toward: 'player', side: -40 })),
    { do: 'spawn', id: 'combine', at: C2, yaw: FACE_HEAP(C2) },
    { do: 'sfx', id: 'engine-rev', at: up(C2[0], C2[1], 3), gain: 0.5, async: true },
    { do: 'stinger', id: 'danger' },
    { do: 'wait', s: 1.6 },
    cut(pushIn('ernie', 'mcu', 3.4, { to: 'cu', toward: 'player', side: -30 })),
    { do: 'gesture', who: 'ernie', name: 'flinch', s: 0.9, async: true },
    { do: 'say', who: 'ernie', text: 'It is moving. The whole thing. ...Thing.' },
    // The line it follows, and who is on it.
    cut(HE.single('player', 'mcu', { height: 'low' })),
    { do: 'say', who: 'player', text: 'Where is it going?' },
    cut(HE.single('ernie', 'mcu')),
    { do: 'say', who: 'ernie', text: "Its line runs through Chard's Estates. His lads sleep in caravans." },
    cut(HE.single('player', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'player', name: 'point', s: 0.9, async: true },
    { do: 'wait', s: 1.2 },
    // Button: the chestnut goes in the apron pocket, uneaten; the lamps come on, growing, over the dark furnace.
    cut(HE.single('ernie', 'mcu')),
    { do: 'sfx', id: 'cloth', at: 'ernie', gain: 0.4, async: true },
    { do: 'say', who: 'ernie', text: 'Go. Go on. Estates.' },
    cut({ kind: 'cut', pos: up(-232, -42, 3.0), look: 'ernie', fov: 50 }),
    { do: 'spawn', id: 'combine', at: C3, yaw: FACE_HEAP(C3) },
    { do: 'sfx', id: 'engine-rev', at: up(C3[0], C3[1], 3), gain: 0.7, async: true },
    { do: 'shake', amp: 0.04, s: 2.4 },
    { do: 'wait', s: 2.6 },
  ],
};

function towards(a: Vec2, b: Vec2): number {
  return Math.atan2(b[0] - a[0], b[1] - a[1]);
}

// ---- 2. Mid: the gate of Even-Estates -----------------------------------------------------------------------------------------
const G_CHARD = markOf(GATE, 'chard');
const G_YOU = markOf(GATE, 'player');
const G_W1 = markOf(GATE, 'levelright-worker', 0);
const G_W2 = markOf(GATE, 'levelright-worker', 1);
const G_W3 = markOf(GATE, 'levelright-worker', 2);
const GC = coverage('chard', 'player', 1);
/** The bus waits at the kerb round the corner from the gate gap (the quest's work bus spawns here). */
const BUS: Vec2 = [-335, -128];

/**
 * Dawn outside the gate of Plot 1. Three builders run for the bus past their foreman, who is standing still, looking through the gate
 * at forty identical houses with the same window lit. He taps a post with his spirit level, reads it, and says what he sees, flatly:
 * level to the hair, and nobody in one of them. Then he turns to his crew and, for the first time in the game, he is fast.
 */
export const M69_MID: SceneScript = {
  id: 'm69-the-combine-wakes-mid',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'sad',
  ambience: 'wind',
  radio: 0,
  direction: { notes: `${NOTES}m69-the-combine-wakes-mid.md`, kind: 'arrival' },
  actors: [
    { id: 'chard', preset: 'chard', held: 'spirit-level', at: G_CHARD.at, yaw: G_CHARD.yaw },
    { id: 'player', player: true, held: null, at: G_YOU.at, yaw: G_YOU.yaw },
    { id: 'w1', name: 'Builder', look: WORKER, held: 'foreman-hard-hat', at: G_W1.at, yaw: G_W1.yaw },
    { id: 'w2', name: 'Builder', look: WORKER, held: null, at: G_W2.at, yaw: G_W2.yaw },
    { id: 'w3', name: 'Builder', look: WORKER, held: null, at: G_W3.at, yaw: G_W3.yaw },
  ],
  vehicles: [{ id: 'bus', kind: 'snail-coach', at: BUS, yaw: Math.PI }],
  steps: [
    // Hook: the crew comes out of the yard at a run past a man who does not move.
    cut(spot('estates-plot-1-showhome', 'gate-wide')),
    { do: 'walk', who: 'w1', path: [[-321, -120.6], [-326, -124.8], BUS], speed: 3.2, async: true },
    { do: 'walk', who: 'w2', path: [[-321, -119.6], [-326, -124.2], BUS], speed: 3.0, async: true },
    { do: 'walk', who: 'w3', path: [[-321, -121.0], [-326, -125.4], BUS], speed: 3.4, async: true },
    { do: 'sfx', id: 'footsteps', at: 'w1', gain: 0.4, async: true },
    { do: 'sfx', id: 'engine-rev', at: [-200, 3, -90], gain: 0.3, async: true },
    { do: 'wait', s: 2.8 },
    // Setup: the foreman, the level, the post.
    { do: 'face', who: 'chard', at: 'player', s: 0.3 },
    cut(GC.single('chard', 'mcu')),
    { do: 'sfx', id: 'tap', at: 'chard', gain: 0.4, async: true },
    { do: 'say', who: 'chard', text: 'Forty houses. Level to the hair.' },
    { do: 'wait', s: 0.8 },
    // Turn: he says it, flat, the way he says a measurement.
    cut(pushIn('chard', 'mcu', 4.0, { to: 'cu', toward: 'player', side: 25 })),
    { do: 'say', who: 'chard', text: 'Nobody lives in one. I built beige houses for nobody.' },
    beat('pause'),
    cut(GC.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'beckon', s: 1.0, async: true },
    { do: 'wait', s: 0.8 },
    // Button: he is fast. Boots, bus, now.
    cut(GC.single('chard', 'ms', { height: 'low' })),
    { do: 'gesture', who: 'chard', name: 'point', s: 0.9, async: true },
    { do: 'say', who: 'chard', text: 'Boots. Bus. Now. Everybody.' },
    { do: 'walk', who: 'chard', path: [[-326, -124.8], BUS], speed: 3.4, async: true },
    cut(spot('estates-plot-1-showhome', 'gate-wide')),
    { do: 'wait', s: 2.0 },
  ],
};

// ---- 3. Outro: Hyssop's crossing ------------------------------------------------------------------------------------------------
const X_HYSSOP = markOf(CROSS, 'hyssop');
const X_CHARD = markOf(CROSS, 'chard');
const X_YOU = markOf(CROSS, 'player');
const XH = coverage('hyssop', 'player', 1);
const XC = coverage('chard', 'player', 1);
/** The Combine's way: along the z = 0 road from the west, then it turns north onto the meridian at (0, 0). */
const W_FAR: Vec2 = [-96, 0];
const W_NEAR: Vec2 = [-34, 0];
const W_TURN: Vec2 = [-1, 2];
const W_AWAY: Vec2 = [0, -34];

/**
 * Dawn at the crossing. Hyssop stands in the middle of the z = 0 road with her stop-sign lollipop up and says "Stop." The Grand
 * Combine, a street long, comes on from the west; it slows for exactly one second (a held breath and no engine) and she says, for the
 * record, that it slowed; then it rolls on and turns onto the meridian. Chard watches from the verge with his hard hat in his hands:
 * a good straight line. Hyssop gives the player a note and a promise to log the hour. The last image: her lollipop still up in an empty
 * road.
 */
export const M69_OUTRO: SceneScript = {
  id: 'm69-the-combine-wakes-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'tension',
  ambience: 'street',
  radio: 0,
  direction: { notes: `${NOTES}m69-the-combine-wakes-outro.md`, kind: 'outro' },
  actors: [
    { id: 'hyssop', preset: 'hyssop', held: 'stop-sign-lollipop', at: X_HYSSOP.at, yaw: X_HYSSOP.yaw },
    { id: 'chard', preset: 'chard', held: 'foreman-hard-hat', at: X_CHARD.at, yaw: X_CHARD.yaw },
    { id: 'player', player: true, held: null, at: X_YOU.at, yaw: X_YOU.yaw },
  ],
  props: [
    { id: 'combine', prefab: 'grand-combine-boss', at: W_FAR, yaw: Math.PI / 2, size: 14, by: 'w', hidden: true },
  ],
  steps: [
    // Hook: a woman in a cardigan in the middle of an empty road, a red sign at full arm, and a noise from the west.
    cut(XH.single('hyssop', 'ms')),
    { do: 'sfx', id: 'engine-rev', at: [W_FAR[0], 3, W_FAR[1]], gain: 0.5, async: true },
    { do: 'spawn', id: 'combine', at: W_FAR, yaw: Math.PI / 2 },
    { do: 'wait', s: 1.8 },
    // Setup: she says it, once.
    cut({ kind: 'cut', pos: up(-17.4, 1.9, 1.2), look: 'hyssop', fov: 28 }),
    { do: 'say', who: 'hyssop', text: 'Stop.' },
    // The machine comes on; the engine drops out for exactly one second.
    cut({ kind: 'cut', pos: [X_HYSSOP.at[0] + 4.5, 1.4, X_HYSSOP.at[1] - 5], look: [W_NEAR[0], 3, W_NEAR[1]], fov: 44 }),
    { do: 'spawn', id: 'combine', at: W_NEAR, yaw: Math.PI / 2 },
    { do: 'sfx', id: 'engine-rev', at: [W_NEAR[0], 3, W_NEAR[1]], gain: 0.8, async: true },
    { do: 'shake', amp: 0.03, s: 1.6 },
    { do: 'wait', s: 1.8 },
    { do: 'music', track: null, fade: 0.2 },
    { do: 'ambience', bed: null, fade: 0.2 },
    { do: 'face', who: 'hyssop', at: 'player', s: 0.3 },
    cut(shot('hyssop', 'mcu', { toward: 'player', side: 25 })),
    { do: 'wait', s: 1.0 },
    { do: 'music', track: 'tension', fade: 0.4 },
    { do: 'ambience', bed: 'street', fade: 0.4 },
    { do: 'say', who: 'hyssop', text: '...It slowed. For the record?' },
    // The turn onto the meridian: the machine goes by, a street long.
    cut({ kind: 'cut', pos: [-8, 2.2, 11], look: [0, 3, 0], fov: 50 }),
    { do: 'spawn', id: 'combine', at: W_TURN, yaw: Math.PI * 0.75 },
    { do: 'sfx', id: 'engine-rev', at: [0, 3, 0], gain: 0.9, async: true },
    { do: 'shake', amp: 0.05, s: 2.4 },
    { do: 'wait', s: 2.4 },
    cut({ kind: 'cut', pos: [-9, 1.8, 6.5], look: [0, 3, -22], fov: 46 }),
    { do: 'spawn', id: 'combine', at: W_AWAY, yaw: Math.PI },
    { do: 'wait', s: 1.8 },
    // Chard, on the verge, hard hat in both hands: what a straight line is.
    cut(XC.single('chard', 'mcu')),
    { do: 'say', who: 'chard', text: 'That is a good straight line. I would have built on it.' },
    ...reaction('player', { toward: 'chard', gesture: 'nod', hold: 'pause', side: 25 }),
    // Button: Hyssop hands the player a note; the lollipop is still up.
    cut(XH.single('hyssop', 'mcu')),
    { do: 'give', from: 'hyssop', to: 'player', prop: 'scribbled-note', s: 1.0 },
    { do: 'say', who: 'hyssop', text: 'Come home. I will log the hour.' },
    cut(pullOut('hyssop', 'ms', 4.0, { to: 'ws', toward: 'player', side: 40 })),
    { do: 'wait', s: 2.2 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm69-the-combine-wakes-intro': M69_INTRO,
  'm69-the-combine-wakes-mid': M69_MID,
  'm69-the-combine-wakes-outro': M69_OUTRO,
};
