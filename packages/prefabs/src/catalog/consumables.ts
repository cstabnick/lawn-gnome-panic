// Consumables (drink, apply) and food (eat). Small: most are 0.1 to 0.25 tall.
import type { PrefabDef } from '../types';

export const CONSUMABLES: PrefabDef[] = [
  {
    id: 'glaze-pot', name: 'Glaze Pot', category: 'consumable', uses: ['drink', 'hold'],
    wear: { rot: [90, 0, 0] },
    tags: ['potion', 'pot', 'glaze', 'heal', 'clay'], emoji: ['🧪', '🏺'], tint: 'glaze-blue',
    grip: [0, 0.08, 0], about: 'A squat clay pot of healing glaze, cork stopper. The glaze colour is the tint.',
    examine: [
      'A squat clay pot, corked, the glaze inside still wet and gleaming.',
      'Glaze closes cracks. Dab it on, wait for the tingle, try not to move until it sets.',
      'Kilnwrights say a good glaze remembers the fire. This one smells faintly of hot stone.',
      '"More glue than gnome" is what they call someone who carries six of these.',
      'A drip has run down the side and dried in a perfect bead. Waste not.',
    ],
    parts: [
      { s: 'ball', d: [0.08], at: [0, 0.075, 0], scale: [1, 0.9, 1], c: 'clay', seg: 10 },
      { s: 'cyl', d: [0.084, 0.084, 0.03], at: [0, 0.07, 0], c: 'tint', seg: 10 },   // glazed band
      { s: 'cyl', d: [0.035, 0.045, 0.05], at: [0, 0.16, 0], c: 'clay', seg: 8 },    // neck
      { s: 'cyl', d: [0.03, 0.028, 0.04], at: [0, 0.2, 0], c: 'wood-light', seg: 8 }, // cork
      { s: 'ball', d: [0.025], at: [0, 0.17, 0.03], c: 'tint', glow: true },          // drip
    ],
  },
  {
    id: 'red-mushroom', name: 'Red Mushroom', category: 'food', uses: ['eat', 'collect'],
    tags: ['mushroom', 'toadstool', 'food', 'forage', 'garden'], emoji: ['🍄'],
    about: 'A spotted red toadstool. Gnome staple, probably.',
    examine: [
      'Red cap, white spots, a stalk thick as a gnome\'s wrist.',
      'Half of Mossbottom lives in one of these. The other half eats them. Nobody mixes the two up twice.',
      'Smells of rain and earth. Tastes, mostly, of the same.',
      'Old rhyme: "White spots good, white gills bad, purple anything, ask your dad."',
      'It squeaks a little when squeezed. Mushrooms are not supposed to do that.',
    ],
    parts: [
      { s: 'cyl', d: [0.035, 0.045, 0.12], at: [0, 0.06, 0], c: 'mushroom-stem' },
      { s: 'ball', d: [0.1], at: [0, 0.13, 0], scale: [1, 0.6, 1], c: 'mushroom-cap', seg: 10 },
      { s: 'ball', d: [0.016], at: [0.05, 0.17, 0.03], c: 'white', seg: 5 },
      { s: 'ball', d: [0.014], at: [-0.04, 0.175, 0.04], c: 'white', seg: 5 },
      { s: 'ball', d: [0.018], at: [0, 0.19, -0.03], c: 'white', seg: 5 },
    ],
  },
  {
    id: 'blue-potion', name: 'Blue Potion', category: 'consumable', uses: ['drink', 'hold'],
    wear: { rot: [90, 0, 0] },
    tags: ['potion', 'blue', 'glass', 'jar', 'cork', 'drink'], emoji: ['🫙'], tint: 'sapphire',
    grip: [0, 0.06, 0], about: 'A round glass jar of blue potion, cork stopper, glowing liquid. The liquid is the tint.',
    examine: [
      'A round glass jar, cork pushed in hard, and blue light sloshing around inside as if it wants out.',
      'Old saying: "Blue for the cold days, blue for the sore knees, blue for the one who sneezed."',
      'Shake it before drinking. The blue settles to the bottom, and the bottom is the good part.',
      'Gnomes who drink it see colours nobody has names for. The names come later, usually from a cat.',
      'Someone wrote a label on the cork and then scraped it off. Only the letter "B" survives.',
    ],
    parts: [
      { s: 'ball', d: [0.07], at: [0, 0.0665, 0], scale: [1, 0.95, 1], c: 'glass', seg: 10 },
      { s: 'ball', d: [0.062], at: [0, 0.06, 0], scale: [1, 0.8, 1], c: 'tint', glow: true, seg: 10 },
      { s: 'cyl', d: [0.03, 0.035, 0.04], at: [0, 0.14, 0], c: 'glass', seg: 8 },       // neck
      { s: 'cyl', d: [0.032, 0.03, 0.04], at: [0, 0.18, 0], c: 'wood-light', seg: 8 },  // cork
    ],
  },
  {
    id: 'red-potion', name: 'Red Potion', category: 'consumable', uses: ['drink', 'hold'],
    wear: { rot: [90, 0, 0] },
    tags: ['potion', 'red', 'vial', 'tonic', 'sobriety', 'glass'], emoji: ['🧪'], tint: 'red',
    grip: [0, 0.07, 0], about: 'A tall thin glass vial of red potion with a cork. The liquid is the tint.',
    examine: [
      'A tall thin vial, red as a rose gone wrong, with a cork that has been bitten.',
      'The Sobriety tonic and the Red potion come from the same shelf. Nobody remembers which one is the joke.',
      'Drink a small mouthful. A large one makes a gnome very brave and then very lying down.',
      'Rhyme from the Rockery: "Red for the wound and red for the rage, one drop before you turn the page."',
      'The glass is thin enough to read through. There is nothing to read, but gnomes check anyway.',
    ],
    parts: [
      { s: 'cyl', d: [0.04, 0.04, 0.14], at: [0, 0.07, 0], c: 'glass', seg: 8 },
      { s: 'cyl', d: [0.036, 0.036, 0.09], at: [0, 0.045, 0], c: 'tint', seg: 8 },    // liquid
      { s: 'cyl', d: [0.016, 0.02, 0.03], at: [0, 0.155, 0], c: 'glass', seg: 8 },   // neck
      { s: 'cyl', d: [0.02, 0.02, 0.03], at: [0, 0.185, 0], c: 'wood-light', seg: 8 }, // cork
    ],
  },
  {
    id: 'honeydew-flask', name: 'Honeydew Flask', category: 'consumable', uses: ['drink', 'eat', 'hold'],
    wear: { rot: [90, 0, 0] },
    tags: ['honey', 'honeydew', 'flask', 'jar', 'sweet', 'drink'], emoji: ['🍯', '💧'],
    grip: [0, 0.04, 0], about: 'A squat jar of golden honey with a cloth lid tied with string.',
    examine: [
      'A squat jar of golden honey, its cloth lid tied down with string that has been retied many times.',
      'Honeydew is what the bees leave on the leaves. Gnomes only get it after the bees have finished their argument.',
      'Tip: dip a stick in it, not a finger. A finger gets stuck, and so does the rest of the gnome.',
      'Gnome law: the honey belongs to whoever opened the jar, and everyone else gets the lid.',
      'The string is knotted in a pattern that nobody has been able to untie without a sharp rock.',
    ],
    parts: [
      { s: 'cyl', d: [0.075, 0.075, 0.07], at: [0, 0.035, 0], c: 'glass', seg: 10 },
      { s: 'cyl', d: [0.068, 0.068, 0.05], at: [0, 0.04, 0], c: 'honey', seg: 10 },
      { s: 'ball', d: [0.07], at: [0, 0.085, 0], scale: [1, 0.5, 1], c: 'cloth', seg: 8 },  // lid
      { s: 'cyl', d: [0.078, 0.078, 0.01], at: [0, 0.072, 0], c: 'straw', seg: 10 },     // string tie
      { s: 'box', d: [0.012, 0.03, 0.006], at: [0.03, 0.055, 0.078], c: 'straw' },        // dangling end
    ],
  },
  {
    id: 'rose-draught', name: 'Rose Draught', category: 'consumable', uses: ['drink', 'hold'],
    wear: { rot: [90, 0, 0] },
    tags: ['rose', 'draught', 'pink', 'bottle', 'potion', 'drink'], emoji: ['🌹'], tint: 'pink',
    grip: [0, 0.06, 0], about: 'A bottle of pink rose draught with a rose bud for a stopper. The liquid is the tint.',
    examine: [
      'A pink bottle with a rose bud pushed into the neck to keep the spill in.',
      'Rose draught for the heart and the bruise. Old gardeners called it perfume with a purpose.',
      'Tip: the bud is the stopper. Pull it and the smell gets out before you do.',
      'A rose has thorns, and so does this, once the draught wears off.',
      'The bottle has a label on the wrong side. Someone decided that was clever.',
    ],
    parts: [
      { s: 'cyl', d: [0.045, 0.045, 0.12], at: [0, 0.06, 0], c: 'glass', seg: 8 },
      { s: 'cyl', d: [0.04, 0.04, 0.09], at: [0, 0.045, 0], c: 'tint', seg: 8 },     // liquid
      { s: 'cyl', d: [0.018, 0.025, 0.04], at: [0, 0.14, 0], c: 'glass', seg: 8 },  // neck
      { s: 'ball', d: [0.03], at: [0, 0.18, 0], scale: [1, 1.2, 1], c: 'petal', seg: 6 }, // bud stopper
    ],
  },
  {
    id: 'ruby-draught', name: 'Ruby Draught', category: 'consumable', uses: ['drink', 'hold'],
    wear: { rot: [90, 0, 0] },
    tags: ['ruby', 'draught', 'goblet', 'wine', 'glass', 'drink'], emoji: ['🍷'], tint: 0x7a0f2a,
    grip: [0, 0.05, 0], about: 'A small stemmed goblet of dark red ruby draught. The liquid is the tint.',
    examine: [
      'A small stemmed goblet of dark red liquid, stem as thin as a straw and twice as breakable.',
      'Gnome toast: "To the Rockery, where the bottom is always up." It is said before every round.',
      'Hold it by the stem, or your thumb ends up in the drink.',
      'Gems are Tall-eyes. This is wine. Do not let the two get confused at the feast.',
      'There is a faint crack in the bowl that has been there since before anyone filled it.',
    ],
    parts: [
      { s: 'cyl', d: [0.05, 0.05, 0.012], at: [0, 0.006, 0], c: 'glass', seg: 8 },    // foot
      { s: 'cyl', d: [0.01, 0.01, 0.08], at: [0, 0.052, 0], c: 'glass', seg: 6 },     // stem
      { s: 'cyl', d: [0.04, 0.025, 0.06], at: [0, 0.122, 0], c: 'glass', seg: 8 },    // bowl
      { s: 'cyl', d: [0.036, 0.022, 0.03], at: [0, 0.135, 0], c: 'tint', seg: 8 },    // liquid
    ],
  },
  {
    id: 'sky-tonic', name: 'Sky Tonic', category: 'consumable', uses: ['drink', 'hold'],
    wear: { rot: [90, 0, 0] },
    tags: ['sky', 'tonic', 'flask', 'blue', 'glass', 'drink'], emoji: ['🧴'], tint: 0xa8dcf0,
    grip: [0, 0.06, 0], about: 'A flat-sided flask of pale sky-blue tonic with a screw cap. The liquid is the tint.',
    examine: [
      'A flat-sided flask of pale sky-blue liquid, with a screw cap that turns only in the right direction.',
      'Rain people say the tonic is bottled from the first clear day of spring. Sun people say the second.',
      'It fits in a pocket if the pocket is large and the gnome is not in a hurry.',
      'The cap is the most reliable part. Nobody trusts the liquid.',
      'Someone has painted a small cloud on the side. It has not rained since.',
    ],
    parts: [
      { s: 'box', d: [0.09, 0.12, 0.04], at: [0, 0.06, 0], c: 'glass' },
      { s: 'box', d: [0.082, 0.09, 0.032], at: [0, 0.045, 0], c: 'tint' },   // liquid
      { s: 'box', d: [0.06, 0.03, 0.035], at: [0, 0.135, 0], c: 'glass' },   // shoulder
      { s: 'cyl', d: [0.02, 0.02, 0.02], at: [0, 0.15, 0], c: 'glass', seg: 8 }, // neck
      { s: 'cyl', d: [0.026, 0.026, 0.03], at: [0, 0.17, 0], c: 'iron', seg: 8 }, // screw cap
    ],
  },
  {
    id: 'spigot-water', name: 'Spigot Water', category: 'consumable', uses: ['drink', 'hold'],
    wear: { rot: [90, 0, 0] },
    tags: ['spigot', 'water', 'canteen', 'drink', 'clay'], emoji: ['💧'],
    grip: [0, 0.08, 0], about: 'A clay canteen on a leather strap, with a water drop glowing at the spout.',
    examine: [
      'A clay canteen on a strap, with a single bead of water glowing at the spout.',
      'Spigot water is the one drink every gnome agrees on. It comes from the Spigot, and the Spigot never argues.',
      'Tip: fill the canteen before the queue forms. The line is long on hot afternoons.',
      'A gnome who drinks only spigot water is called sensible, which is an insult in Mossbottom.',
      'The drop never falls. Some say it is waiting for permission.',
    ],
    parts: [
      { s: 'ball', d: [0.08], at: [0, 0.072, 0], scale: [1, 0.9, 0.55], c: 'clay', seg: 8 },
      { s: 'cyl', d: [0.02, 0.024, 0.03], at: [0, 0.16, 0], c: 'clay', seg: 8 },    // neck
      { s: 'cyl', d: [0.026, 0.026, 0.02], at: [0, 0.185, 0], c: 'wood', seg: 8 },  // stopper
      { s: 'box', d: [0.02, 0.12, 0.012], at: [0, 0.1, 0.07], c: 'leather' },        // strap
      { s: 'ball', d: [0.018], at: [0, 0.205, 0], c: 'water', glow: true, seg: 6 },  // drop
    ],
  },
  {
    id: 'rust-oil', name: 'Rust Oil', category: 'consumable', uses: ['craft'],
    tags: ['rust', 'oil', 'can', 'tin', 'spout', 'lubricant'], emoji: ['🛢'],
    about: 'A dented tin can of rust oil with a long thin spout. Used to oil hinges and tools.',
    examine: [
      'A dented tin can with a long thin spout, rust on the seam and a dribble down the side.',
      'Oil keeps the hinges quiet. Quiet hinges mean nobody knows you are sneaking.',
      'Old rhyme: "Oil the gate and oil the door, never oil the fence once more."',
      'Pour slowly. The spout has opinions about speed.',
      'The can was dented by something very large and then flattened by something larger.',
    ],
    parts: [
      { s: 'cyl', d: [0.04, 0.04, 0.07], at: [0, 0.035, 0], c: 'iron', seg: 8 },
      { s: 'cyl', d: [0.041, 0.041, 0.03], at: [0, 0.035, 0], c: 'rust', seg: 8 },       // rusty band
      { s: 'cyl', d: [0.036, 0.04, 0.01], at: [0, 0.075, 0], c: 'iron-dark', seg: 8 },   // lid
      { s: 'cyl', d: [0.006, 0.008, 0.06], at: [0.02, 0.095, 0], rot: [0, 0, -40], c: 'iron-dark', seg: 6 }, // spout
    ],
  },
  {
    id: 'salt-pinch', name: 'Salt Pinch', category: 'consumable', uses: ['eat'],
    tags: ['salt', 'pinch', 'paper', 'grains', 'seasoning'], emoji: ['🧂'],
    about: 'A paper twist with a small heap of salt spilling out. Seasoning, eaten a pinch at a time.',
    examine: [
      'A tiny paper twist, folded tight, and a small white heap of grains spilling from it.',
      'Salt keeps the slugs honest, says the Compost Heap, and the Compost Heap has never been wrong.',
      'Use a pinch, not a handful. A handful is a crust, and a crust is a bad idea.',
      'It is called a pinch because that is how much you get before someone says "stop".',
      'The paper has a word on it, too faded to read. It may be "Sea". Gnomes do not know what that is.',
    ],
    parts: [
      { s: 'cone', d: [0.025, 0.06], at: [0, 0.03, 0], c: 'paper', seg: 6 },              // twist
      { s: 'ball', d: [0.05], at: [0, 0.02, 0.04], scale: [1, 0.4, 1], c: 'white', seg: 8 }, // heap
      { s: 'ball', d: [0.012], at: [0.04, 0.012, 0.04], c: 'white', seg: 5 },             // loose grains
    ],
  },
  {
    id: 'toadstool-stew', name: 'Toadstool Stew', category: 'food', uses: ['eat'],
    tags: ['toadstool', 'stew', 'bowl', 'soup', 'mushroom', 'food'], emoji: ['🍲'],
    about: 'A wooden bowl of brown toadstool stew with mushroom slices and a spoon across the rim.',
    examine: [
      'A wooden bowl of brown stew, mushroom slices floating like small boats, a spoon laid across the rim.',
      'Old saying: "Eat it hot, eat it wet, eat it before the mushrooms wake."',
      'Tip: the spoon is for eating. Use a finger and the mushrooms will sail off in protest.',
      'It is said the stew is never finished. Each gnome adds one thing and takes nothing away.',
      'Gnomes who finish a whole bowl are asked to speak at the Planting. Few have ever been ready.',
    ],
    parts: [
      { s: 'cyl', d: [0.09, 0.05, 0.07], at: [0, 0.035, 0], c: 'wood', seg: 10 },       // bowl
      { s: 'cyl', d: [0.082, 0.082, 0.012], at: [0, 0.06, 0], c: 'dirt', seg: 10 },     // stew
      { s: 'cyl', d: [0.018, 0.018, 0.006], at: [0.03, 0.07, 0], c: 'mushroom-cap', seg: 6 },  // slices
      { s: 'cyl', d: [0.018, 0.018, 0.006], at: [-0.025, 0.07, 0.02], c: 'mushroom-cap', seg: 6 },
      { s: 'cyl', d: [0.018, 0.018, 0.006], at: [0, 0.07, -0.035], c: 'mushroom-cap', seg: 6 },
      { s: 'box', d: [0.012, 0.008, 0.14], at: [0.05, 0.076, 0], c: 'wood-light' },     // spoon
    ],
  },
  {
    id: 'cheese-wedge', name: 'Cheese Wedge', category: 'food', uses: ['eat', 'collect'],
    tags: ['cheese', 'wedge', 'dairy', 'yellow', 'food'], emoji: ['🧀'],
    about: 'A yellow cheese wedge with dark holes. Tall at the front, thin at the back.',
    examine: [
      'A yellow wedge with holes in it, which gnomes say are where the cheese had its thoughts.',
      'Gnome law: a cheese with more holes than cheese is still a cheese.',
      'Tip: cut it thin and it lasts longer. Cut it thick and the holes are all that is left.',
      'Rhyme from the Hedgewood: "Yellow for the sun and holes for the rain, eat both and do not complain."',
      'The rind is the only part nobody argues about.',
    ],
    parts: [
      { s: 'wedge', d: [0.16, 0.09, 0.1], at: [0, 0.045, 0], c: 'yellow' },
      { s: 'ball', d: [0.012], at: [0.04, 0.034, 0], c: 'bark', seg: 5 },   // holes
      { s: 'ball', d: [0.012], at: [-0.03, 0.034, 0], c: 'bark', seg: 5 },
      { s: 'ball', d: [0.012], at: [0, 0.06, 0.03], c: 'bark', seg: 5 },
      { s: 'ball', d: [0.012], at: [0, 0.02, -0.02], c: 'bark', seg: 5 },
    ],
  },
  {
    id: 'fresh-peelings', name: 'Fresh Peelings', category: 'food', uses: ['eat', 'collect'],
    tags: ['fresh', 'peelings', 'peel', 'compost', 'green', 'orange', 'food'], emoji: ['🥬'],
    about: 'A curly heap of green and orange peel strips. Raw food, forage or kitchen scraps.',
    examine: [
      'A curly heap of green and orange strips, still damp and smelling of somebody else\'s lunch.',
      'Peelings are the first food of the Compost Heap, which is also the second and third.',
      'Tip: peel toward yourself. Peeling away gets a strip stuck on the face.',
      'Old saying: "What is thrown on the Verge is eaten by the Verge."',
      'Somebody has braided two strips together, which is either art or a warning.',
    ],
    parts: [
      { s: 'ring', d: [0.04, 0.008, 270], at: [0, 0.008, 0], rot: [90, 0, 0], c: 'leaf' },     // green curl
      { s: 'ring', d: [0.025, 0.007, 240], at: [0.02, 0.007, 0.01], rot: [90, 0, 0], c: 'orange' }, // orange curl
      { s: 'ring', d: [0.02, 0.006, 300], at: [-0.02, 0.018, -0.015], rot: [90, 0, 0], c: 'leaf' },
      { s: 'box', d: [0.08, 0.012, 0.012], at: [0, 0.03, 0], rot: [0, 35, 8], c: 'leaf' },
      { s: 'box', d: [0.07, 0.01, 0.012], at: [-0.03, 0.025, 0.02], rot: [0, -30, -10], c: 'orange' },
    ],
  },
  {
    id: 'stout-tankard', name: 'Stout Tankard', category: 'consumable', uses: ['drink', 'hold'],
    wear: { rot: [90, 0, 0] },
    tags: ['stout', 'stoutpot', 'tankard', 'ale', 'beer', 'mug', 'drink'], emoji: ['🍺'],
    grip: [0.09, 0.07, 0], about: 'A wooden tankard with iron bands, a handle and foam on top.',
    examine: [
      'A wooden tankard with iron bands, a handle the size of a gnome arm, and foam slopping over the rim.',
      'Stout is brewed in Thatchford and drunk in the Shed. Nobody has seen it leave either.',
      'Tip: hold it by the handle and keep the foam on the outside, where it counts.',
      'Gnome law: a full tankard makes a poor shield and a good argument.',
      'The iron bands are older than the wood. Nobody can remember which was put on first.',
    ],
    parts: [
      { s: 'cyl', d: [0.06, 0.055, 0.13], at: [0, 0.065, 0], c: 'wood', seg: 8 },
      { s: 'cyl', d: [0.062, 0.058, 0.012], at: [0, 0.04, 0], c: 'iron', seg: 8 },   // lower band
      { s: 'cyl', d: [0.062, 0.058, 0.012], at: [0, 0.11, 0], c: 'iron', seg: 8 },   // upper band
      { s: 'ring', d: [0.035, 0.008, 180], at: [0.07, 0.07, 0], c: 'wood' },        // handle
      { s: 'ball', d: [0.06], at: [0, 0.142, 0], scale: [1, 0.5, 1], c: 'wool', seg: 8 }, // foam
    ],
  },
  {
    id: 'clover-cig', name: 'Clover Cigarette', category: 'consumable', uses: ['hold', 'light'],
    tags: ['cig', 'cigs', 'cigarette', 'cigarillo', 'smoke', 'clover', 'pack'], emoji: ['🚬'],
    grip: [0, 0.015, 0], about: 'A rolled clover-and-dandelion cigarette with a glowing ember tip.',
    examine: [
      'Dried clover and dandelion fluff rolled tight in pale paper, with a tiny orange ember at the tip.',
      'Gnome saying: "A good smoke keeps the dew out of your beard and the midges out of your eyes."',
      'Tip: keep the glowing end pointed away from your hat.',
      'Tansy swears it sharpens the aim. Everybody else just likes how it looks.',
    ],
    parts: [
      { s: 'cyl', d: [0.012, 0.012, 0.035], at: [0, 0.0175, 0], c: 'terracotta', seg: 6 }, // filter
      { s: 'cyl', d: [0.012, 0.012, 0.09], at: [0, 0.08, 0], c: 'paper', seg: 6 },       // paper
      { s: 'ball', d: [0.013], at: [0, 0.128, 0], c: 'flame', glow: true, seg: 6 },      // ember
    ],
  },
  {
    id: 'seed-cake', name: 'Seed Cake', category: 'food', uses: ['eat'],
    tags: ['seed', 'cake', 'sweet', 'baked', 'food'], emoji: ['🍪'],
    about: 'A round flat cake studded with seeds. Baked, not picked.',
    examine: [
      'A round flat cake, golden underneath, studded on top with seeds nobody planted on purpose.',
      'Old saying: "A seed in the cake is a tree in the stomach, and a tree is a poor thing to carry."',
      'Tip: count the seeds before you eat. An odd number means someone has had one already.',
      'It keeps for a week in a tin, which is longer than most gnomes keep their promises.',
      'Someone wrote a name in the icing and then ate the name.',
    ],
    parts: [
      { s: 'cyl', d: [0.08, 0.08, 0.03], at: [0, 0.015, 0], c: 'wood-light', seg: 10 },
      { s: 'ball', d: [0.008], at: [0.03, 0.032, 0.02], c: 'bark', seg: 4 },   // seeds
      { s: 'ball', d: [0.008], at: [-0.03, 0.032, -0.02], c: 'bark', seg: 4 },
      { s: 'ball', d: [0.008], at: [0, 0.032, -0.035], c: 'bark', seg: 4 },
      { s: 'ball', d: [0.008], at: [0.02, 0.032, 0.04], c: 'bark', seg: 4 },
      { s: 'ball', d: [0.008], at: [-0.04, 0.032, 0.01], c: 'bark', seg: 4 },
    ],
  },
  {
    id: 'bread-loaf', name: 'Bread Loaf', category: 'food', uses: ['eat'],
    tags: ['bread', 'loaf', 'crust', 'baked', 'food'], emoji: ['🍞'],
    about: 'A crusty oval loaf with slashes across the top. Baked, not picked.',
    examine: [
      'A crusty oval loaf, slashed across the top so it can breathe, or so the baker says.',
      'Old saying: "Bread before the rain, and rain before the bread, and both are gone before the Charter is read."',
      'Tip: knock the bottom. A hollow sound means it is done. A dull one means you are holding a rock.',
      'It can be used as a shield in a pinch, and in a pinch it usually is.',
      'The crust is so hard that gnomes say the Kiln must have baked it, and the Kiln made gnomes too.',
    ],
    parts: [
      { s: 'ball', d: [0.09], at: [0, 0.063, 0], scale: [1, 0.7, 0.65], c: 'wood-light', seg: 10 },
      { s: 'box', d: [0.03, 0.01, 0.01], at: [-0.02, 0.12, 0], rot: [0, 30, 0], c: 'straw' },   // slash
      { s: 'box', d: [0.03, 0.01, 0.01], at: [0.02, 0.12, 0], rot: [0, -30, 0], c: 'straw' },  // slash
    ],
  },
  {
    id: 'crab-apple', name: 'Crab Apple', category: 'food', uses: ['eat', 'collect'],
    tags: ['crab', 'apple', 'fruit', 'red', 'garden', 'food'], emoji: ['🍎'],
    about: 'A small red crab apple with a stalk and a leaf. Sour, forage food.',
    examine: [
      'A small red apple with a stalk and one leaf, sour enough to make a gnome wince at the Planting.',
      'Old rhyme: "One apple a day keeps the Mower away." Nobody has tested it.',
      'Tip: crab apples are for jam, not eating. Eating one raw is a lesson, and the lesson is sour.',
      'It is smaller than a gnome\'s fist and about as stubborn.',
      'A worm lives in the core of this one. The worm is pleased with the arrangement.',
    ],
    parts: [
      { s: 'ball', d: [0.04], at: [0, 0.036, 0], scale: [1, 0.9, 1], c: 'red', seg: 8 },
      { s: 'cyl', d: [0.004, 0.004, 0.025], at: [0, 0.085, 0], c: 'wood-dark', seg: 4 }, // stalk
      { s: 'box', d: [0.04, 0.004, 0.02], at: [0.02, 0.1, 0], rot: [0, 0, -20], c: 'leaf' }, // leaf
    ],
  },
  {
    id: 'blackberry', name: 'Blackberry', category: 'food', uses: ['eat', 'collect'],
    tags: ['blackberry', 'berry', 'bramble', 'purple', 'fruit', 'forage', 'food'], emoji: ['🫐'],
    about: 'A cluster of dark purple berries on a short stalk. Forage food.',
    examine: [
      'A cluster of dark purple berries on a short stalk, each one a tiny drum of juice.',
      'Bramble-picking is a Hedgewood tradition. The brambles pick back.',
      'Tip: pick them in the morning, before the birds. The birds have already eaten the best ones.',
      'Stains everything it touches, including the gnome, the basket and whoever said it was a bad idea.',
      'A berry that is not quite ripe is called a warning. A very ripe one is called lunch.',
    ],
    parts: [
      { s: 'cyl', d: [0.006, 0.006, 0.06], at: [0, 0.03, 0], c: 'leaf-dark', seg: 4 },  // stalk
      { s: 'ball', d: [0.02], at: [0, 0.07, 0], c: 0x4a2366, seg: 6 },
      { s: 'ball', d: [0.02], at: [0.022, 0.06, 0.012], c: 0x4a2366, seg: 6 },
      { s: 'ball', d: [0.02], at: [-0.022, 0.06, 0.012], c: 0x4a2366, seg: 6 },
      { s: 'ball', d: [0.02], at: [0, 0.05, -0.02], c: 0x4a2366, seg: 6 },
      { s: 'ball', d: [0.02], at: [0.012, 0.09, 0.01], c: 0x4a2366, seg: 6 },
      { s: 'box', d: [0.05, 0.004, 0.02], at: [0.03, 0.04, 0], rot: [0, 0, 25], c: 'leaf' },
    ],
  },
  {
    id: 'clover-tea', name: 'Clover Tea', category: 'consumable', uses: ['drink', 'hold'],
    wear: { rot: [90, 0, 0] },
    tags: ['clover', 'tea', 'cup', 'clay', 'herbal', 'drink'], emoji: ['🍵'], tint: 'moss',
    grip: [0, 0.035, 0], about: 'A little clay cup of clover tea on a saucer. The tea is the tint.',
    examine: [
      'A little clay cup on a saucer, with a green clover leaf floating on top and steam curling off it.',
      'Rain people say clover tea makes bad luck slide off. The bad luck, so far, has not noticed.',
      'Tip: let it sit until the leaf sinks. A leaf that stays up is a leaf that is lying to you.',
      'Gnome manners say to drink it all, and then say it was thin.',
      'Three leaves on a clover, and only one is lucky. Gnomes disagree over which.',
    ],
    parts: [
      { s: 'cyl', d: [0.08, 0.07, 0.01], at: [0, 0.005, 0], c: 'clay', seg: 10 },       // saucer
      { s: 'cyl', d: [0.05, 0.035, 0.05], at: [0, 0.035, 0], c: 'clay', seg: 10 },      // cup
      { s: 'cyl', d: [0.046, 0.046, 0.006], at: [0, 0.056, 0], c: 'tint', seg: 10 },    // tea
      { s: 'ring', d: [0.018, 0.005, 180], at: [0.05, 0.035, 0], c: 'clay' },           // handle
      { s: 'ball', d: [0.012], at: [-0.01, 0.072, 0.01], scale: [1, 0.4, 1], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.012], at: [0.012, 0.075, 0], scale: [1, 0.4, 1], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.012], at: [0, 0.078, -0.012], scale: [1, 0.4, 1], c: 'leaf', seg: 6 },
    ],
  },
  {
    id: 'acorn-flour-sack', name: 'Acorn Flour', category: 'food', uses: ['eat', 'collect'],
    tags: ['acorn', 'flour', 'sack', 'grain', 'burlap', 'food'], emoji: [],
    about: 'A tiny tied sack of acorn flour, dusted around the foot. Forage food.',
    examine: [
      'A tiny sack, tied at the neck with a bit of leather, and a dusting of pale flour spilt around the foot.',
      'Acorn flour is bitter until it is not. Gnomes say the Planting taught them the trick.',
      'Tip: sift it twice. Once and you get the grit. Twice and you get the grit, but finer.',
      'It is the only sack in Mossbottom without a hole. Nobody has checked the bottom.',
      'Old rhyme: "Acorns in autumn and flour in spring, and never ask who baked the thing."',
    ],
    parts: [
      { s: 'ball', d: [0.05], at: [0, 0.045, 0], scale: [1, 0.9, 0.9], c: 'burlap', seg: 8 },
      { s: 'cyl', d: [0.015, 0.03, 0.02], at: [0, 0.095, 0], c: 'burlap', seg: 8 },   // gathered neck
      { s: 'cyl', d: [0.018, 0.018, 0.008], at: [0, 0.085, 0], c: 'leather', seg: 8 }, // tie
      { s: 'ball', d: [0.012], at: [0.07, 0.004, 0.02], scale: [1, 0.3, 1], c: 'white', seg: 5 }, // flour
      { s: 'ball', d: [0.012], at: [-0.065, 0.004, -0.03], scale: [1, 0.3, 1], c: 'white', seg: 5 },
      { s: 'ball', d: [0.012], at: [0.02, 0.004, -0.07], scale: [1, 0.3, 1], c: 'white', seg: 5 },
    ],
  },
  {
    id: 'pickled-slug', name: 'Pickled Slug', category: 'food', uses: ['eat'],
    tags: ['pickled', 'slug', 'jar', 'brine', 'food', 'joke'], emoji: [],
    tint: 0xb8c24a,
    about: 'A glass jar of green brine with a coiled slug inside. A joke food. The brine is the tint.',
    examine: [
      'A glass jar of brine with a coiled green-yellow slug inside, very still, very pleased with itself.',
      'Gnome joke at the Planting: "Pickled slug is good for the nerves. The slug is not consulted."',
      'Tip: eat it with bread, so the bread can take the blame.',
      'It has been in the jar so long the label is a memory.',
      'The brine is green on purpose. Nobody remembers the purpose.',
    ],
    parts: [
      { s: 'cyl', d: [0.06, 0.06, 0.09], at: [0, 0.045, 0], c: 'glass', seg: 8 },       // jar
      { s: 'cyl', d: [0.056, 0.056, 0.07], at: [0, 0.045, 0], c: 'tint', seg: 8 },      // brine
      { s: 'cyl', d: [0.064, 0.064, 0.02], at: [0, 0.1, 0], c: 'iron', seg: 8 },        // lid
      { s: 'ball', d: [0.02], at: [0, 0.03, 0], scale: [1.5, 0.7, 1], c: 0xb5c94a, seg: 6 }, // slug body
      { s: 'ball', d: [0.014], at: [0.02, 0.035, 0.01], scale: [1, 0.8, 1], c: 0xb5c94a, seg: 6 }, // coil
      { s: 'ball', d: [0.008], at: [-0.03, 0.03, 0], c: 0xb5c94a, seg: 4 },            // head
    ],
  },
  {
    id: 'drumstick-platter', name: 'Drumstick Platter', category: 'food', uses: ['eat', 'collect'],
    tags: ['chicken', 'drumstick', 'platter', 'plate', 'roast', 'bird', 'food', 'feast'], emoji: [],
    about: 'A white plate with a roast bird and two drumsticks with bone knobs. Feast food; no tint.',
    examine: [
      'A white plate with a roast bird in the middle and a drumstick on either side, knobbed like tiny clubs.',
      'Feasts at the Planting always ended with one bone left on the plate. Nobody took it. That is tradition.',
      'Tip: pick it up by the knob. The knob is the bit with no meat, so nobody argues over it.',
      'It has been on the plate since the last feast. The bird has been very patient about it.',
      'Gnomes who eat the whole thing without sharing are called Drumstick Kings. The title lasts about an hour.',
    ],
    parts: [
      { s: 'cyl', d: [0.175, 0.175, 0.02], at: [0, 0.01, 0], c: 'white', seg: 14 },   // plate
      { s: 'ball', d: [0.065], at: [0, 0.075, 0], scale: [1.3, 0.9, 1], c: 0xb5651d, seg: 8 }, // roast bird
      { s: 'cyl', d: [0.02, 0.026, 0.12], at: [0.07, 0.06, 0.02], rot: [0, 0, -70], c: 0xc97a3a, seg: 8, mirror: true }, // drumstick
      { s: 'ball', d: [0.022], at: [0.126, 0.0805, 0.02], c: 'white', seg: 8, mirror: true }, // bone knob
    ],
  },
  {
    id: 'espresso-cup', name: 'Espresso Cup', category: 'food', uses: ['drink', 'collect'],
    tags: ['espresso', 'coffee', 'cup', 'saucer', 'drink', 'tonic'], emoji: [],
    about: 'A small white cup of dark coffee on a saucer, with a handle. Fixed colours; no tint.',
    examine: [
      'A white cup on a white saucer, with a dark brown ring of coffee just under the rim.',
      'Gnome saying: strong enough to stand a spoon in. Nobody has tried. The spoon is still in the cupboard.',
      'Tip: let it cool a little, or the bitter goes straight to the eyebrows.',
      'Brought up from the Shed by a gnome who insisted it was a tonic. It was, in the sense that it woke everyone.',
      'The cup is wider at the top so the coffee has room to be dramatic.',
    ],
    parts: [
      { s: 'cyl', d: [0.1, 0.1, 0.012], at: [0, 0.006, 0], c: 'white', seg: 14 },      // saucer
      { s: 'cyl', d: [0.075, 0.055, 0.09], at: [0, 0.057, 0], c: 'white', seg: 12 },   // cup, wider at the top
      { s: 'cyl', d: [0.068, 0.068, 0.008], at: [0, 0.096, 0], c: 0x3e2723, seg: 12 }, // coffee, just below the rim
      { s: 'ring', d: [0.02, 0.006], at: [0.078, 0.058, 0], c: 'white' },              // handle
    ],
  },
];
