// Pay 'n' Glaze prefabs (ornaments): nine hood ornaments. Each bolts onto the bonnet at its origin (a chrome base at y 0).
import type { PrefabDef } from '../types';

const SKIN = 0xe8b893;
const PINK = 0xff7eb6;
const TEAL = 0x2aa6a0;
const MIST = 0x9fd8ff;
const HAT_RED = 0xd8342c;
const ACORN_GOLD = 0xe0b030;
const ACORN_CAP = 0xb8861e;

// Every ornament stands on this chrome mounting base.
const BASE: PrefabDef['parts'][number][] = [
  { s: 'cyl', d: [0.05, 0.06, 0.03], at: [0, 0.015, 0], c: 'steel', seg: 10 },
];

export const GTA_GLAZE_ORNAMENTS: readonly PrefabDef[] = [
  {
    id: 'glaze-ornament-hat', name: 'Mini Gnome Hat', category: 'prop', uses: ['place'],
    tags: ['glaze', 'ornament', 'hood', 'hat', 'red', 'cone'], emoji: [],
    about: 'Pay \'n\' Glaze hood ornament: the Mini Gnome Hat. A red cone hat with a white band and gold buckle on a chrome base. Ornament slot; no tint.',
    examine: [
      'A tiny red pointed hat with a floppy brim, a white band and a gold buckle the size of a gnome eye.',
      'Gnome saying: a hat on the bonnet is worth two on the head, and the bonnet never complains.',
      'Tip: glue it on, do not spit on it. Spit does not hold, and glaze mends the crack when the clay gives.',
      'Joke: it is a hat for a hat, which the Hat Watch say is the sort of logic only a hat would accept.',
      'Stitched inside the brim, in very small letters: FIRED FOR YOUR PLEASURE, NOT FOR THE RAIN.',
    ],
    parts: [
      ...BASE,
      { s: 'cyl', d: [0.11, 0.11, 0.015], at: [0, 0.0375, 0], c: HAT_RED, seg: 10 },
      { s: 'cone', d: [0.09, 0.2], at: [0, 0.145, 0], c: HAT_RED, seg: 10 },
      { s: 'cyl', d: [0.082, 0.082, 0.02], at: [0, 0.065, 0], c: 'white', seg: 10 },
      { s: 'box', d: [0.03, 0.025, 0.012], at: [0, 0.065, 0.085], c: 'gold' },
    ],
  },
  {
    id: 'glaze-ornament-acorn', name: 'Golden Acorn', category: 'prop', uses: ['place'],
    tags: ['glaze', 'ornament', 'hood', 'acorn', 'gold'], emoji: [],
    about: 'Pay \'n\' Glaze hood ornament: the Golden Acorn. A gold acorn with a darker cap on a short post over a chrome base. Ornament slot; no tint.',
    examine: [
      'A gold acorn with a darker cap and a short stalk, shining like a Tall-eye when the sun is on it.',
      'Planting saying: the oak is only an acorn that was not stolen. Gold ones are stolen on principle.',
      'Tip: keep it on the bonnet and out of the hedge, where the squirrels have a long memory.',
      'Joke: it is solid gold, so it is very heavy, and so is the gnome who has to carry it home.',
      'Someone has filled one tiny crack in the cap with clear glaze, which makes it the only mended acorn in Turfton.',
    ],
    parts: [
      ...BASE,
      { s: 'cyl', d: [0.012, 0.012, 0.04], at: [0, 0.05, 0], c: 'wood-dark', seg: 6 },
      { s: 'ball', d: [0.07], at: [0, 0.14, 0], scale: [1, 1.25, 1], c: ACORN_GOLD, seg: 8 },
      { s: 'ball', d: [0.075], at: [0, 0.2, 0], scale: [1, 0.5, 1], c: ACORN_CAP, seg: 8 },
      { s: 'cyl', d: [0.008, 0.01, 0.03], at: [0, 0.2525, 0], c: 'wood-dark', seg: 6 },
    ],
  },
  {
    id: 'glaze-ornament-snail', name: 'Chrome Snail', category: 'prop', uses: ['place'],
    tags: ['glaze', 'ornament', 'hood', 'snail', 'chrome', 'silver'], emoji: [],
    about: 'Pay \'n\' Glaze hood ornament: the Chrome Snail. A silver coiled-shell snail with eye stalks facing forward. Ornament slot; no tint.',
    examine: [
      'A silver snail with a coiled shell polished so bright it shows your hat in the reflection.',
      'Gnome saying: the snail is never in a hurry and never late, because it has never arrived anywhere.',
      'Tip: the eye stalks bend if you take a kerb at speed, so take the bumps slowly and with respect.',
      'Joke: it has been on the bonnet for three days and is still only at the end of the drive.',
      'A hairline crack runs round the shell, glued shut with a dab of grey glaze that the snail is very proud of.',
    ],
    parts: [
      ...BASE,
      { s: 'pill', d: [0.03, 0.14], rot: [90, 0, 0], at: [0, 0.065, 0], c: 'silver', seg: 8 },
      { s: 'ball', d: [0.07], at: [0, 0.12, -0.02], c: 'silver', seg: 8 },
      { s: 'ring', d: [0.045, 0.012], at: [0.06, 0.12, -0.02], rot: [0, 90, 0], c: 'steel', seg: 8, mirror: true },
      { s: 'cyl', d: [0.006, 0.006, 0.05], at: [0.02, 0.11, 0.09], c: 'silver', seg: 6, mirror: true },
      { s: 'ball', d: [0.012], at: [0.02, 0.14, 0.09], c: 'black', seg: 6, mirror: true },
    ],
  },
  {
    id: 'glaze-ornament-flamingo', name: 'Lawn Flamingo', category: 'prop', uses: ['place'],
    tags: ['glaze', 'ornament', 'hood', 'flamingo', 'pink', 'bird'], emoji: [],
    about: 'Pay \'n\' Glaze hood ornament: the Lawn Flamingo. A pink flamingo on one leg with an S-curved neck and a black-tipped beak. Ornament slot; no tint.',
    examine: [
      'A pink flamingo on one thin leg, its neck curled into a question mark and a black-tipped beak pointing ahead.',
      'Lawn saying: a bird that stands on one leg is either thinking or about to fall over, and it is never sure which.',
      'Tip: flamingos do not like the wind, so park with the bonnet out of it and keep the neck straight.',
      'Joke: it is pink, it stands perfectly still, and somehow it still gets the most attention at the Fence.',
      'Stamped on the base in neat black letters: THIS WAY UP. NO WET FEET.',
    ],
    parts: [
      ...BASE,
      { s: 'cyl', d: [0.008, 0.008, 0.10], at: [0, 0.08, -0.02], c: PINK, seg: 6 },
      { s: 'ball', d: [0.055], at: [0, 0.165, -0.02], scale: [1, 0.8, 1.5], c: PINK, seg: 8 },
      { s: 'cyl', d: [0.011, 0.011, 0.05], at: [0, 0.21, 0.02], rot: [30, 0, 0], c: PINK, seg: 6 },
      { s: 'cyl', d: [0.01, 0.01, 0.04], at: [0, 0.235, 0.045], rot: [-20, 0, 0], c: PINK, seg: 6 },
      { s: 'ball', d: [0.028], at: [0, 0.258, 0.055], c: PINK, seg: 8 },
      { s: 'cone', d: [0.01, 0.04], at: [0, 0.256, 0.09], rot: [90, 0, 0], c: 'black', seg: 6 },
    ],
  },
  {
    id: 'glaze-ornament-dragonfly', name: 'Dragonfly Pilot', category: 'prop', uses: ['place'],
    tags: ['glaze', 'ornament', 'hood', 'dragonfly', 'teal', 'goggles', 'pilot'], emoji: [],
    about: 'Pay \'n\' Glaze hood ornament: the Dragonfly Pilot. A teal dragonfly with four translucent wings and a goggled head on a thin post. Ornament slot; no tint.',
    examine: [
      'A long teal body with four see-through blue wings and a brown goggled head, leaning into the wind.',
      'Fen rhyme: the one that hovers over the water is the one that will never land in your beard.',
      'Tip: the wings are thin and bend easily, so do not lean on them, and never try to pull one off.',
      'Joke: the goggles are only painted on, but the pilot has never once been caught looking unhappy.',
      'One wing has a tiny brass pin through it, so the pilot always flies a touch crooked and proud of it.',
    ],
    parts: [
      ...BASE,
      { s: 'cyl', d: [0.006, 0.006, 0.07], at: [0, 0.065, 0], c: 'iron-dark', seg: 6 },
      { s: 'pill', d: [0.012, 0.12], rot: [90, 0, 0], at: [0, 0.11, -0.01], c: TEAL, seg: 6 },
      { s: 'ball', d: [0.02], at: [0, 0.11, 0.075], c: TEAL, seg: 6 },
      { s: 'ring', d: [0.018, 0.005], at: [0, 0.11, 0.09], c: 'leather', seg: 8 },
      { s: 'box', d: [0.11, 0.004, 0.04], at: [0.06, 0.13, 0.01], rot: [0, 20, 0], c: MIST, alpha: 0.6, mirror: true },
      { s: 'box', d: [0.11, 0.004, 0.04], at: [0.06, 0.13, -0.04], rot: [0, -20, 0], c: MIST, alpha: 0.6, mirror: true },
    ],
  },
  {
    id: 'glaze-ornament-trowel', name: 'Trowel Standard', category: 'prop', uses: ['place'],
    tags: ['glaze', 'ornament', 'hood', 'trowel', 'steel', 'wood'], emoji: [],
    about: 'Pay \'n\' Glaze hood ornament: the Trowel Standard. A steel blade on a wooden grip, tilted forward on a short post. Ornament slot; no tint.',
    examine: [
      'A flat steel blade on a short wooden grip, with a brass-grey ferrule where the two meet, tilted forward.',
      'Saying from the Rockery: a flat tongue of steel teaches the soil to open its mouth, if you ask nicely.',
      'Tip: the blade is for the soil and the grip is for your hand. Keep them in that order.',
      'Joke: one trowel has been on one bonnet for a whole season and the owner still calls the lawn finished.',
      'Someone has scratched a small arrow on the blade, always pointing at the nearest hedge.',
    ],
    parts: [
      ...BASE,
      { s: 'cyl', d: [0.01, 0.01, 0.05], at: [0, 0.055, 0], c: 'iron-dark', seg: 6 },
      { s: 'box', d: [0.06, 0.012, 0.16], at: [0, 0.1, 0.05], rot: [-20, 0, 0], c: 'steel' },
      { s: 'cyl', d: [0.02, 0.02, 0.02], at: [0, 0.0692, -0.0346], rot: [70, 0, 0], c: 'iron', seg: 8 },
      { s: 'cyl', d: [0.015, 0.015, 0.08], at: [0, 0.0521, -0.0816], rot: [70, 0, 0], c: 'wood', seg: 8 },
    ],
  },
  {
    id: 'glaze-ornament-rooster', name: 'Weathervane Rooster', category: 'prop', uses: ['place'],
    tags: ['glaze', 'ornament', 'hood', 'rooster', 'weathervane', 'iron', 'arrow'], emoji: [],
    about: 'Pay \'n\' Glaze hood ornament: the Weathervane Rooster. A black iron rooster with a red comb on a rod, crossed by an arrow. Ornament slot; no tint.',
    examine: [
      'A black iron rooster with a red comb, perched on a thin rod with a long arrow crossing it at the middle.',
      'Cloverfield rhyme: the rooster crows at the wind, and the wind always crows back, a little louder.',
      'Tip: check where the arrow points before you set off. It knows which way the wind is going, mostly.',
      'Joke: it has never once crowed, which the Hat Watch take as proof that it is hiding something.',
      'The tail feathers are notched with a single word in tiny letters: ONE WAY ONLY.',
    ],
    parts: [
      ...BASE,
      { s: 'cyl', d: [0.008, 0.008, 0.2], at: [0, 0.13, 0], c: 'iron-dark', seg: 6 },
      { s: 'box', d: [0.01, 0.01, 0.22], at: [0, 0.14, 0], c: 'iron-dark' },
      { s: 'cone', d: [0.02, 0.04], at: [0, 0.14, 0.13], rot: [90, 0, 0], c: 'iron-dark', seg: 6 },
      { s: 'cone', d: [0.02, 0.04], at: [0, 0.14, -0.13], rot: [-90, 0, 0], c: 'iron-dark', seg: 6 },
      { s: 'ball', d: [0.03], at: [0, 0.245, 0], scale: [1, 0.9, 1.5], c: 'iron-dark', seg: 8 },
      { s: 'wedge', d: [0.03, 0.04, 0.03], at: [0, 0.25, -0.04], rot: [0, 180, 0], c: 'iron-dark' },
      { s: 'ball', d: [0.018], at: [0, 0.27, 0.035], c: 'iron-dark', seg: 6 },
      { s: 'ball', d: [0.008], at: [0, 0.285, 0.03], c: 'red', seg: 6 },
    ],
  },
  {
    id: 'glaze-ornament-mushroom', name: 'Fly-Agaric Knob', category: 'prop', uses: ['place'],
    tags: ['glaze', 'ornament', 'hood', 'mushroom', 'toadstool', 'red', 'spotted'], emoji: [],
    about: 'Pay \'n\' Glaze hood ornament: the Fly-Agaric Knob. A red toadstool cap with five white spots on a cream stalk. Ornament slot; no tint.',
    examine: [
      'A plump red cap with five white spots on top, sitting on a cream stalk the width of a thumb.',
      'Mossbottom saying: the spotted ones are for looking at, never for eating, and never for telling a friend.',
      'Tip: keep it off the seat. The cap is only glued on, and glaze does not hold well on soft clay.',
      'Joke: every spot is a tiny moon, and the gnome who counts them always gets a different number.',
      'A thumbprint of cream glaze has dried on the stalk, and nobody remembers putting it there.',
    ],
    parts: [
      ...BASE,
      { s: 'cyl', d: [0.03, 0.04, 0.08], at: [0, 0.07, 0], c: 'mushroom-stem', seg: 8 },
      { s: 'ball', d: [0.1], at: [0, 0.15, 0], scale: [1, 0.6, 1], c: 0xd8342c, seg: 8 },
      { s: 'ball', d: [0.014], at: [0, 0.205, 0], c: 'white', seg: 6 },
      { s: 'ball', d: [0.014], at: [0.04, 0.2, 0], c: 'white', seg: 6 },
      { s: 'ball', d: [0.014], at: [-0.04, 0.2, 0], c: 'white', seg: 6 },
      { s: 'ball', d: [0.014], at: [0, 0.2, 0.04], c: 'white', seg: 6 },
      { s: 'ball', d: [0.014], at: [0, 0.2, -0.04], c: 'white', seg: 6 },
    ],
  },
  {
    id: 'glaze-ornament-gnomelet', name: 'Tiny Hood Gnome', category: 'prop', uses: ['place'],
    tags: ['glaze', 'ornament', 'hood', 'gnome', 'gnomelet', 'figure', 'blue'], emoji: [],
    about: 'Pay \'n\' Glaze hood ornament: the Tiny Hood Gnome. A little blue-coated gnome with a red hat and white beard, both fists raised. Ornament slot; no tint.',
    examine: [
      'A tiny blue gnome with a red hat, a white beard and both fists in the air, cheering on the bonnet.',
      'Gnome saying: a gnome with both fists up has either won an argument or is about to start one.',
      'Tip: a gnome riding the bonnet has the best view of the road and the worst view of the hedge.',
      'Joke: the little gnome is cheering for the car, the only thing in Turfton that never complains about it.',
      'Its beard was fired in one piece, which makes it the most stubborn thing on the whole vehicle.',
    ],
    parts: [
      ...BASE,
      { s: 'box', d: [0.07, 0.08, 0.05], at: [0, 0.07, 0], c: 'blue' },
      { s: 'ball', d: [0.04], at: [0, 0.15, 0], c: SKIN, seg: 8 },
      { s: 'cone', d: [0.035, 0.07], at: [0, 0.225, 0], c: HAT_RED, seg: 8 },
      { s: 'cone', d: [0.035, 0.06], at: [0, 0.13, 0.02], rot: [180, 0, 0], c: 'white', seg: 8 },
      { s: 'cyl', d: [0.01, 0.01, 0.06], at: [0.055, 0.126, 0], rot: [0, 0, -30], c: 'blue', seg: 6, mirror: true },
      { s: 'ball', d: [0.016], at: [0.07, 0.152, 0], c: SKIN, seg: 6, mirror: true },
    ],
  },
];
