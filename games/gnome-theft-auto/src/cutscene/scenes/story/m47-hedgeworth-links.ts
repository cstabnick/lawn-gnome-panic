// Story row 47 (m47-hedgeworth-links): Hedgeworth Links. Two scenes. The intro (day): Dame Peony on the clubhouse veranda with a
// drink in her hand, refusing every word against Vesper, who holds her mortgage; Basil Divot arrives from the first tee with a
// club under his arm and a challenge: one hole, no mulligans. Peony and Basil are carded here, after their first lines. The
// outro (dusk): after the hole and Thrift's tour, Basil is still putting the last putt he lost by, over and over, and Peony
// nods: the course is theirs for a week, and she has not heard a word about Vesper ("say it again, quieter"). Only in the
// scenes: the unlifted cake on the tea trestle, and the spare ball Basil slides into his sock.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m47-hedgeworth-links-{intro,outro}.md
import type { SceneScript, Step, Vec2 } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const VER = 'hedgeworth-veranda';
const LAWN = 'hedgeworth-putting-lawn';

// ---- Stage marks ------------------------------------------------------------------------------------------------------
const V_PEONY = markOf(VER, 'peony');
const V_PLAYER = markOf(VER, 'player');
const V_BASIL = markOf(VER, 'basil');
const L_BASIL = markOf(LAWN, 'basil');
const L_PEONY = markOf(LAWN, 'peony');
const L_PLAYER = markOf(LAWN, 'player');
/** Where Basil comes from and goes back to: the first tee (golf/types.ts HOLES[0].tee). */
const FIRST_TEE: Vec2 = [-1080, 482];
/** The flagstick on the putting lawn (stage set) and Basil's ball in front of his shoes. */
const FLAG: Vec2 = [-1070.4, 476.6];
const BALL: Vec2 = [-1066.3, 475.7];

/** A ball rolling in discrete hops along `pts` (the spawn step moves a prop), each held `s` seconds. */
function roll(id: string, pts: Vec2[], s = 0.12): Step[] {
  return pts.flatMap((p): Step[] => [{ do: 'spawn', id, at: up(p[0], p[1], 0.1) }, { do: 'wait', s }]);
}

// ---- 1. Intro: the veranda (day) --------------------------------------------------------------------------------------
const TALK = coverage('peony', 'player', 1);
const PRO = coverage('basil', 'player', 1);
const BOSS = coverage('peony', 'basil', -1);

/**
 * Noon on the clubhouse terrace. A far tock from the first tee; Dame Peony stands with a drink and says the player has the look
 * of someone about to speak against Vesper (her card follows). The Combine's deck, a courtesy letter, the mortgage: she will
 * hear none of it. Basil arrives with a club (his card follows his first line) and Peony puts the terms: beat him on one hole.
 * Basil: no mulligans. She sends them off with "do mind the mortgage" and, alone, looks at the cake nobody has lifted.
 */
export const M47_INTRO: SceneScript = {
  id: 'm47-hedgeworth-links-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'warm',
  ambience: 'garden',
  radio: 0.08,
  title: 'Hedgeworth Links',
  direction: {
    notes: 'docs/design/gnome-theft-auto/direction/scenes/m47-hedgeworth-links-intro.md',
    kind: 'intro',
    waive: [{ code: 'crosses-line', why: 'Peony has turned from the player to Basil, so the axis of the exchange moves with her' }],
  },
  actors: [
    { id: 'player', player: true, held: null, at: V_PLAYER.at, yaw: V_PLAYER.yaw },
    { id: 'peony', preset: 'peony', held: 'martini-glass', at: V_PEONY.at, yaw: V_PEONY.yaw },
    { id: 'basil', preset: 'basil', hidden: true, at: [FIRST_TEE[0] - 2, FIRST_TEE[1] - 6], yaw: 1.1 },
  ],
  steps: [
    // 1. Hook: the wide, a far tock, a tweed figure who has not moved.
    cut(spot(VER, 'veranda-wide')),
    { do: 'sfx', id: 'tap', gain: 0.35, async: true },
    { do: 'wait', s: 1.5 },
    cut(TALK.single('peony', 'mcu')),
    { do: 'say', who: 'peony', text: 'You have the look of a gnome about to say something about Vesper.' },
    cut(TALK.single('peony', 'ms')),
    { do: 'intro', who: 'peony' },
    // 2. Setup: the deck, the letter, the mortgage.
    cut(TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "Her Combine is testing its deck on your course." },
    cut(TALK.single('peony', 'mcu')),
    { do: 'sfx', id: 'drink', gain: 0.3, async: true },
    { do: 'say', who: 'peony', text: 'So her letter says. A courtesy. She holds my mortgage, you understand.' },
    // Basil comes in from the first tee while they talk.
    { do: 'spawn', id: 'basil', at: [FIRST_TEE[0] - 2, FIRST_TEE[1] - 6], yaw: 1.1 },
    { do: 'walk', who: 'basil', path: [[-1074, 471.4], V_BASIL.at], speed: 2.3, async: true },
    cut(TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'It will cut everything. Every lawn.' },
    // 3. Turn: the refusal, said with her whole spine.
    cut(pushIn('peony', 'mcu', 3.4, { toward: 'player', side: 25 })),
    { do: 'say', who: 'peony', text: 'Not one word against Vesper. One does not bite the hand that holds the deed.' },
    // 4. Basil, the terms.
    { do: 'face', who: 'peony', at: 'basil', s: 0.5, async: true },
    cut(PRO.single('basil', 'mcu')),
    { do: 'say', who: 'basil', text: 'Is our guest being difficult, Dame Peony?' },
    { do: 'intro', who: 'basil' },
    cut(BOSS.single('peony', 'mcu')),
    { do: 'say', who: 'peony', text: 'Beat Basil on the first hole, and I shall hear every word.' },
    cut(PRO.single('basil', 'mcu', { height: 'low' })),
    { do: 'say', who: 'basil', text: 'One hole, champ. No mulligans. Plenty of room to lose by a stroke.' },
    cut(PRO.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Deal.' },
    ...reaction('basil', { toward: 'player', gesture: 'lean', hold: 'pause' }),
    // 5. Button: he rolls off to the tee; she watches them go, and then the cake.
    cut(TALK.single('peony', 'ms')),
    { do: 'say', who: 'peony', text: 'Off you go. And do mind the mortgage.' },
    { do: 'walk', who: 'basil', path: [[-1074, 471.4], FIRST_TEE], speed: 2.6, async: true },
    { do: 'walk', who: 'player', path: [[-1066, 468.6], [-1070, 471]], speed: 1.8, async: true },
    cut(spot(VER, 'tee-away')),
    { do: 'wait', s: 1.6 },
    { do: 'sfx', id: 'tap', gain: 0.3, async: true },
    cut(shot('peony', 'mcu', { height: 'low', side: -20 })),
    { do: 'gesture', who: 'peony', name: 'think', s: 1.4, async: true },
    { do: 'sfx', id: 'clink', at: 'peony', gain: 0.25, async: true },
    { do: 'wait', s: 1.6 },
  ],
};

// ---- 2. Outro: the putting lawn (dusk) --------------------------------------------------------------------------------
const LP = coverage('peony', 'player', -1);
const LB = coverage('basil', 'peony', 1);

/**
 * Dusk on the lawn below the terrace. A ball is putted at the flag, circles the lip and stays out. Basil is replaying the last
 * putt he lost by, in the gold light, and says a mole did it. Peony reminds him: no mulligans. He calls it practice. Then she
 * turns to the player and nods, slowly: the course is theirs for a week, and she has not heard a word about Vesper. Say it
 * again, quieter. Basil, unobserved, slides the lipped ball into his sock. (He keeps a spare there: character canon.)
 */
export const M47_OUTRO: SceneScript = {
  id: 'm47-hedgeworth-links-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'garden',
  radio: 0.08,
  direction: {
    notes: 'docs/design/gnome-theft-auto/direction/scenes/m47-hedgeworth-links-outro.md',
    kind: 'outro',
    waive: [{ code: 'crosses-line', why: 'Peony turns from Basil to the player for the nod, so the axis of the exchange moves with her' }],
  },
  actors: [
    { id: 'player', player: true, held: null, at: L_PLAYER.at, yaw: L_PLAYER.yaw },
    { id: 'peony', preset: 'peony', at: L_PEONY.at, yaw: L_PEONY.yaw },
    { id: 'basil', preset: 'basil', held: 'golf-club', at: L_BASIL.at, yaw: L_BASIL.yaw },
  ],
  props: [{ id: 'ball', prefab: 'golf-ball', at: up(BALL[0], BALL[1], 0.1), size: 0.18 }],
  steps: [
    // 1. Hook: ground level across the grass at the flag; a tap; the ball runs the line and circles the lip.
    cut(spot(LAWN, 'cup-low')),
    { do: 'sfx', id: 'tap', gain: 0.6, async: true },
    ...roll('ball', [[-1067.2, 475.9], [-1068.2, 476.1], [-1069.2, 476.4], [-1070.0, 476.9], [-1070.6, 477.0], [-1070.9, 476.6]], 0.14),
    { do: 'sfx', id: 'clink', at: up(FLAG[0], FLAG[1], 0.1), gain: 0.2, async: true },
    { do: 'wait', s: 0.9 },
    // 2. Setup: his verdict, and who he blames.
    { do: 'gesture', who: 'basil', name: 'stand', s: 0.6, async: true },
    { do: 'face', who: 'basil', at: 'peony', s: 0.5, async: true },
    cut(LB.single('basil', 'mcu', { height: 'low' })),
    { do: 'say', who: 'basil', text: 'A mole did that. A mole did that, I tell you.' },
    cut(LB.single('peony', 'ms')),
    { do: 'say', who: 'peony', text: 'No mulligans, Basil.' },
    cut(LB.single('basil', 'mcu')),
    { do: 'say', who: 'basil', text: 'Practice, Dame Peony. This is practice.' },
    // 3. Turn: Peony turns to the player. The nod is the scene.
    { do: 'face', who: 'peony', at: 'player', s: 0.7, async: true },
    cut(LP.single('peony', 'mcu')),
    { do: 'gesture', who: 'peony', name: 'nod', s: 1.4, async: true },
    beat('silence'),
    { do: 'say', who: 'peony', text: 'The course is yours for a week.' },
    cut(LP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'About Vesper...' },
    cut(pushIn('peony', 'mcu', 3.2, { toward: 'player', side: -25 })),
    { do: 'say', who: 'peony', text: 'I have not heard a word about Vesper. Say it again, quieter.' },
    // 4. Button: the ball goes in his sock; the dusk keeps it.
    cut(spot(LAWN, 'putter-high')),
    { do: 'walk', who: 'basil', path: [[-1070.2, 476.2]], speed: 1.4, async: true },
    { do: 'wait', s: 1.6 },
    { do: 'despawn', id: 'ball' },
    { do: 'sfx', id: 'cloth', at: 'basil', gain: 0.35, async: true },
    cut(spot(LAWN, 'lawn-wide')),
    { do: 'wait', s: 1.8 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm47-hedgeworth-links-intro': M47_INTRO,
  'm47-hedgeworth-links-outro': M47_OUTRO,
};
