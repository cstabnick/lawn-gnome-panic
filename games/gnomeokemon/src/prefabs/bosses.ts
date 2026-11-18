import type { GnomeokemonEntry } from './types';

export const BOSS_GNOMEOKEMON: readonly GnomeokemonEntry[] = [
  {
    dex: '010',
    element: 'clay',
    region: 'The Rockery',
    rank: 'Elite',
    family: 'Unfired clay',
    wants: 'To be finished in the Kiln.',
    prefab: {
      id: 'unfired',
      name: 'The Unfired',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'clay', 'rockery', 'unfired', 'kiln', 'elite'],
      emoji: ['🏺', '🕯️'],
      tint: 'chalk',
      trim: 'flame',
      pivots: {
        head: [0, 0.56, 0],
        core: [0, 0.34, 0.04],
      },
      about: 'A pale raw-clay gnome that left the Kiln too early, holding a warm ember core inside.',
      examine: [
        'Its damp chalky skin still shows thumbprints where a potter stopped halfway.',
        'Through the crack in its chest, a patient ember waits for a proper firing.',
        'It never drops coin—only a soft sigh like wet clay settling on a wheel.',
        'Rain makes it heavy and slow; Sun hardens its outer shell for a moment.',
      ],
      parts: [
        // Heavy raw-clay feet (bottom at y = 0)
        { s: 'cyl', d: [0.06, 0.075, 0.14], at: [0.1, 0.07, 0.02], c: 'sand', mirror: true, name: 'leg' },
        // Cracked hollow torso (left/right halves so the ember core glows inside)
        { s: 'box', d: [0.13, 0.3, 0.2], at: [0.095, 0.29, 0], c: 'tint', mirror: true, name: 'torso-half' },
        { s: 'box', d: [0.16, 0.3, 0.1], at: [0, 0.29, -0.07], c: 'stone', name: 'backplate' },
        // Glowing kiln-ember core inside the chest
        { s: 'ball', d: [0.075], at: [0, 0.31, 0.04], c: 'trim', glow: true, group: 'core', name: 'ember-core' },
        // Asymmetric sculpted arms
        { s: 'pill', d: [0.045, 0.18], at: [0.21, 0.3, 0.04], rot: [15, 0, -18], c: 'tint', name: 'arm-right' },
        { s: 'cyl', d: [0.04, 0.05, 0.18], at: [-0.2, 0.32, 0.02], rot: [0, 0, 22], c: 'sand', name: 'arm-left' },
        // Half-shaped clay head
        { s: 'ball', d: [0.14], at: [0, 0.56, 0], scale: [0.95, 1.05, 0.95], c: 'tint', group: 'head', name: 'head' },
        // Pinched unfinished hat-cone
        { s: 'cone', d: [0.13, 0.22], at: [0.01, 0.75, -0.01], rot: [-6, 0, -10], c: 'sand', group: 'head', name: 'hat' },
        // Hollow dark eyes
        { s: 'ball', d: [0.026], at: [0.055, 0.57, 0.125], c: 'stone-dark', mirror: true, group: 'head', name: 'eye' },
      ],
    },
  },
  {
    dex: '011',
    element: 'clay',
    region: 'Mossbottom Vale',
    rank: 'Boss',
    family: 'Furred',
    wants: 'To lead his clan south, away from the shaking.',
    prefab: {
      id: 'grubthorn',
      name: 'Grubthorn',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'clay', 'mossbottom', 'mole', 'boss', 'king'],
      emoji: ['👑', '🐾'],
      tint: 'fur',
      trim: 'gold',
      pivots: {
        head: [0, 0.42, 0.14],
        claws: [0, 0.22, 0.22],
      },
      about: 'Mole King of Mossbottom: broad-shouldered burrower with iron digging claws and a brass crown.',
      examine: [
        'His crooked crown is a dented brass curtain ring he won from a magpie.',
        'Each shovel-paw can tunnel through packed clay faster than three Wardens with spades.',
        'He only fought the villages because the northern tremors drove his whole clan underground.',
        'Last words at the burrow mouth: "We weren\'t attacking. We were running."',
      ],
      parts: [
        // Thick hind feet (bottom at y = 0)
        { s: 'box', d: [0.12, 0.07, 0.16], at: [0.14, 0.035, -0.04], c: 'leather-dark', mirror: true, name: 'foot' },
        // Broad furred body
        { s: 'ball', d: [0.27], at: [0, 0.28, -0.02], scale: [1.1, 0.95, 1.05], c: 'tint', name: 'body' },
        { s: 'ball', d: [0.19], at: [0, 0.25, 0.12], scale: [0.95, 0.9, 0.65], c: 'burlap', name: 'belly' },
        // Mole head & pink star-snout
        { s: 'ball', d: [0.16], at: [0, 0.48, 0.12], scale: [1.05, 0.9, 1.1], c: 'tint', group: 'head', name: 'head' },
        { s: 'cone', d: [0.06, 0.12], at: [0, 0.46, 0.29], rot: [90, 0, 0], c: 'petal', group: 'head', name: 'snout' },
        // Tiny squinted mole eyes
        { s: 'ball', d: [0.02], at: [0.065, 0.52, 0.25], c: 'black', mirror: true, group: 'head', name: 'eye' },
        // Crooked Mole King crown
        { s: 'ring', d: [0.1, 0.024], at: [0, 0.63, 0.1], rot: [82, 0, 10], c: 'trim', group: 'head', name: 'crown' },
        { s: 'cone', d: [0.025, 0.065], at: [0.07, 0.67, 0.1], c: 'trim', mirror: true, group: 'head', name: 'crown-spike' },
        // Huge iron digging claws
        { s: 'box', d: [0.11, 0.06, 0.16], at: [0.24, 0.16, 0.18], rot: [20, -20, 0], c: 'iron-dark', mirror: true, group: 'claws', name: 'paw' },
        { s: 'cone', d: [0.02, 0.11], at: [0.22, 0.13, 0.3], rot: [95, -15, 0], c: 'steel', mirror: true, group: 'claws', name: 'claw-inner' },
        { s: 'cone', d: [0.02, 0.11], at: [0.28, 0.13, 0.28], rot: [95, -25, 0], c: 'steel', mirror: true, group: 'claws', name: 'claw-outer' },
      ],
    },
  },
  {
    dex: '012',
    element: 'iron',
    region: 'The Verge',
    rank: 'Boss',
    family: 'Metal',
    wants: 'Nothing anyone can name.',
    prefab: {
      id: 'minimower',
      name: 'Pocket Rumble',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'iron', 'verge', 'mower', 'boss', 'metal'],
      emoji: ['⚙️', '🔴'],
      tint: 'red',
      trim: 'steel',
      pivots: {
        blade: [0, 0.1, 0],
        rope: [0, 0.34, -0.18],
      },
      about: 'A pocket-sized effigy of Old Rumble: red iron deck, four wheels, Heartspark, and spinning blade.',
      examine: [
        'Even Cut acolytes build tiny iron effigies of the Turning Blade to guard their shrines.',
        'At one gnome tall, it is forty times smaller than the real Mower—and still terrifying.',
        'Its Heartspark hums with Black Dew; Rain magic sputters it out twice as fast.',
        'Do not pull the Waking Rope unless you brought a Stopping Stone.',
      ],
      parts: [
        // Four black rubber wheels (radius 0.11, center at y = 0.11 -> bottom at y = 0)
        { s: 'cyl', d: [0.11, 0.11, 0.06], at: [0.24, 0.11, 0.2], rot: [0, 0, 90], c: 'black', mirror: true, name: 'wheel-front' },
        { s: 'cyl', d: [0.12, 0.12, 0.065], at: [0.25, 0.12, -0.2], rot: [0, 0, 90], c: 'black', mirror: true, name: 'wheel-back' },
        // Red mower deck
        { s: 'box', d: [0.42, 0.12, 0.5], at: [0, 0.16, 0], c: 'tint', name: 'deck' },
        // Spinning steel blade underneath
        { s: 'box', d: [0.36, 0.018, 0.06], at: [0, 0.08, 0], c: 'trim', group: 'blade', name: 'blade' },
        // Engine block + glowing Heartspark plug
        { s: 'cyl', d: [0.11, 0.13, 0.14], at: [0, 0.29, 0.02], c: 'iron-dark', name: 'engine' },
        { s: 'cyl', d: [0.032, 0.032, 0.09], at: [0, 0.4, 0.05], c: 'spark', glow: true, name: 'heartspark' },
        // The Waking Rope pull-handle
        { s: 'box', d: [0.12, 0.03, 0.03], at: [0, 0.39, -0.2], c: 'wood-light', group: 'rope', name: 'waking-rope' },
        // The Belly (grass bag) + push handle
        { s: 'ball', d: [0.15], at: [0, 0.28, -0.28], scale: [1, 0.85, 1.15], c: 'burlap', name: 'belly-bag' },
        { s: 'cyl', d: [0.016, 0.016, 0.36], at: [0.17, 0.38, -0.32], rot: [-35, 0, 0], c: 'iron', mirror: true, name: 'handle-bar' },
        { s: 'cyl', d: [0.02, 0.02, 0.36], at: [0, 0.52, -0.42], rot: [0, 0, 90], c: 'black', name: 'handle-grip' },
      ],
    },
  },
];
