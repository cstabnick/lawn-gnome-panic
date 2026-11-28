// Story row 39: Couch Surfing. Three scenes. Intro (night, the Central Bus Stop): Pip rings from behind a dumpster while two HOA
// watchers walk past in step, asks for a couch, and is stuck with a COMPLIANT sticker. Mid (night, Saucer Court): Hyssop Doormat
// at her stairwell door in a dressing gown asks if Pip is a lodger, and her old crossing-warden's paddle does the rest. Outro
// (night, the Under-Deck drain): Tansy climbs out of the dark, the one sincere beat of the row (her act III hug), then Silt-Diver Sal
// and the crew's two maps, side by side. Timing follows batch-3-notes section 7 (night; "pre-dawn" is the 'night' sky with lamps).
// Notes: docs/design/gnome-theft-auto/direction/scenes/m39-couch-surfing-{intro,mid,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const BUS = 'bus-stop-bin';
const LANDING = 'saucer-court-landing';
const DRAIN = 'culvert-reunion';
const WATCHER = { hat: 0xd8c9a8, shirt: 0xc9b48a, pants: 0xb5a37a, beard: null } as const;

// ---- 1. Intro: the dumpster at the Central Bus Stop -------------------------------------------------------------------------
const B_PIP = markOf(BUS, 'pip');
const B_W1 = markOf(BUS, 'watcher', 0);
const B_W2 = markOf(BUS, 'watcher', 1);
const BIN: Vec2 = [-10.7, 21.7];
/** Where the first watcher stops to inspect the bin (on the pavement, an arm's length from its flank). */
const W1_AT_BIN: Vec2 = [-8.3, 21.4];
const W2_AT_BIN: Vec2 = [-8.0, 20.0];
const PW = coverage('pip', 'w1', -1);

/**
 * Night at the stop. Two beige watchers stroll the pavement in step; Pip, behind a dumpster with a tin-can phone, asks the
 * player for a couch in a whisper; the first watcher stops at the bin, finds it in good order, and gives it a sticker.
 * (The player's side of the call is never heard: Pip's face does the listening.)
 */
export const M39_INTRO: SceneScript = {
  id: 'm39-couch-surfing-intro',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'tension',
  ambience: 'street',
  radio: 0,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m39-couch-surfing-intro.md', kind: 'intro' },
  actors: [
    { id: 'pip', preset: 'pip', held: 'tin-can-phone', at: B_PIP.at, yaw: B_PIP.yaw },
    { id: 'w1', name: 'HOA Watcher', look: WATCHER, held: 'hoa-clipboard', at: [B_W1.at[0], 2], yaw: 0 },
    { id: 'w2', name: 'HOA Watcher', look: WATCHER, held: 'hoa-clipboard', at: [B_W2.at[0], -1], yaw: 0 },
  ],
  props: [
    { id: 'bin', prefab: 'dumpster', at: BIN, yaw: Math.PI / 2 },
    { id: 'sticker', prefab: 'citation-slip', at: up(-10.0, 21.7, 1.05), yaw: Math.PI / 2, size: 0.4, by: 'w', hidden: true },
  ],
  steps: [
    // Hook: a lit stop, nobody in it, two beige watchers walking in step down the pavement; a phone starts to ring somewhere low.
    cut(spot(BUS, 'wide')),
    { do: 'walk', who: 'w1', path: [[B_W1.at[0], 12], W1_AT_BIN], speed: 1.1, async: true },
    { do: 'walk', who: 'w2', path: [[B_W2.at[0], 10], W2_AT_BIN], speed: 1.1, async: true },
    { do: 'sfx', id: 'footsteps', at: 'w1', gain: 0.4, async: true },
    { do: 'wait', s: 2.4 },
    // The ground-level look: a very small boot beside the dumpster, and a whisper from the lid.
    cut(spot(BUS, 'bin-low')),
    { do: 'sfx', id: 'rustle', at: 'pip', gain: 0.4, async: true },
    { do: 'wait', s: 1.4 },
    // Setup: the call. Pip does the talking for both ends.
    cut(PW.single('pip', 'ms')),
    { do: 'gesture', who: 'pip', name: 'think', s: 1.0, async: true },
    { do: 'say', who: 'pip', text: 'Do not say my name. I am a bin.' },
    cut(PW.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'shrug', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Side-Valve is chained. My hammock is evidence. Tansy says edges. I say roof.' },
    // The watchers, from where Pip can hear them: a clipboard tapped in step.
    cut(PW.single('w1', 'mcu')),
    { do: 'sfx', id: 'tap', at: 'w1', gain: 0.4, async: true },
    beat('pause'),
    cut(PW.single('pip', 'cu')),
    { do: 'say', who: 'pip', text: 'So. A couch. Yours. And please do not get spotted.' },
    // Turn: the first watcher stops at the bin.
    { do: 'music', track: 'mystery', fade: 1.5 },
    cut(PW.single('w1', 'mcu')),
    { do: 'sfx', id: 'tap', at: 'w1', gain: 0.5, async: true },
    { do: 'say', who: 'w1', text: 'Lid shut. Bin upright. Compliant.' },
    { do: 'sfx', id: 'paper', at: 'w1', gain: 0.5, async: true },
    { do: 'spawn', id: 'sticker' },
    cut(spot(BUS, 'sticker')),
    { do: 'stinger', id: 'comic' },
    { do: 'wait', s: 1.6 },
    // Button: the watchers walk on in step; the lid lifts an inch and Pip is very pleased.
    cut(PW.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.0, async: true },
    { do: 'say', who: 'pip', text: 'Tell Tansy I passed an inspection.' },
    cut(spot(BUS, 'wide')),
    { do: 'walk', who: 'w1', path: [[B_W1.at[0], 27]], speed: 2.0, async: true },
    { do: 'walk', who: 'w2', path: [[B_W2.at[0], 27]], speed: 2.0, async: true },
    { do: 'wait', s: 1.6 },
  ],
};

// ---- 2. Mid: the stairwell door ---------------------------------------------------------------------------------------------
const L_HYSSOP = markOf(LANDING, 'hyssop');
const L_PIP = markOf(LANDING, 'pip');
const L_YOU = markOf(LANDING, 'player');
const DOOR = coverage('hyssop', 'pip', 1);
const DOOR_YOU = coverage('hyssop', 'player', 1);

/**
 * Night at the stairwell door. Pip is in a plain cap with a toolbox; Hyssop is in a dressing gown with the chain on. "Is that a
 * lodger?" ends with her old warden's paddle: STOP freezes Pip like a lamp-post, and she lets "luggage" through, in writing.
 * Hyssop carries the gag; the scene is the one the W09 note ("NO LODGERS") is the sequel to.
 */
export const M39_MID: SceneScript = {
  id: 'm39-couch-surfing-mid',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'warm',
  ambience: 'night',
  radio: 0,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m39-couch-surfing-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: L_YOU.at, yaw: L_YOU.yaw },
    { id: 'pip', preset: 'pip', held: 'glaze-extra-toolbox', at: L_PIP.at, yaw: L_PIP.yaw, look: { hat: 0x7a6a52 } },
    { id: 'hyssop', preset: 'hyssop', name: 'Hyssop Doormat', look: { shirt: 0xb99ab0 }, at: L_HYSSOP.at, yaw: L_HYSSOP.yaw, hidden: true },
  ],
  steps: [
    // Hook: the door chain rattles on, a strip of lamplight, and a very quick head.
    cut(spot(LANDING, 'door')),
    { do: 'sfx', id: 'latch', at: 'hyssop', gain: 0.5, async: true },
    { do: 'spawn', id: 'hyssop' },
    { do: 'sfx', id: 'creak', at: 'hyssop', gain: 0.5, async: true },
    { do: 'wait', s: 1.6 },
    // Setup: the question.
    cut(DOOR.single('hyssop', 'mcu')),
    { do: 'say', who: 'hyssop', text: 'For the record, it is nine at night? Who is the short one?' },
    cut(DOOR_YOU.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'A friend.' },
    cut(DOOR.single('hyssop', 'mcu')),
    { do: 'gesture', who: 'hyssop', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'hyssop', text: 'With a toolbox. Is that a lodger?' },
    // Pip tries luggage.
    cut(DOOR.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'I am luggage. Very quiet luggage.' },
    // Turn: the paddle.
    cut(pushIn('hyssop', 'mcu', 3.0, { toward: 'pip', side: 25 })),
    { do: 'sfx', id: 'cloth', at: 'hyssop', gain: 0.4, async: true },
    { do: 'gesture', who: 'hyssop', name: 'handsUp', s: 1.4, async: true },
    { do: 'say', who: 'hyssop', text: 'Stop. Look. Listen. Then explain yourself?' },
    cut(spot(LANDING, 'paddle')),
    { do: 'gesture', who: 'pip', name: 'handsUp', s: 1.6, async: true },
    { do: 'sfx', id: 'squeak', at: 'pip', gain: 0.5, async: true },
    { do: 'wait', s: 1.8 },
    cut(DOOR.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Stopped. Looked. Listening. I fold, if that helps.' },
    ...reaction('hyssop', { toward: 'pip', hold: 'pause', size: 'mcu' }),
    // The ruling.
    cut(DOOR.single('hyssop', 'mcu')),
    { do: 'say', who: 'hyssop', text: 'One couch. One tenant. For the record? Go. Quietly.' },
    { do: 'sfx', id: 'latch', at: 'hyssop', gain: 0.6, async: true },
    // Button: she writes it down.
    cut(shot('hyssop', 'cu', { toward: 'player', side: 30 })),
    { do: 'sfx', id: 'tap', at: 'hyssop', gain: 0.5, async: true },
    { do: 'say', who: 'hyssop', text: 'I am putting it on the door.' },
    { do: 'wait', s: 1.0 },
  ],
};

// ---- 3. Outro: the drain ---------------------------------------------------------------------------------------------------
const D_TANSY = markOf(DRAIN, 'tansy');
const D_SAL = markOf(DRAIN, 'sal');
const D_YOU = markOf(DRAIN, 'player');
const D_PIP = markOf(DRAIN, 'pip');
const CRATE: Vec2 = [-9.2, -7.0];
/** Where Tansy and Pip meet: a pace short of the player, away from the crate. */
const MEET_TANSY: Vec2 = [-7.2, -8.6];
const MEET_PIP: Vec2 = [-5.7, -8.5];
/** The player stands off to the side of the reunion (not between the camera and the two of them). */
const PLAYER_AT: Vec2 = [-4.4, -5.6];
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);
const TP = coverage('tansy', 'pip', -1, 40);
const SAL_TP = coverage('sal', 'tansy', -1);
const SOCKS = coverage('sal', 'pip', -1);

/**
 * Night in the drain's lamp. Pip waits for Tansy as if for a verdict; she climbs out, sees the arm, and (the one time) holds
 * somebody. Sal breaks it up in the voice of a man pricing a hankie. Her map and Pip's sock-map lie side by side and agree;
 * Pip names his address; Sal pockets the sock.
 */
export const M39_OUTRO: SceneScript = {
  id: 'm39-couch-surfing-outro',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'mystery',
  ambience: 'cave',
  radio: 0,
  // Torchlight: the crate lamp and a small fire at the drain mouth warm the faces; the weather stays clear (default).
  keyLights: [
    { at: 'lamp', lift: 0.5, color: 0xffb066, intensity: 9, range: 10 },
    { at: 'fire', lift: 0.7, color: 0xff8a3a, intensity: 9, range: 10, flicker: true },
  ],
  direction: {
    notes: 'docs/design/gnome-theft-auto/direction/scenes/m39-couch-surfing-outro.md',
    kind: 'outro',
    waive: [{ code: 'shot-long', why: 'the held hug and the only silence: the sincere beat is let to breathe' }],
  },
  actors: [
    { id: 'player', player: true, held: null, at: PLAYER_AT, yaw: towards(PLAYER_AT, MEET_PIP) },
    { id: 'pip', preset: 'pip', held: null, at: D_PIP.at, yaw: D_PIP.yaw },
    { id: 'tansy', preset: 'tansy', held: null, at: D_TANSY.at, yaw: D_TANSY.yaw, hidden: true },
    { id: 'sal', preset: 'silt-diver sal', name: 'Silt-Diver Sal', at: D_SAL.at, yaw: D_SAL.yaw, hidden: true },
  ],
  props: [
    { id: 'crate', prefab: 'crate', at: CRATE, yaw: 0.3 },
    { id: 'fire', prefab: 'campfire', at: [-7.6, -10.6], yaw: 0 },
    { id: 'lamp', prefab: 'mole-lamp-lit', at: up(CRATE[0] + 0.1, CRATE[1] - 0.1, 0.55), size: 0.5, by: 'h' },
    { id: 'map', prefab: 'rolled-scroll', at: up(CRATE[0] - 0.35, CRATE[1] + 0.15, 0.58), yaw: 0.2, size: 0.7, by: 'w', hidden: true },
    { id: 'sock', prefab: 'sock-map', at: up(CRATE[0] + 0.45, CRATE[1] + 0.2, 0.58), yaw: -0.3, size: 0.55, by: 'w', hidden: true },
  ],
  steps: [
    // Hook: ground level at the drain mouth, a scrape of iron and a long breath of cold air.
    cut(spot(DRAIN, 'portal-low')),
    { do: 'sfx', id: 'clatter', at: up(-10, -10.4, 0.3), gain: 0.5, async: true },
    { do: 'sfx', id: 'creak', at: up(-10, -10.4, 0.3), gain: 0.4, async: true },
    { do: 'wait', s: 2.0 },
    // Setup: Pip, who has not stopped talking for a year, is waiting.
    cut(shot('pip', 'mcu', { toward: 'tansy', side: 25 })),
    { do: 'say', who: 'pip', text: 'She is going to be so angry. Or nice. I do not know which is worse.' },
    // Tansy climbs out of the dark.
    cut(spot(DRAIN, 'wide')),
    { do: 'spawn', id: 'tansy' },
    { do: 'walk', who: 'tansy', path: [[-10, -8.4], [-8.2, -8.4], MEET_TANSY], speed: 1.1, async: true },
    { do: 'face', who: 'pip', at: 'tansy', s: 0.6, async: true },
    { do: 'wait', s: 2.6 },
    cut(TP.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'You got your arm back.' },
    cut(TP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Tansy. I thought you were gone.' },
    cut(TP.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Eleven days. I counted.' },
    cut(TP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'It felt like twelve.' },
    // The turn: the hug. Music out, one held silence, and nothing on top of it.
    { do: 'music', track: null, fade: 0.8 },
    cut(shot('pip', 'fs', { toward: 'tansy', side: 85 })),
    { do: 'walk', who: 'pip', path: [MEET_PIP], speed: 1.0, async: true },
    { do: 'walk', who: 'tansy', path: [[MEET_PIP[0] - 0.8, MEET_PIP[1]]], speed: 0.7 },
    { do: 'gesture', who: 'tansy', name: 'hug', s: 2.6, async: true },
    { do: 'gesture', who: 'pip', name: 'hug', s: 2.6, async: true },
    { do: 'sfx', id: 'cloth', at: 'tansy', gain: 0.5, async: true },
    { do: 'ambience', bed: 'cave', fade: 1.0 },
    beat('silence'),
    { do: 'music', track: 'turfton-dusk', fade: 2.4 },
    cut(TP.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Do not lose that arm again.' },
    // The warmth gives way to the trade: Sal, who prices everything including a hankie.
    { do: 'spawn', id: 'sal' },
    cut(SAL_TP.single('sal', 'mcu')),
    { do: 'sfx', id: 'clink', at: 'sal', gain: 0.5, async: true },
    { do: 'say', who: 'sal', text: 'Touching. Two hankies, one drain, no charge. For clean socks, the whole map.' },
    { do: 'intro', who: 'sal' },
    // The two maps, side by side on the crate.
    { do: 'spawn', id: 'map' },
    { do: 'sfx', id: 'paper', at: 'map', gain: 0.5, async: true },
    cut(spot(DRAIN, 'crate')),
    { do: 'wait', s: 1.4 },
    { do: 'spawn', id: 'sock' },
    { do: 'sfx', id: 'paper', at: 'sock', gain: 0.5, async: true },
    { do: 'wait', s: 1.4 },
    cut(TP.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Four parts, four edges. Power first. We split them from here.' },
    cut(TP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'I sleep on the couch. Hyssop has written it down.' },
    // Button: Sal and the sock.
    cut(SOCKS.single('sal', 'mcu')),
    { do: 'gesture', who: 'sal', name: 'think', s: 1.2, async: true },
    { do: 'say', who: 'sal', text: 'Fine sock.' },
    cut(SOCKS.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'That is the map!' },
    cut(SOCKS.single('sal', 'mcu')),
    { do: 'say', who: 'sal', text: 'Fine map.' },
    { do: 'wait', s: 1.4 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm39-couch-surfing-intro': M39_INTRO,
  'm39-couch-surfing-mid': M39_MID,
  'm39-couch-surfing-outro': M39_OUTRO,
};
