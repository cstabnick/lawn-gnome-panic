// The Fescue Fugitive (Elder Bracken): solemn folk ritual. Firelight at Unmowed Hollow, slow looks at the standing stones,
// chant-like measured lines. The stone is a replica from Vesper's Patio Heights gallery; Bracken treats it as holy, Granny
// treats it as a bid. Two endings: the stone back in the ring (Bracken, quest option A) or on Granny's scale (option B).
// Re-directed against docs/design/gnome-theft-auto/direction/bible.md; notes per scene in
// docs/design/gnome-theft-auto/direction/scenes/sq-fescue-fugitive-*.md.
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { above, camOf, castRide, markOf, stageCut, walkOf } from './kit';

const HOLLOW = 'unmowed-hollow';
const GALLERY = 'patio-gallery';
const BARN = 'granny-barn';

// Unmowed Hollow (dusk): Bracken keeps the ring, Sorrel sits by the booth-side mark, a jar-carrier fetches water.
const SORREL = markOf(HOLLOW, 'sorrel');
const HOLLOW_PLAYER = markOf(HOLLOW, 'player');
const JARS = walkOf(HOLLOW, 'unmowed');

// Patio Heights gallery (dawn): the plinths, the porcelain guards.
const GALLERY_PLAYER = markOf(GALLERY, 'player');

// Granny's barn (golden): her porch, Bramble's loop round the combine.
const PORCH = markOf(BARN, 'granny');
const BRAMBLE = walkOf(BARN, 'bramble');
const BARN_ARRIVAL = camOf(BARN, 'arrival');

const PORCELAIN_GUARD = { hat: 0x141418, shirt: 0xf8f8fa, pants: 0xf8f8fa, skin: 0xfafafa, beard: null } as const;

/** Yaw that faces from `a` toward `b` (the convention every scene uses). */
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// The intro two-hander: Bracken keeps the ring's edge, the player stops on the moss line.
const BRACKEN_AT: Vec2 = [-357.5, 38.6];
const YOU_START: Vec2 = [-337, 37.5];
const YOU_AT: Vec2 = [-346, 38.5];
const TALK_RING = coverage('bracken', 'you', 1);

export const FESCUE_INTRO: SceneScript = {
  id: 'sq-fescue-fugitive-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: 'The Fescue Fugitive',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-fescue-fugitive-intro.md', kind: 'intro' },
  music: 'fescue',
  ambience: 'forest',
  actors: [
    { id: 'you', player: true, at: YOU_START, yaw: towards(YOU_START, BRACKEN_AT) },
    { id: 'bracken', preset: 'bracken', at: BRACKEN_AT, yaw: towards(BRACKEN_AT, YOU_START), held: null },
    { id: 'sorrel', preset: 'sorrel', at: SORREL.at, yaw: SORREL.yaw },
    { id: 'jars', name: 'Unmowed Jar-Carrier', look: { hat: 0x6b8e3a, shirt: 0x8a6a4a, beard: null }, at: JARS[0], yaw: 0 },
  ],
  steps: [
    // Hook: Bracken, low, at the moss line; the player walks up to him through the firelight.
    cut(shot('bracken', 'ms', { toward: 'you', side: 35, height: 'low' })),
    { do: 'walk', who: 'you', path: [YOU_AT], speed: 1.3, async: true },
    { do: 'walk', who: 'jars', path: [JARS[1], JARS[2], JARS[0]], speed: 1.1, async: true },
    { do: 'gesture', who: 'sorrel', name: 'sit', s: 0.2 },
    { do: 'say', who: 'bracken', text: 'Stop there. Don\'t step on the moss.' },
    cut(TALK_RING.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'I\'m here about a stone.' },
    cut(TALK_RING.single('bracken', 'mcu', { height: 'low' })),
    { do: 'say', who: 'bracken', text: 'Everyone is here about a stone. Most of them want to sell it.' },
    // Setup: the replica, in the old man's words, a doorstop under a sprinkler. Wider: his staff-straight outrage.
    cut(TALK_RING.single('bracken', 'ms', { height: 'low' })),
    { do: 'say', who: 'bracken', text: 'Vesper Thorne keeps a replica Stopping Stone as a doorstop. Under a sprinkler.' },
    cut(TALK_RING.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'A replica?' },
    cut(shot('sorrel', 'mcu', { toward: 'bracken', side: -30 })),
    { do: 'say', who: 'sorrel', text: 'Fescue Public Radio, eighty-eight point seven. We say "replica" out loud.' },
    // Turn: the old man's outrage becomes a question, then the job in measured lines.
    cut(TALK_RING.single('bracken', 'mcu', { height: 'low' })),
    { do: 'say', who: 'bracken', text: 'A replica of something holy is not a doorstop. It is a question.', stinger: 'mystery' },
    cut(TALK_RING.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'What\'s the job?' },
    cut(TALK_RING.single('bracken', 'mcu', { height: 'low' })),
    { do: 'say', who: 'bracken', text: 'Go into his gallery. Take the stone off the plinth.' },
    cut(TALK_RING.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'What\'s the catch?' },
    cut(TALK_RING.single('bracken', 'mcu', { height: 'low' })),
    { do: 'say', who: 'bracken', text: 'Granny Gnertrude will hear and bid. Do not let her buy it with pie.' },
    ...reaction('you', { toward: 'bracken', gesture: 'nod', size: 'mcu', side: -25, hold: 'pause' }),
    // Button: the reward, then the old man's last word on the car, held low.
    cut(TALK_RING.single('bracken', 'ms', { height: 'low' })),
    { do: 'say', who: 'bracken', text: 'Six hundred and fifty acorns, and an old man\'s blessing.' },
    cut(shot('bracken', 'cu', { toward: 'you', side: 25, height: 'low' })),
    { do: 'say', who: 'bracken', text: 'Spend the blessing on nothing with an engine.' },
    { do: 'wait', s: 2.5 },
  ],
};

// The gallery: the guards, the grab, Granny on the line, the run.
const GUARD1_AT: Vec2 = [141, -156];
const GUARD2_AT: Vec2 = [166, -158];
const PLAYER_END: Vec2 = [145, -151];
const TALK_GATE = coverage('guard1', 'you', 1);

export const FESCUE_GALLERY: SceneScript = {
  id: 'sq-fescue-fugitive-gallery',
  stage: { kind: 'world' },
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-fescue-fugitive-gallery.md', kind: 'arrival' },
  world: 'live',
  sky: 'golden',
  music: 'mystery',
  ambience: 'street',
  actors: [
    { id: 'you', player: true, at: GALLERY_PLAYER.at, yaw: towards(GALLERY_PLAYER.at, GUARD1_AT) },
    { id: 'guard1', name: 'Porcelain Guard', look: PORCELAIN_GUARD, at: GUARD1_AT, yaw: towards(GUARD1_AT, GALLERY_PLAYER.at) },
    { id: 'guard2', name: 'Porcelain Guard', look: PORCELAIN_GUARD, at: GUARD2_AT, yaw: -Math.PI / 2 },
  ],
  steps: [
    // Opening picture: the guards on the north wall, from low and in front, deadpan and symmetrical. No line yet.
    { do: 'cam', shot: { kind: 'cut', pos: above(152, -184, 1.0), look: above(153, -162, 1.3), fov: 40 } },
    { do: 'walk', who: 'you', path: [PLAYER_END], speed: 1.3, async: true },
    { do: 'wait', s: 1.5 },
    cut(TALK_GATE.single('guard1', 'mcu', { height: 'low' })),
    { do: 'say', who: 'guard1', text: 'Sir. Madam. Gnome. Are you on the list?' },
    cut(TALK_GATE.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'I\'m a visitor.' },
    cut(shot('guard2', 'mcu', { toward: 'you', side: 25, height: 'low' })),
    { do: 'say', who: 'guard2', text: 'Visitors are on the list. You are not on the list.' },
    { do: 'gesture', who: 'guard2', name: 'crossArms', s: 1 },
    // The grab: the stone comes off the plinth, the alarm goes.
    { do: 'cam', shot: { kind: 'cut', pos: above(150, -155, 1.4), look: 'you', fov: 34 } },
    { do: 'sfx', id: 'steal', at: 'you' },
    { do: 'hold', who: 'you', prop: 'stopping-stone' },
    { do: 'wait', s: 1.0 },
    { do: 'stinger', id: 'danger' },
    { do: 'sfx', id: 'alarm' },
    { do: 'face', who: 'guard1', at: 'you', s: 0.3 },
    cut(TALK_GATE.single('guard1', 'mcu', { height: 'low' })),
    { do: 'say', who: 'guard1', text: 'Put that down. That is a doorstop.' },
    cut(TALK_GATE.single('you', 'mcu')),
    // Granny on the line, off screen: two short lines, the choice said plainly.
    { do: 'say', who: 'Granny Gnertrude', text: 'Lovey. Five hundred acorns for that stone. Cash.', sfx: 'phone' },
    { do: 'say', who: 'you', text: 'Who is this?' },
    // While she talks, the guard closes in: the clock on the choice.
    { do: 'walk', who: 'guard1', path: [[143, -153.5]], speed: 0.9, async: true },
    cut(shot('guard1', 'ms', { toward: 'you', side: 20, height: 'low' })),
    { do: 'say', who: 'Granny Gnertrude', text: 'Bring it to the hollow for thanks, or my barn for cash.' },
    // Button: the player legs it, the alarm still going, the camera running with them.
    { do: 'cam', shot: { kind: 'track', pos: above(146, -140, 1.8), who: 'you', fov: 40 } },
    { do: 'sfx', id: 'alarm' },
    { do: 'walk', who: 'you', path: [[150, -138], [150, -118]], speed: 3.2, run: true, async: true },
    { do: 'wait', s: 2.5 },
  ],
};

const HOLLOW_TALK = coverage('bracken', 'you', 1);
const RING_STONE_AT: Vec2 = [-349, 34];

export const FESCUE_HOLLOW: SceneScript = {
  id: 'sq-fescue-fugitive-hollow',
  stage: { kind: 'world' },
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-fescue-fugitive-hollow.md', kind: 'outro' },
  world: 'live',
  sky: 'golden',
  music: 'fescue',
  ambience: 'forest',
  vehicles: [{ id: 'ride', kind: 'lowrider', from: 'player', at: [-332, 26], yaw: -1.15 }],
  props: [
    { id: 'fire', prefab: 'campfire', at: [-352, 36] },
    { id: 'ring-stone', prefab: 'stopping-stone', at: [-349, 33], hidden: true },
  ],
  actors: [
    { id: 'you', player: true, at: [-332, 26], seatedIn: 'ride', seat: 0 },
    { id: 'bracken', preset: 'bracken', at: [-349, 38.5], yaw: Math.PI / 2 + 0.4, held: null },
    { id: 'sorrel', preset: 'sorrel', at: SORREL.at, yaw: SORREL.yaw },
    { id: 'jars', name: 'Unmowed Jar-Carrier', look: { hat: 0x6b8e3a, shirt: 0x8a6a4a, beard: null }, at: JARS[0], yaw: 0 },
  ],
  steps: [
    // Hook: the fire and Bracken, low, as the player climbs out of the lowrider.
    cut(shot('bracken', 'ms', { toward: 'you', side: 40, height: 'low' })),
    { do: 'exit', who: 'you' },
    { do: 'cam', shot: { kind: 'track', pos: above(-343, 29.5, 1.4), who: 'you', fov: 40 } },
    { do: 'walk', who: 'you', path: [[-340, 32], [-345, 36]], speed: 1.6 },
    { do: 'face', who: 'you', at: 'bracken', s: 0.4 },
    cut(HOLLOW_TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'It\'s a replica.' },
    cut(HOLLOW_TALK.single('bracken', 'mcu', { height: 'low' })),
    { do: 'say', who: 'bracken', text: 'It is a replica of the thing that jammed the Mower. Give it here.' },
    cut(shot('bracken', 'fs', { toward: 'you', side: 60, height: 'low' })),
    { do: 'give', from: 'you', to: 'bracken', prop: 'stopping-stone', s: 1.2 },
    { do: 'walk', who: 'bracken', path: [RING_STONE_AT], speed: 0.8 },
    // The stone is set in the ring: an insert, a thud, then the fire flares and the ring answers.
    { do: 'cam', shot: { kind: 'cut', pos: above(-346.4, 31.2, 0.7), look: above(-349, 33, 0.35), fov: 38 } },
    { do: 'hold', who: 'bracken', prop: null },
    { do: 'spawn', id: 'ring-stone' },
    { do: 'sfx', id: 'thud', at: 'ring-stone' },
    { do: 'stinger', id: 'triumph' },
    { do: 'shake', amp: 0.02, s: 1.5 },
    { do: 'sfx', id: 'whoosh', at: 'fire' },
    { do: 'wait', s: 1.2 },
    cut(shot('bracken', 'ms', { toward: 'you', side: 40, height: 'low' })),
    { do: 'gesture', who: 'bracken', name: 'bow', s: 1.6 },
    cut(shot('sorrel', 'mcu', { toward: 'bracken', side: -30 })),
    { do: 'say', who: 'sorrel', text: 'That is the stone, back in the ring. Eighty-eight point seven. Dial it in.' },
    // Forgiveness: the heart of the scene, split under 16 words, then a held silence.
    cut(HOLLOW_TALK.single('bracken', 'mcu', { height: 'low' })),
    { do: 'say', who: 'bracken', text: 'You drove here. I can smell the engine on you.' },
    { do: 'say', who: 'bracken', text: 'Sit by the fire and be forgiven.' },
    cut(HOLLOW_TALK.single('you', 'mcu')),
    beat('silence'),
    { do: 'say', who: 'you', text: 'Thanks.' },
    cut(HOLLOW_TALK.single('bracken', 'mcu', { height: 'low' })),
    { do: 'say', who: 'bracken', text: 'The blessing is yours. The acorns are under the moss.' },
    // Button: Bracken low and close, the last word, then the ring holds still.
    cut(shot('bracken', 'cu', { toward: 'you', side: 25, height: 'low' })),
    { do: 'say', who: 'bracken', text: 'Mind the moss.' },
    { do: 'wait', s: 2.5 },
  ],
};

const BARN_TALK = coverage('granny', 'you', 1);

export const FESCUE_GRANNY: SceneScript = {
  id: 'sq-fescue-fugitive-granny',
  stage: { kind: 'world' },
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-fescue-fugitive-granny.md', kind: 'outro' },
  world: 'live',
  sky: 'golden',
  music: 'warm',
  ambience: 'wind',
  vehicles: [
    { id: 'van', kind: 'ride-on', from: 'player', at: [-12, 328], yaw: -Math.PI / 2 - 0.1 },
    castRide('granny', 'ride'),
  ],
  props: [{ id: 'payout', prefab: 'crate', at: [-74, 336], hidden: true }],
  actors: [
    { id: 'you', player: true, at: [-12, 328], seatedIn: 'van', seat: 0 },
    { id: 'granny', preset: 'granny', at: [PORCH.at[0] + 1.6, PORCH.at[1] + 0.4], yaw: PORCH.yaw },
    { id: 'bramble', preset: 'bramble', at: BRAMBLE[0], yaw: 0 },
  ],
  steps: [
    // Hook: Granny on the porch, already watching the lane, before the van is even in the yard.
    cut(shot('granny', 'ms', { toward: 'you', side: 30 })),
    { do: 'wait', s: 1.2 },
    { do: 'cam', shot: { kind: 'track', pos: BARN_ARRIVAL.pos, who: 'van', fov: 40 } },
    { do: 'drive', vehicle: 'van', path: [[-28, 330], [-46, 333.5]], speed: 6 },
    { do: 'exit', who: 'you' },
    cut(shot('granny', 'ms', { toward: 'you', side: 30 })),
    { do: 'walk', who: 'you', path: [[-52, 333.8], [-58.5, 334]], speed: 1.8 },
    { do: 'walk', who: 'bramble', path: [BRAMBLE[1], BRAMBLE[2], BRAMBLE[3], BRAMBLE[0]], speed: 1.2, async: true },
    cut(BARN_TALK.single('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'You\'re the one with the stone. Don\'t drip on the porch.' },
    cut(BARN_TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'It\'s a replica.' },
    { do: 'give', from: 'you', to: 'granny', prop: 'stopping-stone', s: 1.2 },
    // The weigh-in: she hefts it, it is clearly too light, the one comic stinger of the scene.
    cut(BARN_TALK.single('granny', 'mcu')),
    { do: 'gesture', who: 'granny', name: 'shrug', s: 1.2 },
    { do: 'say', who: 'granny', text: 'Replica. Weighs like guilt.', stinger: 'comic' },
    { do: 'gesture', who: 'granny', name: 'cheer', s: 1.4 },
    { do: 'cam', shot: { kind: 'cut', pos: above(-71.5, 337.5, 0.9), look: above(-74, 336, 0.4), fov: 40 } },
    { do: 'spawn', id: 'payout' },
    { do: 'sfx', id: 'cash', at: 'payout' },
    { do: 'wait', s: 1.0 },
    cut(BARN_TALK.single('granny', 'ms')),
    { do: 'say', who: 'granny', text: 'Five hundred acorns. Cash, out of the crate. I\'m too old to lift it.' },
    ...reaction('you', { toward: 'granny', gesture: 'nod', size: 'mcu', side: -25, hold: 'pause' }),
    // Button: her single, the pie as currency, held.
    cut(BARN_TALK.single('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'Take a pie for the road. It\'s the only honest thing I sell.' },
    { do: 'wait', s: 1.8 },
  ],
};

export const FESCUE_FUGITIVE_SCENES: SceneScript[] = [FESCUE_INTRO, FESCUE_GALLERY, FESCUE_HOLLOW, FESCUE_GRANNY];
