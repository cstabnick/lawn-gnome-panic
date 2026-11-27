// Story row 64 scenes: All Hats, part 3 (By Road) and the final (By Root). Six scenes (stages: quests/stages/story/
// s64-all-hats.ts; notes: docs/design/gnome-theft-auto/direction/scenes/<id>.md). The middle of act IV and the high of the
// game: comedy first, a sincere last minute (batch-3 notes section 2: "four arrivals, each its own gag; the final is warm,
// triumph"). The running thread under all six is being asked: Tumblesoil's "nobody ever asks", Diggs's "nobody asked",
// and Tansy, who never wanted to be in anybody's war, asked every one of them herself.
// - all-hats-p3-intro (p3, dusk, played on arrival at the Dirt Bowl): the Carburettors' entrance. Lulu comes down the pits on
//   a borrowed dirt bike to the head of a column of three idling engines. "Three cars is everyone. The rest took the free
//   tyres." She rides point because a lowrider cannot see over a dune, and hates it up there; Fennimore gets the captain's
//   keys; she owes the player a road (the Capwood Run, the impound). The headlights come on down the column, one by one.
// - all-hats-p3-outro (p3's outro, dusk): the engines parked in a ring at the foot of the overlook rise, noses in; Bertha
//   tells Fennimore there is a scratch (there is not); "Nobody gets boxed in. My mother's rule." Up the rise, one fire. The
//   Carburettors are early, which they never are. The headlights go out round the ring until only the fire is left.
// - all-hats-p4-intro (final, night): the camp. Pip builds a table of fruit crates; Tansy at the heist board says where the
//   story is in one breath; the Flock have been standing on one leg at the edge of the light since Tuesday; the Countess's
//   card is pinned on its own ("Not tonight."); Pip asks what if the rest do not come, and Tansy turns round to say she asked
//   them, herself, every one. Button: lanterns in the dark scrub to the west.
// - all-hats-p4-roots (final, arrival at the west edge): the Unmowed walk out of the scrub; Bracken names the engines; the
//   ground heaves and Old Mother Tumblesoil climbs out of it ("We came the short way."); "Mind your boots." Somebody asked
//   them, so they came. Bracken steps down to a mole's height and bows.
// - all-hats-p4-guard (final, arrival at the east edge): the Spade Guard march up from the highway with Granny's Ride-On stuck
//   behind them at marching pace; "Halt." (the Ride-On halts late, and hoots); Corporal Nubbin's salute, practised; Granny's
//   covered tin ("State the contents." "Later, sugar."). Diggs at attention, eyes on the tin.
// - all-hats-outro (final's outro, night): Granny sets the tin down in the middle of the table: "I brought pie." (the one gag;
//   the pie ladder's #64 rung). Then the sincere minute, no gag on top: "No speech. Inventory." Tansy counts the caps on the
//   rail out loud as she counted her wrenches ("Forty-five. Forty-six. Forty-seven."), turns to the table, and says "All
//   hats." Triumph, and the crane-high wide of the camp (batch-3 notes 6.4: one of the five).
// The camp props stand on W16's spots (worldChanges/rows/coalitionCamp.ts: the crate table at (246, 82), the rail 5.6 m south
// of it facing the table, the fire to the south-west), so the camp the player sees afterwards is the one in these scenes.
import type { ScriptActor, ScriptProp, SceneScript, Step, Vec2, Vec3 } from '../../script';
import { beat, coverage, cut, insert, pushIn, reaction, shot } from '../../direct';
import { carMark, markOf, pathOf, rideOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

const NOTES = 'docs/design/gnome-theft-auto/direction/scenes/';
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

/** The three Carburettors who stayed (R-233), dressed as in the Capwood Run (m40-the-capwood-run.ts). */
const BERTHA_LOOK: Look = { hat: 0xff6a00, shirt: 0x3a2a2a, beard: 0xd8d0c0, dress: true };
const DUNSTAN_LOOK: Look = { hat: 0xe8c33a, shirt: 0x2a3a4a, beard: 0x8a6a4a, glasses: true };
const FENNIMORE_LOOK: Look = { hat: 0x3a7a6a, shirt: 0xd8d0c0, beard: null, freckles: true };
const LULU_TINT = 0xff6a00;
const BERTHA_TINT = 0xb8452c;
const DUNSTAN_TINT = 0xe8c33a;
/** Clary's spare Knobbly, the bike from the impound race (m42). */
const KNOBBLY_TINT = 0xc9a66b;
/** The Unmowed (Elder Bracken's folk): his forest green, bark brown. */
const UNMOWED_LOOK: Look = { hat: 0x2e6f40, shirt: 0x4b3522, pants: 0x2f2519, beard: 0xb8b8b0 };
/** The Spade Guard (ch4.ts SPADE). */
const SPADE_LOOK: Look = { hat: 0x4b6329, shirt: 0x556b2f, beard: 0x5c3e24 };
/** The Flock of the One Leg: grey robes (as at the Test Cut). */
const FLOCK_LOOK: Look = { shirt: 0x8d9096, pants: 0x6f7378, hat: 0x9aa0a8 };

// ---- Part 3, the Dirt Bowl: the column at dusk -----------------------------------------------------------------------
const BOWL = 'm64-bowl-convoy';
const B_LULU = markOf(BOWL, 'lulu');
const B_YOU = markOf(BOWL, 'player');
const B_FENN = markOf(BOWL, 'fennimore');
const B_BERTHA = markOf(BOWL, 'bertha');
const B_DUNSTAN = markOf(BOWL, 'dunstan');
const B_BIKE_IN = pathOf(BOWL, 'bike-in');
const B_CAR_L = carMark(BOWL, 'm64-lulu-car');
const B_CAR_B = carMark(BOWL, 'm64-bertha-car');
const B_CAR_D = carMark(BOWL, 'm64-dunstan-car');
/** Where Fennimore steps to, at the bike's side, for the keys. */
const B_FENN_KEYS: Vec2 = [1012.6, -654.6];
/** Lulu and the player across the head of the column: one side of their line all scene. */
const LP = coverage('lulu', 'player', 1);

export const P3_INTRO: SceneScript = {
  id: 'all-hats-p3-intro',
  stage: { kind: 'world' },
  title: 'All Hats: By Road',
  sky: 'golden',
  music: 'turfton',
  ambience: 'wind',
  radio: 0,
  direction: { notes: `${NOTES}all-hats-p3-intro.md`, kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: B_YOU.at, yaw: towards(B_YOU.at, B_LULU.at) },
    { id: 'lulu', preset: 'lugnut lulu', held: null, at: B_LULU.at, seatedIn: 'bike' },
    { id: 'fennimore', name: 'Fanbelt Fennimore', look: FENNIMORE_LOOK, at: B_FENN.at, yaw: B_FENN.yaw },
    { id: 'bertha', name: 'Big-End Bertha', look: BERTHA_LOOK, at: B_BERTHA.at, yaw: B_BERTHA.yaw },
    { id: 'dunstan', name: 'Dipstick Dunstan', look: DUNSTAN_LOOK, at: B_DUNSTAN.at, yaw: B_DUNSTAN.yaw, held: 'speedway-tea-towel' },
  ],
  vehicles: [
    { id: 'bike', kind: 'dirt-bike', at: B_BIKE_IN[0], yaw: towards(B_BIKE_IN[0], B_BIKE_IN[1]), tint: KNOBBLY_TINT, headlights: true },
    { id: 'l-car', kind: B_CAR_L.kind, at: B_CAR_L.at, yaw: B_CAR_L.yaw, tint: LULU_TINT },
    { id: 'b-car', kind: B_CAR_B.kind, at: B_CAR_B.at, yaw: B_CAR_B.yaw, tint: BERTHA_TINT },
    { id: 'd-car', kind: B_CAR_D.kind, at: B_CAR_D.at, yaw: B_CAR_D.yaw, tint: DUNSTAN_TINT },
  ],
  steps: [
    // 1. Hook: a two-stroke screaming down the pits at dusk, dust gold behind it, straight at the lens.
    { do: 'sfx', id: 'engine-rev', at: 'bike', gain: 0.7, async: true },
    cut({ kind: 'track', pos: up(1016.5, -634, 1.4), who: 'bike', fov: 48 }),
    { do: 'drive', vehicle: 'bike', path: B_BIKE_IN.slice(1), speed: 9 },
    { do: 'sfx', id: 'skid', at: 'bike', gain: 0.6, async: true },
    { do: 'sfx', id: 'crunch', at: 'bike', gain: 0.4, async: true },
    { do: 'shake', amp: 0.04, s: 0.5 },
    // 2. Setup: Lulu, sitting high for once, low angle against the sky; she laughs before the joke, as she does.
    { do: 'face', who: 'player', at: 'lulu', s: 0.3, async: true },
    cut(LP.single('lulu', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'lulu', name: 'laugh', s: 1.2, async: true },
    { do: 'say', who: 'lulu', text: 'Ha! Look who found Rutbottom twice.' },
    cut(LP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Tansy says bring everyone.' },
    cut(LP.single('lulu', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lulu', text: "Then here's everyone." },
    // The Carburettors' entrance: the column, three engines idling out of time, nose to tail at the gate.
    { do: 'sfx', id: 'engine-rev', at: 'b-car', gain: 0.5, async: true },
    cut(spot(BOWL, 'column-low')),
    { do: 'horn', vehicle: 'd-car' },
    { do: 'wait', s: 2.0 },
    cut(LP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Three cars.' },
    cut(LP.single('lulu', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lulu', text: 'Three cars is everyone. The rest took the free tyres.' },
    cut(shot('bertha', 'mcu', { toward: 'lulu', side: 20 })),
    { do: 'gesture', who: 'bertha', name: 'crossArms', s: 1.2, async: true },
    { do: 'say', who: 'bertha', text: 'Beige tyres.' },
    cut(shot('dunstan', 'mcu', { toward: 'lulu', side: 25 })),
    { do: 'gesture', who: 'dunstan', name: 'wave', s: 1.0, async: true },
    { do: 'say', who: 'dunstan', text: 'Sorry about the dust! In advance. Again.' },
    // 3. The bike: point rider, and she hates it up there.
    cut(LP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Why the bike?' },
    cut(pushIn('lulu', 'mcu', 3.0, { toward: 'player', side: 25, height: 'low' })),
    { do: 'say', who: 'lulu', text: "Point rider. You can't see over a dune from a lowrider." },
    cut(LP.single('lulu', 'mcu')),
    { do: 'gesture', who: 'lulu', name: 'shrug', s: 1.0, async: true },
    { do: 'say', who: 'lulu', text: 'Up here I can see everything. I hate it.' },
    // 4. The captain's keys: Fennimore, youngest, gets the orange lowrider.
    { do: 'walk', who: 'fennimore', path: [B_FENN_KEYS], speed: 1.8, async: true },
    cut(shot('fennimore', 'ms', { toward: 'lulu', side: 30 })),
    { do: 'wait', s: 1.0 },
    { do: 'face', who: 'fennimore', at: 'lulu', s: 0.3 },
    { do: 'say', who: 'fennimore', text: 'Captain? Who drives yours?' },
    { do: 'face', who: 'lulu', at: 'fennimore', s: 0.3, async: true },
    cut(shot('lulu', 'mcu', { toward: 'fennimore', side: -25, height: 'low' })),
    { do: 'give', from: 'lulu', to: 'fennimore', prop: 'brass-key', s: 0.9, async: true },
    { do: 'sfx', id: 'keys', at: 'lulu', gain: 0.6, async: true },
    { do: 'say', who: 'lulu', text: 'You do. One scratch, and you walk to the Combine.' },
    cut(shot('fennimore', 'mcu', { toward: 'lulu', side: 25 })),
    { do: 'gesture', who: 'fennimore', name: 'cheer', s: 1.1, async: true },
    { do: 'say', who: 'fennimore', text: 'Youngest! Most careful!' },
    ...reaction('bertha', { toward: 'fennimore', gesture: 'facepalm', size: 'mcu', hold: 'beat' }),
    // 5. The turn: she remembers what the player did, and owes them a road.
    { do: 'face', who: 'lulu', at: 'player', s: 0.4 },
    cut(LP.single('lulu', 'cu', { height: 'low' })),
    { do: 'say', who: 'lulu', text: 'You won me a mountain. And six cars out of tape.' },
    cut(LP.single('lulu', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lulu', text: 'So I owe you a road. Stay in my dust.' },
    // 6. Button: the column wakes, headlights on one after another down the line, and three horns.
    cut(spot(BOWL, 'bowl-wide')),
    { do: 'lights', vehicle: 'l-car', on: true },
    { do: 'wait', s: 0.4 },
    { do: 'lights', vehicle: 'b-car', on: true },
    { do: 'wait', s: 0.4 },
    { do: 'lights', vehicle: 'd-car', on: true },
    { do: 'sfx', id: 'engine-rev', at: 'bike', gain: 0.8, async: true },
    { do: 'horn', vehicle: 'l-car' },
    { do: 'horn', vehicle: 'b-car' },
    { do: 'horn', vehicle: 'd-car' },
    { do: 'wait', s: 1.6 },
  ],
};

// ---- Part 3, the foot of the rise: the ring at dusk ------------------------------------------------------------------
const RING = 'm64-overlook-ring';
const R_LULU = markOf(RING, 'lulu');
const R_YOU = markOf(RING, 'player');
const R_FENN = markOf(RING, 'fennimore');
const R_BERTHA = markOf(RING, 'bertha');
const R_DUNSTAN = markOf(RING, 'dunstan');
const R_BIKE_IN = pathOf(RING, 'bike-close');
const R_CAR_L = carMark(RING, 'm64-ring-lulu');
const R_CAR_B = carMark(RING, 'm64-ring-bertha');
const R_CAR_D = carMark(RING, 'm64-ring-dunstan');
/** Fennimore's inspection lap: along the orange lowrider's flank and back. */
const R_FENN_LAP: Vec2[] = [[285.4, 66.9], [288.6, 66.6]];
/** The camp on the rise, as a fire and a half-built table seen from below (the final builds it; W16 keeps it). */
const CAMP_MID: Vec2 = [246, 82];
const CAMP_FIRE: Vec2 = [240.6, 77.9];
const LR = coverage('lulu', 'player', -1);

export const P3_OUTRO: SceneScript = {
  id: 'all-hats-p3-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'wind',
  radio: 0,
  direction: { notes: `${NOTES}all-hats-p3-outro.md`, kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: R_YOU.at, yaw: R_YOU.yaw },
    { id: 'lulu', preset: 'lugnut lulu', held: null, at: R_BIKE_IN[0], seatedIn: 'bike' },
    { id: 'fennimore', name: 'Fanbelt Fennimore', look: FENNIMORE_LOOK, at: R_FENN.at, yaw: towards(R_FENN.at, R_CAR_L.at) },
    { id: 'bertha', name: 'Big-End Bertha', look: BERTHA_LOOK, at: R_BERTHA.at, yaw: R_BERTHA.yaw },
    { id: 'dunstan', name: 'Dipstick Dunstan', look: DUNSTAN_LOOK, at: R_DUNSTAN.at, yaw: towards(R_DUNSTAN.at, R_CAR_D.at), held: 'speedway-tea-towel' },
  ],
  vehicles: [
    { id: 'bike', kind: 'dirt-bike', at: R_BIKE_IN[0], yaw: towards(R_BIKE_IN[0], R_BIKE_IN[1]), tint: KNOBBLY_TINT, headlights: true },
    { id: 'l-car', kind: R_CAR_L.kind, at: R_CAR_L.at, yaw: R_CAR_L.yaw, tint: LULU_TINT, headlights: true },
    { id: 'b-car', kind: R_CAR_B.kind, at: R_CAR_B.at, yaw: R_CAR_B.yaw, tint: BERTHA_TINT, headlights: true },
    { id: 'd-car', kind: R_CAR_D.kind, at: R_CAR_D.at, yaw: R_CAR_D.yaw, tint: DUNSTAN_TINT, headlights: true },
  ],
  props: [
    // L95: up the rise, the camp before it is a camp: one fire and the first crates of a long table.
    { id: 'fire', prefab: 'campfire', at: CAMP_FIRE, yaw: 0 },
    { id: 'table', prefab: 'crate-table', at: CAMP_MID, yaw: 0 },
  ],
  steps: [
    // 1. Hook: ground level in the middle of the ring; the bike's lamp swings in and closes the last gap.
    cut(spot(RING, 'ring-low')),
    { do: 'sfx', id: 'engine-rev', at: 'bike', gain: 0.5, async: true },
    { do: 'drive', vehicle: 'bike', path: R_BIKE_IN.slice(1), speed: 3.2 },
    { do: 'sfx', id: 'tap', at: 'l-car', gain: 0.5, async: true },
    { do: 'exit', who: 'lulu', async: true },
    // 2. Fennimore checks the captain's paint, panel by panel; Bertha cannot resist.
    cut(shot('fennimore', 'ms', { toward: 'bertha', side: 35 })),
    { do: 'walk', who: 'fennimore', path: R_FENN_LAP, speed: 0.9, async: true },
    { do: 'wait', s: 1.4 },
    { do: 'face', who: 'bertha', at: 'fennimore', s: 0.3, async: true },
    cut(shot('bertha', 'mcu', { toward: 'fennimore', side: 25 })),
    { do: 'say', who: 'bertha', text: 'Scratch on the wing.' },
    { do: 'face', who: 'fennimore', at: 'bertha', s: 0.2, async: true },
    cut(shot('fennimore', 'ms', { toward: 'bertha', side: -30 })),
    { do: 'gesture', who: 'fennimore', name: 'flinch', s: 1.0 },
    cut(shot('bertha', 'mcu', { toward: 'fennimore', side: -25 })),
    { do: 'say', who: 'bertha', text: 'Joking.' },
    ...reaction('fennimore', { toward: 'bertha', gesture: 'slump', size: 'ms', side: -30, hold: 'beat' }),
    // 3. Lulu, off the bike, thumbs in her belt; the ring is a rule, and the rule is her mother's.
    { do: 'walk', who: 'lulu', path: [R_LULU.at], speed: 1.3 },
    { do: 'face', who: 'lulu', at: 'player', s: 0.3, async: true },
    { do: 'face', who: 'player', at: 'lulu', s: 0.3 },
    cut(LR.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Why a ring?' },
    cut(LR.single('lulu', 'mcu')),
    { do: 'gesture', who: 'lulu', name: 'hands-on-hips', s: 2.0, async: true },
    { do: 'say', who: 'lulu', text: 'Nobody gets boxed in. Nobody leaves first.' },
    cut(LR.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Carburettor rule?' },
    cut(LR.single('lulu', 'cu')),
    beat('beat'),
    { do: 'say', who: 'lulu', text: "My mother's." },
    beat('tiny'),
    // 4. The turn: she looks up the rise. One fire, and a table nobody is sitting at yet.
    { do: 'face', who: 'lulu', at: CAMP_MID, s: 0.6, async: true },
    { do: 'face', who: 'player', at: CAMP_MID, s: 0.6, async: true },
    { do: 'sfx', id: 'creak', at: up(CAMP_FIRE[0], CAMP_FIRE[1], 0.4), gain: 0.3, async: true },
    cut(spot(RING, 'to-the-rise')),
    { do: 'wait', s: 2.2 },
    { do: 'face', who: 'lulu', at: 'player', s: 0.3 },
    cut(LR.single('lulu', 'mcu')),
    { do: 'say', who: 'lulu', text: 'That your lot up there?' },
    cut(LR.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Some. The rest come tonight.' },
    cut(LR.single('lulu', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'lulu', name: 'laugh', s: 1.2, async: true },
    { do: 'say', who: 'lulu', text: "Then we're early. Carburettors are never early." },
    // 5. Button: the headlights go out round the ring, one by one, until the only light left is the fire on the rise.
    cut(spot(RING, 'ring-wide')),
    { do: 'wait', s: 0.6 },
    { do: 'lights', vehicle: 'd-car', on: false },
    { do: 'sfx', id: 'latch', at: 'd-car', gain: 0.4, async: true },
    { do: 'wait', s: 0.5 },
    { do: 'lights', vehicle: 'b-car', on: false },
    { do: 'wait', s: 0.5 },
    { do: 'lights', vehicle: 'l-car', on: false },
    { do: 'wait', s: 0.5 },
    { do: 'lights', vehicle: 'bike', on: false },
    { do: 'wait', s: 1.8 },
  ],
};

// ---- The final: the overlook camp at night ---------------------------------------------------------------------------
const CAMP = 'm64-camp-night';
const MID: Vec2 = [246, 82];
const FIRE: Vec2 = [240.6, 77.9];
/** The hat rail (W16: 1 m west and 5.6 m south of the table, turned to face it), 3 m wide. */
const RAIL: Vec2 = [245, 87.6];
const RAIL_YAW = towards(RAIL, MID);
/** The heist board, carried down from the safehouse to the camp's east edge, facing the table. */
const BOARD: Vec2 = [254.6, 82.6];
/** The table top (crate-table at its natural size: 0.53 m), where the pie goes. */
const TABLE_TOP = 0.545;

/** The camp as the scenes build it: the table, the fire and its logs, crates for seats, lantern posts, the board. */
function campProps(): ScriptProp[] {
  return [
    { id: 'table', prefab: 'crate-table', at: MID, yaw: 0 },
    { id: 'fire', prefab: 'campfire', at: FIRE, yaw: 0 },
    { id: 'log-a', prefab: 'timber-log', at: [FIRE[0] - 2.0, FIRE[1] + 1.4], yaw: 0.3 },
    { id: 'board', prefab: 'heist-board', at: BOARD, yaw: towards(BOARD, MID) },
    { id: 'lamp-w', prefab: 'camp-lantern-post', at: [243.2, 80.4], yaw: 0 },
    { id: 'lamp-e', prefab: 'camp-lantern-post', at: [249.4, 83.8], yaw: 0 },
    { id: 'seat-a', prefab: 'crate', at: [244.4, 79.9], yaw: 0.2, size: 0.7 },
    { id: 'seat-b', prefab: 'crate', at: [247.9, 79.8], yaw: -0.3, size: 0.7 },
  ];
}

const C_PIP = markOf(CAMP, 'pip');
const C_TANSY = markOf(CAMP, 'tansy');
const C_YOU = markOf(CAMP, 'player');
const C_SAX = markOf(CAMP, 'saxifrage');
const C_FLOCK_A = markOf(CAMP, 'flock', 0);
const C_FLOCK_B = markOf(CAMP, 'flock', 1);
/** The board, seen from Pip's side, when he points at the card pinned on its own. */
const C_PIP_BOARD: Vec2 = [252.6, 81.0];
/** The first of the Unmowed, far out in the dark scrub to the west, lanterns up. */
const FAR_LANTERNS: Vec2[] = [[219.0, 90.4], [216.8, 88.6], [217.6, 92.2]];
const FAR_WALK: Vec2[] = [[222.6, 89.4], [220.4, 87.8], [221.2, 91.2]];
/** Tansy and Pip at the board: one side of their line. */
const TP = coverage('tansy', 'pip', 1);
/** Saxifrage and Pip across the firelight: one side of their line. */
const SP = coverage('saxifrage', 'pip', 1);

export const P4_INTRO: SceneScript = {
  id: 'all-hats-p4-intro',
  stage: { kind: 'world' },
  title: 'All Hats: By Root',
  sky: 'night',
  music: 'warm',
  ambience: 'night',
  radio: 0,
  direction: { notes: `${NOTES}all-hats-p4-intro.md`, kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: C_YOU.at, yaw: C_YOU.yaw },
    { id: 'pip', preset: 'pip', held: 'garden-mallet', at: C_PIP.at, yaw: C_PIP.yaw },
    { id: 'tansy', preset: 'tansy', held: null, at: C_TANSY.at, yaw: C_TANSY.yaw },
    // The Flock have been here all along, on one leg, just past the light. Sharp eyes will see them in the first shot.
    { id: 'saxifrage', preset: 'saxifrage', at: C_SAX.at, yaw: C_SAX.yaw },
    { id: 'flock-a', name: 'The Flock', look: FLOCK_LOOK, at: C_FLOCK_A.at, yaw: C_FLOCK_A.yaw },
    { id: 'flock-b', name: 'The Flock', look: FLOCK_LOOK, at: C_FLOCK_B.at, yaw: C_FLOCK_B.yaw },
    ...FAR_LANTERNS.map((at, i): ScriptActor => ({ id: `far-${i}`, name: 'The Unmowed', look: UNMOWED_LOOK, at, yaw: towards(at, MID), held: 'night-shift-lantern', hidden: true })),
  ],
  props: campProps(),
  steps: [
    // 1. Hook: low past the fire, a mallet on a crate nail; Pip building a table out of fruit.
    { do: 'gesture', who: 'saxifrage', name: 'one-leg', s: 40, async: true },
    { do: 'gesture', who: 'flock-a', name: 'one-leg', s: 40, async: true },
    { do: 'gesture', who: 'flock-b', name: 'one-leg', s: 40, async: true },
    cut(spot(CAMP, 'fire-low')),
    { do: 'sfx', id: 'knock', at: 'pip', gain: 0.6, async: true },
    { do: 'gesture', who: 'pip', name: 'wrench-fix', s: 1.6 },
    { do: 'sfx', id: 'knock', at: 'pip', gain: 0.6, async: true },
    { do: 'face', who: 'pip', at: 'player', s: 0.3, async: true },
    cut(shot('pip', 'mcu', { toward: 'player', side: 25 })),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.0, async: true },
    { do: 'say', who: 'pip', text: 'One table! Fruit crates. Seats everybody, if everybody breathes in.' },
    // 2. Setup: Tansy at the board, pinning cards; where the story is, in one breath.
    { do: 'sfx', id: 'paper', at: 'tansy', gain: 0.5, async: true },
    cut(shot('tansy', 'ms', { toward: 'player', side: -35 })),
    { do: 'wait', s: 0.9 },
    { do: 'face', who: 'tansy', at: 'player', s: 0.4, async: true },
    cut(shot('tansy', 'mcu', { toward: 'player', side: -25 })),
    { do: 'say', who: 'tansy', text: "The Don's crews. The Queen. The planes. Lulu's engines." },
    cut(shot('player', 'mcu', { toward: 'tansy', side: 25 })),
    { do: 'say', who: 'player', text: 'And the rest?' },
    cut(shot('tansy', 'mcu', { toward: 'player', side: -25 })),
    { do: 'say', who: 'tansy', text: 'Tonight. By root.' },
    { do: 'face', who: 'tansy', at: BOARD, s: 0.4, async: true },
    // 3. The first gag: who is first? The Flock, who have been standing there since Tuesday.
    { do: 'face', who: 'pip', at: 'tansy', s: 0.3 },
    cut(TP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'So who gets here first?' },
    { do: 'face', who: 'saxifrage', at: 'pip', s: 0.4, async: true },
    cut(spot(CAMP, 'flock-wide')),
    { do: 'wait', s: 1.4 },
    cut(SP.single('saxifrage', 'mcu')),
    { do: 'say', who: 'saxifrage', text: 'We did.' },
    { do: 'face', who: 'pip', at: 'saxifrage', s: 0.2, async: true },
    cut(SP.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'jump-back', s: 1.0, async: true },
    beat('tiny'),
    { do: 'say', who: 'pip', text: 'How long have you been there?' },
    cut(SP.single('saxifrage', 'mcu', { height: 'low' })),
    { do: 'say', who: 'saxifrage', text: 'Since Tuesday. So it is stood.' },
    { do: 'face', who: 'pip', at: 'tansy', s: 0.3, async: true },
    { do: 'face', who: 'tansy', at: 'pip', s: 0.3 },
    cut(TP.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'They helped with the crates.' },
    beat('beat'),
    // 4. The Countess's card, pinned on its own with a purple tack.
    { do: 'walk', who: 'pip', path: [C_PIP_BOARD], speed: 1.8 },
    { do: 'face', who: 'pip', at: 'tansy', s: 0.3, async: true },
    { do: 'face', who: 'tansy', at: 'pip', s: 0.3 },
    cut(TP.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'That card on its own. Purple tack.' },
    cut(insert('tansy', { side: 35 })),
    { do: 'sfx', id: 'tap', at: 'board', gain: 0.4, async: true },
    { do: 'wait', s: 1.2 },
    cut(TP.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'The Countess. Not tonight.' },
    // 5. The turn: Pip's fear, and the first time Tansy turns round to answer it.
    { do: 'music', track: null, fade: 0.8 },
    cut(TP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'What if the rest do not come? Bracken hates engines. Diggs hates everything.' },
    cut(TP.single('tansy', 'mcu')),
    { do: 'sfx', id: 'paper', at: 'tansy', gain: 0.4, async: true },
    { do: 'say', who: 'tansy', text: "They'll come." },
    cut(TP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: "You don't know that." },
    { do: 'face', who: 'tansy', at: 'pip', s: 0.6 },
    cut(pushIn('tansy', 'mcu', 3.6, { toward: 'pip', side: 20 })),
    beat('beat'),
    { do: 'say', who: 'tansy', text: 'I asked them. Myself. Every one.' },
    ...reaction('pip', { toward: 'tansy', size: 'mcu', side: 20, hold: 'pause' }),
    // 6. Button: out in the dark to the west, lanterns, coming. The answer, before anyone can say it.
    ...FAR_LANTERNS.map((_, i): Step => ({ do: 'spawn', id: `far-${i}` })),
    ...FAR_WALK.map((to, i): Step => ({ do: 'walk', who: `far-${i}`, path: [to], speed: 1.0, async: true })),
    { do: 'sfx', id: 'rustle', at: up(220, 89, 0.8), gain: 0.4, async: true },
    cut(spot(CAMP, 'scrub-west')),
    { do: 'music', track: 'fescue', fade: 1.5 },
    { do: 'stinger', id: 'reveal' },
    { do: 'wait', s: 3.0 },
  ],
};

// ---- Arrival: by root (the west edge) ---------------------------------------------------------------------------------
const W_BRACKEN = markOf(CAMP, 'bracken');
const W_UNMOWED_A = markOf(CAMP, 'unmowed', 0);
const W_UNMOWED_B = markOf(CAMP, 'unmowed', 1);
const W_YOU = markOf(CAMP, 'player', 1);
const W_PIP = markOf(CAMP, 'pip', 1);
const W_TUMBLE = markOf(CAMP, 'tumblesoil');
const W_NUBBIN = markOf(CAMP, 'nubbin');
/** The molehill the Burrowfolk come up through, just west of the Burrowfolk's pitch. */
const HILL: Vec2 = [237.3, 82.0];
/** Where the three walk in from, out of the scrub. */
const W_FROM: Vec2[] = [[231.8, 86.6], [229.8, 88.4], [230.0, 84.6]];
const BRACKEN_PLAYER = coverage('bracken', 'player', 1);
const MOLE_ELDER = coverage('tumblesoil', 'bracken', 1);

export const P4_ROOTS: SceneScript = {
  id: 'all-hats-p4-roots',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'fescue',
  ambience: 'night',
  radio: 0,
  direction: { notes: `${NOTES}all-hats-p4-roots.md`, kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: W_YOU.at, yaw: W_YOU.yaw },
    { id: 'pip', preset: 'pip', held: null, at: W_PIP.at, yaw: W_PIP.yaw },
    { id: 'bracken', preset: 'bracken', held: null, at: W_FROM[0], yaw: towards(W_FROM[0], W_BRACKEN.at) },
    { id: 'unmowed-a', name: 'The Unmowed', look: UNMOWED_LOOK, at: W_FROM[1], yaw: towards(W_FROM[1], W_UNMOWED_A.at), held: 'night-shift-lantern' },
    { id: 'unmowed-b', name: 'The Unmowed', look: UNMOWED_LOOK, at: W_FROM[2], yaw: towards(W_FROM[2], W_UNMOWED_B.at), held: 'night-shift-lantern' },
    { id: 'tumblesoil', preset: 'tumblesoil', held: null, at: HILL, yaw: towards(HILL, W_YOU.at), hidden: true },
    { id: 'nubbin', preset: 'nubbin', at: HILL, yaw: towards(HILL, W_YOU.at), hidden: true },
  ],
  props: [
    ...campProps(),
    { id: 'hill', prefab: 'mole-hill', at: HILL, yaw: 0.6, hidden: true },
  ],
  steps: [
    // 1. Hook: out of the dark scrub, two lanterns and a tall green hat, walking straight at the camp.
    { do: 'walk', who: 'bracken', path: [W_BRACKEN.at], speed: 1.1, async: true },
    { do: 'walk', who: 'unmowed-a', path: [W_UNMOWED_A.at], speed: 1.1, async: true },
    { do: 'walk', who: 'unmowed-b', path: [W_UNMOWED_B.at], speed: 1.1, async: true },
    { do: 'sfx', id: 'rustle', at: 'bracken', gain: 0.5, async: true },
    cut({ kind: 'track', pos: up(240.6, 84.6, 1.0), who: 'bracken', fov: 40 }),
    { do: 'wait', s: 2.2 },
    { do: 'sfx', id: 'crunch', at: 'bracken', gain: 0.4, async: true },
    { do: 'wait', s: 1.8 },
    // 2. Bracken at the edge of the light, low, still. He has seen the ring of engines at the foot of the hill.
    { do: 'face', who: 'bracken', at: [288, 70], s: 0.6 },
    cut(shot('bracken', 'mcu', { toward: 'player', side: 30 })),
    { do: 'say', who: 'bracken', text: 'Engines. At the foot of your hill.' },
    { do: 'face', who: 'bracken', at: 'pip', s: 0.5, async: true },
    cut(shot('pip', 'mcu', { toward: 'bracken', side: -25 })),
    { do: 'gesture', who: 'pip', name: 'gasp', s: 0.8, async: true },
    { do: 'sfx', id: 'gulp', at: 'pip', gain: 0.5, async: true },
    { do: 'say', who: 'pip', text: 'Friendly engines! Loud. But friendly.' },
    cut(shot('bracken', 'mcu', { toward: 'pip', side: 25 })),
    { do: 'say', who: 'bracken', text: 'Potsworth.' },
    cut(shot('pip', 'mcu', { toward: 'bracken', side: -25 })),
    { do: 'say', who: 'pip', text: 'Elder.' },
    // 3. To the player: the Stone was lent, not given (R-233), and he has come to see it used.
    { do: 'face', who: 'bracken', at: 'player', s: 0.4 },
    cut(pushIn('bracken', 'mcu', 3.2, { toward: 'player', side: 25 })),
    { do: 'say', who: 'bracken', text: 'I lent you a stone. I have come to see it used.' },
    cut(BRACKEN_PLAYER.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'You will.' },
    // 4. The turn: the ground between them heaves, and the Burrowfolk arrive the short way. Mole's eye level.
    { do: 'shake', amp: 0.05, s: 0.8 },
    { do: 'sfx', id: 'shovel', at: up(HILL[0], HILL[1], 0.2), gain: 0.7 },
    { do: 'spawn', id: 'hill' },
    { do: 'spawn', id: 'tumblesoil' },
    { do: 'sfx', id: 'crunch', at: up(HILL[0], HILL[1], 0.2), gain: 0.5, async: true },
    cut({ kind: 'cut', pos: up(239.6, 81.0, 0.5), look: up(HILL[0] + 0.3, HILL[1] + 0.2, 0.55), fov: 40 }),
    { do: 'walk', who: 'tumblesoil', path: [W_TUMBLE.at], speed: 0.5 },
    { do: 'gesture', who: 'tumblesoil', name: 'dust-off', s: 1.2 },
    { do: 'spawn', id: 'nubbin' },
    { do: 'walk', who: 'nubbin', path: [W_NUBBIN.at], speed: 1.6, async: true },
    { do: 'face', who: 'tumblesoil', at: 'player', s: 0.3 },
    cut(shot('tumblesoil', 'mcu', { toward: 'player', side: 25 })),
    { do: 'say', who: 'tumblesoil', text: 'Good evening, dear ones. We came the short way.' },
    // Bracken looks down at her; the camera stays at her height, so he is looked at from below.
    { do: 'face', who: 'bracken', at: 'tumblesoil', s: 0.5, async: true },
    { do: 'face', who: 'tumblesoil', at: 'bracken', s: 0.5 },
    cut(MOLE_ELDER.single('bracken', 'mcu')),
    { do: 'say', who: 'bracken', text: 'The Unmowed walk upon the roots of the wood.' },
    cut(MOLE_ELDER.single('tumblesoil', 'mcu')),
    beat('tiny'),
    { do: 'say', who: 'tumblesoil', text: 'And we walk under them, Elder. Mind your boots.' },
    // The gag, held wide enough for the Elder to look down at his own feet.
    cut(MOLE_ELDER.two('fs')),
    { do: 'gesture', who: 'bracken', name: 'think', s: 1.4 },
    beat('beat'),
    // 5. To the player, gently: somebody asked. The ladder from "nobody has ever asked" (#24, #49).
    { do: 'face', who: 'tumblesoil', at: 'player', s: 0.4 },
    cut(shot('tumblesoil', 'mcu', { toward: 'player', side: 30 })),
    { do: 'say', who: 'tumblesoil', text: 'Somebody asked us, dear one. So we came.' },
    // 6. Button: the Elder, who always stands higher, steps down to a mole's height and bows. Held at her eye level.
    { do: 'face', who: 'bracken', at: 'tumblesoil', s: 0.3 },
    cut({ kind: 'cut', pos: up(238.6, 83.6, 0.55), look: up(W_BRACKEN.at[0], W_BRACKEN.at[1], 1.0), fov: 42 }),
    { do: 'gesture', who: 'bracken', name: 'bow', s: 1.6 },
    beat('pause'),
  ],
};

// ---- Arrival: up the track (the east edge) ----------------------------------------------------------------------------
const E_DIGGS = markOf(CAMP, 'diggs');
const E_GUARD_A = markOf(CAMP, 'spade-guard', 0);
const E_GUARD_B = markOf(CAMP, 'spade-guard', 1);
const E_YOU = markOf(CAMP, 'player', 2);
const E_NUBBIN = markOf(CAMP, 'nubbin', 1);
const E_GRANNY = markOf(CAMP, 'granny');
const E_RIDE = carMark(CAMP, 'm64-granny-ride');
const E_RIDE_IN = pathOf(CAMP, 'granny-in');
/** The column marches the last stretch of the track: Diggs in front, two Guard behind him. */
const MARCH = 6.0;
const back = (at: Vec2): Vec2 => [at[0] + MARCH, at[1] - 0.8];
/** Where Granny walks past him with the tin, on to the camp. */
const E_GRANNY_ON: Vec2 = [253.4, 80.8];
const DIGGS_YOU = coverage('diggs', 'player', -1);
const DIGGS_GRANNY = coverage('diggs', 'granny', -1);

export const P4_GUARD: SceneScript = {
  id: 'all-hats-p4-guard',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'sandpit',
  ambience: 'night',
  radio: 0,
  direction: { notes: `${NOTES}all-hats-p4-guard.md`, kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: E_YOU.at, yaw: E_YOU.yaw },
    { id: 'nubbin', preset: 'nubbin', at: E_NUBBIN.at, yaw: E_NUBBIN.yaw },
    { id: 'diggs', preset: 'diggs', held: null, at: back(E_DIGGS.at), yaw: towards(back(E_DIGGS.at), E_DIGGS.at) },
    { id: 'guard-a', name: 'Spade Guard', look: SPADE_LOOK, held: 'gta-rifle', at: back(E_GUARD_A.at), yaw: towards(back(E_GUARD_A.at), E_GUARD_A.at) },
    { id: 'guard-b', name: 'Spade Guard', look: SPADE_LOOK, held: 'gta-rifle', at: back(E_GUARD_B.at), yaw: towards(back(E_GUARD_B.at), E_GUARD_B.at) },
    { id: 'granny', preset: 'granny', held: 'pie-tin', at: E_RIDE_IN[0], seatedIn: 'ride' },
  ],
  vehicles: [
    { id: 'ride', ...rideOf('granny'), at: E_RIDE_IN[0], yaw: towards(E_RIDE_IN[0], E_RIDE_IN[1]), headlights: true },
  ],
  props: campProps(),
  steps: [
    // 1. Hook: boots in step up the track from the highway, and behind them a pair of headlamps at marching pace.
    { do: 'walk', who: 'diggs', path: [E_DIGGS.at], speed: 1.15, async: true },
    { do: 'walk', who: 'guard-a', path: [E_GUARD_A.at], speed: 1.15, async: true },
    { do: 'walk', who: 'guard-b', path: [E_GUARD_B.at], speed: 1.15, async: true },
    { do: 'drive', vehicle: 'ride', path: E_RIDE_IN.slice(1), speed: 1.4, async: true },
    { do: 'sfx', id: 'footsteps', at: 'diggs', gain: 0.6, async: true },
    cut(spot(CAMP, 'track-east')),
    { do: 'wait', s: 2.6 },
    { do: 'sfx', id: 'footsteps', at: 'guard-a', gain: 0.5, async: true },
    { do: 'wait', s: 2.8 },
    // 2. "Halt." The column halts. The Ride-On halts a moment later, and says so.
    cut(shot('diggs', 'ms', { toward: 'player', side: 25, height: 'low' })),
    { do: 'say', who: 'diggs', text: 'Spade Guard. Halt.' },
    { do: 'sfx', id: 'crunch', at: 'diggs', gain: 0.5, async: true },
    cut({ kind: 'cut', pos: up(257.2, 80.8, 1.2), look: up(E_RIDE.at[0], E_RIDE.at[1], 0.9), fov: 40 }),
    { do: 'wait', s: 0.8 },
    { do: 'horn', vehicle: 'ride' },
    { do: 'wait', s: 1.4 },
    // 3. Diggs reports to the player, at attention. No adjectives.
    { do: 'face', who: 'diggs', at: 'player', s: 0.3 },
    cut(DIGGS_YOU.single('diggs', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'diggs', name: 'salute', s: 1.2, async: true },
    { do: 'say', who: 'diggs', text: 'Spade Guard, reporting. At your table, effective immediately.' },
    // 4. The mole ladder's next rung: the Corporal salutes first, and correctly. Camera at the mole's eye line.
    { do: 'face', who: 'nubbin', at: 'diggs', s: 0.3 },
    cut({ kind: 'cut', pos: up(250.4, 79.2, 0.6), look: up(E_NUBBIN.at[0], E_NUBBIN.at[1], 0.75), fov: 38 }),
    { do: 'gesture', who: 'nubbin', name: 'salute', s: 1.6 },
    { do: 'face', who: 'diggs', at: 'nubbin', s: 0.3 },
    cut({ kind: 'cut', pos: up(E_NUBBIN.at[0] + 0.9, E_NUBBIN.at[1] + 0.4, 0.6), look: up(E_DIGGS.at[0], E_DIGGS.at[1], 1.2), fov: 40 }),
    { do: 'gesture', who: 'diggs', name: 'salute', s: 1.8, async: true },
    { do: 'say', who: 'diggs', text: 'Corporal.' },
    cut(shot('nubbin', 'mcu', { toward: 'diggs', side: -25 })),
    { do: 'say', who: 'nubbin', text: 'Commander. I practised, if you please.' },
    // 5. Granny, off the Ride-On with a covered tin, past the column to the camp. The pie, rung three: withheld.
    cut({ kind: 'track', pos: up(258.4, 81.6, 1.2), who: 'granny', fov: 44 }),
    { do: 'exit', who: 'granny' },
    { do: 'walk', who: 'granny', path: [E_GRANNY.at], speed: 1.0 },
    { do: 'face', who: 'diggs', at: 'granny', s: 0.4, async: true },
    { do: 'face', who: 'granny', at: 'diggs', s: 0.4 },
    cut(DIGGS_GRANNY.single('diggs', 'mcu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'Ma\'am. State the contents.' },
    cut(DIGGS_GRANNY.single('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'Later, sugar. Mind the crust.' },
    // 6. Button: she walks on to the camp; the Commander stays at attention, and his eyes go with the tin.
    { do: 'walk', who: 'granny', path: [E_GRANNY_ON], speed: 1.0, async: true },
    cut(shot('diggs', 'ms', { toward: 'granny', side: -35 })),
    { do: 'face', who: 'diggs', at: E_GRANNY_ON, s: 2.2 },
    { do: 'sfx', id: 'gulp', at: 'diggs', gain: 0.5, async: true },
    beat('pause'),
  ],
};

// ---- The outro: every hat on one rail --------------------------------------------------------------------------------
const T_TANSY = markOf(CAMP, 'tansy', 1);
const T_RAIL_TANSY = markOf(CAMP, 'tansy', 2);
const T_YOU = markOf(CAMP, 'player', 3);
const T_PIP = markOf(CAMP, 'pip', 2);
const T_LULU = markOf(CAMP, 'lulu');
const T_BRACKEN = markOf(CAMP, 'bracken', 1);
const T_TUMBLE = markOf(CAMP, 'tumblesoil', 1);
const T_DIGGS = markOf(CAMP, 'diggs', 1);
const T_HOGWEED = markOf(CAMP, 'hogweed');
const T_SAX = markOf(CAMP, 'saxifrage', 1);
const T_GRANNY = markOf(CAMP, 'granny', 1);
const T_NUBBIN = markOf(CAMP, 'nubbin', 2);
/** Granny comes to the table from her pie table at the east edge. */
const T_GRANNY_FROM: Vec2 = [249.6, 79.4];
/** The rail's two post tops, 1.35 m up (hat-rail at 3 m wide): Hogweed's goggles hang on the west one. */
const RAIL_RIGHT: Vec2 = [Math.cos(RAIL_YAW), -Math.sin(RAIL_YAW)];
const postTop = (side: number): Vec3 => up(RAIL[0] + RAIL_RIGHT[0] * 1.42 * side, RAIL[1] + RAIL_RIGHT[1] * 1.42 * side, 1.36);
/** A point along the rail at its caps' height, from one end (t = -1) to the other (t = 1), `off` m in front of it. */
const along = (t: number, h: number, off: number): Vec3 => {
  const fx = Math.sin(RAIL_YAW);
  const fz = Math.cos(RAIL_YAW);
  return up(RAIL[0] + RAIL_RIGHT[0] * 1.5 * t + fx * off, RAIL[1] + RAIL_RIGHT[1] * 1.5 * t + fz * off, h);
};
const TABLE_IDS = ['lulu', 'bracken', 'tumblesoil', 'diggs', 'hogweed', 'saxifrage', 'granny', 'pip', 'player', 'nubbin'];

export const P4_OUTRO: SceneScript = {
  id: 'all-hats-outro',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'warm',
  ambience: 'night',
  radio: 0,
  direction: {
    notes: `${NOTES}all-hats-outro.md`,
    kind: 'outro',
    waive: [
      { code: 'speaker-unseen', match: 'Four. Five. Six.', why: 'the count heard over the caps it counts: the inventory is the picture' },
      { code: 'speaker-run', match: 'Seven.', why: 'one count, said by one gnome: nobody speaks over the sincere minute' },
    ],
  },
  actors: [
    { id: 'player', player: true, held: null, at: T_YOU.at, yaw: T_YOU.yaw },
    { id: 'tansy', preset: 'tansy', held: null, at: T_TANSY.at, yaw: T_TANSY.yaw },
    { id: 'pip', preset: 'pip', held: null, at: T_PIP.at, yaw: T_PIP.yaw },
    { id: 'lulu', preset: 'lugnut lulu', held: null, at: T_LULU.at, yaw: T_LULU.yaw },
    { id: 'bracken', preset: 'bracken', held: null, at: T_BRACKEN.at, yaw: T_BRACKEN.yaw },
    { id: 'tumblesoil', preset: 'tumblesoil', held: null, at: T_TUMBLE.at, yaw: T_TUMBLE.yaw },
    { id: 'nubbin', preset: 'nubbin', at: T_NUBBIN.at, yaw: T_NUBBIN.yaw },
    { id: 'diggs', preset: 'diggs', held: null, at: T_DIGGS.at, yaw: T_DIGGS.yaw },
    { id: 'hogweed', preset: 'hogweed', held: null, at: T_HOGWEED.at, yaw: T_HOGWEED.yaw },
    { id: 'saxifrage', preset: 'saxifrage', at: T_SAX.at, yaw: T_SAX.yaw },
    { id: 'granny', preset: 'granny', held: 'pie-tin', at: T_GRANNY_FROM, yaw: towards(T_GRANNY_FROM, T_GRANNY.at) },
  ],
  props: [
    ...campProps(),
    // Every faction's cap on one rail (W16's prefab and spot), and Hogweed's goggles on the west post: not a hat.
    { id: 'rail', prefab: 'hat-rail', at: RAIL, yaw: RAIL_YAW, size: 3.0, by: 'w' },
    { id: 'goggles', prefab: 'underspan-goggles', at: postTop(1), yaw: RAIL_YAW },
    { id: 'pie', prefab: 'pie-tin', at: up(MID[0], MID[1], TABLE_TOP), yaw: 0.4, hidden: true },
  ],
  steps: [
    // 1. Hook: Granny crosses the firelight with the covered tin; everybody at the table watches it come.
    { do: 'gesture', who: 'saxifrage', name: 'one-leg', s: 30, async: true },
    ...TABLE_IDS.filter((id) => id !== 'granny').map((id): Step => ({ do: 'face', who: id, at: 'granny', s: 0.6, async: true })),
    { do: 'walk', who: 'granny', path: [T_GRANNY.at], speed: 1.0, async: true },
    cut({ kind: 'track', pos: up(243.4, 78.6, 1.1), who: 'granny', fov: 42 }),
    { do: 'sfx', id: 'creak', at: 'fire', gain: 0.4, async: true },
    { do: 'wait', s: 2.2 },
    { do: 'sfx', id: 'crunch', at: 'granny', gain: 0.3, async: true },
    { do: 'wait', s: 1.8 },
    { do: 'face', who: 'granny', at: MID, s: 0.3 },
    { do: 'hold', who: 'granny', prop: null },
    { do: 'spawn', id: 'pie' },
    { do: 'sfx', id: 'clink', at: 'pie', gain: 0.6, async: true },
    // 2. The one gag: the pie rung, said at last. Locked off, the whole table in it.
    cut(shot('granny', 'mcu', { toward: 'diggs', side: 25 })),
    { do: 'say', who: 'granny', text: 'I brought pie.' },
    cut(spot(CAMP, 'rail-back')),
    { do: 'gesture', who: 'diggs', name: 'nod', s: 1.0, async: true },
    { do: 'wait', s: 2.2 },
    // 3. The turn into the sincere minute: Pip asks for a speech; Tansy does inventory, as she always has.
    ...TABLE_IDS.map((id): Step => ({ do: 'face', who: id, at: 'tansy', s: 0.5, async: true })),
    cut(shot('pip', 'mcu', { toward: 'tansy', side: 30 })),
    { do: 'say', who: 'pip', text: 'Speech!' },
    { do: 'music', track: null, fade: 0.8 },
    cut(shot('tansy', 'mcu', { toward: 'pip', side: -40 })),
    beat('beat'),
    { do: 'say', who: 'tansy', text: 'No speech. Inventory.' },
    // 4. The count: she walks to the rail and counts the caps out loud, three to a breath, like her wrenches.
    cut({ kind: 'track', pos: up(249.6, 84.0, 1.3), who: 'tansy', fov: 46 }),
    { do: 'walk', who: 'tansy', path: [T_RAIL_TANSY.at], speed: 1.1 },
    { do: 'face', who: 'tansy', at: RAIL, s: 0.4 },
    ...TABLE_IDS.map((id): Step => ({ do: 'face', who: id, at: 'tansy', s: 0.4, async: true })),
    cut(shot('tansy', 'mcu', { side: -50 })),
    { do: 'say', who: 'tansy', text: 'One. Two. Three.' },
    // Along the caps from her end of the rail to the goggles on the far post: what she is counting.
    { do: 'cam', shot: { kind: 'dolly', from: along(-0.3, 1.2, 1.3), to: along(0.95, 1.3, 1.1), look: along(0.0, 1.15, 0), lookTo: along(0.95, 1.3, 0), s: 4.6, fov: 38 } },
    { do: 'say', who: 'tansy', text: 'Four. Five. Six.' },
    { do: 'wait', s: 0.6 },
    cut(shot('tansy', 'cu', { side: -40 })),
    { do: 'say', who: 'tansy', text: 'Seven.' },
    // 5. Silence. She turns from the rail to the table, and the table is looking at her.
    { do: 'face', who: 'tansy', at: MID, s: 0.8 },
    cut(spot(CAMP, 'rail-back')),
    beat('silence'),
    cut(pushIn('tansy', 'mcu', 3.4, { toward: 'pip', side: -15 })),
    { do: 'say', who: 'tansy', text: 'All hats.' },
    beat('pause'),
    // 6. Button: the music comes in after the silence, and the camera rises over the camp, one of the five crane wides.
    { do: 'music', track: 'triumph', fade: 0.6 },
    { do: 'sfx', id: 'flutter', at: 'rail', gain: 0.3, async: true },
    { do: 'cam', shot: { kind: 'dolly', from: up(251, 3.0, 95), to: up(262, 16, 104), look: up(MID[0], MID[1], 0.8), s: 5.0, fov: 50 }, wait: true },
    { do: 'wait', s: 1.6 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'all-hats-p3-intro': P3_INTRO,
  'all-hats-p3-outro': P3_OUTRO,
  'all-hats-p4-intro': P4_INTRO,
  'all-hats-p4-roots': P4_ROOTS,
  'all-hats-p4-guard': P4_GUARD,
  'all-hats-outro': P4_OUTRO,
};
