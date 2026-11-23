// The Snail-Racing Rigging (giver Shelldon "No-Trail" Mucilage): a spy thriller at snail height. Low cameras, slow
// creeping dollies, a heist track, whispered lines. The intro is in his dumpster alley at dawn, the swap is in the
// downtown slug paddock at night, and the photo finish is back in the alley (quests/stages/turfton.ts). The espresso
// slugs are pickled-slug props and the couriers are riding-snail props; a prop moves by a 'spawn' to a new place, so the
// race is stop-motion, which suits a snail.
import type { SceneScript } from '../../script';
import { above, castRide, markOf, stageCut, walkOf } from './kit';

const ALLEY = 'shelldon-alley';
const PADDOCK = 'snail-paddock';
const SHELL = markOf(ALLEY, 'shelldon');
const ALLEY_PLAYER = markOf(ALLEY, 'player');
const LOOP = walkOf(ALLEY, 'shelldon');
const WRANGLER = markOf(PADDOCK, 'slug-wrangler');
const BOOKIE = markOf(PADDOCK, 'slug-bookie');
const PADDOCK_PLAYER = markOf(PADDOCK, 'player');
const PEN_WALK = walkOf(PADDOCK, 'slug-wrangler');
const BOOKIE_WALK = walkOf(PADDOCK, 'slug-bookie');

export const SNAIL_RIGGING_INTRO: SceneScript = {
  id: 'sq-snail-rigging-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: 'Snail-Racing Rigging',
  music: 'heist',
  ambience: 'street',
  actors: [
    { id: 'you', player: true, at: ALLEY_PLAYER.at, yaw: ALLEY_PLAYER.yaw },
    { id: 'shelldon', preset: 'shelldon', at: SHELL.at, yaw: SHELL.yaw, held: 'tin-pail' },
  ],
  vehicles: [castRide('shelldon', 'coach')],
  props: [
    { id: 'courier1', prefab: 'riding-snail', at: [-86.5, 75.5], yaw: 0.4, size: 0.5 },
    { id: 'courier2', prefab: 'riding-snail', at: [-88.5, 74.2], yaw: -0.8, size: 0.5 },
    { id: 'courier3', prefab: 'riding-snail', at: [-85.2, 73.6], yaw: 2.2, size: 0.5 },
  ],
  steps: [
    // Snail height: the camera creeps in over the grass, never on the paving.
    { do: 'cam', shot: { kind: 'dolly', from: above(-93, 64, 0.5), to: above(-90.5, 66.5, 0.45), look: 'shelldon', s: 8, fov: 30 } },
    { do: 'caption', text: 'Dumpster Alley, dawn. The snails are awake. Shelldon is awake. Nobody else is.' },
    { do: 'wait', s: 2 },
    { do: 'caption', text: null },
    // Shelldon feeds the couriers on his loop, keeping to the grass.
    { do: 'walk', who: 'shelldon', path: [LOOP[0], LOOP[1], LOOP[0]], speed: 0.8, async: true },
    { do: 'walk', who: 'you', path: [[-80, 71]], speed: 1.0, async: true },
    { do: 'say', who: 'shelldon', text: 'Keep to the grass. The paving is listening, and it has a very long memory for footprints.' },
    { do: 'say', who: 'you', text: 'You sent a snail to find me.' },
    { do: 'say', who: 'shelldon', text: 'Three snails. Only one was late, and he was late on purpose.' },
    { do: 'gesture', who: 'shelldon', name: 'point', s: 1.4, async: true },
    { do: 'say', who: 'shelldon', text: 'The downtown slug syndicate has been feeding its slugs espresso and dusting my couriers in every alley heat. One came back smelling of cappuccino.' },
    { do: 'say', who: 'shelldon', text: 'Swap their lettuce for decaf dandelion greens and the favourites go to sleep at the first bend.' },
    { do: 'say', who: 'you', text: 'So I walk into the paddock and swap some bowls.' },
    { do: 'say', who: 'shelldon', text: 'You walk in through the gap in the fence, swap the bowl, and walk out. Walk, not run. Running is how they know.' },
    { do: 'cam', shot: stageCut(ALLEY, 'overhead') },
    { do: 'say', who: 'shelldon', text: 'There is a tinfoil brim in it for you. Conspiracy grade. I have never once been struck by a satellite.', stinger: 'mystery' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-76, 67, 1.1), look: 'shelldon', fov: 34 } },
    { do: 'say', who: 'you', text: 'What is the catch?' },
    { do: 'say', who: 'shelldon', text: 'The bookies. And the slugs. Mostly the bookies.' },
    { do: 'cam', shot: stageCut(ALLEY, 'two-shot') },
    { do: 'wait', s: 1 },
  ],
};

export const SNAIL_RIGGING_SWAP: SceneScript = {
  id: 'sq-snail-rigging-swap',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'night',
  music: 'heist',
  ambience: 'night',
  actors: [
    { id: 'you', player: true, at: PADDOCK_PLAYER.at, yaw: PADDOCK_PLAYER.yaw, held: 'tin-pail' },
    { id: 'wrangler', name: 'Slug Wrangler', look: { hat: 0x6b4f2a, shirt: 0x8a6e3a }, at: WRANGLER.at, yaw: WRANGLER.yaw },
    { id: 'bookie', name: 'Slug Bookie', look: { hat: 0x1d1d1d, shirt: 0xb22222 }, at: BOOKIE.at, yaw: BOOKIE.yaw },
  ],
  props: [
    { id: 'slug1', prefab: 'pickled-slug', at: [26.2, -12.6], yaw: 0, size: 0.4 },
    { id: 'slug2', prefab: 'pickled-slug', at: [27.4, -11.2], yaw: 1.0, size: 0.4 },
  ],
  steps: [
    // Low and close: the bowl, the slugs, the bookie's eyes.
    { do: 'cam', shot: { kind: 'dolly', from: above(20.5, -16.5, 0.35), to: above(23.5, -13.5, 0.35), look: above(25.5, -12, 0.2), s: 6, fov: 34 } },
    { do: 'walk', who: 'wrangler', path: PEN_WALK, speed: 0.9, async: true },
    { do: 'walk', who: 'bookie', path: BOOKIE_WALK, speed: 0.8, async: true },
    { do: 'walk', who: 'you', path: [[24.5, -14.5], [24.8, -13.2]], speed: 0.9 },
    { do: 'cam', shot: { kind: 'cut', pos: above(21, -15.6, 1.6), look: 'you', fov: 36 } },
    { do: 'say', who: 'you', text: 'Decaf dandelion. One bowl. Three seconds. Don\'t look at the slugs.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(27.8, -11, 0.5), look: 'slug1', fov: 40 } },
    { do: 'wait', s: 1.2 },
    { do: 'sfx', id: 'whistle', at: 'wrangler' },
    { do: 'stinger', id: 'danger' },
    { do: 'cam', shot: { kind: 'cut', pos: above(25, -7.5, 1.7), look: 'wrangler', fov: 38 } },
    { do: 'say', who: 'wrangler', text: 'Oi. Who\'s in the pen?' },
    { do: 'cam', shot: { kind: 'cut', pos: above(21, -15.6, 1.6), look: 'you', fov: 36 } },
    { do: 'say', who: 'you', text: 'Nobody. I\'m lettuce.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(39.5, -14.5, 1.4), look: 'bookie', fov: 36 } },
    { do: 'say', who: 'bookie', text: 'Lettuce doesn\'t wear a hat.' },
    // The player legs it, a low track after them.
    { do: 'cam', shot: { kind: 'track', pos: above(15, -13.5, 1.6), who: 'you', fov: 42 } },
    { do: 'walk', who: 'you', path: [[22, -15.5], [12, -15], [2, -10]], speed: 4, run: true },
    { do: 'wait', s: 0.5 },
  ],
};

export const SNAIL_RIGGING_OUTRO: SceneScript = {
  id: 'sq-snail-rigging-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  title: 'Snail-Racing Rigging',
  music: 'triumph',
  ambience: 'crowd',
  actors: [
    { id: 'you', player: true, at: [-62, 64.5], yaw: -Math.PI / 2 },
    { id: 'shelldon', preset: 'shelldon', at: [-79.5, 74], yaw: Math.PI, held: 'tinfoil-brim' },
    { id: 'fan1', name: 'Snail Fan', look: { hat: 0x3a7d44, shirt: 0xd9c79e }, at: [-73.5, 74.5], yaw: -Math.PI / 2 },
    { id: 'fan2', name: 'Snail Fan', look: { hat: 0x8b1e3f, shirt: 0xe7e0c9 }, at: [-74, 68], yaw: -Math.PI / 2 },
  ],
  vehicles: [castRide('shelldon', 'coach')],
  props: [
    { id: 'courier', prefab: 'riding-snail', at: [-96, 70], yaw: Math.PI / 2, size: 1.2 },
    { id: 'slug', prefab: 'pickled-slug', at: [-96, 72.5], yaw: Math.PI / 2, size: 1.0 },
  ],
  steps: [
    // The heat, at snail height: a dolly crawls alongside the two of them on the grass.
    { do: 'cam', shot: { kind: 'dolly', from: above(-95, 66.5, 0.5), to: above(-79, 66.5, 0.5), look: 'courier', s: 9, fov: 40 } },
    { do: 'walk', who: 'you', path: [[-70, 66.5], [-76.5, 68.5]], speed: 1.3, async: true },
    { do: 'say', who: 'Judge', text: 'The race is under way. Snails do not believe in time, so nobody knows how long it lasts.', async: true },
    {
      do: 'parallel',
      tracks: [
        [
          { do: 'wait', s: 1.1 },
          { do: 'spawn', id: 'courier', at: [-91.0, 70] },
          { do: 'wait', s: 1.1 },
          { do: 'spawn', id: 'courier', at: [-88.0, 70] },
          { do: 'wait', s: 1.1 },
          { do: 'spawn', id: 'courier', at: [-85.0, 70] },
          { do: 'wait', s: 1.1 },
          { do: 'spawn', id: 'courier', at: [-82.0, 70] },
          { do: 'wait', s: 1.1 },
          { do: 'spawn', id: 'courier', at: [-79.0, 70] },
          { do: 'wait', s: 1.1 },
          { do: 'spawn', id: 'courier', at: [-76.0, 70] },
        ],
        [
          { do: 'wait', s: 1 },
          { do: 'spawn', id: 'slug', at: [-93, 72.5] },
          { do: 'wait', s: 1.4 },
          { do: 'spawn', id: 'slug', at: [-92.5, 72.5] },
          { do: 'wait', s: 0.8 },
          { do: 'spawn', id: 'slug', at: [-89, 72.5] },
          { do: 'wait', s: 1.5 },
          { do: 'spawn', id: 'slug', at: [-88.8, 72.5] },
          { do: 'wait', s: 0.9 },
          { do: 'spawn', id: 'slug', at: [-82, 72.5] },
          { do: 'wait', s: 1 },
          { do: 'spawn', id: 'slug', at: [-76.4, 72.5] },
        ],
      ],
    },
    { do: 'cam', shot: { kind: 'cut', pos: above(-74.5, 71.2, 0.4), look: above(-76.5, 71.2, 0.3), fov: 34 } },
    { do: 'gesture', who: 'fan1', name: 'cheer', s: 1.6, async: true },
    { do: 'gesture', who: 'fan2', name: 'cheer', s: 1.6, async: true },
    { do: 'stinger', id: 'triumph' },
    { do: 'say', who: 'Judge', text: 'Photo finish. The courier wins by the width of a whisker. Or a whisker\'s worth of slime.' },
    // Shelldon steps over (on the grass) for the hand-over.
    { do: 'walk', who: 'shelldon', path: [[-78, 70.2]], speed: 1.0 },
    { do: 'face', who: 'shelldon', at: 'you', s: 0.3, async: true },
    { do: 'face', who: 'you', at: 'shelldon', s: 0.3 },
    { do: 'cam', shot: { kind: 'cut', pos: above(-74.2, 70.8, 1.3), look: 'shelldon', fov: 36 } },
    { do: 'say', who: 'shelldon', text: 'Two hundredths of a whisker. Victory. Wear this.' },
    { do: 'give', from: 'shelldon', to: 'you', prop: 'tinfoil-brim', s: 1.2 },
    { do: 'cam', shot: { kind: 'cut', pos: above(-81.5, 70.6, 1.3), look: 'you', fov: 36 } },
    { do: 'say', who: 'you', text: 'What does it do?' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-74.2, 70.8, 1.3), look: 'shelldon', fov: 36 } },
    { do: 'say', who: 'shelldon', text: 'It is conspiracy grade. It blocks the satellites that are not watching you. I have never once been struck by one.' },
    { do: 'walk', who: 'shelldon', path: [[-84, 73], [-92, 73]], speed: 0.9, async: true },
    { do: 'say', who: 'shelldon', text: 'Go home. Walk. The snails will tell me when you are done.' },
    { do: 'wait', s: 1.2 },
  ],
};

export const SNAIL_RIGGING_SCENES: SceneScript[] = [SNAIL_RIGGING_INTRO, SNAIL_RIGGING_SWAP, SNAIL_RIGGING_OUTRO];
