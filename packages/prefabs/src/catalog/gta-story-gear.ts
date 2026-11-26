// Gnome Theft Auto: wearable achievement rewards for story acts I and II (E20). Rules: docs/roadmaps/prefab-library/_common.md.
import type { PrefabDef } from '../types';

export const GTA_STORY_GEAR: readonly PrefabDef[] = [
  {
    id: 'house-key-lanyard', name: 'House Key Lanyard', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.12, 0] },
    tags: ['key', 'lanyard', 'brass', 'red', 'cord', 'flat', 'neck', 'mortgage', 'reward', 'gta'], emoji: [],
    about: 'Mortgage Gnome: a brass house key on a red lanyard worn round the neck. Plain colours, no tint.',
    examine: [
      'A brass house key on a red lanyard, the key worn flat against the chest where it can be felt at all times.',
      'Saying of the Flat: a key is a promise made in brass, and a gnome with a key has always been promised something.',
      'Tip: check the key is still there before you climb the stairs. The stairs do not check for you.',
      'Joke: the key opens Flat 3B, which is mostly a door with ambitions and a draughty cupboard behind it.',
      'The lanyard was knotted by someone who had signed a great many papers that week, and it shows in the tidy loops.',
    ],
    parts: [
      { s: 'ring', d: [0.15, 0.008], at: [0, 0.08, 0], rot: [90, 0, 0], c: 'red', seg: 10 },         // lanyard loop
      { s: 'box', d: [0.02, 0.1, 0.008], at: [0, 0.05, 0.15], c: 'red' },         // strap, front
      { s: 'cyl', d: [0.018, 0.018, 0.006], at: [0, 0.06, 0.16], rot: [90, 0, 0], c: 'brass', seg: 8 },  // key bow
      { s: 'box', d: [0.012, 0.04, 0.006], at: [0, 0.02, 0.16], c: 'brass' },                      // key shaft
    ],
  },
  {
    id: 'bottlecap-pendant', name: 'Bottlecap Pendant', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.12, 0] },
    tags: ['cap', 'plate', 'pendant', 'red', 'crimp', 'cord', 'neck', 'bottlecap', 'reward', 'gta'], emoji: [],
    about: 'Cap Back: a red crimped metal plate on a leather cord, worn as a pendant. Plain colours, no tint.',
    examine: [
      'A red crimped metal plate on a cord, its rim scalloped all the way round like the edge of a very small pie.',
      'Saying of the Bodega: a plate with teeth holds the fizz in, and a gnome with teeth holds the rest of the street in line.',
      'Tip: keep the crimped side outward. The smooth side is for the cord, and the cord is for nothing else.',
      'Joke: the plate has a cork lining that no gnome has ever found a use for, and several have tried to eat it.',
      'Carried home by a gnome who said it was a token of a deal, and it has been a token of that deal ever since.',
    ],
    parts: [
      { s: 'ring', d: [0.14, 0.006], at: [0, 0.08, 0], rot: [90, 0, 0], c: 'leather', seg: 10 },    // cord loop
      { s: 'box', d: [0.008, 0.05, 0.008], at: [0, 0.06, 0.13], c: 'leather' },                  // cord, front
      { s: 'cyl', d: [0.035, 0.035, 0.012], at: [0, 0.037, 0.14], rot: [90, 0, 0], c: 'red', seg: 10 }, // plate
      { s: 'ring', d: [0.03, 0.004], at: [0, 0.037, 0.147], c: 'steel', seg: 12 },                // crimped rim
    ],
  },
  {
    id: 'quarter-inch-ruler', name: 'Quarter-Inch Ruler', category: 'tool', uses: ['hold', 'wear-hands'],
    grip: [0, 0.05, 0],
    tags: ['ruler', 'rule', 'wood', 'folding', 'mark', 'red', 'measure', 'hand', 'reward', 'gta'], emoji: [],
    about: 'Off by a Quarter-Inch: a folding wooden rule held upright at the grip, with one red mark across it. About 0.22 tall.',
    examine: [
      'A folding wooden rule, held upright, with one red mark across it and a row of tiny black ticks running up the side.',
      'Saying of the Bench: measure twice and cut once, and if you cannot agree on the first measure, cut anyway.',
      'Tip: read the rule from the front, not the side. The side is where the ticks lie, and the ticks lie with it.',
      'Joke: the red mark is a quarter-inch, which the gnome who painted it insists is a whole lot of inches to him.',
      'The hinge has been folded so often that it hums when it opens, a sound several sleeping gnomes have learned to dread.',
    ],
    parts: [
      { s: 'box', d: [0.04, 0.22, 0.008], at: [0, 0.11, 0], c: 'wood-light' },                 // rule body
      { s: 'box', d: [0.04, 0.006, 0.01], at: [0, 0.15, 0], c: 'red' },                         // red mark
      { s: 'box', d: [0.02, 0.003, 0.01], at: [0.01, 0.05, 0], c: 'ink' },                     // tick
      { s: 'box', d: [0.02, 0.003, 0.01], at: [0.01, 0.09, 0], c: 'ink' },                     // tick
      { s: 'cyl', d: [0.006, 0.006, 0.012], at: [0, 0.02, 0], rot: [90, 0, 0], c: 'brass', seg: 6 }, // hinge
    ],
  },
  {
    id: 'court-headband', name: 'Court Headband', category: 'armor', uses: ['wear-head'],
    tags: ['headband', 'band', 'green', 'white', 'stripe', 'sweat', 'court', 'pip', 'head', 'reward', 'gta'], emoji: [],
    about: 'Swish: a green terry headband with a white stripe round it, worn low on the brow. Plain colours, no tint.',
    examine: [
      'A green terry headband with a white stripe round it, worn low across the brow the way the court players wear theirs.',
      'Saying of the Court: a band that stays put is a band that was tied by someone who meant it.',
      'Tip: tie it at the back, not the front. A knot at the front is a knot that will be in your eyes by the second game.',
      'Joke: Pip wears one of these too, but Pip insists the stripe is a racing line and not a sweat stain.',
      'The stripe was stitched on by a gnome who ran out of white thread halfway, so the last inch is slightly greener.',
    ],
    parts: [
      { s: 'cyl', d: [0.165, 0.165, 0.04], at: [0, 0.02, 0], c: 'green', seg: 12 },              // band (min.y = 0)
      { s: 'cyl', d: [0.167, 0.167, 0.012], at: [0, 0.03, 0], c: 'white', seg: 12 },              // white stripe
      { s: 'box', d: [0.03, 0.03, 0.03], at: [0, 0.03, -0.17], c: 'white' },                     // knot
    ],
  },
  {
    id: 'parade-banner-cape', name: 'Parade Banner Cape', category: 'armor', uses: ['wear-back'],
    tags: ['banner', 'cape', 'parade', 'red', 'yellow', 'boot', 'cloth', 'back', 'reward', 'gta'], emoji: [],
    about: 'Dress Rehearsal Clean: a short red parade banner worn as a cape, a yellow stripe and a black boot sewn on. Plain colours, no tint.',
    examine: [
      'A short red parade banner worn as a cape, with a yellow stripe across the middle and a black boot sewn on near the hem.',
      'Saying of the Float: a banner that is carried high is seen by everyone, and a banner that is dropped is seen by the mower.',
      'Tip: keep the boot the right way up. A boot upside down is a boot that is walking backwards, and that does not help anyone.',
      'Joke: the boot was sewn on by a gnome who had only ever seen a boot in a picture, and the picture was of a different boot.',
      'The pole is a broom handle that has been carefully sanded and never once used to sweep, a fact the broom still resents.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.4, 0.01], at: [0, 0.2, 0], c: 'red' },                // banner (min.y = 0)
      { s: 'cyl', d: [0.008, 0.008, 0.34], at: [0, 0.4, 0], rot: [0, 0, 90], c: 'wood', seg: 6 }, // top pole
      { s: 'box', d: [0.3, 0.06, 0.012], at: [0, 0.2, 0.001], c: 'yellow' },                     // stripe
      { s: 'box', d: [0.08, 0.12, 0.014], at: [-0.01, 0.24, 0.003], c: 'black' },                // boot shaft
      { s: 'box', d: [0.12, 0.04, 0.014], at: [0.02, 0.14, 0.003], c: 'black' },                 // boot foot
    ],
  },
  {
    id: 'weathervane-pack', name: 'Weathervane Pack', category: 'armor', uses: ['wear-back'],
    tags: ['pack', 'backpack', 'rooster', 'weathervane', 'vane', 'pole', 'leather', 'back', 'reward', 'gta'], emoji: [],
    about: 'Fair-Weather Friend: a small leather pack with a rooster weathervane on a pole rising from the top. Plain colours, no tint.',
    examine: [
      'A small leather pack with two straps, and a little brass rooster on a pole rising from the top, turning slowly in the breeze.',
      'Saying of the Hen-House: a rooster that points the right way is worth three that only point at the weather.',
      'Tip: check the pole is tight before you go out. A loose pole turns in the wrong wind and gets the whole pack lost.',
      'Joke: the rooster has never once been right about the weather, but it has been right about the mood of every gnome nearby.',
      'The pole was taken from a garden stake, and it still has the faint marks of the stake that it came out of, a story kept quiet.',
    ],
    parts: [
      { s: 'box', d: [0.2, 0.3, 0.08], at: [0, 0.15, 0], c: 'leather' },                            // pack (min.y = 0)
      { s: 'box', d: [0.03, 0.3, 0.01], at: [0.07, 0.15, 0.045], c: 'leather-dark' },                // strap
      { s: 'cyl', d: [0.008, 0.008, 0.22], at: [0, 0.41, 0], c: 'iron', seg: 6 },                    // pole
      { s: 'ball', d: [0.04], at: [0, 0.56, 0], scale: [1.6, 0.9, 0.6], c: 'brass', seg: 6 },       // rooster body
      { s: 'ball', d: [0.02], at: [0.05, 0.6, 0], c: 'red', seg: 6 },                              // rooster head
    ],
  },
  {
    id: 'beige-cravat', name: 'Beige Cravat', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.12, 0] },
    tags: ['cravat', 'tie', 'ascot', 'beige', 'cloth', 'neck', 'knot', 'reward', 'gta'], emoji: [],
    about: 'Agreeable: a neat beige cravat knotted at the throat, two loose ends down the front. Plain colours, no tint.',
    examine: [
      'A neat beige cravat knotted at the throat, with two loose ends hanging down the front and a small pin at the knot.',
      'Saying of the Penthouse: a gnome in a cravat is a gnome who has agreed to something, and the cravat does not say what.',
      'Tip: tie the knot before the mirror, not after. The mirror has never once told a gnome the knot was crooked, out of politeness.',
      'Joke: the pin is shaped like a tiny key, and no gnome has yet been able to say which door it opens, or whether it opens one.',
      'The cloth was folded so many times in the drawer that it has a permanent crease, which the owner calls character.',
    ],
    parts: [
      { s: 'ring', d: [0.15, 0.01], at: [0, 0.09, 0], rot: [90, 0, 0], c: 'cloth', seg: 10 },      // collar band (min.y ~ 0.08)
      { s: 'ball', d: [0.03], at: [0, 0.06, 0.13], scale: [1.2, 1, 0.8], c: 'cloth', seg: 6 },    // knot
      { s: 'box', d: [0.05, 0.13, 0.01], at: [0.02, 0.075, 0.15], rot: [0, 0, -10], c: 'cloth' }, // end, front
      { s: 'box', d: [0.05, 0.11, 0.01], at: [-0.03, 0.07, 0.155], rot: [0, 0, 15], c: 'cloth' }, // end, front
      { s: 'ball', d: [0.008], at: [0, 0.06, 0.15], c: 'brass', seg: 6 },                        // pin
    ],
  },
  {
    id: 'mole-lantern-charm', name: 'Mole Lantern Charm', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.12, 0] },
    tags: ['charm', 'lantern', 'mole', 'brass', 'glow', 'chain', 'neck', 'burrow', 'reward', 'gta'], emoji: [],
    about: 'Neighbourly: a tiny brass lantern with a glowing pane and a little grey mole sitting on its top, on a chain. Glows.',
    examine: [
      'A tiny brass lantern with a glowing pane, a little grey mole sitting on its top like a lid, hung from a short chain.',
      'Saying of the Burrow: a light left on at the door is a promise to the mole, and the mole always comes back to check.',
      'Tip: keep the pane clean. A dirty pane is a dim light, and a dim light is an invitation for the mole to wander off.',
      'Joke: the mole has been sitting on the lantern so long that it now thinks the lantern is a very small and very warm hill.',
      'The chain was carried through the burrow in a pocket, and it has the fluff of a hundred tunnels still tangled in its links.',
    ],
    parts: [
      { s: 'ring', d: [0.15, 0.006], at: [0, 0.08, 0], rot: [90, 0, 0], c: 'brass', seg: 12 },       // chain loop
      { s: 'cyl', d: [0.035, 0.035, 0.05], at: [0, 0.035, 0.14], c: 'brass', seg: 6 },            // lantern body
      { s: 'ball', d: [0.02], at: [0, 0.035, 0.155], c: 'spark', glow: true, seg: 6 },            // lit pane
      { s: 'ball', d: [0.025], at: [0, 0.075, 0.13], scale: [1, 0.6, 1], c: 'fur', seg: 6 },      // mole
    ],
  },
  {
    id: 'flamingo-plume', name: 'Flamingo Plume', category: 'armor', uses: ['wear-head'],
    tags: ['feather', 'plume', 'pink', 'flamingo', 'hat', 'band', 'black', 'head', 'reward', 'gta'], emoji: [],
    about: 'Standing Ovation: one tall pink feather stood up in a black hat band. Plain colours, no tint.',
    examine: [
      'One tall pink feather stood up in a black hat band, bending a little at the top as if listening to the sermon below.',
      'Saying of the Pond: a flamingo stands on one leg so the other may rest, and a gnome in a plume may do the same.',
      'Tip: stand the feather before the sermon starts. A feather bent during the hymn is a feather that will not forgive you.',
      'Joke: the feather has the most dignified posture of any object in the garden, which is the only reason it was allowed in the church.',
      'It was plucked from a bird that was not in the least sorry about it, and it has the rosy blush of a bird that is still annoyed.',
    ],
    parts: [
      { s: 'cyl', d: [0.12, 0.12, 0.04], at: [0, 0.02, 0], c: 'black', seg: 10 },                 // hat band (min.y = 0)
      { s: 'cyl', d: [0.008, 0.008, 0.4], at: [0.03, 0.22, -0.02], rot: [0, 0, -8], c: 'pink', seg: 4 }, // shaft
      { s: 'ball', d: [0.04], at: [0.04, 0.3, -0.02], scale: [0.6, 2.2, 0.4], c: 'pink', seg: 6 }, // vane
    ],
  },
  {
    id: 'pie-tin', name: 'Pie Tin', category: 'tool', uses: ['hold', 'wear-hands'],
    grip: [0, 0.05, 0],
    wear: { rot: [90, 0, 0] },
    tags: ['pie', 'tin', 'plate', 'crust', 'lattice', 'steel', 'handle', 'hand', 'reward', 'gta'], emoji: [],
    about: 'Gentle Hands: a round steel pie tin on a short wooden handle, a honey-coloured lattice crust on the face. About 0.22 tall.',
    examine: [
      'A round steel pie tin on a short wooden handle, its face covered with a honey-coloured lattice crust, each strip laid just so.',
      'Saying of the Kitchen: a pie is a promise kept in a tin, and the tin is only ever as good as the gnome who carries it.',
      'Tip: lift it by the handle, not the rim. The rim is hot, and the crust is hotter, and a pie dropped is a pie lost forever.',
      'Joke: the lattice took a whole afternoon to weave, and it is still the only thing in Gnorwin that has ever been woven that neatly.',
      'The tin has a faint dent in one side that was put there by a gnome who was carried home in a hurry, a fact not yet forgotten.',
    ],
    parts: [
      { s: 'box', d: [0.02, 0.1, 0.02], at: [0, 0.05, 0], c: 'wood' },                            // handle
      { s: 'cyl', d: [0.11, 0.11, 0.015], at: [0, 0.2, 0], rot: [90, 0, 0], c: 'steel', seg: 12 }, // tin
      { s: 'box', d: [0.16, 0.01, 0.01], at: [0, 0.2, 0.01], rot: [0, 0, 45], c: 'honey' },       // lattice strip
      { s: 'box', d: [0.16, 0.01, 0.01], at: [0, 0.2, 0.01], rot: [0, 0, -45], c: 'honey' },      // lattice strip
    ],
  },
  {
    id: 'shop-rag-scarf', name: 'Shop Rag Scarf', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.12, 0] },
    tags: ['rag', 'scarf', 'cloth', 'oily', 'shop', 'red', 'black', 'neck', 'knot', 'reward', 'gta'], emoji: [],
    about: 'On the House: an oily red shop rag knotted round the neck as a scarf, two ends hanging down the front. Plain colours, no tint.',
    examine: [
      'An oily red shop rag knotted round the neck as a scarf, its two ends hanging down the front with dark stains from the last job.',
      'Saying of the Workshop: a rag that has seen the inside of an engine is a rag that will not go out of fashion for years.',
      'Tip: wash the rag before the next job. A clean rag is for the neck, and an oily one is for the bench, and both are useful.',
      'Joke: the stains were there before the scarf, the scarf says, and it has never been able to prove otherwise.',
      'Knotted by Cass in the middle of a repair, who said it was for warmth and then went back to her work without another word.',
    ],
    parts: [
      { s: 'ring', d: [0.15, 0.012], at: [0, 0.08, 0], rot: [90, 0, 0], c: 'red', seg: 10 },       // rag band (min.y ~ 0.07)
      { s: 'box', d: [0.05, 0.14, 0.008], at: [0.03, 0.07, 0.15], rot: [0, 0, -8], c: 'red' },    // end, front
      { s: 'box', d: [0.04, 0.12, 0.008], at: [-0.04, 0.06, 0.155], rot: [0, 0, 12], c: 'black' }, // oil stain end
    ],
  },
  {
    id: 'chrome-knuckle-glove', name: 'Chrome-Knuckle Glove', category: 'armor', uses: ['hold', 'wear-hands'],
    grip: [0, 0.05, 0],
    tags: ['glove', 'gauntlet', 'knuckle', 'chrome', 'steel', 'leather', 'fist', 'hand', 'reward', 'gta'], emoji: [],
    about: 'On the House: a leather work glove, fist closed, with a steel plate across the knuckles. Held at the cuff. About 0.22 tall.',
    examine: [
      'A leather work glove with its fist closed around nothing, and a steel plate across the knuckles, polished bright at the edges.',
      'Saying of the Workshop: a fist that has been mended is stronger than one that never broke, and the plate is the proof.',
      'Tip: hold it by the cuff. The knuckles are for the work, and the cuff is for the gnome who has to carry the work home.',
      'Joke: the plate is called chrome by everyone who has never seen chrome, which is most of the gnomes in Gnorwin.',
      'Worn by Cass for so long that the leather has shaped itself to her fist, and nobody else can get it on without a fight.',
    ],
    parts: [
      { s: 'cyl', d: [0.05, 0.055, 0.09], at: [0, 0.045, 0], c: 'leather-dark', seg: 8 },      // cuff (min.y = 0)
      { s: 'box', d: [0.08, 0.1, 0.075], at: [0, 0.135, 0], c: 'leather' },                     // fist
      { s: 'box', d: [0.08, 0.025, 0.012], at: [0, 0.165, 0.04], c: 'steel' },                  // knuckle plate
    ],
  },
];
