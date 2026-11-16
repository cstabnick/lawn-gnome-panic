// Weapons: swung, thrown, shot, cast. Upright, handle at the bottom, `grip` on the handle.
import type { PrefabDef } from '../types';

export const WEAPONS: PrefabDef[] = [
  {
    id: 'iron-sword', name: 'Iron Sword', category: 'weapon', uses: ['hold', 'swing'],
    tags: ['sword', 'blade', 'iron', 'melee', 'slash'], emoji: ['🗡', '⚔'],
    grip: [0, 0.07, 0], about: 'A gnome-length arming sword. Plain iron, leather grip, brass guard.',
    examine: [
      'Plain iron, honestly hammered. The edge has been sharpened so often the blade is a little narrower than it started.',
      'The guard is brass from a melted button. Smiths swear a button-guard turns a blow; nobody has proved otherwise.',
      'Old saying: "A sword is a trowel that gave up gardening."',
      'Swing it, don\'t stab it. Gnome arms are short and beetles are wide.',
      'There are tiny notches on the grip. Someone was counting something.',
    ],
    parts: [
      { s: 'ball', d: [0.03], at: [0, 0, 0], c: 'brass' },                       // pommel
      { s: 'cyl', d: [0.022, 0.025, 0.12], at: [0, 0.07, 0], c: 'leather' },      // grip
      { s: 'box', d: [0.16, 0.025, 0.04], at: [0, 0.14, 0], c: 'brass' },         // guard
      { s: 'box', d: [0.06, 0.34, 0.012], at: [0, 0.32, 0], c: 'steel' },        // blade
      { s: 'cone', d: [0.042, 0.07], at: [0, 0.525, 0], scale: [1, 1, 0.3], c: 'steel', seg: 4 }, // tip
    ],
  },
  {
    id: 'old-trowel', name: 'Old Trowel', category: 'weapon', uses: ['hold', 'swing', 'dig'],
    tags: ['trowel', 'garden', 'dig', 'melee', 'stab', 'starter'], emoji: [],
    grip: [0, 0.06, 0], about: 'A rusty garden trowel, wood handle, pointed scoop. The first thing every gnome swings.',
    examine: [
      'Rust on the scoop, a split in the handle, and a maker\'s mark worn down to a smudge.',
      'The first tool of the Planting, the songs say: the Tall Ones gave every gnome a trowel and a patch.',
      'It has dug a thousand flowerbeds and at least one argument.',
      'Good for slugs, better for soil. It does not care which.',
      'Hold it to the light and you can almost make out a foot stamped under the rust.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.026, 0.14], at: [0, 0.06, 0], c: 'wood' },
      { s: 'cyl', d: [0.012, 0.012, 0.06], at: [0, 0.16, 0], c: 'iron-dark' },     // tang
      { s: 'box', d: [0.11, 0.16, 0.012], at: [0, 0.26, 0.004], rot: [8, 0, 0], c: 'rust' },
      { s: 'cone', d: [0.078, 0.07], at: [0, 0.37, 0.014], rot: [8, 0, 0], scale: [1, 1, 0.2], c: 'rust', seg: 4 },
    ],
  },
  {
    id: 'iron-trowel', name: 'Shard-iron Trowel', category: 'weapon', uses: ['hold', 'swing', 'dig'],
    tags: ['trowel', 'steel', 'iron', 'bright', 'garden', 'dig', 'melee'], emoji: ['🥄'],
    grip: [0, 0.07, 0], about: 'A bright steel trowel: wide steel scoop, dark wood handle, brass ferrule. A wider old-trowel.',
    examine: [
      'Bright steel scoop on a dark wood handle. It is the only thing in the garden that shines before it is used.',
      'Shard-iron does not rust, the songs say. Gnomes say that is only because nobody has left one out in the rain long enough.',
      'Old saying: a trowel that shines has not dug anything yet.',
      'Wider than the old trowel, so it moves more soil per argument.',
      'A gnome can see their face in the scoop. Most gnomes take one look and go back to digging.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.026, 0.14], at: [0, 0.07, 0], c: 'wood-dark' },     // handle
      { s: 'cyl', d: [0.031, 0.031, 0.02], at: [0, 0.14, 0], c: 'brass' },        // ferrule
      { s: 'cyl', d: [0.012, 0.012, 0.07], at: [0, 0.18, 0], c: 'iron-dark' },    // tang
      { s: 'box', d: [0.14, 0.17, 0.012], at: [0, 0.29, 0.004], rot: [8, 0, 0], c: 'steel' }, // scoop
      { s: 'cone', d: [0.07, 0.08], at: [0, 0.4, 0.014], rot: [8, 0, 0], scale: [1, 1, 0.2], c: 'steel', seg: 4 }, // tip
    ],
  },
  {
    id: 'twig-slingshot', name: 'Twig Slingshot', category: 'weapon', uses: ['hold', 'shoot'],
    tags: ['slingshot', 'sling', 'twig', 'forked', 'wood', 'leather', 'ranged', 'catapult'], emoji: ['🪃'],
    grip: [0, 0.07, 0], about: 'A forked twig slingshot with a leather band and pouch. Wood and leather, no tint.',
    examine: [
      'A forked twig, bent by patience, with a leather band across the prongs and a pouch for the stone.',
      'Robin-feather slings are said to fly straighter. Robins disagree.',
      'Old saying: a sling in the hand is worth two stones in the pouch.',
      'Pull to the cheek, not the ear. Aim low: a stone that goes high is a stone that finds a bird.',
      'The fork is the best bit. It was a branch, then a twig, then a plan.',
    ],
    parts: [
      { s: 'cyl', d: [0.013, 0.012, 0.22], at: [0, 0.11, 0], c: 'wood' },                     // handle
      { s: 'cyl', d: [0.01, 0.01, 0.12], at: [-0.035, 0.24, 0], rot: [0, 0, 25], c: 'wood', mirror: true }, // prongs
      { s: 'box', d: [0.13, 0.018, 0.018], at: [0, 0.3, 0], c: 'leather' },                  // band
      { s: 'ball', d: [0.03], at: [0, 0.27, 0.015], scale: [1.1, 0.9, 0.5], c: 'leather' },  // pouch
    ],
  },
  {
    id: 'hedge-shears', name: 'Hedge Shears', category: 'weapon', uses: ['hold', 'swing'],
    tags: ['shears', 'scissors', 'blade', 'hedge', 'brass', 'garden', 'bronze', 'cut'], emoji: ['✂'],
    grip: [0, 0.1, 0], about: 'Long steel blades on a brass pivot with two wooden handles, slightly open.',
    examine: [
      'Two long steel blades on a brass pivot, with wooden handles to hold. They have trimmed many hedges and one gnome\'s fringe.',
      'The hedges of Hedgewood have been cut square since before anyone can remember. Gnomes do not ask who did it.',
      'A pair of blades that do not agree on anything, and still manage to meet in the middle.',
      'Keep them oiled. Dry shears squeak, and squeaking things get noticed by bigger things.',
      'Old saying: two blades make a pair, one blade is just a stick with ideas.',
    ],
    parts: [
      { s: 'ball', d: [0.02], at: [0, 0.2, 0], c: 'brass' },                                           // pivot
      { s: 'cyl', d: [0.012, 0.012, 0.18], at: [-0.035, 0.1, 0], rot: [0, 0, -12], c: 'wood', mirror: true }, // handles
      { s: 'box', d: [0.03, 0.2, 0.008], at: [-0.01, 0.31, 0.007], rot: [0, 0, 6], c: 'steel', mirror: true }, // blades
    ],
  },
  {
    id: 'clover-wand', name: 'Clover Wand', category: 'weapon', uses: ['hold', 'cast'],
    tags: ['wand', 'clover', 'stick', 'rod', 'magic', 'bloom', 'slate'], emoji: ['🪄'],
    grip: [0, 0.06, 0], about: 'A short pale wand with a three-leaf clover at the tip and a glowing green bead. Bloom magic.',
    examine: [
      'Pale stick, a three-leaf clover at the tip, and a green bead at its heart. Gnome magic is small and it knows it.',
      'Bloom magic, the old songs say, makes things grow. Gnomes have only ever tested it on weeds.',
      'Four leaves bring luck, three leaves bring Cloverfield. Count them before you cast.',
      'Wave it slowly. Quick waving only gets the beetles interested.',
      'It was a slate rod once, and it still ticks when nobody is looking.',
    ],
    parts: [
      { s: 'cyl', d: [0.012, 0.012, 0.22], at: [0, 0.11, 0], c: 'bone' },                                    // stick
      { s: 'ball', d: [0.03], at: [0, 0.285, 0], scale: [1, 0.9, 0.5], c: 'leaf' },                           // top leaf
      { s: 'ball', d: [0.03], at: [-0.028, 0.25, 0], scale: [1, 0.9, 0.5], c: 'leaf', mirror: true },       // side leaves
      { s: 'ball', d: [0.016], at: [0, 0.262, 0.025], c: 'emerald', glow: true },                           // bead
    ],
  },
  {
    id: 'hazel-staff', name: 'Hazel Staff', category: 'weapon', uses: ['hold', 'cast'],
    tags: ['staff', 'stave', 'hazel', 'wood', 'magic', 'gem', 'crook'], emoji: ['🪄'],
    tint: 'amethyst', grip: [0, 0.25, 0],
    about: 'A tall knobbly hazel staff with a crook holding a glowing gem. The gem is tinted.',
    examine: [
      'Tall hazel staff, knobbly all the way up, with a crook at the top that holds a glowing gem.',
      'A hedge-mage once leaned on one for three days. The hedge has never grown the same way since.',
      'Old saying: a staff is for leaning on, and sometimes for hitting the things you were leaning away from.',
      'Walk with it, do not wave it. A staff that is waved goes out of fashion very quickly.',
      'The gem inside is probably a Tall-eye. It is really glass, and it still glows.',
    ],
    parts: [
      { s: 'cyl', d: [0.02, 0.017, 0.9], at: [0, 0.45, 0], c: 'wood' },                       // shaft
      { s: 'ball', d: [0.024], at: [0.02, 0.28, 0], c: 'wood-dark' },                         // knot
      { s: 'ball', d: [0.024], at: [-0.02, 0.55, 0], c: 'wood-dark' },                       // knot
      { s: 'ball', d: [0.022], at: [0.018, 0.72, 0], c: 'wood-dark' },                       // knot
      { s: 'ring', d: [0.06, 0.014, 270], at: [0, 0.96, 0], c: 'wood-light' },               // crook
      { s: 'ball', d: [0.035], at: [0, 0.96, 0], c: 'tint', glow: true },                    // gem
    ],
  },
  {
    id: 'reed-blowpipe', name: 'Reed Blowpipe', category: 'weapon', uses: ['hold', 'shoot'],
    tags: ['blowpipe', 'pipe', 'reed', 'tube', 'dart', 'blow', 'elder', 'hollow', 'stem'], emoji: ['🎋'],
    grip: [0, 0.2, 0], about: 'A long reed blowpipe with ring joints, a bone mouthpiece and a feathered dart.',
    examine: [
      'A long hollow reed with three ring joints and a mouthpiece. A feathered dart rides beside it, ready.',
      'Elder-pipe blowpipes are said to carry a dart the length of a lawn. Nobody has measured the lawn.',
      'Blow from the belly, not the cheeks. Cheeks are for sulking.',
      'The feather keeps the dart flying forward, which is more than can be said for most gnomes.',
      'Hollow-stem reeds grow by the pond. The pond gnomes call them trumpets and will not explain why.',
    ],
    parts: [
      { s: 'cyl', d: [0.018, 0.018, 0.7], at: [0, 0.35, 0], c: 'straw' },                  // tube
      { s: 'cyl', d: [0.024, 0.024, 0.01], at: [0, 0.14, 0], c: 'wood-dark' },              // joint
      { s: 'cyl', d: [0.024, 0.024, 0.01], at: [0, 0.35, 0], c: 'wood-dark' },              // joint
      { s: 'cyl', d: [0.024, 0.024, 0.01], at: [0, 0.56, 0], c: 'wood-dark' },              // joint
      { s: 'cyl', d: [0.026, 0.02, 0.04], at: [0, 0.72, 0], c: 'bone' },                    // mouthpiece
      { s: 'cyl', d: [0.005, 0.005, 0.2], at: [0.035, 0.13, 0.02], c: 'wood-light' },       // dart shaft
      { s: 'box', d: [0.012, 0.05, 0.003], at: [0.035, 0.2, 0.02], c: 'feather' },          // feather
    ],
  },
  {
    id: 'garden-mallet', name: 'Garden Mallet', category: 'weapon', uses: ['hold', 'swing'],
    tags: ['mallet', 'hammer', 'wood', 'barrel', 'garden', 'melee', 'iron'], emoji: ['🔨'],
    grip: [0, 0.2, 0], about: 'A wooden barrel head with iron bands on a long handle.',
    examine: [
      'A barrel of oak on a long handle, banded with iron so it does not split. It has seen a lot of fence posts.',
      'Gnome law: the head should be heavier than the argument.',
      'Used for knocking in tent pegs and, now and then, the opinions of others.',
      'Swing from the shoulder and let the barrel do the work. The barrel does not get tired.',
      'Someone carved a row of tiny flowers into the head. It is the only thing in the garden that looks cared for.',
    ],
    parts: [
      { s: 'cyl', d: [0.02, 0.02, 0.5], at: [0, 0.25, 0], c: 'wood' },                                // handle
      { s: 'cyl', d: [0.07, 0.07, 0.2], at: [0, 0.5, 0], rot: [0, 0, 90], c: 'wood-light' },         // barrel
      { s: 'cyl', d: [0.075, 0.075, 0.02], at: [-0.06, 0.5, 0], rot: [0, 0, 90], c: 'iron-dark' },   // band
      { s: 'cyl', d: [0.075, 0.075, 0.02], at: [0.06, 0.5, 0], rot: [0, 0, 90], c: 'iron-dark' },    // band
    ],
  },
  {
    id: 'hand-fork', name: 'Hand Fork', category: 'weapon', uses: ['hold', 'swing', 'dig'],
    tags: ['fork', 'tines', 'hand', 'garden', 'dig', 'iron', 'prong'], emoji: ['🍴'],
    grip: [0, 0.07, 0], about: 'A short wood-handled hand fork with three iron tines curving forward.',
    examine: [
      'Short handle and three tines curving forward, like a hand that is about to grab something.',
      'Old saying: a fork for the soil, and three more for the things that hide in it.',
      'Lift roots gently. Ripping them out is what gnomes do when they are in a hurry.',
      'It is called a hand fork because it fits one. Gnome logic is like that.',
      'The tines are bent a little forward. Nobody remembers doing that on purpose.',
    ],
    parts: [
      { s: 'cyl', d: [0.018, 0.016, 0.14], at: [0, 0.07, 0], c: 'wood' },                       // handle
      { s: 'box', d: [0.07, 0.02, 0.02], at: [0, 0.15, 0], c: 'iron-dark' },                     // collar
      { s: 'cyl', d: [0.006, 0.004, 0.13], at: [-0.022, 0.22, 0.01], rot: [15, 0, 0], c: 'iron', mirror: true }, // outer tines
      { s: 'cyl', d: [0.006, 0.004, 0.13], at: [0, 0.23, 0.015], rot: [15, 0, 0], c: 'iron' },   // middle tine
    ],
  },
  {
    id: 'hay-hook', name: 'Hay Hook', category: 'weapon', uses: ['hold', 'swing'],
    tags: ['hook', 'hay', 'bale', 'iron', 'wood', 'pull', 'crook'], emoji: ['🪝'],
    grip: [0, 0.3, 0], about: 'A T-bar wooden handle with a curved iron hook at the foot.',
    examine: [
      'A T-bar handle, and an iron hook at the foot curved like a question mark.',
      'Hay is pulled with hooks, the Planting says. Gnomes do not know what hay is for, but they like pulling things.',
      'Hook the edge of a bale, pull, and tell the bale who is boss.',
      'Hang it on the Fence when you are done. It will not stay there without help.',
      'Old saying: what you hook, you keep, unless it is a gnome.',
    ],
    parts: [
      { s: 'cyl', d: [0.016, 0.016, 0.36], at: [0, 0.33, 0], c: 'wood' },                       // handle
      { s: 'cyl', d: [0.02, 0.02, 0.12], at: [0, 0.51, 0], rot: [0, 0, 90], c: 'wood-light' },  // T-bar
      { s: 'ring', d: [0.07, 0.012, 270], at: [0, 0.082, 0], c: 'iron' },                       // hook
    ],
  },
  {
    id: 'iron-pick', name: 'Iron Pick', category: 'weapon', uses: ['hold', 'swing', 'dig', 'mine'],
    tags: ['pick', 'pickaxe', 'mattock', 'iron', 'mine', 'dig', 'rock'], emoji: ['⛏'],
    grip: [0, 0.15, 0], about: 'A long wood handle and a curved double-pointed iron head.',
    examine: [
      'A long wood handle and a curved iron head, pointed at both ends. The smith who made it liked both ends equally.',
      'Picks like this have pecked every rock on the Rockery. The rocks are keeping score.',
      'Dig with the point. The head is for hooking things and for pride.',
      'Swing it overhead and let the weight fall. Gravity is the only smith who never asks for payment.',
      'Scratches on the handle count the rocks it has hit. The count is not finished.',
    ],
    parts: [
      { s: 'cyl', d: [0.02, 0.018, 0.5], at: [0, 0.25, 0], c: 'wood' },                        // handle
      { s: 'box', d: [0.05, 0.03, 0.02], at: [0, 0.5, 0], c: 'iron-dark' },                    // collar
      { s: 'ring', d: [0.12, 0.018, 180], at: [0, 0.5, 0], c: 'iron' },                        // curved head
      { s: 'cone', d: [0.03, 0.08], at: [0.13, 0.5, 0], rot: [0, 0, -90], seg: 4, c: 'steel', mirror: true }, // points
    ],
  },
  {
    id: 'war-hoe', name: 'War Hoe', category: 'weapon', uses: ['hold', 'swing', 'dig'],
    tags: ['hoe', 'war', 'blade', 'ribbon', 'garden', 'dig', 'sharp', 'haybale', 'family'], emoji: ['🪓', '⛏'],
    grip: [0, 0.2, 0], about: 'A long wood-handled hoe with a flat sharpened blade at a right angle and a red ribbon.',
    examine: [
      'Long handle, a flat iron blade set at a right angle, a sharp edge, and a red ribbon tied below.',
      'The Haybale Family has a hoe for every season and a grudge for every hoe.',
      'The ribbon is for luck, or so you know which end is which when the light is bad.',
      'Chop the weeds at the root, then chop the root for good measure.',
      'Old saying: a sharp hoe is a hoe that gets borrowed and not returned.',
    ],
    parts: [
      { s: 'cyl', d: [0.02, 0.02, 0.6], at: [0, 0.3, 0], c: 'wood' },                          // handle
      { s: 'box', d: [0.12, 0.07, 0.01], at: [0.05, 0.6, 0], c: 'iron' },                       // blade
      { s: 'box', d: [0.12, 0.012, 0.014], at: [0.05, 0.565, 0], c: 'steel' },                 // sharpened edge
      { s: 'box', d: [0.03, 0.09, 0.006], at: [0, 0.42, 0.02], c: 'red' },                     // ribbon
    ],
  },
  {
    id: 'lasso-sling', name: 'Lasso-and-Sling', category: 'weapon', uses: ['hold', 'throw'],
    tags: ['lasso', 'rope', 'sling', 'coil', 'loop', 'leather', 'string'], emoji: ['🪢'],
    grip: [0, 0.04, 0], about: 'A coiled rope lasso with a loose loop and a small leather sling pouch.',
    examine: [
      'Three rope rings stacked into a coil, a loose loop hanging from the top, and a little leather pouch.',
      'Rope is string that has made up its mind. Gnomes twist it until it stays put.',
      'Throw the loop over the target, then pull. The target will object, but that is part of the fun.',
      'Old saying: coil it clockwise and the rope will never tangle with your heart.',
      'The pouch holds a stone or two. Keep the stones and the rope apart, or they will argue.',
    ],
    parts: [
      { s: 'ring', d: [0.05, 0.012], at: [0, 0.012, 0], rot: [90, 0, 0], c: 'leather' },        // coil bottom
      { s: 'ring', d: [0.05, 0.012], at: [0, 0.04, 0], rot: [90, 0, 0], c: 'leather-dark' },    // coil middle
      { s: 'ring', d: [0.05, 0.012], at: [0, 0.068, 0], rot: [90, 0, 0], c: 'leather' },        // coil top
      { s: 'ring', d: [0.07, 0.008], at: [0.04, 0.14, 0], rot: [70, 20, 0], c: 'burlap' },      // loose loop
      { s: 'ball', d: [0.03], at: [0, 0.1, 0.035], scale: [1.2, 0.8, 0.7], c: 'leather' },      // pouch
    ],
  },
  {
    id: 'marble-shooter', name: 'Marble Shooter', category: 'weapon', uses: ['hold', 'shoot'],
    tags: ['marble', 'shooter', 'tube', 'popgun', 'glass', 'ruby', 'wood'], emoji: ['🔴'],
    grip: [0, 0.05, 0], about: 'A short wooden tube on a leather grip with a red glass marble loaded at the mouth.',
    examine: [
      'A short wood tube on a leather grip, with a red glass marble loaded at the mouth. The marble was a Tall-eye once.',
      'Tall-eyes are glass, the songs say. The marble in this shooter is very much a Tall-eye.',
      'Keep the marble dry and the tube clear. A grain of soil in the bore will make it spit.',
      'Old saying: one marble, one shot, one hole in the hedge.',
      'The marble is red, which the gnomes say makes it faster. It does not.',
    ],
    parts: [
      { s: 'cyl', d: [0.022, 0.022, 0.1], at: [0, 0.05, 0], c: 'leather' },                 // grip
      { s: 'cyl', d: [0.028, 0.026, 0.16], at: [0, 0.18, 0], c: 'wood-dark' },               // tube
      { s: 'ball', d: [0.03], at: [0, 0.275, 0], c: 'ruby' },                                // marble
    ],
  },
  {
    id: 'mole-claw', name: 'Mole King Claw', category: 'weapon', uses: ['hold', 'swing'],
    tags: ['claw', 'mole', 'hand', 'bone', 'king', 'paw', 'grip', 'talon'], emoji: ['🦴'],
    grip: [0, 0.07, 0], about: 'A big pale three-claw hand on a leather-wrapped bone grip.',
    examine: [
      'A big pale hand with three hooked claws on a grip wrapped in leather. Smaller than the mole, but plenty.',
      'The Mole King had three claws and one attitude. The songs say a gnome took the claw, and the gnome has not given it back.',
      'Hold it low and hook the thing you want to pull out of the ground.',
      'Old saying: three claws for digging, one for holding grudges.',
      'The bone is pale because worms have cleaned it. The worms were not asked.',
    ],
    parts: [
      { s: 'cyl', d: [0.02, 0.02, 0.14], at: [0, 0.07, 0], c: 'bone' },                       // grip bone
      { s: 'cyl', d: [0.024, 0.024, 0.08], at: [0, 0.07, 0], c: 'leather' },                  // leather wrap
      { s: 'box', d: [0.13, 0.05, 0.08], at: [0, 0.165, 0], c: 'bone' },                       // palm
      { s: 'cone', d: [0.018, 0.1], at: [-0.045, 0.24, 0], rot: [10, 0, 0], seg: 5, c: 'chalk', mirror: true }, // outer claws
      { s: 'cone', d: [0.02, 0.12], at: [0, 0.25, 0], rot: [10, 0, 0], seg: 5, c: 'chalk' },   // middle claw
    ],
  },
  {
    id: 'ranch-spade', name: 'Ranch Spade', category: 'weapon', uses: ['hold', 'dig'],
    tags: ['spade', 'shovel', 'ranch', 'dig', 'blade', 'grip', 'iron', 'wood'], emoji: ['🪏'],
    grip: [0, 0.42, 0], about: 'A long wood shaft with a D-grip on top and a flat square iron blade at the bottom.',
    examine: [
      'A long wood shaft with a D-grip at the top and a flat square iron blade at the bottom. The blade is the business end.',
      'Old saying: the spade is the shovel\'s elder brother, and smells of more soil.',
      'Hold it mid-shaft and push down with the foot. Gnome feet are small, but very determined.',
      'Turn the sod, then turn it again. The lawn always grows back, and so does the argument.',
      'The blade has a dent in it the exact shape of a fork. Nobody will say whose fork.',
    ],
    parts: [
      { s: 'box', d: [0.12, 0.16, 0.012], at: [0, 0.08, 0], c: 'iron' },                       // blade
      { s: 'cyl', d: [0.016, 0.016, 0.52], at: [0, 0.42, 0], c: 'wood' },                      // shaft
      { s: 'ring', d: [0.05, 0.016, 180], at: [0, 0.68, 0], c: 'wood-light' },                  // D-grip
    ],
  },
  {
    id: 'royal-spear', name: 'Royal Spear', category: 'weapon', uses: ['hold', 'swing', 'throw'],
    tags: ['spear', 'lance', 'pike', 'trident', 'prong', 'royal', 'pennant', 'blue'], emoji: ['🔱'],
    grip: [0, 0.4, 0], about: 'A tall wood shaft with a three-pronged steel head and a small blue pennant.',
    examine: [
      'A tall shaft with a three-pronged steel head and a small blue pennant. It stands taller than most gnomes, which is the point.',
      'The songs say the first royal spear was used to reach the top of the Fence. Nobody has checked.',
      'Point the head at the enemy. It is the only part that is meant to do anything.',
      'Old saying: a spear in the hand is worth three pennants in the Shed.',
      'The pennant is blue, the colour of the sky. Gnomes have seen the sky once and did not like it.',
    ],
    parts: [
      { s: 'cyl', d: [0.016, 0.014, 1.0], at: [0, 0.5, 0], c: 'wood' },                       // shaft
      { s: 'cyl', d: [0.018, 0.016, 0.06], at: [0, 0.98, 0], c: 'iron-dark' },                  // socket
      { s: 'cone', d: [0.022, 0.14], at: [0, 1.08, 0], seg: 4, c: 'steel' },                   // centre prong
      { s: 'cone', d: [0.018, 0.1], at: [-0.03, 1.0, 0], rot: [0, 0, 20], seg: 4, c: 'steel', mirror: true }, // side prongs
      { s: 'box', d: [0.12, 0.05, 0.005], at: [0.07, 0.9, 0], c: 'blue' },                    // pennant
    ],
  },
  {
    id: 'willow-switch', name: 'Willow Switch', category: 'weapon', uses: ['hold', 'swing'],
    tags: ['willow', 'switch', 'cane', 'whip', 'stick', 'green', 'leaves', 'bough'], emoji: ['🌿'],
    grip: [0, 0.06, 0], about: 'A thin green willow switch that bends, with a few leaves still on it.',
    examine: [
      'A thin green stick that bends a long way before it snaps. A few leaves are still stuck to it.',
      'Willow bends, the saying goes, so a gnome can be told off without breaking.',
      'Old saying: a switch that bends is a switch that stings later.',
      'Keep it wet, or it snaps the first time it is used.',
      'The leaves are the only soft part. They fall off when the stick is angry.',
    ],
    parts: [
      { s: 'cyl', d: [0.009, 0.007, 0.26], at: [0, 0.13, 0], rot: [0, 0, -6], c: 'moss' },    // lower stem
      { s: 'cyl', d: [0.007, 0.006, 0.26], at: [0.058, 0.38, 0], rot: [0, 0, -20], c: 'moss' }, // upper stem
      { s: 'ball', d: [0.022], at: [-0.025, 0.18, 0.01], scale: [1.5, 0.5, 0.8], c: 'leaf' },   // leaf
      { s: 'ball', d: [0.022], at: [0.03, 0.3, 0.01], scale: [1.5, 0.5, 0.8], c: 'leaf' },      // leaf
      { s: 'ball', d: [0.022], at: [0.09, 0.44, -0.01], scale: [1.5, 0.5, 0.8], c: 'leaf' },    // leaf
    ],
  },
  {
    id: 'thorn-dagger', name: 'Thorn Dagger', category: 'weapon', uses: ['hold', 'swing', 'throw'],
    tags: ['dagger', 'knife', 'thorn', 'blade', 'stab', 'melee', 'cloth'], emoji: ['🗡'],
    grip: [0, 0.045, 0], about: 'A short curved thorn blade with a cloth-wrapped grip. Bone-coloured blade.',
    examine: [
      'A short curved thorn for a blade, wrapped in cloth at the grip. It is nastier than it looks.',
      'Thorns protect roses, the Charters say. A thorn is a rose\'s argument, made short.',
      'Old saying: a thorn in the hand is worth two in the rose.',
      'Cloth on the grip stops it slipping. A slipping thorn gives gnomes new cracks.',
      'The blade is short. Gnome wisdom says a short blade is easy to forget you are holding.',
    ],
    parts: [
      { s: 'cyl', d: [0.018, 0.018, 0.09], at: [0, 0.045, 0], c: 'cloth' },                    // grip
      { s: 'box', d: [0.06, 0.016, 0.024], at: [0, 0.098, 0], c: 'bark' },                     // guard
      { s: 'cone', d: [0.026, 0.2], at: [0, 0.2, 0], rot: [0, 0, -6], scale: [1, 1, 0.45], seg: 5, c: 'bone' }, // thorn
    ],
  },
  {
    id: 'acorn-club', name: 'Acorn Club', category: 'weapon', uses: ['hold', 'swing'],
    tags: ['club', 'cudgel', 'branch', 'acorn', 'knot', 'wood', 'bludgeon', 'stick'], emoji: [],
    grip: [0, 0.12, 0], about: 'A thick knotted branch with an acorn bound to the end.',
    examine: [
      'A thick knotted branch with an acorn bound to the end. It is heavier than it looks and smells of autumn.',
      'Acorns are oaks in waiting, the songs say. A club is an oak with a grudge.',
      'Swing from the shoulder and let the acorn do the talking.',
      'Every oak was once an acorn. Most acorns never see the inside of a fight.',
      'The knots are where the branch tried to grow the other way. Gnomes respect that.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.018, 0.4], at: [0, 0.2, 0], c: 'wood' },                       // branch
      { s: 'ball', d: [0.012], at: [0.025, 0.2, 0], c: 'wood-dark' },                         // knot
      { s: 'ball', d: [0.012], at: [-0.02, 0.3, 0.01], c: 'wood-dark' },                     // knot
      { s: 'cyl', d: [0.036, 0.036, 0.02], at: [0, 0.4, 0], c: 'leather' },                   // binding
      { s: 'ball', d: [0.035], at: [0, 0.45, 0], scale: [1, 1.1, 1], c: 'wood-light' },       // acorn nut
      { s: 'ball', d: [0.04], at: [0, 0.475, 0], scale: [1, 0.4, 1], c: 'bark' },             // acorn cap
    ],
  },
  {
    id: 'pebble-pouch', name: 'Pebble Pouch', category: 'weapon', uses: ['throw', 'collect'],
    tags: ['pouch', 'pebble', 'stone', 'ammo', 'ammunition', 'sling', 'leather'], emoji: [],
    about: 'A small leather pouch of sling stones, spilling out. Ammunition, not held.',
    examine: [
      'A small leather pouch with sling stones spilling out of the top. It is not a weapon yet, only a plan.',
      'Stones are the only thing in the garden that never needs feeding.',
      'Gnome law: a stone in the pouch is worth two in the hand, but only one in the sling.',
      'Old saying: keep the pouch tied and the stones stay where they belong.',
      'Someone counted the stones once. There were fourteen, and one of them was a button.',
    ],
    parts: [
      { s: 'ball', d: [0.05], at: [0, 0.04, 0], scale: [1, 0.8, 0.9], c: 'leather' },          // pouch
      { s: 'cyl', d: [0.014, 0.02, 0.02], at: [0, 0.08, 0], c: 'leather-dark' },               // tie
      { s: 'ball', d: [0.018], at: [0.06, 0.018, 0.03], c: 'stone' },                          // stone
      { s: 'ball', d: [0.018], at: [0.08, 0.018, -0.02], c: 'stone-dark' },                    // stone
      { s: 'ball', d: [0.018], at: [-0.05, 0.018, 0.05], c: 'stone' },                         // stone
    ],
  },
];
