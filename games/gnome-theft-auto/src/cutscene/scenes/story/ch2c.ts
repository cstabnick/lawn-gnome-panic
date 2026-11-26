// Chapter 2 story scenes, third file: the sprinkler gauntlet (intro, payoff) and the Compost Heap forge.
// Owner: the Story A re-direction lane (docs/roadmaps/gta-redirect-story-a.md). Every id here is played by a quest in quests/chapter2.ts and checked by scenes.test.ts.
import type { SceneScript, ScriptActor, Vec2 } from '../../script';
import { coverage, cut, shot } from '../../direct';
import { carMark, markOf, pathOf, rideOf, spot, up } from './kit';

/** Heading (radians, 0 = +z, PI/2 = +x) from `a` towards `b`. */
function heading(a: Vec2, b: Vec2): number {
  return Math.atan2(b[0] - a[0], b[1] - a[1]);
}

/** A player actor standing on a stage mark. */
function playerAt(stageId: string): ScriptActor {
  const m = markOf(stageId, 'player');
  return { id: 'player', player: true, at: m.at, yaw: m.yaw };
}

/** An actor without a cast preset, on a stage mark. */
function markActor(stageId: string, id: string, who: string, n: number, look: ScriptActor['look'], name: string): ScriptActor {
  const m = markOf(stageId, who, n);
  return { id, look, name, at: m.at, yaw: m.yaw };
}

const CHAUFFEUR_LOOK = { hat: 0x18181e, shirt: 0xc9b99b };
const FRANK_LOOK = { hat: 0x8b5a2b, shirt: 0x6b4a2e };
const GUARD_LOOK = { hat: 0xf4f4f8, shirt: 0xe6e8f0, skin: 0xfafafa };
const WELDER_LOOK = { hat: 0x18181e, shirt: 0xc9b99b };
const ERNIE_LOOK = { hat: 0x555555, shirt: 0x6b4a2e };
const TURNCOAT_LOOK = { hat: 0xf4f4f8, shirt: 0xc9b99b };

/** Vesper's voice when he is off screen (his cast hz). */
const VESPER_HZ = 92;

const DEW = pathOf('granny-barn', 'dew-approach');
const VESPER_LOWRIDER = { ...carMark('south-highway-diner', 'vesper-diner-lowrider') };
const DINER_GETAWAY = pathOf('south-highway-diner', 'diner-getaway');
const DINER_APPROACH = pathOf('south-highway-diner', 'diner-approach');
const BOOTH_VESPER = markOf('south-highway-diner', 'vesper');
const HOLLOW_BRACKEN = markOf('unmowed-hollow', 'bracken');
const HOLLOW_SORREL = markOf('unmowed-hollow', 'sorrel');
const BOOTH_SORREL = markOf('sorrel-radio-booth', 'sorrel');
const GRANNY = markOf('granny-barn', 'granny');
const FORGE_ERNIE = markOf('compost-heap', 'ernie');
const FORGE_WELDER_A = markOf('compost-heap', 'hoa-welder', 0);
const CAM_MARK = markOf('side-valve-bay', 'turncoat-cam');

const YARD = 'granny-barn';
const HOA_LOOK = { hat: 0x18181e, shirt: 0xc9b99b };

/**
 * Chapter 2 sprinkler gauntlet, opener: Rooster on the windmill with his prophecy, then the barn. Granny's silo is
 * under foreclosure; a Reginald van crawls up the farm road with surveyors walking beside it.
 */
export const SPRINKLER_INTRO: SceneScript = {
  id: 'sprinkler-intro',
  stage: { kind: 'world' },
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sprinkler-intro.md' },
  music: 'tension',
  ambience: 'wind',
  actors: [
    { id: 'player', player: true, at: [-21, 327], yaw: -1.25 },
    // Rooster stands under the windmill, facing away from it, so the windmill is behind him in the hook.
    { id: 'rooster', name: 'Rooster Weatherby', look: { hat: 0xbfc3c7, shirt: 0x6b7a3a }, hz: 110, at: [4, 396], yaw: Math.PI },
    { id: 'granny', preset: 'granny', at: GRANNY.at, yaw: GRANNY.yaw },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: [-52, 344], yaw: -2.25 },
    { id: 'peel', name: 'Surveyor Peel', look: HOA_LOOK, at: [-1, 250], yaw: 0 },
    { id: 'tine', name: 'Surveyor Tine', look: HOA_LOOK, at: [5, 252], yaw: 0 },
  ],
  vehicles: [
    { id: 'reg-van', ...rideOf('reginald'), at: [0, 260], yaw: Math.atan2(-24, 36) },
  ],
  steps: [
    // 1. Hook: Rooster, low and close, with the windmill behind him. The prophecy is the first line.
    cut(shot('rooster', 'mcu', { height: 'low' })),
    { do: 'sfx', id: 'flutter', at: 'rooster', gain: 0.5, async: true },
    { do: 'gesture', who: 'rooster', name: 'handsUp', s: 1.5, async: true },
    { do: 'say', who: 'rooster', text: 'THE BAROMETER IS DROPPING! VESPERS IN THE CLOUDS!' },
    { do: 'say', who: 'rooster', text: 'THE SPRINKLERS KNOW! THEY ALWAYS KNOW!' },
    // 2. Setup: the silo is under foreclosure, and Pip panics about the tow.
    cut(shot('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'Reginald Vance\'s laser squad wants my acorn silo. Foreclosure, like a soufflé in a draft.' },
    cut(shot('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Towing a silo through oscillating sprinklers?! Thermal shock ruins kiln glaze! Ruins it!' },
    // 3. The turn: the Reginald van crawls up the farm road, surveyors walking beside it. A sprinkler hisses on: the prophecy holds.
    { do: 'sfx', id: 'squirt', gain: 0.6 },
    { do: 'cam', shot: { kind: 'track', pos: up(8, 290, 1.8), who: 'reg-van', fov: 50 } },
    { do: 'sfx', id: 'engine-rev', at: 'reg-van', gain: 0.35, async: true },
    { do: 'drive', vehicle: 'reg-van', path: [[-24, 296]], speed: 4.5, async: true },
    { do: 'walk', who: 'peel', path: [[-1, 250], [-4, 262]], speed: 1.4, async: true },
    { do: 'walk', who: 'tine', path: [[5, 252], [2, 262]], speed: 1.4, async: true },
    { do: 'wait', s: 8 },
    // 4. Button: Granny's objective, close on her.
    cut(shot('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'Then drive fast, sugar. Keep the sprinklers off my pumpkins.' },
  ],
};

/**
 * Chapter 2 sprinkler gauntlet, closer: the silo rig is at the south barn drop. Granny brings pies and forged HOA
 * permits, then Driftwood at his trailer asks about a turtle.
 */
export const SPRINKLER_OUTRO: SceneScript = {
  id: 'sprinkler-outro',
  stage: { kind: 'world' },
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sprinkler-outro.md' },
  music: 'warm',
  ambience: 'wind',
  actors: [
    { id: 'player', player: true, at: [40, 448], yaw: Math.PI },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: [44, 454], yaw: -Math.PI / 2 },
    { id: 'granny', preset: 'granny', seatedIn: 'granny-ride', seat: 0, at: [0, 0] },
    { id: 'driftwood', preset: 'driftwood', at: up(19, 462, 0), yaw: Math.PI / 2 },
  ],
  vehicles: [
    { id: 'granny-ride', ...rideOf('granny'), at: [60, 480], yaw: Math.PI },
    { id: 'silo-rig', kind: 'ride-on', at: [40, 440], yaw: -Math.PI / 2, keep: true },
  ],
  steps: [
    // 1. Hook: Granny's Ride-On comes in off the highway, the camera tracking it to the drop.
    { do: 'cam', shot: { kind: 'track', pos: up(70, 466, 1.8), who: 'granny-ride', fov: 50 } },
    { do: 'sfx', id: 'engine-rev', at: 'granny-ride', gain: 0.4, async: true },
    { do: 'drive', vehicle: 'granny-ride', path: [[60, 450], [52, 444], [48, 450]], speed: 7 },
    { do: 'sfx', id: 'latch', at: 'granny-ride', gain: 0.5, async: true },
    { do: 'exit', who: 'granny' },
    // 2. Granny: pie and forged permits. The first rung of the pie joke; "I brought pie" is kept for its payoff.
    cut(shot('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'Pie, sugar. And forged HOA permits. Official as a pie crust.' },
    { do: 'sfx', id: 'paper', at: 'granny', gain: 0.5, async: true },
    { do: 'give', from: 'granny', to: 'player', prop: 'ledger' },
    { do: 'give', from: 'granny', to: 'pip', prop: 'acorn-cake' },
    // 3. Pip with the cake, in frame.
    cut(shot('pip', 'ms')),
    { do: 'sfx', id: 'crunch', at: 'pip', gain: 0.5, async: true },
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Pie. Evidence of a very good morning.' },
    // 4. The turn: Driftwood, from the trailer, asks about the turtle. The mystery stinger marks it.
    { do: 'music', track: 'mystery', fade: 2 },
    { do: 'stinger', id: 'mystery' },
    cut(shot('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'You lot! Seen a turtle? Big as a barn. Keeps a loch tidy.' },
    // 5. Button: Granny's dismissal, then a held picture of Driftwood's stare.
    cut(shot('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'That\'s Driftwood. Ignore him. He\'s been out in the sun since spring.' },
    cut(shot('driftwood', 'mcu')),
    { do: 'intro', who: 'driftwood' },
    { do: 'wait', s: 0.8 },
  ],
};

// ---- 3. The Compost Heap forge (arrival, plays when the player reaches the forge at (-255, -60)) -----------------------

/** The two HOA welders, shot from one side of their line for the whole exchange. */
const TW = coverage('welder1', 'welder2', -1);

/**
 * From cover at the heap, the player watches HOA welders plate the armour rig for the Grand Combine while Ash-Shovel
 * Ernie roasts chestnuts over the furnace. The player crouches down ready to strike.
 */
export const COMPOST_FORGE: SceneScript = {
  id: 'compost-forge',
  stage: { kind: 'world' },
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/compost-forge.md' },
  music: 'mystery',
  ambience: 'forest',
  actors: [
    { id: 'player', player: true, at: [-280, -50], yaw: heading([-280, -50], [-266, -60]) },
    { id: 'ernie', look: ERNIE_LOOK, name: 'Ash-Shovel Ernie', at: FORGE_ERNIE.at, yaw: FORGE_ERNIE.yaw },
    { id: 'welder1', look: WELDER_LOOK, name: 'HOA Welder', at: FORGE_WELDER_A.at, yaw: FORGE_WELDER_A.yaw },
    { id: 'welder2', look: WELDER_LOOK, name: 'HOA Welder', at: [-258, -56], yaw: heading([-258, -56], [-252, -57]) },
  ],
  props: [
    { id: 'plate1', prefab: 'pot-lid-shield', at: [-268.5, -53], yaw: 0.3, size: 2.4, hidden: true },
    { id: 'plate2', prefab: 'millstone', at: [-266.2, -50.8], yaw: 1.2, size: 2.2, hidden: true },
  ],
  steps: [
    // 1. Hook: a plate is hit with a smash under the furnace glow; the wide from the heap, then Ernie.
    { do: 'sfx', id: 'smash', at: 'welder1' },
    cut(spot('compost-heap', 'wide')),
    { do: 'wait', s: 1.4 },
    cut(shot('ernie', 'mcu')),
    { do: 'sfx', id: 'crunch', at: 'ernie', gain: 0.4, async: true },
    { do: 'gesture', who: 'ernie', name: 'point', s: 1.0, async: true },
    { do: 'say', who: 'ernie', text: 'Chestnut? Nearly edible. Roasted on a trowel, like my granddad did.' },
    // 2. The welders: one coverage for the pair, so the camera stays on one side of their line.
    cut(TW.single('welder1', 'mcu')),
    { do: 'say', who: 'welder1', text: 'Thirty plates by Friday. The Glazier wants it scratch-proof.' },
    cut(TW.single('welder2', 'mcu')),
    { do: 'say', who: 'welder2', text: 'Scratch-proof? It\'s a harvester.' },
    cut(TW.single('welder1', 'mcu')),
    { do: 'say', who: 'welder1', text: 'Tell HIM that.' },
    // 3. The reveal is a picture: the music drops out, the plates come in, a dolly onto them. Villain music after.
    { do: 'music', track: null, fade: 0.6 },
    { do: 'sfx', id: 'thud', at: 'plate1' },
    { do: 'stinger', id: 'reveal' },
    { do: 'spawn', id: 'plate1' },
    { do: 'spawn', id: 'plate2' },
    { do: 'cam', shot: { kind: 'dolly', from: up(-274.5, -59, 1.0), to: up(-272.5, -57.4, 0.8), look: up(-267.6, -52.2, 0.7), s: 3, fov: 46 } },
    // The dolly takes 3 s; the step after a camera move starts at once, so hold for it before the next shot.
    { do: 'wait', s: 1.6 },
    { do: 'music', track: 'villain', fade: 0.6 },
    { do: 'wait', s: 1.4 },
    // 4. Button: the player moves into cover, ready, and the last image is his face.
    { do: 'walk', who: 'player', path: [[-266, -60]], run: true, async: true },
    cut(shot('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'lean', s: 1.2 },
  ],
};

export const CH2C_SCENES: Record<string, SceneScript> = {
  'sprinkler-intro': SPRINKLER_INTRO,
  'sprinkler-outro': SPRINKLER_OUTRO,
  'compost-forge': COMPOST_FORGE,
};
