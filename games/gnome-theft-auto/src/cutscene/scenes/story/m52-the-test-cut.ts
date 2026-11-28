// Story row 52: The Test Cut, the act III turn. Eight scenes, at Hedgeworth Links (stages: quests/stages/story/
// s52-the-test-cut.ts; notes: docs/design/gnome-theft-auto/direction/scenes/<id>.md).
// - m52-the-test-cut-p1-intro (p1, day): the HOA tests its new loudspeakers on Peony's terrace ("Even. Even."); Peony
//   hands the player a caddy bib whose nine reads as a six; caddies are furniture; "One will say nothing."
// - m52-the-test-cut-p1-mid (p1, dusk, after the overhearing): Vesper and the Countess at the rail. A straight line
//   through the ninth, round nothing: not greens, not hedges, not vines. The Countess flinches. "Thank you, caddy."
// - m52-the-test-cut-p2-intro (p2, dusk): the moles' teacup rattles on the ninth green; the Grand Combine's crown and
//   its cutting deck rise behind the hedge's tail. Moles first. Peony starts giving orders against Vesper's machine.
// - m52-the-test-cut-p2-outro (p2's outro, dusk): the HOA survey flags go one by one; the Flock stand across the line on
//   one leg, then part on the same leg and the deck goes through; the gala flag snaps; Peony turns round at last.
// - m52-the-test-cut-p3-intro (p3, dusk): the deck rolls toward the ninth green; Tansy and Pip on the radio; the escort
//   mowers come round in front of it. "One does not concede a hole."
// - m52-the-test-cut-p3-outro (p3's outro, dusk): Peony hands the player her driver; the player's best shot rings off
//   the porcelain hood, the blades pass over the ball and keep turning. The camera stays with the deck. No gag.
// - m52-the-test-cut-intro (final, dusk): Vesper on every loudspeaker, alone in his deck's wake; "Nothing works. Go."
// - m52-the-test-cut-outro (final, night): outside the Kicked Board, the deck stopped a yard from the fence; the date
//   of the Even Cut over every loudspeaker in Turfton: the longest day. Hedgeworth is with the crew. Sincere: no gag.
// The Grand Combine is a cutscene set piece (prefabs grand-combine-boss and combine-test-deck), moved along its test
// line between cuts (never inside a shot): it is closer every time anyone looks.
import type { ScriptActor, ScriptProp, ScriptVehicle, SceneScript, Step, Vec2, Vec3 } from '../../script';
import { beat, coverage, cut, insert, pullOut, pushIn, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

const NOTES = 'docs/design/gnome-theft-auto/direction/scenes/';
const HOA_LOOK: Look = { hat: 0x18181e, shirt: 0xc9b99b };
const MARSHAL_LOOK: Look = { hat: 0x18181e, shirt: 0xd8c24a, pants: 0x3a3228 };
/** The Flock of the One Leg: grey robes (societies/flock/life.ts GREY). */
const FLOCK_LOOK: Look = { shirt: 0x8d9096, pants: 0x6f7378, hat: 0x9aa0a8 };
const HOA_TINT = 0x222226;
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- The test line and the machine on it ------------------------------------------------------------------------------
// From the middle of the course past the hedge's south end, across the ninth fairway, to the Kicked Board (W14's scar,
// worldChanges/rows/mownScar.ts TEST_LINE). t = metres along it from its start.
const LINE_A: Vec2 = [-1172, 703.5];
const LINE_B: Vec2 = [-1004, 641];
const LINE_LEN = Math.hypot(LINE_B[0] - LINE_A[0], LINE_B[1] - LINE_A[1]);
const DIR: Vec2 = [(LINE_B[0] - LINE_A[0]) / LINE_LEN, (LINE_B[1] - LINE_A[1]) / LINE_LEN];
/** The machine's heading: along the line, east-north-east. */
const LINE_YAW = Math.atan2(DIR[0], DIR[1]);
const onLine = (t: number, side = 0): Vec2 => [LINE_A[0] + DIR[0] * t - DIR[1] * side, LINE_A[1] + DIR[1] * t + DIR[0] * side];
/** The deck stands this far ahead of the Combine's centre (its nose is about 7 m ahead at size 14). */
const DECK_AHEAD = 26.4;
/** The machine is three times the size the first cut drew it (FX05 I8): a deck 24 m across and about 10 m tall, wrong for a golf course. */
const DECK_SIZE = 24;
const COMBINE_SIZE = 42;

/** The Combine and its test deck, both hidden until a scene spawns them with combineAt(). */
function combineProps(): ScriptProp[] {
  return [
    { id: 'combine', prefab: 'grand-combine-boss', at: onLine(-DECK_AHEAD), yaw: LINE_YAW, size: COMBINE_SIZE, by: 'w', hidden: true },
    { id: 'deck', prefab: 'combine-test-deck', at: onLine(0), yaw: LINE_YAW, size: DECK_SIZE, by: 'w', hidden: true },
  ];
}
/** Where the machine stands in the p2 intro's reveal: its deck's front, 62 m along the line, 34 m from the lens. */
const REVEAL_T = 62;
/** Spawn (or move) the machine so its deck's front stands `t` metres along the line. Use between cuts only. */
function combineAt(t: number): Step[] {
  return [
    { do: 'spawn', id: 'combine', at: onLine(t - DECK_AHEAD), yaw: LINE_YAW },
    { do: 'spawn', id: 'deck', at: onLine(t), yaw: LINE_YAW },
  ];
}
/** HOA survey flags along the line every 8 m from t0 to t1 (ids stake-<t>): the line, drawn before it is cut. */
function stakes(t0: number, t1: number): ScriptProp[] {
  const out: ScriptProp[] = [];
  for (let t = Math.ceil(t0 / 8) * 8; t <= t1; t += 8) out.push({ id: `stake-${t}`, prefab: 'slalom-flag', at: onLine(t, 1.2), yaw: LINE_YAW, size: 1.3, by: 'h' });
  return out;
}
/** The deck eats the stakes between t0 and t1 (they were there; now they are not). */
function eat(t0: number, t1: number): Step[] {
  const out: Step[] = [];
  for (let t = Math.ceil(t0 / 8) * 8; t <= t1; t += 8) out.push({ do: 'despawn', id: `stake-${t}` });
  return out;
}
/** The gala's nearest-the-pin flag, planted on the ninth fairway on the line (W14 lays it snapped there). */
const GALA_FLAG_T = 96;

// ---- The terrace: the backers' gala ----------------------------------------------------------------------------------
const TERRACE = 'm52-gala-terrace';
const T_PEONY = markOf(TERRACE, 'peony');
const T_PLAYER = markOf(TERRACE, 'player');
const T_BASIL = markOf(TERRACE, 'basil');
const T_TECH = markOf(TERRACE, 'hoa-tech');
const T_VESPER = markOf(TERRACE, 'vesper');
const T_WISTERIA = markOf(TERRACE, 'wisteria');
const T_CADDY = markOf(TERRACE, 'player', 1);
const T_THRIFT = markOf(TERRACE, 'thrift');
const T_TANSY = markOf(TERRACE, 'tansy');
const T_PIP = markOf(TERRACE, 'pip');
/** The two HOA loudspeaker horns bolted to the terrace for the gala, and the gala trestle. */
const HORN_W: Vec2 = [-1067.6, 457.0];
const HORN_E: Vec2 = [-1052.6, 456.6];
const HORN_W_TOP: Vec3 = up(HORN_W[0], HORN_W[1], 3.0);
function terraceDressing(): ScriptProp[] {
  return [
    { id: 'horn-w', prefab: 'pl-horn-speaker', at: HORN_W, yaw: 0.15, size: 3.4, by: 'h' },
    { id: 'horn-e', prefab: 'pl-horn-speaker', at: HORN_E, yaw: -0.15, size: 3.4, by: 'h' },
    { id: 'trestle', prefab: 'tea-trestle', at: [-1071.2, 457.4], yaw: 0, size: 2.2 },
  ];
}

/** Peony and the player across her terrace: one side of their line all scene. */
const BIB = coverage('peony', 'player', 1);

export const P1_INTRO: SceneScript = {
  id: 'm52-the-test-cut-p1-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  ambience: 'garden',
  direction: { notes: `${NOTES}m52-the-test-cut-p1-intro.md`, kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: T_PLAYER.at, yaw: T_PLAYER.yaw },
    { id: 'peony', preset: 'peony', at: T_PEONY.at, yaw: T_PEONY.yaw, held: 'caddy-bib' },
    { id: 'basil', preset: 'basil', at: T_BASIL.at, yaw: T_BASIL.yaw },
    { id: 'tech', name: 'HOA Technician', look: HOA_LOOK, at: T_TECH.at, yaw: towards(T_TECH.at, T_PEONY.at), held: 'torque-wrench-chrome' },
  ],
  props: [
    ...terraceDressing(),
    { id: 'bag', prefab: 'golf-bag', at: [-1055.4, 462.4], yaw: 0.4, size: 1.1, by: 'h' },
  ],
  steps: [
    // 1. Hook: a loudspeaker being tested on a golf club's terrace, in the only word the HOA knows.
    { do: 'sfx', id: 'static', at: 'horn-w', gain: 0.6 },
    cut(shot('tech', 'ms', { toward: 'peony', side: 35, height: 'low' })),
    { do: 'say', who: 'tech', text: 'Testing. Even. Even. Even.' },
    { do: 'sfx', id: 'clink', at: 'peony', gain: 0.4, async: true },
    // 2. The place: the gala laid out on Peony's terrace, two brass horns pointing at her course.
    cut(spot(TERRACE, 'terrace-wide')),
    { do: 'wait', s: 2.2 },
    { do: 'face', who: 'peony', at: 'player', s: 0.4 },
    cut(BIB.single('peony', 'mcu')),
    { do: 'say', who: 'peony', text: 'They are bolting loudspeakers to my terrace, my dear. For a gala.' },
    cut(BIB.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Whose gala?' },
    cut(BIB.single('peony', 'mcu', { height: 'low' })),
    { do: 'say', who: 'peony', text: "Mr Thorne's backers. My mortgage, with canapés." },
    // 3. Basil, demoted to caddy master for the evening; and the bib.
    { do: 'face', who: 'basil', at: 'player', s: 0.4, async: true },
    cut(shot('basil', 'ms', { toward: 'player', side: 30 })),
    { do: 'gesture', who: 'basil', name: 'idle-sulk', s: 1.4, async: true },
    { do: 'say', who: 'basil', text: "Champ. They've made me caddy master. For backers." },
    cut(BIB.single('peony', 'mcu')),
    { do: 'say', who: 'peony', text: 'And our new caddy wears the nine. Put it on, my dear.' },
    { do: 'give', from: 'peony', to: 'player', s: 1.0 },
    cut(insert('player', { toward: 'peony', side: -30 })),
    { do: 'sfx', id: 'cloth', at: 'player', gain: 0.5 },
    { do: 'wait', s: 1.1 },
    cut(BIB.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'It says six.' },
    // The gag, locked off and wide enough for both: Peony does not look down at it.
    // (the swing is 50 deg, not 75: Peony's face stays in the frame)
    cut({ kind: 'frame', who: 'peony', size: 'ms', toward: 'player', side: 50 }),
    { do: 'say', who: 'peony', text: 'It is a nine, sewn on by a committee. Stand up straight.' },
    ...reaction('basil', { toward: 'peony', gesture: 'facepalm', size: 'mcu', side: 20, hold: 'pause' }),
    // 4. The turn: why a caddy. Peony quieter, and closer.
    { do: 'face', who: 'peony', at: 'player', s: 0.3 },
    cut(pushIn('peony', 'mcu', 3.6, { toward: 'player', side: 20 })),
    { do: 'say', who: 'peony', text: 'Caddies are furniture. Nobody lowers their voice for furniture.' },
    ...reaction('player', { toward: 'peony', size: 'mcu', side: -20, hold: 'tiny' }),
    { do: 'say', who: 'player', text: 'You want me to listen.' },
    cut(BIB.single('peony', 'cu')),
    beat('beat'),
    { do: 'say', who: 'peony', text: 'One wants nothing. One will say nothing.' },
    // 5. The job, from Basil: the Countess's bag, down to the first tee.
    cut(shot('basil', 'mcu', { toward: 'player', side: 25 })),
    { do: 'say', who: 'basil', text: "The Countess's bag, champ. First tee. Everything she owns is purple." },
    // 6. Button: the horn over all of them crackles once more. Peony's eyes go to it, and stay.
    { do: 'face', who: 'peony', at: HORN_W, s: 0.6, async: true },
    { do: 'sfx', id: 'static', at: 'horn-w', gain: 0.7 },
    cut(shot('tech', 'ms', { toward: 'peony', side: 30, height: 'low' })),
    { do: 'say', who: 'tech', text: '...Even.' },
    cut(shot('peony', 'mcu', { side: 15, height: 'low' })),
    beat('pause'),
  ],
};

export const P1_MID: SceneScript = {
  id: 'm52-the-test-cut-p1-mid',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'garden',
  direction: { notes: `${NOTES}m52-the-test-cut-p1-mid.md`, kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: T_CADDY.at, yaw: T_CADDY.yaw, held: 'caddy-bib' },
    { id: 'vesper', preset: 'vesper', at: T_VESPER.at, yaw: T_VESPER.yaw, held: null },
    { id: 'wisteria', preset: 'wisteria', at: T_WISTERIA.at, yaw: T_WISTERIA.yaw, held: 'espresso-cup' },
  ],
  props: [
    ...terraceDressing(),
    { id: 'bag', prefab: 'golf-bag', at: [-1054.4, 458.9], yaw: 0.2, size: 1.1, by: 'h' },
    ...stakes(8, 176),
  ],
  steps: [
    // 1. Hook: a glass set down on a planter; the Countess looking out at the course, which has little flags in it.
    { do: 'sfx', id: 'clink', at: 'wisteria', gain: 0.6 },
    cut(shot('wisteria', 'mcu', { side: 20 })),
    { do: 'say', who: 'wisteria', text: "Little flags, Vesper. All the way across Peony's lawn." },
    // Her view: the survey flags in a dead-straight row across the ninth, in the last of the light.
    cut({ kind: 'cut', pos: up(-1040, 652, 1.3), look: up(-1110, 680.6, 0.7), fov: 30 }),
    { do: 'sfx', id: 'flutter', at: 'stake-136', gain: 0.4 },
    { do: 'wait', s: 2.0 },
    // 2. Vesper: low, alone, still, looking out at the course and not at her. His stinger, once.
    { do: 'stinger', id: 'villain' },
    cut(pushIn('vesper', 'mcu', 4.2, { height: 'low', side: -15 })),
    { do: 'say', who: 'vesper', text: 'Survey flags, Countess. Tonight the deck is tested.' },
    { do: 'say', who: 'vesper', text: 'It will cut a straight line through the ninth.' },
    cut(shot('wisteria', 'mcu', { side: -20 })),
    { do: 'say', who: 'wisteria', text: 'Round the green, one presumes.' },
    // 3. The turn: what a straight line means. The Countess flinches at the last word.
    cut(shot('vesper', 'cu', { height: 'low', side: 10 })),
    beat('tiny'),
    { do: 'say', who: 'vesper', text: 'A straight line goes round nothing. Not greens. Not hedges. Not vines.' },
    ...reaction('wisteria', { gesture: 'flinch', size: 'mcu', side: -20, hold: 'pause' }),
    { do: 'say', who: 'wisteria', text: 'The Countess has vines, Vesper.' },
    cut(shot('vesper', 'mcu', { height: 'low', side: 25 })),
    { do: 'say', who: 'vesper', text: 'Then the Countess will have a very even view of them.' },
    // 4. Vesper speaks to the parasol without turning round. He knew the caddy was there.
    { do: 'sfx', id: 'cloth', at: 'player', gain: 0.4, async: true },
    cut(shot('player', 'mcu', { toward: 'vesper', side: 25, height: 'high' })),
    { do: 'wait', s: 1.0 },
    cut(pushIn('vesper', 'mcu', 3.6, { height: 'low', side: -10 })),
    { do: 'say', who: 'vesper', text: 'Thank you, caddy. That will be all.' },
    // 5. Button: the Countess looks round at the caddy. Only she does.
    { do: 'face', who: 'wisteria', at: 'player', s: 0.8 },
    cut(shot('wisteria', 'mcu', { toward: 'player', side: 20 })),
    beat('pause'),
  ],
};

// ---- The ninth: the night of the test --------------------------------------------------------------------------------
const NINTH = 'm52-ninth-test';
const N_THRIFT = markOf(NINTH, 'thrift');
const N_TUMBLE = markOf(NINTH, 'tumblesoil');
const N_PEONY = markOf(NINTH, 'peony');
const N_BASIL = markOf(NINTH, 'basil');
const N_PLAYER = markOf(NINTH, 'player');
const F_PLAYER = markOf(NINTH, 'player', 1);
const F_PEONY = markOf(NINTH, 'peony', 1);
const F_TANSY = markOf(NINTH, 'tansy');
const F_PIP = markOf(NINTH, 'pip');
/** The moles' teacup by the hole (golfQuests: "That is a mole's teacup"), and Tumblesoil's family behind her. */
const CUP_AT: Vec3 = up(-1062.4, 634.8, 0.1);
const PUPS: Vec2[] = [[-1070.6, 628.2], [-1071.4, 629.9], [-1070.4, 631.4], [-1072.2, 631.2], [-1069.6, 627.0]];

/** Thrift and Tumblesoil on the green: one side of their line. Moles at their own eye height (batch-3 notes 6.5). */
const GREEN = coverage('tumblesoil', 'thrift', 1);
/** Peony and Thrift about whose green it is: the other pair. */
const WHOSE = coverage('peony', 'thrift', -1);

export const P2_INTRO: SceneScript = {
  id: 'm52-the-test-cut-p2-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'garden',
  direction: { notes: `${NOTES}m52-the-test-cut-p2-intro.md`, kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: N_PLAYER.at, yaw: N_PLAYER.yaw },
    // Hands empty: his tool crossed his face in the close shots.
    { id: 'thrift', preset: 'thrift', at: N_THRIFT.at, yaw: N_THRIFT.yaw, held: null },
    { id: 'tumblesoil', preset: 'tumblesoil', at: N_TUMBLE.at, yaw: N_TUMBLE.yaw },
    { id: 'peony', preset: 'peony', at: N_PEONY.at, yaw: N_PEONY.yaw },
    { id: 'basil', preset: 'basil', at: N_BASIL.at, yaw: N_BASIL.yaw },
  ],
  props: [
    { id: 'cup', prefab: 'pl-espresso-cup', at: CUP_AT, yaw: 0.3, size: 0.22, by: 'h' },
    ...PUPS.map((p, i): ScriptProp => ({ id: `pup-${i}`, prefab: 'mole-pup', at: p, yaw: towards(p, N_THRIFT.at) + (i - 2) * 0.2 })),
    ...combineProps(),
  ],
  steps: [
    // 1. Hook: the teacup by the hole rattles in its saucer. Thrift, at the grass's own level, hushes it.
    { do: 'gesture', who: 'thrift', name: 'water', s: 2.2, async: true },
    cut(spot(NINTH, 'green-low')),
    { do: 'shake', amp: 0.02, s: 0.8, async: true },
    { do: 'sfx', id: 'clink', at: CUP_AT, gain: 0.5 },
    { do: 'wait', s: 0.6 },
    { do: 'face', who: 'thrift', at: 'tumblesoil', s: 0.4 },
    cut(GREEN.single('thrift', 'mcu', { height: 'low' })),
    { do: 'say', who: 'thrift', text: 'Hush now. It is only the gala.' },
    cut(GREEN.single('tumblesoil', 'mcu')),
    { do: 'say', who: 'tumblesoil', text: 'That is not the gala, dear one.' },
    // 2. The second tremor, harder: everyone on the green turns west.
    { do: 'shake', amp: 0.05, s: 1.2, async: true },
    { do: 'sfx', id: 'clatter', at: CUP_AT, gain: 0.6, async: true },
    { do: 'face', who: 'peony', at: [-1150, 690], s: 0.5, async: true },
    { do: 'face', who: 'basil', at: [-1150, 690], s: 0.5, async: true },
    { do: 'face', who: 'player', at: [-1150, 690], s: 0.5, async: true },
    { do: 'music', track: null, fade: 0.4 },
    cut(spot(NINTH, 'ninth-wide')),
    { do: 'wait', s: 1.8 },
    // 3. The turn: the hedge's tail against the dusk; a long engine note; then the picture changes.
    cut(spot(NINTH, 'hedge-tail')),
    { do: 'sfx', id: 'engine-rev', at: up(-1170, 703, 2), gain: 0.4 },
    { do: 'wait', s: 1.4 },
    cut(shot('peony', 'mcu', { side: -20, height: 'low' })),
    { do: 'wait', s: 1.1 },
    // The reveal: low on the ninth, the hedge in the middle distance, and the deck climbs over it, enormous and wrong;
    // the crane lifts the lens up its hood to the porcelain crown (the cut hides the machine arriving).
    ...combineAt(REVEAL_T),
    { do: 'stinger', id: 'reveal' },
    { do: 'sfx', id: 'engine-rev', at: 'deck', gain: 0.7 },
    { do: 'cam', shot: { kind: 'dolly', from: up(-1090, 662, 0.4), to: up(-1090, 662, 1.6), look: up(-1114, 682, 3.2), lookTo: up(-1114, 682, 8), s: 4.2, ease: 'smooth', fov: 62 } },
    { do: 'wait', s: 4.2 },
    // 4. Basil knows what the little flags were for. His club goes down.
    { do: 'hold', who: 'basil', prop: null },
    { do: 'sfx', id: 'clatter', at: 'basil', gain: 0.6 },
    { do: 'face', who: 'basil', at: 'peony', s: 0.3 },
    cut(shot('basil', 'mcu', { toward: 'peony', side: 25 })),
    { do: 'say', who: 'basil', text: 'The little flags, ma\'am. They run straight across the ninth.' },
    // 5. Peony gives the order, and Thrift answers for the moles.
    { do: 'face', who: 'peony', at: 'thrift', s: 0.4, async: true },
    { do: 'face', who: 'thrift', at: 'peony', s: 0.4 },
    cut(pushIn('peony', 'mcu', 2.8, { toward: 'thrift', side: -25 })),
    { do: 'say', who: 'peony', text: 'Basil. Thrift. Off my green.' },
    cut(WHOSE.single('thrift', 'mcu')),
    { do: 'say', who: 'thrift', text: 'It is not your green, ma\'am. It is theirs.' },
    ...reaction('tumblesoil', { toward: 'thrift', size: 'mcu', side: 25, hold: 'tiny' }),
    { do: 'say', who: 'tumblesoil', text: 'Moles first, if it pleases the Hall. Then the rest.' },
    cut(WHOSE.single('peony', 'cu')),
    beat('beat'),
    { do: 'say', who: 'peony', text: '...Moles first. Fetch a cart, my dear. Quickly.' },
    // 6. Button: the machine, low and alone, its deck discs turning over the hedge's tail.
    { do: 'music', track: 'villain', fade: 0.4 },
    cut({ kind: 'cut', pos: up(-1086, 676, 0.5), look: up(-1114, 683, 4.5), fov: 55 }),
    { do: 'sfx', id: 'engine-rev', at: 'deck', gain: 0.8 },
    { do: 'wait', s: 2.0 },
  ],
};

// ---- p2 outro: the line drawn, and the Flock -----------------------------------------------------------------------------
const LINE = 'm52-test-line';
const L_SAX = markOf(LINE, 'saxifrage');
const L_FLOCK: Vec2[] = [0, 1, 2].map((n) => markOf(LINE, 'flock', n).at);
const L_VESPER = markOf(LINE, 'vesper');
/** Where the Flock hop to: two north of the line, two south, so the row parts like a curtain. */
const HOP = (p: Vec2, side: number): Vec2 => [p[0] - DIR[1] * side, p[1] + DIR[0] * side];
/** The Clubhouse door, where the player has just set Peony, Basil and Thrift down. */
const C_PEONY: Vec2 = [-1059.4, 460.6];
const C_BASIL: Vec2 = [-1057.4, 461.4];
const C_THRIFT: Vec2 = [-1062.8, 462.0];
const C_PLAYER: Vec2 = [-1061.0, 463.6];

export const P2_OUTRO: SceneScript = {
  id: 'm52-the-test-cut-p2-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'garden',
  direction: { notes: `${NOTES}m52-the-test-cut-p2-outro.md`, kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: C_PLAYER, yaw: Math.PI },
    { id: 'peony', preset: 'peony', at: C_PEONY, yaw: Math.PI },
    { id: 'basil', preset: 'basil', at: C_BASIL, yaw: 0.2 },
    { id: 'thrift', preset: 'thrift', at: C_THRIFT, yaw: -0.2 },
    { id: 'saxifrage', preset: 'saxifrage', at: L_SAX.at, yaw: L_SAX.yaw },
    ...L_FLOCK.map((p, i): ScriptActor => ({ id: `flock-${i}`, name: 'The Flock', look: FLOCK_LOOK, at: p, yaw: L_SAX.yaw })),
  ],
  props: [
    ...terraceDressing(),
    ...combineProps(),
    ...stakes(40, 120),
    { id: 'gala-flag', prefab: 'golf-flagstick', at: onLine(GALA_FLAG_T, -1.5), yaw: 0, size: 2.2, by: 'h' },
  ],
  steps: [
    // 1. Hook: a long dry cut sound from the course, once. Basil and Thrift turn round; Peony does not.
    { do: 'sfx', id: 'whoosh', at: up(-1100, 676, 1), gain: 0.7, async: true },
    { do: 'sfx', id: 'rustle', at: up(-1100, 676, 1), gain: 0.5 },
    ...combineAt(46),
    { do: 'face', who: 'thrift', at: [-1080, 600], s: 0.6, async: true },
    cut(shot('thrift', 'ms', { side: 30, height: 'high' })),
    { do: 'wait', s: 0.8 },
    { do: 'say', who: 'thrift', text: 'All the little flags. Going one by one.' },
    // 2. The line, low: the Flock standing across it on one leg, the deck coming behind them, unhurried.
    { do: 'ambience', bed: 'meadow', fade: 0.6 },
    { do: 'gesture', who: 'saxifrage', name: 'one-leg', s: 9, async: true },
    { do: 'gesture', who: 'flock-0', name: 'one-leg', s: 9, async: true },
    { do: 'gesture', who: 'flock-1', name: 'one-leg', s: 9, async: true },
    { do: 'gesture', who: 'flock-2', name: 'one-leg', s: 9, async: true },
    cut(spot(LINE, 'flock-wide')),
    { do: 'sfx', id: 'flutter', at: 'saxifrage', gain: 0.5 },
    { do: 'wait', s: 2.2 },
    ...eat(40, 56),
    ...combineAt(54),
    cut(shot('saxifrage', 'mcu', { side: 30 })),
    { do: 'say', who: 'saxifrage', text: 'We stand in its path. As it was foretold, so it is stood.' },
    cut(spot(LINE, 'line-low')),
    { do: 'sfx', id: 'engine-rev', at: 'deck', gain: 0.7 },
    { do: 'wait', s: 1.6 },
    cut(shot('saxifrage', 'cu', { side: 15, height: 'low' })),
    beat('beat'),
    { do: 'say', who: 'saxifrage', text: 'It is stood. Now we stand over there.' },
    // 3. The Flock part on one leg, two each way, in order. The long wide hold: nobody hurries.
    cut(spot(LINE, 'flock-wide')),
    { do: 'walk', who: 'flock-0', path: [HOP(L_FLOCK[0], -13)], speed: 3.6, async: true },
    { do: 'walk', who: 'saxifrage', path: [HOP(L_SAX.at, -14.5)], speed: 3.6, async: true },
    { do: 'walk', who: 'flock-1', path: [HOP(L_FLOCK[1], 14.5)], speed: 3.6, async: true },
    { do: 'walk', who: 'flock-2', path: [HOP(L_FLOCK[2], 13)], speed: 3.6 },
    { do: 'gesture', who: 'saxifrage', name: 'one-leg', s: 8, async: true },
    { do: 'gesture', who: 'flock-0', name: 'one-leg', s: 8, async: true },
    { do: 'gesture', who: 'flock-1', name: 'one-leg', s: 8, async: true },
    { do: 'gesture', who: 'flock-2', name: 'one-leg', s: 8, async: true },
    { do: 'wait', s: 1.6 },
    // 4. The deck goes through the gap where they stood, and on across the ninth: the gala flag goes under it.
    ...eat(56, 96),
    ...combineAt(70),
    { do: 'cam', shot: { kind: 'dolly', from: up(-1094, 661, 1.5), to: up(-1089.5, 663, 1.5), look: up(-1112, 681, 4.5), s: 2.0, fov: 50 } },
    { do: 'sfx', id: 'engine-rev', at: 'deck', gain: 0.8 },
    { do: 'wait', s: 2.0 },
    ...combineAt(98),
    { do: 'despawn', id: 'gala-flag' },
    cut(spot(NINTH, 'deck-low')),
    { do: 'sfx', id: 'snap', at: 'deck', gain: 0.8 },
    { do: 'sfx', id: 'crunch', at: 'deck', gain: 0.6, async: true },
    { do: 'wait', s: 1.8 },
    // 5. Button: back at the Clubhouse door. Basil tells her; Peony turns round at last, and looks. No line.
    { do: 'ambience', bed: 'garden', fade: 0.6 },
    { do: 'face', who: 'basil', at: 'peony', s: 0.4 },
    cut(shot('basil', 'mcu', { toward: 'peony', side: 25 })),
    { do: 'say', who: 'basil', text: "It's drawn its line, ma'am. Right through the ninth." },
    { do: 'face', who: 'peony', at: [-1080, 640], s: 1.2 },
    cut(pushIn('peony', 'ms', 3.4, { side: 20, to: 'cu' })),
    { do: 'sfx', id: 'cloth', at: 'peony', gain: 0.3 },
    beat('silence'),
    { do: 'wait', s: 0.6 },
  ],
};

// ---- p3: against the deck --------------------------------------------------------------------------------------------
/** The deck's escort: two HOA mowers that come round in front of it, lamps on. */
const ESCORT_A: Vec2[] = [onLine(78, -17), onLine(96, -7), onLine(104, -3)];
const ESCORT_B: Vec2[] = [onLine(78, 17), onLine(94, 7), onLine(103, 3.5)];
function escort(at: 'in' | 'out'): ScriptVehicle[] {
  const a = at === 'in' ? ESCORT_A[0] : ESCORT_A[2];
  const b = at === 'in' ? ESCORT_B[0] : ESCORT_B[2];
  return [
    { id: 'escort-a', kind: 'ride-on', at: a, yaw: LINE_YAW, tint: HOA_TINT, headlights: true },
    { id: 'escort-b', kind: 'ride-on', at: b, yaw: LINE_YAW, tint: HOA_TINT, headlights: true },
  ];
}

/** Peony and the player on the fairway, side by side, facing the deck: one side of their line. */
const FACE = coverage('peony', 'player', -1);

export const P3_INTRO: SceneScript = {
  id: 'm52-the-test-cut-p3-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'garden',
  direction: { notes: `${NOTES}m52-the-test-cut-p3-intro.md`, kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: F_PLAYER.at, yaw: F_PLAYER.yaw, held: 'hoa-radio' },
    { id: 'peony', preset: 'peony', at: F_PEONY.at, yaw: F_PEONY.yaw },
    // On the radio from the Kicked Board: voices only.
    { id: 'tansy', preset: 'tansy', at: [-1002, 646], hidden: true },
    { id: 'pip', preset: 'pip', at: [-1002, 648], hidden: true },
    { id: 'marshal', name: 'HOA Marshal', look: MARSHAL_LOOK, at: [0, 0], seatedIn: 'escort-a' },
    { id: 'marshal-b', name: 'HOA Marshal', look: MARSHAL_LOOK, at: [0, 0], seatedIn: 'escort-b' },
  ],
  props: [...combineProps(), ...stakes(88, 176)],
  vehicles: escort('in'),
  steps: [
    // 1. Hook: ground level on the ninth, the next survey flag in the foreground, the deck coming down the line at it.
    ...combineAt(84),
    cut(spot(NINTH, 'deck-low')),
    { do: 'sfx', id: 'engine-rev', at: 'deck', gain: 0.7 },
    { do: 'wait', s: 1.6 },
    ...eat(88, 88),
    { do: 'sfx', id: 'snap', at: 'deck', gain: 0.6 },
    { do: 'wait', s: 1.0 },
    // 2. The radio: Tansy and Pip, coming in by the board. The player and Peony at the edge of the fairway.
    { do: 'sfx', id: 'static', at: 'player', gain: 0.6, async: true },
    cut(insert('player', { toward: 'peony', side: 30 })),
    { do: 'say', who: 'tansy', text: "Tansy. Pip's with me. We're through the board." },
    cut(FACE.two('ms')),
    { do: 'say', who: 'pip', text: 'Is it as big as it sounds? It sounds very big.' },
    { do: 'face', who: 'peony', at: 'player', s: 0.4 },
    cut(FACE.single('peony', 'mcu')),
    { do: 'say', who: 'peony', text: 'Bigger, Mr Potsworth.' },
    { do: 'sfx', id: 'static', at: 'player', gain: 0.5, async: true },
    cut(FACE.single('player', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Then we hit it with everything. Sixty seconds. Then we see.' },
    // 3. The turn: the escort mowers peel out from behind the deck and come round in front of it, lamps on.
    { do: 'drive', vehicle: 'escort-a', path: ESCORT_A, speed: 8, async: true },
    { do: 'drive', vehicle: 'escort-b', path: ESCORT_B, speed: 8, async: true },
    cut({ kind: 'track', pos: up(-1064, 657, 1.2), who: 'escort-a', fov: 46 }),
    { do: 'sfx', id: 'engine-rev', at: 'escort-a', gain: 0.6 },
    { do: 'wait', s: 2.6 },
    // 4. Peony, to the player, and means it.
    { do: 'face', who: 'peony', at: 'player', s: 0.3 },
    cut(pushIn('peony', 'mcu', 3, { toward: 'player', side: -20, height: 'low' })),
    { do: 'say', who: 'peony', text: 'One does not concede a hole, my dear.' },
    ...reaction('player', { toward: 'peony', gesture: 'nod', size: 'mcu', side: 20, hold: 'pause' }),
    // 5. Button: the machine, low, alone, its escort in front of it.
    { do: 'music', track: 'chase', fade: 0.4 },
    { do: 'stinger', id: 'danger' },
    cut({ kind: 'cut', pos: up(-1066, 660, 0.5), look: up(-1092, 672.4, 2.6), fov: 42 }),
    { do: 'sfx', id: 'engine-rev', at: 'escort-b', gain: 0.8 },
    { do: 'wait', s: 1.4 },
  ],
};

/** The ball: on its tee, then off the porcelain hood, then lying in front of the deck. */
const TEE_AT: Vec2 = [F_PLAYER.at[0] - 1.0, F_PLAYER.at[1] + 1.2];
const BALL_LANDS: Vec2 = onLine(97.5, -0.8);

export const P3_OUTRO: SceneScript = {
  id: 'm52-the-test-cut-p3-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'garden',
  direction: { notes: `${NOTES}m52-the-test-cut-p3-outro.md`, kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: F_PLAYER.at, yaw: towards(F_PLAYER.at, F_PEONY.at), held: null },
    { id: 'peony', preset: 'peony', at: F_PEONY.at, yaw: towards(F_PEONY.at, F_PLAYER.at) },
    { id: 'tansy', preset: 'tansy', at: F_TANSY.at, yaw: towards(F_TANSY.at, F_PLAYER.at) },
    { id: 'pip', preset: 'pip', at: F_PIP.at, yaw: towards(F_PIP.at, onLine(92)), held: null },
    { id: 'marshal', name: 'HOA Marshal', look: MARSHAL_LOOK, at: [0, 0], seatedIn: 'escort-a' },
  ],
  props: [
    ...combineProps(),
    { id: 'ball', prefab: 'golf-ball', at: up(TEE_AT[0], TEE_AT[1], 0.08), yaw: 0, size: 0.16 },
    { id: 'tee', prefab: 'golf-tee', at: TEE_AT, yaw: 0, size: 0.12, by: 'h' },
  ],
  vehicles: [{ id: 'escort-a', kind: 'ride-on', at: ESCORT_A[2], yaw: LINE_YAW, tint: HOA_TINT, headlights: true }],
  steps: [
    // 1. Hook: the last escort mower spins away to the machine's side, its minute done. The deck has not stopped.
    ...combineAt(90),
    { do: 'drive', vehicle: 'escort-a', path: [onLine(108, -6), onLine(110, -14)], speed: 7, arrive: false, async: true },
    cut({ kind: 'track', pos: up(-1066, 655, 1.1), who: 'escort-a', fov: 48 }),
    { do: 'sfx', id: 'skid', at: 'escort-a', gain: 0.6 },
    { do: 'wait', s: 1.6 },
    { do: 'face', who: 'tansy', at: 'player', s: 0.4 },
    cut(shot('tansy', 'mcu', { toward: 'player', side: 25 })),
    { do: 'say', who: 'tansy', text: 'That was everything. All of it. Twice.' },
    ...reaction('pip', { toward: 'tansy', size: 'mcu', side: 20, hold: 'pause' }),
    // 2. Peony steps up and holds out her driver: the thing she leans on.
    cut(shot('peony', 'ms', { toward: 'player', side: 30 })),
    { do: 'say', who: 'peony', text: 'Your best, my dear. Mine is out of practice.' },
    { do: 'give', from: 'peony', to: 'player', s: 1.1 },
    cut(insert('player', { toward: 'peony', side: -25 })),
    { do: 'sfx', id: 'cloth', at: 'player', gain: 0.4 },
    { do: 'wait', s: 1.0 },
    // 3. The shot: the ball on its tee, the swing, the tock; then the ball off the porcelain hood. Music out.
    { do: 'music', track: null, fade: 0.5 },
    { do: 'face', who: 'player', at: onLine(94), s: 0.5 },
    cut(shot('player', 'fs', { side: 70, height: 'low' })),
    { do: 'wait', s: 0.9 },
    { do: 'gesture', who: 'player', name: 'sweep', s: 0.9, async: true },
    { do: 'wait', s: 0.5 },
    { do: 'sfx', id: 'tap', at: 'ball', gain: 0.9 },
    { do: 'despawn', id: 'ball' },
    { do: 'wait', s: 0.6 },
    cut({ kind: 'cut', pos: up(-1074, 660, 1.4), look: up(-1084.4, 669.2, 2.6), fov: 36 }),
    { do: 'wait', s: 0.6 },
    { do: 'sfx', id: 'clink', at: 'deck', gain: 0.8 },
    { do: 'wait', s: 0.9 },
    { do: 'spawn', id: 'ball', at: up(BALL_LANDS[0], BALL_LANDS[1], 0.08) },
    // Pip walks out ahead of the others, off to the east of the machine's path, and turns back to look at it.
    { do: 'walk', who: 'pip', path: [[-1052, 656]], speed: 2.2, async: true },
    // 4. Ground level: the ball lying in the grass, the deck's brass discs coming on behind it. Then over it.
    { do: 'cam', shot: { kind: 'dolly', from: up(BALL_LANDS[0] + 4.4, 0.3, BALL_LANDS[1] - 1.3), to: up(BALL_LANDS[0] + 3.2, 0.26, BALL_LANDS[1] - 0.9), look: up(BALL_LANDS[0] - 2, 0.6, BALL_LANDS[1] + 0.8), s: 2.4, fov: 36 } },
    { do: 'sfx', id: 'engine-rev', at: 'deck', gain: 0.7 },
    { do: 'wait', s: 2.4 },
    ...combineAt(99.5),
    { do: 'despawn', id: 'ball' },
    cut({ kind: 'cut', pos: up(-1074.6, 671.4, 0.45), look: up(-1083.2, 668.4, 0.8), fov: 38 }),
    { do: 'sfx', id: 'engine-rev', at: 'deck', gain: 0.8 },
    { do: 'wait', s: 2.8 },
    // 5. Nobody jokes. Pip, quietly; then Tansy says it.
    // Pip turns from the machine to the others; the lens is behind them, so the deck stands up in the frame behind him.
    { do: 'face', who: 'pip', at: [-1048.4, 654.4], s: 0.3 },
    cut({ kind: 'cut', pos: up(-1048.4, 654.4, 1.0), look: up(-1052, 656, 1.15), fov: 56 }),
    { do: 'say', who: 'pip', text: "...It didn't even slow down." },
    cut(pushIn('tansy', 'mcu', 3.2, { toward: 'player', side: 15 })),
    beat('beat'),
    { do: 'say', who: 'tansy', text: 'Nothing works.' },
    // Button: the deck rolling on alone, low, its discs turning. The camera stays with it.
    ...combineAt(102),
    cut({ kind: 'cut', pos: up(-1066.2, 660.8, 0.5), look: up(-1080.4, 667.4, 1.2), fov: 40 }),
    { do: 'sfx', id: 'engine-rev', at: 'deck', gain: 0.7 },
    { do: 'wait', s: 2.2 },
  ],
};

// ---- The final: through the hedge ----------------------------------------------------------------------------------------
/** The crew on the terrace, facing the course: Tansy and Peony are the pair that decides. */
const DECIDE = coverage('tansy', 'peony', 1);

export const FINAL_INTRO: SceneScript = {
  id: 'm52-the-test-cut-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'garden',
  direction: { notes: `${NOTES}m52-the-test-cut-intro.md`, kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: T_PLAYER.at, yaw: T_PLAYER.yaw },
    { id: 'peony', preset: 'peony', at: T_PEONY.at, yaw: towards(T_PEONY.at, T_TANSY.at), held: null },
    { id: 'basil', preset: 'basil', at: T_BASIL.at, yaw: towards(T_BASIL.at, T_PEONY.at) },
    { id: 'thrift', preset: 'thrift', at: T_THRIFT.at, yaw: T_THRIFT.yaw },
    { id: 'tansy', preset: 'tansy', at: T_TANSY.at, yaw: towards(T_TANSY.at, T_PEONY.at) },
    { id: 'pip', preset: 'pip', at: T_PIP.at, yaw: towards(T_PIP.at, T_PEONY.at), held: null },
    // In the machine's wake, alone on the cut lane, a handset to his mouth; his voice on every horn.
    { id: 'vesper', preset: 'vesper', at: L_VESPER.at, yaw: L_VESPER.yaw, held: 'hoa-radio' },
    { id: 'pa', preset: 'vesper', name: 'Vesper (loudspeaker)', at: HORN_W, hidden: true },
  ],
  props: [...terraceDressing(), ...combineProps(), ...stakes(112, 176)],
  steps: [
    // 1. Hook: both horns crackle at once. Then the voice, very even, from the posts.
    ...combineAt(110),
    { do: 'sfx', id: 'static', at: 'horn-w', gain: 0.7, async: true },
    { do: 'sfx', id: 'static', at: 'horn-e', gain: 0.5 },
    cut(spot(TERRACE, 'pa-horn')),
    { do: 'say', who: 'pa', text: 'Friends. Members. Backers. The test is concluded.' },
    // 2. Where the voice comes from: Vesper alone in the deck's wake, low and still, the handset raised.
    { do: 'stinger', id: 'villain' },
    cut(pushIn('vesper', 'ms', 4.0, { height: 'low', side: 20 })),
    { do: 'say', who: 'vesper', text: 'The deck performs to specification. It cuts what it is given.' },
    cut(pushIn('vesper', 'mcu', 3.4, { height: 'low', side: 10 })),
    { do: 'say', who: 'vesper', text: 'Please remain on the terrace. The date will follow.' },
    // 3. The terrace: the crew together for the first time tonight, under the horns.
    { do: 'ambience', bed: 'garden', fade: 0.4 },
    cut(spot(TERRACE, 'terrace-wide')),
    { do: 'sfx', id: 'static', at: 'horn-e', gain: 0.4 },
    { do: 'wait', s: 1.6 },
    cut(DECIDE.single('tansy', 'mcu')),
    { do: 'gesture', who: 'tansy', name: 'crossArms', s: 1.4, async: true },
    { do: 'say', who: 'tansy', text: 'Nothing works. Go.' },
    ...reaction('pip', { toward: 'tansy', size: 'mcu', side: -20, hold: 'tiny' }),
    { do: 'say', who: 'pip', text: 'Go where? He has the gate, the path, the...' },
    // 4. The turn: Peony answers for her course, and Thrift knows the way.
    cut(DECIDE.single('peony', 'mcu')),
    { do: 'say', who: 'peony', text: 'Through the hedge. The arches.' },
    { do: 'face', who: 'thrift', at: 'peony', s: 0.4, async: true },
    cut(shot('thrift', 'mcu', { toward: 'peony', side: -25 })),
    { do: 'say', who: 'thrift', text: 'And out by the board. I know every blade of the way.' },
    // 5. Button: Peony turns to the horn on its post, which has asked her to remain.
    { do: 'face', who: 'peony', at: [-1070.5, 460.6], s: 0.6 },
    cut(pushIn('peony', 'mcu', 3, { toward: 'thrift', side: 12, height: 'low' })),
    { do: 'say', who: 'peony', text: 'One does not remain, Mr Thorne. Basil. The cart.' },
    { do: 'walk', who: 'basil', path: [[-1062, 466.6]], run: true, async: true },
    { do: 'music', track: 'chase', fade: 0.3 },
    cut(shot('basil', 'fs', { side: 40, handheld: 0.03 })),
    { do: 'sfx', id: 'footsteps', at: 'basil', gain: 0.6 },
    { do: 'wait', s: 1.2 },
  ],
};

// ---- The final outro: the board at night -----------------------------------------------------------------------------
const BOARD = 'm52-board-night';
const B_THRIFT = markOf(BOARD, 'thrift');
const B_PEONY = markOf(BOARD, 'peony');
const B_BASIL = markOf(BOARD, 'basil');
const B_PLAYER = markOf(BOARD, 'player');
const B_TANSY = markOf(BOARD, 'tansy');
const B_PIP = markOf(BOARD, 'pip');
/** A loudspeaker horn on the fence road, one of every horn in Turfton tonight. */
const ROAD_HORN: Vec2 = [-971.5, 646.8];

/** Peony and the player at the fence: the sincere pair. Eye level, nobody above anybody. */
const FENCE = coverage('peony', 'player', 1);

export const FINAL_OUTRO: SceneScript = {
  id: 'm52-the-test-cut-outro',
  stage: { kind: 'world' },
  sky: 'night',
  ambience: 'night',
  direction: { notes: `${NOTES}m52-the-test-cut-outro.md`, kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: B_PLAYER.at, yaw: B_PLAYER.yaw },
    { id: 'peony', preset: 'peony', at: B_PEONY.at, yaw: B_PEONY.yaw, held: null },
    { id: 'basil', preset: 'basil', at: B_BASIL.at, yaw: B_BASIL.yaw },
    { id: 'thrift', preset: 'thrift', at: B_THRIFT.at, yaw: B_THRIFT.yaw, held: null },
    { id: 'tansy', preset: 'tansy', at: B_TANSY.at, yaw: B_TANSY.yaw, held: null },
    { id: 'pip', preset: 'pip', at: B_PIP.at, yaw: B_PIP.yaw, held: null },
    { id: 'pa', preset: 'vesper', name: 'Vesper (every loudspeaker)', at: ROAD_HORN, hidden: true },
  ],
  props: [
    ...combineProps(),
    { id: 'road-horn', prefab: 'pl-horn-speaker', at: ROAD_HORN, yaw: -Math.PI / 2 - 0.3, size: 3.4, by: 'h' },
  ],
  // The cart's lamps and the horn's work light: the crew's faces are lit while the voice plays.
  keyLights: [
    { at: 'cart', lift: 1.4, color: 0xffb066, intensity: 7, range: 14 },
    { at: [-996, 2.4, 641], color: 0xffb066, intensity: 5, range: 12 },
  ],
  vehicles: [
    { id: 'cart', kind: 'golf-cart', at: [-980.2, 636.4], yaw: -Math.PI / 2 + 0.25, headlights: true },
    // An HOA van inside the fence behind the deck: its lamps are the light in the gap.
    { id: 'van', kind: 'hoa-van', at: [-1032, 626], yaw: Math.PI / 2 - 0.25, tint: HOA_TINT, headlights: true },
  ],
  steps: [
    // 1. Hook: through the broken board, the deck stopped a yard from the fence, its discs winding down.
    ...combineAt(178),
    cut(spot(BOARD, 'board-gap')),
    { do: 'sfx', id: 'engine-rev', at: 'deck', gain: 0.5 },
    { do: 'wait', s: 1.4 },
    { do: 'sfx', id: 'creak', at: 'deck', gain: 0.4 },
    { do: 'wait', s: 0.9 },
    // 2. Thrift at the fence with his hand on the boards; Peony looking in at her course.
    cut(shot('thrift', 'mcu', { side: -35 })),
    { do: 'wait', s: 1.2 },
    { do: 'say', who: 'thrift', text: 'It stopped at my fence. Pointing at the town.' },
    // 3. The voice, a long way off, from every horn in Turfton; the crane over the fence along the line it cut.
    { do: 'sfx', id: 'static', at: 'road-horn', gain: 0.5, async: true },
    // The voice is heard over faces: the whole crew in the cart lamps, the lens drifting in from the broken board.
    { do: 'cam', shot: { kind: 'dolly', from: up(-1000.5, 641.6, 1.15), to: up(-997.5, 640.8, 1.3), look: up(-987, 641, 1.4), s: 4.5, fov: 48 } },
    { do: 'say', who: 'pa', text: 'Friends of Turfton. Good evening. A date, for your calendars.' },
    // The date, over the faces that hear it: Tansy (and Pip beside her) turned to the horn on the fence road, the cart lamp on them.
    { do: 'face', who: 'tansy', at: 'road-horn', s: 0.4, async: true },
    cut(shot('tansy', 'ms', { toward: 'road-horn', side: 25 })),
    { do: 'say', who: 'pa', text: 'The Even Cut will take place on the longest day.' },
    cut(spot(BOARD, 'road-wide')),
    { do: 'say', who: 'pa', text: 'Every garden. One height. Thank you.' },
    // The held silence: nobody moves. Music out, crickets only.
    { do: 'music', track: null, fade: 0.6 },
    { do: 'sfx', id: 'static', at: 'road-horn', gain: 0.3 },
    cut(shot('peony', 'cu', { side: -20 })),
    beat('silence'),
    { do: 'wait', s: 0.6 },
    // 4. The sincere beat: Peony turns from her course to the player, and commits Hedgeworth.
    { do: 'face', who: 'peony', at: 'player', s: 0.8 },
    { do: 'face', who: 'player', at: 'peony', s: 0.5 },
    cut(FENCE.single('peony', 'mcu')),
    { do: 'say', who: 'peony', text: 'Hedgeworth is with you, my dear. All of it. What is left.' },
    cut(FENCE.single('player', 'mcu')),
    { do: 'wait', s: 1.0 },
    { do: 'music', track: 'sad', fade: 1.2 },
    cut(shot('basil', 'mcu', { toward: 'peony', side: 25 })),
    { do: 'face', who: 'basil', at: 'peony', s: 0.3 },
    { do: 'gesture', who: 'basil', name: 'nod', s: 1.0, async: true },
    { do: 'say', who: 'basil', text: 'All of it, champ.' },
    // 5. Tansy, to the player: the four parts, and the one they could not stop.
    { do: 'face', who: 'tansy', at: 'player', s: 0.5 },
    cut(shot('tansy', 'mcu', { toward: 'player', side: 25 })),
    { do: 'say', who: 'tansy', text: "Four parts. We've seen them all now." },
    cut(shot('player', 'mcu', { toward: 'tansy', side: -20 })),
    { do: 'say', who: 'player', text: 'And stopped three.' },
    // Pip steps up beside the player, says nothing, and stays there.
    { do: 'walk', who: 'pip', path: [[-985.4, 638.6]], speed: 1.1, async: true },
    cut(shot('pip', 'mcu', { toward: 'player', side: 30 })),
    { do: 'wait', s: 1.4 },
    // 6. Button: the crew in a line on the fence road in the cart lamps, the horn above them, the machine behind.
    cut(pullOut('peony', 'fs', 4.2, { toward: 'player', side: 70, to: 'ws' })),
    { do: 'sfx', id: 'static', at: 'road-horn', gain: 0.2 },
    { do: 'wait', s: 1.8 },
    { do: 'face', who: 'peony', at: [-940, 640], s: 1.2, async: true },
    { do: 'sfx', id: 'creak', at: 'cart', gain: 0.3 },
    { do: 'wait', s: 1.8 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm52-the-test-cut-p1-intro': P1_INTRO,
  'm52-the-test-cut-p1-mid': P1_MID,
  'm52-the-test-cut-p2-intro': P2_INTRO,
  'm52-the-test-cut-p2-outro': P2_OUTRO,
  'm52-the-test-cut-p3-intro': P3_INTRO,
  'm52-the-test-cut-p3-outro': P3_OUTRO,
  'm52-the-test-cut-intro': FINAL_INTRO,
  'm52-the-test-cut-outro': FINAL_OUTRO,
};
