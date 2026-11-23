// Biscuit's Lost Squeaky Toy (Farmer Bramble). Biscuit is never shown: only his thumps, the shake, and everyone looking
// up. Golden sky, a tall-tale tone told in low, slow shots of the fields and the barn yard. Staged at granny-barn
// (quests/stages/cloverfield.ts): the intro in Bramble's combine, the payoff with the player's combine at the barn.
import type { SceneScript } from '../../script';
import { above, camOf, castRide, markOf, pathOf, stageCut, walkOf } from './kit';

const GRANNY = markOf('granny-barn', 'granny');
const PLAYER = markOf('granny-barn', 'player');
const SCARECROW = walkOf('granny-barn', 'hoa-inspector-stubble');
const ARRIVAL = camOf('granny-barn', 'arrival');

export const BISCUIT_HOTDOG_INTRO: SceneScript = {
  id: 'sq-biscuit-hotdog-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: "Biscuit's Lost Squeaky Toy",
  music: 'tension',
  ambience: 'wind',
  actors: [
    { id: 'you', player: true, at: PLAYER.at, yaw: PLAYER.yaw },
    { id: 'bramble', preset: 'bramble', seatedIn: 'combine', at: [0, 180], yaw: 0 },
    { id: 'granny', preset: 'granny', at: GRANNY.at, yaw: GRANNY.yaw },
    { id: 'extra1', name: 'Scarecrow Tender', look: { hat: 0x3a7d44, shirt: 0xd9c79e }, at: SCARECROW[0], yaw: Math.PI / 2 },
  ],
  vehicles: [castRide('bramble', 'combine', [0, 180], 0)],
  steps: [
    { do: 'cam', shot: stageCut('granny-barn', 'wide') },
    { do: 'caption', text: 'Cloverfield Farms. The clover is knee high, and it has stopped moving.' },
    // Bramble's combine comes down the south highway, the camera keeping up with it.
    { do: 'cam', shot: { kind: 'track', pos: ARRIVAL.pos, who: 'combine', fov: 40 } },
    { do: 'drive', vehicle: 'combine', path: pathOf('granny-barn', 'dew-approach'), speed: 8, async: true },
    { do: 'walk', who: 'extra1', path: [SCARECROW[1], SCARECROW[2]], speed: 0.9, async: true },
    { do: 'shake', amp: 0.02, s: 40 },
    { do: 'say', who: 'bramble', text: 'Don\'t look up. Just listen.' },
    { do: 'caption', text: null },
    { do: 'wait', s: 4.0 },
    { do: 'exit', who: 'bramble' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-56, 334, 1.5), look: 'granny', fov: 34 } },
    { do: 'say', who: 'granny', text: 'Bramble, you\'ve driven a combine into my yard again. The pies are cooling.' },
    { do: 'say', who: 'bramble', text: 'Biscuit dropped his squeaky hotdog in his own pawprint, out past the rows. Every bump since, it squeaks.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-56, 334, 1.5), look: 'you', fov: 34 } },
    { do: 'say', who: 'you', text: 'How loud is it?' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-44, 331, 1.5), look: 'bramble', fov: 36 } },
    { do: 'say', who: 'bramble', text: 'Loud enough to wake the Watch eighty units away. I\'ve been sleeping in the cellar since Tuesday.' },
    { do: 'say', who: 'granny', text: 'It\'s a fine toy. He\'s a good dog. He isn\'t careful.', stinger: 'comic' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-56, 334, 1.5), look: 'granny', fov: 34 } },
    { do: 'say', who: 'you', text: 'So you want it hauled back here?' },
    { do: 'say', who: 'bramble', text: 'Out of the crater, along the field, back to this barn. In a combine. In daylight. Don\'t look up.' },
    { do: 'cam', shot: { kind: 'dolly', from: above(-60, 340, 1.6), to: above(-62, 338, 1.8), look: 'granny', s: 6, fov: 30 } },
    { do: 'say', who: 'granny', text: 'Haul it here and I\'ll find it a buyer. Nobody asks what a giant\'s toy is worth.' },
    { do: 'say', who: 'you', text: 'I could take a taxi out there.' },
    { do: 'say', who: 'bramble', text: 'Mabel Kerbstone won\'t come out this far. She only knows the Central Bus Stop.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-34, 326, 1.4), look: 'granny', fov: 36 } },
    { do: 'say', who: 'granny', text: 'Bring it home and I\'ll bake you something the Watch can\'t find.' },
    { do: 'wait', s: 0.8 },
    { do: 'say', who: 'bramble', text: 'Now. Don\'t look up.' },
  ],
};

const HOTDOG = { id: 'hotdog', prefab: 'squeaky-hotdog-giant', at: [-31, 326] as [number, number], yaw: 0, size: 9, hidden: true };

export const BISCUIT_HOTDOG_OUTRO: SceneScript = {
  id: 'sq-biscuit-hotdog-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: 'Biscuit\'s Squeaky Toy, Home',
  music: 'tension',
  ambience: 'wind',
  actors: [
    { id: 'you', player: true, seatedIn: 'hauler', at: [-25, 340], yaw: 0 },
    { id: 'bramble', preset: 'bramble', at: markOf('granny-barn', 'bramble').at, yaw: markOf('granny-barn', 'bramble').yaw },
    { id: 'granny', preset: 'granny', at: GRANNY.at, yaw: GRANNY.yaw },
    { id: 'extra1', name: 'Scarecrow Tender', look: { hat: 0x3a7d44, shirt: 0xd9c79e }, at: SCARECROW[0], yaw: Math.PI / 2 },
  ],
  vehicles: [{ id: 'hauler', kind: 'combine', from: 'player', at: [-25, 340], yaw: Math.PI / 2 }],
  props: [HOTDOG],
  steps: [
    { do: 'cam', shot: stageCut('granny-barn', 'two-shot') },
    { do: 'exit', who: 'you' },
    { do: 'say', who: 'bramble', text: 'Gently. Gently. That\'s the squeaky one.' },
    // The hotdog slides off the back of the combine: one squeak, the whole yard hears it.
    { do: 'cam', shot: { kind: 'dolly', from: above(-17, 334, 2.0), to: above(-18, 333, 3.2), look: 'hotdog', s: 5, fov: 46 } },
    { do: 'spawn', id: 'hotdog' },
    { do: 'stinger', id: 'comic' },
    { do: 'sfx', id: 'bump', at: 'hotdog' },
    { do: 'shake', amp: 0.18, s: 0.6 },
    { do: 'caption', text: 'SQUEEEAK.' },
    { do: 'wait', s: 1.4 },
    { do: 'caption', text: null },
    { do: 'cam', shot: { kind: 'cut', pos: above(-60.5, 331.5, 1.0), look: 'granny', fov: 34 } },
    { do: 'say', who: 'granny', text: 'Put it by the barn, where the Hat Watch can see it and be sorry.' },
    { do: 'gesture', who: 'extra1', name: 'cheer', s: 1.4, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: above(-20, 344, 1.4), look: 'you', fov: 38 } },
    { do: 'say', who: 'you', text: 'It\'s bigger than the barn.' },
    // Thumps from far off. Everyone stops and looks up.
    { do: 'cam', shot: { kind: 'dolly', from: above(-36, 330, 1.2), to: above(-36, 330.5, 1.4), look: 'hotdog', s: 5, fov: 40 } },
    { do: 'sfx', id: 'thud', at: 'hotdog', async: true },
    { do: 'shake', amp: 0.25, s: 0.8 },
    { do: 'cam', shot: { kind: 'cut', pos: above(-46.3, 349.2, 0.5), look: 'bramble', fov: 40 } },
    { do: 'say', who: 'bramble', text: 'Don\'t look up.' },
    { do: 'cam', shot: { kind: 'dolly', from: above(-40, 340, 3), to: above(-40, 342, 4), look: [-30, 90, 300], s: 5, fov: 40 } },
    { do: 'wait', s: 1.0 },
    { do: 'sfx', id: 'thud', at: 'hotdog', async: true },
    { do: 'shake', amp: 0.3, s: 0.9 },
    { do: 'wait', s: 1.2 },
    // The thumps go away; the shake fades to nothing.
    { do: 'sfx', id: 'thud', gain: 0.4, async: true },
    { do: 'shake', amp: 0.08, s: 1.6 },
    { do: 'wait', s: 2.0 },
    { do: 'say', who: 'you', text: 'Is he gone?' },
    { do: 'say', who: 'bramble', text: 'Listen. He\'s walking away. Nobody move.' },
    { do: 'wait', s: 2.2 },
    { do: 'cam', shot: stageCut('granny-barn', 'two-shot') },
    { do: 'say', who: 'granny', text: 'Well. Every hat in the county just went up. Pie?' },
  ],
};

export const BISCUIT_HOTDOG_SCENES: SceneScript[] = [BISCUIT_HOTDOG_INTRO, BISCUIT_HOTDOG_OUTRO];
