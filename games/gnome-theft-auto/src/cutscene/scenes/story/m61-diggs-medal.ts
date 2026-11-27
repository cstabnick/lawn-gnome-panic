// Story row 61: Diggs's Medal. The sincere beat of act IV's dip. Intro (dusk): Commander Diggs at attention at his bungalow door,
// four minutes after he said to come, with fifteen years of guard rosters pinned beside the door and one empty nail in the middle of
// them; he says what hung on the nail, that the Association logged it as lost property, and that a commander at the lost-property
// hatch is an incident while a stranger is a Tuesday. Mid (dusk): the HOA lost-property shed by the fort gate, wordless: the
// clerks have run, a rail of tagged hats stirs in the wind, and the player lifts a tin star on a faded green ribbon off its hook
// with the beige tag still on it. Outro (dusk): the player holds the medal out; Diggs reads the tag, sits down for the first time
// in fifteen years in the deck chair at the edge of his half-dug hole, says the sandpit was somebody's idea of a garden once and he
// stayed in case they came back, stands, hangs the medal on the nail, and salutes it. No gag on top: the next row is the laugh.
// The roster wall and the hung medal are scene props (the E10 bungalow interior has a map wall, not a roster wall); the yard,
// the hut, the hole, the spade and the deck chair are the real E10 yard.
// Notes: docs/design/gnome-theft-auto/direction/scenes/diggs-medal-{intro,shed,outro}.md
import type { SceneScript, Vec2, Vec3 } from '../../script';
import { beat, coverage, cut, insert, pullOut, pushIn, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const YARD = 'diggs-yard';
const SHED = 'hoa-lost-property';

/** The roster board on the hut's long wall, left of the door (the wall face stands at about z 218.4 under the porch). */
const WALL: Vec2 = [613.1, 218.4];
/** Where the board's one empty nail is: the board centre, 1.2 m up. */
const NAIL = up(WALL[0], WALL[1], 1.2);
/** The deck chair at the edge of the half-dug hole (E10 outerHomes.ts: chair at 611.7, 215.8, hole at 609, 215.8). */
const CHAIR: Vec2 = [611.9, 215.8];
const GATE_IN: Vec2 = [615, 209.8];
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- 1. Intro: the roster wall -----------------------------------------------------------------------------------------------
const I_DIGGS = markOf(YARD, 'diggs');
const I_PLAYER = markOf(YARD, 'player');
const TALK = coverage('diggs', 'player', 1);

/**
 * Dusk at the bungalow. Diggs stands at attention at his door and does not turn his head; the player has been called here and
 * not to the fort. The want: Diggs wants his medal back and cannot go and get it; the obstacle is his own rank. The turn is the
 * roster wall: fifteen years of paper and one empty nail. The objective is in the button: tea first, then the shed.
 */
export const M61_INTRO: SceneScript = {
  id: 'diggs-medal-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'sandpit',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/diggs-medal-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: GATE_IN, yaw: 0 },
    { id: 'diggs', preset: 'diggs', held: null, at: I_DIGGS.at, yaw: I_DIGGS.yaw },
  ],
  props: [{ id: 'rosters', prefab: 'roster-wall', at: up(WALL[0], WALL[1], 0), yaw: Math.PI, size: 1.2, by: 'w' }],
  steps: [
    // Hook: the gate latch, boots on gravel, and a figure at a door who has been standing there since noon.
    cut(spot(YARD, 'gate-wide')),
    { do: 'sfx', id: 'latch', at: up(GATE_IN[0], GATE_IN[1], 1), gain: 0.5, async: true },
    { do: 'walk', who: 'player', path: [I_PLAYER.at], speed: 1.4, async: true },
    { do: 'sfx', id: 'crunch', at: 'player', gain: 0.35, async: true },
    { do: 'wait', s: 2.8 },
    // Setup: the greeting is a count of minutes.
    cut(TALK.single('diggs', 'mcu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'Four minutes late. I will allow it.' },
    cut(TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'You said the bungalow. Not the fort.' },
    cut(TALK.single('diggs', 'mcu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'The fort is a duty. This is a house.' },
    // Turn: he does not point; he lets the eye go to the wall. The roster board, then the one empty nail.
    { do: 'face', who: 'diggs', at: WALL, s: 0.7, async: true },
    cut({ kind: 'dolly', from: up(614.7, 214.2, 1.5), to: up(613.6, 216.7, 1.3), look: NAIL, s: 3.6, fov: 40 }),
    { do: 'sfx', id: 'paper', at: NAIL, gain: 0.35, async: true },
    { do: 'wait', s: 1.2 },
    { do: 'music', track: null, fade: 1.2 },
    { do: 'wait', s: 2.4 },
    // He answers the question nobody has asked yet.
    cut(TALK.single('diggs', 'mcu')),
    { do: 'face', who: 'diggs', at: 'player', s: 0.6, async: true },
    { do: 'say', who: 'diggs', text: 'Fifteen years of rosters. Every sheet signed.' },
    cut(TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'What hung on the nail?' },
    ...reaction('diggs', { toward: 'player', hold: 'pause', side: 25 }),
    cut(TALK.single('diggs', 'mcu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'A medal. The Association logged it as lost property.' },
    { do: 'say', who: 'diggs', text: 'I did not lose it.' },
    // The obstacle: his own rank.
    cut(TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Where did it go?' },
    cut(TALK.single('diggs', 'mcu')),
    { do: 'say', who: 'diggs', text: 'A shed outside the fort gate. A commander at that hatch is an incident.' },
    cut(TALK.two('fs')),
    { do: 'say', who: 'diggs', text: 'You are a Tuesday.' },
    { do: 'gesture', who: 'player', name: 'shrug', s: 1.0, async: true },
    { do: 'sfx', id: 'cloth', at: 'player', gain: 0.3, async: true },
    { do: 'wait', s: 1.0 },
    // Button: the order, said as an order, and the door he has held all day.
    cut(TALK.single('diggs', 'mcu', { height: 'low' })),
    { do: 'music', track: 'turfton-dusk', fade: 2.5 },
    { do: 'say', who: 'diggs', text: 'Tea first. Then the shed. Orders.' },
    { do: 'gesture', who: 'diggs', name: 'point', s: 1.0, async: true },
    { do: 'face', who: 'player', at: 'diggs', s: 0.4, async: true },
    cut({ kind: 'dolly', from: up(615, 204.2, 1.0), to: up(615, 206.4, 1.1), look: up(615, 217.4, 1.1), s: 3.2, fov: 46 }),
    { do: 'wait', s: 3.2 },
  ],
};

// ---- 2. Mid: the lost-property shed -----------------------------------------------------------------------------------------
const S_PLAYER = markOf(SHED, 'player');
/** The hook rail and the medal on it (set dressing at the shed: rail at 399.7, 58.4 facing west). */
const RAIL: Vec2 = [399.7, 58.4];

/**
 * Day turns to dusk at the HOA lost-property shed by the fort gate. The two clerks have run; the hatch stands open on a stamp pad
 * and a half-counted heap of gloves. Wordless: the player walks to the rail of tagged hats, finds the tin star on its faded
 * green ribbon with a beige tag still tied to it, and lifts it off its hook.
 */
export const M61_SHED: SceneScript = {
  id: 'diggs-medal-shed',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/diggs-medal-shed.md', kind: 'arrival' },
  actors: [{ id: 'player', player: true, held: null, at: [S_PLAYER.at[0] - 3.2, S_PLAYER.at[1] + 1.6], yaw: towards(S_PLAYER.at, RAIL) }],
  props: [
    { id: 'medal-rail', prefab: 'diggs-medal', at: up(RAIL[0] - 0.25, RAIL[1] + 0.35, 0.86), yaw: -Math.PI / 2, size: 0.3, by: 'h' },
  ],
  steps: [
    // Hook: a stamp left mid-stroke on its pad, a hatch open on nobody, tags turning in the wind.
    cut(spot(SHED, 'shed-wide')),
    { do: 'sfx', id: 'flutter', at: up(RAIL[0], RAIL[1], 1.2), gain: 0.45, async: true },
    { do: 'sfx', id: 'clatter', at: up(404, 58, 1.4), gain: 0.3, async: true },
    { do: 'walk', who: 'player', path: [S_PLAYER.at], speed: 1.2, async: true },
    { do: 'wait', s: 3.4 },
    // The rail: six hats and a star.
    cut(spot(SHED, 'rail')),
    { do: 'sfx', id: 'keys', at: up(RAIL[0], RAIL[1], 1.0), gain: 0.3, async: true },
    { do: 'wait', s: 1.6 },
    { do: 'sfx', id: 'flutter', at: up(RAIL[0], RAIL[1], 1.0), gain: 0.3, async: true },
    { do: 'wait', s: 1.6 },
    // The lift: a hand, a hook, a thread of beige tag.
    cut(shot('player', 'mcu', { toward: 'medal-rail', side: 30 })),
    { do: 'gesture', who: 'player', name: 'clutch', s: 1.0, async: true },
    { do: 'despawn', id: 'medal-rail' },
    { do: 'hold', who: 'player', prop: 'diggs-medal' },
    { do: 'sfx', id: 'clink', at: 'player', gain: 0.4, async: true },
    { do: 'wait', s: 1.0 },
    // Button: the star in the palm, the tag still on it, and the wind in the rail.
    cut(insert('player', { side: 30 })),
    { do: 'sfx', id: 'paper', at: 'player', gain: 0.3, async: true },
    { do: 'wait', s: 2.8 },
  ],
};

// ---- 3. Outro: the nail ------------------------------------------------------------------------------------------------------
const O_DIGGS = markOf(YARD, 'diggs');
const O_PLAYER_AT: Vec2 = [614.2, 214.6];
const O_YARROW = markOf(YARD, 'yarrow');
/** Where Diggs stands to hang it: a pace from the board, facing the wall. */
const HANG: Vec2 = [613.1, 217.3];
/** The hung medal: star at the nail, ribbon trailing down (the prefab is star over ribbon, so its origin is 0.3 m under the nail). */
const HUNG: Vec3 = [NAIL[0], NAIL[1] - 0.3, WALL[1] - 0.08];
const CONF = coverage('diggs', 'player', 1);

/**
 * Dusk in the yard. The player comes up from the gate with the medal held by its ribbon, and the Reeve, who walked down from the
 * square, stands by the fence with his ledger shut. Diggs takes the medal, reads the HOA tag on it, and sits for the first time
 * in fifteen years: the deck chair has stood at the edge of his hole since the hole was dug. He says why he stayed, stands, tells
 * the player the fort can spare him until morning, hangs the medal on the empty nail and salutes it. Quiet: no gag.
 */
export const M61_OUTRO: SceneScript = {
  id: 'diggs-medal-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/diggs-medal-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: 'diggs-medal', at: GATE_IN, yaw: 0 },
    { id: 'diggs', preset: 'diggs', held: null, at: O_DIGGS.at, yaw: O_DIGGS.yaw },
    { id: 'yarrow', preset: 'yarrow', held: 'ledger-book', at: O_YARROW.at, yaw: towards(O_YARROW.at, [613.5, 215.6]) },
  ],
  props: [
    { id: 'rosters', prefab: 'roster-wall', at: up(WALL[0], WALL[1], 0), yaw: Math.PI, size: 1.2, by: 'w' },
    { id: 'hung-medal', prefab: 'diggs-medal', at: HUNG, yaw: Math.PI, size: 0.3, by: 'h', hidden: true },
  ],
  steps: [
    // Hook: a tin star on a faded ribbon, swinging from a hand, catching the last of the light.
    cut(insert('player', { side: 20 })),
    { do: 'sfx', id: 'clink', at: 'player', gain: 0.35, async: true },
    { do: 'walk', who: 'player', path: [[615, 212.6], O_PLAYER_AT], speed: 1.3, async: true },
    { do: 'wait', s: 1.6 },
    // Setup: the gate wide: a figure at a door, a walker coming up the yard, a reeve by the fence who has taken his hat off.
    cut(spot(YARD, 'gate-wide')),
    { do: 'sfx', id: 'crunch', at: 'player', gain: 0.35, async: true },
    { do: 'wait', s: 2.4 },
    // He takes it. He reads the tag.
    cut(CONF.single('player', 'mcu')),
    { do: 'give', from: 'player', to: 'diggs', prop: 'diggs-medal', s: 1.2 },
    cut(CONF.single('diggs', 'cu', { height: 'high' })),
    { do: 'sfx', id: 'paper', at: 'diggs', gain: 0.3, async: true },
    { do: 'wait', s: 0.8 },
    { do: 'say', who: 'diggs', text: 'Tag four-four-seven-one. Unclaimed.' },
    beat('pause'),
    // The turn: he walks to the chair that has stood at the hole since the hole was dug, and sits.
    cut({ kind: 'track', pos: up(618.2, 213.4, 1.5), who: 'diggs', fov: 46 }),
    { do: 'walk', who: 'diggs', path: [[613.8, 216.6], CHAIR], speed: 1.0 },
    { do: 'face', who: 'diggs', yaw: -Math.PI / 2, s: 0.5 },
    { do: 'sfx', id: 'chair', at: 'diggs', gain: 0.5, async: true },
    { do: 'gesture', who: 'diggs', name: 'sit', s: 1.0 },
    { do: 'stinger', id: 'sad' },
    { do: 'gesture', who: 'yarrow', name: 'bow', s: 1.4, async: true },
    // From across the hole, the spade standing in the foreground: the man who has not sat in fifteen years, sitting.
    cut({ kind: 'cut', pos: up(606.9, 215.7, 1.0), look: 'diggs', fov: 36 }),
    { do: 'wait', s: 1.0 },
    { do: 'say', who: 'diggs', text: 'Fifteen years I have not sat. A guard who sits has left his post.' },
    { do: 'face', who: 'player', at: 'diggs', s: 0.5, async: true },
    cut(shot('player', 'mcu', { toward: 'diggs', side: -25 })),
    { do: 'say', who: 'player', text: 'Why did you stay?' },
    // The confession: music out, one held silence, the long shot across the hole.
    { do: 'music', track: null, fade: 1.4 },
    cut({ kind: 'dolly', from: up(606.9, 215.7, 1.0), to: up(607.7, 215.7, 1.1), look: 'diggs', s: 5.4, fov: 34 }),
    { do: 'wait', s: 0.9 },
    { do: 'say', who: 'diggs', text: "The sandpit was somebody's idea of a garden once." },
    beat('pause'),
    cut({ kind: 'cut', pos: up(608.2, 215.7, 1.1), look: 'diggs', fov: 28 }),
    { do: 'say', who: 'diggs', text: 'I stayed in case they came back.' },
    beat('silence'),
    // Release: he stands, and says where he will be.
    { do: 'gesture', who: 'diggs', name: 'stand', s: 0.8 },
    { do: 'face', who: 'diggs', at: 'player', s: 0.6, async: true },
    cut(CONF.single('diggs', 'mcu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'The fort can spare me until morning.' },
    { do: 'music', track: 'turfton-dusk', fade: 3 },
    // The nail: a walk to the wall, a hand, a star on a brass cap.
    cut({ kind: 'track', pos: up(615.8, 214.4, 1.6), who: 'diggs', fov: 44 }),
    { do: 'walk', who: 'diggs', path: [HANG], speed: 1.1 },
    { do: 'face', who: 'diggs', yaw: Math.PI, s: 0.4 },
    cut({ kind: 'cut', pos: up(614.4, 216.0, 1.45), look: NAIL, fov: 30 }),
    { do: 'sfx', id: 'tap', at: NAIL, gain: 0.5, async: true },
    { do: 'wait', s: 0.5 },
    { do: 'hold', who: 'diggs', prop: null },
    { do: 'spawn', id: 'hung-medal' },
    { do: 'sfx', id: 'clink', at: NAIL, gain: 0.5, async: true },
    { do: 'wait', s: 1.6 },
    // The salute, from behind and above-left: a straight back and a hand to the brim.
    cut(pullOut('diggs', 'ms', 3.0, { toward: 'rosters', side: 120 })),
    { do: 'gesture', who: 'diggs', name: 'salute', s: 1.6 },
    // Button: the medal on its nail in the last light, and the tin ticking as the hut cools.
    cut({ kind: 'cut', pos: up(613.7, 216.4, 1.3), look: NAIL, fov: 28 }),
    { do: 'sfx', id: 'creak', at: up(615, 220, 1.5), gain: 0.35, async: true },
    { do: 'wait', s: 3.0 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'diggs-medal-intro': M61_INTRO,
  'diggs-medal-shed': M61_SHED,
  'diggs-medal-outro': M61_OUTRO,
};
