import type { GnomeokemonEntry } from './types';

export const OCEAN_GNOMEOKEMON: readonly GnomeokemonEntry[] = [
  {
    dex: '021',
    element: 'rain',
    region: 'Cistern Reef',
    rank: 'Boss',
    family: 'Metal / Water',
    wants: 'To patrol the sunken basin and churn bubbles with its propeller.',
    prefab: {
      id: 'seamower',
      name: 'Sea Mower',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'rain', 'water', 'ocean', 'mower', 'underwater', 'boss'],
      emoji: ['🌊', '⚙️'],
      tint: 'glaze-blue',
      trim: 'petal',
      pivots: {
        blade: [0, 0.1, 0],
        prop: [0, 0.28, -0.34],
      },
      about: 'Underwater water-type Mower encrusted in sea-glass glaze, barnacles, and a spinning propeller.',
      examine: [
        'When an old Mower tumbled into the flooded Cistern, the water-glaze claimed it.',
        'Instead of grass, its spinning blade whips up whirlpools of silver bubbles.',
        'Barnacles and pink coral cling to its deck like medals from the deep.',
        'Its Heartspark glows aqua-bright—throw Bait to watch it chomp floating kelp!',
      ],
      parts: [
        // Four sea-glass pontoon wheels (radius 0.11 at y = 0.11 -> bottom at y = 0)
        { s: 'cyl', d: [0.11, 0.11, 0.06], at: [0.24, 0.11, 0.2], rot: [0, 0, 90], c: 'slate', mirror: true, name: 'wheel-front' },
        { s: 'cyl', d: [0.12, 0.12, 0.065], at: [0.25, 0.12, -0.2], rot: [0, 0, 90], c: 'slate', mirror: true, name: 'wheel-back' },
        // Teal underwater mower deck
        { s: 'box', d: [0.42, 0.12, 0.5], at: [0, 0.16, 0], c: 'tint', name: 'deck' },
        // Spinning hydro-blade underneath
        { s: 'box', d: [0.36, 0.018, 0.06], at: [0, 0.08, 0], c: 'water', group: 'blade', name: 'blade' },
        // Coral-crusted engine & glowing aqua Heartspark
        { s: 'cyl', d: [0.11, 0.13, 0.14], at: [0, 0.29, 0.02], c: 'glaze-green', name: 'engine' },
        { s: 'cyl', d: [0.032, 0.032, 0.09], at: [0, 0.4, 0.05], c: 'glass', glow: true, name: 'heartspark' },
        // Barnacles & coral crest
        { s: 'cone', d: [0.04, 0.08], at: [0.14, 0.26, 0.14], c: 'sand', mirror: true, name: 'barnacle' },
        { s: 'cone', d: [0.035, 0.11], at: [-0.12, 0.27, -0.1], rot: [0, 0, 15], c: 'petal', name: 'coral' },
        // Rear submarine propeller
        { s: 'box', d: [0.22, 0.04, 0.02], at: [0, 0.28, -0.34], c: 'brass', group: 'prop', name: 'prop-h' },
        { s: 'box', d: [0.04, 0.22, 0.02], at: [0, 0.28, -0.34], c: 'brass', group: 'prop', name: 'prop-v' },
        // Glowing sonar eyes
        { s: 'ball', d: [0.032], at: [0.12, 0.2, 0.26], c: 'spark', glow: true, mirror: true, name: 'eye' },
      ],
    },
  },
  {
    dex: '022',
    element: 'rain',
    region: 'Cistern Reef',
    rank: 'Wild',
    family: 'Soft',
    wants: 'Dark underwater pipes and drifting plankton.',
    prefab: {
      id: 'cisterneel',
      name: 'Cistern Eel',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'rain', 'water', 'ocean', 'eel', 'underwater'],
      emoji: ['🐍', '💧'],
      tint: 'glaze-blue',
      trim: 'spark',
      pivots: {
        head: [0, 0.38, 0.2],
        tail: [0, 0.2, -0.22],
      },
      about: 'A sinuous underwater cistern eel with a glowing dorsal fin.',
      examine: [
        'Its lantern-bright fin lights the flooded arches of the Cistern Reef.',
        'It weaves effortlessly between sunken garden hoses and brass valves.',
        'Play the Gnome Flute and it spirals in graceful water-ribbons.',
        'Nobody has ever measured how long the biggest Cistern Eel really is.',
      ],
      parts: [
        // Coiled tail base (bottom at y = 0)
        { s: 'ring', d: [0.18, 0.055], at: [0, 0.055, -0.04], rot: [90, 0, 0], c: 'tint', name: 'coil' },
        // Rising body
        { s: 'pill', d: [0.06, 0.26], at: [0, 0.24, 0.06], rot: [22, 0, 0], c: 'tint', name: 'torso' },
        // Glowing fin ridge
        { s: 'wedge', d: [0.02, 0.16, 0.12], at: [0, 0.32, -0.02], c: 'trim', glow: true, name: 'fin' },
        // Head & glowing eyes
        { s: 'ball', d: [0.085], at: [0, 0.42, 0.18], scale: [0.95, 0.85, 1.3], c: 'tint', group: 'head', name: 'head' },
        { s: 'ball', d: [0.026], at: [0.06, 0.44, 0.24], c: 'trim', glow: true, mirror: true, group: 'head', name: 'eye' },
        { s: 'cone', d: [0.04, 0.18], at: [0, 0.14, -0.28], rot: [-75, 0, 0], c: 'glaze-green', group: 'tail', name: 'tail-tip' },
      ],
    },
  },
  {
    dex: '023',
    element: 'rain',
    region: 'Cistern Reef',
    rank: 'Elite',
    family: 'Soft',
    wants: 'Quiet sunken ledges and fat water-beetles.',
    prefab: {
      id: 'drownedtoad',
      name: 'Drowned Toad',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'rain', 'water', 'ocean', 'toad', 'underwater'],
      emoji: ['🐸', '🫧'],
      tint: 'sapphire',
      trim: 'glaze-green',
      pivots: {
        head: [0, 0.34, 0.1],
      },
      about: 'A heavy deep-water cistern toad with luminous bubble-cheeks.',
      examine: [
        'Its croak sounds like a distant gong echoing through flooded drainpipes.',
        'Glowing bubble-sacs let it stay submerged for weeks at a time.',
        'Toss a Pester Clod and it puffs up twice as wide in indignation.',
        'Young Dewdrops look up to it like a grumpy uncle.',
      ],
      parts: [
        // Webbed feet (bottom at y = 0)
        { s: 'box', d: [0.12, 0.04, 0.16], at: [0.16, 0.02, 0.08], rot: [0, -15, 0], c: 'trim', mirror: true, name: 'foot' },
        // Chunky toad body
        { s: 'ball', d: [0.24], at: [0, 0.22, -0.02], scale: [1.15, 0.86, 1.05], c: 'tint', name: 'body' },
        // Bubble throat sac
        { s: 'ball', d: [0.11], at: [0, 0.22, 0.18], c: 'glass', alpha: 0.65, group: 'head', name: 'throat' },
        // High toad eyes
        { s: 'ball', d: [0.055], at: [0.1, 0.4, 0.12], c: 'tint', mirror: true, group: 'head', name: 'eye-bump' },
        { s: 'ball', d: [0.032], at: [0.11, 0.41, 0.165], c: 'spark', glow: true, mirror: true, group: 'head', name: 'eye' },
      ],
    },
  },
  {
    dex: '024',
    element: 'iron',
    region: 'Cistern Reef',
    rank: 'Wild',
    family: 'Metal / Shelled',
    wants: 'A sturdy tin-can helm and a quiet corner of the reef.',
    prefab: {
      id: 'barnacleknight',
      name: 'Barnacle Knight',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'iron', 'water', 'ocean', 'knight', 'underwater'],
      emoji: ['🛡️', '🐚'],
      tint: 'steel',
      trim: 'petal',
      pivots: {
        head: [0, 0.52, 0],
        arm: [-0.22, 0.34, 0.06],
      },
      about: 'A sunken tin-can gnome knight encrusted with pink barnacles and a bottlecap shield.',
      examine: [
        'Its armor is an old Tall One soup tin covered in reef shells.',
        'It guards the sunken Birdbath steps even though the war ended centuries ago.',
        'When you blow the Gnome Flute, it taps its bottlecap shield in rhythm.',
        'Salt and water turned its hinges stiff, but its spirit is pure iron.',
      ],
      parts: [
        // Boots (bottom at y = 0)
        { s: 'box', d: [0.09, 0.08, 0.13], at: [0.1, 0.04, 0.02], c: 'iron-dark', mirror: true, name: 'boot' },
        // Tin-can armor body
        { s: 'cyl', d: [0.16, 0.17, 0.34], at: [0, 0.25, 0], c: 'tint', name: 'cuirass' },
        // Barnacle clusters
        { s: 'cone', d: [0.045, 0.08], at: [0.12, 0.35, 0.12], rot: [40, 0, -25], c: 'trim', name: 'barnacle-1' },
        { s: 'cone', d: [0.038, 0.07], at: [-0.13, 0.24, 0.11], rot: [45, 0, 20], c: 'sand', name: 'barnacle-2' },
        // Bucket helm + glowing visor eyes
        { s: 'cyl', d: [0.14, 0.15, 0.22], at: [0, 0.54, 0], c: 'iron', group: 'head', name: 'helm' },
        { s: 'box', d: [0.16, 0.03, 0.04], at: [0, 0.54, 0.14], c: 'spark', glow: true, group: 'head', name: 'visor' },
        // Bottlecap shield
        { s: 'cyl', d: [0.14, 0.14, 0.03], at: [-0.24, 0.32, 0.08], rot: [90, 0, 20], c: 'glaze-blue', group: 'arm', name: 'shield' },
      ],
    },
  },
  {
    dex: '025',
    element: 'bloom',
    region: 'Cistern Reef',
    rank: 'Wild',
    family: 'Plant',
    wants: 'Sunbeams filtering down through the cistern water.',
    prefab: {
      id: 'kelpsprite',
      name: 'Kelp Sprite',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'bloom', 'water', 'ocean', 'kelp', 'underwater'],
      emoji: ['🌿', '🫧'],
      tint: 'emerald',
      trim: 'pearl' in {} ? 'white' : 'white',
      pivots: {
        head: [0, 0.44, 0],
        sprout: [0, 0.62, 0],
      },
      about: 'A drifting underwater sea-moss spirit crowned with a glowing pearl.',
      examine: [
        'Its leafy ribbons sway even when the cistern water is completely still.',
        'At night, Kelp Sprites gather around sunken lanterns like green fireflies.',
        'Throw Bait and it twirls gracefully down to nibble.',
        'Gnomes say a pearl from a Kelp Sprite keeps clay from ever cracking.',
      ],
      parts: [
        // Drifting kelp ribbons touching y = 0
        { s: 'cone', d: [0.16, 0.32], at: [0, 0.16, 0], c: 'leaf-dark', name: 'skirt' },
        { s: 'ball', d: [0.15], at: [0, 0.36, 0], c: 'tint', group: 'head', name: 'head' },
        { s: 'ball', d: [0.025], at: [0.06, 0.38, 0.13], c: 'black', mirror: true, group: 'head', name: 'eye' },
        // Glowing pearl & kelp fronds
        { s: 'ball', d: [0.055], at: [0, 0.56, 0], c: 'trim', glow: true, group: 'sprout', name: 'pearl' },
        { s: 'box', d: [0.05, 0.22, 0.02], at: [0.1, 0.54, 0], rot: [0, 0, -25], c: 'tint', mirror: true, group: 'sprout', name: 'frond' },
      ],
    },
  },
];
