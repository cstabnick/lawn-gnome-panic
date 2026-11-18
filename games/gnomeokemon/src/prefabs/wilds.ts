import type { GnomeokemonEntry } from './types';

export const WILD_GNOMEOKEMON: readonly GnomeokemonEntry[] = [
  {
    dex: '004',
    element: 'bloom',
    region: 'Mossbottom Vale',
    rank: 'Wild',
    family: 'Soft / Plant',
    wants: 'Wet lettuce leaves and deep shade under the rhubarb.',
    prefab: {
      id: 'mossback',
      name: 'Mossback',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'bloom', 'mossbottom', 'snail', 'mushroom'],
      emoji: ['🍄', '🐌'],
      tint: 'mushroom-cap',
      trim: 'moss',
      pivots: {
        head: [0, 0.14, 0.2],
        cap: [0, 0.36, -0.04],
      },
      about: 'A Mossbottom garden snail that carries a living red toadstool on its mossy shell.',
      examine: [
        'Its shell is half limestone, half moss, and topped with a plump spotted cap.',
        'Mossbottom villagers follow its slime trail to find the best shade on hot afternoons.',
        'When threatened, it pulls its eyestalks in and looks exactly like a harmless mushroom.',
        'Never mistake it for a stool; it hates being sat on and slides away at two inches a minute.',
      ],
      parts: [
        // Snail foot (bottom at y = 0)
        { s: 'pill', d: [0.1, 0.36], at: [0, 0.08, 0.04], rot: [90, 0, 0], c: 'shell', name: 'foot' },
        // Head & eyestalks
        { s: 'ball', d: [0.095], at: [0, 0.15, 0.25], c: 'shell', group: 'head', name: 'head' },
        { s: 'cyl', d: [0.014, 0.016, 0.12], at: [0.05, 0.26, 0.28], rot: [15, 0, -14], c: 'shell', mirror: true, group: 'head', name: 'stalk' },
        { s: 'ball', d: [0.025], at: [0.065, 0.32, 0.3], c: 'black', mirror: true, group: 'head', name: 'eye' },
        // Mossy shell base
        { s: 'ball', d: [0.18], at: [0, 0.22, -0.05], scale: [1, 0.85, 1.15], c: 'trim', name: 'shell' },
        // Mushroom stalk & cap
        { s: 'cyl', d: [0.075, 0.095, 0.14], at: [0, 0.37, -0.05], c: 'mushroom-stem', group: 'cap', name: 'stem' },
        { s: 'cone', d: [0.24, 0.18], at: [0, 0.5, -0.05], c: 'tint', group: 'cap', name: 'cap' },
        // White toadstool spots
        { s: 'ball', d: [0.032], at: [0.1, 0.49, 0.06], c: 'white', mirror: true, group: 'cap', name: 'spot-front' },
        { s: 'ball', d: [0.028], at: [0.09, 0.5, -0.14], c: 'white', mirror: true, group: 'cap', name: 'spot-back' },
        { s: 'ball', d: [0.03], at: [0, 0.56, -0.04], c: 'white', group: 'cap', name: 'spot-top' },
      ],
    },
  },
  {
    dex: '005',
    element: 'bloom',
    region: 'Mossbottom Vale',
    rank: 'Wild',
    family: 'Shelled',
    wants: 'To protect its grubs inside the rotting log mounds.',
    prefab: {
      id: 'staghorn',
      name: 'Staghorn',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'bloom', 'mossbottom', 'beetle', 'shelled'],
      emoji: ['🪲'],
      tint: 'chitin',
      trim: 'brass',
      pivots: {
        head: [0, 0.2, 0.18],
      },
      about: 'A heavy-shelled log-mound stag beetle with brass-tinted pincer mandibles.',
      examine: [
        'Its dark carapace is tougher than oak bark and shines like oiled iron.',
        'Young Wardens test their shields by letting a Staghorn charge them once.',
        'It clicks its mandibles in rhythm whenever two beetles argue over a fallen log.',
        'Drop a dab of honey nearby and it forgets all about pinching your shins.',
      ],
      parts: [
        // Six stubby legs (bottom at y = 0)
        { s: 'cyl', d: [0.022, 0.018, 0.14], at: [0.18, 0.07, 0.14], rot: [0, 0, -30], c: 'chitin', mirror: true, name: 'leg-f' },
        { s: 'cyl', d: [0.022, 0.018, 0.14], at: [0.21, 0.07, 0], rot: [0, 0, -30], c: 'chitin', mirror: true, name: 'leg-m' },
        { s: 'cyl', d: [0.022, 0.018, 0.14], at: [0.18, 0.07, -0.14], rot: [0, 0, -30], c: 'chitin', mirror: true, name: 'leg-b' },
        // Armored thorax & abdomen
        { s: 'ball', d: [0.2], at: [0, 0.21, -0.06], scale: [1.05, 0.72, 1.35], c: 'tint', name: 'abdomen' },
        { s: 'box', d: [0.24, 0.14, 0.18], at: [0, 0.22, 0.12], c: 'wood-dark', name: 'thorax' },
        // Head & glowing amber eyes
        { s: 'box', d: [0.18, 0.11, 0.12], at: [0, 0.21, 0.25], c: 'tint', group: 'head', name: 'head' },
        { s: 'ball', d: [0.028], at: [0.085, 0.23, 0.29], c: 'honey', glow: true, mirror: true, group: 'head', name: 'eye' },
        // Curved stag mandibles
        { s: 'pill', d: [0.022, 0.18], at: [0.1, 0.22, 0.39], rot: [75, -18, 0], c: 'trim', mirror: true, group: 'head', name: 'horn-base' },
        { s: 'cone', d: [0.024, 0.1], at: [0.065, 0.24, 0.49], rot: [80, 35, 0], c: 'trim', mirror: true, group: 'head', name: 'horn-tip' },
      ],
    },
  },
  {
    dex: '006',
    element: 'clay',
    region: 'Mossbottom Vale',
    rank: 'Wild',
    family: 'Fired clay',
    wants: 'Everything you own, preferably shiny.',
    prefab: {
      id: 'thimblekin',
      name: 'Thimblekin',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'clay', 'mossbottom', 'feral', 'thimble', 'gnome'],
      emoji: ['🪖', '🍄'],
      tint: 'red',
      trim: 'brass',
      pivots: {
        head: [0, 0.46, 0],
        arm: [-0.2, 0.36, 0.05],
      },
      about: 'A wild clay-gnome skirmisher crowned with a Tall One brass thimble helm.',
      examine: [
        'Feral gnomes never bother with town kilns; they bake themselves in bonfires and wear whatever fits.',
        'Its helm is a dimpled brass fortress—though nobody in Fescue knows what a sewing needle is.',
        'That wool beard hides three stolen buttons and half a dried apple.',
        'If you hear tinny clanking in the tall grass, count your coins.',
      ],
      parts: [
        // Boots (bottom at y = 0)
        { s: 'box', d: [0.08, 0.08, 0.13], at: [0.09, 0.04, 0.03], c: 'leather-dark', mirror: true, name: 'boot' },
        // Tunic body
        { s: 'cyl', d: [0.12, 0.17, 0.32], at: [0, 0.24, 0], c: 'tint', name: 'tunic' },
        // Leather belt & brass buckle
        { s: 'cyl', d: [0.155, 0.16, 0.05], at: [0, 0.2, 0], c: 'leather', name: 'belt' },
        { s: 'box', d: [0.06, 0.06, 0.03], at: [0, 0.2, 0.16], c: 'trim', name: 'buckle' },
        // Clay head & nose
        { s: 'ball', d: [0.13], at: [0, 0.5, 0], c: 'terracotta', group: 'head', name: 'head' },
        { s: 'ball', d: [0.035], at: [0, 0.49, 0.13], c: 'clay', group: 'head', name: 'nose' },
        { s: 'ball', d: [0.02], at: [0.055, 0.52, 0.115], c: 'black', mirror: true, group: 'head', name: 'eye' },
        // Bushy wool beard
        { s: 'cone', d: [0.11, 0.2], at: [0, 0.38, 0.1], rot: [165, 0, 0], c: 'wool', group: 'head', name: 'beard' },
        // Brass thimble helm!
        { s: 'cyl', d: [0.13, 0.15, 0.2], at: [0, 0.62, 0], c: 'trim', group: 'head', name: 'thimble-helm' },
        { s: 'ring', d: [0.15, 0.02], at: [0, 0.53, 0], rot: [90, 0, 0], c: 'gold', group: 'head', name: 'helm-rim' },
        // Twig club in right hand
        { s: 'cyl', d: [0.032, 0.02, 0.32], at: [-0.22, 0.38, 0.14], rot: [35, 0, 12], c: 'wood', group: 'arm', name: 'club' },
      ],
    },
  },
  {
    dex: '007',
    element: 'rain',
    region: 'Thatchford Downs',
    rank: 'Wild',
    family: 'Soft / Hose',
    wants: 'High water pressure and a warm sunny bank to coil on.',
    prefab: {
      id: 'hoseleech',
      name: 'Hoseleech',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'rain', 'thatchford', 'hose', 'serpent', 'water'],
      emoji: ['🐍', '🚿'],
      tint: 'leaf',
      trim: 'brass',
      pivots: {
        head: [0, 0.42, 0.18],
      },
      about: 'A coiled green-rubber river serpent with a tarnished brass nozzle snout.',
      examine: [
        'Pipewrights swear the first Hoseleeches pinched off from the Great Green River itself.',
        'It sprays cold cistern mist when cornered, soaking anything within two paces.',
        'The brass ring on its snout clicks softly—twist it left for spray, right for stream.',
        'A thirsty gnome can drink from it, provided you ask politely first.',
      ],
      parts: [
        // Coiled body rings (bottom at y = 0)
        { s: 'ring', d: [0.22, 0.065], at: [0, 0.065, 0], rot: [90, 0, 0], c: 'tint', name: 'coil-1' },
        { s: 'ring', d: [0.17, 0.06], at: [0, 0.16, -0.01], rot: [88, 5, 0], c: 'leaf-dark', name: 'coil-2' },
        { s: 'ring', d: [0.12, 0.055], at: [0, 0.25, 0.01], rot: [85, -5, 0], c: 'tint', name: 'coil-3' },
        // Rearing neck
        { s: 'cyl', d: [0.055, 0.065, 0.22], at: [0, 0.36, 0.1], rot: [22, 0, 0], c: 'tint', name: 'neck' },
        // Head & brass nozzle snout
        { s: 'ball', d: [0.085], at: [0, 0.46, 0.18], scale: [1, 0.85, 1.2], c: 'tint', group: 'head', name: 'head' },
        { s: 'cyl', d: [0.052, 0.068, 0.1], at: [0, 0.45, 0.29], rot: [90, 0, 0], c: 'trim', group: 'head', name: 'nozzle' },
        { s: 'ring', d: [0.06, 0.015], at: [0, 0.45, 0.25], c: 'gold', group: 'head', name: 'nozzle-ring' },
        // Glowing cyan water eyes
        { s: 'ball', d: [0.024], at: [0.06, 0.49, 0.22], c: 'glaze-blue', glow: true, mirror: true, group: 'head', name: 'eye' },
      ],
    },
  },
  {
    dex: '008',
    element: 'sun',
    region: 'Cloverfield',
    rank: 'Wild',
    family: 'Plant',
    wants: 'To guard the clover rows until the Straw King returns.',
    prefab: {
      id: 'strawight',
      name: 'Strawight',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'sun', 'cloverfield', 'straw', 'scarecrow', 'plant'],
      emoji: ['🌾', '🎃'],
      tint: 'straw',
      trim: 'burlap',
      pivots: {
        head: [0, 0.62, 0],
        arms: [0, 0.46, 0],
      },
      about: 'A Cloverfield scarecrow-wight bound in dry straw and a stitched burlap hood.',
      examine: [
        'Made to frighten Old Gleaner away from the grain; nobody knows who taught it to walk.',
        'Its burlap sack head smells faintly of oats and dry summer lightning.',
        'Spark-bright eyes flare inside the hood whenever a crow crosses the fence.',
        'Keep Sun-magic away from it—straw burns faster than a dry apology.',
      ],
      parts: [
        // Wooden post base (bottom at y = 0)
        { s: 'cyl', d: [0.035, 0.045, 0.3], at: [0, 0.15, 0], c: 'wood-dark', name: 'post' },
        // Straw skirt / torso
        { s: 'cone', d: [0.18, 0.38], at: [0, 0.41, 0], c: 'tint', name: 'straw-coat' },
        // Rope belt
        { s: 'ring', d: [0.12, 0.022], at: [0, 0.35, 0], rot: [90, 0, 0], c: 'bark', name: 'belt' },
        // Crossbar arms
        { s: 'cyl', d: [0.025, 0.025, 0.66], at: [0, 0.48, 0], rot: [0, 0, 90], c: 'wood', group: 'arms', name: 'crossbar' },
        { s: 'cone', d: [0.06, 0.14], at: [0.33, 0.48, 0], rot: [0, 0, -90], c: 'tint', mirror: true, group: 'arms', name: 'cuff' },
        // Burlap sack head + pointy hat
        { s: 'ball', d: [0.13], at: [0, 0.66, 0], scale: [0.95, 1.1, 0.95], c: 'trim', group: 'head', name: 'head' },
        { s: 'cone', d: [0.18, 0.24], at: [0, 0.84, -0.02], rot: [-10, 0, 8], c: 'leather-dark', group: 'head', name: 'hat' },
        // Glowing spark eyes
        { s: 'ball', d: [0.025], at: [0.05, 0.67, 0.115], c: 'spark', glow: true, mirror: true, group: 'head', name: 'eye' },
      ],
    },
  },
  {
    dex: '009',
    element: 'sun',
    region: 'Hedgewood',
    rank: 'Wild',
    family: 'Winged',
    wants: 'Its Paper Spire safe from the Hedgewright loggers.',
    prefab: {
      id: 'paperwasp',
      name: 'Paperwasp',
      category: 'prop',
      uses: ['place', 'collect'],
      tags: ['gnomeokemon', 'sun', 'hedgewood', 'wasp', 'winged', 'flying'],
      emoji: ['🐝', '🪽'],
      tint: 'yellow',
      trim: 'black',
      pivots: {
        wings: [0, 0.42, 0],
      },
      about: 'A striped Hedgewood spire-sentinel with papery translucent wings and a brass-sharp sting.',
      examine: [
        'Its nest is chewed bark pressed thinner than parchment, yet harder than fired brick.',
        'Hedgewood loggers listen for the high buzz before they swing an axe.',
        'It hovers on a single point of air, watching for anyone carrying sap or honey.',
        'Despite the fierce sting, it never chases a gnome past the shade of its own tree.',
      ],
      parts: [
        // Hovering shadow-stand legs (bottom at y = 0)
        { s: 'cyl', d: [0.014, 0.01, 0.18], at: [0.07, 0.09, 0.06], rot: [15, 0, -15], c: 'trim', mirror: true, name: 'leg-f' },
        { s: 'cyl', d: [0.014, 0.01, 0.18], at: [0.08, 0.09, -0.04], rot: [-15, 0, -15], c: 'trim', mirror: true, name: 'leg-b' },
        // Striped abdomen
        { s: 'ball', d: [0.14], at: [0, 0.28, -0.14], scale: [0.85, 0.85, 1.35], c: 'tint', name: 'abdomen' },
        { s: 'ring', d: [0.115, 0.024], at: [0, 0.28, -0.1], c: 'trim', name: 'stripe-1' },
        { s: 'ring', d: [0.1, 0.022], at: [0, 0.28, -0.19], c: 'trim', name: 'stripe-2' },
        // Stinger
        { s: 'cone', d: [0.035, 0.13], at: [0, 0.25, -0.35], rot: [-95, 0, 0], c: 'iron-dark', name: 'stinger' },
        // Thorax & head
        { s: 'ball', d: [0.11], at: [0, 0.34, 0.06], c: 'trim', name: 'thorax' },
        { s: 'ball', d: [0.095], at: [0, 0.37, 0.2], c: 'tint', name: 'head' },
        // Compound ruby eyes
        { s: 'ball', d: [0.036], at: [0.065, 0.39, 0.25], c: 'ruby', glow: true, mirror: true, name: 'eye' },
        // Antennae
        { s: 'cyl', d: [0.01, 0.01, 0.12], at: [0.04, 0.47, 0.27], rot: [40, 0, -15], c: 'trim', mirror: true, name: 'antenna' },
        // Translucent paper wings
        { s: 'box', d: [0.28, 0.012, 0.12], at: [0.18, 0.45, 0], rot: [12, -15, 22], c: 'parchment', alpha: 0.5, mirror: true, group: 'wings', name: 'wing' },
      ],
    },
  },
];
