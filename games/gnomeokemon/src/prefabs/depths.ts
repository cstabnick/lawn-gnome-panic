import type { GnomeokemonEntry } from './types';

export const DEPTHS_AND_KILN_GNOMEOKEMON: readonly GnomeokemonEntry[] = [
  {
    dex: '017',
    element: 'rain',
    region: 'Drainpipe Deeps',
    rank: 'Boss',
    family: 'Soft',
    wants: 'To flow freely; it is a blockage that just wants to move.',
    prefab: {
      id: 'clogmaw',
      name: 'Clogmaw',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'rain', 'deeps', 'slime', 'boss', 'gutter'],
      emoji: ['🫧', '🐊'],
      tint: 'glaze-green',
      trim: 'moss',
      pivots: {
        head: [0, 0.34, 0.14],
        core: [0, 0.24, 0],
      },
      about: 'A living gutter-blockage of translucent cistern ooze, moss, and lost brass buttons.',
      examine: [
        'It is not malicious—just thirty years of leaves, hairpins, and rainwater trying to get unstuck.',
        'Through its translucent belly, you can see a swallowed brass button gleaming.',
        'Blow the Gnome Flute and it ripples like a pond after a pebble drop.',
        'Sun magic dries it out; Rain magic makes it twice as bouncy.',
      ],
      parts: [
        // Wide ooze base (bottom at y = 0)
        { s: 'cyl', d: [0.34, 0.42, 0.14], at: [0, 0.07, 0], c: 'tint', alpha: 0.72, name: 'base' },
        // Hulking slime mound
        { s: 'ball', d: [0.28], at: [0, 0.24, -0.02], scale: [1.15, 0.9, 1.1], c: 'tint', alpha: 0.78, group: 'core', name: 'body' },
        // Swallowed brass button inside
        { s: 'cyl', d: [0.07, 0.07, 0.03], at: [0, 0.22, 0.02], rot: [75, 0, 15], c: 'brass', group: 'core', name: 'button' },
        // Mossy crest
        { s: 'ball', d: [0.14], at: [0.06, 0.44, -0.06], scale: [1.2, 0.6, 1.1], c: 'trim', name: 'moss-top' },
        // Glowing cyan eyes
        { s: 'ball', d: [0.045], at: [0.11, 0.34, 0.22], c: 'spark', glow: true, mirror: true, group: 'head', name: 'eye' },
        // Wide gaping maw rim
        { s: 'box', d: [0.24, 0.06, 0.1], at: [0, 0.18, 0.28], c: 'slate', group: 'head', name: 'jaw' },
      ],
    },
  },
  {
    dex: '018',
    element: 'iron',
    region: 'Drainpipe Deeps',
    rank: 'Wild',
    family: 'Metal',
    wants: 'Shiny scrap nuts and a dry ledge above the backflow.',
    prefab: {
      id: 'rustcrab',
      name: 'Rustcrab',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'iron', 'deeps', 'crab', 'metal', 'rust'],
      emoji: ['🦀', '🔩'],
      tint: 'rust',
      trim: 'copper',
      pivots: {
        claws: [0, 0.22, 0.18],
      },
      about: 'A scuttling Backflow crab armored in a rusted copper pipe-cap and wrench claws.',
      examine: [
        'Its shell is an old copper drain cap polished orange by thirty years of drip.',
        'Pipewrights leave spare washers out so Rustcrabs will not pinch their boots.',
        'It clicks its iron claws in time whenever water hammers through the cistern.',
        'A single Rain spell turns its joints squeaky and slow.',
      ],
      parts: [
        // Six scuttling iron legs (bottom at y = 0)
        { s: 'cyl', d: [0.018, 0.014, 0.16], at: [0.22, 0.08, 0.1], rot: [0, 0, -32], c: 'iron-dark', mirror: true, name: 'leg-f' },
        { s: 'cyl', d: [0.018, 0.014, 0.16], at: [0.25, 0.08, 0], rot: [0, 0, -32], c: 'iron-dark', mirror: true, name: 'leg-m' },
        { s: 'cyl', d: [0.018, 0.014, 0.16], at: [0.22, 0.08, -0.1], rot: [0, 0, -32], c: 'iron-dark', mirror: true, name: 'leg-b' },
        // Copper pipe-cap shell
        { s: 'cyl', d: [0.18, 0.24, 0.16], at: [0, 0.2, 0], c: 'tint', name: 'shell' },
        { s: 'ring', d: [0.21, 0.025], at: [0, 0.16, 0], rot: [90, 0, 0], c: 'trim', name: 'rim' },
        // Stalked bolt eyes
        { s: 'cyl', d: [0.016, 0.016, 0.1], at: [0.07, 0.32, 0.12], c: 'iron', mirror: true, name: 'stalk' },
        { s: 'ball', d: [0.028], at: [0.07, 0.38, 0.13], c: 'spark', glow: true, mirror: true, name: 'eye' },
        // Snapping wrench claws
        { s: 'box', d: [0.09, 0.06, 0.16], at: [0.2, 0.2, 0.24], rot: [0, -25, 0], c: 'steel', mirror: true, group: 'claws', name: 'claw' },
      ],
    },
  },
  {
    dex: '019',
    element: 'sun',
    region: 'The Kiln & Shed',
    rank: 'Boss',
    family: 'Fired clay',
    wants: 'To test whoever would light the great Kiln.',
    prefab: {
      id: 'kilnwarden',
      name: 'Kiln Warden',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'sun', 'kiln', 'boss', 'clay', 'warden'],
      emoji: ['🗿', '🔥'],
      tint: 'clay-dark',
      trim: 'flame',
      pivots: {
        head: [0, 0.72, 0],
        core: [0, 0.44, 0.08],
      },
      about: 'Ancient fired-clay sentinel of the Rockery Kiln with a blazing furnace chest.',
      examine: [
        'Shaped when the First Kiln was still hot; its glaze has never chipped in three millennia.',
        'At the center of its chest burns a grate of living coals.',
        'Legend says it still kneels if it spots a Clayfoot trowel.',
        'Throw Bait to watch it salute, or Pester to make its furnace roar.',
      ],
      parts: [
        // Heavy clay pillar legs (bottom at y = 0)
        { s: 'cyl', d: [0.075, 0.09, 0.24], at: [0.12, 0.12, 0], c: 'tint', mirror: true, name: 'leg' },
        // Furnace torso
        { s: 'box', d: [0.36, 0.42, 0.26], at: [0, 0.44, 0], c: 'tint', name: 'torso' },
        // Glowing furnace core
        { s: 'ball', d: [0.11], at: [0, 0.44, 0.1], c: 'trim', glow: true, group: 'core', name: 'furnace' },
        // Broad stone pauldrons & arms
        { s: 'box', d: [0.14, 0.34, 0.14], at: [0.27, 0.45, 0], rot: [0, 0, -10], c: 'stone-dark', mirror: true, name: 'arm' },
        // Helmeted clay head + ember crown
        { s: 'box', d: [0.2, 0.22, 0.2], at: [0, 0.76, 0], c: 'tint', group: 'head', name: 'head' },
        { s: 'cone', d: [0.06, 0.16], at: [0, 0.94, 0], c: 'trim', glow: true, group: 'head', name: 'crest' },
        { s: 'ball', d: [0.028], at: [0.055, 0.78, 0.1], c: 'spark', glow: true, mirror: true, group: 'head', name: 'eye' },
      ],
    },
  },
  {
    dex: '020',
    element: 'bloom',
    region: 'The Kiln & Shed',
    rank: 'Wild',
    family: 'Winged',
    wants: 'A warm lantern or Heartspark glow to circle at dusk.',
    prefab: {
      id: 'glowmoth',
      name: 'Glowmoth',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'bloom', 'verge', 'moth', 'winged', 'twilight'],
      emoji: ['🦋', '✨'],
      tint: 'emerald',
      trim: 'spark',
      pivots: {
        wings: [0, 0.42, 0],
      },
      about: 'A luminous Grass-Bag Moth that flutters out of the Shed at twilight.',
      examine: [
        'Its dusty emerald wings glow softly like moonlight through a greenhouse pane.',
        'At dusk, dozens of Glowmoths spiral around the Kiln chimney and Mushroom Lamps.',
        'Blow the Gnome Flute and it loops in joyful figure-eights.',
        'The Order of the Even Cut tries to shoo them away from the Shed, never with much luck.',
      ],
      parts: [
        // Hovering shadow-stand (bottom at y = 0)
        { s: 'cyl', d: [0.012, 0.01, 0.22], at: [0.05, 0.11, 0], rot: [0, 0, -12], c: 'wood-dark', mirror: true, name: 'leg' },
        // Fuzzy moth body
        { s: 'pill', d: [0.075, 0.22], at: [0, 0.36, 0], rot: [75, 0, 0], c: 'wool', name: 'body' },
        // Feathered antennae
        { s: 'cone', d: [0.025, 0.12], at: [0.05, 0.48, 0.14], rot: [35, 0, -18], c: 'trim', glow: true, mirror: true, name: 'antenna' },
        // Glowing emerald-gold wings
        { s: 'box', d: [0.34, 0.012, 0.22], at: [0.22, 0.42, 0.02], rot: [12, -10, 18], c: 'tint', glow: true, alpha: 0.78, mirror: true, group: 'wings', name: 'forewing' },
        { s: 'box', d: [0.24, 0.012, 0.16], at: [0.16, 0.38, -0.14], rot: [8, 15, 14], c: 'trim', glow: true, alpha: 0.72, mirror: true, group: 'wings', name: 'hindwing' },
      ],
    },
  },
];
