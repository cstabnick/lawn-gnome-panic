// The Porcelain Support Group (Clara, the Tall House Porch): tender comedy. Golden light, a warm bed, a slow circling shot
// of the refugees and their overlapping bickering. The intro boards four refugees into Clara's Lowrider on the porch; the
// payoff lands the Lowrider at the padded bunker beside Unmowed Hollow (unmowed-hollow in quests/stages/wilds.ts).
import type { SceneScript } from '../../script';
import { above, castRide, markOf, stageCut, walkOf } from './kit';

const PORCH = 'tall-house-porch';
const HOLLOW = 'unmowed-hollow';
const CLARA = markOf(PORCH, 'clara');
const PLAYER = markOf(PORCH, 'player');
const CAR = castRide('clara', 'clara');

/** Four porcelain refugees, white-skinned, around the toaster altar (their marks on the porch). */
const REFUGEES = [
  { id: 'ref1', at: [-540, 49] as [number, number], yaw: -2.2, look: { skin: 0xfafafa, hat: 0xe4dccb, shirt: 0xd8d0c0 } },
  { id: 'ref2', at: [-546, 52] as [number, number], yaw: 2.8, look: { skin: 0xfafafa, hat: 0xeeeeee, shirt: 0xbfb6a6 } },
  { id: 'ref3', at: [-538, 44] as [number, number], yaw: -1.25, look: { skin: 0xfafafa, hat: 0xd9d2c3, shirt: 0xf0e8d8 } },
  { id: 'ref4', at: [-541, 40] as [number, number], yaw: -0.46, look: { skin: 0xfafafa, hat: 0xc9c2b2, shirt: 0xe6dfd0 } },
];

export const SQ_PORCELAIN_SUPPORT_INTRO: SceneScript = {
  id: 'sq-porcelain-support-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: 'The Porcelain Support Group',
  music: 'warm',
  ambience: 'wind',
  radio: 0,
  actors: [
    { id: 'you', player: true, at: PLAYER.at, yaw: PLAYER.yaw },
    { id: 'clara', preset: 'clara', name: 'Clara', at: CLARA.at, yaw: CLARA.yaw },
    ...REFUGEES.map((r, i) => ({
      id: r.id,
      name: 'Refugee',
      look: r.look,
      at: r.at,
      yaw: r.yaw,
      // The fourth refugee rides in the boot: hidden now, spawned at the bunker.
      ...(i === 3 ? { hidden: true } : {}),
    })),
  ],
  vehicles: [CAR],
  steps: [
    { do: 'cam', shot: stageCut(PORCH, 'wide') },
    // The altar argument, overlapping.
    { do: 'say', who: 'ref1', text: 'It is a Tall-One altar. Look at the way it sits on the table.' },
    { do: 'say', who: 'ref2', text: 'It is a toaster. It is warm. Warm is not holy.' },
    { do: 'cam', shot: { kind: 'orbit', around: 'clara', radius: 6, height: 2.2, fromYaw: 0, toYaw: Math.PI, s: 8 } },
    { do: 'say', who: 'ref3', text: 'It ticked at me.' },
    { do: 'gesture', who: 'ref2', name: 'facepalm', s: 1.2 },
    { do: 'say', who: 'clara', text: 'Everybody sit. Ticking is allowed here. Ticking is what toasters do.' },
    { do: 'cam', shot: stageCut(PORCH, 'two-shot') },
    { do: 'say', who: 'clara', text: 'Four of you, one Lowrider. Three in the seats, and the fourth goes in the back.' },
    { do: 'enter', who: 'ref1', vehicle: 'clara', seat: 1, async: true },
    { do: 'enter', who: 'ref2', vehicle: 'clara', seat: 2, async: true },
    { do: 'enter', who: 'ref3', vehicle: 'clara', seat: 3 },
    { do: 'say', who: 'Refugee', text: 'Where does the fourth one go?' },
    { do: 'say', who: 'clara', text: 'The boot. It is padded. He is fine, he is only a little sad.' },
    // The shock-absorbed ride: a slow look at the Lowrider's suspension, then the engine.
    { do: 'cam', shot: { kind: 'track', pos: above(-546, 30, 1.4), who: 'clara', fov: 42 } },
    { do: 'sfx', id: 'engine-rev', gain: 0.6 },
    { do: 'say', who: 'you', text: 'Under fifteen percent damage. I will drive like there are eggs in the back.' },
    { do: 'say', who: 'clara', text: 'There are. Mostly porcelain feelings. Padded bunker, Mossy Wood. The HOA filled the ponds, so it is the last dry place.' },
    { do: 'wait', s: 1.2 },
  ],
};

export const SQ_PORCELAIN_SUPPORT_OUTRO: SceneScript = {
  id: 'sq-porcelain-support-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  music: 'warm',
  ambience: 'forest',
  radio: 0,
  actors: [
    { id: 'you', player: true, seatedIn: 'lowrider', seat: 0, at: [-345, 34] },
    { id: 'ref1', name: 'Refugee', look: REFUGEES[0].look, seatedIn: 'lowrider', seat: 1, at: [-345, 34] },
    { id: 'ref2', name: 'Refugee', look: REFUGEES[1].look, seatedIn: 'lowrider', seat: 2, at: [-345, 34] },
    { id: 'ref3', name: 'Refugee', look: REFUGEES[2].look, seatedIn: 'lowrider', seat: 3, at: [-345, 34] },
    { id: 'ref4', name: 'Refugee', look: REFUGEES[3].look, hidden: true, at: [-344.5, 31] },
    { id: 'bracken', preset: 'bracken', at: [-356, 40], yaw: 2.36 },
  ],
  // The player's Lowrider if they drove it here; otherwise spawned at the bunker's fallback spot.
  // The player's Lowrider (in Clara's look when spawned) pulls in from the east track and parks short of the ring.
  vehicles: [castRide('clara', 'lowrider', [-326, 31], -Math.PI / 2, { from: 'player' })],
  props: [{ id: 'toaster', prefab: 'cursed-toaster', at: [-350, 30], yaw: 0, hidden: true }],
  steps: [
    { do: 'cam', shot: { kind: 'track', pos: above(-347, 26, 1.4), who: 'lowrider', fov: 44 } },
    { do: 'drive', vehicle: 'lowrider', path: [[-334, 32], [-342, 33]], speed: 4 },
    { do: 'exit', who: 'ref1', s: 2.2, async: true },
    { do: 'exit', who: 'ref2', s: 2.2, async: true },
    { do: 'exit', who: 'ref3', s: 2.2, async: true },
    { do: 'exit', who: 'you', s: 2.2 },
    { do: 'walk', who: 'ref1', path: [[-349, 36]], speed: 1.0, async: true },
    { do: 'walk', who: 'ref2', path: [[-348, 38]], speed: 1.0, async: true },
    { do: 'walk', who: 'ref3', path: [[-349.5, 34]], speed: 1.0, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: above(-350.5, 36.8, 1.3), look: 'bracken', fov: 38 } },
    { do: 'say', who: 'bracken', text: 'Sit. Mind the fire. Porcelain and campfires are a poor mix.' },
    { do: 'gesture', who: 'bracken', name: 'nod', s: 1.0 },
    { do: 'cam', shot: { kind: 'cut', pos: above(-354.5, 38.5, 1.4), look: 'ref1', fov: 40 } },
    { do: 'say', who: 'ref1', text: 'It is a bunker. It has a roof, and nothing in it rings.' },
    // The fourth one climbs out of the boot.
    { do: 'spawn', id: 'ref4' },
    { do: 'walk', who: 'ref4', path: [[-347, 33.5]], speed: 1.0 },
    { do: 'say', who: 'ref4', text: 'I was in the boot. It was dark and very honest.' },
    // The toaster gets a place of honour on a stone by the fire.
    { do: 'spawn', id: 'toaster' },
    { do: 'sfx', id: 'thud', gain: 0.4 },
    { do: 'cam', shot: { kind: 'cut', pos: above(-350.5, 36.8, 1.3), look: 'bracken', fov: 38 } },
    { do: 'say', who: 'bracken', text: 'A toaster on a stone. That is an altar now. Nobody argue with it.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-354.5, 38.5, 1.4), look: 'ref2', fov: 40 } },
    { do: 'say', who: 'ref2', text: 'Is it an altar, or a warm box?' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-350.5, 36.8, 1.3), look: 'bracken', fov: 34 } },
    { do: 'wait', s: 0.8 },
    { do: 'say', who: 'bracken', text: 'Yes.' },
    { do: 'cam', shot: { kind: 'dolly', from: above(-344, 30, 2.5), to: above(-340, 26, 5), look: [-351, 1.2, 36], s: 5 } },
    { do: 'say', who: 'ref3', text: 'So the theology is unresolved.' },
    { do: 'wait', s: 1.6 },
  ],
};

export const PORCELAIN_SUPPORT_SCENES: SceneScript[] = [SQ_PORCELAIN_SUPPORT_INTRO, SQ_PORCELAIN_SUPPORT_OUTRO];
