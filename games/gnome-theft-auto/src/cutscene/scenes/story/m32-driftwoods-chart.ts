// Story row 32 (m32-driftwoods-chart): Driftwood's Chart. Three scenes: the chart on the stubble beside Driftwood's trailer
// (the player's boot is on the Saltwater), Baroness Brenda's toll at Lock No. 1 (the laugh after Granny's cracked scene), and
// the dune line over the Saltcut at dusk, where Driftwood sees a glow and cannot cross yet. Nothing says what lies across.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m32-driftwoods-chart-{intro,mid,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { carMark, markOf, spot, up } from './kit';

const TRAILER = 'driftwood-chart-trailer';
const TOLL = 'new-puddle-lock-toll';
const DUNE = 'saltcut-dune-line';
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- 1. Intro: the chart on the stubble -------------------------------------------------------------------------------------
const T_DRIFT = markOf(TRAILER, 'driftwood');
const T_YOU = markOf(TRAILER, 'player');
/** The chart lies on the ground (a 0.4 m prop fitted to 2.4 m), pinned by a pail and the bell; the player's boot lands on its far corner. */
const CHART: Vec2 = [24.8, 464.6];
const ON_CHART: Vec2 = [25.7, 465.1];
const BACK_OFF: Vec2 = [29.4, 465.4];
const CHART_TALK = coverage('driftwood', 'player', 1);

/** Midday, wind in the stubble. Driftwood, on one knee over a chart, tells the player off for standing on a sea. */
export const M32_INTRO: SceneScript = {
  id: 'm32-driftwoods-chart-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'warm',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m32-driftwoods-chart-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: T_YOU.at, yaw: towards(T_YOU.at, ON_CHART) },
    { id: 'driftwood', preset: 'driftwood', at: T_DRIFT.at, yaw: towards(T_DRIFT.at, ON_CHART) },
  ],
  props: [
    { id: 'chart', prefab: 'rolled-chart', at: CHART, yaw: 0.25, size: 2.4, by: 'w' },
    { id: 'pail', prefab: 'tin-pail', at: [23.5, 465.7], yaw: 0, size: 0.4, by: 'h' },
    { id: 'bell', prefab: 'gunmod-charm-bell', at: [25.9, 463.7], yaw: 0, size: 0.2, by: 'h' },
  ],
  steps: [
    // Hook: paper snapping at its pins, the player walking straight across the chart.
    cut(spot(TRAILER, 'wide')),
    { do: 'sfx', id: 'paper', at: up(24.8, 464.6, 0.2), gain: 0.5, async: true },
    { do: 'walk', who: 'player', path: [ON_CHART], speed: 1.3, async: true },
    { do: 'wait', s: 2.2 },
    // Setup: the boot is on the sea.
    cut(CHART_TALK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'Not there. You are standing on the Saltwater.' },
    { do: 'walk', who: 'player', path: [BACK_OFF], speed: 1.8, async: true },
    cut(CHART_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'The what?' },
    // The chart, from above: the canal, the Puddle Sea, then a great deal more paper.
    cut(spot(TRAILER, 'chart')),
    { do: 'sfx', id: 'paper', at: up(24.8, 464.6, 0.2), gain: 0.5, async: true },
    { do: 'wait', s: 2.2 },
    cut(CHART_TALK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'I drew the canal ending at the Puddle Sea. I drew it wrong.' },
    cut(CHART_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'How wrong?' },
    // Turn: the canal does not end.
    cut(pushIn('driftwood', 'mcu', 3.4, { toward: 'player', side: 25 })),
    { do: 'say', who: 'driftwood', text: 'It does not end. Past the dunes, there is salt.' },
    ...reaction('player', { toward: 'driftwood', hold: 'pause' }),
    cut(CHART_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'And you know that how?' },
    cut(CHART_TALK.single('driftwood', 'mcu', { height: 'low' })),
    { do: 'say', who: 'driftwood', text: 'The frogs leave in spring. Frogs do not leave for nothing.' },
    // The job, in his voice.
    cut(CHART_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'And the raft?' },
    cut(CHART_TALK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'Tow it down the canal. Steady, like a sleeping lawn shark.' },
    cut(CHART_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'There are no lawn sharks.' },
    // Button: his answer, and the paper lifting at one corner.
    cut(shot('driftwood', 'ms', { toward: 'player', side: 40 })),
    { do: 'gesture', who: 'driftwood', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'driftwood', text: 'Say that near the water.' },
    { do: 'sfx', id: 'flutter', at: up(24.8, 464.6, 0.2), gain: 0.5, async: true },
    { do: 'wait', s: 1.6 },
  ],
};

// ---- 2. Mid: the toll at Lock No. 1 -----------------------------------------------------------------------------------------
const L_YOU = markOf(TOLL, 'player');
const L_DRIFT = markOf(TOLL, 'driftwood');
const L_BRENDA = markOf(TOLL, 'brenda');
const L_B1 = markOf(TOLL, 'biker', 0);
const L_B2 = markOf(TOLL, 'biker', 1);
const RAFT = carMark(TOLL, 'toll-raft');
const GANG = carMark(TOLL, 'toll-gang-bike');
const PINK = 0xff69b4;
const ROYAL = coverage('brenda', 'player', 1);

/**
 * Noon at the east lock. Brenda's gang strings a ribbon across the canal; she proclaims a toll on anything that floats and
 * has opinions; Driftwood says the canal does not end at her sea, and she decrees the Republic extends to wherever it does
 * not. The toll stays four spark plugs. The laugh after Granny's cracked scene.
 */
export const M32_MID: SceneScript = {
  id: 'm32-driftwoods-chart-mid',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'triumph',
  ambience: 'water',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m32-driftwoods-chart-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: L_YOU.at, yaw: L_YOU.yaw },
    { id: 'driftwood', preset: 'driftwood', held: 'rolled-chart', at: L_DRIFT.at, yaw: L_DRIFT.yaw },
    { id: 'brenda', preset: 'brenda', held: 'feather-duster', at: L_BRENDA.at, yaw: L_BRENDA.yaw },
    { id: 'b1', name: 'Biker', look: { hat: PINK, shirt: 0x2a2a2a, pants: 0x1a1a1a }, at: L_B1.at, yaw: L_B1.yaw },
    { id: 'b2', name: 'Biker', look: { hat: PINK, shirt: 0xf0c0d0, pants: 0x303040 }, at: L_B2.at, yaw: L_B2.yaw },
    { id: 'b3', name: 'Biker', look: { hat: 0x7a3b2e, shirt: 0x3a2a4a, pants: 0x1a1a1a }, seatedIn: 'gang', at: [0, 0] },
  ],
  vehicles: [
    { id: 'raft', kind: RAFT.kind, at: RAFT.at, yaw: RAFT.yaw },
    { id: 'gang', kind: GANG.kind, at: GANG.at, yaw: GANG.yaw, tint: PINK },
  ],
  props: [
    // The toll line: Brenda's bunting from bank to bank, just ahead of the raft. Cutscene-only.
    { id: 'ribbon', prefab: 'bunting-span', at: [91, 0, 230], yaw: Math.PI / 2 },
    { id: 'purse', prefab: 'coin-purse', at: [91.4, 220], yaw: 0, size: 0.3, by: 'w', hidden: true },
  ],
  steps: [
    // Hook: a gang bike brakes in along the bank, horn first, and the bunting is already across the water.
    cut(spot(TOLL, 'wide')),
    { do: 'drive', vehicle: 'gang', path: [[104.6, 218.6]], speed: 7, async: true },
    { do: 'horn', vehicle: 'gang' },
    { do: 'sfx', id: 'bell', at: 'gang', gain: 0.6, async: true },
    { do: 'wait', s: 2.2 },
    // The proclamation, from low down and from above.
    cut(ROYAL.single('brenda', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'brenda', name: 'handsUp', s: 1.4, async: true },
    { do: 'say', who: 'brenda', text: 'Halt! The Sovereign Republic of New Puddle declares a toll.' },
    cut(ROYAL.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'On what?' },
    cut(ROYAL.single('brenda', 'mcu', { height: 'low' })),
    { do: 'say', who: 'brenda', text: 'On every vessel. A vessel is anything that floats and has opinions.' },
    // Driftwood, from the other side of the player, quietly.
    cut(shot('driftwood', 'mcu', { toward: 'brenda', side: -22 })),
    { do: 'gesture', who: 'driftwood', name: 'think', s: 1.0, async: true },
    { do: 'say', who: 'driftwood', text: 'Majesty. The canal does not end at your sea.' },
    // The turn: Brenda, for the first time, has no proclamation.
    cut(pushIn('brenda', 'mcu', 3.2, { toward: 'player', side: 25, height: 'low' })),
    beat('pause'),
    { do: 'sfx', id: 'creak', at: 'brenda', gain: 0.4, async: true },
    cut(shot('b1', 'mcu', { toward: 'brenda', side: 25 })),
    { do: 'gesture', who: 'b1', name: 'shrug', s: 1.0 },
    cut(ROYAL.single('brenda', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'brenda', name: 'handsUp', s: 1.4, async: true },
    { do: 'say', who: 'brenda', text: 'We decree the Republic extends to wherever it does not end.' },
    { do: 'gesture', who: 'b2', name: 'cheer', s: 1.4, async: true },
    cut(shot('driftwood', 'mcu', { toward: 'brenda', side: -22 })),
    { do: 'say', who: 'driftwood', text: 'That is all I ask.' },
    // The toll is still the toll: a purse changes hands.
    cut(ROYAL.single('brenda', 'mcu', { height: 'low' })),
    { do: 'say', who: 'brenda', text: 'The toll is still four spark plugs.' },
    { do: 'spawn', id: 'purse' },
    { do: 'sfx', id: 'clink', at: 'brenda', gain: 0.6, async: true },
    cut(shot('player', 'ms', { toward: 'brenda', side: 40 })),
    { do: 'gesture', who: 'player', name: 'shrug', s: 1.1 },
    { do: 'despawn', id: 'purse' },
    // Button: the ribbon comes down and the canal is open, the whole Republic waving.
    cut(spot(TOLL, 'far-bank')),
    { do: 'despawn', id: 'ribbon' },
    { do: 'gesture', who: 'brenda', name: 'wave', s: 1.6, async: true },
    { do: 'gesture', who: 'driftwood', name: 'tipHat', s: 1.4, async: true },
    { do: 'horn', vehicle: 'gang' },
    { do: 'wait', s: 2.0 },
  ],
};

// ---- 3. Outro: the dune line ------------------------------------------------------------------------------------------------
const D_DRIFT = markOf(DUNE, 'driftwood');
const D_YOU = markOf(DUNE, 'player');
const DINGHY = carMark(DUNE, 'saltcut-dinghy');
/** A lit boat far down the Saltcut, tied to nothing; it only answers the bell. */
const FAR_BOAT: Vec2 = [738, 1042];
const DUNE_TALK = coverage('driftwood', 'player', 1);

/**
 * Dusk on the dune line. The sun went down in the west; the light in the south is not the sunset. Driftwood is the first to
 * see it and cannot go yet. He rings his bell once, and something far out answers once. Nothing says what is across.
 */
export const M32_OUTRO: SceneScript = {
  id: 'm32-driftwoods-chart-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m32-driftwoods-chart-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: D_YOU.at, yaw: D_YOU.yaw },
    { id: 'driftwood', preset: 'driftwood', held: 'gunmod-charm-bell', at: D_DRIFT.at, yaw: D_DRIFT.yaw },
  ],
  vehicles: [
    { id: 'dinghy', kind: DINGHY.kind, at: DINGHY.at, yaw: DINGHY.yaw },
    { id: 'far', kind: 'clog-cruiser', at: FAR_BOAT, yaw: 0, hidden: true, headlights: true },
  ],
  steps: [
    // Hook: the two of them on the crest, small, wind in the marram, and a halyard ticking on the dinghy.
    cut(spot(DUNE, 'wide')),
    { do: 'sfx', id: 'tap', at: 'dinghy', gain: 0.4, async: true },
    { do: 'wait', s: 2.6 },
    // Setup: his face, lit from the south.
    cut(shot('driftwood', 'mcu', { side: 30 })),
    { do: 'say', who: 'driftwood', text: 'Do you see it?' },
    cut(DUNE_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'That is the sunset.' },
    cut(DUNE_TALK.single('driftwood', 'mcu', { height: 'low' })),
    { do: 'say', who: 'driftwood', text: 'The sun went down the other way.' },
    // The look: from behind them, down the channel to the light. A held silence, the only one.
    { do: 'music', track: null, fade: 1.2 },
    cut(spot(DUNE, 'south')),
    { do: 'ambience', bed: 'shore', fade: 2.5 },
    beat('silence'),
    { do: 'music', track: 'turfton-dusk', fade: 2.0 },
    // Turn: six months of being laughed at, and the doorstep.
    cut(pushIn('driftwood', 'mcu', 3.6, { toward: 'player', side: 25 })),
    { do: 'say', who: 'driftwood', text: 'Six months I said the Big Puddle was a sea. It was a doorstep.' },
    cut(DUNE_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Then we cross.' },
    cut(DUNE_TALK.single('driftwood', 'mcu')),
    { do: 'gesture', who: 'driftwood', name: 'slump', s: 1.2, async: true },
    { do: 'say', who: 'driftwood', text: 'Not yet. I am a hat on a raft, not a captain.' },
    // Button: the bell, once. Far out on the water, a light answers once.
    cut(spot(DUNE, 'sides')),
    { do: 'sfx', id: 'bell', at: 'driftwood', gain: 0.6, async: true },
    { do: 'wait', s: 2.2 },
    { do: 'spawn', id: 'far' },
    cut(spot(DUNE, 'south')),
    { do: 'stinger', id: 'reveal' },
    { do: 'horn', vehicle: 'far' },
    { do: 'wait', s: 3.4 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm32-driftwoods-chart-intro': M32_INTRO,
  'm32-driftwoods-chart-mid': M32_MID,
  'm32-driftwoods-chart-outro': M32_OUTRO,
};
