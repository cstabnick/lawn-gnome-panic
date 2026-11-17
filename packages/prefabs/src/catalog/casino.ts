// Casino & gambling prefabs: slot machines (classic, deluxe, mushroom) and future gaming machines.
// Units: 1 = one gnome's height (~1 m). Origin on y = 0, centred on x/z, front faces +z.
import type { PrefabDef } from '../types';

export const CASINO: PrefabDef[] = [
  {
    id: 'slot-machine-classic',
    name: 'Classic 3-Bar Slot Machine',
    category: 'furniture',
    uses: ['place'],
    tags: ['slot', 'slots', 'casino', 'gambling', 'arcade', 'one-armed-bandit', 'bar'],
    emoji: ['🎰'],
    tint: 'red',
    trim: 'brass',
    about: 'A classic 3-reel upright one-armed bandit with a glowing marquee, coin tray, and pull lever. Tint is the cabinet, trim is the metal.',
    examine: [
      'A boxy red-and-brass slot cabinet with three spinning reels behind glass and a heavy lever on the right.',
      'Pub saying: "Three BARs pay the rent; two cherries buy another round."',
      'The lever has been pulled so many times the brass knob is worn smooth as a river stone.',
      'A tiny bell inside rings loud enough to wake the bartender when triple sevens line up.',
      'Gnomes call it the One-Armed Toadstool because it eats coins faster than a badger.',
    ],
    pivots: {
      'reel-0': [-0.12, 0.88, 0.175],
      'reel-1': [0, 0.88, 0.175],
      'reel-2': [0.12, 0.88, 0.175],
      lever: [0.32, 0.72, 0],
    },
    interact: {
      stand: [-0.36, 0, 0.82],
      lookAt: [0, 0.88, 0.15],
      camera: [0.18, 1.02, 1.06],
    },
    parts: [
      // Base & lower cabinet
      { s: 'box', d: [0.62, 0.08, 0.52], at: [0, 0.04, 0], c: 'trim' },
      { s: 'box', d: [0.58, 0.58, 0.48], at: [0, 0.37, -0.01], c: 'tint' },
      // Front coin door & coin tray
      { s: 'box', d: [0.46, 0.34, 0.03], at: [0, 0.32, 0.24], c: 'iron-dark' },
      { s: 'box', d: [0.48, 0.08, 0.12], at: [0, 0.12, 0.27], c: 'trim' },
      { s: 'box', d: [0.42, 0.03, 0.08], at: [0, 0.145, 0.28], c: 'black' },
      // Upper reel housing
      { s: 'box', d: [0.58, 0.44, 0.42], at: [0, 0.88, -0.04], c: 'tint' },
      // Reel bezel & recessed dark window
      { s: 'box', d: [0.48, 0.26, 0.04], at: [0, 0.88, 0.18], c: 'trim' },
      { s: 'box', d: [0.42, 0.2, 0.02], at: [0, 0.88, 0.195], c: 'black' },
      // Three reel drums (white) inside named pivot groups
      { s: 'cyl', d: [0.065, 0.065, 0.1], at: [-0.12, 0.88, 0.175], rot: [0, 0, 90], c: 'white', seg: 12, group: 'reel-0' },
      { s: 'cyl', d: [0.065, 0.065, 0.1], at: [0, 0.88, 0.175], rot: [0, 0, 90], c: 'white', seg: 12, group: 'reel-1' },
      { s: 'cyl', d: [0.065, 0.065, 0.1], at: [0.12, 0.88, 0.175], rot: [0, 0, 90], c: 'white', seg: 12, group: 'reel-2' },
      // Side payline pointers flanking the reel window
      { s: 'box', d: [0.028, 0.014, 0.018], at: [0.2, 0.88, 0.215], c: 'red', glow: true, mirror: true },
      // Coin slot on front-right
      { s: 'box', d: [0.05, 0.08, 0.03], at: [0.21, 0.66, 0.22], c: 'silver' },
      { s: 'box', d: [0.012, 0.04, 0.01], at: [0.21, 0.66, 0.238], c: 'black' },
      // Glowing marquee crown
      { s: 'box', d: [0.54, 0.18, 0.34], at: [0, 1.19, -0.04], c: 'trim' },
      { s: 'box', d: [0.46, 0.12, 0.03], at: [0, 1.19, 0.135], c: 'spark', glow: true, name: 'marquee' },
      // Topper beacon dome
      { s: 'cyl', d: [0.055, 0.065, 0.08], at: [0, 1.32, -0.04], c: 'ruby', glow: true, seg: 10, name: 'beacon' },
      // Pull lever on the right side (+x)
      { s: 'cyl', d: [0.045, 0.045, 0.06], at: [0.32, 0.72, 0], rot: [0, 0, 90], c: 'trim', seg: 10 },
      { s: 'cyl', d: [0.018, 0.018, 0.34], at: [0.34, 0.88, 0.04], rot: [15, 0, 0], c: 'silver', seg: 8, group: 'lever' },
      { s: 'ball', d: [0.048], at: [0.34, 1.05, 0.085], c: 'red', seg: 10, group: 'lever' },
    ],
    lights: [
      { at: [0, 1.38, 0.18], c: 'spark', intensity: 0.7, distance: 2.2 },
    ],
  },
  {
    id: 'slot-machine-deluxe',
    name: 'Deluxe Jackpot Slot Machine',
    category: 'furniture',
    uses: ['place'],
    tags: ['slot', 'slots', 'casino', 'gambling', 'jackpot', 'deluxe', 'gold'],
    emoji: ['🎰'],
    tint: 'emerald',
    trim: 'gold',
    about: 'An ornate high-roller slot machine with an arched golden crown and triple jackpot beacons. Tint is the cabinet, trim is the gold.',
    examine: [
      'A tall emerald-and-gold cabinet crowned with three gleaming beacons and a velvet-lined coin chute.',
      'High-roller proverb: "The deluxe machine never forgets a big tip, though it rarely returns one."',
      'Its reels spin on oiled brass bearings so quiet you can hear your own heart beat.',
      'Rumour says the middle reel hesitates for a fraction of a second just to tease you.',
    ],
    pivots: {
      'reel-0': [-0.13, 0.88, 0.185],
      'reel-1': [0, 0.88, 0.185],
      'reel-2': [0.13, 0.88, 0.185],
      lever: [0.33, 0.74, 0],
    },
    interact: {
      stand: [-0.38, 0, 0.84],
      lookAt: [0, 0.88, 0.16],
      camera: [0.18, 1.04, 1.1],
    },
    parts: [
      // Stepped pedestal
      { s: 'box', d: [0.66, 0.08, 0.56], at: [0, 0.04, 0], c: 'trim' },
      { s: 'box', d: [0.62, 0.56, 0.5], at: [0, 0.36, -0.01], c: 'tint' },
      // Brass side pillars
      { s: 'cyl', d: [0.032, 0.032, 1.04], at: [0.28, 0.6, 0.22], c: 'trim', mirror: true, seg: 10 },
      // Coin tray
      { s: 'box', d: [0.5, 0.09, 0.14], at: [0, 0.13, 0.28], c: 'trim' },
      { s: 'box', d: [0.44, 0.035, 0.09], at: [0, 0.155, 0.29], c: 'black' },
      // Upper cabinet & arched crown
      { s: 'box', d: [0.6, 0.46, 0.44], at: [0, 0.87, -0.04], c: 'tint' },
      { s: 'box', d: [0.5, 0.28, 0.04], at: [0, 0.88, 0.19], c: 'trim' },
      { s: 'box', d: [0.44, 0.22, 0.02], at: [0, 0.88, 0.205], c: 'black' },
      { s: 'cyl', d: [0.068, 0.068, 0.1], at: [-0.13, 0.88, 0.185], rot: [0, 0, 90], c: 'white', seg: 12, group: 'reel-0' },
      { s: 'cyl', d: [0.068, 0.068, 0.1], at: [0, 0.88, 0.185], rot: [0, 0, 90], c: 'white', seg: 12, group: 'reel-1' },
      { s: 'cyl', d: [0.068, 0.068, 0.1], at: [0.13, 0.88, 0.185], rot: [0, 0, 90], c: 'white', seg: 12, group: 'reel-2' },
      // Arched marquee
      { s: 'cyl', d: [0.28, 0.28, 0.36], at: [0, 1.12, -0.04], rot: [90, 0, 0], c: 'trim', seg: 14 },
      { s: 'cyl', d: [0.23, 0.23, 0.04], at: [0, 1.12, 0.15], rot: [90, 0, 0], c: 'spark', glow: true, seg: 14, name: 'marquee' },
      // Triple jackpot gems
      { s: 'ball', d: [0.04], at: [-0.14, 1.38, 0.02], c: 'ruby', glow: true, seg: 8 },
      { s: 'ball', d: [0.055], at: [0, 1.43, 0.02], c: 'gold', glow: true, seg: 8, name: 'beacon' },
      { s: 'ball', d: [0.04], at: [0.14, 1.38, 0.02], c: 'sapphire', glow: true, seg: 8 },
      // Pull lever
      { s: 'cyl', d: [0.048, 0.048, 0.06], at: [0.33, 0.74, 0], rot: [0, 0, 90], c: 'trim', seg: 10 },
      { s: 'cyl', d: [0.018, 0.018, 0.36], at: [0.35, 0.91, 0.04], rot: [15, 0, 0], c: 'gold', seg: 8, group: 'lever' },
      { s: 'ball', d: [0.052], at: [0.35, 1.09, 0.09], c: 'emerald', glow: true, seg: 10, group: 'lever' },
    ],
    lights: [
      { at: [0, 1.45, 0.2], c: 'gold', intensity: 0.8, distance: 2.5 },
    ],
  },
  {
    id: 'slot-machine-mushroom',
    name: 'Toadstool Slot Machine',
    category: 'furniture',
    uses: ['place'],
    tags: ['slot', 'slots', 'casino', 'gambling', 'mushroom', 'toadstool', 'gnome'],
    emoji: ['🎰'],
    tint: 'mushroom-cap',
    trim: 'wood',
    about: 'A garden-gnome slot machine carved into a stout wooden stump with a spotted toadstool canopy. Tint is the cap, trim is the wood.',
    examine: [
      'A hollowed oak stump fitted with brass reels and sheltered beneath a bright spotted toadstool cap.',
      'Garden lore: "Three golden acorns on the Toadstool Slot means the badger owes you a pint."',
      'The pull-arm is a polished ash branch tipped with a painted wooden berry.',
      'Moss grows around the base, though the coin tray stays dry and gleaming.',
    ],
    pivots: {
      'reel-0': [-0.11, 0.82, 0.225],
      'reel-1': [0, 0.82, 0.225],
      'reel-2': [0.11, 0.82, 0.225],
      lever: [0.27, 0.72, 0],
    },
    interact: {
      stand: [-0.34, 0, 0.82],
      lookAt: [0, 0.82, 0.2],
      camera: [0.16, 0.96, 1.06],
    },
    parts: [
      // Stump base & body
      { s: 'cyl', d: [0.26, 0.33, 0.14], at: [0, 0.07, 0], c: 'bark', seg: 12 },
      { s: 'cyl', d: [0.25, 0.27, 0.86], at: [0, 0.57, 0], c: 'trim', seg: 12 },
      // Coin tray
      { s: 'box', d: [0.38, 0.07, 0.12], at: [0, 0.18, 0.26], c: 'brass' },
      { s: 'box', d: [0.32, 0.025, 0.08], at: [0, 0.205, 0.27], c: 'black' },
      // Reel frame & 3 reels
      { s: 'box', d: [0.44, 0.24, 0.06], at: [0, 0.82, 0.22], c: 'brass' },
      { s: 'box', d: [0.38, 0.18, 0.02], at: [0, 0.82, 0.245], c: 'black' },
      { s: 'cyl', d: [0.058, 0.058, 0.09], at: [-0.11, 0.82, 0.225], rot: [0, 0, 90], c: 'white', seg: 12, group: 'reel-0' },
      { s: 'cyl', d: [0.058, 0.058, 0.09], at: [0, 0.82, 0.225], rot: [0, 0, 90], c: 'white', seg: 12, group: 'reel-1' },
      { s: 'cyl', d: [0.058, 0.058, 0.09], at: [0.11, 0.82, 0.225], rot: [0, 0, 90], c: 'white', seg: 12, group: 'reel-2' },
      // Toadstool cap canopy
      { s: 'cyl', d: [0.18, 0.38, 0.18], at: [0, 1.12, 0], c: 'tint', seg: 14 },
      { s: 'cyl', d: [0.05, 0.18, 0.08], at: [0, 1.25, 0], c: 'tint', seg: 14 },
      // White mushroom spots
      { s: 'ball', d: [0.045], at: [0.14, 1.16, 0.2], scale: [1, 0.5, 1], c: 'mushroom-stem', mirror: true, seg: 8 },
      { s: 'ball', d: [0.04], at: [0, 1.24, 0.13], scale: [1, 0.5, 1], c: 'mushroom-stem', seg: 8, name: 'beacon' },
      // Branch lever on right
      { s: 'cyl', d: [0.035, 0.035, 0.06], at: [0.27, 0.72, 0], rot: [0, 0, 90], c: 'bark', seg: 8 },
      { s: 'cyl', d: [0.016, 0.018, 0.3], at: [0.29, 0.86, 0.03], rot: [15, 0, 0], c: 'wood-light', seg: 8, group: 'lever' },
      { s: 'ball', d: [0.045], at: [0.29, 1.01, 0.075], c: 'tint', seg: 10, group: 'lever' },
    ],
    lights: [
      { at: [0, 0.98, 0.34], c: 'spark', intensity: 0.55, distance: 2.0 },
    ],
  },
];
