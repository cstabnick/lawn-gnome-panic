// Story row 60: The Moles Dig. Three scenes at Fort Sandpit, the payoff of the act's mole ladder (moles misread: spades chase Nubbin in
// #24, Basil blames one for his ball in #48, and here Commander Diggs salutes one).
// Intro (dusk, the dune): three moles come over the sand in single file with a tiny pickaxe each, their shadows ten times their size,
// toward a very tall commander with his hands behind his back. Nubbin plants his pickaxe like a flag and says Ma'am sent them, because
// they were asked; Diggs: "These are the diggers." "No rank. No hats." Nubbin bows; Diggs: "A bow is not a salute." "I shall practise,
// sir." A spotter's glass glints on the far hill ("Effective yesterday"); the player is told to escort them; the moles file off and
// Nubbin tries the salute over his shoulder and taps himself on the head with the pickaxe. "Practise."
// Mid (night, the armory yard; played as the armory step starts): Diggs at the sealed steel door, one hand flat on it. "Locked out.
// Of my own armory." A tap from below, then another; the floor heaves; a tiny pickaxe comes up out of the sand with a white scrap on it,
// waving. "Nobody fires on a flag." (the echo of "Nobody fires the Guard").
// Outro (night, the same yard, played when the player reaches the armory): the first mole out of the floor, Nubbin, stands and salutes
// perfectly. The two Spade Guard salute late and wrong; Diggs: "Spade Guard. Observe. That is a salute." He returns it, held, the
// camera at the mole's eye line and the salute coming from above. Nubbin is made Corporal; the diggers file up behind him; the bolts
// slide from inside and the tool wall lights. The mole is the only one in the fort who salutes correctly.
// The armory is not a building in the world, so its set is scene props (a sealed container, the pegboard tool wall, an HOA notice,
// lanterns, sandbags), built beside the real fort yard. Moles are shot at their own eye line (batch-3 notes 6.5).
// Notes: docs/design/gnome-theft-auto/direction/scenes/m60-the-moles-dig-{intro,mid,outro}.md
import type { ScriptActor, ScriptProp, SceneScript, Vec2, Vec3 } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

const DUNE = 'm60-dune-dusk';
const D_NUBBIN = markOf(DUNE, 'nubbin');
const D_DIGGER_A = markOf(DUNE, 'digger', 0);
const D_DIGGER_B = markOf(DUNE, 'digger', 1);
const D_DIGGS = markOf(DUNE, 'diggs');
const D_PLAYER = markOf(DUNE, 'player');
const D_SPOTTER = markOf(DUNE, 'hoa-spotter');

const ARM = 'm60-armory-night';
const A_DIGGS_MID = markOf(ARM, 'diggs', 0);
const A_DIGGS = markOf(ARM, 'diggs', 1);
const A_NUBBIN = markOf(ARM, 'nubbin');
const A_GUARD_L = markOf(ARM, 'spade-guard', 0);
const A_GUARD_R = markOf(ARM, 'spade-guard', 1);
const A_DIGGER_A = markOf(ARM, 'digger', 0);
const A_DIGGER_B = markOf(ARM, 'digger', 1);
const A_PLAYER = markOf(ARM, 'player');

/** Where the floor breaks (the mound heaves up here) and the two moles' looks (no hats: the "hat" is the fur). */
const HOLE: Vec2 = [375.0, 9.0];
const DIGGER_A_LOOK: Look = { hat: 0x626672, shirt: 0x626672, pants: 0x50545e, skin: 0x666a74 };
const DIGGER_B_LOOK: Look = { hat: 0x7a7e88, shirt: 0x7a7e88, pants: 0x62666f, skin: 0x80848e };
/** The Spade Guard's olive (the same as ch4.ts). */
const SPADE: Look = { hat: 0x4b6329, shirt: 0x556b2f, beard: 0x5c3e24 };
/** A Hat Watch spotter: the black hat and the tan shirt. */
const SPOTTER: Look = { hat: 0x18181e, shirt: 0xc9b99b };

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);
const pt = (p: Vec2, h: number): Vec3 => up(p[0], p[1], h);

// ---- 1. Intro: the dune ----------------------------------------------------------------------------------------------------

const DIGGS_TALK = coverage('diggs', 'nubbin', 1);
const NUB_YOU = coverage('nubbin', 'player', 1);

/** Where the file of moles starts: over the dune's far side, a few paces behind their marks. */
const FILE_A: Vec2 = [412.0, 116.2];
const FILE_B: Vec2 = [414.6, 118.6];
const FILE_C: Vec2 = [417.2, 121.0];

/**
 * Dusk on the dune south of the fort. The moles walk in over the sand toward the camera, shadows long; Nubbin plants his tiny
 * pickaxe; Diggs, tall, stares. A bow is not a salute. The Hat Watch has a spotter on the far hill. The moles file off and Nubbin
 * practises over his shoulder.
 */
export const M60_INTRO: SceneScript = {
  id: 'm60-the-moles-dig-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'sandpit',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m60-the-moles-dig-intro.md', kind: 'intro' },
  actors: [
    { id: 'nubbin', preset: 'nubbin', held: 'mole-pickaxe', at: FILE_A, yaw: towards(FILE_A, D_NUBBIN.at) },
    { id: 'digger-a', preset: 'nubbin', name: 'Digger', scale: 1.0, look: DIGGER_A_LOOK, held: 'mole-pickaxe', at: FILE_B, yaw: towards(FILE_B, D_DIGGER_A.at) },
    { id: 'digger-b', preset: 'nubbin', name: 'Digger', scale: 0.95, look: DIGGER_B_LOOK, held: 'mole-pickaxe', at: FILE_C, yaw: towards(FILE_C, D_DIGGER_B.at) },
    { id: 'diggs', preset: 'diggs', held: 'gta-rifle', at: D_DIGGS.at, yaw: D_DIGGS.yaw },
    { id: 'player', player: true, held: null, at: D_PLAYER.at, yaw: D_PLAYER.yaw },
    { id: 'spotter', name: 'Hat Watch Spotter', look: SPOTTER, held: 'hunters-spyglass', at: D_SPOTTER.at, yaw: D_SPOTTER.yaw },
  ],
  props: [
    // Nubbin's pickaxe, planted point-down in the crest like a flag.
    { id: 'planted', prefab: 'mole-pickaxe', at: [D_NUBBIN.at[0] - 0.7, D_NUBBIN.at[1] - 0.5], yaw: 0.4, size: 0.8, by: 'h', hidden: true },
  ],
  steps: [
    // Hook: three small shapes over the dune in the low sun, in single file, long shadows; the commander's boots at the edge of frame.
    cut(spot(DUNE, 'crest')),
    { do: 'sfx', id: 'squeak', at: 'nubbin', gain: 0.4, async: true },
    { do: 'walk', who: 'nubbin', path: [D_NUBBIN.at], speed: 1.5, async: true },
    { do: 'walk', who: 'digger-a', path: [D_DIGGER_A.at], speed: 1.5, async: true },
    { do: 'walk', who: 'digger-b', path: [D_DIGGER_B.at], speed: 1.5, async: true },
    { do: 'sfx', id: 'shovel', at: 'digger-a', gain: 0.3, async: true },
    { do: 'wait', s: 3.4 },
    // Setup: Nubbin plants his pickaxe and says why they have come.
    cut(DIGGS_TALK.single('nubbin', 'mcu')),
    { do: 'hold', who: 'nubbin', prop: null },
    { do: 'spawn', id: 'planted' },
    { do: 'sfx', id: 'shovel', at: 'nubbin', gain: 0.45, async: true },
    { do: 'gesture', who: 'nubbin', name: 'bow', s: 1.2, async: true },
    { do: 'say', who: 'nubbin', text: "Good evening. Ma'am says we dig where we are asked. You asked." },
    ...reaction('player', { toward: 'nubbin', gesture: 'tipHat', hold: 'pause', side: -25 }),
    // The commander: from a mole's eye line he is a wall with a rifle.
    cut(DIGGS_TALK.single('diggs', 'mcu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'These are the diggers.' },
    cut(DIGGS_TALK.single('nubbin', 'mcu')),
    { do: 'say', who: 'nubbin', text: 'Nubbin, sir. Post runner. Also, today, digger.' },
    cut(DIGGS_TALK.single('diggs', 'cu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'No rank. No hats.' },
    // The bow, and the line that this scene is built for.
    cut(DIGGS_TALK.single('nubbin', 'mcu')),
    { do: 'gesture', who: 'nubbin', name: 'bow', s: 1.3, async: true },
    { do: 'sfx', id: 'squeak', at: 'digger-a', gain: 0.45, async: true },
    { do: 'wait', s: 1.3 },
    cut(DIGGS_TALK.single('diggs', 'mcu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'A bow is not a salute.' },
    cut(DIGGS_TALK.single('nubbin', 'mcu')),
    { do: 'say', who: 'nubbin', text: 'I shall practise, sir.' },
    beat('pause'),
    // The turn: a glint on the far hill. The Hat Watch has a spotter, and the plan needs the sand to stay quiet.
    cut(NUB_YOU.single('nubbin', 'mcu')),
    { do: 'face', who: 'nubbin', at: 'spotter', s: 0.5, async: true },
    { do: 'say', who: 'nubbin', text: 'Sir? There is a person on the far hill.' },
    { do: 'sfx', id: 'snap', at: 'spotter', gain: 0.4, async: true },
    cut({ kind: 'cut', pos: pt([D_PLAYER.at[0] + 2.4, D_PLAYER.at[1] + 5.6], 1.7), look: 'spotter', fov: 22 }),
    { do: 'gesture', who: 'spotter', name: 'lean', s: 1.2, async: true },
    { do: 'wait', s: 1.8 },
    cut(DIGGS_TALK.single('diggs', 'mcu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'Hat Watch spotter. Effective yesterday.' },
    cut(pushIn('diggs', 'mcu', 4, { toward: 'player', side: -20, height: 'low' })),
    { do: 'face', who: 'diggs', at: 'player', s: 0.5, async: true },
    { do: 'say', who: 'diggs', text: 'Escort them. Keep them clear of that ridge.' },
    // Button: the file moves off up the dune; Nubbin tries the salute over his shoulder, pickaxe in hand.
    cut(spot(DUNE, 'wide')),
    { do: 'walk', who: 'digger-a', path: [[404.0, 106.4]], speed: 2.0, async: true },
    { do: 'walk', who: 'digger-b', path: [[407.6, 105.4]], speed: 2.0, async: true },
    { do: 'hold', who: 'nubbin', prop: 'mole-pickaxe' },
    { do: 'despawn', id: 'planted' },
    { do: 'walk', who: 'nubbin', path: [[405.8, 104.2]], speed: 1.8, async: true },
    { do: 'wait', s: 2.0 },
    { do: 'gesture', who: 'nubbin', name: 'tipHat', s: 0.8, async: true },
    { do: 'sfx', id: 'clatter', at: 'nubbin', gain: 0.4, async: true },
    { do: 'wait', s: 1.0 },
    cut(DIGGS_TALK.single('diggs', 'mcu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'Practise.' },
  ],
};

// ---- the armory yard (scene-only set, shared by the mid and the outro) -----------------------------------------------------

/** A sealed steel container (doors on its +x end: turned to face the yard, +z), the pegboard tool wall and the HOA notice. */
const armorySet = (): ScriptProp[] => [
  { id: 'armory', prefab: 'shipping-container', at: [374, -1], yaw: -Math.PI / 2 },
  { id: 'notice', prefab: 'notice-board', at: [377.4, 2.9], yaw: 0, size: 2.2, by: 'h' },
  { id: 'pegboard', prefab: 'ammu-stage-pegboard', at: [367.0, 1.8], yaw: 0, size: 3.0, by: 'w' },
  { id: 'spade-1', prefab: 'ranch-spade', at: [366.0, 2.3], yaw: 0.2, size: 1.5, by: 'h' },
  { id: 'spade-2', prefab: 'ranch-spade', at: [367.0, 2.4], yaw: -0.1, size: 1.5, by: 'h' },
  { id: 'spade-3', prefab: 'ranch-spade', at: [368.0, 2.3], yaw: 0.1, size: 1.5, by: 'h' },
  { id: 'lantern-a', prefab: 'camp-lantern-post', at: [369.4, 7.6], yaw: 0, size: 1.9, by: 'h' },
  { id: 'lantern-b', prefab: 'camp-lantern-post', at: [380.0, 6.4], yaw: 0, size: 1.9, by: 'h' },
  { id: 'bags-w', prefab: 'sandbag-wall', at: [362.0, 9.0], yaw: Math.PI / 2, size: 3.0, by: 'w' },
  { id: 'bags-e', prefab: 'sandbag-wall', at: [386.0, 8.0], yaw: -Math.PI / 2, size: 3.0, by: 'w' },
];

// ---- 2. Mid: the floor opens ------------------------------------------------------------------------------------------------

/**
 * Night in the armory yard. Diggs stands at the sealed door with a hand flat on the steel, listening to his own fort. A tap under the
 * sand, then another. The floor heaves; a tiny pickaxe comes up out of it with a scrap of white on it, waving. He lowers the rifle.
 */
export const M60_MID: SceneScript = {
  id: 'm60-the-moles-dig-mid',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'mystery',
  ambience: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m60-the-moles-dig-mid.md', kind: 'arrival' },
  actors: [
    { id: 'diggs', preset: 'diggs', held: 'gta-rifle', at: A_DIGGS_MID.at, yaw: A_DIGGS_MID.yaw },
  ],
  props: [
    ...armorySet(),
    { id: 'hill', prefab: 'mole-hill', at: HOLE, yaw: 0.4, size: 2.4, by: 'w', hidden: true },
    // The pickaxe and the white scrap on it, in two frames so the flag waves.
    { id: 'pick', prefab: 'mole-pickaxe', at: pt(HOLE, 0.28), yaw: 0.4, size: 0.9, by: 'h', hidden: true },
    { id: 'flag-1', prefab: 'banner-scrap-flag', at: pt([HOLE[0] + 0.05, HOLE[1]], 0.82), yaw: 0.4, size: 0.45, by: 'h', hidden: true },
    { id: 'flag-2', prefab: 'banner-scrap-flag', at: pt([HOLE[0] - 0.12, HOLE[1] + 0.04], 0.82), yaw: 0.9, size: 0.45, by: 'h', hidden: true },
  ],
  steps: [
    // Hook: the yard in lantern light, a sealed box, a tall man with his hand flat on it. A wick ticks.
    cut(spot(ARM, 'yard')),
    { do: 'sfx', id: 'creak', at: pt([369.4, 7.6], 1.4), gain: 0.35, async: true },
    { do: 'wait', s: 2.2 },
    cut(spot(ARM, 'door')),
    { do: 'gesture', who: 'diggs', name: 'lean', s: 1.6, async: true },
    { do: 'sfx', id: 'tap', at: 'diggs', gain: 0.25, async: true },
    { do: 'say', who: 'diggs', text: 'Locked out. Of my own armory.' },
    beat('pause'),
    // Setup: a tap. Then another. He turns his head, then the rest of him.
    cut(shot('diggs', 'mcu', { height: 'low', side: 30 })),
    { do: 'sfx', id: 'tap', at: pt(HOLE, 0), gain: 0.5 },
    beat('beat'),
    { do: 'sfx', id: 'tap', at: pt(HOLE, 0), gain: 0.55 },
    { do: 'face', who: 'diggs', at: HOLE, s: 0.8 },
    { do: 'hold', who: 'diggs', prop: 'gta-rifle' },
    // Turn: the floor moves. Ground level beside the patch; the sand heaves into a mound.
    cut(spot(ARM, 'floor')),
    { do: 'sfx', id: 'shovel', at: pt(HOLE, 0), gain: 0.55, async: true },
    { do: 'shake', amp: 0.05, s: 1.4 },
    { do: 'wait', s: 1.0 },
    { do: 'spawn', id: 'hill' },
    { do: 'sfx', id: 'thud', at: pt(HOLE, 0), gain: 0.55, async: true },
    { do: 'wait', s: 1.6 },
    { do: 'music', track: null, fade: 0.6 },
    // The pickaxe, then the scrap of white: it waves.
    { do: 'spawn', id: 'pick' },
    { do: 'sfx', id: 'rustle', at: pt(HOLE, 0), gain: 0.4, async: true },
    { do: 'wait', s: 0.9 },
    { do: 'spawn', id: 'flag-1' },
    { do: 'wait', s: 0.6 },
    { do: 'despawn', id: 'flag-1' },
    { do: 'spawn', id: 'flag-2' },
    { do: 'wait', s: 0.6 },
    // Button: Diggs, rifle half up, looks at a flag the size of a biscuit. Nobody fires on a flag.
    cut(shot('diggs', 'mcu', { height: 'low', side: -30 })),
    { do: 'gesture', who: 'diggs', name: 'think', s: 1.2, async: true },
    { do: 'wait', s: 0.8 },
    { do: 'hold', who: 'diggs', prop: null },
    { do: 'say', who: 'diggs', text: 'Nobody fires on a flag.' },
    cut(spot(ARM, 'floor')),
    { do: 'despawn', id: 'flag-2' },
    { do: 'spawn', id: 'flag-1' },
    { do: 'wait', s: 1.4 },
  ],
};

// ---- 3. Outro: the salute ---------------------------------------------------------------------------------------------------

const MOLE_UP = coverage('nubbin', 'diggs', 1);

/**
 * Night in the armory yard. The first mole out of the floor, Nubbin, stands and gives the only correct salute the fort has seen. The
 * guards wave. Diggs returns the salute, held, from above. Corporal. The diggers file up behind; the bolts slide from inside and the
 * tool wall lights.
 */
export const M60_OUTRO: SceneScript = {
  id: 'm60-the-moles-dig-outro',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'mystery',
  ambience: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m60-the-moles-dig-outro.md', kind: 'outro' },
  actors: [
    { id: 'diggs', preset: 'diggs', held: null, at: A_DIGGS.at, yaw: A_DIGGS.yaw },
    { id: 'nubbin', preset: 'nubbin', held: null, hidden: true, at: pt(HOLE, -0.2), yaw: 0 },
    { id: 'digger-a', preset: 'nubbin', name: 'Digger', scale: 1.0, look: DIGGER_A_LOOK, held: 'mole-pickaxe', hidden: true, at: pt([HOLE[0] - 0.4, HOLE[1]], -0.2), yaw: 0 },
    { id: 'digger-b', preset: 'nubbin', name: 'Digger', scale: 0.95, look: DIGGER_B_LOOK, held: 'mole-pickaxe', hidden: true, at: pt([HOLE[0] + 0.4, HOLE[1]], -0.2), yaw: 0 },
    { id: 'spade-l', name: 'Spade Guard', look: SPADE, held: null, at: A_GUARD_L.at, yaw: A_GUARD_L.yaw },
    { id: 'spade-r', name: 'Spade Guard', look: SPADE, held: null, at: A_GUARD_R.at, yaw: A_GUARD_R.yaw },
    { id: 'player', player: true, held: null, at: A_PLAYER.at, yaw: A_PLAYER.yaw },
  ],
  props: [
    ...armorySet(),
    { id: 'hill', prefab: 'mole-hill', at: HOLE, yaw: 0.4, size: 2.4, by: 'w' },
    { id: 'tool-light', prefab: 'camp-lantern-post', at: [370.6, 3.4], yaw: 0, size: 1.9, by: 'h', hidden: true },
  ],
  steps: [
    // Hook: ground level at the mound. A small grey paw on its rim, then a head, then the rest of him, coming up out of the floor.
    cut(spot(ARM, 'floor')),
    { do: 'sfx', id: 'shovel', at: pt(HOLE, 0), gain: 0.5, async: true },
    { do: 'spawn', id: 'nubbin' },
    { do: 'walk', who: 'nubbin', path: [pt([HOLE[0], HOLE[1] + 1.1], -0.1), pt([A_NUBBIN.at[0], A_NUBBIN.at[1] - 0.5], 0), pt(A_NUBBIN.at, 0)], speed: 0.8, async: true },
    { do: 'sfx', id: 'rustle', at: pt(HOLE, 0), gain: 0.4, async: true },
    { do: 'wait', s: 3.0 },
    // Setup: he dusts his satchel, apologises for the floor.
    cut(MOLE_UP.single('nubbin', 'mcu')),
    { do: 'face', who: 'nubbin', at: 'diggs', s: 0.4 },
    { do: 'gesture', who: 'nubbin', name: 'bow', s: 1.0, async: true },
    { do: 'say', who: 'nubbin', text: 'Pardon the floor, sir.' },
    cut(MOLE_UP.single('diggs', 'mcu', { height: 'low' })),
    beat('pause'),
    // Turn: he stands as straight as a mole can and salutes. Correctly.
    cut(pushIn('nubbin', 'mcu', 4.2, { to: 'cu', toward: 'diggs', side: 20 })),
    { do: 'gesture', who: 'nubbin', name: 'tipHat', s: 2.0, async: true },
    { do: 'say', who: 'nubbin', text: 'Nubbin, post runner. Reporting for digging, sir. I practised.' },
    // The Guard, in a line behind the Commander: late, and wrong.
    cut({ kind: 'cut', pos: pt([373.0, 22.6], 1.6), look: pt([375.0, 14.6], 1.2), fov: 46 }),
    { do: 'gesture', who: 'spade-l', name: 'tipHat', s: 1.0, async: true },
    { do: 'gesture', who: 'spade-r', name: 'wave', s: 1.2, async: true },
    { do: 'sfx', id: 'cloth', at: 'spade-l', gain: 0.35, async: true },
    { do: 'wait', s: 2.0 },
    cut(MOLE_UP.single('diggs', 'mcu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'Spade Guard. Observe. That is a salute.' },
    cut(MOLE_UP.single('diggs', 'cu', { height: 'low' })),
    { do: 'face', who: 'diggs', at: 'nubbin', s: 0.5 },
    { do: 'say', who: 'diggs', text: 'Fifteen years, and nobody did it correctly.' },
    // The salute returned, from above, held. A mole's eye line, the commander's hand coming up into frame.
    { do: 'music', track: 'sandpit', fade: 1.6 },
    cut(shot('diggs', 'mcu', { toward: 'nubbin', side: 12, height: 'low' })),
    { do: 'gesture', who: 'diggs', name: 'tipHat', s: 2.6, async: true },
    { do: 'wait', s: 3.0 },
    // Resolution: a rank, a protest, a word.
    cut(MOLE_UP.single('diggs', 'mcu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'Effective immediately: Corporal.' },
    cut(MOLE_UP.single('nubbin', 'mcu')),
    { do: 'say', who: 'nubbin', text: 'Most kind. But I am only the post, sir.' },
    cut(MOLE_UP.single('diggs', 'cu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'Corporal.' },
    // Button: the diggers file up behind him, pickaxes at the brow; the guards copy it, right hand this time; the bolts slide, the wall lights.
    cut(spot(ARM, 'yard')),
    { do: 'spawn', id: 'digger-a' },
    { do: 'spawn', id: 'digger-b' },
    { do: 'walk', who: 'digger-a', path: [pt([HOLE[0] - 0.4, HOLE[1] + 1.1], -0.1), pt(A_DIGGER_A.at, 0)], speed: 0.9, async: true },
    { do: 'walk', who: 'digger-b', path: [pt([HOLE[0] + 0.4, HOLE[1] + 1.1], -0.1), pt(A_DIGGER_B.at, 0)], speed: 0.9, async: true },
    { do: 'sfx', id: 'rustle', at: pt(HOLE, 0), gain: 0.4, async: true },
    { do: 'wait', s: 2.2 },
    { do: 'gesture', who: 'digger-a', name: 'tipHat', s: 1.4, async: true },
    { do: 'gesture', who: 'digger-b', name: 'tipHat', s: 1.4, async: true },
    { do: 'gesture', who: 'spade-l', name: 'tipHat', s: 1.4, async: true },
    { do: 'gesture', who: 'spade-r', name: 'tipHat', s: 1.4, async: true },
    { do: 'sfx', id: 'latch', at: pt([374, 2.0], 1.2), gain: 0.55, async: true },
    { do: 'wait', s: 1.0 },
    { do: 'sfx', id: 'door', at: pt([374, 2.0], 1.2), gain: 0.5, async: true },
    { do: 'spawn', id: 'tool-light' },
    ...reaction('player', { toward: 'diggs', gesture: 'nod', hold: 'pause', side: -30 }),
    cut(spot(ARM, 'yard')),
    { do: 'wait', s: 2.0 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm60-the-moles-dig-intro': M60_INTRO,
  'm60-the-moles-dig-mid': M60_MID,
  'm60-the-moles-dig-outro': M60_OUTRO,
};
