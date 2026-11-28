// Story row 62: Cam's Cell. The laugh straight after row 61's quiet, with one true thing in the middle of it. Four scenes in the HOA
// lockup under the Double Pot (night): the intro (Cam in a chain-link cell apologising to his broom, cut with Juniper on a
// one-sided call at the tunnel mouth); the mid (Cam talks fast, gives up the Combine's PA code and route, and Vesper's voice comes
// over the lockup speaker with one slow sentence); and the two endings of the player's choice, the freed Cam who sweeps the cell
// on the way out and climbs into the player's passenger seat, and the left Cam who gives his broom to the player ("it has never
// seen a Green") and takes the Watch's polite hand. E05 has no lockup interior: the lockup is a row of tin units on the tunnel's
// west wall with a chain-link yard-cell in front of one (set dressing in the stage). The Watch and the gate panel are scene-only.
// Notes: docs/design/gnome-theft-auto/direction/scenes/cams-cell-{intro,mid,outro,outro-left}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { carMark, markOf, spot, up } from './kit';

const LOCK = 'cams-lockup';

const CAM_SIT = markOf(LOCK, 'turncoat-cam', 0);
const CAM_STAND = markOf(LOCK, 'turncoat-cam', 1);
const P_GAP = markOf(LOCK, 'player', 0);
const P_OUT = markOf(LOCK, 'player', 1);
const JUNIPER = markOf(LOCK, 'juniper');
const WATCH_A = markOf(LOCK, 'hoa-watch', 0);
const WATCH_B = markOf(LOCK, 'hoa-watch', 1);
const RIDE = carMark(LOCK, 'cam-ride');

/** The broom against the lockup's tin, inside the pen (the pen's west edge is the unit face at x 114.6). */
const BROOM_AT: Vec2 = [111.4, -97.2];
/** The middle of the gap in the pen's east fence, where the gate panel hangs when it is shut. */
const GAP: Vec2 = [114.85, -97.6];
/** Bunk top: the bunk prefab at scale 1.3 is about 0.6 m tall, so a seated gnome is lifted that much. */
const BUNK_LIFT = 0.55;
const WATCH_LOOK = { hat: 0x18181e, shirt: 0xc9b99b };

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- 1. Intro: the broom, and the call ---------------------------------------------------------------------------------------

/**
 * Night in the lockup. Cam sits on the edge of a bunk in a chain-link pen and apologises to his broom, which is leant on the tin
 * behind him and has not said a word; he tells it it was right about the charter and then that it is a broom, and apologises for
 * that. Cut to Juniper in the shadow at the tunnel mouth, phone to her ear, one side of a call: Cam is in the lockup, Vesper
 * cancelled the charter, Cam carried Vesper's paper for a year and knows the Combine's PA code and route. What the player does
 * with him afterwards is the player's business. The button is a speaker overhead clearing its throat, and Cam flinching from it.
 */
export const CAMS_CELL_INTRO: SceneScript = {
  id: 'cams-cell-intro',
  stage: { kind: 'world' },
  sky: 'night',
  ambience: 'office',
  direction: {
    notes: 'docs/design/gnome-theft-auto/direction/scenes/cams-cell-intro.md',
    kind: 'intro',
    waive: [{ code: 'speaker-run', match: 'juniper', why: 'a one-sided phone call: the other end of the line is the player, who is the camera and is never heard' }],
  },
  actors: [
    { id: 'cam', preset: 'turncoat cam', name: 'Turncoat Cam', held: null, at: up(CAM_SIT.at[0], CAM_SIT.at[1], BUNK_LIFT), yaw: CAM_SIT.yaw },
    { id: 'juniper', preset: 'juniper', held: null, at: JUNIPER.at, yaw: JUNIPER.yaw },
  ],
  props: [{ id: 'broom-lean', prefab: 'broom', at: up(BROOM_AT[0], BROOM_AT[1], 0), size: 1.2, by: 'h' }],
  steps: [
    // Hook: a long tunnel at night, a pen under two lanterns, one gnome on a bunk, a creak, a mutter.
    cut(spot(LOCK, 'pen-wide')),
    { do: 'gesture', who: 'cam', name: 'sit', s: 0.2 },
    { do: 'sfx', id: 'creak', at: 'cam', gain: 0.4, async: true },
    { do: 'wait', s: 1.4 },
    // Setup: he is apologising to the broom.
    cut(shot('cam', 'mcu', { height: 'high', side: -25 })),
    { do: 'gesture', who: 'cam', name: 'shrug', s: 1.0, async: true },
    { do: 'say', who: 'cam', text: 'Sorry about the cell. You said the charter was a lie. I did not listen.' },
    { do: 'gesture', who: 'cam', name: 'slump', s: 1.0, async: true },
    // The broom does not answer.
    cut({ kind: 'cut', pos: up(113.4, -98.6, 0.9), look: 'broom-lean', fov: 36 }),
    { do: 'sfx', id: 'rustle', at: 'broom-lean', gain: 0.35, async: true },
    beat('pause'),
    cut(shot('cam', 'cu', { height: 'high', side: -25 })),
    { do: 'say', who: 'cam', text: 'You are a broom.' },
    beat('beat'),
    { do: 'say', who: 'cam', text: 'Sorry. That was rude.', stinger: 'comic' },
    beat('pause'),
    // (Three lines from Cam, then the picture changes: no speaker runs on.)
    // Turn: the other end of the call. A phone glow in the shadow of the west wall.
    cut(spot(LOCK, 'juniper-mouth')),
    { do: 'hold', who: 'juniper', prop: 'dispatch-radio' },
    { do: 'sfx', id: 'static', at: 'juniper', gain: 0.25, async: true },
    { do: 'wait', s: 0.8 },
    cut(shot('juniper', 'mcu', { height: 'low' })),
    { do: 'say', who: 'juniper', text: 'Cam is in the Double Pot lockup. Vesper cancelled his charter this afternoon.' },
    cut(shot('juniper', 'mcu', { height: 'low', side: 40 })),
    beat('beat'),
    { do: 'say', who: 'juniper', text: 'Yes. That Cam. Try not to enjoy it.' },
    cut(shot('juniper', 'mcu', { side: -30 })),
    { do: 'gesture', who: 'juniper', name: 'think', s: 1.2, async: true },
    { do: 'say', who: 'juniper', text: "He carried Vesper's paper for a year. He knows the Combine's PA code and route." },
    cut(pushIn('juniper', 'mcu', 3.4, { to: 'cu', side: 25 })),
    { do: 'say', who: 'juniper', text: 'What you do with him afterwards is your own business.' },
    // Button: the tunnel's speaker clears its throat over a gnome who has already flinched from it twice today.
    cut(spot(LOCK, 'pen-high')),
    { do: 'sfx', id: 'static', at: up(111.4, -98, 3.9), gain: 0.5, async: true },
    { do: 'gesture', who: 'cam', name: 'flinch', s: 1.0, async: true },
    { do: 'wait', s: 2.6 },
  ],
};

// ---- 2. Mid: the code, and the voice over the speaker ---------------------------------------------------------------------
const TALK = coverage('cam', 'player', 1);

/**
 * Night. The player steps through the gap and Cam is on his feet before they are through it, talking fast: sorry about the
 * Tuesday, the bench, the van. The code is in his head and his pocket; he memorised it and wrote it down in case he forgot it,
 * and did not forget it. He leans in and says it, and hands over the route on a folded map. Then the speaker overhead: Vesper's
 * voice, soft and slow, one sentence (no charter, ever; the Association thanks him for believing in it). Cam says Noted, and
 * tells the player to do whichever costs less. Vesper never appears.
 */
export const CAMS_CELL_MID: SceneScript = {
  id: 'cams-cell-mid',
  stage: { kind: 'world' },
  sky: 'night',
  ambience: 'office',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/cams-cell-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: P_GAP.at, yaw: P_GAP.yaw },
    { id: 'cam', preset: 'turncoat cam', name: 'Turncoat Cam', held: 'folded-map', at: CAM_STAND.at, yaw: CAM_STAND.yaw },
  ],
  props: [{ id: 'broom-lean', prefab: 'broom', at: up(BROOM_AT[0], BROOM_AT[1], 0), size: 1.2, by: 'h' }],
  steps: [
    // Hook: the gap in the wire, a bunk springing, a gnome already talking.
    cut(spot(LOCK, 'gap-low')),
    { do: 'sfx', id: 'creak', at: 'cam', gain: 0.4, async: true },
    { do: 'gesture', who: 'cam', name: 'handsUp', s: 1.2, async: true },
    { do: 'wait', s: 1.1 },
    cut(TALK.single('cam', 'mcu', { height: 'low', handheld: 0.02 })),
    { do: 'say', who: 'cam', text: 'You came. Sorry about the Tuesday. And the bench. And the van.' },
    cut(TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'The code, Cam.' },
    // Setup: the code is in two places, because he does not trust the first.
    cut(TALK.single('cam', 'mcu')),
    { do: 'gesture', who: 'cam', name: 'pat-pockets', s: 1.2, async: true },
    { do: 'say', who: 'cam', text: 'In my head and my pocket. I memorised it. I also wrote it down.' },
    cut(TALK.single('player', 'mcu', { height: 'high' })),
    { do: 'gesture', who: 'player', name: 'shrug', s: 0.9, async: true },
    beat('pause'),
    cut(TALK.single('cam', 'cu', { height: 'high' })),
    { do: 'say', who: 'cam', text: 'In case I forgot it. I did not forget it.' },
    // The handover: a lean, a whisper nobody hears, a folded map.
    cut(TALK.ots('cam')),
    { do: 'gesture', who: 'cam', name: 'lean', s: 1.4, async: true },
    { do: 'sfx', id: 'cloth', at: 'cam', gain: 0.3, async: true },
    { do: 'wait', s: 1.0 },
    { do: 'give', from: 'cam', to: 'player', prop: 'folded-map', s: 1.2 },
    { do: 'sfx', id: 'paper', at: 'player', gain: 0.35, async: true },
    cut(TALK.single('cam', 'mcu')),
    { do: 'say', who: 'cam', text: 'That is all of it. The route is on the map.' },
    // Turn: the speaker. A throat cleared over a tunnel, then a voice that has all the time in the world.
    { do: 'sfx', id: 'static', at: up(111.4, -98, 3.9), gain: 0.5, async: true },
    { do: 'stinger', id: 'villain' },
    cut(TALK.single('cam', 'cu', { height: 'low' })),
    { do: 'gesture', who: 'cam', name: 'flinch', s: 0.8, async: true },
    { do: 'say', who: 'Vesper Thorne', hz: 92, text: 'Cameron, there was never a charter, and the Association thanks you for believing in it.' },
    cut(TALK.single('cam', 'mcu', { height: 'high' })),
    { do: 'gesture', who: 'cam', name: 'slump', s: 1.6, async: true },
    beat('silence'),
    // Button: flat, the way he always says it, and a price.
    cut(TALK.single('cam', 'mcu')),
    { do: 'say', who: 'cam', text: 'Noted.' },
    cut(TALK.single('player', 'mcu')),
    beat('pause'),
    cut(pushIn('cam', 'mcu', 3.0, { to: 'cu', toward: 'player', side: 25 })),
    { do: 'say', who: 'cam', text: 'Do whichever costs less.' },
    { do: 'wait', s: 0.8 },
  ],
};

// ---- 3. Outro A: freed -------------------------------------------------------------------------------------------------------
const OUT = coverage('cam', 'player', 1);

/**
 * Night. The player has taken the key off the guards' peg: keys, a latch. Cam asks for the broom (it has hung on the lockup wall
 * since the first night) and takes it in both hands. Nobody has ever come to get him. He sweeps the cell floor on the way out,
 * because it is a floor, climbs into the passenger seat of the player's ride with the broom upright between his knees, and asks to
 * be taken anywhere with leaves. The button is the empty cell, swept, under its two lanterns.
 */
export const CAMS_CELL_OUTRO: SceneScript = {
  id: 'cams-cell-outro',
  stage: { kind: 'world' },
  sky: 'night',
  ambience: 'office',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/cams-cell-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: P_OUT.at, yaw: P_OUT.yaw },
    { id: 'cam', preset: 'turncoat cam', name: 'Turncoat Cam', held: null, at: CAM_STAND.at, yaw: CAM_STAND.yaw },
  ],
  vehicles: [{ id: 'ride', kind: 'ride-on', from: 'player', at: RIDE.at, yaw: RIDE.yaw }],
  props: [{ id: 'broom-lean', prefab: 'broom', at: up(BROOM_AT[0], BROOM_AT[1], 0), size: 1.2, by: 'h' }],
  steps: [
    // Hook: a ring of keys, a latch, and a head coming up.
    cut(spot(LOCK, 'gap-low')),
    { do: 'sfx', id: 'keys', at: 'player', gain: 0.5, async: true },
    { do: 'wait', s: 0.9 },
    { do: 'sfx', id: 'latch', at: 'player', gain: 0.5, async: true },
    cut(OUT.single('cam', 'mcu')),
    { do: 'say', who: 'cam', text: 'The broom. Please.' },
    ...reaction('player', { toward: 'cam', gesture: 'nod', hold: 'pause', side: -25 }),
    // Setup: he goes to it like a man going to a friend.
    cut(spot(LOCK, 'pen-wide')),
    { do: 'walk', who: 'cam', path: [[112.0, -97.4]], speed: 0.7 },
    { do: 'despawn', id: 'broom-lean' },
    { do: 'hold', who: 'cam', prop: 'broom' },
    { do: 'sfx', id: 'cloth', at: 'cam', gain: 0.3, async: true },
    { do: 'face', who: 'cam', at: 'player', s: 0.5 },
    cut(shot('cam', 'mcu', { toward: 'player', side: 25 })),
    { do: 'say', who: 'cam', text: 'Nobody has ever come to get me.' },
    beat('silence'),
    // Turn: he sweeps the floor of his own cell on the way out. Of course he does.
    cut(spot(LOCK, 'pen-high')),
    { do: 'walk', who: 'cam', path: [[113.6, -99.0], [113.8, -96.6], [114.3, -97.6]], speed: 0.8, async: true },
    { do: 'sfx', id: 'crunch', at: 'cam', gain: 0.5, async: true },
    { do: 'wait', s: 2.6 },
    { do: 'sfx', id: 'crunch', at: 'cam', gain: 0.5, async: true },
    { do: 'wait', s: 1.8 },
    // The ride: he walks out through the gap and climbs into the passenger seat, broom between his knees.
    cut({ kind: 'track', pos: up(123.6, -94.0, 1.6), who: 'cam', fov: 46 }),
    { do: 'walk', who: 'cam', path: [[116.0, -97.6], [120.6, -95.4], [121.4, -93.4]], speed: 1.4 },
    { do: 'enter', who: 'cam', vehicle: 'ride', seat: 1 },
    cut(shot('cam', 'mcu', { toward: 'player', side: 40 })),
    { do: 'say', who: 'cam', text: 'Take me anywhere with leaves.' },
    // Button: the empty cell, swept, under its two lanterns; the ride idling away.
    cut(spot(LOCK, 'pen-high')),
    { do: 'sfx', id: 'engine-rev', at: 'ride', gain: 0.35, async: true },
    { do: 'wait', s: 3.2 },
  ],
};

// ---- 4. Outro B: left for the Watch -----------------------------------------------------------------------------------------
const LEFT = coverage('cam', 'player', 1);
const WATCH = coverage('watch-a', 'cam', -1);

/**
 * Night. The player has walked away down the tunnel; Cam calls after them: take the broom, it has never seen a Green. It goes
 * through the wire into the player's hands. Two Watchmen arrive in even steps with a clipboard, polite as a lien: back to the
 * bunk, please. Cam says that is fine, it is what it costs. The player stands with a broom. The gate panel swings shut and the
 * latch clicks, and the last thing in the tunnel is the lift tone.
 */
export const CAMS_CELL_OUTRO_LEFT: SceneScript = {
  id: 'cams-cell-outro-left',
  stage: { kind: 'world' },
  sky: 'night',
  ambience: 'office',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/cams-cell-outro-left.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: P_OUT.at, yaw: towards(P_OUT.at, [120.6, -90]) },
    { id: 'cam', preset: 'turncoat cam', name: 'Turncoat Cam', held: 'broom', at: CAM_STAND.at, yaw: CAM_STAND.yaw },
    { id: 'watch-a', name: 'Lockup Watch', look: WATCH_LOOK, held: 'hoa-clipboard', hz: 90, hidden: true, at: [120.4, -84], yaw: 0 },
    { id: 'watch-b', name: 'Lockup Watch', look: WATCH_LOOK, held: null, hz: 88, hidden: true, at: [121.6, -83], yaw: 0 },
  ],
  props: [{ id: 'gate', prefab: 'chain-link-fence', at: up(GAP[0], GAP[1], 0), yaw: Math.PI / 2, size: 1.2, by: 'w', hidden: true }],
  steps: [
    // Hook: a voice behind the player in an empty tunnel; they turn.
    cut(spot(LOCK, 'gap-low')),
    { do: 'face', who: 'cam', at: P_OUT.at, s: 0.3, async: true },
    { do: 'sfx', id: 'creak', at: 'cam', gain: 0.4, async: true },
    { do: 'wait', s: 1.3 },
    cut(LEFT.single('cam', 'mcu')),
    { do: 'say', who: 'cam', text: 'Take the broom.' },
    { do: 'face', who: 'player', at: 'cam', s: 0.6, async: true },
    cut(LEFT.single('cam', 'mcu')),
    { do: 'say', who: 'cam', text: 'It has never seen a Green.' },
    // Setup: it goes through the wire, handle first.
    cut(spot(LOCK, 'pen-wide')),
    { do: 'walk', who: 'player', path: [P_GAP.at], speed: 1.2 },
    { do: 'give', from: 'cam', to: 'player', prop: 'broom', s: 1.4 },
    { do: 'sfx', id: 'rustle', at: 'player', gain: 0.4, async: true },
    ...reaction('player', { toward: 'cam', gesture: 'nod', hold: 'pause', side: -25 }),
    // Turn: the Watch, in even steps, from the mouth of the tunnel.
    { do: 'sfx', id: 'footsteps', at: up(120.4, -90, 1), gain: 0.7, async: true },
    { do: 'spawn', id: 'watch-a' },
    { do: 'spawn', id: 'watch-b' },
    { do: 'walk', who: 'watch-a', path: [WATCH_A.at], speed: 1.5, async: true },
    { do: 'walk', who: 'watch-b', path: [WATCH_B.at], speed: 1.5, async: true },
    cut({ kind: 'track', pos: up(123.2, -90.4, 1.8), who: 'watch-a', fov: 46 }),
    { do: 'stinger', id: 'danger' },
    { do: 'wait', s: 2.2 },
    cut(WATCH.single('watch-a', 'mcu')),
    { do: 'say', who: 'watch-a', text: 'Cameron. Back to the bunk, please. Lights out is at nine.' },
    cut(LEFT.single('cam', 'mcu')),
    { do: 'say', who: 'cam', text: 'That is fine. It is what it costs.' },
    // The player, a broom in one hand and nothing to say.
    ...reaction('player', { toward: 'cam', gesture: 'slump', size: 'mcu', hold: 'silence', side: -25 }),
    // Button: the gate swings to; the latch clicks; the lift tone goes on.
    cut(spot(LOCK, 'gap-low')),
    { do: 'spawn', id: 'gate' },
    { do: 'sfx', id: 'latch', at: up(GAP[0], GAP[1], 1), gain: 0.7, async: true },
    { do: 'wait', s: 3.0 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'cams-cell-intro': CAMS_CELL_INTRO,
  'cams-cell-mid': CAMS_CELL_MID,
  'cams-cell-outro': CAMS_CELL_OUTRO,
  'cams-cell-outro-left': CAMS_CELL_OUTRO_LEFT,
};
