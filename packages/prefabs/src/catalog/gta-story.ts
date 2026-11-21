// Gnome Theft Auto: story weapons, special vehicles, collectibles, Easter egg landmarks & cosmetic gear (Issue 1B).
import type { PrefabDef, Vec3 } from '../types';

const OBSIDIAN = 0x18181e;
const RAZOR_ORANGE = 0xf25c19;
const FIZZ_YELLOW = 0xf5e614;
const BUS_TEAL = 0x2c8c8a;
const BUS_CREAM = 0xf0e4c8;
const HOTDOG_RED = 0xe62424;
const GREASE = 0x2a241e;
const MICROFIBER_DARK = 0x22252e;
const TYRE = 0x222222;
const GLASS_BLUE = 0xa8dcf0;

// Gnorwin's Boot Parade Float is authored in 30-foot parade design units and scaled by K_BOOT = 0.25.
const K_BOOT = 0.25;
const B = (x: number, y: number, z: number): Vec3 => [x * K_BOOT, y * K_BOOT, z * K_BOOT];
const BD = (...n: number[]): number[] => n.map((x) => x * K_BOOT);

// The Grand Combine boss is authored in heavy boss design units and scaled by K_BOSS = 0.2.
const K_BOSS = 0.2;
const G = (x: number, y: number, z: number): Vec3 => [x * K_BOSS, y * K_BOSS, z * K_BOSS];
const GD = (...n: number[]): number[] => n.map((x) => x * K_BOSS);

export const GTA_STORY: readonly PrefabDef[] = [
  // ---- Held Weapons -----------------------------------------------------------------------------------------------
  {
    id: 'leaf-blower-cannon', name: 'Leaf-Blower Cannon', category: 'weapon', uses: ['hold', 'shoot'],
    tags: ['leaf', 'blower', 'cannon', 'air', 'orange', 'razor-back', 'gun', 'ranged', 'shoot'], emoji: [],
    tint: RAZOR_ORANGE,
    grip: [0, 0.08, 0],
    about: 'Gnome Theft Auto: the Leaf-Blower Cannon. Upright Razor-Back safety-orange blower tube with grip at bottom, rear turbine housing, and wide air-horn muzzle pointing +y. Tint sets the housing.',
    examine: [
      'A safety-orange turbine box strapped to a thick black pipe that flares out into a loud plastic trumpet at the top.',
      'Razor-Back slogan scratched on the side: zero turning radius, zero regrets, and zero indoor voices.',
      'Tip: brace both clay heels before you squeeze the trigger, or the blast sends your own hat down the block.',
      'Joke: the Hat Watch insists it is merely an aggressive broom, right up until it parks their cruiser in a hedge.',
      'Somebody jammed a crumpled Dandelion Fizz flyer into the intake grille to make it whistle in B-flat.',
    ],
    parts: [
      { s: 'box', d: [0.05, 0.16, 0.06], at: [0, 0.08, 0], c: 'black' },                         // grip (min.y = 0)
      { s: 'box', d: [0.014, 0.035, 0.025], at: [0, 0.14, 0.04], c: 'iron-dark' },               // trigger
      { s: 'cyl', d: [0.095, 0.095, 0.18], rot: [0, 0, 90], at: [0, 0.24, -0.05], c: 'tint', seg: 10 }, // turbine drum
      { s: 'cyl', d: [0.065, 0.065, 0.02], rot: [0, 0, 90], at: [0.095, 0.24, -0.05], c: 'black', seg: 10, mirror: true }, // intake grilles
      { s: 'box', d: [0.08, 0.09, 0.12], at: [0, 0.24, 0.03], c: 'iron-dark' },                   // manifold
      { s: 'cyl', d: [0.045, 0.045, 0.4], at: [0, 0.45, 0], c: 'black', seg: 10 },               // blower barrel
      { s: 'cyl', d: [0.095, 0.048, 0.15], at: [0, 0.72, 0], c: 'tint', seg: 10 },               // air-horn nozzle (+y)
      { s: 'ring', d: [0.095, 0.012], at: [0, 0.795, 0], rot: [90, 0, 0], c: 'black', seg: 10 }, // muzzle lip
    ],
  },
  {
    id: 'acorn-mortar', name: 'Acorn Mortar', category: 'weapon', uses: ['hold', 'shoot'],
    tags: ['acorn', 'mortar', 'launcher', 'stovepipe', 'brass', 'ranged', 'shoot'], emoji: [],
    grip: [0, 0.08, 0],
    about: 'Gnome Theft Auto: the Acorn Mortar. Upright iron stovepipe launcher with grip at bottom, wooden hopper loaded with an acorn, and brass sight along +y.',
    examine: [
      'A blackened iron stovepipe bolted to a scarred wooden stock, with a brass flip-sight and a hopper full of toasted acorns.',
      'Saying from Cloverfield: an acorn in the tree is shade, and an acorn in a stovepipe is a municipal dispute.',
      'Tip: tilt high to lob over HOA barricades; firing flat only dents your own bumper and wakes the pigeons.',
      'Joke: Side-Valve Salvage sells it as a seed-planter, though nothing ever sprouts where the acorns land.',
      'Three tally marks are filed into the brass collar beside a tiny stamped oak leaf.',
    ],
    parts: [
      { s: 'box', d: [0.05, 0.16, 0.06], at: [0, 0.08, 0], c: 'wood-dark' },                     // grip (min.y = 0)
      { s: 'box', d: [0.07, 0.11, 0.18], at: [0, 0.19, -0.11], c: 'wood' },                      // stock
      { s: 'box', d: [0.1, 0.12, 0.12], at: [0, 0.22, 0], c: 'iron-dark' },                      // breech block
      { s: 'cyl', d: [0.055, 0.055, 0.46], at: [0, 0.48, 0], c: 'iron', seg: 10 },               // stovepipe barrel (+y)
      { s: 'ring', d: [0.062, 0.012], at: [0, 0.71, 0], rot: [90, 0, 0], c: 'brass', seg: 10 },  // brass muzzle collar
      { s: 'box', d: [0.08, 0.09, 0.08], at: [0.085, 0.34, 0], c: 'wood-dark' },                 // acorn hopper
      { s: 'ball', d: [0.028], at: [0.085, 0.4, 0], scale: [1, 1.2, 1], c: 'clay', seg: 8 },     // loaded acorn
      { s: 'cyl', d: [0.03, 0.024, 0.016], at: [0.085, 0.425, 0], c: 'bark', seg: 8 },           // acorn cap
      { s: 'box', d: [0.014, 0.06, 0.03], at: [0, 0.56, 0.065], c: 'brass' },                     // brass sight
    ],
  },
  {
    id: 'tow-cable-whip', name: 'Tow-Cable Whip', category: 'weapon', uses: ['hold', 'swing'],
    tags: ['tow', 'cable', 'whip', 'hook', 'steel', 'melee', 'swing'], emoji: [],
    grip: [0, 0.08, 0],
    about: 'Gnome Theft Auto: the Tow-Cable Whip. Upright wooden handle with brass ferrule, coiled braided steel cable rings, and a heavy iron tow hook at +y.',
    examine: [
      'A greased oak handle bound in brass, trailing heavy coils of braided steel wire ending in a scarred iron tow hook.',
      'Tansy calls it an alignment tool; the Hat Watch calls it a felony with a wooden grip.',
      'Tip: snap the wrist at the top of the arc so the hook catches a bumper instead of your own brim.',
      'Joke: guaranteed to remove an HOA van door in one swing, or your kiln-glaze deposit back.',
      'Bright orange paint flakes are still wedged in the throat of the hook from an earlier disagreement.',
    ],
    parts: [
      { s: 'ball', d: [0.026], at: [0, 0.026, 0], c: 'brass', seg: 8 },                          // pommel (min.y = 0)
      { s: 'cyl', d: [0.022, 0.024, 0.14], at: [0, 0.095, 0], c: 'wood', seg: 8 },               // handle
      { s: 'cyl', d: [0.028, 0.028, 0.022], at: [0, 0.17, 0], c: 'brass', seg: 8 },              // ferrule
      { s: 'ring', d: [0.06, 0.01], at: [0, 0.24, 0], rot: [15, 20, 0], c: 'steel', seg: 10 },   // cable coil 1
      { s: 'ring', d: [0.06, 0.01], at: [0, 0.32, 0], rot: [-18, -20, 0], c: 'iron', seg: 10 },  // cable coil 2
      { s: 'ring', d: [0.055, 0.01], at: [0, 0.4, 0], rot: [16, 15, 0], c: 'steel', seg: 10 },   // cable coil 3
      { s: 'cyl', d: [0.01, 0.01, 0.14], at: [0, 0.49, 0], c: 'steel', seg: 6 },                 // cable lead
      { s: 'ring', d: [0.042, 0.013, 240], at: [0.02, 0.59, 0], rot: [0, 0, -40], c: 'iron-dark', seg: 10 }, // tow hook curve
      { s: 'cone', d: [0.014, 0.04], at: [0.055, 0.57, 0], rot: [0, 0, 140], c: 'iron-dark', seg: 6 }, // hook barb
    ],
  },
  {
    id: 'dandelion-puff-grenade', name: 'Dandelion Puff-Grenade', category: 'weapon', uses: ['hold', 'shoot'],
    tags: ['dandelion', 'puff', 'grenade', 'smoke', 'fluff', 'seed', 'pollen', 'shoot'], emoji: [],
    grip: [0, 0.07, 0],
    about: 'Gnome Theft Auto: the Dandelion Puff-Grenade. Upright green stem handle with brass pull-ring pin and a fluffy white seed-head sphere at +y.',
    examine: [
      'A thick hollow dandelion stem capped with a dense white globe of dry seed-fluff and a tiny brass pull-pin.',
      'Old Fescue rhyme: make a wish and blow the seeds; pull the pin and watch the Watch sneeze.',
      'Tip: toss upwind so the pollen cloud blinds the patrol instead of dusting your own beard.',
      'Joke: technically classifies as organic garden waste under HOA Section 9, until the whole squad starts sneezing.',
      'Pure-Loam Co-op packs each one by hand and stamps a tiny yellow smiley on the collar.',
    ],
    parts: [
      { s: 'cyl', d: [0.016, 0.018, 0.16], at: [0, 0.08, 0], c: 'leaf-dark', seg: 8 },           // stem grip (min.y = 0)
      { s: 'cyl', d: [0.024, 0.024, 0.02], at: [0, 0.16, 0], c: 'brass', seg: 8 },               // collar
      { s: 'ring', d: [0.022, 0.005], at: [0.036, 0.16, 0], c: 'gold', seg: 8 },                 // pull-ring pin
      { s: 'ball', d: [0.045], at: [0, 0.22, 0], c: 'bark', seg: 8 },                            // seed receptacle
      { s: 'ball', d: [0.07], at: [0, 0.25, 0], c: 'white', seg: 8 },                            // core puff
      { s: 'ball', d: [0.048], at: [0.045, 0.25, 0], c: 'wool', seg: 6, mirror: true },          // side fluff
      { s: 'ball', d: [0.048], at: [0, 0.25, 0.045], c: 'wool', seg: 6 },                        // front fluff
      { s: 'ball', d: [0.048], at: [0, 0.25, -0.045], c: 'wool', seg: 6 },                       // back fluff
      { s: 'ball', d: [0.05], at: [0, 0.295, 0], c: 'white', seg: 6 },                           // crown fluff
    ],
  },
  {
    id: 'acorn-trip-mine', name: 'Acorn Trip-Mine', category: 'weapon', uses: ['hold', 'place'],
    tags: ['acorn', 'mine', 'trap', 'mousetrap', 'spring', 'brass', 'place'], emoji: [],
    grip: [0, 0.015, -0.08],
    about: 'Gnome Theft Auto: the Acorn Trip-Mine. A spring-loaded wooden mousetrap plate standing at y = 0 with a steel snap-bar and a brass acorn trigger.',
    examine: [
      'A heavy wooden snap-plate rigged with a coiled steel jaw and a gleaming brass acorn balanced on the hair-trigger.',
      'Cloverfield wisdom: never touch a shiny acorn lying neatly on a wooden board in the middle of a road.',
      'Tip: drop it just ahead of a pursuing cruiser; the spring flips a whole mower skyward without a drop of soot.',
      'Joke: every Watch officer thinks it is a free souvenir right up until their bumper meets the clouds.',
      'A faded stamped stencil on the underside warns: KEEP BEARDS CLEAR WHEN ARMING.',
    ],
    parts: [
      { s: 'box', d: [0.2, 0.024, 0.24], at: [0, 0.012, 0], c: 'wood' },                         // base plate (min.y = 0)
      { s: 'cyl', d: [0.018, 0.018, 0.14], rot: [0, 0, 90], at: [0, 0.036, -0.02], c: 'brass', seg: 8 }, // coil spring
      { s: 'box', d: [0.16, 0.01, 0.012], at: [0, 0.048, -0.09], c: 'steel' },                   // snap-bar crosspiece
      { s: 'box', d: [0.012, 0.01, 0.1], at: [0.075, 0.042, -0.04], c: 'steel', mirror: true },  // snap-bar arms
      { s: 'cyl', d: [0.008, 0.008, 0.1], rot: [60, 0, 0], at: [0, 0.045, 0.01], c: 'iron-dark', seg: 6 }, // catch rod
      { s: 'ball', d: [0.032], at: [0, 0.062, 0.065], scale: [1, 1.25, 1], c: 'brass', seg: 8 }, // brass acorn trigger
      { s: 'cyl', d: [0.034, 0.028, 0.018], at: [0, 0.096, 0.065], c: 'bark', seg: 8 },          // acorn cap
      { s: 'ball', d: [0.014], at: [0, 0.035, 0.1], c: 'ruby', glow: true, seg: 6 },             // armed indicator
    ],
  },

  // ---- Vehicles ---------------------------------------------------------------------------------------------------
  {
    id: 'hoa-van', name: 'HOA Van', category: 'prop', uses: ['place', 'sit'],
    tags: ['hoa', 'van', 'thorne', 'enforcement', 'vehicle', 'megaphone', 'obsidian', 'gold', 'seat'], emoji: [],
    tint: OBSIDIAN,
    trim: 'gold',
    seat: [0, 0.52, 0.35],
    pivots: {
      'wheel-0': [-0.58, 0.22, -0.72], 'wheel-1': [0.58, 0.22, -0.72],
      'wheel-2': [-0.58, 0.22, 0.72], 'wheel-3': [0.58, 0.22, 0.72],
    },
    about: 'Gnome Theft Auto: the Thorne Lawn & Order Code-Enforcement Van. Obsidian-and-gold armored van with roof megaphones, lightbar, driver seat, and wheel-0..3 pivots. Nose +z. Tint sets body, trim sets gold stripe.',
    examine: [
      'A sleek obsidian van trimmed in gleaming gold pinstripes, crowned with twin brass PA megaphones and an amber strobe.',
      'Thorne Lawn & Order motto on the flank: uniformity is peace, and peace is billed quarterly.',
      'Tip: watch the megaphones when ducking under low hedges—they announce your arrival three blocks early.',
      'Joke: the back holds forty blank foreclosure stickers, three clipboards, and zero sense of humour.',
      'A tiny brass plaque on the dash reads: PROPERTY OF VESPER THORNE, DO NOT TRACK LOAM.',
    ],
    parts: [
      { s: 'box', d: [1.14, 0.16, 2.24], at: [0, 0.24, 0], c: 'iron-dark' },                      // lower chassis
      { s: 'box', d: [1.12, 0.76, 1.56], at: [0, 0.7, -0.32], c: 'tint' },                       // rear cargo box
      { s: 'box', d: [1.08, 0.44, 0.62], at: [0, 0.54, 0.76], c: 'tint' },                       // front cab nose
      { s: 'box', d: [0.98, 0.36, 0.48], at: [0, 0.92, 0.6], c: 'tint' },                        // cab roof cowl
      { s: 'box', d: [0.92, 0.3, 0.04], rot: [-18, 0, 0], at: [0, 0.84, 0.84], c: GLASS_BLUE, alpha: 0.65 }, // windshield
      { s: 'box', d: [1.15, 0.08, 2.26], at: [0, 0.42, 0], c: 'trim' },                          // gold livery stripe
      { s: 'box', d: [1.16, 0.1, 0.12], at: [0, 0.26, 1.12], c: 'trim' },                        // front ram bumper
      { s: 'box', d: [1.16, 0.1, 0.12], at: [0, 0.26, -1.12], c: 'trim' },                       // rear bumper
      { s: 'box', d: [0.48, 0.12, 0.42], at: [0, 0.46, 0.35], c: 'black' },                      // driver seat (top 0.52)
      { s: 'box', d: [0.76, 0.09, 0.18], at: [0, 1.14, 0.45], c: 'gold', glow: true },           // amber roof lightbar
      { s: 'cyl', d: [0.18, 0.18, 0.03], rot: [90, 0, 0], at: [0, 0.72, -1.11], c: 'trim', seg: 10 }, // rear seal emblem
      { s: 'cone', d: [0.11, 0.26], rot: [-90, 0, 0], at: [-0.28, 1.22, -0.1], c: 'trim', seg: 10 }, // roof megaphone L
      { s: 'cone', d: [0.11, 0.26], rot: [-90, 0, 0], at: [0.28, 1.22, -0.1], c: 'trim', seg: 10 },  // roof megaphone R
      { s: 'box', d: [0.14, 0.08, 0.04], at: [-0.36, 0.44, 1.09], c: 'spark', glow: true, mirror: true }, // headlights
      { s: 'cyl', d: [0.22, 0.22, 0.16], rot: [0, 0, 90], at: [-0.58, 0.22, -0.72], c: TYRE, seg: 12, group: 'wheel-0' },
      { s: 'cyl', d: [0.22, 0.22, 0.16], rot: [0, 0, 90], at: [0.58, 0.22, -0.72], c: TYRE, seg: 12, group: 'wheel-1' },
      { s: 'cyl', d: [0.22, 0.22, 0.16], rot: [0, 0, 90], at: [-0.58, 0.22, 0.72], c: TYRE, seg: 12, group: 'wheel-2' },
      { s: 'cyl', d: [0.22, 0.22, 0.16], rot: [0, 0, 90], at: [0.58, 0.22, 0.72], c: TYRE, seg: 12, group: 'wheel-3' },
    ],
  },
  {
    id: 'boot-parade-float', name: "Gnorwin's Boot Float", category: 'prop', uses: ['place', 'sit'],
    tags: ['boot', 'parade', 'float', 'gnorwin', 'clayfoot', 'tractor', 'vehicle', 'seat'], emoji: [],
    tint: 'red',
    trim: 'gold',
    seat: B(0, 1.85, 3.3),
    pivots: {
      'wheel-0': B(-2.1, 1.1, -2.5), 'wheel-1': B(2.1, 1.1, -2.5),
      'wheel-2': B(-1.9, 0.75, 2.9), 'wheel-3': B(1.9, 0.75, 2.9),
    },
    about: 'Gnome Theft Auto: Gnorwin Clayfoot\'s 30-foot Boot Parade Float on a tractor chassis, scaled by K = 0.25 (draw at scale 4 for full parade size). Seat in front, wheel-0..3 pivots, nose +z.',
    examine: [
      'A towering papier-mache mud-boot bolted to a tractor flatbed, complete with festive red bunting and a confetti horn.',
      'Founder\'s Trim Day lore: Gnorwin Clayfoot once jammed the first Combine with nothing but one muddy boot and a curse.',
      'Tip: take corners wide; thirty feet of painted boot carries enough momentum to flatten a zoning kiosk.',
      'Joke: the sole still has fake papier-mache mud painted onto it, because Turfton respects historical accuracy.',
      'Pip stuffed three crates of celebratory acorns into the toe box before anyone checked the brakes.',
    ],
    parts: [
      { s: 'box', d: BD(3.6, 0.7, 9.0), at: B(0, 1.25, 0), c: 'iron-dark' },                     // tractor flatbed
      { s: 'box', d: BD(3.8, 0.45, 9.2), at: B(0, 1.35, 0), c: 'tint' },                         // parade skirt bunting
      { s: 'box', d: BD(3.9, 0.16, 9.3), at: B(0, 1.55, 0), c: 'trim' },                         // gold parade trim
      { s: 'box', d: BD(1.6, 0.5, 1.4), at: B(0, 1.65, 3.3), c: 'black' },                       // driver seat (top 1.9)
      { s: 'cyl', d: BD(0.14, 0.14, 1.2), rot: [25, 0, 0], at: B(0, 2.25, 3.95), c: 'steel', seg: 8 }, // steering post
      { s: 'ring', d: BD(0.45, 0.08), rot: [-25, 0, 0], at: B(0, 2.75, 4.15), c: 'black', seg: 10 }, // steering wheel
      { s: 'cone', d: BD(0.45, 1.1), rot: [-90, 0, 0], at: B(0, 2.1, 4.6), c: 'gold', seg: 10 }, // horn cannon
      // 30-foot mud-boot mounted on flatbed (y = 1.6..9.0 design => 0.4..2.25 scaled)
      { s: 'box', d: BD(2.6, 0.6, 4.8), at: B(0, 1.9, -0.3), c: 'dirt' },                        // mud-caked boot sole
      { s: 'box', d: BD(2.4, 1.4, 3.8), at: B(0, 2.8, -0.4), c: 'leather' },                     // boot foot upper
      { s: 'ball', d: BD(1.35), at: B(0, 2.7, 1.4), scale: [0.95, 0.85, 1.25], c: 'leather', seg: 10 }, // boot toe box
      { s: 'cyl', d: BD(1.25, 1.15, 5.2), at: B(0, 6.0, -1.2), c: 'leather', seg: 10 },          // tall boot shaft
      { s: 'cyl', d: BD(1.35, 1.35, 0.5), at: B(0, 8.65, -1.2), c: 'leather-dark', seg: 10 },    // folded boot cuff
      { s: 'box', d: BD(2.6, 0.35, 1.2), at: B(0, 2.2, 0.9), c: 'dirt' },                        // mud splatter
      { s: 'ball', d: BD(0.18), at: B(0.45, 4.6, -0.15), c: 'brass', seg: 6, mirror: true },     // lace eyelets
      { s: 'ball', d: BD(0.18), at: B(0.45, 5.8, -0.15), c: 'brass', seg: 6, mirror: true },     // lace eyelets
      { s: 'cyl', d: BD(1.1, 1.1, 0.65), rot: [0, 0, 90], at: B(-2.1, 1.1, -2.5), c: TYRE, seg: 12, group: 'wheel-0' },
      { s: 'cyl', d: BD(1.1, 1.1, 0.65), rot: [0, 0, 90], at: B(2.1, 1.1, -2.5), c: TYRE, seg: 12, group: 'wheel-1' },
      { s: 'cyl', d: BD(0.75, 0.75, 0.5), rot: [0, 0, 90], at: B(-1.9, 0.75, 2.9), c: TYRE, seg: 12, group: 'wheel-2' },
      { s: 'cyl', d: BD(0.75, 0.75, 0.5), rot: [0, 0, 90], at: B(1.9, 0.75, 2.9), c: TYRE, seg: 12, group: 'wheel-3' },
    ],
  },
  {
    id: 'snail-coach', name: 'Snail-Coach', category: 'prop', uses: ['place', 'sit'],
    tags: ['snail', 'coach', 'bus', 'transit', 'dandelion', 'fizz', 'vehicle', 'seat'], emoji: [],
    tint: BUS_TEAL,
    trim: FIZZ_YELLOW,
    seat: [0, 0.52, 0.75],
    pivots: {
      'wheel-0': [-0.58, 0.22, -0.78], 'wheel-1': [0.58, 0.22, -0.78],
      'wheel-2': [-0.58, 0.22, 0.78], 'wheel-3': [0.58, 0.22, 0.78],
    },
    about: 'Gnome Theft Auto: the Snail-Coach. Turfton public transit bus with a coiled snail-shell roof dome, Dandelion Fizz yellow side ad banner, driver seat, and wheel-0..3 pivots. Nose +z.',
    examine: [
      'Turfton\'s boxy teal-and-cream transit coach, crowned with a giant spiral snail shell and wrapped in a neon Dandelion Fizz ad.',
      'Transit motto: slower than a Zero-Turn, wider than an alley, and always three stops behind schedule.',
      'Tip: lean into long drifts—the overhead garden-twine straps keep passengers polite even when the bus rolls sideways.',
      'Joke: one hundred and ten percent daily value of pollen and bad decisions, painted across forty percent of the windows.',
      'A faded route card tucked in the windshield still reads: TURFTON LOOP — NO WET HATS.',
    ],
    parts: [
      { s: 'box', d: [1.14, 0.14, 2.5], at: [0, 0.23, 0], c: 'iron-dark' },                      // chassis
      { s: 'box', d: [1.12, 0.45, 2.46], at: [0, 0.52, 0], c: 'tint' },                          // lower bus body
      { s: 'box', d: [1.1, 0.48, 2.42], at: [0, 0.98, 0], c: BUS_CREAM },                        // upper window cabin
      { s: 'box', d: [1.14, 0.08, 2.48], at: [0, 1.24, 0], c: 'tint' },                          // roof cap
      { s: 'box', d: [0.96, 0.36, 0.04], at: [0, 0.96, 1.22], c: GLASS_BLUE, alpha: 0.65 },      // front windshield
      { s: 'box', d: [0.04, 0.32, 1.85], at: [0.56, 0.96, -0.12], c: GLASS_BLUE, alpha: 0.6, mirror: true }, // side windows
      { s: 'box', d: [0.7, 0.14, 0.05], at: [0, 1.18, 1.24], c: 'gold', glow: true },            // route sign
      { s: 'box', d: [0.45, 0.14, 0.4], at: [0, 0.45, 0.75], c: 'black' },                       // driver seat (top 0.52)
      // Dandelion Fizz side ad banner
      { s: 'box', d: [0.03, 0.36, 1.75], at: [0.58, 0.56, -0.15], c: 'trim', mirror: true },     // electric yellow ad banner
      { s: 'box', d: [0.035, 0.06, 1.65], at: [0.585, 0.56, -0.15], c: 'leaf-dark', mirror: true }, // ad stripe
      // Snail-shell roof dome
      { s: 'ball', d: [0.48], at: [0, 1.48, -0.15], scale: [0.85, 0.8, 1.15], c: 'shell', seg: 10 }, // snail shell dome
      { s: 'ring', d: [0.32, 0.08], at: [0.36, 1.5, -0.15], rot: [0, 90, 0], c: 'terracotta', seg: 10, mirror: true }, // shell spiral
      { s: 'box', d: [0.14, 0.08, 0.04], at: [-0.36, 0.4, 1.24], c: 'spark', glow: true, mirror: true }, // headlights
      { s: 'cyl', d: [0.22, 0.22, 0.16], rot: [0, 0, 90], at: [-0.58, 0.22, -0.78], c: TYRE, seg: 12, group: 'wheel-0' },
      { s: 'cyl', d: [0.22, 0.22, 0.16], rot: [0, 0, 90], at: [0.58, 0.22, -0.78], c: TYRE, seg: 12, group: 'wheel-1' },
      { s: 'cyl', d: [0.22, 0.22, 0.16], rot: [0, 0, 90], at: [-0.58, 0.22, 0.78], c: TYRE, seg: 12, group: 'wheel-2' },
      { s: 'cyl', d: [0.22, 0.22, 0.16], rot: [0, 0, 90], at: [0.58, 0.22, 0.78], c: TYRE, seg: 12, group: 'wheel-3' },
    ],
  },
  {
    id: 'mulch-spreader-mower', name: 'Mulch-Spreader Mower', category: 'prop', uses: ['place', 'sit'],
    tags: ['mulch', 'spreader', 'mower', 'compost', 'ride-on', 'reel', 'vehicle', 'seat'], emoji: [],
    tint: 0x3fa34d,
    trim: 'gold',
    seat: [0, 0.56, 0.05],
    pivots: {
      'wheel-0': [-0.52, 0.26, -0.45], 'wheel-1': [0.52, 0.26, -0.45],
      'wheel-2': [-0.46, 0.17, 0.65], 'wheel-3': [0.46, 0.17, 0.65],
      reel: [0, 0.24, -0.84],
    },
    about: 'Gnome Theft Auto: the Mulch-Spreader Mower. Utility Ride-On with a rear compost hopper, spinning spreader disc pivot (reel), driver seat, and wheel-0..3 pivots. Nose +z.',
    examine: [
      'A heavy utility Ride-On hauling a brimming rear compost hopper over a spinning four-vane spreader disc.',
      'Chapel of Mulch proverb: share your organic matter generously, especially right in front of a pursuing HOA van.',
      'Tip: flick the spreader disc into high gear when tailgated; fresh compost slicks send cruisers spinning sideways.',
      'Joke: Cedric calls the cargo artisanal miracle mulch, even though half of it is clearly sawdust and glitter.',
      'Tiny bright specks glitter inside the mulch pile—nobody is sure whether it is magic or leftover craft supplies.',
    ],
    parts: [
      { s: 'box', d: [0.88, 0.18, 1.48], at: [0, 0.34, 0.05], c: 'iron-dark' },                  // chassis frame
      { s: 'box', d: [0.72, 0.34, 0.58], at: [0, 0.54, 0.58], c: 'tint' },                       // front hood
      { s: 'box', d: [0.74, 0.07, 0.6], at: [0, 0.68, 0.58], c: 'trim' },                        // hood trim stripe
      { s: 'box', d: [0.46, 0.14, 0.42], at: [0, 0.49, 0.05], c: 'black' },                      // driver seat (top 0.56)
      { s: 'box', d: [0.46, 0.32, 0.08], at: [0, 0.72, -0.14], c: 'black' },                     // seat back
      { s: 'cyl', d: [0.025, 0.025, 0.3], rot: [22, 0, 0], at: [0, 0.76, 0.32], c: 'steel', seg: 6 }, // steering column
      { s: 'ring', d: [0.13, 0.02], rot: [-22, 0, 0], at: [0, 0.89, 0.27], c: 'black', seg: 10 }, // steering wheel
      // Rear compost hopper & mulch mound
      { s: 'cyl', d: [0.42, 0.24, 0.52], at: [0, 0.72, -0.58], c: 'tint', seg: 8 },              // hopper cone
      { s: 'ball', d: [0.36], at: [0, 0.96, -0.58], scale: [1, 0.45, 1], c: 'dirt', seg: 8 },     // compost pile
      { s: 'cyl', d: [0.06, 0.06, 0.2], at: [0, 0.36, -0.84], c: 'iron', seg: 8 },               // chute pipe
      // Spinning spreader disc (group 'reel')
      { s: 'cyl', d: [0.28, 0.28, 0.03], at: [0, 0.24, -0.84], c: 'steel', seg: 12, group: 'reel' }, // spreader disc
      { s: 'box', d: [0.5, 0.04, 0.025], at: [0, 0.27, -0.84], c: 'trim', group: 'reel' },       // vane X
      { s: 'box', d: [0.025, 0.04, 0.5], at: [0, 0.27, -0.84], c: 'trim', group: 'reel' },       // vane Z
      { s: 'cyl', d: [0.26, 0.26, 0.18], rot: [0, 0, 90], at: [-0.52, 0.26, -0.45], c: TYRE, seg: 12, group: 'wheel-0' },
      { s: 'cyl', d: [0.26, 0.26, 0.18], rot: [0, 0, 90], at: [0.52, 0.26, -0.45], c: TYRE, seg: 12, group: 'wheel-1' },
      { s: 'cyl', d: [0.17, 0.17, 0.14], rot: [0, 0, 90], at: [-0.46, 0.17, 0.65], c: TYRE, seg: 10, group: 'wheel-2' },
      { s: 'cyl', d: [0.17, 0.17, 0.14], rot: [0, 0, 90], at: [0.46, 0.17, 0.65], c: TYRE, seg: 10, group: 'wheel-3' },
    ],
  },

  // ---- Story & World Props ----------------------------------------------------------------------------------------
  {
    id: 'stopping-stone', name: 'Stopping Stone', category: 'prop', uses: ['hold', 'place'],
    tags: ['stopping', 'stone', 'fescue', 'rune', 'wedge', 'relic', 'ancient'], emoji: [],
    grip: [0, 0.18, 0],
    about: 'Gnome Theft Auto: the Fescue Stopping Stone. An ancient carved stone wedge under 0.5 tall with moss patches and glowing Fescue runes. Held or placed at y = 0.',
    examine: [
      'A dense wedge of ancient Fescue granite, scarred by old blades and traced with softly glowing emerald runes.',
      'Fescue legend: one honest stone dropped into the maw stops any steel harvester dead in its tracks.',
      'Tip: hold it by the waist and slam it square into the Combine intake—do not try to skip it across a pond.',
      'Joke: Vesper used a replica of this sacred relic to prop open his air-conditioned museum door.',
      'Warm vibrations hum through the stone whenever a Combine engine starts within three blocks.',
    ],
    parts: [
      { s: 'box', d: [0.28, 0.18, 0.18], at: [0, 0.09, 0], c: 'stone-dark' },                    // stone base (min.y = 0)
      { s: 'wedge', d: [0.26, 0.24, 0.17], at: [0, 0.3, 0], c: 'stone' },                        // tapered upper wedge
      { s: 'ball', d: [0.06], at: [-0.1, 0.18, 0.07], scale: [1.2, 0.5, 0.7], c: 'moss', seg: 6 }, // moss patch
      { s: 'box', d: [0.02, 0.16, 0.014], at: [0, 0.19, 0.092], c: 'emerald', glow: true },      // central rune bar
      { s: 'box', d: [0.09, 0.02, 0.014], at: [0, 0.22, 0.092], c: 'emerald', glow: true },      // rune crossbar
      { s: 'box', d: [0.06, 0.018, 0.014], at: [0, 0.13, 0.092], c: 'emerald', glow: true },     // lower rune tick
    ],
  },
  {
    id: 'tall-one-pencil', name: 'Tall-One Pencil', category: 'prop', uses: ['place'],
    tags: ['pencil', 'tall-one', 'yellow', 'graphite', 'hex', 'giant', 'landmark'], emoji: [],
    footprint: { r: 2.8, h: 15 },
    about: 'Gnome Theft Auto: the buried Tall-One Pencil. A redwood-sized yellow hexagonal pencil stub buried at an angle in a dirt mound at y = 0.',
    examine: [
      'A redwood-sized yellow six-sided pillar buried crookedly in the earth, narrowing to a pale wood cone and dark graphite tip.',
      'Grid Truther lore: proof that Turfton sits on somebody\'s drafting table, or else the Tall Ones dropped a very large stick.',
      'Tip: stay clear of the graphite point—one flake from it can draw a line wide enough to confuse a whole patrol.',
      'Joke: Mossley Inkcap chipped off a bucket of the tip and retired selling artisan eyebrow crayon.',
      'Faint golden letters along one flat yellow face read NO. 2, though nobody agrees what NO. 1 was.',
    ],
    parts: [
      { s: 'cyl', d: [2.4, 3.0, 0.8], at: [0, 0.4, 0], c: 'dirt', seg: 8 },                       // dirt crater mound (min.y = 0)
      { s: 'ball', d: [1.1], at: [1.6, 0.55, 0.9], scale: [1.2, 0.5, 1.1], c: 'stone-dark', seg: 6, mirror: true }, // displaced earth
      { s: 'cyl', d: [1.35, 1.35, 11.0], rot: [0, 0, -18], at: [-0.5, 5.7, 0], c: 'yellow', seg: 6 }, // hex shaft (min.y > 0.1)
      { s: 'cone', d: [1.35, 2.8], rot: [0, 0, -18], at: [1.63, 12.26, 0], c: 'wood-light', seg: 6 }, // sharpened wood collar
      { s: 'cone', d: [0.46, 0.96], rot: [0, 0, -18], at: [2.36, 14.51, 0], c: 'ink', seg: 6 },  // graphite tip
    ],
  },
  {
    id: 'squeaky-hotdog-giant', name: 'Giant Squeaky Hotdog', category: 'prop', uses: ['place'],
    tags: ['hotdog', 'squeaky', 'toy', 'biscuit', 'giant', 'rubber', 'landmark'], emoji: [],
    footprint: { r: 3.8, h: 2.6 },
    about: 'Gnome Theft Auto: Biscuit\'s Giant Squeaky Hotdog. A bus-sized glossy red rubber hotdog nestled in a tan bun at y = 0, with yellow mustard stripe and brass squeaker.',
    examine: [
      'A rubbery scarlet sausage the length of a transit coach, tucked between two tan foam bun halves with a yellow zig-zag.',
      'Cloverfield warning: Biscuit only left it in the ditch for a minute, and Biscuit always comes back for his toys.',
      'Tip: hit it gently with a Combine bumper—every squeak sends nearby Hat Watch patrols diving into the clover.',
      'Joke: Farmer Bramble tried to declare it an agricultural barn for tax purposes and almost got away with it.',
      'A brass squeaker nozzle sits in the back end, big enough for three gnomes to stand inside and shout.',
    ],
    parts: [
      { s: 'box', d: [1.8, 0.65, 6.2], at: [0, 0.325, 0], c: 'wood-light' },                    // bun hinge base (min.y = 0)
      { s: 'pill', d: [0.85, 6.0], rot: [90, 0, 0], at: [-0.72, 0.85, 0], c: 'sand', seg: 10 },  // left bun half (min.y = 0)
      { s: 'pill', d: [0.85, 6.0], rot: [90, 0, 0], at: [0.72, 0.85, 0], c: 'sand', seg: 10 },   // right bun half (min.y = 0)
      { s: 'pill', d: [0.95, 7.0], rot: [90, 0, 0], at: [0, 1.55, 0], c: HOTDOG_RED, seg: 12 }, // glossy red rubber sausage
      { s: 'box', d: [0.3, 0.08, 1.8], rot: [0, 20, 0], at: [0.15, 2.52, -1.6], c: 'yellow' },   // mustard stripe 1
      { s: 'box', d: [0.3, 0.08, 1.8], rot: [0, -22, 0], at: [-0.15, 2.52, 0], c: 'yellow' },    // mustard stripe 2
      { s: 'box', d: [0.3, 0.08, 1.8], rot: [0, 20, 0], at: [0.15, 2.52, 1.6], c: 'yellow' },    // mustard stripe 3
      { s: 'cyl', d: [0.22, 0.28, 0.2], rot: [90, 0, 0], at: [0, 1.55, -4.48], c: 'brass', seg: 10 }, // squeaker nozzle
    ],
  },
  {
    id: 'porcelain-lantern', name: 'Porcelain Lantern', category: 'prop', uses: ['hold', 'place'],
    tags: ['porcelain', 'lantern', 'wax', 'candle', 'light', 'mossy-wood', 'clara'], emoji: [],
    grip: [0, 0.34, 0],
    lights: [{ at: [0, 0.14, 0], c: 'flame', intensity: 1.2, distance: 5 }],
    about: 'Gnome Theft Auto: the Porcelain Lantern. A flickering wax candle inside a delicate white porcelain frame with glass panes and a brass carry ring.',
    examine: [
      'A cream wax candle burning softly behind thin glass panes inside a delicate, pale white porcelain cage.',
      'Mossy Wood whisper: never stare straight into the flame on the Tall House porch when the wind drops.',
      'Tip: hold it steady by the brass ring; porcelain shatters cleanly and cannot be glued back at the roadside.',
      'Joke: HOA scavengers stole three of these thinking they were fancy birdfeeders.',
      'Clara painted a hairline blue flower inside the roof cap so her friends could recognise each other in the dark.',
    ],
    parts: [
      { s: 'box', d: [0.16, 0.025, 0.16], at: [0, 0.0125, 0], c: 'chalk' },                       // porcelain base (min.y = 0)
      { s: 'cyl', d: [0.009, 0.009, 0.2], at: [-0.06, 0.12, -0.06], c: 'white', seg: 6, mirror: true }, // back posts
      { s: 'cyl', d: [0.009, 0.009, 0.2], at: [-0.06, 0.12, 0.06], c: 'white', seg: 6, mirror: true },  // front posts
      { s: 'box', d: [0.11, 0.18, 0.11], at: [0, 0.12, 0], c: 'glass', alpha: 0.35 },            // glass enclosure
      { s: 'cyl', d: [0.025, 0.025, 0.09], at: [0, 0.07, 0], c: 'cloth', seg: 8 },               // wax candle
      { s: 'ball', d: [0.022], at: [0, 0.135, 0], scale: [1, 1.5, 1], c: 'flame', glow: true, seg: 6 }, // flame
      { s: 'ball', d: [0.01], at: [0, 0.13, 0], c: 'spark', glow: true, seg: 6 },                // inner spark
      { s: 'cone', d: [0.12, 0.08], at: [0, 0.255, 0], c: 'chalk', seg: 4 },                     // porcelain roof cap
      { s: 'ring', d: [0.036, 0.006], at: [0, 0.325, 0], c: 'brass', seg: 10 },                  // brass carry ring
    ],
  },
  {
    id: 'grand-combine-boss', name: 'The Grand Combine', category: 'prop', uses: ['place'],
    tags: ['grand', 'combine', 'boss', 'thorne', 'harvester', 'obsidian', 'gold', 'maw'], emoji: [],
    footprint: { r: 2.0, h: 2.2 },
    pivots: {
      'wheel-0': G(-4.4, 1.6, -5.2), 'wheel-1': G(4.4, 1.6, -5.2),
      'wheel-2': G(-4.8, 2.0, 2.2), 'wheel-3': G(4.8, 2.0, 2.2),
      reel: G(0, 2.1, 6.2),
    },
    about: 'Gnome Theft Auto: Vesper Thorne\'s Grand Combine boss machine, scaled by K = 0.2 (draw at scale 5 in Chapter 5). Obsidian-and-gold armored harvester with roof bridge and spinning front intake maw (reel). Nose +z.',
    examine: [
      'A skyscraper-sized obsidian harvester plated in gold armor, sporting a rooftop command bridge and a roaring front intake maw.',
      'Thorne\'s final decree: zero-millimeter scalp from the North Fells to the Southern Canal, with no crooked hats left standing.',
      'Tip: drop onto the upper bridge deck from the air, then jam the ancient Stopping Stone straight into the spinning maw.',
      'Joke: Vesper installed forty-foot PA horns on the roof just so everyone could hear his zoning lecture over the blades.',
      'Beneath the golden grate, a stolen Golden Acorn spins at white heat inside the furnace core.',
    ],
    parts: [
      { s: 'box', d: GD(7.8, 4.4, 10.2), at: G(0, 3.6, -1.2), c: OBSIDIAN },                      // main obsidian hull
      { s: 'box', d: GD(8.1, 0.5, 10.5), at: G(0, 3.4, -1.2), c: 'gold' },                        // gold armor belt
      { s: 'box', d: GD(4.6, 2.4, 4.4), at: G(0, 7.0, 1.4), c: OBSIDIAN },                       // upper roof bridge
      { s: 'box', d: GD(4.9, 0.3, 4.7), at: G(0, 8.35, 1.4), c: 'gold' },                        // bridge crown plate
      { s: 'box', d: GD(4.0, 1.1, 0.2), at: G(0, 7.1, 3.62), c: GLASS_BLUE, alpha: 0.7 },        // bridge windshield
      { s: 'cone', d: GD(0.65, 1.4), rot: [-90, 0, 0], at: G(-1.5, 9.0, 2.6), c: 'gold', seg: 8, mirror: true }, // 40-ft PA horns
      { s: 'cyl', d: GD(0.35, 0.35, 2.6), at: G(-2.4, 7.1, -4.8), c: 'iron-dark', seg: 8, mirror: true }, // exhaust stacks
      // Front intake maw (+z) & Golden Acorn core glow
      { s: 'box', d: GD(12.2, 1.6, 2.8), at: G(0, 1.4, 5.4), c: OBSIDIAN },                      // wide intake header
      { s: 'box', d: GD(12.4, 0.3, 0.4), at: G(0, 2.1, 6.7), c: 'gold' },                        // maw brow trim
      { s: 'box', d: GD(8.6, 0.9, 0.4), at: G(0, 1.5, 5.0), c: 'flame', glow: true },            // golden furnace maw glow
      { s: 'cone', d: GD(0.65, 2.2), rot: [90, 0, 0], at: G(6.1, 1.2, 7.2), c: 'gold', seg: 8, mirror: true }, // divider tusks
      // Spinning intake reel (group 'reel')
      { s: 'cyl', d: GD(0.35, 0.35, 11.6), rot: [0, 0, 90], at: G(0, 2.1, 6.2), c: 'iron-dark', seg: 8, group: 'reel' },
      { s: 'box', d: GD(11.4, 0.25, 0.4), at: G(0, 3.0, 6.2), c: 'gold', group: 'reel' },        // reel bar 1
      { s: 'box', d: GD(11.4, 0.25, 0.4), rot: [90, 0, 0], at: G(0, 2.1, 7.1), c: 'gold', group: 'reel' }, // reel bar 2
      { s: 'box', d: GD(11.4, 0.25, 0.4), at: G(0, 1.2, 6.2), c: 'gold', group: 'reel' },        // reel bar 3
      { s: 'box', d: GD(11.4, 0.25, 0.4), rot: [90, 0, 0], at: G(0, 2.1, 5.3), c: 'gold', group: 'reel' }, // reel bar 4
      // Armored wheels (min.y = 0)
      { s: 'cyl', d: GD(1.6, 1.6, 1.1), rot: [0, 0, 90], at: G(-4.4, 1.6, -5.2), c: TYRE, seg: 12, group: 'wheel-0' },
      { s: 'cyl', d: GD(1.6, 1.6, 1.1), rot: [0, 0, 90], at: G(4.4, 1.6, -5.2), c: TYRE, seg: 12, group: 'wheel-1' },
      { s: 'cyl', d: GD(2.0, 2.0, 1.4), rot: [0, 0, 90], at: G(-4.8, 2.0, 2.2), c: TYRE, seg: 12, group: 'wheel-2' },
      { s: 'cyl', d: GD(2.0, 2.0, 1.4), rot: [0, 0, 90], at: G(4.8, 2.0, 2.2), c: TYRE, seg: 12, group: 'wheel-3' },
    ],
  },

  // ---- Cosmetic Gear Rewards --------------------------------------------------------------------------------------
  {
    id: 'tansy-apron', name: "Tansy's Grease-Stained Apron", category: 'armor', uses: ['wear-back'],
    tags: ['tansy', 'apron', 'grease', 'garage', 'mechanic', 'back', 'reward'], emoji: [],
    tint: 'burlap',
    about: 'Gnome Theft Auto: Tansy\'s Grease-Stained Apron. Worn on the back slot like a mechanic\'s cape-bib with oil smudges, waist strap, and a steel wrench in the pocket.',
    examine: [
      'A tough canvas mechanic\'s apron blotched with axle grease, bearing a steel wrench tucked neatly into the pocket.',
      'Side-Valve Salvage rule: clean aprons belong to inspectors; dark grease stains mean the mower actually runs.',
      'Tip: tie the waist cords tight before riding a Zero-Turn, or the hem flaps over the rear intake.',
      'Joke: Tansy swears the largest grease blotch is shaped like Mayor Mulch, though it is mostly round.',
      'A tiny brass Husky-Blade badge is safety-pinned near the shoulder strap.',
    ],
    parts: [
      { s: 'box', d: [0.28, 0.36, 0.024], at: [0, 0.18, -0.02], c: 'tint' },                    // apron bib (min.y = 0)
      { s: 'box', d: [0.1, 0.09, 0.028], at: [-0.05, 0.24, -0.022], c: GREASE },                  // grease stain 1
      { s: 'box', d: [0.08, 0.11, 0.028], at: [0.06, 0.1, -0.022], c: GREASE },                   // grease stain 2
      { s: 'box', d: [0.14, 0.11, 0.036], at: [0, 0.13, -0.035], c: 'leather' },                 // tool pocket
      { s: 'cyl', d: [0.01, 0.01, 0.12], rot: [0, 0, -15], at: [0.03, 0.2, -0.04], c: 'steel', seg: 6 }, // pocket wrench
      { s: 'box', d: [0.035, 0.02, 0.018], rot: [0, 0, -15], at: [0.045, 0.26, -0.04], c: 'steel' }, // wrench jaw
      { s: 'box', d: [0.3, 0.025, 0.06], at: [0, 0.16, 0.01], c: 'leather-dark' },               // waist belt
      { s: 'box', d: [0.025, 0.34, 0.04], at: [0.09, 0.19, 0.015], c: 'leather-dark', mirror: true }, // shoulder straps
    ],
  },
  {
    id: 'mini-boot-hat', name: 'Mini Boot Hat', category: 'armor', uses: ['wear-head'],
    tags: ['boot', 'hat', 'head', 'parade', 'mud', 'gnorwin', 'reward'], emoji: [],
    about: 'Gnome Theft Auto: the Mini Boot Hat. A miniature leather mud-boot perched on a brimmed cap, toe pointing +z, mud-caked sole at the base.',
    examine: [
      'A miniature stitched leather boot mounted upright on a stout cap brim, complete with mud flecks and brass eyelets.',
      'Boot-Legger badge of honour: worn by gnomes crazy enough to hijack a thirty-foot parade float.',
      'Tip: duck under low awnings—the boot shaft adds half a gnome-height to your silhouette.',
      'Joke: tourists keep asking if you lost the other boot, and the answer is always downtown.',
      'Somebody painted a tiny green clover inside the heel before the parade started.',
    ],
    parts: [
      { s: 'cyl', d: [0.18, 0.19, 0.024], at: [0, 0.012, 0], c: 'dirt', seg: 12 },               // muddy brim/sole (min.y = 0)
      { s: 'box', d: [0.18, 0.09, 0.25], at: [0, 0.07, 0.03], c: 'leather' },                    // boot foot
      { s: 'ball', d: [0.09], at: [0, 0.068, 0.14], scale: [1, 0.78, 1.15], c: 'leather', seg: 8 }, // boot toe (+z)
      { s: 'cyl', d: [0.085, 0.08, 0.22], at: [0, 0.2, -0.03], c: 'leather', seg: 10 },          // boot shaft
      { s: 'cyl', d: [0.092, 0.092, 0.035], at: [0, 0.31, -0.03], c: 'leather-dark', seg: 10 },  // boot cuff
      { s: 'box', d: [0.19, 0.03, 0.1], at: [0, 0.035, 0.06], c: 'dirt' },                       // mud splatter
      { s: 'ball', d: [0.012], at: [0.04, 0.16, 0.045], c: 'brass', seg: 6, mirror: true },      // lace eyelets
    ],
  },
  {
    id: 'brass-calipers', name: 'Broken Brass Calipers', category: 'tool', uses: ['hold'],
    tags: ['brass', 'calipers', 'hoa', 'measure', 'vance', 'tool', 'hand', 'reward'], emoji: [],
    grip: [0, 0.08, 0],
    about: 'Gnome Theft Auto: Broken Brass Calipers. Upright graduated brass ruler bar with grip at bottom, fixed jaw, sliding vernier jaw, and a snapped tip.',
    examine: [
      'Heavy graduated brass calipers with a thumbwheel slider and one slightly bent measuring jaw pointing +y.',
      'HOA nightmare: Reginald Vance used these to measure driveway weeds down to the thousandth of an inch.',
      'Tip: hold them upright like a sceptre when arguing zoning bylaws; nobody checks if the scale still reads true.',
      'Joke: every blade of grass in Turfton is currently illegal according to the bent jaw.',
      'Initials R.V. are engraved neatly on the back beside a fresh dent from a Leaf-Blower blast.',
    ],
    parts: [
      { s: 'box', d: [0.026, 0.34, 0.012], at: [0, 0.17, 0], c: 'brass' },                        // main beam (min.y = 0)
      { s: 'box', d: [0.032, 0.1, 0.02], at: [0, 0.08, 0], c: 'leather-dark' },                   // leather grip wrap
      { s: 'box', d: [0.09, 0.022, 0.014], at: [0.035, 0.32, 0], c: 'brass' },                    // fixed upper jaw
      { s: 'cone', d: [0.012, 0.035], rot: [0, 0, -90], at: [0.095, 0.32, 0], c: 'brass', seg: 4 }, // upper jaw tip
      { s: 'box', d: [0.075, 0.022, 0.016], rot: [0, 0, -8], at: [0.028, 0.21, 0], c: 'copper' }, // bent/broken slider jaw
      { s: 'cyl', d: [0.014, 0.014, 0.018], rot: [90, 0, 0], at: [-0.015, 0.21, 0.012], c: 'gold', seg: 8 }, // thumbwheel
    ],
  },
  {
    id: 'tinfoil-brim', name: 'Tinfoil Conspiracy Brim', category: 'armor', uses: ['wear-head'],
    tags: ['tinfoil', 'foil', 'brim', 'hat', 'conspiracy', 'antenna', 'head', 'reward'], emoji: [],
    about: 'Gnome Theft Auto: the Tinfoil Conspiracy Brim. A silver foil trench hat with wide brim, angular crown, black band, and crooked antenna spire.',
    examine: [
      'A crisp silver-wrapped trench hat folded from heavy kitchen foil, topped with a crooked wire antenna and a green bead.',
      'Grid Truther doctrine: keeps out HOA radio scanners, pigeon mind-beams, and damp porch whispers.',
      'Tip: straighten the spire before picking up Turfton FM, unless you prefer listening to the Frostbite Fells weather buoy.',
      'Joke: shiny enough to blind a Spade Guard sniper at fifty yards, assuming the sun is out.',
      'Shelldon tucked an encrypted courier cipher under the inner sweatband for safekeeping.',
    ],
    parts: [
      { s: 'cyl', d: [0.22, 0.23, 0.02], at: [0, 0.01, 0], c: 'silver', seg: 10 },               // wide foil brim (min.y = 0)
      { s: 'cyl', d: [0.13, 0.16, 0.14], at: [0, 0.09, 0], c: 'silver', seg: 7 },                // faceted foil crown
      { s: 'cyl', d: [0.158, 0.162, 0.026], at: [0, 0.035, 0], c: 'black', seg: 10 },            // trench band
      { s: 'cyl', d: [0.008, 0.008, 0.16], rot: [0, 0, -14], at: [0.02, 0.22, 0], c: 'steel', seg: 6 }, // crooked spire
      { s: 'ball', d: [0.018], at: [0.038, 0.3, 0], c: 'emerald', glow: true, seg: 6 },          // signal bead
    ],
  },
  {
    id: 'microfiber-bowler', name: 'Microfiber Bowler', category: 'armor', uses: ['wear-head'],
    tags: ['microfiber', 'bowler', 'hat', 'lou', 'vip', 'dry', 'head', 'reward'], emoji: [],
    about: 'Gnome Theft Auto: the Microfiber Bowler. A spotless dark bowler hat with curled brim, crisp glaze-blue ribbon band, and gold lapel pin.',
    examine: [
      'A sleek charcoal bowler woven from ultra-plush microfiber cloth, finished with a crisp glaze-blue band and gold pin.',
      'Gnomecino dress code: Big Lou checks every brim at the velvet rope, and zero dampness is the only pass.',
      'Tip: steer clear of lawn sprinklers while wearing it—even a single mist-drop voids the VIP stamp.',
      'Joke: absorbs three times its weight in dew, which is the exact reason Big Lou forbids dew.',
      'A tiny felt tag inside reads: DRY AS A BONE — APPROVED BY BIG LOU.',
    ],
    parts: [
      { s: 'ring', d: [0.17, 0.022], at: [0, 0.022, 0], rot: [90, 0, 0], c: MICROFIBER_DARK, seg: 12 }, // curled brim (min.y = 0)
      { s: 'cyl', d: [0.165, 0.175, 0.03], at: [0, 0.025, 0], c: MICROFIBER_DARK, seg: 12 },     // brim base
      { s: 'ball', d: [0.15], at: [0, 0.135, 0], scale: [0.95, 0.9, 1.05], c: MICROFIBER_DARK, seg: 12 }, // bowler dome
      { s: 'cyl', d: [0.156, 0.158, 0.032], at: [0, 0.055, 0], c: 'glaze-blue', seg: 12 },       // microfiber ribbon
      { s: 'ball', d: [0.014], at: [-0.145, 0.06, 0.055], c: 'gold', seg: 6 },                   // gold pin
    ],
  },
  {
    id: 'stopping-stone-charm', name: 'Golden Stopping-Stone Charm', category: 'trinket', uses: ['wear-neck'],
    tags: ['stopping', 'stone', 'charm', 'neck', 'gold', 'fescue', 'amulet', 'reward'], emoji: [],
    about: 'Gnome Theft Auto: the Golden Stopping-Stone Charm. A gold collar chain worn round the neck with a miniature Stopping-Stone pendant hanging forward on the chest, clear of the head and face.',
    examine: [
      'A heavy gold chain carrying a tiny carved Stopping Stone pendant with a bright emerald rune set in its face.',
      'The Even Cut keepsake: awarded to the gnome who finally stopped the Grand Combine dead on Turfton Boulevard.',
      'Tip: let the charm hang flat against your coat; the gold frame keeps the carved rune bright in the dark.',
      'Joke: every Combine driver in Cloverfield flinches slightly whenever you walk past wearing it.',
      'Tiny notches along the back of the pendant trace the exact silhouette of the Turfton skyline.',
    ],
    // Collar ring wraps below the chin and pendant hangs forward on the chest (z = +0.175), staying well clear of HEAD & FACE.
    parts: [
      { s: 'ring', d: [0.21, 0.012], at: [0, 0.012, -0.05], rot: [90, 0, 0], c: 'gold', seg: 12 }, // gold chain (min.y = 0)
      { s: 'ring', d: [0.012, 0.004], at: [0, 0.048, 0.165], c: 'gold', seg: 8 },                  // pendant bail
      { s: 'box', d: [0.046, 0.056, 0.02], at: [0, 0.028, 0.175], c: 'gold' },                     // gold wedge frame (min.y = 0)
      { s: 'box', d: [0.032, 0.042, 0.022], at: [0, 0.028, 0.177], c: 'stone-dark' },              // stone inset
      { s: 'box', d: [0.01, 0.024, 0.006], at: [0, 0.028, 0.188], c: 'emerald', glow: true },      // Fescue rune
    ],
  },
  {
    id: 'salvage-wrench-pack', name: 'Side-Valve Tool Pack', category: 'armor', uses: ['wear-back'],
    tags: ['salvage', 'wrench', 'tool', 'pack', 'back', 'tansy', 'mechanic', 'reward'], emoji: [],
    tint: 'burlap',
    about: "Gnome Theft Auto: the Side-Valve Tool Pack. A canvas mechanic's backpack with oil-smudged flap, shoulder straps, and a steel open-end wrench strapped across the back. Tint sets the pack.",
    examine: [
      'A tough burlap tool pack strapped with oiled leather belts, carrying a heavy steel wrench across the rear pocket.',
      'Side-Valve Salvage rule: never walk out of the garage without a spare wrench and two dry rags.',
      'Tip: cinch the shoulder straps tight before jumping a fence, or the wrench handle taps your hat rim.',
      'Joke: half the bolts in Turfton fit this wrench, and the other half surrender as soon as they see it.',
      'Tansy stamped a tiny winged spark plug inside the flap beside a smudged chalk inventory.',
    ],
    parts: [
      { s: 'box', d: [0.22, 0.28, 0.1], at: [0, 0.14, -0.11], c: 'tint' },                       // canvas pack body (min.y = 0)
      { s: 'box', d: [0.23, 0.06, 0.11], at: [0, 0.26, -0.11], c: 'leather' },                   // top flap
      { s: 'box', d: [0.09, 0.08, 0.012], at: [-0.04, 0.12, -0.162], c: GREASE },                // grease smudge
      { s: 'box', d: [0.04, 0.04, 0.016], at: [0, 0.23, -0.165], c: 'brass' },                   // brass clasp
      { s: 'box', d: [0.024, 0.24, 0.016], rot: [0, 0, -28], at: [0, 0.16, -0.172], c: 'steel' }, // steel wrench shaft
      { s: 'box', d: [0.056, 0.036, 0.018], rot: [0, 0, -28], at: [0.055, 0.265, -0.172], c: 'steel' }, // upper wrench jaw
      { s: 'box', d: [0.046, 0.03, 0.018], rot: [0, 0, -28], at: [-0.052, 0.055, -0.172], c: 'steel' }, // lower wrench jaw
      { s: 'box', d: [0.03, 0.26, 0.09], at: [0.085, 0.15, -0.02], c: 'leather-dark', mirror: true }, // shoulder straps
    ],
  },
  {
    id: 'parade-boot-cap', name: "Founder's Parade Boot Cap", category: 'armor', uses: ['wear-head'],
    tags: ['parade', 'boot', 'cap', 'hat', 'gnorwin', 'founder', 'head', 'reward'], emoji: [],
    tint: 'red',
    trim: 'gold',
    about: "Gnome Theft Auto: Founder's Parade Boot Cap. A red-and-gold parade peaked cap topped with a miniature mud-boot crest pointing +z. Tint sets the cap cloth, trim sets the braid.",
    examine: [
      'A festive scarlet parade cap ringed in gold braid, crowned with a tiny stitched leather mud-boot crest.',
      "Founder's Trim Day tradition: worn by any gnome bold enough to steer Gnorwin's float into the HOA steps.",
      'Tip: tuck your brim low when rounding Turfton Plaza—the gold braid catches every spotlight on the boulevard.',
      'Joke: the Hat Watch filed three parking tickets against the miniature boot before realising it was a hat.',
      "Tiny flecks of dried Founder's Day confetti are still wedged under the brass boot-lace eyelets.",
    ],
    parts: [
      { s: 'cyl', d: [0.145, 0.155, 0.09], at: [0, 0.045, 0], c: 'tint', seg: 12 },               // cap crown (min.y = 0)
      { s: 'cyl', d: [0.158, 0.16, 0.024], at: [0, 0.022, 0], c: 'trim', seg: 12 },               // gold parade braid
      { s: 'cyl', d: [0.16, 0.16, 0.018], at: [0, 0.009, 0.06], scale: [0.95, 1, 1.1], c: 'black', seg: 12 }, // cap visor (+z)
      { s: 'box', d: [0.08, 0.022, 0.14], at: [0, 0.101, 0.01], c: 'dirt' },                     // mini boot sole
      { s: 'box', d: [0.072, 0.048, 0.11], at: [0, 0.135, 0.01], c: 'leather' },                 // mini boot foot
      { s: 'ball', d: [0.036], at: [0, 0.132, 0.068], scale: [0.95, 0.78, 1.15], c: 'leather', seg: 8 }, // mini boot toe
      { s: 'cyl', d: [0.035, 0.033, 0.1], at: [0, 0.2, -0.02], c: 'leather', seg: 8 },            // mini boot shaft
      { s: 'cyl', d: [0.04, 0.04, 0.018], at: [0, 0.252, -0.02], c: 'leather-dark', seg: 8 },    // mini boot cuff
      { s: 'ball', d: [0.007], at: [0.02, 0.18, 0.014], c: 'brass', seg: 6, mirror: true },      // lace eyelets
    ],
  },
  {
    id: 'sandpit-flight-helm', name: 'Sandpit Pilot Helmet', category: 'armor', uses: ['wear-head'],
    tags: ['sandpit', 'pilot', 'helmet', 'flight', 'whirligig', 'fort', 'head', 'reward'], emoji: [],
    tint: 0x4f6339,
    about: 'Gnome Theft Auto: the Sandpit Pilot Helmet. An olive-green Whirligig flight shell with earcups, boom mic, and tilted amber visor facing +z. Tint sets the helmet shell.',
    examine: [
      'A tough olive-green flight helmet fitted with padded earcups, a stubby radio mic, and a tilted amber visor.',
      'Fort Sandpit legend: if you bail out of a Crop Duster at five hundred feet, you earn the Whirligig.',
      'Tip: flip the visor down before rotor wash kicks sandbox grit across your glazed eyebrows.',
      'Joke: the radio mic only picks up Turfton FM commercials and furious Air-Control yelling.',
      "Someone scratched 'NO RETURN RECEIPT' in neat block letters along the back rim.",
    ],
    parts: [
      { s: 'ring', d: [0.165, 0.024], at: [0, 0.024, 0], rot: [90, 0, 0], c: 'leather-dark', seg: 12 }, // neck rim (min.y = 0)
      { s: 'ball', d: [0.17], at: [0, 0.157, -0.01], scale: [1, 0.92, 1.05], c: 'tint', seg: 12 }, // olive flight shell
      { s: 'cyl', d: [0.055, 0.055, 0.036], rot: [0, 0, 90], at: [0.175, 0.11, 0], c: 'black', seg: 10, mirror: true }, // earcups
      { s: 'cyl', d: [0.028, 0.028, 0.04], rot: [0, 0, 90], at: [0.178, 0.11, 0], c: 'brass', seg: 8, mirror: true }, // earcup hubs
      { s: 'cyl', d: [0.008, 0.008, 0.12], rot: [75, 25, 0], at: [0.12, 0.07, 0.09], c: 'iron-dark', seg: 6 }, // boom mic arm
      { s: 'ball', d: [0.016], at: [0.07, 0.05, 0.155], c: 'black', seg: 6 },                     // mic tip
      { s: 'cyl', d: [0.168, 0.172, 0.09], at: [0, 0.155, 0.025], rot: [-15, 0, 0], c: 'flame', alpha: 0.65, seg: 12 }, // amber visor
      { s: 'box', d: [0.22, 0.022, 0.04], at: [0, 0.215, 0.135], c: 'iron-dark' },               // visor brow rail
      { s: 'box', d: [0.025, 0.045, 0.14], at: [0, 0.31, -0.03], c: 'tint' },                    // comm fin
    ],
  },
  {
    id: 'snail-shell-cap', name: 'Racing Snail Cap', category: 'armor', uses: ['wear-head'],
    tags: ['snail', 'shell', 'cap', 'racing', 'alley', 'shelldon', 'head', 'reward'], emoji: [],
    tint: 'shell',
    trim: 'terracotta',
    about: 'Gnome Theft Auto: the Racing Snail Cap. A coiled spiral snail-shell helmet with twin bouncing eyestalks and painted racing stripe facing +z. Tint sets the shell, trim sets the spiral.',
    examine: [
      'A polished spiral snail shell strapped onto a leather cap band, fitted with two springy eyestalks and racing stripes.',
      'Alley race rule: never bet against the snail wearing number seven, especially when Shelldon sweeps the lane.',
      'Tip: tuck your chin at high speed—the spiral shell cuts the wind nicely, though the eyestalks wobble in turns.',
      'Joke: fastest piece of headwear in Turfton, which admittedly sets a fairly low bar for snails.',
      'A tiny chalk number 7 is smudged beneath the left eyestalk beside a whiff of Dandelion Fizz.',
    ],
    parts: [
      { s: 'ring', d: [0.165, 0.022], at: [0, 0.022, 0], rot: [90, 0, 0], c: 'leather-dark', seg: 12 }, // cap band (min.y = 0)
      { s: 'ball', d: [0.16], at: [0, 0.145, -0.02], scale: [0.85, 0.9, 1.15], c: 'tint', seg: 12 }, // coiled shell dome
      { s: 'ring', d: [0.1, 0.028], at: [0.115, 0.15, -0.02], rot: [0, 90, 0], c: 'trim', seg: 10, mirror: true }, // spiral whorl
      { s: 'ball', d: [0.045], at: [0.135, 0.15, -0.02], c: 'tint', seg: 8, mirror: true },       // shell boss
      { s: 'box', d: [0.036, 0.02, 0.22], at: [0, 0.285, -0.01], c: 'red' },                      // racing stripe
      { s: 'cyl', d: [0.01, 0.012, 0.11], rot: [22, 0, -14], at: [0.055, 0.24, 0.12], c: 'cloth', seg: 6, mirror: true }, // eyestalks
      { s: 'ball', d: [0.022], at: [0.072, 0.295, 0.145], c: 'white', seg: 8, mirror: true },     // eyes
      { s: 'ball', d: [0.011], at: [0.072, 0.295, 0.16], c: 'ink', seg: 6, mirror: true },        // pupils
    ],
  },
  {
    id: 'vip-towel-scarf', name: 'Gnomecino VIP Towel', category: 'armor', uses: ['wear-neck'],
    tags: ['vip', 'towel', 'scarf', 'gnomecino', 'lou', 'dry', 'neck', 'reward'], emoji: [],
    tint: 'white',
    trim: 'gold',
    about: 'Gnome Theft Auto: the Gnomecino VIP Towel. A plush monogrammed collar towel draped around the neck with hanging front tails clear of the head and face. Tint sets the towel, trim sets the gold border.',
    examine: [
      'A plush white terry towel trimmed in Gnomecino gold bands, draped neatly around the collar with twin front tails.',
      "Big Lou's velvet-rope rule: no dust, no axle grease, and no muddy boot prints past the brass stanchions.",
      'Tip: buff your porcelain brow before stepping inside; a gleaming glaze opens doors faster than acorns.',
      'Joke: Big Lou checks the gold hem with white gloves just to make sure you did not steal it from a hotel.',
      'Embroidered letters on the left tail read VIP — DRY AS A BONE, stitched in slightly crooked gold thread.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.026], at: [0, 0.026, -0.05], rot: [90, 0, 0], c: 'tint', seg: 12 }, // collar loop (min.y = 0)
      { s: 'box', d: [0.068, 0.08, 0.024], at: [0.1, 0.04, 0.155], c: 'tint', mirror: true },    // front tails (min.y = 0)
      { s: 'box', d: [0.072, 0.02, 0.028], at: [0.1, 0.022, 0.155], c: 'trim', mirror: true },   // gold hem trim
      { s: 'box', d: [0.036, 0.024, 0.012], at: [-0.1, 0.055, 0.168], c: 'ruby' },                // VIP lapel badge
    ],
  },
  {
    id: 'even-cut-medallion', name: 'Even Cut Medallion', category: 'trinket', uses: ['wear-neck'],
    tags: ['even', 'cut', 'medallion', 'neck', 'combine', 'stopping', 'stone', 'gold', 'reward'], emoji: [],
    about: 'Gnome Theft Auto: the Even Cut Medallion. A gold-and-emerald collar ribbon with a carved medallion featuring crossed blades and a glowing Stopping Stone centre on the chest, clear of the head and face.',
    examine: [
      'A heavy gold medallion suspended on an emerald ribbon, stamped with crossed mower blades locked by a glowing stone.',
      "Chapter 5 chronicle: the day Turfton cut Vesper Thorne's Grand Combine down to size on the main boulevard.",
      'Tip: wear it proud over a clean coat; even off-duty Hat Watch recruits step aside when they spot the emblem.',
      'Joke: Vesper still insists the Grand Combine only stopped for routine seasonal maintenance.',
      'Tiny emerald chips set around the rim spell out TURFTON STANDS in old Fescue chisel-marks.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.016], at: [0, 0.016, -0.05], rot: [90, 0, 0], c: 'emerald', seg: 12 }, // collar ribbon (min.y = 0)
      { s: 'ring', d: [0.012, 0.004], at: [0, 0.068, 0.168], c: 'gold', seg: 8 },                  // medallion bail
      { s: 'cyl', d: [0.042, 0.042, 0.016], at: [0, 0.042, 0.175], rot: [90, 0, 0], c: 'gold', seg: 12 }, // gold disc (min.y = 0)
      { s: 'cyl', d: [0.032, 0.032, 0.018], at: [0, 0.042, 0.176], rot: [90, 0, 0], c: OBSIDIAN, seg: 12 }, // obsidian inset
      { s: 'box', d: [0.052, 0.008, 0.006], rot: [0, 0, 45], at: [0, 0.042, 0.186], c: 'steel' }, // crossed blade 1
      { s: 'box', d: [0.052, 0.008, 0.006], rot: [0, 0, -45], at: [0, 0.042, 0.186], c: 'steel' }, // crossed blade 2
      { s: 'box', d: [0.016, 0.022, 0.01], at: [0, 0.042, 0.19], c: 'emerald', glow: true },      // Stopping Stone core
    ],
  },
];
