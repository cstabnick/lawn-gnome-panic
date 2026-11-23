// Biscuit's Lost Squeaky Toy (Farmer Bramble). Biscuit is never shown: only his thumps, the shake, and everyone looking
// up. A rural tall tale with western dread: golden sky, `wind` ambience, `tension` under it, low slow shots of the
// yard. Staged at granny-barn (quests/stages/cloverfield.ts). Notes: docs/design/gnome-theft-auto/direction/scenes/.
import type { SceneScript } from '../../script';
import { beat, coverage, cut } from '../../direct';
import { above, castRide, markOf, stageCut, walkOf } from './kit';

const GRANNY = markOf('granny-barn', 'granny');
const BRAMBLE = markOf('granny-barn', 'bramble');
const PLAYER = markOf('granny-barn', 'player');
const SCARECROW = walkOf('granny-barn', 'hoa-inspector-stubble');
// Two-handers: Bramble whispers to the player; Granny calls across the yard to the player.
const BRAMBLE_TALK = coverage('bramble', 'you');
const GRAN_TALK = coverage('granny', 'you', 1, 50);
// A look straight up past the frame: the sky, where Biscuit would be. Nothing is shown.
const LOOK_UP_A = { kind: 'cut' as const, pos: above(-54, 346, 1.0), look: above(-54, 346, 30), fov: 50 };
const LOOK_UP_B = { kind: 'cut' as const, pos: above(-40, 344, 1.1), look: above(-40, 344, 30), fov: 50 };

export const BISCUIT_HOTDOG_INTRO: SceneScript = {
  id: 'sq-biscuit-hotdog-intro',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-biscuit-hotdog-intro.md' },
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: "Biscuit's Lost Squeaky Toy",
  music: 'tension',
  ambience: 'wind',
  actors: [
    { id: 'you', player: true, at: PLAYER.at, yaw: PLAYER.yaw },
    { id: 'bramble', preset: 'bramble', at: BRAMBLE.at, yaw: BRAMBLE.yaw },
    { id: 'granny', preset: 'granny', at: GRANNY.at, yaw: GRANNY.yaw },
    { id: 'extra1', name: 'Scarecrow Tender', look: { hat: 0x3a7d44, shirt: 0xd9c79e }, at: SCARECROW[0], yaw: Math.PI / 2 },
  ],
  // Bramble's own combine, parked where he leans on it (the quest's Combine stays parked for the whole scene).
  vehicles: [castRide('bramble', 'combine')],
  steps: [
    // 0. Hook: the Scarecrow Tender walks the verge under a still wide. No dialogue on the establishing shot.
    { do: 'cam', shot: stageCut('granny-barn', 'wide') },
    { do: 'walk', who: 'extra1', path: [SCARECROW[1], SCARECROW[2]], speed: 0.9, async: true },
    { do: 'wait', s: 2.5 },
    // 1. Setup: Bramble, low and close, whispers from beside his combine.
    { do: 'face', who: 'bramble', at: 'you', s: 0.3 },
    cut(BRAMBLE_TALK.single('bramble', 'mcu', { height: 'high' })),
    { do: 'say', who: 'bramble', text: 'Don\'t look up. Just listen.' },
    beat('beat'),
    { do: 'say', who: 'bramble', text: 'Biscuit lost his squeaky hotdog out past the rows.' },
    { do: 'face', who: 'you', at: 'bramble', s: 0.3 },
    cut(BRAMBLE_TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Where is it now?' },
    cut(BRAMBLE_TALK.single('bramble', 'mcu', { height: 'high' })),
    { do: 'say', who: 'bramble', text: 'Out past the crater. It squeaks when the wind moves.' },
    // 2. Granny, calm on her porch, pie as currency.
    cut(GRAN_TALK.single('granny', 'ms')),
    { do: 'say', who: 'granny', text: 'Sugar, Bramble has been sleeping in that cellar since Tuesday.' },
    { do: 'say', who: 'granny', text: 'Sit down. There is pie on the sill.' },
    cut(BRAMBLE_TALK.single('bramble', 'mcu', { height: 'high' })),
    { do: 'say', who: 'bramble', text: 'Loud enough to wake the Watch eighty units away.' },
    // 3. The turn: a thump from the south field. The music drops, everyone freezes and looks up.
    { do: 'music', track: null, fade: 0.4 },
    { do: 'gesture', who: 'granny', name: 'think', s: 1.2, async: true },
    { do: 'gesture', who: 'bramble', name: 'flinch', s: 1.0, async: true },
    { do: 'sfx', id: 'thud' },
    { do: 'shake', amp: 0.2, s: 0.8 },
    { do: 'stinger', id: 'danger' },
    cut(LOOK_UP_A),
    beat('silence'),
    // The objective, in Bramble's whisper: the job arrives with the fear.
    cut(BRAMBLE_TALK.single('bramble', 'mcu', { height: 'high' })),
    { do: 'say', who: 'bramble', text: 'Out of the crater, back to this barn. In a combine. In daylight.' },
    { do: 'face', who: 'you', at: 'bramble', s: 0.3 },
    cut(BRAMBLE_TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Fine. I will haul it.' },
    cut(GRAN_TALK.single('granny', 'ms')),
    { do: 'say', who: 'granny', text: 'Haul it here. Nobody asks what a giant\'s toy is worth.' },
    beat('pause'),
    // 4. Button: the next thump, and Bramble's last whisper.
    { do: 'music', track: 'tension', fade: 0.6 },
    cut(BRAMBLE_TALK.single('bramble', 'mcu', { height: 'high' })),
    { do: 'sfx', id: 'thud' },
    { do: 'shake', amp: 0.25, s: 0.9 },
    { do: 'say', who: 'bramble', text: 'Now. Don\'t look up.' },
    beat('pause'),
  ],
};

const HOTDOG = { id: 'hotdog', prefab: 'squeaky-hotdog-giant', at: [-31, 326] as [number, number], yaw: 0, size: 9, hidden: true };

export const BISCUIT_HOTDOG_OUTRO: SceneScript = {
  id: 'sq-biscuit-hotdog-outro',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-biscuit-hotdog-outro.md' },
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: "Biscuit's Squeaky Toy, Home",
  music: 'tension',
  ambience: 'wind',
  actors: [
    { id: 'you', player: true, seatedIn: 'hauler', at: [-25, 340], yaw: 0 },
    { id: 'bramble', preset: 'bramble', at: BRAMBLE.at, yaw: BRAMBLE.yaw },
    { id: 'granny', preset: 'granny', at: GRANNY.at, yaw: GRANNY.yaw },
    { id: 'extra1', name: 'Scarecrow Tender', look: { hat: 0x3a7d44, shirt: 0xd9c79e }, at: SCARECROW[0], yaw: Math.PI / 2 },
  ],
  vehicles: [{ id: 'hauler', kind: 'combine', from: 'player', at: [-25, 340], yaw: Math.PI / 2 }],
  props: [HOTDOG],
  steps: [
    // 0. Hook: the hotdog slides off the back of the hauler, one squeak across the yard. A wide, held short.
    { do: 'cam', shot: { kind: 'cut', pos: above(-12, 332, 2.2), look: above(-25, 340, 1.2), fov: 42 } },
    { do: 'exit', who: 'you', s: 0.8, async: true },
    { do: 'spawn', id: 'hotdog' },
    { do: 'stinger', id: 'comic' },
    { do: 'sfx', id: 'bump', at: 'hotdog' },
    { do: 'shake', amp: 0.18, s: 0.6 },
    { do: 'wait', s: 1.2 },
    // 1. Bramble, relieved and low; Granny from her porch.
    { do: 'face', who: 'bramble', at: 'you', s: 0.3 },
    cut(BRAMBLE_TALK.single('bramble', 'mcu', { height: 'high' })),
    { do: 'say', who: 'bramble', text: 'Gently. Gently. That is the squeaky one.' },
    cut(GRAN_TALK.single('granny', 'ms')),
    { do: 'say', who: 'granny', text: 'Put it by the barn, where the Watch can see it and be sorry.' },
    { do: 'face', who: 'you', at: 'bramble', s: 0.3 },
    cut(BRAMBLE_TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'It is bigger than the barn.' },
    // 2. The turn: a thump from far off. The music drops out, everyone freezes and looks up.
    { do: 'music', track: null, fade: 0.4 },
    { do: 'gesture', who: 'extra1', name: 'flinch', s: 1.0, async: true },
    { do: 'sfx', id: 'thud' },
    { do: 'shake', amp: 0.25, s: 0.8 },
    cut(LOOK_UP_B),
    beat('pause'),
    cut(BRAMBLE_TALK.single('bramble', 'mcu', { height: 'high' })),
    { do: 'say', who: 'bramble', text: 'Don\'t look up.' },
    { do: 'sfx', id: 'thud' },
    { do: 'shake', amp: 0.3, s: 0.9 },
    beat('beat'),
    // 3. The thumps get fainter: Biscuit walks off. The music comes back as the ground goes quiet.
    { do: 'sfx', id: 'thud', gain: 0.5 },
    { do: 'shake', amp: 0.1, s: 1.2 },
    { do: 'wait', s: 1.4 },
    { do: 'music', track: 'tension', fade: 1.2 },
    { do: 'sfx', id: 'thud', gain: 0.25 },
    { do: 'shake', amp: 0.04, s: 1.2 },
    { do: 'face', who: 'you', at: 'bramble', s: 0.3 },
    cut(BRAMBLE_TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Is he gone?' },
    cut(BRAMBLE_TALK.single('bramble', 'mcu', { height: 'high' })),
    { do: 'say', who: 'bramble', text: 'Listen. He is walking away. Nobody move.' },
    beat('pause'),
    // 4. Button: Granny's deadpan, the last image.
    cut(GRAN_TALK.single('granny', 'ms')),
    { do: 'say', who: 'granny', text: 'Well. Every hat in the county just went up. Pie?' },
  ],
};

export const BISCUIT_HOTDOG_SCENES: SceneScript[] = [BISCUIT_HOTDOG_INTRO, BISCUIT_HOTDOG_OUTRO];
