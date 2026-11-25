// Gnome Souls prefabs: Kiln-Breaker Greatsword, armor rewards, and the Kiln-Ember Shrine brazier.
import type { PrefabDef } from '../types';

export const GNOME_SOULS: readonly PrefabDef[] = [
  {
    id: 'kiln-breaker-greatsword',
    name: 'Kiln-Breaker Greatsword',
    category: 'weapon',
    uses: ['hold', 'swing'],
    wear: { rot: [180, 0, 0] },
    tags: ['greatsword', 'sword', 'blade', 'two-handed', 'heavy', 'iron', 'ember', 'gnome-souls'],
    emoji: [],
    grip: [0, 0.14, 0],
    about: 'An absurdly heavy two-handed iron greatsword forged for cracking fired clay.',
    examine: [
      'A slab of hammered kiln-iron longer than a gnome is tall, with a notch-worn edge.',
      'The leather grip is wrapped twice so both clay hands can haul it through a swing.',
      'A thin seam of glowing ember-glaze runs up the fuller, still warm from the Sunken Spigot.',
      'Old saying: "A trowel turns soil; a greatsword turns a Hollow back into dust."',
    ],
    parts: [
      { s: 'ball', d: [0.042], at: [0, 0.02, 0], c: 'brass', seg: 8 },                         // heavy pommel
      { s: 'cyl', d: [0.022, 0.025, 0.24], at: [0, 0.14, 0], c: 'leather-dark', seg: 8 },      // two-handed grip
      { s: 'box', d: [0.24, 0.032, 0.048], at: [0, 0.27, 0], c: 'brass' },                      // wide crossguard
      { s: 'box', d: [0.095, 0.56, 0.018], at: [0, 0.56, 0], c: 'iron-dark' },                  // heavy blade
      { s: 'box', d: [0.02, 0.44, 0.022], at: [0, 0.52, 0], c: 'flame', glow: true },           // ember fuller
      { s: 'cone', d: [0.068, 0.13], at: [0, 0.905, 0], scale: [1, 1, 0.28], c: 'steel', seg: 4 }, // greatsword tip
    ],
  },
  {
    id: 'spigot-helm',
    name: 'Spigot Knight Helm',
    category: 'armor',
    uses: ['wear-head'],
    tags: ['helm', 'knight', 'iron', 'spigot', 'head', 'reward', 'gnome-souls'],
    emoji: [],
    about: 'A soot-stained iron greathelm crowned with a tiny brass faucet handle.',
    examine: [
      'A bucket-shaped iron helm riveted for gnome knights who march into damp culverts.',
      'The narrow eye-slit keeps out spray when Slink thrashes in the Sunken Spigot Basin.',
      'A miniature brass cross-valve sits on the crown; turning it does nothing, yet knights insist.',
      'Smells of wet rust, kiln ash, and stubbornness.',
    ],
    parts: [
      { s: 'cyl', d: [0.15, 0.155, 0.22], at: [0, 0.11, 0], c: 'iron-dark', seg: 10 },
      { s: 'box', d: [0.16, 0.022, 0.03], at: [0, 0.12, 0.148], c: 'black' },                   // visor slit
      { s: 'box', d: [0.022, 0.12, 0.02], at: [0, 0.11, 0.15], c: 'brass' },                    // vertical trim
      { s: 'cyl', d: [0.02, 0.02, 0.05], at: [0, 0.24, 0], c: 'brass', seg: 8 },                // valve stem
      { s: 'box', d: [0.1, 0.018, 0.018], at: [0, 0.265, 0], c: 'brass' },                      // cross handle
      { s: 'box', d: [0.018, 0.018, 0.1], at: [0, 0.265, 0], c: 'brass' },
    ],
  },
  {
    id: 'hose-coil-cloak',
    name: 'Hose-Coil Cloak',
    category: 'armor',
    uses: ['wear-back'],
    tags: ['cloak', 'cape', 'hose', 'back', 'moss', 'reward', 'gnome-souls'],
    emoji: [],
    about: 'A tattered moss-dark cloak weighted at the shoulders with a severed coil of garden hose.',
    examine: [
      'Woven from damp culvert sackcloth and bound with a heavy brass hose-coupling clasp.',
      'A stiff loop of dark green rubber hose hangs across the back as a trophy of the Basin.',
      'Hollow gnomes hesitate before striking a cloak that still drips Sunken Spigot water.',
      'The hem is singed from resting too close to Kiln-Ember Shrines.',
    ],
    parts: [
      { s: 'box', d: [0.24, 0.28, 0.025], at: [0, 0.14, 0], rot: [8, 0, 0], c: 'leaf-dark' },
      { s: 'box', d: [0.2, 0.03, 0.035], at: [0, 0.28, 0.015], c: 'leather-dark' },
      { s: 'ring', d: [0.1, 0.024], at: [0, 0.18, -0.028], rot: [10, 0, 0], c: 'chitin', seg: 12 },
      { s: 'cyl', d: [0.03, 0.03, 0.04], at: [0, 0.08, -0.03], rot: [0, 0, 90], c: 'brass', seg: 8 },
    ],
  },
  {
    id: 'glaze-ember-charm',
    name: 'Glaze Ember Charm',
    category: 'armor',
    uses: ['wear-neck'],
    tags: ['charm', 'ember', 'neck', 'iron', 'glow', 'reward', 'gnome-souls'],
    emoji: [],
    about: 'An iron collar bearing a sealed bead of liquid kiln-ember.',
    examine: [
      'A dark iron ring forged to sit low on the collar, keeping the chest warm in damp stone.',
      'The glowing ember bead inside the brass cage never quite cools, even underwater.',
      'Gnomes touch it before stepping through a Mist Curtain.',
      'Old saying: "As long as the glaze stays warm, the clay will mend."',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.01], at: [0, 0.01, -0.05], rot: [90, 0, 0], c: 'iron-dark', seg: 12 },
      { s: 'cyl', d: [0.022, 0.022, 0.016], at: [0, 0.042, 0.185], c: 'brass', seg: 8 },
      { s: 'ball', d: [0.024], at: [0, 0.02, 0.185], c: 'flame', glow: true, seg: 8 },
    ],
  },
  {
    id: 'kiln-brazier',
    name: 'Kiln-Ember Brazier',
    category: 'prop',
    uses: ['place', 'light'],
    tags: ['brazier', 'bonfire', 'shrine', 'ember', 'fire', 'gnome-souls'],
    emoji: [],
    footprint: { r: 0.4, h: 0.9 },
    about: 'A cracked terracotta basin of glowing kiln coals with a crooked iron trowel planted at its heart.',
    examine: [
      'An inverted clay saucer propped on three stone blocks, brimming with live embers.',
      'A rusted trowel stands blade-down in the ash, marking a safe place to mend cracked clay.',
      'Resting here refills Glaze Flasks, though the Hollows in the culvert rise again.',
      'Its warm orange light pushes back the dark of the Sunken Spigot.',
    ],
    parts: [
      { s: 'box', d: [0.12, 0.14, 0.12], at: [-0.2, 0.07, 0.15], c: 'stone-dark' },
      { s: 'box', d: [0.12, 0.14, 0.12], at: [0.2, 0.07, 0.15], c: 'stone-dark' },
      { s: 'box', d: [0.12, 0.14, 0.12], at: [0, 0.07, -0.22], c: 'stone-dark' },
      { s: 'cyl', d: [0.36, 0.24, 0.16], at: [0, 0.2, 0], c: 'terracotta', seg: 10 },
      { s: 'cyl', d: [0.29, 0.29, 0.05], at: [0, 0.27, 0], c: 'flame', glow: true, seg: 10 },
      { s: 'ball', d: [0.07], at: [0, 0.31, 0], c: 'spark', glow: true, seg: 6 },
      { s: 'cyl', d: [0.022, 0.02, 0.42], at: [0, 0.56, 0], rot: [8, 0, -6], c: 'iron-dark', seg: 8 },
      { s: 'cyl', d: [0.028, 0.024, 0.14], at: [-0.02, 0.78, 0.03], rot: [8, 0, -6], c: 'wood-dark', seg: 8 },
    ],
  },
];
