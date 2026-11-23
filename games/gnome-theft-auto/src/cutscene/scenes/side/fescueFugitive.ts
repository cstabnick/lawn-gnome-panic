// The Fescue Fugitive (Elder Bracken): solemn folk ritual. Firelight at Unmowed Hollow, slow looks at the standing stones,
// chant-like measured lines. The stone is a replica from Vesper's Patio Heights gallery; Bracken treats it as holy, Granny
// treats it as a bid. Two endings: the stone back in the ring (Bracken, quest option A) or on Granny's scale (option B).
import type { SceneScript } from '../../script';
import { above, camOf, castRide, markOf, stageCut, walkOf } from './kit';

const HOLLOW = 'unmowed-hollow';
const GALLERY = 'patio-gallery';
const BARN = 'granny-barn';

// Unmowed Hollow (dusk): Bracken walks the ring, Sorrel sits by the booth-side mark, a jar-carrier fetches water.
const RING = walkOf(HOLLOW, 'bracken');
const SORREL = markOf(HOLLOW, 'sorrel');
const HOLLOW_PLAYER = markOf(HOLLOW, 'player');
const JARS = walkOf(HOLLOW, 'unmowed');
const HOLLOW_WIDE = camOf(HOLLOW, 'wide');
const HOLLOW_TWO = stageCut(HOLLOW, 'two-shot');

// Patio Heights gallery (dawn): the plinths, the porcelain guards on their walk.
const GALLERY_PLAYER = markOf(GALLERY, 'player');
const GUARDS = walkOf(GALLERY, 'hoa-bodyguard');

// Granny's barn (golden): her porch, Bramble's loop round the combine.
const PORCH = markOf(BARN, 'granny');
const BRAMBLE = walkOf(BARN, 'bramble');
const BARN_ARRIVAL = camOf(BARN, 'arrival');

const PORCELAIN_GUARD = { hat: 0x141418, shirt: 0xf8f8fa, pants: 0xf8f8fa, skin: 0xfafafa, beard: null } as const;

export const FESCUE_INTRO: SceneScript = {
  id: 'sq-fescue-fugitive-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: 'The Fescue Fugitive',
  music: 'mystery',
  ambience: 'forest',
  actors: [
    { id: 'you', player: true, at: HOLLOW_PLAYER.at, yaw: HOLLOW_PLAYER.yaw },
    { id: 'bracken', preset: 'bracken', at: RING[0], yaw: 0, held: null },
    { id: 'sorrel', preset: 'sorrel', at: SORREL.at, yaw: SORREL.yaw },
    { id: 'jars', name: 'Unmowed Jar-Carrier', look: { hat: 0x6b8e3a, shirt: 0x8a6a4a, beard: null }, at: JARS[0], yaw: 0 },
  ],
  steps: [
    // Dusk over the ring: a slow dolly out of the wide, then the walk of the stones.
    { do: 'cam', shot: { kind: 'dolly', from: HOLLOW_WIDE.pos, to: above(-336, 14, 24), look: HOLLOW_WIDE.look, s: 9, fov: 40 } },
    { do: 'caption', text: 'Unmowed Hollow, Mossy Wood. Dusk. Nothing here has been mown since the Planting.' },
    { do: 'walk', who: 'bracken', path: [RING[1], RING[2]], speed: 0.9, async: true },
    { do: 'walk', who: 'jars', path: [JARS[1], JARS[2], JARS[0]], speed: 1.1, async: true },
    { do: 'gesture', who: 'sorrel', name: 'sit', s: 0.2 },
    { do: 'caption', text: null },
    { do: 'walk', who: 'you', path: [[-343, 37], [-347, 38.5]], speed: 1.3, async: true },
    { do: 'walk', who: 'bracken', path: [[-362, 45.6], [-359.5, 44.6], [-358.3, 41], [-357.5, 38.6]], speed: 0.9 },
    { do: 'face', who: 'bracken', at: 'you', s: 0.6 },
    { do: 'cam', shot: { kind: 'dolly', from: above(-349.5, 37.8, 1.3), to: above(-351.5, 38.0, 1.25), look: 'bracken', s: 6, fov: 36 } },
    { do: 'say', who: 'bracken', text: 'Stop there. Don\'t step on the moss. That moss is older than your lawn.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-360, 39.2, 1.35), look: 'you', fov: 38 } },
    { do: 'say', who: 'you', text: 'I\'m here about a stone.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-351.5, 38.0, 1.25), look: 'bracken', fov: 34 } },
    { do: 'say', who: 'bracken', text: 'Everyone is here about a stone. Most of them want to sell it.' },
    // The replica, in the old man's words: a doorstop under a sprinkler.
    { do: 'cam', shot: { kind: 'cut', pos: above(-351.5, 38.0, 1.25), look: 'bracken', fov: 34 } },
    { do: 'say', who: 'bracken', text: 'Vesper Thorne keeps a Replica Stopping Stone as a doorstop. On his patio. Under a sprinkler.' },
    { do: 'say', who: 'you', text: 'A replica?' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-346.5, 40.2, 1.2), look: 'sorrel', fov: 36 } },
    { do: 'say', who: 'sorrel', text: 'Fescue Public Radio, eighty-eight point seven. We are the only station that says "replica" out loud.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-351.5, 38.0, 1.25), look: 'bracken', fov: 34 } },
    { do: 'say', who: 'bracken', text: 'A replica of something holy is not a doorstop. It is a question. Vesper is answering it wrong.' },
    // The job, in measured lines; the reward tease.
    { do: 'say', who: 'bracken', text: 'Go into his gallery, take it off the plinth, and bring it here before anyone notices a stone is missing.' },
    { do: 'say', who: 'you', text: 'What\'s the catch?' },
    { do: 'say', who: 'bracken', text: 'Granny Gnertrude will hear about it and bid. She always bids. Do not let her buy it with pie.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-346.5, 40.2, 1.2), look: 'sorrel', fov: 36 } },
    { do: 'say', who: 'sorrel', text: 'And Vesper\'s gallery collects Fescue relics. Nothing on that lawn is for sale, except everything.', stinger: 'mystery' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-351.5, 38.0, 1.25), look: 'bracken', fov: 34 } },
    { do: 'say', who: 'bracken', text: 'Six hundred and fifty acorns, and an old man\'s blessing. Spend the blessing on nothing with an engine.' },
    { do: 'cam', shot: { kind: 'dolly', from: above(-334, 44, 6.0), to: above(-330, 50, 18), look: [-352, 1.2, 37], s: 8, fov: 44 }, wait: true },
  ],
};

export const FESCUE_GALLERY: SceneScript = {
  id: 'sq-fescue-fugitive-gallery',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  music: 'mystery',
  ambience: 'street',
  actors: [
    { id: 'you', player: true, at: GALLERY_PLAYER.at, yaw: GALLERY_PLAYER.yaw },
    { id: 'guard1', name: 'Porcelain Guard', look: PORCELAIN_GUARD, at: GUARDS[0], yaw: 0 },
    { id: 'guard2', name: 'Porcelain Guard', look: PORCELAIN_GUARD, at: [166, -158], yaw: -Math.PI / 2 },
  ],
  steps: [
    { do: 'cam', shot: stageCut(GALLERY, 'wide') },
    { do: 'caption', text: 'The gallery placard: nothing on this lawn is for sale, except everything.' },
    { do: 'walk', who: 'you', path: [[146, -150], [144, -158]], speed: 1.4 },
    { do: 'caption', text: null },
    { do: 'cam', shot: { kind: 'track', pos: above(139, -149, 1.8), who: 'you', fov: 40 } },
    { do: 'say', who: 'guard1', text: 'Sir. Madam. Gnome. Are you on the list?' },
    { do: 'say', who: 'you', text: 'I\'m a visitor.' },
    { do: 'say', who: 'guard2', text: 'Visitors are on the list. You are not on the list.' },
    { do: 'walk', who: 'guard1', path: [GUARDS[1], GUARDS[0]], speed: 1.1, async: true },
    { do: 'gesture', who: 'guard2', name: 'crossArms', s: 2 },
    // The grab: the stone comes off the plinth, the alarm goes.
    { do: 'cam', shot: { kind: 'cut', pos: above(141, -157, 1.4), look: 'you', fov: 34 } },
    { do: 'sfx', id: 'steal', at: 'you' },
    { do: 'hold', who: 'you', prop: 'stopping-stone' },
    { do: 'stinger', id: 'danger' },
    { do: 'sfx', id: 'alarm' },
    { do: 'face', who: 'guard1', at: 'you', s: 0.3 },
    { do: 'say', who: 'guard1', text: 'Put that down. Porcelain does not glue back.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(139, -149, 1.8), look: 'you', fov: 40 } },
    // Granny on the line: off screen, naming her price.
    { do: 'say', who: 'Granny Gnertrude', text: 'Lovey. Five hundred acorns for that stone, cash, out of my pie cooler.', sfx: 'phone' },
    { do: 'say', who: 'you', text: 'Who is this?' },
    { do: 'say', who: 'Granny Gnertrude', text: 'Bring it to the hollow for a thank-you, or to my barn for cash. Choose quick, lovey. The guards are slow, not stupid.' },
  ],
};

export const FESCUE_HOLLOW: SceneScript = {
  id: 'sq-fescue-fugitive-hollow',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  music: 'sad',
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
    { do: 'cam', shot: { kind: 'track', pos: above(-325, 33, 1.8), who: 'ride', fov: 40 } },
    { do: 'caption', text: 'Unmowed Hollow. The stone comes home.' },
    { do: 'exit', who: 'you' },
    { do: 'walk', who: 'you', path: [[-340, 32], [-345, 36]], speed: 1.4 },
    { do: 'face', who: 'you', at: 'bracken', s: 0.4 },
    { do: 'caption', text: null },
    { do: 'cam', shot: { kind: 'cut', pos: above(-342.5, 34.6, 1.3), look: 'bracken', fov: 36 } },
    { do: 'say', who: 'you', text: 'It\'s a replica.' },
    { do: 'say', who: 'bracken', text: 'It is a replica of the thing that jammed the Mower. Give it here.' },
    { do: 'give', from: 'you', to: 'bracken', prop: 'stopping-stone', s: 1.2 },
    { do: 'walk', who: 'bracken', path: [[-349, 34]], speed: 0.8 },
    { do: 'hold', who: 'bracken', prop: null },
    { do: 'spawn', id: 'ring-stone' },
    { do: 'sfx', id: 'thud', at: 'ring-stone' },
    // The fire flares: the stone is set between the stones and the ring answers.
    { do: 'stinger', id: 'triumph' },
    { do: 'music', track: 'triumph', fade: 2 },
    { do: 'shake', amp: 0.2, s: 1.5 },
    { do: 'sfx', id: 'whoosh', at: 'fire' },
    { do: 'gesture', who: 'bracken', name: 'bow', s: 1.6 },
    { do: 'cam', shot: { kind: 'cut', pos: above(-346.5, 40.2, 1.2), look: 'sorrel', fov: 36 } },
    { do: 'say', who: 'sorrel', text: 'That is the stone, back in the ring. Eighty-eight point seven. Dial it in.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-342.5, 34.6, 1.3), look: 'bracken', fov: 36 } },
    { do: 'say', who: 'bracken', text: 'You drove here. I can smell the engine on you. Sit by the fire and be forgiven.' },
    { do: 'say', who: 'you', text: 'Thanks.' },
    { do: 'say', who: 'bracken', text: 'The blessing is yours. The acorns are under the moss. Mind the moss.' },
    { do: 'cam', shot: { kind: 'dolly', from: camOf(HOLLOW, 'two-shot').pos, to: above(-346, 22, 22), look: [-352, 1.2, 40], s: 8, fov: 44 }, wait: true },
  ],
};

export const FESCUE_GRANNY: SceneScript = {
  id: 'sq-fescue-fugitive-granny',
  stage: { kind: 'world' },
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
    { id: 'granny', preset: 'granny', at: PORCH.at, yaw: PORCH.yaw },
    { id: 'bramble', preset: 'bramble', at: BRAMBLE[0], yaw: 0 },
  ],
  steps: [
    { do: 'cam', shot: { kind: 'track', pos: BARN_ARRIVAL.pos, who: 'van', fov: 40 } },
    { do: 'caption', text: 'Granny Gnertrude\'s barn. Golden hour. The pumpkins have opinions.' },
    { do: 'drive', vehicle: 'van', path: [[-28, 330], [-42, 333]], speed: 6 },
    { do: 'exit', who: 'you' },
    { do: 'walk', who: 'you', path: [[-52, 333.5], [-58.5, 334]], speed: 1.6 },
    { do: 'walk', who: 'bramble', path: [BRAMBLE[1], BRAMBLE[2], BRAMBLE[3], BRAMBLE[0]], speed: 1.2, async: true },
    { do: 'caption', text: null },
    { do: 'cam', shot: stageCut(BARN, 'two-shot') },
    { do: 'gesture', who: 'granny', name: 'sit', s: 0.2 },
    { do: 'say', who: 'granny', text: 'You\'re the one with the stone. Don\'t drip on the porch.' },
    { do: 'say', who: 'you', text: 'It\'s a replica.' },
    { do: 'give', from: 'you', to: 'granny', prop: 'stopping-stone', s: 1.2 },
    { do: 'cam', shot: { kind: 'cut', pos: above(-60.5, 331.5, 1.0), look: 'granny', fov: 34 } },
    // The weigh-in: a hefted stone, a long look, then the laugh.
    { do: 'gesture', who: 'granny', name: 'shrug', s: 1.2 },
    { do: 'say', who: 'granny', text: 'Replica. Weighs like guilt.', stinger: 'comic' },
    { do: 'gesture', who: 'granny', name: 'cheer', s: 1.4 },
    { do: 'spawn', id: 'payout' },
    { do: 'sfx', id: 'cash', at: 'payout' },
    { do: 'cam', shot: stageCut(BARN, 'two-shot') },
    { do: 'say', who: 'granny', text: 'Five hundred acorns. Cash, out of the crate, and I\'m too old to carry either.' },
    { do: 'say', who: 'granny', text: 'Take a pie for the road. It\'s the only honest thing I sell.' },
    { do: 'cam', shot: { kind: 'dolly', from: camOf(BARN, 'wide').pos, to: above(-18, 326, 16), look: camOf(BARN, 'wide').look, s: 7, fov: 44 }, wait: true },
  ],
};

export const FESCUE_FUGITIVE_SCENES: SceneScript[] = [FESCUE_INTRO, FESCUE_GALLERY, FESCUE_HOLLOW, FESCUE_GRANNY];
