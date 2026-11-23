// Chapter 2 story scenes, second file (intros, outros, arrival scenes). Owner: one issue of
// docs/roadmaps/gta-story-cutscenes.md. Every id here is played by a quest in quests/chapter2.ts and checked by scenes.test.ts.
import type { SceneScript, ScriptActor, Vec2 } from '../../script';
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

// ---- 1. Vesper's Offer (intro, giver cloverfield-barn, exit (-20, 325)) ------------------------------------------------

/**
 * A pearl-white Lowrider slides up the barn track; a chauffeur hands Granny a sealed invitation. Granny reads it out
 * (Vesper off screen), a cut to the South Highway diner where Vesper stirs his tea and Frank waves the traffic
 * through, and Granny lends the player her shotgun before the player walks back to the gate.
 */
export const VESPERS_OFFER_INTRO: SceneScript = {
  id: 'vespers-offer-intro',
  stage: { kind: 'world' },
  music: 'villain',
  ambience: 'wind',
  actors: [
    playerAt('granny-barn'),
    { id: 'granny', preset: 'granny', at: GRANNY.at, yaw: GRANNY.yaw, held: null },
    { id: 'chauffeur', look: CHAUFFEUR_LOOK, name: 'HOA Chauffeur', at: [0, 0], seatedIn: 'ride', hidden: true },
    { id: 'vesper', preset: 'vesper', at: BOOTH_VESPER.at, yaw: BOOTH_VESPER.yaw, hidden: true },
    markActor('south-highway-diner', 'frank', 'frank', 0, FRANK_LOOK, 'Fence-Post Frank'),
  ],
  vehicles: [
    { id: 'ride', ...rideOf('vesper'), at: DEW[1], yaw: heading(DEW[1], DEW[2]), hidden: true },
  ],
  steps: [
    { do: 'cam', shot: spot('granny-barn', 'wide') },
    { do: 'gesture', who: 'granny', name: 'sit', s: 0.2 },
    { do: 'gesture', who: 'player', name: 'shrug', s: 0.8 },
    { do: 'spawn', id: 'ride' },
    { do: 'cam', shot: { kind: 'track', pos: up(-14, 324, 3), who: 'ride', fov: 50 } },
    { do: 'stinger', id: 'villain' },
    { do: 'drive', vehicle: 'ride', path: DEW.slice(2), speed: 12 },
    { do: 'spawn', id: 'chauffeur' },
    { do: 'exit', who: 'chauffeur' },
    { do: 'cam', shot: spot('granny-barn', 'two-shot') },
    { do: 'walk', who: 'chauffeur', path: [[-58, 333]], run: true },
    { do: 'face', who: 'chauffeur', at: 'granny', s: 0.3 },
    { do: 'give', from: 'chauffeur', to: 'granny', prop: 'sealed-letter', s: 1.2 },
    { do: 'face', who: 'granny', at: 'chauffeur', s: 0.4 },
    { do: 'say', who: 'Vesper Thorne', text: 'Meet me at the South Highway diner. Come alone. Wear the hat.', hz: VESPER_HZ },
    { do: 'gesture', who: 'granny', name: 'lean', s: 1.2 },
    { do: 'say', who: 'granny', text: 'It\'s a trap, sugar. Go anyway. Hear what he wants.' },
    // Two miles down the highway.
    { do: 'cam', shot: spot('south-highway-diner', 'two-shot') },
    { do: 'spawn', id: 'vesper' },
    { do: 'gesture', who: 'vesper', name: 'sit', s: 0.2 },
    { do: 'gesture', who: 'vesper', name: 'lean', s: 1.6, async: true },
    { do: 'walk', who: 'frank', path: [[-7.5, 259], [6, 252]], speed: 1.1, async: true },
    { do: 'gesture', who: 'frank', name: 'wave', s: 2.2, async: true },
    { do: 'say', who: 'Narrator', text: 'Two miles south, Vesper Thorne stirs his tea. Fence-Post Frank waves the traffic through.', hz: 130 },
    { do: 'say', who: 'vesper', text: 'Patience, friend. The Glazier is never late.' },
    // Granny lends her shotgun to the player, across the yard.
    { do: 'cam', shot: spot('granny-barn', 'two-shot') },
    { do: 'despawn', id: 'vesper' },
    { do: 'walk', who: 'player', path: [[-52, 336]], run: true },
    { do: 'hold', who: 'granny', prop: 'gta-shotgun' },
    { do: 'face', who: 'granny', at: 'player', s: 0.4 },
    { do: 'give', from: 'granny', to: 'player', prop: 'gta-shotgun', s: 1.2 },
    { do: 'gesture', who: 'player', name: 'cheer', s: 0.8 },
    { do: 'say', who: 'granny', text: 'Shoot for the hat, sugar. Not the gnome under it.' },
    { do: 'walk', who: 'player', path: [[-20, 331]], run: true },
  ],
};

// ---- 2. The diner (arrival, plays when the player reaches the diner at (0, 245)) ----------------------------------------

/**
 * Vesper waits at the booth, then the Porcelain van rolls up and his guards step into the road. He drives off, the
 * diner is a trap.
 */
export const VESPER_DINER: SceneScript = {
  id: 'vesper-diner',
  stage: { kind: 'world' },
  music: 'villain',
  ambience: 'wind',
  actors: [
    playerAt('south-highway-diner'),
    { id: 'vesper', preset: 'vesper', at: BOOTH_VESPER.at, yaw: BOOTH_VESPER.yaw },
    markActor('south-highway-diner', 'frank', 'frank', 0, FRANK_LOOK, 'Fence-Post Frank'),
    { id: 'guard1', look: GUARD_LOOK, name: 'Porcelain Guard', at: [-2.5, 236], yaw: 0, hidden: true },
    { id: 'guard2', look: GUARD_LOOK, name: 'Porcelain Guard', at: [-2.5, 236], yaw: 0, hidden: true },
    { id: 'guard3', look: GUARD_LOOK, name: 'Porcelain Guard', at: [-2.5, 236], yaw: 0, hidden: true },
  ],
  vehicles: [
    { id: 'ride', ...rideOf('vesper'), at: [VESPER_LOWRIDER.at[0], VESPER_LOWRIDER.at[1]], yaw: VESPER_LOWRIDER.yaw, hidden: true },
    { id: 'van', kind: 'hoa-van', at: DINER_APPROACH[0], yaw: 0, hidden: true },
  ],
  steps: [
    { do: 'cam', shot: spot('south-highway-diner', 'wide') },
    { do: 'cam', shot: spot('south-highway-diner', 'two-shot') },
    { do: 'gesture', who: 'player', name: 'crossArms', s: 0.6 },
    { do: 'say', who: 'vesper', text: 'Nice hat. Shame if it cracked.', hz: VESPER_HZ },
    { do: 'say', who: 'vesper', text: 'Hand over the Golden Acorn. Tansy\'s lien vanishes. A Patio Heights penthouse, astro-turf included.', hz: VESPER_HZ },
    { do: 'say', who: 'vesper', text: 'Full Kiln-Shield coverage. Zero-millimetre uniformity. Order over chaos, friend.', hz: VESPER_HZ },
    { do: 'gesture', who: 'player', name: 'shrug', s: 1.0 },
    { do: 'say', who: 'player', text: 'Order is overrated. I\'ll keep my acorn, thanks.' },
    { do: 'say', who: 'vesper', text: 'A pity. Porcelain does not negotiate twice.', hz: VESPER_HZ, stinger: 'danger', music: 'chase' },
    // The van, the doors, the guards.
    { do: 'spawn', id: 'van' },
    { do: 'drive', vehicle: 'van', path: [DINER_APPROACH[1]], speed: 12 },
    { do: 'sfx', id: 'door', at: 'van' },
    { do: 'spawn', id: 'guard1', at: [-2.5, 236] },
    { do: 'spawn', id: 'guard2', at: [-2.5, 236] },
    { do: 'spawn', id: 'guard3', at: [-2.5, 236] },
    { do: 'walk', who: 'guard1', path: [[-6, 240]], run: true, async: true },
    { do: 'walk', who: 'guard2', path: [[6, 240]], run: true, async: true },
    { do: 'walk', who: 'guard3', path: [[0, 252]], run: true, async: true },
    { do: 'cam', shot: spot('south-highway-diner', 'arrival') },
    { do: 'wait', s: 1.0 },
    // Vesper takes his Lowrider down the highway, away from the blockade.
    { do: 'walk', who: 'vesper', path: [[24, 253]], async: true },
    { do: 'cam', shot: { kind: 'track', pos: up(-6, 264, 3), who: 'ride', fov: 50 } },
    { do: 'wait', s: 1.5 },
    { do: 'enter', who: 'vesper', vehicle: 'ride' },
    { do: 'lights', vehicle: 'ride', on: true },
    { do: 'horn', vehicle: 'ride' },
    { do: 'drive', vehicle: 'ride', path: DINER_GETAWAY, speed: 14, arrive: false },
  ],
};

// ---- 3. The Compost Heap forge (arrival, plays when the player reaches the forge at (-255, -60)) -----------------------

/**
 * From cover at the heap, the player watches HOA welders plate the armour rig for the Grand Combine while Ash-Shovel
 * Ernie roasts chestnuts over the furnace. The player crouches down ready to strike.
 */
export const COMPOST_FORGE: SceneScript = {
  id: 'compost-forge',
  stage: { kind: 'world' },
  music: 'mystery',
  ambience: 'forest',
  actors: [
    { id: 'player', player: true, at: [-280, -50], yaw: heading([-280, -50], [-266, -60]) },
    { id: 'ernie', look: ERNIE_LOOK, name: 'Ash-Shovel Ernie', at: FORGE_ERNIE.at, yaw: FORGE_ERNIE.yaw },
    { id: 'welder1', look: WELDER_LOOK, name: 'HOA Welder', at: FORGE_WELDER_A.at, yaw: FORGE_WELDER_A.yaw },
    { id: 'welder2', look: WELDER_LOOK, name: 'HOA Welder', at: [-258, -56], yaw: heading([-258, -56], [-252, -57]) },
  ],
  props: [
    { id: 'plate1', prefab: 'pot-lid-shield', at: [-270, -50], yaw: 0.3, size: 1.1, hidden: true },
    { id: 'plate2', prefab: 'millstone', at: [-258, -46], yaw: 1.2, size: 1.2, hidden: true },
  ],
  steps: [
    { do: 'cam', shot: { kind: 'cut', pos: up(-230, -50, 1.7), look: 'ernie', fov: 46 } },
    { do: 'gesture', who: 'player', name: 'lean', s: 1.2 },
    { do: 'say', who: 'Narrator', text: 'Under the furnace glow, something big is being welded together that is not a lawnmower.', hz: 130 },
    { do: 'gesture', who: 'ernie', name: 'point', s: 1.0, async: true },
    { do: 'say', who: 'ernie', text: 'Chestnut? Nearly edible. Roasted on a trowel, like my granddad did.' },
    { do: 'cam', shot: spot('compost-heap', 'wide') },
    { do: 'say', who: 'welder1', text: 'Thirty plates by Friday. The Glazier wants it scratch-proof.' },
    { do: 'sfx', id: 'smash', at: 'welder1' },
    { do: 'say', who: 'welder2', text: 'Scratch-proof? It\'s a harvester.' },
    { do: 'say', who: 'welder1', text: 'Tell HIM that.' },
    { do: 'sfx', id: 'thud', at: 'plate1' },
    { do: 'stinger', id: 'reveal' },
    { do: 'spawn', id: 'plate1' },
    { do: 'spawn', id: 'plate2' },
    { do: 'cam', shot: { kind: 'dolly', from: up(-276, -60, 1.8), to: up(-272, -61, 1.6), look: 'plate1', s: 3, fov: 48 } },
    { do: 'cam', shot: spot('compost-heap', 'wide') },
    { do: 'music', track: 'villain', fade: 0.6 },
    { do: 'say', who: 'Narrator', text: 'Thirty plates. One Glazier. Not a single square inch of lawn left unpolished.', hz: 130 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-276, -60, 1.8), look: 'player', fov: 50 } },
    { do: 'walk', who: 'player', path: [[-266, -60]], speed: 1.2 },
    { do: 'gesture', who: 'player', name: 'lean', s: 1.2 },
  ],
};

// ---- 4. The Cracked Tablet (intro, giver unmowed-hollow, exit (-345, 34)) ------------------------------------------------

/**
 * Elder Bracken calls Pip out as a Potsworth; Sorrel walks over from the radio booth; the cracked tablet shows that only
 * a Stopping Stone can jam the Grand Combine. The player is sent to clear the welders at the Compost Heap.
 */
export const TABLET_INTRO: SceneScript = {
  id: 'tablet-intro',
  stage: { kind: 'world' },
  music: 'fescue',
  ambience: 'forest',
  actors: [
    playerAt('unmowed-hollow'),
    { id: 'bracken', preset: 'bracken', at: HOLLOW_BRACKEN.at, yaw: HOLLOW_BRACKEN.yaw },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: [-341, 41], yaw: heading([-341, 41], HOLLOW_BRACKEN.at) },
    { id: 'sorrel', preset: 'sorrel', at: BOOTH_SORREL.at, yaw: BOOTH_SORREL.yaw },
  ],
  props: [
    { id: 'tablet', prefab: 'stone-plaque', at: [-355, 39], yaw: 0, size: 0.5, hidden: true },
  ],
  steps: [
    { do: 'cam', shot: { kind: 'cut', pos: up(-372, 48, 1.5), look: 'bracken', fov: 48 } },
    { do: 'gesture', who: 'bracken', name: 'stand', s: 0.4 },
    { do: 'say', who: 'bracken', text: 'A Potsworth in Mossy Wood, reeking of Black Dew!', hz: 76 },
    { do: 'gesture', who: 'pip', name: 'shrug', s: 1.2 },
    { do: 'say', who: 'bracken', text: 'Your cousin Wendel is regent of Fescue, and you traded the old soil for Stink-Gro and engines.', hz: 76 },
    // Sorrel's booth, then her walk across the hollow.
    { do: 'cam', shot: spot('sorrel-radio-booth', 'two-shot') },
    { do: 'say', who: 'Narrator', text: 'Sorrel Tillbrook, mid-broadcast, pulls off her headphones.', hz: 130 },
    { do: 'gesture', who: 'sorrel', name: 'stand', s: 0.6 },
    { do: 'despawn', id: 'sorrel' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-336, 38, 1.6), look: 'sorrel', fov: 48 } },
    { do: 'spawn', id: 'sorrel', at: HOLLOW_SORREL.at, yaw: HOLLOW_SORREL.yaw },
    { do: 'say', who: 'sorrel', text: 'Steady, Elder. Show them the tablet.', hz: 122 },
    { do: 'spawn', id: 'tablet' },
    { do: 'cam', shot: { kind: 'dolly', from: up(-348, 30, 1.6), to: up(-350, 32, 1.3), look: 'tablet', s: 3, fov: 46 } },
    { do: 'say', who: 'sorrel', text: 'Vesper\'s Grand Combine is copied from Fescue\'s original. The one in the Shed, three thousand years old.', hz: 122 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-372, 48, 1.5), look: 'bracken', fov: 48 } },
    { do: 'say', who: 'bracken', text: 'Only a Fescue Stopping Stone can jam it. Clear his welders at the Compost Heap. Bring their rig here.', hz: 76 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-336, 38, 1.6), look: 'sorrel', fov: 48 } },
    { do: 'say', who: 'sorrel', text: 'After this, 88.7 is playing forty-five minutes of rain on terracotta. Let\'s move.', hz: 122 },
  ],
};

// ---- 5. The Cracked Tablet, end (chapter 2 closer; the player arrives in the armoured Ride-On) --------------------------

/**
 * The armoured rig rolls into the hollow, Bracken holds up the Stopping Stone and the jokes stop. A cut to the Side-Valve
 * bay at night, Turncoat Cam on the phone, and the chapter's cliffhanger.
 */
export const TABLET_OUTRO: SceneScript = {
  id: 'tablet-outro',
  stage: { kind: 'world' },
  music: 'fescue',
  ambience: 'forest',
  radio: 0.15,
  actors: [
    { id: 'player', player: true, at: [-320, 20], yaw: heading([-320, 20], [-325, 22]), seatedIn: 'ride' },
    { id: 'bracken', preset: 'bracken', at: HOLLOW_BRACKEN.at, yaw: HOLLOW_BRACKEN.yaw },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: [-341, 41], yaw: heading([-341, 41], HOLLOW_BRACKEN.at) },
    { id: 'sorrel', preset: 'sorrel', at: HOLLOW_SORREL.at, yaw: HOLLOW_SORREL.yaw },
    { id: 'turncoat', look: TURNCOAT_LOOK, name: 'Turncoat Cam', at: CAM_MARK.at, yaw: CAM_MARK.yaw, hidden: true },
  ],
  vehicles: [
    { id: 'ride', from: 'player', kind: 'ride-on', at: [-320, 20], yaw: heading([-320, 20], [-325, 22]) },
  ],
  props: [
    { id: 'phone', prefab: 'tin-can-phone', at: [-157.5, 74], yaw: 0, size: 0.4, hidden: true },
    { id: 'lamp', prefab: 'porcelain-lantern', at: [-159, 71], yaw: 0, size: 1.2, hidden: true },
  ],
  steps: [
    { do: 'cam', shot: { kind: 'track', pos: up(-322, 26, 2.2), who: 'ride', fov: 50 } },
    { do: 'drive', vehicle: 'ride', path: [[-320, 20], [-325, 22]], speed: 8 },
    { do: 'exit', who: 'player' },
    { do: 'walk', who: 'player', path: [[-344, 38]], run: true },
    { do: 'cam', shot: { kind: 'cut', pos: up(-372, 48, 1.5), look: 'bracken', fov: 48 } },
    { do: 'gesture', who: 'bracken', name: 'stand', s: 0.4 },
    { do: 'say', who: 'Narrator', text: 'The rig rolls in. Bracken lays a hand on the armour, and nobody makes a joke.', hz: 130 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-372, 48, 1.5), look: 'bracken', fov: 48 } },
    { do: 'stinger', id: 'sad' },
    { do: 'music', track: 'sad', fade: 1 },
    { do: 'gesture', who: 'bracken', name: 'handsUp', s: 1.6 },
    { do: 'say', who: 'bracken', text: 'The Stopping Stone. It was made to hold back the Grand Combine, and it will.', hz: 76 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-336, 38, 1.6), look: 'pip', fov: 48 } },
    { do: 'say', who: 'pip', text: 'Wait... they\'re really gonna level the whole lawn?' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-372, 48, 1.5), look: 'bracken', fov: 48 } },
    { do: 'say', who: 'bracken', text: 'They have done it before. Long ago. To us.', hz: 76 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-336, 38, 1.6), look: 'sorrel', fov: 48 } },
    { do: 'say', who: 'sorrel', text: 'There\'s a girl from Fescue hiding in the hollow. She\'ll want to talk to you.', hz: 122 },
    { do: 'cam', shot: spot('side-valve-bay', 'two-shot') },
    { do: 'music', track: 'villain', fade: 1.2 },
    { do: 'ambience', bed: 'rain', fade: 1.5 },
    { do: 'spawn', id: 'turncoat', at: CAM_MARK.at },
    { do: 'spawn', id: 'phone' },
    { do: 'spawn', id: 'lamp' },
    { do: 'cam', shot: { kind: 'dolly', from: up(-160, 66, 1.8), to: up(-158, 66, 1.6), look: 'turncoat', s: 4, fov: 46 } },
    { do: 'gesture', who: 'turncoat', name: 'lean', s: 1.2, async: true },
    { do: 'say', who: 'turncoat', text: 'The acorn\'s in the crate under the bench. Tuesday. And the racing charter\'s mine.' },
    { do: 'stinger', id: 'villain' },
    { do: 'say', who: 'Vesper Thorne', text: 'Of course, Cameron.', hz: VESPER_HZ },
    { do: 'title', text: 'END OF CHAPTER 2' },
    { do: 'wait', s: 2.5 },
    { do: 'title', text: null },
  ],
};

export const CH2B_SCENES: Record<string, SceneScript> = {
  'vespers-offer-intro': VESPERS_OFFER_INTRO,
  'vesper-diner': VESPER_DINER,
  'compost-forge': COMPOST_FORGE,
  'tablet-intro': TABLET_INTRO,
  'tablet-outro': TABLET_OUTRO,
};

