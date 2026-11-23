// The Snail-Racing Rigging (giver Shelldon "No-Trail" Mucilage): a spy thriller at snail height. Low cameras, slow
// creeping dollies, a heist track, whispered lines. The intro is in his dumpster alley at dawn, the swap is in the
// downtown slug paddock at night, and the photo finish is back in the alley (quests/stages/turfton.ts). The espresso
// slugs are pickled-slug props and the couriers are riding-snail props; a prop moves by a 'spawn' to a new place, so the
// race is stop-motion, which suits a snail. Director's notes: docs/design/gnome-theft-auto/direction/scenes/sq-snail-rigging-*.md
import type { SceneScript } from '../../script';
import { above, castRide, markOf, walkOf } from './kit';
import { beat, coverage, cut, exchangeLooks, reaction, shot } from '../../direct';

const ALLEY = 'shelldon-alley';
const PADDOCK = 'snail-paddock';
const SHELL = markOf(ALLEY, 'shelldon');
const ALLEY_PLAYER = markOf(ALLEY, 'player');
const WRANGLER = markOf(PADDOCK, 'slug-wrangler');
const BOOKIE = markOf(PADDOCK, 'slug-bookie');
const PADDOCK_PLAYER = markOf(PADDOCK, 'player');
const PEN_WALK = walkOf(PADDOCK, 'slug-wrangler');
const BOOKIE_WALK = walkOf(PADDOCK, 'slug-bookie');

// The intro's two-hander: Shelldon on the left of the line, the player on the right, every single on one side.
const TALK = coverage('shelldon', 'you', 1);
// The paddock exchange: the player and the wrangler, one side of their line.
const PEN = coverage('you', 'wrangler', 1);

export const SNAIL_RIGGING_INTRO: SceneScript = {
  id: 'sq-snail-rigging-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: 'Snail-Racing Rigging',
  music: 'heist',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-snail-rigging-intro.md' },
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
    // Hook: the dumpster lid knocks before a word is said. Then the camera creeps in at snail height over the grass.
    { do: 'sfx', id: 'knock' },
    ...exchangeLooks('shelldon', 'you'),
    { do: 'cam', shot: { kind: 'dolly', from: above(-95, 64, 0.5), to: above(-92, 66.5, 0.45), look: 'shelldon', s: 3, fov: 30 } },
    { do: 'wait', s: 2.5 },
    cut(TALK.single('shelldon', 'mcu', { height: 'low' })),
    { do: 'say', who: 'shelldon', text: 'Keep to the grass. The paving is listening.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'You sent a snail to find me.' },
    cut(TALK.single('shelldon', 'mcu', { height: 'low' })),
    { do: 'say', who: 'shelldon', text: 'Three snails. Only one was late, and he was late on purpose.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Espresso slugs. Lovely.' },
    cut(TALK.single('shelldon', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'shelldon', name: 'point', s: 1.4, async: true },
    { do: 'say', who: 'shelldon', text: 'The downtown slugs are on espresso. My couriers come back jittery.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'So I swap some bowls.' },
    cut(TALK.single('shelldon', 'mcu', { height: 'low' })),
    { do: 'say', who: 'shelldon', text: 'Decaf dandelion greens. The favourites sleep at the first bend.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Where do I go in?' },
    cut(TALK.single('shelldon', 'mcu', { height: 'low' })),
    { do: 'say', who: 'shelldon', text: 'Through the fence gap. Swap the bowl. Walk out.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Walk. Not run.' },
    cut(TALK.single('shelldon', 'mcu', { height: 'low' })),
    { do: 'say', who: 'shelldon', text: 'Running is how they know.' },
    // The turn: the lid knocks again. Shelldon freezes, the music drops out, the player asks.
    { do: 'sfx', id: 'knock' },
    { do: 'gesture', who: 'shelldon', name: 'flinch', s: 1.1, async: true },
    { do: 'music', track: null, fade: 0.6 },
    beat('pause'),
    { do: 'say', who: 'shelldon', text: 'Not the wind. The wind does not knock.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'What was that?' },
    cut(TALK.single('shelldon', 'mcu', { height: 'low' })),
    { do: 'say', who: 'shelldon', text: 'There is a tinfoil brim in it for you. Conspiracy grade.', stinger: 'mystery' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'What is the catch?' },
    // The button, deadpan, on his face at snail height.
    cut(TALK.single('shelldon', 'mcu', { height: 'low' })),
    { do: 'say', who: 'shelldon', text: 'The bookies. And the slugs. Mostly the bookies.' },
    beat('pause'),
  ],
};

export const SNAIL_RIGGING_SWAP: SceneScript = {
  id: 'sq-snail-rigging-swap',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'night',
  music: 'heist',
  ambience: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-snail-rigging-swap.md' },
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
    // Low and creeping: the bowl, the slugs, and the player going in through the fence.
    { do: 'cam', shot: { kind: 'dolly', from: above(18.5, -17, 0.35), to: above(20.5, -15.5, 0.35), look: above(24.8, -14.6, 0.2), s: 4, fov: 34 } },
    { do: 'walk', who: 'you', path: [[24.5, -14.5], [24.8, -13.2]], speed: 0.6, async: true },
    { do: 'walk', who: 'wrangler', path: PEN_WALK, speed: 0.9, async: true },
    { do: 'walk', who: 'bookie', path: BOOKIE_WALK, speed: 0.8, async: true },
    { do: 'wait', s: 3.5 },
    // The player talks to the slugs: a straight-on single, never the back of a hat.
    cut(shot('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Decaf dandelion. One bowl. Three seconds. Don\'t look at the slugs.' },
    // Insert: the slug that is not asleep.
    { do: 'cam', shot: { kind: 'cut', pos: above(27.8, -11, 0.5), look: 'slug1', fov: 40 } },
    { do: 'wait', s: 1.2 },
    // The turn: the whistle, and a held breath.
    { do: 'sfx', id: 'whistle', at: 'wrangler' },
    { do: 'stinger', id: 'danger' },
    beat('pause'),
    { do: 'face', who: 'wrangler', at: 'you', s: 0.35 },
    cut(PEN.single('wrangler', 'mcu')),
    { do: 'say', who: 'wrangler', text: 'Oi. Who\'s in the pen?' },
    cut(PEN.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Nobody. I\'m lettuce.' },
    { do: 'face', who: 'bookie', at: 'you', s: 0.35 },
    cut(shot('bookie', 'mcu', { toward: 'you' })),
    { do: 'say', who: 'bookie', text: 'Lettuce doesn\'t wear a hat.' },
    // The player legs it, a low track after them.
    { do: 'cam', shot: { kind: 'track', pos: above(20, -9, 1.6), who: 'you', fov: 42 } },
    { do: 'walk', who: 'you', path: [[24.2, -16.5], [22, -16.2], [12, -15], [2, -10]], speed: 4, run: true },
    { do: 'wait', s: 0.5 },
  ],
};

export const SNAIL_RIGGING_OUTRO: SceneScript = {
  id: 'sq-snail-rigging-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  title: 'Snail-Racing Rigging',
  music: 'heist',
  ambience: 'crowd',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-snail-rigging-outro.md' },
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
    // The race: the whistle is the hook, then a low creeping dolly alongside the track on the grass.
    { do: 'sfx', id: 'whistle' },
    { do: 'cam', shot: { kind: 'dolly', from: above(-95, 66.5, 0.5), to: above(-79, 66.5, 0.5), look: 'courier', s: 8, fov: 40 } },
    { do: 'walk', who: 'you', path: [[-70, 66.5], [-76.5, 68.5]], speed: 1.3, async: true },
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
    // Picture first: the finish line at snail height, a silence before the photo.
    { do: 'music', track: null, fade: 0.5 },
    { do: 'cam', shot: { kind: 'cut', pos: above(-74.5, 71.2, 0.4), look: above(-76.5, 71.2, 0.3), fov: 34 } },
    { do: 'gesture', who: 'fan1', name: 'cheer', s: 1.6, async: true },
    { do: 'gesture', who: 'fan2', name: 'cheer', s: 1.6, async: true },
    { do: 'stinger', id: 'triumph' },
    { do: 'say', who: 'Judge', text: 'Photo finish. The courier wins by the width of a whisker.' },
    // Shelldon's reaction, then the hand-over on the grass.
    { do: 'walk', who: 'shelldon', path: [[-78, 70.2]], speed: 1.0, async: true },
    { do: 'wait', s: 0.8 },
    ...exchangeLooks('shelldon', 'you'),
    cut(TALK.single('shelldon', 'mcu', { height: 'low' })),
    { do: 'say', who: 'shelldon', text: 'Two hundredths of a whisker. Victory. Wear this.' },
    { do: 'give', from: 'shelldon', to: 'you', prop: 'tinfoil-brim', s: 1.2 },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'What does it do?' },
    cut(TALK.single('shelldon', 'mcu', { height: 'low' })),
    { do: 'say', who: 'shelldon', text: 'It blocks the satellites that are not watching you.' },
    ...reaction('you', { hold: 'pause' }),
    // The button, his, deadpan, on his face. No walk-off.
    cut(TALK.single('shelldon', 'mcu', { height: 'low' })),
    { do: 'say', who: 'shelldon', text: 'Go home. Walk. The snails will tell me when you are done.' },
    beat('pause'),
  ],
};

export const SNAIL_RIGGING_SCENES: SceneScript[] = [SNAIL_RIGGING_INTRO, SNAIL_RIGGING_SWAP, SNAIL_RIGGING_OUTRO];
