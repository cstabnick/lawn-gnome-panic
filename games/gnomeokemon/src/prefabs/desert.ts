import type { GnomeokemonEntry } from './types';

export const DESERT_GNOMEOKEMON: readonly GnomeokemonEntry[] = [
  {
    dex: '013',
    element: 'clay',
    region: 'Desert Yard',
    rank: 'Wild',
    family: 'Shelled',
    wants: 'Cool sand under a porch step and crunchy beetles.',
    prefab: {
      id: 'armadillan',
      name: 'Armadillan',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'clay', 'desert', 'armadillo', 'shelled', 'world2'],
      emoji: ['🦔', '🛡️'],
      tint: 'terracotta',
      trim: 'sand',
      pivots: {
        head: [0, 0.22, 0.2],
        tail: [0, 0.16, -0.24],
      },
      about: 'Desert Yard armored digger with banded terracotta shell plates and stout claws.',
      examine: [
        'In the dry yard beyond the Fence, armadillos took over the Mower\'s old patrol routes.',
        'When startled by a Pester Clod, it tucks into a clay bowling ball.',
        'Its shell bands rattle like stacked flowerpots whenever it trots across flagstones.',
        'Drop a treat in the sand and it snuffles it up before you can blink.',
      ],
      parts: [
        // Four stubby legs (bottom at y = 0)
        { s: 'cyl', d: [0.04, 0.045, 0.1], at: [0.11, 0.05, 0.12], c: 'clay-dark', mirror: true, name: 'leg-f' },
        { s: 'cyl', d: [0.04, 0.045, 0.1], at: [0.11, 0.05, -0.12], c: 'clay-dark', mirror: true, name: 'leg-b' },
        // Banded dome shell
        { s: 'ball', d: [0.21], at: [0, 0.22, -0.02], scale: [0.95, 0.8, 1.25], c: 'tint', name: 'shell' },
        { s: 'ring', d: [0.18, 0.024], at: [0, 0.21, 0.05], c: 'trim', name: 'band-1' },
        { s: 'ring', d: [0.19, 0.024], at: [0, 0.21, -0.06], c: 'trim', name: 'band-2' },
        // Head, snout & ears
        { s: 'cone', d: [0.09, 0.2], at: [0, 0.2, 0.28], rot: [82, 0, 0], c: 'trim', group: 'head', name: 'snout' },
        { s: 'ball', d: [0.025], at: [0, 0.21, 0.375], c: 'black', group: 'head', name: 'nose' },
        { s: 'cone', d: [0.035, 0.11], at: [0.07, 0.3, 0.21], rot: [15, 0, -18], c: 'clay-dark', mirror: true, group: 'head', name: 'ear' },
        { s: 'ball', d: [0.02], at: [0.055, 0.24, 0.28], c: 'black', mirror: true, group: 'head', name: 'eye' },
        // Armored tail
        { s: 'cone', d: [0.045, 0.22], at: [0, 0.15, -0.32], rot: [-78, 0, 0], c: 'tint', group: 'tail', name: 'tail' },
      ],
    },
  },
  {
    dex: '014',
    element: 'sun',
    region: 'Desert Yard',
    rank: 'Wild',
    family: 'Shelled',
    wants: 'A flat red rock at high noon to toast its belly.',
    prefab: {
      id: 'sunlizard',
      name: 'Sunlizard',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'sun', 'desert', 'lizard', 'reptile', 'world2'],
      emoji: ['🦎', '☀️'],
      tint: 'orange',
      trim: 'gold',
      pivots: {
        head: [0, 0.24, 0.2],
        tail: [0, 0.14, -0.22],
      },
      about: 'A quick-footed desert basking lizard with a sun-frill collar and amber eyes.',
      examine: [
        'Basks on adobe steps until its orange scales shimmer like kiln-glaze.',
        'When you blow the Gnome Flute, it puffs out its golden neck frill and bobs its head.',
        'Older gnomes call them "Little Sun-Keepers" because they always face the warmest wall.',
        'It can dart across a mesa shadow faster than a dropped marble.',
      ],
      parts: [
        // Splayed lizard legs (bottom at y = 0)
        { s: 'cyl', d: [0.03, 0.035, 0.14], at: [0.14, 0.06, 0.12], rot: [0, 0, -35], c: 'tint', mirror: true, name: 'leg-f' },
        { s: 'cyl', d: [0.03, 0.035, 0.14], at: [0.14, 0.06, -0.12], rot: [0, 0, -35], c: 'tint', mirror: true, name: 'leg-b' },
        // Sleek body
        { s: 'pill', d: [0.1, 0.24], at: [0, 0.16, 0], rot: [82, 0, 0], c: 'tint', name: 'body' },
        // Sun-frill collar
        { s: 'cyl', d: [0.17, 0.12, 0.03], at: [0, 0.23, 0.16], rot: [65, 0, 0], c: 'trim', group: 'head', name: 'frill' },
        // Head & glowing amber eyes
        { s: 'box', d: [0.13, 0.09, 0.17], at: [0, 0.25, 0.25], c: 'tint', group: 'head', name: 'head' },
        { s: 'ball', d: [0.025], at: [0.06, 0.27, 0.28], c: 'spark', glow: true, mirror: true, group: 'head', name: 'eye' },
        // Dorsal ridge spikes
        { s: 'cone', d: [0.028, 0.08], at: [0, 0.28, 0.05], c: 'trim', name: 'spike-1' },
        { s: 'cone', d: [0.025, 0.07], at: [0, 0.26, -0.05], c: 'trim', name: 'spike-2' },
        // Long curling tail
        { s: 'cone', d: [0.05, 0.34], at: [0, 0.15, -0.32], rot: [-75, 0, 0], c: 'tint', group: 'tail', name: 'tail' },
      ],
    },
  },
  {
    dex: '015',
    element: 'bloom',
    region: 'Desert Yard',
    rank: 'Wild',
    family: 'Plant',
    wants: 'One spoonful of rainwater a month and plenty of respect.',
    prefab: {
      id: 'cactuskin',
      name: 'Cactuskin',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'bloom', 'desert', 'cactus', 'plant', 'world2'],
      emoji: ['🌵', '🌺'],
      tint: 'leaf',
      trim: 'petal',
      pivots: {
        head: [0, 0.55, 0],
        arms: [0, 0.38, 0],
      },
      about: 'A prickly saguaro-gnome wearing clay boots and a bright desert blossom.',
      examine: [
        'Where moss-gnomes grow toadstools, Desert Yard gnomes sprout stubborn cacti.',
        'Its arms stay raised in permanent surprise, even when it is just taking a nap.',
        'The pink blossom on top opens widest right after a Gnome Flute tune.',
        'Do not hug it—not even if it looks lonely.',
      ],
      parts: [
        // Clay boots (bottom at y = 0)
        { s: 'box', d: [0.08, 0.08, 0.12], at: [0.08, 0.04, 0.02], c: 'clay', mirror: true, name: 'boot' },
        // Saguaro trunk
        { s: 'pill', d: [0.13, 0.36], at: [0, 0.34, 0], c: 'tint', name: 'trunk' },
        // Raised cactus arms
        { s: 'cyl', d: [0.05, 0.05, 0.18], at: [0.19, 0.36, 0], rot: [0, 0, 90], c: 'tint', mirror: true, group: 'arms', name: 'arm-horiz' },
        { s: 'pill', d: [0.05, 0.14], at: [0.26, 0.45, 0], c: 'tint', mirror: true, group: 'arms', name: 'arm-up' },
        // Eyes & grumpy mouth
        { s: 'ball', d: [0.024], at: [0.055, 0.48, 0.125], c: 'black', mirror: true, group: 'head', name: 'eye' },
        { s: 'box', d: [0.06, 0.015, 0.02], at: [0, 0.42, 0.13], c: 'wood-dark', group: 'head', name: 'mouth' },
        // Desert flower crown
        { s: 'cone', d: [0.08, 0.1], at: [0, 0.67, 0], rot: [180, 0, 0], c: 'trim', group: 'head', name: 'flower' },
        { s: 'ball', d: [0.032], at: [0, 0.72, 0], c: 'yellow', glow: true, group: 'head', name: 'pollen' },
      ],
    },
  },
  {
    dex: '016',
    element: 'sun',
    region: 'Desert Yard',
    rank: 'Elite',
    family: 'Plant',
    wants: 'A strong desert gust to roll it somewhere new.',
    prefab: {
      id: 'tumblewight',
      name: 'Tumblewight',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'sun', 'desert', 'tumbleweed', 'wind', 'world2'],
      emoji: ['🌾', '💨'],
      tint: 'straw',
      trim: 'spark',
      pivots: {
        core: [0, 0.36, 0],
      },
      about: 'A rolling thicket of dry desert brush with two glowing spark eyes inside.',
      examine: [
        'Nobody knows whether a gnome lives inside the twigs or the twigs learned to roll on their own.',
        'It drifts across the sand whenever the afternoon wind rises off the mesas.',
        'Throw a Pester Clod nearby and it spins like a wheel until it hits a cactus.',
        'Keep sparks away—it is basically a walking bundle of kindling.',
      ],
      parts: [
        // Tangled twig rings resting on y = 0
        { s: 'ring', d: [0.27, 0.03], at: [0, 0.36, 0], rot: [15, 0, 0], c: 'tint', group: 'core', name: 'twig-1' },
        { s: 'ring', d: [0.26, 0.028], at: [0, 0.36, 0], rot: [75, 45, 0], c: 'wood-light', group: 'core', name: 'twig-2' },
        { s: 'ring', d: [0.25, 0.028], at: [0, 0.36, 0], rot: [-45, 70, 20], c: 'bark', group: 'core', name: 'twig-3' },
        { s: 'ring', d: [0.2, 0.024], at: [0, 0.36, 0], rot: [40, -50, 60], c: 'tint', group: 'core', name: 'twig-4' },
        // Shadowy center & glowing spark eyes
        { s: 'ball', d: [0.13], at: [0, 0.36, 0], c: 'wood-dark', group: 'core', name: 'heart' },
        { s: 'ball', d: [0.032], at: [0.06, 0.38, 0.14], c: 'trim', glow: true, mirror: true, group: 'core', name: 'eye' },
      ],
    },
  },
];
