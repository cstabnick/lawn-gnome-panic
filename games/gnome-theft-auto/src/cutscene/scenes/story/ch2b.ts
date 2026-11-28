// Chapter 2 story scenes, second file: Vesper's Offer (the invitation) and the diner.
// Owner: the Story A re-direction lane (docs/roadmaps/gta-redirect-story-a.md). Every id here is played by a quest in quests/chapter2.ts and checked by scenes.test.ts.
import type { SceneScript, ScriptActor, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
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

/** Vesper's voice when he is off screen (his cast hz). */
const VESPER_HZ = 92;

const DEW = pathOf('granny-barn', 'dew-approach');
const VESPER_LOWRIDER = { ...carMark('south-highway-diner', 'vesper-diner-lowrider') };
const DINER_GETAWAY = pathOf('south-highway-diner', 'diner-getaway');
const DINER_APPROACH = pathOf('south-highway-diner', 'diner-approach');
const BOOTH_VESPER = markOf('south-highway-diner', 'vesper');
const GRANNY = markOf('granny-barn', 'granny');
/** Vesper and the player at the booth: every shot of their exchange on one side of their line. */
const BOOTH = coverage('vesper', 'player', -1);

// ---- 1. Vesper's Offer (intro, giver cloverfield-barn, exit (-20, 325)) ------------------------------------------------

/**
 * A pearl-white Lowrider slides up the barn track; a chauffeur hands Granny a sealed invitation. Granny reads it out
 * (Vesper off screen), a cut to the South Highway diner where Vesper waits at his booth, still, and Granny lends the
 * player her shotgun before the player walks back to the gate.
 */
export const VESPERS_OFFER_INTRO: SceneScript = {
  id: 'vespers-offer-intro',
  stage: { kind: 'world' },
  music: 'villain',
  ambience: 'wind',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/vespers-offer-intro.md' },
  actors: [
    { id: 'player', player: true, at: [-20, 331], yaw: -Math.PI / 2, hidden: true },
    { id: 'granny', preset: 'granny', at: GRANNY.at, yaw: GRANNY.yaw, held: null },
    { id: 'chauffeur', look: CHAUFFEUR_LOOK, name: 'HOA Chauffeur', at: [0, 0], seatedIn: 'ride', hidden: true },
    { id: 'vesper', preset: 'vesper', at: BOOTH_VESPER.at, yaw: BOOTH_VESPER.yaw, hidden: true },
    markActor('south-highway-diner', 'frank', 'frank', 0, FRANK_LOOK, 'Fence-Post Frank'),
  ],
  vehicles: [
    { id: 'ride', ...rideOf('vesper'), at: DEW[1], yaw: heading(DEW[1], DEW[2]), hidden: true },
  ],
  steps: [
    // 1. Hook: the pearl Lowrider on the track, horn up the yard. The car is the first thing the player sees.
    { do: 'spawn', id: 'ride' },
    { do: 'cam', shot: { kind: 'track', pos: up(-14, 324, 3), who: 'ride', fov: 50 } },
    { do: 'horn', vehicle: 'ride', async: true },
    { do: 'sfx', id: 'engine-rev', at: 'ride', gain: 0.4, async: true },
    { do: 'drive', vehicle: 'ride', path: DEW.slice(2), speed: 12, async: true },
    { do: 'wait', s: 1.0 },
    // 2. Granny, in her own close-up, on the pearl paint.
    cut(shot('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'Pearl paint on a farm track. Somebody\'s lost, or somebody\'s rich.' },
    // 3. The chauffeur, out of the car and running up the yard with the invitation.
    { do: 'spawn', id: 'chauffeur' },
    { do: 'exit', who: 'chauffeur' },
    { do: 'cam', shot: { kind: 'track', pos: up(-20, 338, 2.2), who: 'chauffeur', fov: 50 } },
    { do: 'walk', who: 'chauffeur', path: [[-58, 333]], run: true },
    { do: 'face', who: 'chauffeur', at: 'granny', s: 0.3 },
    // 4. The handover, wide enough to see the letter change hands.
    cut(spot('granny-barn', 'two-shot')),
    { do: 'sfx', id: 'paper', at: 'chauffeur', gain: 0.5, async: true },
    { do: 'give', from: 'chauffeur', to: 'granny', prop: 'sealed-letter', s: 1.2 },
    { do: 'face', who: 'granny', at: 'chauffeur', s: 0.4 },
    // 5. The invitation, read in Vesper's voice over Granny's face.
    cut(shot('granny', 'mcu')),
    { do: 'say', who: 'Vesper Thorne', text: 'Meet me at the South Highway diner. Come alone. Wear the hat.', hz: VESPER_HZ },
    cut(shot('granny', 'cu')),
    { do: 'gesture', who: 'granny', name: 'lean', s: 1.2, async: true },
    { do: 'say', who: 'granny', text: 'It\'s a trap. Go anyway. Hear what he wants.' },
    // 6. Two miles south: Vesper himself, in a low single, still at his booth. The one villain stinger of the scene.
    { do: 'spawn', id: 'vesper' },
    { do: 'gesture', who: 'vesper', name: 'sit', s: 0.2 },
    cut(shot('vesper', 'mcu', { height: 'low', side: -40 })),
    { do: 'stinger', id: 'villain' },
    { do: 'walk', who: 'frank', path: [[-7.5, 259], [6, 252]], speed: 1.1, async: true },
    { do: 'gesture', who: 'frank', name: 'wave', s: 2.2, async: true },
    { do: 'say', who: 'vesper', text: 'Patience, friend. The Glazier is never late.', hz: VESPER_HZ },
    { do: 'despawn', id: 'vesper' },
    // 7. Back in the yard: Granny runs down to the player with her shotgun.
    { do: 'spawn', id: 'player' },
    { do: 'hold', who: 'granny', prop: 'gta-shotgun' },
    { do: 'cam', shot: { kind: 'track', pos: up(-14, 337, 1.8), who: 'granny', fov: 50 } },
    { do: 'walk', who: 'granny', path: [[-22, 335]], run: true },
    cut(shot('player', 'ms', { toward: 'granny' })),
    { do: 'face', who: 'granny', at: 'player', s: 0.4 },
    { do: 'sfx', id: 'clatter', at: 'granny', gain: 0.4, async: true },
    { do: 'give', from: 'granny', to: 'player', prop: 'gta-shotgun', s: 1.2 },
    { do: 'gesture', who: 'player', name: 'cheer', s: 0.8 },
    // 8. Button: Granny's line on her close-up, then the player's look.
    cut(shot('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'Shoot for the hat, sugar. Not the gnome under it.' },
    ...reaction('player', { size: 'mcu', hold: 'pause' }),
  ],
};

// ---- 2. The diner (arrival, plays when the player reaches the diner at (0, 245)) ----------------------------------------

/**
 * The offer. Vesper at the booth, low, alone in frame, makes his offer in short sentences. The player refuses; Vesper
 * is not surprised. The Porcelain van rolls up and his guards step into the road. He drives off, and the diner is a trap.
 */
export const VESPER_DINER: SceneScript = {
  id: 'vesper-diner',
  stage: { kind: 'world' },
  music: 'villain',
  ambience: 'wind',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/vesper-diner.md' },
  actors: [
    playerAt('south-highway-diner'),
    { id: 'vesper', preset: 'vesper', at: BOOTH_VESPER.at, yaw: BOOTH_VESPER.yaw },
    markActor('south-highway-diner', 'frank', 'frank', 0, FRANK_LOOK, 'Fence-Post Frank'),
    { id: 'guard1', look: GUARD_LOOK, name: 'Porcelain Guard', at: [-2.5, 236], yaw: 0, hidden: true },
    { id: 'guard2', look: GUARD_LOOK, name: 'Porcelain Guard', at: [-2.5, 236], yaw: 0, hidden: true },
    { id: 'guard3', look: GUARD_LOOK, name: 'Porcelain Guard', at: [-2.5, 236], yaw: 0, hidden: true },
  ],
  vehicles: [
    { id: 'ride', ...rideOf('vesper'), at: [VESPER_LOWRIDER.at[0], VESPER_LOWRIDER.at[1]], yaw: VESPER_LOWRIDER.yaw },
    { id: 'van', kind: 'hoa-van', at: DINER_APPROACH[0], yaw: 0, hidden: true },
  ],
  steps: [
    // 1. Hook: the player arrives at the booth and crosses their arms.
    cut(shot('player', 'mcu')),
    { do: 'sfx', id: 'chair', at: 'player', gain: 0.5, async: true },
    { do: 'gesture', who: 'player', name: 'crossArms', s: 0.6 },
    beat('beat'),
    // 2. Vesper at the booth, low, alone in frame; the first line carries his one villain stinger.
    cut(BOOTH.single('vesper', 'mcu', { height: 'low' })),
    { do: 'say', who: 'vesper', text: 'Please sit, friend. The Glazier would like to make you an offer.', hz: VESPER_HZ, stinger: 'villain' },
    { do: 'say', who: 'vesper', text: 'Hand over the Golden Acorn.', hz: VESPER_HZ },
    cut(BOOTH.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'shrug', s: 0.8, async: true },
    beat('beat'),
    { do: 'say', who: 'player', text: 'Go on.' },
    // 3. The rest of the offer, back on Vesper in a low single. No hat line: he buys, he does not threaten.
    cut(BOOTH.single('vesper', 'ms', { height: 'low' })),
    { do: 'say', who: 'vesper', text: 'Tansy\'s lien vanishes. A Patio Heights penthouse, astro-turf included.', hz: VESPER_HZ },
    { do: 'say', who: 'vesper', text: 'Full Kiln-Shield coverage. Zero-millimetre uniformity.', hz: VESPER_HZ },
    { do: 'say', who: 'vesper', text: 'Order over chaos, friend.', hz: VESPER_HZ },
    // 4. The refusal, after a silence with the music out.
    { do: 'music', track: null, fade: 0.6 },
    cut(BOOTH.single('player', 'mcu')),
    beat('pause'),
    { do: 'say', who: 'player', text: 'I\'ll keep the acorn.' },
    // 5. Vesper is not surprised: the turn. Danger stinger, the chase music.
    cut(BOOTH.single('vesper', 'mcu', { height: 'low' })),
    { do: 'say', who: 'vesper', text: 'A pity. Porcelain does not negotiate twice.', hz: VESPER_HZ, stinger: 'danger', music: 'chase' },
    // 6. The van rolls up to the blockade; its doors open; three guards step into the road.
    { do: 'spawn', id: 'van' },
    { do: 'cam', shot: spot('south-highway-diner', 'arrival') },
    { do: 'drive', vehicle: 'van', path: [DINER_APPROACH[1]], speed: 12 },
    { do: 'sfx', id: 'door', at: 'van' },
    { do: 'spawn', id: 'guard1', at: [-2.5, 236] },
    { do: 'spawn', id: 'guard2', at: [-2.5, 236] },
    { do: 'spawn', id: 'guard3', at: [-2.5, 236] },
    { do: 'walk', who: 'guard1', path: [[-6, 240]], run: true, async: true },
    { do: 'walk', who: 'guard2', path: [[6, 240]], run: true, async: true },
    { do: 'walk', who: 'guard3', path: [[0, 252]], run: true, async: true },
    // 7. Vesper is already in the pearl Lowrider that nobody is driving: lights, horn, and it leaves the blockade.
    { do: 'cam', shot: { kind: 'track', pos: up(36, 271, 3), who: 'ride', fov: 50 } },
    { do: 'despawn', id: 'vesper' },
    { do: 'lights', vehicle: 'ride', on: true },
    { do: 'horn', vehicle: 'ride' },
    { do: 'sfx', id: 'engine-rev', at: 'ride', gain: 0.5, async: true },
    { do: 'drive', vehicle: 'ride', path: [[30, 262], [8, 272], [-6.7, 270]], speed: 12, arrive: false, async: true },
    // 8. Button: the guards closing on the diner, the player inside the frame.
    { do: 'wait', s: 1.4 },
    cut(shot('player', 'mcu', { toward: 'guard3', side: 25 })),
    { do: 'face', who: 'player', at: 'guard3', s: 0.4 },
    { do: 'gesture', who: 'player', name: 'crossArms', s: 1.0 },
    beat('pause'),
  ],
};

export const CH2B_SCENES: Record<string, SceneScript> = {
  'vespers-offer-intro': VESPERS_OFFER_INTRO,
  'vesper-diner': VESPER_DINER,
};
