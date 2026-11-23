// Porcelain Blues (Clara, the Tall House Porch): hushed gothic. Night, candle light, a porch that must not be stepped off,
// porcelain chinks and a knock from inside the house. The intro and payoff are staged on the porch (tall-house-porch in
// quests/stages/wilds.ts); the ledger beat is a meanwhile at Vesper's counter (glaze-tax-office in quests/stages/turfton.ts).
import type { SceneScript } from '../../script';
import { above, castRide, markOf, stageCut, walkOf } from './kit';

const PORCH = 'tall-house-porch';
const OFFICE = 'glaze-tax-office';
const CLARA = markOf(PORCH, 'clara');
const PLAYER = markOf(PORCH, 'player');
const CLARA_PACE = walkOf(PORCH, 'clara');
const VESPER = markOf(OFFICE, 'vesper');
const CLERK = walkOf(OFFICE, 'clerk');

/** The three porch hooks (stage set dressing lanterns sit on the same spots). Scene copies start hidden. */
const LANTERNS = [
  { id: 'lantern-1', at: [-538, 36] as [number, number] },
  { id: 'lantern-2', at: [-536, 50] as [number, number] },
  { id: 'lantern-3', at: [-546, 30] as [number, number] },
];
const HOOK_PROPS = LANTERNS.map((l) => ({ id: l.id, prefab: 'porcelain-lantern', at: l.at, yaw: 0, hidden: true }));

export const SQ_PORCELAIN_BLUES_INTRO: SceneScript = {
  id: 'sq-porcelain-blues-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'night',
  title: 'Porcelain Blues',
  music: 'mystery',
  ambience: 'wind',
  radio: 0,
  actors: [
    { id: 'you', player: true, at: PLAYER.at, yaw: PLAYER.yaw },
    { id: 'clara', preset: 'clara', name: 'Clara', at: CLARA.at, yaw: CLARA.yaw, held: 'candle' },
    { id: 'ref1', name: 'Refugee', look: { skin: 0xfafafa, hat: 0xe4dccb, shirt: 0xd8d0c0 }, at: [-540, 49], yaw: -2.2, held: 'tin-pail' },
    { id: 'ref2', name: 'Refugee', look: { skin: 0xfafafa, hat: 0xeeeeee, shirt: 0xbfb6a6 }, at: [-546, 52], yaw: 2.8 },
  ],
  props: HOOK_PROPS,
  steps: [
    { do: 'cam', shot: stageCut(PORCH, 'wide') },
    { do: 'caption', text: 'Tall House Porch, Mossy Wood. The birds stopped fifty paces back.' },
    { do: 'walk', who: 'clara', path: CLARA_PACE, speed: 0.6, async: true },
    { do: 'walk', who: 'you', path: [[-538, 42]], speed: 1.2 },
    { do: 'caption', text: null },
    { do: 'cam', shot: stageCut(PORCH, 'two-shot') },
    { do: 'say', who: 'clara', text: 'Quietly, please. Porcelain does not glue back. One hard knock and I am a dustpan.' },
    { do: 'say', who: 'you', text: 'Lanterns?' },
    // The hooks, one at a time: Clara walks the boards with her candle to each empty one.
    { do: 'walk', who: 'clara', path: [[-538, 38]], speed: 0.5 },
    { do: 'cam', shot: { kind: 'cut', pos: above(-533, 35, 1.5), look: 'clara', fov: 36 } },
    { do: 'say', who: 'clara', text: 'Three lanterns, three hooks. Hung there since before the planks went up. Look closer.' },
    { do: 'gesture', who: 'clara', name: 'point', s: 1.2 },
    { do: 'say', who: 'clara', text: 'Wax copies. Unlit, and wrong. Someone swapped them with a sack and a ladder while I was counting the refugees.' },
    { do: 'wait', s: 0.8 },
    { do: 'cam', shot: stageCut(PORCH, 'close') },
    // Something inside the house knocks, once.
    { do: 'sfx', id: 'knock', gain: 0.7 },
    { do: 'shake', amp: 0.03, s: 0.8 },
    { do: 'say', who: 'ref1', text: 'It knocks when the lights go out.' },
    { do: 'say', who: 'clara', text: 'Don\'t. Listen first. It knocks once and then it waits, and that is worse.' },
    { do: 'cam', shot: stageCut(PORCH, 'two-shot') },
    { do: 'say', who: 'clara', text: 'Three HOA scavengers took them. Two out front in the mud, one up the Mossy Wood trail.' },
    { do: 'say', who: 'clara', text: 'Crack them, and bring every lantern back to this porch.' },
    { do: 'say', who: 'you', text: 'And if they won\'t hand them over?' },
    { do: 'say', who: 'clara', text: 'Then crack them. Gently is for porcelain. And not one lantern goes to Vesper Thorne. He keeps a shelf.' },
    { do: 'say', who: 'clara', text: 'Bring all three home and I will give you my Porcelain-Glaze Charm. It is the only thing I have never had cracked.' },
    { do: 'cam', shot: { kind: 'dolly', from: above(-537, 31, 1.6), to: above(-540, 31, 1.5), look: 'clara', s: 5, fov: 36 } },
    { do: 'wait', s: 1.5 },
  ],
};

export const SQ_PORCELAIN_BLUES_LEDGER: SceneScript = {
  id: 'sq-porcelain-blues-ledger',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  music: 'mystery',
  ambience: 'street',
  radio: 0,
  // Meanwhile: no player actor, the real player is somewhere else on the map.
  actors: [
    { id: 'vesper', preset: 'vesper', name: 'Vesper Thorne', at: VESPER.at, yaw: VESPER.yaw, held: 'ledger' },
    { id: 'clerk', name: 'Clerk', look: { hat: 0x7d8fa0, shirt: 0xe8e4da }, at: CLERK[0], yaw: Math.PI / 2 },
    { id: 'auditor', name: 'HOA Auditor', look: { hat: 0x4b5563, shirt: 0xc9b99b, glasses: true }, at: [20, -45], yaw: 0.5, held: 'ruler-stick' },
  ],
  vehicles: [castRide('vesper', 'vesper-car')],
  steps: [
    { do: 'cam', shot: stageCut(OFFICE, 'two-shot') },
    { do: 'walk', who: 'clerk', path: CLERK, speed: 0.9, async: true },
    { do: 'say', who: 'vesper', text: 'A scavenger\'s report. Three lanterns, two porch hooks, one trail. Nothing in it about the knocking.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(14, -47, 1.4), look: 'vesper', fov: 30 } },
    { do: 'wait', s: 1.0 },
    { do: 'say', who: 'auditor', text: 'Shall I send the van, sir?' },
    { do: 'say', who: 'vesper', text: 'Send the calipers. Vans are for things that can be dragged.' },
    { do: 'sfx', id: 'glass', gain: 0.35 },
    { do: 'cam', shot: stageCut(OFFICE, 'overhead') },
    { do: 'say', who: 'vesper', text: 'Porcelain belongs on a shelf.', stinger: 'mystery' },
    { do: 'wait', s: 1.5 },
  ],
};

export const SQ_PORCELAIN_BLUES_OUTRO: SceneScript = {
  id: 'sq-porcelain-blues-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'night',
  music: 'mystery',
  ambience: 'wind',
  radio: 0,
  actors: [
    { id: 'you', player: true, seatedIn: 'car', seat: 0, at: [-546, 28] },
    { id: 'clara', preset: 'clara', name: 'Clara', at: CLARA.at, yaw: CLARA.yaw, held: 'candle' },
  ],
  // The player's own vehicle if they drove back; otherwise a Lowrider is spawned at the porch's fallback spot.
  vehicles: [{ id: 'car', kind: 'lowrider', from: 'player', at: [-546, 28], yaw: Math.PI / 2 }],
  props: HOOK_PROPS,
  steps: [
    { do: 'cam', shot: { kind: 'track', pos: above(-538, 24, 2.2), who: 'car', fov: 40 } },
    { do: 'exit', who: 'you', s: 2.2 },
    { do: 'cam', shot: stageCut(PORCH, 'two-shot') },
    { do: 'say', who: 'clara', text: 'You came back. Nobody comes back from the Mossy Wood trail with all their hats.' },
    { do: 'caption', text: 'The lanterns go back up.' },
    // One by one: Clara walks to each hook, the lantern is hung, the first chink of glaze on wood.
    { do: 'walk', who: 'clara', path: [[-538, 38]], speed: 0.5 },
    { do: 'spawn', id: 'lantern-1' },
    { do: 'sfx', id: 'glass', gain: 0.3 },
    { do: 'say', who: 'clara', text: 'One.' },
    { do: 'walk', who: 'clara', path: [[-536, 48]], speed: 0.5 },
    { do: 'spawn', id: 'lantern-2' },
    { do: 'sfx', id: 'glass', gain: 0.3 },
    { do: 'say', who: 'clara', text: 'Two.' },
    { do: 'walk', who: 'clara', path: [[-547, 33]], speed: 0.5 },
    { do: 'spawn', id: 'lantern-3' },
    { do: 'sfx', id: 'glass', gain: 0.3 },
    { do: 'caption', text: null },
    { do: 'cam', shot: { kind: 'cut', pos: above(-530, 36, 1.8), look: 'lantern-3', fov: 40 } },
    { do: 'say', who: 'clara', text: 'Three. Look at them, all lit. Now the refugees can find the way home.' },
    { do: 'cam', shot: stageCut(PORCH, 'two-shot') },
    { do: 'say', who: 'clara', text: 'Take this for your trouble. A Porcelain-Glaze Charm. Keep it dry, and away from the toaster.' },
    // The house again, closer this time.
    { do: 'cam', shot: stageCut(PORCH, 'close') },
    { do: 'sfx', id: 'knock', gain: 0.85 },
    { do: 'shake', amp: 0.05, s: 1.0 },
    { do: 'stinger', id: 'mystery' },
    { do: 'say', who: 'clara', text: 'That was closer.' },
    { do: 'wait', s: 1.5 },
  ],
};

export const PORCELAIN_BLUES_SCENES: SceneScript[] = [SQ_PORCELAIN_BLUES_INTRO, SQ_PORCELAIN_BLUES_LEDGER, SQ_PORCELAIN_BLUES_OUTRO];
