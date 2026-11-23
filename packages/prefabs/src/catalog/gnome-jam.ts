// GBA GJAM basketball prefabs: basketball, hoop stanchion, Golden Acorn trophy,
// arena speaker/scoreboard, and unlockable court cosmetics (headband, whistle, foam finger, gym bag).
// Units: 1 = one gnome's height (~1 m). Origin on y = 0, centred on x/z, front faces +z.
import type { PrefabDef } from '../types';

export const GNOME_JAM: PrefabDef[] = [
  {
    id: 'gba-basketball',
    name: 'GBA Basketball',
    category: 'prop',
    uses: ['place', 'hold', 'throw'],
    tags: ['basketball', 'ball', 'sport', 'gba', 'jam', 'hoop'],
    emoji: ['🏀'],
    tint: 'orange',
    trim: 'black',
    grip: [0, 0.14, 0],
    about: 'A regulation GBA pebble-grain basketball with black seams. Tint is the leather, trim is the ribs.',
    examine: [
      'A bouncy orange leather sphere ribbed with deep black seams for clay-finger grip.',
      'GBA rulebook: "If it catches fire after three straight buckets, play on."',
      'Inflated with the finest garden pump until it rings like a drum on hardwood.',
      'Scuffed from a thousand crossovers, alley-oops, and backboard-shattering slams.',
      'Rumour says the pro league balls are stuffed with springy dandelion fluff.',
    ],
    parts: [
      { s: 'ball', d: [0.145], at: [0, 0.145, 0], c: 'tint', seg: 12 },
      // Equatorial & meridian seam rings
      { s: 'ring', d: [0.146, 0.008], at: [0, 0.145, 0], rot: [90, 0, 0], c: 'trim', seg: 12 },
      { s: 'ring', d: [0.146, 0.008], at: [0, 0.145, 0], rot: [0, 0, 0], c: 'trim', seg: 12 },
      { s: 'ring', d: [0.146, 0.008], at: [0, 0.145, 0], rot: [0, 90, 0], c: 'trim', seg: 12 },
    ],
  },
  {
    id: 'gba-hoop',
    name: 'Gnomerena Hoop',
    category: 'prop',
    uses: ['place'],
    tags: ['hoop', 'basket', 'backboard', 'rim', 'basketball', 'gba', 'arena'],
    emoji: [],
    tint: 'red',
    trim: 'white',
    footprint: { r: 0.45, h: 3.6 },
    about: 'A full indoor Gnomerena basketball stanchion with padded base, glass backboard, rim and net. Front faces +z.',
    examine: [
      'A heavy padded stanchion holding a clear backboard, red shooter square, and orange breakaway rim.',
      'Built to survive front-flip cannonball dunks, though the backboard still shudders every time.',
      'The net is woven from stout garden twine and smells faintly of scorched hemp after a hot streak.',
      'Ten gnome-feet tall? Not quite—just high enough that a turbo leap puts your hat over the rim.',
      'Gnomes hang from the iron after a monster jam until the referee blows the whistle.',
    ],
    parts: [
      // Padded base & main vertical stanchion (behind backboard, at -z)
      { s: 'box', d: [0.72, 0.65, 0.85], at: [0, 0.325, -0.78], c: 'tint' },
      { s: 'box', d: [0.76, 0.08, 0.9], at: [0, 0.04, -0.78], c: 'iron-dark' },
      { s: 'box', d: [0.22, 2.55, 0.22], at: [0, 1.85, -0.72], c: 'iron-dark' },
      // Padded sleeve on lower pole
      { s: 'box', d: [0.28, 1.35, 0.28], at: [0, 1.28, -0.72], c: 'tint' },
      // Angled boom arm reaching forward to backboard
      { s: 'box', d: [0.18, 0.18, 0.82], at: [0, 3.08, -0.38], rot: [-10, 0, 0], c: 'iron-dark' },
      // Backboard frame + clear glass pane (at z = 0)
      { s: 'box', d: [1.52, 0.96, 0.05], at: [0, 3.36, 0], c: 'glass', alpha: 0.45 },
      { s: 'box', d: [1.56, 0.05, 0.07], at: [0, 3.84, 0], c: 'trim' },
      { s: 'box', d: [1.56, 0.05, 0.07], at: [0, 2.88, 0], c: 'trim' },
      { s: 'box', d: [0.05, 0.96, 0.07], at: [0.76, 3.36, 0], c: 'trim', mirror: true },
      // Red shooter's square
      { s: 'box', d: [0.54, 0.04, 0.06], at: [0, 3.44, 0.015], c: 'tint' },
      { s: 'box', d: [0.54, 0.04, 0.06], at: [0, 3.04, 0.015], c: 'tint' },
      { s: 'box', d: [0.04, 0.42, 0.06], at: [0.25, 3.24, 0.015], c: 'tint', mirror: true },
      // Rim bracket & breakaway orange hoop (centred at [0, 3.05, 0.36])
      { s: 'box', d: [0.18, 0.12, 0.12], at: [0, 3.05, 0.06], c: 'orange' },
      { s: 'ring', d: [0.27, 0.024], at: [0, 3.05, 0.36], rot: [90, 0, 0], c: 'orange', seg: 14 },
      // Tapered white twine net
      { s: 'cyl', d: [0.25, 0.16, 0.38], at: [0, 2.84, 0.36], c: 'white', alpha: 0.78, seg: 10 },
    ],
  },
  {
    id: 'gba-trophy',
    wear: { rot: [90, 0, 0] },
    name: 'Golden Acorn Trophy',
    category: 'trinket',
    uses: ['place', 'hold', 'collect'],
    tags: ['trophy', 'acorn', 'gold', 'champion', 'gba', 'basketball', 'cup'],
    emoji: ['🏆'],
    tint: 'gold',
    trim: 'wood-dark',
    grip: [0, 0.12, 0],
    about: 'The GBA Championship Golden Acorn Trophy on a polished walnut plinth. Tint is the trophy, trim is the base.',
    examine: [
      'A gleaming golden basketball-acorn hoisted on a walnut pedestal, awarded to the GBA Finals champion.',
      'Every season ends in the top-six knockout tournament, and every gnome dreams of lifting this.',
      'The tiny brass plaque on the front is freshly polished and waiting for a team name.',
      'Heavy enough to require two clay hands, or one very proud dunker.',
      'They say if you polish the cap before tip-off, your three-pointers never rim out.',
    ],
    parts: [
      { s: 'box', d: [0.24, 0.08, 0.24], at: [0, 0.04, 0], c: 'trim' },
      { s: 'box', d: [0.19, 0.05, 0.19], at: [0, 0.105, 0], c: 'trim' },
      { s: 'box', d: [0.14, 0.045, 0.012], at: [0, 0.045, 0.122], c: 'brass' },
      { s: 'cyl', d: [0.032, 0.055, 0.14], at: [0, 0.2, 0], c: 'tint', seg: 10 },
      { s: 'ball', d: [0.105], at: [0, 0.34, 0], scale: [1, 1.15, 1], c: 'tint', seg: 12 },
      // Acorn cap & stem on top
      { s: 'cyl', d: [0.115, 0.095, 0.06], at: [0, 0.43, 0], c: 'brass', seg: 10 },
      { s: 'cyl', d: [0.015, 0.02, 0.055], at: [0, 0.48, 0], c: 'brass', seg: 8 },
      // Handles
      { s: 'ring', d: [0.055, 0.012, 180], at: [0.1, 0.34, 0], rot: [0, 0, -90], c: 'tint', mirror: true, seg: 8 },
    ],
  },
  {
    id: 'gba-headband',
    name: 'GBA Sweatband',
    category: 'armor',
    uses: ['wear-head', 'place'],
    tags: ['headband', 'sweatband', 'basketball', 'sport', 'gba', 'cloth'],
    emoji: [],
    tint: 'red',
    trim: 'white',
    wear: { at: [0, -0.05, 0], rot: [0, 0, 0] },
    about: 'A striped terry-cloth basketball headband with twin tails. Tint is the band, trim is the stripe.',
    examine: [
      'A thick terry-cloth headband worn by pro GBA ballers to keep kiln-dust out of their eyes.',
      'Gnomes do not technically sweat, which makes wearing a sweatband pure style.',
      'The white racing stripe across the forehead adds at least two inches to your vertical leap.',
      'Worn low over the brow by clutch three-point shooters and high-flying dunkers alike.',
      'Smells faintly of cedar courts and victory.',
    ],
    parts: [
      { s: 'cyl', d: [0.185, 0.185, 0.068], at: [0, 0.034, 0], c: 'tint', seg: 14 },
      { s: 'cyl', d: [0.189, 0.189, 0.02], at: [0, 0.034, 0], c: 'trim', seg: 14 },
      // Little knotted tails at the back (-z)
      { s: 'box', d: [0.035, 0.022, 0.09], at: [0.03, 0.028, -0.21], rot: [-18, 16, 0], c: 'tint', mirror: true },
    ],
  },
  {
    id: 'gba-whistle',
    name: 'Referee Whistle',
    category: 'trinket',
    uses: ['wear-neck', 'place'],
    tags: ['whistle', 'referee', 'brass', 'sport', 'gba', 'basketball'],
    emoji: [],
    tint: 'brass',
    trim: 'black',
    // Sits cleanly on the chest below the chin (clear of head & face)
    parts: [
      { s: 'cyl', d: [0.004, 0.004, 0.05], at: [0.015, 0.055, 0.155], rot: [0, 0, 14], c: 'trim', mirror: true, seg: 6 },
      { s: 'cyl', d: [0.022, 0.022, 0.028], at: [0, 0.024, 0.16], rot: [0, 0, 90], c: 'tint', seg: 10 },
      { s: 'box', d: [0.022, 0.014, 0.038], at: [0, 0.032, 0.182], c: 'tint' },
    ],
    about: 'A loud brass referee whistle on a black lanyard. Tint is the brass, trim is the cord.',
    examine: [
      'A gleaming brass pea-whistle on a black cord, loud enough to hush a packed Gnomerena.',
      'In GBA rules, shoving is totally legal—so the referee mostly blows this to start quarters.',
      'Contains a dried mustard seed that rattles fiercely whenever you sprint down the court.',
      'Worn with pride by officials and by point guards who love calling their own plays.',
      'One tweet for tip-off, two tweets for overtime, three tweets when someone shatters the glass.',
    ],
  },
  {
    id: 'gba-foam-finger',
    wear: { rot: [180, 0, 0] },
    name: 'GBA #1 Foam Finger',
    category: 'tool',
    uses: ['hold', 'place'],
    tags: ['foam', 'finger', 'fan', 'crowd', 'basketball', 'gba', 'cheer'],
    emoji: ['☝'],
    tint: 'blue',
    trim: 'yellow',
    grip: [0, 0.08, 0],
    about: 'An oversized stadium foam hand pointing skyward with a #1 emblem. Tint is the foam, trim is the badge.',
    examine: [
      'A giant spongy foam hand that slips right over a gnome fist and doubles their cheering reach.',
      'Sold at every Gnomerena concession stand alongside roasted acorns and dandelion soda.',
      'Waving it during an opponent free throw is a time-honoured Yard tradition.',
      'Soft enough that even an enthusiastic high-five will not chip your neighbour.',
      'Declares your team #1 regardless of what the season standings currently say.',
    ],
    parts: [
      // Palm
      { s: 'box', d: [0.16, 0.18, 0.055], at: [0, 0.09, 0], c: 'tint' },
      // Index finger pointing up
      { s: 'pill', d: [0.028, 0.16], at: [-0.042, 0.27, 0], c: 'tint', seg: 8 },
      // Curled fingers
      { s: 'box', d: [0.09, 0.075, 0.06], at: [0.035, 0.15, 0.01], c: 'tint' },
      // Thumb sticking out
      { s: 'box', d: [0.06, 0.05, 0.05], at: [-0.095, 0.11, 0], rot: [0, 0, 22], c: 'tint' },
      // "#1" yellow badge on front & back
      { s: 'box', d: [0.028, 0.095, 0.062], at: [0, 0.095, 0], c: 'trim' },
      { s: 'box', d: [0.055, 0.022, 0.062], at: [0, 0.052, 0], c: 'trim' },
    ],
  },
  {
    id: 'gba-gym-bag',
    name: 'GBA Team Duffel',
    category: 'container',
    uses: ['wear-back', 'place'],
    tags: ['bag', 'duffel', 'gym', 'basketball', 'gba', 'sport'],
    emoji: [],
    tint: 'green',
    trim: 'gold',
    about: 'A cylindrical canvas team duffel bag with gold racing stripes. Tint is the bag, trim is the straps.',
    examine: [
      'A stout canvas gym bag packed with spare laces, chalk dust, and an extra clay polish rag.',
      'Every GBA road trip starts with tossing one of these into the back of the team mower-bus.',
      'Gold piping down the sides marks it as official league issue.',
      'Somehow always has one slightly deflated practice ball wedged in the bottom.',
      'Sturdy enough to double as a bench during away games.',
    ],
    parts: [
      { s: 'cyl', d: [0.11, 0.11, 0.34], at: [0, 0.11, 0], rot: [0, 0, 90], c: 'tint', seg: 10 },
      { s: 'cyl', d: [0.114, 0.114, 0.028], at: [0.1, 0.11, 0], rot: [0, 0, 90], c: 'trim', mirror: true, seg: 10 },
      { s: 'ring', d: [0.05, 0.012, 180], at: [0, 0.21, 0], c: 'leather-dark', seg: 8 },
    ],
  },
];
