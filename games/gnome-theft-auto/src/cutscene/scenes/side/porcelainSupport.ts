// The Porcelain Support Group (Clara, the Tall House Porch): tender comedy. Golden light, a warm bed, a slow circling shot
// of the refugees and their overlapping bickering. The intro boards four refugees into Clara's Lowrider on the porch; the
// payoff lands the Lowrider at the padded bunker beside Unmowed Hollow (unmowed-hollow in quests/stages/wilds.ts).
// Direction notes: docs/design/gnome-theft-auto/direction/scenes/sq-porcelain-support-intro.md, ...-outro.md.
import type { SceneScript } from '../../script';
import { above, castRide, markOf, stageCut } from './kit';
import { beat, cut, shot } from '../../direct';

const PORCH = 'tall-house-porch';
const PLAYER = markOf(PORCH, 'player');
const CLARA = markOf(PORCH, 'clara');
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
    // Hook: a cup clinks on the altar table while the establishing wide holds (no dialogue on it).
    { do: 'sfx', id: 'glass', gain: 0.5 },
    cut(stageCut(PORCH, 'wide')),
    beat('pause'),
    beat('beat'),
    // The altar argument, straight and fast: one trait each. Ref1 devout, ref2 blunt, ref3 frightened.
    cut(shot('ref1', 'mcu', { toward: 'ref2', side: 25 })),
    { do: 'say', who: 'ref1', text: 'It is a Tall-One altar. Look at how it sits on the table.' },
    cut(shot('ref2', 'mcu', { toward: 'ref1', side: -25 })),
    { do: 'say', who: 'ref2', text: 'It is a toaster. It is warm. Warm is not holy.' },
    { do: 'gesture', who: 'ref2', name: 'facepalm', s: 1.2 },
    beat('beat'),
    cut(shot('ref3', 'mcu', { toward: 'ref1', side: -25 })),
    { do: 'say', who: 'ref3', text: 'It ticked at me.' },
    beat('tiny'),
    cut(shot('ref1', 'mcu', { toward: 'ref3', side: 25 })),
    { do: 'say', who: 'ref1', text: 'Ticking is how it prays.' },
    // Setup: what they want, by about 10 s.
    cut(shot('ref3', 'mcu', { toward: 'ref2' })),
    { do: 'say', who: 'ref3', text: 'I want the bunker. Nothing rings there.' },
    cut(shot('ref2', 'mcu', { toward: 'ref3', side: -25 })),
    { do: 'say', who: 'ref2', text: 'It is not praying. It is a warm box.' },
    beat('beat'),
    // The turn: the argument climbs, and Clara stops it. One held silence.
    cut(shot('ref1', 'mcu', { toward: 'ref2', side: 25 })),
    { do: 'say', who: 'ref1', text: 'You said that about the kettle.' },
    { do: 'music', track: null, fade: 1.0 },
    cut(shot('clara', 'mcu', { toward: 'ref1', side: -20 })),
    { do: 'say', who: 'clara', text: 'Please stop. All of you.' },
    beat('silence'),
    cut(shot('ref2', 'mcu', { toward: 'clara', side: -25 })),
    beat('pause'),
    cut(shot('clara', 'mcu', { toward: 'ref2', side: -20 })),
    { do: 'say', who: 'clara', text: 'You are frightened. That is allowed here.' },
    cut(shot('ref3', 'mcu', { toward: 'clara', side: -25 })),
    beat('pause'),
    { do: 'music', track: 'warm', fade: 1.0 },
    // The job, said gently.
    cut(shot('clara', 'mcu', { toward: 'ref3', side: -20 })),
    { do: 'say', who: 'clara', text: 'Four of you, one Lowrider. The bunker, before dark.' },
    { do: 'enter', who: 'ref1', vehicle: 'clara', seat: 1, async: true },
    { do: 'enter', who: 'ref2', vehicle: 'clara', seat: 2, async: true },
    { do: 'enter', who: 'ref3', vehicle: 'clara', seat: 3 },
    cut(shot('ref3', 'mcu', { toward: 'clara' })),
    { do: 'say', who: 'ref3', text: 'Where does the fourth one go?' },
    cut(shot('clara', 'mcu', { toward: 'ref3', side: -20 })),
    { do: 'say', who: 'clara', text: 'The boot. It is padded. He is only a little sad.' },
    // The Lowrider's suspension, then the engine.
    cut({ kind: 'track', pos: above(-546, 30, 1.4), who: 'clara', fov: 42 }),
    { do: 'sfx', id: 'engine-rev', gain: 0.6 },
    beat('pause'),
    cut(shot('you', 'mcu', { toward: 'clara' })),
    { do: 'say', who: 'you', text: 'Is the toaster coming?' },
    cut(shot('clara', 'mcu', { toward: 'you', side: -20 })),
    { do: 'say', who: 'clara', text: 'Yes. Nobody is left on the porch.' },
    beat('pause'),
    // Button: Clara's sincere look at the player.
    cut(shot('clara', 'mcu', { toward: 'you', side: -20 })),
    { do: 'say', who: 'clara', text: 'Thank you for coming for us.' },
    beat('pause'),
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
    // Hook: the engine as the Lowrider pulls in, the track on it.
    { do: 'sfx', id: 'engine-rev', gain: 0.5 },
    { do: 'cam', shot: { kind: 'track', pos: above(-347, 26, 1.4), who: 'lowrider', fov: 44 } },
    { do: 'drive', vehicle: 'lowrider', path: [[-334, 32], [-342, 33]], speed: 4 },
    { do: 'exit', who: 'ref1', s: 2.2, async: true },
    { do: 'exit', who: 'ref2', s: 2.2, async: true },
    { do: 'exit', who: 'ref3', s: 2.2, async: true },
    { do: 'exit', who: 'you', s: 2.2 },
    { do: 'walk', who: 'ref1', path: [[-349, 36]], speed: 1.0, async: true },
    { do: 'walk', who: 'ref2', path: [[-348, 38]], speed: 1.0, async: true },
    { do: 'walk', who: 'ref3', path: [[-349.5, 34]], speed: 1.0, async: true },
    // Bracken receives them low, gruff, accusations as statements.
    cut(shot('bracken', 'ms', { height: 'low', toward: 'ref1', side: -20 })),
    { do: 'say', who: 'bracken', text: 'You brought porcelain to my fire. Sit.' },
    cut(shot('ref1', 'mcu', { toward: 'bracken', side: -25 })),
    { do: 'say', who: 'ref1', text: 'It has a roof, and nothing in it rings.' },
    // The fourth one climbs out of the boot.
    { do: 'spawn', id: 'ref4' },
    { do: 'walk', who: 'ref4', path: [[-347, 33.5]], speed: 1.0 },
    cut(shot('ref4', 'mcu', { toward: 'ref1', side: 25 })),
    { do: 'say', who: 'ref4', text: 'I was in the boot. It was dark and very honest.' },
    // The toaster gets a place of honour on a stone by the fire.
    { do: 'spawn', id: 'toaster' },
    { do: 'sfx', id: 'thud', gain: 0.4 },
    cut(shot('bracken', 'mcu', { height: 'low', toward: 'ref2', side: -20 })),
    { do: 'say', who: 'bracken', text: 'A toaster on a stone. That is an altar now. Nobody argue with it.' },
    cut(shot('ref2', 'mcu', { toward: 'bracken', side: 25 })),
    { do: 'say', who: 'ref2', text: 'Is it an altar, or a warm box?' },
    cut(shot('bracken', 'mcu', { height: 'low', toward: 'ref2', side: -20 })),
    beat('beat'),
    { do: 'say', who: 'bracken', text: 'Yes.' },
    cut(shot('ref3', 'mcu', { toward: 'bracken', side: 25 })),
    { do: 'say', who: 'ref3', text: 'So the theology is unresolved.' },
    // The sincere close: the music goes, one held silence, then the toaster's owner's last look.
    { do: 'music', track: null, fade: 1.5 },
    beat('silence'),
    cut(shot('ref1', 'mcu', { toward: 'bracken', side: -25 })),
    { do: 'say', who: 'ref1', text: 'Thank you, Elder.' },
    beat('pause'),
  ],
};

export const PORCELAIN_SUPPORT_SCENES: SceneScript[] = [SQ_PORCELAIN_SUPPORT_INTRO, SQ_PORCELAIN_SUPPORT_OUTRO];
