// Gnome Theft Auto: the two faces on the HUD meters, as small 3D heads (games/gnome-theft-auto/src/hud.ts draws them).
// Clay (life): a smug gnome in a red hat. Its damage level counts the health it has lost (0 healthy, 4 crumbled).
// Hat Watch (wanted): a police-capped gnome with a badge. Its damage level is the watch tier (0 calm, 4 furious).
import type { DamageStage, Part, PrefabDef } from '../types';

const SKIN = 0xe9b98a;

const CLAY_EXAMINE = [
  'A smug gnome head in red, half-lidded and sure it has the better of the argument.',
  'Saying: a gnome that smiles like that has already decided what happens next.',
  'Tip: a crack in clay is a story waiting to be told. Glaze mends it, but the story stays.',
  'Joke: the smirk is the only part that has never once been cracked, which is the whole problem.',
  'Someone scratched a tally of wins on the hat brim. The tally is short and the smirk is long.',
];

const WANTED_EXAMINE = [
  'A gnome head under a police cap, a gold badge pinned on the front and a face that means business.',
  'Saying: the watch sees everything, mostly because it is always standing on something tall.',
  'Tip: the calmer the face, the less trouble is coming. The furious faces are the ones to run from.',
  'Joke: the cap is not for keeping the rain off. Nobody has ever checked it for rain.',
  'The badge says Hat Watch in tiny letters. A gnome who reads it says the letters look guilty.',
];

/** Clay's head. Parts are named so the damage stages can hide them or add their own. */
const CLAY_BASE: Part[] = [
  { s: 'ball', d: [0.2], at: [0, 0.2, 0], c: 'tint', seg: 10, name: 'head' },
  { s: 'ball', d: [0.045], at: [0, 0.2, 0.2], c: 'tint', seg: 6, name: 'nose' },
  { s: 'box', d: [0.07, 0.025, 0.03], at: [0.075, 0.25, 0.19], c: 'black', name: 'lid', mirror: true },
  { s: 'box', d: [0.13, 0.022, 0.03], at: [0.04, 0.14, 0.19], rot: [0, 0, 12], c: 'black', name: 'smirk' },
  { s: 'ball', d: [0.13], at: [0, 0.1, 0.14], scale: [1, 0.7, 0.6], c: 'white', seg: 8, name: 'beard' },
  { s: 'cyl', d: [0.19, 0.19, 0.04], at: [0, 0.37, 0], c: 'red', seg: 10, name: 'hat' },
  { s: 'cone', d: [0.14, 0.34], at: [0, 0.56, 0], c: 'red', seg: 10, name: 'hat' },
];

/** Clay's stages, mildest first: stage 1 cracks, 2 frowns, 3 chips and loses its eyes, 4 crumbles. */
const CLAY_DAMAGE: DamageStage[] = [
  {
    name: 'cracked',
    add: [
      { s: 'box', d: [0.012, 0.1, 0.012], at: [-0.09, 0.28, 0.2], rot: [0, 0, 25], c: 'black', name: 'crack' },
      { s: 'box', d: [0.012, 0.08, 0.012], at: [0.1, 0.3, 0.19], rot: [0, 0, -30], c: 'black', name: 'crack' },
      { s: 'box', d: [0.012, 0.07, 0.012], at: [-0.14, 0.17, 0.14], rot: [0, 0, 60], c: 'black', name: 'crack' },
    ],
  },
  {
    name: 'frowning',
    hide: ['smirk'],
    add: [{ s: 'box', d: [0.07, 0.022, 0.03], at: [0.07, 0.13, 0.19], rot: [0, 0, -20], c: 'black', name: 'frown', mirror: true }],
  },
  {
    name: 'chipped',
    darken: 0.25,
    hide: ['hat', 'lid'],
    add: [
      { s: 'box', d: [0.1, 0.022, 0.03], at: [0.075, 0.25, 0.19], rot: [0, 0, 45], c: 'black', name: 'x-eye', mirror: true },
      { s: 'box', d: [0.1, 0.022, 0.03], at: [0.075, 0.25, 0.19], rot: [0, 0, -45], c: 'black', name: 'x-eye', mirror: true },
    ],
  },
  {
    name: 'crumbled',
    darken: 0.5,
    sink: 0.02,
    hide: ['beard'],
    add: [
      { s: 'ball', d: [0.04], at: [0.22, 0.04, 0.05], c: 'terracotta', seg: 6, name: 'crumb' },
      { s: 'ball', d: [0.035], at: [-0.2, 0.035, -0.08], c: 'clay-dark', seg: 6, name: 'crumb' },
      { s: 'ball', d: [0.03], at: [0.05, 0.03, -0.22], c: 'terracotta', seg: 6, name: 'crumb' },
    ],
  },
];

/** Hat Watch's head. */
const WANTED_BASE: Part[] = [
  { s: 'ball', d: [0.2], at: [0, 0.2, 0], c: 'tint', seg: 10, name: 'head' },
  { s: 'ball', d: [0.045], at: [0, 0.2, 0.2], c: 'tint', seg: 6, name: 'nose' },
  { s: 'cyl', d: [0.17, 0.2, 0.14], at: [0, 0.4, 0], c: 'blue', seg: 10, name: 'cap' },
  { s: 'box', d: [0.36, 0.03, 0.14], at: [0, 0.33, 0.15], c: 'black', name: 'cap' },
  { s: 'ball', d: [0.035], at: [0, 0.42, 0.19], c: 'yellow', seg: 6, name: 'cap' },
  { s: 'ball', d: [0.03], at: [0.075, 0.24, 0.185], c: 'black', seg: 6, name: 'eye', mirror: true },
  { s: 'box', d: [0.08, 0.022, 0.03], at: [0.08, 0.3, 0.19], c: 'black', name: 'brow-flat', mirror: true },
  { s: 'box', d: [0.06, 0.022, 0.03], at: [0.06, 0.13, 0.19], c: 'black', name: 'mouth-r' },
  { s: 'box', d: [0.06, 0.022, 0.03], at: [-0.06, 0.13, 0.19], c: 'black', name: 'mouth-l' },
];

/**
 * Hat Watch's stages, mildest first: each one is a higher tier of alarm. The brows tilt with morphs (a tilted brow is the
 * same part, so the mirror copy follows), and the mouth is two named halves: they turn into a frown, then hide for a shout.
 */
const WANTED_DAMAGE: DamageStage[] = [
  { name: 'wary', morph: { 'brow-flat': { rot: [0, 0, 18] } } },
  {
    name: 'suspicious',
    morph: { 'mouth-r': { rot: [0, 0, -20] }, 'mouth-l': { rot: [0, 0, 20] } },
  },
  {
    name: 'angry',
    darken: 0.1,
    morph: { 'brow-flat': { rot: [0, 0, 14] } },
    add: [{ s: 'ball', d: [0.03], at: [0.12, 0.44, 0.1], c: 'red', glow: true, seg: 6, name: 'siren' }],
  },
  {
    name: 'furious',
    darken: 0.15,
    hide: ['mouth-r', 'mouth-l'],
    add: [
      { s: 'ball', d: [0.05], at: [0, 0.125, 0.19], scale: [1, 1.2, 0.4], c: 'black', seg: 6, name: 'mouth-shout' },
      { s: 'ball', d: [0.03], at: [-0.12, 0.44, 0.1], c: 'red', glow: true, seg: 6, name: 'siren' },
    ],
  },
];

export const GTA_FACES: readonly PrefabDef[] = [
  {
    id: 'gta-face-clay', name: 'Clay Face', category: 'prop', uses: ['place'],
    tags: ['face', 'head', 'clay', 'gnome', 'smug', 'cracked', 'meter', 'hud'], emoji: [],
    tint: 0xd9814f,
    about: 'Gnome Theft Auto: the Clay meter face, a smug gnome head in red that cracks and crumbles as health drops. Damage level 0 is healthy, 4 is crumbled. Front faces +z, about 0.75 tall.',
    examine: CLAY_EXAMINE,
    parts: CLAY_BASE,
    damage: CLAY_DAMAGE,
  },
  {
    id: 'gta-face-wanted', name: 'Hat Watch Face', category: 'prop', uses: ['place'],
    tags: ['face', 'head', 'police', 'cop', 'watch', 'wanted', 'meter', 'hud'], emoji: [],
    tint: SKIN,
    about: 'Gnome Theft Auto: the Hat Watch meter face, a gnome under a police cap that goes from stern to furious as the watch rises. Damage level 0 is calm, 4 is furious. Front faces +z, about 0.75 tall.',
    examine: WANTED_EXAMINE,
    parts: WANTED_BASE,
    damage: WANTED_DAMAGE,
  },
];
