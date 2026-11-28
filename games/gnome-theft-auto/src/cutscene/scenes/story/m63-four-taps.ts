// Story row 63 (m63-four-taps): Four Taps. Three scenes. Intro (noon, the Mulch Club's side door): Big Lou stands in the doorway with his arms
// crossed, lets the player in, and the Don taps four times, slowly, which nobody has seen: Lou flinches for the first time in the
// game. The price of the Club's crews and money is the Mayor's signature, and the Mayor has sent a postcard. Mid (noon, R-234): the
// terrace of Café Pardon on Teacup Row in Pardonlin, where Hector Disdain (first card) has not taken the Mayor's order in three days
// and the Mayor sits out his second coat in the sun with his arms held away from his sides; the coffee he never ordered arrives as
// he leaves. Outro (dusk, the side door): the Mayor signs the counter-order with the Club's own pen, asks whether the ink matches his
// coat ("No."), the Don taps a fifth time (Lou has never heard five: "Five is yes") and three Lowriders put their lamps on and roll
// out into the dusk: the Club's crews, the first part of the coalition's muscle. The postcard, the swatch fan, the convoy and the
// coffee are cutscene-only.
// Notes: docs/design/gnome-theft-auto/direction/scenes/four-taps-{intro,mid,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- The Mulch Club's side door (intro, outro): the stage row 11 drew (quests/stages/turfton.ts) ------------------------------
const MCD = 'mulch-club-door';
const DON = markOf(MCD, 'don-compost');
const DOOR_PLAYER = markOf(MCD, 'player');
/** Lou stands square in the way, one pace out from the Don, until the player has said the word. */
const LOU_BLOCK: Vec2 = [-13.4, -30.6];
/** Then he steps aside to the Don's shoulder. */
const LOU_ASIDE: Vec2 = [-16.1, -33.0];

const LOU_P = coverage('lou', 'player', 1);

/** Row 63 intro, noon: a doorman with his arms crossed, four taps in slow time, and a postcard. */
const INTRO: SceneScript = {
  id: 'four-taps-intro',
  stage: { kind: 'world' },
  music: 'heist',
  ambience: 'street',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/four-taps-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: [-7.6, -30.2], yaw: towards([-7.6, -30.2], LOU_BLOCK) },
    { id: 'lou', preset: 'big lou', at: LOU_BLOCK, yaw: towards(LOU_BLOCK, DOOR_PLAYER.at) },
    { id: 'don', preset: 'don compost', at: DON.at, yaw: DON.yaw },
  ],
  steps: [
    // Hook: boots into a low frame, a wall of charcoal coat with its arms crossed. Nobody moves.
    cut(shot('lou', 'ms', { toward: 'player', height: 'low', side: -25 })),
    { do: 'gesture', who: 'lou', name: 'crossArms', s: 2.4, async: true },
    { do: 'walk', who: 'player', path: [[-9.8, -30.3]], speed: 1.3, async: true },
    { do: 'sfx', id: 'crunch', at: 'player', gain: 0.4, async: true },
    { do: 'wait', s: 1.8 },
    cut(LOU_P.single('lou', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lou', text: 'Hat.' },
    cut(LOU_P.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Dry.' },
    cut(LOU_P.single('lou', 'mcu', { height: 'low' })),
    beat('pause'),
    { do: 'say', who: 'lou', text: '...Dry. Back door. Don is waiting.' },
    // Lou lets the player in: one slow step to the side, a quarter-turn at a time.
    cut(LOU_P.single('lou', 'ms')),
    { do: 'walk', who: 'lou', path: [LOU_ASIDE], speed: 0.7 },
    { do: 'face', who: 'lou', at: 'don', s: 0.5 },
    { do: 'walk', who: 'player', path: [[-12.6, -30.4]], speed: 1.2, async: true },
    // The Don in the doorway: the hand on the cane, and the taps in slow time. The first three are the old ones.
    { do: 'music', track: null, fade: 0.5 },
    cut(pushIn('don', 'mcu', 6.4, { to: 'cu', toward: 'player', height: 'low', side: -30 })),
    beat('silence'),
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 0.95 },
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 0.95 },
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 1.4 },
    // Lou, who never changes face, changes face. The fourth tap lands on him, not on the Don.
    { do: 'face', who: 'lou', at: 'player', s: 0.3, async: true },
    cut(LOU_P.single('lou', 'mcu', { height: 'low' })),
    { do: 'sfx', id: 'knock', at: 'don', gain: 1.0 },
    { do: 'stinger', id: 'danger' },
    { do: 'gesture', who: 'lou', name: 'flinch', s: 0.9, async: true },
    { do: 'wait', s: 1.1 },
    { do: 'say', who: 'lou', text: '...Four. Nobody has seen four.' },
    cut(LOU_P.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'What is four?' },
    cut(LOU_P.single('lou', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lou', text: 'War. Club lends everything. Crews. Money.' },
    cut(LOU_P.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Price?' },
    cut(LOU_P.single('lou', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lou', text: 'Mayor signs the counter-order. In ink.' },
    cut(LOU_P.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Where is the Mayor?' },
    // The turn: the postcard, produced from a coat that was not seen to open.
    { do: 'music', track: 'heist', fade: 0.6 },
    cut(shot('lou', 'cu', { toward: 'player', height: 'high', side: -20 })),
    { do: 'sfx', id: 'cloth', at: 'lou', gain: 0.5, async: true },
    { do: 'hold', who: 'lou', prop: 'sealed-letter' },
    { do: 'wait', s: 1.0 },
    cut(LOU_P.single('lou', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lou', text: 'Postcard. "Weather fine. Coffee pending."' },
    cut(LOU_P.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'shrug', s: 0.9, async: true },
    { do: 'say', who: 'player', text: 'Where from?' },
    // Button: the address, the order and the one word.
    cut(LOU_P.single('lou', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lou', text: 'Café Pardon. West, past the Wickets. Bring him dry.' },
    cut(shot('don', 'mcu', { toward: 'player', height: 'low', side: -30 })),
    { do: 'sfx', id: 'knock', at: 'don', gain: 0.7 },
    { do: 'wait', s: 1.4 },
  ],
};

// ---- Café Pardon's terrace on Teacup Row (mid) ------------------------------------------------------------------------------------
const CAFE = 'cafe-pardon-terrace';
const C_MAYOR = markOf(CAFE, 'mayor-mulch');
const C_HECTOR = markOf(CAFE, 'hector');
const C_PLAYER = markOf(CAFE, 'player');
/** Hector's route: a long diagonal that never reaches a table, ending a pace and a half from the visitor. */
const HECTOR_ROUTE: Vec2[] = [[-1526.2, 150.9], [-1525.4, 150.3]];
const HECTOR_STOP: Vec2 = [-1524.9, 149.7];

const HEC_P = coverage('hector', 'player', 1);
const MAY_P = coverage('mayor', 'player', -1);
const HEC_MAY = coverage('hector', 'mayor', 1);

/** Row 63 mid, noon: the Mayor sits out his second coat in the sun, and Hector has seen the player and will bring something in time. */
const MID: SceneScript = {
  id: 'four-taps-mid',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'market',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/four-taps-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: C_PLAYER.at, yaw: C_PLAYER.yaw },
    { id: 'mayor', preset: 'mayor mulch', name: 'Mayor Mulch', held: 'paint-swatch-fan', at: C_MAYOR.at, yaw: C_MAYOR.yaw },
    { id: 'hector', preset: 'hector', at: C_HECTOR.at, yaw: C_HECTOR.yaw },
  ],
  props: [
    // The coffee he never ordered, brought three days late and set down where he is not.
    { id: 'coffee', prefab: 'pl-espresso-cup', at: up(-1525.0, 142.4, 0.78), yaw: 0.4, size: 0.12, by: 'h', hidden: true },
  ],
  steps: [
    // Hook: Teacup Row at noon, a gramophone, and a Mayor standing perfectly still in the sun with his arms held out from his coat.
    cut(spot(CAFE, 'wide')),
    { do: 'gesture', who: 'mayor', name: 'handsUp', s: 3.4, async: true },
    { do: 'sfx', id: 'bell', at: 'hector', gain: 0.3, async: true },
    { do: 'walk', who: 'hector', path: HECTOR_ROUTE, speed: 1.0, async: true },
    { do: 'wait', s: 2.8 },
    // Hector arrives without arriving, and does not ask.
    { do: 'walk', who: 'hector', path: [HECTOR_STOP], speed: 0.9, async: true },
    { do: 'face', who: 'player', at: 'hector', s: 0.5, async: true },
    cut(HEC_P.single('hector', 'mcu')),
    { do: 'say', who: 'hector', text: 'You have been seen.' },
    { do: 'intro', who: 'hector' },
    // Setup: the Mayor, rigid, delighted to be rescued from a lunch that has not come.
    { do: 'face', who: 'mayor', at: 'player', s: 0.4 },
    cut(MAY_P.single('mayor', 'mcu')),
    { do: 'say', who: 'mayor', text: 'Ding, ding! A visitor! Do not touch the coat. It is drying.' },
    cut(MAY_P.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'The Don sent me. He tapped four times.' },
    // The turn: he knows what four is.
    cut(MAY_P.single('mayor', 'cu')),
    { do: 'sfx', id: 'gulp', at: 'mayor', gain: 0.5, async: true },
    { do: 'gesture', who: 'mayor', name: 'flinch', s: 0.8, async: true },
    { do: 'say', who: 'mayor', text: 'Four is the war. I am on holiday!' },
    ...reaction('hector', { toward: 'mayor', size: 'mcu', hold: 'pause' }),
    cut(MAY_P.single('mayor', 'mcu')),
    { do: 'say', who: 'mayor', text: 'No HOA letter follows me past the Wickets! No lunch, either. Three days!' },
    // He turns the swatch fan once, looking for the right red. The Don's price, and who is winning.
    cut(MAY_P.single('mayor', 'mcu')),
    { do: 'sfx', id: 'paper', at: 'mayor', gain: 0.35, async: true },
    { do: 'say', who: 'mayor', text: 'Who is winning, back home?' },
    cut(MAY_P.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'The coalition. The Club is in.' },
    cut(MAY_P.single('mayor', 'mcu')),
    { do: 'gesture', who: 'mayor', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'mayor', text: 'Then I was never away! Carry me, but do not touch me!' },
    // Button: Hector, at last, delivers. The cup goes down on the empty table; the answer is "Yes."
    cut(HEC_MAY.single('hector', 'mcu')),
    { do: 'spawn', id: 'coffee' },
    { do: 'sfx', id: 'clink', at: 'hector', gain: 0.5, async: true },
    { do: 'say', who: 'hector', text: 'His coffee. It was ready on Tuesday.' },
    cut(HEC_MAY.single('mayor', 'mcu')),
    { do: 'say', who: 'mayor', text: 'It is Friday!' },
    cut(HEC_MAY.single('hector', 'mcu')),
    beat('beat'),
    { do: 'say', who: 'hector', text: 'Yes.' },
    cut(shot('player', 'ms', { toward: 'mayor', side: 35 })),
    { do: 'gesture', who: 'player', name: 'beckon', s: 1.0, async: true },
    { do: 'wait', s: 1.2 },
  ],
};

// ---- The counter-order is signed (outro) ------------------------------------------------------------------------------------------
const MAYOR_AT: Vec2 = [-13.2, -31.8];
const LOU_OUT: Vec2 = [-15.5, -33.4];
const TABLE: Vec2 = [-14.8, -30.5];
const CONVOY: { id: string; at: Vec2 }[] = [
  { id: 'car-a', at: [2.5, -27] },
  { id: 'car-b', at: [2.5, -33] },
  { id: 'car-c', at: [2.5, -39] },
];

const MAY_LOU = coverage('mayor', 'lou', 1);
const LOU_PL = coverage('lou', 'player', -1);

/** Row 63 outro, dusk: a streaky signature, "No.", a fifth tap and three Lowriders leaving with their lamps on. */
const OUTRO: SceneScript = {
  id: 'four-taps-outro',
  stage: { kind: 'world' },
  music: 'turfton-dusk',
  ambience: 'street',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/four-taps-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: [-9.2, -30.0], yaw: towards([-9.2, -30.0], TABLE) },
    { id: 'mayor', preset: 'mayor mulch', name: 'Mayor Mulch', held: 'mulch-fountain-pen', at: MAYOR_AT, yaw: towards(MAYOR_AT, TABLE) },
    { id: 'lou', preset: 'big lou', at: LOU_OUT, yaw: towards(LOU_OUT, MAYOR_AT) },
    { id: 'don', preset: 'don compost', at: DON.at, yaw: DON.yaw },
  ],
  vehicles: CONVOY.map((c) => ({ id: c.id, kind: 'lowrider' as const, at: c.at, yaw: Math.PI })),
  props: [
    // The step is a desk: a small table dragged out under the lamp, and the counter-order on it, one corner pinned by a cigar box.
    { id: 'desk', prefab: 'side-table', at: up(TABLE[0], TABLE[1], 0), yaw: 0.2 },
    { id: 'order', prefab: 'letter-of-passage', at: up(TABLE[0], TABLE[1], 0.58), yaw: 0.2, size: 0.34 },
    { id: 'weight', prefab: 'cigar-box', at: up(TABLE[0] + 0.3, TABLE[1] + 0.18, 0.58), yaw: 0.5, size: 0.14 },
  ],
  steps: [
    // Hook: the pen, a hand on a very large flourish, and the sound of the whole street waiting.
    cut(shot('mayor', 'ms', { toward: 'lou', height: 'low', side: 30 })),
    { do: 'sfx', id: 'paper', at: 'mayor', gain: 0.5, async: true },
    { do: 'gesture', who: 'mayor', name: 'cheer', s: 1.4, async: true },
    { do: 'wait', s: 1.5 },
    { do: 'say', who: 'mayor', text: 'And a flourish! Signed, sealed and only a little streaky!' },
    // The insert: the page, and the sleeve that crossed it while the ink was still thinking.
    cut({ kind: 'cut', pos: up(-14.1, -31.3, 1.25), look: up(TABLE[0], TABLE[1], 0.6), fov: 30 }),
    { do: 'sfx', id: 'paper', at: 'order', gain: 0.4, async: true },
    { do: 'wait', s: 1.5 },
    // Setup: the question only this Mayor asks.
    cut(MAY_LOU.single('mayor', 'mcu')),
    { do: 'say', who: 'mayor', text: 'Does the ink match my coat?' },
    cut(MAY_LOU.single('lou', 'mcu', { height: 'low' })),
    beat('pause'),
    { do: 'say', who: 'lou', text: 'Ink black. Coat red. ...No.' },
    cut(MAY_LOU.single('mayor', 'mcu')),
    { do: 'gesture', who: 'mayor', name: 'think', s: 1.0, async: true },
    { do: 'say', who: 'mayor', text: 'Then the coat is wrong! Ding, ding!' },
    // The turn: the Don, in the doorway, four taps he has made before, and then another.
    { do: 'music', track: null, fade: 0.4 },
    cut(pushIn('don', 'mcu', 5.6, { to: 'cu', toward: 'lou', height: 'low', side: 30 })),
    { do: 'sfx', id: 'knock', at: 'don', gain: 0.8 },
    { do: 'wait', s: 0.5 },
    { do: 'sfx', id: 'knock', at: 'don', gain: 0.8 },
    { do: 'wait', s: 0.5 },
    { do: 'sfx', id: 'knock', at: 'don', gain: 0.8 },
    { do: 'wait', s: 0.5 },
    { do: 'sfx', id: 'knock', at: 'don', gain: 0.8 },
    { do: 'wait', s: 1.5 },
    { do: 'sfx', id: 'knock', at: 'don', gain: 1.0 },
    { do: 'stinger', id: 'reveal' },
    { do: 'wait', s: 0.9 },
    cut(LOU_PL.single('lou', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'lou', name: 'flinch', s: 0.8, async: true },
    { do: 'say', who: 'lou', text: '...Five.' },
    cut(LOU_PL.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'What is five?' },
    cut(LOU_PL.single('lou', 'mcu', { height: 'low' })),
    beat('beat'),
    { do: 'say', who: 'lou', text: 'Five is yes. Crews roll at dark.' },
    // Button: the street, the dusk, three Lowriders putting their lamps on and rolling out up the x = 0 road.
    { do: 'music', track: 'turfton-dusk', fade: 0.8 },
    cut({ kind: 'cut', pos: up(-5.0, -22.0, 2.6), look: up(2.5, -40.0, 1.0), fov: 50 }),
    ...CONVOY.map((c) => ({ do: 'lights' as const, vehicle: c.id, on: true })),
    { do: 'sfx', id: 'engine-rev', at: 'car-b', gain: 0.5, async: true },
    ...CONVOY.map((c, i) => ({
      do: 'drive' as const, vehicle: c.id, path: [[2.5, -96]] as Vec2[], speed: 11 + i * 0.6, arrive: false, async: true,
    })),
    { do: 'horn', vehicle: 'car-a' },
    { do: 'wait', s: 1.6 },
    cut({ kind: 'track', pos: up(-4.5, -50.0, 2.2), who: 'car-c', fov: 46 }),
    { do: 'wait', s: 3.2 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'four-taps-intro': INTRO,
  'four-taps-mid': MID,
  'four-taps-outro': OUTRO,
};

