// Story row 51 (m51-the-flock-stands): The Flock Stands. Two scenes and one rhyme, the gentle laugh before the act's turn.
//   intro: dawn at Wader's Rest. Six grey gnomes in a row on one leg before the Standing Lady, none of them moving, and Mother
//          Saxifrage, who is allowed to. She says the Flock will stand in the Even Cut's path, but not with the Lady in it. One of
//          them thinks aloud, is told to mind his cup, and drops it. (A flatbed and a lawn roller wait by the mound.)
//   outro: dusk at Thrift's shed. The same six, in the same order, on the same leg, on a ninth fairway, with the Lady on a flatbed
//          behind them. Saxifrage gives the date of the Combine's test; Thrift, who talks to grass, offers to manage a bird, and
//          fills Godwit's cup, which this time he keeps.
// The Flock hold the one-leg pose for the whole scene (the 'one-leg' idle loops); only Saxifrage, Godwit and Thrift ever move.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m51-the-flock-stands-{intro,outro}.md
import type { ScriptActor, SceneScript, Step, Vec2 } from '../../script';
import { beat, coverage, cut, pushIn } from '../../direct';
import { carMark, markOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

const DAWN = 'waders-dawn';
const SHED = 'hedgeworth-shed-flock';

/** The Flock wear grey (the Standing Lady alone is pink): same colours as societies/flock/life.ts and m25. */
const GREY: Look = { hat: 0x9aa0a8, shirt: 0x8d9096, pants: 0x6f7378 };

/** The row, left to right facing the Lady, in the same order in both scenes: [id, look, scale, held]. */
const ROW: { id: string; name: string; look: Look; scale: number; held: string | null }[] = [
  { id: 'godwit', name: 'Godwit', look: GREY, scale: 1.0, held: 'reed-tea-cup' },
  { id: 'sedge', name: 'Sedge', look: { hat: 0xa8b0b8, shirt: 0x7a838c, pants: 0x6f7378, beard: 0xe6e6ea }, scale: 1.0, held: null },
  { id: 'tall', name: 'Flock', look: { hat: 0x8a9098, shirt: 0x8d9096, pants: 0x5f6368, beard: 0xcfd0d4 }, scale: 1.28, held: null },
  { id: 'small', name: 'Flock', look: { hat: 0xaab0b8, shirt: 0x9a9ea6, pants: 0x6f7378 }, scale: 0.8, held: null },
  { id: 'cloak', name: 'Flock', look: { hat: 0x7e848c, shirt: 0x70767e, pants: 0x585c62, beard: 0xdcdce0 }, scale: 1.12, held: null },
  { id: 'last', name: 'Flock', look: { hat: 0xb2b6be, shirt: 0x8d9096, pants: 0x6f7378, beard: 0xbcbcc4 }, scale: 1.0, held: null },
];

/** The six row actors, standing on a stage's `flock` marks. */
function rowActors(stage: string): ScriptActor[] {
  return ROW.map((r, i) => {
    const m = markOf(stage, 'flock', i);
    return { id: r.id, name: r.name, look: r.look, scale: r.scale, held: r.held, at: m.at, yaw: m.yaw };
  });
}

/** Every Flock member on one leg for `s` seconds (the idle loops), from the first frame. */
function onOneLeg(s: number): Step[] {
  return ROW.map((r): Step => ({ do: 'gesture', who: r.id, name: 'one-leg', s, async: true }));
}

// ---- 1. Intro: dawn at Wader's Rest -----------------------------------------------------------------------------------------
const D_SAX = markOf(DAWN, 'saxifrage');
const D_YOU = markOf(DAWN, 'player');
const ARRIVE_FROM = markOf('waders-circle', 'player');
const D_ROLLER = carMark(DAWN, 'flock-roller-mound');
const LADY: Vec2 = [-1130, -668];
const SAX = coverage('saxifrage', 'player', 1);
const SAX_GOD = coverage('saxifrage', 'godwit', 1);

/**
 * First light at Wader's Rest. A hook of six people being statues, a Mother who is allowed to move, a plan that takes the Lady
 * out of the Combine's path, and the one Brother who thinks aloud. The last sound is a cup.
 */
const INTRO: SceneScript = {
  id: 'm51-the-flock-stands-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'mystery',
  ambience: 'water',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m51-the-flock-stands-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: ARRIVE_FROM.at, yaw: Math.atan2(D_YOU.at[0] - ARRIVE_FROM.at[0], D_YOU.at[1] - ARRIVE_FROM.at[1]) },
    { id: 'saxifrage', preset: 'saxifrage', held: null, at: D_SAX.at, yaw: D_SAX.yaw },
    ...rowActors(DAWN),
  ],
  vehicles: [{ id: 'roller', kind: D_ROLLER.kind, at: D_ROLLER.at, yaw: D_ROLLER.yaw }],
  props: [
    // The flatbed waits at the mound's foot with its tow bar to the roller, rope slack along its rails.
    { id: 'flatbed', prefab: 'flatbed-trailer', at: [-1121.6, -661.2], yaw: Math.PI / 2, size: 3.6, by: 'w' },
    { id: 'reeds-a', prefab: 'reed-bed', at: [-1148, -662], yaw: 0.4, size: 3.2, by: 'w' },
    { id: 'reeds-b', prefab: 'reed-bed', at: [-1146.5, -652], yaw: 2.2, size: 2.8, by: 'w' },
  ],
  steps: [
    ...onOneLeg(44.7),
    // Hook: six people being statues before a barn-sized pink bird, mist on the reeds, and a faint squeak from the Lady's leg.
    cut(spot(DAWN, 'dawn')),
    { do: 'sfx', id: 'rustle', at: up(-1147, -657, 0.4), gain: 0.3, async: true },
    { do: 'walk', who: 'player', path: [D_YOU.at], speed: 2.0, async: true },
    { do: 'sfx', id: 'creak', at: up(LADY[0], LADY[1], 3), gain: 0.25, async: true },
    { do: 'wait', s: 3.0 },
    // The row, from the ground: six single legs. The last of them leans, and corrects.
    cut(spot(DAWN, 'row')),
    { do: 'gesture', who: 'last', name: 'lean', s: 1.2, async: true },
    { do: 'wait', s: 1.8 },
    // Setup: the only one who may move turns round, and is not impressed by the hour.
    { do: 'face', who: 'saxifrage', at: 'player', s: 1.0, async: true },
    cut(SAX.single('saxifrage', 'mcu', { height: 'low' })),
    { do: 'say', who: 'saxifrage', text: 'You are late, friend. The sun was on time.' },
    cut(SAX.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'What are they doing?' },
    cut(SAX.single('saxifrage', 'mcu', { height: 'low' })),
    { do: 'say', who: 'saxifrage', text: 'Standing before the Lady, as she stands before the dawn. So it is stood.' },
    // The turn: the Even Cut is coming to Hedgeworth, and what the Flock will do about it.
    cut(pushIn('saxifrage', 'mcu', 4.4, { toward: 'player', side: 25, height: 'low' })),
    { do: 'music', track: 'warm', fade: 2.4 },
    { do: 'say', who: 'saxifrage', text: 'The Even Cut comes to Hedgeworth. The Flock will stand in its path.' },
    cut(SAX.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'On one leg?' },
    cut(SAX.single('saxifrage', 'mcu')),
    { do: 'say', who: 'saxifrage', text: 'On one leg. One is plenty. So it is stood.' },
    cut(SAX.single('saxifrage', 'ms', { height: 'low' })),
    { do: 'say', who: 'saxifrage', text: 'But not with the Lady in it. Take her, friend, on the flatbed.' },
    // The thought: Godwit has one, aloud.
    cut(spot(DAWN, 'row')),
    { do: 'gesture', who: 'godwit', name: 'flinch', s: 0.9, async: true },
    { do: 'sfx', id: 'clink', at: 'godwit', gain: 0.4, async: true },
    { do: 'wait', s: 1.2 },
    { do: 'face', who: 'godwit', at: 'saxifrage', s: 0.6, async: true },
    { do: 'face', who: 'saxifrage', at: 'godwit', s: 0.6 },
    cut(SAX_GOD.single('godwit', 'mcu')),
    { do: 'say', who: 'godwit', text: 'Mother, if the Lady goes, who do we stand in front of?' },
    cut(SAX_GOD.single('saxifrage', 'mcu', { height: 'low' })),
    { do: 'say', who: 'saxifrage', text: 'Each other, Brother. It was always each other. Mind the cup.' },
    // Button: he does not mind the cup. The row does not look round. Nobody looks round.
    cut(spot(DAWN, 'row')),
    { do: 'hold', who: 'godwit', prop: null },
    { do: 'sfx', id: 'clatter', at: 'godwit', gain: 0.5, async: true },
    { do: 'wait', s: 1.6 },
    cut(spot(DAWN, 'dawn')),
    { do: 'stinger', id: 'comic' },
    { do: 'wait', s: 2.2 },
  ],
};

// ---- 2. Outro: dusk outside Thrift's shed -----------------------------------------------------------------------------------
const S_SAX = markOf(SHED, 'saxifrage');
const S_YOU = markOf(SHED, 'player');
const S_THRIFT = markOf(SHED, 'thrift');
const S_ROLLER = carMark(SHED, 'flock-roller-shed');
/** The flatbed stands on the fairway a few paces north of the row, the Lady upright on it facing west (nobody knows why). */
const FLATBED: Vec2 = [-1062.9, 597.6];
const GODWIT_SPOT = markOf(SHED, 'flock', 0);
const THRIFT_SAX = coverage('thrift', 'saxifrage', 1);
const SAX_PLAYER = coverage('saxifrage', 'player', 1);
const POUR_FROM: Vec2 = [GODWIT_SPOT.at[0] + 2.2, GODWIT_SPOT.at[1] + 3.6];

/**
 * Dusk on the ninth. The Lady, on her flatbed, is taller than the shed. Saxifrage gives the date, gently; the one question about
 * feet is answered with the least reassuring thing possible; and Thrift, who talks to grass, says he can manage a bird. A watering
 * can and a cup are the last image: the cup is kept.
 */
const OUTRO: SceneScript = {
  id: 'm51-the-flock-stands-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'garden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m51-the-flock-stands-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: S_YOU.at, yaw: S_YOU.yaw },
    { id: 'saxifrage', preset: 'saxifrage', held: null, at: S_SAX.at, yaw: S_SAX.yaw },
    { id: 'thrift', preset: 'thrift', at: S_THRIFT.at, yaw: S_THRIFT.yaw },
    ...rowActors(SHED),
  ],
  vehicles: [{ id: 'roller', kind: S_ROLLER.kind, at: S_ROLLER.at, yaw: S_ROLLER.yaw }],
  props: [
    { id: 'flatbed', prefab: 'flatbed-trailer', at: FLATBED, yaw: Math.PI / 2, size: 3.6, by: 'w' },
    { id: 'lady', prefab: 'standing-lady', at: up(FLATBED[0], FLATBED[1], 0.5), yaw: -Math.PI / 2, size: 4.4, by: 'h' },
  ],
  steps: [
    ...onOneLeg(42.8),
    // Hook: a flamingo taller than a shed, on a flatbed, in gold light; six on one leg; a groundskeeper in a doorway with a can.
    cut(spot(SHED, 'wide')),
    { do: 'sfx', id: 'tap', at: 'roller', gain: 0.3, async: true },
    { do: 'wait', s: 2.8 },
    // Setup: Thrift, who talks to grass, has a thing to say to people.
    cut(THRIFT_SAX.single('thrift', 'mcu')),
    { do: 'say', who: 'thrift', text: 'There is a flamingo on my ninth.' },
    cut(THRIFT_SAX.single('saxifrage', 'mcu', { height: 'low' })),
    { do: 'say', who: 'saxifrage', text: 'She is a guest, groundskeeper. Mind the grass.' },
    // The date, said softly.
    cut(pushIn('saxifrage', 'mcu', 4.2, { toward: 'thrift', side: 25, height: 'low' })),
    { do: 'music', track: 'mystery', fade: 2.0 },
    { do: 'say', who: 'saxifrage', text: "On the gala night. The Combine tests its blade then. So it is stood." },
    // The turn: the player's practical question, answered.
    cut(SAX_PLAYER.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Both feet on the ground would be safer.' },
    cut(SAX_PLAYER.single('saxifrage', 'mcu', { height: 'low' })),
    { do: 'say', who: 'saxifrage', text: 'Both feet are a rumour. So it is stood.' },
    beat('pause'),
    // The kindness: Thrift lowers the can.
    { do: 'music', track: 'warm', fade: 2.4 },
    cut(THRIFT_SAX.single('thrift', 'mcu')),
    { do: 'say', who: 'thrift', text: 'Will she need water?' },
    cut(THRIFT_SAX.single('saxifrage', 'mcu', { height: 'low' })),
    { do: 'say', who: 'saxifrage', text: 'Only company.' },
    cut(THRIFT_SAX.single('thrift', 'mcu')),
    { do: 'say', who: 'thrift', text: 'I talk to grass. I can manage a bird.' },
    // Button: he crosses behind the row with the can and fills Godwit's cup. Godwit does not breathe. The cup is kept.
    cut(spot(SHED, 'row-low')),
    { do: 'walk', who: 'thrift', path: [[S_THRIFT.at[0] - 1, S_THRIFT.at[1] + 3], POUR_FROM], speed: 1.3, async: true },
    { do: 'wait', s: 3.6 },
    { do: 'face', who: 'thrift', at: 'godwit', s: 0.4 },
    { do: 'sfx', id: 'pour', at: 'godwit', gain: 0.5, async: true },
    { do: 'gesture', who: 'godwit', name: 'flinch', s: 0.8, async: true },
    { do: 'wait', s: 1.8 },
    cut(spot(SHED, 'lady-low')),
    { do: 'sfx', id: 'clink', at: 'godwit', gain: 0.35, async: true },
    { do: 'stinger', id: 'comic' },
    { do: 'wait', s: 2.4 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm51-the-flock-stands-intro': INTRO,
  'm51-the-flock-stands-outro': OUTRO,
};
