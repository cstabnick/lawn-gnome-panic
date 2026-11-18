import type { GnomeokemonEntry } from './types';

export const STARTER_GNOMEOKEMON: readonly GnomeokemonEntry[] = [
  {
    dex: '001',
    element: 'bloom',
    region: 'Mossbottom Vale',
    rank: 'Starter',
    family: 'Plant / Glazed clay',
    wants: 'A sunny patch of damp loam and a drop of morning dew.',
    prefab: {
      id: 'sproutling',
      name: 'Sproutling',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'bloom', 'mossbottom', 'starter', 'sprout', 'plant'],
      emoji: ['🌱', '🌿'],
      tint: 'moss',
      trim: 'leaf',
      pivots: {
        head: [0, 0.36, 0],
        sprout: [0, 0.62, 0],
      },
      about: 'Bloom starter: a plump moss-glazed clay bulb with a twin-leaf sprout crest.',
      examine: [
        'Its mossy glaze stays cool even at noon; kilnwrights swear it grew legs on its own.',
        'When startled, it tucks its stubby feet in and pretends to be an ordinary turnip.',
        'Old Mossbottom rhyme: "Two leaves up, rain on the way; three leaves curled, Frost is at play."',
        'Do not water it after dusk unless you want it humming at your windowsill until dawn.',
      ],
      parts: [
        // Feet (bottom at y = 0)
        { s: 'ball', d: [0.075], at: [0.11, 0.06, 0.05], scale: [1, 0.8, 1.3], c: 'dirt', mirror: true, name: 'foot' },
        // Plump bulb body
        { s: 'ball', d: [0.22], at: [0, 0.24, 0], scale: [1, 0.92, 0.96], c: 'tint', name: 'body' },
        // Cream belly patch
        { s: 'ball', d: [0.15], at: [0, 0.21, 0.11], scale: [0.95, 0.9, 0.6], c: 'mushroom-stem', name: 'belly' },
        // Head / upper bulb
        { s: 'ball', d: [0.18], at: [0, 0.44, 0.02], scale: [1.05, 0.9, 0.95], c: 'tint', group: 'head', name: 'head' },
        // Leafy cheek tufts / ears
        { s: 'wedge', d: [0.06, 0.12, 0.16], at: [0.18, 0.47, -0.02], rot: [-15, 25, -45], c: 'trim', mirror: true, group: 'head', name: 'ear' },
        // Big glossy eyes + highlights
        { s: 'ball', d: [0.042], at: [0.075, 0.45, 0.16], c: 'black', mirror: true, group: 'head', name: 'eye' },
        { s: 'ball', d: [0.016], at: [0.085, 0.465, 0.195], c: 'white', glow: true, mirror: true, group: 'head', name: 'eye-shine' },
        // Little clay nose
        { s: 'ball', d: [0.03], at: [0, 0.41, 0.19], c: 'clay', group: 'head', name: 'nose' },
        // Sprout stem + twin leaves
        { s: 'cyl', d: [0.022, 0.028, 0.14], at: [0, 0.66, 0], c: 'leaf-dark', group: 'sprout', name: 'stem' },
        { s: 'ball', d: [0.075], at: [0.075, 0.74, 0], rot: [0, 0, -25], scale: [1.3, 0.3, 0.75], c: 'trim', mirror: true, group: 'sprout', name: 'leaf' },
      ],
    },
  },
  {
    dex: '002',
    element: 'sun',
    region: 'The Rockery',
    rank: 'Starter',
    family: 'Fired clay',
    wants: 'Warm hearthstones and an occasional charcoal cinder to chew.',
    prefab: {
      id: 'kilnpup',
      name: 'Kilnpup',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'sun', 'rockery', 'starter', 'fire', 'clay'],
      emoji: ['🔥', '🐕'],
      tint: 'terracotta',
      trim: 'flame',
      pivots: {
        head: [0, 0.34, 0.14],
        tail: [0, 0.28, -0.22],
      },
      about: 'Sun starter: a stout terracotta hound-gnome with a chimney collar and ember tail.',
      examine: [
        'Shaped from Rockery red clay and fired twice so its belly stays warm to the touch.',
        'Kilnkeepers keep one near the drying racks; it barks softly whenever a pot is about to crack.',
        'Its tail is not real fire, just a spark-glaze bead that refuses to cool down.',
        'Give it a cold turnip and it will stare at you until you toast it.',
      ],
      parts: [
        // Four sturdy paws (bottom at y = 0)
        { s: 'cyl', d: [0.045, 0.055, 0.14], at: [0.1, 0.07, 0.13], c: 'clay-dark', mirror: true, name: 'front-leg' },
        { s: 'cyl', d: [0.048, 0.058, 0.14], at: [0.1, 0.07, -0.14], c: 'clay-dark', mirror: true, name: 'back-leg' },
        // Barrel body
        { s: 'pill', d: [0.13, 0.22], at: [0, 0.22, -0.01], rot: [90, 0, 0], c: 'tint', name: 'body' },
        // Sooty iron chimney collar
        { s: 'ring', d: [0.13, 0.032], at: [0, 0.31, 0.11], rot: [55, 0, 0], c: 'iron-dark', name: 'collar' },
        // Head
        { s: 'ball', d: [0.15], at: [0, 0.39, 0.18], scale: [1, 0.95, 1.05], c: 'tint', group: 'head', name: 'head' },
        // Snout
        { s: 'box', d: [0.11, 0.08, 0.11], at: [0, 0.35, 0.3], c: 'clay', group: 'head', name: 'snout' },
        { s: 'ball', d: [0.028], at: [0, 0.38, 0.355], c: 'black', group: 'head', name: 'nose' },
        // Pointed clay ears
        { s: 'cone', d: [0.05, 0.13], at: [0.11, 0.52, 0.15], rot: [0, 0, -18], c: 'clay-dark', mirror: true, group: 'head', name: 'ear' },
        // Glowing ember eyes
        { s: 'ball', d: [0.03], at: [0.065, 0.42, 0.3], c: 'trim', glow: true, mirror: true, group: 'head', name: 'eye' },
        // Flame tail
        { s: 'cone', d: [0.055, 0.16], at: [0, 0.35, -0.28], rot: [-45, 0, 0], c: 'trim', glow: true, group: 'tail', name: 'tail-flame' },
        { s: 'ball', d: [0.045], at: [0, 0.31, -0.24], c: 'spark', glow: true, group: 'tail', name: 'tail-core' },
      ],
    },
  },
  {
    dex: '003',
    element: 'rain',
    region: 'Thatchford Downs',
    rank: 'Starter',
    family: 'Soft / Glazed clay',
    wants: 'A clean puddle and someone to toss pebbles into it.',
    prefab: {
      id: 'dewdrop',
      name: 'Dewdrop',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'rain', 'thatchford', 'starter', 'water', 'frog'],
      emoji: ['💧', '🐸'],
      tint: 'glaze-blue',
      trim: 'leaf',
      pivots: {
        head: [0, 0.32, 0.02],
        cap: [0, 0.5, 0],
      },
      about: 'Rain starter: a round glaze-blue pond-sprite wearing a lily-pad cap.',
      examine: [
        'Puffed up like a raindrop about to fall off a cabbage leaf.',
        'Thatchford anglers carry one in a bucket; it croaks louder whenever the Hose pressure rises.',
        'Its translucent cheek-sacs shimmer with cool cistern water.',
        'If it sits on your boot, you are legally required to wait until it hops off.',
      ],
      parts: [
        // Webbed feet (bottom at y = 0)
        { s: 'box', d: [0.1, 0.04, 0.14], at: [0.13, 0.02, 0.07], rot: [0, -15, 0], c: 'water', mirror: true, name: 'foot' },
        // Round body
        { s: 'ball', d: [0.21], at: [0, 0.21, 0], scale: [1.1, 0.88, 1], c: 'tint', name: 'body' },
        // Pale belly
        { s: 'ball', d: [0.15], at: [0, 0.18, 0.09], scale: [1, 0.85, 0.65], c: 'glass', alpha: 0.65, name: 'belly' },
        // Puffy translucent cheek-sacs
        { s: 'ball', d: [0.065], at: [0.14, 0.3, 0.12], c: 'water', alpha: 0.7, mirror: true, group: 'head', name: 'cheek' },
        // High frog eyes
        { s: 'ball', d: [0.055], at: [0.085, 0.42, 0.11], c: 'tint', mirror: true, group: 'head', name: 'eye-bump' },
        { s: 'ball', d: [0.032], at: [0.09, 0.425, 0.155], c: 'black', mirror: true, group: 'head', name: 'eye' },
        { s: 'ball', d: [0.014], at: [0.095, 0.44, 0.18], c: 'spark', glow: true, mirror: true, group: 'head', name: 'eye-glint' },
        // Lily-pad cap
        { s: 'cyl', d: [0.21, 0.22, 0.035], at: [0, 0.49, -0.01], rot: [-8, 0, 0], c: 'trim', group: 'cap', name: 'lilypad' },
        // Tiny pink flower bud on the lilypad
        { s: 'cone', d: [0.045, 0.09], at: [0.07, 0.55, 0.03], rot: [0, 0, -12], c: 'petal', group: 'cap', name: 'bud' },
      ],
    },
  },
];
