// Story row 28 (m28-sibling-rivalry): Sibling Rivalry. A double act: the Vances never look at each other while they insult
// each other. Three scenes: City Hall steps (Juniper, the cola, the missing signature), the foot of Thorne Tower (Reginald
// measuring the Ride-On seat) and the Tattler's street desk at dusk (he corrects the spelling; she laughs; the doubt is
// planted, not resolved). Notes: docs/design/gnome-theft-auto/direction/scenes/m28-sibling-rivalry-{intro,mid,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, insert, pushIn, reaction, shot } from '../../direct';
import { carMark, markOf, spot, up } from './kit';

const HALL = 'city-hall-steps';
const KERB = 'thorne-tower-pickup';
const FRONT = 'tattler-front';

// ---- Stage marks ------------------------------------------------------------------------------------------------------
/** Juniper behind the lectern, looking down the forecourt, her back to the City Hall doors. */
const LECTERN_J: Vec2 = [16.8, -68.4];
const WALK_UP: Vec2 = [9.6, -67.4];
const HALT_AT: Vec2 = [13.2, -67.4];
const KERB_REG_MEASURE = markOf(KERB, 'reginald', 0);
const KERB_PLAYER = markOf(KERB, 'player');
const KERB_REG_WAIT = markOf(KERB, 'reginald', 1);
const RIDE = carMark(KERB, 'measured-ride');
const FRONT_HEDDA = markOf(FRONT, 'hedda');
const FRONT_JUNIPER = markOf(FRONT, 'juniper');
const FRONT_REGINALD = markOf(FRONT, 'reginald');
const FRONT_PLAYER = markOf(FRONT, 'player');
const FRONT_RIDE = carMark(FRONT, 'juniper-tattler-ride');
/** The desk top at the Tattler's street desk, and where a permit lies on it. */
const PERMIT_AT: Vec2 = [-90.6, 7.9];
const toward = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- 1. Intro: City Hall steps (day) ----------------------------------------------------------------------------------
const FORECOURT = coverage('juniper', 'player', 1);

/**
 * City Hall at opening. Juniper at the lectern with her back to the doors, a cold Acorn-Cola in her hand, reading permits
 * she has already read. She says whose signature is missing and never looks at the player; she is not looking at the
 * door either, in case it is him. The button is Thorne Tower, where he is.
 */
export const M28_INTRO: SceneScript = {
  id: 'm28-sibling-rivalry-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'turfton',
  ambience: 'street',
  radio: 0.15,
  title: 'Sibling Rivalry',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m28-sibling-rivalry-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: WALK_UP, yaw: Math.PI / 2 },
    // She faces +z, down the forecourt: the doors are behind her and the player is at her side, never in her eyeline.
    { id: 'juniper', preset: 'juniper', held: 'gta-can-cola', at: LECTERN_J, yaw: 0 },
  ],
  steps: [
    // 1. Hook: paper on a lectern, and the number that does not add up.
    cut(shot('juniper', 'mcu', { toward: 'player', side: 30 })),
    { do: 'sfx', id: 'paper', at: 'juniper', gain: 0.5, async: true },
    { do: 'walk', who: 'player', path: [HALT_AT], speed: 1.5, async: true },
    { do: 'say', who: 'juniper', text: 'Eleven permits. Ten signatures. One brother.' },
    // 2. Setup: the player asks the one question; Juniper answers the forecourt.
    cut(FORECOURT.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Reginald?' },
    cut(FORECOURT.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'Hedda prints nothing until he confirms them.' },
    cut(FORECOURT.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Then ask him.' },
    // 3. The sip and the rule: she does not ask Reginald; she overrules him.
    cut(insert('juniper', { toward: 'player', side: 25 })),
    { do: 'sfx', id: 'pop', at: 'juniper', gain: 0.45, async: true },
    { do: 'wait', s: 1.3 },
    cut(FORECOURT.single('juniper', 'ms', { height: 'low' })),
    { do: 'sfx', id: 'gulp', at: 'juniper', gain: 0.4, async: true },
    { do: 'say', who: 'juniper', text: 'I do not ask Reginald things. I overrule him, quarterly.' },
    // 4. The turn: the errand, and the condition.
    cut(pushIn('juniper', 'mcu', 3.4, { toward: 'player', side: 28 })),
    { do: 'say', who: 'juniper', text: 'Fetch him from Thorne Tower. Do not say I asked.' },
    ...reaction('player', { toward: 'juniper', side: -25, gesture: 'shrug', hold: 'pause' }),
    { do: 'say', who: 'player', text: 'He will know.' },
    // 5. The button: she agrees with him, which is how she insults him, and crushes the can.
    cut(FORECOURT.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'Naturally. He has never been wrong. It is his only hobby.' },
    { do: 'sfx', id: 'clink', at: 'juniper', gain: 0.5, async: true },
    { do: 'gesture', who: 'juniper', name: 'clutch', s: 0.9, async: true },
    beat('pause'),
    // 6. Out: Thorne Tower over the forecourt, where he is.
    { do: 'cam', shot: { kind: 'cut', pos: up(8, -66, 1.5), look: up(30, -43, 27), fov: 58 } },
    { do: 'sfx', id: 'creak', gain: 0.35, async: true },
    { do: 'wait', s: 2.6 },
  ],
};

// ---- 2. Mid: the foot of Thorne Tower (day) ---------------------------------------------------------------------------
const MEASURE = coverage('reginald', 'player', -1);

/**
 * Reginald crouched at a municipal Ride-On, calipers open across the seat, not looking up. The player says who sent them;
 * he says she told them not to. It is the nearest thing to affection either Vance allows. He rides, he does not enjoy it.
 * He ends at the kerb, calipers shut, where the passenger step will pick him up.
 */
export const M28_MID: SceneScript = {
  id: 'm28-sibling-rivalry-mid',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'turfton',
  ambience: 'street',
  radio: 0.15,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m28-sibling-rivalry-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: KERB_PLAYER.at, yaw: KERB_PLAYER.yaw },
    { id: 'reginald', preset: 'reginald', at: KERB_REG_MEASURE.at, yaw: KERB_REG_MEASURE.yaw },
  ],
  vehicles: [{ id: 'ride', kind: 'ride-on', at: RIDE.at, yaw: RIDE.yaw, keep: true }],
  steps: [
    // 1. Hook: click-click, a pair of calipers closing on a seat.
    { do: 'sfx', id: 'tap', at: 'reginald', gain: 0.55, async: true },
    cut(spot(KERB, 'seat-insert')),
    { do: 'gesture', who: 'reginald', name: 'lean', s: 1.6, async: true },
    { do: 'wait', s: 1.1 },
    { do: 'sfx', id: 'tap', at: 'reginald', gain: 0.55, async: true },
    cut(shot('reginald', 'ms', { toward: 'player', side: -30, height: 'high' })),
    { do: 'say', who: 'reginald', text: 'Nineteen inches. Municipal maximum, eighteen and three quarters.' },
    { do: 'walk', who: 'player', path: [[27.6, -48.6]], speed: 1.5, async: true },
    // 2. Setup: who sent whom.
    cut(MEASURE.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Juniper sent me. She needs you.' },
    cut(MEASURE.single('reginald', 'mcu', { height: 'high' })),
    { do: 'sfx', id: 'tap', at: 'reginald', gain: 0.45, async: true },
    { do: 'say', who: 'reginald', text: 'She told you not to say so. She always does.' },
    ...reaction('player', { toward: 'reginald', side: 25, gesture: 'shrug', hold: 'pause' }),
    // 3. Turn: the permits; he is not asked, he is told, and he agrees.
    cut(MEASURE.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Hedda will not print her permits without your word.' },
    cut(pushIn('reginald', 'mcu', 3.2, { toward: 'player', side: -26, height: 'high' })),
    { do: 'say', who: 'reginald', text: 'Hedda is a sensible woman. I will ride. I will not enjoy it.' },
    // 4. Button: the calipers shut, and he walks to the kerb and waits to be driven.
    { do: 'sfx', id: 'latch', at: 'reginald', gain: 0.5, async: true },
    { do: 'walk', who: 'reginald', path: [KERB_REG_WAIT.at], speed: 1.7, async: true },
    cut(MEASURE.single('reginald', 'ms')),
    { do: 'say', who: 'reginald', text: 'The seat is an inch over. I will say so, at length.' },
    { do: 'face', who: 'reginald', yaw: KERB_REG_WAIT.yaw, s: 0.4 },
    beat('pause'),
  ],
};

// ---- 3. Outro: the Tattler's street desk (dusk) -----------------------------------------------------------------------
const DESK_REGINALD = coverage('reginald', 'hedda', -1);
const DESK_JUNIPER = coverage('juniper', 'hedda', 1);
const DESK_HEDDA = coverage('hedda', 'player', 1);

/**
 * Dusk at the Tattler's desk by the park gate. Both Vances stand at the ends of it, facing the street, and talk to Hedda
 * about each other. Reginald reads one permit, finds his sister's name misspelled and corrects it instead of confirming
 * it; Juniper laughs for the first time. He says he corrected it and did not confirm it, and nobody disagrees. The button
 * is the printer starting up. Reginald's doubt is planted here and not resolved.
 */
export const M28_OUTRO: SceneScript = {
  id: 'm28-sibling-rivalry-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'street',
  radio: 0.12,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m28-sibling-rivalry-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: FRONT_PLAYER.at, yaw: FRONT_PLAYER.yaw },
    { id: 'hedda', preset: 'hedda', at: FRONT_HEDDA.at, yaw: FRONT_HEDDA.yaw },
    // The Vances stand either end of the desk. Each faces the desk, not each other.
    { id: 'juniper', preset: 'juniper', held: 'gta-can-cola', at: FRONT_JUNIPER.at, yaw: toward(FRONT_JUNIPER.at, [-90, 8]) },
    { id: 'reginald', preset: 'reginald', at: FRONT_REGINALD.at, yaw: toward(FRONT_REGINALD.at, [-90, 8]) },
  ],
  vehicles: [{ id: 'ride', kind: 'ride-on', at: FRONT_RIDE.at, yaw: FRONT_RIDE.yaw }],
  props: [{ id: 'permit', prefab: 'citation-slip', at: up(PERMIT_AT[0], PERMIT_AT[1], 0.57), yaw: Math.PI, size: 0.32, hidden: true }],
  steps: [
    // 1. Hook: a printer clearing its throat, and a headline with no verbs.
    cut(spot(FRONT, 'front-wide')),
    { do: 'sfx', id: 'clatter', at: 'hedda', gain: 0.45, async: true },
    { do: 'wait', s: 1.3 },
    cut(DESK_HEDDA.single('hedda', 'mcu')),
    { do: 'say', who: 'hedda', text: 'Permits. Eleven. Councilwoman present. Inspector present. Confirm.' },
    // 2. Setup: the double act, through Hedda, eyes on the street.
    cut(DESK_JUNIPER.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'Tell my brother the permits are in order.' },
    cut(DESK_REGINALD.single('reginald', 'mcu', { height: 'high' })),
    { do: 'say', who: 'reginald', text: 'Tell my sister I have not read them.' },
    // 3. The permit comes down on the desk; Hedda gives one order.
    cut(DESK_HEDDA.single('hedda', 'ms')),
    { do: 'spawn', id: 'permit' },
    { do: 'sfx', id: 'paper', at: 'hedda', gain: 0.5, async: true },
    { do: 'say', who: 'hedda', text: 'Read. Now.' },
    // 4. Insert: the calipers walk down the page, and stop on a name.
    cut(insert('reginald', { toward: 'hedda' })),
    { do: 'sfx', id: 'tap', at: 'reginald', gain: 0.5, async: true },
    { do: 'gesture', who: 'reginald', name: 'lean', s: 1.8, async: true },
    { do: 'wait', s: 1.8 },
    cut(DESK_REGINALD.single('reginald', 'mcu', { height: 'high' })),
    { do: 'say', who: 'reginald', text: '"Junipar." There is no a. There is an e.' },
    // 5. Juniper, eyes front, takes it.
    cut(DESK_JUNIPER.single('juniper', 'mcu')),
    beat('beat'),
    { do: 'say', who: 'juniper', text: '...Is there.' },
    // 6. The question, and the answer that is not the answer.
    cut(DESK_HEDDA.single('hedda', 'mcu')),
    { do: 'say', who: 'hedda', text: 'Confirmed?' },
    cut(DESK_REGINALD.single('reginald', 'mcu', { height: 'high' })),
    { do: 'say', who: 'reginald', text: 'Corrected.' },
    cut(DESK_HEDDA.single('hedda', 'ms')),
    { do: 'say', who: 'hedda', text: 'The Tattler prints no corrections.' },
    cut(DESK_REGINALD.single('reginald', 'mcu', { height: 'high' })),
    { do: 'say', who: 'reginald', text: 'Then print it correctly.' },
    // 7. The laugh: Juniper, for the first time. Held, then quiet.
    cut(shot('juniper', 'mcu', { toward: 'hedda', side: 25 })),
    { do: 'music', track: null, fade: 0.4 },
    { do: 'gesture', who: 'juniper', name: 'lean', s: 1.6, async: true },
    { do: 'sfx', id: 'cloth', at: 'juniper', gain: 0.4, async: true },
    { do: 'say', who: 'juniper', text: 'Ha! ...Ha.' },
    ...reaction('player', { toward: 'juniper', hold: 'pause' }),
    // 8. The doubt, planted, said to the permit and not to her.
    cut(pushIn('reginald', 'mcu', 3.6, { toward: 'hedda', side: -22, height: 'high' })),
    { do: 'say', who: 'reginald', text: 'I corrected it. I did not confirm it.' },
    cut(DESK_JUNIPER.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'No. You did not.' },
    // 9. Button: the printer starts, and nobody says what they just saw.
    { do: 'music', track: 'turfton-dusk', fade: 1.0 },
    cut(DESK_HEDDA.single('hedda', 'mcu')),
    { do: 'say', who: 'hedda', text: 'Printing.' },
    cut(spot(FRONT, 'front-wide')),
    { do: 'sfx', id: 'clatter', at: 'hedda', gain: 0.55, async: true },
    { do: 'wait', s: 2.4 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm28-sibling-rivalry-intro': M28_INTRO,
  'm28-sibling-rivalry-mid': M28_MID,
  'm28-sibling-rivalry-outro': M28_OUTRO,
};
