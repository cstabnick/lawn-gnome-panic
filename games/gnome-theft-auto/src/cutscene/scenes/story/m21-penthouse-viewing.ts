// Story row 21: Penthouse Viewing. Vesper in his own quiet: no music (the Double Pot is the one place it drops out), a lift
// tone, an even beige light, and every shot of him low, alone and still. The beige card on the mat of flat 3B, Gary and Cam
// at the Patio Gate, the tour through the Double Pot Tunnel (the lantern, never explained), and two outros for the only
// choice that is cosmetic. Notes: docs/design/gnome-theft-auto/direction/scenes/m21-penthouse-viewing-*.md.
import type { SceneScript, ScriptActor, Vec2, Vec3 } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { markOf, spot } from './kit';

type Look = NonNullable<ScriptActor['look']>;

const COURT = 'saucer-court-mat';
const GATE = 'patio-gate';
/** The Double Pot roof garden (stage id kept from the tunnel it replaced). */
const TUNNEL = 'double-pot-tunnel';
/** The slab top, metres above the tunnel floor: every roof actor, prop and camera point lifts by this. */
const ROOF = 9;
const onRoof = (p: Vec2, h = 0): Vec3 => [p[0], ROOF + h, p[1]];

/** Beige: the HOA courier's coat and Cam's new vest. */
const BEIGE = 0xd8c8a8;
const COURIER_LOOK: Look = { hat: BEIGE, shirt: BEIGE, pants: 0xbcae94, beard: 0xeeeeee };
const CAM_VEST: Look = { shirt: BEIGE };

/** Vesper's recorded voice on the card: an off-screen speaker at his cast pitch. */
const CARD = 'Vesper (card)';
const VESPER_HZ = 92;

// ---- Stage marks ------------------------------------------------------------------------------------------------------
const COURT_PLAYER = markOf(COURT, 'player');
const MAT: Vec2 = [30.9, 83.8];
const GATE_PLAYER = markOf(GATE, 'player');
const GATE_GARY = markOf(GATE, 'gary');
const GATE_CAM = markOf(GATE, 'turncoat-cam');
const TUNNEL_VESPER = markOf(TUNNEL, 'vesper', 0);
const TUNNEL_PLAYER = markOf(TUNNEL, 'player', 0);
const TABLE_PLAYER = markOf(TUNNEL, 'player', 1);
const TABLE_VESPER = markOf(TUNNEL, 'vesper', 1);
/** The beige table on the north half of the roof, its top, and the lantern post by the stairwell. */
const TABLE: Vec2 = [121.5, -105.5];
const TABLE_TOP = 0.84;
const LANTERN_STOP: Vec2 = [116.2, -84.2];
const LANTERN: Vec3 = [113.5, ROOF + 1.4, -84.8];
/** Warm practical on the lantern post. */
const LANTERN_LIGHT = { at: LANTERN, color: 0xffb066, intensity: 7, range: 9, flicker: true } as const;

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- 1. Intro: the card on the mat ------------------------------------------------------------------------------------

/** Afternoon, flat light. A beige courier leaves a beige card and no conversation; the card talks. */
export const M21_INTRO: SceneScript = {
  id: 'm21-penthouse-viewing-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  title: 'Penthouse Viewing',
  ambience: 'street',
  radio: 0.3,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m21-penthouse-viewing-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: COURT_PLAYER.at, yaw: COURT_PLAYER.yaw },
    { id: 'courier', name: 'HOA Courier', look: COURIER_LOOK, hidden: true, at: [33, 88], yaw: Math.PI },
  ],
  props: [{ id: 'card', prefab: 'citation-slip', at: MAT, size: 0.35, by: 'w', hidden: true }],
  steps: [
    // Hook: the mat, empty, then footsteps and a beige coat: the card is put down, not handed over.
    { do: 'sfx', id: 'footsteps', gain: 0.4, async: true },
    cut(spot(COURT, 'mat')),
    { do: 'spawn', id: 'courier', at: [33, 88], yaw: towards([33, 88], MAT) },
    { do: 'walk', who: 'courier', path: [[31.6, 84.6]], speed: 2.2 },
    { do: 'gesture', who: 'courier', name: 'bow', s: 1.0, async: true },
    { do: 'sfx', id: 'paper', at: 'courier', gain: 0.5 },
    { do: 'spawn', id: 'card' },
    beat('beat'),
    // The courier crosses the saucer court from straight above and never looks back (the signature shot of the place).
    cut(spot(COURT, 'overhead')),
    { do: 'walk', who: 'courier', path: [[34, 96], [32, 108], [30, 118]], speed: 3.4, async: true },
    { do: 'sfx', id: 'footsteps', gain: 0.4, async: true },
    { do: 'wait', s: 2.6 },
    // The player picks it up; the card speaks, in Vesper's voice, perfectly polite.
    cut(shot('player', 'ms', { height: 'high' })),
    { do: 'walk', who: 'player', path: [[31.6, 85.2]], speed: 1.6 },
    cut(shot('player', 'mcu')),
    { do: 'sfx', id: 'paper', at: 'player', gain: 0.5, async: true },
    { do: 'despawn', id: 'card' },
    { do: 'hold', who: 'player', prop: 'citation-slip' },
    { do: 'sfx', id: 'static', gain: 0.45, async: true },
    { do: 'say', who: CARD, hz: VESPER_HZ, text: 'The penthouse is ready to view, friend. There are no conditions.' },
    ...reaction('player', { gesture: 'think', hold: 'pause' }),
    { do: 'say', who: 'player', text: 'No conditions?' },
    cut(shot('player', 'ms', { side: 40 })),
    { do: 'say', who: CARD, hz: VESPER_HZ, text: 'Present this card at the Patio Gate. Gary will wave you through.' },
    // The button: the card clicks off, and the player's flat line.
    { do: 'sfx', id: 'static', gain: 0.4, async: true },
    cut(shot('player', 'cu', { height: 'high' })),
    beat('pause'),
    cut(shot('player', 'mcu')),
    { do: 'say', who: 'player', text: 'He knows my address.' },
  ],
};

// ---- 2. Arrival: the Patio Gate -----------------------------------------------------------------------------------------

const GARY_P = coverage('gary', 'player', 1);
const VESPER_P = coverage('vesper', 'player', -1);

/** Day. Gary sighs a card through; Cam, in a beige HOA vest with a valet's key, never meets the player's eye. */
export const M21_GATE: SceneScript = {
  id: 'm21-penthouse-viewing-gate',
  stage: { kind: 'world' },
  sky: 'noon',
  ambience: 'street',
  radio: 0.3,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m21-penthouse-viewing-gate.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: GATE_PLAYER.at, yaw: towards(GATE_PLAYER.at, GATE_GARY.at) },
    { id: 'gary', preset: 'gary', held: null, at: GATE_GARY.at, yaw: towards(GATE_GARY.at, GATE_PLAYER.at) },
    // Cam, in a vest, with a valet's key where the broom used to be. He never speaks.
    { id: 'cam', preset: 'turncoat cam', look: CAM_VEST, held: 'brass-key', at: GATE_CAM.at, yaw: GATE_CAM.yaw },
  ],
  steps: [
    // Hook: Gary takes the card and sighs.
    { do: 'hold', who: 'player', prop: 'citation-slip' },
    cut(GARY_P.single('gary', 'mcu')),
    { do: 'give', from: 'player', to: 'gary', prop: 'citation-slip', s: 0.9 },
    { do: 'say', who: 'gary', text: 'Sigh. A beige card. Section eleven permits beige.' },
    // Cam crosses behind with a key, in a vest. The player has noticed.
    { do: 'walk', who: 'cam', path: [[167, -125.5], [174, -124]], speed: 1.5, async: true },
    { do: 'sfx', id: 'keys', at: 'cam', gain: 0.5, async: true },
    { do: 'face', who: 'player', at: 'cam', s: 0.5 },
    cut(shot('player', 'mcu', { toward: 'cam' })),
    { do: 'say', who: 'player', text: 'Cam?' },
    // He does not meet the player's eye: he turns his face away and keeps walking.
    cut(shot('cam', 'mcu', { toward: 'player' })),
    { do: 'face', who: 'cam', yaw: towards(GATE_CAM.at, [174, -124]), s: 0.6 },
    beat('pause'),
    // Gary sighs again, at the vest.
    cut(GARY_P.single('gary', 'mcu')),
    { do: 'say', who: 'gary', text: 'Sigh. New valet. Do not talk to him. Mind the beige.' },
    { do: 'sfx', id: 'latch', at: 'gary', gain: 0.5, async: true },
    cut(GARY_P.single('gary', 'ms')),
    // Button: the wave-through, and the next place, in his voice.
    { do: 'gesture', who: 'gary', name: 'wave', s: 1.4, async: true },
    { do: 'say', who: 'gary', text: 'Wave through. Thorne Tower, lobby. He is already standing.' },
  ],
};

// ---- 3. Mid: the tour ---------------------------------------------------------------------------------------------------

/** Day, no music, a lift tone. He is already standing; they walk; the lantern; the key on the table. */
export const M21_MID: SceneScript = {
  id: 'm21-penthouse-viewing-mid',
  stage: { kind: 'world' },
  sky: 'noon',
  ambience: 'office',
  radio: 0.15,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m21-penthouse-viewing-mid.md', kind: 'arrival', waive: [{ code: 'crosses-line', match: 'None?', why: 'Vesper is framed head-on after the walk so he never shows his back; the player reverse swings once' }] },
  actors: [
    { id: 'player', player: true, held: null, at: onRoof(TUNNEL_PLAYER.at), yaw: TUNNEL_PLAYER.yaw },
    { id: 'vesper', preset: 'vesper', held: null, at: onRoof(TUNNEL_VESPER.at), yaw: TUNNEL_VESPER.yaw },
  ],
  keyLights: [LANTERN_LIGHT],
  props: [{ id: 'key', prefab: 'penthouse-key', at: onRoof(TABLE, TABLE_TOP), size: 0.4, by: 'h', hidden: true }],
  steps: [
    // Hook: he is already standing there. Low, alone, still.
    cut(VESPER_P.single('vesper', 'mcu', { height: 'low' })),
    { do: 'say', who: 'vesper', text: 'You are early, friend. I appreciate that.' },
    cut(VESPER_P.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'A penthouse?' },
    cut(VESPER_P.single('vesper', 'mcu', { height: 'low' })),
    { do: 'say', who: 'vesper', text: 'A flat above the street. Beige. Even. Silent. Nothing is asked of you.' },
    // The walk: south down the tunnel, Vesper first, the player a pace behind.
    { do: 'walk', who: 'vesper', path: [onRoof(LANTERN_STOP)], speed: 1.7, async: true },
    { do: 'walk', who: 'player', path: [onRoof([120, -80])], speed: 1.7, async: true },
    cut(VESPER_P.single('vesper', 'ms', { height: 'low' })),
    { do: 'wait', s: 4.4 },
    // The turn: the lantern. He flinches, and says nothing of it.
    { do: 'sfx', id: 'creak', at: LANTERN, gain: 0.5, async: true },
    cut(spot(TUNNEL, 'lantern')),
    { do: 'wait', s: 1.4 },
    cut(VESPER_P.single('vesper', 'cu', { height: 'low' })),
    { do: 'gesture', who: 'vesper', name: 'flinch', s: 1.0, async: true },
    { do: 'sfx', id: 'cloth', at: 'vesper', gain: 0.5, async: true },
    beat('silence'),
    cut(VESPER_P.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'think', s: 1.1, async: true },
    beat('pause'),
    cut(shot('vesper', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'vesper', name: 'tipHat', s: 0.8, async: true },
    { do: 'say', who: 'vesper', text: 'This way, friend.' },
    // The table: the key appears. No conditions.
    { do: 'walk', who: 'vesper', path: [onRoof(TABLE_VESPER.at)], speed: 1.6, async: true },
    { do: 'walk', who: 'player', path: [onRoof(TABLE_PLAYER.at)], speed: 1.6, async: true },
    cut(spot(TUNNEL, 'table')),
    { do: 'wait', s: 2.8 },
    { do: 'spawn', id: 'key' },
    { do: 'sfx', id: 'keys', at: 'key', gain: 0.6, async: true },
    cut(shot('vesper', 'mcu', { height: 'low' })),
    { do: 'say', who: 'vesper', text: 'The key. It is yours. There are no conditions.' },
    cut(shot('player', 'mcu')),
    { do: 'say', who: 'player', text: 'None?' },
    cut(shot('vesper', 'mcu', { height: 'low' })),
    { do: 'say', who: 'vesper', text: 'None. That is the offer. I will wait in the lobby.' },
    // Button: the key on the table, the lift tone under it, and nobody to ask.
    { do: 'sfx', id: 'footsteps', gain: 0.4, async: true },
    cut(spot(TUNNEL, 'table')),
    { do: 'wait', s: 2.4 },
  ],
};

// ---- 4. Outros: the key, or the table -----------------------------------------------------------------------------------

/** Vesper by the lift kiosk, dusk, facing the table across the roof. */
const OUTRO_VESPER = { at: onRoof(TUNNEL_VESPER.at), yaw: Math.PI };

/** Outro A, dusk: the key goes in the player's pocket. He says only what a host says, and it is enough. */
export const M21_OUTRO: SceneScript = {
  id: 'm21-penthouse-viewing-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'office',
  keyLights: [LANTERN_LIGHT],
  radio: 0.15,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m21-penthouse-viewing-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: onRoof(TABLE_PLAYER.at), yaw: towards(TABLE_PLAYER.at, TABLE) },
    { id: 'vesper', preset: 'vesper', held: null, at: OUTRO_VESPER.at, yaw: OUTRO_VESPER.yaw },
  ],
  props: [{ id: 'key', prefab: 'penthouse-key', at: onRoof(TABLE, TABLE_TOP), size: 0.4, by: 'h' }],
  steps: [
    // Hook: the hand takes the key.
    cut(shot('player', 'cu', { height: 'high', side: 30 })),
    { do: 'sfx', id: 'keys', at: 'player', gain: 0.6, async: true },
    { do: 'despawn', id: 'key' },
    { do: 'hold', who: 'player', prop: 'penthouse-key' },
    beat('pause'),
    // Vesper, far down the tunnel, still: the line is the whole reply.
    cut(pushIn('vesper', 'mcu', 5, { height: 'low' })),
    { do: 'say', who: 'vesper', text: 'It will hang well in your hall.' },
    ...reaction('player', { gesture: 'clutch', hold: 'pause' }),
    // Button: the lantern by the stairwell, lit, and him turning away from it.
    cut(spot(TUNNEL, 'lantern')),
    { do: 'sfx', id: 'footsteps', gain: 0.4, async: true },
    { do: 'wait', s: 2.6 },
  ],
};

/** Outro B, dusk: the key is left on the table. "Agreeable." The table keeps it. */
export const M21_OUTRO_TABLE: SceneScript = {
  id: 'm21-penthouse-viewing-outro-table',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'office',
  keyLights: [LANTERN_LIGHT],
  radio: 0.15,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m21-penthouse-viewing-outro-table.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: onRoof([114.8, -106.4]), yaw: towards([114.8, -106.4], TABLE) },
    { id: 'vesper', preset: 'vesper', held: null, at: OUTRO_VESPER.at, yaw: OUTRO_VESPER.yaw },
  ],
  props: [{ id: 'key', prefab: 'penthouse-key', at: onRoof(TABLE, TABLE_TOP), size: 0.4, by: 'h' }],
  steps: [
    // Hook: the key, alone on the table, the tunnel behind it going dark at the edges.
    cut(spot(TUNNEL, 'table')),
    { do: 'sfx', id: 'tap', at: 'key', gain: 0.4, async: true },
    { do: 'wait', s: 2.2 },
    // Vesper, still, not displeased: that is the unsettling part.
    cut(pushIn('vesper', 'mcu', 5, { height: 'low' })),
    { do: 'say', who: 'vesper', text: 'Agreeable. The table will keep it for you.' },
    ...reaction('player', { gesture: 'shrug', hold: 'pause' }),
    // Button: the key on the table, and the lantern behind it, and nothing else.
    cut(spot(TUNNEL, 'long')),
    { do: 'sfx', id: 'footsteps', gain: 0.4, async: true },
    { do: 'wait', s: 2.6 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm21-penthouse-viewing-intro': M21_INTRO,
  'm21-penthouse-viewing-gate': M21_GATE,
  'm21-penthouse-viewing-mid': M21_MID,
  'm21-penthouse-viewing-outro': M21_OUTRO,
  'm21-penthouse-viewing-outro-table': M21_OUTRO_TABLE,
};
