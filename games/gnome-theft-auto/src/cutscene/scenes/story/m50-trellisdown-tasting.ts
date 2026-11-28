// Story row 50: Trellisdown Tasting. Part 3 of 4 of the Grand Combine, the money. Intro (dusk): Juniper on a one-sided call, a
// ledger sketched on her blotter, a seventh waiter wanted. Mid (night): the tasting on the manor forecourt; Countess Wisteria
// Brassknock (first card) at a lectern signs her ledger, the player's shutter clicks under the toast, and Vesper turns his head
// and looks across the party straight at the player's face: the first time the two share one frame. One long look, no line, then
// he turns back to his hostess. Outro (night): Chicory Snips, at the gate with a lantern, counts seven waiters, lifts a napkin
// and puts it back; then the photograph of the page, signed. The tasting hall is an interior (the tray is carried through it in
// the quest), so the mid plays on the terrace, the outline's own fallback. All dressing is scene props.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m50-trellisdown-tasting-{intro,mid,outro}.md
import type { ScriptActor, SceneScript } from '../../script';
import { beat, coverage, cut, shot } from '../../direct';
import { markOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

/** The waiter's black and white, worn by the player's own gnome in the mid and the outro. */
const WAITER: Look = { hat: 0x1d1d1d, shirt: 0xf6f6f2, pants: 0x1d1d1d };
/** Black-tied backers: nobody's villains, just very pleased with a ledger. */
const BACKER_A: Look = { hat: 0x2a2a30, shirt: 0xe8e4da, pants: 0x1d1d1d, beard: 0xcfc6b0 };
const BACKER_B: Look = { hat: 0x3a2a3a, shirt: 0xf0ece0, pants: 0x24242a, beard: 0x8a7a6a };
const BACKER_C: Look = { hat: 0x1f3a44, shirt: 0xe8e8e2, pants: 0x1d1d1d, beard: null };

// ---- Stage marks (quests/stages/story/s50-trellisdown-tasting.ts) -----------------------------------------------------------
const TERRACE = 'juniper-terrace-dusk';
const J_JUNIPER = markOf(TERRACE, 'juniper');

const TASTING = 'manor-terrace-night';
const T_WISTERIA = markOf(TASTING, 'wisteria');
const T_VESPER = markOf(TASTING, 'vesper');
const T_PLAYER = markOf(TASTING, 'player');
const T_BACKER_A = markOf(TASTING, 'backer', 0);
const T_BACKER_B = markOf(TASTING, 'backer', 1);
const T_BACKER_C = markOf(TASTING, 'backer', 2);

const GATE = 'manor-gate-night';
const G_CHICORY = markOf(GATE, 'chicory');
const G_PLAYER = markOf(GATE, 'player');

/** The terrace is a walkable rooftop 1.2 m above the forecourt gravel (country/manor.ts). */
const TERRACE_LIFT = 1.2;

const CH_YOU = coverage('chicory', 'player', 1);
const W_V = coverage('wisteria', 'vesper', 1);

/** Row 50 intro: a call at dusk. Juniper answers the questions we cannot hear, and draws a ledger. Dusk. */
const INTRO: SceneScript = {
  id: 'm50-trellisdown-tasting-intro',
  stage: { kind: 'world' },
  music: 'turfton-dusk',
  ambience: 'street',
  sky: 'golden',
  direction: {
    notes: 'docs/design/gnome-theft-auto/direction/scenes/m50-trellisdown-tasting-intro.md',
    kind: 'intro',
    waive: [{ code: 'speaker-run', why: 'a one-sided phone call: the other end of the line is the player, who is the camera and is never heard' }],
  },
  actors: [
    { id: 'juniper', preset: 'juniper', held: null, at: J_JUNIPER.at, yaw: J_JUNIPER.yaw },
    // Nobody else is here: the player is the other end of the line, and the camera is the player.
    { id: 'player', player: true, hidden: true, at: [-92.4, 123.4], yaw: 0.8 },
  ],
  props: [
    // The step turned into a desk: a side table, the blotter with a sketch on it, and a cold can.
    { id: 'desk', prefab: 'side-table', at: [-89.9, 126.4], yaw: 0.3 },
    { id: 'blotter', prefab: 'folded-map', at: up(-89.9, 126.4, 0.58), yaw: 0.3, size: 0.5 },
    { id: 'lamp', prefab: 'candle', at: up(-89.6, 126.0, 0.58), yaw: 0 },
  ],
  steps: [
    // Hook: the pencil stops mid-line; a phone rings once on the table, and she lets it ring twice.
    cut(spot(TERRACE, 'step')),
    { do: 'sfx', id: 'phone', at: 'juniper', gain: 0.4, async: true },
    { do: 'gesture', who: 'juniper', name: 'think', s: 1.2, async: true },
    { do: 'wait', s: 1.3 },
    { do: 'sfx', id: 'phone', at: 'juniper', gain: 0.4, async: true },
    { do: 'wait', s: 0.8 },
    { do: 'hold', who: 'juniper', prop: 'dispatch-radio' },
    cut(shot('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'Vance. You sound underground. Good. I have found who pays for the Combine.' },
    // Setup: she has found who pays for the money part, and she is drawing it.
    cut(shot('juniper', 'cu', { height: 'high', side: 30 })),
    { do: 'sfx', id: 'paper', at: 'juniper', gain: 0.35, async: true },
    { do: 'wait', s: 1.4 },
    cut(shot('juniper', 'ms', { height: 'low' })),
    { do: 'say', who: 'juniper', text: 'A tasting at Brassknock Manor. Combine backers, thimble glasses, her ledger on show.' },
    // The turn: the job is a costume.
    cut(shot('juniper', 'mcu', { side: -25 })),
    { do: 'say', who: 'juniper', text: 'The caterer wants six waiters. Be the seventh. There will not be pie.' },
    // Button: the signature is circled twice, and the call ends the way hers always do.
    cut(shot('juniper', 'cu', { height: 'high', side: 30 })),
    { do: 'sfx', id: 'paper', at: 'juniper', gain: 0.35, async: true },
    { do: 'gesture', who: 'juniper', name: 'point', s: 1.0, async: true },
    { do: 'say', who: 'juniper', text: 'Photograph the signed page. Vesper will be there. Keep your face quiet.' },
    { do: 'sfx', id: 'phone', at: 'juniper', gain: 0.3, async: true },
    { do: 'hold', who: 'juniper', prop: null },
    cut(spot(TERRACE, 'wide')),
    { do: 'wait', s: 2.6 },
  ],
};

/** Row 50 mid: the toast on the forecourt, a shutter under the glasses, and one long look across the gravel. Night. */
const MID: SceneScript = {
  id: 'm50-trellisdown-tasting-mid',
  stage: { kind: 'world' },
  music: 'mystery',
  ambience: 'garden',
  sky: 'night',
  // Lantern light: the candelabra on the terrace for the Countess, a lantern on the gravel for Vesper's turn, the posts for the party.
  keyLights: [
    { at: 'candles-a', lift: 1.2, color: 0xffb066, intensity: 9, range: 10, flicker: true },
    { at: 'candles-b', lift: 1.2, color: 0xffb066, intensity: 9, range: 10, flicker: true },
    { at: [-1137.4, 1.6, 12.6], color: 0xffb066, intensity: 8, range: 9 },
    { at: [-1139.6, 3.0, 17.0], color: 0xffa24d, intensity: 10, range: 6, from: 0, until: 14 },
    { at: 'post-a', lift: 3.0, color: 0xffb066, intensity: 8, range: 12 },
    { at: 'post-b', lift: 3.0, color: 0xffb066, intensity: 8, range: 12 },
  ],
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m50-trellisdown-tasting-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, look: WAITER, held: 'tasting-tray', at: T_PLAYER.at, yaw: T_PLAYER.yaw },
    // On the raised terrace, 1.2 m above the gravel: an exact [x, y, z].
    { id: 'wisteria', preset: 'wisteria', held: null, at: up(T_WISTERIA.at[0], T_WISTERIA.at[1], TERRACE_LIFT), yaw: T_WISTERIA.yaw },
    { id: 'vesper', preset: 'vesper', at: T_VESPER.at, yaw: T_VESPER.yaw },
    { id: 'backer-a', name: 'Backer', look: BACKER_A, held: 'martini-glass', at: T_BACKER_A.at, yaw: T_BACKER_A.yaw },
    { id: 'backer-b', name: 'Backer', look: BACKER_B, held: 'martini-glass', at: T_BACKER_B.at, yaw: T_BACKER_B.yaw },
    { id: 'backer-c', name: 'Backer', look: BACKER_C, held: 'martini-glass', at: T_BACKER_C.at, yaw: T_BACKER_C.yaw },
  ],
  props: [
    // The ledger on its stand, open to the signed page, facing the party; candelabra either side; lamps on the gravel.
    { id: 'ledger', prefab: 'ledger-book', at: up(-1139, 19.0, TERRACE_LIFT), yaw: Math.PI },
    { id: 'candles-a', prefab: 'candelabra', at: up(-1144.6, 19.6, TERRACE_LIFT), yaw: 0 },
    { id: 'candles-b', prefab: 'candelabra', at: up(-1133.4, 19.6, TERRACE_LIFT), yaw: 0 },
    { id: 'post-a', prefab: 'euro-lamp-post', at: [-1146.8, 10.2], yaw: 0 },
    { id: 'post-b', prefab: 'euro-lamp-post', at: [-1131.4, 9.8], yaw: 0 },
  ],
  steps: [
    // Hook: the lit terrace, a ring of glasses lifted, the lectern at its heart.
    cut(spot(TASTING, 'wide')),
    { do: 'sfx', id: 'clink', at: 'backer-a', gain: 0.35, async: true },
    { do: 'gesture', who: 'backer-a', name: 'cheer', s: 1.2, async: true },
    { do: 'wait', s: 1.3 },
    cut(W_V.single('wisteria', 'mcu', { height: 'low' })),
    { do: 'say', who: 'wisteria', text: 'Friends. A vineyard is only patience, kept in bottles.' },
    { do: 'intro', who: 'wisteria' },
    // Setup: Vesper is the guest who knows what the money is for.
    cut(W_V.single('vesper', 'mcu')),
    { do: 'say', who: 'vesper', text: 'Generous, Countess. And so very even.' },
    cut(W_V.single('wisteria', 'mcu', { height: 'low' })),
    { do: 'sfx', id: 'paper', at: 'wisteria', gain: 0.3, async: true },
    { do: 'gesture', who: 'wisteria', name: 'think', s: 1.4, async: true },
    { do: 'say', who: 'wisteria', text: 'Generous is a word for other people. One merely signs.' },
    cut(spot(TASTING, 'lectern')),
    { do: 'sfx', id: 'paper', at: up(-1139, 19.0, 2.0), gain: 0.4, async: true },
    { do: 'wait', s: 1.5 },
    // The shutter, under the clink of a toast.
    cut(shot('player', 'mcu', { toward: 'wisteria' })),
    { do: 'sfx', id: 'snap', at: 'player', gain: 0.3, async: true },
    { do: 'sfx', id: 'clink', at: 'backer-b', gain: 0.4, async: true },
    { do: 'shake', amp: 0.012, s: 0.3 },
    beat('pause'),
    // The turn: he turns his head. Nobody says anything. The two of them in one frame, in profile, across the gravel.
    cut(shot('vesper', 'mcu', { toward: 'player', side: 60 })),
    { do: 'stinger', id: 'villain' },
    { do: 'face', who: 'vesper', at: 'player', s: 1.5 },
    beat('beat'),
    cut(spot(TASTING, 'profile')),
    { do: 'music', track: null, fade: 0.5 },
    { do: 'face', who: 'player', at: 'vesper', s: 0.5, async: true },
    { do: 'sfx', id: 'tap', at: 'vesper', gain: 0.25, async: true },
    { do: 'gesture', who: 'vesper', name: 'think', s: 1.8, async: true },
    beat('silence'),
    cut(shot('vesper', 'cu', { toward: 'player' })),
    beat('pause'),
    // The Countess notices the staring before he does.
    cut(W_V.single('wisteria', 'mcu', { height: 'low' })),
    { do: 'say', who: 'wisteria', text: 'Vesper. You are staring at the help.' },
    cut(W_V.single('vesper', 'mcu')),
    { do: 'face', who: 'vesper', at: 'wisteria', s: 0.9 },
    beat('pause'),
    // Button: the tray, steadied by a thumb; one thimble glass chimes against another.
    cut(shot('player', 'cu', { height: 'high' })),
    { do: 'sfx', id: 'clink', at: 'player', gain: 0.4, async: true },
    { do: 'shake', amp: 0.01, s: 0.3 },
    { do: 'music', track: 'mystery', fade: 1.0 },
    { do: 'wait', s: 1.6 },
  ],
};

/** Row 50 outro: the gate, a lantern, a napkin lifted and put back; then the signed page. Night. */
const OUTRO: SceneScript = {
  id: 'm50-trellisdown-tasting-outro',
  stage: { kind: 'world' },
  music: 'sad',
  ambience: 'garden',
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m50-trellisdown-tasting-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, look: WAITER, held: 'tasting-tray', at: G_PLAYER.at, yaw: G_PLAYER.yaw },
    { id: 'chicory', preset: 'chicory', held: 'night-shift-lantern', at: G_CHICORY.at, yaw: G_CHICORY.yaw },
  ],
  props: [
    // The carriage lamp on the left pier, and the page that came out of the camera.
    { id: 'pier-lamp', prefab: 'garden-lamp-post', at: [-1153.2, -10.4], yaw: 0 },
    { id: 'page', prefab: 'ledger-book', at: [-1141.5, -6.6], yaw: Math.PI, hidden: true },
  ],
  steps: [
    // Hook: gravel, a stride, a lantern coming up in the gap, and the player stopping with the tray still level.
    cut(spot(GATE, 'gate')),
    { do: 'sfx', id: 'crunch', at: 'player', gain: 0.4, async: true },
    { do: 'gesture', who: 'chicory', name: 'beckon', s: 0.9, async: true },
    { do: 'wait', s: 1.1 },
    cut(CH_YOU.single('chicory', 'mcu', { height: 'low' })),
    { do: 'say', who: 'chicory', text: 'The list says six waiters. I have never had a seventh.' },
    cut(CH_YOU.single('player', 'mcu')),
    beat('pause'),
    // Setup: he is exact. He walks up, and looks at the napkin.
    cut(CH_YOU.single('chicory', 'ms')),
    { do: 'walk', who: 'chicory', path: [[G_PLAYER.at[0] - 1.6, G_PLAYER.at[1] - 1.8]], speed: 1.2 },
    { do: 'face', who: 'chicory', at: 'player', s: 0.4 },
    cut(CH_YOU.single('chicory', 'mcu')),
    { do: 'say', who: 'chicory', text: 'A waiter folds the napkin inward. You folded it over something.' },
    // The turn: the corner lifted, what is under it, and the longest sigh in the vineyard.
    cut(shot('chicory', 'cu', { height: 'high', side: 25 })),
    { do: 'sfx', id: 'cloth', at: 'chicory', gain: 0.35, async: true },
    { do: 'wait', s: 1.1 },
    { do: 'sfx', id: 'cloth', at: 'chicory', gain: 0.3, async: true },
    cut(CH_YOU.single('chicory', 'mcu')),
    { do: 'say', who: 'chicory', text: 'I was told to count the waiters. Not to read the trays.' },
    cut(CH_YOU.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Thank you.' },
    // The sincere beat: no gag on top of it.
    cut(CH_YOU.single('chicory', 'mcu', { height: 'low' })),
    beat('beat'),
    { do: 'say', who: 'chicory', text: 'Mind the lane. The Dew was never mine to burn.' },
    cut(CH_YOU.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'tipHat', s: 1.0, async: true },
    beat('pause'),
    // Button: he straightens a tendril on the pier; the signed page, in the lamp, with its three lines.
    cut(spot(GATE, 'wide')),
    { do: 'walk', who: 'player', path: [[G_PLAYER.at[0] - 3.5, G_PLAYER.at[1] - 8]], speed: 1.5, async: true },
    { do: 'gesture', who: 'chicory', name: 'bow', s: 1.4, async: true },
    { do: 'sfx', id: 'rustle', at: 'chicory', gain: 0.3, async: true },
    { do: 'wait', s: 2.2 },
    { do: 'spawn', id: 'page' },
    cut({ kind: 'cut', pos: up(-1141.8, -7.4, 1.5), look: up(-1141.5, -6.6, 1.55), fov: 30 }),
    { do: 'sfx', id: 'snap', at: 'page', gain: 0.35, async: true },
    { do: 'caption', text: 'W. Brassknock. The Combine, third part: the money. Six harvests, paid and signed.' },
    { do: 'wait', s: 2.6 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm50-trellisdown-tasting-intro': INTRO,
  'm50-trellisdown-tasting-mid': MID,
  'm50-trellisdown-tasting-outro': OUTRO,
};
